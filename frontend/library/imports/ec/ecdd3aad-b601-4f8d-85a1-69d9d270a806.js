"use strict";
cc._RF.push(module, 'ecdd3qttgFPjYWhadnScKgG', 'FindingPlayer');
// scripts/FindingPlayer.js

'use strict';

cc.Class({
  extends: cc.Component,

  properties: {
    selfInfoNode: {
      type: cc.Node,
      default: null
    }
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad: function onLoad() {
    var selfPlayerInfo = JSON.parse(cc.sys.localStorage.selfPlayer);
    var selfNameNode = this.selfInfoNode.getChildByName("selfName");
    if (selfPlayerInfo.displayName) {
      selfNameNode.getComponent(cc.Label).string = selfPlayerInfo.displayName;
    }
  },
  exitBtnOnClick: function exitBtnOnClick(evt) {
    window.closeWSConnection();
    window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
    cc.sys.localStorage.removeItem('selfPlayer');
    cc.director.loadScene('login');
  }
});

cc._RF.pop();