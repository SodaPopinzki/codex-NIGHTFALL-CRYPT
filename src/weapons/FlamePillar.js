import WeaponBase from './WeaponBase';

export default class FlamePillar extends WeaponBase {
  constructor(scene, owner, config) {
    super(scene, owner, config);
    this.tickMs = config.tickMs;
    this.height = config.height;
    this.activePillars = new Set();
  }

  fire(now) {
    const nearest = this.findNearestEnemy();
    const spawnX = nearest ? nearest.x : this.owner.x + (this.owner.lastMoveDirection.x || 1) * 80;
    const spawnY = nearest ? nearest.y : this.owner.y;

    const pillar = this.acquireProjectile(spawnX, spawnY, this.area, this.height, 0xff5b2e, 0.55);
    pillar.setData('weaponType', 'flamePillar');
    pillar.setData('damageTick', this.damage);
    pillar.setData('nextTickAt', now);
    pillar.setData('tickMs', this.tickMs);
    pillar.setData('expireAt', now + this.durationMs);
    pillar.body.setSize(this.area, this.height);
    this.activePillars.add(pillar);
  }

  findNearestEnemy() {
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    this.scene.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;
      const distance = Phaser.Math.Distance.Between(this.owner.x, this.owner.y, enemy.x, enemy.y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = enemy;
      }
    });

    return nearest;
  }

  update(now) {
    this.activePillars.forEach((pillar) => {
      if (!pillar.active) {
        this.activePillars.delete(pillar);
        return;
      }

      if (now >= pillar.getData('expireAt')) {
        this.activePillars.delete(pillar);
        this.releaseProjectile(pillar);
        return;
      }

      if (now < pillar.getData('nextTickAt')) return;

      const halfW = this.area * 0.5;
      const halfH = this.height * 0.5;
      this.scene.enemies.children.iterate((enemy) => {
        if (!enemy?.active) return;
        if (
          enemy.x >= pillar.x - halfW
          && enemy.x <= pillar.x + halfW
          && enemy.y >= pillar.y - halfH
          && enemy.y <= pillar.y + halfH
        ) {
          enemy.takeDamage(pillar.getData('damageTick'));
        }
      });

      pillar.setData('nextTickAt', now + pillar.getData('tickMs'));
    });
  }
}
