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
    myAvatarNode: {
      type: cc.Node,
      default: null
    },
    exitBtnNode: {
      type: cc.Node,
      default: null
    }
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    // WARNING: 不能保证在ws连接成功并且拿到boundRoomId后才运行到此处。
    if (cc.sys.platform == cc.sys.WECHAT_GAME) {
      const boundRoomId = cc.sys.localStorage.getItem('boundRoomId');
      console.warn('The boundRoomId for sharing: ' + boundRoomId);
      wx.showShareMenu();
      wx.onShareAppMessage(() => ({
        title: '夺宝大作战',
        imageUrl: 'https://mmocgame.qpic.cn/wechatgame/ibxA6JVNslX1q6ibicey5e4ibvrmGFSlC4xrbKAt5jhQGu8I00iaojEGxlud86OtKAA0T/0',  // 图片 URL
        imageUrlId: 'RcU9ypycT6alae-GhclK3Q',
        query: 'expectedRoomId=' + boundRoomId,
      }));
    }

  },
  init() {
    this.firstPlayerInfoNode.active = false;
    this.secondPlayerInfoNode.active = false;
    this.playersInfoNode = {};
    Object.assign(this.playersInfoNode, {
      1: this.firstPlayerInfoNode
    });
    Object.assign(this.playersInfoNode, {
      2: this.secondPlayerInfoNode
    });

    window.firstPlayerInfoNode = this.firstPlayerInfoNode;
    this.findingAnimNode.active = true;

  },
  hideExitButton() {
    if (this.exitBtnNode != null) {
      this.exitBtnNode.active = false;
    }
  },

  exitBtnOnClick(evt) {
    window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
    window.closeWSConnection();
    if (cc.sys.platform == cc.sys.WECHAT_GAME) {
      cc.director.loadScene('wechatGameLogin');
    } else {
      cc.director.loadScene('login');
    }
  },

  updatePlayersInfo(players) {
    if (!players) return;
    for (let i in players) {
      const playerInfo = players[i];
      const playerInfoNode = this.playersInfoNode[playerInfo.joinIndex];
      playerInfoNode.active = true;
      if (2 == playerInfo.joinIndex) {
        this.findingAnimNode.active = false;
      }
    }

    //显示自己的头像名称以及他人的头像名称
    for (let i in players) {
      const playerInfo = players[i];
      console.log(playerInfo);
      const playerInfoNode = this.playersInfoNode[playerInfo.joinIndex];

      (() => { //远程加载头像
        let remoteUrl = playerInfo.avatar;
        if (remoteUrl == null || remoteUrl == '') {
          cc.log(`No avatar to show for :`);
          cc.log(playerInfo);
          remoteUrl = 'http://wx.qlogo.cn/mmopen/PiajxSqBRaEJUWib5D85KXWHumaxhU4E9XOn9bUpCNKF3F4ibfOj8JYHCiaoosvoXCkTmOQE1r2AKKs8ObMaz76EdA/0'
        }
        cc.loader.load({
          url: remoteUrl,
          type: 'jpg'
        }, function(err, texture) {
          if (err != null) {
            console.error(err);
          } else {
            const sf = new cc.SpriteFrame();
            sf.setTexture(texture);
            playerInfoNode.getChildByName('avatarMask').getChildByName('avatar').getComponent(cc.Sprite).spriteFrame = sf;
          }
        });
      })();

      function isEmptyString(str) {
        return str == null || str == ''
      }

      const nameNode = playerInfoNode.getChildByName("name");
      const nameToDisplay = (() => {
        if (!isEmptyString(playerInfo.displayName)) {
          return playerInfo.displayName
        } else if (!isEmptyString(playerInfo.name)) {
          return playerInfo.name
        } else {
          return "No name"
        }
      })();
      nameNode.getComponent(cc.Label).string = nameToDisplay;
    }
  },
});
