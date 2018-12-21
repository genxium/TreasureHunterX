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
    if(!playerNode)
      return;
    const playerNameLabelNode = playerNode.getChildByName("name");
    //if(playerInfo.name) {
    //  playerNameLabelNode.getComponent(cc.Label).string = playerInfo.name;
    //} 

    const score  = playerInfo.score ? playerInfo.score : 0 
    const playerScoreLabelNode = playerNode.getChildByName("score");
    playerScoreLabelNode.getComponent(cc.Label).string = score;
  },
  onLoad() {
  }
});
