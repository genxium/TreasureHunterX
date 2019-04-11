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
    },
    exitBtnNode: {
      type: cc.Node,
      default: null
    }
  },

  // LIFE-CYCLE CALLBACKS:
  onLoad: function onLoad() {
    // WARNING: 不能保证在ws连接成功并且拿到boundRoomId后才运行到此处。
    if (cc.sys.platform == cc.sys.WECHAT_GAME) {
      var boundRoomId = window.getBoundRoomIdFromPersistentStorage();
      var wxToShareMessage = {
        title: '夺宝大作战',
        imageUrl: 'https://mmocgame.qpic.cn/wechatgame/ibxA6JVNslX02zq6aAWCZiaWTXLYGorrVgUszo3WH1oL1CFDcFU7VKPRXPFiadxagMR/0',
        imageUrlId: 'FiLZpa5FT5GgEeEagzGBsA',
        query: 'expectedRoomId=' + boundRoomId
      };
      console.warn("The boundRoomId for sharing: ", boundRoomId, " wxToShareMessage ", wxToShareMessage);
      wx.showShareMenu();
      wx.onShareAppMessage(function () {
        return wxToShareMessage;
      });
    }
  },
  init: function init() {
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
  hideExitButton: function hideExitButton() {
    if (this.exitBtnNode != null) {
      this.exitBtnNode.active = false;
    }
  },
  exitBtnOnClick: function exitBtnOnClick(evt) {
    window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
    window.closeWSConnection();
    if (cc.sys.platform == cc.sys.WECHAT_GAME) {
      cc.director.loadScene('wechatGameLogin');
    } else {
      cc.director.loadScene('login');
    }
  },
  updatePlayersInfo: function updatePlayersInfo(players) {
    var _this = this;

    if (!players) return;
    for (var i in players) {
      var playerInfo = players[i];
      var playerInfoNode = this.playersInfoNode[playerInfo.joinIndex];
      playerInfoNode.active = true;
      if (2 == playerInfo.joinIndex) {
        this.findingAnimNode.active = false;
      }
    }

    //显示自己的头像名称以及他人的头像名称

    var _loop = function _loop(_i) {
      var playerInfo = players[_i];
      console.log(playerInfo);
      var playerInfoNode = _this.playersInfoNode[playerInfo.joinIndex];

      (function () {
        //远程加载头像
        var remoteUrl = playerInfo.avatar;
        if (remoteUrl == null || remoteUrl == '') {
          cc.log('No avatar to show for :');
          cc.log(playerInfo);
          remoteUrl = 'http://wx.qlogo.cn/mmopen/PiajxSqBRaEJUWib5D85KXWHumaxhU4E9XOn9bUpCNKF3F4ibfOj8JYHCiaoosvoXCkTmOQE1r2AKKs8ObMaz76EdA/0';
        }
        cc.loader.load({
          url: remoteUrl,
          type: 'jpg'
        }, function (err, texture) {
          if (err != null) {
            console.error(err);
          } else {
            var sf = new cc.SpriteFrame();
            sf.setTexture(texture);
            playerInfoNode.getChildByName('avatarMask').getChildByName('avatar').getComponent(cc.Sprite).spriteFrame = sf;
          }
        });
      })();

      function isEmptyString(str) {
        return str == null || str == '';
      }

      var nameNode = playerInfoNode.getChildByName("name");
      var nameToDisplay = function () {
        if (!isEmptyString(playerInfo.displayName)) {
          return playerInfo.displayName;
        } else if (!isEmptyString(playerInfo.name)) {
          return playerInfo.name;
        } else {
          return "No name";
        }
      }();
      nameNode.getComponent(cc.Label).string = nameToDisplay;
    };

    for (var _i in players) {
      _loop(_i);
    }
  }
});

cc._RF.pop();