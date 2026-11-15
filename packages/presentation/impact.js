import {diamond,facets,shard} from './shapes.js';

// Impact pause ("hitstop") for locally stepped fights. Timing only: the loop
// waits before its next engine step, so rules, replays and online play are unchanged.
const PAUSE = { block: 26, pierce: 70, punish: 95, guardBreak: 130 };
export const KO_HOLD_MS = 480;

export function impactPauseMs(events = []) {
  let ms = 0;
  for (const e of events) {
    if (e.type === "roundEnd") { if (e.result !== "draw") ms = Math.max(ms, KO_HOLD_MS); }
    else if (e.type === "airFinish") ms = Math.max(ms, 110);
    else if (e.type === "parry") ms = Math.max(ms, 90);
    // Field and status ticks stay fluid; heavier blows hold longer.
    else if (e.type === "hit") ms = Math.max(ms, Math.min(115, 30 + (e.damage ?? 0) * 0.9));
    else if (PAUSE[e.type] && e.move) ms = Math.max(ms, PAUSE[e.type] + Math.min(40, (e.damage ?? 0) * 0.4));
  }
  return Math.round(ms);
}

// The Rival's Mark: a landed blow cuts a four-point star, a turning hexagon and
// a spray of shards — the same cut-crystal language as the guard crest. Guarded
// hits are left to the crest itself.
const GOLD=0xffe0a9,HOT=0xfff6de,WHITE=0xffffff;
export function impactCuesFor(bursts=[]){
  const shapes=[];
  for(const p of bursts){
    if(p.blocked)continue;
    const t=Math.min(1,p.age/12),fade=1-t,power=1+Math.min(1.2,(p.power??0)/90),turn=(p.seed??0)*.7;
    shapes.push({kind:'ellipse',x:p.x,y:p.y,rx:(24+16*t)*power,ry:(24+16*t)*power,color:GOLD,alpha:.14*fade,add:true},
      facets(p.x,p.y,(10+p.age*3)*power,6,turn+t*.9,{color:GOLD,alpha:fade,width:1+2*fade,add:true}));
    for(let i=0;i<7;i++){
      const a=turn+i*2.399,from=(12+t*40)*power;
      shapes.push(shard(p.x+Math.cos(a)*from,p.y+Math.sin(a)*from,a,(20-i%3*5)*fade*power+3,(4-i%2)*fade+1,{color:i%2?GOLD:HOT,alpha:fade,add:true}));
    }
    // The star is brightest on the frame the blow lands.
    const star=fade*fade*power;
    shapes.push(diamond(p.x,p.y,6+22*star,1+2.6*star,{color:HOT,alpha:fade,add:true}),
      diamond(p.x,p.y,1+2.2*star,5+17*star,{color:HOT,alpha:fade,add:true}),
      diamond(p.x,p.y,3.5*star+1,3.5*star+1,{color:WHITE,alpha:fade,add:true}));
  }
  return shapes;
}
