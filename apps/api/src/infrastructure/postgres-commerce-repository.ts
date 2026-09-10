import pg, { type PoolClient } from 'pg';
import type { OperationContext } from '../application/context.js';
import type { CommerceRepository, JsonRecord } from '../application/ports.js';
import { DomainError } from '../domain/errors.js';
import { createDomainEvent, type DomainEvent } from '../domain/events.js';
import { assertOrderTransition } from '../domain/order-state.js';

const { Pool } = pg;
type Queryable = Pick<PoolClient, 'query'>;

export class PostgresCommerceRepository implements CommerceRepository {
  private readonly pool = new Pool({ connectionString: process.env.DATABASE_URL });
  close() { return this.pool.end(); }
  async ready() { try { await this.pool.query('SELECT 1'); return true; } catch { return false; } }

  async users(context: OperationContext) {
    return (await this.pool.query('SELECT email,display_name,role FROM users WHERE company_id=$1 ORDER BY role', [context.tenantId])).rows;
  }

  async state(context: OperationContext): Promise<JsonRecord> {
    const [products, stock, customers, orders, payments, documents, events] = await Promise.all([
      this.pool.query('SELECT * FROM products WHERE company_id=$1 ORDER BY created_at DESC LIMIT 20', [context.tenantId]),
      this.pool.query(`SELECT p.sku,p.name,s.quantity,s.reserved FROM stock s JOIN products p ON p.id=s.product_id AND p.company_id=$2 JOIN warehouses w ON w.id=s.warehouse_id AND w.company_id=$2 WHERE s.warehouse_id=$1 ORDER BY p.name`, [context.warehouseId, context.tenantId]),
      this.pool.query('SELECT * FROM customers WHERE company_id=$1 ORDER BY created_at DESC LIMIT 20', [context.tenantId]),
      this.pool.query('SELECT * FROM orders WHERE company_id=$1 ORDER BY created_at DESC LIMIT 20', [context.tenantId]),
      this.pool.query('SELECT p.* FROM payments p JOIN orders o ON o.id=p.order_id WHERE o.company_id=$1 ORDER BY p.created_at DESC LIMIT 20', [context.tenantId]),
      this.pool.query('SELECT t.* FROM tax_documents t JOIN orders o ON o.id=t.order_id WHERE o.company_id=$1 ORDER BY t.created_at DESC LIMIT 20', [context.tenantId]),
      this.pool.query('SELECT id AS event_id,company_id AS tenant_id,event_type,aggregate_type,aggregate_id,payload,created_at FROM outbox_events WHERE company_id=$1 ORDER BY created_at DESC LIMIT 20', [context.tenantId]),
    ]);
    return { products: products.rows, stock: stock.rows, customers: customers.rows, orders: orders.rows, payments: payments.rows, tax_documents: documents.rows, events: events.rows };
  }

