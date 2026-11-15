import {MOVES} from '../engine/index.js';
import {handFor} from './weapons.js';
import {stageY,ring,facets,shard,diamond} from './shapes.js';

// Consumables on the battlefield use their painted inventory art: drawn from the
// pouch into the hand, thrown, planted or broken open. Sizes are arena units.
export const ITEM_ART=Object.freeze({
  cinderCharge:{size:34,color:0xff9a4a},
  laureateShroud:{size:40,color:0xb58cf0},
  orbitPack:{size:36,color:0x7fe0d8},
  poison:{size:36,color:0x9be05a},
  // Navy cases sit close to the icon backdrop, so they need a tighter cut.
  spikeCapsule:{size:38,color:0x58c8ff,cutout:{inner:8,outer:24,tight:6}},
  veilCanister:{size:38,color:0x6f78e8,cutout:{inner:8,outer:24,tight:6}},
  waypointAnchor:{size:44,color:0xffd879},
});
export const itemArtUrl=id=>`./assets/painted-v2/items/${id}-256.png`;
// Item projectiles drawn here rather than as generic vector shots.
export const ITEM_PROJECTILES=Object.freeze(['itemBomb','itemSpike','itemWaypoint']);
const SMOKE={veil:[0x2f3476,0x4a4fa8,0x6a68c8,0xa9b4ff],victory:[0x5a3a8c,0x7d55b4,0xa27bd0,0xffd98a]};
const EMBER=0xff9a4a,GOLD=0xffd879,CYAN=0x58c8ff,VENOM=0xb5e08b;

