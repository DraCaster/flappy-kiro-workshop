/**
 * CloudManager class - manages parallax cloud layers for background depth.
 *
 * Creates multiple cloud layers with different scroll speeds and opacities
 * to produce a parallax depth effect. Clouds scroll left and are recycled
 * to the right edge when they move off-screen.
 *
 * Accepts a `game` object with `width` and `height` properties (canvas dimensions).
 * Falls back to sensible defaults if not provided.
 */
import { ObstacleManager } from './obstacles.js';

export class CloudManager {
  constructor(game) {
    const width = (game && game.width) || 400;
    const height = (game && game.height) || 600;

    this.gameWidth = width;
    this.gameHeight = height;

    // Define layer configurations: back, middle, front
    this.layerConfigs = [
      { speed: 0.2, opacity: 0.15, minClouds: 4, maxClouds: 5 },
      { speed: 0.4, opacity: 0.25, minClouds: 3, maxClouds: 4 },
      { speed: 0.6, opacity: 0.35, minClouds: 2, maxClouds: 3 },
    ];

    this.layers = this._generateLayers();
  }

  /**
   * Generate all cloud layers with random cloud positions and sizes.
   * @returns {Array<{speed: number, opacity: number, clouds: Array}>}
   * @private
   */
  _generateLayers() {
    return this.layerConfigs.map((config) => {
      const count =
        config.minClouds +
        Math.floor(Math.random() * (config.maxClouds - config.minClouds + 1));

      const clouds = [];
      for (let i = 0; i < count; i++) {
        clouds.push(this._randomCloud());
      }

      return {
        speed: config.speed,
        opacity: config.opacity,
        clouds,
      };
    });
  }

  /**
   * Create a single cloud with random position and size.
   * Clouds are placed across the full canvas width and in the upper portion vertically.
   * @returns {{x: number, y: number, width: number, height: number}}
   * @private
   */
  _randomCloud() {
    const width = 60 + Math.random() * 60;   // 60–120 px
    const height = 20 + Math.random() * 20;  // 20–40 px
    const x = Math.random() * this.gameWidth;
    const y = Math.random() * (this.gameHeight * 0.5);

    return { x, y, width, height };
  }

  /**
   * Create a cloud recycled to the right edge with a new random y and size.
   * @returns {{x: number, y: number, width: number, height: number}}
   * @private
   */
  _recycledCloud() {
    const width = 60 + Math.random() * 60;
    const height = 20 + Math.random() * 20;
    const x = this.gameWidth + Math.random() * 60;
    const y = Math.random() * (this.gameHeight * 0.5);

    return { x, y, width, height };
  }

  /**
   * Scroll all cloud layers left. Recycle clouds that move off the left edge.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      const scrollAmount = layer.speed * ObstacleManager.SCROLL_SPEED * dt;

      for (let j = 0; j < layer.clouds.length; j++) {
        const cloud = layer.clouds[j];
        cloud.x -= scrollAmount;

        // Recycle cloud when it scrolls completely off the left edge
        if (cloud.x + cloud.width < 0) {
          layer.clouds[j] = this._recycledCloud();
        }
      }
    }
  }

  /**
   * Regenerate all cloud positions randomly for a fresh start.
   */
  reset() {
    this.layers = this._generateLayers();
  }

  /**
   * Return the layers array for the renderer.
   * @returns {Array<{speed: number, opacity: number, clouds: Array<{x: number, y: number, width: number, height: number}>}>}
   */
  getLayers() {
    return this.layers;
  }
}
