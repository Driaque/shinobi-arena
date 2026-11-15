import {CHARACTERS} from '../engine/index.js';
import {stageY,hexColor,diamond,shard} from './shapes.js';

// The Rival's Crest. Guarding raises five plates in the fighter's own colour:
// each plate is a fifth of the guard meter and they fail from the outside in,
// the rim burns gold while a parry is still possible, a parry answers with a
// riposte seal and a broken guard throws the plates as shards. Stateless: every
// frame is derived from the match state, so replays and seeks draw the same crest.
export const CREST_PLATES=5;
export const PARRY_WINDOW=5;
const GOLD=0xfff1c0,WHITE=0xffffff,SPAN=2.1,STEP=SPAN/CREST_PLATES;
// Failure order per plate, top to bottom: the centre plate is the last fifth.
const RANK=[0,2,4,3,1];

// Mix a colour toward white or black without leaving the fighter's hue.
const mix=(color,target,t)=>[16,8,0].reduce((sum,shift)=>sum|Math.round((color>>shift&255)*(1-t)+target*t)<<shift,0);
const lighten=(color,t)=>mix(color,255,t),shade=(color,t)=>mix(color,0,t);
function rim(cx,cy,rx,ry,facing,from,to,steps=3){
  const points=[];
  for(let i=0;i<=steps;i++){const a=from+(to-from)*i/steps;points.push(cx+facing*Math.cos(a)*rx,cy+Math.sin(a)*ry);}
  return points;
}
function plate(cx,cy,rx,ry,facing,from,to){
  const inner=rim(cx,cy,rx*.74,ry*.8,facing,from,to),back=[];
  for(let i=inner.length-2;i>=0;i-=2)back.push(inner[i],inner[i+1]);
  return {outer:rim(cx,cy,rx,ry,facing,from,to),inner,points:[...rim(cx,cy,rx,ry,facing,from,to),...back]};
}
export function crestFor(f){
  // Guarding always shows the low guard pose, so the crest is cut to that silhouette.
  const s=f.scale??1,facing=f.facing??1,height=(f.crouching?70:90)*s;
  return {facing,s,cx:f.x-facing*6*s,cy:stageY(f.depth,f.y)-height/2,rx:52*s,ry:height/2+4*s,color:hexColor(CHARACTERS[f.character]?.color,0x8eead7)};
}
export const platesIntact=f=>Math.max(0,Math.min(CREST_PLATES,Math.ceil((f.guard??100)/(100/CREST_PLATES))));
// Guard timings read straight from the engine's own bookkeeping.
export function guardMoment(f,tick){
  const hitAge=tick-(f.lastHit??-100),raised=tick-(f.guardStart??-100);
  return {
    raised,
    window:Boolean(f.blocking)&&raised>=0&&raised<PARRY_WINDOW&&!f.parryCooldown,
    struck:f.blockedHit&&hitAge>=0&&hitAge<10?1-hitAge/10:0,
    // A parry starts a 60 tick cooldown, so the cooldown is its clock.
    parryAge:f.parryCooldown>0?60-f.parryCooldown:null,
    // A broken guard is the one hit that drains guard without being blocked.
    breakAge:f.lastHit===f.lastGuardHit&&!f.blockedHit&&hitAge>=0&&hitAge<26?hitAge:null,
  };
}

