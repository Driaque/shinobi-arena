import {actionPhase} from './packages/engine/training.js';
import { ARENA, MOVES, CHARACTERS, activeAwakening } from './packages/engine/index.js';
export function createRenderer(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const c=canvas.getContext('2d');
  let viewHeight=ARENA.height,zoom=1;
  function resize(){
    const rect=canvas.parentElement.getBoundingClientRect();
    viewHeight=Math.min(720,Math.max(300,ARENA.width*rect.height/Math.max(1,rect.width)));
    zoom=1;

  }
  new ResizeObserver(resize).observe(canvas.parentElement);resize();
  const line = (x1,y1,x2,y2,color,width) => { c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke(); };
  const circle = (x,y,r,color) => { c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill(); };
  function background(tick) {
    const sky=c.createLinearGradient(0,0,0,720);sky.addColorStop(0,'#101e32');sky.addColorStop(.65,'#355260');sky.addColorStop(1,'#182934');c.fillStyle=sky;c.fillRect(-1280,0,3840,720);
    const halo=c.createRadialGradient(930,170,10,930,170,240);halo.addColorStop(0,'#f5dba82a');halo.addColorStop(1,'#e2e7e500');c.fillStyle=halo;c.fillRect(600,0,600,470);
    circle(930,170,56,'#cdd7cd');circle(912,155,54,'#233849');
    for(let layer=0;layer<3;layer++){
      c.fillStyle=['#263d4b','#1f3441','#172d38'][layer];c.beginPath();c.moveTo(-1280,570);
      for(let x=-1280;x<=2560;x+=40)c.lineTo(x,340+layer*55-Math.sin(x*.008+layer)*55-Math.cos(x*.019+layer)*26);
      c.lineTo(2560,600);c.closePath();c.fill();
    }
    // Forest silhouettes and shrine posts, authored directly as geometry.
    for(const x of [80,160,1110,1200]){
      line(x,535,x-10,220,'#112733',13);line(x-7,330,x-63,264,'#112733',9);line(x-6,360,x+55,289,'#112733',8);
      for(let i=0;i<4;i++){c.fillStyle='#132c36';c.beginPath();c.ellipse(x+(i%2?25:-25),230+i*29,60,26,i*.3,0,Math.PI*2);c.fill();}
    }
    c.fillStyle='#20343b';c.fillRect(-1280,570,3840,150);
    const ground=c.createLinearGradient(0,570,0,720);ground.addColorStop(0,'#7e8e865c');ground.addColorStop(1,'#152630');c.fillStyle=ground;c.fillRect(-1280,570,3840,150);
    line(-1280,571,2560,571,'#8fa79b5a',2);
    for(let i=0;i<30;i++){const x=(i*137+tick*.3)%1320;const y=250+(i*89)%280;circle(x,y,1.5,'#d3e4c547');}
  }
  function ninja(f, state, ghost=false) {
    const x=f.x, ground=ARENA.floor-f.y;
    c.save();c.translate(x,ground);c.scale(f.facing,1);
    if(ghost)c.globalAlpha=.3;
    const form=activeAwakening(f);
    if(form){
      c.save();const aura=c.createRadialGradient(0,-75,15,0,-75,130);aura.addColorStop(0,form.color+'88');aura.addColorStop(1,form.color+'00');c.fillStyle=aura;c.fillRect(-135,-220,270,250);
      c.strokeStyle=form.color+'aa';c.lineWidth=3;
      if(f.character==='naruto')for(let tail=0;tail<9;tail++){const a=tail/8*Math.PI*1.2-Math.PI*.8;c.beginPath();c.moveTo(-15,-55);c.quadraticCurveTo(-85-Math.cos(a)*30,-50+Math.sin(a)*65,-65-Math.cos(a)*80,-80+Math.sin(a)*110+Math.sin(state.tick*.1+tail)*7);c.stroke();}
      if(form.name==='Susanoo'){c.fillStyle=form.color+'25';c.beginPath();c.moveTo(-70,0);c.lineTo(-80,-175);c.lineTo(-35,-220);c.lineTo(35,-220);c.lineTo(80,-175);c.lineTo(70,0);c.closePath();c.fill();c.stroke();for(let r=0;r<4;r++)line(-58,-70-r*25,58,-70-r*25,form.color+'55',3);}
      else if(f.character!=='naruto')for(let r=0;r<5;r++)line(-45+r*23,-15,-45+r*23,-170-(r%2)*30,form.color+'77',2);
      c.restore();
    }
    c.fillStyle='#0005';c.beginPath();c.ellipse(0,f.y,39,8,0,0,Math.PI*2);c.fill();
    const action=f.action, move=action?MOVES[action.move]:null;
    const attacking=action && action.age>=move.startup && action.age<move.startup+move.active;
    const moving=!action&&!f.stun&&((Boolean(f.previous.left)!==Boolean(f.previous.right))||Math.abs(f.previous.moveX??0)>.01);
    const phase=state.tick*.32, stride=moving?Math.sin(phase)*18:3;
    const bob=moving?Math.abs(Math.sin(phase))*3:Math.sin(state.tick*.06)*1.5;
    c.translate(0,-bob);const orange=f.character==='naruto',character=CHARACTERS[f.character];
    if(f.invulnerable>0)c.globalAlpha*=.5;
    const cloth=state.tick-f.lastHit<5&&!f.blockedHit?'#fff2d4':form?.color??character.color;
    const dark=orange?'#223446':'#242d48', skin=f.character==='silent'?'#d6c2b4':'#e6b18b';
    if(['silent','winta'].includes(f.character)){c.fillStyle=character.hair;c.fillRect(-26,-125,28,57);}
    // Bent legs, sandals and torso.
    line(-12,-48,-15-stride,-25,dark,17);line(-15-stride,-25,-16+stride,-6,cloth,13);
    line(11,-48,14+stride,-25,dark,17);line(14+stride,-25,20-stride,-6,cloth,13);
    line(-21+stride,-4,-5+stride,-4,'#172338',10);line(12-stride,-4,30-stride,-4,'#172338',10);
    c.fillStyle=cloth;c.beginPath();c.moveTo(-22,-94);c.lineTo(17,-94);c.lineTo(23,-49);c.lineTo(-20,-49);c.closePath();c.fill();
    c.fillStyle=dark;c.fillRect(-22,-58,45,8);line(-18,-91,16,-91,dark,9);
    const armY=f.blocking?-112:attacking?(action.move==='attack2'?-56:-80):-65, armX=f.blocking?25:attacking?68:30;
    if(attacking&&action.move==='attack3'){line(10,-48,66,-66,cloth,16);line(66,-66,93,-96,dark,13);}
    line(-14,-86,-27,-64,dark,13);line(-27,-64,-16,-52,skin,11);
    line(12,-87,32,armY-6,cloth,14);line(32,armY-6,armX,armY,skin,11);circle(armX,armY,7,skin);
    circle(0,-111,19,skin);
    c.fillStyle=character.hair;c.beginPath();c.moveTo(-21,-114);c.lineTo(-26,-135);c.lineTo(-12,-130);c.lineTo(-7,-145);c.lineTo(3,-132);c.lineTo(16,-143);c.lineTo(16,-128);c.lineTo(27,-130);c.lineTo(18,-108);c.closePath();c.fill();
    line(-17,-120,16,-120,'#304257',9);line(-9,-120,10,-120,'#9eafb9',6);circle(8,-110,2,'#21334b');
    // Headband ribbons trail behind the fighter.
    line(-19,-120,-41,-113+Math.sin(phase)*4,dark,4);line(-19,-119,-42,-125+Math.cos(phase)*4,dark,4);
    if(f.blocking || state.tick-f.lastHit<5&&f.blockedHit){c.strokeStyle='#80d6eb';c.lineWidth=4;c.beginPath();c.ellipse(26,-70,30,65,0,-1.4,1.4);c.stroke();}
    if(attacking&&['attack','attack2','attack3'].includes(action.move)){line(38,-81,88,-86,'#ffe1aa',4);line(42,-69,81,-70,'#ffe1aa77',2);}
    if(action?.move==='special1'||action?.move==='chidori'||action?.move==='lionFists'||action?.move==='kuramaRasengan'||action?.move==='karmaRasengan'){
      const power=attacking?1:Math.min(1,action.age/move.startup)*.65;
      c.save();c.globalAlpha*=power;
      const aura=c.createRadialGradient(57,-82,3,57,-82,55);aura.addColorStop(0,'#efffff');aura.addColorStop(.35,'#76e5ff');aura.addColorStop(1,'#429aff00');c.fillStyle=aura;c.fillRect(-2,-140,120,120);
      if(action.move!=='chidori'){circle(57,-82,19,'#7adfff');for(let i=0;i<3;i++){c.strokeStyle='#e9fcff';c.lineWidth=2;c.beginPath();c.ellipse(57,-82,18,7,phase+i,0,Math.PI*2);c.stroke();}}
      else for(let i=0;i<8;i++){const a=phase+i*.8;line(57,-82,57+Math.cos(a)*47,-82+Math.sin(a)*40,'#bceaff',2);}
      c.restore();
    }
    if(action?.move==='clone'&&attacking&&!ghost){c.save();c.globalAlpha=.35;line(55,-70,180,-70,'#83d7ed',35);c.restore();}
    if(action&&(['kunai','katana','shuriken'].includes(action.move)||move.sword)){
      const length=move.sword&&action.move!=='kaiken'?90:35;
      line(armX-5,armY,armX+length,armY-15,'#dce6ed',action.move==='katana'?5:4);
      line(armX+2,armY-10,armX+5,armY+7,'#cbb16c',4);
    }
    if(action&&['snakeStrike','seal','chakraStrike'].includes(action.move)&&attacking){
      const color=action.move==='snakeStrike'?'#b6e28c':'#c7a7ee';line(45,-75,action.move==='snakeStrike'?210:105,-80,color,9);
    }
    if(attacking&&action&& !['attack','attack2','attack3','special1','chidori','lionFists','kuramaRasengan','karmaRasengan','clone','kunai','katana','shuriken'].includes(action.move)&&!move.projectile&&!move.buff){
      c.strokeStyle=move.color??character.color;c.lineWidth=7;c.beginPath();c.moveTo(25,-65);c.quadraticCurveTo(Math.min(move.reach,220)*.6,-130,Math.min(move.reach,250),-75);c.stroke();
    }
    if(['silent','winta'].includes(character.id)){
      if(!action){line(-22,-70,-55,-22,'#c6d8e4',4);line(-25,-76,-16,-68,'#ae9b78',4);}
      if(character.id==='silent'){
        c.fillStyle='#1c2c3e';c.fillRect(-16,-108,32,13);circle(8,-110,2,'#83d7ff');
        // Ice glyph rather than the Leaf symbol.
        line(-2,-124,2,-116,'#31596d',1);line(-3,-118,3,-122,'#31596d',1);
        line(-17,-85,16,-85,'#b6ccdb',4);
      }else{
        circle(8,-110,2,'#e9c66f');line(-16,-87,17,-87,'#c7937c',4);
        if(attacking||form||f.buffs.some(b=>b.type==='shinrai'))for(let i=0;i<3;i++){const offset=(state.tick*7+i*19)%48;line(armX+offset,-80-i*12,armX+offset+8,-91-i*12,'#ff7999',2);line(armX+offset+8,-91-i*12,armX+offset+4,-103-i*12,'#ffd499',2);}
      }
    }
    if(character.id==='kakashi'){c.fillStyle='#25394a';c.fillRect(-15,-108,30,12);}
    if(character.id==='sarada'){c.strokeStyle='#e45b72';c.lineWidth=2;c.strokeRect(2,-116,14,9);}
    if(form&&form.name.startsWith('Karma'))line(-2,-120,10,-98,form.color,3);
    if(f.buffs.length||action?.move==='sharingan'){c.strokeStyle=action?.move==='sharingan'?'#eb7175':'#c5eaff';c.lineWidth=2;c.beginPath();c.arc(0,-110,29,0,Math.PI*2);c.stroke();}
    for(const effect of f.effects){const color=effect.type==='poison'?'#a4d87c':effect.type==='burn'?'#f4a35e':'#bf96ea';for(let i=0;i<3;i++)circle(-26+i*25,-30-((state.tick+i*15)%65),3,color);}
    if(f.dash)for(let i=0;i<3;i++)line(-f.dash.direction*(30+i*14),-30-i*25,-f.dash.direction*(75+i*14),-30-i*25,'#afd7eb66',3);
    c.restore();
    if(action?.move==='clone'&&attacking&&!ghost)ninja({...f,x:f.x+f.facing*130,action:null},state,true);
    if(state.tick-f.lastHit<25&&f.lastDamage){c.save();c.font='bold 18px system-ui';c.textAlign='center';c.fillStyle=f.blockedHit?'#98d4e7':'#ffe0ac';c.globalAlpha=1-(state.tick-f.lastHit)/25;c.fillText(`−${f.lastDamage}`,x,ground-160-(state.tick-f.lastHit)*1.2);c.restore();}
    if(state.tick-f.lastHit<8){c.save();c.translate(x,ground-70);for(let i=0;i<7;i++){const a=i*.9;line(Math.cos(a)*15,Math.sin(a)*15,Math.cos(a)*40,Math.sin(a)*40,f.blockedHit?'#89dbea':'#ffd8a0',3);}c.restore();}
  }
  return function render(state) {
    const width=ARENA.width*dpr,height=Math.round(viewHeight*dpr);
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    const needed=Math.min(1,viewHeight*.68/(Math.max(...state.fighters.map(f=>f.y))+150));
    zoom+=(needed-zoom)*.3;
    c.setTransform(dpr*zoom,0,0,dpr*zoom,ARENA.width*dpr*.5*(1-zoom),(viewHeight*.8-ARENA.floor*zoom)*dpr);
    c.save();
    if(!reducedMotion.matches){const recent=state.fighters.find(f=>state.tick-f.lastHit<4);if(recent){const strength=recent.blockedHit?1:4;c.translate(Math.sin(state.tick*13)*strength,Math.cos(state.tick*9)*strength*.5);}}
    background(state.tick);
    if(state.training?.showRanges){
      for(const f of state.fighters){
        const m=MOVES[f.action?.move??(CHARACTERS[f.character].basicChain?.[0]??'attack')],phase=actionPhase(f),ground=ARENA.floor-f.y;
        const color=phase.name==='Active'?'#ff8d77':phase.name==='Recovery'?'#ffd17d':'#79dbc7';
        c.save();c.strokeStyle=color;c.fillStyle=color+'19';c.lineWidth=2;c.setLineDash([7,5]);
        if(!m.projectile&&!m.buff){const x=f.facing===1?f.x:f.x-m.reach;c.fillRect(x,ground-100,m.reach,100);c.strokeRect(x,ground-100,m.reach,100);}
        c.strokeStyle='#b9d5eb66';c.strokeRect(f.x-26,ground-120,52,120);c.setLineDash([]);
        c.font='bold 13px system-ui';c.textAlign='center';c.fillStyle=color;c.fillText(`${phase.name.toUpperCase()}${phase.remaining?' · '+phase.remaining+'f':''}`,f.x,ground-165);c.restore();
      }
    }
    for(const f of state.fighters){
      if(f.replacement){const r=f.replacement,y=ARENA.floor-r.y;c.fillStyle='#96663c';c.fillRect(r.x-15,y-70,30,65);circle(r.x,y-70,15,'#c09361');line(r.x-8,y-62,r.x-8,y-12,'#d2a176',3);for(let i=0;i<3;i++)circle(r.x-28+i*27,y-60-i*15,15,'#cadde74a');}
      ninja(f,state);
    }
    for(const p of state.projectiles){const y=ARENA.floor-p.y;
      if(p.move==='shuriken'){c.save();c.translate(p.x,y);c.rotate(state.tick*.5);for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.fillStyle='#c9dce7';c.beginPath();c.moveTo(0,-4);c.lineTo(20,0);c.lineTo(0,5);c.fill();}circle(0,0,3,'#334b61');c.restore();continue;}
c.save();c.translate(p.x,y);c.scale(p.direction,1);const color=MOVES[p.move].color??'#ffb94d';const fire=c.createRadialGradient(0,0,3,0,0,42);fire.addColorStop(0,'#fff6de');fire.addColorStop(.4,color);fire.addColorStop(1,color+'00');c.fillStyle=fire;c.fillRect(-55,-45,105,90);circle(0,0,20,color);line(-20,0,-56,8,color,9);c.restore();}
    const transformed=state.fighters.find(f=>f.awakeningFlash>0);
    if(transformed){c.textAlign='center';c.font='bold 32px system-ui';c.fillStyle=activeAwakening(transformed).color;c.fillText(activeAwakening(transformed).name.toUpperCase(),640,270);}
    c.restore();
    c.setTransform(dpr,0,0,dpr,0,0);
    c.font='10px system-ui';c.fillStyle='#b8cbcf55';c.textAlign='center';if(!state.training)c.fillText('TRAINING GROUNDS  /  PROCEDURAL ART PROTOTYPE',640,viewHeight-12);
  };
}


