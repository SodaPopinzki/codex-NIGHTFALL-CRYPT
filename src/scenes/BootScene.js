export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.createRectTexture('player', 20, 20, '#9ad7ff');
    this.createRectTexture('enemy', 18, 18, '#d95763');
    this.createRectTexture('button', 220, 54, '#2a1733');
    this.createRectTexture('button-hover', 220, 54, '#47265a');
  }

  create() {
    this.scene.start('MenuScene');
  }

  createRectTexture(key, width, height, color) {
    const graphics = this.add.graphics();
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
}
