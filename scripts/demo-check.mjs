import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const rule = '-'.repeat(32);
const pnpmEntry = process.env.npm_execpath;
const checks = [];

function run(label, args) {
  const result = pnpmEntry
    ? spawnSync(process.execPath, [pnpmEntry, ...args], {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe',
      })
    : spawnSync('corepack', ['pnpm', ...args], {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe',
      });
  checks.push([label, result.status === 0]);
  if (result.status !== 0) {
    if (result.error) process.stderr.write(`${result.error.message}\n`);
    process.stderr.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
  }
}

async function verifyDocumentation() {
  const meeting = await readFile('docs/REUNION_FARMACIA_2026-09-10.md', 'utf8');
  const demo = await readFile('docs/DEMO.md', 'utf8');
  const html = await readFile('apps/web/index.html', 'utf8');
  const requiredPhrases = [
    'DEMO PARA REUNIÓN FARMACIA — 3 A 5 MINUTOS',
    'PAGO SIMULADO',
    'No mueve dinero ni utiliza Webpay real.',
    'DOCUMENTO TRIBUTARIO SIMULADO',
    'No emite documentos ante el SII.',
    'PLAN B',
  ];
  const combined = [meeting, demo, html].join('\n');
  checks.push(['Documentation', requiredPhrases.every((phrase) => combined.includes(phrase))]);
}

console.log(rule);
console.log('COMMERCE OS DEMO CHECK');
console.log(rule);

run('Demo core sync', ['prepare:web']);
run('Tests', ['test']);
run('API build', ['build:api']);
run('Project structure', ['check:project']);

try {
  await verifyDocumentation();
} catch (error) {
  checks.push(['Documentation', false]);
  console.error(error.message);
}

for (const [label, ok] of checks) {
  console.log(`${label.padEnd(20)} ${ok ? 'OK' : 'FAIL'}`);
}

console.log(rule);
if (checks.every(([, ok]) => ok)) {
  console.log('DEMO READY');
  console.log(rule);
} else {
  console.log('DEMO NOT READY');
  console.log(rule);
  process.exitCode = 1;
}
