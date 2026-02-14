import { GAME_CONFIG } from '../config/GameConfig';
import { getUnlockedBonuses, loadMetaProgression } from '../systems/MetaProgression';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;
    const meta = loadMetaProgression();
    const bonuses = getUnlockedBonuses(meta);

    this.cameras.main.setBackgroundColor('#09050d');
    this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x120815, 1);

    this.createFog(width, height);

    this.add.text(width * 0.5, height * 0.2, 'NIGHTFALL CRYPT', {
      fontFamily: 'Georgia, serif',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#e6d6b8',
      stroke: '#2d1131',
      strokeThickness: 10,
      shadow: { color: '#ad5ac7', blur: 18, fill: true },
    }).setOrigin(0.5);

    this.add.text(width * 0.5, height * 0.29, "A Survivor's Descent", {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#af9dbd',
      stroke: '#170d1e',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const hardModeUnlocked = bonuses.some((bonus) => bonus.id === 'cryptMaster');
    if (hardModeUnlocked) {
      const hardModeLabel = this.add.text(width * 0.5, height * 0.35, 'Hard Mode: OFF', {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: '#ffb8b8',
        backgroundColor: '#26112f',
        padding: { x: 12, y: 6 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      hardModeLabel.on('pointerdown', () => {
        this.registry.set('hardModeEnabled', !this.registry.get('hardModeEnabled'));
        hardModeLabel.setText(`Hard Mode: ${this.registry.get('hardModeEnabled') ? 'ON' : 'OFF'}`);
      });
    }

    this.createButton(width * 0.5, height * 0.5, 'ENTER THE CRYPT', () => {
      this.scene.start('GameScene', { hardMode: Boolean(this.registry.get('hardModeEnabled')) });
    });

    this.createButton(width * 0.5, height * 0.6, 'ARMORY', () => {
      this.scene.start('ArmoryScene');
    });

    this.createButton(width * 0.5, height * 0.7, 'RECORDS', () => {
      this.scene.start('RecordsScene');
    });

    const bonusText = bonuses.length > 0
      ? bonuses.map((bonus) => `• ${bonus.name}`).join('\n')
      : 'No bonuses unlocked yet';
    this.add.text(24, height - 132, `Unlocked Bonuses\n${bonusText}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#d3c9dd',
      lineSpacing: 6,
    });

    this.add.text(width - 12, height - 10, GAME_CONFIG.meta.version, {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#87759a',
    }).setOrigin(1, 1);
  }

  createFog(width, height) {
    const particles = this.add.particles(0, 0, '__WHITE', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: 5000,
      speedX: { min: -8, max: 8 },
      speedY: { min: -3, max: 3 },
      scale: { start: 0.35, end: 1.4 },
      alpha: { start: 0.12, end: 0 },
      tint: [0x44335c, 0x3c2d4e, 0x2c2338],
      quantity: 1,
      frequency: 230,
      blendMode: 'SCREEN',
    });
    particles.setDepth(1);
  }

  createButton(x, y, label, onClick) {
    const bg = this.add.image(x, y, 'button').setInteractive({ useHandCursor: true }).setDepth(4);
    const text = this.add.text(x, y, label, {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#efe5c4',
      stroke: '#2b1329',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(5);

    const hover = (active) => {
      bg.setTexture(active ? 'button-hover' : 'button');
      this.tweens.add({
        targets: [bg, text],
        scale: active ? 1.05 : 1,
        duration: 120,
      });
      text.setTint(active ? 0xffffff : 0xffffff);
      text.setAlpha(active ? 1 : 0.94);
    };

    bg.on('pointerover', () => hover(true));
    bg.on('pointerout', () => hover(false));
    bg.on('pointerdown', onClick);
  }
}
