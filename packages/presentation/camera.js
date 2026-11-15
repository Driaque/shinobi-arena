import { WORLD } from "./visual-lab.js";

const ENGINE_FLOOR = 570;

export function cameraForScene(scene, width, height) {
  if (scene.viewport) {
    const v = scene.viewport,
      fit = Math.min(width / v.worldWidth, height / v.viewHeight);
    // The fight camera supplies its own pan; older viewports stay centred.
    const tx = v.tx ?? v.worldWidth * 0.5 * (1 - v.zoom),
      ty = v.ty ?? v.viewHeight * 0.9 - ENGINE_FLOOR * v.zoom;
    return {
      scale: fit * v.zoom,
      x: (width - v.worldWidth * fit) / 2 + (tx + v.shakeX * v.zoom) * fit,
      y:
        (height - v.viewHeight * fit) / 2 +
        (ty - (WORLD.floor - ENGINE_FLOOR) * v.zoom + v.shakeY * v.zoom) * fit,
    };
  }
  const scale = Math.min(
    width / WORLD.width,
    (height * 0.84) / 540,
  );
  return {
    scale,
    x: (width - WORLD.width * scale) / 2,
    y: height * 0.84 - WORLD.floor * scale,
  };
}

// Widest framing: the whole arena with aerial headroom. The fight camera never
// shows anything this view would not, so stage art sized for it always covers.
export const baseZoomFor = (viewHeight) => Math.min(1, (viewHeight * 0.9) / 540);
const floorLine = (viewHeight, zoom) =>
  viewHeight - Math.max(viewHeight * 0.1, 48 * zoom);
const clampCenter = (x, zoom, base, worldWidth) => {
  const slack = worldWidth / (2 * base) - worldWidth / (2 * zoom);
  return Math.max(worldWidth / 2 - slack, Math.min(worldWidth / 2 + slack, x));
};

// Where the camera wants to be: close when fighters are close, wide when they
// separate or leave the ground. Engine units; presentation only.
export function fightCameraTarget(fighters, { worldWidth, viewHeight }) {
  const base = baseZoomFor(viewHeight),
    living = fighters.filter((f) => f.hp > 0),
    framed = living.length ? living : fighters;
  if (!framed.length) return { zoom: base, centerX: worldWidth / 2 };
  let left = Infinity,
    right = -Infinity,
    air = 0;
  for (const f of framed) {
    left = Math.min(left, f.x);
    right = Math.max(right, f.x);
    air = Math.max(air, f.y ?? 0);
  }
  const closest = Math.max(base, Math.min(base * 2.1, viewHeight / 330)),
    horizontal = worldWidth / (right - left + 500),
    // Heads stay on screen through jumps and double jumps.
    vertical = Math.min(
      (viewHeight * 0.84) / (air + 150),
      (viewHeight * 0.94) / (air + 210),
    ),
    zoom = Math.max(base, Math.min(closest, horizontal, vertical));
  return { zoom, centerX: clampCenter((left + right) / 2, zoom, base, worldWidth) };
}

export function fightViewport(camera, { worldWidth, viewHeight }, punch = 0) {
  const zoom = camera.zoom * (1 + punch);
  return {
    worldWidth,
    viewHeight,
    zoom,
    baseZoom: baseZoomFor(viewHeight),
    tx: worldWidth * 0.5 - camera.centerX * zoom,
    ty: floorLine(viewHeight, camera.zoom) - ENGINE_FLOOR * zoom,
  };
}

// Smoothed camera. Pulls back quickly so nobody leaves the frame, closes in
// slowly so exchanges do not pump the view.
export function createFightCamera() {
  let current = null;
  return {
    update(fighters, size, { dt = 0, fixed = false, snap = false, punch = 0 } = {}) {
      const base = baseZoomFor(size.viewHeight);
      if (fixed) {
        current = null;
        return fightViewport({ zoom: base, centerX: size.worldWidth / 2 }, size);
      }
      const target = fightCameraTarget(fighters, size);
      if (!current || snap || !(dt > 0)) current = target;
      else {
        const ease = (seconds) => 1 - Math.exp(-Math.min(dt, 0.1) / seconds),
          zoom =
            current.zoom +
            (target.zoom - current.zoom) * ease(target.zoom < current.zoom ? 0.12 : 0.45);
        current = {
          zoom,
          centerX: clampCenter(
            current.centerX + (target.centerX - current.centerX) * ease(0.16),
            zoom,
            base,
            size.worldWidth,
          ),
        };
      }
      return fightViewport(current, size, punch);
    },
  };
}
