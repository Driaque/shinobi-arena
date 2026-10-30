import { ARENA, WEAPONS } from "./packages/engine/index.js";

// Compatibility layer for combat cues while Practice actors/scenery use sprites.
// Positions and attack phases come from the same sampled state as the GPU scene.
export function paintPracticeEffects(c, f, state, moves) {
  const m = moves[f.action?.move],
    age = f.action?.age ?? 0,
    active = m && age >= m.startup && age < m.startup + m.active;
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
  if (m && !m.projectile && !m.buff && !m.utility && age >= m.startup - 3) {
    c.save();
    c.globalAlpha *= active ? 0.8 : 0.22;
    c.strokeStyle = m.color ?? "#9fe9da";
    c.lineWidth = m.sword ? 5 : 3;
    c.beginPath();
    c.ellipse(
      30,
      -70,
      Math.min(m.reach ?? 90, 180) * 0.65,
      35,
      m.spike ? -0.6 : 0,
      -1.5,
      1.4,
    );
    c.stroke();
    c.restore();
  }
  if (f.action?.source === "weapon") {
    const color =
      f.buffs.some((b) => b.type === "poisonCoating") || f.action.poison
        ? "#b5e08b"
        : "#e5f4fa";
    if (f.weapon === "fans") {
      c.fillStyle = color;
      for (const x of [24, 65]) {
        c.beginPath();
        c.moveTo(x, -75);
        c.arc(x, -75, 25, -1.3, 0.7);
        c.closePath();
        c.fill();
      }
    } else if (f.weapon === "shuriken") {
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + state.tick * 0.1;
        line(50, -80, 50 + Math.cos(a) * 18, -80 + Math.sin(a) * 18, color, 3);
      }
    } else {
      const length = f.weapon === "kaiken" || f.weapon === "kunai" ? 34 : 82;
      line(22, -70, 22 + length, -85, color, 4);
      line(30, -80, 32, -64, "#e9bd72", 4);
    }
  }
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
  if (f.action?.source === "weapon") {
    c.save();
    c.font = "9px system-ui";
    c.textAlign = "center";
    c.fillStyle = "#dfebee";
    c.fillText(WEAPONS[f.weapon].name, f.x, ground + 18);
    c.restore();
  }
}
