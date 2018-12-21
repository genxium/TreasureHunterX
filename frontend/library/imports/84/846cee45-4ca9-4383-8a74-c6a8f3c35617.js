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
    //if(playerInfo.name) {
    //  playerNameLabelNode.getComponent(cc.Label).string = playerInfo.name;
    //} 

    var score = playerInfo.score ? playerInfo.score : 0;
    var playerScoreLabelNode = playerNode.getChildByName("score");
    playerScoreLabelNode.getComponent(cc.Label).string = score;
  },
  onLoad: function onLoad() {}
});

cc._RF.pop();