function held(f,frame,lively,shapes,props){
  const a=f.action;
  if(a?.source!=='useItem'||a.move==='waypointWarp')return;
  const id=f.items?.[a.itemSlot]?.id,art=ITEM_ART[id],m=MOVES[a.move];
  if(!art||!m)return;
  const ready=a.age<m.startup,pours=a.move==='itemPoison';
  if(!ready&&!pours)return;
  const s=f.scale??1,facing=f.facing??1,foot=stageY(f.depth,f.y),[hx,hy]=handFor(f,frame??8);
  // Out of the hip pouch and up into the leading hand.
  const t=Math.min(1,a.age/m.startup),e=lively?1-(1-t)**3:1,after=ready?0:Math.min(1,(a.age-m.startup)/m.recovery);
  const x=f.x+facing*(6+(hx-6)*e)*s,y=foot+(-52+(hy+52)*e)*s,alpha=ready?1:Math.max(0,1-after*1.3);
  props.push({image:'items/'+id,x,y,size:art.size*s*(.45+.55*e),flip:facing,alpha,
    rotation:facing*(ready?(lively?Math.sin(a.age*.9)*.14*(1-t):0):2*Math.min(1,after*3))});
  shapes.push({kind:'ellipse',x,y,rx:art.size*.6*s,ry:art.size*.6*s,color:art.color,alpha:.2*e*alpha,add:true});
  if(pours&&!ready)for(let i=0;i<4;i++){
    const fall=lively?(after*46+i*11)%38:i*9;
    shapes.push({kind:'ellipse',x:x+facing*(10+i*2.5)*s,y:y+(6+fall)*s,rx:2.2*s,ry:3.6*s,color:VENOM,alpha:.9*alpha,add:true});
  }
}
function coated(f,tick,lively,shapes){
  if(!f.buffs?.some(b=>b.type==='poisonCoating'))return;
  const s=f.scale??1,facing=f.facing??1,foot=stageY(f.depth,f.y);
  for(let i=0;i<(lively?3:1);i++){
    const phase=lively?(tick*.03+i/3)%1:.3,sway=lively?Math.sin(i*2.1+tick*.05)*6:0;
    shapes.push({kind:'ellipse',x:f.x+facing*(26+sway)*s,y:foot-(50+phase*36)*s,rx:(1.2+3*(1-phase))*s,ry:(1.6+4.6*(1-phase))*s,color:VENOM,alpha:.6*(1-phase),add:true});
  }
}
function warping(f,lively,shapes){
  const a=f.action;
  if(a?.move!=='waypointWarp')return;
  const m=MOVES.waypointWarp,s=f.scale??1,foot=stageY(f.depth,f.y);
  if(a.age<m.startup){
    // The thread tightens around the fighter before it pulls.
    const t=a.age/m.startup;
    shapes.push(ring(f.x,foot-4,(64-40*t)*s,(17-10*t)*s,{color:GOLD,alpha:.35+.5*t,width:2,add:true}));
    return;
  }
  const t=Math.min(1,(a.age-m.startup)/14);
  if(t>=1)return;
  shapes.push(ring(f.x,foot-4,(22+52*t)*s,(6+13*t)*s,{color:GOLD,alpha:1-t,width:3,add:true}));
  if(lively)shapes.push(diamond(f.x,foot-80*s,(11*(1-t)+1)*s,(150+60*t)*s,{color:GOLD,alpha:(1-t)*.8,add:true}),
    diamond(f.x,foot-80*s,(4*(1-t)+.5)*s,(170+60*t)*s,{color:0xffffff,alpha:1-t,add:true}));
}
function projectile(p,tick,lively,shapes,props){
  const x=p.x,y=stageY(p.depth,p.y),dir=p.direction??1,m=MOVES[p.move];
  if(p.move==='itemBomb'){
    // The fuse is the timer: the ring burns down and the cage glows hotter.
    const left=Math.max(0,Math.min(1,p.life/m.life)),urgent=1-left,pulse=lively?.5+.5*Math.sin(tick*(.3+urgent*.9)):.6;
    shapes.push({kind:'ellipse',x,y,rx:20+12*pulse,ry:20+12*pulse,color:EMBER,alpha:.16+.4*urgent*pulse,add:true},
      ring(x,y,24,24,{from:-Math.PI/2,to:-Math.PI/2+Math.PI*2*left,color:0xffe2a4,alpha:.9,width:2.5,add:true}));
    if(lively)for(let i=1;i<=4;i++)shapes.push({kind:'ellipse',x:x-dir*i*8,y:y-13-i*5-Math.sin(tick*.4+i)*2,rx:3.4-i*.6,ry:3.4-i*.6,color:i%2?0xffd27a:EMBER,alpha:.8-i*.16,add:true});
    props.push({image:'items/cinderCharge',x,y,size:34,rotation:lively?tick*.11*dir:0,flip:dir});
  }else if(p.move==='itemSpike'){
    shapes.push({kind:'poly',points:[x-9*dir,y-2.5,x-78*dir,y,x-9*dir,y+2.5],color:CYAN,alpha:.5,add:true},
      {kind:'line',x:x-7*dir,y,x2:x-17*dir,y2:y,color:0x8a6a48,width:4,alpha:1},
      {kind:'poly',points:[x+24*dir,y,x-1*dir,y-5.5,x-8*dir,y,x-1*dir,y+5.5],color:0xdfeaf2,alpha:1},
      {kind:'poly',points:[x+24*dir,y,x-1*dir,y-5.5,x-8*dir,y],color:0xffffff,alpha:.55},
      {kind:'ellipse',x:x-1*dir,y,rx:4.2,ry:2.8,color:CYAN,alpha:1,add:true});
  }else if(p.move==='itemWaypoint'){
    const thread=[];
    for(let i=0;i<=8;i++)thread.push(x-dir*i*9,y+Math.sin(i*.9+(lively?tick*.5:0))*5*i/8);
    shapes.push({kind:'path',points:thread,color:GOLD,alpha:.85,width:2,add:true},{kind:'ellipse',x,y,rx:20,ry:20,color:CYAN,alpha:.22,add:true});
    props.push({image:'items/waypointAnchor',x,y,size:36,rotation:lively?tick*.45*dir:0});
  }else if(p.move==='itemOrbit')shapes.push({kind:'poly',points:[x-12*dir,y-4,x-64*dir,y,x-12*dir,y+4],color:0x7fe0d8,alpha:.4,add:true});
}
function blast(z,lively,shapes,props){
  const t=1-z.remaining/15,x=z.x,y=stageY(z.depth,z.y),r=z.radius,fade=1-t;
  // Soft fire: a wide ember haze, the orange body and a short white heart.
  props.push({image:'fx/puff',x,y,size:r*(2.5+1.1*t),tint:0xff5a2a,alpha:.5*fade,add:true},
    {image:'fx/puff',x,y,size:r*(1.6+1.1*t),tint:0xff9a4a,alpha:.85*fade,add:true},
    {image:'fx/puff',x,y,size:r*(.8+.8*t),tint:0xfff0c0,alpha:fade*fade,add:true});
  if(z.y<160)shapes.push({kind:'ellipse',layer:'ground',x,y:stageY(z.depth),rx:r*.85,ry:15,color:0x140a06,alpha:.4*fade});
  if(!lively)return;
  // The cinder crystal goes off as cut shards, not a round puff.
  const turn=z.x*.013;
  shapes.push(facets(x,y,r*(.45+.75*t),10,turn,{color:0xffe2a4,alpha:fade,width:1+4*fade,add:true}),facets(x,y,r*(.28+.5*t),6,-turn,{color:0xff9a4a,alpha:fade,width:2,add:true}));
  for(let i=0;i<12;i++){
    const a=turn+i*Math.PI/6+(i%2?.14:0),d=r*(.34+(.8+i%3*.12)*t),length=(46-i%3*9)*(1-t*.4);
    shapes.push(shard(x+Math.cos(a)*d,y+Math.sin(a)*d,a,length,15-i%2*4,{color:i%2?0xffb45e:0xf2622a,alpha:fade}),
      shard(x+Math.cos(a)*d,y+Math.sin(a)*d,a,length*.6,6,{color:0xfff0c0,alpha:fade,add:true}));
  }
}
function smoke(z,tick,lively,shapes,props){
  const age=180-z.remaining,grow=lively?1-(1-Math.min(1,age/16))**2:1,fade=Math.min(1,z.remaining/40);
  const x=z.x,y=stageY(z.depth,z.y),tones=SMOKE[z.appearance==='victory'?'victory':'veil'],count=12;
  const id=z.appearance==='victory'?'laureateShroud':'veilCanister';
  props.push({image:'items/'+id,layer:'ground',x,y:Math.min(stageY(z.depth)-15,y+42),size:32,alpha:fade});
  for(let i=0;i<count;i++){
    // Sunflower spread keeps the cloud full without visible rows.
    const a=i*2.399,d=z.radius*Math.sqrt((i+.5)/count)*.86*grow,size=(46+i%4*9)*grow;
    const px=x+Math.cos(a)*d+(lively?Math.sin(tick*.021+i*1.7)*7:0),py=y+Math.sin(a)*d*.6+(lively?Math.cos(tick*.017+i)*5:0);
    // Soft billows, each lit from above.
    props.push({image:'fx/puff',x:px,y:py,size:size*3,squash:.84,tint:tones[i%3],alpha:.62*fade},
      {image:'fx/puff',x:px-size*.25,y:py-size*.3,size:size*1.5,squash:.7,tint:tones[3],alpha:.12*fade,add:true});
  }
  // Veil rings: broken bands turning inside the cloud, like the canister's own banding.
  for(let i=0;i<3;i++){
    const turn=(lively?tick*.012*(i%2?-1:1):0)+i*2.1,r=z.radius*(.42+i*.2)*grow;
    shapes.push(ring(x,y,r,r*.5,{from:turn,to:turn+2.2,steps:14,color:tones[3],alpha:.22*fade,width:2,add:true}));
  }
  if(lively)for(let i=0;i<7;i++){
    const rise=(tick*.4+i*37)%90;
    shapes.push(diamond(x+Math.sin(i*2.7)*z.radius*.7,y+50-rise,2.2,3.6,{color:tones[3],alpha:.55*fade*(1-rise/90),add:true}));
  }
}
function mark(mark,tick,lively,shapes,props){
  const x=mark.x,y=stageY(mark.depth)-8,left=Math.max(0,Math.min(1,mark.remaining/300));
  // The thread is the clock: it burns down toward the anchor, then flickers out.
  const blink=mark.remaining<60&&lively?.45+.55*Math.abs(Math.sin(tick*.35)):1,height=24+84*left,thread=[];
  for(let i=0;i<=10;i++){const u=i/10;thread.push(x+Math.sin(u*4.4+(lively?tick*.05:0))*10*u,y-6-height*u);}
  const tx=thread.at(-2),ty=thread.at(-1);
  shapes.push({kind:'ellipse',layer:'ground',x,y:y+7,rx:38,ry:10,color:CYAN,alpha:(lively?.2+.08*Math.sin(tick*.08):.24)*blink,add:true},
    ring(x,y+7,30,8,{layer:'ground',from:-Math.PI/2,to:-Math.PI/2+Math.PI*2*left,color:GOLD,alpha:.7*blink,width:2,add:true}),
    {kind:'path',points:thread,color:GOLD,alpha:.9*blink,width:2,add:true},
    diamond(tx,ty,7,2,{color:GOLD,alpha:blink,add:true}),diamond(tx,ty,2,9,{color:0xffffff,alpha:blink,add:true}));
  props.push({image:'items/waypointAnchor',layer:'ground',x,y,size:ITEM_ART.waypointAnchor.size,alpha:blink});
}

// frames: the atlas pose on screen per fighter id, so a held item sits in the hand that is drawn.
export function itemCuesFor(state,{reduced=false,effects=true,frames={}}={}){
  const shapes=[],props=[],lively=effects&&!reduced;
  for(const f of state.fighters)if(f.waypointMark)mark(f.waypointMark,state.tick,lively,shapes,props);
  for(const f of state.fighters){held(f,frames[f.id],lively,shapes,props);coated(f,state.tick,lively,shapes);warping(f,lively,shapes);}
  for(const p of state.projectiles??[])projectile(p,state.tick,lively,shapes,props);
  for(const z of state.zones??[]){if(z.kind==='blast')blast(z,lively,shapes,props);else if(z.kind==='smoke')smoke(z,state.tick,lively,shapes,props);}
  return {shapes,props};
}
