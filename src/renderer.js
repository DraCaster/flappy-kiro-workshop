/**
 * Renderer class - handles all Canvas 2D drawing operations.
 *
 * Accepts a `game` object with `canvas`, `ctx`, `width`, and `height` properties.
 * Preloads the ghosty sprite during init() and falls back to a colored rectangle
 * if the image fails to load.
 *
 * Uses a retro 8-bit color palette throughout:
 * - Sky gradient: #1a1a2e → #16213e → #0f3460
 * - Pipes: #2d6a4f (green) with #1b4332 (dark green) edges
 * - Ground: #8b6914 (brown) with #4a7c59 (grass green) top
 * - Text: white (#ffffff) with dark shadow
 */
export class Renderer {
  constructor(game) {
    this.canvas = (game && game.canvas) || null;
    this.ctx = (game && game.ctx) || null;
    this.width = (game && game.width) || 400;
    this.height = (game && game.height) || 600;

    this.ghostySprite = null;
    this.useFallback = false;
  }

  /**
   * Preload the ghosty.png sprite image.
   * On success, stores the image for drawing. On failure, sets useFallback
   * so drawPlayer renders a colored rectangle instead.
   * @returns {Promise<void>}
   */
  init() {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.ghostySprite = img;
        resolve();
      };
      img.onerror = () => {
        this.useFallback = true;
        resolve();
      };
      img.src = 'assets/ghosty.png';
    });
  }

  /**
   * Draw a gradient sky background with retro color palette.
   */
  drawBackground() {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle stars/sparkles scattered in the sky
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const starPositions = [
      [0.1, 0.05], [0.25, 0.12], [0.4, 0.03], [0.55, 0.15],
      [0.7, 0.08], [0.85, 0.04], [0.15, 0.22], [0.45, 0.18],
      [0.65, 0.25], [0.9, 0.2], [0.3, 0.28], [0.8, 0.14],
    ];
    for (let i = 0; i < starPositions.length; i++) {
      const sx = starPositions[i][0] * this.width;
      const sy = starPositions[i][1] * this.height;
      ctx.fillRect(sx, sy, 2, 2);
    }
  }

  /**
   * Draw a ground strip at the bottom of the canvas with retro earthy colors.
   */
  drawGround() {
    const ctx = this.ctx;
    const groundHeight = 80;
    const groundY = this.height - groundHeight;

    // Grass top edge
    ctx.fillStyle = '#4a7c59';
    ctx.fillRect(0, groundY, this.width, 4);

    // Main ground body
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(0, groundY + 4, this.width, groundHeight - 4);

    // Darker bottom layer
    ctx.fillStyle = '#5c4a0e';
    ctx.fillRect(0, groundY + groundHeight * 0.6, this.width, groundHeight * 0.4);
  }

  /**
   * Draw the player character with rotation transform.
   * Uses the ghosty sprite if loaded, otherwise draws a fallback rectangle.
   * @param {Object} player - Player object with x, y, width, height, rotation
   */
  drawPlayer(player) {
    const ctx = this.ctx;
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(player.rotation);

    if (this.ghostySprite && !this.useFallback) {
      ctx.drawImage(
        this.ghostySprite,
        -player.width / 2,
        -player.height / 2,
        player.width,
        player.height
      );
    } else {
      // Fallback: light cyan ghost-colored rectangle
      ctx.fillStyle = '#a0f0f0';
      ctx.fillRect(
        -player.width / 2,
        -player.height / 2,
        player.width,
        player.height
      );
      // Add a simple border
      ctx.strokeStyle = '#60c0c0';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        -player.width / 2,
        -player.height / 2,
        player.width,
        player.height
      );
    }

    ctx.restore();
  }

  /**
   * Draw semi-transparent cloud layers for parallax background depth.
   * Each cloud is rendered as a series of overlapping ellipses to create a fluffy shape.
   * Layer opacity is applied via globalAlpha for depth effect.
   * @param {Array<{speed: number, opacity: number, clouds: Array<{x: number, y: number, width: number, height: number}>}>} layers
   */
  drawClouds(layers) {
    const ctx = this.ctx;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      ctx.globalAlpha = layer.opacity;
      ctx.fillStyle = '#ffffff';

      for (let j = 0; j < layer.clouds.length; j++) {
        const cloud = layer.clouds[j];
        const cx = cloud.x + cloud.width / 2;
        const cy = cloud.y + cloud.height / 2;
        const rw = cloud.width / 2;
        const rh = cloud.height / 2;

        ctx.beginPath();

        // Left ellipse
        ctx.ellipse(
          cx - rw * 0.5,
          cy,
          rw * 0.4,
          rh * 0.7,
          0, 0, Math.PI * 2
        );

        // Center ellipse (larger, slightly raised)
        ctx.ellipse(
          cx,
          cy - rh * 0.15,
          rw * 0.55,
          rh * 0.9,
          0, 0, Math.PI * 2
        );

        // Right ellipse
        ctx.ellipse(
          cx + rw * 0.5,
          cy,
          rw * 0.4,
          rh * 0.7,
          0, 0, Math.PI * 2
        );

        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
    }
  }

  /**
   * Draw all pipe obstacles with retro pixel-art style.
   * Each pipe has a body and a wider cap at the opening.
   * @param {Array<{x: number, gapY: number, scored: boolean}>} pipes
   */
  drawPipes(pipes) {
    const ctx = this.ctx;
    const PIPE_WIDTH = 52;  // ObstacleManager.PIPE_WIDTH
    const GAP_SIZE = 130;   // ObstacleManager.GAP_SIZE
    const CAP_HEIGHT = 20;
    const CAP_OVERHANG = 4;

    for (let i = 0; i < pipes.length; i++) {
      const pipe = pipes[i];
      const topPipeBottom = pipe.gapY - GAP_SIZE / 2;
      const bottomPipeTop = pipe.gapY + GAP_SIZE / 2;

      // --- Top pipe body ---
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, topPipeBottom - CAP_HEIGHT);

      // Top pipe cap (wider, with gradient for depth)
      const topCapGrad = ctx.createLinearGradient(pipe.x - CAP_OVERHANG, 0, pipe.x + PIPE_WIDTH + CAP_OVERHANG, 0);
      topCapGrad.addColorStop(0, '#1b4332');
      topCapGrad.addColorStop(0.15, '#2d6a4f');
      topCapGrad.addColorStop(0.85, '#2d6a4f');
      topCapGrad.addColorStop(1, '#1b4332');
      ctx.fillStyle = topCapGrad;
      ctx.fillRect(
        pipe.x - CAP_OVERHANG,
        topPipeBottom - CAP_HEIGHT,
        PIPE_WIDTH + CAP_OVERHANG * 2,
        CAP_HEIGHT
      );

      // Top pipe dark left edge
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(pipe.x, 0, 3, topPipeBottom - CAP_HEIGHT);
      ctx.fillRect(pipe.x - CAP_OVERHANG, topPipeBottom - CAP_HEIGHT, 3, CAP_HEIGHT);

      // Top pipe dark right edge
      ctx.fillRect(pipe.x + PIPE_WIDTH - 3, 0, 3, topPipeBottom - CAP_HEIGHT);
      ctx.fillRect(
        pipe.x + PIPE_WIDTH + CAP_OVERHANG - 3,
        topPipeBottom - CAP_HEIGHT,
        3,
        CAP_HEIGHT
      );

      // Top pipe highlight (lighter stripe)
      ctx.fillStyle = '#40916c';
      ctx.fillRect(pipe.x + 5, 0, 4, topPipeBottom - CAP_HEIGHT);
      ctx.fillRect(pipe.x - CAP_OVERHANG + 5, topPipeBottom - CAP_HEIGHT, 4, CAP_HEIGHT);

      // --- Bottom pipe body ---
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(pipe.x, bottomPipeTop + CAP_HEIGHT, PIPE_WIDTH, this.height - bottomPipeTop - CAP_HEIGHT);

      // Bottom pipe cap (wider, with gradient for depth)
      const botCapGrad = ctx.createLinearGradient(pipe.x - CAP_OVERHANG, 0, pipe.x + PIPE_WIDTH + CAP_OVERHANG, 0);
      botCapGrad.addColorStop(0, '#1b4332');
      botCapGrad.addColorStop(0.15, '#2d6a4f');
      botCapGrad.addColorStop(0.85, '#2d6a4f');
      botCapGrad.addColorStop(1, '#1b4332');
      ctx.fillStyle = botCapGrad;
      ctx.fillRect(
        pipe.x - CAP_OVERHANG,
        bottomPipeTop,
        PIPE_WIDTH + CAP_OVERHANG * 2,
        CAP_HEIGHT
      );

      // Bottom pipe dark left edge
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(pipe.x, bottomPipeTop + CAP_HEIGHT, 3, this.height - bottomPipeTop - CAP_HEIGHT);
      ctx.fillRect(pipe.x - CAP_OVERHANG, bottomPipeTop, 3, CAP_HEIGHT);

      // Bottom pipe dark right edge
      ctx.fillRect(
        pipe.x + PIPE_WIDTH - 3,
        bottomPipeTop + CAP_HEIGHT,
        3,
        this.height - bottomPipeTop - CAP_HEIGHT
      );
      ctx.fillRect(
        pipe.x + PIPE_WIDTH + CAP_OVERHANG - 3,
        bottomPipeTop,
        3,
        CAP_HEIGHT
      );

      // Bottom pipe highlight (lighter stripe)
      ctx.fillStyle = '#40916c';
      ctx.fillRect(pipe.x + 5, bottomPipeTop + CAP_HEIGHT, 4, this.height - bottomPipeTop - CAP_HEIGHT);
      ctx.fillRect(pipe.x - CAP_OVERHANG + 5, bottomPipeTop, 4, CAP_HEIGHT);
    }
  }

  /**
   * Draw the current score centered near the top of the screen.
   * Uses a large retro-style font with dark shadow for readability.
   * @param {number} score
   */
  drawScore(score) {
    const ctx = this.ctx;
    const text = String(score);
    const x = this.width / 2;
    const y = 60;

    ctx.font = '32px "Press Start 2P", "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Dark shadow
    ctx.fillStyle = '#000000';
    ctx.fillText(text, x + 3, y + 3);

    // White text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y);
  }

  /**
   * Draw the start screen with title, instructions, and ghosty sprite.
   */
  drawStartScreen() {
    const ctx = this.ctx;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Game title
    ctx.font = '24px "Press Start 2P", "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title shadow
    ctx.fillStyle = '#000000';
    ctx.fillText('FLAPPY KIRO', this.width / 2 + 3, this.height * 0.3 + 3);

    // Title text
    ctx.fillStyle = '#ffffff';
    ctx.fillText('FLAPPY KIRO', this.width / 2, this.height * 0.3);

    // Draw ghosty sprite or fallback in center
    const spriteSize = 48;
    const spriteX = this.width / 2 - spriteSize / 2;
    const spriteY = this.height * 0.45 - spriteSize / 2;

    if (this.ghostySprite && !this.useFallback) {
      ctx.drawImage(this.ghostySprite, spriteX, spriteY, spriteSize, spriteSize);
    } else {
      ctx.fillStyle = '#a0f0f0';
      ctx.fillRect(spriteX, spriteY, spriteSize, spriteSize);
      ctx.strokeStyle = '#60c0c0';
      ctx.lineWidth = 2;
      ctx.strokeRect(spriteX, spriteY, spriteSize, spriteSize);
    }

    // Instruction text
    ctx.font = '10px "Press Start 2P", "Courier New", monospace';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('Click, Tap, or Press Space to Start', this.width / 2, this.height * 0.65);
  }

  /**
   * Draw the game over screen with scores and restart instruction.
   * @param {number} score - Final score
   * @param {number} highScore - All-time high score
   * @param {boolean} isNewHigh - Whether this is a new high score
   */
  drawGameOverScreen(score, highScore, isNewHigh) {
    const ctx = this.ctx;

    // Semi-transparent dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // "GAME OVER" title
    ctx.font = '24px "Press Start 2P", "Courier New", monospace';

    // Shadow
    ctx.fillStyle = '#000000';
    ctx.fillText('GAME OVER', this.width / 2 + 3, this.height * 0.25 + 3);

    // Text
    ctx.fillStyle = '#ff4444';
    ctx.fillText('GAME OVER', this.width / 2, this.height * 0.25);

    // Score
    ctx.font = '14px "Press Start 2P", "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Score: ' + score, this.width / 2, this.height * 0.4);

    // High score
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('Best: ' + highScore, this.width / 2, this.height * 0.48);

    // New high score indicator
    if (isNewHigh) {
      ctx.font = '12px "Press Start 2P", "Courier New", monospace';
      ctx.fillStyle = '#ff0';
      ctx.fillText('NEW HIGH SCORE!', this.width / 2, this.height * 0.58);
    }

    // Restart instruction
    ctx.font = '10px "Press Start 2P", "Courier New", monospace';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('Click to Play Again', this.width / 2, this.height * 0.72);
  }
}
