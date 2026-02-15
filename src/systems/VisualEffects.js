import { GAME_CONFIG } from '../config/GameConfig';

const PARTICLE_KEY = 'fx-particle';

function shadeColor(color, amount) {
  const r = Phaser.Math.Clamp(((color >> 16) & 0xff) + amount, 0, 255);
  const g = Phaser.Math.Clamp(((color >> 8) & 0xff) + amount, 0, 255);
  const b = Phaser.Math.Clamp((color & 0xff) + amount, 0, 255);
  return (r << 16) | (g << 8) | b;
}

export default class VisualEffects {
  constructor(scene) {
    this.scene = scene;
    this.ensureParticleTexture();

    this.flashOverlay = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0xff3040, 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(300);

    this.vignette = scene.add.graphics().setScrollFactor(0).setDepth(250);
    this.chromaticR = scene.add.image(0, 0, 'player-placeholder')
      .setTint(0xff3f3f)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScrollFactor(0)
      .setDepth(220);
    this.chromaticB = scene.add.image(0, 0, 'player-placeholder')
      .setTint(0x55b7ff)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScrollFactor(0)
      .setDepth(220);

    this.dustEmitZone = new Phaser.Geom.Rectangle(0, 0, scene.scale.width, scene.scale.height);

    this.dustEmitter = scene.add.particles(0, 0, PARTICLE_KEY, {
      x: { min: 0, max: scene.scale.width },
      y: { min: 0, max: scene.scale.height },
      lifespan: { min: 6000, max: 12000 },
      quantity: 1,
      frequency: 260,
      alpha: { start: 0.05, end: 0 },
      scale: { start: 0.8, end: 0.2 },
      speedX: { min: -4, max: 4 },
      speedY: { min: -2, max: 2 },
      tint: 0xd8d2c2,
      emitZone: { type: 'random', source: this.dustEmitZone },
    }).setDepth(20).setScrollFactor(0);

    this.nextLightningAt = 0;
    this.transientParticles = 0;
    this.resize(scene.scale.gameSize);
    scene.scale.on('resize', this.resize, this);
  }

  ensureParticleTexture() {
    if (this.scene.textures.exists(PARTICLE_KEY)) return;
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(3, 3, 3);
    graphics.generateTexture(PARTICLE_KEY, 6, 6);
    graphics.destroy();
  }

  resize(gameSize) {
    this.flashOverlay.setSize(gameSize.width, gameSize.height);
    this.drawVignette(gameSize.width, gameSize.height);
    this.dustEmitter.setPosition(0, 0);
    this.dustEmitZone.setSize(gameSize.width, gameSize.height);
  }

  drawVignette(width, height) {
    this.vignette.clear();
    this.vignette.fillStyle(0x000000, 0.12);
    this.vignette.fillRect(0, 0, width, height);

    const steps = 6;
    for (let i = 0; i < steps; i += 1) {
      const pad = i * 18;
      this.vignette.lineStyle(36, 0x000000, 0.06);
      this.vignette.strokeRect(pad, pad, width - (pad * 2), height - (pad * 2));
    }
  }


  canSpawnTransient() {
    return this.transientParticles < GAME_CONFIG.performance.maxTransientParticles;
  }

  spawnBurst(x, y, config, depth = 80) {
    const maxBurst = GAME_CONFIG.performance.maxBurstParticles;
    const quantity = config.quantity ? Math.min(config.quantity, maxBurst) : config.quantity;
    if (!this.canSpawnTransient()) return null;

    const emitter = this.scene.add.particles(x, y, PARTICLE_KEY, {
      ...config,
      quantity,
      emitting: false,
    }).setDepth(depth);

    this.transientParticles += 1;
    emitter.explode();
    this.scene.time.delayedCall((config.lifespan?.max ?? config.lifespan ?? 600) + 20, () => {
      this.transientParticles = Math.max(0, this.transientParticles - 1);
      emitter.destroy();
    });
    return emitter;
  }

