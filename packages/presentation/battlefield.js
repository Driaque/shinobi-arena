// Bounded stateless primitives: safe for replay seeks, resets and missed frames.
const palette={fire:0xf89955,water:0x79d9f1,wind:0xb4f1df,poison:0xb6d971,lightning:0xc9b7ff};
const colorOf=p=>/^#[\da-f]{6}$/i.test(p.color??'')?parseInt(p.color.slice(1),16):palette[p.element]??0xffcb88;
export function sceneryFor(scene){
 const shapes=[],floor=650,shift=scene.parallax??0;
 for(const z of [-62,0,62])shapes.push({kind:'line',x:35,y:floor+z*.65,x2:1565,y2:floor+z*.65,color:0xc0dedb,alpha:.12,width:1});
 for(let i=0;i<13;i++){const x=i*140-40;shapes.push({kind:'line',x:800+(x-800)*.84,y:floor-42,x2:x,y2:floor+110,color:0xa0c8cd,alpha:.12,width:1});}
 for(const side of [0,1]){const x=side?1576:24;shapes.push({kind:'poly',points:[x-12,floor+110,x-18,floor-165,x+16,floor-165,x+12,floor+110],color:0x172b3a,alpha:.7});shapes.push({kind:'line',x:x-3,y:floor-156,x2:x-3,y2:floor+100,color:0x76a6ae,alpha:.35,width:2});shapes.push({kind:'ellipse',x,y:floor-120,rx:5,ry:13,color:0xffcf89,alpha:.7});}
 if(scene.decorative&&!scene.reduced)for(let i=0;i<8;i++)shapes.push({kind:'ellipse',x:(i*227+scene.tick*.12-shift*.6+1600)%1600,y:floor+45+Math.sin(scene.tick*.009+i)*5,rx:12+i%3*5,ry:1.5,color:0x90e1da,alpha:.06});
 if(scene.decorative&&!scene.reduced&&scene.stage&&scene.stage!=='skyglass')for(let i=0;i<16;i++){
  const x=(i*137+scene.tick*(scene.stage==='frost'?.35:.16))%1600,y=scene.stage==='forge'?570-((i*53+scene.tick*.65)%370):100+((i*79+scene.tick*.35)%470);
  shapes.push({kind:'ellipse',x,y,rx:scene.stage==='frost'?1.8:1.4,ry:scene.stage==='frost'?1.8:2.2,color:scene.stage==='forge'?0xffa663:scene.stage==='grove'?0xc1efb0:0xb5e9ee,alpha:.25+(i%3)*.1});
 }
 return shapes;
}
export function projectileShapes(scene){
 const shapes=[];
 for(const p of scene.projectiles??[]){
  const x=p.x,y=650+(p.depth??0)*.65-p.y,color=colorOf(p),direction=p.direction??1;
  if(p.move==='itemBomb'){shapes.push({kind:'ellipse',x,y,rx:12,ry:12,color:0x332d2b,alpha:1},{kind:'ellipse',x,y,rx:7,ry:7,color:0xf5b65f,alpha:1},{kind:'line',x:x+5,y:y-9,x2:x+12,y2:y-18,color:0xffdfa1,width:2,alpha:1});continue;}
  if(['itemKunai','itemRaijin'].includes(p.move)){
   shapes.push({kind:'poly',points:[x+18*direction,y,x-4*direction,y-5,x-4*direction,y+5],color:0xdcecf2,alpha:1},{kind:'line',x:x-4*direction,y,x2:x-20*direction,y2:y,color:0x7c8d9e,width:4,alpha:1});
   if(p.move==='itemRaijin')shapes.push({kind:'ellipse',x,y,rx:22,ry:13,color:0xffcf78,alpha:.25});continue;
  }
  if(['shuriken','itemShuriken'].includes(p.move)){
   const points=[];for(let i=0;i<8;i++){const a=i*Math.PI/4+(scene.reduced?0:scene.tick*.3),r=i%2?5:19;points.push(x+Math.cos(a)*r,y+Math.sin(a)*r);}shapes.push({kind:'poly',points,color:0xc4dce7,alpha:1});continue;
  }
  shapes.push({kind:'ellipse',x,y,rx:19,ry:14,color,alpha:.9},{kind:'ellipse',x:x+3*direction,y,rx:8,ry:7,color:0xf1fff7,alpha:.9});
  if(scene.decorative&&!scene.reduced){shapes.push({kind:'poly',points:[x-12*direction,y-10,x-58*direction,y+5,x-12*direction,y+10],color,alpha:.35});if(p.element==='lightning')for(let i=0;i<3;i++){const offset=Math.sin(Math.floor(scene.tick/2)+i*3)*17;shapes.push({kind:'line',x:x-32+i*15,y:y+offset,x2:x-15+i*15,y2:y-offset,color:0xefffff,width:2,alpha:.85});}}
 }
 return shapes;
}
