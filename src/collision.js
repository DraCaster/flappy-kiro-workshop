/**
 * CollisionDetector class - checks for collisions between the player and obstacles/boundaries.
 *
 * Provides static pure functions for hitbox intersection, pipe collision, and boundary checks,
 * plus an instance `check()` method that orchestrates all collision logic.
 *
 * Accepts a `game` object with `width` and `height` properties (canvas dimensions).
 */
import { ObstacleManager } from './obstacles.js';

export class CollisionDetector {
  constructor(game) {
    this.canvasWidth = (game && game.width) || 400;
    this.canvasHeight = (game && game.height) || 600;
  }

  /**
   * Check if two axis-aligned rectangles overlap (AABB intersection).
   * @param {{x: number, y: number, w: number, h: number}} a
   * @param {{x: number, y: number, w: number, h: number}} b
   * @returns {boolean} true if the rectangles overlap
   */
  static rectIntersects(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  /**
   * Check if the player hitbox is out of the canvas bounds.
   * @param {{x: number, y: number, w: number, h: number}} playerHitbox
   * @param {number} canvasHeight
   * @returns {'ground' | 'ceiling' | null}
   */
  static isOutOfBounds(playerHitbox, canvasHeight) {
    if (playerHitbox.y + playerHitbox.h >= canvasHeight) {
      return 'ground';
    }
    if (playerHitbox.y < 0) {
      return 'ceiling';
    }
    return null;
  }

  /**
   * Check if the player hitbox collides with a pipe pair (top or bottom pipe).
   * @param {{x: number, y: number, w: number, h: number}} playerHitbox
   * @param {{x: number, gapY: number}} pipe
   * @param {number} pipeWidth
   * @param {number} gapSize
   * @param {number} canvasHeight
   * @returns {boolean} true if the player overlaps either the top or bottom pipe
   */
  static checkPipeCollision(playerHitbox, pipe, pipeWidth, gapSize, canvasHeight) {
    // Top pipe: from top of canvas down to the start of the gap
    const topPipe = {
      x: pipe.x,
      y: 0,
      w: pipeWidth,
      h: pipe.gapY - gapSize / 2,
    };

    // Bottom pipe: from end of the gap down to the bottom of the canvas
    const bottomPipeY = pipe.gapY + gapSize / 2;
    const bottomPipe = {
      x: pipe.x,
      y: bottomPipeY,
      w: pipeWidth,
      h: canvasHeight - bottomPipeY,
    };

    return (
      CollisionDetector.rectIntersects(playerHitbox, topPipe) ||
      CollisionDetector.rectIntersects(playerHitbox, bottomPipe)
    );
  }

  /**
   * Orchestrate all collision checks for the current frame.
   * @param {Player} player - Player instance with getHitbox() method
   * @param {ObstacleManager} obstacles - ObstacleManager instance with getPipes() method
   * @returns {{collided: boolean, type: 'pipe' | 'ground' | null}}
   */
  check(player, obstacles) {
    const playerHitbox = player.getHitbox();

    // Check boundary collisions first
    const boundaryResult = CollisionDetector.isOutOfBounds(playerHitbox, this.canvasHeight);

    if (boundaryResult === 'ground') {
      return { collided: true, type: 'ground' };
    }

    if (boundaryResult === 'ceiling') {
      // Clamp player to top of screen instead of triggering game over
      player.y = 0;
    }

    // Re-fetch hitbox after potential clamping
    const currentHitbox = player.getHitbox();

    // Check pipe collisions
    const pipes = obstacles.getPipes();
    const pipeWidth = ObstacleManager.PIPE_WIDTH;
    const gapSize = ObstacleManager.GAP_SIZE;

    for (let i = 0; i < pipes.length; i++) {
      if (CollisionDetector.checkPipeCollision(currentHitbox, pipes[i], pipeWidth, gapSize, this.canvasHeight)) {
        return { collided: true, type: 'pipe' };
      }
    }

    return { collided: false, type: null };
  }
}
