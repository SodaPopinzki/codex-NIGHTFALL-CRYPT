export default class LevelUpScene extends Phaser.Scene {
  constructor() {
    super('LevelUpScene');
  }

  create() {
    const { width, height } = this.scale;
    this.scene.pause('GameScene');

    this.add.rectangle(width / 2, height / 2, width, height, 0x09060d, 0.7).setScrollFactor(0);
    this.add.text(width / 2, height / 2 - 120, 'LEVEL UP', {
      fontFamily: 'Georgia, serif',
      fontSize: '46px',
      color: '#e3d1ad',
      stroke: '#2b1329',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const options = ['+10 Max HP', '+10% Move Speed', '+5 Pickup Radius'];
    options.forEach((label, index) => {
      const option = this.add.text(width / 2, height / 2 - 20 + index * 60, label, {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: '#efe5c4',
        backgroundColor: '#2a1733',
        padding: { x: 16, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      option.on('pointerdown', () => {
        this.scene.resume('GameScene');
        this.scene.stop();
      });
    });
  }
}
