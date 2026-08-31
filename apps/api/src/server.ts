import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
const __dirname = path.dirname(fileURLToPath(import.meta.url));
await app.register(staticPlugin, { root: path.resolve(__dirname, '../../../web'), prefix: '/' });

const COMPANY = '00000000-0000-0000-0000-000000000001';
const WAREHOUSE = '00000000-0000-0000-0000-000000000010';

const permissions: Record<string, string[]> = {
  company_admin: ['*'],
  warehouse: ['stock'],
  sales: ['customers','orders','payments'],
  marketing: ['agents'],
  accountant: ['tax'],
  ai_operator: ['agents'],
  auditor: [],
  customer: [],
  platform_owner: ['*']
};
function requireRole(req:any, reply:any, capability:string) {
  const role = String(req.headers['x-demo-role'] || 'company_admin');
  const allowed = permissions[role] || [];
  if (!(allowed.includes('*') || allowed.includes(capability))) {
    reply.code(403).send({error:'forbidden',role,capability});
    return false;
  }
  return true;
}

async function emit(event_type:string, aggregate_type:string, aggregate_id:string|null, payload:any) {
  await pool.query(`INSERT INTO outbox_events(company_id,event_type,aggregate_type,aggregate_id,payload) VALUES($1,$2,$3,$4,$5)`, [COMPANY,event_type,aggregate_type,aggregate_id,payload]);
}

app.get('/health', async () => ({ ok: true, service: 'commerce-os-api' }));
app.get('/api/demo/users', async () => (await pool.query('SELECT email,display_name,role FROM users WHERE company_id=$1 ORDER BY role',[COMPANY])).rows);
app.get('/api/demo/state', async () => {
  const [products, stock, customers, orders, payments, docs, events] = await Promise.all([
    pool.query('SELECT * FROM products WHERE company_id=$1 ORDER BY created_at DESC LIMIT 20',[COMPANY]),
    pool.query(`SELECT p.sku,p.name,s.quantity,s.reserved FROM stock s JOIN products p ON p.id=s.product_id WHERE s.warehouse_id=$1 ORDER BY p.name`,[WAREHOUSE]),
    pool.query('SELECT * FROM customers WHERE company_id=$1 ORDER BY created_at DESC LIMIT 20',[COMPANY]),
    pool.query('SELECT * FROM orders WHERE company_id=$1 ORDER BY created_at DESC LIMIT 20',[COMPANY]),
    pool.query('SELECT p.* FROM payments p JOIN orders o ON o.id=p.order_id WHERE o.company_id=$1 ORDER BY p.created_at DESC LIMIT 20',[COMPANY]),
    pool.query('SELECT t.* FROM tax_documents t JOIN orders o ON o.id=t.order_id WHERE o.company_id=$1 ORDER BY t.created_at DESC LIMIT 20',[COMPANY]),
    pool.query('SELECT event_type,aggregate_type,payload,created_at FROM outbox_events WHERE company_id=$1 ORDER BY created_at DESC LIMIT 20',[COMPANY])
  ]);
  return { products:products.rows, stock:stock.rows, customers:customers.rows, orders:orders.rows, payments:payments.rows, tax_documents:docs.rows, events:events.rows };
});

app.post('/api/products', async (req:any, reply:any) => {
  if (!requireRole(req,reply,'catalog')) return;
  const { sku, name, price_cents, description='' } = req.body;
  const r = await pool.query(`INSERT INTO products(company_id,sku,name,price_cents,description) VALUES($1,$2,$3,$4,$5) RETURNING *`,[COMPANY,sku,name,price_cents,description]);
  await emit('catalog.product.created','product',r.rows[0].id,r.rows[0]);
  return reply.code(201).send(r.rows[0]);
});

app.post('/api/stock/receive', async (req:any, reply:any) => {
  if (!requireRole(req,reply,'stock')) return;
  const { product_id, quantity } = req.body;
  const r = await pool.query(`INSERT INTO stock(warehouse_id,product_id,quantity) VALUES($1,$2,$3)
    ON CONFLICT (warehouse_id,product_id) DO UPDATE SET quantity=stock.quantity+EXCLUDED.quantity, updated_at=now() RETURNING *`,[WAREHOUSE,product_id,quantity]);
  await emit('inventory.stock.received','product',product_id,{quantity,warehouse_id:WAREHOUSE});
  return r.rows[0];
});

