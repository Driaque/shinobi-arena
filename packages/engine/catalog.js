// Gameplay adaptations. Costs, durations and damage are balance choices, not canon claims.
export const CHARACTERS = Object.freeze({
  naruto: { id:'naruto', name:'Naruto', title:'Shadow-clone pressure', color:'#e9973a', hair:'#efc85d',
    description:'Close distance with Rasengan and extend your reach with clones. No inherited bloodline technique in this kit.',
    era:'Naruto', awakening:'kurama', special1:'special1', special2:'clone', bloodline:null },
  sasuke: { id:'sasuke', name:'Sasuke', title:'Lightning and flame', color:'#747dc4', hair:'#192339',
    description:'Chidori pierces guard. Fireball burns. Sharingan genjutsu weakens enemy attacks.',
    era:'Naruto', awakening:'susanoo', special1:'chidori', special2:'fireball', bloodline:'sharingan' },
  hinata: { id:'hinata', name:'Hinata', title:'Gentle Fist precision', color:'#b1a5da', hair:'#24233f',
    description:'Twin Lion Fists pierce guard. Chakra-point strikes weaken attacks. Byakugan grants temporary guard penetration.',
    era:'Naruto', awakening:null, special1:'lionFists', special2:'chakraStrike', bloodline:'byakugan' },
  orochimaru: { id:'orochimaru', name:'Orochimaru', title:'Venom and suppression', color:'#c5c1a3', hair:'#141d2d',
    description:'Snake strikes poison. Five-Pronged Seal weakens attacks. No inherited bloodline technique in this kit.',
    era:'Naruto', awakening:null, special1:'snakeStrike', special2:'seal', bloodline:null },

  kakashi:{id:'kakashi',name:'Kakashi',title:'Copy-ninja precision',color:'#7f9d89',hair:'#cbd5df',era:'Naruto',awakening:null,description:'Lightning Blade pierces guard; Lightning Hound controls range. Transplanted Sharingan occupies the dōjutsu slot.',special1:'lightningBlade',special2:'lightningHound',bloodline:'sharingan'},
  sakura:{id:'sakura',name:'Sakura',title:'Heavy-hitting pressure',color:'#d17e94',hair:'#eaa6b8',era:'Naruto',awakening:null,description:'Cherry Blossom Impact launches; a heavy kick weakens enemy attacks. Punish recovery with a basic combo.',special1:'cherryBlossom',special2:'heavenKick',bloodline:null},
  gaara:{id:'gaara',name:'Gaara',title:'Sand control',color:'#a77c56',hair:'#9c4b3e',era:'Naruto',awakening:null,description:'Sand Burial reaches beyond melee range; Sand Shower pressures from afar and weakens attacks.',special1:'sandBurial',special2:'sandShower',bloodline:null},
  itachi:{id:'itachi',name:'Itachi',title:'Genjutsu and black flame',color:'#9c5265',hair:'#1f2436',era:'Naruto',awakening:'susanoo',description:'Crow Assault creates an opening; Amaterasu burns. Sharingan weakens opponents; damage unlocks Susanoo.',special1:'crowAssault',special2:'amaterasu',bloodline:'sharingan'},
  lee:{id:'lee',name:'Rock Lee',title:'Taijutsu rushdown',color:'#4f9b77',hair:'#182a27',era:'Naruto',awakening:'gates',description:'Leaf Whirlwind and Primary Lotus deliver close-range pressure. Accumulated damage unlocks the Eight Gates.',special1:'leafWhirlwind',special2:'primaryLotus',bloodline:null},
  shikamaru:{id:'shikamaru',name:'Shikamaru',title:'Shadow tactics',color:'#718877',hair:'#182b2b',era:'Naruto',awakening:null,description:'Shadow Possession weakens attacks; Shadow Stitching pierces guard at mid-range. Spacing matters.',special1:'shadowPossession',special2:'shadowStitching',bloodline:null},
  minato:{id:'minato',name:'Minato',title:'Fast counterattacks',color:'#d9cba7',hair:'#e4c568',era:'Naruto',awakening:null,description:'Flying Raijin Strike closes distance; Rasengan delivers burst damage. Use dash and weapon confirms.',special1:'raijinStrike',special2:'special1',bloodline:null},
  madara:{id:'madara',name:'Madara',title:'Battlefield dominance',color:'#a35f62',hair:'#202238',era:'Naruto',awakening:'susanoo',description:'Dragon Flame burns; Uchiha Reversal delivers a piercing strike. Damage unlocks Susanoo.',special1:'uchihaReversal',special2:'dragonFlame',bloodline:'sharingan'},
  boruto:{id:'boruto',name:'Boruto',title:'Next-generation versatility',color:'#c777a0',hair:'#e6cb6a',era:'Boruto',awakening:'karmaBlue',description:'Boruto Stream closes distance; Vanishing Rasengan is a ranged attack. Damage unlocks Karma.',special1:'borutoStream',special2:'vanishingRasengan',bloodline:null},
  sarada:{id:'sarada',name:'Sarada',title:'Uchiha precision',color:'#cb5967',hair:'#263045',era:'Boruto',awakening:null,description:'Chidori pierces guard; Fireball burns. Sharingan adds weakening pressure.',special1:'chidori',special2:'fireball',bloodline:'sharingan'},
  mitsuki:{id:'mitsuki',name:'Mitsuki',title:'Serpentine reach',color:'#a1c9cf',hair:'#dce9ea',era:'Boruto',awakening:'sage',description:'Snake Lightning pierces guard; Wind Scythe controls distance. Damage unlocks Sage Mode.',special1:'snakeLightning',special2:'windScythe',bloodline:null},
  kawaki:{id:'kawaki',name:'Kawaki',title:'Karma-powered pressure',color:'#879c88',hair:'#202c39',era:'Boruto',awakening:'karmaRed',description:'Body Blade pierces guard; Energy Blast pressures at range. Damage unlocks Karma Overdrive.',special1:'bodyBlade',special2:'energyBlast',bloodline:null}

});
export const WEAPONS = Object.freeze({
  kunai:{ id:'kunai',name:'Kunai',move:'kunai',description:'Quick close-range thrust · 75 damage' },
  shuriken:{ id:'shuriken',name:'Shuriken',move:'shuriken',description:'Ranged throw · 55 damage · no chakra cost' },
  katana:{ id:'katana',name:'Katana',move:'katana',description:'Long reach, slower recovery · 100 damage' }
});
const strike=(name,overrides={})=>({name,startup:10,active:5,recovery:23,damage:110,reach:140,cost:25,knockback:32,cooldown:150,...overrides});
const projectile=(name,overrides={})=>strike(name,{startup:16,active:1,recovery:26,reach:0,projectile:true,speed:12,life:85,...overrides});
export const AWAKENINGS=Object.freeze({
 kurama:{name:'Kurama Chakra Mode',color:'#ffad42',threshold:400,duration:600,damage:1.2,speed:1.12,defence:.9,regen:.08,overrides:{special1:'kuramaRasengan',special2:'chakraClaw'}},
 susanoo:{name:'Susanoo',color:'#ba8cf0',threshold:450,duration:600,damage:1.15,speed:.95,defence:.75,regen:.06,overrides:{}},
 gates:{name:'Eight Gates',color:'#7ae2a6',threshold:400,duration:480,damage:1.3,speed:1.3,defence:1,regen:.035,overrides:{}},
 karmaBlue:{name:'Karma',color:'#69caff',threshold:400,duration:600,damage:1.2,speed:1.15,defence:.9,regen:.1,overrides:{special1:'karmaRasengan'}},
 karmaRed:{name:'Karma Overdrive',color:'#f48c79',threshold:400,duration:600,damage:1.2,speed:1.1,defence:.85,regen:.08,overrides:{}},
 sage:{name:'Sage Mode',color:'#8bedd5',threshold:400,duration:600,damage:1.15,speed:1.25,defence:.9,regen:.1,overrides:{}}
});
export const MOVES = Object.freeze({
  attack:{name:'Basic attack',startup:5,active:4,recovery:13,damage:65,reach:90,cost:0,knockback:24},
  attack2:strike('Combo body strike',{startup:5,active:4,recovery:15,damage:50,reach:105,cost:0,knockback:10,cooldown:0,hitstun:20}),
  attack3:strike('Combo launching kick',{startup:8,active:4,recovery:24,damage:90,reach:130,cost:0,knockback:60,cooldown:0,launch:10,hitstun:22}),
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
  lightningBlade:strike('Lightning Blade',{damage:135,pierce:1,dash:9,startup:11,active:7}),
  lightningHound:projectile('Lightning Hound',{damage:95,pierce:.5,cost:30,color:'#85cfff'}),
  cherryBlossom:strike('Cherry Blossom Impact',{damage:155,startup:15,reach:135,knockback:65,launch:10,cost:30}),
  heavenKick:strike('Heaven Kick',{damage:95,effect:'weaken',duration:180,potency:.3}),
  sandBurial:strike('Sand Burial',{damage:125,reach:260,startup:20,knockback:45,cost:30}),
  sandShower:projectile('Sand Shower',{damage:80,color:'#d7bb81',effect:'weaken',duration:180,potency:.3}),
  crowAssault:strike('Crow Assault',{damage:80,reach:190,dash:7,effect:'weaken',duration:180,potency:.3}),
  amaterasu:projectile('Amaterasu',{damage:95,cost:35,effect:'burn',duration:300,potency:14,color:'#b57cd1',cooldown:240}),
  leafWhirlwind:strike('Leaf Whirlwind',{damage:115,startup:7,active:6,dash:7,cost:20}),
  primaryLotus:strike('Primary Lotus',{damage:150,reach:100,launch:14,startup:14,cost:30,knockback:45}),
  shadowPossession:strike('Shadow Possession',{damage:45,reach:300,startup:18,effect:'weaken',duration:300,potency:.3}),
  shadowStitching:strike('Shadow Stitching',{damage:115,reach:230,pierce:1,cost:30}),
  raijinStrike:strike('Flying Raijin Strike',{damage:120,startup:8,dash:15,active:8,reach:120,cost:30,cooldown:180}),
  uchihaReversal:strike('Uchiha Reversal',{damage:130,pierce:1,reach:165,cost:30,knockback:55}),
  dragonFlame:projectile('Dragon Flame',{damage:125,cost:35,effect:'burn',duration:240,potency:12}),
  borutoStream:strike('Boruto Stream',{damage:115,dash:12,active:8,cost:25}),
  vanishingRasengan:projectile('Vanishing Rasengan',{damage:115,pierce:.5,cost:30,color:'#92d8f5'}),
  snakeLightning:strike('Snake Lightning',{damage:120,reach:210,pierce:1,cost:30}),
  windScythe:projectile('Wind Scythe',{damage:95,speed:15,cost:25,color:'#9ce8d1'}),
  bodyBlade:strike('Body Blade',{damage:135,reach:155,pierce:1,cost:30}),
  energyBlast:projectile('Energy Blast',{damage:120,cost:30,knockback:50,color:'#ec9c7e'}),
  kuramaRasengan:strike('Kurama Rasengan',{damage:175,startup:10,active:9,dash:13,reach:145,cost:30,knockback:65,cooldown:120,color:'#ffba57'}),
  chakraClaw:strike('Chakra Claw',{damage:130,reach:250,cost:25,knockback:50,cooldown:150,color:'#ffba57'}),
  karmaRasengan:strike('Karma Rasengan',{damage:165,startup:10,active:8,dash:12,reach:140,pierce:.5,cost:30,color:'#6fc8ff'}),
  katana:{name:'Katana slash' ,startup:10,active:5,recovery:24,damage:100,reach:150,cost:0,knockback:38,cooldown:48}
});
export function validateLoadouts(loadouts) {
  if(!Array.isArray(loadouts)||loadouts.length!==2)throw new Error('Two loadouts required');
  return loadouts.map(l=>{
    if(!l||!Object.hasOwn(CHARACTERS,l.character)||!Object.hasOwn(WEAPONS,l.weapon))throw new Error('Unknown character or weapon');
    return {character:l.character,weapon:l.weapon};
  });
}

