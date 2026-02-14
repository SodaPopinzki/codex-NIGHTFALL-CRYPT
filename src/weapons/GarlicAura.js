import WeaponBase from './WeaponBase';

export default class GarlicAura extends WeaponBase {
  constructor(scene, owner, config) {
    super(scene, owner, config);
    this.pushbackForce = config.pushbackForce;

    this.aura = this.acquireProjectile(owner.x, owner.y, this.area * 2, this.area * 2, 0x67e36a, 0.24);
    this.aura.setData('weaponType', 'garlicAuraVisual');
    this.aura.body.enable = false;
  }

  fire() {
    this.scene.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;

      const distance = Phaser.Math.Distance.Between(this.owner.x, this.owner.y, enemy.x, enemy.y);
      if (distance > this.area) return;

      enemy.takeDamage(this.damage);

      const knock = new Phaser.Math.Vector2(enemy.x - this.owner.x, enemy.y - this.owner.y);
      if (knock.lengthSq() > 0) {
        knock.normalize().scale(this.pushbackForce);
        enemy.body.velocity.add(knock);
      }
    });
  }

  update() {
    this.aura.setPosition(this.owner.x, this.owner.y);
    this.aura.setDisplaySize(this.area * 2, this.area * 2);
  }
}
