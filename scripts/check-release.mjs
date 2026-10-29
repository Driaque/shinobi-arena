import {readFile} from 'node:fs/promises';
const {version}=JSON.parse(await readFile('package.json','utf8'));
if(!/^\d+\.\d+\.\d+$/.test(version))throw new Error('Use a semantic release version');
const notes=await readFile(`docs/releases/${version}.md`,'utf8');
if(!notes.startsWith(`# Fabled Rivals v${version}\n`)||notes.trim().length<100)throw new Error(`Write complete release notes for ${version}`);
console.log(`Release notes verified: v${version}`);
