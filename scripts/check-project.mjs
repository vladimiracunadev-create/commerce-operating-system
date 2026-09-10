import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const required = [
  'README.md', 'ABOUT.md', 'SECURITY.md', 'CHANGELOG.md', 'docs/QUICKSTART.md', 'docs/PLATFORMS.md', 'docs/STATUS.md',
  'apps/web/index.html', 'apps/web/app.js', 'apps/web/styles.css', 'apps/web/presentation.css', 'apps/web/manifest.webmanifest', 'apps/desktop/main.cjs',
  'packages/demo-core/index.js', 'capacitor.config.json', '.github/workflows/ci.yml', '.github/workflows/release.yml',
  'docs/REUNION_FARMACIA_2026-09-10.md', 'scripts/demo-check.mjs',
  'scripts/smoke-web.cjs',
];
for (const file of required) await access(path.resolve(file));

const source = await readFile('packages/demo-core/index.js', 'utf8');
const bundled = await readFile('apps/web/demo-core.js', 'utf8');
if (source !== bundled) throw new Error('apps/web/demo-core.js no coincide con packages/demo-core/index.js. Ejecuta pnpm prepare:web.');

const readme = await readFile('README.md', 'utf8');
for (const phrase of ['Windows', 'Android', 'localhost', 'PostgreSQL', 'Demo local']) {
  if (!readme.includes(phrase)) throw new Error(`README no documenta: ${phrase}`);
}
console.log(`Proyecto verificado: ${required.length} archivos requeridos y demo core sincronizado.`);
