import {STAGES,stageFor,resolveStage} from './packages/engine/stages.js';
import {stageShapes} from './packages/presentation/stages.js';
export const STAGE_KEY='fabled.stage.v1';
export function createStagePicker(onChange){
 let selected='skyglass';try{const saved=localStorage.getItem(STAGE_KEY);if(saved==='random'||STAGES.some(s=>s.id===saved))selected=saved;}catch{}
 const section=document.createElement('section');section.className='stage-selection';section.setAttribute('aria-labelledby','stage-heading');section.innerHTML='<h2 id="stage-heading">Select battle stage</h2><p>Choose your arena before starting a fight. Stages share the same combat layout. Online: the first queued player’s selection sets the stage for both players.</p><div class="stage-grid" role="group" aria-label="Battle stage"></div><p id="stage-current" role="status"></p>';
 document.querySelector('.arena').before(section);
 const buttons=[];
 for(const s of [...STAGES,{id:'random',name:'Random stage',description:'Let the arena choose.'}]){
  const b=document.createElement('button');b.type='button';b.dataset.stage=s.id;b.className='stage-card';
  const thumb=document.createElementNS('http://www.w3.org/2000/svg','svg');thumb.setAttribute('viewBox','0 0 1600 900');thumb.setAttribute('aria-hidden','true');
  for(const shape of stageShapes(s.id==='random'?'forge':s.id)){
   const node=document.createElementNS(thumb.namespaceURI,shape.kind==='ellipse'?'ellipse':'polygon');
   if(shape.kind==='ellipse')for(const [k,v]of Object.entries({cx:shape.x,cy:shape.y,rx:shape.rx,ry:shape.ry}))node.setAttribute(k,v);else node.setAttribute('points',shape.points.join(' '));
   node.setAttribute('fill','#'+shape.color.toString(16).padStart(6,'0'));node.setAttribute('opacity',shape.alpha);thumb.append(node);
  }
  const title=document.createElement('strong'),desc=document.createElement('span');title.textContent=s.name;desc.textContent=s.description;b.append(thumb,title,desc);b.onclick=()=>{selected=s.id;try{localStorage.setItem(STAGE_KEY,selected);}catch{}sync();onChange();};section.querySelector('.stage-grid').append(b);buttons.push(b);
 }
 function sync(){for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.stage===selected));section.querySelector('#stage-current').textContent='Next fight: '+(selected==='random'?'Random stage':stageFor(selected).name);}
 sync();return {value:()=>selected,resolve:()=>resolveStage(selected),lock:locked=>buttons.forEach(b=>{if(b.disabled!==locked)b.disabled=locked;})};
}
