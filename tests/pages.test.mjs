import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('la landing explica producto, reunión y límites de la demo', async () => {
  const html = await readFile('landing/index.html', 'utf8');
  assert.match(html, /Commerce Operating System.*v0\.3\.0/s);
  assert.match(html, /RECORRIDO DE 3 A 5 MINUTOS/);
  assert.match(html, /REUNION_FARMACIA_2026-09-10\.md/);
  assert.match(html, /No corresponde al sistema definitivo/);
  assert.match(html, /no mueve dinero ni utiliza Webpay real/);
  assert.match(html, /no emite ante el SII/);
  assert.match(html, /ERP:.*pendiente de levantamiento/s);
  assert.match(html, /CommerceOS-Demo-Windows-0\.3\.0\.exe/);
  assert.match(html, /CommerceOS-Demo-Android-v0\.3\.0\.apk/);
  assert.match(html, /17.*pruebas deterministas/s);
  assert.match(html, /FUNCIONAL/);
  assert.match(html, /SIMULADO/);
  assert.match(html, /FASE 1/);
  assert.match(html, /CI multiplataforma/);
  assert.match(html, /Pages publicada/);
});

test('Pages publica landing, capturas y demo con acciones fijadas por SHA', async () => {
  const workflow = await readFile('.github/workflows/pages.yml', 'utf8');
  for (const source of ['landing/.', 'demo-conceptual-overview.png', 'demo-conceptual-flow.png', 'apps/web/.', 'demo-core.js']) {
    assert.match(workflow, new RegExp(source.replaceAll('.', '\\.')));
  }
  const uses = [...workflow.matchAll(/uses:\s+([^\s]+)/g)].map((match) => match[1]);
  assert.equal(uses.length, 4);
  assert.ok(uses.every((action) => /@[0-9a-f]{40}$/.test(action)), `Acciones sin SHA: ${uses.join(', ')}`);
});
