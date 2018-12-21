cc.Class({
  extends: cc.Component,

  properties: {
   firstPlayerInfoNode: {
      type: cc.Node,
      default: null
    },
    secondPlayerInfoNode: {
      type: cc.Node,
      default: null
    },
    findingAnimNode: {
      type: cc.Node,
      default: null
    },
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
  },
  init() {
    this.firstPlayerInfoNode.active = false;
    this.secondPlayerInfoNode.active = false;
    this.playersInfoNode = {};
    Object.assign(this.playersInfoNode, {1: this.firstPlayerInfoNode});
    Object.assign(this.playersInfoNode, {2: this.secondPlayerInfoNode});
  },
  exitBtnOnClick(evt) {
      window.closeWSConnection();
      window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
      cc.sys.localStorage.removeItem('selfPlayer');
      cc.director.loadScene('login');
  },
  updatePlayersInfo(players) {
    if (!players) return;
    for(let i in players) {
      const playerInfo = players[i];
      const playerInfoNode = this.playersInfoNode[playerInfo.joinIndex];
      const nameNode = playerInfoNode.getChildByName("name");
      nameNode.getComponent(cc.Label).string = "Player" + playerInfo.joinIndex; 
      playerInfoNode.active = true;
      if(2 == playerInfo.joinIndex) {
        this.findingAnimNode.active = false;
      }
    }
  },
});
