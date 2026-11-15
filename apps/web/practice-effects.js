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
  if (f.charging)
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + state.tick * 0.04;
      c.fillStyle = "#8ce6ee";
      c.beginPath();
      c.arc(Math.cos(a) * 35, -62 + Math.sin(a) * 55, 3, 0, Math.PI * 2);
      c.fill();
    }
  if (f.effects.some((e) => e.type === "bind"))
    for (let i = 0; i < 4; i++)
      line(-25, -15 - i * 18, 25, -8 - i * 18, "#d1b281", 3);
  if (f.buffs.some((b) => b.type === "ward")) {
    c.strokeStyle = "#e5ca87";
    c.lineWidth = 2;
    c.strokeRect(-28, -126, 56, 126);
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
