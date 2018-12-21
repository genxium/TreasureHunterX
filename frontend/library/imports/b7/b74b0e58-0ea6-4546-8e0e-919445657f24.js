"use strict";
cc._RF.push(module, 'b74b05YDqZFRo4OkZRFZX8k', 'SelfPlayer');
// scripts/SelfPlayer.js

'use strict';

var BasePlayer = require("./BasePlayer");

cc.Class({
  extends: BasePlayer,
  // LIFE-CYCLE CALLBACKS:
  properties: {
    arrowTipNode: {
      type: cc.Node,
      default: null
    }
  },
  start: function start() {
    BasePlayer.prototype.start.call(this);
  },
  onLoad: function onLoad() {
    BasePlayer.prototype.onLoad.call(this);
    this.attackedClips = {
      '01': 'attackedLeft',
      '0-1': 'attackedRight',
      '-20': 'attackedLeft',
      '20': 'attackedRight',
      '-21': 'attackedLeft',
      '21': 'attackedRight',
      '-2-1': 'attackedLeft',
      '2-1': 'attackedRight'
    };
    this.arrowTipNode.active = false;
  },
  showArrowTipNode: function showArrowTipNode() {
    var self = this;
    self.arrowTipNode.active = true;
    window.setTimeout(function () {
      self.arrowTipNode.active = false;
    }, 3000);
  },
  update: function update(dt) {
    BasePlayer.prototype.update.call(this, dt);
  }
});

cc._RF.pop();