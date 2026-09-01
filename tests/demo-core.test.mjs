import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoStore, seedState } from '../packages/demo-core/index.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('el estado inicial permite iniciar la demo sin configuración', () => {
  const state = seedState();
  assert.equal(state.products.length, 1);
  assert.equal(state.stock[0].quantity, 12);
  assert.equal(state.customers.length, 1);
});

test('recorre producto, stock, cliente, pedido, pago y boleta', () => {
  const store = new DemoStore(memoryStorage());
  const product = store.createProduct({ sku: 'TEST-001', name: 'Producto Test', price_cents: 20000 });
  store.receiveStock({ product_id: product.id, quantity: 5 });
  const customer = store.createCustomer({ name: 'Cliente Test', email: 'test@example.com', consent_marketing: true });
  const order = store.createOrder({ customer_id: customer.id, product_id: product.id, quantity: 2 });
  assert.equal(order.total_cents, 47600);
  const payment = store.payOrder(order.id);
  assert.equal(payment.status, 'approved');
  const document = store.issueTaxDocument(order.id);
  assert.equal(document.status, 'issued');
  const state = store.snapshot();
  assert.equal(state.stock.find((row) => row.product_id === product.id).quantity, 3);
  assert.equal(state.stock.find((row) => row.product_id === product.id).reserved, 0);
  assert.ok(state.events.some((event) => event.event_type === 'tax.document.issued'));
});

test('no permite vender más stock que el disponible', () => {
  const store = new DemoStore(memoryStorage());
  assert.throws(() => store.createOrder({ customer_id: 'customer-demo', product_id: 'product-demo', quantity: 99 }), /Stock disponible insuficiente/);
});

test('impide emitir dos boletas para el mismo pedido', () => {
  const store = new DemoStore(memoryStorage());
  const order = store.createOrder({ customer_id: 'customer-demo', product_id: 'product-demo', quantity: 1 });
  store.payOrder(order.id);
  store.issueTaxDocument(order.id);
  assert.throws(() => store.issueTaxDocument(order.id), /ya tiene una boleta/);
});

test('aplica permisos por rol también en el motor local', () => {
  const store = new DemoStore(memoryStorage());
  assert.throws(() => store.createCustomer({ name: 'X', email: 'x@example.com' }, 'warehouse'), /no puede ejecutar customers/);
  assert.doesNotThrow(() => store.receiveStock({ product_id: 'product-demo', quantity: 1 }, 'warehouse'));
});

test('los agentes locales nunca ejecutan acciones externas', () => {
  const store = new DemoStore(memoryStorage());
  const run = store.runAgent('marketing', { goal: 'Proponer una campaña' }, 'marketing');
  assert.equal(run.requires_human_approval, true);
  assert.equal(run.write_actions_executed, false);
  assert.equal(run.mode, 'safe-fallback');
});
