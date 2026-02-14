import WeaponBase from './WeaponBase';

export default class NecroStorm extends WeaponBase {
  constructor(scene, owner, config) {
    super(scene, owner, config);
    this.minRadius = config.minRadius;
    this.maxRadius = config.maxRadius;
    this.skullSize = config.skullSize;
    this.boltDamage = config.boltDamage;
    this.boltCooldownMs = config.boltCooldownMs;
    this.skulls = [];
    this.angularSpeed = (Math.PI * 2) / 2800;
  }

  setLevel() {
    this.level = 1;
  }

  fire() {
    // Passive orbit/bolt behavior handled in update.
  }

  ensureSkulls() {
    while (this.skulls.length < this.projectileCount) {
      const skull = this.acquireProjectile(this.owner.x, this.owner.y, this.skullSize, this.skullSize, 0xefefff, 0.95);
      skull.setData('weaponType', 'necroStormSkull');
      skull.setData('radius', Phaser.Math.Between(this.minRadius, this.maxRadius));
      skull.setData('lastBoltAt', -Infinity);
      skull.setData('hitLog', new Map());
      this.skulls.push(skull);
    }
  }

  findNearestEnemy(x, y) {
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    this.scene.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    });

    return nearest;
  }

  update(now) {
    this.ensureSkulls();

    this.skulls.forEach((skull, index) => {
      const angleOffset = (Math.PI * 2 * index) / this.skulls.length;
      const angle = (now * this.angularSpeed) + angleOffset;
      const radius = skull.getData('radius');
      skull.setPosition(this.owner.x + Math.cos(angle) * radius, this.owner.y + Math.sin(angle) * radius);

      this.scene.enemies.children.iterate((enemy) => {
        if (!enemy?.active) return;
        const distance = Phaser.Math.Distance.Between(skull.x, skull.y, enemy.x, enemy.y);
        if (distance > this.skullSize + 14) return;

        const hitLog = skull.getData('hitLog');
        const lastHitAt = hitLog.get(enemy) ?? -Infinity;
        if (now - lastHitAt < 250) return;

        hitLog.set(enemy, now);
        enemy.takeDamage(this.damage);
      });

      if (now - skull.getData('lastBoltAt') < this.boltCooldownMs) return;
      const target = this.findNearestEnemy(skull.x, skull.y);
      if (!target) return;

      skull.setData('lastBoltAt', now);
      const bolt = this.acquireProjectile(skull.x, skull.y, 10, 10, 0x9954ff, 0.85);
      bolt.setData('weaponType', 'necroStormBolt');
      bolt.setData('damage', this.boltDamage);
      bolt.setData('pierce', 1);
      bolt.setData('hitEnemies', new Set());

      const direction = new Phaser.Math.Vector2(target.x - skull.x, target.y - skull.y).normalize();
      bolt.body.setCircle(5);
      bolt.body.setVelocity(direction.x * this.speed, direction.y * this.speed);

      this.scene.time.delayedCall(1000, () => {
        if (bolt.active) this.releaseProjectile(bolt);
      });
    });
  }
}
