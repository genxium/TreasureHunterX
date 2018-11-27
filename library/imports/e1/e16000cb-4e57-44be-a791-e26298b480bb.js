"use strict";
cc._RF.push(module, 'e1600DLTldEvqeR4mKYtIC7', 'ConfirmLogout');
// scripts/ConfirmLogout.js

'use strict';

cc.Class({
  extends: cc.Component,

  properties: {
    mapNode: {
      type: cc.Node,
      default: null
    }
  },

  onButtonClick: function onButtonClick(event, customData) {
    var mapScriptIns = this.mapNode.getComponent('Map');
    switch (customData) {
      case 'confirm':
        mapScriptIns.logout.bind(mapScriptIns)(true, false);
        break;
      case 'cancel':
        mapScriptIns.onLogoutConfirmationDismissed.bind(mapScriptIns)();
        break;
      default:
        break;
    }
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad: function onLoad() {}
});

cc._RF.pop();