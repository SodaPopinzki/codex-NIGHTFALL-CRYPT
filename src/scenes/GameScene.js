import { GAME_CONFIG } from '../config/GameConfig';
import { PASSIVE_UPGRADES, WEAPON_CONFIG } from '../config/WeaponConfig';
import { EVOLUTION_CONFIG, EVOLVED_WEAPON_CONFIG } from '../config/EvolutionConfig';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import ObjectPool from '../utils/ObjectPool';
import WaveManager from '../systems/WaveManager';
import XPManager from '../systems/XPManager';
import BossManager from '../systems/BossManager';
import HUD from '../ui/HUD';
import VirtualJoystick from '../ui/VirtualJoystick';
import HolyWater from '../weapons/HolyWater';
import CrossBoomerang from '../weapons/CrossBoomerang';
import WhipChain from '../weapons/WhipChain';
import FlamePillar from '../weapons/FlamePillar';
import GarlicAura from '../weapons/GarlicAura';
import BoneShield from '../weapons/BoneShield';
import SilverDagger from '../weapons/SilverDagger';
import ArcaneOrb from '../weapons/ArcaneOrb';
import SacredFlood from '../weapons/SacredFlood';
import InfernoLash from '../weapons/InfernoLash';
import PurificationNova from '../weapons/PurificationNova';
import NecroStorm from '../weapons/NecroStorm';
import VisualEffects from '../systems/VisualEffects';
import {
  discoverEvolution,
  discoverWeapon,
  getUnlockedBonuses,
  loadMetaProgression,
} from '../systems/MetaProgression';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    if (typeof data?.hardMode === 'boolean') {
      this.registry.set('hardModeEnabled', data.hardMode);
    }
  }

  create() {
    this.physics.world.setBounds(0, 0, GAME_CONFIG.world.width, GAME_CONFIG.world.height);
    this.drawBackgroundTiles();

    this.player = new Player(this, GAME_CONFIG.player.startX, GAME_CONFIG.player.startY);
    this.vfx = new VisualEffects(this);

    this.cameras.main.setBounds(0, 0, GAME_CONFIG.world.width, GAME_CONFIG.world.height);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(50, 50);

    this.enemyPool = new ObjectPool(
      () => {
        const enemy = new Enemy(this, -999, -999);
        enemy.setCallbacks((deadEnemy) => this.handleEnemyDeath(deadEnemy), (deadEnemy) => this.enemyPool.release(deadEnemy));
        return enemy;
      },
      (enemy) => enemy.deactivate(),
    );
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.weaponProjectiles = this.physics.add.group({ runChildUpdate: false });

    this.waveManager = new WaveManager(this, this.enemyPool, this.enemies, this.player);
    this.xpManager = new XPManager(this, this.player);
    this.bossManager = new BossManager(this, this.player, this.enemies, () => {
      this.bossesDefeated += 1;
    });
    this.hud = new HUD(this);
    this.joystick = new VirtualJoystick(this);

    this.meta = loadMetaProgression();
    this.unlockedBonuses = getUnlockedBonuses(this.meta);
    this.bonusIds = new Set(this.unlockedBonuses.map((bonus) => bonus.id));
    this.damageMultiplier = this.bonusIds.has('firstBlood') ? 1.05 : 1;
    this.enemyStatMultiplier = this.registry.get('hardModeEnabled') ? 1.5 : 1;

    this.weapons = [];
    this.weaponState = new Map();
    this.weaponCatalog = [
      {
        id: 'holyWater',
        classRef: HolyWater,
        config: WEAPON_CONFIG.holyWater,
        iconColor: 0x7eb8ff,
        description: 'Throw vials that leave damaging sanctified pools.',
      },
      {
        id: 'crossBoomerang',
        classRef: CrossBoomerang,
        config: WEAPON_CONFIG.crossBoomerang,
        iconColor: 0xffe680,
        description: 'Launches a returning cross through enemy lines.',
      },
      {
        id: 'whipChain',
        classRef: WhipChain,
        config: WEAPON_CONFIG.whipChain,
        iconColor: 0xffffff,
        description: 'Snaps a wide whip in your facing direction.',
      },
      {
        id: 'flamePillar',
        classRef: FlamePillar,
        config: WEAPON_CONFIG.flamePillar,
        iconColor: 0xff6b3d,
        description: 'Calls down a burning pillar at enemy positions.',
      },
      {
        id: 'garlicAura',
        classRef: GarlicAura,
        config: WEAPON_CONFIG.garlicAura,
        iconColor: 0x67e36a,
        description: 'A toxic aura ticks damage and pushes foes back.',
      },
      {
        id: 'boneShield',
        classRef: BoneShield,
        config: WEAPON_CONFIG.boneShield,
        iconColor: 0xf2f2f2,
        description: 'Orbiting bone shards slice enemies on contact.',
      },
      {
        id: 'silverDagger',
        classRef: SilverDagger,
        config: WEAPON_CONFIG.silverDagger,
        iconColor: 0xb3b3b8,
        description: 'Rain daggers from above in a cursed zone.',
      },
      {
        id: 'arcaneOrb',
        classRef: ArcaneOrb,
        config: WEAPON_CONFIG.arcaneOrb,
        iconColor: 0xa64dff,
        description: 'Slow orb that phases through all enemies.',
      },
      {
        id: 'sacredFlood',
        classRef: SacredFlood,
        config: EVOLVED_WEAPON_CONFIG.sacredFlood,
        iconColor: 0x4f93ff,
        description: 'Massive sanctified wave sweeps the whole screen.',
        isEvolved: true,
      },
      {
        id: 'infernoLash',
        classRef: InfernoLash,
        config: EVOLVED_WEAPON_CONFIG.infernoLash,
        iconColor: 0xff5b2e,
        description: 'Whip lash leaves burning trails in its wake.',
        isEvolved: true,
      },
      {
        id: 'purificationNova',
        classRef: PurificationNova,
        config: EVOLVED_WEAPON_CONFIG.purificationNova,
        iconColor: 0xd9ecff,
        description: 'Silver nova ring erupts outward every 5 seconds.',
        isEvolved: true,
      },
      {
        id: 'necroStorm',
        classRef: NecroStorm,
        config: EVOLVED_WEAPON_CONFIG.necroStorm,
        iconColor: 0xefefff,
        description: 'Orbiting skulls fire arcane bolts at enemies.',
        isEvolved: true,
      },
    ];
    this.passiveCatalog = [
      { ...PASSIVE_UPGRADES.maxHealth, iconColor: 0xd74f5f },
      { ...PASSIVE_UPGRADES.moveSpeed, iconColor: 0x4da5ff },
      { ...PASSIVE_UPGRADES.pickupRadius, iconColor: 0x65f0ff },
    ];

    this.addWeapon('holyWater');

    this.kills = 0;
    this.elapsedSeconds = 0;
    this.bossesDefeated = 0;
    this.evolvedWeapons = 0;

    if (this.bonusIds.has('survivor')) {
      this.player.maxHealth += 10;
      this.player.health += 10;
    }
    if (this.bonusIds.has('collector')) {
      this.xpManager.pickupRadius *= 1.15;
    }
    if (this.bonusIds.has('alchemist')) {
      const randomWeapon = Phaser.Utils.Array.GetRandom(this.weaponCatalog.filter((entry) => !entry.isEvolved));
      if (randomWeapon && randomWeapon.id !== 'holyWater') this.addWeapon(randomWeapon.id, { level: 2 });
      if (randomWeapon?.id === 'holyWater') {
        const starter = this.weaponState.get('holyWater');
        starter.level = 2;
        starter.weapon.setLevel(2);
      }
    }

    this.hud.updateHealth(this.player.health, this.player.maxHealth);
    this.hud.updateXp(this.xpManager.level, this.xpManager.currentXp, this.xpManager.threshold);
    this.hud.updateKills(this.kills);
    this.updateEvolutionHud();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    this.physics.add.overlap(this.player, this.enemies, (_, enemy) => {
      const gotHit = this.player.takeDamage(enemy.damage);
      if (gotHit) this.events.emit('playerhit');
      if (this.player.isDead) this.endRun('defeat');
    });

    this.physics.add.overlap(this.weaponProjectiles, this.enemies, (projectile, enemy) => {
      this.handleWeaponHit(projectile, enemy);
    });

    this.events.on('playerhit', () => {
      this.vfx.onPlayerHit();
      this.hud.updateHealth(this.player.health, this.player.maxHealth);
      if (this.player.isDead) this.endRun('defeat');
    });

    this.events.on('xpchange', ({ level, xp, threshold }) => this.hud.updateXp(level, xp, threshold));
    this.events.on('levelup', () => this.hud.updateHealth(this.player.health, this.player.maxHealth));

    this.input.keyboard.on('keydown-ESC', () => this.openPauseMenu());

    this.pauseButton = this.add.text(this.scale.width - 18, 16, 'II', {
      fontFamily: 'Georgia, serif',
      fontSize: '26px',
      color: '#f2dfc9',
      backgroundColor: '#2a1733',
      padding: { x: 8, y: 2 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(220).setInteractive({ useHandCursor: true });
    this.pauseButton.on('pointerdown', () => this.openPauseMenu());
  }

  openPauseMenu() {
    if (this.scene.isActive('PauseScene')) return;
    const weapons = Array.from(this.weaponState.entries()).map(([id, state]) => ({
      id,
      name: this.getWeaponDefinition(id)?.config.name ?? id,
      level: state.level,
    }));
    this.scene.pause();
    this.scene.launch('PauseScene', {
      weapons,
      time: this.elapsedSeconds,
      kills: this.kills,
    });
  }

  handleWeaponHit(projectile, enemy) {
    if (!projectile.active || !enemy.active) return;

    const type = projectile.getData('weaponType');
    if (
      type === 'holyWaterBottle'
      || type === 'holyWaterZone'
      || type === 'flamePillar'
      || type === 'garlicAuraVisual'
      || type === 'boneShield'
      || type === 'silverDagger'
      || type === 'arcaneOrb'
      || type === 'infernoLashTrail'
      || type === 'purificationNova'
      || type === 'necroStormSkull'
    ) return;

    const hitEnemies = projectile.getData('hitEnemies');
    if (hitEnemies?.has(enemy)) return;

    enemy.takeDamage(projectile.getData('damage'));
    this.vfx.playImpact(projectile.x, projectile.y);
    this.sound.play('sfx_hit');

    if (hitEnemies) {
      hitEnemies.add(enemy);
    }

    const pierce = projectile.getData('pierce');
    if (typeof pierce === 'number') {
      projectile.setData('pierce', pierce - 1);
      if (pierce - 1 <= 0) {
        this.releaseProjectileFromWeapon(projectile);
      }
    }
  }

  releaseProjectileFromWeapon(projectile) {
    this.weapons.forEach((weapon) => {
      if (weapon.projectilePool.active.has(projectile)) {
        weapon.releaseProjectile(projectile);
      }
    });
  }

  getWeaponDefinition(id) {
    return this.weaponCatalog.find((entry) => entry.id === id);
  }

  addWeapon(id, { level = 1 } = {}) {
    if (this.weaponState.has(id)) return;

    const definition = this.getWeaponDefinition(id);
    if (!definition) return;

    const scaledConfig = { ...definition.config };
    if (typeof scaledConfig.damage === 'number') scaledConfig.damage *= this.damageMultiplier;
    if (typeof scaledConfig.trailDamage === 'number') scaledConfig.trailDamage *= this.damageMultiplier;
    if (typeof scaledConfig.boltDamage === 'number') scaledConfig.boltDamage *= this.damageMultiplier;
    const weapon = new definition.classRef(this, this.player, scaledConfig);
    weapon.setLevel(level);
    this.weapons.push(weapon);
    this.weaponState.set(id, { level, weapon, isEvolved: Boolean(definition.isEvolved) });
    if (definition.isEvolved) {
      discoverEvolution(id);
    } else {
      discoverWeapon(id);
    }
  }

  removeWeapon(id) {
    const state = this.weaponState.get(id);
    if (!state) return;

    state.weapon.destroy();
    this.weapons = this.weapons.filter((weapon) => weapon !== state.weapon);
    this.weaponState.delete(id);
  }

  getReadyEvolutions() {
    return EVOLUTION_CONFIG.filter((evolution) => {
      const [weaponA, weaponB] = evolution.requires;
      const stateA = this.weaponState.get(weaponA);
      const stateB = this.weaponState.get(weaponB);

      return Boolean(
        stateA && stateB
        && stateA.level >= 8
        && stateB.level >= 8
        && !this.weaponState.has(evolution.evolvedWeaponId),
      );
    });
  }

  getLevelUpChoices(count = 3) {
    const readyEvolutions = this.getReadyEvolutions().map((evolution) => {
      const [weaponAId, weaponBId] = evolution.requires;
      const weaponA = this.getWeaponDefinition(weaponAId);
      const weaponB = this.getWeaponDefinition(weaponBId);
      const evolved = this.getWeaponDefinition(evolution.evolvedWeaponId);
      return {
        id: evolution.id,
        type: 'evolution',
        evolution,
        name: evolution.name,
        sourceWeapons: [weaponA?.config.name ?? weaponAId, weaponB?.config.name ?? weaponBId],
        resultWeapon: evolved?.config.name ?? evolution.name,
        description: evolution.description,
        level: 8,
        iconColor: evolved?.iconColor ?? 0xffdf6e,
      };
    });

    const weaponChoices = this.weaponCatalog
      .filter((entry) => !entry.isEvolved && (this.weaponState.get(entry.id)?.level ?? 0) < 8)
      .map((entry) => {
        const level = this.weaponState.get(entry.id)?.level ?? 0;
        return {
          id: entry.id,
          type: 'weapon',
          name: entry.config.name,
          description: entry.description,
          level,
          iconColor: entry.iconColor,
        };
      });

    const passiveChoices = this.passiveCatalog.map((entry) => ({
      id: entry.id,
      type: 'passive',
      name: entry.name,
      description: entry.description,
      level: 0,
      iconColor: entry.iconColor,
    }));

    const reserved = readyEvolutions.slice(0, count);
    const remaining = count - reserved.length;
    const pool = Phaser.Utils.Array.Shuffle([...weaponChoices, ...passiveChoices]);
    return [...reserved, ...pool.slice(0, remaining)];
  }

  updateEvolutionHud() {
    const ready = this.getReadyEvolutions().map((evolution) => evolution.name);
    this.hud.updateEvolutionReady(ready);
  }

  applyLevelUpChoice(choice) {
    if (!choice) return;

    if (choice.type === 'evolution') {
      const evolution = choice.evolution;
      evolution.requires.forEach((weaponId) => this.removeWeapon(weaponId));
      this.addWeapon(evolution.evolvedWeaponId);
      this.evolvedWeapons += 1;
      this.sound.play('sfx_evolve');
      const [weaponAId, weaponBId] = evolution.requires;
      const colorA = this.getWeaponDefinition(weaponAId)?.iconColor ?? 0xffd67d;
      const colorB = this.getWeaponDefinition(weaponBId)?.iconColor ?? 0xffffff;
      this.vfx.playEvolution(this.player, colorA, colorB);
      this.cameras.main.flash(300, 255, 226, 120, false);
      this.updateEvolutionHud();
      return;
    }

    if (choice.type === 'weapon') {
      const state = this.weaponState.get(choice.id);
      if (!state) {
        this.addWeapon(choice.id);
      } else if (state.level < 8 && !state.isEvolved) {
        state.level += 1;
        state.weapon.setLevel(state.level);
      }
      this.updateEvolutionHud();
      return;
    }

    if (choice.id === 'maxHealth') {
      this.player.maxHealth += 20;
      this.player.health += 20;
      this.hud.updateHealth(this.player.health, this.player.maxHealth);
    } else if (choice.id === 'moveSpeed') {
      this.player.speed *= 1.1;
    } else if (choice.id === 'pickupRadius') {
      this.xpManager.pickupRadius += 20;
    }
  }

  handleEnemyDeath(enemy) {
    this.kills += 1;
    this.hud.updateKills(this.kills);
    this.vfx.playEnemyDeath(enemy.x, enemy.y, enemy.baseTint);
    this.sound.play('sfx_death');
    this.xpManager.spawnGem(enemy.x, enemy.y, enemy.xpValue);
  }

  handleBossTreasure() {
    const readyEvolutions = this.getReadyEvolutions();
    if (readyEvolutions.length > 0) {
      this.applyLevelUpChoice({ type: 'evolution', evolution: readyEvolutions[0] });
      return;
    }

    this.player.health = Phaser.Math.Clamp(
      this.player.health + GAME_CONFIG.bosses.chest.rareHeal,
      0,
      this.player.maxHealth,
    );
    this.player.speed *= GAME_CONFIG.bosses.chest.rareMoveSpeedMult;
    this.hud.updateHealth(this.player.health, this.player.maxHealth);
  }

  endRun(mode) {
    this.scene.start('GameOverScene', {
      mode,
      time: this.elapsedSeconds,
      kills: this.kills,
      bossesDefeated: this.bossesDefeated,
      weaponsEvolved: this.evolvedWeapons,
      hardMode: Boolean(this.registry.get('hardModeEnabled')),
    });
  }

  drawBackgroundTiles() {
    const tileSize = 64;
    const graphics = this.add.graphics();
    const palette = [0x121218, 0x171720, 0x1d1d26];
    const accent = 0x0a0a10;

    for (let y = 0; y < GAME_CONFIG.world.height; y += tileSize) {
      for (let x = 0; x < GAME_CONFIG.world.width; x += tileSize) {
        const checker = ((x / tileSize) + (y / tileSize)) % palette.length;
        const baseColor = palette[checker];
        const varied = Phaser.Display.Color.ValueToColor(baseColor);
        const delta = Phaser.Math.Between(-6, 6);
        const color = Math.random() < 0.08 ? accent : Phaser.Display.Color.GetColor(
          Phaser.Math.Clamp(varied.red + delta, 0, 255),
          Phaser.Math.Clamp(varied.green + delta, 0, 255),
          Phaser.Math.Clamp(varied.blue + delta, 0, 255),
        );

        graphics.fillStyle(color, 1);
        graphics.fillRect(x, y, tileSize, tileSize);
        graphics.lineStyle(1, 0x050507, 0.4);
        graphics.strokeRect(x, y, tileSize, tileSize);
      }
    }
  }

  update(time, delta) {
    this.elapsedSeconds += delta / 1000;
    this.hud.updateTimer(this.elapsedSeconds, this.bossManager.isBossIncoming(this.elapsedSeconds));
    this.player.update(delta);
    this.player.updateTrail();

    if (this.elapsedSeconds >= GAME_CONFIG.victory.surviveSeconds) {
      this.endRun('victory');
      return;
    }

    this.waveManager.update(time, delta);
    this.bossManager.update(this.elapsedSeconds, time, delta);
    this.xpManager.update(delta);

    if (this.bossManager.activeBoss?.active) {
      this.handleWeaponBossOverlaps();
    }

    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;
      enemy.chase(this.player, time);
    });

    this.weapons.forEach((weapon) => {
      weapon.tryFire(time);
      weapon.update(time, delta);
    });

    this.weaponProjectiles.children.iterate((projectile) => {
      if (!projectile?.active) return;
      const nextTrailAt = projectile.getData('nextTrailAt') ?? 0;
      if (time >= nextTrailAt) {
        projectile.setData('nextTrailAt', time + 70);
        this.vfx.emitProjectileTrail(projectile);
      }
    });

    this.updateMovement(delta);
    this.vfx.update(this.player, this.elapsedSeconds);
  }

  handleWeaponBossOverlaps() {
    this.weaponProjectiles.children.iterate((projectile) => {
      if (!projectile?.active || !this.bossManager.activeBoss?.active) return;
      if (Phaser.Geom.Intersects.RectangleToRectangle(projectile.getBounds(), this.bossManager.activeBoss.getBounds())) {
        this.handleWeaponHit(projectile, this.bossManager.activeBoss);
      }
    });
  }

  updateMovement(delta) {
    const keyboardX = (this.cursors.right.isDown || this.wasd.D.isDown ? 1 : 0) -
      (this.cursors.left.isDown || this.wasd.A.isDown ? 1 : 0);
    const keyboardY = (this.cursors.down.isDown || this.wasd.S.isDown ? 1 : 0) -
      (this.cursors.up.isDown || this.wasd.W.isDown ? 1 : 0);

    const keyboardVector = new Phaser.Math.Vector2(keyboardX, keyboardY);
    if (keyboardVector.lengthSq() > 1) {
      keyboardVector.normalize();
    }

    this.player.updateMovement(keyboardVector, this.joystick.getVector(), delta);
  }
}
