import {paintPracticeEffects} from './practice-effects.js';
import {fighterPose,sampleFighters} from './motion.js';
import {actionPhase} from './packages/engine/training.js';
import { ARENA, fighterBody, MOVES as LIVE_MOVES, CHARACTERS as LIVE_CHARACTERS, AWAKENINGS as LIVE_AWAKENINGS } from './packages/engine/index.js';
export function createRenderer(canvas, {moves=LIVE_MOVES,characters=LIVE_CHARACTERS,awakenings=LIVE_AWAKENINGS}={}) {
  const MOVES=moves,CHARACTERS=characters;
  const activeAwakening=f=>f.awakeningTicks>0?awakenings[CHARACTERS[f.character].awakening]:null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const c=canvas.getContext('2d');
  let worldWidth=ARENA.width,viewHeight=ARENA.height,zoom=1,frameTick=-1,frameRound=-1,blendStart=0,blendDuration=16,previous=[],targets=[],shown=[],visualTick=0,projectilePrevious=[],projectileTargets=[],projectileShown=[];
  const trails=[[],[]];
  let externalActors=false;
  function resize(){
    const rect=canvas.parentElement.getBoundingClientRect();
    viewHeight=Math.min(720,Math.max(300,worldWidth*rect.height/Math.max(1,rect.width)));
    zoom=1;

  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas.parentElement);resize();
  const line = (x1,y1,x2,y2,color,width) => { c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke(); };
  const circle = (x,y,r,color) => { c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill(); };
  function background(tick,center=640) {
    const parallax=(center-640)*.035;
    const sky=c.createLinearGradient(0,0,0,720);sky.addColorStop(0,'#101e32');sky.addColorStop(.65,'#355260');sky.addColorStop(1,'#182934');c.fillStyle=sky;c.fillRect(-1280,0,3840,720);
    const halo=c.createRadialGradient(930,170,10,930,170,240);halo.addColorStop(0,'#f5dba82a');halo.addColorStop(1,'#e2e7e500');c.fillStyle=halo;c.fillRect(600,0,600,470);
    circle(930,170,56,'#cdd7cd');circle(912,155,54,'#233849');
    for(let layer=0;layer<3;layer++){
      c.fillStyle=['#263d4b','#1f3441','#172d38'][layer];c.beginPath();c.moveTo(-1280,570);
      for(let x=-1280;x<=2560;x+=40)c.lineTo(x,340+layer*55-Math.sin(x*.008+layer)*55-Math.cos(x*.019+layer)*26);
      c.lineTo(2560,600);c.closePath();c.fill();
    }
    // Distant cedar grove, a shrine gate and carved stonework add scale without image assets.
    c.save();c.translate(-parallax,0);
    for(let i=0;i<22;i++){const x=i*78-190,h=100+(i*43)%95;line(x,540,x,540-h,'#142e38',4);for(let b=0;b<4;b++){c.fillStyle=i%2?'#193943':'#1c3d45';c.beginPath();c.moveTo(x,540-h+b*22);c.lineTo(x-27-b*3,572-h+b*22);c.lineTo(x+27+b*3,572-h+b*22);c.fill();}}
    for(const x of [205,1035]){line(x,560,x,355,'#563e39',14);line(x+27,560,x+27,362,'#392f31',7);line(x-30,363,x+61,363,'#9a6650',10);line(x-40,347,x+70,347,'#2b3237',12);line(x+3,401,x+26,401,'#d1b17e',3);}
    line(175,369,1100,369,'#51453e',5);for(let i=0;i<9;i++){const x=260+i*90;line(x,370,x+5,389,'#bfae8c',2);}
    c.restore();
    // Forest silhouettes and shrine posts, authored directly as geometry.
    for(const x of [80,160,1110,1200]){
      line(x,535,x-10,220,'#112733',13);line(x-7,330,x-63,264,'#112733',9);line(x-6,360,x+55,289,'#112733',8);
      for(let i=0;i<4;i++){c.fillStyle='#132c36';c.beginPath();c.ellipse(x+(i%2?25:-25),230+i*29,60,26,i*.3,0,Math.PI*2);c.fill();}
    }
    c.fillStyle='#20343b';c.fillRect(-1280,570,3840,150);
    const ground=c.createLinearGradient(0,570,0,720);ground.addColorStop(0,'#7e8e865c');ground.addColorStop(1,'#152630');c.fillStyle=ground;c.fillRect(-1280,570,3840,150);
    line(-1280,571,2560,571,'#8fa79b5a',2);
    // Perspective flagstones with deterministic cracks, moss and foreground grasses.
    for(let row=0;row<4;row++){const y=575+row*row*9;line(-200,y,1480,y,'#a7b7a220',1);for(let col=0;col<15;col++){const x=col*106+(row%2)*53;line(x,y,x-20,Math.min(720,y+20+row*13),'#0b202b77',2);}}
    for(let i=0;i<44;i++){const x=(i*193)%1350-35,y=578+(i*37)%125;line(x,y,x+8,y+2,'#90a88d33',2);if(i%3===0){line(x,y,x-4,y-9,'#719c7b66',2);line(x,y,x+6,y-11,'#719c7b66',1);}}
    for(const x of [135,1142]){c.fillStyle='#283d42';c.fillRect(x-15,510,30,55);c.fillRect(x-24,511,48,9);c.fillRect(x-20,474,40,35);c.beginPath();c.moveTo(x-31,477);c.lineTo(x,455);c.lineTo(x+31,477);c.fill();const glow=c.createRadialGradient(x,493,2,x,493,60);glow.addColorStop(0,'#ffc77750');glow.addColorStop(1,'#ffc77700');c.fillStyle=glow;c.fillRect(x-60,433,120,120);c.fillStyle='#edbb75';c.fillRect(x-7,484,14,17);}
    const mist=c.createLinearGradient(0,490,0,600);mist.addColorStop(0,'#b7d3ce00');mist.addColorStop(.6,'#b7d3ce0b');mist.addColorStop(1,'#b7d3ce00');c.fillStyle=mist;c.fillRect(-200,490,1680,110);
    for(let i=0;i<(document.documentElement.dataset.effects==='off'?0:30);i++){const x=(i*137+tick*.3)%1320;const y=250+(i*89)%280;circle(x,y,1.5,'#d3e4c547');}
  }
  function ninja(f, state, ghost=false) {
    if(externalActors){if(!ghost)paintPracticeEffects(c,f,state,MOVES);return;}
    const x=f.x, ground=ARENA.floor+(f.depth??0)*.65-f.y;
    c.save();c.translate(x,ground);c.scale(f.facing,1);
    if(ghost)c.globalAlpha*=.3;
    const form=f.awakeningTicks>0?awakenings[CHARACTERS[f.character].awakening]:null;
    if(form&&!ghost){
      c.save();const aura=c.createRadialGradient(0,-75,15,0,-75,130);aura.addColorStop(0,form.color+'88');aura.addColorStop(1,form.color+'00');c.fillStyle=aura;c.fillRect(-135,-220,270,250);
      c.strokeStyle=form.color+'aa';c.lineWidth=3;
      if(f.character==='naruto')for(let tail=0;tail<9;tail++){const a=tail/8*Math.PI*1.2-Math.PI*.8;c.beginPath();c.moveTo(-15,-55);c.quadraticCurveTo(-85-Math.cos(a)*30,-50+Math.sin(a)*65,-65-Math.cos(a)*80,-80+Math.sin(a)*110+Math.sin(state.tick*.1+tail)*7);c.stroke();}
      if(form.name==='Susanoo'){c.fillStyle=form.color+'25';c.beginPath();c.moveTo(-70,0);c.lineTo(-80,-175);c.lineTo(-35,-220);c.lineTo(35,-220);c.lineTo(80,-175);c.lineTo(70,0);c.closePath();c.fill();c.stroke();for(let r=0;r<4;r++)line(-58,-70-r*25,58,-70-r*25,form.color+'55',3);}
      else if(f.character!=='naruto')for(let r=0;r<5;r++)line(-45+r*23,-15,-45+r*23,-170-(r%2)*30,form.color+'77',2);
      c.restore();
    }
    if(!ghost){c.fillStyle='#0005';c.beginPath();c.ellipse(0,f.y,Math.max(17,39*(f.scale??1)-f.y*.05),7,0,0,Math.PI*2);c.fill();}
    c.scale(f.scale??1,f.scale??1);
    const action=f.action, move=action?MOVES[action.move]:null;
    const attacking=action && action.age>=move.startup && action.age<move.startup+move.active;
    const pose=fighterPose(f,state.tick,move,reducedMotion.matches),phase=state.tick*.29,stride=pose.stride;
    c.translate(0,-pose.bob);if(!reducedMotion.matches&&state.tick-f.landedAt>=0&&state.tick-f.landedAt<6)c.scale(1.03,.95);if(f.crouching)c.scale(1,.63);c.transform(1,0,-pose.lean,1,0,0);
    const orange=f.character==='naruto',character=CHARACTERS[f.character];
    if(f.invulnerable>0)c.globalAlpha*=.5;
    const shade=(hex,k)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(hex.slice(i,i+2),16)+k)).toString(16).padStart(2,'0')).join('');
    const cloth=state.tick-f.lastHit<5&&!f.blockedHit?'#fff2d4':form?.color??character.color;
    const dark=orange?'#223446':'#242d48', skin=character.skin??(f.character==='silent'?'#d6c2b4':'#e6b18b');
    if(f.character==='dora'){c.fillStyle=character.hair;c.beginPath();c.moveTo(-19,-130);c.quadraticCurveTo(-46,-85,-28,form?-20:-48);c.lineTo(8,form?-25:-52);c.lineTo(13,-125);c.fill();}
    if(['silent','winta'].includes(f.character)){c.fillStyle=character.hair;c.beginPath();c.moveTo(-17,-134);c.quadraticCurveTo(-39-pose.trail,-98,-31-pose.trail,-63);c.lineTo(-13,-75);c.lineTo(3,-123);c.fill();for(let strand=0;strand<4;strand++)line(-19-strand*3,-117,-27-strand*3-pose.trail,-70+strand*3,'#ffffff22',1);}
    // Recognizable back silhouettes sit behind the articulated limbs.
    if(character.id==='gaara'){c.fillStyle='#a9936b';c.beginPath();c.ellipse(-27,-71,20,29,-.2,0,Math.PI*2);c.ellipse(-31,-106,13,18,-.2,0,Math.PI*2);c.fill();line(-43,-83,-12,-76,'#4d3d37',4);line(-43,-66,-11,-61,'#4d3d37',3);}
    if(character.faction==='Akatsuki'||['itachi','orochimaru','minato'].includes(character.id)){c.fillStyle=character.id==='minato'?'#dfd5b7':character.faction==='Akatsuki'?'#162532':'#a29c8b';c.beginPath();c.moveTo(-25,-98);c.lineTo(-38-pose.trail*.5,-13);c.lineTo(34,-15);c.lineTo(22,-96);c.fill();line(-35-pose.trail*.5,-17,30,-19,character.id==='itachi'?'#9f5261':'#a87961',3);}
    if(['sasuke','sarada','minato'].includes(character.id))line(-30,-36,4,-121,'#25394b',6);
    if(f.weapon==='championKatana'){line(-21,-94,-41,-20,'#e9c166',5);line(-32,-45,-45,-51,'#fff0aa',3);}
    // Bent legs, sandals and torso.
    for(const [i,leg]of pose.legs.entries()){line(i?11:-12,-48,leg.kx,leg.ky,dark,16);line(leg.kx,leg.ky,leg.fx,leg.fy-2,cloth,12);line(leg.fx-7,leg.fy,leg.fx+9,leg.fy,'#172338',9);line(leg.fx-4,leg.fy-4,leg.fx+5,leg.fy-4,'#91a4ae',2);line(leg.kx-3,leg.ky,leg.kx+3,leg.ky,'#ffffff33',2);}
    const fabric=c.createLinearGradient(-23,-90,25,-48);fabric.addColorStop(0,shade(cloth,22));fabric.addColorStop(.4,cloth);fabric.addColorStop(1,shade(cloth,-35));c.fillStyle=fabric;c.beginPath();c.moveTo(-22,-94);c.lineTo(17,-94);c.lineTo(23,-49);c.lineTo(-20,-49);c.closePath();c.fill();c.strokeStyle='#07131c';c.lineWidth=1.5;c.stroke();
    c.fillStyle=dark;c.fillRect(-22,-58,45,8);line(-18,-91,16,-91,dark,9);
    const trim=['silent','winta','madara'].includes(f.character)?'#b7bac2':'#91a2b3';
    // Layered vest plates, collar, seams, belt knot and utility pouch.
    c.fillStyle=dark+'99';c.beginPath();c.moveTo(-18,-89);c.lineTo(-3,-80);c.lineTo(-4,-62);c.lineTo(-17,-65);c.fill();
    line(-18,-92,-3,-81,trim,2);line(15,-92,4,-81,trim,2);line(0,-78,0,-60,'#ffffff33',1);
    for(let i=0;i<3;i++)line(-18,-77+i*6,-6,-74+i*6,'#00000038',2);
    c.fillStyle='#182632';c.fillRect(-27,-57,12,14);line(-25,-55,-17,-55,trim,2);circle(3,-54,3,'#b2a184');
    line(-5,-52,-19-pose.trail,-36,'#263c50',4);line(-4,-52,-12-pose.trail,-29,'#63798c',3);
    if(character.id==='naruto'){c.fillStyle='#253449';c.fillRect(-22,-89,13,23);line(1,-88,1,-60,'#f3d7a0',2);circle(1,-77,2,'#243648');}
    if(['sasuke','boruto','kawaki'].includes(character.id)){line(-19,-94,-10,-82,'#343648',7);line(14,-94,8,-81,'#343648',7);line(-19,-56,22,-56,character.id==='sasuke'?'#9b85b8':'#d6a4bd',5);}
    if(['silent','winta','madara','kakashi'].includes(character.id)){const armor=character.id==='kakashi'?'#637e68':character.id==='silent'?'#6a8b9e':'#8c4c56';for(let plate=0;plate<3;plate++){c.fillStyle=armor;c.fillRect(-19,-86+plate*9,35,7);line(-17,-84+plate*9,13,-84+plate*9,'#ffffff2b',1);}for(const side of [-1,1]){c.fillStyle=armor;c.beginPath();c.moveTo(side*16,-94);c.lineTo(side*30,-89);c.lineTo(side*30,-76);c.lineTo(side*18,-82);c.fill();line(side*20,-91,side*28,-88,'#cad5d455',2);}}
    if(['lee','hinata','sakura'].includes(character.id)){for(let wrap=0;wrap<3;wrap++){line(-19+stride,-18+pose.foot+wrap*4,-9+stride,-18+pose.foot+wrap*4,'#d5d9cd',2);line(15-stride,-18+pose.foot+wrap*4,24-stride,-18+pose.foot+wrap*4,'#d5d9cd',2);}}
    const armY=pose.armY,armX=pose.armX;
    if(pose.weight>.2&&(action?.move==='attack3'||action?.move==='airAttack3')){line(10,-48,66,-66,cloth,16);line(66,-66,93,-96,dark,13);}
    if(f.charging||move?.projectile||move?.ground||move?.buff){line(-14,-86,8,-96,dark,13);line(8,-96,pose.armX-9,pose.armY+7,skin,10);circle(pose.armX-9,pose.armY+7,5,skin);}else{line(-14,-86,-27,-64,dark,13);line(-27,-64,-16,-52,skin,11);}
    line(12,-87,32,armY-6,cloth,14);line(32,armY-6,armX,armY,skin,11);circle(armX,armY,7,'#273848');circle(armX+2,armY-1,4,skin);line(armX,armY+2,armX+5,armY+1,'#b18d75',1);
    const face=c.createRadialGradient(-7,-119,2,0,-108,22);face.addColorStop(0,shade(skin,18));face.addColorStop(.65,skin);face.addColorStop(1,shade(skin,-28));c.fillStyle=face;c.beginPath();c.ellipse(0,-111,16,18,0,0,Math.PI*2);c.fill();c.strokeStyle='#322c32';c.lineWidth=1;c.stroke();
    c.fillStyle=character.hair;c.beginPath();
    if(character.id==='dora'){c.ellipse(-3,-127,22,15,-.2,Math.PI,Math.PI*2);c.lineTo(18,-113);c.lineTo(8,-124);c.lineTo(-19,-112);}
    else{c.moveTo(-18,-114);c.lineTo(-22,-132);c.lineTo(-10,-128);c.lineTo(-6,-139);c.lineTo(3,-129);c.lineTo(14,-138);c.lineTo(14,-126);c.lineTo(22,-127);c.lineTo(16,-108);}
    c.closePath();c.fill();
    if(character.id==='dora'){line(-17,-123,16,-123,'#dfbe75',3);circle(3,-124,3,'#8ce5df');}
    else{line(-17,-120,16,-120,'#304257',9);line(-9,-120,10,-120,'#9eafb9',6);}circle(8,-110,2,'#21334b');line(5,-114,13,-114,'#34303b',1.5);line(14,-107,17,-104,'#a97362',1);line(4,-99,11,-99,'#a77565',1);circle(-16,-109,4,skin);
    if(character.id==='naruto')for(const y of [-108,-104]){line(-12,y,-4,y+2,'#966d50',1);line(9,y+1,16,y-1,'#966d50',1);}
    if(character.faction==='Akatsuki'){circle(-24,-69,6,'#a83b48');circle(-18,-70,7,'#a83b48');circle(-12,-67,5,'#a83b48');line(-29,-64,-8,-64,'#e1b5af',1);}
    if(character.id==='pain'){for(const ex of [-7,8]){circle(ex,-110,4,'#a88fc1');c.strokeStyle='#4c3962';c.lineWidth=1;for(const r of [2,4]){c.beginPath();c.arc(ex,-110,r,0,Math.PI*2);c.stroke();}}for(let i=0;i<3;i++)circle(12,-104+i*3,1,'#182433');}
    if(character.id==='zetsu'){c.fillStyle='#d3d9c9';c.fillRect(-16,-115,15,18);c.fillStyle='#18262a';c.fillRect(-1,-115,16,18);for(const side of [-1,1]){c.fillStyle='#527b4a';c.beginPath();c.moveTo(side*16,-90);c.quadraticCurveTo(side*43,-117,side*28,-145);c.lineTo(side*22,-120);c.lineTo(side*16,-105);c.fill();}}
    if(character.id==='kisame'){for(let i=0;i<3;i++)line(-13,-105+i*3,-6,-103+i*3,'#3b5967',1);}
    if(character.id==='obito'){c.fillStyle='#d28d45';c.beginPath();c.ellipse(0,-109,17,20,0,0,Math.PI*2);c.fill();c.strokeStyle='#4a3c36';c.lineWidth=1.5;for(let r=4;r<17;r+=4){c.beginPath();c.arc(5,-110,r,.2,Math.PI*1.8);c.stroke();}circle(7,-110,3,'#202638');}
    if(character.id==='itachi'){line(-10,-113,-8,-102,'#665764',1);circle(-18,-70,7,'#ad5361');circle(-10,-70,6,'#ad5361');line(-23,-65,-5,-65,'#d58a8c',1);}
    if(character.id==='silent'){line(-28,-72,-36,-34,'#273f55',8);line(-36,-34,-49-pose.trail,-23,'#668396',4);}
    // Headband ribbons trail behind the fighter.
    line(-19,-120,-41-pose.trail,-113+Math.sin(phase)*4,dark,4);line(-19,-119,-42-pose.trail,-125+Math.cos(phase)*4,dark,4);
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
    if(action&&pose.weight>.05&&!ghost&&!move.projectile&&!move.buff&&!move.utility){
      c.save();c.globalAlpha*=pose.weight*.65;c.strokeStyle=move.color??(move.sword?'#d8f2ff':character.color);c.lineWidth=move.sword?5:3;
      c.beginPath();c.ellipse(28,-78,Math.min(move.reach??110,150)*.65,43,move.spike?-.6:.1,-1.5+pose.weight,1.3+pose.weight);c.stroke();c.globalAlpha*=.4;c.lineWidth=12;c.stroke();c.restore();
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
    if(character.id==='dora'){
      // Regal robe, long hair, gold jewelry and fans keep the stage silhouette distinct.
      c.fillStyle=cloth;c.beginPath();c.moveTo(-20,-58);c.lineTo(form?-34:-27,-16);c.lineTo(4,-27);c.lineTo(29,-15);c.lineTo(22,-58);c.closePath();c.fill();
      line(-18,-91,-8,-77,'#dfbe75',2);line(-8,-77,12,-90,'#dfbe75',2);circle(-8,-77,4,'#8ce5df');circle(-16,-107,3,'#e8c87b');circle(15,-107,3,'#e8c87b');circle(8,-110,2,'#6b412b');
      if(!action||move?.fanStrike||f.blocking){
        for(const [fx,fy,angle] of [[armX,armY,-.9],[-16,-52,-2.1]]){c.save();c.translate(fx,fy);c.rotate(angle);c.beginPath();c.moveTo(0,0);c.arc(0,0,attacking?38:28,-.8,.8);c.closePath();c.fillStyle='#a4e2e3';c.fill();c.strokeStyle='#e6c87d';c.lineWidth=2;c.stroke();for(let rib=0;rib<5;rib++){const a=-.8+rib*.4;line(0,0,Math.cos(a)*(attacking?38:28),Math.sin(a)*(attacking?38:28),'#4d8996',1);}c.restore();}
      }
      // Katana stays sheathed while her fan techniques are active.
      if(f.weapon!=='katana'||!action)line(-23,-65,-45,-24,'#c3d5df',3);
      if(action?.move==='royalTempest'||action?.move==='releasedTempest'){c.strokeStyle='#88e5de';c.lineWidth=3;c.beginPath();c.ellipse(100,-65,Math.min(125,30+action.age*5),40,0,0,Math.PI*2);c.stroke();}
    }
    if(character.id==='sarada'){c.strokeStyle='#e45b72';c.lineWidth=2;c.strokeRect(2,-116,14,9);}
    if(form&&form.name.startsWith('Karma'))line(-2,-120,10,-98,form.color,3);
    if(f.charging){for(let i=0;i<6;i++){const a=i*Math.PI/3+state.tick*.04;circle(Math.cos(a)*42,-65+Math.sin(a)*65,3,'#83dff4');}line(-30,-10,-30,-130,'#83dff455',3);}
    if(f.effects.some(e=>e.type==='bind')){for(let i=0;i<4;i++)line(-26,-15-i*15,25,-5-i*15,'#c6ac7b',3);}
    if(f.buffs.some(b=>b.type==='ward')){c.strokeStyle='#d2c08a';c.lineWidth=3;c.strokeRect(-30,-135,60,135);}
    if(f.buffs.some(b=>b.type==='poisonCoating')||action?.poison){circle(armX,armY,12,'#a4d87c88');}
    if(f.buffs.length||action?.move==='sharingan'){c.strokeStyle=action?.move==='sharingan'?'#eb7175':'#c5eaff';c.lineWidth=2;c.beginPath();c.arc(0,-110,29,0,Math.PI*2);c.stroke();}
    for(const effect of f.effects){const color=effect.type==='poison'?'#a4d87c':effect.type==='burn'?'#f4a35e':'#bf96ea';for(let i=0;i<3;i++)circle(-26+i*25,-30-((state.tick+i*15)%65),3,color);}
    if(f.dash)for(let i=0;i<3;i++)line(-f.dash.direction*(30+i*14),-30-i*25,-f.dash.direction*(75+i*14),-30-i*25,'#afd7eb66',3);
    c.restore();
    if(action?.move==='clone'&&attacking&&!ghost)ninja({...f,x:f.x+f.facing*130,action:null},state,true);
    if(!ghost&&state.tick-f.lastHit<25&&f.lastDamage){c.save();c.font='bold 18px system-ui';c.textAlign='center';c.fillStyle=f.blockedHit?'#98d4e7':'#ffe0ac';c.globalAlpha=1-(state.tick-f.lastHit)/25;c.fillText(`−${f.lastDamage}`,x,ground-160-(state.tick-f.lastHit)*1.2);c.restore();}
    if(!ghost&&state.tick-f.lastHit<8){c.save();c.translate(x,ground-70);for(let i=0;i<7;i++){const a=i*.9;line(Math.cos(a)*15,Math.sin(a)*15,Math.cos(a)*40,Math.sin(a)*40,f.blockedHit?'#89dbea':'#ffd8a0',3);}c.restore();}
  }
  const render=function render(authoritative,{interpolate=false,predicted=null,localSlot=0,layers=null}={}) {
    externalActors=layers?.actors===false;
    const now=performance.now();const nextWidth=authoritative.arena?.width??1280;if(nextWidth!==worldWidth){worldWidth=nextWidth;resize();}
    if(frameTick!==authoritative.tick||frameRound!==authoritative.round||targets[0]?.character!==authoritative.fighters[0].character){
      const reset=frameTick<0||authoritative.tick<frameTick||frameRound!==authoritative.round;
      projectilePrevious=reset?[]:projectileShown;projectileTargets=authoritative.projectiles.map(p=>({...p}));
      previous=reset?authoritative.fighters.map(f=>({...f})):targets;
      blendDuration=Math.min(65,Math.max(16,(authoritative.tick-frameTick)*1000/60));blendStart=now;
      targets=authoritative.fighters.map(f=>({...f,action:f.action?{...f.action}:null}));visualTick=reset?authoritative.tick:frameTick;
      frameTick=authoritative.tick;frameRound=authoritative.round;if(reset)trails.forEach(t=>t.splice(0));
    }
    const blend=interpolate?Math.min(1,(now-blendStart)/blendDuration):1;shown=sampleFighters(previous,targets,blend,interpolate);
    if(predicted&&shown[localSlot]){const p=predicted.fighters[localSlot];for(const key of ['x','y','vy','vx','depth','travel','jumps','dash'])shown[localSlot][key]=p[key];}
    projectileShown=projectileTargets.map(p=>{const a=projectilePrevious.find(old=>old.id===p.id);return a?{...p,x:a.x+(p.x-a.x)*blend,y:a.y+(p.y-a.y)*blend}:p;});
    const state={...authoritative,projectiles:projectileShown,tick:visualTick+(authoritative.tick-visualTick)*blend,fighters:shown};

    const width=worldWidth*dpr,height=Math.round(viewHeight*dpr);
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    if(layers?.background===false){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);}
    const needed=Math.min(1,viewHeight*.68/(Math.max(...state.fighters.map(f=>f.y))+150));
    zoom+=(needed-zoom)*.3;
    c.setTransform(dpr*zoom,0,0,dpr*zoom,worldWidth*dpr*.5*(1-zoom),(viewHeight*.9-ARENA.floor*zoom)*dpr);
    c.save();
    let shakeX=0,shakeY=0;
    if(!reducedMotion.matches&&document.documentElement.dataset.shake!=='off'){const recent=state.fighters.find(f=>state.tick-f.lastHit<4);if(recent){const strength=recent.blockedHit?1:4;shakeX=Math.sin(state.tick*13)*strength;shakeY=Math.cos(state.tick*9)*strength*.5;c.translate(shakeX,shakeY);}}
    render.frame={state,viewport:{worldWidth,viewHeight,zoom,shakeX,shakeY}};
    if(layers?.background!==false)background(state.tick,(state.fighters[0].x+state.fighters[1].x)/2);
    // Ground lanes and narrow/sweeping windups make depth separation readable.
    for(const depth of [-64,0,64]){line(46,ARENA.floor+depth*.65,worldWidth-46,ARENA.floor+depth*.65,'#a7d9cc22',1);}
    for(const f of state.fighters){const ground=ARENA.floor+(f.depth??0)*.65;circle(f.x,ground,4,f.id===0?'#80e3d3':'#efb0b0');if(f.action){const m=MOVES[f.action.move],phase=actionPhase(f);if(phase.name==='Startup'&&m.damage>0){const end=f.x+f.facing*(m.reach||130);line(f.x,ground,end,ground,'#ffd78b77',3);c.font='bold 11px system-ui';c.textAlign='center';c.fillStyle='#ffe0a1';c.fillText(m.projectile?'RANGED':m.pierce?'PIERCE':m.launch?'LAUNCH':m.spike?'DIVE':'STRIKE',f.x,ground-155*(f.scale??1));}else if(phase.name==='Recovery'){c.font='10px system-ui';c.textAlign='center';c.fillStyle='#b4c8d9';c.fillText('RECOVERY',f.x,ground-150*(f.scale??1));}}}
    if(state.training?.showRanges){
      for(const f of state.fighters){
        const m=MOVES[f.action?.move??(CHARACTERS[f.character].basicChain?.[0]??'attack')],phase=actionPhase(f),ground=ARENA.floor+(f.depth??0)*.65-f.y;
        const color=phase.name==='Active'?'#ff8d77':phase.name==='Recovery'?'#ffd17d':'#79dbc7';
        c.save();c.strokeStyle=color;c.fillStyle=color+'19';c.lineWidth=2;c.setLineDash([7,5]);
        if(!m.projectile&&!m.buff){const x=f.facing===1?f.x:f.x-m.reach;c.fillRect(x,ground-100,m.reach,100);c.strokeRect(x,ground-100,m.reach,100);}
        c.strokeStyle='#b9d5eb66';c.strokeRect(f.x-fighterBody(f).width/2,ground-fighterBody(f).height,fighterBody(f).width,fighterBody(f).height);c.setLineDash([]);
        c.font='bold 13px system-ui';c.textAlign='center';c.fillStyle=color;c.fillText(`${phase.name.toUpperCase()}${phase.remaining?' · '+phase.remaining+'f':''}`,f.x,ground-165);c.restore();
      }
    }
    for(const z of state.zones??[]){
      if(z.kind==='elemental'){const zoneFloor=ARENA.floor+(z.depth??0)*.65,m=MOVES[z.move],color=({fire:'#ef9c62',water:'#69c6e2',earth:'#d2b77f',poison:'#b2d36d'})[m.ground.element];c.save();c.globalAlpha=Math.min(.7,z.remaining/60);c.fillStyle=color+'55';c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.ellipse(z.x,zoneFloor,z.radius,36,0,0,Math.PI*2);c.fill();c.stroke();for(let i=0;i<7;i++){const x=z.x-z.radius+20+i*34;line(x,zoneFloor,x+Math.sin(state.tick*.1+i)*8,zoneFloor-15-(state.tick+i*9)%45,color+'99',2);}c.font='bold 12px system-ui';c.textAlign='center';c.fillStyle=color;c.fillText(m.name.toUpperCase(),z.x,zoneFloor+35);c.restore();continue;}
      const y=ARENA.floor+(z.depth??0)*.65-z.y;c.save();
      if(z.kind==='smoke'){
        c.globalAlpha=Math.min(.55,z.remaining/60);for(let i=0;i<5;i++)circle(z.x-70+i*35,y+Math.sin(state.tick*.04+i)*12,60,z.appearance==='victory'?'#c8b3da':'#99acbb');
        c.fillStyle='#e5eef7';c.font='bold 13px system-ui';c.textAlign='center';c.fillText('SMOKE · PROJECTILE COVER',z.x,y-75);
      }else{c.globalAlpha=z.remaining/15;c.strokeStyle='#ffcf79';c.lineWidth=8;c.beginPath();c.arc(z.x,y,z.radius*(1.5-z.remaining/30),0,Math.PI*2);c.stroke();}
      c.restore();
    }
    for(const f of state.fighters)if(f.raijinMark){const x=f.raijinMark.x;c.save();line(x,ARENA.floor-75,x,ARENA.floor-5,'#ffd87977',2);circle(x,ARENA.floor-7,8,'#ffd879');c.font='bold 12px system-ui';c.fillStyle='#ffd879';c.textAlign='center';c.fillText(`RAIJIN · ${(f.raijinMark.remaining/60).toFixed(1)}s`,x,ARENA.floor-85);c.restore();}
    for(const f of [...state.fighters].sort((a,b)=>(a.depth??0)-(b.depth??0))){
      if(f.replacement){const r=f.replacement,y=ARENA.floor+(r.depth??0)*.65-r.y;c.fillStyle='#96663c';c.fillRect(r.x-15,y-70,30,65);circle(r.x,y-70,15,'#c09361');line(r.x-8,y-62,r.x-8,y-12,'#d2a176',3);for(let i=0;i<3;i++)circle(r.x-28+i*27,y-60-i*15,15,'#cadde74a');}
      if(!reducedMotion.matches&&(f.dash||f.action&&MOVES[f.action.move]?.dash)){const history=trails[f.id];if(!history.length||state.tick-history.at(-1).tick>=2)history.push({tick:state.tick,f:{...f,action:f.action?{...f.action}:null}});while(history.length>3)history.shift();for(const entry of history){c.save();c.globalAlpha=.25*(1-(state.tick-entry.tick)/12);if(c.globalAlpha>0)ninja(entry.f,state,true);c.restore();}}else trails[f.id].splice(0);
      ninja(f,state);
      if(state.tick>=(f.landedAt??-100)&&state.tick-(f.landedAt??-100)<13){const age=state.tick-f.landedAt;c.save();c.globalAlpha=(1-age/13)*.4;for(let i=0;i<5;i++)circle(f.x-25+i*12+(i-2)*age*1.3,ARENA.floor-3-age*.5,3+age*.5,'#a7b7ac');c.restore();}
      if(f.airTech){c.font='bold 12px system-ui';c.textAlign='center';c.fillStyle='#9be4e8';c.fillText('AIR RECOVERY',f.x,ARENA.floor-f.y-170);}
    }
    for(const p of state.projectiles){const y=ARENA.floor+(p.depth??0)*.65-p.y;
      if(p.move==='itemBomb'){circle(p.x,y,12,'#2c2522');circle(p.x,y,8,'#ffbd70');c.font='bold 11px system-ui';c.fillStyle='#ffe2a4';c.textAlign='center';c.fillText((p.life/60).toFixed(1),p.x,y-19);continue;}
      if(['itemKunai','itemRaijin'].includes(p.move)){line(p.x-18*p.direction,y,p.x+14*p.direction,y,'#d9e6ee',4);if(p.move==='itemRaijin')circle(p.x,y,18,'#ffd87955');continue;}

      if(p.move==='shuriken'||p.move==='itemShuriken'){c.save();c.translate(p.x,y);c.rotate(state.tick*.5);for(let i=0;i<4;i++){c.rotate(Math.PI/2);c.fillStyle='#c9dce7';c.beginPath();c.moveTo(0,-4);c.lineTo(20,0);c.lineTo(0,5);c.fill();}circle(0,0,3,'#334b61');c.restore();continue;}
c.save();c.translate(p.x,y);c.scale(p.direction,1);const color=MOVES[p.move].color??'#ffb94d';const fire=c.createRadialGradient(0,0,3,0,0,42);fire.addColorStop(0,'#fff6de');fire.addColorStop(.4,color);fire.addColorStop(1,color+'00');c.fillStyle=fire;c.fillRect(-55,-45,105,90);circle(0,0,20,color);line(-20,0,-56,8,color,9);
      const element=MOVES[p.move].element;
      if(element==='water'||element==='wind'){c.strokeStyle='#d5ffffaa';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.ellipse(-i*12,0,23+i*3,8+i*4,state.tick*.08+i,0,Math.PI*2);c.stroke();}}
      if(element==='lightning')for(let i=0;i<4;i++){const h=Math.sin(Math.floor(state.tick*.5)+i*3)*30;line(-35+i*16,h,-22+i*16,-h,'#e4faff',2);}
      if(element==='poison')for(let i=0;i<5;i++)circle(-i*10,Math.sin(state.tick*.14+i)*17,3,'#deffae99');
      c.restore();}
    const transformed=state.fighters.find(f=>f.awakeningFlash>0);
    if(transformed){c.textAlign='center';c.font='bold 32px system-ui';c.fillStyle=activeAwakening(transformed).color;c.fillText(activeAwakening(transformed).name.toUpperCase(),640,270);}
    c.restore();
    c.setTransform(dpr,0,0,dpr,0,0);
    c.font='10px system-ui';c.fillStyle='#b8cbcf55';c.textAlign='center';if(!state.training)c.fillText('TRAINING GROUNDS  /  MOONLIT SHRINE',640,viewHeight-12);
  };
  render.dispose=()=>resizeObserver.disconnect();
  return render;
}


