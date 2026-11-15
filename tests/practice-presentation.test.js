import test from "node:test";
import assert from "node:assert/strict";
import { createTraining, stepTraining } from "../packages/engine/training.js";
import { practiceSceneFor } from "../packages/presentation/practice-scene.js";
import { cameraForScene } from "../packages/presentation/camera.js";

test("Practice appearance preserves selected kits, consumables and simulated combat state", () => {
  const state = createTraining([
    {
      character: "silent",
      weapons: ["tideglassFans", "skyforgedBlade"],
      weapon: "tideglassFans",
      items: ["cinderCharge", "poison", "veilCanister", "waypointAnchor"],
      jutsus: ["risingGale", "skyCleave", "divingFlame", "floodField"],
    },
    { character: "vesper", weapon: "frostmereSaber" },
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
  assert.deepEqual(state.loadouts[0].weapons, ["tideglassFans", "skyforgedBlade"]);
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
 const state=createTraining([{character:'silent',weapon:'frostmereSaber'},{character:'vesper',weapon:'skyforgedBlade'}]);
 state.zones=[{kind:'elemental',move:'floodField',x:500,depth:18,radius:140,remaining:24},{kind:'smoke',x:600,remaining:30}];
 const before=structuredClone(state), scene=practiceSceneFor(state,{});
 assert.deepEqual(state,before);assert.equal(scene.zones.length,1);
 assert.equal(scene.zones[0].element,'water');assert.equal(scene.zones[0].depth,18);assert.equal(scene.zones[0].remaining,24);
});

test('selected fights always carry sprite fighters; real-time impacts add sparks, flash and jolt without touching state',()=>{
 const state=createTraining([{character:'silent',weapon:'frostmereSaber'},{character:'aren',weapon:'skyforgedBlade'}]);
 state.fighters[1].lastHit=state.tick;state.fighters[1].lastDamage=60;
 const before=structuredClone(state),calm=practiceSceneFor(state,{}, {selected:true,atlasFighters:['silent','aren']});
 assert.equal(calm.fighters.length,2);assert.ok(calm.motes.length>0);
 const struck=practiceSceneFor(state,{hits:{[state.fighters[1].id]:40}},{selected:true,atlasFighters:['silent','aren']});
 assert.equal(struck.bursts.length,1);assert.equal(struck.bursts[0].power,60);assert.equal(struck.bursts[0].blocked,false);
 const victim=struck.fighters.find(f=>f.id===1),other=struck.fighters.find(f=>f.id===0);
 assert.ok(victim.flash>0&&victim.flash<1);assert.ok(Number.isFinite(victim.jolt));assert.equal(other.flash,undefined);
 // Sparks end with the cue; guarded hits ring without flashing the body.
 assert.equal(practiceSceneFor(state,{hits:{[state.fighters[1].id]:260}},{selected:true,atlasFighters:['silent','aren']}).bursts.length,0);
 state.fighters[1].blockedHit=true;const guarded=practiceSceneFor(state,{hits:{[state.fighters[1].id]:40}},{selected:true,atlasFighters:['silent','aren']});
 assert.equal(guarded.bursts[0].blocked,true);assert.equal(guarded.fighters.find(f=>f.id===1).flash,undefined);
 state.fighters[1].blockedHit=before.fighters[1].blockedHit;
 assert.equal(practiceSceneFor(state,{hits:{[state.fighters[1].id]:40}},{selected:true,atlasFighters:['silent','aren'],reduced:true}).bursts.length,0);
 assert.deepEqual(state,before);
});
