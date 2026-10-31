import {sceneryFor,projectileShapes} from './packages/presentation/battlefield.js';
import {
  Application,
  Container,
  Graphics,
  Sprite,
  Texture,
  Rectangle,
  RendererType,
} from "pixi.js";
import { WORLD, FRAMES, ASSETS } from "./packages/presentation/visual-lab.js";
import { FIGHTER_FRAMES } from './packages/presentation/fighter-atlases.js';

import { cameraForScene as camera } from "./packages/presentation/camera.js";

const teal = 0x8eead7,
  gold = 0xffcb88;
const fieldColors = {fire:0xf28c52,water:0x69c6e2,earth:0xd2b77f,poison:0xb2d36d};
const fieldColor = z => fieldColors[z.element] ?? 0x69c6e2;
async function loadImage(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}
export async function loadLabArt() {
  const [fighter, arena] = await Promise.all([
    loadImage(ASSETS.fighter),
    loadImage(ASSETS.arena),
  ]);
  return { fighter, arena };
}
function backgroundRect(image, scene) {
  const w = WORLD.width + 40,
    h = (w * image.height) / image.width;
  return { x: -20 - scene.parallax, y: WORLD.height - h, w, h };
}
export function createCanvasLab(canvas, art, resolution) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw Error("Canvas 2D is unavailable");
  function resize(w, h) {
    canvas.width = Math.round(w * resolution);
    canvas.height = Math.round(h * resolution);
  }
  function fighter(f, alpha = 1, offset = 0) {
    const a = f.frame;
    ctx.save();
    ctx.globalAlpha = alpha * (f.alpha ?? 1);
    ctx.translate(f.x + offset + (f.motion?.x ?? 0), f.y + f.bob + (f.motion?.y ?? 0));
    ctx.rotate(f.motion?.rotation ?? 0);
    ctx.scale(f.facing * f.scale, f.scale);
    ctx.drawImage(
      f.atlasId ? art.sheets.get(f.atlasId) : art.fighter,
      a.x,
      a.y,
      a.w,
      a.h,
      -a.rootX,
      -a.rootY,
      a.w,
      a.h,
    );
    ctx.restore();
  }
  function shapes(items){for(const s of items){ctx.save();ctx.globalAlpha=s.alpha??1;ctx.fillStyle=ctx.strokeStyle='#'+s.color.toString(16).padStart(6,'0');ctx.lineWidth=s.width??1;ctx.beginPath();if(s.kind==='ellipse')ctx.ellipse(s.x,s.y,s.rx,s.ry,0,0,Math.PI*2);else if(s.kind==='line'){ctx.moveTo(s.x,s.y);ctx.lineTo(s.x2,s.y2);}else{s.points.forEach((n,i)=>{if(i%2===0)(i?ctx.lineTo:ctx.moveTo).call(ctx,n,s.points[i+1]);});ctx.closePath();}if(s.kind==='line')ctx.stroke();else ctx.fill();ctx.restore();}}
  function draw(scene) {
    ctx.resetTransform();
    ctx.fillStyle = "#0c1825";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const view = camera(scene, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    const bg = backgroundRect(art.arena, scene);
    ctx.drawImage(art.arena, bg.x, bg.y, bg.w, bg.h);
    shapes(sceneryFor(scene));
    const ellipse = (x, y, rx, ry, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    for (const z of scene.zones ?? [])
      if (z.kind === "elemental")
        ellipse(
          z.x,
          WORLD.floor + (z.depth ?? 0) * 0.65,
          z.radius,
          25,
          "#" + fieldColor(z).toString(16).padStart(6,"0") + "44",
        );
    for (const f of scene.fighters) {
      ellipse(
        f.x,
        WORLD.floor + f.depth * 0.65,
        Math.max(17, 34 - f.air * 0.035),
        6,
        "#08131b88",
      );
      if (f.awake)
        for (let i = 3; i > 0; i--)
          ellipse(
            f.x,
            f.y - 66,
            30 + i * 12,
            65 + i * 9,
            `rgba(93,237,211,${0.025 * i})`,
          );
    }
    for (const f of [...scene.fighters].sort((a, b) => a.depth - b.depth)) {
      if (!scene.reduced && (f.pose === "Dash" || f.motion?.trail))
        for (let i = 3; i > 0; i--)
          fighter(f, 0.09 * (4 - i), -f.facing * i * 22);
      fighter(f);
      if (f.blocking) {
        const height=(f.crouching?68:110)*(f.bodyScale??1);
        ellipse(f.x + f.facing * 18, f.y - height/2, 25, height/2, "#88ead74a");
      }
    }
    shapes(projectileShapes(scene));
    for (const p of scene.motes)
      ellipse(p.x, p.y, p.r, p.r, `rgba(172,237,227,${p.alpha})`);
    for (const p of scene.bursts) {
      ctx.strokeStyle = `rgba(255,224,169,${1 - p.age / 9})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8 + p.age * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  return { draw, resize, destroy() {}, name: "Canvas 2D" };
}
export async function createPixiLab(canvas, art, resolution, onLost) {
  const app = new Application();
  try {
    await app.init({
      canvas,
      width: 800,
      height: 450,
      resolution,
      autoDensity: true,
      autoStart: false,
      preference: ["webgl"],
      antialias: true,
      background: 0x0c1825,
    });
    if (app.renderer.type !== RendererType.WEBGL) {
      throw new Error("The comparison requires the WebGL backend");
    }
  } catch (error) {
    try {
      app.destroy();
    } catch {}
    throw error;
  }
  const root = new Container();
  app.stage.addChild(root);
  const bgTexture = Texture.from(art.arena),
    bg = new Sprite(bgTexture);
  root.addChild(bg);
  const ground = new Graphics(),
    fighters = new Container(),
    effects = new Graphics();
  root.addChild(ground, fighters, effects);
  const atlas = Texture.from(art.fighter),
    textures = FRAMES.map(
      (f) =>
        new Texture({
          source: atlas.source,
          frame: new Rectangle(f.x, f.y, f.w, f.h),
        }),
    );
  const sheetTextures=new Map();
  function texturesFor(id){
    if(!id)return textures;
    if(!sheetTextures.has(id)){
      const source=Texture.from(art.sheets.get(id));
      const views=FIGHTER_FRAMES.map(f=>new Texture({source:source.source,frame:new Rectangle(f.x,f.y,f.w,f.h)}));
      sheetTextures.set(id,{source,views});
    }
    return sheetTextures.get(id).views;
  }
  const actors = Array.from({ length: 2 }, () => {
    const container = new Container();
    fighters.addChild(container);
    const ghosts = Array.from({ length: 3 }, () => {
      const s = new Sprite(textures[0]);
      container.addChild(s);
      return s;
    });
    const sprite = new Sprite(textures[0]);
    container.addChild(sprite);
    return { container, ghosts, sprite };
  });
  let lost = false;
  const contextLost = (e) => {
    e.preventDefault();
    lost = true;
    onLost(
      "Graphics context lost. Canvas 2D is available; reload the lab to retry PixiJS.",
    );
  };
  canvas.addEventListener("webglcontextlost", contextLost);
  function paintSprite(sprite, f, offset = 0) {
    const frame = f.frame,
      index = FRAMES.indexOf(frame);
    sprite.texture = texturesFor(f.atlasId)[f.atlasId?f.frameIndex:index];
    sprite.pivot.set(frame.rootX, frame.rootY);
    sprite.position.set(offset + (f.motion?.x ?? 0), f.bob + (f.motion?.y ?? 0));
    sprite.rotation = f.motion?.rotation ?? 0;
    sprite.scale.set(f.facing * f.scale, f.scale);
  }
  function resize(w, h) {
    app.renderer.resize(w, h);
  }
  function shapes(graphics,items){for(const s of items){if(s.kind==='ellipse')graphics.ellipse(s.x,s.y,s.rx,s.ry).fill({color:s.color,alpha:s.alpha??1});else if(s.kind==='line')graphics.moveTo(s.x,s.y).lineTo(s.x2,s.y2).stroke({color:s.color,alpha:s.alpha??1,width:s.width??1});else graphics.poly(s.points).fill({color:s.color,alpha:s.alpha??1});}}
  function draw(scene) {
    if (lost) return;
    const view = camera(scene, app.screen.width, app.screen.height);
    root.scale.set(view.scale);
    root.position.set(view.x, view.y);
    const rect = backgroundRect(art.arena, scene);
    bg.position.set(rect.x, rect.y);
    bg.width = rect.w;
    bg.height = rect.h;
    ground.clear();
    effects.clear();
    shapes(ground,sceneryFor(scene));
    for(const a of actors)a.container.visible=false;
    for (const z of scene.zones ?? [])
      if (z.kind === "elemental")
        ground
          .ellipse(z.x, WORLD.floor + (z.depth ?? 0) * 0.65, z.radius, 25)
          .fill({ color: fieldColor(z), alpha: Math.min(0.3, (z.remaining ?? 60)/200) })
          .stroke({ color:fieldColor(z), width:2, alpha:0.7 });
    for (const f of scene.fighters) {
      ground
        .ellipse(
          f.x,
          WORLD.floor + f.depth * 0.65,
          Math.max(17, 34 - f.air * 0.035),
          6,
        )
        .fill({ color: 0x08131b, alpha: 0.53 });
      if (f.awake)
        for (let i = 3; i > 0; i--)
          ground
            .ellipse(f.x, f.y - 66, 30 + i * 12, 65 + i * 9)
            .fill({ color: 0x5dedd3, alpha: 0.025 * i });
      const a = actors[f.id];
      a.container.visible=true;
      a.container.position.set(f.x, f.y);
      a.container.alpha = f.alpha ?? 1;
      a.container.zIndex = f.depth;
      paintSprite(a.sprite, f);
      a.sprite.alpha = 1;
      for (let i = 0; i < 3; i++) {
        const g = a.ghosts[i];
        g.visible = !scene.reduced && (f.pose === "Dash" || Boolean(f.motion?.trail));
        g.alpha = 0.09 * (i + 1);
        paintSprite(g, f, -f.facing * (3 - i) * 22);
      }
      if (f.blocking) {
        const height=(f.crouching?68:110)*(f.bodyScale??1);
        effects.ellipse(f.x + f.facing*18, f.y-height/2, 25, height/2)
          .fill({color:teal,alpha:0.18}).stroke({color:teal,width:2,alpha:0.65});
      }
    }
    fighters.sortableChildren = true;
    shapes(effects,projectileShapes(scene));
    for (const p of scene.motes)
      effects.circle(p.x, p.y, p.r).fill({ color: 0xacede3, alpha: p.alpha });
    for (const p of scene.bursts)
      effects
        .circle(p.x, p.y, 8 + p.age * 4)
        .stroke({ color: 0xffe0a9, alpha: 1 - p.age / 9, width: 3 });
    app.renderer.render(app.stage);
  }
  return {
    draw,
    resize,
    name: "PixiJS · WebGL",
    destroy() {
      canvas.removeEventListener("webglcontextlost", contextLost);
      app.destroy(false, {
        children: true,
        texture: false,
        textureSource: false,
      });
      for (const t of textures) t.destroy();
      for(const {source,views} of sheetTextures.values()){for(const view of views)view.destroy();source.destroy(true);}
      atlas.destroy(true);
      bgTexture.destroy(true);
    },
  };
}
