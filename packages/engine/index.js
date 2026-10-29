import {JUTSU_KEYS,moveEnvironment} from './techniques.js';
import {difficultyFor} from './difficulty.js';
export {DIFFICULTIES,difficultyFor} from './difficulty.js';
import { CHARACTERS, WEAPONS, MOVES, AWAKENINGS, ITEMS, JUTSUS, defaultJutsus, canEquipJutsu, validateLoadout, validateLoadouts } from './catalog.js';
export { CHARACTERS, WEAPONS, MOVES, AWAKENINGS, ITEMS, JUTSUS, defaultJutsus, canEquipJutsu, validateLoadout } from './catalog.js';
export const TICK_RATE = 60;
export const ARENA = Object.freeze({ width: 1280, height: 720, floor: 570, margin: 46 });
export const RULES_VERSION = 'duel-0.16.0';
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
  return { id, name: character.name, character: loadout.character, jutsus:[...loadout.jutsus],charging:false, weapon: loadout.weapon, weapons:[...loadout.weapons],weaponSlot:0,items:loadout.items.map(id=>({id,count:id?1:0})),itemSlot:0,raijinMark:null, x: id === 0 ? 360 : 920, y: 0, vy: 0, vx:0, airAttacks:0, juggleHits:0, airTech:false, landingRecovery:0, landedAt:-100,
    hp: 1000, chakra: 100, stamina:100, guard:100, actionsStarted:0, lastActionEnd:-1000, lastExertion:-100, lastGuardHit:-100, guardStart:-100, parryCooldown:0, airDashUsed:false, jumpBuffer:0, dashBuffer:null, damageTaken:0, awakeningTicks:0, awakeningUsed:false, awakeningFlash:0, buffer:null, combo:{hits:0,damage:0,lastTick:-100,target:null}, facing: id === 0 ? 1 : -1, stun: 0, blocking: false, crouching:false,
    jumps: 0, dash: null, dashCooldown: 0, taps: {left:-100,right:-100}, cooldowns: {}, effects: [], buffs: [], invulnerable: 0, replacement: null, action: null, previous: {}, lastHit: -100, blockedHit: false };
}
export function createMatch(loadouts=[{character:'naruto',weapon:'kunai'},{character:'sasuke',weapon:'kunai'}],{difficulty='easy'}={}) {
  const selected=validateLoadouts(loadouts);
  return { version: RULES_VERSION, difficulty:difficultyFor(difficulty).id, tick: 0, round: 1, remainingTicks: 90 * TICK_RATE,
    loadouts: selected, fighters: selected.map((l,i)=>fighter(i,l)), wins: [0, 0], status: 'playing', result: null,
    zones:[],projectiles: [], nextId: 1, events: [] };
}
export function nextRound(state) {
  if (state.status !== 'roundOver') return false;
  state.fighters = state.loadouts.map((l,i)=>fighter(i,l)); state.round++;
  state.remainingTicks = 90 * TICK_RATE; state.status = 'playing'; state.result = null;
  state.zones=[];state.projectiles = []; state.events = [];
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
  if(key==='swapWeapon')return f.weapons?.[1]?'swapWeapon':null;
  if(key==='useItem'){const slot=f.items?.[f.itemSlot];return slot?.id==='raijinKunai'&&f.raijinMark?.slot===f.itemSlot?'raijinWarp':slot?.count?ITEMS[slot.id].move:null;}
  const character=CHARACTERS[f.character];
  if(JUTSU_KEYS.includes(key)){
    const selected=(f.jutsus??defaultJutsus(f.character))[JUTSU_KEYS.indexOf(key)];
    if(!selected)return null;
    const native=['special1','special2','bloodline'].find(k=>character[k]===selected);
    return (native&&activeAwakening(f)?.overrides[native])||selected;
  }
  return key==='weapon'?WEAPONS[f.weapon].move:key==='attack'?((f.y>0||f.vy>0)?'airAttack1':character.basicChain?.[0]??'attack'):null;
}
const fresh=(input,f,key)=>Boolean(input[key]&&(!f.previous[key]||input.pressedActions?.includes(key)));
export function staminaCost(key,chain=0){return key==='attack'?(chain===3?16:12):key==='weapon'?16:key==='useItem'?8:0;}
function startAction(state, f, key, override=null, chain=0) {
  const move=override??moveFor(f,key);
  if(!move){state.events.push({type:'unavailable',target:f.id});return false;}
  if(f.cooldowns[key]>0){state.events.push({type:'cooldown',target:f.id});return false;}
  const effort=staminaCost(key,chain),energy=advanceResource(f.stamina,effort);
  if(!energy.accepted){state.events.push({type:'exhausted',target:f.id});return false;}
  const config=MOVES[move],air=f.y>0||f.vy>0,environment=moveEnvironment(config);
  if((environment==='air'&&!air)||(environment==='ground'&&air)||f.airTech||f.landingRecovery>0||(air&&f.airAttacks>=4)){state.events.push({type:'aerialBlocked',target:f.id,reason:air?'LAND TO RESET / GROUNDED TECHNIQUE':'JUMP TO USE AERIAL TECHNIQUE'});return false;}
  const spent=advanceResource(f.chakra,config.cost);
  if(!spent.accepted){state.events.push({type:'empty',target:f.id});return false;}
  if(air)f.airAttacks++;
  f.stamina=energy.remaining;if(effort)f.lastExertion=state.tick;
  f.chakra=spent.remaining;f.cooldowns[key]=config.cooldown??0;
  if(chain<2)f.actionsStarted++;
  if(key==='useItem'&&move!=='raijinWarp')f.items[f.itemSlot].count--;
  const poison=key==='weapon'&&f.buffs.some(b=>b.type==='poisonCoating');if(poison)f.buffs=f.buffs.filter(b=>b.type!=='poisonCoating');
  f.action={source:key,itemSlot:f.itemSlot,poison,move,age:0,hit:false,confirmed:false,fired:false,recoveryPenalty:0,chain:chain||(key==='attack'?1:0)};f.blocking=false;f.crouching=false;return true;
}
export function awakeningFor(f) {return AWAKENINGS[CHARACTERS[f.character].awakening]??null;}
export function activeAwakening(f) {return f.awakeningTicks>0?awakeningFor(f):null;}
export function awakeningReady(f) {const form=awakeningFor(f);return Boolean(form&&!f.awakeningUsed&&f.hp>0&&f.damageTaken>=form.threshold);}
function receiveDamage(state,f,amount) {
  const loss=Math.min(Math.max(0,f.hp-(state.training?1:0)),Math.max(0,Math.ceil(amount*(activeAwakening(f)?.defence??1)*(f.buffs.some(b=>b.type==='ward')?.75:1))));
  f.hp-=loss;f.damageTaken+=loss;return loss;
}
function awaken(state,f) {
  if(!awakeningReady(f)||f.stun>0||f.action||f.dash){state.events.push({type:'awakeningBlocked',target:f.id});return;}
  const form=awakeningFor(f);f.awakeningTicks=form.duration;f.awakeningUsed=true;f.awakeningFlash=30;
  state.events.push({type:'awakening',target:f.id,name:form.name});
}
function clearCombo(f) {f.combo={hits:0,damage:0,lastTick:-100,target:null};}
function applyEffect(state,target,hit) {
  if(!hit.effect)return;
  const existing=target.effects.find(e=>e.type===hit.effect);
  if(existing){existing.remaining=Math.max(existing.remaining,hit.duration);existing.potency=Math.max(existing.potency,hit.potency);}
  else target.effects.push({type:hit.effect,remaining:hit.duration,potency:hit.potency,nextTick:state.tick+60});
}
function tickEffects(state,f) {
  for(const effect of f.effects){
    if(['poison','burn','poisonslow','bleed'].includes(effect.type)&&state.tick>=effect.nextTick){
      const damage=receiveDamage(state,f,effect.potency);effect.nextTick+=60;
      state.events.push({type:effect.type,target:f.id,damage});
    }
    effect.remaining--;
  }
  if(f.hp===0){f.action=null;f.dash=null;f.blocking=false;}
  f.effects=f.effects.filter(e=>e.remaining>0);
  f.buffs=f.buffs.map(b=>({...b,remaining:b.remaining-1})).filter(b=>b.remaining>0);
}
function substitute(state,f,other) {
  if(f.cooldowns.replacement>0){state.events.push({type:'cooldown',target:f.id});return false;}
  const spent=advanceResource(f.chakra,25);
  if(!spent.accepted){state.events.push({type:'empty',target:f.id});return false;}
  f.replacement={x:f.x,y:f.y,remaining:36};f.chakra=spent.remaining;
  const away=f.x<=other.x?-1:1;
  f.x=clamp(f.x+away*170,ARENA.margin,ARENA.width-ARENA.margin);
  f.stun=0;f.action=null;f.buffer=null;f.dash=null;f.jumpBuffer=0;f.dashBuffer=null;f.blocking=false;f.invulnerable=18;
  clearCombo(other);
  f.cooldowns.replacement=480;state.events.push({type:'replacement',target:f.id});
}
function collectMelee(attacker, target, hits) {
  const action = attacker.action;
  if (!action) return;
  const move = MOVES[action.move];
  if (move.projectile || move.buff || move.utility || move.inventoryEffect || (target.invulnerable>0||target.airTech&&target.y>0) || action.hit || action.age < move.startup || action.age >= move.startup + move.active) return;
  const ahead = (target.x - attacker.x) * attacker.facing;
  if (ahead >= 0 && ahead <= move.reach && Math.abs(target.y - attacker.y) < 100) {
    action.hit = true;
    hits.push({ attacker: attacker.id, target: target.id, direction: attacker.facing,poison:action.poison, ...move, move: action.move });
  }
}
export function stepMatch(state, inputs = [{}, {}]) {
  if (state.status !== 'playing') return state;
  state.tick++; state.events = [];
  state.zones=state.zones.map(z=>({...z,remaining:z.remaining-1})).filter(z=>z.remaining>0);
  for(const f of state.fighters)tickEffects(state,f); if(!state.training)state.remainingTicks = Math.max(0, state.remainingTicks - 1);
  for (const f of state.fighters) {
    const input = inputs[f.id] ?? {}, other = state.fighters[1 - f.id];
    if(f.raijinMark&&--f.raijinMark.remaining<=0)f.raijinMark=null;
    if(fresh(input,f,'cycleItem')){
      for(let i=1;i<=4;i++){const next=(f.itemSlot+i)%4;if(f.items[next].count||f.raijinMark?.slot===next){f.itemSlot=next;break;}}
    }
    if(input.dashDirection===-1||input.dashDirection===1)f.dashBuffer={direction:input.dashDirection,expires:state.tick+8};
    if(fresh(input,f,'jump'))f.jumpBuffer=state.tick+8;
    for(const direction of ['left','right'])if(fresh(input,f,direction)){
      if(state.tick-f.taps[direction]<=14)f.dashBuffer={direction:direction==='left'?-1:1,expires:state.tick+8};
      f.taps[direction]=state.tick;
    }
    if(fresh(input,f,'dashForward'))f.dashBuffer={relative:1,expires:state.tick+8};
    if(fresh(input,f,'dashBack'))f.dashBuffer={relative:-1,expires:state.tick+8};
    if(f.dashBuffer&&f.dashBuffer.expires<state.tick)f.dashBuffer=null;
    if(f.landingRecovery>0)f.landingRecovery--;
    if(f.parryCooldown>0)f.parryCooldown--;
    if(state.tick-f.lastExertion>45&&!f.action&&!f.dash)f.stamina=Math.min(100,f.stamina+.5);
    if(state.tick-f.lastGuardHit>90&&!f.blocking)f.guard=Math.min(100,f.guard+.6);
    if(f.awakeningTicks>0)f.awakeningTicks--;
    if(f.awakeningFlash>0)f.awakeningFlash--;
    if(f.buffer&&state.tick>f.buffer.expires)f.buffer=null;
    for(const key of ['useItem','swapWeapon',...JUTSU_KEYS,'weapon','attack']){
      if(fresh(input,f,key)){f.buffer={key,expires:state.tick+10};break;}
    }
    if(fresh(input,f,'awakening'))awaken(state,f);
    for(const key of Object.keys(f.cooldowns))f.cooldowns[key]=Math.max(0,f.cooldowns[key]-1);
    f.dashCooldown=Math.max(0,f.dashCooldown-1);f.invulnerable=Math.max(0,f.invulnerable-1);
    if(f.replacement&&--f.replacement.remaining<=0)f.replacement=null;
    if(f.hp>0&&fresh(input,f,'replacement'))substitute(state,f,other);
    const bound=f.effects.some(e=>e.type==='bind');
    const slow=f.effects.some(e=>e.type==='poisonslow')?.6:1-(f.effects.find(e=>e.type==='slow')?.potency??0);
    const mobility=bound?0:slow*(f.buffs.some(b=>b.type==='haste')?1.15:1);
    f.charging=Boolean(input.charge&&f.hp>0&&f.y===0&&!f.stun&&!f.action&&!f.dash&&!bound&&!f.buffer&&!input.left&&!input.right&&!input.moveX&&!input.jump&&!input.block&&f.chakra<100&&f.stamina>=.2);
    if(f.charging){f.chakra=Math.min(100,f.chakra+.3);f.stamina=Math.max(0,f.stamina-.2);f.lastExertion=state.tick;}
    const wasStunned = f.stun > 0;
    if (f.stun > 0) f.stun--;
    f.chakra = Math.min(100, f.chakra + (activeAwakening(f)?.regen??0.035));
    if (f.action) {
      f.action.age+=f.action.chain>0?(activeAwakening(f)?.chainSpeed??1):1;
      const m = MOVES[f.action.move];
      if(f.action.age>=m.startup+m.active&&!f.action.hit&&!m.projectile&&!m.buff&&!m.utility&&!m.inventoryEffect)f.action.recoveryPenalty=12;
      if (f.action.age >= m.startup + m.active + m.recovery + (f.action.recoveryPenalty??0)) {
        if(!f.action.confirmed&&!m.buff&&!m.inventoryEffect)clearCombo(f);
        f.action = null;f.lastActionEnd=state.tick;
      }
      // A confirmed launcher can spend the normal jump budget to chase; whiffs cannot.
      if(f.action?.confirmed&&m.launch&&f.jumpBuffer>=state.tick&&!wasStunned&&!bound&&f.jumps<2){f.action=null;f.vy=Math.min(17,Math.max(12,other.vy+3));f.jumps++;f.jumpBuffer=0;state.events.push({type:'airChase',target:f.id});}
      if(f.action?.confirmed&&!wasStunned&&f.action.chain>0&&f.action.age>=m.startup+m.active&&f.buffer){
        const key=f.buffer.key,chain=f.action.chain;
        if(key==='attack'&&chain<3){startAction(state,f,key,(f.y>0||f.vy>0)?(chain===1?'airAttack2':'airAttack3'):CHARACTERS[f.character].basicChain?.[chain]??(chain===1?'attack2':'attack3'),chain+1);f.buffer=null;}
        else if(['weapon',...JUTSU_KEYS].includes(key)){startAction(state,f,key);f.buffer=null;}
      }
    }
    if(f.action?.confirmed&&f.y>0&&MOVES[f.action.move].airCombo&&f.action.chain===0&&!wasStunned&&f.action.age>=MOVES[f.action.move].startup+MOVES[f.action.move].active&&f.buffer&&JUTSU_KEYS.includes(f.buffer.key)){const key=f.buffer.key;if(moveFor(f,key)!==f.action.move)startAction(state,f,key);f.buffer=null;}
    if (!f.action && !f.dash && !wasStunned) f.facing = other.x >= f.x ? 1 : -1;
    if(fresh(input,f,'block')&&!f.parryCooldown&&!f.stun&&!f.action&&!f.dash&&f.y===0)f.guardStart=state.tick;
    f.crouching=Boolean(input.crouch&&f.y===0&&!f.action&&!f.dash&&!wasStunned&&f.jumpBuffer<state.tick);
    f.blocking = Boolean(input.block && f.y === 0 && !f.action && !f.dash && !wasStunned);
    if (f.hp>0 && !f.action && !wasStunned && !f.blocking) {
      // A jump can cancel a dash. A ground jump and air dash can share a tick.
      if(!bound&&!f.charging&&f.jumpBuffer>=state.tick&&f.jumps<2){f.vy=17;f.jumps++;f.dash=null;f.jumpBuffer=0;}
      if(!bound&&!f.charging&&f.dashBuffer&&!f.dash&&f.dashCooldown===0&&(!(f.y>0||f.vy>0)||!f.airDashUsed)){
        if(f.stamina>=18){
          const direction=f.dashBuffer.direction??f.dashBuffer.relative*f.facing;
          const air=f.y>0||f.vy>0;f.dash={direction,remaining:8,air};f.crouching=false;f.dashCooldown=24;
          f.stamina-=18;f.lastExertion=state.tick;if(air)f.airDashUsed=true;
        }else state.events.push({type:'exhausted',target:f.id});
        f.dashBuffer=null;
      }

      const digital = Number(Boolean(input.right)) - Number(Boolean(input.left));
      const move = (input.left||input.right)?digital:(Number.isFinite(input.moveX)?clamp(input.moveX,-1,1):0);
      if(!f.dash&&!f.crouching&&!f.charging){const target=mobility*move*(f.y>0?4.5:5)*(activeAwakening(f)?.speed??1);f.vx=f.y>0?f.vx+(target-f.vx)*.35:target;f.x+=f.vx;}
      // Fresh presses are buffered briefly; confirms can cancel recovery into follow-ups.
      if(!f.dash&&f.buffer){const key=f.buffer.key;f.buffer=null;startAction(state,f,key);}
    }
    if(f.dash){f.x+=mobility*f.dash.direction*17*(activeAwakening(f)?.speed??1);if(--f.dash.remaining<=0)f.dash=null;}
    if (f.action) {
      const a = f.action, m = MOVES[a.move];
      if(m.dive&&f.y>0&&a.age>=m.startup)f.vy=Math.min(f.vy,-m.dive);
      if (!bound && m.dash && a.age >= m.startup && a.age < m.startup + m.active) f.x += mobility * f.facing * m.dash;
      if(m.inventoryEffect&&a.age>=m.startup&&!a.fired){
        a.fired=true;
        if(m.inventoryEffect==='swap'){f.weaponSlot=1-f.weaponSlot;f.weapon=f.weapons[f.weaponSlot];state.events.push({type:'weaponSwap',target:f.id});}
        if(m.inventoryEffect==='poison')f.buffs=[...f.buffs.filter(b=>b.type!=='poisonCoating'),{type:'poisonCoating',remaining:360}];
        if(m.inventoryEffect==='smoke')state.zones.push({kind:'smoke',owner:f.id,x:f.x,y:f.y+65,radius:125,remaining:180});
        if(m.inventoryEffect==='warp'&&f.raijinMark){f.x=clamp(f.raijinMark.x,ARENA.margin,ARENA.width-ARENA.margin);f.y=0;f.vy=0;f.jumps=0;f.airDashUsed=false;f.raijinMark=null;state.events.push({type:'raijinWarp',target:f.id});}
      }
      if(m.utility&&a.age>=m.startup&&!a.fired){
        a.fired=true;
        if(m.ground){state.zones=state.zones.filter(z=>z.kind!=='elemental'||z.owner!==f.id||z.move!==a.move);state.zones.push({kind:'elemental',owner:f.id,move:a.move,x:clamp(f.x+f.facing*180,ARENA.margin,ARENA.width-ARENA.margin),y:0,radius:m.ground.radius,remaining:m.ground.duration,nextTick:state.tick+1,power:activeAwakening(f)?.damage??1});const owned=state.zones.filter(z=>z.kind==='elemental'&&z.owner===f.id);if(owned.length>2)state.zones.splice(state.zones.indexOf(owned[0]),1);}
        if(m.selfHeal){const healed=Math.min(1000-f.hp,m.selfHeal);f.hp+=healed;state.events.push({type:'heal',target:f.id,healed});}
        if(m.cleanse){f.effects=[];state.events.push({type:'cleanse',target:f.id});}
      }
      if(m.buff&&a.age===m.startup&&!a.fired){a.fired=true;f.buffs=[...f.buffs.filter(b=>b.type!==m.buff),{type:m.buff,remaining:m.duration}];}
      if (m.projectile && a.age === m.startup && !a.fired) {
        a.fired = true;
        for(const offset of m.fan?[-24,0,24]:[0])state.projectiles.push({poison:a.poison,itemSlot:a.itemSlot, id: state.nextId++, owner: f.id, x: f.x + f.facing * 60,
          y: f.y + 65+offset, direction: f.facing, life: m.life, move: a.move, power:activeAwakening(f)?.damage??1, weak: 1-(f.effects.find(e=>e.type==='weaken')?.potency??0), pierce: f.buffs.some(b=>b.type==='byakugan')?1:(m.pierce??0) });
      }
    }
    const wasAir=f.y>0||f.vy>0;
    if (f.y > 0 || f.vy > 0) { f.y += f.vy; f.vy -= 0.9; }
    if (f.y <= 0) {if(wasAir){f.landedAt=state.tick;state.events.push({type:'land',target:f.id});if(f.action&&moveEnvironment(MOVES[f.action.move])==='air'){f.action=null;f.lastActionEnd=state.tick;f.landingRecovery=6;}} f.y = 0; f.vy = 0; f.jumps=0;f.airDashUsed=false;f.airAttacks=0;f.juggleHits=0;f.airTech=false; }
    f.x = clamp(f.x, ARENA.margin, ARENA.width - ARENA.margin);
    f.previous = { ...input };
  }
  separate(...state.fighters);
  const hits = [];
  for(const z of state.zones){
    if(z.kind!=='elemental'||state.tick<z.nextTick)continue;z.nextTick=state.tick+60;
    const target=state.fighters[1-z.owner],m=MOVES[z.move];
    if(target.hp>0&&target.y<35&&target.invulnerable===0&&!(target.airTech&&target.y>0)&&Math.abs(target.x-z.x)<=z.radius)hits.push({attacker:z.owner,target:target.id,direction:target.x>=state.fighters[z.owner].x?1:-1,move:z.move,damage:12,power:z.power,knockback:0,cost:0,hitstun:0,effect:m.ground.effect,duration:m.ground.effect==='bind'?24:90,potency:m.ground.potency,zoneTick:true});
  }
  collectMelee(state.fighters[0], state.fighters[1], hits);
  collectMelee(state.fighters[1], state.fighters[0], hits);
  for (const p of state.projectiles) {
    const move=MOVES[p.move];p.x+=p.direction*move.speed;p.life--;
    const target=state.fighters[1-p.owner],owner=state.fighters[p.owner];
    const cloud=state.zones.find(z=>z.kind==='smoke'&&z.owner!==p.owner&&Math.hypot(p.x-z.x,p.y-z.y)<z.radius);
    if(cloud&&!move.blast){p.life=0;state.events.push({type:'smokeBlocked',target:cloud.owner});continue;}
    const absorbing=target.buffs.some(b=>b.type==='absorb')&&target.blocking&&target.facing===-p.direction&&target.invulnerable===0;
    if(absorbing&&!move.blast&&(p.pierce??0)<1&&Math.abs(p.x-target.x)<48&&p.y>=target.y&&p.y<=target.y+120){target.chakra=Math.min(100,target.chakra+12);p.life=0;state.events.push({type:'absorb',target:target.id});continue;}
    let hit=false;
    if(move.blast){
      if(p.life<=0){state.zones.push({kind:'blast',x:p.x,y:p.y,radius:move.blast,remaining:15,owner:p.owner});hit=target.invulnerable===0&&!(target.airTech&&target.y>0)&&Math.hypot(p.x-target.x,p.y-(target.y+60))<=move.blast;}
    }else hit=target.invulnerable===0&&!(target.airTech&&target.y>0)&&Math.abs(p.x-target.x)<48&&p.y>=target.y&&p.y<=target.y+(target.crouching?76:120);
    if(hit){hits.push({attacker:p.owner,target:target.id,direction:p.direction,...move,move:p.move,weak:p.weak,power:p.power,pierce:p.pierce,poison:p.poison});p.life=0;}
    if(move.mark&&(hit||p.life<=0||p.x<0||p.x>ARENA.width)){owner.raijinMark={x:clamp(p.x,ARENA.margin,ARENA.width-ARENA.margin),remaining:300,slot:p.itemSlot};p.life=0;}
  }
  state.projectiles = state.projectiles.filter(p => p.life > 0 && p.x > -50 && p.x < ARENA.width + 50);
  // Freeze block decisions before applying damage so simultaneous actions resolve fairly.
  const resolved = hits.map(h => ({ ...h, punish:Boolean(state.fighters[h.target].charging||(state.fighters[h.target].action&&state.fighters[h.target].action.age>=MOVES[state.fighters[h.target].action.move].startup+MOVES[state.fighters[h.target].action.move].active)), targetStunned:state.fighters[h.target].stun>0, blocked: state.fighters[h.target].blocking && state.fighters[h.target].facing === -h.direction }));
  for (const hit of resolved) {
    const target = state.fighters[hit.target];
    const attacker=state.fighters[hit.attacker];
    if(target.airTech&&target.y>0&&!hit.zoneTick)continue;
    const weak=hit.weak??(1-(attacker.effects.find(e=>e.type==='weaken')?.potency??0));
    const pierce=hit.pierce??(attacker.buffs.some(b=>b.type==='byakugan')?1:0);
    const parried=!hit.zoneTick&&hit.blocked&&pierce<1&&state.tick-target.guardStart<5&&target.parryCooldown===0;
    if(parried){
      target.parryCooldown=60;target.guard=Math.max(0,target.guard-6);target.lastGuardHit=state.tick;
      attacker.stun=Math.max(attacker.stun,24);attacker.action=null;attacker.lastActionEnd=state.tick;attacker.dash=null;attacker.buffer=null;clearCombo(attacker);
      state.events.push({type:'parry',target:target.id});continue;
    }
    const continuing=attacker.combo.hits>0&&attacker.combo.target===target.id&&hit.targetStunned&&state.tick-attacker.combo.lastTick<=30;
    const scaling=continuing?Math.max(.55,1-attacker.combo.hits*.1):1;
    const counter=(hit.sword||hit.fanStrike)&&attacker.buffs.some(b=>b.type==='counter')?1.35:1;
    const lightning=hit.element==='lightning'&&attacker.buffs.some(b=>b.type==='shinrai')?1.15:1;
    const vulnerable=hit.element==='metal'?1+(target.effects.find(e=>e.type==='metalVulnerable')?.potency??0):1;
    const base=Math.ceil(hit.damage*weak*(hit.power??activeAwakening(attacker)?.damage??1)*scaling*counter*lightning*vulnerable*(hit.punish?1.2:1));
    if(hit.sword||hit.fanStrike)attacker.buffs=attacker.buffs.filter(b=>b.type!=='counter');
    let guardBroken=false;
    if(hit.blocked&&pierce<1){
      target.lastGuardHit=state.tick;target.guard=Math.max(0,target.guard-(hit.cost>0?42:hit.move===WEAPONS[attacker.weapon].move?36:22));
      if(target.guard===0){guardBroken=true;hit.blocked=false;target.guard=35;target.guardStart=-100;state.events.push({type:'guardBreak',target:target.id});}
      else if(attacker.action)attacker.action.recoveryPenalty=12;
    }
    const rawDamage=hit.blocked?Math.ceil(base*(0.08+0.92*pierce)):base;
    const penetrated=hit.blocked&&pierce>0;
    if(!hit.blocked||pierce>=1){applyEffect(state,target,hit);if(hit.poison)applyEffect(state,target,{effect:'poison',duration:300,potency:9});}
    const counterGuard=hit.blocked&&pierce<1&&target.buffs.some(b=>b.type==='tetsugan');
    if(hit.blocked&&pierce<1&&target.buffs.some(b=>b.type==='aquaGuard'))target.buffs=[...target.buffs.filter(b=>b.type!=='counter'),{type:'counter',remaining:90}];
    const damage=receiveDamage(state,target,counterGuard?rawDamage*.8:rawDamage);
    if(counterGuard&&target.hp>0){
      target.buffs=[...target.buffs.filter(b=>b.type!=='counter'),{type:'counter',remaining:90}];
      const reflected=receiveDamage(state,attacker,base*.3*(1-pierce));
      state.events.push({type:'reflect',target:attacker.id,damage:reflected});
    }
    if(hit.energyDrain&&(!hit.blocked||pierce>=1)&&attacker.hp>0){const drained=Math.min(target.chakra,hit.energyDrain,100-attacker.chakra);target.chakra-=drained;attacker.chakra+=drained;state.events.push({type:'energyDrain',target:target.id,drained});}
    if(hit.lifesteal&&(!hit.blocked||pierce>=1)&&attacker.hp>0){
      const healed=Math.min(1000-attacker.hp,Math.floor(damage*hit.lifesteal));attacker.hp+=healed;
      if(healed)state.events.push({type:'lifesteal',target:attacker.id,healed});
    }
    if(!hit.zoneTick&&(!hit.blocked||pierce>=1)){
      attacker.combo={hits:continuing?attacker.combo.hits+1:1,damage:(continuing?attacker.combo.damage:0)+damage,lastTick:state.tick,target:target.id};
      if(attacker.action?.move===hit.move)attacker.action.confirmed=true;
    }else if(!hit.zoneTick)clearCombo(attacker);
    target.stun = Math.max(target.stun, hit.blocked&&pierce<1 ? 7 : (guardBroken?42:hit.hitstun??18));
    target.x = clamp(target.x + hit.direction * hit.knockback * (hit.blocked ? 0.3 : 1), ARENA.margin, ARENA.width - ARENA.margin);
    target.lastDamage=damage;target.lastHit = state.tick; target.blockedHit = hit.blocked&&!penetrated;
    if(!hit.zoneTick&&(!hit.blocked||pierce>=1)){
      const airborne=target.y>0;
      if(hit.launch)target.vy=hit.launch;
      if(airborne){target.juggleHits++;if(attacker.y>0&&hit.launch)attacker.vy=Math.max(attacker.vy,3);}
      if(hit.spike&&airborne){target.vy=-16;target.stun=Math.min(target.stun,18);state.events.push({type:'airFinish',target:target.id});}
      if(airborne&&target.juggleHits>=4){target.airTech=true;target.vy=-14;target.stun=Math.min(target.stun,8);state.events.push({type:'airEscape',target:target.id});}
    }
    if((!hit.blocked||pierce>=1)&&hit.pull)target.x=clamp(target.x-hit.direction*Math.min(hit.pull,Math.max(0,Math.abs(target.x-attacker.x)-52)),ARENA.margin,ARENA.width-ARENA.margin);
    if (!hit.zoneTick&&(!hit.blocked||pierce>=1)) { target.charging=false;target.buffer=null;if(target.action)target.lastActionEnd=state.tick;target.action = null; target.blocking = false;target.crouching=false;target.dash=null; }
    // A clean pull commits its attacker to a separate, interruptible heavy strike.
    // The 18-tick startup exceeds the pull's 12-tick hitstun: guard/escape can answer it.
    if(hit.followUp&&(!hit.blocked||pierce>=1)&&attacker.hp>0&&attacker.action?.move===hit.move){
      attacker.action={...attacker.action,move:hit.followUp,age:0,hit:false,confirmed:false,fired:false,recoveryPenalty:0,chain:0};attacker.buffer=null;
    }
    state.events.push({ type: guardBroken?'guardBreak':penetrated?'pierce':hit.blocked?'block':hit.punish?'punish':'hit', target: target.id, damage, move: hit.move });
  }
  separate(...state.fighters);
  if(state.training)return state;
  const result = outcome({ hp1: state.fighters[0].hp, hp2: state.fighters[1].hp, remainingTicks: state.remainingTicks });
  if (result !== 'ongoing') {
    state.result = result;
    if (result !== 'draw') state.wins[result === 'player1' ? 0 : 1]++;
    state.status = state.wins.some(w => w >= 2) ? 'matchOver' : 'roundOver';
    state.events.push({ type: 'roundEnd', result });
  }
  return state;
}
export function computerInput(state, player=1, difficulty=state.difficulty??'easy') {
  const self=state.fighters[player],opponent=state.fighters[1-player];
  const policy=difficultyFor(difficulty);
  if(policy.id!=='easy'&&state.tick>policy.openingTicks&&state.tick%180===0&&!self.action&&!self.stun&&!self.dash){if(self.items?.[self.itemSlot]?.count&&!self.cooldowns.useItem)return {useItem:true};if(self.items?.some(i=>i.count))return {cycleItem:true};}
  if(state.tick<policy.openingTicks)return {};
  // Keep held movement/guard between decision ticks; fresh combat presses still pass through normal engine rules.
  if(state.tick%policy.decisionTicks!==0)return {...self.previous};
  const distance=Math.abs(self.x-opponent.x);
  const canReact=opponent.action&&opponent.action.age>=policy.reactionTicks;
  const canSpecial=self.actionsStarted%policy.specialEvery===policy.specialEvery-1;
  const waiting=state.tick-self.lastActionEnd<policy.attackGap;
  if(policy.awakening&&!waiting&&awakeningReady(self)&&!self.stun&&!self.action&&!self.dash)return {awakening:true};
  if(policy.replacement&&state.tick-self.lastHit>=policy.reactionTicks&&self.stun>0&&!self.cooldowns.replacement&&self.chakra>=25)return {replacement:true};
  if(self.stun||self.dash)return {};
  if(self.action){
    const m=MOVES[self.action.move];
    return self.action.confirmed&&self.action.chain>0&&self.action.chain<policy.maxCombo&&self.stamina>=staminaCost('attack',self.action.chain+1)&&self.action.age>=m.startup?{attack:!self.previous.attack}:{};
  }
  const available=key=>{const m=moveFor(self,key);return m&&!(moveEnvironment(MOVES[m])==='air'&&self.y===0&&self.vy<=0)&&!(moveEnvironment(MOVES[m])==='ground'&&(self.y>0||self.vy>0))&&!self.cooldowns[key]&&!self.previous[key]&&self.chakra>=MOVES[m].cost&&self.stamina>=staminaCost(key)&&(!['special1','special2','bloodline'].includes(key)||canSpecial);};
  const approach={left:opponent.x<self.x,right:opponent.x>self.x};
  const threat=opponent.action?MOVES[opponent.action.move]:null;
  if(canReact&&threat&&!threat.buff&&opponent.action.age<threat.startup+threat.active&&distance<(threat.projectile?230:threat.reach+35)){
    if((threat.pierce??0)>=1&&self.stamina>=18&&!self.dashCooldown)return {dashBack:true};
    return {block:true};
  }
  if(!waiting&&policy.punish&&canReact&&threat&&opponent.action.age>=threat.startup+threat.active&&distance<180){
    if(distance<=MOVES[moveFor(self,'weapon')].reach&&available('weapon'))return {weapon:true};
    if(available('special1'))return {special1:true};
    if(distance<=90&&available('attack'))return {attack:true};
    return approach;
  }
  if(!waiting&&policy.punish&&opponent.blocking&&available('special1')&&(MOVES[moveFor(self,'special1')].pierce??0)>0)return {special1:true};
  // Deliberate breathing room after every completed attack, including specials.
  if(waiting)return {};
  if(self.stamina<18){
    if(distance<150&&self.guard>35)return {block:true};
    if(distance<230)return {left:opponent.x>self.x,right:opponent.x<self.x};
    return {};
  }
  if(distance>260&&available('special2')&&MOVES[moveFor(self,'special2')]?.projectile)return {special2:true};
  if(distance>175)return state.tick%policy.cycleTicks<policy.approachTicks?approach:{};
  if(state.tick%240<8&&available('bloodline'))return {bloodline:true};
  if(distance>85&&available('special1'))return {special1:true};
  if(distance>75)return state.tick%policy.cycleTicks<policy.approachTicks?approach:{};
  if(available('special2')&&state.tick%180<8)return {special2:true};
  return state.tick%48<24?{attack:true}:{};
}


