import { ARENA } from "./packages/engine/index.js";

// Status cues drawn over sprite fighters: charge, bind, ward, effect motes and
// damage numbers. Weapons and strike trails belong to the sprite layer.
export function paintPracticeEffects(c, f, state) {
  const ground = ARENA.floor + (f.depth ?? 0) * 0.65 - f.y;
  const line = (x1, y1, x2, y2, color, width = 3) => {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
  };
  c.save();
  c.translate(f.x, ground);
  c.scale(f.facing * (f.scale ?? 1), f.scale ?? 1);
  if (f.invulnerable) c.globalAlpha = 0.45;
  // Four-point mote, the same cut as the guard crest and impact star.
  const mote = (x, y, w, h) => {
    c.beginPath();
    c.moveTo(x - w, y);
    c.lineTo(x, y - h);
    c.lineTo(x + w, y);
    c.lineTo(x, y + h);
    c.fill();
  };
  if (f.charging) {
    // Chakra is drawn up from a turning hexagon at the feet.
    const alpha = c.globalAlpha;
    c.strokeStyle = "#8ce6ee";
    c.lineWidth = 2;
    c.globalAlpha = alpha * 0.7;
    c.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = (i * Math.PI) / 3 + state.tick * 0.03;
      c.lineTo(Math.cos(a) * 46, -3 + Math.sin(a) * 12);
    }
    c.stroke();
    c.fillStyle = "#c4f5f8";
    for (let i = 0; i < 6; i++) {
      const rise = (state.tick * 0.02 + i / 6) % 1,
        a = (i * Math.PI) / 3 + state.tick * 0.05,
        reach = 44 * (1 - rise * 0.7);
      c.globalAlpha = alpha * (1 - rise * 0.7);
      mote(Math.cos(a) * reach, -6 - rise * 118 + Math.sin(a) * 8, 2 + 2 * (1 - rise), 4 + 5 * (1 - rise));
    }
    c.globalAlpha = alpha;
  }
  if (f.effects.some((e) => e.type === "bind"))
    for (let i = 0; i < 4; i++)
      line(-25, -15 - i * 18, 25, -8 - i * 18, "#d1b281", 3);
  if (f.buffs.some((b) => b.type === "ward")) {
    // Ward: a tall cut frame with a seal stone at its crown and foot.
    c.strokeStyle = c.fillStyle = "#e5ca87";
    c.lineWidth = 2;
    c.beginPath();
    for (const [x, y] of [[0, -138], [32, -118], [32, -12], [0, 8], [-32, -12], [-32, -118], [0, -138]])
      c.lineTo(x, y);
    c.stroke();
    mote(0, -138, 4, 7);
    mote(0, 8, 4, 7);
  }
  for (const effect of f.effects) {
    c.fillStyle =
      { poison: "#b0d879", burn: "#ffb371", slow: "#8dcaeb", stun: "#e9dc90" }[
        effect.type
      ] ?? "#c9a9ec";
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(
        -24 + i * 24,
        -25 - ((state.tick + i * 17) % 65),
        3,
        0,
        Math.PI * 2,
      );
      c.fill();
    }
  }
  c.restore();
  if (state.tick - f.lastHit < 25 && f.lastDamage) {
    c.save();
    c.globalAlpha = 1 - (state.tick - f.lastHit) / 25;
    c.textAlign = "center";
    c.font = "bold 16px system-ui";
    c.fillStyle = f.blockedHit ? "#a4e8ed" : "#ffe0ac";
    c.fillText(
      "−" + f.lastDamage,
      f.x,
      ground - 140 - (state.tick - f.lastHit),
    );
    c.restore();
  }
}
