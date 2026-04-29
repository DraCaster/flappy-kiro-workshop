/**
 * AudioManager class - loads and plays sound effects with overlap support.
 *
 * Preloads audio assets during initialization and provides methods to play
 * jump and game over sounds. Jump sounds are cloned before playback to allow
 * overlapping rapid-fire plays. All play() calls are wrapped in try-catch
 * to gracefully handle NotAllowedError (autoplay restrictions) and missing audio.
 */
export class AudioManager {
  constructor() {
    this.jumpSound = null;
    this.gameOverSound = null;
  }

  /**
   * Preload audio assets (jump.wav and game_over.wav).
   * Uses Promise.allSettled so partial failures don't block initialization.
   * @returns {Promise<void>}
   */
  async init() {
    const loadAudio = (src) => {
      return new Promise((resolve, reject) => {
        const audio = new Audio(src);
        audio.oncanplaythrough = () => resolve(audio);
        audio.onerror = () => reject(new Error(`Failed to load audio: ${src}`));
      });
    };

    const results = await Promise.allSettled([
      loadAudio('assets/jump.wav'),
      loadAudio('assets/game_over.wav'),
    ]);

    if (results[0].status === 'fulfilled') {
      this.jumpSound = results[0].value;
    }

    if (results[1].status === 'fulfilled') {
      this.gameOverSound = results[1].value;
    }
  }

  /**
   * Play the jump sound effect.
   * Clones the audio element before playing to support overlapping sounds.
   * Silently handles errors (NotAllowedError, missing audio).
   */
  playJump() {
    try {
      if (!this.jumpSound) return;
      const clone = this.jumpSound.cloneNode();
      clone.play();
    } catch {
      // Silently ignore — audio may be blocked by browser autoplay policy
    }
  }

  /**
   * Play the game over sound effect.
   * Resets currentTime to 0 before playing to allow replaying immediately.
   * Silently handles errors (NotAllowedError, missing audio).
   */
  playGameOver() {
    try {
      if (!this.gameOverSound) return;
      this.gameOverSound.currentTime = 0;
      this.gameOverSound.play();
    } catch {
      // Silently ignore — audio may be blocked by browser autoplay policy
    }
  }
}
