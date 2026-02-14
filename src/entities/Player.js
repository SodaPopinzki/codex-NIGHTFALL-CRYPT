import { GAME_CONFIG } from '../config/GameConfig';

const PLAYER_TEXTURE_KEY = 'player-placeholder';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    Player.ensureTexture(scene);
    super(scene, x, y, PLAYER_TEXTURE_KEY);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);

    this.maxHealth = GAME_CONFIG.player.maxHealth;
    this.health = this.maxHealth;
    this.speed = GAME_CONFIG.player.speed;
    this.invulnerabilityMs = GAME_CONFIG.player.invulnerabilityMs;
    this.pickupRadius = GAME_CONFIG.player.pickupRadius;
    this.healthRegenPerSecond = GAME_CONFIG.player.healthRegenPerSecond;

    this.lastHitTime = -Infinity;
    this.lastMoveDirection = new Phaser.Math.Vector2(1, 0);
    this.targetVelocity = new Phaser.Math.Vector2(0, 0);
    this.currentVelocity = new Phaser.Math.Vector2(0, 0);
    this.flashEvent = null;
    this.afterimages = [];
    this.nextAfterimageAt = 0;

    for (let i = 0; i < 3; i += 1) {
      const trail = scene.add.image(this.x, this.y, PLAYER_TEXTURE_KEY)
        .setAlpha(0)
        .setDepth(this.depth - 1)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      this.afterimages.push(trail);
    }
  }

  static ensureTexture(scene) {
    if (scene.textures.exists(PLAYER_TEXTURE_KEY)) return;

    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 24, 24);
    graphics.lineStyle(2, 0xff2f2f, 1);
    graphics.strokeRect(1, 1, 22, 22);
    graphics.generateTexture(PLAYER_TEXTURE_KEY, 24, 24);
    graphics.destroy();
  }

  updateMovement(keyboardVector, joystickVector, delta) {
    const combined = new Phaser.Math.Vector2(
      keyboardVector.x + joystickVector.x,
      keyboardVector.y + joystickVector.y,
    );

    if (combined.lengthSq() > 0) {
      combined.normalize();
      this.lastMoveDirection.copy(combined);
    }

    this.targetVelocity.copy(combined).scale(this.speed);
    const smoothingFactor = Math.min(1, delta / 70);
    this.currentVelocity.lerp(this.targetVelocity, smoothingFactor);
    this.setVelocity(this.currentVelocity.x, this.currentVelocity.y);
  }

  update(delta) {
    if (this.healthRegenPerSecond <= 0 || this.health >= this.maxHealth) return;
    const regenAmount = this.healthRegenPerSecond * (delta / 1000);
    this.health = Phaser.Math.Clamp(this.health + regenAmount, 0, this.maxHealth);
  }

  updateTrail() {
    if (this.body.velocity.lengthSq() < 400 || this.scene.time.now < this.nextAfterimageAt) return;

    this.nextAfterimageAt = this.scene.time.now + 50;
    const trail = this.afterimages.shift();
    trail
      .setPosition(this.x, this.y)
      .setDisplaySize(this.displayWidth, this.displayHeight)
      .setTint(0xc2d8ff)
      .setAlpha(0.18)
      .setVisible(true);
    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      duration: 180,
      onComplete: () => trail.setVisible(false).clearTint(),
    });
    this.afterimages.push(trail);
  }

  takeDamage(amount) {
    const now = this.scene.time.now;
    if (now - this.lastHitTime < this.invulnerabilityMs) {
      return false;
    }

    this.lastHitTime = now;
    this.health = Phaser.Math.Clamp(this.health - amount, 0, this.maxHealth);
    this.flashDamage();
    return true;
  }

  flashDamage() {
    this.setTint(0xff3f3f);
    if (this.flashEvent) {
      this.flashEvent.remove(false);
    }

    this.flashEvent = this.scene.time.delayedCall(100, () => {
      this.clearTint();
      this.flashEvent = null;
    });
  }

  get isDead() {
    return this.health <= 0;
  }
}
