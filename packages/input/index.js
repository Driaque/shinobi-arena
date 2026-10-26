export const ACTIONS = Object.freeze(['left', 'right', 'jump', 'attack', 'block', 'special1', 'special2']);
export function createInput() {
  const held = new Map();
  return {
    press(action, source) {
      if (!ACTIONS.includes(action)) throw new Error(`Unknown action: ${action}`);
      if (!held.has(action)) held.set(action, new Set());
      held.get(action).add(source);
    },
    release(source) { for (const sources of held.values()) sources.delete(source); },
    reset() { held.clear(); },
    snapshot() { return Object.fromEntries(ACTIONS.map(a => [a, (held.get(a)?.size ?? 0) > 0])); }
  };
}
