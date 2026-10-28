import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('apps/web', 'dist', { recursive: true });
await cp('packages', 'dist/packages', { recursive: true });
await writeFile('dist/.nojekyll', '');
console.log('Static build: dist/');


const onlineURL=process.env.ONLINE_SERVER_URL?.trim()||'';
if(onlineURL){const url=new URL(onlineURL);if(!['https:','wss:'].includes(url.protocol))throw new Error('ONLINE_SERVER_URL must use HTTPS or WSS');}
await writeFile('dist/online-config.json',JSON.stringify({url:onlineURL}));
