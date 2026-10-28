import {cp,mkdir,rm,writeFile,readFile,readdir} from 'node:fs/promises';
const {version}=JSON.parse(await readFile('package.json','utf8'));
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
await cp('apps/web','dist',{recursive:true});await cp('packages','dist/packages',{recursive:true});
await writeFile('dist/.nojekyll','');
const onlineURL=process.env.ONLINE_SERVER_URL?.trim()||JSON.parse(await readFile('apps/web/online-config.json','utf8')).url||'';
if(onlineURL){const url=new URL(onlineURL);if(!['https:','wss:'].includes(url.protocol))throw new Error('ONLINE_SERVER_URL must use HTTPS or WSS');}
await writeFile('dist/online-config.json',JSON.stringify({url:onlineURL}));
// Fingerprint the complete native-module graph, not just main.js, across version upgrades.
async function versionModules(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${e.name}`;if(e.isDirectory())await versionModules(path);else if(e.name.endsWith('.js')){const source=await readFile(path,'utf8');await writeFile(path,source.replace(/(\bfrom\s*['"])(\.\.?\/[^'"]+\.js)(['"])/g,`$1$2?v=${version}$3`));}}}
await versionModules('dist');
const html=await readFile('dist/index.html','utf8');await writeFile('dist/index.html',html.replace('./main.js"',`./main.js?v=${version}"`).replace('./styles.css"',`./styles.css?v=${version}"`));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const notes=await readFile(`docs/releases/${version}.md`,'utf8');
const article=notes.trim().split(/\n\n+/).map(block=>block.startsWith('## ')?`<h2>${escape(block.slice(3))}</h2>`:block.startsWith('# ')?`<h1>${escape(block.slice(2))}</h1>`:block.startsWith('- ')?`<ul>${block.split('\n').map(line=>`<li>${escape(line.replace(/^- /,''))}</li>`).join('')}</ul>`:`<p>${escape(block.replaceAll('\n',' '))}</p>`).join('\n');
await writeFile('dist/release-notes.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shinobi Arena v${version} · Release notes</title><style>body{margin:0;background:#091323;color:#dce8f5;font:16px/1.7 system-ui}main{max-width:820px;padding:28px 20px 70px;margin:auto}a{color:#f1c780}h1,h2{color:#f1c780;line-height:1.3}h1{font-size:30px}h2{font-size:21px;margin-top:32px}li{margin:9px 0}</style><main><a href="./">← Back to the arena</a>${article}</main></html>`);
console.log(`Static build: dist/ · v${version}`);
