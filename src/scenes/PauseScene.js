export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create(data) {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x09060d, 0.72).setScrollFactor(0);
    this.add.text(width / 2, 64, 'PAUSED', {
      fontFamily: 'Georgia, serif',
      fontSize: '54px',
      color: '#f2dfc9',
      stroke: '#2b1329',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const weaponLines = (data.weapons ?? [])
      .map((weapon) => `• ${weapon.name} Lv.${weapon.level}`)
      .join('\n') || '• No weapons';

    this.add.text(width * 0.5, 130, `Time: ${this.formatTime(data.time ?? 0)}   Kills: ${data.kills ?? 0}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#d8c7a5',
    }).setOrigin(0.5);

    this.add.rectangle(width * 0.5, height * 0.52, 470, 250, 0x1a1024, 0.95).setStrokeStyle(2, 0x4e2f67);
    this.add.text(width * 0.5 - 210, height * 0.42, 'Current Weapons', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#f0dfc8',
    });

    this.add.text(width * 0.5 - 210, height * 0.47, weaponLines, {
      fontFamily: 'Georgia, serif',
      fontSize: '19px',
      color: '#c5b8d4',
      lineSpacing: 6,
    });

    const resume = this.makeButton(width * 0.5, height - 90, 'Resume', () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });

    const quit = this.makeButton(width * 0.5, height - 38, 'Quit to Menu', () => {
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    this.input.keyboard.once('keydown-ESC', () => resume.emit('pointerdown'));
    this.input.keyboard.once('keydown-Q', () => quit.emit('pointerdown'));
  }

  makeButton(x, y, label, onClick) {
    const button = this.add.text(x, y, label, {
      fontFamily: 'Georgia, serif',
      fontSize: '26px',
      color: '#efe5c4',
      backgroundColor: '#2a1733',
      padding: { x: 18, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    button.on('pointerover', () => button.setScale(1.05).setTint(0xffffff));
    button.on('pointerout', () => button.setScale(1).clearTint());
    button.on('pointerdown', onClick);
    return button;
  }

  formatTime(seconds) {
    const rounded = Math.floor(seconds);
    const mins = String(Math.floor(rounded / 60)).padStart(2, '0');
    const secs = String(rounded % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }
}