  playEnemyDeath(x, y, color = 0xffffff) {
    this.spawnBurst(x, y, {
      quantity: Phaser.Math.Between(8, 12),
      lifespan: 300,
      speed: { min: 50, max: 150 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: [shadeColor(color, -20), color, shadeColor(color, 25)],
      blendMode: 'ADD',
    }, 70);
  }

  playImpact(x, y) {
    const flash = this.scene.add.circle(x, y, 10, 0xffffff, 0.9).setDepth(90);
    this.scene.tweens.add({ targets: flash, alpha: 0, scale: 1.5, duration: 100, onComplete: () => flash.destroy() });
  }

  playLevelUp(player) {
    this.spawnBurst(player.x, player.y, {
      quantity: 30,
      lifespan: 600,
      speed: { min: 80, max: 220 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffd86e, 0xfff3b0],
      blendMode: 'ADD',
    }, 100);

    const ring = this.scene.add.circle(player.x, player.y, 10, 0xffda78, 0).setStrokeStyle(4, 0xffda78, 0.9).setDepth(99);
    this.scene.tweens.add({ targets: ring, radius: 120, alpha: 0, duration: 500, ease: 'Cubic.Out', onComplete: () => ring.destroy() });
  }

  playBossDeath(x, y, color = 0xffffff) {
    this.spawnBurst(x, y, {
      quantity: 70,
      lifespan: { min: 600, max: 1200 },
      speed: { min: 120, max: 300 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffffff, color, 0xff8e8e],
      blendMode: 'ADD',
    }, 110);
    this.scene.cameras.main.shake(220, 0.02);
  }

  playEvolution(player, colorA, colorB) {
    const emitterA = this.scene.add.particles(player.x, player.y, PARTICLE_KEY, {
      quantity: 2,
      frequency: 20,
      lifespan: 600,
      speed: { min: 20, max: 50 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: colorA,
      blendMode: 'ADD',
    }).setDepth(105);
    const emitterB = this.scene.add.particles(player.x, player.y, PARTICLE_KEY, {
      quantity: 2,
      frequency: 20,
      lifespan: 600,
      speed: { min: 20, max: 50 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
      tint: colorB,
      blendMode: 'ADD',
    }).setDepth(105);

    this.scene.tweens.addCounter({
      from: 0,
      to: Math.PI * 4,
      duration: 1000,
      onUpdate: (tween) => {
        const a = tween.getValue();
        emitterA.setPosition(player.x + Math.cos(a) * 26, player.y + Math.sin(a) * 26);
        emitterB.setPosition(player.x + Math.cos(-a) * 26, player.y + Math.sin(-a) * 26);
      },
      onComplete: () => {
        emitterA.destroy();
        emitterB.destroy();
      },
    });
  }

  playGemTrail(x, y, player) {
    this.spawnBurst(x, y, {
      quantity: 10,
      lifespan: 250,
      speed: { min: 30, max: 90 },
      scale: { start: 0.45, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: [0x87ff8f, 0xeaffee],
      blendMode: 'ADD',
    }, 80);

    const trail = this.scene.add.particles(x, y, PARTICLE_KEY, {
      quantity: 1,
      frequency: 18,
      lifespan: 220,
      speed: 0,
      alpha: { start: 0.6, end: 0 },
      scale: { start: 0.4, end: 0 },
      tint: [0x9dffa6, 0xffffff],
      blendMode: 'ADD',
    }).setDepth(80);

    this.scene.tweens.add({
      targets: trail,
      x: player.x,
      y: player.y,
      duration: 120,
      ease: 'Sine.In',
      onComplete: () => trail.destroy(),
    });
  }

  onPlayerHit() {
    this.scene.cameras.main.shake(150, 0.03);
    this.flashOverlay.setFillStyle(0xff3344, 0.3);
    this.scene.tweens.add({ targets: this.flashOverlay, alpha: 0, duration: 50, onStart: () => this.flashOverlay.setAlpha(0.3) });
  }

  onBossHit() {
    this.scene.cameras.main.shake(100, 0.018);
  }

  update(player, elapsedSeconds) {
    const cam = this.scene.cameras.main;
    const lowHealth = player.health / player.maxHealth < 0.25;
    if (lowHealth) {
      const wave = Math.sin(elapsedSeconds * 9) * 2;
      this.chromaticR.setTexture(player.texture.key).setDisplaySize(player.displayWidth, player.displayHeight);
      this.chromaticB.setTexture(player.texture.key).setDisplaySize(player.displayWidth, player.displayHeight);
      this.chromaticR.setPosition((player.x - cam.worldView.x) + 2 + wave, player.y - cam.worldView.y).setAlpha(0.24);
      this.chromaticB.setPosition((player.x - cam.worldView.x) - 2 - wave, player.y - cam.worldView.y).setAlpha(0.2);
    } else {
      this.chromaticR.setAlpha(0);
      this.chromaticB.setAlpha(0);
    }

    if (this.nextLightningAt === 0) {
      this.nextLightningAt = elapsedSeconds + Phaser.Math.FloatBetween(30, 60);
    } else if (elapsedSeconds >= this.nextLightningAt) {
      this.nextLightningAt = elapsedSeconds + Phaser.Math.FloatBetween(30, 60);
      this.flashOverlay.setFillStyle(0xffffff, 0.2);
      this.scene.tweens.add({
        targets: this.flashOverlay,
        alpha: 0,
        duration: 50,
        onStart: () => this.flashOverlay.setAlpha(0.2),
      });
    }
  }

  emitProjectileTrail(projectile) {
    this.spawnBurst(projectile.x, projectile.y, {
      quantity: Phaser.Math.Between(2, 3),
      lifespan: 180,
      speed: { min: 10, max: 35 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.45, end: 0 },
      tint: projectile.tintTopLeft || 0xffffff,
    }, 75);
  }
}
