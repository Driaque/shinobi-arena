// Shape helpers shared by the guard and item cues. A cue is plain data — fills,
// stroked paths and painted props — drawn identically by the Canvas and Pixi labs.
// `add` marks light that brightens what is behind it; `layer:'ground'` sits under the fighters.
export const FLOOR=650;
export const stageY=(depth=0,height=0)=>FLOOR+depth*.65-height;
export const hexColor=(css,fallback)=>/^#[\da-f]{6}$/i.test(css??'')?parseInt(css.slice(1),16):fallback;
export const diamond=(x,y,rx,ry,style)=>({kind:'poly',points:[x-rx,y,x,y-ry,x+rx,y,x,y+ry],...style});
// Whole or partial ellipse outline as a stroked path.
export function ring(x,y,rx,ry,{from=0,to=Math.PI*2,steps=24,...style}={}){
  const points=[];
  for(let i=0;i<=steps;i++){const a=from+(to-from)*i/steps;points.push(x+Math.cos(a)*rx,y+Math.sin(a)*ry);}
  return {kind:'path',points,...style};
}
// Regular polygon outline: faceted rings read as cut crystal rather than a soft glow.
export function facets(x,y,radius,sides,turn,style){
  const points=[];
  for(let i=0;i<=sides;i++){const a=turn+i*Math.PI*2/sides;points.push(x+Math.cos(a)*radius,y+Math.sin(a)*radius);}
  return {kind:'path',points,...style};
}
// Thin triangle pointing along `angle`, used for shards, streaks and sparks.
export function shard(x,y,angle,length,width,style){
  const c=Math.cos(angle),s=Math.sin(angle);
  return {kind:'poly',points:[x+c*length,y+s*length,x-s*width/2,y+c*width/2,x+s*width/2,y-c*width/2],...style};
}
