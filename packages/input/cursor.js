// Pixel motion with gentle acceleration, independent of render frame rate.
export function cursorStep(position,axes,dt,speed,bounds){
 const seconds=Math.min(.05,Math.max(0,dt));
 const velocity=value=>Math.sign(value)*Math.pow(Math.min(1,Math.abs(value)),1.5)*650*speed;
 return {x:Math.max(bounds.left,Math.min(bounds.right,position.x+velocity(axes.x)*seconds)),y:Math.max(bounds.top,Math.min(bounds.bottom,position.y+velocity(axes.y)*seconds))};
}

// D-pad is the sole source of keyboard-style menu focus movement.
export function menuDirection(buttons){return buttons?.[12]?-1:buttons?.[13]?1:buttons?.[14]?-1:buttons?.[15]?1:0;}
