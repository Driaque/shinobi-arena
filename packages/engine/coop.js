import {createMatch,stepMatch,computerInput} from './index.js';
export const COOP_WAVES=Object.freeze([['rook','aren'],['nyra','oryn'],['kael','veyra']]);
function wave(state,index){
 const enemies=createMatch(COOP_WAVES[index].map(character=>({character,weapon:character==='kael'?'tachi':'katana'}))).fighters;
 state.fighters=[...state.fighters.slice(0,2),...enemies.map((f,i)=>({...f,id:i+2,team:1,x:1050+i*180,name:`${f.name} · Wave ${index+1}`}))];
 state.metrics=[...state.metrics.slice(0,2),...enemies.map(()=>({damage:0,hits:0,blocked:0,parries:0,punishes:0,chargePunishes:0,fieldDamage:0,links:0}))];
 state.zones=[];state.projectiles=[];state.coop.wave=index+1;state.coop.breakTicks=0;state.remainingTicks=120*60;
}
export function createCoopMatch(loadouts){const s=createMatch(loadouts,{difficulty:'medium'});s.coop={wave:1,totalWaves:COOP_WAVES.length,breakTicks:0,outcome:null};s.fighters.forEach((f,i)=>{f.team=0;f.x=300+i*150;});wave(s,0);return s;}
export function stepCoop(state,inputs=[{},{}]){
 if(state.status!=='playing')return state;
 if(state.coop.breakTicks>0){state.tick++;state.coop.breakTicks--;if(!state.coop.breakTicks)wave(state,state.coop.wave);return state;}
 const bots=state.fighters.slice(2).map(f=>computerInput(state,f.id,state.coop.wave===3?'difficult':'medium'));
 stepMatch(state,[...inputs,...bots]);
 if(state.fighters.slice(0,2).every(f=>f.hp<=0)||state.remainingTicks===0){state.status='matchOver';state.result='defeat';state.coop.outcome='defeat';}
 else if(state.fighters.slice(2).every(f=>f.hp<=0)){
  if(state.coop.wave===COOP_WAVES.length){state.status='matchOver';state.result='victory';state.coop.outcome='victory';}
  else{state.coop.breakTicks=180;const refreshed=createMatch(state.loadouts).fighters;state.fighters.slice(0,2).forEach((f,i)=>{const hp=Math.min(1000,Math.max(300,f.hp)+200);state.fighters[i]={...refreshed[i],hp,team:0,x:300+i*150};});}
 }
 return state;
}
