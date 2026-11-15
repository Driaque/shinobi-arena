import {MOVES} from '../engine/index.js';

// Painted weapon icons double as in-fight sprites. grip/tip are positions in
// the square icon (0..1); length is the grip-to-tip distance in arena units.
export const WEAPON_ART=Object.freeze({
  skyforgedBlade:{grip:[.81,.18],tip:[.07,.93],length:96,style:'swing',color:0xbfeaff},
  concordLaureate:{grip:[.81,.18],tip:[.07,.93],length:96,style:'swing',color:0xffe2a0},
  frostmereSaber:{grip:[.79,.17],tip:[.04,.93],length:100,style:'swing',color:0xd4f1ff},
  oathknife:{grip:[.77,.22],tip:[.07,.91],length:46,style:'swing',color:0xe6eef2,arc:.7},
  conduitSpike:{grip:[.78,.2],tip:[.06,.92],length:50,style:'thrust',color:0xc9b7ff},
  tideglassFans:{grip:[.5,.6],tip:[.5,.14],length:44,style:'swing',color:0x9fe9e4,arc:.85,wide:true},
  orbitDisc:{grip:[.5,.5],tip:[.5,.08],length:19,style:'disc',color:0xc4dce7},
});
export const weaponArtUrl=id=>`./assets/painted-v2/weapons/${id}-256.png`;

// Removes the flat painted backdrop from an icon in place: everything close to
// the corner colour and connected to the border becomes transparent, edges are
// feathered and un-mixed from the backdrop so no dark fringe remains.
export function cutoutBackground(data,width,height,{inner=22,outer=54,tight=12}={}){
  const corners=[0,width-1,(height-1)*width,height*width-1],bg=[0,1,2].map(k=>Math.round(corners.reduce((sum,i)=>sum+data[i*4+k],0)/4));
  const distance=i=>Math.max(Math.abs(data[i*4]-bg[0]),Math.abs(data[i*4+1]-bg[1]),Math.abs(data[i*4+2]-bg[2]));
  const reached=new Uint8Array(width*height),queue=[];
  const visit=i=>{if(!reached[i]&&distance(i)<outer){reached[i]=1;queue.push(i);}};
  for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}
  for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}
  while(queue.length){const i=queue.pop(),x=i%width;if(x>0)visit(i-1);if(x<width-1)visit(i+1);if(i>=width)visit(i-width);if(i<(height-1)*width)visit(i+width);}
  for(let i=0;i<width*height;i++){
    const d=distance(i);
    if(!reached[i]&&d>=tight)continue;
    const alpha=reached[i]?Math.max(0,Math.min(1,(d-inner)/(outer-inner))):0;
    if(alpha>0)for(let k=0;k<3;k++)data[i*4+k]=Math.max(0,Math.min(255,Math.round((data[i*4+k]-bg[k]*(1-alpha))/alpha)));
    data[i*4+3]=Math.round(alpha*255);
  }
  return data;
}

// Leading-hand positions measured on each fighter atlas, in arena units from
// the sprite root, for the anticipation (8), strike (9), follow-through (10)
// and aerial (11) poses. The painted grip is pinned to these.
export const HAND_ANCHORS=Object.freeze({
  vael:{8:[112,-188],9:[-31,-273],10:[100,-108],11:[119,-191]},
  aren:{8:[22,-81],9:[63,-88],10:[48,-46],11:[34,-118]},
  dora:{8:[18,-93],9:[37,-90],10:[40,-62],11:[38,-121]},
  eira:{8:[57,-91],9:[96,-95],10:[93,-55],11:[-7,-112]},
  kael:{8:[35,-84],9:[70,-97],10:[63,-63],11:[48,-126]},
  nyra:{8:[20,-81],9:[86,-92],10:[42,-50],11:[-2,-118]},
  oryn:{8:[21,-81],9:[52,-76],10:[59,-35],11:[21,-114]},
  rook:{8:[39,-95],9:[96,-95],10:[54,-50],11:[43,-127]},
  silent:{8:[22,-84],9:[70,-86],10:[56,-42],11:[45,-126]},
  veyra:{8:[11,-89],9:[50,-92],10:[30,-56],11:[50,-117]},
  winta:{8:[7,-87],9:[54,-98],10:[-4,-50],11:[21,-123]},
});
const DEFAULT_HANDS={7:[38,-72],8:[24,-86],9:[64,-91],10:[48,-50],11:[30,-120],12:[32,-58]};
// The atlas pose shown for an attack, matching poseFor in visual-lab.js.
function attackFrame(fighter,m,age){
  if(fighter.y>0)return m.spike?7:m.sword?11:9;
  return age<m.startup?8:age<m.startup+m.active?9:10;
}
export function handFor(fighter,frame){return HAND_ANCHORS[fighter.character]?.[frame]??DEFAULT_HANDS[frame]??DEFAULT_HANDS[9];}

