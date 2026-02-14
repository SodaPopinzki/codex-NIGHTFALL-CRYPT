export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#120815');

    this.add.text(width / 2, height * 0.26, 'NIGHTFALL\nCRYPT', {
      fontFamily: 'Georgia, serif',
      fontSize: '68px',
      fontStyle: 'bold',
      color: '#d8c7a5',
      align: 'center',
      stroke: '#3f1f38',
      strokeThickness: 8,
      lineSpacing: 16,
    }).setOrigin(0.5);

    const playButton = this.add.image(width / 2, height * 0.68, 'button').setInteractive({ useHandCursor: true });
    const playText = this.add.text(playButton.x, playButton.y, 'PLAY', {
      fontFamily: 'Georgia, serif',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#efe5c4',
      stroke: '#2b1329',
      strokeThickness: 6,
    }).setOrigin(0.5);

    playButton.on('pointerover', () => playButton.setTexture('button-hover'));
    playButton.on('pointerout', () => playButton.setTexture('button'));
    playButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    this.add.text(width / 2, height * 0.88, 'Mobile-first auto-battler foundation', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#9f91b3',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [playButton, playText],
      y: '-=6',
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }
}
