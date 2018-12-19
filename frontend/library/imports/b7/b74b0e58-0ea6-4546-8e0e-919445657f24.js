"use strict";
cc._RF.push(module, 'b74b05YDqZFRo4OkZRFZX8k', 'SelfPlayer');
// scripts/SelfPlayer.js

'use strict';

var BasePlayer = require("./BasePlayer");

cc.Class({
  extends: BasePlayer,

  // LIFE-CYCLE CALLBACKS:
  start: function start() {
    BasePlayer.prototype.start.call(this);
  },
  onLoad: function onLoad() {
    BasePlayer.prototype.onLoad.call(this);
    this.attackedClips = {
      '01': 'attackedTop',
      '0-1': 'attackedBottom',
      '-20': 'attackedLeft',
      '20': 'attackedRight',
      '-21': 'attackedTopLeft',
      '21': 'attackedTopRight',
      '-2-1': 'attackedBottomLeft',
      '2-1': 'attackedBottomRight'
    };
  },
  update: function update(dt) {
    BasePlayer.prototype.update.call(this, dt);
  }
});

cc._RF.pop();