// Limited, one-use tactical tools. These are real-time gameplay adaptations.
export const ITEMS=Object.freeze({
 victorySmoke:{id:'victorySmoke',name:'Victory Smoke',short:'VICTORY',move:'itemSmoke',unlock:'victorySmoke',description:'Tournament finalist reward · same projectile-blocking cloud and duration as Smoke Bomb.'},
 paperBomb:{id:'paperBomb',name:'Paper Bomb',short:'BOMB',move:'itemBomb',description:'Delayed blast after 0.75 s of travel; 110 damage in a 110-unit radius. Jump, dash or guard to answer it.'},
 throwingKunai:{id:'throwingKunai',name:'Throwing Kunai',short:'KUNAI',move:'itemKunai',description:'Fast straight projectile; 45 damage. One use.'},
 throwingShuriken:{id:'throwingShuriken',name:'Shuriken Fan',short:'FAN',move:'itemShuriken',description:'Three low-damage shuriken at different heights. Can pressure guard.'},
 poison:{id:'poison',name:'Poison Vial',short:'POISON',move:'itemPoison',description:'Coat your next equipped weapon attack for up to 6 s. A clean hit poisons for 9 HP/s for 5 s; a miss or guard wastes the coating.'},
 smokeBomb:{id:'smokeBomb',name:'Smoke Bomb',short:'SMOKE',move:'itemSmoke',description:'A stationary 3 s cloud blocks ordinary enemy projectiles. Melee attacks and timed bomb blasts still work.'},
 raijinKunai:{id:'raijinKunai',name:'Flying Raijin Kunai',short:'RAIJIN',move:'itemRaijin',description:'Throw a marked kunai. Use the same slot again within 5 s of landing to warp there for 15 chakra. Cannot escape hitstun; no invulnerability.'}
});
export const ITEM_ACTIONS=Object.freeze(['swapWeapon','cycleItem','useItem']);
