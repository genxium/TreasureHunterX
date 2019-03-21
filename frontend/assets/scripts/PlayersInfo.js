cc.Class({
  extends: cc.Component,

  properties: {
    listNode: {
      type: cc.Node,
      default: null,
    }
  },

  // LIFE-CYCLE CALLBACKS:
  updateData(playerInfo) {
    const joinIndex = playerInfo.joinIndex;
    const playerNode = this.listNode.getChildByName("player" + joinIndex);
    if (!playerNode) {
      return;
    }
    const playerNameLabelNode = playerNode.getChildByName("name");

    function isEmptyString(str) {
      return str == null || str == ''
    }

    const nameToDisplay = (() => {
      if (!isEmptyString(playerInfo.displayName)) {
        return playerInfo.displayName;
      } else if (!isEmptyString(playerInfo.name)) {
        return playerInfo.name;
      } else {
        return "No name"
      }
    })();

    playerNameLabelNode.getComponent(cc.Label).string = nameToDisplay;

    const score = (playerInfo.score ? playerInfo.score : 0);
    const playerScoreLabelNode = playerNode.getChildByName("score");
    playerScoreLabelNode.getComponent(cc.Label).string = score;
  },
  onLoad() {},

  clearInfo() {
    for (let i = 1; i < 3; i++) {
      const playerNode = this.listNode.getChildByName('player' + i);
      const playerScoreLabelNode = playerNode.getChildByName("score");
      const playerNameLabelNode = playerNode.getChildByName("name");
      playerScoreLabelNode.getComponent(cc.Label).string = '';
      playerNameLabelNode.getComponent(cc.Label).string = '';
    }
  },

});
