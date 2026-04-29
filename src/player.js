/**
 * Player class - manages the ghost character's position, velocity, and rotation.
 *
 * Accepts a `game` object with `width` and `height` properties (canvas dimensions)
 * to determine the starting position. Falls back to sensible defaults if not provided.
 */
export class Player {
  // Physics constants
  static GRAVITY = 980;          // Downward acceleration (px/s²)
  static JUMP_VELOCITY = -300;   // Upward velocity on jump (px/s, negative = up)
  static MAX_FALL_SPEED = 600;   // Terminal falling velocity (px/s)
  static ROTATION_SPEED = 3;     // Rotation interpolation speed

  constructor(game) {
    const width = (game && game.width) || 400;
    const height = (game && game.height) || 600;

    this.x = width * 0.2;
    this.startY = height / 2;
    this.y = this.startY;
    this.width = 34;
    this.height = 24;
    this.velocity = 0;
    this.rotation = 0;
  }

  /**
   * Apply gravity, clamp velocity, update position, and interpolate rotation.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Apply gravity to velocity
    this.velocity += Player.GRAVITY * dt;

    // Clamp to terminal velocity
    if (this.velocity > Player.MAX_FALL_SPEED) {
      this.velocity = Player.MAX_FALL_SPEED;
    }

    // Update vertical position
    this.y += this.velocity * dt;

    // Interpolate rotation based on velocity direction
    // Target angle: nose-up when rising, nose-down when falling
    const targetRotation = this.velocity < 0
      ? -Math.PI / 6   // Tilted up (~-30°)
      : this.velocity > 0
        ? Math.PI / 4   // Tilted down (~45°)
        : 0;

    this.rotation += (targetRotation - this.rotation) * Player.ROTATION_SPEED * dt;
  }

  /**
   * Apply an upward velocity boost (jump).
   */
  jump() {
    this.velocity = Player.JUMP_VELOCITY;
  }

  /**
   * Reset the player to starting position with zero velocity and rotation.
   */
  reset() {
    this.y = this.startY;
    this.velocity = 0;
    this.rotation = 0;
  }

  /**
   * Return the current hitbox rectangle.
   * @returns {{x: number, y: number, w: number, h: number}}
   */
  getHitbox() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }
}
