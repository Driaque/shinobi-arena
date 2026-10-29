import {EXTRA_MOVES,SHARED_TECHNIQUES,effectDescription,moveEnvironment} from './techniques.js';
import {ITEMS} from './items.js';
export {ITEMS};
// Gameplay adaptations. Costs, durations and damage are balance choices, not canon claims.
export const CHARACTERS = Object.freeze({
  pain:{id:'pain',name:'Pain',title:'Rinnegan pressure',color:'#69546c',hair:'#d58b48',era:'Naruto',faction:'Akatsuki',awakening:null,special1:'shinraTensei',special2:'banshoTenin',bloodline:null,description:'Akatsuki · Rinnegan pressure. A playable adaptation with customizable training techniques and normal stamina/chakra rules.'},
  konan:{id:'konan',name:'Konan',title:'Paper control',color:'#657b9d',hair:'#8498c2',era:'Naruto',faction:'Akatsuki',awakening:null,special1:'paperStorm',special2:'paperBind',bloodline:null,description:'Akatsuki · Paper control. A playable adaptation with customizable training techniques and normal stamina/chakra rules.'},
  kisame:{id:'kisame',name:'Kisame',title:'Chakra-hunting swordsman',color:'#587a8d',hair:'#243849',era:'Naruto',faction:'Akatsuki',awakening:null,special1:'mizukumi',special2:'eclipseDrain',bloodline:null,defaultWeapon:'tachi',skin:'#83a0ac',description:'Akatsuki · Chakra-hunting swordsman. A playable adaptation with customizable training techniques and normal stamina/chakra rules.'},
  deidara:{id:'deidara',name:'Deidara',title:'Explosive clay artist',color:'#b49a56',hair:'#e3cb7c',era:'Naruto',faction:'Akatsuki',awakening:null,special1:'clayBird',special2:'clayMine',bloodline:null,description:'Akatsuki · Explosive clay artist. A playable adaptation with customizable training techniques and normal stamina/chakra rules.'},
  sasori:{id:'sasori',name:'Sasori',title:'Poison and puppet threads',color:'#9b665e',hair:'#a34942',era:'Naruto',faction:'Akatsuki',awakening:null,special1:'venomDart',special2:'bindingThreads',bloodline:null,description:'Akatsuki · Poison and puppet threads. A playable adaptation with customizable training techniques and normal stamina/chakra rules.'},
  hidan:{id:'hidan',name:'Hidan',title:'Ritual close-range pressure',color:'#8c7584',hair:'#d8d4ce',era:'Naruto',faction:'Akatsuki',awakening:null,special1:'harmoniousSlash',special2:'eclipseDrain',bloodline:null,defaultWeapon:'katana',description:'Akatsuki · Ritual close-range pressure. A playable adaptation with customizable training techniques and normal stamina/chakra rules.'},
  kakuzu:{id:'kakuzu',name:'Kakuzu',title:'Threads and vitality drain',color:'#778576',hair:'#343b32',era:'Naruto',faction:'Akatsuki',awakening:null,special1:'bindingThreads',special2:'chakraSiphon',bloodline:null,description:'Akatsuki · Threads and vitality drain. A playable adaptation with customizable training techniques and normal stamina/chakra rules.'},
  zetsu:{id:'zetsu',name:'Zetsu',title:'Earth ambush and binding',color:'#6c925c',hair:'#34513c',era:'Naruto',faction:'Akatsuki',awakening:null,special1:'stoneSnare',special2:'venomMist',bloodline:null,description:'Akatsuki · Earth ambush and binding. A playable adaptation with customizable training techniques and normal stamina/chakra rules.'},
  obito:{id:'obito',name:'Obito',title:'Masked space-time pressure',color:'#b17a4f',hair:'#202736',era:'Naruto',faction:'Akatsuki',awakening:null,special1:'raijinStrike',special2:'fireball',bloodline:'sharingan',defaultWeapon:'katana',description:'Akatsuki · Masked space-time pressure. A playable adaptation with customizable training techniques and normal stamina/chakra rules.'},

  dora:{id:'dora',name:'Dora',title:'AquaPrincess',color:'#48b9c7',hair:'#25202a',skin:'#e5b988',era:'TNR',portrait:'assets/dora-concept.jpg',awakening:'limitRelease',basicChain:['doraFan1','doraFan2','doraFan3'],description:'Graceful elemental counterattacker. Tidal Edict weakens attacks; Royal Tempest pulls into a defendable heavy finish. Triune Flow readies a fan counter after a guarded hit. Silent’s wife; wind, water and fire. Limit Release strengthens wind and fire.',special1:'tidalEdict',special2:'royalTempest',bloodline:'triuneFlow'},
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
  itachi:{faction:'Akatsuki',id:'itachi',name:'Itachi',title:'Genjutsu and black flame',color:'#9c5265',hair:'#1f2436',era:'Naruto',awakening:'susanoo',description:'Crow Assault creates an opening; Amaterasu burns. Sharingan weakens opponents; damage unlocks Susanoo.',special1:'crowAssault',special2:'amaterasu',bloodline:'sharingan'},
  lee:{id:'lee',name:'Rock Lee',title:'Taijutsu rushdown',color:'#4f9b77',hair:'#182a27',era:'Naruto',awakening:'gates',description:'Leaf Whirlwind and Primary Lotus deliver close-range pressure. Accumulated damage unlocks the Eight Gates.',special1:'leafWhirlwind',special2:'primaryLotus',bloodline:null},
  shikamaru:{id:'shikamaru',name:'Shikamaru',title:'Shadow tactics',color:'#718877',hair:'#182b2b',era:'Naruto',awakening:null,description:'Shadow Possession weakens attacks; Shadow Stitching pierces guard at mid-range. Spacing matters.',special1:'shadowPossession',special2:'shadowStitching',bloodline:null},
  minato:{id:'minato',name:'Minato',title:'Fast counterattacks',color:'#d9cba7',hair:'#e4c568',era:'Naruto',awakening:null,description:'Flying Raijin Strike closes distance; Rasengan delivers burst damage. Use dash and weapon confirms.',special1:'raijinStrike',special2:'special1',bloodline:null},
  madara:{id:'madara',name:'Madara',title:'Battlefield dominance',color:'#a35f62',hair:'#202238',era:'Naruto',awakening:'susanoo',description:'Dragon Flame burns; Uchiha Reversal delivers a piercing strike. Damage unlocks Susanoo.',special1:'uchihaReversal',special2:'dragonFlame',bloodline:'sharingan'},
  boruto:{id:'boruto',name:'Boruto',title:'Next-generation versatility',color:'#c777a0',hair:'#e6cb6a',era:'Boruto',awakening:'karmaBlue',description:'Boruto Stream closes distance; Vanishing Rasengan is a ranged attack. Damage unlocks Karma.',special1:'borutoStream',special2:'vanishingRasengan',bloodline:null},
  sarada:{id:'sarada',name:'Sarada',title:'Uchiha precision',color:'#cb5967',hair:'#263045',era:'Boruto',awakening:null,description:'Chidori pierces guard; Fireball burns. Sharingan adds weakening pressure.',special1:'chidori',special2:'fireball',bloodline:'sharingan'},
  mitsuki:{id:'mitsuki',name:'Mitsuki',title:'Serpentine reach',color:'#a1c9cf',hair:'#dce9ea',era:'Boruto',awakening:'sage',description:'Snake Lightning pierces guard; Wind Scythe controls distance. Damage unlocks Sage Mode.',special1:'snakeLightning',special2:'windScythe',bloodline:null},
  silent:{id:'silent',name:'Silent',title:'Cold Metal',color:'#779fb9',hair:'#c4ced8',era:'TNR',portrait:'assets/silent-concept.jpg',awakening:'coldMetal',basicChain:['silentSlash1','silentSlash2','silentSlash3'],description:'Precision counterattacker. Tetsugan stance absorbs chip and reflects guarded strikes; a successful guard empowers the next sword hit. Echoing Rift pulls and exposes metal vulnerability. Awakening is a proposed adaptation.',special1:'harmoniousSlash',special2:'echoingRift',bloodline:'tetsugan'},
  winta:{id:'winta',name:'Winta',title:'Frozen Sun',color:'#983d54',hair:'#171e29',era:'TNR',portrait:'assets/winta-concept.jpg',awakening:'frozenSun',basicChain:['wintaSlash1','wintaSlash2','wintaSlash3'],description:'Elemental pressure fighter. Mizukumi dashes through openings; Eclipse Drain restores HP on a clean hit. Shinrai Ōu strengthens lightning attacks. Awakening is a proposed adaptation.',special1:'mizukumi',special2:'eclipseDrain',bloodline:'shinraiOu'},
  kawaki:{id:'kawaki',name:'Kawaki',title:'Karma-powered pressure',color:'#879c88',hair:'#202c39',era:'Boruto',awakening:'karmaRed',description:'Body Blade pierces guard; Energy Blast pressures at range. Damage unlocks Karma Overdrive.',special1:'bodyBlade',special2:'energyBlast',bloodline:null}

});
export const WEAPONS = Object.freeze({
  championKatana:{id:'championKatana',name:'Champion’s Katana',move:'katana',unlock:'championKatana',description:'Tournament champion reward · gold finish · same stats as Katana'},
  fans:{id:'fans',name:'Bladed Fans',move:'fanStrike',description:'Sweeping metal fans · 85 damage · 145 reach'},
  kunai:{ id:'kunai',name:'Kunai',move:'kunai',description:'Quick close-range thrust · 75 damage' },
  shuriken:{ id:'shuriken',name:'Shuriken',move:'shuriken',description:'Ranged throw · 55 damage · no chakra cost' },
  tachi:{id:'tachi',name:'Tachi',move:'tachi',description:'Metal sword · 105 damage · deliberate recovery'},
  kaiken:{id:'kaiken',name:'Kaiken',move:'kaiken',description:'Fast metal dagger · 65 damage · short reach'},
  katana:{ id:'katana',name:'Katana',move:'katana',description:'Long reach, slower recovery · 100 damage' }
});
const strike=(name,overrides={})=>({name,startup:10,active:5,recovery:23,damage:110,reach:140,cost:25,knockback:32,cooldown:150,...overrides});
const projectile=(name,overrides={})=>strike(name,{startup:16,active:1,recovery:26,reach:0,projectile:true,speed:12,life:85,...overrides});
export const AWAKENINGS=Object.freeze({
 limitRelease:{name:'Limit Release',color:'#7af1e4',threshold:400,duration:600,damage:1.1,speed:1.1,chainSpeed:1.15,defence:1,regen:.06,overrides:{special1:'royalGale',special2:'releasedTempest'}},
 coldMetal:{name:'Cold Metal Ascendant',chainSpeed:1.25,proposed:true,color:'#a3ddf3',threshold:400,duration:600,damage:1.15,speed:1.08,defence:.85,regen:.06,overrides:{special1:'ascendantSlash',special2:'ascendantRift'}},
 frozenSun:{name:'Frozen Sun Dominion',chainSpeed:1.25,proposed:true,color:'#ff627f',threshold:400,duration:600,damage:1.15,speed:1.2,defence:.95,regen:.08,overrides:{special1:'dominionMizukumi',special2:'dominionDrain'}},
 kurama:{name:'Kurama Chakra Mode',color:'#ffad42',threshold:400,duration:600,damage:1.2,speed:1.12,defence:.9,regen:.08,overrides:{special1:'kuramaRasengan',special2:'chakraClaw'}},
 susanoo:{name:'Susanoo',color:'#ba8cf0',threshold:450,duration:600,damage:1.15,speed:.95,defence:.75,regen:.06,overrides:{}},
 gates:{name:'Eight Gates',color:'#7ae2a6',threshold:400,duration:480,damage:1.3,speed:1.3,defence:1,regen:.035,overrides:{}},
 karmaBlue:{name:'Karma',color:'#69caff',threshold:400,duration:600,damage:1.2,speed:1.15,defence:.9,regen:.1,overrides:{special1:'karmaRasengan'}},
 karmaRed:{name:'Karma Overdrive',color:'#f48c79',threshold:400,duration:600,damage:1.2,speed:1.1,defence:.85,regen:.08,overrides:{}},
 sage:{name:'Sage Mode',color:'#8bedd5',threshold:400,duration:600,damage:1.15,speed:1.25,defence:.9,regen:.1,overrides:{}}
});
export const MOVES = Object.freeze({
  ...EXTRA_MOVES,
  shinraTensei:strike('Shinra Tensei',{startup:15,active:5,recovery:30,damage:90,reach:240,cost:35,cooldown:300,knockback:130,element:'wind',color:'#cbb6ed'}),
  banshoTenin:strike('Banshō Ten’in',{startup:17,active:5,recovery:28,damage:45,reach:300,cost:30,cooldown:300,knockback:0,pull:180,hitstun:20,element:'chakra',color:'#b9a4db'}),
  paperStorm:projectile('Paper Storm',{startup:16,damage:28,cost:30,cooldown:240,fan:true,pierce:.2,element:'wind',color:'#e5e1d2'}),
  paperBind:projectile('Paper Binding',{startup:18,damage:30,cost:30,cooldown:330,effect:'bind',duration:45,potency:1,knockback:0,element:'wind',color:'#e5e1d2'}),
  clayBird:projectile('Explosive Clay Bird',{startup:20,damage:100,cost:30,cooldown:270,speed:6,life:36,blast:85,element:'earth',color:'#e9cfaa'}),
  clayMine:strike('Clay Minefield',{startup:25,active:1,recovery:30,damage:0,reach:0,cost:35,cooldown:420,utility:true,ground:{element:'earth',effect:'burn',potency:6,radius:125,duration:240}}),
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
  itemBomb:projectile('Paper Bomb',{startup:18,recovery:26,damage:110,cost:0,cooldown:90,speed:4,life:45,blast:110,pierce:.25,color:'#ffbd70'}),
  itemKunai:projectile('Throwing Kunai',{startup:6,recovery:16,damage:45,cost:0,cooldown:90,speed:17,life:45,color:'#d7e6ee'}),
  itemShuriken:projectile('Shuriken Fan',{startup:10,recovery:22,damage:25,cost:0,cooldown:90,speed:15,life:50,fan:true,color:'#c6d9e8'}),
  itemPoison:strike('Coat weapon',{startup:10,active:1,recovery:18,damage:0,reach:0,cost:0,cooldown:90,inventoryEffect:'poison'}),
  itemSmoke:strike('Smoke Bomb',{startup:8,active:1,recovery:20,damage:0,reach:0,cost:0,cooldown:90,inventoryEffect:'smoke'}),
  itemRaijin:projectile('Flying Raijin Kunai',{startup:12,recovery:22,damage:35,cost:0,cooldown:90,speed:13,life:40,mark:true,color:'#ffd879'}),
  raijinWarp:strike('Flying Raijin · Warp',{startup:8,active:1,recovery:22,damage:0,reach:0,cost:15,cooldown:90,inventoryEffect:'warp'}),
  silentSlash1:strike('Silent · Opening Cut',{startup:5,active:4,recovery:13,damage:65,reach:100,cost:0,knockback:24,cooldown:0,sword:true,element:'metal'}),
  silentSlash2:strike('Silent · Returning Edge',{startup:5,active:4,recovery:15,damage:50,reach:115,cost:0,knockback:10,cooldown:0,hitstun:20,sword:true,element:'metal'}),
  silentSlash3:strike('Silent · Rising Steel',{startup:8,active:4,recovery:24,damage:90,reach:140,cost:0,knockback:60,cooldown:0,launch:10,hitstun:22,sword:true,element:'metal'}),
  wintaSlash1:strike('Winta · Spark Cut',{startup:5,active:4,recovery:13,damage:65,reach:100,cost:0,knockback:24,cooldown:0,sword:true,element:'lightning',color:'#ff879b'}),
  wintaSlash2:strike('Winta · Crossing Current',{startup:5,active:4,recovery:15,damage:50,reach:115,cost:0,knockback:10,cooldown:0,hitstun:20,sword:true,element:'lightning',color:'#ff879b'}),
  wintaSlash3:strike('Winta · Storm Rise',{startup:8,active:4,recovery:24,damage:90,reach:140,cost:0,knockback:60,cooldown:0,launch:10,hitstun:22,sword:true,element:'lightning',color:'#ff879b'}),
  harmoniousSlash:strike('Harmonious Slash',{damage:125,startup:9,reach:165,pierce:.5,sword:true,element:'metal',color:'#a3ddf3'}),
  echoingRift:strike('Echoing Rift',{damage:70,startup:16,reach:270,knockback:0,pull:90,effect:'metalVulnerable',duration:180,potency:.2,cost:30,element:'metal',color:'#a3ddf3'}),
  tetsugan:strike('Tetsugan · Middle Guard',{startup:8,active:1,recovery:15,damage:0,reach:0,cost:30,buff:'tetsugan',duration:180,cooldown:480}),
  mizukumi:strike('Mizukumi',{damage:125,startup:9,active:8,dash:12,reach:130,cost:25,energyDrain:8,sword:true,element:'lightning',color:'#ff627f'}),
  eclipseDrain:strike('Eclipse Drain',{damage:100,startup:13,reach:160,cost:30,lifesteal:.35,energyDrain:12,element:'water',color:'#ae8ee8'}),
  shinraiOu:strike('Shinrai Ōu',{startup:8,active:1,recovery:15,damage:0,reach:0,cost:30,buff:'shinrai',duration:300,cooldown:600}),
  ascendantSlash:strike('Ascendant · Harmonious Slash',{damage:145,startup:7,reach:180,pierce:.5,sword:true,element:'metal',color:'#a3ddf3'}),
  ascendantRift:strike('Ascendant · Echoing Rift',{damage:85,startup:13,reach:300,knockback:0,pull:110,effect:'metalVulnerable',duration:180,potency:.2,cost:30,element:'metal',color:'#a3ddf3'}),
  dominionMizukumi:strike('Dominion · Mizukumi',{damage:145,startup:7,active:8,dash:15,reach:145,cost:25,energyDrain:8,sword:true,element:'lightning',color:'#ff627f'}),
  dominionDrain:strike('Dominion · Eclipse Drain',{damage:115,startup:11,reach:180,cost:30,lifesteal:.4,energyDrain:15,element:'water',color:'#ff627f'}),
  tachi:strike('Tachi slash',{startup:11,active:5,recovery:25,damage:105,reach:165,cost:0,knockback:38,cooldown:50,sword:true,element:'metal'}),
  kaiken:strike('Kaiken cut',{startup:5,active:4,recovery:13,damage:65,reach:100,cost:0,knockback:20,cooldown:30,sword:true,element:'metal'}),
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
  katana:{name:'Katana slash' ,sword:true,element:'metal',startup:10,active:5,recovery:24,damage:100,reach:150,cost:0,knockback:38,cooldown:48}
});
const nativeIds=[...new Set(Object.values(CHARACTERS).flatMap(c=>[c.special1,c.special2,c.bloodline]).filter(Boolean))];
const restricted=new Set(Object.values(CHARACTERS).map(c=>c.bloodline).filter(Boolean));
export const JUTSUS=Object.freeze(Object.fromEntries([...nativeIds,...SHARED_TECHNIQUES].map(id=>[id,{id,name:MOVES[id].name,aerial:moveEnvironment(MOVES[id]),tags:[moveEnvironment(MOVES[id])==='air'?'AERIAL ONLY':moveEnvironment(MOVES[id])==='both'?'GROUND / AIR':'GROUNDED',...(MOVES[id].airCombo?['AIR COMBO']:[]),...(MOVES[id].launch?['LAUNCHER']:[]),...(MOVES[id].spike?['AIR FINISHER']:[])],element:MOVES[id].element??MOVES[id].ground?.element??'chakra',description:effectDescription(MOVES[id]),owners:restricted.has(id)?Object.values(CHARACTERS).filter(c=>c.bloodline===id).map(c=>c.id):null}])));
export const canEquipJutsu=(character,id)=>Object.hasOwn(JUTSUS,id)&&(!JUTSUS[id].owners||JUTSUS[id].owners.includes(character));
export const defaultJutsus=character=>{const c=CHARACTERS[character];return [c.special1,c.special2,c.bloodline??null,null,null,null,null];};
export function validateLoadout(l){
 if(!l||!Object.hasOwn(CHARACTERS,l.character))throw new Error('Unknown character');
 const weapon=l.weapon??l.weapons?.[0];
 if(!Object.hasOwn(WEAPONS,weapon))throw new Error('Choose at least one valid weapon');
 const weapons=l.weapons===undefined?[weapon,null]:l.weapons;
 if(!Array.isArray(weapons)||weapons.length<1||weapons.length>2||weapons[0]!==weapon||weapons.some((w,i)=>!(i===1&&w===null)&&!Object.hasOwn(WEAPONS,w)))throw new Error('Choose at most two valid weapons');
 const items=l.items===undefined?[]:l.items;
 if(!Array.isArray(items)||items.length>4||items.some(id=>id!==null&&!Object.hasOwn(ITEMS,id)))throw new Error('Choose at most four consumables');
 if(items.filter(id=>id==='raijinKunai').length>1)throw new Error('Carry at most one Flying Raijin Kunai');
 const jutsus=l.jutsus===undefined?defaultJutsus(l.character):l.jutsus;
 if(!Array.isArray(jutsus)||jutsus.length>7||jutsus.some(id=>id!==null&&!canEquipJutsu(l.character,id))||new Set(jutsus.filter(Boolean)).size!==jutsus.filter(Boolean).length)throw new Error('Choose up to seven distinct jutsus; bloodlines must match your fighter');
 return {character:l.character,weapon,weapons:[weapon,weapons[1]??null],items:[...items,...Array(4-items.length).fill(null)],jutsus:[...jutsus,...Array(7-jutsus.length).fill(null)]};
}
export function validateLoadouts(loadouts){
 if(!Array.isArray(loadouts)||loadouts.length!==2)throw new Error('Two loadouts required');
 return loadouts.map(validateLoadout);
}
