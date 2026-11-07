import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ITEMS,WEAPONS,JUTSUS} from '../packages/engine/index.js';
import {artworkSources} from '../packages/ui/painted-art.js';
import {FUTURE_FIGHTERS} from '../packages/engine/future-fighters.js';
const root=new URL('../apps/web/assets/painted-v2/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',root)));
for(const [kind,group,catalog] of [['item','items',ITEMS],['weapon','weapons',WEAPONS],['technique','moves',JUTSUS],['fighter','fighters',FUTURE_FIGHTERS]]){
 test(`${group}: every catalog entry has valid responsive painted PNGs`,()=>{
  assert.deepEqual(Object.keys(manifest.groups[group]).sort(),Object.keys(catalog).sort());
  for(const id of Object.keys(catalog)){
   const entry=manifest.groups[group][id];
   assert.equal(entry.sourceSha256.length,64);
   assert.deepEqual(entry.exports.map(v=>v.width),kind==='fighter'?[192,384,768]:[64,128,256]);
   const sources=artworkSources(kind,id);
   for(const variant of entry.exports){
    const bytes=readFileSync(new URL(variant.file,root));
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16),variant.width);
    assert.equal(bytes.readUInt32BE(20),variant.height);
    assert.equal(bytes.length,variant.bytes);
    assert.ok(sources.srcset.includes(`${id}-${variant.width}.png ${variant.width}w`));
   }
  }
 });
}
