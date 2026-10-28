import { ACTIONS } from './index.js';
export const SETTINGS_VERSION = 4;
export const STORAGE_KEY = 'shinobi-arena.controls.v1';
export const CONTROL_IDS = Object.freeze(['stick', ...ACTIONS.filter(a => !['left','right','crouch'].includes(a))]);
export const DEFAULT_KEYS = Object.freeze([
  {KeyS:'crouch',KeyA:'left',KeyD:'right',KeyW:'jump',KeyJ:'attack',KeyK:'block',KeyU:'special1',KeyI:'special2',KeyH:'weapon',KeyO:'bloodline',KeyR:'replacement',KeyQ:'dashBack',KeyE:'dashForward',KeyT:'awakening'},
  {ArrowDown:'crouch',ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',KeyN:'attack',KeyM:'block',Comma:'special1',Period:'special2',KeyB:'weapon',Slash:'bloodline',KeyV:'replacement',KeyY:'awakening',BracketLeft:'dashBack',BracketRight:'dashForward'}
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
    replacement:[width-107,height-190,48],special1:[width-205,height-85,52],special2:[width-185,height-162,52],bloodline:[width-258,height-180,48],awakening:[left+235,height-40,54]
  };
  return Object.fromEntries(CONTROL_IDS.map(id=>[id,{x:px[id][0]/width,y:px[id][1]/height,size:px[id][2]}]));
}
export const CONTROL_DECK_HEIGHT=136;
export function defaultDockLayout(width,height){
  const px={stick:[65,height-67,96],dashBack:[145,height-103,48],dashForward:[201,height-103,48],jump:[165,height-39,52],awakening:[245,height-39,52],attack:[width-39,height-39,56],weapon:[width-105,height-39,48],block:[width-165,height-39,48],special1:[width-225,height-39,48],replacement:[width-39,height-103,48],bloodline:[width-105,height-103,48],special2:[width-165,height-103,48]};
  return Object.fromEntries(CONTROL_IDS.map(id=>[id,{x:px[id][0]/width,y:px[id][1]/height,size:px[id][2]}]));
}
export function projectControl(control,width,height,id,placement='overlay') {
  const maxSize=Math.max(id==='stick'?88:48,Math.min(id==='stick'?(placement==='dock'?120:160):90,height-108));
  const size=clamp(control.size,id==='stick'?88:48,maxSize),r=size/2;
  return {x:clamp(control.x*width,8+r,Math.max(8+r,width-8-r)),y:clamp(control.y*height,placement==='dock'?height-CONTROL_DECK_HEIGHT+4+r:82+r,Math.max(82+r,height-8-r)),size};
}
export function layoutOverlaps(layout,width,height,placement='overlay') {
  const projected=CONTROL_IDS.map(id=>({id,...projectControl(layout[id],width,height,id,placement)}));
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
export function freshSettings() {return {version:SETTINGS_VERSION,opacity:.65,placement:'dock',dockLayouts:{},keys:DEFAULT_KEYS.map(map=>({...map})),layouts:{}};}
export function readSettings(raw) {
  const fallback=freshSettings();
  try {
    const value=JSON.parse(raw);
    if(![1,2,3,SETTINGS_VERSION].includes(value?.version))return fallback;
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
    if(value.version===1){
      for(const [i,code]of ['KeyT','KeyY'].entries())if(!Object.values(keys[i]).includes('awakening')&&!used.has(code)){keys[i][code]='awakening';used.add(code);}
    }
    if(value.version<3)for(const [code,action]of [['BracketLeft','dashBack'],['BracketRight','dashForward']])if(!Object.values(keys[1]).includes(action)&&!used.has(code)){keys[1][code]=action;used.add(code);}
    if(value.version<4)for(const [i,code]of ['KeyS','ArrowDown'].entries())if(!Object.values(keys[i]).includes('crouch')&&!used.has(code)){keys[i][code]='crouch';used.add(code);}
    const layouts={};
    for(const profile of ['small','medium','large']){
      const candidate=value.layouts?.[profile];if(!candidate)continue;
      const layout={};
      for(const id of CONTROL_IDS){
        const size=profile==='small'?[627,287]:profile==='medium'?[804,302]:[1238,684];
        const c=candidate[id]??(value.version===1&&id==='awakening'?defaultLayout(...size).awakening:null);
        if(!c||![c.x,c.y,c.size].every(Number.isFinite))throw new Error('Invalid layout');
        layout[id]={x:clamp(c.x,0,1),y:clamp(c.y,0,1),size:clamp(c.size,id==='stick'?88:48,id==='stick'?160:90)};
      }
      if(value.version===1&&!candidate.awakening){
        const [width,height]=profile==='small'?[627,287]:profile==='medium'?[804,302]:[1238,684];
        if(layoutOverlaps(layout,width,height).some(pair=>pair.includes('awakening'))){
          const desired=projectControl(layout.awakening,width,height,'awakening'),points=[];
          for(let y=height-35;y>=110;y-=24)for(let x=35;x<width-35;x+=24)points.push({x,y});
          points.sort((a,b)=>Math.hypot(a.x-desired.x,a.y-desired.y)-Math.hypot(b.x-desired.x,b.y-desired.y));
          for(const point of points){
            const trial={...layout,awakening:{x:point.x/width,y:point.y/height,size:54}};
            if(!layoutOverlaps(trial,width,height).some(pair=>pair.includes('awakening'))){layout.awakening=trial.awakening;break;}
          }
        }
      }
      layouts[profile]=layout;
    }
    const dockLayouts={};
    for(const profile of ['small','medium','large']){
      const candidate=value.dockLayouts?.[profile];if(!candidate)continue;
      const result={};for(const id of CONTROL_IDS){const c=candidate[id];if(!c||![c.x,c.y,c.size].every(Number.isFinite))throw new Error('Invalid dock layout');result[id]={x:clamp(c.x,0,1),y:clamp(c.y,0,1),size:clamp(c.size,id==='stick'?88:48,id==='stick'?120:90)};}dockLayouts[profile]=result;
    }
    return {version:SETTINGS_VERSION,keys,layouts,dockLayouts,opacity:Number.isFinite(value.opacity)?clamp(value.opacity,.25,1):.65,placement:value.placement==='overlay'?'overlay':'dock'};
  }catch{return fallback;}
}
export function keyLabel(code) {
  if(!code)return 'Unbound';
  return code.replace(/^Key/,'').replace(/^Digit/,'').replace(/^Arrow/,'').replace(/^Numpad/,'Num ').replace('Comma',',').replace('Period','.').replace('Slash','/');
}
export function keyForAction(keys,player,action) {return Object.keys(keys[player]).find(k=>keys[player][k]===action)??null;}

