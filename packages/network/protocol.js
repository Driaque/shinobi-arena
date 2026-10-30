import {ACTIONS} from '../input/index.js';
import {CHARACTERS,WEAPONS,validateLoadout,RULES_VERSION} from '../engine/index.js';
export const PROTOCOL_VERSION=7;
export {RULES_VERSION};
export function playerProfile(value){
  if(!value||typeof value.name!=='string')throw new Error('Enter a player name.');
  const name=value.name.trim().replace(/\s+/gu,' ');
  if([...name].length<2||[...name].length>20||! /^[\p{L}\p{N} _.-]+$/u.test(name))throw new Error('Use 2–20 letters, numbers, spaces, dots, underscores or hyphens for your name.');
  if(!Object.hasOwn(CHARACTERS,value.character)||!Object.hasOwn(WEAPONS,value.weapon))throw new Error('Choose a valid fighter and weapon.');
  return {name,...validateLoadout(value)};
}
export function cleanInput(value){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid input.');
  const input={};
  for(const key of ACTIONS)input[key]=value[key]===true;
  for(const key of ['aimX','aimZ'])if(Number.isFinite(value[key]))input[key]=Math.max(-1,Math.min(1,value[key]));
  input.moveZ=Number.isFinite(value.moveZ)?Math.max(-1,Math.min(1,value.moveZ)):0;
  input.moveX=Number.isFinite(value.moveX)?Math.max(-1,Math.min(1,value.moveX)):0;
  input.pressedActions=Array.isArray(value.pressedActions)?[...new Set(value.pressedActions.filter(k=>ACTIONS.includes(k)))]:[];
  for(const key of input.pressedActions)input[key]=true;
  if(value.dashDirection===1||value.dashDirection===-1)input.dashDirection=value.dashDirection;
  return input;
}
