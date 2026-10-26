// Initial rule primitives, not yet a complete fighting simulation.
export const TICK_RATE = 60;
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
