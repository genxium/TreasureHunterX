const i18n = require('LanguageData');
i18n.init(window.language); // languageID should be equal to the one we input in New Language ID input field
cc.Class({

  extends: cc.Component,

  properties: {
    onCloseDelegate: {
      type: cc.Object,
      default: null
    },
    onAgainClicked: {
      type: cc.Object,
      default: null
    },
    winnerPanel: {
      type: cc.Node,
      default: null
    },
    loserPanel: {
      type: cc.Node,
      default: null
    },
    resultCompareNode: {
      type: cc.Node,
      default: null
    },

    avatars: {
      type: [cc.SpriteFrame],
      default: []
    },

    myAvatarNode: {
      type: cc.Node,
      default: null,
    },
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    const resultPanelNode = this.node;
    const againButtonNode = resultPanelNode.getChildByName("againBtn");  
    const homeButtonNode = resultPanelNode.getChildByName("homeBtn");  
  },

  againBtnOnClick(evt) {
    this.onClose();
    if (!this.onAgainClicked) return;
    this.onAgainClicked();
  },

  homeBtnOnClick(evt) {
    window.closeWSConnection();
    cc.director.loadScene('login');
  },

  showPlayerInfo(players) {
    const self = this;
    const resultPanelNode = this.node;
    const winnerNameNode = resultPanelNode.getChildByName("winnerName");
    const loserNameNode = resultPanelNode.getChildByName("loserName");
    const resultCompareNode = this.resultCompareNode;
    const compareProgressNode = resultCompareNode.getChildByName("progressbar");
    let winnerInfo = null;
    let loserInfo = null;
    
    for(let playerId in players) {
      const playerInfo = players[playerId];
      if(!winnerInfo) {
        winnerInfo =  playerInfo; 
        continue;
      }
      if(playerInfo.score >= winnerInfo.score) {
        loserInfo = winnerInfo;
        winnerInfo = playerInfo;
      }else {
        loserInfo = playerInfo;
      }
    }
    //TODO Hardecode the name
    winnerNameNode.getComponent(cc.Label).string = constants.PLAYER_NAME[winnerInfo.joinIndex];
    loserNameNode.getComponent(cc.Label).string = constants.PLAYER_NAME[loserInfo.joinIndex];
  
    const progressComp = compareProgressNode.getComponent(cc.ProgressBar);
    const winnerScore = parseInt(winnerInfo.score);
    const loserScore = parseInt(loserInfo.score); 
    let ratio = 0.5; 
    if(winnerScore != loserScore){
      ratio = (loserScore * winnerScore <= 0) ? 1 
              : Math.abs(winnerScore) / Math.abs((loserScore + winnerScore));
    }
    progressComp.progress = ratio; 
    
    resultCompareNode.getChildByName("winnerScore").getComponent(cc.Label).string = winnerScore;
    resultCompareNode.getChildByName("loserScore").getComponent(cc.Label).string = loserScore;
    
    /*
   const plistDir = "textures/StatusBar";

   cc.loader.loadRes(plistDir, cc.SpriteAtlas, function (err, altas) {
    if(err){
      cc.warn(err);
      return;
    }
    //hardecode avatart by joinIndex
    //let winnerAvatar = altas.getSpriteFrame(winnerInfo.joinIndex == 2 ? "BlueAvatar" : "RedAvatar")
    //let loserAvatar = altas.getSpriteFrame(loserInfo.joinIndex == 2 ? "BlueAvatar" : "RedAvatar")
    let winnerAvatar = self.avatars[winnerInfo.joinIndex == 2 ? 0 : 1]
    let loserAvatar = self.avatars[loserInfo.joinIndex == 2 ? 0 : 1]
    //let loserAvatar = altas.getSpriteFrame(loserInfo.joinIndex == 2 ? "BlueAvatar" : "RedAvatar")
    resultPanelNode.getChildByName("winnerPortrait").getComponent(cc.Sprite).spriteFrame = winnerAvatar;
    resultPanelNode.getChildByName("loserPortrait").getComponent(cc.Sprite).spriteFrame = loserAvatar;
   });
   */

   let winnerAvatar = self.avatars[winnerInfo.joinIndex == 2 ? 1 : 0]
   let loserAvatar = self.avatars[loserInfo.joinIndex == 2 ? 1 : 0]
   //let loserAvatar = altas.getSpriteFrame(loserInfo.joinIndex == 2 ? "BlueAvatar" : "RedAvatar")
   resultPanelNode.getChildByName("winnerPortrait").getComponent(cc.Sprite).spriteFrame = winnerAvatar;
   resultPanelNode.getChildByName("loserPortrait").getComponent(cc.Sprite).spriteFrame = loserAvatar;

   //this.showRibbon(winnerInfo, resultPanelNode.getChildByName("ribbon"));  
   this.showMyAvatar(players);  
  },

  showMyAvatar(players){
    const self = this;
    //console.warn("!!!!!!!!!!!!!!!!!!!");
    //Get joinindex
    const myJoinIndex = (() => {
      const selfPlayerInfo = JSON.parse(cc.sys.localStorage.selfPlayer);
      console.log(selfPlayerInfo)

      let myInfo = null;
      for(let id in players){
        if(selfPlayerInfo.playerId == id){
          myInfo = players[id];
          break;
        }
      }

      return myInfo.joinIndex;
    })();


    if(myJoinIndex == 2){ //第二加入, 显示蓝色头像
      this.myAvatarNode.getComponent(cc.Sprite).spriteFrame = self.avatars[1];
    }else if(myJoinIndex == 1){ //第一加入, 显示红色头像
      this.myAvatarNode.getComponent(cc.Sprite).spriteFrame = self.avatars[0];
    }else{
      console.error('错误显示自己的头像')
    }
  },
 
  showRibbon(winnerInfo, ribbonNode) {
    const selfPlayerInfo = JSON.parse(cc.sys.localStorage.selfPlayer);
    const texture = (selfPlayerInfo.playerId == winnerInfo.id) ? "textures/resultPanel/WinRibbon" : "textures/resultPanel/loseRibbon";
    cc.loader.loadRes(texture, cc.SpriteFrame, function (err, spriteFrame) {
      if(err) {
        console.log(err);
        return;
      }
      ribbonNode.getComponent(cc.Sprite).spriteFrame = spriteFrame;
    });

  },
  
  onClose(evt) {
    if (this.node.parent) {
      this.node.parent.removeChild(this.node); 
    }
    if (!this.onCloseDelegate) { 
      return;
    }
    this.onCloseDelegate();
  }
});
