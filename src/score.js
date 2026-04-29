/**
 * ScoreManager class - tracks current score and persists high score to localStorage.
 *
 * Handles score incrementing, resetting, and high score comparison with
 * localStorage persistence. Gracefully handles localStorage unavailability
 * by falling back to in-memory defaults.
 */
export class ScoreManager {
  static STORAGE_KEY = 'flappyKiro_highScore';

  constructor() {
    this.currentScore = 0;
    this.highScore = this.getHighScore();
  }

  /**
   * Add one point to the current score.
   */
  increment() {
    this.currentScore += 1;
  }

  /**
   * Reset the current score to zero.
   */
  reset() {
    this.currentScore = 0;
  }

  /**
   * Read the high score from localStorage.
   * Falls back to 0 if localStorage is unavailable or the value is invalid.
   * @returns {number}
   */
  getHighScore() {
    try {
      const stored = localStorage.getItem(ScoreManager.STORAGE_KEY);
      const parsed = parseInt(stored, 10);
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  }

  /**
   * Write a high score value to localStorage.
   * Silently catches errors if localStorage is unavailable.
   * @param {number} score
   */
  saveHighScore(score) {
    try {
      localStorage.setItem(ScoreManager.STORAGE_KEY, String(score));
    } catch {
      // Silently ignore — localStorage may be unavailable (private browsing, quota exceeded)
    }
  }

  /**
   * Compare the current score to the stored high score.
   * If the current score is higher, persist it and return true.
   * @returns {boolean} true if a new high score was set
   */
  updateHighScore() {
    if (this.currentScore > this.getHighScore()) {
      this.saveHighScore(this.currentScore);
      this.highScore = this.currentScore;
      return true;
    }
    return false;
  }
}
