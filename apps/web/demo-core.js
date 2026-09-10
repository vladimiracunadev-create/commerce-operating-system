export const DEMO_VERSION = 1;

export const ROLES = {
  company_admin: ['*'],
  warehouse: ['stock'],
  sales: ['customers', 'orders', 'payments'],
  marketing: ['agents'],
  accountant: ['tax'],
  ai_operator: ['agents'],
  auditor: [],
};

const AGENT_PROPOSALS = {
  brand: ['Definir una promesa de marca comprobable', 'Unificar tono y mensajes', 'Preparar activos para aprobación'],
  catalog: ['Revisar SKU, nombre, precio y atributos', 'Detectar datos faltantes', 'Proponer una ficha comercial consistente'],
  crm: ['Segmentar por recencia, frecuencia y valor', 'Excluir contactos sin consentimiento', 'Proponer la próxima acción comercial'],
  partnerships: ['Definir el socio o proveedor requerido', 'Evaluar beneficio, riesgo y datos compartidos', 'Preparar un checklist de integración'],
  marketing: ['Definir objetivo y KPI', 'Elegir audiencia y canal', 'Proponer un experimento A/B sujeto a aprobación'],
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

export function seedState() {
  const createdAt = now();
  return {
    version: DEMO_VERSION,
    company: { id: 'demo-company', name: 'Empresa Demo SpA', currency: 'CLP' },
    products: [{ id: 'product-demo', sku: 'DEMO-001', name: 'Producto Demo A', description: 'Producto ficticio para recorrer el flujo completo.', price_cents: 10000, active: true, created_at: createdAt }],
    stock: [{ product_id: 'product-demo', sku: 'DEMO-001', name: 'Producto Demo A', quantity: 12, reserved: 0 }],
    customers: [{ id: 'customer-demo', name: 'Cliente Demostración', email: 'cliente.demo@example.com', consent_marketing: true, created_at: createdAt }],
    orders: [], payments: [], tax_documents: [], agent_runs: [],
    events: [{ event_type: 'demo.workspace.ready', aggregate_type: 'company', aggregate_id: 'demo-company', payload: { version: DEMO_VERSION }, created_at: createdAt }],
  };
}

function assertCapability(role, capability) {
  const allowed = ROLES[role] ?? [];
  if (!allowed.includes('*') && !allowed.includes(capability)) {
    const error = new Error(`El rol ${role} no puede ejecutar ${capability}.`);
    error.code = 'forbidden';
    throw error;
  }
}

function requiredText(value, field) {
  const clean = String(value ?? '').trim();
  if (!clean) throw new Error(`${field} es obligatorio.`);
  return clean;
}

function positiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) throw new Error(`${field} debe ser un entero mayor que cero.`);
  return number;
}

export class DemoStore {
  constructor(storage) {
    this.storage = storage;
    this.key = 'commerce-os-demo-v1';
    this.state = this.#load();
  }

