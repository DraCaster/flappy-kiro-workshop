import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../../src/player.js';

describe('Player', () => {
  let player;
  const mockGame = { width: 400, height: 600 };

  beforeEach(() => {
    player = new Player(mockGame);
  });

  describe('constructor', () => {
    it('sets starting position based on game dimensions', () => {
      expect(player.x).toBe(400 * 0.2);
      expect(player.y).toBe(600 / 2);
    });

    it('initializes with zero velocity and rotation', () => {
      expect(player.velocity).toBe(0);
      expect(player.rotation).toBe(0);
    });

    it('sets player dimensions to ghosty sprite size', () => {
      expect(player.width).toBe(34);
      expect(player.height).toBe(24);
    });

    it('uses default dimensions when no game object provided', () => {
      const p = new Player(null);
      expect(p.x).toBe(400 * 0.2);
      expect(p.y).toBe(600 / 2);
    });
  });

  describe('static constants', () => {
    it('defines GRAVITY as 980', () => {
      expect(Player.GRAVITY).toBe(980);
    });

    it('defines JUMP_VELOCITY as -300', () => {
      expect(Player.JUMP_VELOCITY).toBe(-300);
    });

    it('defines MAX_FALL_SPEED as 600', () => {
      expect(Player.MAX_FALL_SPEED).toBe(600);
    });

    it('defines ROTATION_SPEED as 3', () => {
      expect(Player.ROTATION_SPEED).toBe(3);
    });
  });

  describe('jump()', () => {
    it('sets velocity to JUMP_VELOCITY', () => {
      player.jump();
      expect(player.velocity).toBe(Player.JUMP_VELOCITY);
    });

    it('overrides any existing velocity', () => {
      player.velocity = 500;
      player.jump();
      expect(player.velocity).toBe(Player.JUMP_VELOCITY);
    });
  });

  describe('update(dt)', () => {
    it('applies gravity to velocity each frame', () => {
      const dt = 1 / 60;
      player.update(dt);
      expect(player.velocity).toBeCloseTo(Player.GRAVITY * dt, 5);
    });

    it('updates y position based on velocity', () => {
      const startY = player.y;
      player.velocity = 100;
      const dt = 1 / 60;
      player.update(dt);
      // velocity after gravity: 100 + 980 * dt
      const expectedVelocity = 100 + Player.GRAVITY * dt;
      expect(player.y).toBeCloseTo(startY + expectedVelocity * dt, 5);
    });

    it('clamps velocity to MAX_FALL_SPEED', () => {
      player.velocity = Player.MAX_FALL_SPEED;
      player.update(1 / 60);
      expect(player.velocity).toBe(Player.MAX_FALL_SPEED);
    });

    it('does not exceed MAX_FALL_SPEED with large dt', () => {
      player.velocity = 0;
      player.update(10); // large dt
      expect(player.velocity).toBe(Player.MAX_FALL_SPEED);
    });

    it('rotates upward when velocity is negative', () => {
      player.velocity = -300;
      player.rotation = 0;
      player.update(1 / 60);
      // Rotation should move toward negative (upward tilt)
      expect(player.rotation).toBeLessThan(0);
    });

    it('rotates downward when velocity is positive', () => {
      player.velocity = 0;
      player.rotation = 0;
      // After one update, velocity becomes positive from gravity
      player.update(1 / 60);
      expect(player.rotation).toBeGreaterThan(0);
    });
  });

  describe('reset()', () => {
    it('returns player to starting y position', () => {
      player.y = 100;
      player.reset();
      expect(player.y).toBe(600 / 2);
    });

    it('sets velocity to zero', () => {
      player.velocity = 500;
      player.reset();
      expect(player.velocity).toBe(0);
    });

    it('sets rotation to zero', () => {
      player.rotation = 1.5;
      player.reset();
      expect(player.rotation).toBe(0);
    });

    it('does not change x position', () => {
      const originalX = player.x;
      player.reset();
      expect(player.x).toBe(originalX);
    });
  });

  describe('getHitbox()', () => {
    it('returns correct hitbox rectangle', () => {
      const hitbox = player.getHitbox();
      expect(hitbox).toEqual({
        x: player.x,
        y: player.y,
        w: 34,
        h: 24,
      });
    });

    it('reflects current position after movement', () => {
      player.y = 123;
      const hitbox = player.getHitbox();
      expect(hitbox.y).toBe(123);
    });
  });
});
