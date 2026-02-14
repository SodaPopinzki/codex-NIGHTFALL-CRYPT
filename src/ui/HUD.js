export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this.maxBarWidth = 220;

    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(100);

    this.healthBar = this.createBar(16, 16, 0xb6182b, 'HP 100/100');
    this.xpBar = this.createBar(16, 44, 0x6b2fb0, 'XP 0/6');

    this.timerText = scene.add.text(scene.scale.width * 0.5, 14, '00:00', this.textStyle())
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(101);

    this.killText = scene.add.text(scene.scale.width - 16, 14, '☠ 0', this.textStyle())
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(101);

    this.evolutionReadyText = scene.add.text(16, 70, 'Evolve: —', this.textStyle('12px'))
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(101)
      .setColor('#ffd76d');

    this.root.add([
      this.healthBar.border,
      this.healthBar.fill,
      this.healthBar.label,
      this.xpBar.border,
      this.xpBar.fill,
      this.xpBar.label,
      this.evolutionReadyText,
    ]);

    scene.scale.on('resize', this.handleResize, this);
  }

  createBar(x, y, fillColor, labelText) {
    const border = this.scene.add.rectangle(x, y, this.maxBarWidth + 4, 18)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xffffff, 1)
      .setFillStyle(0x000000, 0.35)
      .setScrollFactor(0)
      .setDepth(101);

    const fill = this.scene.add.rectangle(x + 2, y + 2, this.maxBarWidth, 14, fillColor, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(102);

    const label = this.scene.add.text(x + 6, y + 1, labelText, this.textStyle('12px'))
      .setScrollFactor(0)
      .setDepth(103);

    return { border, fill, label };
  }

  textStyle(size = '16px') {
    return {
      fontFamily: 'Georgia, serif',
      fontSize: size,
      color: '#f6ecff',
      stroke: '#1f1029',
      strokeThickness: 3,
    };
  }

  updateHealth(current, max) {
    const ratio = Phaser.Math.Clamp(current / max, 0, 1);
    this.healthBar.fill.width = this.maxBarWidth * ratio;
    this.healthBar.label.setText(`HP ${Math.ceil(current)}/${max}`);
  }

  updateXp(level, xp, threshold) {
    const ratio = Phaser.Math.Clamp(xp / threshold, 0, 1);
    this.xpBar.fill.width = this.maxBarWidth * ratio;
    this.xpBar.label.setText(`LV ${level}  XP ${xp}/${threshold}`);
  }

  updateEvolutionReady(readyEvolutionNames) {
    if (!readyEvolutionNames.length) {
      this.evolutionReadyText.setText('Evolve: —');
      return;
    }

    this.evolutionReadyText.setText(`Evolve Ready: ${readyEvolutionNames.join(', ')}`);
  }

  updateTimer(totalSeconds, bossWarning = false) {
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const secs = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
    this.timerText.setText(`${mins}:${secs}`);
    this.timerText.setColor(bossWarning ? '#ff5e66' : '#f6ecff');
  }

  updateKills(kills) {
    this.killText.setText(`☠ ${kills}`);
  }

  handleResize(gameSize) {
    this.timerText.setPosition(gameSize.width * 0.5, 14);
    this.killText.setPosition(gameSize.width - 16, 14);
  }
}