export function guardCuesFor(state,{reduced=false,effects=true}={}){
  const shapes=[],lively=effects&&!reduced;
  for(const f of state.fighters){
    const {facing,s,cx,cy,rx,ry,color}=crestFor(f),moment=guardMoment(f,state.tick);
    if(f.blocking){
      const open=lively?Math.min(1,(moment.raised+1)/4):1,grow=.72+.28*open,struck=moment.struck,intact=platesIntact(f);
      const x=cx-(lively?facing*4*struck:0),edge=moment.window?GOLD:lighten(color,.55);
      for(let i=0;i<CREST_PLATES;i++){
        const from=-SPAN/2+i*STEP+.025,p=plate(x,cy,rx*grow,ry*grow,facing,from,from+STEP-.05);
        if(RANK[i]<CREST_PLATES-intact){shapes.push({kind:'path',points:[...p.points,p.points[0],p.points[1]],color,alpha:.2,width:1});continue;}
        const shimmer=lively&&Math.floor(state.tick/5)%8===i?.12:0;
        shapes.push({kind:'poly',points:p.points,color:shade(color,.45),alpha:.42*open},{kind:'poly',points:p.points,color,alpha:(.3+shimmer+.5*struck)*open,add:true},
          {kind:'path',points:p.outer,color:edge,alpha:Math.min(1,(moment.window?.95:.6)+.4*struck)*open,width:moment.window?3:2,add:true},
          {kind:'path',points:p.inner,color:lighten(color,.25),alpha:.7*open,width:1.5});
      }
      // The boss: a cut gem on the centre plate while any guard is left.
      if(intact)shapes.push(diamond(x+facing*rx*.87*grow,cy,5*s,9*s,{color:shade(color,.3),alpha:.9*open}),diamond(x+facing*rx*.87*grow,cy,3*s,6*s,{color:edge,alpha:open,add:true}));
      if(moment.window&&lively){
        // The parry window is a glint that runs the rim once and is gone.
        const a=-SPAN/2+SPAN*(moment.raised+.5)/PARRY_WINDOW;
        shapes.push(diamond(x+facing*Math.cos(a)*rx,cy+Math.sin(a)*ry,4*s,10*s,{color:GOLD,alpha:.95,add:true}));
      }
      if(struck){
        // A blocked blow runs along the rim instead of bursting off it.
        shapes.push(diamond(x+facing*rx,cy,(4+9*struck)*s,(6+16*struck)*s,{color:WHITE,alpha:struck,add:true}));
        if(lively)for(const side of [-1,1]){
          const a=side*(.12+(1-struck)*.85);
          shapes.push({kind:'path',points:rim(x,cy,rx*1.1,ry*1.08,facing,a,a+side*.24),color:GOLD,alpha:struck,width:3,add:true});
        }
      }
    }
    if(moment.parryAge!==null&&moment.parryAge<(lively?18:8)){
      const p=lively?moment.parryAge/18:0,px=f.x+facing*58*s,py=stageY(f.depth,f.y)-70*s,fade=lively?1-p:1-moment.parryAge/8;
      // Riposte seal: a turning square, a star and a line thrown back at the attacker.
      shapes.push(diamond(px,py,(34+70*p)*s,(6*(1-p)+1)*s,{color:GOLD,alpha:fade,add:true}),diamond(px,py,(4*(1-p)+1)*s,(30+44*p)*s,{color:GOLD,alpha:fade,add:true}));
      if(lively){
        const r=(18+44*p)*s,turn=Math.PI/4+p*1.3,square=[];
        for(let i=0;i<=4;i++)square.push(px+Math.cos(turn+i*Math.PI/2)*r,py+Math.sin(turn+i*Math.PI/2)*r);
        shapes.push({kind:'path',points:square,color,alpha:fade,width:1+3*(1-p),add:true},
          {kind:'poly',points:[px,py-3*s,px+facing*(110+90*p)*s,py,px,py+3*s],color:WHITE,alpha:fade*.75,add:true});
      }
    }
    if(moment.breakAge!==null){
      const age=moment.breakAge,b=age/26;
      if(age<8){
        const crack=[];
        for(let i=0;i<=6;i++)crack.push(cx+facing*(rx*.82+(i%2?9:-7)*s),cy+ry*(-.85+i*1.7/6));
        shapes.push({kind:'path',points:crack,color:WHITE,alpha:1-age/8,width:3,add:true});
      }
      if(lively){
        shapes.push({kind:'ellipse',x:cx+facing*24*s,y:cy,rx:28*s*(1+b),ry:ry*(.8+.3*b),color:0xff5a4a,alpha:.22*(1-b),add:true});
        for(let i=0;i<CREST_PLATES*2;i++){
          // Shards leave the rim away from the attacker, tumble and fall.
          const a=-SPAN/2+(i+.5)*SPAN/(CREST_PLATES*2),vx=-facing*(2.2+(i*7%5)*.85),vy=-3.4+(i*3%7)*.9;
          const x=cx+facing*Math.cos(a)*rx+vx*age*s,y=cy+Math.sin(a)*ry+(vy*age+.19*age*age)*s;
          shapes.push(shard(x,y,a+(i%2?1:-1)*age*.27,(21-i%3*4)*s,(12-i%2*4)*s,{color:i%3?color:WHITE,alpha:(1-b)*.9}));
        }
      }
    }
  }
  return shapes;
}
