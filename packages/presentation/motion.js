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
    const ease = t => { t = Math.max(0, Math.min(1, t)); return t*t*(3-2*t); };
    if (age < start) {
      const anticipation = ease(age / start);
      motion.x = -facing * 3 * anticipation;
      motion.rotation = -facing * 0.035 * anticipation;
    } else {
      const active = Math.max(1, move.active ?? 0), peak = move.spike ? 0.12 : 0.055;
      if (age < start + active) {
        const t = ease((age-start)/active);
        motion.x = facing * (-3 + 7*t);
        motion.rotation = facing * (-0.035 + (peak+0.035)*t);
      } else {
        const settle = 1-ease((age-start-active)/Math.max(1,move.recovery??0));
        motion.x = facing*4*settle;
        motion.rotation = facing*peak*settle;
      }
      motion.trail = age < start + move.active && Boolean(move.sword || move.dash || f.y > 0);
    }
  } else if (f.dash) {
    motion.rotation = facing * 0.09; motion.trail = true;
  } else if (f.y > 0) {
    motion.rotation = facing * Math.max(-0.045, Math.min(0.045, -(f.vy ?? 0) * 0.004));
  } else {
    const landingAge = tick - (f.landedAt ?? -100);
    if (landingAge >= 0 && landingAge < 10) motion.y = 3 * Math.sin(landingAge / 10 * Math.PI);
    else if (Math.abs(f.vx ?? 0) > 0.3 || Math.abs(f.previous?.moveZ ?? 0) > 0.1) {
      const phase = (f.travel ?? tick * Math.abs(f.vx ?? 0)) / 64 * Math.PI * 2;
      motion.y = -(1-Math.cos(phase*2))*1.2;
      motion.rotation = facing * (0.018 + Math.sin(phase)*0.012);
    }
  }
  return motion;
}
