// Device-space gesture recognition; gameplay still enforces jump/dash limits and costs.
export const STICK_GESTURES=Object.freeze({enter:.65,release:.25,doublePullMs:300});
export function createStickGestures(){
 let horizontal=0,lastPull=null,up=false,down=false;
 return {
  update({x,y},now){
   if(![x,y,now].every(Number.isFinite))throw new Error('Invalid stick gesture sample');
   x=Math.max(-1,Math.min(1,x));y=Math.max(-1,Math.min(1,y));
   if(lastPull&&now<lastPull.time)lastPull=null;
   if(Math.abs(x)<=STICK_GESTURES.release)horizontal=0;
   if(y>=-STICK_GESTURES.release)up=false;
   if(y<=STICK_GESTURES.release)down=false;
   let jump=false,dashDirection=0;
   const direction=Math.abs(x)>=STICK_GESTURES.enter&&Math.abs(x)>=Math.abs(y)*1.25?Math.sign(x):0;
   if(direction&&direction!==horizontal){
    // Crossing to the opposite side is a new pull, never a same-side double pull.
    if(horizontal&&direction!==horizontal)lastPull=null;
    if(lastPull?.direction===direction&&now-lastPull.time<=STICK_GESTURES.doublePullMs){dashDirection=direction;lastPull=null;}
    else lastPull={direction,time:now};
    horizontal=direction;
   }
   if(!up&&y<=-STICK_GESTURES.enter&&Math.abs(y)>=Math.abs(x)*.9){jump=true;up=true;}
   if(y>=STICK_GESTURES.enter&&y>=Math.abs(x)*.9)down=true;
   return {moveX:x,jump,crouch:down,dashDirection};
  },
  release(){horizontal=0;up=false;down=false;},
  reset(){horizontal=0;lastPull=null;up=false;down=false;}
 };
}
