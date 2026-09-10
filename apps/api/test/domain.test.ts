import assert from 'node:assert/strict';
import test from 'node:test';
import { assertCapability } from '../src/application/authorization.js';
import { createDemoContext } from '../src/application/context.js';
import { createDomainEvent } from '../src/domain/events.js';
import { DomainError, toProblemDetails } from '../src/domain/errors.js';
import { allowedOrderTransitions, assertOrderTransition, ORDER_STATUSES } from '../src/domain/order-state.js';
import { emailAddress, positiveInteger, requiredText } from '../src/domain/validation.js';

test('la máquina enumera y comprueba cada transición permitida y rechazada', () => {
  for (const from of ORDER_STATUSES) {
    const allowed = allowedOrderTransitions(from);
    for (const to of ORDER_STATUSES) {
      if (allowed.includes(to)) assert.doesNotThrow(() => assertOrderTransition(from, to));
      else assert.throws(() => assertOrderTransition(from, to), (error: DomainError) => error.code === 'invalid_order_status');
    }
  }
});
test('la máquina devuelve una copia de las transiciones', () => {
  const allowed = allowedOrderTransitions('draft'); allowed.push('paid');
  assert.deepEqual(allowedOrderTransitions('draft'), ['pending_payment', 'cancelled']);
});
test('las validaciones producen errores de dominio', () => {
  assert.equal(requiredText(' SKU-1 ', 'sku'), 'SKU-1'); assert.equal(positiveInteger('2', 'quantity'), 2);
  assert.equal(emailAddress(' TEST@EXAMPLE.COM '), 'test@example.com');
  assert.throws(() => positiveInteger(0, 'quantity'), (error: DomainError) => error.statusCode === 400);
});
test('los permisos se aplican por capacidad', () => {
  assert.doesNotThrow(() => assertCapability('warehouse', 'stock')); assert.doesNotThrow(() => assertCapability('auditor', 'read'));
  assert.throws(() => assertCapability('warehouse', 'customers'), (error: DomainError) => error.code === 'forbidden');
});
test('los eventos incluyen tenant, actor, correlación y versión', () => {
  const context = createDemoContext({ 'x-demo-role': 'sales', 'x-correlation-id': 'correlation-test' });
  const event = createDomainEvent(context, 'sales.order.created', 'order', 'order-1', { total_cents: 1190 });
  assert.equal(event.tenant_id, context.tenantId); assert.equal(event.actor_id, 'demo:sales');
  assert.equal(event.correlation_id, 'correlation-test'); assert.equal(event.version, 1); assert.match(event.event_id, /^[0-9a-f-]{36}$/);
});
test('problem details no filtra errores internos', () => {
  const known = toProblemDetails(new DomainError('insufficient_stock', 409, 'Insufficient available stock.'), '/api/orders', 'corr-1');
  assert.equal(known.status, 409); assert.equal(known.code, 'insufficient_stock');
  const unknown = toProblemDetails(new Error('database password leaked'), '/api/orders', 'corr-2');
  assert.equal(unknown.status, 500); assert.equal(unknown.detail, 'An unexpected error occurred.'); assert.doesNotMatch(unknown.detail, /password/);
});
