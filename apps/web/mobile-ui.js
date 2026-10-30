// Keep native selects (keyboard, screen reader and OS picker support). Expand
// activation to their labels without cancelling the select's default behavior.
export function installMobileUI(root = document) {
  root.addEventListener('click', event => {
    const label = event.target.closest?.('label');
    const select = label?.control ?? label?.querySelector('select');
    if (select?.tagName !== 'SELECT' || select.disabled || event.target === select || event.target.closest('button,input,textarea,a')) return;
    select.focus();
    try { select.showPicker?.(); } catch { /* Native label activation remains the fallback. */ }
  });
}
