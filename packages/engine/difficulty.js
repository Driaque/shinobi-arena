// CPU policies change decisions, never fighter stats, costs, or cooldowns.
export const DIFFICULTIES=Object.freeze({
 easy:Object.freeze({id:'easy',name:'Easy',description:'Room to learn · short attacks and long openings',decisionTicks:12,reactionTicks:30,openingTicks:180,attackGap:90,maxCombo:1,specialEvery:4,approachTicks:50,cycleTicks:90,punish:false,replacement:false,awakening:false}),
 medium:Object.freeze({id:'medium',name:'Medium',description:'Steady pressure · two-hit combos and slower counters',decisionTicks:8,reactionTicks:16,openingTicks:90,attackGap:42,maxCombo:2,specialEvery:2,approachTicks:75,cycleTicks:90,punish:false,replacement:true,awakening:true}),
 difficult:Object.freeze({id:'difficult',name:'Difficult',description:'Fast reactions · full combos and recovery punishes',decisionTicks:6,reactionTicks:8,openingTicks:45,attackGap:20,maxCombo:3,specialEvery:1,approachTicks:90,cycleTicks:90,punish:true,replacement:true,awakening:true}),
 xtreme:Object.freeze({id:'xtreme',name:'Xtreme',description:'Relentless tactics · fast counters and tight pressure',decisionTicks:4,reactionTicks:4,openingTicks:24,attackGap:8,maxCombo:3,specialEvery:1,approachTicks:90,cycleTicks:90,punish:true,replacement:true,awakening:true})
});
export function difficultyFor(id){return Object.hasOwn(DIFFICULTIES,id)?DIFFICULTIES[id]:DIFFICULTIES.easy;}
