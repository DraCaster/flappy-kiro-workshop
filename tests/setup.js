import { vi } from 'vitest';

// --- Canvas 2D Context Mock ---
const createCanvasContext2DMock = () => ({
  // Drawing rectangles
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  strokeRect: vi.fn(),

  // Drawing text
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),

  // Paths
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  arcTo: vi.fn(),
  rect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  clip: vi.fn(),

  // Transformations
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),

  // Images
  drawImage: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: vi.fn(),

  // Gradients and patterns
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createPattern: vi.fn(),

  // Pixel manipulation
  createConicGradient: vi.fn(),

  // Style properties
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  globalAlpha: 1.0,
  globalCompositeOperation: 'source-over',
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,

  // Canvas reference
  canvas: {
    width: 400,
    height: 600,
  },
});

// --- HTMLCanvasElement mock ---
globalThis.HTMLCanvasElement = class HTMLCanvasElement {
  constructor() {
    this.width = 400;
    this.height = 600;
    this.style = {};
    this._context2d = createCanvasContext2DMock();
  }

  getContext(type) {
    if (type === '2d') {
      return this._context2d;
    }
    return null;
  }

  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  getBoundingClientRect = vi.fn(() => ({
    top: 0,
    left: 0,
    width: 400,
    height: 600,
  }));
};

// --- HTMLImageElement mock ---
globalThis.HTMLImageElement = class HTMLImageElement {
  constructor() {
    this.src = '';
    this.width = 0;
    this.height = 0;
    this.complete = false;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    this._onload = null;
    this._onerror = null;
  }

  get onload() {
    return this._onload;
  }

  set onload(fn) {
    this._onload = fn;
    // Simulate async image load success
    if (fn) {
      setTimeout(() => {
        this.complete = true;
        this.naturalWidth = 32;
        this.naturalHeight = 32;
        fn();
      }, 0);
    }
  }

  get onerror() {
    return this._onerror;
  }

  set onerror(fn) {
    this._onerror = fn;
  }

  addEventListener = vi.fn();
  removeEventListener = vi.fn();
};

globalThis.Image = globalThis.HTMLImageElement;

// --- HTMLAudioElement mock ---
globalThis.HTMLAudioElement = class HTMLAudioElement {
  constructor(src) {
    this.src = src || '';
    this.volume = 1;
    this.currentTime = 0;
    this.paused = true;
    this.muted = false;
    this.loop = false;
    this.duration = 0;
    this._oncanplaythrough = null;
    this._onerror = null;
  }

  play = vi.fn(() => {
    this.paused = false;
    return Promise.resolve();
  });

  pause = vi.fn(() => {
    this.paused = true;
  });

  cloneNode = vi.fn(() => {
    const clone = new HTMLAudioElement(this.src);
    clone.volume = this.volume;
    return clone;
  });

  load = vi.fn();

  get oncanplaythrough() {
    return this._oncanplaythrough;
  }

  set oncanplaythrough(fn) {
    this._oncanplaythrough = fn;
    if (fn) {
      setTimeout(() => fn(), 0);
    }
  }

  get onerror() {
    return this._onerror;
  }

  set onerror(fn) {
    this._onerror = fn;
  }

  addEventListener = vi.fn();
  removeEventListener = vi.fn();
};

globalThis.Audio = globalThis.HTMLAudioElement;

// --- localStorage mock ---
const localStorageStore = new Map();

globalThis.localStorage = {
  getItem: vi.fn((key) => {
    return localStorageStore.has(key) ? localStorageStore.get(key) : null;
  }),
  setItem: vi.fn((key, value) => {
    localStorageStore.set(key, String(value));
  }),
  removeItem: vi.fn((key) => {
    localStorageStore.delete(key);
  }),
  clear: vi.fn(() => {
    localStorageStore.clear();
  }),
  get length() {
    return localStorageStore.size;
  },
  key: vi.fn((index) => {
    return [...localStorageStore.keys()][index] || null;
  }),
};

// --- document.addEventListener mock ---
if (typeof document === 'undefined') {
  globalThis.document = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    createElement: vi.fn((tag) => {
      if (tag === 'canvas') return new HTMLCanvasElement();
      if (tag === 'img') return new HTMLImageElement();
      if (tag === 'audio') return new HTMLAudioElement();
      return {};
    }),
    getElementById: vi.fn(() => new HTMLCanvasElement()),
    hidden: false,
    visibilityState: 'visible',
  };
}

// --- requestAnimationFrame mock ---
globalThis.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(() => callback(performance.now()), 16);
});

globalThis.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

// --- window mock additions ---
if (typeof window === 'undefined') {
  globalThis.window = globalThis;
}

globalThis.window.addEventListener = globalThis.window.addEventListener || vi.fn();
globalThis.window.removeEventListener = globalThis.window.removeEventListener || vi.fn();
globalThis.window.innerWidth = 400;
globalThis.window.innerHeight = 600;
