import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('presenta el producto como demo conceptual con un recorrido de seis pasos', async () => {
  const html = await readFile('apps/web/index.html', 'utf8');
  assert.match(html, /Commerce Operating System<br><span>Demo conceptual<\/span>/);
  for (const step of ['Catálogo', 'Inventario', 'Cliente', 'Pedido', 'Pago simulado', 'Trazabilidad']) {
    assert.match(html, new RegExp(step));
  }
  assert.match(html, /Funcionalidad secundaria: agentes con aprobación humana/);
});

test('muestra advertencias inequívocas para pago y documento tributario', async () => {
  const html = await readFile('apps/web/index.html', 'utf8');
  assert.match(html, /PAGO SIMULADO/);
  assert.match(html, /No mueve dinero ni utiliza Webpay real\./);
  assert.match(html, /DOCUMENTO TRIBUTARIO SIMULADO/);
  assert.match(html, /No emite documentos ante el SII\./);
});

test('incluye guía de reunión y preflight reproducible', async () => {
  const [meeting, demo, manifest] = await Promise.all([
    readFile('docs/REUNION_FARMACIA_2026-09-10.md', 'utf8'),
    readFile('docs/DEMO.md', 'utf8'),
    readFile('package.json', 'utf8'),
  ]);
  assert.match(meeting, /PLAN B/);
  assert.match(demo, /DEMO PARA REUNIÓN FARMACIA — 3 A 5 MINUTOS/);
  assert.equal(JSON.parse(manifest).scripts['demo:check'], 'node scripts/demo-check.mjs');
});
