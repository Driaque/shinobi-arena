import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {ITEMS,MOVES} from '../packages/engine/index.js';
import {createTraining,stepTraining} from '../packages/engine/training.js';
import {practiceSceneFor} from '../packages/presentation/practice-scene.js';
import {sceneFor} from '../packages/presentation/visual-lab.js';
import {CREST_PLATES,PARRY_WINDOW,crestFor,platesIntact,guardMoment,guardCuesFor} from '../packages/presentation/guard.js';
import {ITEM_ART,ITEM_PROJECTILES,itemArtUrl,itemCuesFor} from '../packages/presentation/items.js';
import {impactCuesFor} from '../packages/presentation/impact.js';
import {itemSoundFor,soundFor} from '../apps/web/audio.js';

// Fighters start far apart so thrown items are seen in flight.
const start=items=>{const state=createTraining([{character:'aren',weapon:'skyforgedBlade',items},{character:'winta',weapon:'skyforgedBlade'}],{dummy:'idle'});state.fighters[0].x=300;state.fighters[1].x=900;return state;};
const use=(state,ticks)=>{stepTraining(state,{useItem:true});for(let i=1;i<ticks;i++)stepTraining(state,{});};
const numbers=shapes=>shapes.every(s=>[s.x,s.y,s.rx,s.ry,s.alpha,s.width,...(s.points??[])].filter(v=>v!==undefined).every(Number.isFinite));
const guarding=(extra={})=>({tick:100,fighters:[{id:0,character:'aren',x:400,y:0,depth:0,facing:1,blocking:true,guard:100,guardStart:60,parryCooldown:0,lastHit:-100,lastGuardHit:-100,blockedHit:false,...extra}]});

test('the crest shows a plate per fifth of guard and loses them as guard drains',()=>{
 assert.equal(CREST_PLATES,5);
 for(const [guard,plates] of [[100,5],[81,5],[80,4],[41,3],[20,1],[1,1],[0,0]])assert.equal(platesIntact({guard}),plates,`guard ${guard}`);
 const solid=state=>guardCuesFor(state).filter(s=>s.kind==='poly'&&s.add&&s.points.length>8).length;
 assert.equal(solid(guarding()),5);assert.equal(solid(guarding({guard:45})),3);assert.equal(solid(guarding({guard:0})),0);
 assert.deepEqual(guardCuesFor(guarding({blocking:false})),[],'no crest unless guarding');
 assert.ok(numbers(guardCuesFor(guarding({guard:45}))));
});

test('the crest is cut to the fighter: colour, facing and low guard',()=>{
 const f=guarding().fighters[0],right=crestFor(f),left=crestFor({...f,facing:-1}),low=crestFor({...f,crouching:true});
 assert.equal(right.color,0x69cbb8);assert.equal(crestFor({...f,character:'missing'}).color,0x8eead7);
 assert.ok(right.cx<f.x&&left.cx>f.x);assert.ok(low.ry<right.ry&&low.cy>right.cy);
 const xs=state=>guardCuesFor(state).flatMap(s=>s.points?s.points.filter((_,i)=>i%2===0):[s.x]);
 assert.ok(Math.max(...xs(guarding()))>f.x&&Math.min(...xs(guarding({facing:-1})))<f.x,'plates face the opponent');
});

test('guard moments come from engine bookkeeping: parry window, block, parry and break',()=>{
 const f=guarding().fighters[0];
 assert.equal(guardMoment({...f,guardStart:100-PARRY_WINDOW+1},100).window,true);
 assert.equal(guardMoment({...f,guardStart:100-PARRY_WINDOW},100).window,false);
 assert.equal(guardMoment({...f,guardStart:99,parryCooldown:30},100).window,false,'no window while parry is cooling down');
 assert.equal(guardMoment({...f,blockedHit:true,lastHit:98},100).struck,.8);
 assert.equal(guardMoment({...f,parryCooldown:54},100).parryAge,6);assert.equal(guardMoment(f,100).parryAge,null);
 assert.equal(guardMoment({...f,lastHit:95,lastGuardHit:95,blockedHit:false},100).breakAge,5);
 assert.equal(guardMoment({...f,lastHit:95,lastGuardHit:95,blockedHit:true},100).breakAge,null,'a blocked hit is not a break');
 assert.equal(guardMoment({...f,lastHit:95,lastGuardHit:40},100).breakAge,null,'a clean hit is not a break');
 const gold=shapes=>shapes.filter(s=>s.color===0xfff1c0).length;
 assert.ok(gold(guardCuesFor(guarding({guardStart:98})))>gold(guardCuesFor(guarding())),'the rim burns gold inside the parry window');
 const broken=guardCuesFor(guarding({blocking:false,guard:0,lastHit:96,lastGuardHit:96}));
 assert.ok(broken.length>=CREST_PLATES*2&&numbers(broken),'a broken guard throws its plates');
 assert.ok(guardCuesFor(guarding({blocking:false,parryCooldown:58})).length>=3,'a parry answers with the riposte seal');
});

