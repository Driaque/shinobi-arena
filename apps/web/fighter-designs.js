// Layered Canvas artwork in the existing fighter's local coordinate space.
// Every limb follows the shared combat pose; artwork never changes a hurtbox.
export function drawFighterDesign(c, f, pose, {cloth,skin,hair,move}) {
 const silent=f.character==='silent', accent=silent?'#bdeaff':'#e7c785';
 const ink='#0a1724', dark=silent?'#172939':'#173b40';
 const line=(x,y,xx,yy,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
 const path=(points,fill,stroke=ink,width=1.2)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}};
 const oval=(x,y,rx,ry,fill)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();};
 const gradient=(x,y,xx,yy,colors)=>{const g=c.createLinearGradient(x,y,xx,yy);colors.forEach((color,i)=>g.addColorStop(i/(colors.length-1),color));return g;};
 const limb=(a,b,r,color)=>{line(...a,...b,ink,r+3);line(...a,...b,color,r);line(a[0]-r*.2,a[1],b[0]-r*.2,b[1], '#ffffff20',Math.max(1,r*.16));};
 // Rear coat panels and hair flow with the same gait, not independent image swaps.
 if(silent){
  c.fillStyle=gradient(-32,-136,4,-62,['#edf0ed','#9cabbc','#455a71']);
  c.beginPath();c.moveTo(-15,-133);c.bezierCurveTo(-35,-135,-34-pose.trail,-92,-38-pose.trail,-59);c.quadraticCurveTo(-19,-71,-5,-111);c.closePath();c.fill();
  for(let i=0;i<5;i++)line(-18-i*3,-125,-27-i*2-pose.trail,-73+i*2,'#eff7ff55',.9);
  path([[-19,-69],[-31,-53],[-36-pose.trail*.5,-17],[-15,-27],[-5,-55]],dark);
  line(-28,-48,-32-pose.trail*.5,-23,accent,1.5);
  // Back scabbard, with a second shorter blade at the hip.
  limb([-25,-102],[-44,-28],5,'#314a61');line(-27,-99,-21,-113,accent,4);line(-32,-101,-20,-98,accent,2);
  limb([-21,-59],[-38,-35],4,'#223346');
 }else{
  path([[-14,-94],[-28,-92],[-43-pose.trail,-78],[-55-pose.trail,-83],[-40-pose.trail,-95],[-21,-104]],'#348c80');
  line(-24,-96,-48-pose.trail,-87,accent,1.2);
  path([[-18,-61],[-24,-34],[-12,-23],[-3,-57]],'#20564e');
  path([[7,-60],[23,-59],[29+pose.trail*.3,-24],[12,-31]],'#398b78');
  line(22,-52,25+pose.trail*.3,-29,accent,1.2);
 }
 // Segmented boots and knees track the original articulated foot positions.
 for(const [i,l] of pose.legs.entries()){
  limb([i?10:-11,-49],[l.kx,l.ky],13,dark);
  limb([l.kx,l.ky],[l.fx,l.fy-4],10,silent?'#344f65':'#36524c');
  oval(l.kx,l.ky,6,5,silent?'#7796ab':'#748b71');
  line(l.kx-3,l.ky-1,l.kx+3,l.ky-1,accent,1);
  path([[l.fx-7,l.fy-13],[l.fx+5,l.fy-12],[l.fx+7,l.fy-5],[l.fx+13,l.fy-2],[l.fx+12,l.fy+2],[l.fx-8,l.fy+2]],'#152836');
  line(l.fx-6,l.fy+1,l.fx+11,l.fy+1,silent?'#a3bccd':'#c3b48c',1.5);
 }
 // Rear sleeve, forearm and glove stay behind the cuirass.
 const casting=f.charging||move?.projectile||move?.ground||move?.buff;
 const elbow=casting?[8,-96]:[-27,-67],hand=casting?[pose.armX-9,pose.armY+7]:[-17,-53];
 limb([-14,-88],elbow,12,dark);limb(elbow,hand,9,skin);oval(...hand,5,6,dark);
 // Sculpted torso, separate collar, overlapping panels and readable waist.
 path([[-21,-95],[-4,-100],[17,-94],[21,-53],[-19,-51]],gradient(-22,-80,23,-70,[silent?'#9aafbe':'#83d7bd',cloth,dark]));
 if(silent){
  path([[-18,-92],[-5,-85],[-5,-61],[-18,-64]],'#4e7088');
  path([[0,-85],[16,-91],[17,-64],[0,-60]],'#6e8c9e');
  for(let i=0;i<3;i++){line(-16,-82+i*7,-7,-79+i*7,'#b0c8d6',1.5);line(2,-79+i*7,15,-83+i*7,'#c6dce6',1.5);}
  path([[-22,-97],[-8,-101],[-6,-91],[-22,-80],[-31,-84],[-31,-94]],'#587d97');
  line(-29,-91,-18,-94,'#d2e9f3',2);
  path([[-10,-98],[0,-93],[12,-99],[13,-88],[0,-83],[-12,-89]],'#172d40');
  // A restrained Skyglass seal set into the breastplate.
  path([[-3,-76],[1,-81],[5,-76],[1,-70]],'#b5e8fa');
 }else{
  path([[-19,-93],[-5,-87],[14,-94],[10,-65],[-7,-61],[-17,-68]],'#265d54');
  path([[-15,-94],[-6,-89],[-14,-66],[-20,-68]],'#d1bc86');
  line(-9,-85,9,-75,'#8ecdb9',2);line(-12,-77,7,-67,'#8ecdb966',1);
  path([[12,-97],[25,-92],[26,-82],[12,-85],[5,-92]],'#537e6d');
  line(13,-94,23,-90,accent,2);
  // Courier ledger at the rear hip, held in a leather harness.
  path([[-27,-63],[-15,-65],[-13,-47],[-26,-45]],'#81634a');line(-24,-60,-16,-61,'#e4d9b1',3);line(-25,-52,-14,-54,'#3d342e',2);
 }
 path([[-21,-59],[20,-59],[21,-52],[-21,-51]],dark);line(-18,-55,18,-56,accent,1);
 path([[-3,-59],[4,-59],[5,-52],[-3,-52]],accent);
 // Main sleeve and bracer articulate with the attack hand, not a painted frame.
 limb([13,-89],[32,pose.armY-6],13,cloth);
 limb([32,pose.armY-6],[pose.armX,pose.armY],10,skin);
 const dx=pose.armX-32,dy=6,len=Math.hypot(dx,dy)||1;
 const wrist=[pose.armX-dx/len*4,pose.armY-dy/len*4];
 limb([32+dx*.48,pose.armY-6+dy*.48],wrist,11,silent?'#52778e':'#316e63');
 line(wrist[0]-2,wrist[1]-4,wrist[0]+2,wrist[1]+3,accent,1.5);
 oval(pose.armX,pose.armY,6,6,dark);oval(pose.armX+2,pose.armY-1,3,3,skin);
 if(!move&&['tachi','katana','kaiken','championKatana'].includes(f.weapon)){
  const x=pose.armX,y=pose.armY;
  line(x-7,y+5,x,y,ink,5);line(x-7,y+5,x,y,'#b0a17d',2);
  path([[x,y-2],[x+40,y-30],[x+49,y-34],[x+43,y-26],[x+2,y+1]],'#c6e1ee');
  line(x+5,y-4,x+42,y-29,'#f0fbff',1);line(x-2,y-6,x+5,y+5,accent,3);
 }
 // Face, swept hair and expressive eye retain a clear profile at gameplay scale.
 oval(0,-111,15,19,gradient(-12,-123,16,-100,['#f4ddc8',skin,'#a57f70']));
 if(silent){
  path([[-16,-116],[-20,-132],[-9,-140],[5,-140],[17,-130],[18,-121],[9,-129],[2,-121],[-5,-128],[-13,-115]],gradient(-20,-140,17,-117,['#f3f5ef',hair,'#738a9f']));
  for(let i=0;i<4;i++)line(-12+i*6,-133,-15+i*6,-124,'#ffffff66',1);
  path([[-15,-108],[-5,-105],[15,-108],[15,-97],[1,-92],[-14,-99]],'#1c3044');line(-11,-103,12,-102,'#678298',1);
 }else{
  path([[-16,-116],[-22,-129],[-16,-137],[-13,-130],[-2,-142],[3,-134],[15,-137],[13,-129],[22,-126],[15,-115],[8,-125],[-2,-123],[-8,-127]],gradient(-18,-140,18,-115,['#fff0c4',hair,'#9c8863']));
  line(3,-100,10,-100,'#92695b',1);
 }
 // Original crests: Silent's ice crystal, Aren's courier wing.
 line(-16,-120,14,-120,dark,7);line(-9,-120,8,-120,'#b9cbd3',5);
 if(silent){for(const [dx,dy]of [[3,0],[2,3],[-2,3]])line(-dx,-120-dy,dx,-120+dy,'#2d627d',1);}
 else{line(-5,-122,0,-118,'#30685d',1);line(0,-118,5,-122,'#30685d',1);}
 line(4,-114,12,-115,dark,1.8);oval(9,-110,2.4,2,silent?'#90ddff':'#c7a763');oval(10,-111,1,1,'#effbff');
 line(14,-107,17,-105,'#9e7469',1);oval(-14,-110,3,4,skin);
 // Trailing ties use bounded pose displacement, preserving a stable head root.
 line(-17,-120,-35-pose.trail,-115,dark,3);line(-17,-120,-38-pose.trail,-125,dark,2);
}
