import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ORIGINAL_FIGHTERS} from '../packages/engine/originals.js';
import {STAGES} from '../packages/engine/stages.js';
const root=new URL('../apps/web/assets/painted-v1/',import.meta.url);
test('Every original and stage has complete, valid responsive PNG exports',async()=>{
 const manifest=JSON.parse(await readFile(new URL('manifest.json',root)));
 for(const [group,ids] of [['portraits',Object.keys(ORIGINAL_FIGHTERS)],['stages',STAGES.map(s=>s.id)]]){
  assert.deepEqual(Object.keys(manifest[group]).sort(),ids.sort());
  for(const id of ids){const art=manifest[group][id];let last=0;
   for(const image of art.exports){assert.ok(image.width>last&&image.width<=art.sourceWidth);last=image.width;
    const data=await readFile(new URL(image.file,root));assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert.equal(data.readUInt32BE(16),image.width);assert.equal(data.readUInt32BE(20),image.height);assert.equal(data.length,image.bytes);
   }
  }
 }
});

import {paintedStageRect,paintedStageForView} from '../packages/presentation/artwork.js';
test('painted scenery covers wide, tall and shifted cameras without moving its ground line',()=>{
 for(const [view,width,height] of [[{scale:.2,x:200,y:-20},1688,240],[{scale:.8,x:-350,y:100},780,1688],[{scale:1,x:0,y:0},1600,900]]){
  const r=paintedStageForView(view,width,height),epsilon=1e-8;
  assert.ok(r.x*view.scale+view.x<=epsilon);
  assert.ok(r.y*view.scale+view.y<=epsilon);
  assert.ok((r.x+r.w)*view.scale+view.x>=width-epsilon);
  assert.ok((r.y+r.h)*view.scale+view.y>=height-epsilon);
  const groundRatio=(610-paintedStageRect.y)/paintedStageRect.h;
  assert.ok(Math.abs(r.y+r.h*groundRatio-610)<epsilon);
  assert.ok(Math.abs(r.w/r.h-16/9)<epsilon);
 }
});
