/**
 * ObstacleManager class - generates, scrolls, and recycles pipe obstacles.
 *
 * Accepts a `game` object with `width` and `height` properties (canvas dimensions)
 * to determine spawn position and gap bounds. Falls back to sensible defaults if not provided.
 */
export class ObstacleManager {
  // Pipe constants
  static PIPE_WIDTH = 52;        // Width of each pipe column (px)
  static GAP_SIZE = 130;         // Vertical gap between top and bottom pipes (px)
  static SPAWN_INTERVAL = 1.8;   // Seconds between pipe pair spawns
  static SCROLL_SPEED = 150;     // Horizontal scroll speed (px/s)

  constructor(game) {
    const width = (game && game.width) || 400;
    const height = (game && game.height) || 600;

    this.gameWidth = width;
    this.gameHeight = height;

    // Gap Y bounds: ensure pipes stay within playable area
    // MIN_GAP_Y: half the gap plus a top margin
    // MAX_GAP_Y: canvas height minus half the gap minus ground area
    this.minGapY = ObstacleManager.GAP_SIZE / 2 + 50;
    this.maxGapY = height - ObstacleManager.GAP_SIZE / 2 - 100;

    this.pipes = [];
    this.spawnTimer = ObstacleManager.SPAWN_INTERVAL;
  }

  /**
   * Update pipe positions, spawn new pipes, and remove off-screen pipes.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Decrement spawn timer
    this.spawnTimer -= dt;

    // Spawn a new pipe when timer expires
    if (this.spawnTimer <= 0) {
      this.spawnTimer = ObstacleManager.SPAWN_INTERVAL;
      this._spawnPipe();
    }

    // Scroll all pipes left
    for (let i = 0; i < this.pipes.length; i++) {
      this.pipes[i].x -= ObstacleManager.SCROLL_SPEED * dt;
    }

    // Remove pipes that have scrolled off-screen
    this.pipes = this.pipes.filter(
      (pipe) => pipe.x >= -ObstacleManager.PIPE_WIDTH
    );
  }

  /**
   * Spawn a new pipe pair at the right edge of the canvas.
   * @private
   */
  _spawnPipe() {
    const gapY =
      this.minGapY + Math.random() * (this.maxGapY - this.minGapY);

    this.pipes.push({
      x: this.gameWidth,
      gapY,
      scored: false,
    });
  }

  /**
   * Reset all pipes and the spawn timer for a new game.
   */
  reset() {
    this.pipes = [];
    this.spawnTimer = ObstacleManager.SPAWN_INTERVAL;
  }

  /**
   * Return the active pipes array.
   * @returns {Array<{x: number, gapY: number, scored: boolean}>}
   */
  getPipes() {
    return this.pipes;
  }
}
