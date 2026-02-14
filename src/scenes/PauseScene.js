export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x09060d, 0.65).setScrollFactor(0);
    this.add.text(width / 2, height / 2 - 40, 'PAUSED', {
      fontFamily: 'Georgia, serif',
      fontSize: '48px',
      color: '#f2dfc9',
      stroke: '#2b1329',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const resume = this.add.text(width / 2, height / 2 + 20, 'Resume', {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#d8c7a5',
      backgroundColor: '#2a1733',
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resume.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });

    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });
  }
}
