import test from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from '../packages/input/index.js';
import { advanceResource, outcome } from '../packages/engine/index.js';
test('simultaneous movement and attack survive individual pointer release', () => {
  const input = createInput(); input.press('right', 1); input.press('attack', 2); input.release(2);
  assert.equal(input.snapshot().right, true); assert.equal(input.snapshot().attack, false);
});
test('multiple input sources holding one action are independent', () => {
  const input = createInput(); input.press('block', 1); input.press('block', 2); input.release(1);
  assert.equal(input.snapshot().block, true); input.release(2); assert.equal(input.snapshot().block, false);
});
test('blur / rotation reset clears every held input', () => {
  const input = createInput(); input.press('left', 'key'); input.press('attack', 5); input.reset();
  assert.ok(Object.values(input.snapshot()).every(v => !v));
});
test('unknown actions cannot enter input state', () => assert.throws(() => createInput().press('cheat', 1)));
test('insufficient chakra rejects a special without spending', () => assert.deepEqual(advanceResource(15, 20), { accepted: false, remaining: 15 }));
test('exact chakra cost is allowed', () => assert.deepEqual(advanceResource(20, 20), { accepted: true, remaining: 0 }));
test('invalid resource values are rejected', () => { for (const n of [-1, NaN, Infinity]) assert.throws(() => advanceResource(20, n)); });
test('double knockout is a draw', () => assert.equal(outcome({hp1:0,hp2:0,remainingTicks:50}), 'draw'));
test('knockout resolves immediately', () => assert.equal(outcome({hp1:5,hp2:0,remainingTicks:50}), 'player1'));
test('time expiry selects higher remaining HP', () => assert.equal(outcome({hp1:20,hp2:30,remainingTicks:0}), 'player2'));
test('equal HP at expiry draws', () => assert.equal(outcome({hp1:20,hp2:20,remainingTicks:0}), 'draw'));
test('live round remains ongoing', () => assert.equal(outcome({hp1:20,hp2:30,remainingTicks:1}), 'ongoing'));

test('quick tap between ticks is delivered once and reset discards queued taps', () => {
 const input=createInput();input.press('attack',1);input.release(1);
 assert.equal(input.snapshot().attack,false);assert.equal(input.consume().attack,true);
 assert.equal(input.consume().attack,false);input.press('jump',2);input.release(2);input.reset();assert.equal(input.consume().jump,false);
});
