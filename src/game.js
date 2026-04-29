/**
 * Game class - central orchestrator for all subsystems and the game loop.
 *
 * Owns the canvas, context, and all subsystem instances. Manages the game
 * state machine (loading → menu → playing ↔ gameover, playing ↔ paused),
 * the requestAnimationFrame loop, input dispatch, collision/scoring checks,
 * and responsive canvas resizing.
 *
 * Requirements: 1.1, 1.2, 1.4, 2.1, 2.5, 4.1, 4.2, 5.1, 6.1–6.6, 7.6,
 *               9.2, 10.3, 10.4
 */
import { Player } from './player.js';
import { ObstacleManager } from './obstacles.js';
import { CollisionDetector } from './collision.js';
import { ScoreManager } from './score.js';
import { AudioManager } from './audio.js';
import { InputHandler } from './input.js';
import { Renderer } from './renderer.js';
import { CloudManager } from './clouds.js';

// Valid state transitions map
const VALID_TRANSITIONS = {
  loading: ['menu'],
  menu: ['playing'],
  playing: ['gameover', 'paused'],
  gameover: ['playing'],
  paused: ['playing'],
};

export class Game {
  /**
   * @param {HTMLCanvasElement} canvasElement
   */
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    // Base dimensions and aspect ratio (2:3)
    this.baseWidth = 400;
    this.baseHeight = 600;
    this._resizeCanvas();

    // Subsystems
    this.player = new Player(this);
    this.obstacles = new ObstacleManager(this);
    this.collision = new CollisionDetector(this);
    this.score = new ScoreManager();
    this.audio = new AudioManager();
    this.input = new InputHandler(this);
    this.renderer = new Renderer(this);
    this.clouds = new CloudManager(this);

    // State
    this.state = 'loading';
    this.lastTimestamp = 0;
    this.gameOverDelay = 0;
    this.isNewHighScore = false;
    this._animFrameId = null;

    // Bind methods for event listeners
    this._boundTick = this.tick.bind(this);
    this._boundVisibilityChange = this._onVisibilityChange.bind(this);
    this._boundResize = this._onResize.bind(this);

    // Attach visibility and resize listeners
    document.addEventListener('visibilitychange', this._boundVisibilityChange);
    window.addEventListener('resize', this._boundResize);
  }

  /**
   * Load assets (audio + sprite) and transition to menu state.
   * Uses Promise.allSettled so partial failures don't block the game.
   * @returns {Promise<void>}
   */
  async init() {
    await Promise.allSettled([
      this.audio.init(),
      this.renderer.init(),
    ]);
    this.setState('menu');
  }

  /**
   * Initialize input listeners and start the requestAnimationFrame loop.
   */
  start() {
    this.input.init();
    this._animFrameId = requestAnimationFrame(this._boundTick);
  }

  /**
   * Main game loop called by requestAnimationFrame.
   * Calculates delta time, processes input, updates game state, and renders.
   * @param {number} timestamp - High-resolution timestamp from rAF
   */
  tick(timestamp) {
    // Calculate delta time in seconds, cap at 0.1s to prevent spiral of death
    let dt = (timestamp - this.lastTimestamp) / 1000;
    if (dt > 0.1) dt = 0.1;
    this.lastTimestamp = timestamp;

    // If paused, just keep the loop alive but don't update
    if (this.state === 'paused') {
      this._animFrameId = requestAnimationFrame(this._boundTick);
      return;
    }

    // Consume input (one jump per frame via debounce pattern)
    const inputActive = this.input.consume();

    // --- State-specific update logic ---

    if (this.state === 'menu') {
      if (inputActive) {
        this.setState('playing');
      }
    } else if (this.state === 'playing') {
      // Handle jump input
      if (inputActive) {
        this.player.jump();
        this.audio.playJump();
      }

      // Update subsystems
      this.player.update(dt);
      this.obstacles.update(dt);
      this.clouds.update(dt);

      // Check collisions
      const result = this.collision.check(this.player, this.obstacles);
      if (result.collided) {
        this.setState('gameover');
        this.audio.playGameOver();
        this.isNewHighScore = this.score.updateHighScore();
      } else {
        // Check scoring: player passed pipe and it's unscored
        const pipes = this.obstacles.getPipes();
        for (let i = 0; i < pipes.length; i++) {
          const pipe = pipes[i];
          if (
            this.player.x > pipe.x + ObstacleManager.PIPE_WIDTH &&
            !pipe.scored
          ) {
            this.score.increment();
            pipe.scored = true;
          }
        }
      }
    } else if (this.state === 'gameover') {
      this.gameOverDelay -= dt;
      if (inputActive && this.gameOverDelay <= 0) {
        this.reset();
        this.setState('playing');
      }
    }

    // --- Render every frame ---
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.renderer.drawBackground();
    this.renderer.drawClouds(this.clouds.getLayers());
    this.renderer.drawGround();
    this.renderer.drawPipes(this.obstacles.getPipes());
    this.renderer.drawPlayer(this.player);

    if (this.state === 'playing') {
      this.renderer.drawScore(this.score.currentScore);
    } else if (this.state === 'menu') {
      this.renderer.drawStartScreen();
    } else if (this.state === 'gameover') {
      this.renderer.drawScore(this.score.currentScore);
      this.renderer.drawGameOverScreen(
        this.score.currentScore,
        this.score.highScore,
        this.isNewHighScore
      );
    }

    // Request next frame
    this._animFrameId = requestAnimationFrame(this._boundTick);
  }

  /**
   * Transition to a new game state if the transition is valid.
   * Sets gameOverDelay when entering gameover state.
   * @param {string} newState
   */
  setState(newState) {
    const allowed = VALID_TRANSITIONS[this.state];
    if (!allowed || !allowed.includes(newState)) {
      return;
    }

    if (newState === 'gameover') {
      this.gameOverDelay = 0.5;
    }

    this.state = newState;
  }

  /**
   * Reset all subsystems for a new game.
   */
  reset() {
    this.player.reset();
    this.obstacles.reset();
    this.clouds.reset();
    this.score.reset();
    this.isNewHighScore = false;
  }

  /**
   * Handle document visibility changes to pause/resume the game.
   * Resets lastTimestamp on resume to prevent a large delta time jump.
   * @private
   */
  _onVisibilityChange() {
    if (document.hidden) {
      if (this.state === 'playing') {
        this.setState('paused');
      }
    } else {
      if (this.state === 'paused') {
        this.lastTimestamp = performance.now();
        this.setState('playing');
      }
    }
  }

  /**
   * Handle window resize events to keep the canvas fitting the viewport
   * while maintaining the 2:3 aspect ratio.
   * @private
   */
  _onResize() {
    this._resizeCanvas();

    // Update subsystem references to new dimensions
    this.renderer.width = this.width;
    this.renderer.height = this.height;
    this.collision.canvasWidth = this.width;
    this.collision.canvasHeight = this.height;
  }

  /**
   * Calculate and apply canvas dimensions to fit the viewport
   * while maintaining a 2:3 aspect ratio (400:600).
   * @private
   */
  _resizeCanvas() {
    const aspectRatio = this.baseWidth / this.baseHeight; // 2/3
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let w, h;
    if (vw / vh < aspectRatio) {
      // Viewport is narrower than aspect ratio — fit to width
      w = vw;
      h = vw / aspectRatio;
    } else {
      // Viewport is wider — fit to height
      h = vh;
      w = vh * aspectRatio;
    }

    this.width = Math.floor(w);
    this.height = Math.floor(h);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
}