app.post('/api/customers', async (req:any, reply:any) => {
  if (!requireRole(req,reply,'customers')) return;
  const { name, email, phone='', tax_id='', consent_marketing=false } = req.body;
  const r = await pool.query(`INSERT INTO customers(company_id,name,email,phone,tax_id,consent_marketing) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[COMPANY,name,email,phone,tax_id,consent_marketing]);
  await emit('crm.customer.created','customer',r.rows[0].id,{id:r.rows[0].id,consent_marketing});
  return reply.code(201).send(r.rows[0]);
});

app.post('/api/orders', async (req:any, reply:any) => {
  if (!requireRole(req,reply,'orders')) return;
  const { customer_id, product_id, quantity } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const product = (await client.query('SELECT * FROM products WHERE id=$1 AND company_id=$2 FOR UPDATE',[product_id,COMPANY])).rows[0];
    if (!product) { await client.query('ROLLBACK'); return reply.code(404).send({error:'product_not_found'}); }
    const inv = (await client.query('SELECT * FROM stock WHERE warehouse_id=$1 AND product_id=$2 FOR UPDATE',[WAREHOUSE,product_id])).rows[0];
    if (!inv || inv.quantity - inv.reserved < quantity) { await client.query('ROLLBACK'); return reply.code(409).send({error:'insufficient_stock'}); }
    const subtotal = product.price_cents * quantity;
    const tax = Math.round(subtotal * 0.19);
    const total = subtotal + tax;
    const order = (await client.query(`INSERT INTO orders(company_id,customer_id,status,subtotal_cents,tax_cents,total_cents) VALUES($1,$2,'pending_payment',$3,$4,$5) RETURNING *`,[COMPANY,customer_id,subtotal,tax,total])).rows[0];
    await client.query('INSERT INTO order_items(order_id,product_id,quantity,unit_price_cents) VALUES($1,$2,$3,$4)',[order.id,product_id,quantity,product.price_cents]);
    await client.query('UPDATE stock SET reserved=reserved+$1 WHERE warehouse_id=$2 AND product_id=$3',[quantity,WAREHOUSE,product_id]);
    await client.query('COMMIT');
    await emit('sales.order.created','order',order.id,{order_id:order.id,total_cents:total});
    return reply.code(201).send(order);
  } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
});

app.post('/api/orders/:id/pay/mock', async (req:any, reply:any) => {
  if (!requireRole(req,reply,'payments')) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const order = (await client.query('SELECT * FROM orders WHERE id=$1 AND company_id=$2 FOR UPDATE',[req.params.id,COMPANY])).rows[0];
    if (!order) { await client.query('ROLLBACK'); return reply.code(404).send({error:'order_not_found'}); }
    if (order.status !== 'pending_payment') { await client.query('ROLLBACK'); return reply.code(409).send({error:'invalid_order_status',status:order.status}); }
    const payment = (await client.query(`INSERT INTO payments(order_id,provider,external_id,status,amount_cents,payload) VALUES($1,'mock','DEMO-'||substr(gen_random_uuid()::text,1,8),'approved',$2,$3) RETURNING *`,[order.id,order.total_cents,{mode:'demo'}])).rows[0];
    await client.query(`UPDATE orders SET status='paid' WHERE id=$1`,[order.id]);
    const items = (await client.query('SELECT product_id,quantity FROM order_items WHERE order_id=$1',[order.id])).rows;
    for (const item of items) await client.query('UPDATE stock SET quantity=quantity-$1,reserved=reserved-$1 WHERE warehouse_id=$2 AND product_id=$3',[item.quantity,WAREHOUSE,item.product_id]);
    await client.query('COMMIT');
    await emit('payments.payment.approved','order',order.id,{payment_id:payment.id,provider:'mock'});
    return payment;
  } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
});

app.post('/api/orders/:id/tax-document/mock', async (req:any, reply:any) => {
  if (!requireRole(req,reply,'tax')) return;
  const order = (await pool.query('SELECT * FROM orders WHERE id=$1 AND company_id=$2',[req.params.id,COMPANY])).rows[0];
  if (!order) return reply.code(404).send({error:'order_not_found'});
  if (order.status !== 'paid') return reply.code(409).send({error:'order_must_be_paid'});
  const folio = `DEMO-${Date.now()}`;
  const d = (await pool.query(`INSERT INTO tax_documents(order_id,provider,document_type,folio,status,payload) VALUES($1,'mock-sii','boleta', $2,'issued',$3) RETURNING *`,[order.id,folio,{warning:'Demo only. Production DTE requires a certified SII integration/provider.'}])).rows[0];
  await emit('tax.document.issued','order',order.id,{tax_document_id:d.id,folio});
  return d;
});

app.post('/api/agents/:agent', async (req:any, reply:any) => {
  if (!requireRole(req,reply,'agents')) return;
  const allowed = ['brand','catalog','crm','partnerships','marketing'];
  if (!allowed.includes(req.params.agent)) return reply.code(404).send({error:'agent_not_found'});
  const response = await fetch(`${process.env.AGENTS_URL || 'http://localhost:8100'}/agents/${req.params.agent}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(req.body || {})});
  const output:any = await response.json();
  await pool.query(`INSERT INTO agent_runs(company_id,agent_name,requested_by,input,output) VALUES($1,$2,'demo-user',$3,$4)`,[COMPANY,req.params.agent,req.body || {},output]);
  await emit('ai.agent.completed','agent',null,{agent:req.params.agent});
  return output;
});

app.get('/api/integrations', async () => ({
  payments:[{provider:'transbank_webpay',status:'adapter-ready'},{provider:'mercado_pago',status:'adapter-ready'},{provider:'mock',status:'demo-active'}],
  tax:[{provider:'sii_own_dte',status:'requires-certification'},{provider:'dte_market_provider',status:'recommended-first-production'},{provider:'mock-sii',status:'demo-active'}],
  marketing:[{provider:'meta',status:'connector-slot'},{provider:'google_merchant',status:'connector-slot'},{provider:'email',status:'connector-slot'}]
}));

app.setNotFoundHandler((req:any, reply:any) => {
  if (req.raw.url?.startsWith('/api/')) return reply.code(404).send({error:'not_found'});
  return reply.sendFile('index.html');
});

await app.listen({ port: Number(process.env.PORT || 8080), host: '0.0.0.0' });