const lerp=(a,b,t)=>a+(b-a)*t,clamp=t=>Math.max(0,Math.min(1,t)),smooth=t=>t*t*(3-2*t),out=t=>1-(1-t)*(1-t);
// Blade angle over the whole action, in radians in the fighter's facing
// space: 0 points forward, negative is up. Overhead cuts sweep further.
function swingAt(age,m,arc=1,overhead=false){
  const end=m.startup+m.active,[ready,raised,cut,rest]=overhead?[-1.7,-2.6,.85,1.05]:[-1.3,-2.15,.5,.3];
  if(age<m.startup)return {angle:lerp(ready,raised,out(clamp(age/m.startup)))*arc,slide:0};
  if(age<end)return {angle:lerp(raised,cut,smooth(clamp((age-m.startup+1)/m.active)))*arc,slide:0};
  return {angle:lerp(cut,rest,out(clamp((age-end)/Math.max(1,m.recovery))))*arc,slide:0};
}
// A thrust keeps the point forward and slides along it: drawn back, driven
// through, then eased down.
function thrustAt(age,m){
  const end=m.startup+m.active;
  if(age<m.startup)return {angle:-.08,slide:lerp(0,-16,out(clamp(age/m.startup)))};
  if(age<end)return {angle:-.05,slide:lerp(-16,12,out(clamp((age-m.startup+1)/Math.max(1,m.active*.5))))};
  const t=smooth(clamp((age-end)/Math.max(1,m.recovery)));return {angle:-.05+t*.35,slide:lerp(12,0,t)};
}
const fade=(age,m)=>{const total=m.startup+m.active+m.recovery;return clamp((age+1)/3)*clamp((total-age)/Math.max(1,m.recovery*.45));};

