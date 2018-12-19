"use strict";
cc._RF.push(module, '5eea6zlA0NHdoCk/M1pvQmb', 'Treasure');
// scripts/Treasure.js

"use strict";

cc.Class({
  extends: cc.Component,

  properties: {
    animPrefab: {
      type: cc.Prefab,
      default: null
    }
  },

  playPickedUpAnimAndDestroy: function playPickedUpAnimAndDestroy() {
    var self = this;
    var parentNode = self.node.parent;
    if (!parentNode) return;
    if (!self.animPrefab) return;
    var animNode = cc.instantiate(self.animPrefab);
    animNode.setPosition(self.node.position);
    safelyAddChild(parentNode, animNode);
    setLocalZOrder(animNode, 999);
    this.node.destroy();
  },
  start: function start() {}
});

cc._RF.pop();