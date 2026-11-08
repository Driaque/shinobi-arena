import {artworkSources} from './packages/ui/painted-art.js';
import { CHARACTERS } from './packages/engine/index.js';
import {portraitSources} from './packages/presentation/artwork.js';
function portrait(canvas,character){
 const c=canvas.getContext('2d');canvas.width=144;canvas.height=152;
 const g=c.createLinearGradient(0,0,144,152);g.addColorStop(0,character.color);g.addColorStop(1,'#102033');c.fillStyle=g;c.fillRect(0,0,144,152);
 c.fillStyle='#172a3d';c.beginPath();c.moveTo(12,152);c.quadraticCurveTo(15,96,72,96);c.quadraticCurveTo(129,96,132,152);c.fill();
 c.fillStyle=character.skin??'#c79776';c.beginPath();c.ellipse(72,63,29,38,0,0,Math.PI*2);c.fill();
 c.fillStyle=character.hair;c.beginPath();c.ellipse(72,36,31,22,0,Math.PI,Math.PI*2);c.lineTo(103,52);c.quadraticCurveTo(72,32,41,52);c.fill();
 c.strokeStyle=character.color;c.lineWidth=6;c.beginPath();c.moveTo(23,142);c.lineTo(43,111);c.lineTo(72,132);c.lineTo(101,111);c.lineTo(121,142);c.stroke();
 c.fillStyle='#152335';c.fillRect(57,61,9,3);c.fillRect(80,61,9,3);
}
export function createRoster(container, player, initial, onChange) {
  for(const character of Object.values(CHARACTERS).sort((a,b)=>(a.classification==='original'?0:1)-(b.classification==='original'?0:1))){
    const card=document.createElement('label');card.className='character-card';card.dataset.character=character.id;card.style.setProperty('--character-color',character.color);
    const input=document.createElement('input');input.type='radio';input.name=`character${player}`;input.value=character.id;input.checked=character.id===initial;input.className='roster-input';input.setAttribute('aria-label',`${player===0?'Player one':'Opponent'} ${character.name}`);
    const canvas=document.createElement('canvas');canvas.className='character-portrait';canvas.setAttribute('aria-hidden','true');portrait(canvas,character);
    const copy=document.createElement('span');copy.className='character-copy';
    const name=document.createElement('strong');name.textContent=character.name;
    const style=document.createElement('small');style.textContent=`${character.era} · ${character.title}`;copy.append(name,style);if(character.releaseState==='unreleased'){const preview=document.createElement('small');preview.className='rival-preview-badge';preview.textContent='UNRELEASED · ELITE PREVIEW';copy.append(preview);card.dataset.unreleased='true';}
    const selected=document.createElement('span');selected.className='pick-mark';selected.setAttribute('aria-hidden','true');selected.textContent=player===0?'P1':'CPU';
    let visual=canvas;
    if(character.portrait||character.classification==='original'){const img=document.createElement('img');img.className='character-portrait concept-portrait';const art=character.classification==='original'?portraitSources(character.id):artworkSources('fighter',character.id);img.src=art?.src??character.portrait;if(art){img.srcset=art.srcset;img.sizes='(max-height: 520px) 72px, (max-width: 620px) 88px, 112px';img.dataset.paintedPortrait=character.id;}img.loading='lazy';img.decoding='async';img.alt='';img.width=144;img.height=152;img.addEventListener('error',()=>img.replaceWith(canvas),{once:true});visual=img;}
    card.append(input,visual,copy,selected);input.addEventListener('change',onChange);container.append(card);
    // All roster portraits remain native responsive images.
  }
  const empty=document.createElement('p');empty.className='roster-empty';empty.textContent='No matching fighters.';empty.hidden=true;container.after(empty);
}

