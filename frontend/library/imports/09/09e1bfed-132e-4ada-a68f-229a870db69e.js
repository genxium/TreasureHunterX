"use strict";
cc._RF.push(module, '09e1b/tEy5K2qaPIpqHDbae', 'MusicEffectManager');
// scripts/MusicEffectManager.js

"use strict";

cc.Class({
  extends: cc.Component,

  properties: {
    BGMEffect: {
      type: cc.AudioClip,
      default: null
    },
    crashedByTrapBullet: {
      type: cc.AudioClip,
      default: null
    },
    highScoreTreasurePicked: {
      type: cc.AudioClip,
      default: null
    },
    treasurePicked: {
      type: cc.AudioClip,
      default: null
    },
    countDown10SecToEnd: {
      type: cc.AudioClip,
      default: null
    },
    mapNode: {
      type: cc.Node,
      default: null
    }
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad: function onLoad() {
    cc.audioEngine.setEffectsVolume(1);
    cc.audioEngine.setMusicVolume(0.5);
  },
  stopAllMusic: function stopAllMusic() {
    cc.audioEngine.stopAll();
  },
  playBGM: function playBGM() {
    if (this.BGMEffect) {
      cc.audioEngine.playMusic(this.BGMEffect, true);
    }
  },
  playCrashedByTrapBullet: function playCrashedByTrapBullet() {
    if (this.crashedByTrapBullet) {
      cc.audioEngine.playEffect(this.crashedByTrapBullet, false);
    }
  },
  playHighScoreTreasurePicked: function playHighScoreTreasurePicked() {
    if (this.highScoreTreasurePicked) {
      cc.audioEngine.playEffect(this.highScoreTreasurePicked, false);
    }
  },
  playTreasurePicked: function playTreasurePicked() {
    if (this.treasurePicked) {
      cc.audioEngine.playEffect(this.treasurePicked, false);
    }
  },
  playCountDown10SecToEnd: function playCountDown10SecToEnd() {
    if (this.countDown10SecToEnd) {
      cc.audioEngine.playEffect(this.countDown10SecToEnd, false);
    }
  }
});

cc._RF.pop();