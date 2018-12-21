"use strict";
cc._RF.push(module, '6a3d6Y6Ki1BiqAVSKIRdwRl', 'CountdownToBeginGame');
// scripts/CountdownToBeginGame.js

"use strict";

cc.Class({
  extends: cc.Component,

  properties: {
    countdownSeconds: {
      type: cc.Label,
      default: null
    }
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad: function onLoad() {},
  setData: function setData() {
    this.startedMillis = Date.now();
    this.durationMillis = 3000;
  },
  update: function update() {
    var currentGMTMillis = Date.now();
    var elapsedMillis = currentGMTMillis - this.startedMillis;
    var remainingMillis = this.durationMillis - elapsedMillis;
    if (remainingMillis <= 0) {
      remainingMillis = 0;
    }
    var remaingHint = "" + Math.round(remainingMillis / 1000);
    if (remaingHint != this.countdownSeconds.string) {
      this.countdownSeconds.string = remaingHint;
    }
  }
});

cc._RF.pop();