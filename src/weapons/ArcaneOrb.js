import WeaponBase from './WeaponBase';

export default class ArcaneOrb extends WeaponBase {
  constructor(scene, owner, config) {
    super(scene, owner, config);
    this.tickMs = config.tickMs;
    this.activeOrbs = new Set();
  }

  fire(now) {
    const direction = this.owner.lastMoveDirection.clone();
    if (direction.lengthSq() === 0) direction.set(1, 0);
    direction.normalize();

    const orb = this.acquireProjectile(this.owner.x, this.owner.y, this.area, this.area, 0xa64dff, 0.8);
    orb.setData('weaponType', 'arcaneOrb');
    orb.setData('damage', this.damage);
    orb.setData('nextHitMap', new Map());
    orb.setData('expireAt', now + this.durationMs);
    orb.setData('tickMs', this.tickMs);
    orb.body.setCircle(this.area * 0.5);
    orb.body.setVelocity(direction.x * this.speed, direction.y * this.speed);

    this.activeOrbs.add(orb);
  }

  update(now) {
    this.activeOrbs.forEach((orb) => {
      if (!orb.active) {
        this.activeOrbs.delete(orb);
        return;
      }

      if (now >= orb.getData('expireAt')) {
        this.activeOrbs.delete(orb);
        this.releaseProjectile(orb);
        return;
      }

      const hitMap = orb.getData('nextHitMap');
      const radius = this.area * 0.5;
      this.scene.enemies.children.iterate((enemy) => {
        if (!enemy?.active) return;

        const distance = Phaser.Math.Distance.Between(orb.x, orb.y, enemy.x, enemy.y);
        if (distance > radius + 14) return;

        const nextHitAt = hitMap.get(enemy) ?? -Infinity;
        if (now < nextHitAt) return;

        enemy.takeDamage(orb.getData('damage'));
        hitMap.set(enemy, now + orb.getData('tickMs'));
      });
    });
  }
}
