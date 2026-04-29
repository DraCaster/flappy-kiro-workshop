import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObstacleManager } from '../../src/obstacles.js';

describe('ObstacleManager', () => {
  let manager;
  const mockGame = { width: 400, height: 600 };

  beforeEach(() => {
    manager = new ObstacleManager(mockGame);
  });

  describe('constructor', () => {
    it('initializes with an empty pipes array', () => {
      expect(manager.getPipes()).toEqual([]);
    });

    it('sets spawnTimer to SPAWN_INTERVAL', () => {
      expect(manager.spawnTimer).toBe(ObstacleManager.SPAWN_INTERVAL);
    });

    it('stores game dimensions', () => {
      expect(manager.gameWidth).toBe(400);
      expect(manager.gameHeight).toBe(600);
    });

    it('calculates minGapY based on GAP_SIZE', () => {
      expect(manager.minGapY).toBe(ObstacleManager.GAP_SIZE / 2 + 50);
    });

    it('calculates maxGapY based on canvas height', () => {
      expect(manager.maxGapY).toBe(
        600 - ObstacleManager.GAP_SIZE / 2 - 100
      );
    });

    it('uses default dimensions when no game object provided', () => {
      const m = new ObstacleManager(null);
      expect(m.gameWidth).toBe(400);
      expect(m.gameHeight).toBe(600);
    });
  });

  describe('static constants', () => {
    it('defines PIPE_WIDTH as 52', () => {
      expect(ObstacleManager.PIPE_WIDTH).toBe(52);
    });

    it('defines GAP_SIZE as 130', () => {
      expect(ObstacleManager.GAP_SIZE).toBe(130);
    });

    it('defines SPAWN_INTERVAL as 1.8', () => {
      expect(ObstacleManager.SPAWN_INTERVAL).toBe(1.8);
    });

    it('defines SCROLL_SPEED as 150', () => {
      expect(ObstacleManager.SCROLL_SPEED).toBe(150);
    });
  });

  describe('update(dt) - spawning', () => {
    it('spawns a pipe after SPAWN_INTERVAL elapses', () => {
      // Advance time by exactly the spawn interval
      manager.update(ObstacleManager.SPAWN_INTERVAL);
      expect(manager.getPipes()).toHaveLength(1);
    });

    it('does not spawn a pipe before SPAWN_INTERVAL elapses', () => {
      manager.update(ObstacleManager.SPAWN_INTERVAL - 0.01);
      expect(manager.getPipes()).toHaveLength(0);
    });

    it('spawns multiple pipes over multiple intervals', () => {
      // Use small dt increments to avoid first pipe scrolling off-screen
      // Advance to just past first spawn
      manager.update(ObstacleManager.SPAWN_INTERVAL);
      expect(manager.getPipes()).toHaveLength(1);
      // Advance to just past second spawn
      manager.update(ObstacleManager.SPAWN_INTERVAL);
      // The first pipe may have scrolled off-screen (400 - 150*3.6 = -140 < -52)
      // so we check that at least the second pipe was spawned
      // and that total spawns occurred by checking the second pipe exists
      const pipes = manager.getPipes();
      // First pipe scrolled to 400 - 150*3.6 = -140, removed since < -52
      // Second pipe at 400 - 150*1.8 = 130, still on screen
      expect(pipes).toHaveLength(1);
      expect(pipes[0].x).toBeCloseTo(
        mockGame.width - ObstacleManager.SCROLL_SPEED * ObstacleManager.SPAWN_INTERVAL,
        5
      );
    });

    it('spawns pipe at the right edge of the canvas', () => {
      manager.update(ObstacleManager.SPAWN_INTERVAL);
      const pipe = manager.getPipes()[0];
      // After spawning, the pipe is scrolled by SCROLL_SPEED * 0 remainder,
      // but the full dt was used for scrolling too. The pipe spawns at gameWidth
      // then gets scrolled by SCROLL_SPEED * dt in the same frame.
      // Pipe spawns at 400, then scrolled by 150 * 1.8 = 270 → 130
      expect(pipe.x).toBeCloseTo(
        mockGame.width - ObstacleManager.SCROLL_SPEED * ObstacleManager.SPAWN_INTERVAL,
        5
      );
    });

    it('spawns pipe with scored set to false', () => {
      manager.update(ObstacleManager.SPAWN_INTERVAL);
      const pipe = manager.getPipes()[0];
      expect(pipe.scored).toBe(false);
    });
  });

  describe('update(dt) - gap positions', () => {
    it('spawns pipes with gapY within bounds', () => {
      // Spawn many pipes and check all are within bounds
      for (let i = 0; i < 50; i++) {
        manager.update(ObstacleManager.SPAWN_INTERVAL);
      }
      for (const pipe of manager.getPipes()) {
        expect(pipe.gapY).toBeGreaterThanOrEqual(manager.minGapY);
        expect(pipe.gapY).toBeLessThanOrEqual(manager.maxGapY);
      }
    });
  });

  describe('update(dt) - scrolling', () => {
    it('scrolls pipes left by SCROLL_SPEED * dt', () => {
      // Manually add a pipe to avoid spawn timing complexity
      manager.pipes.push({ x: 300, gapY: 250, scored: false });
      const dt = 1 / 60;
      manager.update(dt);
      expect(manager.getPipes()[0].x).toBeCloseTo(
        300 - ObstacleManager.SCROLL_SPEED * dt,
        5
      );
    });

    it('scrolls all pipes at the same speed', () => {
      manager.pipes.push({ x: 300, gapY: 250, scored: false });
      manager.pipes.push({ x: 200, gapY: 300, scored: false });
      const dt = 0.1;
      const expectedDelta = ObstacleManager.SCROLL_SPEED * dt;
      manager.update(dt);
      const pipes = manager.getPipes();
      expect(pipes[0].x).toBeCloseTo(300 - expectedDelta, 5);
      expect(pipes[1].x).toBeCloseTo(200 - expectedDelta, 5);
    });
  });

  describe('update(dt) - off-screen removal', () => {
    it('removes pipes that have scrolled past -PIPE_WIDTH', () => {
      manager.pipes.push({ x: -ObstacleManager.PIPE_WIDTH - 1, gapY: 250, scored: false });
      manager.update(0); // dt=0, just triggers removal check
      expect(manager.getPipes()).toHaveLength(0);
    });

    it('keeps pipes that are at exactly -PIPE_WIDTH', () => {
      // x >= -PIPE_WIDTH means pipe at exactly -PIPE_WIDTH is kept
      manager.pipes.push({ x: -ObstacleManager.PIPE_WIDTH, gapY: 250, scored: false });
      manager.update(0);
      expect(manager.getPipes()).toHaveLength(1);
    });

    it('keeps on-screen pipes while removing off-screen ones', () => {
      manager.pipes.push({ x: -100, gapY: 250, scored: false }); // off-screen
      manager.pipes.push({ x: 200, gapY: 300, scored: false });  // on-screen
      manager.update(0);
      expect(manager.getPipes()).toHaveLength(1);
      expect(manager.getPipes()[0].x).toBe(200);
    });
  });

  describe('reset()', () => {
    it('clears all pipes', () => {
      manager.pipes.push({ x: 200, gapY: 250, scored: false });
      manager.pipes.push({ x: 300, gapY: 300, scored: true });
      manager.reset();
      expect(manager.getPipes()).toEqual([]);
    });

    it('resets spawnTimer to SPAWN_INTERVAL', () => {
      manager.spawnTimer = 0.5;
      manager.reset();
      expect(manager.spawnTimer).toBe(ObstacleManager.SPAWN_INTERVAL);
    });

    it('allows normal spawning after reset', () => {
      manager.pipes.push({ x: 200, gapY: 250, scored: false });
      manager.reset();
      manager.update(ObstacleManager.SPAWN_INTERVAL);
      expect(manager.getPipes()).toHaveLength(1);
    });
  });

  describe('getPipes()', () => {
    it('returns the pipes array reference', () => {
      const pipes = manager.getPipes();
      expect(pipes).toBe(manager.pipes);
    });

    it('reflects changes after update', () => {
      expect(manager.getPipes()).toHaveLength(0);
      manager.update(ObstacleManager.SPAWN_INTERVAL);
      expect(manager.getPipes()).toHaveLength(1);
    });
  });
});
