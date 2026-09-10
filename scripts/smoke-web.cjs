const { app, BrowserWindow } = require('electron');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');

const url = process.env.DEMO_URL || 'http://127.0.0.1:4173';
const overviewPath = path.resolve('docs/assets/screenshots/demo-conceptual-overview.png');
const capturePath = path.resolve('docs/assets/screenshots/demo-conceptual-flow.png');
const consoleErrors = [];

app.commandLine.appendSwitch('headless');
app.commandLine.appendSwitch('disable-gpu');

async function main() {
  const window = new BrowserWindow({
    show: false,
    width: 1440,
    height: 1100,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      partition: `demo-smoke-${Date.now()}`,
    },
  });

  window.webContents.on('console-message', (_event, level, message) => {
    if (level >= 2 && !message.includes('Autofill')) consoleErrors.push(message);
  });

  await window.loadURL(url);
  await mkdir(path.dirname(capturePath), { recursive: true });
  const overview = await window.webContents.capturePage();
  await writeFile(overviewPath, overview.toPNG());

  const result = await window.webContents.executeJavaScript(`
    (async () => {
      const wait = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));
      const until = async (predicate, label) => {
        for (let attempt = 0; attempt < 40; attempt += 1) {
          if (predicate()) return;
          await wait();
        }
        throw new Error('Timeout: ' + label);
      };
      const set = (selector, value) => {
        const field = document.querySelector(selector);
        field.value = value;
        field.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const submit = (selector) => document.querySelector(selector).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      window.confirm = () => true;
      document.querySelector('#resetButton').click();
      await until(() => document.querySelector('#metrics').textContent.includes('12'), 'reset');

      set('#productForm [name="sku"]', 'DEMO-002');
      set('#productForm [name="name"]', 'Producto Demo B');
      set('#productForm [name="price_cents"]', '15990');
      submit('#productForm');
      await until(() => [...document.querySelectorAll('#productStock option')].some((option) => option.textContent.includes('DEMO-002')), 'product');

      const productId = [...document.querySelectorAll('#productStock option')].find((option) => option.textContent.includes('DEMO-002')).value;
      set('#productStock', productId);
      set('#stockForm [name="quantity"]', '10');
      submit('#stockForm');
      await wait();

      set('#customerForm [name="name"]', 'Cliente Demostración');
      set('#customerForm [name="email"]', 'cliente.demo@example.com');
      submit('#customerForm');
      await until(() => [...document.querySelectorAll('#customerOrder option')].some((option) => option.textContent.includes('Cliente Demostración')), 'customer');

      const customerId = [...document.querySelectorAll('#customerOrder option')].find((option) => option.textContent.includes('Cliente Demostración')).value;
      set('#customerOrder', customerId);
      set('#productOrder', productId);
      set('#orderForm [name="quantity"]', '1');
      submit('#orderForm');
      await until(() => document.querySelector('#ordersTable').textContent.includes('Pago pendiente'), 'order');

      document.querySelector('#payButton').click();
      await until(() => document.querySelector('#ordersTable').textContent.includes('Pagado'), 'payment');

      document.querySelector('#taxButton').click();
      await until(() => document.querySelector('#metrics').textContent.includes('Boletas demo1'), 'tax document');

      set('#role', 'warehouse');
      submit('#customerForm');
      await until(() => document.querySelector('#toast').textContent.includes('no puede ejecutar customers'), 'role rejection');
      const roleRejected = document.querySelector('#toast').textContent.includes('no puede ejecutar customers');
      set('#role', 'company_admin');

      document.querySelector('#traceability').scrollIntoView({ block: 'center' });
      await wait(250);

      const events = document.querySelector('#eventTimeline').textContent;
      return {
        title: document.title,
        orderPaid: document.querySelector('#ordersTable').textContent.includes('Pagado'),
        taxDocument: document.querySelector('#metrics').textContent.includes('Boletas demo1'),
        roleRejected,
        events: [
          'catalog.product.created',
          'inventory.stock.received',
          'crm.customer.created',
          'sales.order.created',
          'payments.payment.approved',
          'tax.document.issued',
        ].every((event) => events.includes(event)),
        paymentWarning: document.body.textContent.includes('No mueve dinero ni utiliza Webpay real.'),
        taxWarning: document.body.textContent.includes('No emite documentos ante el SII.'),
      };
    })()
  `, true);

  const image = await window.webContents.capturePage();
  await writeFile(capturePath, image.toPNG());

  if (consoleErrors.length) throw new Error(`Errores de consola: ${consoleErrors.join(' | ')}`);
  if (Object.values(result).some((value) => value !== true && typeof value === 'boolean')) {
    throw new Error(`Resultado incompleto: ${JSON.stringify(result)}`);
  }

  console.log(JSON.stringify({ ...result, screenshots: [overviewPath, capturePath] }, null, 2));
  window.destroy();
}

app.whenReady()
  .then(main)
  .then(() => app.quit())
  .catch((error) => {
    console.error(error);
    app.exit(1);
  });
