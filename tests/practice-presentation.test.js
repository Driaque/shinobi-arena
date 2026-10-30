import test from "node:test";
import assert from "node:assert/strict";
import { createTraining, stepTraining } from "../packages/engine/training.js";
import { practiceSceneFor } from "../packages/presentation/practice-scene.js";
import { cameraForScene } from "../packages/presentation/camera.js";

test("Practice appearance preserves selected kits, consumables and simulated combat state", () => {
  const state = createTraining([
    {
      character: "silent",
      weapons: ["fans", "katana"],
      weapon: "fans",
      items: ["paperBomb", "poison", "smokeBomb", "raijinKunai"],
      jutsus: ["risingGale", "skyCleave", "divingFlame", "floodField"],
    },
    { character: "sasuke", weapon: "tachi" },
  ]);
  for (let n = 0; n < 40; n++)
    stepTraining(state, n === 0 ? { special1: true } : {});
  const before = structuredClone(state),
    viewport = {
      worldWidth: 1600,
      viewHeight: 400,
      zoom: 0.8,
      shakeX: 2,
      shakeY: -1,
    };
  const scene = practiceSceneFor(state, viewport);
  assert.deepEqual(state, before);
  assert.deepEqual(scene.viewport, viewport);
  assert.equal(state.loadouts[0].character, "silent");
  assert.deepEqual(state.loadouts[0].weapons, ["fans", "katana"]);
  assert.equal(scene.fighters[0].scale * 302, 120 * state.fighters[0].scale);
  assert.equal(scene.projectiles.length, 0);
  assert.equal(scene.zones.length, 0);
  const legacy=structuredClone(state);delete legacy.fighters[0].scale;
  assert.ok(Math.abs(practiceSceneFor(legacy,viewport).fighters[0].scale*302-120)<1e-9);
});
test("Practice sprite camera aligns with the main engine floor, depth and shake without stretching", () => {
  const viewport = {
      worldWidth: 1600,
      viewHeight: 400,
      zoom: 0.8,
      shakeX: 2,
      shakeY: -1,
    },
    camera = cameraForScene({ viewport }, 800, 200);
  // Engine fighter at x600, 50px airborne, depth20 has this main-canvas screen anchor.
  assert.ok(Math.abs(camera.x + 600 * camera.scale - 320.8) < 1e-9);
  assert.ok(
    Math.abs(camera.y + (650 + 20 * 0.65 - 50) * camera.scale - 164.8) < 1e-9,
  );
  const tall = cameraForScene({ viewport }, 800, 400);
  assert.equal(tall.scale, camera.scale);
  assert.equal(tall.x, camera.x);
  assert.equal(tall.y - camera.y, 100); // Symmetric letterboxing, no vertical stretch.
});

test('native fields retain element, depth and expiry while smoke stays in the compatibility overlay',()=>{
 const state=createTraining([{character:'silent',weapon:'tachi'},{character:'sasuke',weapon:'katana'}]);
 state.zones=[{kind:'elemental',move:'floodField',x:500,depth:18,radius:140,remaining:24},{kind:'smoke',x:600,remaining:30}];
 const before=structuredClone(state), scene=practiceSceneFor(state,{});
 assert.deepEqual(state,before);assert.equal(scene.zones.length,1);
 assert.equal(scene.zones[0].element,'water');assert.equal(scene.zones[0].depth,18);assert.equal(scene.zones[0].remaining,24);
});
