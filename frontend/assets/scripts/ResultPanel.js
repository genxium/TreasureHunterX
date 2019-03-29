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
    myAvatarNode: {
      type: cc.Node,
      default: null,
    },
    myNameNode: {
      type: cc.Node,
      default: null,
    },
    rankingNodes: {
      type: [cc.Node],
      default: [],
    },
    winNode: {
      type: cc.Node,
      default: null,
    },

    /*
    defaultAvatar: {
      type: cc.SpriteFrame,
      default: null,
    },
    */
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
    //cc.director.loadScene('login');
    if(cc.sys.platform == cc.sys.WECHAT_GAME){
      cc.director.loadScene('wechatGameLogin');
    }else{
      cc.director.loadScene('login');
    }
  },

  showPlayerInfo(players) {
    this.showRanking(players);
    this.showMyAvatar();
    this.showMyName();
  },


  showMyName() {
    const selfPlayerInfo = JSON.parse(cc.sys.localStorage.getItem('selfPlayer'));
    let name = 'No name';
    if (null == selfPlayerInfo.displayName || "" == selfPlayerInfo.displayName) {
      name = selfPlayerInfo.name;
    } else {
      name = selfPlayerInfo.displayName;
    }
    if (!this.myNameNode) return;
    const myNameNodeLabel = this.myNameNode.getComponent(cc.Label); 
    if (!myNameNodeLabel || null == name) return;
    myNameNodeLabel.string = name;
  },

  showRanking(players) {
    const self = this;
    const sortablePlayers = [];

    for (let playerId in players) {
      const p = players[playerId];
      p.id = playerId; //附带上id
      sortablePlayers.push(p);
    }
    const sortedPlayers = sortablePlayers.sort((a, b) => {
      if (a.score == null) { //为null的必定排后面
        return 1;
      } else if (b.score == null) { //为null的必定排后面
        return -1;
      } else {
        if (a.score < b.score) { //分数大的排前面
          return 1;
        } else {
          return -1;
        }
      }
    })

    const selfPlayerInfo = JSON.parse(cc.sys.localStorage.getItem('selfPlayer'));
    sortedPlayers.forEach((p, id) => {
      const nameToDisplay = (() => {
        function isEmptyString(str) {
          return str == null || str == '';
        }
        if (!isEmptyString(p.displayName)) {
          return p.displayName;
        } else if (!isEmptyString(p.name)) {
          return p.name;
        } else {
          return "No name";
        }
      })();

      if (selfPlayerInfo.playerId == p.id) { //如果不是第一名就不显示WIN字样
        const rank = id + 1;
        if (rank != 1 && null != self.winNode) {
          self.winNode.active = false;
        }
      }

      self.rankingNodes[id].getChildByName('name').getComponent(cc.Label).string = nameToDisplay;
      self.rankingNodes[id].getChildByName('score').getComponent(cc.Label).string = p.score;
    })
  },

  showMyAvatar() {
    const self = this;
    const selfPlayerInfo = JSON.parse(cc.sys.localStorage.getItem('selfPlayer'));
    let remoteUrl = selfPlayerInfo.avatar;
    if (remoteUrl == null || remoteUrl == '') {
      cc.log(`No avatar to show for myself, check storage.`);
      return;
    } else {
      cc.loader.load({
        url: remoteUrl,
        type: 'jpg'
      }, function(err, texture) {
        if (err != null || texture == null) {
          console.log(err);
        } else {
          const sf = new cc.SpriteFrame();
          sf.setTexture(texture);
          self.myAvatarNode.getComponent(cc.Sprite).spriteFrame = sf;
        }
      });
    }
  },

  showRibbon(winnerInfo, ribbonNode) {
    const selfPlayerInfo = JSON.parse(cc.sys.localStorage.getItem('selfPlayer'));
    const texture = (selfPlayerInfo.playerId == winnerInfo.id) ? "textures/resultPanel/WinRibbon" : "textures/resultPanel/loseRibbon";
    cc.loader.loadRes(texture, cc.SpriteFrame, function(err, spriteFrame) {
      if (err) {
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
