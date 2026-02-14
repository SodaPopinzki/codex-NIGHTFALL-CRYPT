import WeaponBase from './WeaponBase';

export default class PurificationNova extends WeaponBase {
  constructor(scene, owner, config) {
    super(scene, owner, config);
    this.ringWidth = config.ringWidth;
    this.knockbackForce = config.knockbackForce;
    this.activeNovas = new Set();
  }

  setLevel() {
    this.level = 1;
  }

  fire(now) {
    const ring = this.acquireProjectile(this.owner.x, this.owner.y, this.ringWidth, this.ringWidth, 0xd9ecff, 0.65);
    ring.setData('weaponType', 'purificationNova');
    ring.setData('damage', this.damage);
    ring.setData('radius', 0);
    ring.setData('hitEnemies', new Set());
    ring.setData('expireAt', now + this.durationMs);
    this.activeNovas.add(ring);

    this.scene.tweens.add({
      targets: ring,
      displayWidth: this.area * 2,
      displayHeight: this.area * 2,
      duration: this.durationMs,
      ease: 'Sine.Out',
    });

    this.scene.cameras.main.flash(220, 220, 240, 255, false);
  }

  update(now) {
    this.activeNovas.forEach((ring) => {
      if (!ring.active) {
        this.activeNovas.delete(ring);
        return;
      }

      if (now >= ring.getData('expireAt')) {
        this.activeNovas.delete(ring);
        this.releaseProjectile(ring);
        return;
      }

      ring.setPosition(this.owner.x, this.owner.y);
      const radius = ring.displayWidth * 0.5;
      const minRadius = Math.max(0, radius - this.ringWidth);
      const hitEnemies = ring.getData('hitEnemies');

      this.scene.enemies.children.iterate((enemy) => {
        if (!enemy?.active || hitEnemies.has(enemy)) return;
        const distance = Phaser.Math.Distance.Between(this.owner.x, this.owner.y, enemy.x, enemy.y);
        if (distance < minRadius || distance > radius) return;

        hitEnemies.add(enemy);
        enemy.takeDamage(ring.getData('damage'));

        const knock = new Phaser.Math.Vector2(enemy.x - this.owner.x, enemy.y - this.owner.y);
        if (knock.lengthSq() > 0) {
          knock.normalize().scale(this.knockbackForce);
          enemy.body.velocity.add(knock);
        }
      });
    });
  }
}
