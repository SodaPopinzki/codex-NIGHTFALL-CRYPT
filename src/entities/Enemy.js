import { GAME_CONFIG } from '../config/GameConfig';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.configure(GAME_CONFIG.enemies.base);
  }

  configure(stats) {
    this.hp = stats.hp;
    this.maxHp = stats.hp;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.xpValue = stats.xp;
    this.setActive(true).setVisible(true);
    this.body.enable = true;
  }

  chase(target) {
    this.scene.physics.moveToObject(this, target, this.speed);
  }

  takeDamage(amount) {
    this.hp -= amount;
    return this.hp <= 0;
  }

  deactivate() {
    this.body.stop();
    this.setActive(false).setVisible(false);
    this.body.enable = false;
  }
}
