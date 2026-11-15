import { STORY_CHAPTER } from './packages/engine/story.js';

export const STORY_CHECKPOINT_KEY = 'fabled.story.northern-echoes.v1';
export const STORY_UNLOCK_PROGRESS_KEY = 'fabled.story.northern-echoes.completed.v1';
const enforceStoryLocks = document.documentElement.dataset.storyLocks === 'on';

export function savedStoryVictories() {
  try {
    return Math.max(...[STORY_CHECKPOINT_KEY, STORY_UNLOCK_PROGRESS_KEY].map(key => {
      const value = Number(localStorage.getItem(key));
      return Number.isInteger(value) && value >= 0 && value <= STORY_CHAPTER.encounters.length ? value : 0;
    }));
  } catch {
    return 0;
  }
}

export function rosterAccess(character, victories = savedStoryVictories()) {
  if (character.releaseState !== 'unreleased') return {locked: false};
  const milestone = STORY_CHAPTER.encounters.findIndex(encounter => encounter.unlocks?.includes(character.id));
  return {
    locked: enforceStoryLocks && (milestone < 0 || victories <= milestone),
    hint: milestone < 0 ? 'Future story encounter' : 'Continue Northern Echoes',
  };
}
