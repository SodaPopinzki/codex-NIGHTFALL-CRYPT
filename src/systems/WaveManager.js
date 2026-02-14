import { GAME_CONFIG } from '../config/GameConfig';

export default class WaveManager {
  constructor(scene, enemyPool, enemyGroup, target) {
    this.scene = scene;
    this.enemyPool = enemyPool;
    this.enemyGroup = enemyGroup;
    this.target = target;

    this.elapsedSeconds = 0;
    this.spawnIntervalMs = GAME_CONFIG.enemies.initialSpawnIntervalMs;
    this.spawnTimer = 0;
    this.wave = 1;
  }

  update(time, delta) {
    this.elapsedSeconds += delta / 1000;
    this.wave = Math.floor(this.elapsedSeconds / GAME_CONFIG.waves.secondsPerWave) + 1;
    this.spawnIntervalMs = Math.max(
      GAME_CONFIG.enemies.minSpawnIntervalMs,
      GAME_CONFIG.enemies.initialSpawnIntervalMs *
        Math.pow(GAME_CONFIG.enemies.difficultyRampPerSecond, this.elapsedSeconds),
    );

    this.spawnTimer += delta;
    if (this.spawnTimer < this.spawnIntervalMs) return;
    this.spawnTimer = 0;

    if (this.enemyPool.activeCount >= GAME_CONFIG.enemies.maxAlive) return;
    this.spawnEnemy(time);
  }

  spawnEnemy() {
    const spawnPoint = this.getSpawnPoint();
    const enemy = this.enemyPool.acquire();
    enemy.setPosition(spawnPoint.x, spawnPoint.y);
    enemy.configure(GAME_CONFIG.enemies.base);
    this.enemyGroup.add(enemy);
  }

  getSpawnPoint() {
    const camera = this.scene.cameras.main;
    const padding = 30;
    const edge = Phaser.Math.Between(0, 3);

    if (edge === 0) return { x: camera.worldView.x - padding, y: Phaser.Math.Between(camera.worldView.y, camera.worldView.bottom) };
    if (edge === 1) return { x: camera.worldView.right + padding, y: Phaser.Math.Between(camera.worldView.y, camera.worldView.bottom) };
    if (edge === 2) return { x: Phaser.Math.Between(camera.worldView.x, camera.worldView.right), y: camera.worldView.y - padding };
    return { x: Phaser.Math.Between(camera.worldView.x, camera.worldView.right), y: camera.worldView.bottom + padding };
  }
}
