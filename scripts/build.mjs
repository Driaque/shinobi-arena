import {cp,mkdir,rm,writeFile,readFile,readdir} from 'node:fs/promises';
import {build} from 'esbuild';
const {version}=JSON.parse(await readFile('package.json','utf8'));
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
await cp('apps/web','dist',{recursive:true});await cp('packages','dist/packages',{recursive:true});
await writeFile('dist/.nojekyll','');
const onlineURL=process.env.ONLINE_SERVER_URL?.trim()||JSON.parse(await readFile('apps/web/online-config.json','utf8')).url||'';
if(onlineURL){const url=new URL(onlineURL);if(!['https:','wss:'].includes(url.protocol))throw new Error('ONLINE_SERVER_URL must use HTTPS or WSS');}
await writeFile('dist/online-config.json',JSON.stringify({url:onlineURL}));
// Fingerprint the complete native-module graph, not just main.js, across version upgrades.
async function versionModules(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${e.name}`;if(e.isDirectory())await versionModules(path);else if(e.name.endsWith('.js')){const source=await readFile(path,'utf8');await writeFile(path,source.replace(/(\bfrom\s*['"])(\.\.?\/[^'"]+\.js)(['"])/g,`$1$2?v=${version}$3`));}}}
const lab=await build({entryPoints:['dist/visual-lab.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,write:false,legalComments:'eof'});
await writeFile('dist/visual-lab.js',lab.outputFiles[0].contents);
await versionModules('dist');
const labHtml=await readFile('dist/visual-lab.html','utf8');await writeFile('dist/visual-lab.html',labHtml.replace('./visual-lab.js"',`./visual-lab.js?v=${version}"`).replace('./visual-lab.css"',`./visual-lab.css?v=${version}"`));
const html=await readFile('dist/index.html','utf8');await writeFile('dist/index.html',html.replace('./main.js"',`./main.js?v=${version}"`).replace('./startup.js"',`./startup.js?v=${version}"`).replace('./styles.css"',`./styles.css?v=${version}"`).replace('./icons.css"',`./icons.css?v=${version}"`));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const inline=s=>escape(s).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');
const article=notes=>notes.trim().split(/\n\n+/).map(block=>block.startsWith('## ')?`<h2>${inline(block.slice(3))}</h2>`:block.startsWith('# ')?`<h1>${inline(block.slice(2))}</h1>`:block.startsWith('- ')?`<ul>${block.split('\n').map(line=>`<li>${inline(line.replace(/^- /,''))}</li>`).join('')}</ul>`:`<p>${inline(block.replaceAll('\n',' '))}</p>`).join('\n');
const style='body{margin:0;background:#091323;color:#dce8f5;font:16px/1.7 system-ui}main{max-width:860px;padding:28px 20px 70px;margin:auto}a{color:#f1c780}h1,h2{color:#f1c780;line-height:1.3}h1{font-size:30px}h2{font-size:21px;margin-top:32px}li{margin:9px 0}nav{display:flex;flex-wrap:wrap;gap:18px;font-size:13px;margin-bottom:30px}article{padding:20px;margin:14px 0;border:1px solid #385269;border-radius:10px;background:#102237}article h2{margin:0;font-size:22px}article p{margin:9px 0;color:#b6c9d8}small{color:#9db5c7}code{background:#1c3245;padding:2px 5px;border-radius:4px}';
const page=(title,body,back,history)=>`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · Fabled Rivals</title><style>${style}</style><main><nav><a href="${back}">← Back to the arena</a><a href="${history}">Release history</a></nav>${body}</main></html>`;
const versions=(await readdir('docs/releases')).filter(name=>/^\d+\.\d+\.\d+\.md$/.test(name)).map(name=>name.slice(0,-3)).sort((a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);return y[0]-x[0]||y[1]-x[1]||y[2]-x[2];});
await mkdir('dist/releases',{recursive:true});const cards=[];
for(const v of versions){const notes=await readFile(`docs/releases/${v}.md`,'utf8');await writeFile(`dist/releases/${v}.html`,page(`v${v} release notes`,article(notes),'../','./index.html'));const summary=notes.split('\n').find(line=>line.startsWith('- '))?.slice(2)??'Changes, controls, compatibility and known limits.';cards.push(`<article><h2><a href="./${v}.html">v${v}${v===version?' · Latest':''}</a></h2><p>${inline(summary.slice(0,200))}${summary.length>200?'…':''}</p><a href="./${v}.html">Read full notes →</a></article>`);}
const current=await readFile(`docs/releases/${version}.md`,'utf8');await writeFile('dist/release-notes.html',page(`v${version} release notes`,article(current),'./','./releases/index.html'));
await writeFile('dist/releases/index.html',page('Release history',`<h1>Release history</h1><p>Browse the available version logs, including controls, gameplay changes, compatibility and limits.</p><small>${versions.length} version logs · Current version ${version}</small>${cards.join('')}`,'../','./index.html'));
console.log(`Static build: dist/ · v${version}`);