  #load() {
    try {
      const raw = this.storage?.getItem(this.key);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?.version === DEMO_VERSION ? parsed : seedState();
    } catch {
      return seedState();
    }
  }

  #save() { this.storage?.setItem(this.key, JSON.stringify(this.state)); }

  #emit(eventType, aggregateType, aggregateId, payload) {
    this.state.events.unshift({ event_type: eventType, aggregate_type: aggregateType, aggregate_id: aggregateId, payload, created_at: now() });
    this.state.events = this.state.events.slice(0, 50);
  }

  snapshot() { return clone(this.state); }

  reset(role = 'company_admin') {
    assertCapability(role, 'admin');
    this.state = seedState();
    this.#save();
    return this.snapshot();
  }

  createProduct(input, role = 'company_admin') {
    assertCapability(role, 'catalog');
    const sku = requiredText(input.sku, 'SKU').toUpperCase();
    if (this.state.products.some((product) => product.sku === sku)) throw new Error(`El SKU ${sku} ya existe.`);
    const product = {
      id: id('product'), sku, name: requiredText(input.name, 'Nombre'), description: String(input.description ?? '').trim(),
      price_cents: positiveInteger(input.price_cents, 'Precio'), active: true, created_at: now(),
    };
    this.state.products.unshift(product);
    this.#emit('catalog.product.created', 'product', product.id, { sku: product.sku, name: product.name });
    this.#save();
    return clone(product);
  }

  receiveStock(input, role = 'company_admin') {
    assertCapability(role, 'stock');
    const product = this.state.products.find((item) => item.id === input.product_id);
    if (!product) throw new Error('Producto no encontrado.');
    const quantity = positiveInteger(input.quantity, 'Cantidad');
    let row = this.state.stock.find((item) => item.product_id === product.id);
    if (!row) {
      row = { product_id: product.id, sku: product.sku, name: product.name, quantity: 0, reserved: 0 };
      this.state.stock.push(row);
    }
    row.quantity += quantity;
    this.#emit('inventory.stock.received', 'product', product.id, { quantity });
    this.#save();
    return clone(row);
  }

  createCustomer(input, role = 'company_admin') {
    assertCapability(role, 'customers');
    const email = requiredText(input.email, 'Email').toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Email inválido.');
    const customer = { id: id('customer'), name: requiredText(input.name, 'Nombre'), email, consent_marketing: Boolean(input.consent_marketing), created_at: now() };
    this.state.customers.unshift(customer);
    this.#emit('crm.customer.created', 'customer', customer.id, { consent_marketing: customer.consent_marketing });
    this.#save();
    return clone(customer);
  }

  createOrder(input, role = 'company_admin') {
    assertCapability(role, 'orders');
    const customer = this.state.customers.find((item) => item.id === input.customer_id);
    const product = this.state.products.find((item) => item.id === input.product_id);
    if (!customer) throw new Error('Cliente no encontrado.');
    if (!product) throw new Error('Producto no encontrado.');
    const quantity = positiveInteger(input.quantity, 'Cantidad');
    const stock = this.state.stock.find((item) => item.product_id === product.id);
    if (!stock || stock.quantity - stock.reserved < quantity) throw new Error('Stock disponible insuficiente.');
    const subtotal = product.price_cents * quantity;
    const tax = Math.round(subtotal * 0.19);
    const order = {
      id: id('order'), customer_id: customer.id, customer_name: customer.name, product_id: product.id, product_name: product.name,
      quantity, status: 'pending_payment', currency: 'CLP', subtotal_cents: subtotal, tax_cents: tax, total_cents: subtotal + tax, created_at: now(),
    };
    stock.reserved += quantity;
    this.state.orders.unshift(order);
    this.#emit('sales.order.created', 'order', order.id, { total_cents: order.total_cents });
    this.#save();
    return clone(order);
  }

  payOrder(orderId, role = 'company_admin', idempotencyKey = id('attempt')) {
    assertCapability(role, 'payments');
    const order = this.state.orders.find((item) => item.id === orderId);
    if (!order) throw new Error('Pedido no encontrado.');
    const replay = this.state.payments.find((item) => item.provider === 'mock' && item.idempotency_key === idempotencyKey);
    if (replay) {
      if (replay.order_id !== order.id) throw new Error('La clave de idempotencia ya fue usada para otro pedido.');
      return clone(replay);
    }
    if (order.status !== 'pending_payment') throw new Error(`El pedido está en estado ${order.status}.`);
    const stock = this.state.stock.find((item) => item.product_id === order.product_id);
    if (!stock || stock.quantity < order.quantity || stock.reserved < order.quantity) throw new Error('La reserva de stock es inconsistente.');
    stock.quantity -= order.quantity;
    stock.reserved -= order.quantity;
    order.status = 'paid';
    const payment = { id: id('payment'), order_id: order.id, provider: 'mock', status: 'approved', amount_cents: order.total_cents, idempotency_key: idempotencyKey, created_at: now() };
    this.state.payments.unshift(payment);
    this.#emit('payments.payment.approved', 'order', order.id, { payment_id: payment.id, provider: 'mock' });
    this.#save();
    return clone(payment);
  }

  cancelOrder(orderId, role = 'company_admin', reason = 'cancelled_by_user') {
    assertCapability(role, 'orders');
    const order = this.state.orders.find((item) => item.id === orderId);
    if (!order) throw new Error('Pedido no encontrado.');
    if (order.status === 'cancelled') return clone(order);
    if (order.status !== 'pending_payment') throw new Error(`El pedido está en estado ${order.status}.`);
    const stock = this.state.stock.find((item) => item.product_id === order.product_id);
    if (!stock || stock.reserved < order.quantity) throw new Error('La reserva de stock es inconsistente.');
    stock.reserved -= order.quantity;
    order.status = 'cancelled';
    this.#emit('inventory.stock.released', 'order', order.id, { product_id: order.product_id, quantity: order.quantity, reason });
    this.#emit('sales.order.cancelled', 'order', order.id, { reason });
    this.#save();
    return clone(order);
  }

  expireReservations(olderThanMinutes = 30, role = 'company_admin') {
    assertCapability(role, 'admin');
    if (!Number.isInteger(olderThanMinutes) || olderThanMinutes < 0) throw new Error('olderThanMinutes debe ser un entero no negativo.');
    const cutoff = Date.now() - olderThanMinutes * 60_000;
    const expired = this.state.orders.filter((order) => order.status === 'pending_payment' && Date.parse(order.created_at) <= cutoff);
    for (const order of expired) {
      this.cancelOrder(order.id, 'company_admin', 'reservation_expired');
      this.state.events[0].event_type = 'sales.order.expired';
    }
    this.#save();
    return { expired: expired.length, order_ids: expired.map((order) => order.id) };
  }

  issueTaxDocument(orderId, role = 'company_admin') {
    assertCapability(role, 'tax');
    const order = this.state.orders.find((item) => item.id === orderId);
    if (!order) throw new Error('Pedido no encontrado.');
    if (order.status !== 'paid') throw new Error('El pedido debe estar pagado.');
    const existing = this.state.tax_documents.find((document) => document.order_id === order.id);
    if (existing) return clone(existing);
    const document = { id: id('tax'), order_id: order.id, provider: 'mock-sii', document_type: 'boleta', folio: `DEMO-${Date.now()}`, status: 'issued', created_at: now() };
    this.state.tax_documents.unshift(document);
    this.#emit('tax.document.issued', 'order', order.id, { tax_document_id: document.id, folio: document.folio });
    this.#save();
    return clone(document);
  }

  runAgent(name, input, role = 'company_admin') {
    assertCapability(role, 'agents');
    if (!AGENT_PROPOSALS[name]) throw new Error('Agente no encontrado.');
    const run = {
      id: id('agent'), mode: 'safe-fallback', agent: name, goal: String(input.goal ?? ''), proposal: AGENT_PROPOSALS[name],
      requires_human_approval: true, write_actions_executed: false, created_at: now(),
    };
    this.state.agent_runs.unshift(run);
    this.#emit('ai.agent.completed', 'agent', run.id, { agent: name });
    this.#save();
    return clone(run);
  }
}