  async reset(context: OperationContext) {
    await this.transaction(async (client) => {
      await client.query('DELETE FROM tax_documents WHERE order_id IN (SELECT id FROM orders WHERE company_id=$1)', [context.tenantId]);
      await client.query('DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE company_id=$1)', [context.tenantId]);
      await client.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE company_id=$1)', [context.tenantId]);
      await client.query('DELETE FROM orders WHERE company_id=$1', [context.tenantId]);
      await client.query('DELETE FROM agent_runs WHERE company_id=$1', [context.tenantId]);
      await client.query('DELETE FROM outbox_events WHERE company_id=$1', [context.tenantId]);
      await client.query('DELETE FROM stock WHERE warehouse_id=$1', [context.warehouseId]);
      await client.query('DELETE FROM products WHERE company_id=$1', [context.tenantId]);
      await client.query('DELETE FROM customers WHERE company_id=$1', [context.tenantId]);
      await this.emit(client, createDomainEvent(context, 'demo.workspace.reset', 'company', context.tenantId, { mode: 'demo' }));
    });
  }

  async createProduct(context: OperationContext, input: JsonRecord) {
    return this.transaction(async (client) => {
      const product = (await client.query('INSERT INTO products(company_id,sku,name,price_cents,description) VALUES($1,$2,$3,$4,$5) RETURNING *', [context.tenantId, input.sku, input.name, input.price_cents, input.description])).rows[0];
      await this.emit(client, createDomainEvent(context, 'catalog.product.created', 'product', product.id, { sku: product.sku, name: product.name, price_cents: product.price_cents }));
      return product;
    });
  }

  async receiveStock(context: OperationContext, productId: string, quantity: number) {
    return this.transaction(async (client) => {
      const product = (await client.query('SELECT id FROM products WHERE id=$1 AND company_id=$2 FOR UPDATE', [productId, context.tenantId])).rows[0];
      if (!product) throw new DomainError('not_found', 404, 'Product not found.');
      const stock = (await client.query('INSERT INTO stock(warehouse_id,product_id,quantity) VALUES($1,$2,$3) ON CONFLICT (warehouse_id,product_id) DO UPDATE SET quantity=stock.quantity+EXCLUDED.quantity,updated_at=now() RETURNING *', [context.warehouseId, productId, quantity])).rows[0];
      await this.emit(client, createDomainEvent(context, 'inventory.stock.received', 'product', productId, { quantity, warehouse_id: context.warehouseId }));
      return stock;
    });
  }

  async createCustomer(context: OperationContext, input: JsonRecord) {
    return this.transaction(async (client) => {
      const customer = (await client.query('INSERT INTO customers(company_id,name,email,phone,tax_id,consent_marketing) VALUES($1,$2,$3,$4,$5,$6) RETURNING *', [context.tenantId, input.name, input.email, input.phone, input.tax_id, input.consent_marketing])).rows[0];
      await this.emit(client, createDomainEvent(context, 'crm.customer.created', 'customer', customer.id, { customer_id: customer.id, consent_marketing: customer.consent_marketing }));
      return customer;
    });
  }

  async createOrder(context: OperationContext, input: JsonRecord) {
    return this.transaction(async (client) => {
      const customer = (await client.query('SELECT id FROM customers WHERE id=$1 AND company_id=$2', [input.customer_id, context.tenantId])).rows[0];
      if (!customer) throw new DomainError('not_found', 404, 'Customer not found.');
      const product = (await client.query('SELECT * FROM products WHERE id=$1 AND company_id=$2 FOR UPDATE', [input.product_id, context.tenantId])).rows[0];
      if (!product) throw new DomainError('not_found', 404, 'Product not found.');
      const inventory = (await client.query('SELECT * FROM stock WHERE warehouse_id=$1 AND product_id=$2 FOR UPDATE', [context.warehouseId, input.product_id])).rows[0];
      const quantity = Number(input.quantity);
      if (!inventory || inventory.quantity - inventory.reserved < quantity) throw new DomainError('insufficient_stock', 409, 'Insufficient available stock.');
      const subtotal = Number(product.price_cents) * quantity;
      const tax = Math.round(subtotal * 0.19);
      const order = (await client.query("INSERT INTO orders(company_id,customer_id,status,subtotal_cents,tax_cents,total_cents) VALUES($1,$2,'pending_payment',$3,$4,$5) RETURNING *", [context.tenantId, input.customer_id, subtotal, tax, subtotal + tax])).rows[0];
      await client.query('INSERT INTO order_items(order_id,product_id,quantity,unit_price_cents) VALUES($1,$2,$3,$4)', [order.id, input.product_id, quantity, product.price_cents]);
      await client.query('UPDATE stock SET reserved=reserved+$1,updated_at=now() WHERE warehouse_id=$2 AND product_id=$3', [quantity, context.warehouseId, input.product_id]);
      await this.emit(client, createDomainEvent(context, 'sales.order.created', 'order', order.id, { order_id: order.id, total_cents: order.total_cents }));
      await this.emit(client, createDomainEvent(context, 'inventory.stock.reserved', 'order', order.id, { product_id: input.product_id, quantity, warehouse_id: context.warehouseId }));
      return order;
    });
  }

  async payOrder(context: OperationContext, orderId: string) {
    return this.transaction(async (client) => {
      const order = (await client.query('SELECT * FROM orders WHERE id=$1 AND company_id=$2 FOR UPDATE', [orderId, context.tenantId])).rows[0];
      if (!order) throw new DomainError('not_found', 404, 'Order not found.');
      assertOrderTransition(order.status, 'paid');
      const payment = (await client.query("INSERT INTO payments(order_id,provider,external_id,status,amount_cents,payload) VALUES($1,'mock','DEMO-'||substr(gen_random_uuid()::text,1,8),'approved',$2,$3) RETURNING *", [order.id, order.total_cents, { mode: 'demo' }])).rows[0];
      await client.query("UPDATE orders SET status='paid' WHERE id=$1", [order.id]);
      const items = (await client.query('SELECT product_id,quantity FROM order_items WHERE order_id=$1', [order.id])).rows;
      for (const item of items) {
        const result = await client.query('UPDATE stock SET quantity=quantity-$1,reserved=reserved-$1,updated_at=now() WHERE warehouse_id=$2 AND product_id=$3 AND quantity >= $1 AND reserved >= $1', [item.quantity, context.warehouseId, item.product_id]);
        if (result.rowCount !== 1) throw new DomainError('inventory_inconsistent', 409, 'Stock reservation is inconsistent.');
      }
      await this.emit(client, createDomainEvent(context, 'payments.payment.approved', 'order', order.id, { payment_id: payment.id, provider: 'mock' }));
      return payment;
    });
  }

  async issueTaxDocument(context: OperationContext, orderId: string) {
    return this.transaction(async (client) => {
      const order = (await client.query('SELECT * FROM orders WHERE id=$1 AND company_id=$2 FOR UPDATE', [orderId, context.tenantId])).rows[0];
      if (!order) throw new DomainError('not_found', 404, 'Order not found.');
      if (order.status !== 'paid') throw new DomainError('order_must_be_paid', 409, 'Order must be paid.');
      const existing = (await client.query('SELECT id FROM tax_documents WHERE order_id=$1 LIMIT 1', [order.id])).rows[0];
      if (existing) throw new DomainError('tax_document_already_exists', 409, 'Order already has a demo tax document.', { tax_document_id: existing.id });
      const folio = `DEMO-${Date.now()}`;
      const document = (await client.query("INSERT INTO tax_documents(order_id,provider,document_type,folio,status,payload) VALUES($1,'mock-sii','boleta',$2,'issued',$3) RETURNING *", [order.id, folio, { warning: 'Demo only. Production DTE requires a certified SII integration/provider.' }])).rows[0];
      await this.emit(client, createDomainEvent(context, 'tax.document.issued', 'order', order.id, { tax_document_id: document.id, folio }));
      return document;
    });
  }

  async saveAgentRun(context: OperationContext, agent: string, input: JsonRecord, output: JsonRecord) {
    await this.transaction(async (client) => {
      const run = (await client.query('INSERT INTO agent_runs(company_id,agent_name,requested_by,input,output) VALUES($1,$2,$3,$4,$5) RETURNING id', [context.tenantId, agent, context.actorId, input, output])).rows[0];
      await this.emit(client, createDomainEvent(context, 'ai.agent.completed', 'agent', run.id, { agent }));
    });
  }

  private async transaction<T>(operation: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect();
    try { await client.query('BEGIN'); const result = await operation(client); await client.query('COMMIT'); return result; }
    catch (error) { await client.query('ROLLBACK'); if ((error as { code?: string }).code === '23505') throw new DomainError('conflict', 409, 'A unique resource already exists.'); throw error; }
    finally { client.release(); }
  }

  private async emit(client: Queryable, event: DomainEvent) {
    const payload = { ...event.payload, _meta: { actor_id: event.actor_id, correlation_id: event.correlation_id, causation_id: event.causation_id, version: event.version } };
    await client.query('INSERT INTO outbox_events(id,company_id,event_type,aggregate_type,aggregate_id,payload,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)', [event.event_id, event.tenant_id, event.event_type, event.aggregate_type, event.aggregate_id, payload, event.occurred_at]);
  }
}
