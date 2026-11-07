// Limited, one-use tactical tools. These are real-time gameplay adaptations.
export const ITEMS=Object.freeze({
 laureateShroud:{id:'laureateShroud',name:'Laureate Shroud',short:'VICTORY',move:'itemSmoke',unlock:'laureateShroud',description:'Tournament finalist reward · same projectile-blocking cloud and duration as Veil Canister.'},
 cinderCharge:{id:'cinderCharge',name:'Cinder Charge',short:'BOMB',move:'itemBomb',description:'Delayed blast after 0.75 s of travel; 110 damage in a 110-unit radius. Jump, dash or guard to answer it.'},
 spikeCapsule:{id:'spikeCapsule',name:'Spike Capsule',short:'SPIKE',move:'itemSpike',description:'Fast straight projectile; 45 damage. One use.'},
 orbitPack:{id:'orbitPack',name:'Orbit Pack',short:'DISCS',move:'itemOrbit',description:'Three low-damage orbit discs at different heights. Can pressure guard.'},
 poison:{id:'poison',name:'Thorn Vial',short:'POISON',move:'itemPoison',description:'Coat your next equipped weapon attack for up to 6 s. A clean hit poisons for 9 HP/s for 5 s; a miss or guard wastes the coating.'},
 veilCanister:{id:'veilCanister',name:'Veil Canister',short:'SMOKE',move:'itemSmoke',description:'A stationary 3 s cloud blocks ordinary enemy projectiles. Melee attacks and timed bomb blasts still work.'},
 waypointAnchor:{id:'waypointAnchor',name:'Waypoint Anchor',short:'ANCHOR',move:'itemWaypoint',description:'Throw a marked anchor. Use the same slot again within 5 s of landing to warp there for 15 chakra. Cannot escape hitstun; no invulnerability.'}
});
export const ITEM_ACTIONS=Object.freeze(['swapWeapon','cycleItem','useItem']);
