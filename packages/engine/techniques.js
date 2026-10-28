// Shared training techniques: deliberate gameplay adaptations, not canon ownership claims.
const strike=(name,o={})=>({name,startup:14,active:4,recovery:26,damage:80,reach:170,cost:25,knockback:25,cooldown:240,...o});
const shot=(name,o={})=>strike(name,{projectile:true,startup:18,active:1,recovery:26,reach:0,speed:12,life:70,...o});
const field=(name,element,effect,potency)=>strike(name,{startup:24,active:1,recovery:30,damage:0,reach:0,cost:30,cooldown:420,utility:true,ground:{element,effect,potency,radius:125,duration:240}});
export const EXTRA_MOVES=Object.freeze({
 emberField:field('Ember Field','fire','burn',8),
 floodField:field('Flood Field','water','slow',.35),
 stoneSnare:field('Stone Snare','earth','bind',1),
 venomMist:field('Venom Mist','poison','poisonslow',6),
 galePush:shot('Gale Push',{damage:65,knockback:140,element:'wind',color:'#a4e8dc'}),
 bindingThreads:shot('Binding Threads',{damage:35,cost:30,cooldown:330,effect:'bind',duration:45,potency:1,knockback:0,element:'earth',color:'#d6bf85'}),
 venomDart:shot('Venom Dart',{damage:40,cost:25,cooldown:300,effect:'poisonslow',duration:240,potency:6,element:'poison',color:'#b6d97b'}),
 chakraSiphon:shot('Chakra Siphon',{damage:45,cost:20,cooldown:300,energyDrain:18,element:'water',color:'#8abaf5'}),
 waterAbsorption:strike('Water Absorption',{startup:12,active:1,recovery:18,damage:0,reach:0,cost:30,cooldown:480,buff:'absorb',duration:180}),
 windVeil:strike('Wind Veil',{startup:12,active:1,recovery:18,damage:0,reach:0,cost:25,cooldown:480,buff:'haste',duration:240}),
 stoneWard:strike('Stone Ward',{startup:20,active:1,recovery:22,damage:0,reach:0,cost:30,cooldown:600,buff:'ward',duration:240}),
 innerPeace:strike('Inner Peace',{startup:36,active:1,recovery:30,damage:0,reach:0,cost:35,cooldown:600,utility:true,selfHeal:120}),
 purifyingCurrent:strike('Purifying Current',{startup:12,active:1,recovery:20,damage:0,reach:0,cost:25,cooldown:420,utility:true,cleanse:true}),
 razorTorrent:shot('Razor Torrent',{damage:60,cost:30,cooldown:300,pierce:.5,effect:'bleed',duration:240,potency:6,element:'wind',color:'#c1ece8'})
});
export const SHARED_TECHNIQUES=Object.keys(EXTRA_MOVES);
export const JUTSU_KEYS=Object.freeze(['special1','special2','bloodline','jutsu4','jutsu5','jutsu6','jutsu7']);
export function effectDescription(m){
 if(m.ground)return `${m.ground.element} ground field · ${m.ground.effect} · 4s · jump out or leave its radius`;
 if(m.energyDrain)return `Steal up to ${m.energyDrain} chakra on a clean hit${m.lifesteal?' + '+Math.round(m.lifesteal*100)+'% lifesteal':''}; guard prevents gains`;
 if(m.selfHeal)return `Restore ${m.selfHeal} HP after a long, interruptible startup`;
 if(m.cleanse)return 'Clear harmful effects after startup; cannot escape hitstun';
 if(m.buff)return ({absorb:'Guard absorbs ordinary projectiles into chakra; melee/pierce counter it',haste:'15% faster movement for 4s',ward:'25% less HP damage for 4s',tetsugan:'Guard chip absorption, reflect and sword counter',aquaGuard:'Guard a hit to ready a fan/sword counter',shinrai:'Boost lightning damage',byakugan:'Temporary guard penetration'})[m.buff]??m.buff;
 const effect=m.effect?({poisonslow:`Poison-slow: ${m.potency} HP/s + 40% slower movement for ${m.duration/60}s`,bind:`Bind: immobilize for ${m.duration/60}s; guard or Replacement still work`,weaken:`Weaken: ${Math.round(m.potency*100)}% less attack damage for ${m.duration/60}s`,burn:`Burn: ${m.potency} HP/s for ${m.duration/60}s`,poison:`Poison: ${m.potency} HP/s for ${m.duration/60}s`,bleed:`Bleed: ${m.potency} HP/s for ${m.duration/60}s`,metalVulnerable:`Metal vulnerability: +${Math.round(m.potency*100)}% incoming metal damage`})[m.effect]??m.effect:null;
 return [effect,m.pull?'pull':null,m.knockback>=100?'heavy knockback':null,m.lifesteal?Math.round(m.lifesteal*100)+'% lifesteal':null,m.pierce?Math.round(m.pierce*100)+'% guard penetration':null,m.launch?'launch':null,m.followUp?'defendable heavy follow-up':null].filter(Boolean).join(' · ')||'Direct damage · punish recovery or confirm a basic combo';
}
