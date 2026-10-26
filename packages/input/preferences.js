import { ACTIONS } from './index.js';
export const SETTINGS_VERSION = 1;
export const STORAGE_KEY = 'shinobi-arena.controls.v1';
export const CONTROL_IDS = Object.freeze(['stick', ...ACTIONS.filter(a => !['left','right'].includes(a))]);
export const DEFAULT_KEYS = Object.freeze([
  {KeyA:'left',KeyD:'right',KeyW:'jump',KeyJ:'attack',KeyK:'block',KeyU:'special1',KeyI:'special2',KeyH:'weapon',KeyO:'bloodline',KeyR:'replacement',KeyQ:'dashBack',KeyE:'dashForward'},
  {ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',KeyN:'attack',KeyM:'block',Comma:'special1',Period:'special2',KeyB:'weapon',Slash:'bloodline',KeyV:'replacement'}
]);
const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
export function stickVector(dx,dy,radius,deadZone=.18) {
  if(![dx,dy,radius,deadZone].every(Number.isFinite)||radius<=0||deadZone<0||deadZone>=1)throw new Error('Invalid stick coordinates');
  const distance=Math.hypot(dx,dy),normalized=Math.min(1,distance/radius);
  if(normalized<=deadZone)return {x:0,y:0};
  const strength=(normalized-deadZone)/(1-deadZone);
  return {x:dx/distance*strength,y:dy/distance*strength};
}
export function layoutProfile(width) {return width<720?'small':width<1000?'medium':'large';}
export function defaultLayout(width,height) {
  const left=Math.min(105,width*.14),bottom=height-68;
  const px={
    stick:[left,bottom,112], jump:[left+135,height-40,52], dashBack:[left-52,height-170,48],dashForward:[left+110,height-165,48],
    attack:[width-65,height-55,64],weapon:[width-142,height-36,52],block:[width-37,height-140,48],
    replacement:[width-107,height-190,48],special1:[width-205,height-85,52],special2:[width-185,height-162,52],bloodline:[width-258,height-180,48]
  };
  return Object.fromEntries(CONTROL_IDS.map(id=>[id,{x:px[id][0]/width,y:px[id][1]/height,size:px[id][2]}]));
}
export function projectControl(control,width,height,id) {
  const maxSize=Math.max(id==='stick'?88:48,Math.min(id==='stick'?160:90,height-108));
  const size=clamp(control.size,id==='stick'?88:48,maxSize),r=size/2;
  return {x:clamp(control.x*width,8+r,Math.max(8+r,width-8-r)),y:clamp(control.y*height,82+r,Math.max(82+r,height-8-r)),size};
}
export function layoutOverlaps(layout,width,height) {
  const projected=CONTROL_IDS.map(id=>({id,...projectControl(layout[id],width,height,id)}));
  const collisions=[];
  for(let i=0;i<projected.length;i++)for(let j=i+1;j<projected.length;j++){
    const a=projected[i],b=projected[j];
    if(Math.hypot(a.x-b.x,a.y-b.y)<(a.size+b.size)/2+3)collisions.push([a.id,b.id]);
  }
  return collisions;
}
export const validKey = code => typeof code==='string' && /^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|Arrow(Left|Right|Up|Down)|Space|Enter|Backspace|Shift(Left|Right)|Comma|Period|Slash|Semicolon|Quote|BracketLeft|BracketRight|Backquote|Minus|Equal)$/.test(code) && code!=='KeyP';
export function rebind(keys,player,action,code) {
  if(![0,1].includes(player)||!ACTIONS.includes(action))throw new Error('Invalid binding');
  if(code!==null&&!validKey(code))throw new Error('That key is reserved or unsupported. P and Escape pause; Tab navigates.');
  if(code!==null&&keys.some((map,i)=>map[code]&&(i!==player||map[code]!==action)))throw new Error('That key is already used. Clear its other binding first.');
  const result=keys.map(map=>({...map}));
  for(const [key,bound] of Object.entries(result[player]))if(bound===action)delete result[player][key];
  if(code!==null)result[player][code]=action;
  return result;
}
export function freshSettings() {return {version:SETTINGS_VERSION,keys:DEFAULT_KEYS.map(map=>({...map})),layouts:{}};}
export function readSettings(raw) {
  const fallback=freshSettings();
  try {
    const value=JSON.parse(raw);
    if(value?.version!==SETTINGS_VERSION)return fallback;
    const keys=[{},{}],used=new Set();
    if(!Array.isArray(value.keys)||value.keys.length!==2)throw new Error('Invalid keys');
    value.keys.forEach((map,i)=>{
      if(!map||typeof map!=='object'||Array.isArray(map))throw new Error('Invalid keys');
      const actions=new Set();
      for(const [code,action] of Object.entries(map)){
        if(!validKey(code)||!ACTIONS.includes(action)||used.has(code)||actions.has(action))throw new Error('Invalid keys');
        keys[i][code]=action;used.add(code);actions.add(action);
      }
    });
    const layouts={};
    for(const profile of ['small','medium','large']){
      const candidate=value.layouts?.[profile];if(!candidate)continue;
      const layout={};
      for(const id of CONTROL_IDS){
        const c=candidate[id];
        if(!c||![c.x,c.y,c.size].every(Number.isFinite))throw new Error('Invalid layout');
        layout[id]={x:clamp(c.x,0,1),y:clamp(c.y,0,1),size:clamp(c.size,id==='stick'?88:48,id==='stick'?160:90)};
      }
      layouts[profile]=layout;
    }
    return {version:SETTINGS_VERSION,keys,layouts};
  }catch{return fallback;}
}
export function keyLabel(code) {
  if(!code)return 'Unbound';
  return code.replace(/^Key/,'').replace(/^Digit/,'').replace(/^Arrow/,'').replace(/^Numpad/,'Num ').replace('Comma',',').replace('Period','.').replace('Slash','/');
}
export function keyForAction(keys,player,action) {return Object.keys(keys[player]).find(k=>keys[player][k]===action)??null;}
