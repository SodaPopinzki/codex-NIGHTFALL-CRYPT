import { GAME_CONFIG } from '../config/GameConfig';
import { ENEMY_TYPES } from '../config/EnemyConfig';

const BOSS_WARNING_TEXT = 'A POWERFUL ENEMY APPROACHES';

export default class BossManager {
  constructor(scene, player, enemies, onBossDeath) {
    this.scene = scene;
    this.player = player;
    this.enemies = enemies;
    this.onBossDeath = onBossDeath;

    this.schedule = GAME_CONFIG.bosses.schedule.map((entry) => ({ ...entry, warned: false, spawned: false }));
    this.appearances = { boneDragon: 0, vampireLord: 0, deathItself: 0 };

    this.activeBoss = null;
    this.bossesDefeated = 0;
    this.lastContactTick = 0;

    this.warningText = scene.add.text(scene.scale.width * 0.5, scene.scale.height * 0.38, BOSS_WARNING_TEXT, {
      fontFamily: 'Georgia, serif',
      fontSize: '34px',
      color: '#ffd4d4',
      stroke: '#290d0d',
      strokeThickness: 8,
      align: 'center',
    }).setOrigin(0.5).setDepth(170).setScrollFactor(0).setVisible(false);

    this.bossNameText = scene.add.text(scene.scale.width * 0.5, GAME_CONFIG.bosses.healthBar.y - 24, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#f8d8d8',
      stroke: '#14080c',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(161).setScrollFactor(0).setVisible(false);

    this.healthBar = this.createHealthBar();

    scene.scale.on('resize', this.handleResize, this);
  }

  createHealthBar() {
    const { width } = this.scene.scale;
    const { y, height: barHeight, width: barWidth } = GAME_CONFIG.bosses.healthBar;
    const border = this.scene.add.rectangle(width * 0.5, y, barWidth + 6, barHeight + 6)
      .setOrigin(0.5)
      .setFillStyle(0x000000, 0.6)
      .setStrokeStyle(2, 0xffcfcf, 1)
      .setDepth(160)
      .setScrollFactor(0)
      .setVisible(false);
    const fill = this.scene.add.rectangle((width * 0.5) - (barWidth / 2), y, barWidth, barHeight, 0xb71f2e, 1)
      .setOrigin(0, 0.5)
      .setDepth(161)
      .setScrollFactor(0)
      .setVisible(false);
    return { border, fill, width: barWidth };
  }

  update(elapsedSeconds, time, delta) {
    this.schedule.forEach((entry) => {
      if (!entry.warned && elapsedSeconds >= entry.atSeconds - GAME_CONFIG.bosses.warningSeconds) {
        entry.warned = true;
        this.showWarning();
      }
      if (!entry.spawned && elapsedSeconds >= entry.atSeconds) {
        entry.spawned = true;
        this.spawnBoss(entry.type);
      }
    });

    if (!this.activeBoss?.active) return;

    this.updateBossAI(time, delta);
    this.updateHealthBar();
  }

  showWarning() {
    this.scene.cameras.main.flash(220, 180, 0, 0, false);
    this.warningText.setVisible(true).setAlpha(1);
    this.scene.tweens.add({
      targets: this.warningText,
      alpha: 0,
      duration: GAME_CONFIG.bosses.warningSeconds * 1000,
      ease: 'Linear',
      onComplete: () => this.warningText.setVisible(false).setAlpha(1),
    });
  }

  spawnBoss(type) {
    if (this.activeBoss?.active) return;

    const appearance = this.appearances[type] ?? 0;
    this.appearances[type] = appearance + 1;

    const bossData = this.createBossData(type, appearance);
    const spawnPoint = this.getSpawnPointInFacingDirection();
    const textureKey = this.getTextureKey(type, bossData.width, bossData.height, bossData.color);

    const boss = this.scene.physics.add.sprite(spawnPoint.x, spawnPoint.y, textureKey);
    boss.setOrigin(0.5);
    boss.setDepth(45);
    boss.body.setAllowGravity(false);
    boss.body.setImmovable(true);
    boss.body.setCircle(Math.min(bossData.width, bossData.height) * 0.34);
    boss.setDataEnabled();
    Object.entries(bossData).forEach(([key, value]) => boss.setData(key, value));
    boss.setData('maxHp', bossData.hp);
    boss.setData('hp', bossData.hp);
    boss.setData('baseSpeed', bossData.speed ?? 0);
    boss.setData('nextFireBreathAt', 0);
    boss.setData('nextTailSwipeAt', 0);
    boss.setData('nextSummonAt', 0);
    boss.setData('nextLifestealAt', 0);
    boss.setData('dashState', 'dash');
    boss.setData('dashStateUntil', 0);

    boss.takeDamage = (amount) => {
      const hp = boss.getData('hp') - amount;
      boss.setData('hp', hp);
      boss.setTintFill(0xffffff);
      this.scene.time.delayedCall(70, () => boss.active && boss.clearTint());
      if (hp <= 0) {
        this.handleBossDeath(boss);
      }
    };

    boss.destroyBoss = () => {
      if (!boss.active) return;
      boss.disableBody(true, true);
      boss.destroy();
    };

    this.activeBoss = boss;
    this.bossNameText.setText(bossData.name).setVisible(true);
    this.healthBar.border.setVisible(true);
    this.healthBar.fill.setVisible(true);
  }

  createBossData(type, appearanceIndex) {
    const defs = GAME_CONFIG.bosses.types;
    if (type === 'boneDragon') {
      const cfg = defs.boneDragon;
      return {
        type,
        name: cfg.name,
        hp: cfg.baseHp + (cfg.hpPerAppearance * appearanceIndex),
        speed: cfg.speed,
        width: cfg.width,
        height: cfg.height,
        color: cfg.color,
      };
    }

    if (type === 'vampireLord') {
      const cfg = defs.vampireLord;
      return {
        type,
        name: cfg.name,
        hp: cfg.baseHp + (cfg.hpPerAppearance * appearanceIndex),
        speed: cfg.dashSpeed,
        width: cfg.width,
        height: cfg.height,
        color: cfg.color,
      };
    }

    const cfg = defs.deathItself;
    return {
      type,
      name: cfg.name,
      hp: cfg.hp,
      speed: cfg.speed,
      width: cfg.width,
      height: cfg.height,
      color: cfg.color,
      knockbackImmune: cfg.knockbackImmune,
    };
  }

  updateBossAI(time, delta) {
    const boss = this.activeBoss;
    const type = boss.getData('type');

    if (type === 'boneDragon') this.updateBoneDragon(time);
    if (type === 'vampireLord') this.updateVampireLord(time);
    if (type === 'deathItself') this.updateDeathItself();
  }

  updateBoneDragon(time) {
    const boss = this.activeBoss;
    this.moveTowardPlayer(boss, boss.getData('baseSpeed'));

    const cfg = GAME_CONFIG.bosses.types.boneDragon;
    if (time >= boss.getData('nextFireBreathAt')) {
      boss.setData('nextFireBreathAt', time + cfg.fireBreathCooldownMs);
      const toPlayer = new Phaser.Math.Vector2(this.player.x - boss.x, this.player.y - boss.y);
      const forward = this.velocityAsDirection(boss.body.velocity);
      const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(forward.angle() - toPlayer.angle()));
      const withinCone = toPlayer.length() < 180 && angleDiff <= 0.65;
      if (withinCone && this.player.takeDamage(cfg.fireBreathDamage)) this.scene.events.emit('playerhit');
    }

    if (time >= boss.getData('nextTailSwipeAt')) {
      boss.setData('nextTailSwipeAt', time + cfg.tailSwipeCooldownMs);
      const distance = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
      if (distance <= cfg.tailSwipeRadius && this.player.takeDamage(cfg.tailSwipeDamage)) this.scene.events.emit('playerhit');
    }
  }

