import {stageArtwork,paintedStageForView} from './packages/presentation/artwork.js';
import {stageShapes} from './packages/presentation/stages.js';
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
import { weaponSpriteFor } from "./packages/presentation/weapons.js";

const teal = 0x8eead7,
  gold = 0xffcb88;
const fieldColors = {fire:0xf28c52,water:0x69c6e2,earth:0xd2b77f,poison:0xb2d36d};
const fieldColor = z => fieldColors[z.element] ?? 0x69c6e2;
// Stage art is sized for the widest framing so it stays put while the fight camera moves.
const stageView = (scene, view, width, height) =>
  scene.viewport?.baseZoom
    ? camera({viewport:{...scene.viewport,zoom:scene.viewport.baseZoom,tx:undefined,ty:undefined,shakeX:0,shakeY:0}},width,height)
    : view;
const stageMargin = scene => scene.viewport?.baseZoom ? 1.04 : 1;
// Impact spark: ring, hot core and streaks. Guarded hits keep a cool ring only.
function burstParts(p) {
  const t = Math.min(1, p.age / 12),
    power = 1 + Math.min(1.2, (p.power ?? 0) / 90),
    streaks = [];
  if (!p.blocked && p.seed !== undefined)
    for (let i = 0; i < 7; i++) {
      const a = p.seed * 0.7 + i * 2.399,
        from = (10 + t * 46) * power,
        to = from + 26 * (1 - t) * power;
      streaks.push([p.x + Math.cos(a) * from, p.y + Math.sin(a) * from, p.x + Math.cos(a) * to, p.y + Math.sin(a) * to]);
    }
  return { t, ring: (8 + p.age * 4) * power, core: p.blocked || p.seed === undefined ? 0 : (16 - t * 14) * power, streaks };
}
// Thrown weapons with painted art; everything else stays a vector shape.
const DISC_SIZE = 46;
const spriteProjectiles = (scene, art) => (scene.projectiles ?? []).filter((p) => p.sprite && art.weapons?.get(p.sprite));
const shapeProjectiles = (scene, art) => ({ ...scene, projectiles: (scene.projectiles ?? []).filter((p) => !(p.sprite && art.weapons?.get(p.sprite))) });
const projectileSpin = (scene, p) => (scene.reduced ? 0 : scene.tick * 0.45 * (p.direction ?? 1));
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
    ctx.translate(f.x + offset + (f.jolt ?? 0) + (f.motion?.x ?? 0), f.y + f.bob + (f.motion?.y ?? 0));
    ctx.rotate(f.motion?.rotation ?? 0);
    ctx.scale(f.facing * f.scale, f.scale);
    const image = f.atlasId ? (f.runAtlas?art.runSheets:art.sheets).get(f.atlasId) : art.fighter;
    ctx.drawImage(image, a.x, a.y, a.w, a.h, -a.rootX, -a.rootY, a.w, a.h);
    if (f.flash > 0 && !offset) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = f.flash;
      ctx.drawImage(image, a.x, a.y, a.w, a.h, -a.rootX, -a.rootY, a.w, a.h);
    }
    ctx.restore();
  }
  // Slash trail and the painted weapon, in the fighter's facing space.
  function gear(f) {
    if (!f.weapon && !f.arc) return;
    ctx.save();
    ctx.translate(f.x + (f.jolt ?? 0), f.y);
    ctx.scale(f.facing * (f.bodyScale ?? 1), f.bodyScale ?? 1);
    const poly = (points, color, alpha) => {
      ctx.globalAlpha = Math.min(1, alpha) * (f.alpha ?? 1);
      ctx.fillStyle = "#" + color.toString(16).padStart(6, "0");
      ctx.beginPath();
      for (let i = 0; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
      ctx.closePath();
      ctx.fill();
    };
    if (f.arc) {
      ctx.globalCompositeOperation = "lighter";
      poly(f.arc.points, f.arc.color, f.arc.alpha);
      poly(f.arc.edge, 0xffffff, f.arc.alpha * 1.5);
      ctx.globalCompositeOperation = "source-over";
    }
    const image = f.weapon && art.weapons?.get(f.weapon.id);
    if (image) {
      const s = weaponSpriteFor(f.weapon, image.width);
      ctx.globalAlpha = f.weapon.alpha * (f.alpha ?? 1);
      ctx.translate(f.weapon.x, f.weapon.y);
      ctx.rotate(s.rotation);
      ctx.scale(s.scale, s.scale);
      ctx.drawImage(image, -s.anchorX * image.width, -s.anchorY * image.height);
    }
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
    const painted=scene.stage&&stageArtwork(scene.stage);
    canvas.dataset.paintedStage=painted?scene.stage:'';
    scene.painted=Boolean(painted);
    if(painted){const r=paintedStageForView(stageView(scene,view,canvas.width,canvas.height),canvas.width,canvas.height,stageMargin(scene));ctx.drawImage(painted,r.x,r.y,r.w,r.h);}else if(!scene.stage||scene.stage==='skyglass')ctx.drawImage(art.arena, bg.x, bg.y, bg.w, bg.h);else shapes(stageShapes(scene.stage));
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
      gear(f);
      if (f.blocking) {
        const height=(f.crouching?68:110)*(f.bodyScale??1);
        ellipse(f.x + f.facing * 18, f.y - height/2, 25, height/2, "#88ead74a");
      }
    }
    shapes(projectileShapes(shapeProjectiles(scene, art)));
    for (const p of spriteProjectiles(scene, art)) {
      const image = art.weapons.get(p.sprite);
      ctx.save();
      ctx.translate(p.x, WORLD.floor + (p.depth ?? 0) * 0.65 - p.y);
      ctx.rotate(projectileSpin(scene, p));
      ctx.drawImage(image, -DISC_SIZE / 2, -DISC_SIZE / 2, DISC_SIZE, DISC_SIZE);
      ctx.restore();
    }
    for (const p of scene.motes)
      ellipse(p.x, p.y, p.r, p.r, `rgba(172,237,227,${p.alpha})`);
    for (const p of scene.bursts) {
      const b = burstParts(p);
      ctx.globalAlpha = 1 - b.t;
      ctx.strokeStyle = p.blocked ? "#8eead7" : "#ffe0a9";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(p.x, p.y, b.ring, 0, Math.PI * 2);
      for (const [x, y, xx, yy] of b.streaks) {
        ctx.moveTo(x, y);
        ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      if (b.core) ellipse(p.x, p.y, b.core, b.core, "#fff6de");
      ctx.globalAlpha = 1;
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
  root.eventMode = "none";
  root.interactiveChildren = false;
  app.stage.addChild(root);
  const bgTexture = Texture.from(art.arena),
    bg = new Sprite(bgTexture);
  root.addChild(bg);
  const terrain = new Graphics();
  let staticScenery = sceneryFor({decorative:false});
  shapes(terrain,staticScenery);
  const ground = new Graphics(),
    fighters = new Container(),
    props = new Container(),
    effects = new Graphics();
  root.addChild(terrain, ground, fighters, props, effects);
  const weaponTextures = new Map(),
    thrown = [];
  function weaponTexture(id) {
    const image = art.weapons?.get(id);
    if (image && !weaponTextures.has(id)) weaponTextures.set(id, Texture.from(image));
    return image ? weaponTextures.get(id) : null;
  }
  fighters.sortableChildren = true;
  const atlas = Texture.from(art.fighter),
    textures = FRAMES.map(
      (f) =>
        new Texture({
          source: atlas.source,
          frame: new Rectangle(f.x, f.y, f.w, f.h),
        }),
    );
  const sheetTextures=new Map();
  function texturesFor(id,run=false){
    if(!id)return textures;
    const key=run?id+':run':id;
    if(!sheetTextures.has(key)){
      const source=Texture.from((run?art.runSheets:art.sheets).get(id));
      const views=FIGHTER_FRAMES.map(f=>new Texture({source:source.source,frame:new Rectangle(f.x,f.y,f.w,f.h)}));
      sheetTextures.set(key,{source,views});
    }
    return sheetTextures.get(key).views;
  }
  const actors = new Map();
  function actorFor(id) {
    if(actors.has(id))return actors.get(id);
    const container = new Container();
    fighters.addChild(container);
    const ghosts = Array.from({ length: 3 }, () => {
      const s = new Sprite(textures[0]);
      container.addChild(s);
      return s;
    });
    const sprite = new Sprite(textures[0]);
    container.addChild(sprite);
    // Additive copy of the same frame: brightens the body on impact.
    const flash = new Sprite(textures[0]);
    flash.blendMode = "add";
    flash.visible = false;
    container.addChild(flash);
    // Slash trail and painted weapon share the fighter's facing space.
    const rig = new Container(),
      arc = new Graphics(),
      weapon = new Sprite();
    arc.blendMode = "add";
    weapon.visible = false;
    rig.addChild(arc, weapon);
    container.addChild(rig);
    const actor={container,ghosts,sprite,flash,rig,arc,weapon};actors.set(id,actor);return actor;
  }
  const paintedTextures=new Map();
  let terrainStage=null;
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
    sprite.texture = texturesFor(f.atlasId,f.runAtlas)[f.atlasId?f.frameIndex:index];
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
    const stage=scene.stage??'skyglass';
    const painted=scene.stage&&stageArtwork(stage);
    if(painted&&!paintedTextures.has(painted))paintedTextures.set(painted,Texture.from(painted));
    canvas.dataset.paintedStage=painted?stage:'';
    bg.texture=painted?paintedTextures.get(painted):bgTexture;
    bg.visible=Boolean(painted)||stage==='skyglass';
    const terrainKey=stage+Boolean(painted);
    scene.painted=Boolean(painted);
    if(terrainStage!==terrainKey){terrain.clear();if(!painted&&stage!=='skyglass')shapes(terrain,stageShapes(stage));staticScenery=sceneryFor({decorative:false,painted:scene.painted});shapes(terrain,staticScenery);terrainStage=terrainKey;}
    const view = camera(scene, app.screen.width, app.screen.height);
    root.scale.set(view.scale);
    root.position.set(view.x, view.y);
    const rect = painted?paintedStageForView(stageView(scene,view,app.screen.width,app.screen.height),app.screen.width,app.screen.height,stageMargin(scene)):backgroundRect(art.arena, scene);
    bg.position.set(rect.x, rect.y);
    bg.width = rect.w;
    bg.height = rect.h;
    ground.clear();
    effects.clear();
    // Retain static geometry; rebuild only the animated additions.
    shapes(ground,sceneryFor(scene).slice(staticScenery.length));
    for(const a of actors.values())a.container.visible=false;
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
      const a = actorFor(f.id);
      a.container.visible=true;
      a.container.position.set(f.x + (f.jolt ?? 0), f.y);
      a.container.alpha = f.alpha ?? 1;
      a.container.zIndex = f.depth;
      paintSprite(a.sprite, f);
      a.sprite.alpha = 1;
      a.flash.visible = f.flash > 0;
      if (a.flash.visible) {
        paintSprite(a.flash, f);
        a.flash.alpha = f.flash;
      }
      for (let i = 0; i < 3; i++) {
        const g = a.ghosts[i];
        g.visible = !scene.reduced && (f.pose === "Dash" || Boolean(f.motion?.trail));
        g.alpha = 0.09 * (i + 1);
        paintSprite(g, f, -f.facing * (3 - i) * 22);
      }
      a.rig.scale.set(f.facing * (f.bodyScale ?? 1), f.bodyScale ?? 1);
      a.arc.clear();
      if (f.arc) {
        a.arc.poly(f.arc.points).fill({ color: f.arc.color, alpha: Math.min(1, f.arc.alpha) });
        a.arc.poly(f.arc.edge).fill({ color: 0xffffff, alpha: Math.min(1, f.arc.alpha * 1.5) });
      }
      const blade = f.weapon && weaponTexture(f.weapon.id);
      a.weapon.visible = Boolean(blade);
      if (blade) {
        const s = weaponSpriteFor(f.weapon, blade.width);
        a.weapon.texture = blade;
        a.weapon.anchor.set(s.anchorX, s.anchorY);
        a.weapon.position.set(f.weapon.x, f.weapon.y);
        a.weapon.rotation = s.rotation;
        a.weapon.scale.set(s.scale);
        a.weapon.alpha = f.weapon.alpha;
      }
      if (f.blocking) {
        const height=(f.crouching?68:110)*(f.bodyScale??1);
        effects.ellipse(f.x + f.facing*18, f.y-height/2, 25, height/2)
          .fill({color:teal,alpha:0.18}).stroke({color:teal,width:2,alpha:0.65});
      }
    }
    shapes(effects,projectileShapes(shapeProjectiles(scene, art)));
    const flying = spriteProjectiles(scene, art);
    for (const [i, p] of flying.entries()) {
      if (!thrown[i]) {
        thrown[i] = new Sprite();
        thrown[i].anchor.set(0.5);
        props.addChild(thrown[i]);
      }
      const s = thrown[i];
      s.texture = weaponTexture(p.sprite);
      s.visible = true;
      s.position.set(p.x, WORLD.floor + (p.depth ?? 0) * 0.65 - p.y);
      s.rotation = projectileSpin(scene, p);
      s.width = s.height = DISC_SIZE;
    }
    for (let i = flying.length; i < thrown.length; i++) thrown[i].visible = false;
    for (const p of scene.motes)
      effects.circle(p.x, p.y, p.r).fill({ color: 0xacede3, alpha: p.alpha });
    for (const p of scene.bursts) {
      const b = burstParts(p),
        alpha = 1 - b.t;
      effects.circle(p.x, p.y, b.ring).stroke({ color: p.blocked ? teal : 0xffe0a9, alpha, width: 3 });
      for (const [x, y, xx, yy] of b.streaks)
        effects.moveTo(x, y).lineTo(xx, yy).stroke({ color: 0xfff0c8, alpha, width: 3 });
      if (b.core) effects.circle(p.x, p.y, b.core).fill({ color: 0xfff6de, alpha: alpha * 0.85 });
    }
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
      for(const texture of paintedTextures.values())texture.destroy(true);
      for(const texture of weaponTextures.values())texture.destroy(true);
    },
  };
}
