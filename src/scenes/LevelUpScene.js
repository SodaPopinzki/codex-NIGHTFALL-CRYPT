export default class LevelUpScene extends Phaser.Scene {
  constructor() {
    super('LevelUpScene');
  }

  create() {
    const { width, height } = this.scale;
    const gameScene = this.scene.get('GameScene');

    this.add.rectangle(width / 2, height / 2, width, height, 0x09060d, 0.85).setScrollFactor(0);
    this.add.text(width / 2, height * 0.2, 'LEVEL UP!', {
      fontFamily: 'Georgia, serif',
      fontSize: '56px',
      color: '#f4d7ff',
      stroke: '#241027',
      strokeThickness: 10,
      shadow: { color: '#000000', blur: 6, stroke: true, fill: true },
    }).setOrigin(0.5);

    const choices = gameScene.getLevelUpChoices(3);
    const cardWidth = Math.min(230, (width - 80) / 3);
    const cardHeight = 260;
    const gap = 20;
    const totalWidth = (cardWidth * choices.length) + (gap * (choices.length - 1));
    const startX = (width - totalWidth) / 2 + (cardWidth / 2);

    choices.forEach((choice, index) => {
      const x = startX + (index * (cardWidth + gap));
      const y = height * 0.57;
      const card = this.createCard(x, y, cardWidth, cardHeight, choice);

      card.setScale(0.75).setAlpha(0);
      this.tweens.add({
        targets: card,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        ease: 'Back.Out',
        duration: 240,
        delay: index * 85,
      });
    });
  }

  createCard(x, y, width, height, choice) {
    const card = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, width, height, 0x221228, 0.96)
      .setStrokeStyle(2, 0xe7cc8b, 0.9)
      .setInteractive({ useHandCursor: true });

    const icon = this.add.rectangle(0, -70, 58, 58, choice.iconColor, 1)
      .setStrokeStyle(2, 0xffffff, 0.7);

    const title = this.add.text(0, -24, choice.name.toUpperCase(), {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      align: 'center',
      color: '#f8ebca',
      stroke: '#120911',
      strokeThickness: 4,
      wordWrap: { width: width - 18 },
    }).setOrigin(0.5);

    const detail = choice.level === 0
      ? 'NEW'
      : `Level ${choice.level} → ${choice.level + 1}`;

    const levelText = this.add.text(0, 12, detail, {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#89ffb6',
      stroke: '#120911',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const description = this.add.text(0, 72, choice.description, {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      align: 'center',
      color: '#ebdfcf',
      wordWrap: { width: width - 24 },
    }).setOrigin(0.5);

    card.add([bg, icon, title, levelText, description]);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x2e1735, 1);
      card.y = y - 4;
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x221228, 0.96);
      card.y = y;
    });

    bg.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene');
      gameScene.applyLevelUpChoice(choice);
      this.scene.resume('GameScene');
      this.scene.stop();
    });

    return card;
  }
}
