const base = process.env.API_URL ?? 'http://localhost:8080';
const headers = { 'content-type': 'application/json', 'x-demo-role': 'company_admin' };

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, { ...options, headers: { ...headers, ...(options.headers ?? {}) } });
  const data = await response.json();
  if (!response.ok) throw new Error(`${path}: ${response.status} ${JSON.stringify(data)}`);
  return data;
}

const suffix = Date.now();
const health = await request('/health');
const ready = await request('/ready');
const product = await request('/api/products', { method: 'POST', body: JSON.stringify({ sku: `CI-${suffix}`, name: 'Producto CI', price_cents: 10000 }) });
await request('/api/stock/receive', { method: 'POST', body: JSON.stringify({ product_id: product.id, quantity: 5 }) });
const customer = await request('/api/customers', { method: 'POST', body: JSON.stringify({ name: 'Cliente CI', email: `ci-${suffix}@example.com` }) });
const order = await request('/api/orders', { method: 'POST', body: JSON.stringify({ customer_id: customer.id, product_id: product.id, quantity: 2 }) });
const payment = await request(`/api/orders/${order.id}/pay/mock`, { method: 'POST', body: '{}' });
const tax = await request(`/api/orders/${order.id}/tax-document/mock`, { method: 'POST', body: '{}' });
const agent = await request('/api/agents/marketing', { method: 'POST', body: JSON.stringify({ goal: 'Smoke test', context: { orders: 1 } }) });
const state = await request('/api/demo/state');

if (!health.ok || ready.database !== 'ready' || payment.status !== 'approved' || tax.status !== 'issued' || agent.write_actions_executed !== false || state.orders[0].status !== 'paid') {
  throw new Error('El recorrido servidor no alcanzó el estado esperado.');
}
console.log(JSON.stringify({ api: health.ok, database: ready.database, order: state.orders[0].status, payment: payment.status, tax: tax.status, agent: agent.mode }));
