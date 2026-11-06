import {livingPose} from './living-motion.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
// Cosmetic pose sampling: never changes authoritative combat state or hitboxes.
export function fighterPose(f,tick,move,reduced=false){
 const air=f.y>1,run=!f.action&&!f.stun&&!f.crouching&&(Math.abs(f.vx??0)>.2||(Boolean(f.previous?.left)!==Boolean(f.previous?.right))||Math.abs(f.previous?.moveX??0)>.1||Math.abs(f.previous?.moveZ??0)>.1);
 const phase=(f.travel??tick*5)/64*Math.PI*2,cycle=reduced?0:Math.sin(phase),breath=reduced?0:Math.sin(tick*.055)*1.1;
 let weight=0,anticipation=0;
 if(f.action&&move){const age=f.action.age;if(age<move.startup)anticipation=ease(age/Math.max(1,move.startup));else weight=1-ease((age-move.startup-move.active)/Math.max(1,move.recovery));}
 const sword=Boolean(move?.sword),fan=Boolean(move?.fanStrike),casting=Boolean(move?.projectile||move?.ground||move?.buff);
 const lean=f.stun?-.16:f.dash?.direction*f.facing>0?.24:air?Math.max(-.16,Math.min(.2,(f.vx??0)*f.facing*.025)):run?.14:weight*.13-anticipation*.08;
 const landing=clamp((tick-(f.landedAt??-100))/12);
 const bob=air?0:!reduced&&landing<1?-3*Math.sin(landing*Math.PI):run&&!reduced?(1-Math.cos(phase*2))*1.2:breath;
 const direction=Math.sign((f.vx??0)*f.facing||1);
 // A planted foot travels backward at constant speed; the returning foot
 // eases through its arc. Both legs share one distance-driven gait clock.
 const legs=[0,.5].map((offset,i)=>{
  const p=(((f.travel??tick*5)/64+offset)%1+1)%1,swing=clamp((p-.5)*2);
  const forward=(p<.5?16-64*p:-16+32*ease(swing))*direction;
  const lift=run&&!reduced&&p>.5?Math.sin(swing*Math.PI)**2*14:0;
  const fx=air?(i?8:-6):run&&!reduced?forward:(i?20:-16),fy=air?-26:-4-lift+bob;
  const hx=i?11:-12,hy=-48,dx=fx-hx,dy=fy-hy,d=Math.min(49.9,Math.max(1,Math.hypot(dx,dy))),ux=dx/(Math.hypot(dx,dy)||1),uy=dy/(Math.hypot(dx,dy)||1);
  const along=d/2,bend=Math.sqrt(Math.max(0,25**2-along**2));
  return {kx:hx+ux*along+uy*bend,ky:hy+uy*along-ux*bend,fx,fy};
 });
 const pose={legs,lean,bob,stride:air?12:run?cycle*21:3,
  knee:air?-43:run?-26+cycle*5:-26,backKnee:air?-32:-26-(run?cycle*5:0),foot:air?-20:0,
  armX:f.blocking?26:f.charging?23:casting?24+weight*24:fan?28+weight*46:sword?22+weight*65-anticipation*24:18+weight*54-anticipation*13,armY:f.blocking?-112:f.charging?-94:casting?-104+weight*14:fan?-91+weight*17:sword?-77-weight*22-anticipation*24:-65-weight*19-anticipation*15,
  shoulder:weight*4,trail:reduced?0:Math.sin(tick*.13)*5+(run||f.dash?12:0),weight,anticipation};
 return livingPose(f,tick,move,pose,reduced);
}
export function interpolateFighter(a,b,t){
 if(!a||Math.abs(a.x-b.x)>160||a.character!==b.character)return {...b};
 const lerp=(x,y)=>x+(y-x)*clamp(t);
 return {...b,x:lerp(a.x,b.x),y:b.y===0&&a.y<1?0:lerp(a.y,b.y),depth:lerp(a.depth??0,b.depth??0),travel:lerp(a.travel??0,b.travel??0),action:b.action?{...b.action,age:a.action?.move===b.action.move?lerp(a.action.age,b.action.age):b.action.age}:null};
}
// Local input must not be held behind a snapshot interpolation window.
export function sampleFighters(previous,current,t,online=false){return current.map((f,i)=>online?interpolateFighter(previous[i],f,t):{...f});}

// Project only the observed last tick's displacement, never stale velocity.
// One tick maximum keeps local input immediate on high-refresh displays.
export function projectLocalFighter(previous, current, fraction, ticks=1){
 const result={...current};
 if(!previous||ticks!==1||previous.character!==current.character)return result;
 const alpha=Number.isFinite(fraction)?clamp(fraction):0;
 if(Math.abs(current.x-previous.x)>40||Math.abs(current.y-previous.y)>40)return result;
 for(const key of ['x','y','depth','travel']){
  const delta=(current[key]??0)-(previous[key]??0);
  // Ground contact and stop/start transitions stay at the current pose.
  if(key==='y'&&current.y===0)continue;
  if(key==='travel'&&delta<0)continue;
  result[key]=(current[key]??0)+delta*alpha;
 }
 result.y=Math.max(0,result.y);
 // Hands and weapons must advance between ticks alongside the root, otherwise
 // high-refresh displays still see a 60 Hz attack on a smoothly moving body.
 if(current.action&&previous.action?.move===current.action.move&&current.action.age>=previous.action.age)
  result.action={...current.action,age:current.action.age+alpha};
 return result;
}
