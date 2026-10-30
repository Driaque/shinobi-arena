import test from "node:test";
import assert from "node:assert/strict";
import {
  createLabState,
  showcaseInput,
  sceneFor,
  FRAMES,
} from "../packages/presentation/visual-lab.js";
import { stepTraining } from "../packages/engine/training.js";

test("Visual Lab showcase earns a five-hit air route, awakens and double jumps through real engine inputs", () => {
  const state = createLabState(),
    types = new Set();
  let maxHits = 0,
    maxJumps = 0,
    awoke = false,
    airDash = false;
  for (let tick = 0; tick < 600; tick++) {
    stepTraining(state, showcaseInput(state.tick));
    for (const e of state.events) types.add(e.type);
    const f = state.fighters[0];
    maxHits = Math.max(maxHits, f.combo.hits);
    maxJumps = Math.max(maxJumps, f.jumps);
    awoke ||= f.awakeningTicks > 0;
    airDash ||= Boolean(f.dash?.air);
  }
  assert.equal(maxHits, 5);
  assert.equal(maxJumps, 2);
  assert.ok(awoke);
  assert.ok(airDash);
  for (const type of ["airChase", "airFinish", "awakening", "hit"])
    assert.ok(types.has(type), type);
  assert.ok(state.training);
});
test("Both renderer scenes are deterministic and cannot mutate the simulated fight", () => {
  const state = createLabState();
  for (let i = 0; i < 85; i++) stepTraining(state, showcaseInput(state.tick));
  const before = structuredClone(state);
  const first = sceneFor(state),
    second = sceneFor(state);
  assert.deepEqual(first, second);
  assert.deepEqual(state, before);
  assert.ok(first.fighters.some((f) => f.air > 0));
  assert.equal(first.fighters[0].scale, first.fighters[1].scale);
  const reduced = sceneFor(state, { reduced: true });
  assert.equal(reduced.motes.length, 0);
  assert.equal(reduced.parallax, 0);
  assert.equal(FRAMES.length, 16);
  for (const f of FRAMES) {
    assert.ok(f.x >= 0 && f.y >= 0 && f.x + f.w <= 1254 && f.y + f.h <= 1254);
    assert.ok(f.rootX >= 0 && f.rootX <= f.w && f.rootY >= 0 && f.rootY <= f.h);
  }
});
