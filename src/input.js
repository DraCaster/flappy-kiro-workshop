/**
 * InputHandler class - captures mouse, keyboard, and touch input.
 *
 * Attaches event listeners for click (canvas), keydown (document), and
 * touchstart (canvas) to detect jump requests. Uses a consume/clear
 * debounce pattern so only one jump is processed per frame. Stores
 * bound handler references for clean removal on destroy().
 */
export class InputHandler {
  constructor(game) {
    this.canvas = (game && game.canvas) || null;
    this.jumpRequested = false;

    // Bound handler references for cleanup
    this._handleClick = null;
    this._handleKeyDown = null;
    this._handleTouchStart = null;
  }

  /**
   * Attach event listeners for click, keydown, and touchstart.
   * Click and touchstart listen on the canvas; keydown listens on document.
   */
  init() {
    this._handleClick = () => {
      this.jumpRequested = true;
    };

    this._handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        this.jumpRequested = true;
      }
    };

    this._handleTouchStart = (e) => {
      e.preventDefault();
      this.jumpRequested = true;
    };

    if (this.canvas) {
      this.canvas.addEventListener('click', this._handleClick);
      this.canvas.addEventListener('touchstart', this._handleTouchStart, { passive: false });
    }

    document.addEventListener('keydown', this._handleKeyDown);
  }

  /**
   * Return the current jumpRequested value and clear it.
   * This debounce pattern ensures only one jump per frame.
   * @returns {boolean} Whether a jump was requested since last consume.
   */
  consume() {
    const requested = this.jumpRequested;
    this.jumpRequested = false;
    return requested;
  }

  /**
   * Remove all event listeners using stored bound references.
   */
  destroy() {
    if (this.canvas && this._handleClick) {
      this.canvas.removeEventListener('click', this._handleClick);
    }

    if (this.canvas && this._handleTouchStart) {
      this.canvas.removeEventListener('touchstart', this._handleTouchStart);
    }

    if (this._handleKeyDown) {
      document.removeEventListener('keydown', this._handleKeyDown);
    }

    this._handleClick = null;
    this._handleKeyDown = null;
    this._handleTouchStart = null;
  }
}
