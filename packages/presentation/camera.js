import { WORLD } from "./visual-lab.js";

export function cameraForScene(scene, width, height) {
  if (scene.viewport) {
    const v = scene.viewport,
      fit = Math.min(width / v.worldWidth, height / v.viewHeight);
    return {
      scale: fit * v.zoom,
      x:
        (width - v.worldWidth * fit) / 2 +
        (v.worldWidth * 0.5 * (1 - v.zoom) + v.shakeX * v.zoom) * fit,
      y:
        (height - v.viewHeight * fit) / 2 +
        (v.viewHeight * 0.9 - WORLD.floor * v.zoom + v.shakeY * v.zoom) * fit,
    };
  }
  const scale = Math.min(
    width / WORLD.width,
    (height * 0.75) / (Math.max(...scene.fighters.map((f) => f.air)) + 175),
  );
  return {
    scale,
    x: (width - WORLD.width * scale) / 2,
    y: height * 0.84 - WORLD.floor * scale,
  };
}
