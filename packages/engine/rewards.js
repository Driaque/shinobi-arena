export const TOURNAMENT_REWARDS=Object.freeze({champion:{points:100,unlocks:['concordLaureate']},finalist:{points:40,unlocks:['laureateShroud']},participant:{points:10,unlocks:[]}});
export const REWARD_ITEMS=Object.freeze({concordLaureate:{name:'Concord Laureate',kind:'weapon',base:'skyforgedBlade'},laureateShroud:{name:'Laureate Shroud',kind:'item',base:'veilCanister'}});
export function requiredUnlocks(profile){return [...new Set([...(profile.weapons??[profile.weapon]),...(profile.items??[])].filter(id=>Object.hasOwn(REWARD_ITEMS,id)))];}
