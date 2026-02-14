export default class WeaponBase {
  constructor(scene, owner, config) {
    this.scene = scene;
    this.owner = owner;
    this.cooldownMs = config.cooldownMs;
    this.damage = config.damage;
    this.projectileCount = config.projectileCount;
    this.lastAttackTime = 0;
  }

  canAttack(now) {
    return now - this.lastAttackTime >= this.cooldownMs;
  }

  tryAttack(now) {
    if (!this.canAttack(now)) return false;
    this.lastAttackTime = now;
    return true;
  }
}
