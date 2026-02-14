import { GAME_CONFIG } from '../config/GameConfig';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import ObjectPool from '../utils/ObjectPool';
import WaveManager from '../systems/WaveManager';
import XPManager from '../systems/XPManager';
import HUD from '../ui/HUD';
import VirtualJoystick from '../ui/VirtualJoystick';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.physics.world.setBounds(0, 0, GAME_CONFIG.world.width, GAME_CONFIG.world.height);
    this.drawBackgroundTiles();

    this.player = new Player(this, GAME_CONFIG.player.startX, GAME_CONFIG.player.startY);

    this.cameras.main.setBounds(0, 0, GAME_CONFIG.world.width, GAME_CONFIG.world.height);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(50, 50);

    this.enemyPool = new ObjectPool(
      () => {
        const enemy = new Enemy(this, -999, -999);
        enemy.setCallbacks((deadEnemy) => this.handleEnemyDeath(deadEnemy), (deadEnemy) => this.enemyPool.release(deadEnemy));
        return enemy;
      },
      (enemy) => enemy.deactivate(),
    );
    this.enemies = this.physics.add.group({ runChildUpdate: false });

    this.waveManager = new WaveManager(this, this.enemyPool, this.enemies, this.player);
    this.xpManager = new XPManager(this, this.player);
    this.hud = new HUD(this);
    this.joystick = new VirtualJoystick(this);

    this.kills = 0;
    this.elapsedSeconds = 0;

    this.hud.updateHealth(this.player.health, this.player.maxHealth);
    this.hud.updateXp(this.xpManager.level, this.xpManager.currentXp, this.xpManager.threshold);
    this.hud.updateKills(this.kills);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    this.physics.add.overlap(this.player, this.enemies, (_, enemy) => {
      const gotHit = this.player.takeDamage(enemy.damage);
      if (gotHit) this.hud.updateHealth(this.player.health, this.player.maxHealth);
      if (this.player.isDead) this.scene.start('GameOverScene', { time: this.elapsedSeconds, kills: this.kills });
    });

    this.events.on('xpchange', ({ level, xp, threshold }) => this.hud.updateXp(level, xp, threshold));

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene');
    });

  }

  handleEnemyDeath(enemy) {
    this.kills += 1;
    this.hud.updateKills(this.kills);
    this.xpManager.spawnGem(enemy.x, enemy.y, enemy.xpValue);
  }

  drawBackgroundTiles() {
    const tileSize = 64;
    const graphics = this.add.graphics();
    const palette = [0x121218, 0x171720, 0x1d1d26];
    const accent = 0x0a0a10;

    for (let y = 0; y < GAME_CONFIG.world.height; y += tileSize) {
      for (let x = 0; x < GAME_CONFIG.world.width; x += tileSize) {
        const checker = ((x / tileSize) + (y / tileSize)) % palette.length;
        const baseColor = palette[checker];
        const color = Math.random() < 0.08 ? accent : baseColor;

        graphics.fillStyle(color, 1);
        graphics.fillRect(x, y, tileSize, tileSize);
        graphics.lineStyle(1, 0x050507, 0.4);
        graphics.strokeRect(x, y, tileSize, tileSize);
      }
    }
  }

  update(time, delta) {
    this.elapsedSeconds += delta / 1000;
    this.hud.updateTimer(this.elapsedSeconds);
    this.player.update(delta);

    this.waveManager.update(time, delta);
    this.xpManager.update(delta);

    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;
      enemy.chase(this.player, time);
    });

    this.updateMovement(delta);
  }

  updateMovement(delta) {
    const keyboardX = (this.cursors.right.isDown || this.wasd.D.isDown ? 1 : 0) -
      (this.cursors.left.isDown || this.wasd.A.isDown ? 1 : 0);
    const keyboardY = (this.cursors.down.isDown || this.wasd.S.isDown ? 1 : 0) -
      (this.cursors.up.isDown || this.wasd.W.isDown ? 1 : 0);

    const keyboardVector = new Phaser.Math.Vector2(keyboardX, keyboardY);
    if (keyboardVector.lengthSq() > 1) {
      keyboardVector.normalize();
    }

    this.player.updateMovement(keyboardVector, this.joystick.getVector(), delta);
  }
}
