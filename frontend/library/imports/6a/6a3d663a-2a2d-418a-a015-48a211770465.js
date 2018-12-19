"use strict";
cc._RF.push(module, '6a3d6Y6Ki1BiqAVSKIRdwRl', 'CountdownToBeginGame');
// scripts/CountdownToBeginGame.js

"use strict";

cc.Class({
  extends: cc.Component,

  properties: {
    CountdownSeconds: {
      type: cc.Label,
      default: null
    }
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad: function onLoad() {},
  init: function init(mapScriptIns) {
    this.mapScriptIns = mapScriptIns;
  },
  start: function start() {},
  update: function update() {}
});

cc._RF.pop();