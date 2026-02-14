export const GAME_CONFIG = {
  world: {
    width: 3200,
    height: 2400,
  },
  player: {
    maxHealth: 100,
    speed: 200,
    invulnerabilityMs: 500,
    pickupRadius: 80,
    startX: 1600,
    startY: 1200,
    healthRegenPerSecond: 0,
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
