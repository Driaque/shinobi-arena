import { CHARACTERS } from './packages/engine/index.js';
function portrait(canvas, character) {
  const c=canvas.getContext('2d');canvas.width=144;canvas.height=152;c.scale(2,2);
  const bg=c.createLinearGradient(0,0,72,76);bg.addColorStop(0,character.color+'80');bg.addColorStop(1,'#101e30');c.fillStyle=bg;c.fillRect(0,0,72,76);
  c.fillStyle=character.color;c.beginPath();c.moveTo(7,76);c.quadraticCurveTo(8,51,36,51);c.quadraticCurveTo(64,51,65,76);c.fill();
  const longHair=['hinata','orochimaru','itachi','madara'].includes(character.id);c.fillStyle=character.hair;
  if(longHair){c.beginPath();c.ellipse(36,32,24,29,0,0,Math.PI*2);c.fill();c.fillRect(12,29,48,35);}
  c.fillStyle=character.id==='orochimaru'?'#e1d6bd':'#e7b58f';c.beginPath();c.ellipse(36,32,18,23,0,0,Math.PI*2);c.fill();
  c.fillStyle=character.hair;c.beginPath();c.moveTo(14,23);
  if(['naruto','boruto','minato','kakashi','mitsuki'].includes(character.id)){for(const [x,y]of [[10,7],[22,13],[25,0],[35,11],[47,1],[47,14],[61,9],[55,28]])c.lineTo(x,y);}
  else if(['sasuke','madara','kawaki'].includes(character.id)){for(const [x,y]of [[9,9],[25,12],[32,0],[40,12],[57,3],[53,21],[58,30],[43,19],[37,29],[28,18],[17,28]])c.lineTo(x,y);}
  else{c.lineTo(16,7);c.quadraticCurveTo(36,-5,56,9);c.lineTo(57,26);c.lineTo(15,25);}
  c.closePath();c.fill();
  if(character.id!=='orochimaru'){c.fillStyle='#31445a';c.fillRect(17,22,38,8);c.fillStyle='#a5b9c4';c.fillRect(26,23,21,6);}
  c.fillStyle=character.id==='hinata'?'#f0edff':character.id==='sasuke'?'#d7757b':character.id==='orochimaru'?'#e7c660':'#559cc6';
  c.fillRect(25,33,6,3);c.fillRect(42,33,6,3);
  if(character.id==='kakashi'){c.fillStyle='#25394a';c.fillRect(18,38,36,14);}
  if(character.id==='sarada'){c.strokeStyle='#d54d62';c.lineWidth=2;c.strokeRect(22,31,12,8);c.strokeRect(39,31,12,8);c.beginPath();c.moveTo(34,34);c.lineTo(39,34);c.stroke();}
  if(character.id==='gaara'){c.fillStyle='#8b483c';c.fillRect(22,17,3,7);c.fillRect(20,20,8,2);}
  if(character.id==='shikamaru'){c.fillStyle=character.hair;c.beginPath();c.ellipse(37,4,8,7,0,0,Math.PI*2);c.fill();}
c.strokeStyle='#946957';c.lineWidth=1;c.beginPath();c.moveTo(32,46);c.lineTo(41,46);c.stroke();
  if(character.id==='naruto'){c.strokeStyle='#986c52';for(const y of [37,41]){c.beginPath();c.moveTo(20,y);c.lineTo(27,y+1);c.moveTo(47,y+1);c.lineTo(53,y);c.stroke();}}
}
export function createRoster(container, player, initial, onChange) {
  for(const character of Object.values(CHARACTERS)){
    const card=document.createElement('label');card.className='character-card';card.dataset.character=character.id;card.style.setProperty('--character-color',character.color);
    const input=document.createElement('input');input.type='radio';input.name=`character${player}`;input.value=character.id;input.checked=character.id===initial;input.className='roster-input';input.setAttribute('aria-label',`${player===0?'Player one':'Opponent'} ${character.name}`);
    const canvas=document.createElement('canvas');canvas.className='character-portrait';canvas.setAttribute('aria-hidden','true');portrait(canvas,character);
    const copy=document.createElement('span');copy.className='character-copy';
    const name=document.createElement('strong');name.textContent=character.name;
    const style=document.createElement('small');style.textContent=`${character.era} · ${character.title}`;copy.append(name,style);
    const selected=document.createElement('span');selected.className='pick-mark';selected.setAttribute('aria-hidden','true');selected.textContent=player===0?'P1':'CPU';
    let visual=canvas;
    if(character.portrait){const img=document.createElement('img');img.className='character-portrait concept-portrait';img.src=character.portrait;img.alt='';img.width=144;img.height=152;img.addEventListener('error',()=>img.replaceWith(canvas),{once:true});visual=img;}
    card.append(input,visual,copy,selected);input.addEventListener('change',onChange);container.append(card);
  }
  const empty=document.createElement('p');empty.className='roster-empty';empty.textContent='No matching fighters.';empty.hidden=true;container.after(empty);
}