// Presentation of an equipped weapon during its attack, in fighter-local arena
// units (x forward, y up negative). Returns null when no weapon should show.
export function weaponPoseFor(fighter,tick=0,reduced=false,frame){
  const action=fighter.action;
  if(action?.source!=='weapon')return null;
  const art=WEAPON_ART[fighter.weapon],m=MOVES[action.move];
  if(!art||!m)return null;
  const age=action.age??0,end=m.startup+m.active,poison=Boolean(action.poison)||(fighter.buffs??[]).some(b=>b.type==='poisonCoating');
  const color=poison?0xb5e08b:art.color;
  if(art.style==='disc'){
    // The disc leaves the hand when the throw becomes active; the projectile carries on.
    if(age>=m.startup)return null;
    const t=out(clamp(age/m.startup));
    return {id:fighter.weapon,x:lerp(38,4,t),y:lerp(-88,-114,t),rotation:reduced?0:tick*.55,length:art.length,alpha:clamp((age+1)/3),color,trail:null};
  }
  const shown=frame??attackFrame(fighter,m,age),[handX,handY]=handFor(fighter,shown),overhead=shown===11||shown===7;
  const at=age=>art.style==='thrust'?thrustAt(age,m):swingAt(age,m,art.arc??1,overhead);
  const now=at(age),x=handX+Math.cos(now.angle)*now.slide,y=handY+Math.sin(now.angle)*now.slide;
  let trail=null;
  const sinceStart=age-m.startup;
  if(sinceStart>=0&&age<end+4){
    const strength=age<end?1:1-(age-end+1)/5;
    if(art.style==='thrust'){
      const dx=Math.cos(now.angle),dy=Math.sin(now.angle),tipX=x+dx*art.length,tipY=y+dy*art.length,back=70*strength+20;
      trail={color,alpha:.55*strength,points:[tipX,tipY,tipX-dx*back-dy*9,tipY-dy*back+dx*9,tipX-dx*back+dy*9,tipY-dy*back-dx*9],edge:[tipX,tipY,tipX-dx*back*.8-dy*2.5,tipY-dy*back*.8+dx*2.5,tipX-dx*back*.8+dy*2.5,tipY-dy*back*.8-dx*2.5]};
    }else{
      // Crescent swept by the blade over the last few ticks, thin at the tail.
      // It pivots on the hand of the pose on screen, so it never detaches when the sprite changes.
      const from=at(Math.max(m.startup-1,age-(age<end?4:6))).angle,to=now.angle,steps=10,outer=art.length*1.02,inner=art.length*(art.wide?.15:.42);
      const band=(thickness)=>{const pts=[];for(let i=0;i<=steps;i++){const a=lerp(from,to,i/steps);pts.push(handX+Math.cos(a)*outer,handY+Math.sin(a)*outer);}
        for(let i=steps;i>=0;i--){const a=lerp(from,to,i/steps),r=lerp(outer,lerp(outer,inner,thickness),(i/steps)**1.5);pts.push(handX+Math.cos(a)*r,handY+Math.sin(a)*r);}return pts;};
      if(Math.abs(to-from)>.05)trail={color,alpha:.5*strength,points:band(1),edge:band(.22)};
    }
  }
  return {id:fighter.weapon,x,y,rotation:now.angle,length:art.length,alpha:fade(age,m),color,trail};
}

// Sprite placement for a pose: anchor at the grip, rotated so the painted
// blade follows the pose angle, scaled to the weapon's arena length.
export function weaponSpriteFor(pose,size=256){
  const art=WEAPON_ART[pose.id],dx=(art.tip[0]-art.grip[0])*size,dy=(art.tip[1]-art.grip[1])*size;
  return {anchorX:art.grip[0],anchorY:art.grip[1],rotation:pose.rotation-Math.atan2(dy,dx),scale:pose.length/Math.hypot(dx,dy)};
}

// Unarmed strikes: a short tapered swoosh at the leading limb.
export function strikeArcFor(fighter){
  const action=fighter.action,m=MOVES[action?.move];
  if(!m||action.source==='weapon'||m.projectile||m.buff||m.utility||m.ground)return null;
  const age=action.age??0,end=m.startup+m.active;
  if(age<m.startup-1||age>=end+3)return null;
  const strength=age<end?1:1-(age-end+1)/4,reach=Math.min(m.reach??90,170),radius=reach*.62,sweep=m.spike?1.5:1.15;
  const t=clamp((age-m.startup+2)/(m.active+1)),tilt=m.spike?.55:fighter.y>0?.25:-.1,to=tilt+sweep*(t-.35),from=to-sweep*.75,cx=14,cy=-78,steps=10;
  const band=thickness=>{const pts=[];for(let i=0;i<=steps;i++){const a=lerp(from,to,i/steps);pts.push(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius*.72);}
    for(let i=steps;i>=0;i--){const a=lerp(from,to,i/steps),r=radius*(1-thickness*.34*(i/steps)**1.6);pts.push(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.72);}return pts;};
  const hex=/^#[\da-f]{6}$/i.test(m.color??'')?parseInt(m.color.slice(1),16):0xfff0c8;
  return {color:hex,alpha:.42*strength,points:band(1),edge:band(.25)};
}
