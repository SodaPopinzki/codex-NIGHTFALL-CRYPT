import WeaponBase from './WeaponBase';

export default class HolyWater extends WeaponBase {
  constructor(scene, owner, config) {
    super(scene, owner, config);
    this.throwRadius = config.throwRadius;
    this.tickMs = config.tickMs;
    this.zones = new Set();
  }

  fire(now) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.FloatBetween(40, this.throwRadius);
    const targetX = this.owner.x + Math.cos(angle) * distance;
    const targetY = this.owner.y + Math.sin(angle) * distance;

    const bottle = this.acquireProjectile(this.owner.x, this.owner.y, 12, 12, 0x7eb8ff, 0.95);
    bottle.setData('weaponType', 'holyWaterBottle');

    const travelDistance = Phaser.Math.Distance.Between(this.owner.x, this.owner.y, targetX, targetY);
    const travelMs = Math.max(250, (travelDistance / this.speed) * 1000);

    this.scene.tweens.add({
      targets: bottle,
      x: targetX,
      y: targetY,
      duration: travelMs,
      ease: 'Quad.Out',
      onComplete: () => {
        this.releaseProjectile(bottle);
        this.spawnZone(targetX, targetY, now + travelMs);
      },
    });
  }

  spawnZone(x, y, startTime) {
    const zone = this.acquireProjectile(x, y, this.area * 2, this.area * 2, 0x4f9cff, 0.35);
    zone.body.setCircle(this.area);
    zone.setData('weaponType', 'holyWaterZone');
    zone.setData('damageTick', this.damage);
    zone.setData('nextTickAt', startTime);
    zone.setData('tickMs', this.tickMs);
    zone.setData('expireAt', startTime + this.durationMs);
    this.zones.add(zone);
  }

  update(now) {
    this.zones.forEach((zone) => {
      if (!zone.active) {
        this.zones.delete(zone);
        return;
      }

      const expireAt = zone.getData('expireAt');
      if (now >= expireAt) {
        this.zones.delete(zone);
        this.releaseProjectile(zone);
        return;
      }

      const nextTickAt = zone.getData('nextTickAt');
      if (now < nextTickAt) return;

      this.scene.enemies.children.iterate((enemy) => {
        if (!enemy?.active) return;
        const distance = Phaser.Math.Distance.Between(zone.x, zone.y, enemy.x, enemy.y);
        if (distance <= this.area) {
          enemy.takeDamage(zone.getData('damageTick'));
        }
      });

      zone.setData('nextTickAt', now + zone.getData('tickMs'));
    });
  }
}
