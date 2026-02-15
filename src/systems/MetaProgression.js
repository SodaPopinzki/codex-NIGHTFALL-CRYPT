import { WEAPON_CONFIG } from '../config/WeaponConfig';

const STORAGE_KEY = 'nightfall-crypt-meta-v1';

const BASE_WEAPONS = Object.keys(WEAPON_CONFIG);

const BONUS_DEFS = {
  firstBlood: {
    name: 'First Blood',
    description: 'Kill 100 enemies total: +5% starting damage.',
    isUnlocked: (meta) => meta.totalEnemiesKilled >= 100,
  },
  survivor: {
    name: 'Survivor',
    description: 'Survive 10 minutes: +10 starting HP.',
    isUnlocked: (meta) => meta.bestTimeSurvived >= 600,
  },
  collector: {
    name: 'Collector',
    description: 'Discover all 8 base weapons: +15% pickup radius.',
    isUnlocked: (meta) => BASE_WEAPONS.every((weaponId) => meta.weaponsDiscovered.includes(weaponId)),
  },
  alchemist: {
    name: 'Alchemist',
    description: 'Perform any evolution: start with a random weapon at level 2.',
    isUnlocked: (meta) => meta.evolutionsDiscovered.length > 0,
  },
  cryptMaster: {
    name: 'Crypt Master',
    description: 'Survive 30 minutes: unlock Hard Mode (+50% enemy stats).',
    isUnlocked: (meta) => meta.bestTimeSurvived >= 1800,
  },
};

function createDefaultMeta() {
  return {
    weaponsDiscovered: [],
    evolutionsDiscovered: [],
    bestTimeSurvived: 0,
    mostEnemiesKilled: 0,
    mostWeaponsEvolved: 0,
    totalRunsPlayed: 0,
    totalEnemiesKilled: 0,
  };
}

function save(meta) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch (_error) {
    // Some browsers/privacy modes block persistent storage.
    // Failing silently keeps gameplay running without meta-progression persistence.
  }
}

export function loadMetaProgression() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultMeta();
    return { ...createDefaultMeta(), ...JSON.parse(raw) };
  } catch (_error) {
    return createDefaultMeta();
  }
}

export function getBonusDefinitions() {
  return BONUS_DEFS;
}

export function getUnlockedBonuses(meta) {
  return Object.entries(BONUS_DEFS)
    .filter(([, def]) => def.isUnlocked(meta))
    .map(([id, def]) => ({ id, ...def }));
}

export function discoverWeapon(weaponId) {
  const meta = loadMetaProgression();
  if (!meta.weaponsDiscovered.includes(weaponId)) {
    meta.weaponsDiscovered.push(weaponId);
    save(meta);
  }
  return meta;
}

export function discoverEvolution(evolutionId) {
  const meta = loadMetaProgression();
  if (!meta.evolutionsDiscovered.includes(evolutionId)) {
    meta.evolutionsDiscovered.push(evolutionId);
    save(meta);
  }
  return meta;
}

export function recordRunStats({ timeSurvived = 0, kills = 0, weaponsEvolved = 0 }) {
  const meta = loadMetaProgression();
  meta.totalRunsPlayed += 1;
  meta.totalEnemiesKilled += kills;
  meta.bestTimeSurvived = Math.max(meta.bestTimeSurvived, Math.floor(timeSurvived));
  meta.mostEnemiesKilled = Math.max(meta.mostEnemiesKilled, kills);
  meta.mostWeaponsEvolved = Math.max(meta.mostWeaponsEvolved, weaponsEvolved);
  save(meta);
  return meta;
}
