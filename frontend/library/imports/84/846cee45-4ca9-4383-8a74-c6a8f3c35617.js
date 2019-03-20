"use strict";
cc._RF.push(module, '846ce5FTKlDg4p0xqjzw1YX', 'PlayersInfo');
// scripts/PlayersInfo.js

"use strict";

cc.Class({
  extends: cc.Component,

  properties: {
    listNode: {
      type: cc.Node,
      default: null
    }
  },

  // LIFE-CYCLE CALLBACKS:
  updateData: function updateData(playerInfo) {
    var joinIndex = playerInfo.joinIndex;
    var playerNode = this.listNode.getChildByName("player" + joinIndex);
    if (!playerNode) return;
    var playerNameLabelNode = playerNode.getChildByName("name");

    function isEmptyString(str) {
      return str == null || str == '';
    }

    var nameToDisplay = function () {
      if (!isEmptyString(playerInfo.displayName)) {
        return playerInfo.displayName;
      } else if (!isEmptyString(playerInfo.name)) {
        return playerInfo.name;
      } else {
        return "No name";
      }
    }();

    playerNameLabelNode.getComponent(cc.Label).string = nameToDisplay;

    var score = playerInfo.score ? playerInfo.score : 0;
    var playerScoreLabelNode = playerNode.getChildByName("score");
    playerScoreLabelNode.getComponent(cc.Label).string = score;
  },
  onLoad: function onLoad() {},
  clearInfo: function clearInfo() {
    for (var i = 1; i < 3; i++) {
      var playerNode = this.listNode.getChildByName('player' + i);
      var playerScoreLabelNode = playerNode.getChildByName("score");
      var playerNameLabelNode = playerNode.getChildByName("name");
      playerScoreLabelNode.getComponent(cc.Label).string = '';
      playerNameLabelNode.getComponent(cc.Label).string = '';
    }
  }
});

cc._RF.pop();