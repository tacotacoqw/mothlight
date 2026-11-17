// The bestiary of the gloom: one row per creature, read by enemies.js, the sprite painter
// and the HUD's "incoming" list. `wilt` is how fast it withers flowers it passes.

export const ENEMY_TYPES = {
  wisp: {
    title: 'Gloomling', trait: 'swarms you', hp: 2, speed: 78, radius: 15, score: 20, sparks: 2, armor: 0, wilt: 1, brain: 'chase',
  },
  darter: {
    title: 'Dart Shade', trait: 'coils, then lunges', hp: 1.6, speed: 96, radius: 13, score: 35, sparks: 2, armor: 0, wilt: 1, brain: 'lunge',
  },
  spitter: {
    title: 'Ink Spitter', trait: 'spits ink: pop it', hp: 3, speed: 70, radius: 17, score: 45, sparks: 3, armor: 0, wilt: 1, brain: 'spit',
  },
  husk: {
    title: 'Husk', trait: 'armoured: swing fast', hp: 7, speed: 44, radius: 24, score: 80, sparks: 5, armor: 0.95, wilt: 1.5, brain: 'chase',
  },
  twin: {
    title: 'Twinshade', trait: 'splits in two', hp: 4, speed: 72, radius: 20, score: 50, sparks: 3, armor: 0, wilt: 1, brain: 'chase', splitsInto: 'wisp',
  },
  wilter: {
    title: 'Wiltwing', trait: 'eats your blooms', hp: 2, speed: 135, radius: 12, score: 60, sparks: 4, armor: 0, wilt: 5, brain: 'wilt',
  },
  eclipse: {
    title: 'The Eclipse', trait: 'boss: rings, charges', hp: 95, speed: 36, radius: 62, score: 2000, sparks: 30, armor: 0, wilt: 2, brain: 'eclipse',
  },
};
