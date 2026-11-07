// Original articulated preview bodies. Rendering never alters hitboxes or stats.
export function drawFutureFighter(c,f,pose,character,move){
 const ink='#0b1728',metal='#b2c5d0',color=character.color,skin=character.skin,hair=character.hair;
 const seed=[...character.id].reduce((n,ch)=>n+ch.charCodeAt(0),0),wide=['smith','marshal'].includes(character.style);
 const line=(a,b,width,fill)=>{c.strokeStyle=ink;c.lineWidth=width+3;c.lineCap='round';c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.strokeStyle=fill;c.lineWidth=width;c.stroke();};
 const poly=(p,fill)=>{c.fillStyle=fill;c.strokeStyle=ink;c.lineWidth=1.4;c.beginPath();p.forEach((a,i)=>i?c.lineTo(...a):c.moveTo(...a));c.closePath();c.fill();c.stroke();};
 const orb=(x,y,r,fill)=>{c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
 if(['regent','scribe','lantern'].includes(character.style))poly([[-22,-100],[-31,-52],[-38-pose.trail,-7],[7,-21],[27+pose.trail,-9],[23,-94]],color+'bb');
 for(const [i,l]of pose.legs.entries()){line([i?10:-10,-50],[l.kx,l.ky],wide?15:12,'#233448');line([l.kx,l.ky],[l.fx,l.fy-4],10,color);line([l.fx-7,l.fy],[l.fx+10,l.fy],8,'#243348');orb(l.kx,l.ky,4,metal);}
 line([-14,-89],[-28,-66],12,'#26384c');line([-28,-66],[-19,-48],9,skin);
 const w=wide?27:21;poly([[-w,-97],[-7,-105],[w,-95],[w-3,-52],[-w+4,-51]],color);
 poly([[-w,-95],[-8,-89],[-4,-64],[-w+6,-68]],metal);poly([[4,-92],[w,-98],[w-2,-70],[8,-65]],'#33485b');
 if(['smith','counter'].includes(character.style)){poly([[-w-7,-98],[-w+7,-104],[-7,-90],[-w-7,-82]],metal);poly([[w-8,-103],[w+9,-96],[w+8,-81],[11,-91]],color);}
 line([-w,-57],[w,-57],7,'#172536');orb(0,-57,4,'#d8b77d');
 const elbow=pose.elbow??{x:32,y:pose.armY-6};line([14,-90],[elbow.x,elbow.y],12,color);line([elbow.x,elbow.y],[pose.armX,pose.armY],10,character.style==='apothecary'?'#a6b69a':metal);orb(pose.armX,pose.armY,5,'#26364a');
 c.fillStyle=skin;c.beginPath();c.ellipse(0,-113,15,19,0,0,Math.PI*2);c.fill();
 c.fillStyle=hair;c.beginPath();c.ellipse(0,-128,16,10,0,Math.PI,Math.PI*2);c.lineTo(16,-118);c.quadraticCurveTo(0,-128,-16,-118);c.closePath();c.fill();
 if(seed%3===0){for(let i=0;i<3;i++)line([-13-i*3,-126],[-21-i*3-pose.trail,-88+i*8],3,hair);}
 if(['scribe','regent'].includes(character.style)){line([-15,-115],[14,-115],4,'#d3bb87');orb(5,-115,3,color);}
 else{line([-8,-114],[-2,-114],1.6,ink);line([5,-114],[11,-114],1.6,ink);}
 line([2,-102],[8,-102],1,'#805c4b');
 // Each school has an independent tool silhouette.
 if(character.style==='apothecary'){for(let i=0;i<3;i++){line([-25+i*7,-63],[-25+i*7,-48],4,['#aad28f','#87bbc9','#c4a7ce'][i]);}}
 if(character.style==='lantern'){line([-30,-82],[-30,-59],2,metal);poly([[-37,-59],[-24,-59],[-21,-36],[-39,-36]],'#304957');orb(-30,-46,6,color);}
 if(character.style==='scribe'){line([-23,-95],[-39,-20],5,metal);orb(-20,-103,9,color);}
 const sword=['frostmereSaber','skyforgedBlade','oathknife','concordLaureate'].includes(f.weapon);
 if(sword&&(!move||move.sword)){c.save();c.translate(pose.armX,pose.armY);c.rotate(pose.weaponAngle??-.65);const len=f.weapon==='oathknife'?32:wide?83:70;line([-12,0],[0,0],5,'#594b43');poly([[1,-3],[len,-5],[len+7,0],[len,2],[1,3]],metal);line([0,-7],[0,7],3,'#d6b47a');c.restore();}
 if(character.style==='vanguard')line([-21,-92],[-42,-19],5,'#8a9da9');
}
