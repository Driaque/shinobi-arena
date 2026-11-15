// Impact pause ("hitstop") for locally stepped fights. Timing only: the loop
// waits before its next engine step, so rules, replays and online play are unchanged.
const PAUSE = { block: 26, pierce: 70, punish: 95, guardBreak: 130 };
export const KO_HOLD_MS = 480;

export function impactPauseMs(events = []) {
  let ms = 0;
  for (const e of events) {
    if (e.type === "roundEnd") { if (e.result !== "draw") ms = Math.max(ms, KO_HOLD_MS); }
    else if (e.type === "airFinish") ms = Math.max(ms, 110);
    else if (e.type === "parry") ms = Math.max(ms, 90);
    // Field and status ticks stay fluid; heavier blows hold longer.
    else if (e.type === "hit") ms = Math.max(ms, Math.min(115, 30 + (e.damage ?? 0) * 0.9));
    else if (PAUSE[e.type] && e.move) ms = Math.max(ms, PAUSE[e.type] + Math.min(40, (e.damage ?? 0) * 0.4));
  }
  return Math.round(ms);
}
