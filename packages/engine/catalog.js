import {migrateLoadout} from './legacy-content.js';
import {EXTRA_MOVES,SHARED_TECHNIQUES,effectDescription,moveEnvironment} from './techniques.js';
import {ITEMS} from './items.js';
import {ORIGINAL_FIGHTERS} from './originals.js';
export {ITEMS};
import {FUTURE_FIGHTERS} from './future-fighters.js';
export const CHARACTERS=Object.freeze({...FUTURE_FIGHTERS,...ORIGINAL_FIGHTERS});
export const WEAPONS = Object.freeze({
  concordLaureate:{id:'concordLaureate',name:'Concord Laureate',move:'skyforgedBlade',unlock:'concordLaureate',description:'Tournament champion reward · gold finish · same stats as Skyforged Blade'},
  tideglassFans:{id:'tideglassFans',name:'Tideglass Fans',move:'fanStrike',description:'Sweeping metal tideglassFans · 85 damage · 145 reach'},
  conduitSpike:{ id:'conduitSpike',name:'Conduit Spike',move:'conduitSpike',description:'Quick close-range thrust · 75 damage' },
  orbitDisc:{ id:'orbitDisc',name:'Orbit Disc',move:'orbitDisc',description:'Ranged throw · 55 damage · no chakra cost' },
  frostmereSaber:{id:'frostmereSaber',name:'Frostmere Saber',move:'frostmereSaber',description:'Metal sword · 105 damage · deliberate recovery'},
  oathknife:{id:'oathknife',name:'Oathknife',move:'oathknife',description:'Fast metal dagger · 65 damage · short reach'},
  skyforgedBlade:{ id:'skyforgedBlade',name:'Skyforged Blade',move:'skyforgedBlade',description:'Long reach, slower recovery · 100 damage' }
});
const strike=(name,overrides={})=>({name,startup:10,active:5,recovery:23,damage:110,reach:140,cost:25,knockback:32,cooldown:150,...overrides});
const projectile=(name,overrides={})=>strike(name,{startup:16,active:1,recovery:26,reach:0,projectile:true,speed:12,life:85,...overrides});
export const AWAKENINGS=Object.freeze({
 limitRelease:{name:'Limit Release',color:'#7af1e4',threshold:400,duration:600,damage:1.1,speed:1.1,chainSpeed:1.15,defence:1,regen:.06,overrides:{special1:'royalGale',special2:'releasedTempest'}},
 coldMetal:{name:'Cold Metal Ascendant',chainSpeed:1.25,proposed:true,color:'#a3ddf3',threshold:400,duration:600,damage:1.15,speed:1.08,defence:.85,regen:.06,overrides:{special1:'ascendantSlash',special2:'ascendantRift'}},
 frozenSun:{name:'Frozen Sun Dominion',chainSpeed:1.25,proposed:true,color:'#ff627f',threshold:400,duration:600,damage:1.15,speed:1.2,defence:.95,regen:.08,overrides:{special1:'dominionRimeflash',special2:'dominionDrain'}},
 sunforge:{name:'Sunforge Ascendant',color:'#ffad42',threshold:400,duration:600,damage:1.2,speed:1.12,defence:.9,regen:.08,overrides:{special1:'sunforgeDrive',special2:'sunforgeRend'}},
 colossusMantle:{name:'Colossus Mantle',color:'#ba8cf0',threshold:450,duration:600,damage:1.15,speed:.95,defence:.75,regen:.06,overrides:{}},
 gates:{name:'Ironstep Overdrive',color:'#7ae2a6',threshold:400,duration:480,damage:1.3,speed:1.3,defence:1,regen:.035,overrides:{}},
 prismOverdrive:{name:'Prism Overdrive',color:'#69caff',threshold:400,duration:600,damage:1.2,speed:1.15,defence:.9,regen:.1,overrides:{special1:'prismaticDrive'}},
 cinderOverdrive:{name:'Cinder Overdrive',color:'#f48c79',threshold:400,duration:600,damage:1.2,speed:1.1,defence:.85,regen:.08,overrides:{}},
 tempestAttunement:{name:'Tempest Attunement',color:'#8bedd5',threshold:400,duration:600,damage:1.15,speed:1.25,defence:.9,regen:.1,overrides:{}}
});
export const MOVES = Object.freeze({
  ...EXTRA_MOVES,
  sovereignRebuke:strike('Sovereign Rebuke',{startup:15,active:5,recovery:30,damage:90,reach:240,cost:35,cooldown:300,knockback:130,element:'wind',color:'#cbb6ed'}),
  eventideGrasp:strike('Eventide Grasp',{startup:17,active:5,recovery:28,damage:45,reach:300,cost:30,cooldown:300,knockback:0,pull:180,hitstun:20,element:'chakra',color:'#b9a4db'}),
  glasswingVolley:projectile('Glasswing Volley',{startup:16,damage:28,cost:30,cooldown:240,fan:true,pierce:.2,element:'wind',color:'#e5e1d2'}),
  prismTether:projectile('Prism Tether',{startup:18,damage:30,cost:30,cooldown:330,effect:'bind',duration:45,potency:1,knockback:0,element:'wind',color:'#e5e1d2'}),
  resonanceDrone:projectile('Resonance Drone',{startup:20,damage:100,cost:30,cooldown:270,speed:6,life:36,blast:85,element:'earth',color:'#e9cfaa'}),
  shardMinefield:strike('Shard Minefield',{startup:25,active:1,recovery:30,damage:0,reach:0,cost:35,cooldown:420,utility:true,ground:{element:'earth',effect:'burn',potency:6,radius:125,duration:240}}),
  airAttack1:strike('Aerial opening strike',{startup:5,active:4,recovery:16,damage:55,reach:115,cost:0,knockback:7,cooldown:0,hitstun:23,launch:4,aerial:'air',airCombo:true}),
  airAttack2:strike('Aerial cross strike',{startup:5,active:4,recovery:18,damage:45,reach:125,cost:0,knockback:8,cooldown:0,hitstun:24,launch:4,aerial:'air',airCombo:true}),
  airAttack3:strike('Aerial falling finisher',{startup:7,active:5,recovery:24,damage:75,reach:145,cost:0,knockback:35,cooldown:0,hitstun:18,spike:true,aerial:'air'}),
  doraFan1:strike('Dora · Rippling Fan',{startup:5,active:4,recovery:13,damage:65,reach:100,cost:0,knockback:24,cooldown:0,fanStrike:true,element:'metal',color:'#79dce0'}),
  doraFan2:strike('Dora · Crossing Breeze',{startup:5,active:4,recovery:15,damage:50,reach:115,cost:0,knockback:10,cooldown:0,hitstun:20,fanStrike:true,element:'wind',color:'#79dce0'}),
  doraFan3:strike('Dora · Royal Ascent',{startup:8,active:4,recovery:24,damage:90,reach:140,cost:0,knockback:60,cooldown:0,launch:10,hitstun:22,fanStrike:true,element:'wind',color:'#79dce0'}),
  fanStrike:strike('Bladed Fan Sweep',{startup:9,active:5,recovery:23,damage:85,reach:145,cost:0,knockback:30,cooldown:45,fanStrike:true,element:'metal',color:'#a8eceb'}),
  tidalEdict:projectile('Tidal Edict',{damage:65,cost:25,startup:16,recovery:25,speed:11,life:65,cooldown:210,effect:'weaken',duration:180,potency:.25,element:'water',color:'#70dfe7'}),
  royalTempest:strike('Royal Tempest · Undertow',{damage:35,startup:20,active:4,recovery:32,reach:280,cost:40,cooldown:360,knockback:0,pull:150,hitstun:12,effect:'weaken',duration:150,potency:.2,followUp:'tempestFinish',element:'wind',color:'#7ce8d9'}),
  tempestFinish:strike('Royal Tempest · Crown Breaker',{damage:130,startup:18,active:5,recovery:32,reach:170,cost:0,cooldown:0,knockback:65,launch:9,fanStrike:true,element:'fire',color:'#f8b878'}),
  triuneFlow:strike('Triune Flow',{startup:8,active:1,recovery:15,damage:0,reach:0,cost:30,buff:'aquaGuard',duration:180,cooldown:480}),
  royalGale:projectile('Limit Release · Royal Gale',{damage:90,cost:25,startup:13,recovery:25,speed:14,life:65,cooldown:210,effect:'burn',duration:180,potency:9,element:'fire',color:'#ffb875'}),
  releasedTempest:strike('Limit Release · Sovereign Vortex',{damage:45,startup:18,active:4,recovery:32,reach:300,cost:40,cooldown:360,knockback:0,pull:170,hitstun:12,effect:'weaken',duration:150,potency:.2,followUp:'releasedFinish',element:'wind',color:'#9ef5e6'}),
  releasedFinish:strike('Limit Release · Blazing Crown',{damage:145,startup:18,active:5,recovery:32,reach:180,cost:0,cooldown:0,knockback:70,launch:10,fanStrike:true,effect:'burn',duration:180,potency:9,element:'fire',color:'#ffb875'}),
  swapWeapon:strike('Change weapon',{startup:4,active:1,recovery:12,damage:0,reach:0,cost:0,cooldown:0,inventoryEffect:'swap'}),
  itemBomb:projectile('Cinder Charge',{startup:18,recovery:26,damage:110,cost:0,cooldown:90,speed:4,life:45,blast:110,pierce:.25,color:'#ffbd70'}),
  itemSpike:projectile('Spike Capsule',{startup:6,recovery:16,damage:45,cost:0,cooldown:90,speed:17,life:45,color:'#d7e6ee'}),
  itemOrbit:projectile('Orbit Pack',{startup:10,recovery:22,damage:25,cost:0,cooldown:90,speed:15,life:50,fan:true,color:'#c6d9e8'}),
  itemPoison:strike('Coat weapon',{startup:10,active:1,recovery:18,damage:0,reach:0,cost:0,cooldown:90,inventoryEffect:'poison'}),
  itemSmoke:strike('Veil Canister',{startup:8,active:1,recovery:20,damage:0,reach:0,cost:0,cooldown:90,inventoryEffect:'smoke'}),
  itemWaypoint:projectile('Waypoint Anchor',{startup:12,recovery:22,damage:35,cost:0,cooldown:90,speed:13,life:40,mark:true,color:'#ffd879'}),
  waypointWarp:strike('Waypoint · Warp',{startup:8,active:1,recovery:22,damage:0,reach:0,cost:15,cooldown:90,inventoryEffect:'warp'}),
  silentSlash1:strike('Silent · Opening Cut',{startup:5,active:4,recovery:13,damage:65,reach:100,cost:0,knockback:24,cooldown:0,sword:true,element:'metal'}),
  silentSlash2:strike('Silent · Returning Edge',{startup:5,active:4,recovery:15,damage:50,reach:115,cost:0,knockback:10,cooldown:0,hitstun:20,sword:true,element:'metal'}),
  silentSlash3:strike('Silent · Rising Steel',{startup:8,active:4,recovery:24,damage:90,reach:140,cost:0,knockback:60,cooldown:0,launch:10,hitstun:22,sword:true,element:'metal'}),
  wintaSlash1:strike('Winta · Spark Cut',{startup:5,active:4,recovery:13,damage:65,reach:100,cost:0,knockback:24,cooldown:0,sword:true,element:'lightning',color:'#ff879b'}),
  wintaSlash2:strike('Winta · Crossing Current',{startup:5,active:4,recovery:15,damage:50,reach:115,cost:0,knockback:10,cooldown:0,hitstun:20,sword:true,element:'lightning',color:'#ff879b'}),
  wintaSlash3:strike('Winta · Storm Rise',{startup:8,active:4,recovery:24,damage:90,reach:140,cost:0,knockback:60,cooldown:0,launch:10,hitstun:22,sword:true,element:'lightning',color:'#ff879b'}),
  harmoniousSlash:strike('Harmonious Slash',{damage:125,startup:9,reach:165,pierce:.5,sword:true,element:'metal',color:'#a3ddf3'}),
  echoingRift:strike('Echoing Rift',{damage:70,startup:16,reach:270,knockback:0,pull:90,effect:'metalVulnerable',duration:180,potency:.2,cost:30,element:'metal',color:'#a3ddf3'}),
  skyforgedAegis:strike('Skyforged Aegis · Middle Guard',{startup:8,active:1,recovery:15,damage:0,reach:0,cost:30,buff:'skyforgedAegis',duration:180,cooldown:480}),
  rimeflash:strike('Rimeflash',{damage:125,startup:9,active:8,dash:12,reach:130,cost:25,energyDrain:8,sword:true,element:'lightning',color:'#ff627f'}),
  eclipseDrain:strike('Eclipse Drain',{damage:100,startup:13,reach:160,cost:30,lifesteal:.35,energyDrain:12,element:'water',color:'#ae8ee8'}),
  stormheart:strike('Stormheart',{startup:8,active:1,recovery:15,damage:0,reach:0,cost:30,buff:'stormheart',duration:300,cooldown:600}),
  ascendantSlash:strike('Ascendant · Harmonious Slash',{damage:145,startup:7,reach:180,pierce:.5,sword:true,element:'metal',color:'#a3ddf3'}),
  ascendantRift:strike('Ascendant · Echoing Rift',{damage:85,startup:13,reach:300,knockback:0,pull:110,effect:'metalVulnerable',duration:180,potency:.2,cost:30,element:'metal',color:'#a3ddf3'}),
  dominionRimeflash:strike('Dominion · Rimeflash',{damage:145,startup:7,active:8,dash:15,reach:145,cost:25,energyDrain:8,sword:true,element:'lightning',color:'#ff627f'}),
  dominionDrain:strike('Dominion · Eclipse Drain',{damage:115,startup:11,reach:180,cost:30,lifesteal:.4,energyDrain:15,element:'water',color:'#ff627f'}),
  frostmereSaber:strike('Frostmere Saber slash',{startup:11,active:5,recovery:25,damage:105,reach:165,cost:0,knockback:38,cooldown:50,sword:true,element:'metal'}),
  oathknife:strike('Oathknife cut',{startup:5,active:4,recovery:13,damage:65,reach:100,cost:0,knockback:20,cooldown:30,sword:true,element:'metal'}),
  attack:{name:'Basic attack',startup:5,active:4,recovery:13,damage:65,reach:90,cost:0,knockback:24},
  attack2:strike('Combo body strike',{startup:5,active:4,recovery:15,damage:50,reach:105,cost:0,knockback:10,cooldown:0,hitstun:20}),
  attack3:strike('Combo launching kick',{startup:8,active:4,recovery:24,damage:90,reach:130,cost:0,knockback:60,cooldown:0,launch:10,hitstun:22}),
  special1:{name:'Spiral Drive',startup:12,active:9,recovery:24,damage:150,reach:118,cost:30,knockback:62,dash:11,cooldown:120},
  voltaicLance:{name:'Voltaic Lance',startup:12,active:9,recovery:24,damage:150,reach:118,cost:30,knockback:62,dash:11,pierce:1,cooldown:150},
  clone:{name:'Echo Formation',startup:16,active:7,recovery:24,damage:120,reach:210,cost:35,knockback:42,cooldown:180},
  fireball:{name:'Fireball',startup:17,active:1,recovery:28,damage:110,reach:0,cost:25,knockback:38,projectile:true,speed:12,life:100,effect:'burn',duration:240,potency:12,cooldown:180},
  prismRam:{name:'Prism Ram',startup:10,active:6,recovery:24,damage:135,reach:125,cost:30,knockback:35,pierce:1,cooldown:150},
  pulsebreaker:{name:'Pulsebreaker',startup:8,active:5,recovery:22,damage:85,reach:115,cost:25,knockback:25,effect:'weaken',duration:240,potency:0.3,cooldown:180},
  thornlash:{name:'Thornlash',startup:14,active:7,recovery:26,damage:95,reach:230,cost:30,knockback:30,effect:'poison',duration:360,potency:9,cooldown:180},
  fivefoldLock:{name:'Fivefold Lock',startup:12,active:5,recovery:26,damage:70,reach:130,cost:25,knockback:24,effect:'weaken',duration:300,potency:0.3,cooldown:240},
  dissonanceMark:{name:'Dissonance Mark',startup:18,active:3,recovery:26,damage:30,reach:300,cost:40,knockback:0,effect:'weaken',duration:300,potency:0.3,cooldown:600},
  fractureLens:{name:'Fracture Lens',startup:8,active:1,recovery:15,damage:0,reach:0,cost:35,knockback:0,buff:'fractureLens',duration:300,cooldown:600},
  conduitSpike:{name:'Conduit Spike thrust',startup:6,active:4,recovery:16,damage:75,reach:110,cost:0,knockback:28,cooldown:35},
  orbitDisc:{name:'Orbit Disc throw',startup:8,active:1,recovery:18,damage:55,reach:0,cost:0,knockback:20,projectile:true,speed:14,life:65,cooldown:40},
  stormNeedle:strike('Storm Needle',{damage:135,pierce:1,dash:9,startup:11,active:7}),
  arcSentinel:projectile('Arc Sentinel',{damage:95,pierce:.5,cost:30,color:'#85cfff'}),
  dawnforgeImpact:strike('Dawnforge Impact',{damage:155,startup:15,reach:135,knockback:65,launch:10,cost:30}),
  zenithHammer:strike('Zenith Hammer',{damage:95,effect:'weaken',duration:180,potency:.3}),
  duneCrucible:strike('Dune Crucible',{damage:125,reach:260,startup:20,knockback:45,cost:30}),
  siroccoBarrage:projectile('Sirocco Barrage',{damage:80,color:'#d7bb81',effect:'weaken',duration:180,potency:.3}),
  ashwingAssault:strike('Ashwing Assault',{damage:80,reach:190,dash:7,effect:'weaken',duration:180,potency:.3}),
  umbraPyre:projectile('Umbra Pyre',{damage:95,cost:35,effect:'burn',duration:300,potency:14,color:'#b57cd1',cooldown:240}),
  ironstepCyclone:strike('Ironstep Cyclone',{damage:115,startup:7,active:6,dash:7,cost:20}),
  heavenwardSpiral:strike('Heavenward Spiral',{damage:150,reach:100,launch:14,startup:14,cost:30,knockback:45}),
  umbraLeash:strike('Umbra Leash',{damage:45,reach:300,startup:18,effect:'weaken',duration:300,potency:.3}),
  nightglassSpines:strike('Nightglass Spines',{damage:115,reach:230,pierce:1,cost:30}),
  horizonRush:strike('Horizon Rush',{damage:120,startup:8,dash:15,active:8,reach:120,cost:30,cooldown:180}),
  bannerbreakReversal:strike('Bannerbreak Reversal',{damage:130,pierce:1,reach:165,cost:30,knockback:55}),
  wyrmfireSurge:projectile('Wyrmfire Surge',{damage:125,cost:35,effect:'burn',duration:240,potency:12}),
  prismSlipstream:strike('Prism Slipstream',{damage:115,dash:12,active:8,cost:25}),
  veiledPulse:projectile('Veiled Pulse',{damage:115,pierce:.5,cost:30,color:'#92d8f5'}),
  coilbolt:strike('Coilbolt',{damage:120,reach:210,pierce:1,cost:30}),
  galeRazor:projectile('Gale Razor',{damage:95,speed:15,cost:25,color:'#9ce8d1'}),
  bodyBlade:strike('Body Blade',{damage:135,reach:155,pierce:1,cost:30}),
  energyBlast:projectile('Energy Blast',{damage:120,cost:30,knockback:50,color:'#ec9c7e'}),
  sunforgeDrive:strike('Sunforge Drive',{damage:175,startup:10,active:9,dash:13,reach:145,cost:30,knockback:65,cooldown:120,color:'#ffba57'}),
  sunforgeRend:strike('Sunforge Rend',{damage:130,reach:250,cost:25,knockback:50,cooldown:150,color:'#ffba57'}),
  prismaticDrive:strike('Prismatic Drive',{damage:165,startup:10,active:8,dash:12,reach:140,pierce:.5,cost:30,color:'#6fc8ff'}),
  skyforgedBlade:{name:'Skyforged Blade slash' ,sword:true,element:'metal',startup:10,active:5,recovery:24,damage:100,reach:150,cost:0,knockback:38,cooldown:48}
});
const nativeIds=[...new Set(Object.values(CHARACTERS).flatMap(c=>[c.special1,c.special2,c.bloodline]).filter(Boolean))];
const restricted=new Set(Object.values(CHARACTERS).map(c=>c.bloodline).filter(Boolean));
export const JUTSUS=Object.freeze(Object.fromEntries([...nativeIds,...SHARED_TECHNIQUES].map(id=>[id,{id,name:MOVES[id].name,aerial:moveEnvironment(MOVES[id]),tags:[moveEnvironment(MOVES[id])==='air'?'AERIAL ONLY':moveEnvironment(MOVES[id])==='both'?'GROUND / AIR':'GROUNDED',...(MOVES[id].airCombo?['AIR COMBO']:[]),...(MOVES[id].launch?['LAUNCHER']:[]),...(MOVES[id].spike?['AIR FINISHER']:[])],element:MOVES[id].element??MOVES[id].ground?.element??'chakra',description:effectDescription(MOVES[id]),owners:restricted.has(id)?Object.values(CHARACTERS).filter(c=>c.bloodline===id).map(c=>c.id):null}])));
export const canEquipJutsu=(character,id)=>Object.hasOwn(JUTSUS,id)&&(!JUTSUS[id].owners||JUTSUS[id].owners.includes(character));
export const defaultJutsus=character=>{const c=CHARACTERS[character];return [c.special1,c.special2,c.bloodline??null,null,null,null,null];};
export function validateLoadout(l){
 l=migrateLoadout(l);
 if(!l||!Object.hasOwn(CHARACTERS,l.character))throw new Error('Unknown character');
 const weapon=l.weapon??l.weapons?.[0];
 if(!Object.hasOwn(WEAPONS,weapon))throw new Error('Choose at least one valid weapon');
 const weapons=l.weapons===undefined?[weapon,null]:l.weapons;
 if(!Array.isArray(weapons)||weapons.length<1||weapons.length>2||weapons[0]!==weapon||weapons.some((w,i)=>!(i===1&&w===null)&&!Object.hasOwn(WEAPONS,w)))throw new Error('Choose at most two valid weapons');
 const items=l.items===undefined?[]:l.items;
 if(!Array.isArray(items)||items.length>4||items.some(id=>id!==null&&!Object.hasOwn(ITEMS,id)))throw new Error('Choose at most four consumables');
 if(items.filter(id=>id==='waypointAnchor').length>1)throw new Error('Carry at most one Waypoint Anchor');
 const jutsus=l.jutsus===undefined?defaultJutsus(l.character):l.jutsus;
 if(!Array.isArray(jutsus)||jutsus.length>7||jutsus.some(id=>id!==null&&!canEquipJutsu(l.character,id))||new Set(jutsus.filter(Boolean)).size!==jutsus.filter(Boolean).length)throw new Error('Choose up to seven distinct jutsus; bloodlines must match your fighter');
 return {character:l.character,weapon,weapons:[weapon,weapons[1]??null],items:[...items,...Array(4-items.length).fill(null)],jutsus:[...jutsus,...Array(7-jutsus.length).fill(null)]};
}
export function validateLoadouts(loadouts){
 if(!Array.isArray(loadouts)||loadouts.length!==2)throw new Error('Two loadouts required');
 return loadouts.map(validateLoadout);
}