  updateVampireLord(time) {
    const boss = this.activeBoss;
    const cfg = GAME_CONFIG.bosses.types.vampireLord;

    if (time >= boss.getData('nextSummonAt')) {
      boss.setData('nextSummonAt', time + cfg.summonCooldownMs);
      for (let i = 0; i < cfg.summonCount; i += 1) {
        this.spawnMinionBat();
      }
    }

    if (time >= boss.getData('nextLifestealAt')) {
      boss.setData('nextLifestealAt', time + cfg.lifestealCooldownMs);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      boss.setPosition(this.player.x + (Math.cos(angle) * 40), this.player.y + (Math.sin(angle) * 40));
      if (this.player.takeDamage(cfg.lifestealDamage)) this.scene.events.emit('playerhit');
      boss.setData('hp', Math.min(boss.getData('maxHp'), boss.getData('hp') + cfg.lifestealHeal));
    }

    if (time >= boss.getData('dashStateUntil')) {
      const nextState = boss.getData('dashState') === 'dash' ? 'pause' : 'dash';
      boss.setData('dashState', nextState);
      boss.setData('dashStateUntil', time + (nextState === 'dash' ? cfg.dashDurationMs : cfg.pauseDurationMs));
    }

    if (boss.getData('dashState') === 'dash') {
      this.moveTowardPlayer(boss, cfg.dashSpeed);
    } else {
      boss.body.stop();
    }
  }

