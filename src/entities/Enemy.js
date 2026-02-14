export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'enemy');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setCircle(9);

    this.typeKey = 'skeleton';
    this.hp = 1;
    this.maxHp = 1;
    this.speed = 0;
    this.damage = 0;
    this.xpValue = 0;
    this.knockbackResist = 0;

    this.damageMultiplier = 1;
    this.erraticAmplitude = 0;
    this.teleportCooldownMs = 0;
    this.teleportRange = { min: 0, max: 0 };
    this.nextTeleportAt = 0;
    this.erraticSeed = Math.random() * Math.PI * 2;

    this.baseTint = 0xffffff;
    this.flashEvent = null;
    this.isDying = false;
    this.onDeathCallback = null;
    this.onReleaseCallback = null;
  }

  setCallbacks(onDeathCallback, onReleaseCallback) {
    this.onDeathCallback = onDeathCallback;
    this.onReleaseCallback = onReleaseCallback;
  }

  configure(typeStats) {
    this.typeKey = typeStats.key;
    this.hp = typeStats.hp;
    this.maxHp = typeStats.hp;
    this.speed = typeStats.speed;
    this.damage = typeStats.damage;
    this.xpValue = typeStats.xp;
    this.knockbackResist = typeStats.knockbackResist ?? 0;

    this.damageMultiplier = typeStats.damageMultiplier ?? 1;
    this.erraticAmplitude = typeStats.erraticAmplitude ?? 0;
    this.teleportCooldownMs = typeStats.teleportCooldownMs ?? 0;
    this.teleportRange = typeStats.teleportRange ?? { min: 0, max: 0 };
    this.nextTeleportAt = this.scene.time.now + this.teleportCooldownMs;
    this.erraticSeed = Math.random() * Math.PI * 2;

    this.baseTint = typeStats.color ?? 0xffffff;
    this.setTint(this.baseTint);
    this.setAlpha(typeStats.alpha ?? 1);
    this.setScale(1);
    this.setActive(true).setVisible(true);
    this.body.enable = true;
    this.isDying = false;
  }

  chase(target, timeNow) {
    if (!this.active || this.isDying) return;

    if (this.teleportCooldownMs > 0 && timeNow >= this.nextTeleportAt) {
      this.teleportNear(target);
      this.nextTeleportAt = timeNow + this.teleportCooldownMs;
    }

    const toTarget = new Phaser.Math.Vector2(target.x - this.x, target.y - this.y);
    if (toTarget.lengthSq() === 0) {
      this.setVelocity(0, 0);
      return;
    }

    toTarget.normalize();

    if (this.erraticAmplitude > 0) {
      const wave = Math.sin((timeNow * 0.012) + this.erraticSeed) * this.erraticAmplitude;
      const side = new Phaser.Math.Vector2(-toTarget.y, toTarget.x).scale(wave);
      toTarget.add(side).normalize();
    }

    this.setVelocity(toTarget.x * this.speed, toTarget.y * this.speed);
  }

  teleportNear(target) {
    const distance = Phaser.Math.Between(this.teleportRange.min, this.teleportRange.max);
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.setPosition(
      target.x + Math.cos(angle) * distance,
      target.y + Math.sin(angle) * distance,
    );
  }

  takeDamage(amount) {
    if (this.isDying || !this.active) return false;

    this.hp -= amount * this.damageMultiplier;
    this.flashDamage();

    if (this.hp > 0) return false;

    this.die();
    return true;
  }

  flashDamage() {
    this.setTintFill(0xffffff);
    if (this.flashEvent) {
      this.flashEvent.remove(false);
    }

    this.flashEvent = this.scene.time.delayedCall(50, () => {
      this.setTint(this.baseTint);
      this.flashEvent = null;
    });
  }

  die() {
    if (this.isDying) return;
    this.isDying = true;
    this.body.stop();

    if (this.onDeathCallback) {
      this.onDeathCallback(this);
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 120,
      onComplete: () => {
        if (this.onReleaseCallback) this.onReleaseCallback(this);
      },
    });
  }

  deactivate() {
    if (this.flashEvent) {
      this.flashEvent.remove(false);
      this.flashEvent = null;
    }
    this.scene.tweens.killTweensOf(this);
    this.body.stop();
    this.setAlpha(1);
    this.setScale(1);
    this.clearTint();
    this.setActive(false).setVisible(false);
    this.body.enable = false;
    this.isDying = false;
  }
}
