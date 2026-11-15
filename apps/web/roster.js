import {artworkSources} from './packages/ui/painted-art.js';
import { CHARACTERS } from './packages/engine/index.js';
import {portraitSources} from './packages/presentation/artwork.js';
import {hasFighterAtlas} from './packages/presentation/fighter-atlases.js';
import {rosterAccess} from './story-roster.js';

function applyRosterAccess(card, input, status, character) {
  const {locked,hint} = rosterAccess(character);
  const silhouette = locked || !hasFighterAtlas(character.id);
  card.dataset.storyLocked = String(locked);
  card.dataset.silhouette = String(silhouette);
  input.setAttribute('aria-disabled',String(locked));
  input.disabled = locked;
  status.hidden = !silhouette;
  status.textContent = locked ? 'Locked · '+hint : 'Sprite in development';
}

export function createRoster(container, player, initial, onChange) {
  for(const character of Object.values(CHARACTERS).sort((a,b)=>(a.classification==='original'?0:1)-(b.classification==='original'?0:1))){
    const card=document.createElement('label');card.className='character-card';card.dataset.character=character.id;card.style.setProperty('--character-color',character.color);
    const input=document.createElement('input');input.type='radio';input.name=`character${player}`;input.value=character.id;input.checked=character.id===initial;input.className='roster-input';input.setAttribute('aria-label',`${player===0?'Player one':'Opponent'} ${character.name}`);
    const copy=document.createElement('span');copy.className='character-copy';
    const name=document.createElement('strong');name.textContent=character.name;
    const status=document.createElement('small');status.className='rival-preview-badge';
    applyRosterAccess(card,input,status,character);
    const style=document.createElement('small');style.textContent=card.dataset.storyLocked==='true'?character.era:character.era+' · '+character.title;
    copy.append(name,style,status);
    const selected=document.createElement('span');selected.className='pick-mark';selected.setAttribute('aria-hidden','true');selected.textContent=player===0?'P1':'CPU';
    const visual=document.createElement('img');
    visual.className='character-portrait concept-portrait';
    const art=character.classification==='original'?portraitSources(character.id):artworkSources('fighter',character.id);
    visual.src=art?.src??character.portrait;
    if(art){
      visual.srcset=art.srcset;
      visual.sizes='(max-height: 520px) 72px, (max-width: 620px) 88px, 112px';
      visual.dataset.paintedPortrait=character.id;
    }
    visual.loading='lazy';visual.decoding='async';visual.alt='';visual.width=144;visual.height=152;
    card.append(input,visual,copy,selected);input.addEventListener('change',onChange);container.append(card);
    // All roster portraits remain native responsive images.
  }
  const empty=document.createElement('p');empty.className='roster-empty';empty.textContent='No matching fighters.';empty.hidden=true;container.after(empty);
}

