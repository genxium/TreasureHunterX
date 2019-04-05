"use strict";
cc._RF.push(module, 'dd92bKVy8FJY7uq3ieoNZCZ', 'GameRule');
// scripts/GameRule.js

"use strict";

cc.Class({
  extends: cc.Component,

  properties: {
    modeButton: {
      type: cc.Button,
      default: null
    },
    mapNode: {
      type: cc.Node,
      default: null
    }
  },

  // LIFE-CYCLE CALLBACKS:
  onLoad: function onLoad() {
    var modeBtnClickEventHandler = new cc.Component.EventHandler();
    modeBtnClickEventHandler.target = this.mapNode;
    modeBtnClickEventHandler.component = "Map";
    modeBtnClickEventHandler.handler = "onGameRule1v1ModeClicked";
    this.modeButton.clickEvents.push(modeBtnClickEventHandler);
  }
});

cc._RF.pop();