test('reduced motion keeps the crest readable and drops the flourish',()=>{
 const broken=guarding({blocking:false,guard:0,lastHit:96,lastGuardHit:96});
 assert.ok(guardCuesFor(broken,{reduced:true}).length<guardCuesFor(broken).length);
 assert.equal(guardCuesFor(guarding({guard:45}),{reduced:true}).filter(s=>s.kind==='poly'&&s.add&&s.points.length>8).length,3);
 assert.equal(guardCuesFor(guarding({blocking:false,parryCooldown:40}),{reduced:true}).length,0,'the seal is brief without motion');
});

test('a real guard and guard break reach the sprite scene without touching match state',()=>{
 const state=createTraining([{character:'aren',weapon:'skyforgedBlade'},{character:'winta',weapon:'skyforgedBlade'}],{dummy:'attack'});
 state.fighters[0].x=380;state.fighters[1].x=465;
 for(let i=0;i<400&&!(state.fighters[0].blockedHit&&state.tick-state.fighters[0].lastHit<1);i++)stepTraining(state,{block:true});
 assert.ok(state.fighters[0].blockedHit,'the dummy lands on the guard');
 const before=JSON.stringify(state),scene=practiceSceneFor(state,{},{selected:true,atlasFighters:['aren','winta']});
 assert.equal(JSON.stringify(state),before);
 assert.ok(scene.cues.shapes.length>=CREST_PLATES*4&&numbers(scene.cues.shapes));
 assert.deepEqual(impactCuesFor(sceneFor(state).bursts),[],'the crest answers a guarded hit, not a spark');
 state.fighters[0].guard=4;
 for(let i=0;i<400&&guardMoment(state.fighters[0],state.tick).breakAge===null;i++)stepTraining(state,{block:true});
 assert.equal(guardMoment(state.fighters[0],state.tick).breakAge,0,'the engine reports the break the crest draws');
});

test('a landed blow leaves the rival\'s mark, scaled by damage',()=>{
 const light=impactCuesFor([{x:500,y:400,age:2,power:10,seed:7,blocked:false}]),heavy=impactCuesFor([{x:500,y:400,age:2,power:200,seed:7,blocked:false}]);
 assert.equal(light.length,12);assert.ok(numbers(light)&&light.every(s=>s.add));
 const reach=shapes=>Math.max(...shapes.flatMap(s=>s.points??[]).filter((_,i)=>i%2===0))-500;
 assert.ok(reach(heavy)>reach(light));
 assert.deepEqual(impactCuesFor([{x:0,y:0,age:2,blocked:true}]),[]);assert.deepEqual(impactCuesFor(),[]);
});

test('every item has painted battlefield art and its own sound',()=>{
 assert.deepEqual(Object.keys(ITEM_ART).sort(),Object.keys(ITEMS).sort());
 for(const id of Object.keys(ITEM_ART))assert.ok(existsSync(new URL(`../apps/web/${itemArtUrl(id).slice(2)}`,import.meta.url)),`${id} painted icon ships`);
 for(const move of ITEM_PROJECTILES)assert.ok(MOVES[move].projectile,`${move} is a projectile`);
 assert.deepEqual(['itemBomb','itemSmoke','itemPoison','waypointWarp'].map(itemSoundFor),['toss','smoke','poison','warp']);
 assert.equal(soundFor({type:'guardBreak'}),'shatter');
});

test('an item is drawn from the pouch into the hand before it is used',()=>{
 const state=start(['cinderCharge']);use(state,4);
 const before=JSON.stringify(state),scene=practiceSceneFor(state,{},{selected:true,atlasFighters:['aren','winta']});
 assert.equal(JSON.stringify(state),before);
 assert.equal(scene.fighters[0].pose,'Item ready');
 const [held]=scene.cues.props;
 assert.equal(held.image,'items/cinderCharge');assert.ok(held.x>state.fighters[0].x&&held.size<ITEM_ART.cinderCharge.size,'still rising out of the pouch');
 for(let i=0;i<MOVES.itemBomb.startup;i++)stepTraining(state,{});
 const thrown=practiceSceneFor(state,{},{selected:true,atlasFighters:['aren','winta']});
 assert.equal(thrown.fighters[0].pose,'Item throw');
 assert.equal(thrown.projectiles.length,1);assert.equal(thrown.projectiles[0].cue,true);
 assert.ok(thrown.cues.props.some(p=>p.image==='items/cinderCharge'&&p.x===state.projectiles[0].x),'the painted charge is what flies');
});

