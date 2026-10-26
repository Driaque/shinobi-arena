import { CHARACTERS, WEAPONS, MOVES, validateLoadouts } from './catalog.js';
export { CHARACTERS, WEAPONS, MOVES } from './catalog.js';
export const TICK_RATE = 60;
export const ARENA = Object.freeze({ width: 1280, height: 720, floor: 570, margin: 46 });
export const RULES_VERSION = 'duel-0.4.0';
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
function fighter(id, loadout) {
  const character=CHARACTERS[loadout.character];
  return { id, name: character.name, character: loadout.character, weapon: loadout.weapon, x: id === 0 ? 360 : 920, y: 0, vy: 0,
    hp: 1000, chakra: 100, facing: id === 0 ? 1 : -1, stun: 0, blocking: false,
    jumps: 0, dash: null, dashCooldown: 0, taps: {left:-100,right:-100}, cooldowns: {}, effects: [], buffs: [], invulnerable: 0, replacement: null, action: null, previous: {}, lastHit: -100, blockedHit: false };
}
export function createMatch(loadouts=[{character:'naruto',weapon:'kunai'},{character:'sasuke',weapon:'kunai'}]) {
  const selected=validateLoadouts(loadouts);
  return { version: RULES_VERSION, tick: 0, round: 1, remainingTicks: 90 * TICK_RATE,
    loadouts: selected, fighters: selected.map((l,i)=>fighter(i,l)), wins: [0, 0], status: 'playing', result: null,
    projectiles: [], nextId: 1, events: [] };
}
export function nextRound(state) {
  if (state.status !== 'roundOver') return false;
  state.fighters = state.loadouts.map((l,i)=>fighter(i,l)); state.round++;
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
export function moveFor(f, key) {
  const character=CHARACTERS[f.character];
  return key==='weapon'?WEAPONS[f.weapon].move:key==='attack'?'attack':character[key];
}
function startAction(state, f, key) {
  const move=moveFor(f,key);
  if(!move){state.events.push({type:'unavailable',target:f.id});return;}
  if(f.cooldowns[key]>0){state.events.push({type:'cooldown',target:f.id});return;}
  const config=MOVES[move], spent=advanceResource(f.chakra,config.cost);
  if(!spent.accepted){state.events.push({type:'empty',target:f.id});return;}
  f.chakra=spent.remaining;f.cooldowns[key]=config.cooldown??0;
  f.action={move,age:0,hit:false,fired:false};f.blocking=false;
}
function applyEffect(state,target,hit) {
  if(!hit.effect)return;
  const existing=target.effects.find(e=>e.type===hit.effect);
  if(existing){existing.remaining=Math.max(existing.remaining,hit.duration);existing.potency=Math.max(existing.potency,hit.potency);}
  else target.effects.push({type:hit.effect,remaining:hit.duration,potency:hit.potency,nextTick:state.tick+60});
}
function tickEffects(state,f) {
  for(const effect of f.effects){
    if(effect.type!=='weaken'&&state.tick>=effect.nextTick){
      const damage=effect.potency;f.hp=Math.max(0,f.hp-damage);effect.nextTick+=60;
      state.events.push({type:effect.type,target:f.id,damage});
    }
    effect.remaining--;
  }
  if(f.hp===0){f.action=null;f.dash=null;f.blocking=false;}
  f.effects=f.effects.filter(e=>e.remaining>0);
  f.buffs=f.buffs.map(b=>({...b,remaining:b.remaining-1})).filter(b=>b.remaining>0);
}
function substitute(state,f,other) {
  if(f.cooldowns.replacement>0){state.events.push({type:'cooldown',target:f.id});return;}
  const spent=advanceResource(f.chakra,25);
  if(!spent.accepted){state.events.push({type:'empty',target:f.id});return;}
  f.replacement={x:f.x,y:f.y,remaining:36};f.chakra=spent.remaining;
  const away=f.x<=other.x?-1:1;
  f.x=clamp(f.x+away*170,ARENA.margin,ARENA.width-ARENA.margin);
  f.stun=0;f.action=null;f.dash=null;f.blocking=false;f.invulnerable=18;
  f.cooldowns.replacement=480;state.events.push({type:'replacement',target:f.id});
}
function collectMelee(attacker, target, hits) {
  const action = attacker.action;
  if (!action) return;
  const move = MOVES[action.move];
  if (move.projectile || move.buff || target.invulnerable>0 || action.hit || action.age < move.startup || action.age >= move.startup + move.active) return;
  const ahead = (target.x - attacker.x) * attacker.facing;
  if (ahead >= 0 && ahead <= move.reach && Math.abs(target.y - attacker.y) < 100) {
    action.hit = true;
    hits.push({ attacker: attacker.id, target: target.id, direction: attacker.facing, ...move, move: action.move });
  }
}
export function stepMatch(state, inputs = [{}, {}]) {
  if (state.status !== 'playing') return state;
  state.tick++; state.events = [];
  for(const f of state.fighters)tickEffects(state,f); state.remainingTicks = Math.max(0, state.remainingTicks - 1);
  for (const f of state.fighters) {
    const input = inputs[f.id] ?? {}, other = state.fighters[1 - f.id];
    for(const key of Object.keys(f.cooldowns))f.cooldowns[key]=Math.max(0,f.cooldowns[key]-1);
    f.dashCooldown=Math.max(0,f.dashCooldown-1);f.invulnerable=Math.max(0,f.invulnerable-1);
    if(f.replacement&&--f.replacement.remaining<=0)f.replacement=null;
    if(f.hp>0&&input.replacement&&!f.previous.replacement)substitute(state,f,other);
    const wasStunned = f.stun > 0;
    if (f.stun > 0) f.stun--;
    f.chakra = Math.min(100, f.chakra + 0.035);
    if (f.action) {
      f.action.age++;
      const m = MOVES[f.action.move];
      if (f.action.age >= m.startup + m.active + m.recovery) f.action = null;
    }
    if (!f.action && !f.dash && !wasStunned) f.facing = other.x >= f.x ? 1 : -1;
    f.blocking = Boolean(input.block && f.y === 0 && !f.action && !f.dash && !wasStunned);
    if (f.hp>0 && !f.action && !wasStunned && !f.blocking) {
      let dashDirection=0;
      for(const direction of ['left','right']){
        if(input[direction]&&!f.previous[direction]){
          if(state.tick-f.taps[direction]<=14)dashDirection=direction==='left'?-1:1;
          f.taps[direction]=state.tick;
        }
      }
      if(input.dashForward&&!f.previous.dashForward)dashDirection=f.facing;
      if(input.dashBack&&!f.previous.dashBack)dashDirection=-f.facing;
      if(dashDirection&&f.y===0&&!f.dash&&f.dashCooldown===0){f.dash={direction:dashDirection,remaining:8};f.dashCooldown=24;}

      const digital = Number(Boolean(input.right)) - Number(Boolean(input.left));
      const move = (input.left||input.right)?digital:(Number.isFinite(input.moveX)?clamp(input.moveX,-1,1):0);
      if(!f.dash)f.x += move * (f.y > 0 ? 4.5 : 5);
      if(input.jump&&!f.previous.jump&&f.jumps<2){f.vy=17;f.jumps++;f.dash=null;}
      // One press produces one action; holding a button does not spend chakra repeatedly.
      for (const key of ['bloodline','special1','special2','weapon','attack']) {
        if (!f.dash && input[key] && !f.previous[key]) { startAction(state, f, key); break; }
      }
    }
    if(f.dash){f.x+=f.dash.direction*17;if(--f.dash.remaining<=0)f.dash=null;}
    if (f.action) {
      const a = f.action, m = MOVES[a.move];
      if (m.dash && a.age >= m.startup && a.age < m.startup + m.active) f.x += f.facing * m.dash;
      if(m.buff&&a.age===m.startup&&!a.fired){a.fired=true;f.buffs=[{type:m.buff,remaining:m.duration}];}
      if (m.projectile && a.age === m.startup && !a.fired) {
        a.fired = true;
        state.projectiles.push({ id: state.nextId++, owner: f.id, x: f.x + f.facing * 60,
          y: f.y + 65, direction: f.facing, life: m.life, move: a.move, weak: f.effects.some(e=>e.type==='weaken')?0.7:1, pierce: f.buffs.some(b=>b.type==='byakugan')?1:(m.pierce??0) });
      }
    }
    if (f.y > 0 || f.vy > 0) { f.y += f.vy; f.vy -= 0.9; }
    if (f.y <= 0) { f.y = 0; f.vy = 0; f.jumps=0; }
    f.x = clamp(f.x, ARENA.margin, ARENA.width - ARENA.margin);
    f.previous = { ...input };
  }
  separate(...state.fighters);
  const hits = [];
  collectMelee(state.fighters[0], state.fighters[1], hits);
  collectMelee(state.fighters[1], state.fighters[0], hits);
  for (const p of state.projectiles) {
    p.x += p.direction * MOVES[p.move].speed; p.life--;
    const target = state.fighters[1 - p.owner];
    if (target.invulnerable===0 && Math.abs(p.x - target.x) < 48 && p.y >= target.y && p.y <= target.y + 120) {
      hits.push({ attacker: p.owner, target: target.id, direction: p.direction, ...MOVES[p.move], move: p.move, weak: p.weak, pierce:p.pierce });
      p.life = 0;
    }
  }
  state.projectiles = state.projectiles.filter(p => p.life > 0 && p.x > -50 && p.x < ARENA.width + 50);
  // Freeze block decisions before applying damage so simultaneous actions resolve fairly.
  const resolved = hits.map(h => ({ ...h, blocked: state.fighters[h.target].blocking && state.fighters[h.target].facing === -h.direction }));
  for (const hit of resolved) {
    const target = state.fighters[hit.target];
    const attacker=state.fighters[hit.attacker];
    const weak=hit.weak??(1-(attacker.effects.find(e=>e.type==='weaken')?.potency??0));
    const pierce=hit.pierce??(attacker.buffs.some(b=>b.type==='byakugan')?1:0);
    const base=Math.ceil(hit.damage*weak);
    const damage=hit.blocked?Math.ceil(base*(0.08+0.92*pierce)):base;
    const penetrated=hit.blocked&&pierce>0;
    if(!hit.blocked||pierce>=1)applyEffect(state,target,hit);
    target.hp = Math.max(0, target.hp - damage);
    target.stun = Math.max(target.stun, hit.blocked ? 7 : 18);
    target.x = clamp(target.x + hit.direction * hit.knockback * (hit.blocked ? 0.3 : 1), ARENA.margin, ARENA.width - ARENA.margin);
    target.lastHit = state.tick; target.blockedHit = hit.blocked&&!penetrated;
    if (!hit.blocked||pierce>=1) { target.action = null; target.blocking = false;target.dash=null; }
    state.events.push({ type: penetrated?'pierce':hit.blocked ? 'block' : 'hit', target: target.id, damage, move: hit.move });
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
export function computerInput(state, player=1) {
  const self=state.fighters[player],opponent=state.fighters[1-player];
  const distance=Math.abs(self.x-opponent.x);
  if(self.stun>0&&!self.cooldowns.replacement&&self.chakra>=25)return {replacement:true};
  if(self.stun||self.action||self.dash)return {};
  if(opponent.action&&opponent.action.age>=5&&distance<190)return {block:true};
  const available=key=>{const m=moveFor(self,key);return m&&!self.cooldowns[key]&&self.chakra>=MOVES[m].cost;};
  if(distance>260&&available('special2')&&MOVES[moveFor(self,'special2')].projectile)return {special2:true};
  if(distance>175)return {left:opponent.x<self.x,right:opponent.x>self.x};
  if(state.tick%240<8&&available('bloodline'))return {bloodline:true};
  if(distance>85&&available('special1'))return {special1:true};
  if(distance>75)return {left:opponent.x<self.x,right:opponent.x>self.x};
  if(available('special2')&&state.tick%180<8)return {special2:true};
  return state.tick%48<24?{attack:true}:{};
}

