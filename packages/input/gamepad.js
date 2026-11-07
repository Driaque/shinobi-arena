// Standard physical positions; browsers normalize supported Xbox/PlayStation pads.
export const PAD_DEFAULTS=Object.freeze(['jump','weapon','attack','dashForward','block','abilities','replacement','charge','cycleItem','pause','swapWeapon','awakening','depthUp','crouch','dashBack','useItem']);
export const PAD_ABILITIES=Object.freeze({0:'special1',1:'special2',2:'bloodline',3:'jutsu4',12:'jutsu5',13:'jutsu6',14:'jutsu7'});
export function padIntent(pad,{deadZone=.18,sensitivity=1}={}){
 const axis=n=>{const v=Number.isFinite(pad.axes?.[n])?pad.axes[n]:0;return Math.abs(v)<=deadZone?0:Math.sign(v)*Math.min(1,(Math.abs(v)-deadZone)/(1-deadZone)*sensitivity);};
 return {moveX:axis(0),moveZ:axis(1),aimX:axis(2),aimZ:axis(3),buttons:Array.from({length:Math.max(16,pad.buttons?.length??0)},(_,i)=>Boolean(pad.buttons?.[i]?.pressed||pad.buttons?.[i]?.value>.5))};
}
export function createGamepads({inputs,settings,isPlaying,isLocal,onPause,onActivity=()=>{},onConnection=()=>{},onMenu=()=>{},bindings=()=>PAD_DEFAULTS,abilityBindings=()=>PAD_ABILITIES,getPads=()=>navigator.getGamepads?.()??[],isFocused=()=>true}){
 const slots=[null,null],previous=new Map(),blocked=[new Set(),new Set()];
 const release=i=>{inputs[i].cancelSources(source=>String(source).startsWith(`pad:${i}:`));};
 return {poll(){
  let available=[];try{available=Array.from(getPads()).filter(p=>p?.connected);}catch{}
  // Keep physical indexes assigned across disconnects: P2 must never become P1.
  for(const pad of available)if(!slots.includes(pad.index??0)){let slot=slots.indexOf(null);if(slot===-1)slot=slots.findIndex(index=>!available.some(p=>(p.index??0)===index));if(slot!==-1)slots[slot]=pad.index??0;}
  const map=bindings();
  for(let i=0;i<2;i++){
   const pad=available.find(p=>(p.index??0)===slots[i]),old=previous.get(i),intent=pad?padIntent(pad,settings()):null;
   if(Boolean(pad)!==Boolean(old?.pad)||pad?.id!==old?.pad?.id||pad?.index!==old?.pad?.index)onConnection(i,pad??null);
   const eligible=i===0||isLocal(),focused=isFocused();
   const fresh=intent?.buttons.map((down,b)=>down&&!old?.intent?.buttons[b])??[];
   const moved=intent&&['moveX','moveZ','aimX','aimZ'].some(k=>Math.abs(intent[k]-(old?.intent?.[k]??0))>.12&&Math.abs(intent[k])>.15);
   if(pad&&eligible&&focused&&(fresh.some(Boolean)||moved))onActivity(i,pad);
   const playing=Boolean(pad&&eligible&&focused&&isPlaying());
   // Release old bindings before pressing new ones so layer changes never stick.
   const shift=intent?.buttons.some((down,b)=>down&&map[b]==='abilities');
   if(old&&!old.playing&&playing)intent.buttons.forEach((down,b)=>{if(down&&old.intent?.buttons[b])blocked[i].add(b);});
   intent?.buttons.forEach((down,b)=>{if(!down)blocked[i].delete(b);});
   const actions=playing?intent.buttons.map((down,b)=>down&&!blocked[i].has(b)?(shift?abilityBindings()[b]:map[b]):null):[];
   for(let b=0;b<Math.max(16,old?.actions?.length??0,actions.length);b++){
    const source=`pad:${i}:${b}`,action=actions[b];
    if(old?.actions?.[b]!==action)inputs[i].release(source);
    if(action&&action!=='pause'&&action!=='abilities')inputs[i].press(action,source);
   }
   inputs[i].setAxis(`pad:${i}:move`,playing?intent.moveX:0);inputs[i].setDepth(`pad:${i}:move`,playing?intent.moveZ:0);
   if(playing&&(intent.aimX||intent.aimZ))inputs[i].aim(intent.aimX,intent.aimZ,`pad:${i}:aim`);
   if(!playing)release(i);
   // Pause is edge-triggered and must not also activate the menu opened by it.
   if(pad&&eligible&&focused){if(playing){if(fresh.some((down,b)=>down&&map[b]==='pause'))onPause();}else onMenu({slot:i,pad,intent,fresh,moved});}
   previous.set(i,{pad:pad?{id:pad.id,index:pad.index}:null,intent,actions,playing});
  }
 },reset(){for(let i=0;i<2;i++)release(i);},slots};
}
