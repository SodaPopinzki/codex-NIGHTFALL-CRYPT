import { EVOLUTION_CONFIG, EVOLVED_WEAPON_CONFIG } from '../config/EvolutionConfig';
import { WEAPON_CONFIG } from '../config/WeaponConfig';
import { loadMetaProgression } from '../systems/MetaProgression';

export default class ArmoryScene extends Phaser.Scene {
  constructor() {
    super('ArmoryScene');
  }

  create() {
    const { width, height } = this.scale;
    const meta = loadMetaProgression();

    this.cameras.main.setBackgroundColor('#0e0813');
    this.add.text(width * 0.5, 38, 'ARMORY', {
      fontFamily: 'Georgia, serif',
      fontSize: '46px',
      color: '#e6d6b8',
      stroke: '#2b1329',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const entries = [
      ...Object.entries(WEAPON_CONFIG).map(([id, config]) => ({ id, ...config, type: 'base' })),
      ...Object.entries(EVOLVED_WEAPON_CONFIG).map(([id, config]) => ({ id, ...config, type: 'evolved' })),
    ];

    const cols = 4;
    const cellW = 180;
    const cellH = 120;
    const startX = (width * 0.5) - ((cols - 1) * cellW * 0.5);

    entries.forEach((entry, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + (col * cellW);
      const y = 110 + (row * cellH);
      const discovered = entry.type === 'base'
        ? meta.weaponsDiscovered.includes(entry.id)
        : meta.evolutionsDiscovered.includes(entry.id);

      const cardColor = discovered ? 0x26182f : 0x120d16;
      this.add.rectangle(x, y, 166, 102, cardColor, 0.95).setStrokeStyle(2, discovered ? 0x7f4d95 : 0x2b2331);
      this.add.circle(x - 54, y - 26, 12, discovered ? 0xc18ce0 : 0x1d1a22);

      this.add.text(x - 34, y - 35, discovered ? entry.name : '???', {
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        color: discovered ? '#f0e8d5' : '#6a6370',
      });

      const details = discovered
        ? `${entry.type === 'evolved' ? 'Evolution' : 'Base'}\nDMG ${entry.damage}`
        : 'Locked';
      this.add.text(x - 34, y - 8, details, {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: discovered ? '#c9bdd4' : '#4b4452',
        lineSpacing: 4,
      });
    });

    const recipes = EVOLUTION_CONFIG
      .filter((entry) => meta.evolutionsDiscovered.includes(entry.evolvedWeaponId))
      .map((entry) => `${entry.name}: ${entry.requires.join(' + ')}`)
      .join('\n') || 'No evolution recipes discovered yet.';

    this.add.text(24, height - 110, `Evolution Recipes\n${recipes}`, {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#cec2da',
      lineSpacing: 4,
    });

    const back = this.add.text(width - 60, height - 28, 'BACK', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#f2dfc9',
      backgroundColor: '#2a1733',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    back.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
