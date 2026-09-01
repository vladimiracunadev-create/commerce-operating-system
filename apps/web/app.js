import { DemoStore } from './demo-core.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const memory = new DemoStore(globalThis.localStorage);
const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
let state = memory.snapshot();
let mode = 'local';
let toastTimer;

const role = () => $('#role').value;
const apiBase = () => $('#apiUrl').value.trim().replace(/\/$/, '');

class LocalAdapter {
  state() { return memory.snapshot(); }
  reset() { return memory.reset(role()); }
  product(body) { return memory.createProduct(body, role()); }
  stock(body) { return memory.receiveStock(body, role()); }
  customer(body) { return memory.createCustomer(body, role()); }
  order(body) { return memory.createOrder(body, role()); }
  pay(id) { return memory.payOrder(id, role()); }
  tax(id) { return memory.issueTaxDocument(id, role()); }
  agent(name, body) { return memory.runAgent(name, body, role()); }
}

class ApiAdapter {
  async request(path, options = {}) {
    const response = await fetch(`${apiBase()}${path}`, {
      ...options,
      headers: { 'content-type': 'application/json', 'x-demo-role': role(), ...(options.headers ?? {}) },
    });
    let data;
    try { data = await response.json(); } catch { throw new Error(`La API respondió ${response.status} sin JSON.`); }
    if (!response.ok) throw new Error(data.message ?? data.error ?? `Error HTTP ${response.status}`);
    return data;
  }
  state() { return this.request('/api/demo/state'); }
  reset() { return this.request('/api/demo/reset', { method: 'POST', body: '{}' }); }
  product(body) { return this.request('/api/products', { method: 'POST', body: JSON.stringify(body) }); }
  stock(body) { return this.request('/api/stock/receive', { method: 'POST', body: JSON.stringify(body) }); }
  customer(body) { return this.request('/api/customers', { method: 'POST', body: JSON.stringify(body) }); }
  order(body) { return this.request('/api/orders', { method: 'POST', body: JSON.stringify(body) }); }
  pay(id) { return this.request(`/api/orders/${id}/pay/mock`, { method: 'POST', body: '{}' }); }
  tax(id) { return this.request(`/api/orders/${id}/tax-document/mock`, { method: 'POST', body: '{}' }); }
  agent(name, body) { return this.request(`/api/agents/${name}`, { method: 'POST', body: JSON.stringify(body) }); }
}

const adapters = { local: new LocalAdapter(), api: new ApiAdapter() };
const adapter = () => adapters[mode];

