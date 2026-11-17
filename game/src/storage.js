// Remembers the best score between visits (in localStorage, when the browser allows it).

const BEST_SCORE_KEY = 'mothlight.bestScore';

export function loadBestScore() {
  try {
    return Number(window.localStorage.getItem(BEST_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(score) {
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(Math.round(score)));
  } catch {
    // Private windows may refuse storage; the game plays on without it.
  }
}
