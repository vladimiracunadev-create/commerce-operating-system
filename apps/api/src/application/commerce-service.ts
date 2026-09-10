import { assertCapability } from './authorization.js';
import type { OperationContext } from './context.js';
import type { CommerceRepository, JsonRecord } from './ports.js';
import { DomainError } from '../domain/errors.js';
import { emailAddress, positiveInteger, requiredText } from '../domain/validation.js';

const AGENTS = ['brand', 'catalog', 'crm', 'partnerships', 'marketing'];

export class CommerceService {
  constructor(private readonly repository: CommerceRepository) {}
  health() { return { ok: true, service: 'commerce-os-api' }; }
  ready() { return this.repository.ready(); }
  users(context: OperationContext) { assertCapability(context.role, 'read'); return this.repository.users(context); }
  state(context: OperationContext) { assertCapability(context.role, 'read'); return this.repository.state(context); }
  async reset(context: OperationContext) { assertCapability(context.role, 'admin'); await this.repository.reset(context); return { ok: true }; }

  product(context: OperationContext, body: JsonRecord) {
    assertCapability(context.role, 'catalog');
    return this.repository.createProduct(context, {
      sku: requiredText(body.sku, 'sku').toUpperCase(), name: requiredText(body.name, 'name'),
      description: String(body.description ?? '').trim(), price_cents: positiveInteger(body.price_cents, 'price_cents'),
    });
  }

  stock(context: OperationContext, body: JsonRecord) {
    assertCapability(context.role, 'stock');
    return this.repository.receiveStock(context, requiredText(body.product_id, 'product_id'), positiveInteger(body.quantity, 'quantity'));
  }

  customer(context: OperationContext, body: JsonRecord) {
    assertCapability(context.role, 'customers');
    return this.repository.createCustomer(context, {
      name: requiredText(body.name, 'name'), email: emailAddress(body.email), phone: String(body.phone ?? ''),
      tax_id: String(body.tax_id ?? ''), consent_marketing: Boolean(body.consent_marketing),
    });
  }

  order(context: OperationContext, body: JsonRecord) {
    assertCapability(context.role, 'orders');
    return this.repository.createOrder(context, {
      customer_id: requiredText(body.customer_id, 'customer_id'), product_id: requiredText(body.product_id, 'product_id'),
      quantity: positiveInteger(body.quantity, 'quantity'),
    });
  }

  pay(context: OperationContext, orderId: unknown) {
    assertCapability(context.role, 'payments');
    return this.repository.payOrder(context, requiredText(orderId, 'order_id'));
  }

  tax(context: OperationContext, orderId: unknown) {
    assertCapability(context.role, 'tax');
    return this.repository.issueTaxDocument(context, requiredText(orderId, 'order_id'));
  }

  async agent(context: OperationContext, name: unknown, body: JsonRecord) {
    assertCapability(context.role, 'agents');
    const agent = requiredText(name, 'agent');
    if (!AGENTS.includes(agent)) throw new DomainError('not_found', 404, 'Agent not found.');
    const response = await fetch(`${process.env.AGENTS_URL || 'http://localhost:8100'}/agents/${agent}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!response.ok) throw new DomainError('agent_unavailable', 502, 'Agent service failed.');
    const output = (await response.json()) as JsonRecord;
    await this.repository.saveAgentRun(context, agent, body, output);
    return output;
  }

  integrations() {
    return {
      payments: [{ provider: 'transbank_webpay', status: 'contract-only' }, { provider: 'mercado_pago', status: 'contract-only' }, { provider: 'mock', status: 'demo-active' }],
      tax: [{ provider: 'sii_own_dte', status: 'requires-certification' }, { provider: 'dte_market_provider', status: 'contract-only' }, { provider: 'mock-sii', status: 'demo-active' }],
      marketing: [{ provider: 'meta', status: 'contract-only' }, { provider: 'google_merchant', status: 'contract-only' }, { provider: 'email', status: 'contract-only' }],
    };
  }
}
