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
    this.cameras.main.setBackgroundColor('#09060d');
    this.physics.world.setBounds(0, 0, GAME_CONFIG.world.width, GAME_CONFIG.world.height);

    this.player = new Player(this, GAME_CONFIG.player.startX, GAME_CONFIG.player.startY);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.enemyPool = new ObjectPool(
      () => new Enemy(this, -999, -999),
      (enemy) => enemy.deactivate(),
    );
    this.enemies = this.physics.add.group({ runChildUpdate: false });

    this.waveManager = new WaveManager(this, this.enemyPool, this.enemies, this.player);
    this.xpManager = new XPManager(this);
    this.hud = new HUD(this);
    this.joystick = new VirtualJoystick(this);

    this.kills = 0;
    this.elapsedSeconds = 0;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    this.physics.add.overlap(this.player, this.enemies, (_, enemy) => {
      const gotHit = this.player.takeDamage(enemy.damage);
      if (gotHit) this.hud.updateHealth(this.player.health, this.player.maxHealth);
      if (this.player.isDead) this.scene.start('GameOverScene', { time: this.elapsedSeconds, kills: this.kills });
    });

    this.events.on('levelup', () => this.scene.launch('LevelUpScene'));
    this.events.on('xpchange', ({ level, xp, threshold }) => this.hud.updateXp(level, xp, threshold));

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene');
    });
  }

  update(time, delta) {
    this.elapsedSeconds += delta / 1000;
    this.hud.updateTimer(this.elapsedSeconds);

    this.waveManager.update(time, delta);

    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;
      enemy.chase(this.player);
    });

    this.updateMovement();
  }

  updateMovement() {
    const keyboardX = (this.cursors.right.isDown || this.wasd.D.isDown ? 1 : 0) -
      (this.cursors.left.isDown || this.wasd.A.isDown ? 1 : 0);
    const keyboardY = (this.cursors.down.isDown || this.wasd.S.isDown ? 1 : 0) -
      (this.cursors.up.isDown || this.wasd.W.isDown ? 1 : 0);

    const joystickVector = this.joystick.getVector();
    const movement = new Phaser.Math.Vector2(keyboardX + joystickVector.x, keyboardY + joystickVector.y).normalize();

    this.player.setVelocity(movement.x * this.player.speed, movement.y * this.player.speed);
  }
}
