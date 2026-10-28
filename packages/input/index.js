export const ACTIONS = Object.freeze(['left', 'right', 'jump', 'attack', 'block', 'special1', 'special2', 'weapon', 'bloodline', 'replacement', 'dashForward', 'dashBack', 'awakening','crouch']);
export function createInput() {
  let pendingDash=0;
  const held = new Map(), pressed = new Set(), axes = new Map();
  const snapshot = () => ({...Object.fromEntries(ACTIONS.map(a => [a, (held.get(a)?.size ?? 0) > 0])),moveX: Math.max(-1,Math.min(1,[...axes.values()].reduce((a,b)=>a+b,0)))});
  return {
    press(action, source) {
      if (!ACTIONS.includes(action)) throw new Error(`Unknown action: ${action}`);
      if (!held.has(action)) held.set(action, new Set());
      if (!held.get(action).has(source)) pressed.add(action);
      held.get(action).add(source);
    },
    release(source) { for (const sources of held.values()) sources.delete(source); axes.delete(source); },
    setAxis(source,value) { if(!Number.isFinite(value))throw new Error('Invalid movement axis');axes.set(source,Math.max(-1,Math.min(1,value))); },
    dash(direction){if(direction!==-1&&direction!==1)throw new Error('Invalid dash direction');pendingDash=direction;},
    reset() { pendingDash=0;held.clear(); pressed.clear(); axes.clear(); },
    snapshot,
    consume() {
      // Capture even a quick tap released between two simulation ticks.
      const frame = snapshot();
      for (const action of pressed) frame[action] = true;
      if(pendingDash)frame.dashDirection=pendingDash;pendingDash=0;
      frame.pressedActions=[...pressed];
      pressed.clear();
      return frame;
    }
  };
}


