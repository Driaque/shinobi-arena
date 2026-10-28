const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
// Cosmetic pose sampling: never changes authoritative combat state or hitboxes.
export function fighterPose(f,tick,move,reduced=false){
 const air=f.y>1,run=!f.action&&!f.stun&&!f.crouching&&(Math.abs(f.vx??0)>.2||(Boolean(f.previous?.left)!==Boolean(f.previous?.right))||Math.abs(f.previous?.moveX??0)>.1);
 const phase=tick*.29,cycle=reduced?0:Math.sin(phase),breath=reduced?0:Math.sin(tick*.055)*1.4;
 let weight=0,anticipation=0;
 if(f.action&&move){const age=f.action.age;if(age<move.startup)anticipation=ease(age/Math.max(1,move.startup));else weight=1-ease((age-move.startup-move.active)/Math.max(1,move.recovery));}
 const lean=f.stun?-.16:f.dash?.direction*f.facing>0?.24:air?Math.max(-.16,Math.min(.2,(f.vx??0)*f.facing*.025)):run?.14:weight*.13-anticipation*.08;
 return {lean,bob:air?0:run&&!reduced?Math.abs(cycle)*3:breath,stride:air?12:run?cycle*21:3,
  knee:air?-43:run?-26+cycle*5:-26,backKnee:air?-32:-26-(run?cycle*5:0),foot:air?-20:0,
  armX:f.blocking?26:18+weight*54-anticipation*13,armY:f.blocking?-112:-65-weight*19-anticipation*15,
  shoulder:weight*4,trail:reduced?0:Math.sin(tick*.13)*5+(run||f.dash?12:0),weight,anticipation};
}
export function interpolateFighter(a,b,t){
 if(!a||Math.abs(a.x-b.x)>160||a.character!==b.character)return {...b};
 const lerp=(x,y)=>x+(y-x)*clamp(t);
 return {...b,x:lerp(a.x,b.x),y:b.y===0&&a.y<1?0:lerp(a.y,b.y),action:b.action?{...b.action,age:a.action?.move===b.action.move?lerp(a.action.age,b.action.age):b.action.age}:null};
}
