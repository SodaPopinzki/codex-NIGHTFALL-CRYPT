import WeaponBase from './WeaponBase';

export default class SilverDagger extends WeaponBase {
  constructor(scene, owner, config) {
    super(scene, owner, config);
    this.zoneRadius = config.zoneRadius;
    this.fallHeight = config.fallHeight;
    this.activeDaggers = new Set();
  }

  fire() {
    for (let i = 0; i < this.projectileCount; i += 1) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(0, this.zoneRadius);
      const targetX = this.owner.x + Math.cos(angle) * distance;
      const targetY = this.owner.y + Math.sin(angle) * distance;

      const dagger = this.acquireProjectile(targetX, targetY - this.fallHeight, 8, 18, 0xb3b3b8, 0.95);
      dagger.setData('weaponType', 'silverDagger');
      dagger.setData('targetY', targetY);
      dagger.body.setVelocity(0, this.speed);
      this.activeDaggers.add(dagger);
    }
  }

  update() {
    this.activeDaggers.forEach((dagger) => {
      if (!dagger.active) {
        this.activeDaggers.delete(dagger);
        return;
      }

      if (dagger.y < dagger.getData('targetY')) return;

      this.impact(dagger.x, dagger.getData('targetY'));
      this.activeDaggers.delete(dagger);
      this.releaseProjectile(dagger);
    });
  }

  impact(x, y) {
    this.scene.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (distance <= this.area) {
        enemy.takeDamage(this.damage);
      }
    });
  }
}
