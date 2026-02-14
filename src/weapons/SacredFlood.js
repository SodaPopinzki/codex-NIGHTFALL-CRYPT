import WeaponBase from './WeaponBase';

export default class SacredFlood extends WeaponBase {
  constructor(scene, owner, config) {
    super(scene, owner, config);
    this.activeWaves = new Set();
  }

  setLevel() {
    this.level = 1;
  }

  fire(now) {
    const cam = this.scene.cameras.main;
    const worldView = cam.worldView;
    const waveY = this.owner.y;
    const startX = worldView.left - worldView.width;
    const targetX = worldView.right + worldView.width;

    const wave = this.acquireProjectile(startX, waveY, worldView.width * 1.2, this.area, 0x4f93ff, 0.5);
    wave.setData('weaponType', 'sacredFlood');
    wave.setData('damage', this.damage);
    wave.setData('hitEnemies', new Set());
    wave.body.setSize(wave.displayWidth, this.area);
    this.activeWaves.add(wave);

    this.scene.tweens.add({
      targets: wave,
      x: targetX,
      duration: this.durationMs,
      ease: 'Sine.InOut',
      onComplete: () => {
        this.activeWaves.delete(wave);
        this.releaseProjectile(wave);
      },
    });

    this.scene.tweens.add({
      targets: wave,
      alpha: { from: 0.65, to: 0.3 },
      yoyo: true,
      duration: 180,
      repeat: 4,
    });

    this.scene.cameras.main.shake(90, 0.002);
  }
}
