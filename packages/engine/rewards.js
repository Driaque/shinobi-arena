export const TOURNAMENT_REWARDS=Object.freeze({champion:{points:100,unlocks:['championKatana']},finalist:{points:40,unlocks:['victorySmoke']},participant:{points:10,unlocks:[]}});
export const REWARD_ITEMS=Object.freeze({championKatana:{name:'Champion’s Katana',kind:'weapon',base:'katana'},victorySmoke:{name:'Victory Smoke',kind:'item',base:'smokeBomb'}});
export function requiredUnlocks(profile){return [...new Set([...(profile.weapons??[profile.weapon]),...(profile.items??[])].filter(id=>Object.hasOwn(REWARD_ITEMS,id)))];}
