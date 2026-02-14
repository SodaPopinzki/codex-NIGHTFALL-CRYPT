import WeaponBase from './WeaponBase';

export default class InfernoLash extends WeaponBase {
  constructor(scene, owner, config) {
    super(scene, owner, config);
    this.length = config.length;
    this.trailDamage = config.trailDamage;
    this.trailTickMs = config.trailTickMs;
    this.trailDurationMs = config.trailDurationMs;
    this.activeSwings = new Set();
    this.fireTrails = new Set();
  }

  setLevel() {
    this.level = 1;
  }

  fire(now) {
    const direction = this.owner.lastMoveDirection.x >= 0 ? 1 : -1;
    const centerX = this.owner.x + direction * (this.length * 0.5);
    const centerY = this.owner.y;

    const swing = this.acquireProjectile(centerX, centerY, this.length, this.area, 0xfff0c2, 0.9);
    swing.setData('weaponType', 'infernoLash');
    swing.setData('damage', this.damage);
    swing.setData('pierce', this.pierce);
    swing.setData('hitEnemies', new Set());
    swing.setData('expireAt', now + this.durationMs);
    swing.body.setSize(this.length, this.area);
    this.activeSwings.add(swing);

    const segmentCount = 6;
    for (let i = 0; i < segmentCount; i += 1) {
      const x = centerX - (this.length / 2) + (i + 0.5) * (this.length / segmentCount);
      const trail = this.acquireProjectile(x, centerY, this.length / segmentCount, this.area * 0.8, 0xff5b2e, 0.45);
      trail.setData('weaponType', 'infernoLashTrail');
      trail.setData('damageTick', this.trailDamage);
      trail.setData('nextTickAt', now);
      trail.setData('expireAt', now + this.trailDurationMs);
      trail.body.setSize(this.length / segmentCount, this.area * 0.8);
      this.fireTrails.add(trail);
    }
  }

  update(now) {
    this.activeSwings.forEach((swing) => {
      if (!swing.active || now >= swing.getData('expireAt')) {
        this.activeSwings.delete(swing);
        this.releaseProjectile(swing);
      }
    });

    this.fireTrails.forEach((trail) => {
      if (!trail.active) {
        this.fireTrails.delete(trail);
        return;
      }

      if (now >= trail.getData('expireAt')) {
        this.fireTrails.delete(trail);
        this.releaseProjectile(trail);
        return;
      }

      if (now < trail.getData('nextTickAt')) return;

      const halfW = trail.displayWidth * 0.5;
      const halfH = trail.displayHeight * 0.5;
      this.scene.enemies.children.iterate((enemy) => {
        if (!enemy?.active) return;
        if (
          enemy.x >= trail.x - halfW
          && enemy.x <= trail.x + halfW
          && enemy.y >= trail.y - halfH
          && enemy.y <= trail.y + halfH
        ) {
          enemy.takeDamage(trail.getData('damageTick'));
        }
      });

      trail.setData('nextTickAt', now + this.trailTickMs);
    });
  }
}
