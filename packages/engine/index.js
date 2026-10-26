export const TICK_RATE = 60;
export const ARENA = Object.freeze({ width: 1280, height: 720, floor: 570, margin: 46 });
export const RULES_VERSION = 'duel-0.2.0';
export const MOVES = Object.freeze({
  attack: { startup: 5, active: 4, recovery: 13, damage: 65, reach: 90, cost: 0, knockback: 24 },
  special1: { startup: 12, active: 9, recovery: 24, damage: 150, reach: 118, cost: 30, knockback: 62, dash: 11 },
  clone: { startup: 16, active: 7, recovery: 24, damage: 120, reach: 210, cost: 35, knockback: 42 },
  fireball: { startup: 17, active: 1, recovery: 28, damage: 110, reach: 0, cost: 25, knockback: 38, projectile: true }
});
export function advanceResource(resource, cost) {
  if (![resource, cost].every(Number.isFinite) || resource < 0 || cost < 0) throw new Error('Invalid resource');
  return resource >= cost ? { accepted: true, remaining: resource - cost } : { accepted: false, remaining: resource };
}
export function outcome({ hp1, hp2, remainingTicks }) {
  if (![hp1, hp2, remainingTicks].every(Number.isFinite) || Math.min(hp1, hp2, remainingTicks) < 0) throw new Error('Invalid state');
  if (hp1 === 0 && hp2 === 0) return 'draw';
  if (hp1 === 0) return 'player2';
  if (hp2 === 0) return 'player1';
  if (remainingTicks === 0) return hp1 === hp2 ? 'draw' : hp1 > hp2 ? 'player1' : 'player2';
  return 'ongoing';
}
function fighter(id) {
  return { id, name: id === 0 ? 'Naruto' : 'Sasuke', x: id === 0 ? 360 : 920, y: 0, vy: 0,
    hp: 1000, chakra: 100, facing: id === 0 ? 1 : -1, stun: 0, blocking: false,
    action: null, previous: {}, lastHit: -100, blockedHit: false };
}
export function createMatch() {
  return { version: RULES_VERSION, tick: 0, round: 1, remainingTicks: 90 * TICK_RATE,
    fighters: [fighter(0), fighter(1)], wins: [0, 0], status: 'playing', result: null,
    projectiles: [], nextId: 1, events: [] };
}
export function nextRound(state) {
  if (state.status !== 'roundOver') return false;
  state.fighters = [fighter(0), fighter(1)]; state.round++;
  state.remainingTicks = 90 * TICK_RATE; state.status = 'playing'; state.result = null;
  state.projectiles = []; state.events = [];
  return true;
}
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
function separate(a, b) {
  if (Math.abs(a.y - b.y) >= 110 || Math.abs(a.x - b.x) >= 52) return;
  const direction = a.x <= b.x ? 1 : -1;
  const overlap = (52 - Math.abs(a.x - b.x)) / 2;
  a.x = clamp(a.x - direction * overlap, ARENA.margin, ARENA.width - ARENA.margin);
  b.x = clamp(b.x + direction * overlap, ARENA.margin, ARENA.width - ARENA.margin);
  // Transfer any unresolved overlap at an arena edge to the other fighter.
  const left = a.x <= b.x ? a : b, right = left === a ? b : a;
  if (right.x - left.x < 52) {
    if (left.x === ARENA.margin) right.x = left.x + 52;
    else left.x = right.x - 52;
  }
}
function startAction(state, f, key) {
  const move = key === 'special2' ? (f.id === 0 ? 'clone' : 'fireball') : key;
  const spent = advanceResource(f.chakra, MOVES[move].cost);
  if (!spent.accepted) { state.events.push({ type: 'empty', target: f.id }); return; }
  f.chakra = spent.remaining;
  f.action = { move, age: 0, hit: false, fired: false };
  f.blocking = false;
}
function collectMelee(attacker, target, hits) {
  const action = attacker.action;
  if (!action) return;
  const move = MOVES[action.move];
  if (move.projectile || action.hit || action.age < move.startup || action.age >= move.startup + move.active) return;
  const ahead = (target.x - attacker.x) * attacker.facing;
  if (ahead >= 0 && ahead <= move.reach && Math.abs(target.y - attacker.y) < 100) {
    action.hit = true;
    hits.push({ attacker: attacker.id, target: target.id, direction: attacker.facing, ...move, move: action.move });
  }
}
export function stepMatch(state, inputs = [{}, {}]) {
  if (state.status !== 'playing') return state;
  state.tick++; state.events = []; state.remainingTicks = Math.max(0, state.remainingTicks - 1);
  for (const f of state.fighters) {
    const input = inputs[f.id] ?? {}, other = state.fighters[1 - f.id];
    const wasStunned = f.stun > 0;
    if (f.stun > 0) f.stun--;
    f.chakra = Math.min(100, f.chakra + 0.035);
    if (f.action) {
      f.action.age++;
      const m = MOVES[f.action.move];
      if (f.action.age >= m.startup + m.active + m.recovery) f.action = null;
    }
    if (!f.action && !wasStunned) f.facing = other.x >= f.x ? 1 : -1;
    f.blocking = Boolean(input.block && f.y === 0 && !f.action && !wasStunned);
    if (!f.action && !wasStunned && !f.blocking) {
      const move = Number(Boolean(input.right)) - Number(Boolean(input.left));
      f.x += move * (f.y > 0 ? 4.5 : 5);
      if (input.jump && !f.previous.jump && f.y === 0) f.vy = 17;
      // One press produces one action; holding a button does not spend chakra repeatedly.
      for (const key of ['special1', 'special2', 'attack']) {
        if (input[key] && !f.previous[key]) { startAction(state, f, key); break; }
      }
    }
    if (f.action) {
      const a = f.action, m = MOVES[a.move];
      if (m.dash && a.age >= m.startup && a.age < m.startup + m.active) f.x += f.facing * m.dash;
      if (m.projectile && a.age === m.startup && !a.fired) {
        a.fired = true;
        state.projectiles.push({ id: state.nextId++, owner: f.id, x: f.x + f.facing * 60,
          y: f.y + 65, direction: f.facing, life: 100 });
      }
    }
    if (f.y > 0 || f.vy > 0) { f.y += f.vy; f.vy -= 0.9; }
    if (f.y <= 0) { f.y = 0; f.vy = 0; }
    f.x = clamp(f.x, ARENA.margin, ARENA.width - ARENA.margin);
    f.previous = { ...input };
  }
  separate(...state.fighters);
  const hits = [];
  collectMelee(state.fighters[0], state.fighters[1], hits);
  collectMelee(state.fighters[1], state.fighters[0], hits);
  for (const p of state.projectiles) {
    p.x += p.direction * 12; p.life--;
    const target = state.fighters[1 - p.owner];
    if (Math.abs(p.x - target.x) < 48 && p.y >= target.y && p.y <= target.y + 120) {
      hits.push({ attacker: p.owner, target: target.id, direction: p.direction, ...MOVES.fireball, move: 'fireball' });
      p.life = 0;
    }
  }
  state.projectiles = state.projectiles.filter(p => p.life > 0 && p.x > -50 && p.x < ARENA.width + 50);
  // Freeze block decisions before applying damage so simultaneous actions resolve fairly.
  const resolved = hits.map(h => ({ ...h, blocked: state.fighters[h.target].blocking && state.fighters[h.target].facing === -h.direction }));
  for (const hit of resolved) {
    const target = state.fighters[hit.target];
    const damage = hit.blocked ? Math.ceil(hit.damage * 0.08) : hit.damage;
    target.hp = Math.max(0, target.hp - damage);
    target.stun = Math.max(target.stun, hit.blocked ? 7 : 18);
    target.x = clamp(target.x + hit.direction * hit.knockback * (hit.blocked ? 0.3 : 1), ARENA.margin, ARENA.width - ARENA.margin);
    target.lastHit = state.tick; target.blockedHit = hit.blocked;
    if (!hit.blocked) { target.action = null; target.blocking = false; }
    state.events.push({ type: hit.blocked ? 'block' : 'hit', target: target.id, damage, move: hit.move });
  }
  separate(...state.fighters);
  const result = outcome({ hp1: state.fighters[0].hp, hp2: state.fighters[1].hp, remainingTicks: state.remainingTicks });
  if (result !== 'ongoing') {
    state.result = result;
    if (result !== 'draw') state.wins[result === 'player1' ? 0 : 1]++;
    state.status = state.wins.some(w => w >= 2) ? 'matchOver' : 'roundOver';
    state.events.push({ type: 'roundEnd', result });
  }
  return state;
}
export function computerInput(state, player = 1) {
  const self = state.fighters[player], opponent = state.fighters[1 - player];
  const distance = Math.abs(self.x - opponent.x);
  if (self.stun || self.action) return {};
  // Deliberately simple, deterministic baseline. Decision sampled by the caller every 8 ticks.
  if (opponent.action && opponent.action.age >= 5 && distance < 190) return { block: true };
  if (distance > 260 && self.chakra >= 25 && player === 1) return { special2: true };
  if (distance > 175) return { left: opponent.x < self.x, right: opponent.x > self.x };
  if (distance > 85 && self.chakra >= 30) return { special1: true };
  if (distance > 75) return { left: opponent.x < self.x, right: opponent.x > self.x };
  return state.tick % 48 < 24 ? { attack: true } : {};
}
