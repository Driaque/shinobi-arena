// Gameplay adaptations. Costs, durations and damage are balance choices, not canon claims.
export const CHARACTERS = Object.freeze({
  naruto: { id:'naruto', name:'Naruto', title:'Shadow-clone pressure', color:'#e9973a', hair:'#efc85d',
    description:'Close distance with Rasengan and extend your reach with clones. No inherited bloodline technique in this kit.',
    special1:'special1', special2:'clone', bloodline:null },
  sasuke: { id:'sasuke', name:'Sasuke', title:'Lightning and flame', color:'#747dc4', hair:'#192339',
    description:'Chidori pierces guard. Fireball burns. Sharingan genjutsu weakens enemy attacks.',
    special1:'chidori', special2:'fireball', bloodline:'sharingan' },
  hinata: { id:'hinata', name:'Hinata', title:'Gentle Fist precision', color:'#b1a5da', hair:'#24233f',
    description:'Twin Lion Fists pierce guard. Chakra-point strikes weaken attacks. Byakugan grants temporary guard penetration.',
    special1:'lionFists', special2:'chakraStrike', bloodline:'byakugan' },
  orochimaru: { id:'orochimaru', name:'Orochimaru', title:'Venom and suppression', color:'#c5c1a3', hair:'#141d2d',
    description:'Snake strikes poison. Five-Pronged Seal weakens attacks. No inherited bloodline technique in this kit.',
    special1:'snakeStrike', special2:'seal', bloodline:null }
});
export const WEAPONS = Object.freeze({
  kunai:{ id:'kunai',name:'Kunai',move:'kunai',description:'Quick close-range thrust · 75 damage' },
  shuriken:{ id:'shuriken',name:'Shuriken',move:'shuriken',description:'Ranged throw · 55 damage · no chakra cost' },
  katana:{ id:'katana',name:'Katana',move:'katana',description:'Long reach, slower recovery · 100 damage' }
});
export const MOVES = Object.freeze({
  attack:{name:'Basic attack',startup:5,active:4,recovery:13,damage:65,reach:90,cost:0,knockback:24},
  special1:{name:'Rasengan',startup:12,active:9,recovery:24,damage:150,reach:118,cost:30,knockback:62,dash:11,cooldown:120},
  chidori:{name:'Chidori',startup:12,active:9,recovery:24,damage:150,reach:118,cost:30,knockback:62,dash:11,pierce:1,cooldown:150},
  clone:{name:'Shadow Clone Strike',startup:16,active:7,recovery:24,damage:120,reach:210,cost:35,knockback:42,cooldown:180},
  fireball:{name:'Fireball',startup:17,active:1,recovery:28,damage:110,reach:0,cost:25,knockback:38,projectile:true,speed:12,life:100,effect:'burn',duration:240,potency:12,cooldown:180},
  lionFists:{name:'Twin Lion Fists',startup:10,active:6,recovery:24,damage:135,reach:125,cost:30,knockback:35,pierce:1,cooldown:150},
  chakraStrike:{name:'Chakra Point Strike',startup:8,active:5,recovery:22,damage:85,reach:115,cost:25,knockback:25,effect:'weaken',duration:240,potency:0.3,cooldown:180},
  snakeStrike:{name:'Striking Shadow Snakes',startup:14,active:7,recovery:26,damage:95,reach:230,cost:30,knockback:30,effect:'poison',duration:360,potency:9,cooldown:180},
  seal:{name:'Five-Pronged Seal',startup:12,active:5,recovery:26,damage:70,reach:130,cost:25,knockback:24,effect:'weaken',duration:300,potency:0.3,cooldown:240},
  sharingan:{name:'Sharingan Genjutsu',startup:18,active:3,recovery:26,damage:30,reach:300,cost:40,knockback:0,effect:'weaken',duration:300,potency:0.3,cooldown:600},
  byakugan:{name:'Byakugan',startup:8,active:1,recovery:15,damage:0,reach:0,cost:35,knockback:0,buff:'byakugan',duration:300,cooldown:600},
  kunai:{name:'Kunai thrust',startup:6,active:4,recovery:16,damage:75,reach:110,cost:0,knockback:28,cooldown:35},
  shuriken:{name:'Shuriken throw',startup:8,active:1,recovery:18,damage:55,reach:0,cost:0,knockback:20,projectile:true,speed:14,life:65,cooldown:40},
  katana:{name:'Katana slash',startup:10,active:5,recovery:24,damage:100,reach:150,cost:0,knockback:38,cooldown:48}
});
export function validateLoadouts(loadouts) {
  if(!Array.isArray(loadouts)||loadouts.length!==2)throw new Error('Two loadouts required');
  return loadouts.map(l=>{
    if(!l||!Object.hasOwn(CHARACTERS,l.character)||!Object.hasOwn(WEAPONS,l.weapon))throw new Error('Unknown character or weapon');
    return {character:l.character,weapon:l.weapon};
  });
}
