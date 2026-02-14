import ObjectPool from '../utils/ObjectPool';

export default class WeaponBase {
  constructor(scene, owner, config) {
    this.scene = scene;
    this.owner = owner;

    this.cooldownMs = config.cooldownMs;
    this.damage = config.damage;
    this.projectileCount = config.projectileCount;
    this.area = config.area;
    this.speed = config.speed;
    this.durationMs = config.durationMs;
    this.pierce = config.pierce;

    this.lastFireTime = -Infinity;

    this.projectilePool = new ObjectPool(
      () => this.createProjectile(),
      (projectile) => this.resetProjectile(projectile),
    );
  }

  canFire(now) {
    return now - this.lastFireTime >= this.cooldownMs;
  }

  tryFire(now) {
    if (!this.canFire(now)) return false;
    this.lastFireTime = now;
    this.fire(now);
    return true;
  }

  acquireProjectile(x, y, width, height, color, alpha = 1) {
    const projectile = this.projectilePool.acquire();
    projectile
      .setPosition(x, y)
      .setDisplaySize(width, height)
      .setTint(color)
      .setAlpha(alpha)
      .setActive(true)
      .setVisible(true);

    projectile.body.enable = true;
    projectile.body.setAllowGravity(false);
    projectile.body.setImmovable(true);

    this.scene.weaponProjectiles.add(projectile);
    return projectile;
  }

  releaseProjectile(projectile) {
    this.projectilePool.release(projectile);
  }

  createProjectile() {
    if (!this.scene.textures.exists('weapon-pixel')) {
      const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0xffffff, 1);
      graphics.fillRect(0, 0, 2, 2);
      graphics.generateTexture('weapon-pixel', 2, 2);
      graphics.destroy();
    }

    const sprite = this.scene.physics.add.sprite(-1000, -1000, 'weapon-pixel');
    sprite.body.setAllowGravity(false);
    sprite.body.enable = false;
    sprite.setActive(false).setVisible(false);
    return sprite;
  }

  resetProjectile(projectile) {
    projectile.body.stop();
    projectile.body.enable = false;
    projectile.setActive(false).setVisible(false);
    projectile.clearTint();
    projectile.setAlpha(1);
    projectile.setDataEnabled();
    projectile.data.reset();
  }

  update() {
    // override per-weapon when needed
  }

  fire() {
    throw new Error('Weapon fire() must be implemented by subclasses.');
  }
}
