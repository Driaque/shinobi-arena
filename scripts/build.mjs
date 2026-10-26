import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('apps/web', 'dist', { recursive: true });
await cp('packages', 'dist/packages', { recursive: true });
await writeFile('dist/.nojekyll', '');
console.log('Static build: dist/');
