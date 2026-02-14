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
    maxAlive: 200,
    spawn: {
      baseRatePerSecond: 1,
      increasePer10Seconds: 0.1,
      burstMin: 3,
      burstMax: 8,
      burstIntervalMs: 100,
      spawnRadiusPadding: 100,
    },
  },
  xp: {
    pickupRadius: 180,
    magneticSpeed: 280,
  },
};