function toast(message, kind = 'ok') {
  const element = $('#toast');
  element.textContent = message;
  element.className = `toast show ${kind === 'error' ? 'error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { element.className = 'toast'; }, 3600);
}

function option(value, label) {
  const item = document.createElement('option');
  item.value = value;
  item.textContent = label;
  return item;
}

function fillSelect(selector, items, value, label) {
  const select = $(selector);
  const previous = select.value;
  select.replaceChildren(...items.map((item) => option(value(item), label(item))));
  if (items.some((item) => value(item) === previous)) select.value = previous;
}

function renderMetrics() {
  const available = state.stock.reduce((sum, item) => sum + Number(item.quantity) - Number(item.reserved), 0);
  const values = [
    ['Productos', state.products.length], ['Stock disponible', available], ['Clientes', state.customers.length],
    ['Pedidos', state.orders.length], ['Pagos', state.payments.length], ['Boletas demo', state.tax_documents.length],
  ];
  $('#metrics').innerHTML = values.map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join('');
}

function renderOrders() {
  const rows = state.orders.slice(0, 8);
  $('#ordersTable').innerHTML = rows.length ? rows.map((order) => {
    const customer = order.customer_name ?? state.customers.find((item) => item.id === order.customer_id)?.name ?? 'Sin cliente';
    return `<tr><td>${String(order.id).slice(0, 12)}</td><td>${escapeHtml(customer)}</td><td>${money.format(order.total_cents)}</td><td><span class="status ${order.status}">${order.status === 'paid' ? 'Pagado' : 'Pago pendiente'}</span></td></tr>`;
  }).join('') : '<tr><td colspan="4" class="empty">Aún no hay pedidos. Empieza por el paso 04.</td></tr>';
}

function renderEvents() {
  const events = state.events.slice(0, 12);
  $('#eventTimeline').innerHTML = events.length ? events.map((event) => `<li><strong>${escapeHtml(event.event_type)}</strong><span>${date.format(new Date(event.created_at))} · ${escapeHtml(event.aggregate_type)}</span></li>`).join('') : '<li><span>Sin eventos todavía.</span></li>';
}

function renderSelectors() {
  fillSelect('#productStock', state.products, (item) => item.id, (item) => `${item.sku} · ${item.name}`);
  fillSelect('#productOrder', state.products, (item) => item.id, (item) => `${item.sku} · ${item.name}`);
  fillSelect('#customerOrder', state.customers, (item) => item.id, (item) => `${item.name} · ${item.email ?? 'sin email'}`);
  fillSelect('#orderSelect', state.orders, (item) => item.id, (item) => `${String(item.id).slice(0, 8)} · ${item.status} · ${money.format(item.total_cents)}`);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function render() {
  renderMetrics();
  renderSelectors();
  renderOrders();
  renderEvents();
}

function setConnection(label, status = 'online') {
  $('#connection').className = `connection ${status}`;
  $('#connection span').textContent = label;
}

async function refresh({ quiet = false } = {}) {
  try {
    state = await adapter().state();
    render();
    setConnection(mode === 'local' ? 'Demo local activa' : 'API conectada');
    if (!quiet) toast('Estado actualizado.');
  } catch (error) {
    setConnection('Sin conexión', 'error');
    if (!quiet) toast(error.message, 'error');
    throw error;
  }
}

async function action(label, operation) {
  try {
    await operation();
    await refresh({ quiet: true });
    toast(label);
  } catch (error) {
    toast(error.message, 'error');
  }
}

function formData(form) { return Object.fromEntries(new FormData(form).entries()); }

$('#productForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const body = formData(event.currentTarget);
  action('Producto creado y evento registrado.', () => adapter().product({ ...body, price_cents: Number(body.price_cents) }));
});

$('#stockForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const body = formData(event.currentTarget);
  action('Stock recibido en bodega.', () => adapter().stock({ ...body, quantity: Number(body.quantity) }));
});

$('#customerForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const body = formData(event.currentTarget);
  action('Cliente incorporado al CRM.', () => adapter().customer({ ...body, consent_marketing: body.consent_marketing === 'on' }));
});

$('#orderForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const body = formData(event.currentTarget);
  action('Pedido creado con stock reservado.', () => adapter().order({ ...body, quantity: Number(body.quantity) }));
});

$('#payButton').addEventListener('click', () => action('Pago mock aprobado; el stock fue descontado.', () => adapter().pay($('#orderSelect').value)));
$('#taxButton').addEventListener('click', () => action('Boleta demo emitida. No se contactó al SII.', () => adapter().tax($('#orderSelect').value)));

$('#agentForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const body = formData(event.currentTarget);
  action('Propuesta generada; ninguna acción externa fue ejecutada.', async () => {
    const result = await adapter().agent(body.agent, { goal: body.goal, context: { products: state.products.length, customers: state.customers.length, orders: state.orders.length } });
    toast(`${result.agent}: ${Array.isArray(result.proposal) ? result.proposal[0] : 'propuesta lista'}`);
  });
});

$('#refreshButton').addEventListener('click', () => refresh());
$('#role').addEventListener('change', () => toast(`Perfil activo: ${$('#role').selectedOptions[0].textContent}.`));
$('#connectButton').addEventListener('click', () => {
  localStorage.setItem('commerce-os-api-url', apiBase());
  setMode('api');
});
$('#resetButton').addEventListener('click', () => {
  if (globalThis.confirm('¿Restablecer la demo y borrar sus datos locales o de servidor?')) action('Demo restablecida.', () => adapter().reset());
});

$$('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));

async function setMode(nextMode, quiet = false) {
  mode = nextMode;
  localStorage.setItem('commerce-os-mode', mode);
  $$('[data-mode]').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  $('#apiField').hidden = mode !== 'api';
  $('#modeHelp').textContent = mode === 'local'
    ? 'Los datos quedan en este dispositivo. No se ejecutan pagos ni documentos reales.'
    : 'La interfaz utilizará el backend Fastify y PostgreSQL indicado. Los adaptadores externos siguen siendo mock.';
  setConnection('Conectando', '');
  try { await refresh({ quiet: true }); if (!quiet) toast(mode === 'local' ? 'Motor local activado.' : 'API conectada.'); }
  catch { /* refresh ya informa el estado */ }
}

async function detectInitialMode() {
  $('#apiUrl').value = localStorage.getItem('commerce-os-api-url') ?? (location.hostname === 'localhost' ? location.origin : 'http://localhost:8080');
  const saved = localStorage.getItem('commerce-os-mode');
  if (saved) return setMode(saved, true);
  if (location.protocol.startsWith('http')) {
    try {
      const response = await fetch('/health', { signal: AbortSignal.timeout(1000) });
      const health = await response.json();
      if (health.ok) return setMode('api', true);
    } catch { /* el servidor estático utiliza el motor local */ }
  }
  return setMode('local', true);
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
detectInitialMode();
