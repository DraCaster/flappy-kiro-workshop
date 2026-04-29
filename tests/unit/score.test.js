import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreManager } from '../../src/score.js';

describe('ScoreManager', () => {
  beforeEach(() => {
    // Clear localStorage and reset mocks before each test
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('initializes currentScore to 0', () => {
      const sm = new ScoreManager();
      expect(sm.currentScore).toBe(0);
    });

    it('loads highScore from localStorage on construction', () => {
      localStorage.setItem(ScoreManager.STORAGE_KEY, '42');
      const sm = new ScoreManager();
      expect(sm.highScore).toBe(42);
    });

    it('defaults highScore to 0 when localStorage is empty', () => {
      const sm = new ScoreManager();
      expect(sm.highScore).toBe(0);
    });
  });

  describe('STORAGE_KEY', () => {
    it('equals "flappyKiro_highScore"', () => {
      expect(ScoreManager.STORAGE_KEY).toBe('flappyKiro_highScore');
    });
  });

  describe('increment()', () => {
    it('adds 1 to the current score', () => {
      const sm = new ScoreManager();
      sm.increment();
      expect(sm.currentScore).toBe(1);
    });

    it('increments cumulatively', () => {
      const sm = new ScoreManager();
      sm.increment();
      sm.increment();
      sm.increment();
      expect(sm.currentScore).toBe(3);
    });
  });

  describe('reset()', () => {
    it('sets currentScore to 0', () => {
      const sm = new ScoreManager();
      sm.increment();
      sm.increment();
      sm.reset();
      expect(sm.currentScore).toBe(0);
    });
  });

  describe('getHighScore()', () => {
    it('returns 0 when nothing is stored', () => {
      const sm = new ScoreManager();
      expect(sm.getHighScore()).toBe(0);
    });

    it('returns the stored high score as an integer', () => {
      localStorage.setItem(ScoreManager.STORAGE_KEY, '15');
      const sm = new ScoreManager();
      expect(sm.getHighScore()).toBe(15);
    });

    it('returns 0 for non-numeric stored values', () => {
      localStorage.setItem(ScoreManager.STORAGE_KEY, 'notanumber');
      const sm = new ScoreManager();
      expect(sm.getHighScore()).toBe(0);
    });

    it('returns 0 when localStorage.getItem throws', () => {
      const sm = new ScoreManager();
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });
      expect(sm.getHighScore()).toBe(0);
    });
  });

  describe('saveHighScore(score)', () => {
    it('writes the score to localStorage', () => {
      const sm = new ScoreManager();
      sm.saveHighScore(25);
      expect(localStorage.getItem(ScoreManager.STORAGE_KEY)).toBe('25');
    });

    it('does not throw when localStorage.setItem throws', () => {
      const sm = new ScoreManager();
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });
      expect(() => sm.saveHighScore(10)).not.toThrow();
    });
  });

  describe('updateHighScore()', () => {
    it('returns true and saves when current score beats stored high score', () => {
      const sm = new ScoreManager();
      sm.increment();
      sm.increment();
      sm.increment(); // currentScore = 3, stored = 0
      const result = sm.updateHighScore();
      expect(result).toBe(true);
      expect(sm.highScore).toBe(3);
      expect(localStorage.getItem(ScoreManager.STORAGE_KEY)).toBe('3');
    });

    it('returns false when current score does not beat stored high score', () => {
      localStorage.setItem(ScoreManager.STORAGE_KEY, '10');
      const sm = new ScoreManager();
      sm.increment(); // currentScore = 1, stored = 10
      const result = sm.updateHighScore();
      expect(result).toBe(false);
      // High score in storage should remain unchanged
      expect(localStorage.getItem(ScoreManager.STORAGE_KEY)).toBe('10');
    });

    it('returns false when current score equals stored high score', () => {
      localStorage.setItem(ScoreManager.STORAGE_KEY, '5');
      const sm = new ScoreManager();
      for (let i = 0; i < 5; i++) sm.increment(); // currentScore = 5, stored = 5
      const result = sm.updateHighScore();
      expect(result).toBe(false);
    });

    it('updates the highScore property when a new high is set', () => {
      const sm = new ScoreManager();
      for (let i = 0; i < 7; i++) sm.increment();
      sm.updateHighScore();
      expect(sm.highScore).toBe(7);
    });

    it('round-trips correctly: save then read back', () => {
      const sm = new ScoreManager();
      for (let i = 0; i < 12; i++) sm.increment();
      sm.updateHighScore();

      // Create a new ScoreManager to read from localStorage
      const sm2 = new ScoreManager();
      expect(sm2.highScore).toBe(12);
      expect(sm2.getHighScore()).toBe(12);
    });
  });
});
