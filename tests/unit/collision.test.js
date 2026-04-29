import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionDetector } from '../../src/collision.js';
import { Player } from '../../src/player.js';
import { ObstacleManager } from '../../src/obstacles.js';

describe('CollisionDetector', () => {
  const mockGame = { width: 400, height: 600 };

  describe('static rectIntersects(a, b)', () => {
    it('returns true for overlapping rectangles', () => {
      const a = { x: 0, y: 0, w: 10, h: 10 };
      const b = { x: 5, y: 5, w: 10, h: 10 };
      expect(CollisionDetector.rectIntersects(a, b)).toBe(true);
    });

    it('returns true when one rectangle is inside the other', () => {
      const a = { x: 0, y: 0, w: 20, h: 20 };
      const b = { x: 5, y: 5, w: 5, h: 5 };
      expect(CollisionDetector.rectIntersects(a, b)).toBe(true);
    });

    it('returns false for non-overlapping rectangles (side by side)', () => {
      const a = { x: 0, y: 0, w: 10, h: 10 };
      const b = { x: 20, y: 0, w: 10, h: 10 };
      expect(CollisionDetector.rectIntersects(a, b)).toBe(false);
    });

    it('returns false for non-overlapping rectangles (above/below)', () => {
      const a = { x: 0, y: 0, w: 10, h: 10 };
      const b = { x: 0, y: 20, w: 10, h: 10 };
      expect(CollisionDetector.rectIntersects(a, b)).toBe(false);
    });

    it('returns false when rectangles share an edge (touching but not overlapping)', () => {
      const a = { x: 0, y: 0, w: 10, h: 10 };
      const b = { x: 10, y: 0, w: 10, h: 10 };
      expect(CollisionDetector.rectIntersects(a, b)).toBe(false);
    });

    it('returns true for rectangles overlapping by 1 pixel', () => {
      const a = { x: 0, y: 0, w: 10, h: 10 };
      const b = { x: 9, y: 9, w: 10, h: 10 };
      expect(CollisionDetector.rectIntersects(a, b)).toBe(true);
    });
  });

  describe('static isOutOfBounds(playerHitbox, canvasHeight)', () => {
    it('returns "ground" when player bottom reaches canvas height', () => {
      const hitbox = { x: 80, y: 576, w: 34, h: 24 };
      expect(CollisionDetector.isOutOfBounds(hitbox, 600)).toBe('ground');
    });

    it('returns "ground" when player bottom exceeds canvas height', () => {
      const hitbox = { x: 80, y: 590, w: 34, h: 24 };
      expect(CollisionDetector.isOutOfBounds(hitbox, 600)).toBe('ground');
    });

    it('returns "ceiling" when player top is above screen', () => {
      const hitbox = { x: 80, y: -5, w: 34, h: 24 };
      expect(CollisionDetector.isOutOfBounds(hitbox, 600)).toBe('ceiling');
    });

    it('returns null when player is within bounds', () => {
      const hitbox = { x: 80, y: 200, w: 34, h: 24 };
      expect(CollisionDetector.isOutOfBounds(hitbox, 600)).toBeNull();
    });

    it('returns null when player is at the very top (y = 0)', () => {
      const hitbox = { x: 80, y: 0, w: 34, h: 24 };
      expect(CollisionDetector.isOutOfBounds(hitbox, 600)).toBeNull();
    });

    it('returns null when player bottom is just below canvas height', () => {
      // y + h = 599, which is < 600
      const hitbox = { x: 80, y: 575, w: 34, h: 24 };
      expect(CollisionDetector.isOutOfBounds(hitbox, 600)).toBeNull();
    });
  });

  describe('static checkPipeCollision(playerHitbox, pipe, pipeWidth, gapSize, canvasHeight)', () => {
    const pipeWidth = 52;
    const gapSize = 130;
    const canvasHeight = 600;

    it('returns true when player overlaps the top pipe', () => {
      // Pipe with gap centered at y=300, so top pipe goes from 0 to 235
      const pipe = { x: 100, gapY: 300 };
      // Player at y=220, h=24 → bottom at 244, overlaps top pipe (ends at 235)
      const playerHitbox = { x: 100, y: 220, w: 34, h: 24 };
      expect(CollisionDetector.checkPipeCollision(playerHitbox, pipe, pipeWidth, gapSize, canvasHeight)).toBe(true);
    });

    it('returns true when player overlaps the bottom pipe', () => {
      // Pipe with gap centered at y=300, so bottom pipe starts at 365
      const pipe = { x: 100, gapY: 300 };
      // Player at y=360, h=24 → top at 360, overlaps bottom pipe (starts at 365)
      const playerHitbox = { x: 100, y: 350, w: 34, h: 24 };
      expect(CollisionDetector.checkPipeCollision(playerHitbox, pipe, pipeWidth, gapSize, canvasHeight)).toBe(true);
    });

    it('returns false when player is in the gap', () => {
      // Pipe with gap centered at y=300, gap from 235 to 365
      const pipe = { x: 100, gapY: 300 };
      // Player at y=280, h=24 → from 280 to 304, fully within gap
      const playerHitbox = { x: 100, y: 280, w: 34, h: 24 };
      expect(CollisionDetector.checkPipeCollision(playerHitbox, pipe, pipeWidth, gapSize, canvasHeight)).toBe(false);
    });

    it('returns false when player is horizontally past the pipe', () => {
      const pipe = { x: 100, gapY: 300 };
      // Player at x=200, well past the pipe (pipe ends at 152)
      const playerHitbox = { x: 200, y: 100, w: 34, h: 24 };
      expect(CollisionDetector.checkPipeCollision(playerHitbox, pipe, pipeWidth, gapSize, canvasHeight)).toBe(false);
    });

    it('returns false when player is horizontally before the pipe', () => {
      const pipe = { x: 100, gapY: 300 };
      // Player at x=50, before the pipe (player ends at 84, pipe starts at 100)
      const playerHitbox = { x: 50, y: 100, w: 34, h: 24 };
      expect(CollisionDetector.checkPipeCollision(playerHitbox, pipe, pipeWidth, gapSize, canvasHeight)).toBe(false);
    });

    it('returns true when player just barely overlaps top pipe', () => {
      // Gap starts at 235 (top pipe bottom edge)
      const pipe = { x: 100, gapY: 300 };
      // Player at y=234, h=24 → bottom at 258, but top at 234 < 235 → overlaps top pipe
      // Actually: top pipe h = 300 - 65 = 235. Player y=220, bottom=244 > 0 and top=220 < 235 → overlap
      const playerHitbox = { x: 100, y: 220, w: 34, h: 24 };
      expect(CollisionDetector.checkPipeCollision(playerHitbox, pipe, pipeWidth, gapSize, canvasHeight)).toBe(true);
    });
  });

  describe('check(player, obstacles)', () => {
    let detector;
    let player;
    let obstacles;

    beforeEach(() => {
      detector = new CollisionDetector(mockGame);
      player = new Player(mockGame);
      obstacles = new ObstacleManager(mockGame);
    });

    it('returns no collision when player is in open space with no pipes', () => {
      const result = detector.check(player, obstacles);
      expect(result).toEqual({ collided: false, type: null });
    });

    it('returns ground collision when player hits the ground', () => {
      player.y = 580; // y + h = 580 + 24 = 604 >= 600
      const result = detector.check(player, obstacles);
      expect(result).toEqual({ collided: true, type: 'ground' });
    });

    it('clamps player to ceiling when above screen', () => {
      player.y = -10;
      detector.check(player, obstacles);
      expect(player.y).toBe(0);
    });

    it('returns no collision after ceiling clamp (no pipes)', () => {
      player.y = -10;
      const result = detector.check(player, obstacles);
      expect(result).toEqual({ collided: false, type: null });
    });

    it('returns pipe collision when player overlaps a pipe', () => {
      // Place player at a position that overlaps the top pipe
      const pipe = { x: player.x - 10, gapY: 300, scored: false };
      obstacles.pipes.push(pipe);
      // Move player to overlap top pipe (top pipe ends at 300 - 65 = 235)
      player.y = 200; // player bottom at 224, overlaps top pipe
      const result = detector.check(player, obstacles);
      expect(result).toEqual({ collided: true, type: 'pipe' });
    });

    it('returns no collision when player is in the gap', () => {
      // Gap centered at 300, from 235 to 365
      const pipe = { x: player.x - 10, gapY: 300, scored: false };
      obstacles.pipes.push(pipe);
      // Place player in the middle of the gap
      player.y = 280; // player from 280 to 304, within 235-365 gap
      const result = detector.check(player, obstacles);
      expect(result).toEqual({ collided: false, type: null });
    });

    it('returns pipe collision when player overlaps bottom pipe', () => {
      // Gap centered at 300, bottom pipe starts at 365
      const pipe = { x: player.x - 10, gapY: 300, scored: false };
      obstacles.pipes.push(pipe);
      player.y = 360; // player from 360 to 384, overlaps bottom pipe at 365
      const result = detector.check(player, obstacles);
      expect(result).toEqual({ collided: true, type: 'pipe' });
    });

    it('checks ground collision before pipe collision', () => {
      // Player at ground level with a pipe nearby
      const pipe = { x: player.x - 10, gapY: 300, scored: false };
      obstacles.pipes.push(pipe);
      player.y = 580; // ground collision
      const result = detector.check(player, obstacles);
      expect(result).toEqual({ collided: true, type: 'ground' });
    });

    it('checks multiple pipes and detects collision with any', () => {
      // First pipe: player is in the gap
      obstacles.pipes.push({ x: player.x + 100, gapY: 300, scored: false });
      // Second pipe: player overlaps
      obstacles.pipes.push({ x: player.x - 10, gapY: 400, scored: false });
      player.y = 200; // overlaps top pipe of second pipe (gapY=400, top pipe ends at 335)
      const result = detector.check(player, obstacles);
      expect(result).toEqual({ collided: true, type: 'pipe' });
    });
  });
});
