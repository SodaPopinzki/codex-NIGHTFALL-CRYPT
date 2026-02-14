import { GAME_CONFIG } from '../config/GameConfig';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);

    this.maxHealth = GAME_CONFIG.player.maxHealth;
    this.health = this.maxHealth;
    this.speed = GAME_CONFIG.player.speed;
    this.invulnerabilityMs = GAME_CONFIG.player.invulnerabilityMs;
    this.pickupRadius = GAME_CONFIG.player.pickupRadius;
    this.lastHitTime = -Infinity;
  }

  takeDamage(amount) {
    const now = this.scene.time.now;
    if (now - this.lastHitTime < this.invulnerabilityMs) {
      return false;
    }

    this.lastHitTime = now;
    this.health = Phaser.Math.Clamp(this.health - amount, 0, this.maxHealth);
    return true;
  }

  get isDead() {
    return this.health <= 0;
  }
}
