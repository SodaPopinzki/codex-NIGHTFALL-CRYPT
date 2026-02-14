export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data) {
    const { width, height } = this.scale;
    const isVictory = data.mode === 'victory';

    this.cameras.main.setBackgroundColor(isVictory ? '#0e1a10' : '#130914');

    this.add.text(width / 2, height * 0.2, isVictory ? 'VICTORY' : 'GAME OVER', {
      fontFamily: 'Georgia, serif',
      fontSize: '62px',
      color: isVictory ? '#9be7a0' : '#df8590',
      stroke: '#2b1329',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const survived = Math.floor(data.time ?? 0);
    const mins = String(Math.floor(survived / 60)).padStart(2, '0');
    const secs = String(survived % 60).padStart(2, '0');

    const style = {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#f2dfc9',
    };

    this.add.text(width / 2, height * 0.4, `Time Survived: ${mins}:${secs}`, style).setOrigin(0.5);
    this.add.text(width / 2, height * 0.48, `Enemies Slain: ${data.kills ?? 0}`, style).setOrigin(0.5);
    this.add.text(width / 2, height * 0.56, `Bosses Defeated: ${data.bossesDefeated ?? 0}`, style).setOrigin(0.5);
    this.add.text(width / 2, height * 0.64, `Weapons Evolved: ${data.weaponsEvolved ?? 0}`, style).setOrigin(0.5);

    const restart = this.add.text(width / 2, height * 0.78, 'Restart', {
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
