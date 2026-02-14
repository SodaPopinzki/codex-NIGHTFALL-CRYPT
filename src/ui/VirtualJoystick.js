export default class VirtualJoystick {
  constructor(scene) {
    this.scene = scene;
    this.pointerId = null;
    this.baseRadius = 42;
    this.thumbRadius = 22;
    this.origin = new Phaser.Math.Vector2(90, scene.scale.height - 90);
    this.direction = new Phaser.Math.Vector2(0, 0);

    this.base = scene.add.circle(this.origin.x, this.origin.y, this.baseRadius, 0x29142e, 0.5)
      .setScrollFactor(0)
      .setDepth(30)
      .setVisible(scene.sys.game.device.input.touch);

    this.thumb = scene.add.circle(this.origin.x, this.origin.y, this.thumbRadius, 0xbda3cc, 0.7)
      .setScrollFactor(0)
      .setDepth(31)
      .setVisible(scene.sys.game.device.input.touch);

    scene.input.on('pointerdown', this.handleDown, this);
    scene.input.on('pointermove', this.handleMove, this);
    scene.input.on('pointerup', this.handleUp, this);
    scene.input.on('pointerupoutside', this.handleUp, this);
  }

  handleDown(pointer) {
    if (!this.base.visible || this.pointerId !== null) return;
    if (pointer.x < this.scene.scale.width * 0.45 && pointer.y > this.scene.scale.height * 0.45) {
      this.pointerId = pointer.id;
      this.origin.set(pointer.x, pointer.y);
      this.base.setPosition(pointer.x, pointer.y);
      this.thumb.setPosition(pointer.x, pointer.y);
    }
  }

  handleMove(pointer) {
    if (pointer.id !== this.pointerId) return;
    const delta = new Phaser.Math.Vector2(pointer.x - this.origin.x, pointer.y - this.origin.y);
    const distance = Math.min(delta.length(), this.baseRadius);
    const angle = Math.atan2(delta.y, delta.x);

    this.direction.setToPolar(angle, distance / this.baseRadius);
    this.thumb.setPosition(
      this.origin.x + Math.cos(angle) * distance,
      this.origin.y + Math.sin(angle) * distance,
    );
  }

  handleUp(pointer) {
    if (pointer.id !== this.pointerId) return;
    this.pointerId = null;
    this.direction.set(0, 0);
    this.thumb.setPosition(this.origin.x, this.origin.y);
  }

  getVector() {
    return this.direction.clone();
  }

  destroy() {
    this.scene.input.off('pointerdown', this.handleDown, this);
    this.scene.input.off('pointermove', this.handleMove, this);
    this.scene.input.off('pointerup', this.handleUp, this);
    this.scene.input.off('pointerupoutside', this.handleUp, this);
  }
}
