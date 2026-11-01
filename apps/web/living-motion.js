const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const mix=(a,b,t)=>a+(b-a)*ease(t);
// Cosmetic authored keys. Combat phase boundaries remain engine-owned.
export function livingPose(f,tick,move,base,reduced=false){
 if(!['aren','silent'].includes(f.character))return base;
 const p={...base},silent=f.character==='silent',run=!f.action&&!f.blocking&&!f.stun&&!f.crouching&&Math.abs(f.vx??0)>.2;
 const sway=reduced?0:Math.sin(tick*.055),gait=reduced?0:Math.sin((f.travel??0)/10.2);
 p.weaponAngle=-.65;p.elbow=null;
 p.trail=reduced?0:(run?12:3)+Math.sin(tick*.09-(f.vx??0)*.06)*3;
 if(!f.action){
  p.armX=f.blocking?26:run?(silent?27:22+gait*8):silent?26:20;
  p.armY=f.blocking?-112:run?(silent?-84:-77-gait*7):silent?-80:-72;
  p.weaponAngle=f.blocking?-1.3:run?(silent?-.35:-.8+gait*.12):silent?-.25:-.65;
  p.lean=f.stun?-.18:f.dash?.direction*f.facing>0?.25:f.y>1?base.lean:run?(silent?.07:.16):sway*(silent?.004:.009);
  if(f.y>1){p.armX=29;p.armY=-91;p.weaponAngle=-1.05;}
  if(f.charging){p.armX=23;p.armY=-94;}
 }else if(move?.sword&&!move.projectile&&!move.ground&&!move.buff){
  const age=f.action.age,start=Math.max(1,move.startup),active=Math.max(1,move.active),recovery=Math.max(1,move.recovery);
  const variant=Number(f.action.move.match(/(\d)$/)?.[1]??1)%3;
  const ready=silent?[23,-83,-.25]:[20,-74,-.65];
  const wind=variant===2?[10,-58,1.5]:variant===0?[-5,-103,-2.5]:[9,-123,-2.1];
  const hit=variant===2?[54,-103,-.9]:variant===0?[62,-80,-.12]:[55,-65,.45];
  const t=age<start?age/start:age<start+active?(age-start)/active:(age-start-active)/recovery;
  const a=age<start?ready:age<start+active?wind:hit,b=age<start?wind:age<start+active?hit:ready;
  [p.armX,p.armY,p.weaponAngle]=a.map((v,i)=>mix(v,b[i],t));
  p.lean=age<start?mix(0,-.08,t):age<start+active?mix(-.08,silent?.13:.24,t):mix(silent?.13:.24,0,t);
  p.swing=age>=start&&age<start+active?clamp((age-start)/active):null;
 }
 if(f.stun){p.armX=16;p.armY=-66;p.weaponAngle=.5;}
 // Two-bone arm solve prevents floating wrists and overextended elbows.
 const sx=13,sy=-89,dx=p.armX-sx,dy=p.armY-sy,len=Math.hypot(dx,dy)||1,d=Math.min(69,Math.max(4,len)),ux=dx/len,uy=dy/len;
 p.armX=sx+ux*d;p.armY=sy+uy*d;
 const along=(36*36-34*34+d*d)/(2*d),height=Math.sqrt(Math.max(0,36*36-along*along));
 p.elbow={x:sx+ux*along-uy*height,y:sy+uy*along+ux*height};
 return p;
}

export function paintBattleLife(c,state,{floor=650,reduced=false,effects=true}={}){
 if(reduced||!effects)return;
 const stroke=(x,y,xx,yy,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
 c.save();c.lineCap='round';
 for(const f of state.fighters){
  const ground=floor+(f.depth??0)*.65,age=state.tick-f.lastHit;
  if(f.lastHit>=0&&age>=0&&age<15){
   const t=age/15,x=f.x-f.facing*10,y=ground-f.y-76*(f.scale??1),color=f.blockedHit?'#8af3dc':'#ffd29b';
   c.globalAlpha=(1-t)*(f.blockedHit?.8:1);
   for(let i=0;i<9;i++){
    const a=i*2.399+f.lastHit*.31,reach=(f.blockedHit?23:36)*(1+t*2),dx=Math.cos(a),dy=Math.sin(a);
    stroke(x+dx*reach*.55,y+dy*reach*.55+t*t*18,x+dx*reach,y+dy*reach+t*t*18,color,i%3?1.3:2.5);
   }
   c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.ellipse(x,y,12+t*38,8+t*25,0,0,Math.PI*2);c.stroke();
  }
  if(f.charging){
   c.globalAlpha=.3;c.strokeStyle=f.character==='silent'?'#a3dcff':'#9cf3d5';c.lineWidth=1.5;
   for(let i=0;i<3;i++){c.beginPath();c.ellipse(f.x,ground-5-i*18,22+i*5,4+i*3,state.tick*.025+i,0,Math.PI*2);c.stroke();}
  }
  if(f.dash){
   c.globalAlpha=.28;
   for(let i=0;i<4;i++){const y=ground-f.y-20-i*23,span=30+((state.tick*4+i*17)%35);stroke(f.x-f.facing*25,y,f.x-f.facing*(25+span),y-3,'#acdfe5',1.6);}
  }
  const landing=state.tick-(f.landedAt??-100);
  if(landing>=0&&landing<18){const t=landing/18;c.globalAlpha=(1-t)*.3;c.strokeStyle='#c5dfd9';c.lineWidth=1.5;c.beginPath();c.ellipse(f.x,ground,15+t*46,3+t*7,0,0,Math.PI*2);c.stroke();}
  if(f.y<1&&!f.stun&&!f.action&&Math.abs(f.vx??0)>.3){
   const t=((f.travel??0)%32)/32;
   c.globalAlpha=(1-t)*.24;c.fillStyle='#bec9bd';
   for(let i=0;i<3;i++){c.beginPath();c.ellipse(f.x-Math.sign(f.vx)*(12+t*25+i*5),ground-2-t*5,2+t*4,1+t*2,0,0,Math.PI*2);c.fill();}
  }
 }
 c.restore();
}
