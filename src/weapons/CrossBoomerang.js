import WeaponBase from './WeaponBase';

export default class CrossBoomerang extends WeaponBase {
  constructor(scene, owner, config) {
    super(scene, owner, config);
    this.outboundDistance = config.outboundDistance;
    this.activeCrosses = new Set();
  }

  fire() {
    const direction = this.owner.lastMoveDirection.clone();
    if (direction.lengthSq() === 0) direction.set(1, 0);
    direction.normalize();

    const cross = this.acquireProjectile(this.owner.x, this.owner.y, 22, 22, 0xffe680, 1);
    cross.setData('weaponType', 'crossBoomerang');
    cross.setData('damage', this.damage);
    cross.setData('pierce', this.pierce);
    cross.setData('hitEnemies', new Set());
    cross.setData('direction', direction);
    cross.setData('phase', 'outbound');
    cross.setData('startX', this.owner.x);
    cross.setData('startY', this.owner.y);
    cross.setData('distance', 0);
    cross.body.setCircle(11);

    this.activeCrosses.add(cross);
  }

  update(_, delta) {
    const dt = delta / 1000;
    this.activeCrosses.forEach((cross) => {
      if (!cross.active) {
        this.activeCrosses.delete(cross);
        return;
      }

      const phase = cross.getData('phase');
      if (phase === 'outbound') {
        const direction = cross.getData('direction');
        cross.x += direction.x * this.speed * dt;
        cross.y += direction.y * this.speed * dt;
        const traveled = Phaser.Math.Distance.Between(cross.getData('startX'), cross.getData('startY'), cross.x, cross.y);
        cross.setData('distance', traveled);

        if (traveled >= this.outboundDistance) {
          cross.setData('phase', 'return');
          cross.setData('hitEnemies', new Set());
        }
      } else {
        const back = new Phaser.Math.Vector2(this.owner.x - cross.x, this.owner.y - cross.y);
        if (back.lengthSq() <= 20 * 20) {
          this.activeCrosses.delete(cross);
          this.releaseProjectile(cross);
          return;
        }

        back.normalize();
        cross.x += back.x * this.speed * dt;
        cross.y += back.y * this.speed * dt;
      }
    });
  }
}