test('the cinder charge burns a fuse ring down and bursts into shards',()=>{
 const state=start(['cinderCharge']);use(state,MOVES.itemBomb.startup+2);
 const fuse=()=>itemCuesFor(state).shapes.find(s=>s.kind==='path'&&s.color===0xffe2a4),length=s=>s.points.length&&Math.hypot(s.points.at(-2)-s.points[0],s.points.at(-1)-s.points[1]);
 const early=fuse();assert.ok(early&&length(early)<12,'a full fuse is a closed ring');
 for(let i=0;i<20;i++)stepTraining(state,{});
 assert.ok(length(fuse())>20,'the ring opens as the fuse burns');
 for(let i=0;i<80&&!state.zones.some(z=>z.kind==='blast');i++)stepTraining(state,{});
 const cues=itemCuesFor(state);
 assert.equal(cues.props.filter(p=>p.image==='fx/puff'&&p.add).length,3);assert.ok(cues.shapes.length>=20&&numbers(cues.shapes));
 assert.ok(itemCuesFor(state,{reduced:true}).shapes.length<5,'reduced motion keeps the flash and drops the shards');
 assert.deepEqual(practiceSceneFor(state,{},{}).zones,[],'scene zones stay elemental only');
});

test('veil and laureate smoke are the same cloud in their own colours',()=>{
 for(const [id,appearance] of [['veilCanister',null],['laureateShroud','victory']]){
  const state=start([id]);use(state,MOVES.itemSmoke.startup+20);
  assert.equal(state.zones[0].appearance,appearance);
  const cues=itemCuesFor(state),puffs=cues.props.filter(p=>p.image==='fx/puff'&&!p.add);
  assert.equal(puffs.length,12);assert.ok(cues.props.some(p=>p.image==='items/'+id&&p.layer==='ground'),'the spent canister lies under the cloud');
  assert.ok(puffs.every(p=>Math.hypot(p.x-state.zones[0].x,p.y-(650-state.zones[0].y))<state.zones[0].radius+20),'the cloud covers the engine radius');
 }
 const veil=start(['veilCanister']),shroud=start(['laureateShroud']);use(veil,30);use(shroud,30);
 assert.notEqual(itemCuesFor(veil).props.find(p=>p.tint).tint,itemCuesFor(shroud).props.find(p=>p.tint).tint);
});

test('poison is poured over the weapon hand and the coating stays visible',()=>{
 const state=start(['poison']);use(state,MOVES.itemPoison.startup+4);
 const pour=itemCuesFor(state);
 assert.ok(pour.props.some(p=>p.image==='items/poison'&&p.rotation!==0),'the vial tips over');
 assert.equal(pour.shapes.filter(s=>s.color===0xb5e08b).length>=4,true);
 for(let i=0;i<40;i++)stepTraining(state,{});
 assert.ok(state.fighters[0].buffs.some(b=>b.type==='poisonCoating'));
 assert.ok(itemCuesFor(state).shapes.some(s=>s.color===0xb5e08b),'the coated hand keeps its wisps');
});

test('the waypoint anchor plants a thread that burns down, then pulls its owner',()=>{
 const state=start(['waypointAnchor']);use(state,MOVES.itemWaypoint.startup+2);
 assert.ok(itemCuesFor(state).props.some(p=>p.image==='items/waypointAnchor'&&!p.layer),'the anchor flies');
 for(let i=0;i<120&&!state.fighters[0].waypointMark;i++)stepTraining(state,{});
 const mark=state.fighters[0].waypointMark;assert.ok(mark,'the anchor lands');
 const top=()=>Math.min(...itemCuesFor(state).shapes.filter(s=>s.kind==='path'&&!s.layer).flatMap(s=>s.points.filter((_,i)=>i%2)));
 const tall=top();for(let i=0;i<150;i++)stepTraining(state,{});
 assert.ok(top()>tall,'the thread shortens with the time left');
 assert.ok(itemCuesFor(state).props.some(p=>p.image==='items/waypointAnchor'&&p.layer==='ground'&&p.x===mark.x));
 state.fighters[0].cooldowns.useItem=0;use(state,3);
 assert.equal(state.fighters[0].action?.move,'waypointWarp');
 assert.equal(practiceSceneFor(state,{},{}).cues.props.some(p=>p.image==='items/waypointAnchor'&&!p.layer),false,'warping throws nothing');
 assert.ok(itemCuesFor(state).shapes.some(s=>s.color===0xffd879&&s.kind==='path'&&s.points.length>40),'the thread tightens around the fighter');
});

test('orbit pack and spike capsule fly as their own shapes',()=>{
 const orbit=start(['orbitPack']);use(orbit,MOVES.itemOrbit.startup+2);
 const scene=practiceSceneFor(orbit,{},{});
 assert.ok(scene.projectiles.length>=1&&scene.projectiles.every(p=>p.sprite==='orbitDisc'&&!p.cue));
 const spike=start(['spikeCapsule']);use(spike,MOVES.itemSpike.startup+2);
 assert.ok(practiceSceneFor(spike,{},{}).projectiles.every(p=>p.cue));
 assert.ok(itemCuesFor(spike).shapes.filter(s=>s.kind==='poly').length>=3,'the spike is a cut blade');
});
