import {fighterPose} from './motion.js';
import {drawFighterDesign} from './fighter-designs.js';
import {CHARACTERS,MOVES} from './packages/engine/index.js';
const $=s=>document.querySelector(s),canvas=$('#review'),c=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let tick=0,paused=reduced.matches,last=0,acc=0;
function draw(){
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);c.scale(dpr,dpr);
 const scale=Math.min(rect.width/600,rect.height/220),floor=rect.height*.85,sequence=$('#sequence').value;
 c.strokeStyle='#82bcab44';c.beginPath();c.moveTo(0,floor);c.lineTo(rect.width,floor);c.stroke();
 const statuses=[];
 for(const [i,id]of ['aren','silent'].entries()){
  const character=CHARACTERS[id],f={character:id,facing:1,y:0,vy:0,vx:0,travel:0,weapon:id==='silent'?'tachi':'katana',landedAt:-100};
  let move=null,phase='Idle';
  if(sequence==='run'){f.vx=5;f.travel=tick*5;phase='Run';}
  if(sequence==='guard'){f.blocking=true;phase='Guard';}
  if(sequence==='hit'){f.stun=1;phase='Stagger';}
  if(sequence==='jump'){const t=tick%90;f.y=t<60?Math.sin(t/60*Math.PI)*90:0;f.vy=t<30?6:-6;f.landedAt=Math.floor(tick/90)*90+60;phase=t<30?'Rise':t<60?'Fall':'Landing';}
  if(sequence==='combo'){
   const chain=character.basicChain??['katana','skyCleave','katana'],lengths=chain.map(key=>{const m=MOVES[key];return m.startup+m.active+m.recovery+12;});let age=tick%lengths.reduce((a,b)=>a+b,0),index=0;
   while(age>=lengths[index])age-=lengths[index++];
   const key=chain[index],m=MOVES[key];if(age<m.startup+m.active+m.recovery){move=m;f.action={move:key,age};phase=age<m.startup?'Startup':age<m.startup+m.active?'Contact':'Recovery';}else phase='Ready';
  }
  const pose=fighterPose(f,tick,move,reduced.matches);statuses.push(character.name+': '+phase);
  c.save();c.translate(rect.width*(i?.73:.27),floor);c.scale(($('#mirror').checked?-1:1)*scale,scale);c.translate(0,-pose.bob-f.y);c.transform(1,0,-pose.lean,1,0,0);
  drawFighterDesign(c,f,pose,{cloth:character.color,skin:id==='silent'?'#d6c2b4':'#e6b18b',hair:character.hair,move});
  if($('#joints').checked){c.fillStyle='#ff7b98';for(const point of [[13,-89],[pose.elbow?.x??32,pose.elbow?.y??pose.armY-6],[pose.armX,pose.armY],...pose.legs.flatMap(l=>[[l.kx,l.ky],[l.fx,l.fy]])]){c.beginPath();c.arc(...point,2.5,0,Math.PI*2);c.fill();}}
  c.restore();c.fillStyle='#c1e6db';c.font='15px system-ui';c.textAlign='center';c.fillText(character.name,rect.width*(i?.73:.27),28);
 }
 $('#readout').textContent=`Tick ${tick} · ${statuses.join(' · ')}`;canvas.dataset.tick=tick;
}
function button(){ $('#pause').textContent=paused?'Play':'Pause';}
$('#pause').onclick=()=>{paused=!paused;acc=0;button();};$('#step').onclick=()=>{paused=true;acc=0;tick++;button();draw();};$('#reset').onclick=()=>{tick=0;acc=0;draw();};$('#sequence').onchange=()=>{tick=0;acc=0;draw();};
for(const id of ['joints','mirror'])$('#'+id).onchange=draw;
const observer=new ResizeObserver(draw);observer.observe(canvas.parentElement);
reduced.addEventListener('change',()=>{if(reduced.matches)paused=true;button();draw();});
function frame(now){if(last&&!paused&&!document.hidden){acc+=Math.min(.1,(now-last)/1000)*Number($('#speed').value);while(acc>=1/60){tick++;acc-=1/60;}draw();}last=now;requestAnimationFrame(frame);}
button();draw();requestAnimationFrame(frame);