  updateDeathItself() {
    const boss = this.activeBoss;
    const cfg = GAME_CONFIG.bosses.types.deathItself;
    const currentSpeed = boss.getData('baseSpeed') * (1 + (this.scene.elapsedSeconds * cfg.speedRampPerSecond));
    this.moveTowardPlayer(boss, currentSpeed);

    if (this.scene.time.now - this.lastContactTick >= GAME_CONFIG.bosses.contactTickMs) {
      this.lastContactTick = this.scene.time.now;
      const distance = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
      if (distance <= 64 && this.player.takeDamage((cfg.contactDamagePerSecond * GAME_CONFIG.bosses.contactTickMs) / 1000)) {
        this.scene.events.emit('playerhit');
      }
    }

    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, boss.x, boss.y);
      enemy.speed = enemy.getData('baseSpeed') ?? enemy.speed;
      if (distance <= cfg.auraRadius) {
        enemy.speed = (enemy.getData('baseSpeed') ?? enemy.speed) * (1 + cfg.auraSpeedBoost);
      }
    });
  }

  spawnMinionBat() {
    const bat = this.scene.enemyPool.acquire();
    const spawnAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    bat.setPosition(this.activeBoss.x + (Math.cos(spawnAngle) * 40), this.activeBoss.y + (Math.sin(spawnAngle) * 40));
    bat.configure({ ...ENEMY_TYPES.bat, hp: ENEMY_TYPES.bat.hp * 1.2, speed: ENEMY_TYPES.bat.speed * 1.1, xp: 2 });
    this.enemies.add(bat);
  }

  handleBossDeath(boss) {
    this.bossesDefeated += 1;
    this.activeBoss = null;
    this.healthBar.border.setVisible(false);
    this.healthBar.fill.setVisible(false);
    this.bossNameText.setVisible(false);

    this.scene.enemies.children.iterate((enemy) => {
      if (enemy?.active) {
        enemy.die?.();
      }
    });

    this.spawnTreasureChest(boss.x, boss.y);
    boss.destroyBoss();
    this.onBossDeath?.();
  }

  spawnTreasureChest(x, y) {
    const key = this.getTextureKey('bossChest', 20, 20, 0xd7a63d);
    const chest = this.scene.physics.add.sprite(x, y, key).setDepth(50);
    chest.body.setAllowGravity(false);

    const rewardText = this.scene.add.text(x, y - 26, 'TREASURE', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#ffe4aa',
      stroke: '#422612',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(51);

    const cleanup = () => {
      chest.destroy();
      rewardText.destroy();
      if (collider?.active) collider.destroy();
    };

    const collider = this.scene.physics.add.overlap(this.player, chest, () => {
      this.scene.handleBossTreasure?.();
      cleanup();
    });

    this.scene.time.delayedCall(GAME_CONFIG.bosses.chest.lifetimeMs, () => {
      if (chest.active) cleanup();
    });
  }

  moveTowardPlayer(boss, speed) {
    const toPlayer = new Phaser.Math.Vector2(this.player.x - boss.x, this.player.y - boss.y);
    if (toPlayer.lengthSq() === 0) {
      boss.body.stop();
      return;
    }
    toPlayer.normalize().scale(speed);
    boss.setVelocity(toPlayer.x, toPlayer.y);
  }

  updateHealthBar() {
    const hp = this.activeBoss.getData('hp');
    const maxHp = this.activeBoss.getData('maxHp');
    const ratio = Phaser.Math.Clamp(hp / maxHp, 0, 1);
    this.healthBar.fill.width = this.healthBar.width * ratio;
  }

  getSpawnPointInFacingDirection() {
    const camera = this.scene.cameras.main;
    const direction = this.player.lastMoveDirection.clone().normalize();
    const halfW = camera.width * 0.5 + GAME_CONFIG.bosses.spawnPadding;
    const halfH = camera.height * 0.5 + GAME_CONFIG.bosses.spawnPadding;
    return {
      x: this.player.x + (direction.x * halfW),
      y: this.player.y + (direction.y * halfH),
    };
  }

  velocityAsDirection(velocity) {
    const dir = new Phaser.Math.Vector2(velocity.x, velocity.y);
    if (dir.lengthSq() === 0) return new Phaser.Math.Vector2(1, 0);
    return dir.normalize();
  }

  getTextureKey(base, width, height, color) {
    const key = `${base}-${width}x${height}-${color.toString(16)}`;
    if (this.scene.textures.exists(key)) return key;

    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.lineStyle(2, 0x111111, 1);
    graphics.strokeRect(0, 0, width, height);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
    return key;
  }

  handleResize(gameSize) {
    this.warningText.setPosition(gameSize.width * 0.5, gameSize.height * 0.38);
    this.bossNameText.setPosition(gameSize.width * 0.5, GAME_CONFIG.bosses.healthBar.y - 24);
    this.healthBar.border.setPosition(gameSize.width * 0.5, GAME_CONFIG.bosses.healthBar.y);
    this.healthBar.fill.setPosition((gameSize.width * 0.5) - (this.healthBar.width / 2), GAME_CONFIG.bosses.healthBar.y);
  }
}
