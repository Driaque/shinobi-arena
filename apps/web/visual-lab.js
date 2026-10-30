import { emitSound, soundFor } from "./audio.js";
import { createInput } from "./packages/input/index.js";
import { createStickGestures } from "./packages/input/analog.js";
import {
  stepTraining,
  chargeTrainingAwakening,
} from "./packages/engine/training.js";
import {
  createLabState,
  showcaseInput,
  sceneFor,
} from "./packages/presentation/visual-lab.js";
import {
  loadLabArt,
  createCanvasLab,
  createPixiLab,
} from "./visual-lab-renderers.js";

const $ = (s) => document.querySelector(s),
  stage = $("#lab-stage"),
  status = $("#lab-status"),
  input = createInput(),
  gesture = createStickGestures();
const reduced = matchMedia("(prefers-reduced-motion: reduce)"),
  canvases = { canvas: $("#lab-canvas"), pixi: $("#lab-pixi") };
const keys = {
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  KeyW: "jump",
  ArrowUp: "jump",
  Space: "jump",
  KeyS: "crouch",
  ArrowDown: "crouch",
  KeyJ: "attack",
  KeyK: "weapon",
  KeyU: "special1",
  KeyI: "special2",
  KeyO: "bloodline",
  KeyH: "block",
  KeyT: "awakening",
  KeyE: "dashForward",
  KeyQ: "dashBack",
  KeyG: "charge",
  KeyZ: "depthUp",
  KeyL: "depthDown",
};
let state = createLabState(),
  renderers = {},
  backend = "pixi",
  paused = false,
  last = 0,
  accumulator = 0,
  raf = 0,
  ready = false,
  destroyed = false,
  lastInput = null,
  stickPointer = null,
  compare = null,
  rebuilding = false;
let samples = { frames: [], render: [], input: [] },
  comparisonResults = [],
  lastReadout = 0;
const p95 = (values) =>
  values.length
    ? [...values].sort((a, b) => a - b)[
        Math.min(values.length - 1, Math.floor(values.length * 0.95))
      ]
    : null;
const ms = (value) => (value === null ? "—" : value.toFixed(2) + " ms");
const sample = (array, value) => {
  array.push(value);
  if (array.length > 300) array.shift();
};
function resetMeasurements() {
  samples = { frames: [], render: [], input: [] };
  last = 0;
  lastInput = null;
}
function releaseInputs() {
  input.reset();
  gesture.reset();
  stickPointer = null;
  $("#lab-stick").style.setProperty("--x", "0px");
  $("#lab-stick").style.setProperty("--y", "0px");
  document
    .querySelectorAll("[data-lab-action]")
    .forEach((b) => b.classList.remove("active"));
}
function resetState() {
  state = createLabState($("#lab-dummy").value);
  releaseInputs();
  accumulator = 0;
  resetMeasurements();
}
function switchRenderer(value) {
  backend = renderers[value] ? value : "canvas";
  $("#lab-renderer").value = backend;
  for (const [name, canvas] of Object.entries(canvases))
    canvas.hidden = name !== backend;
  resetMeasurements();
  resize();
}
function resize() {
  if (!ready) return;
  const rect = stage.getBoundingClientRect();
  if (
    compare &&
    (Math.abs(rect.width - compare.width) > 1 ||
      Math.abs(rect.height - compare.height) > 1)
  ) {
    stopComparison("Comparison cancelled because the viewport changed.");
  }
  for (const r of Object.values(renderers)) r.resize(rect.width, rect.height);
}
function stopComparison(message) {
  if (!compare) return;
  compare = null;
  $("#lab-compare").textContent = "Compare · 5s each";
  $("#lab-renderer").disabled = !renderers.pixi;
  $("#lab-mode").disabled = false;
  $("#lab-dummy").disabled = false;
  $("#lab-resolution").disabled = false;
  $("#lab-effects").disabled = false;
  $("#lab-sound").disabled = false;
  $("#lab-compare").disabled = !renderers.pixi;
  if (message) status.textContent = message;
}
function chooseManual() {
  stopComparison("Comparison stopped for manual practice.");
  $("#lab-mode").value = "manual";
}
function press(action, source) {
  if (!ready || paused || rebuilding) return;
  chooseManual();
  lastInput = { time: performance.now(), applied: false };
  input.press(action, source);
}
window.addEventListener("keydown", (e) => {
  if (e.target.closest("input,select,button,summary,a")) return;
  const action = keys[e.code];
  if (action) {
    e.preventDefault();
    if (!e.repeat) press(action, "key:" + e.code);
  }
  if (e.code === "Escape") releaseInputs();
});
window.addEventListener("keyup", (e) => {
  if (keys[e.code]) {
    e.preventDefault();
    input.release("key:" + e.code);
  }
});
for (const button of document.querySelectorAll("[data-lab-action]")) {
  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    press(button.dataset.labAction, "pointer:" + e.pointerId);
    button.classList.add("active");
  });
  const release = (e) => {
    input.release("pointer:" + e.pointerId);
    button.classList.remove("active");
  };
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    button.addEventListener(name, release);
}
const stick = $("#lab-stick");
function moveStick(e) {
  if (e.pointerId !== stickPointer) return;
  const rect = stick.getBoundingClientRect(),
    radius = rect.width * 0.4,
    x = (e.clientX - rect.left - rect.width / 2) / radius,
    y = (e.clientY - rect.top - rect.height / 2) / radius,
    length = Math.max(1, Math.hypot(x, y)),
    vector = { x: x / length, y: y / length };
  input.setAxis("stick", vector.x);
  input.setDepth("stick", vector.y);
  const g = gesture.update(vector, performance.now());
  if (g.dashDirection) input.dash(g.dashDirection);
  stick.style.setProperty("--x", vector.x * radius + "px");
  stick.style.setProperty("--y", vector.y * radius + "px");
}
stick.addEventListener("pointerdown", (e) => {
  if (stickPointer !== null || !ready || paused) return;
  e.preventDefault();
  chooseManual();
  lastInput = { time: performance.now(), applied: false };
  stickPointer = e.pointerId;
  stick.setPointerCapture(e.pointerId);
  moveStick(e);
});
stick.addEventListener("pointermove", (e) => {
  if (e.pointerId === stickPointer) {
    e.preventDefault();
    moveStick(e);
  }
});
for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
  stick.addEventListener(name, (e) => {
    if (e.pointerId !== stickPointer) return;
    input.release("stick");
    stickPointer = null;
    gesture.release();
    stick.style.setProperty("--x", "0px");
    stick.style.setProperty("--y", "0px");
  });
