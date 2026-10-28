import test from 'node:test';import assert from 'node:assert/strict';
import {createMatch,stepMatch,nextRound,ITEMS,MOVES,validateLoadout,computerInput} from '../packages/engine/index.js';
import {playerProfile,cleanInput} from '../packages/network/protocol.js';
import {freshSettings,readSettings,defaultLayout,defaultDockLayout,layoutOverlaps,rebind} from '../packages/input/preferences.js';
const load=(items=[],weapons=['kunai','katana'])=>({character:'naruto',weapon:weapons[0],weapons,items:[...items,...Array(4-items.length).fill(null)]});
const match=(items=[],other=[])=>createMatch([load(items),load(other)]);
const advance=(s,n,input={})=>{for(let i=0;i<n;i++)stepMatch(s,[input,{}]);};
const use=(s,n=40)=>{stepMatch(s,[{useItem:true},{}]);advance(s,n);};
test('loadouts have exactly two weapon slots and four finite items, copied from client data',()=>{
 const raw=load(['raijinKunai','paperBomb','poison','smokeBomb']);const profile=playerProfile({...raw,name:'Player'});raw.items[0]='poison';raw.weapons[1]='tachi';assert.equal(profile.items[0],'raijinKunai');assert.equal(profile.weapons[1],'katana');
 assert.throws(()=>validateLoadout({...raw,items:['raijinKunai','raijinKunai',null,null]}));
 for(const bad of [{items:['paperBomb']},{items:['constructor',null,null,null]},{weapons:['kunai','__proto__']},{weapons:['katana','kunai']},{items:[{id:'paperBomb',count:999},null,null,null]}])assert.throws(()=>validateLoadout({...load(),...bad}));
 const old=validateLoadout({character:'naruto',weapon:'kunai'});assert.deepEqual(old.weapons,['kunai',null]);assert.deepEqual(old.items,[null,null,null,null]);
 const clean=cleanInput({useItem:true,swapWeapon:true,itemCount:99,weapons:['tachi','tachi']});assert.equal(clean.useItem,true);assert.equal(clean.itemCount,undefined);assert.equal(clean.weapons,undefined);
});
test('weapon swapping has commitment, is edge-triggered, cannot escape stun or cancel a strike',()=>{
 const s=match(),f=s.fighters[0];stepMatch(s,[{swapWeapon:true},{}]);assert.equal(f.weapon,'kunai');advance(s,4,{swapWeapon:true});assert.equal(f.weapon,'katana');advance(s,40,{swapWeapon:true});assert.equal(f.weaponSlot,1);
 const t=match();t.fighters[0].stun=20;stepMatch(t,[{swapWeapon:true},{}]);advance(t,30);assert.equal(t.fighters[0].weapon,'kunai');
 const c=match();stepMatch(c,[{attack:true},{}]);stepMatch(c,[{swapWeapon:true},{}]);assert.equal(c.fighters[0].action.move,'attack');advance(c,40);assert.equal(c.fighters[0].weapon,'kunai');
});
test('consumables are one-use, cost stamina, share cooldown, and cannot cancel attacks or escape stun',()=>{
 const s=match(['throwingKunai','throwingKunai']),f=s.fighters[0];use(s);assert.equal(f.items[0].count,0);assert.equal(f.stamina,92);stepMatch(s,[{cycleItem:true,useItem:true},{}]);assert.equal(f.items[1].count,1);assert.equal(f.itemSlot,1);advance(s,100);use(s);assert.equal(f.items[1].count,0);advance(s,120);use(s);assert.equal(f.items.reduce((n,i)=>n+i.count,0),0);
 const t=match(['paperBomb']);t.fighters[0].stun=30;use(t,40);assert.equal(t.fighters[0].items[0].count,1);
 const c=match(['paperBomb']);stepMatch(c,[{attack:true},{}]);stepMatch(c,[{useItem:true},{}]);advance(c,50);assert.equal(c.fighters[0].items[0].count,1);
});
test('paper bombs detonate after their fuse, with jump/dash spacing and guard counterplay',()=>{
 const s=match(['paperBomb']);s.fighters[0].x=400;s.fighters[1].x=690;use(s,30);assert.equal(s.fighters[1].hp,1000);advance(s,40);assert.ok(s.fighters[1].hp<1000);
 const avoid=match(['paperBomb']);avoid.fighters[0].x=400;avoid.fighters[1].x=1000;use(avoid,75);assert.equal(avoid.fighters[1].hp,1000);
 const guard=match(['paperBomb']);guard.fighters[0].x=400;guard.fighters[1].x=690;for(let i=0;i<80;i++)stepMatch(guard,[{useItem:i===0},{block:true}]);assert.ok(guard.fighters[1].hp>s.fighters[1].hp);
});
test('smoke blocks enemy ordinary projectiles, preserves friendly fire, and cannot stop melee or bombs',()=>{
 const s=match(['smokeBomb']);s.fighters[0].x=650;s.fighters[1].x=900;use(s,10);assert.equal(s.zones[0].kind,'smoke');
 s.projectiles.push({id:99,owner:1,x:790,y:65,direction:-1,life:20,move:'itemKunai',power:1,weak:1,pierce:0});advance(s,8);assert.equal(s.fighters[0].hp,1000);assert.equal(s.projectiles.length,0);
 s.projectiles.push({id:100,owner:0,x:680,y:65,direction:1,life:30,move:'itemKunai',power:1,weak:1,pierce:0});advance(s,20);assert.ok(s.fighters[1].hp<1000);
 s.projectiles.push({id:101,owner:1,x:650,y:65,direction:-1,life:1,move:'itemBomb',power:1,weak:1,pierce:.25});advance(s,1);assert.ok(s.fighters[0].hp<1000);
 const before=s.fighters[0].hp;s.fighters[1].x=s.fighters[0].x+60;s.fighters[0].stun=0;s.fighters[1].stun=0;for(let i=0;i<10;i++)stepMatch(s,[{},{attack:i===0}]);assert.ok(s.fighters[0].hp<before);
 advance(s,200);assert.equal(s.zones.length,0);
});
test('poison coating applies only to the next equipped weapon attack, and guard wastes it',()=>{
 const s=match(['poison']);s.fighters[0].x=600;s.fighters[1].x=670;use(s);assert.ok(s.fighters[0].buffs.some(b=>b.type==='poisonCoating'));stepMatch(s,[{weapon:true},{}]);advance(s,8);assert.ok(s.fighters[1].effects.some(e=>e.type==='poison'));assert.ok(!s.fighters[0].buffs.some(b=>b.type==='poisonCoating'));
 const t=match(['poison']);t.fighters[0].x=600;t.fighters[1].x=670;use(t);for(let i=0;i<25;i++)stepMatch(t,[{weapon:i===0},{block:true}]);assert.equal(t.fighters[1].effects.length,0);assert.equal(t.fighters[0].buffs.length,0);
});
test('Flying Raijin marks landing, allows one costly warp without invulnerability, and expires',()=>{
 const s=match(['raijinKunai']),f=s.fighters[0];f.x=300;use(s,100);assert.equal(f.items[0].count,0);assert.ok(f.raijinMark);const x=f.raijinMark.x,chakra=f.chakra;use(s,12);assert.equal(f.x,x);assert.equal(f.raijinMark,null);assert.equal(f.invulnerable,0);assert.ok(f.chakra<chakra-14);
 const expired=match(['raijinKunai']);use(expired,400);assert.equal(expired.fighters[0].raijinMark,null);assert.equal(expired.fighters[0].items[0].count,0);
 const stun=match(['raijinKunai']);use(stun,100);const mark=stun.fighters[0].raijinMark;stun.fighters[0].stun=20;use(stun,30);assert.equal(stun.fighters[0].x,360);assert.ok(mark.remaining>0);
});
test('inventory refills per round without mutating loadouts, and deterministic replays include items/zones',()=>{
 const s=match(['smokeBomb']);use(s);s.fighters[1].hp=0;advance(s,1);assert.equal(s.status,'roundOver');nextRound(s);assert.equal(s.fighters[0].items[0].count,1);assert.equal(s.fighters[0].weaponSlot,0);assert.equal(s.zones.length,0);assert.equal(s.loadouts[0].items[0],'smokeBomb');
 const a=match(['paperBomb','throwingShuriken','raijinKunai','poison']),b=structuredClone(a);for(let n=0;n<500;n++){const frames=[{useItem:n%110===0,cycleItem:n%110===90,swapWeapon:n===200,right:n<20},{}];stepMatch(a,frames);stepMatch(b,frames);}assert.deepEqual(a,b);for(const f of a.fighters)assert.ok(f.items.every(i=>i.count===0||i.count===1));
});
test('visibility persists, hidden controls do not reserve collision space, and v4 settings keep custom keys/layouts',()=>{
 const s=freshSettings();s.visibility.jump=false;s.visibility.dashForward=false;s.visibility.dashBack=false;assert.deepEqual(readSettings(JSON.stringify(s)),s);
 const layout=defaultDockLayout(804,344);layout.useItem={...layout.attack};assert.ok(layoutOverlaps(layout,804,344,'dock').length);assert.deepEqual(layoutOverlaps(layout,804,344,'dock',{useItem:false}),[]);
 const old=freshSettings();old.version=4;for(const map of old.keys)for(const code of Object.keys(map))if(['swapWeapon','cycleItem','useItem'].includes(map[code]))delete map[code];old.keys=rebind(old.keys,0,'attack','KeyF');delete old.visibility;old.layouts.medium=defaultLayout(804,302);old.layouts.medium.attack.size=70;for(const id of ['swapWeapon','cycleItem','useItem']){delete old.layouts.medium[id];for(const map of old.keys)for(const code of Object.keys(map))if(map[code]===id)delete map[code];}
 const migrated=readSettings(JSON.stringify(old));assert.equal(migrated.keys[0].KeyF,'attack');assert.ok(!Object.values(migrated.keys[0]).includes('swapWeapon'));assert.equal(migrated.layouts.medium.attack.size,70);assert.equal(migrated.visibility.jump,true);assert.ok(migrated.layouts.medium.useItem);
});
