import { GAME_CONFIG } from '../config/GameConfig';
import { ENEMY_SPAWN_TABLES, ENEMY_TYPES } from '../config/EnemyConfig';

export default class WaveManager {
  constructor(scene, enemyPool, enemyGroup, target) {
    this.scene = scene;
    this.enemyPool = enemyPool;
    this.enemyGroup = enemyGroup;
    this.target = target;

    this.elapsedSeconds = 0;
    this.spawnAccumulator = 0;

    this.burstRemaining = 0;
    this.burstTimerMs = 0;
  }

  update(_time, delta) {
    this.elapsedSeconds += delta / 1000;

    if (this.burstRemaining > 0) {
      this.burstTimerMs -= delta;
      while (this.burstRemaining > 0 && this.burstTimerMs <= 0) {
        this.spawnEnemy();
        this.burstRemaining -= 1;
        this.burstTimerMs += GAME_CONFIG.enemies.spawn.burstIntervalMs;
      }
      return;
    }

    const spawnRatePerSecond = GAME_CONFIG.enemies.spawn.baseRatePerSecond +
      ((this.elapsedSeconds / 10) * GAME_CONFIG.enemies.spawn.increasePer10Seconds);

    this.spawnAccumulator += (delta / 1000) * spawnRatePerSecond;

    if (this.spawnAccumulator < 1) return;
    this.spawnAccumulator -= 1;

    this.burstRemaining = Phaser.Math.Between(
      GAME_CONFIG.enemies.spawn.burstMin,
      GAME_CONFIG.enemies.spawn.burstMax,
    );
    this.burstTimerMs = 0;
  }

  spawnEnemy() {
    if (this.enemyPool.activeCount >= GAME_CONFIG.enemies.maxAlive) {
      this.burstRemaining = 0;
      return;
    }

    const enemyType = this.getScaledEnemyStats(this.pickEnemyType());
    const spawnPoint = this.getSpawnPoint();

    const enemy = this.enemyPool.acquire();
    enemy.setPosition(spawnPoint.x, spawnPoint.y);
    enemy.configure(enemyType);

    if (enemyType.isElite) {
      enemy.setScale(GAME_CONFIG.enemies.scaling.eliteSizeMultiplier);
      enemy.setTint(0xffe599);
      enemy.setData('baseTint', enemyType.color);
      this.scene.tweens.add({
        targets: enemy,
        alpha: 0.75,
        duration: 350,
        yoyo: true,
        repeat: -1,
      });
      enemy.once('destroy', () => this.scene.tweens.killTweensOf(enemy));
    }

    this.enemyGroup.add(enemy);
  }

  getScaledEnemyStats(typeStats) {
    const minutes = this.elapsedSeconds / 60;
    const scaling = GAME_CONFIG.enemies.scaling;
    const hpMult = 1 + (minutes * scaling.hpPerMinute);
    const speedMult = 1 + Math.min(scaling.speedCap, minutes * scaling.speedPerMinute);
    const damageMult = 1 + (minutes * scaling.damagePerMinute);

    const scaled = {
      ...typeStats,
      hp: Math.ceil(typeStats.hp * hpMult),
      speed: typeStats.speed * speedMult,
      damage: Math.ceil(typeStats.damage * damageMult),
    };

    if (this.elapsedSeconds >= scaling.eliteStartSeconds && Math.random() < scaling.eliteChance) {
      scaled.isElite = true;
      scaled.hp = Math.ceil(scaled.hp * scaling.eliteHpMultiplier);
      scaled.damage = Math.ceil(scaled.damage * scaling.eliteDamageMultiplier);
      scaled.xp = Math.ceil(typeStats.xp * 2);
    }

    return scaled;
  }

  pickEnemyType() {
    if (this.elapsedSeconds >= 180) {
      const progression = Math.min(1, (this.elapsedSeconds - 180) / 180);
      const skeleton = Phaser.Math.Linear(0.32, 0.2, progression);
      const bat = Phaser.Math.Linear(0.22, 0.2, progression);
      const ghost = 0.15;
      const knight = Phaser.Math.Linear(0.2, 0.3, progression);
      const wraith = Phaser.Math.Linear(0.11, 0.15, progression);
      return this.weightedPick({ skeleton, bat, ghost, knight, wraith });
    }

    const table = ENEMY_SPAWN_TABLES.find((entry) => this.elapsedSeconds < entry.untilSeconds) ?? ENEMY_SPAWN_TABLES[0];
    return this.weightedPick(table.weights);
  }

  weightedPick(weightMap) {
    const total = Object.values(weightMap).reduce((sum, weight) => sum + weight, 0);
    let roll = Math.random() * total;

    const entries = Object.entries(weightMap);
    for (let i = 0; i < entries.length; i += 1) {
      const [enemyKey, weight] = entries[i];
      roll -= weight;
      if (roll <= 0) {
        return ENEMY_TYPES[enemyKey];
      }
    }

    return ENEMY_TYPES.skeleton;
  }

  getSpawnPoint() {
    const camera = this.scene.cameras.main;
    const diagonal = Math.sqrt((camera.width ** 2) + (camera.height ** 2));
    const radius = diagonal + GAME_CONFIG.enemies.spawn.spawnRadiusPadding;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);

    return {
      x: this.target.x + Math.cos(angle) * radius,
      y: this.target.y + Math.sin(angle) * radius,
    };
  }
}
