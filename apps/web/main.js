import { createInput } from './packages/input/index.js';
const input = createInput();
const buttons = [...document.querySelectorAll('[data-action]')];
const rotate = document.querySelector('#rotate');
const active = document.querySelector('#inputs');
const keyboard = { KeyA:'left', KeyD:'right', KeyW:'jump', KeyJ:'attack', KeyK:'block', KeyU:'special1', KeyI:'special2' };
const portrait = matchMedia('(orientation: portrait)');
const touch = matchMedia('(any-pointer: coarse)');
function paint() {
  const state = input.snapshot();
  active.textContent = Object.keys(state).filter(a => state[a]).join(' + ') || 'Ready';
  buttons.forEach(b => b.classList.toggle('active', state[b.dataset.action]));
}
function reset() { input.reset(); paint(); }
function orientation() {
  reset(); rotate.hidden = !(touch.matches && portrait.matches);
  document.querySelector('header').inert = !rotate.hidden;
  document.querySelector('.arena').inert = !rotate.hidden;
  document.querySelector('footer').inert = !rotate.hidden;
}
for (const button of buttons) {
  button.addEventListener('pointerdown', event => {
    if (!rotate.hidden) return;
    event.preventDefault(); button.setPointerCapture(event.pointerId);
    input.press(button.dataset.action, `pointer:${event.pointerId}`); paint();
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type, event => { input.release(`pointer:${event.pointerId}`); paint(); });
  button.addEventListener('contextmenu', e => e.preventDefault());
}
window.addEventListener('keydown', event => {
  if (!keyboard[event.code] || !rotate.hidden || event.target.closest('button,input,textarea,select')) return;
  event.preventDefault(); input.press(keyboard[event.code], event.code); paint();
});
window.addEventListener('keyup', event => { input.release(event.code); paint(); });
window.addEventListener('blur', reset);
document.addEventListener('visibilitychange', reset);
portrait.addEventListener('change', orientation); touch.addEventListener('change', orientation);
document.querySelector('#fullscreen').addEventListener('click', async () => {
  const status = document.querySelector('#status');
  try {
    if (!document.fullscreenElement) await document.querySelector('#game').requestFullscreen();
    await screen.orientation?.lock?.('landscape');
    status.textContent = '';
  } catch { status.textContent = 'If needed, rotate your phone manually. Full screen or orientation lock is unavailable.'; }
});
orientation();
