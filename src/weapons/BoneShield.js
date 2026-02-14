import WeaponBase from './WeaponBase';

export default class BoneShield extends WeaponBase {
  constructor(scene, owner, config) {
    super(scene, owner, config);
    this.rotationPeriodMs = config.rotationPeriodMs;
    this.hitCooldownMs = config.hitCooldownMs;
    this.boneSize = config.boneSize;
    this.bones = [];
    this.angularSpeed = (Math.PI * 2) / this.rotationPeriodMs;
  }

  fire() {
    // Orbiting shield handles damage in update.
  }

  syncBoneCount() {
    while (this.bones.length < this.projectileCount) {
      const bone = this.acquireProjectile(this.owner.x, this.owner.y, this.boneSize, this.boneSize, 0xf2f2f2, 1);
      bone.setData('weaponType', 'boneShield');
      bone.setData('hitLog', new Map());
      bone.body.setAllowGravity(false);
      this.bones.push(bone);
    }
  }

  update(now) {
    this.syncBoneCount();

    this.bones.forEach((bone, index) => {
      if (!bone.active) return;

      const angleOffset = (Math.PI * 2 * index) / this.bones.length;
      const angle = (now * this.angularSpeed) + angleOffset;

      bone.setPosition(
        this.owner.x + Math.cos(angle) * this.area,
        this.owner.y + Math.sin(angle) * this.area,
      );

      this.scene.enemies.children.iterate((enemy) => {
        if (!enemy?.active) return;

        const distance = Phaser.Math.Distance.Between(bone.x, bone.y, enemy.x, enemy.y);
        if (distance > (this.boneSize + 18)) return;

        const hitLog = bone.getData('hitLog');
        const lastHitAt = hitLog.get(enemy) ?? -Infinity;
        if (now - lastHitAt < this.hitCooldownMs) return;

        hitLog.set(enemy, now);
        enemy.takeDamage(this.damage);
      });
    });
  }
}
