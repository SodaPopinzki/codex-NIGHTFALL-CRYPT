import { GAME_CONFIG } from '../config/GameConfig';
import ObjectPool from '../utils/ObjectPool';

const GEM_TEXTURE_KEY = 'xp-gem';

class XPGem extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    super(scene, -1000, -1000, GEM_TEXTURE_KEY);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setCircle(5);

    this.value = 1;
  }

  configure(x, y, value) {
    this.value = value;
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    this.body.enable = true;
  }

  deactivate() {
    this.body.stop();
    this.setActive(false).setVisible(false);
    this.body.enable = false;
  }
}

export default class XPManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    this.level = 1;
    this.currentXp = 0;
    this.threshold = 5;

    this.pickupRadius = GAME_CONFIG.xp.pickupRadius;
    this.magneticSpeed = GAME_CONFIG.xp.magneticSpeed;

    this.ensureTexture();

    this.gems = scene.physics.add.group({ runChildUpdate: false });
    this.gemPool = new ObjectPool(
      () => new XPGem(scene),
      (gem) => gem.deactivate(),
    );

    scene.physics.add.overlap(player, this.gems, (_, gem) => this.collectGem(gem));
  }

  ensureTexture() {
    if (this.scene.textures.exists(GEM_TEXTURE_KEY)) return;

    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x4ce46d, 1);
    g.beginPath();
    g.moveTo(6, 0);
    g.lineTo(12, 6);
    g.lineTo(6, 12);
    g.lineTo(0, 6);
    g.closePath();
    g.fillPath();
    g.lineStyle(1, 0xc9ffd3, 1);
    g.strokePath();
    g.generateTexture(GEM_TEXTURE_KEY, 12, 12);
    g.destroy();
  }

  spawnGem(x, y, value = 1) {
    const gem = this.gemPool.acquire();
    gem.configure(x, y, value);
    this.gems.add(gem);
  }

  update() {
    this.gems.children.iterate((gem) => {
      if (!gem?.active) return;

      const distance = Phaser.Math.Distance.Between(gem.x, gem.y, this.player.x, this.player.y);
      if (distance > this.pickupRadius) {
        gem.body.stop();
        return;
      }

      const direction = new Phaser.Math.Vector2(this.player.x - gem.x, this.player.y - gem.y);
      if (direction.lengthSq() === 0) return;

      direction.normalize();
      gem.setVelocity(direction.x * this.magneticSpeed, direction.y * this.magneticSpeed);
    });
  }

  collectGem(gem) {
    if (!gem.active) return;

    this.addXp(gem.value);
    this.gemPool.release(gem);
  }

  addXp(amount) {
    this.currentXp += amount;

    while (this.currentXp >= this.threshold) {
      this.currentXp -= this.threshold;
      this.level += 1;
      this.threshold = this.getThresholdForLevel(this.level);
      this.scene.events.emit('levelup', this.level);
      this.triggerLevelUp();
    }

    this.scene.events.emit('xpchange', {
      level: this.level,
      xp: this.currentXp,
      threshold: this.threshold,
    });
  }

  getThresholdForLevel(level) {
    if (level === 1) return 5;
    if (level === 2) return 10;
    return 10 + (level * 5);
  }

  triggerLevelUp() {
    this.scene.scene.pause();
    if (!this.scene.scene.isActive('LevelUpScene')) {
      this.scene.scene.launch('LevelUpScene');
    }
  }
}
