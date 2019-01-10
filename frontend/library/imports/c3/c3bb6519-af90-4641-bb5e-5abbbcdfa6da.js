"use strict";
cc._RF.push(module, 'c3bb6UZr5BGQbteWru836ba', 'Pumpkin');
// scripts/Pumpkin.js

"use strict";

var Bullet = require("./Bullet");

cc.Class({
  extends: Bullet,
  // LIFE-CYCLE CALLBACKS:
  properties: {},

  onLoad: function onLoad() {
    Bullet.prototype.onLoad.call(this);
  }
});

cc._RF.pop();