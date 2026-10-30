import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js';

// One GPU context for both rosters. Copy each rendered portrait into its own
// 2D canvas so a full roster never exhausts mobile WebGL context limits.
const entries = new Set();
let backend;
async function renderer() {
  if (!backend) backend = (async () => {
    const app = new Application();
    await app.init({ width:144, height:152, resolution:1, autoStart:false,
      preference:'webgl', backgroundAlpha:0, antialias:true, preserveDrawingBuffer:true });
    app.canvas.addEventListener('webglcontextlost', () => {
      for (const entry of entries) { entry.restore(); entry.destroy(); }
      entries.clear();
      if(frame) cancelAnimationFrame(frame); frame=0;
    });
    return app;
  })();
  return backend;
}
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let frame = 0, previous = 0;
function schedule() { if (!frame && entries.size) frame = requestAnimationFrame(tick); }
function tick(now) {
  frame = 0;
  if (now - previous >= 1000/24) {
    previous = now;
    // Modal loadout/settings screens cover the roster. Avoid GPU readbacks
    // behind them and while the selection overlay is closed.
    if(document.hidden || document.querySelector('dialog[open]') || document.querySelector('#overlay')?.hidden){schedule();return;}
    for (const entry of entries) {
      if (!entry.card.isConnected) { entry.destroy(); entries.delete(entry); continue; }
      if (!document.hidden && entry.visible && entry.card.getClientRects().length && !entry.card.closest('[hidden]')) {
        try { entry.draw(now/1000); }
        catch { entry.restore(); entry.destroy(); entries.delete(entry); }
      }
    }
  }
  schedule();
}

export async function animatePortrait(card, visual, character) {
  const app = await renderer();
  if (!card.isConnected) return;
  if (visual instanceof HTMLImageElement) { await visual.decode(); if (!card.isConnected) return; }
  const canvas = document.createElement('canvas');
  canvas.className = visual.className;
  canvas.width=144; canvas.height=152;
  canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d');
  if (!ctx) return;
  // Normalize object-fit:cover images and procedural portraits into one texture.
  const source=document.createElement('canvas'); source.width=144; source.height=152;
  const sc=source.getContext('2d');
  const w=visual.naturalWidth || visual.width, h=visual.naturalHeight || visual.height;
  const scale=Math.max(144/w,152/h);
  const vertical=visual instanceof HTMLImageElement ? .28 : .5;
  sc.drawImage(visual,(144-w*scale)/2,(152-h*scale)*vertical,w*scale,h*scale);
  const texture=Texture.from(source), stage=new Container();
  const sprite=new Sprite(texture); sprite.anchor.set(.5,.65); stage.addChild(sprite);
  const effects=new Graphics(); stage.addChild(effects);
  const color=Number.parseInt(character.color.slice(1),16);
  const seed=[...character.id].reduce((n,c)=>n+c.charCodeAt(0),0);
  let visible=false, lastStill=false, lastDraw=-Infinity;
  const input=card.querySelector('input');
  const entry={card,get visible(){return visible;},restore(){if(canvas.isConnected)canvas.replaceWith(visual);},
    draw(time){
      const active=card.matches(':hover,:focus-within') || input?.checked;
      const still=reduced(), enabled=document.documentElement.dataset.effects!=='off';
      if(!still && time-lastDraw < 1/(active?12:8)) return;
      lastDraw=time;
      if(still && lastStill) return;
      lastStill=still;
      const t=still?0:time, phase=seed*.37;
      const energy=active?1:.45;
      sprite.position.set(72+(still?0:Math.sin(t*.8+phase)*1.1),99+(still?0:Math.sin(t*1.8+phase)*1.3));
      sprite.scale.set(1.045,1.045+(still?0:Math.sin(t*1.8+phase)*.009));
      sprite.rotation=still?0:Math.sin(t*.7+phase)*.006;
      effects.clear();
      if(enabled && !still){
        // Element-colored motes drift independently, never in a synchronized loop.
        for(let i=0;i<9;i++){
          const cycle=(t*(9+i%3*3)+seed+i*23)%180;
          const x=9+(i*37+seed)%126+Math.sin(t*(.6+i*.07)+i)*5;
          const y=166-cycle;
          const alpha=Math.max(0,Math.sin(cycle/180*Math.PI))*.65*energy;
          effects.circle(x,y,i%3===0?1.8:1).fill({color,alpha});
          if(['winta','kael'].includes(character.id) && i<3 && Math.sin(t*9+i*7)>.82){
            effects.moveTo(x,y).lineTo(x+4,y-7).lineTo(x+1,y-9).lineTo(x+5,y-15).stroke({color,width:1,alpha:.7*energy});
          }
        }
        effects.ellipse(72,148,49,8).fill({color,alpha:(.08+Math.sin(t*2+phase)*.025)*energy});
      }
      app.renderer.render({container:stage});
      ctx.clearRect(0,0,144,152); ctx.drawImage(app.canvas,0,0);
      canvas.dataset.animatedPortrait=character.id;
    },
    destroy(){observer.disconnect();stage.destroy({children:true});texture.destroy(true);}
  };
  const observer=new IntersectionObserver(records=>{
    visible=records[0].isIntersecting;
    if(visible) {lastStill=false;lastDraw=-Infinity;entry.draw(performance.now()/1000);}
  });
  entry.draw(performance.now()/1000);
  visual.replaceWith(canvas); observer.observe(card); entries.add(entry); schedule();
}
