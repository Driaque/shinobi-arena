import { createRenderer } from "./renderer.js";

export const GRAPHICS_KEY = "fabled.practice.graphics.v1";
const valid = (value) =>
  ["classic", "canvas", "pixi"].includes(value) ? value : "classic";
export function createPracticeRenderer(canvas, { getMode }) {
  const base = createRenderer(canvas),
    select = document.querySelector("#practice-renderer"),
    message = document.querySelector("#practice-graphics-status"),
    retry = document.querySelector("#practice-graphics-retry");
  let requested = "classic";
  try {
    requested = valid(localStorage.getItem(GRAPHICS_KEY));
  } catch {}
  select.value = requested;
  let backends = null,
    loading = false,
    generation = 0,
    active = false,
    wasTraining = false,
    failed = false,
    gpuLost = false,
    disposed = false;
  let modulePromise = null,
    retryAttempt = 0;
  let label = "Canvas · selected fighters";
  function report(text) {
    if (message.textContent !== text) message.textContent = text;
    label = text;
    retry.hidden = !failed && !gpuLost;
  }
  function release() {
    generation++;
    loading = false;
    backends?.destroy();
    backends = null;
    active = false;
    gpuLost = false;
  }
  async function load() {
    const epoch = ++generation;
    loading = true;
    report("Loading Aren appearance…");
    try {
      if (!modulePromise) {
        const url = new URL("./practice-pixi.js", import.meta.url);
        url.search = new URL(import.meta.url).search;
        if (retryAttempt) url.searchParams.set("retry", String(retryAttempt));
        modulePromise = import(url.href).catch((error) => {
          modulePromise = null;
          throw error;
        });
      }
      const module = await modulePromise;
      if (epoch !== generation || disposed) return;
      const next = await module.createPracticeBackends(
        canvas.parentElement,
        (text) => {
          if (epoch !== generation || disposed) return;
          gpuLost = true;
          report(text);
        },
      );
      if (
        epoch !== generation ||
        disposed ||
        getMode() !== "training" ||
        requested === "classic"
      ) {
        next.destroy();
        return;
      }
      backends = next;
      gpuLost = requested === "pixi" && !next.hasPixi();
      report(
        gpuLost
          ? "WebGL unavailable. Aren is using Canvas."
          : "Aren appearance ready. Selected fighter kits remain unchanged.",
      );
    } catch {
      if (epoch !== generation || disposed) return;
      failed = true;
      report(
        "Aren graphics could not load. The current Canvas renderer remains available. Retry graphics to try again.",
      );
    } finally {
      if (epoch === generation) loading = false;
    }
  }
  function configure(force = false) {
    const next = valid(select.value);
    if (force && !modulePromise) retryAttempt++;
    if (force || next === "classic") release();
    requested = next;
    failed = false;
    try {
      localStorage.setItem(GRAPHICS_KEY, requested);
    } catch {}
    if (requested === "classic") report("Canvas · selected fighters");
    else if (backends) {
      gpuLost = next === "pixi" && !backends.hasPixi();
      if (gpuLost) report("WebGL unavailable. Aren is using Canvas.");
    }
  }
  select.addEventListener("change", () => configure());
  retry.onclick = () => configure(true);
  const render = (state, options = {}) => {
    if (disposed) return;
    const training = getMode() === "training" && Boolean(state.training);
    if (!training && wasTraining) {
      release();
      failed = false;
      report(
        "Aren graphics apply only in Practice. Other modes use the current Canvas renderer.",
      );
    }
    wasTraining = training;
    if (training && requested !== "classic" && !backends && !loading && !failed)
      load();
    active = training && requested !== "classic" && Boolean(backends);
    if (!active) {
      backends?.hide();
      base(state, options);
      canvas.dataset.presentation = "classic";
    } else {
      base(state, { ...options, layers: { background: false, actors: false } });
      try {
        const actual = backends.draw(
          base.frame.state,
          base.frame.viewport,
          gpuLost ? "canvas" : requested,
        );
        canvas.dataset.presentation = "aren-" + actual;
        if (!gpuLost)
          report(
            actual === "pixi"
              ? "PixiJS · Aren + sparring echo"
              : "Canvas · Aren + sparring echo",
          );
      } catch {
        release();
        failed = true;
        report(
          "Aren rendering stopped. The current Canvas renderer has been restored. Retry graphics to try again.",
        );
        active = false;
        base(state, options);
        canvas.dataset.presentation = "classic";
      }
    }
    canvas.dataset.renderTick = state.tick;
  };
  window.addEventListener("pagehide", release);
  render.preview = () => active;
  render.status = () => ({
    requested,
    label,
    loading,
    fallback: failed || gpuLost,
    presentation: canvas.dataset.presentation ?? "classic",
  });
  render.dispose = () => {
    window.removeEventListener("pagehide", release);
    disposed = true;
    release();
    base.dispose();
  };
  report(
    "Choose an Aren appearance for Practice. Graphics changes keep the current fight state.",
  );
  return render;
}
