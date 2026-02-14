import { GAME_CONFIG } from '../config/GameConfig';

export default class XPManager {
  constructor(scene) {
    this.scene = scene;
    this.level = 1;
    this.currentXp = 0;
    this.threshold = GAME_CONFIG.xp.baseThreshold;
  }

  addXp(amount) {
    this.currentXp += amount;

    while (this.currentXp >= this.threshold && this.level < GAME_CONFIG.xp.maxLevel) {
      this.currentXp -= this.threshold;
      this.level += 1;
      this.threshold = Math.ceil(this.threshold * GAME_CONFIG.xp.growthFactor);
      this.scene.events.emit('levelup', this.level);
    }

    this.scene.events.emit('xpchange', {
      level: this.level,
      xp: this.currentXp,
      threshold: this.threshold,
    });
  }
}
