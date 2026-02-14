export default class VirtualJoystick {
  constructor(scene) {
    this.scene = scene;
    this.pointerId = null;
    this.baseRadius = 60;
    this.thumbRadius = 26;
    this.deadZone = 40;
    this.origin = new Phaser.Math.Vector2(0, 0);
    this.direction = new Phaser.Math.Vector2(0, 0);

    this.isTouchDevice = scene.sys.game.device.input.touch;

    this.base = scene.add.circle(0, 0, this.baseRadius, 0xa9a0b4, 0.28)
      .setScrollFactor(0)
      .setDepth(30)
      .setVisible(false);

    this.thumb = scene.add.circle(0, 0, this.thumbRadius, 0xddd4e8, 0.45)
      .setScrollFactor(0)
      .setDepth(31)
      .setVisible(false);

    scene.input.on('pointerdown', this.handleDown, this);
    scene.input.on('pointermove', this.handleMove, this);
    scene.input.on('pointerup', this.handleUp, this);
    scene.input.on('pointerupoutside', this.handleUp, this);
  }

  handleDown(pointer) {
    if (!this.isTouchDevice || this.pointerId !== null) return;
    this.pointerId = pointer.id;
    this.origin.set(pointer.x, pointer.y);
    this.base.setPosition(pointer.x, pointer.y).setVisible(true);
    this.thumb.setPosition(pointer.x, pointer.y).setVisible(true);
  }

  handleMove(pointer) {
    if (pointer.id !== this.pointerId) return;

    const deltaX = pointer.x - this.origin.x;
    const deltaY = pointer.y - this.origin.y;
    const delta = new Phaser.Math.Vector2(deltaX, deltaY);
    const distance = delta.length();

    if (distance <= this.deadZone) {
      this.direction.set(0, 0);
      this.thumb.setPosition(this.origin.x, this.origin.y);
      return;
    }

    const clampedDistance = Math.min(distance, this.baseRadius);
    const normalizedStrength = (clampedDistance - this.deadZone) / (this.baseRadius - this.deadZone);

    delta.normalize();
    this.direction.copy(delta).scale(normalizedStrength);

    this.thumb.setPosition(
      this.origin.x + delta.x * clampedDistance,
      this.origin.y + delta.y * clampedDistance,
    );
  }

  handleUp(pointer) {
    if (pointer.id !== this.pointerId) return;
    this.pointerId = null;
    this.direction.set(0, 0);
    this.base.setVisible(false);
    this.thumb.setVisible(false);
  }

  getVector() {
    return this.direction.clone();
  }

  destroy() {
    this.scene.input.off('pointerdown', this.handleDown, this);
    this.scene.input.off('pointermove', this.handleMove, this);
    this.scene.input.off('pointerup', this.handleUp, this);
    this.scene.input.off('pointerupoutside', this.handleUp, this);
    this.base.destroy();
    this.thumb.destroy();
  }
}
