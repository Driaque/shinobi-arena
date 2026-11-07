import {ORIGINAL_FIGHTERS} from '../engine/originals.js';
import {RUNNING_ATLAS_DATA} from './running-atlas-data.js';

// Equipment is painted into these carry variants. Only display it when the
// actual equipped weapon and remaining belt items match the authored example.
export function runningFrameFor(f,{reduced=false}={}){
 if(!Object.hasOwn(ORIGINAL_FIGHTERS,f.character)||f.action||f.stun||f.blocking||f.crouching||f.charging||f.dash||f.awakeningFlash>0||f.hp<=0||f.y>0)return null;
 const p=f.previous??{},moving=Math.abs(f.vx??0)>.2||Math.abs(p.moveX??0)>.1||Math.abs(p.moveZ??0)>.1||Boolean(p.left)!==Boolean(p.right)||Boolean(p.depthUp)!==Boolean(p.depthDown);
 if(!moving)return null;
 const hasItem=id=>(f.items??[]).some(item=>item?.id===id&&item.count>0);
 const weapon=f.character==='silent'?'frostmereSaber':ORIGINAL_FIGHTERS[f.character].defaultWeapon;
 const armed=f.character==='silent'?(f.weapons??[]).includes('frostmereSaber')&&(f.weapons??[]).includes('oathknife')&&['frostmereSaber','oathknife'].includes(f.weapon):f.weapon===weapon;
 const equipped=armed&&hasItem('poison')&&hasItem('veilCanister');
 const step=reduced?0:Math.floor(Math.max(0,f.travel??0)/18.75)%8;
 return {frameIndex:(equipped?8:0)+step,variant:equipped?'equipped':'empty'};
}
export const runningAtlasData=id=>RUNNING_ATLAS_DATA[id];
