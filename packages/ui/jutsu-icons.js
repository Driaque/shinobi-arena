import {JUTSUS,MOVES} from '../engine/index.js';
// Original vector pictograms: elemental colour + distinct silhouette + per-technique detail.
const motifs={
 clone:'<circle cx="23" cy="17" r="7"/><circle cx="44" cy="20" r="6"/><path d="M8 54V36q15-18 29 0v18M38 32q16-6 19 11v11M18 38l-5 15M29 38l5 15"/>',
 hound:'<path d="m8 41 6-17 15-6 8-13 4 16 16 9-5 10H39l-7 15H18l3-14Z M21 24l-6-13 18 7M43 29h3"/>',
 poison:'<path d="M23 6h18v8H23zM26 14v12L12 48q-4 10 8 11h25q12-1 7-11L38 26V14M19 42h27"/><circle cx="27" cy="48" r="2"/><circle cx="38" cy="51" r="2"/>',
 sand:'<path d="M12 6h40M12 58h40M17 7v13l15 12-15 12v13M47 7v13L32 32l15 12v13M23 18h18M23 50l9-9 9 9Z"/>',
 rift:'<path d="m34 3-8 16 15 6-19 12 9 6-10 18M6 22l12 5-9 7M49 26l9 6-10 7"/>',
 bladeBolt:'<path d="m13 53 28-42 12-6-4 14-27 39ZM7 39l21 15M40 8l-8 17 13-3-10 20"/>',

 orb:'<circle cx="32" cy="31" r="17"/><path d="M20 34c-8-18 23-23 25-7 2 13-20 17-22 7-2-7 12-12 15-4"/>',
 bolt:'<path d="M36 6 17 34h14l-4 24 22-34H35z"/>',
 flame:'<path d="M34 5c4 15 16 19 16 32a18 18 0 0 1-36 0c0-9 8-16 12-22-1 12 3 15 6 17 7-9 5-16 2-27Z"/>',
 eye:'<path d="M6 31Q32 4 58 31 32 58 6 31Z"/><circle cx="32" cy="31" r="10"/><circle cx="32" cy="31" r="3"/>',
 wave:'<path d="M5 43q9-17 21-5t21-4q8-9 13 1M6 53q10-13 21-4t29-1M10 28Q29 0 44 22q-16-6-16 10"/>',
 sword:'<path d="m13 53 31-42 9-5-2 11-31 42zM9 40l21 16M10 56l-4 5"/>',
 fan:'<path d="M32 54 5 25Q32-4 59 25Z M32 54 16 18M32 54V12M32 54 48 18"/>',
 bird:'<path d="m5 18 22 11 5-14 7 14 20-11-12 22-15 12-15-12Z M25 35l7 5 7-5"/>',
 bind:'<path d="M9 13 53 50M12 50 51 12M6 31h52M32 5v53"/><rect x="22" y="21" width="20" height="21" rx="5"/>',
 shield:'<path d="m32 5 23 9-4 24Q46 51 32 59 18 51 13 38L9 14Z M23 32l7 7 13-16"/>',
 flower:'<path d="M32 29C0-2 51-5 34 29c32-31 42 14 2 5 31 32-16 41-6 2-33 30-42-15-4-5Z"/><circle cx="32" cy="32" r="5"/>',
 snake:'<path d="M13 52c41 9 38-23 12-18C1 39 7 16 30 20s17 19 25 7M26 20 24 8l14-1 7 13"/><circle cx="32" cy="13" r="1"/>',
 fist:'<path d="M17 31V18q0-7 7-4V9q5-5 9 1 6-5 10 2 8-3 8 6v20L39 54H22L12 40q-6-15 5-9Z M24 14v16M33 10v19M43 12v17"/>',
 seal:'<rect x="15" y="6" width="34" height="52" rx="3"/><path d="M22 17h20M23 27l17 17M40 27 23 44M22 52h20"/>',
 mine:'<path d="m7 48 15-17 10 8 9-18 16 27Z"/><circle cx="32" cy="15" r="7"/><path d="M32 3v-2M19 8l-4-4M45 8l4-4"/>',
 wind:'<path d="M5 18h32q20-1 12-12M5 31h42q21 0 8 15M9 44h20q17 2 9 14"/>',
 claw:'<path d="m13 55 4-44 7-5-1 41M28 54l4-47 7-3-1 44M43 53l5-38 9-8-6 43"/>',
 drain:'<path d="M30 6C22 19 12 26 12 38a20 20 0 0 0 40 0C52 24 37 15 30 6Z M22 39h21m-7-7 8 7-8 7"/>',
 push:'<circle cx="32" cy="32" r="12"/><path d="M32 5v12M32 47v12M5 32h12M47 32h12M26 10l6-6 6 6M26 54l6 6 6-6M10 26l-6 6 6 6M54 26l6 6-6 6"/>',
 pull:'<circle cx="32" cy="32" r="7"/><path d="M32 4v18M32 42v18M4 32h18M42 32h18M26 15l6 8 6-8M26 49l6-8 6 8M15 26l8 6-8 6M49 26l-8 6 8 6"/>',
 heal:'<path d="M25 9h14v16h16v14H39v16H25V39H9V25h16Z"/>',
 chakra:'<path d="M32 5 53 18v27L32 59 11 45V18Z M32 16 43 25v16l-11 7-11-7V25Z"/>',
 crouch:'<circle cx="31" cy="13" r="7"/><path d="m29 22-8 16 19 4-13 13M24 32l23 1M9 57h46"/>',
 smoke:'<path d="M15 48C-4 44 6 23 19 26 11 3 46 1 43 24c22-8 25 23 6 25Z M16 57h33"/>'
};
const groups={push:'shinraTensei',pull:'banshoTenin',orb:'special1 vanishingRasengan energyBlast',bolt:'chidori lightningBlade snakeLightning raijinStrike shinraiOu',flame:'fireball amaterasu dragonFlame divingFlame emberField',eye:'sharingan byakugan',wave:'mizukumi tidalEdict floodField aerialSenbon',sword:'harmoniousSlash skyCleave bodyBlade echoingRift',fan:'royalTempest windScythe',bird:'paperStorm clayBird crowAssault lightningHound',bind:'paperBind bindingThreads shadowPossession shadowStitching stoneSnare',shield:'triuneFlow tetsugan uchihaReversal stoneWard waterAbsorption',flower:'cherryBlossom innerPeace',snake:'snakeStrike',fist:'lionFists chakraStrike heavenKick primaryLotus borutoStream',seal:'seal',mine:'clayMine sandBurial sandShower',wind:'risingGale galePush leafWhirlwind windVeil razorTorrent',claw:'clone',drain:'venomDart venomMist chakraSiphon eclipseDrain',heal:'purifyingCurrent'};
const identity=Object.fromEntries(Object.entries(groups).flatMap(([motif,ids])=>ids.split(' ').map((id,index)=>[id,{motif,index}])));
Object.assign(identity,{clone:{motif:'clone',index:0},lightningHound:{motif:'hound',index:0},lightningBlade:{motif:'bladeBolt',index:0},venomDart:{motif:'poison',index:0},venomMist:{motif:'poison',index:1},sandBurial:{motif:'sand',index:0},sandShower:{motif:'sand',index:1},echoingRift:{motif:'rift',index:0}});
const colors={fire:'#ffad69',water:'#70dfef',wind:'#9ce5c7',earth:'#e0bb87',metal:'#c3e3f8',lightning:'#cfb2ff',poison:'#bada76',chakra:'#e4c38c'};
export function iconMarkup(id){const m=MOVES[id]??{},info=identity[id]??{motif:motifs[id]?id:'chakra',index:0},element=m.element??m.ground?.element??JUTSUS[id]?.element??'chakra',color=id==='amaterasu'?'#bd98e4':colors[element]??colors.chakra;const variant=info.index;return `<svg class="jutsu-icon" data-icon="${Object.hasOwn(identity,id)?id:info.motif}" viewBox="0 0 64 64" aria-hidden="true" focusable="false" style="color:${color}"><rect x="1" y="1" width="62" height="62" rx="13" fill="currentColor" opacity=".08"/><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${motifs[info.motif]}${variant?`<path d="M${7+variant*5} 60h${variant*5}" stroke-width="3"/><circle cx="54" cy="${7+variant*5}" r="3" fill="currentColor"/>`:''}${m.ground?'<path d="M5 57h54" stroke-width="4"/>':''}${m.aerial==='air'?'<path d="m6 15 5-7 5 7"/>':''}</g></svg>`;}
export function mountIcon(node,id){if(node.dataset.iconId===id)return;node.dataset.iconId=id;node.innerHTML=iconMarkup(id);}
