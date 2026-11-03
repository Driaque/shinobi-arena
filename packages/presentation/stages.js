import {stageFor} from '../engine/stages.js';
const color=h=>parseInt(h.slice(1),16);
// Static vector scenery shared by Canvas, Pixi and selection thumbnails.
export function stageShapes(id){
 const s=stageFor(id),out=[],poly=(points,fill,alpha=1)=>out.push({kind:'poly',points,color:color(fill),alpha}),ellipse=(x,y,rx,ry,fill,alpha=1)=>out.push({kind:'ellipse',x,y,rx,ry,color:color(fill),alpha});
 poly([0,-500,1600,-500,1600,1100,0,1100],s.sky);
 ellipse(1180,120,66,66,s.accent,.15);ellipse(1180,120,42,42,'#e6f7ef',.65);
 for(let i=0;i<10;i++){const x=i*190-50;poly([x,590,x+140,180+(i%3)*70,x+330,590],s.ground,.4);}
 if(s.id==='frost'){
  for(let i=0;i<5;i++){const x=i*390-80;poly([x,620,x+190,195+i%2*40,x+380,620],'#627c99');poly([x+120,350,x+190,195+i%2*40,x+245,350,x+195,315],'#d3e8ef');}
  poly([0,220,300,130,650,230,1000,160,1600,240,1600,265,1000,185,650,255,300,155,0,245],'#79e5cd',.12);
  for(const x of [80,1500]){poly([x-42,650,x-25,425,x,380,x+35,650],'#8abed4');poly([x-8,650,x,380,x+35,650],'#d4edf2',.55);}
 }else if(s.id==='forge'){
  for(let i=0;i<7;i++){const x=i*270-70;poly([x,620,x,280+i%2*80,x+80,280+i%2*80,x+80,620],'#211d2b');poly([x+20,330,x+55,330,x+55,590,x+20,590],'#e27d49',.2);}
  poly([0,575,1600,575,1600,650,0,650],'#e98043',.5);
  for(const x of [20,1510]){poly([x,650,x,355,x+65,355,x+65,650],'#191e2b');poly([x+12,390,x+50,390,x+50,440,x+12,440],'#ffae62');}
 }else if(s.id==='grove'){
  for(let i=0;i<9;i++){const x=i*220-70;poly([x-25,650,x-15,190+i%3*45,x+18,170+i%3*45,x+35,650],'#142c30');ellipse(x,150+i%3*35,135,100,'#35564b',.7);ellipse(x-45,195+i%2*70,90,65,'#224638',.8);}
 }else if(s.id==='court'){
  poly([0,475,1600,475,1600,680,0,680],'#3a7c84',.75);
  for(const x of [55,390,1220,1515]){poly([x-30,590,x-22,235,x+25,235,x+35,590],'#75a3a3');poly([x-43,237,x+43,237,x+43,258,x-43,258],'#a6c7ba');poly([x-40,570,x+45,570,x+45,598,x-40,598],'#567f80');}
  poly([40,235,40,195,1550,195,1550,235],'#507f87');
 }
 poly([0,610,1600,610,1600,1100,0,1100],s.ground);
 if(s.id==='frost')poly([0,610,1600,610,1600,628,0,628],'#c4d8e4');
 if(s.id==='court')for(let i=0;i<10;i++){const x=i*180;poly([x,730,x+110,730,x+145,740,x+20,740],s.accent,.12);}
 for(let i=0;i<13;i++){const x=i*150;poly([x,640,x+60,640,x+40,643,x-10,643],s.accent,.13);}
 return out;
}
export function paintStageCanvas(ctx,id){for(const s of stageShapes(id)){ctx.save();ctx.globalAlpha=s.alpha;ctx.fillStyle='#'+s.color.toString(16).padStart(6,'0');ctx.beginPath();if(s.kind==='ellipse')ctx.ellipse(s.x,s.y,s.rx,s.ry,0,0,Math.PI*2);else{s.points.forEach((v,i)=>{if(i%2===0)(i?ctx.lineTo:ctx.moveTo).call(ctx,v,s.points[i+1]);});ctx.closePath();}ctx.fill();ctx.restore();}}
