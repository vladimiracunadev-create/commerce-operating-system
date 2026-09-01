import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'packages', 'demo-core', 'index.js');
const target = path.join(root, 'apps', 'web', 'demo-core.js');
await mkdir(path.dirname(target), { recursive: true });
await copyFile(source, target);
console.log('Demo core sincronizado en apps/web/demo-core.js');
