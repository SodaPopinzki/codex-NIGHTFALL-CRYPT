export const GAME_CONFIG = {
  world: {
    width: 2000,
    height: 2000,
  },
  player: {
    maxHealth: 100,
    speed: 190,
    invulnerabilityMs: 450,
    pickupRadius: 90,
    startX: 400,
    startY: 300,
  },
  enemies: {
    base: {
      hp: 10,
      speed: 60,
      damage: 8,
      xp: 1,
    },
    maxAlive: 100,
    initialSpawnIntervalMs: 1500,
    minSpawnIntervalMs: 350,
    difficultyRampPerSecond: 0.985,
  },
  xp: {
    baseThreshold: 6,
    growthFactor: 1.3,
    maxLevel: 50,
  },
  waves: {
    secondsPerWave: 30,
  },
};
