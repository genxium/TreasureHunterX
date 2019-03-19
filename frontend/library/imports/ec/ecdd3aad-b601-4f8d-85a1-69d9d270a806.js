"use strict";
cc._RF.push(module, 'ecdd3qttgFPjYWhadnScKgG', 'FindingPlayer');
// scripts/FindingPlayer.js

'use strict';

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
    }
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad: function onLoad() {},
  init: function init() {
    this.firstPlayerInfoNode.active = false;
    this.secondPlayerInfoNode.active = false;
    this.playersInfoNode = {};
    Object.assign(this.playersInfoNode, { 1: this.firstPlayerInfoNode });
    Object.assign(this.playersInfoNode, { 2: this.secondPlayerInfoNode });

    window.firstPlayerInfoNode = this.firstPlayerInfoNode;
    this.findingAnimNode.active = true;
  },
  exitBtnOnClick: function exitBtnOnClick(evt) {
    window.closeWSConnection();
    window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
    cc.sys.localStorage.removeItem('selfPlayer');
    cc.director.loadScene('login');
  },
  updatePlayersInfo: function updatePlayersInfo(players) {
    var _this = this;

    if (!players) return;
    for (var i in players) {
      var playerInfo = players[i];
      var playerInfoNode = this.playersInfoNode[playerInfo.joinIndex];
      var nameNode = playerInfoNode.getChildByName("name");
      nameNode.getComponent(cc.Label).string = constants.PLAYER_NAME[playerInfo.joinIndex];
      playerInfoNode.active = true;
      if (2 == playerInfo.joinIndex) {
        this.findingAnimNode.active = false;
      }
    }

    //显示自己的头像名称以及他人的头像名称

    var _loop = function _loop(_i) {
      var playerInfo = players[_i];
      var playerInfoNode = _this.playersInfoNode[playerInfo.joinIndex];

      (function () {
        //远程加载头像
        var remoteUrl = playerInfo.avatar;
        if (remoteUrl == '') {
          console.log('用户' + _i + ' 没有头像, 提供临时头像');
          remoteUrl = 'http://wx.qlogo.cn/mmopen/xzq2UIB49VaicY1Hk3jDLk6e8nISmsQuEcqxicEMuC1jKx75QnwibDLWnRHoEmMZdKOJWjspUd8aSD8DfoUYLEqQJ6rcHibNP5Gib/0';
        }
        cc.loader.load({ url: remoteUrl, type: 'jpg' }, function (err, texture) {
          if (err != null) {
            console.error(err);
          } else {
            var sf = new cc.SpriteFrame();
            sf.setTexture(texture);
            playerInfoNode.getChildByName('avatarMask').getChildByName('avatar').getComponent(cc.Sprite).spriteFrame = sf;
          }
        });
      })();

      var nameNode = playerInfoNode.getChildByName("name");
      nameNode.getComponent(cc.Label).string = playerInfo.name;
    };

    for (var _i in players) {
      _loop(_i);
    }
  }
});

cc._RF.pop();