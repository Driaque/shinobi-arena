import { MOVES } from '../engine/index.js';

// Root-anchored presentation offsets only. Never alter the simulation or stretch
// the atlas: every pose keeps its authored aspect ratio and collision position.
export function motionFor(f, tick, reduced = false) {
  const motion = { x: 0, y: 0, rotation: 0, trail: false };
  if (reduced) return motion;
  const facing = f.facing ?? 1;
  if (f.stun > 0) {
    motion.rotation = -facing * 0.07;
    return motion;
  }
  const move = MOVES[f.action?.move];
  if (move) {
    const age = f.action.age, start = Math.max(1, move.startup);
    if (age < start) {
      const anticipation = Math.sin(age / start * Math.PI / 2);
      motion.x = -facing * 3 * anticipation;
      motion.rotation = -facing * 0.035 * anticipation;
    } else {
      const progress = Math.min(1, (age - start) / Math.max(1, (move.active ?? 0) + (move.recovery ?? 0)));
      const follow = Math.sin(progress * Math.PI);
      motion.x = facing * 4 * follow;
      motion.rotation = facing * (move.spike ? 0.12 : 0.055) * follow;
      motion.trail = age < start + move.active && Boolean(move.sword || move.dash || f.y > 0);
    }
  } else if (f.dash) {
    motion.rotation = facing * 0.09; motion.trail = true;
  } else if (f.y > 0) {
    motion.rotation = facing * Math.max(-0.045, Math.min(0.045, -(f.vy ?? 0) * 0.004));
  } else {
    const landingAge = tick - (f.landedAt ?? -100);
    if (landingAge >= 0 && landingAge < 10) motion.y = 3 * Math.sin(landingAge / 10 * Math.PI);
    else if (Math.abs(f.vx ?? 0) > 0.3) {
      const phase = (f.travel ?? tick * Math.abs(f.vx)) / 15;
      motion.y = -Math.abs(Math.sin(phase)) * 2;
      motion.rotation = facing * 0.025;
    }
  }
  return motion;
}
