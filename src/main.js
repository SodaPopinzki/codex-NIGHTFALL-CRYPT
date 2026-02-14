import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import PauseScene from './scenes/PauseScene';
import LevelUpScene from './scenes/LevelUpScene';
import GameOverScene from './scenes/GameOverScene';

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 800,
  height: 600,
  backgroundColor: '#09060d',
  fps: {
    target: 60,
    forceSetTimeOut: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [
    BootScene,
    MenuScene,
    GameScene,
    PauseScene,
    LevelUpScene,
    GameOverScene,
  ],
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
