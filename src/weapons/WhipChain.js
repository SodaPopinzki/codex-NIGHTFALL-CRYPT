import WeaponBase from './WeaponBase';

export default class WhipChain extends WeaponBase {
  constructor(scene, owner, config) {
    super(scene, owner, config);
    this.length = config.length;
    this.activeSwings = new Set();
  }

  fire(now) {
    const direction = this.owner.lastMoveDirection.x >= 0 ? 1 : -1;
    const centerX = this.owner.x + direction * (this.length * 0.5);

    const swing = this.acquireProjectile(centerX, this.owner.y, this.length, this.area, 0xffffff, 0.9);
    swing.setData('weaponType', 'whipChain');
    swing.setData('damage', this.damage);
    swing.setData('pierce', this.pierce);
    swing.setData('hitEnemies', new Set());
    swing.setData('expireAt', now + this.durationMs);
    swing.body.setSize(this.length, this.area);
    this.activeSwings.add(swing);
  }

  update(now) {
    this.activeSwings.forEach((swing) => {
      if (!swing.active || now >= swing.getData('expireAt')) {
        this.activeSwings.delete(swing);
        this.releaseProjectile(swing);
      }
    });
  }
}
