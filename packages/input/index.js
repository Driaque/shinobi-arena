export const ACTIONS = Object.freeze(['left', 'right', 'jump', 'attack', 'block', 'special1', 'special2']);
export function createInput() {
  const held = new Map(), pressed = new Set();
  const snapshot = () => Object.fromEntries(ACTIONS.map(a => [a, (held.get(a)?.size ?? 0) > 0]));
  return {
    press(action, source) {
      if (!ACTIONS.includes(action)) throw new Error(`Unknown action: ${action}`);
      if (!held.has(action)) held.set(action, new Set());
      if (!held.get(action).has(source)) pressed.add(action);
      held.get(action).add(source);
    },
    release(source) { for (const sources of held.values()) sources.delete(source); },
    reset() { held.clear(); pressed.clear(); },
    snapshot,
    consume() {
      // Capture even a quick tap released between two simulation ticks.
      const frame = snapshot();
      for (const action of pressed) frame[action] = true;
      pressed.clear();
      return frame;
    }
  };
}
