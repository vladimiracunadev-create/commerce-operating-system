import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const base = process.env.API_URL || 'http://127.0.0.1:8080';
const composeProject = process.env.COMPOSE_PROJECT_NAME;

async function request(path, { method = 'GET', body, headers = {}, expected = 200 } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-demo-role': 'company_admin', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${response.status} ${JSON.stringify(payload)}`);
  return payload;
}

function sql(command) {
  const compose = ['compose'];
  if (composeProject) compose.push('-p', composeProject);
  return execFileSync('docker', [...compose, 'exec', '-T', 'db', 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'commerce', '-d', 'commerce', '-c', command], { encoding: 'utf8' });
}

await request('/api/demo/reset', { method: 'POST', body: {} });
const product = await request('/api/products', { method: 'POST', expected: 201, body: { sku: 'CONSISTENCY-001', name: 'Consistency product', price_cents: 1000 } });
await request('/api/stock/receive', { method: 'POST', body: { product_id: product.id, quantity: 5 } });
const customer = await request('/api/customers', { method: 'POST', expected: 201, body: { name: 'Consistency customer', email: 'consistency@example.com' } });

async function order(quantity = 1) {
  return request('/api/orders', { method: 'POST', expected: 201, body: { customer_id: customer.id, product_id: product.id, quantity } });
}

const payable = await order(2);
const payOptions = { method: 'POST', body: {}, headers: { 'idempotency-key': 'concurrent-payment-1' } };
const [paymentA, paymentB] = await Promise.all([
  request(`/api/orders/${payable.id}/pay/mock`, payOptions),
  request(`/api/orders/${payable.id}/pay/mock`, payOptions),
]);
assert.equal(paymentA.id, paymentB.id);
const conflicting = await order();
await request(`/api/orders/${conflicting.id}/pay/mock`, {
  method: 'POST', expected: 409, body: {}, headers: { 'idempotency-key': 'concurrent-payment-1' },
});

const [taxA, taxB] = await Promise.all([
  request(`/api/orders/${payable.id}/tax-document/mock`, { method: 'POST', body: {} }),
  request(`/api/orders/${payable.id}/tax-document/mock`, { method: 'POST', body: {} }),
]);
assert.equal(taxA.id, taxB.id);

const cancellable = await order();
const [cancelA, cancelB] = await Promise.all([
  request(`/api/orders/${cancellable.id}/cancel`, { method: 'POST', body: { reason: 'test' } }),
  request(`/api/orders/${cancellable.id}/cancel`, { method: 'POST', body: { reason: 'test' } }),
]);
assert.equal(cancelA.status, 'cancelled');
assert.equal(cancelB.status, 'cancelled');

const expirable = await order();
const expiration = await request('/api/demo/reservations/expire', { method: 'POST', body: { older_than_minutes: 0 } });
assert.ok(expiration.order_ids.includes(expirable.id));

const rollbackOrder = await order();
const triggerSql = `
CREATE OR REPLACE FUNCTION commerce_reject_forced_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.event_type = 'payments.payment.approved' AND NEW.payload #>> '{_meta,causation_id}' = 'force-event-failure' THEN
    RAISE EXCEPTION 'forced event failure';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS commerce_reject_forced_event_trigger ON outbox_events;
CREATE TRIGGER commerce_reject_forced_event_trigger BEFORE INSERT ON outbox_events FOR EACH ROW EXECUTE FUNCTION commerce_reject_forced_event();`;
sql(triggerSql);
try {
  await request(`/api/orders/${rollbackOrder.id}/pay/mock`, {
    method: 'POST', expected: 500, body: {},
    headers: { 'idempotency-key': 'rollback-payment-1', 'x-causation-id': 'force-event-failure' },
  });
} finally {
  sql('DROP TRIGGER IF EXISTS commerce_reject_forced_event_trigger ON outbox_events; DROP FUNCTION IF EXISTS commerce_reject_forced_event();');
}

const state = await request('/api/demo/state');
const stock = state.stock.find((row) => row.sku === 'CONSISTENCY-001');
assert.equal(state.payments.filter((payment) => payment.order_id === payable.id).length, 1);
assert.equal(state.tax_documents.filter((document) => document.order_id === payable.id).length, 1);
assert.equal(state.events.filter((event) => event.event_type === 'inventory.stock.released' && event.aggregate_id === cancellable.id).length, 1);
assert.equal(state.orders.find((item) => item.id === rollbackOrder.id).status, 'pending_payment');
assert.equal(state.payments.filter((payment) => payment.order_id === rollbackOrder.id).length, 0);
assert.equal(stock.quantity, 3);
assert.equal(stock.reserved, 1);
assert.throws(() => sql("UPDATE stock SET reserved=quantity+1 WHERE product_id='" + product.id + "';"));

console.log(JSON.stringify({ payment: 'idempotent-under-concurrency', key_reuse: 'rejected', tax_document: 'single-under-concurrency', cancellation: 'released-once', expiration: 'released', rollback: 'atomic', stock: 'constrained' }));
