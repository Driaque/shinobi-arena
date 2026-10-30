import { MOVES } from "../engine/index.js";
import { motionFor } from './motion.js';
import { createTraining, chargeTrainingAwakening } from "../engine/training.js";

export const WORLD = { width: 1600, height: 900, floor: 650 };
export const ASSETS = {
  fighter: "./assets/visual-lab/aren-atlas.webp",
  arena: "./assets/visual-lab/skyglass-terrace.webp",
};
// Texture views into the generated atlas. Origins follow the fighter's hips/feet,
// rather than each pose's changing sword/coat bounds; no per-frame image stretching.
const rows = [0, 320, 600, 922, 1254],
  columns = [
    [0, 313, 627, 941, 1254],
    [0, 345, 628, 966, 1254],
    [0, 296, 660, 977, 1254],
    [0, 313, 627, 960, 1254],
  ];
const roots = [
  [175, 316],
  [470, 316],
  [770, 316],
  [1100, 316],
  [174, 590],
  [477, 590],
  [790, 590],
  [1114, 590],
  [160, 913],
  [457, 913],
  [814, 913],
  [1120, 913],
  [161, 1215],
  [473, 1215],
  [790, 1215],
  [1120, 1215],
];
export const FRAMES = roots.map(([rootX, rootY], i) => {
  const r = i >> 2,
    c = i % 4,
    x = columns[r][c],
    y = rows[r],
    w = columns[r][c + 1] - x,
    h = rows[r + 1] - y;
  return { x, y, w, h, rootX: rootX - x, rootY: rootY - y };
});
export function createLabState(dummy = "idle") {
  const state = createTraining(
    [0, 1].map(() => ({
      character: "silent",
      weapon: "tachi",
      jutsus: ["risingGale", "skyCleave", "divingFlame", "floodField"],
    })),
    { dummy, showRanges: false },
  );
  chargeTrainingAwakening(state);
  return state;
}
// These are ordinary engine inputs. They never submit a match or write rankings.
export function showcaseInput(tick) {
  const actions = {
    30: "special1",
    41: "jump",
    44: "attack",
    53: "attack",
    61: "special2",
    72: "bloodline",
    150: "awakening",
    210: "weapon",
    300: "jump",
    317: "jump",
    325: "dashForward",
    430: "dashBack",
    520: "jutsu4",
  };
  if (actions[tick]) return { [actions[tick]]: true };
  if (tick >= 230 && tick < 255) return { left: true };
  if (tick >= 370 && tick < 395) return { right: true };
  if (tick >= 460 && tick < 490) return { block: true, crouch: true };
  return {};
}
export function poseFor(f, tick, reduced = false) {
  if (f.stun) return { frame: 13, name: "Hit reaction" };
  if (f.awakeningFlash > 0) return { frame: 14, name: "Awakening" };
  if (f.blocking || f.crouching) return { frame: 12, name: "Low guard" };
  if (f.action) {
    const m = MOVES[f.action.move],
      age = f.action.age;
    if (m.ground || m.projectile || m.buff)
      return { frame: 15, name: "Elemental art" };
    if (f.y > 0)
      return {
        frame: m.spike
          ? 7
          : m.sword
            ? 11
            : f.action.move === "airAttack2"
              ? 10
              : 9,
        name: m.spike ? "Aerial finisher" : "Aerial strike",
      };
    return {
      frame: age < m.startup ? 8 : age < m.startup + m.active ? 9 : 10,
      name:
        age < m.startup
          ? "Anticipation"
          : age < m.startup + m.active
            ? "Strike"
            : "Follow-through",
    };
  }
  if (f.dash) return { frame: 4, name: "Dash" };
  if (f.y > 0)
    return {
      frame: f.vy > 5 ? 5 : f.vy > 0 ? 6 : 7,
      name: f.vy > 0 ? "Jump rise" : "Jump fall",
    };
  if (tick - (f.landedAt ?? -100) < 8) return { frame: 7, name: "Landing" };
  if (
    Math.abs(f.vx ?? 0) > 0.3 ||
    Math.abs(f.previous?.moveX ?? 0) > 0.1 ||
    f.previous?.left ||
    f.previous?.right
  )
    return { frame: 2 + (Math.floor((f.travel ?? tick * Math.abs(f.vx ?? 3)) / 30) % 2), name: "Run" };
  return { frame: reduced ? 0 : Math.floor(tick / 35) % 2, name: "Idle" };
}
export function sceneFor(state, { reduced = false, effects = true } = {}) {
  const fighters = state.fighters.map((f) => {
    const pose = poseFor(f, state.tick, reduced),
      frame = FRAMES[pose.frame];
    let from = pose.frame, phase = 5;
    if (!reduced) {
      const move = MOVES[f.action?.move];
      if (pose.name === 'Run') {
        phase = (f.travel ?? state.tick * Math.abs(f.vx ?? 3)) % 30;
        from = pose.frame === 2 ? 3 : 2;
      } else if (move && ['Anticipation','Strike','Follow-through'].includes(pose.name)) {
        phase = f.action.age - (pose.name === 'Strike' ? move.startup : pose.name === 'Follow-through' ? move.startup + move.active : 0);
        from = pose.name === 'Strike' ? 8 : pose.name === 'Follow-through' ? 9 : 0;
      } else if (pose.name === 'Landing') {
        phase = state.tick - f.landedAt; from = 5;
      }
    }
    return {
      id: f.id,
      frame,
      frameIndex:pose.frame,
      blendFrame: FRAMES[from],
      blendIndex:from,
      blend: Math.max(0, Math.min(1, phase / 4)),
      pose: pose.name,
      x: f.x,
      y: WORLD.floor + (f.depth ?? 0) * 0.65 - f.y,
      facing: f.facing,
      scale: (0.48 * (f.scale ?? 0.86)) / 0.86,
      bob:
        reduced || f.y > 0 || f.action ? 0 : Math.sin(state.tick * 0.065) * 0.7,
      awake: effects && !reduced && f.awakeningTicks > 0,
      hit: state.tick - f.lastHit < 5,
      blocking: f.blocking,
      action: f.action,
      motion: motionFor(f, state.tick, reduced),
      crouching: f.crouching,
      bodyScale: f.scale ?? 1,
      depth: f.depth ?? 0,
      air: f.y,
    };
  });
  const motes =
    effects && !reduced
      ? Array.from({ length: 28 }, (_, i) => ({
          x: (i * 113 + state.tick * 0.38) % 1600,
          y: 220 + ((i * 71) % 410) + Math.sin(state.tick * 0.015 + i) * 14,
          r: i % 3 ? 1.4 : 2.2,
          alpha: 0.12 + (i % 4) * 0.08,
        }))
      : [];
  const bursts = effects && !reduced
    ? state.fighters
        .filter((f) => state.tick - f.lastHit < 9)
        .map((f) => ({
          x: f.x,
          y: WORLD.floor + (f.depth ?? 0) * 0.65 - f.y - 65,
          age: state.tick - f.lastHit,
        }))
    : [];
  return {
    tick: state.tick,
    reduced,
    fighters,
    motes,
    bursts,
    zones: state.zones,
    projectiles: state.projectiles,
    parallax: reduced
      ? 0
      : ((state.fighters[0].x + state.fighters[1].x) / 2 - 800) * 0.015,
  };
}
