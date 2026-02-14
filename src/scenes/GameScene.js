import { GAME_CONFIG } from '../config/GameConfig';
import { PASSIVE_UPGRADES, WEAPON_CONFIG } from '../config/WeaponConfig';
import Player from '../entities/Player';
import Enemy from '../entities/Enemy';
import ObjectPool from '../utils/ObjectPool';
import WaveManager from '../systems/WaveManager';
import XPManager from '../systems/XPManager';
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

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.physics.world.setBounds(0, 0, GAME_CONFIG.world.width, GAME_CONFIG.world.height);
    this.drawBackgroundTiles();

    this.player = new Player(this, GAME_CONFIG.player.startX, GAME_CONFIG.player.startY);

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
    this.hud = new HUD(this);
    this.joystick = new VirtualJoystick(this);

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
    ];
    this.passiveCatalog = [
      { ...PASSIVE_UPGRADES.maxHealth, iconColor: 0xd74f5f },
      { ...PASSIVE_UPGRADES.moveSpeed, iconColor: 0x4da5ff },
      { ...PASSIVE_UPGRADES.pickupRadius, iconColor: 0x65f0ff },
    ];

    this.addWeapon('holyWater');

    this.kills = 0;
    this.elapsedSeconds = 0;

    this.hud.updateHealth(this.player.health, this.player.maxHealth);
    this.hud.updateXp(this.xpManager.level, this.xpManager.currentXp, this.xpManager.threshold);
    this.hud.updateKills(this.kills);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    this.physics.add.overlap(this.player, this.enemies, (_, enemy) => {
      const gotHit = this.player.takeDamage(enemy.damage);
      if (gotHit) this.hud.updateHealth(this.player.health, this.player.maxHealth);
      if (this.player.isDead) this.scene.start('GameOverScene', { time: this.elapsedSeconds, kills: this.kills });
    });

    this.physics.add.overlap(this.weaponProjectiles, this.enemies, (projectile, enemy) => {
      this.handleWeaponHit(projectile, enemy);
    });

    this.events.on('xpchange', ({ level, xp, threshold }) => this.hud.updateXp(level, xp, threshold));
    this.events.on('levelup', () => this.hud.updateHealth(this.player.health, this.player.maxHealth));

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene');
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
    ) return;

    const hitEnemies = projectile.getData('hitEnemies');
    if (hitEnemies?.has(enemy)) return;

    enemy.takeDamage(projectile.getData('damage'));

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

  addWeapon(id) {
    if (this.weaponState.has(id)) return;

    const definition = this.getWeaponDefinition(id);
    if (!definition) return;

    const weapon = new definition.classRef(this, this.player, definition.config);
    weapon.setLevel(1);
    this.weapons.push(weapon);
    this.weaponState.set(id, { level: 1, weapon });
  }

  getLevelUpChoices(count = 3) {
    const weaponChoices = this.weaponCatalog
      .filter((entry) => (this.weaponState.get(entry.id)?.level ?? 0) < 8)
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

    const pool = Phaser.Utils.Array.Shuffle([...weaponChoices, ...passiveChoices]);
    return pool.slice(0, count);
  }

  applyLevelUpChoice(choice) {
    if (!choice) return;

    if (choice.type === 'weapon') {
      const state = this.weaponState.get(choice.id);
      if (!state) {
        this.addWeapon(choice.id);
      } else if (state.level < 8) {
        state.level += 1;
        state.weapon.setLevel(state.level);
      }
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
    this.xpManager.spawnGem(enemy.x, enemy.y, enemy.xpValue);
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
        const color = Math.random() < 0.08 ? accent : baseColor;

        graphics.fillStyle(color, 1);
        graphics.fillRect(x, y, tileSize, tileSize);
        graphics.lineStyle(1, 0x050507, 0.4);
        graphics.strokeRect(x, y, tileSize, tileSize);
      }
    }
  }

  update(time, delta) {
    this.elapsedSeconds += delta / 1000;
    this.hud.updateTimer(this.elapsedSeconds);
    this.player.update(delta);

    this.waveManager.update(time, delta);
    this.xpManager.update(delta);

    this.enemies.children.iterate((enemy) => {
      if (!enemy?.active) return;
      enemy.chase(this.player, time);
    });

    this.weapons.forEach((weapon) => {
      weapon.tryFire(time);
      weapon.update(time, delta);
    });

    this.updateMovement(delta);
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
