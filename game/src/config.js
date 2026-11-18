// Starkeeper — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720, groundY: 648 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** Survive this many levels and dawn breaks: you win. */
export const LEVELS_TO_DAWN = 6;
/** Seconds of play per level. */
export const LEVEL_SECONDS = 20;

export const PLAYER = {
  radius: 20,
  /** Pixels per second at full tilt. */
  speed: 520,
  /** How quickly the drone eases toward its target velocity. */
  accel: 14,
  /** Seconds of mercy after a hit. */
  invulnerable: 1.6,
  /** Shield seconds granted by a moon shard. */
  shieldSeconds: 8,
};

export const LIVES = 3;

export const STAR = {
  radius: 13,
  points: 10,
  /** Base fall speed; grows with the level. */
  speed: 150,
  speedPerLevel: 26,
  /** Seconds between star spawns at level 1; shrinks with the level. */
  interval: 0.85,
  intervalScale: 0.9,
  minInterval: 0.34,
  /** Gentle sideways sway, pixels. */
  sway: 26,
};

export const GLARE = {
  radius: 17,
  speed: 185,
  speedPerLevel: 30,
  interval: 1.7,
  intervalScale: 0.88,
  minInterval: 0.7,
};

export const SHARD = {
  radius: 15,
  speed: 120,
  /** A moon shard drifts in about this often, in seconds. */
  interval: 11,
  intervalJitter: 5,
};

/** How many falling things can exist at once; pools are allocated at boot. */
export const POOL_SIZE = 72;

/** Combo: each star caught in a row without a miss or a hit adds this. */
export const COMBO_STEP = 1;
/** A combo is worth this many bonus points per star, times the combo count. */
export const COMBO_BONUS = 2;

export const PALETTE = {
  skyTop: ['#070b1e', '#0d1233', '#141a3d', '#1d2148', '#2a2a55', '#4a3560'],
  skyBottom: ['#131a33', '#1b2140', '#232a52', '#2e2f5e', '#463a68', '#b25a4a'],
  hillFar: '#1a2140',
  hillNear: '#10142a',
  ground: '#0b0e20',
  dome: '#232c52',
  domeLight: '#ffd97a',
  star: '#ffd94d',
  starCore: '#fff6c8',
  glare: '#ff5d8f',
  glareCore: '#ffffff',
  shard: '#7fe7ff',
  player: '#ffe9a8',
  playerGlow: '#ffb347',
  text: '#f4f1e6',
  muted: '#9aa3c7',
  panel: 'rgba(10, 14, 32, 0.72)',
};

/** One font stack for every label, so the game needs no webfont. */
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'starkeeper.best';
