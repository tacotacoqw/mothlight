// Tuning tables for Mothlight: every number the game balances on lives here.

export const VIEW = { width: 1280, height: 800 };

// The garden bed the moth, the gloom and the flowers live in (HUD sits outside it).
export const ARENA = { left: 248, top: 104, right: 1032, bottom: 728 };

export const STEP_SECONDS = 1 / 120;
export const TOTAL_WAVES = 10;

export const PALETTE = {
  skyTop: '#070d1c',
  skyBottom: '#0d1a2e',
  bed: '#0f1b30',
  bedEdge: '#243a61',
  grass: '#1c3350',
  bud: '#3a5078',
  cream: '#fff0cf',
  amber: '#ffc24b',
  ember: '#ff8a3c',
  coral: '#ff6f61',
  mint: '#7df2c2',
  sky: '#6ec6ff',
  lilac: '#c7a2ff',
  gloomBody: '#1a0f33',
  gloomRim: '#a071ff',
  gloomEye: '#ff4f7d',
  ink: '#7a4dff',
  text: '#f4f1ff',
  textDim: '#93a3c8',
  panel: 'rgba(8, 13, 30, 0.86)',
};

export const BLOOM_COLORS = [PALETTE.coral, PALETTE.amber, PALETTE.mint, PALETTE.sky, PALETTE.lilac];

export const MOTH = {
  speed: 430,
  steering: 13,
  radius: 13,
  startWings: 3,
  maxWings: 6,
  dashSpeed: 1180,
  dashSeconds: 0.16,
  dashCooldown: 1.1,
  hurtInvulnerable: 1.4,
};

export const LANTERN = {
  threadLength: 118,
  radius: 15,
  damping: 0.993,
  slackLimit: 0.7,
  minHitSpeed: 250,
  referenceSpeed: 640,
  hitCooldown: 0.22,
  speedKeptOnHit: 0.58,
};

export const FLARE = { radius: 300, damage: 6, chargePerSpark: 0.034 };

export const COMBO = { windowSeconds: 3.4, killsPerStep: 4, stepBonus: 0.5, maxMultiplier: 5 };

export const SPARK = { magnetRadius: 95, collectRadius: 24, lifeSeconds: 10, score: 5 };

export const GARDEN = { flowerCount: 120, columns: 12, lightRate: 2.2, wiltRate: 1.5, wiltReach: 44, waveBonusPerPercent: 3 };

// Letter grades for a run's score, best first.
export const GRADES = [
  { letter: 'S', score: 30000 },
  { letter: 'A', score: 18000 },
  { letter: 'B', score: 9000 },
  { letter: 'C', score: 3500 },
  { letter: 'D', score: 0 },
];
