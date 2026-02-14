export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.scale;

    const box = this.add.rectangle(width * 0.5, height * 0.52, 320, 24, 0x1a1122, 0.9)
      .setStrokeStyle(2, 0x4a2d5a, 1);
    const bar = this.add.rectangle((width * 0.5) - 156, height * 0.52, 0, 16, 0xb35aff, 1)
      .setOrigin(0, 0.5);
    const label = this.add.text(width * 0.5, height * 0.46, 'Summoning crypt...', {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#e8d8ff',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.width = 312 * value;
    });

    this.load.on('complete', () => {
      box.destroy();
      bar.destroy();
      label.destroy();
    });

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
