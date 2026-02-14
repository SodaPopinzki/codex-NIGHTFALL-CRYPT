export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(12, 12).setScrollFactor(0).setDepth(20);

    this.healthText = scene.add.text(0, 0, 'HP: 100/100', this.textStyle());
    this.xpText = scene.add.text(0, 22, 'LVL 1 | XP 0/6', this.textStyle());
    this.timerText = scene.add.text(0, 44, 'Time: 00:00', this.textStyle());
    this.killText = scene.add.text(0, 66, 'Kills: 0', this.textStyle());
    this.weaponText = scene.add.text(0, 88, 'Weapon: Crimson Whip', this.textStyle());

    this.container.add([
      this.healthText,
      this.xpText,
      this.timerText,
      this.killText,
      this.weaponText,
    ]);
  }

  textStyle() {
    return {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#f2dfc9',
      stroke: '#2b1329',
      strokeThickness: 4,
    };
  }

  updateHealth(current, max) {
    this.healthText.setText(`HP: ${current}/${max}`);
  }

  updateXp(level, xp, threshold) {
    this.xpText.setText(`LVL ${level} | XP ${xp}/${threshold}`);
  }

  updateTimer(totalSeconds) {
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const secs = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
    this.timerText.setText(`Time: ${mins}:${secs}`);
  }

  updateKills(kills) {
    this.killText.setText(`Kills: ${kills}`);
  }
}