$("#lab-mode").onchange = () => {
  stopComparison();
  resetState();
};
$("#lab-dummy").onchange = () => {
  chooseManual();
  resetState();
};
$("#lab-renderer").onchange = () => {
  stopComparison();
  switchRenderer($("#lab-renderer").value);
  status.textContent =
    renderers[backend].name + " · same fight state retained.";
};
$("#lab-reset").onclick = () => {
  stopComparison();
  resetState();
  status.textContent = "Practice reset. Awakening is ready.";
};
$("#lab-pause").onclick = () => {
  stopComparison();
  paused = !paused;
  $("#lab-pause").textContent = paused ? "Resume" : "Pause";
  releaseInputs();
  last = 0;
};
$("#lab-awakening-ready").onclick = () => {
  chooseManual();
  chargeTrainingAwakening(state);
  status.textContent =
    "Awakening prepared for practice. Press T or Awaken when free to act.";
};
$("#lab-fullscreen").onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen)
      await document.documentElement.requestFullscreen();
    else
      status.textContent =
        "Native fullscreen is unavailable in this browser. Landscape play remains available.";
  } catch {
    status.textContent =
      "Fullscreen was not granted. Landscape play remains available.";
  }
  resize();
};
document.addEventListener("fullscreenchange", () => {
  $("#lab-fullscreen").textContent = document.fullscreenElement
    ? "Exit full screen"
    : "Full screen";
  resize();
});
$("#lab-export").onclick = () => {
  const data = {
    version: "visual-lab-v1",
    userAgent: navigator.userAgent,
    viewport: { width: stage.clientWidth, height: stage.clientHeight },
    devicePixelRatio: devicePixelRatio,
    resolution: Math.min(devicePixelRatio, Number($("#lab-resolution").value)),
    results: comparisonResults,
    current: {
      renderer: renderers[backend]?.name,
      frameP95: p95(samples.frames),
      cpuRenderP95: p95(samples.render),
      inputSubmissionP95: p95(samples.input),
    },
    limits:
      "CPU submission timings only; GPU completion and physical display latency are not measured. Results are specific to this device.",
  };
  const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = "fabled-rivals-visual-lab.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$("#lab-compare").onclick = () => {
  if (compare) {
    stopComparison("Comparison cancelled.");
    return;
  }
  if (!renderers.pixi) return;
  paused = false;
  $("#lab-pause").textContent = "Pause";
  $("#lab-mode").value = "showcase";
  $("#lab-dummy").value = "idle";
  comparisonResults = [];
  $("#lab-results").replaceChildren();
  compare = {
    order: ["canvas", "pixi"],
    index: 0,
    frames: [],
    render: [],
    warmup: 30,
    width: stage.getBoundingClientRect().width,
    height: stage.getBoundingClientRect().height,
  };
  for (const id of [
    "lab-renderer",
    "lab-mode",
    "lab-dummy",
    "lab-resolution",
    "lab-effects",
    "lab-sound",
  ])
    $("#" + id).disabled = true;
  $("#lab-compare").textContent = "Cancel comparison";
  switchRenderer("canvas");
  resetState();
  status.textContent = "Comparing Canvas 2D: warmup, then 300 fixed ticks.";
};
function finishSample() {
  const result = {
    renderer: renderers[backend].name,
    frameP95: p95(compare.frames),
    cpuRenderP95: p95(compare.render),
    samples: compare.render.length,
    ticks: state.tick,
  };
  comparisonResults.push(result);
  const row = document.createElement("tr");
  for (const value of [
    result.renderer,
    ms(result.frameP95),
    ms(result.cpuRenderP95),
    result.samples,
  ]) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.append(cell);
  }
  $("#lab-results").append(row);
  if (++compare.index < compare.order.length) {
    switchRenderer(compare.order[compare.index]);
    resetState();
    compare.frames = [];
    compare.render = [];
    compare.warmup = 30;
    status.textContent =
      "Comparing PixiJS: warmup, then the same 300 fixed ticks.";
  } else {
    stopComparison(
      "Comparison complete. Open Comparison results to inspect device measurements.",
    );
    $("#lab-details").open = true;
  }
}
function updateReadout(now, scene) {
  const f = state.fighters[0];
  stage.dataset.tick = state.tick;
  stage.dataset.x = f.x.toFixed(2);
  stage.dataset.y = f.y.toFixed(2);
  stage.dataset.jumps = f.jumps;
  stage.dataset.pose = scene.fighters[0].pose;
  stage.dataset.awake = f.awakeningTicks > 0;
  stage.dataset.hits = f.combo.hits;
  stage.dataset.renderer = backend;
  stage.dataset.dash = Boolean(f.dash);
  stage.dataset.blocking = f.blocking;
  stage.dataset.crouching = f.crouching;
  stage.dataset.charging = f.charging;
  stage.dataset.depth = f.depth;
  stage.dataset.frame =
    scene.fighters[0].frame.x + "," + scene.fighters[0].frame.y;
  $("#lab-hp0").value = f.hp;
  $("#lab-hp1").value = state.fighters[1].hp;
  $("#lab-combo").textContent =
    f.combo.hits > 1
      ? f.combo.hits + " HIT COMBO · " + f.combo.damage + " DMG"
      : f.awakeningTicks > 0
        ? "GALE ASCENDANT"
        : "SKYGLASS TERRACE";
  if (now - lastReadout < 180) return;
  lastReadout = now;
  $("#lab-frame").textContent = ms(p95(samples.frames));
  $("#lab-render").textContent = ms(p95(samples.render));
  $("#lab-input").textContent = ms(p95(samples.input));
  const heap = performance.memory?.usedJSHeapSize;
  $("#lab-memory").textContent = heap
    ? (heap / 1048576).toFixed(1) + " MB"
    : "Unavailable";
  if (!compare)
    status.textContent =
      (paused ? "Paused · " : renderers[backend].name + " · ") +
      scene.fighters[0].pose +
      " · " +
      ($("#lab-mode").value === "showcase"
        ? "Guided showcase"
        : "Free practice") +
      " · " +
      (renderers.pixi ? "A/B renderer available" : "Canvas fallback");
}
function frame(now) {
  if (destroyed) return;
  raf = requestAnimationFrame(frame);
  if (!ready || rebuilding || document.hidden) {
    last = 0;
    return;
  }
  const delta = last ? now - last : 0;
  last = now;
  if (delta > 0) sample(samples.frames, delta);
  if (!paused) {
    if (compare) {
      if (compare.warmup > 0) {
        compare.warmup--;
        accumulator = 0;
      } else {
        accumulator += Math.min(delta / 1000, 0.1);
        while (accumulator >= 1 / 60 && state.tick < 300) {
          tick(showcaseInput(state.tick));
          accumulator -= 1 / 60;
        }
      }
    } else {
      accumulator += Math.min(delta / 1000, 0.1);
      while (accumulator >= 1 / 60) {
        tick(
          $("#lab-mode").value === "showcase"
            ? showcaseInput(state.tick)
            : input.consume(),
        );
        accumulator -= 1 / 60;
        if ($("#lab-mode").value === "showcase" && state.tick >= 720)
          resetState();
      }
    }
  }
  const scene = sceneFor(state, {
    reduced: reduced.matches,
    effects: $("#lab-effects").checked,
  });
  const begin = performance.now();
  renderers[backend].draw(scene);
  const duration = performance.now() - begin;
  sample(samples.render, duration);
  if (lastInput?.applied) {
    sample(samples.input, performance.now() - lastInput.time);
    lastInput = null;
  }
  if (compare && compare.warmup === 0) {
    if (delta > 0) compare.frames.push(delta);
    compare.render.push(duration);
    if (state.tick >= 300) finishSample();
  }
  updateReadout(now, scene);
}
function graphicsLost(message) {
  if (destroyed) return;
  stopComparison();
  if (renderers.canvas) {
    switchRenderer("canvas");
    $("#lab-renderer option[value=pixi]").disabled = true;
    $("#lab-compare").disabled = true;
  }
  status.textContent = message;
  $("#lab-loading").hidden = false;
  $("#lab-loading").textContent = message;
}
let audio;
$("#lab-sound").onchange = async () => {
  if ($("#lab-sound").checked) {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw Error();
      audio ??= new Audio();
      await audio.resume();
    } catch {
      $("#lab-sound").checked = false;
      status.textContent = "Audio is unavailable in this browser.";
    }
  }
};
function tick(inputFrame) {
  stepTraining(state, inputFrame);
  if (lastInput) lastInput.applied = true;
  if (audio?.state === "running" && $("#lab-sound").checked && !compare)
    for (const event of state.events) {
      const kind = soundFor(event);
      if (kind)
        emitSound(audio, audio.destination, kind, audio.currentTime, 0.25);
    }
}
let art;
async function prepare() {
  if (rebuilding) return;
  rebuilding = true;
  $("#lab-resolution").disabled = true;
  ready = false;
  stage.dataset.ready = "loading";
  releaseInputs();
  $("#lab-loading").hidden = false;
  $("#lab-loading").textContent = "Preparing original artwork and WebGL…";
  try {
    art ??= await loadLabArt();
    if (destroyed) return;
    for (const r of Object.values(renderers)) r.destroy();
    renderers = {};
    // A destroyed WebGL context must not be reused for a resolution rebuild.
    const freshCanvas = canvases.pixi.cloneNode(false);
    canvases.pixi.replaceWith(freshCanvas);
    canvases.pixi = freshCanvas;
    const resolution = Math.min(
      devicePixelRatio || 1,
      Number($("#lab-resolution").value),
    );
    renderers.canvas = createCanvasLab(canvases.canvas, art, resolution);
    try {
      renderers.pixi = await createPixiLab(
        canvases.pixi,
        art,
        resolution,
        graphicsLost,
      );
      $("#lab-renderer option[value=pixi]").disabled = false;
    } catch {
      backend = "canvas";
      $("#lab-renderer option[value=pixi]").disabled = true;
    }
    if (destroyed) {
      for (const r of Object.values(renderers)) r.destroy();
      return;
    }
    ready = true;
    switchRenderer(backend);
    $("#lab-renderer").disabled = !renderers.pixi;
    $("#lab-compare").disabled = !renderers.pixi;
    $("#lab-loading").hidden = true;
    stage.dataset.ready = "true";
    status.textContent = renderers.pixi
      ? "Ready · original artwork loaded."
      : "WebGL unavailable · Canvas 2D comparison is ready.";
  } catch {
    stage.dataset.ready = "error";
    $("#lab-loading").textContent =
      "Artwork could not load. Check your connection and reload the Visual Lab.";
    status.textContent =
      "Visual Lab unavailable. Use Back to game to continue playing.";
  } finally {
    rebuilding = false;
    $("#lab-resolution").disabled = Boolean(compare);
    last = 0;
  }
}
$("#lab-resolution").onchange = () => {
  stopComparison();
  prepare();
};
window.addEventListener("resize", resize);
window.addEventListener("blur", releaseInputs);
document.addEventListener("visibilitychange", () => {
  releaseInputs();
  last = 0;
  accumulator = 0;
  if (document.hidden) audio?.suspend().catch(() => {});
  else if ($("#lab-sound").checked) audio?.resume().catch(() => {});
  if (document.hidden)
    stopComparison("Comparison cancelled while the page was hidden.");
});
window.addEventListener("pagehide", () => {
  destroyed = true;
  audio?.close().catch(() => {});
  releaseInputs();
  cancelAnimationFrame(raf);
  observer.disconnect();
  for (const r of Object.values(renderers)) r.destroy();
});
window.addEventListener("pageshow", (e) => {
  if (e.persisted) location.reload();
});
const observer = new ResizeObserver(resize);
observer.observe(stage);
await prepare();
raf = requestAnimationFrame(frame);
