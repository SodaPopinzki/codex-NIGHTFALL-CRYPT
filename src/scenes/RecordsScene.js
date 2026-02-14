import { loadMetaProgression } from '../systems/MetaProgression';

export default class RecordsScene extends Phaser.Scene {
  constructor() {
    super('RecordsScene');
  }

  create() {
    const { width, height } = this.scale;
    const meta = loadMetaProgression();

    this.cameras.main.setBackgroundColor('#0b0610');
    this.add.text(width * 0.5, 84, 'RECORDS', {
      fontFamily: 'Georgia, serif',
      fontSize: '56px',
      color: '#e6d6b8',
      stroke: '#2b1329',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const lines = [
      ['Best Time Survived', this.formatTime(meta.bestTimeSurvived)],
      ['Most Enemies Killed (Run)', meta.mostEnemiesKilled],
      ['Most Weapons Evolved (Run)', meta.mostWeaponsEvolved],
      ['Total Runs Played', meta.totalRunsPlayed],
      ['Total Enemies Killed', meta.totalEnemiesKilled],
    ];

    lines.forEach(([label, value], index) => {
      const y = 180 + (index * 62);
      this.add.rectangle(width * 0.5, y, 560, 48, 0x1a1220, 0.95).setStrokeStyle(2, 0x3f2c4c);
      this.add.text(width * 0.5 - 260, y, String(label), {
        fontFamily: 'Georgia, serif',
        fontSize: '23px',
        color: '#dacde8',
      }).setOrigin(0, 0.5);
      this.add.text(width * 0.5 + 260, y, String(value), {
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        color: '#f5e7ce',
      }).setOrigin(1, 0.5);
    });

    const back = this.add.text(width * 0.5, height - 36, 'BACK TO MENU', {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#f2dfc9',
      backgroundColor: '#2a1733',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    back.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  formatTime(seconds) {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }
}
