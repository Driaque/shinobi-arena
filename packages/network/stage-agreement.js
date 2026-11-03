import {STAGES,resolveStage} from '../engine/stages.js';
export function stageChoices(preferences){return [...new Set(preferences.map(id=>id==='random'||STAGES.some(s=>s.id===id)?id:'skyglass'))];}
export function agreeStage(preferences,votes,random=Math.random){
 const choices=stageChoices(preferences);if(votes.length!==2||votes.some(v=>!v)||votes[0]!==votes[1])return null;
 const pick=votes[0];if(pick==='between'&&choices.length>1)return resolveStage(choices[Math.min(choices.length-1,Math.floor(random()*choices.length))],random);
 return choices.includes(pick)?resolveStage(pick,random):null;
}
