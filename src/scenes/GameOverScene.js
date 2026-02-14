export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data) {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#130914');

    this.add.text(width / 2, height * 0.24, 'GAME OVER', {
      fontFamily: 'Georgia, serif',
      fontSize: '62px',
      color: '#df8590',
      stroke: '#2b1329',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const survived = Math.floor(data.time ?? 0);
    const mins = String(Math.floor(survived / 60)).padStart(2, '0');
    const secs = String(survived % 60).padStart(2, '0');

    this.add.text(width / 2, height * 0.45, `Time Survived: ${mins}:${secs}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#f2dfc9',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.53, `Enemies Slain: ${data.kills ?? 0}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#f2dfc9',
    }).setOrigin(0.5);

    const restart = this.add.text(width / 2, height * 0.68, 'Restart', {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      color: '#efe5c4',
      backgroundColor: '#2a1733',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restart.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}
