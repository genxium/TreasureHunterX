"use strict";
cc._RF.push(module, '5ae77T7T5xEXaBXXTJSK5dd', 'ResultPanel');
// scripts/ResultPanel.js

"use strict";

var i18n = require('LanguageData');
i18n.init(window.language); // languageID should be equal to the one we input in New Language ID input field
cc.Class({

  extends: cc.Component,

  properties: {
    onCloseDelegate: {
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
    }
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad: function onLoad() {
    var resultPanelNode = this.node;
    var againButtonNode = resultPanelNode.getChildByName("againBtn");
    var homeButtonNode = resultPanelNode.getChildByName("homeBtn");
  },
  againBtnOnClick: function againBtnOnClick(evt) {
    //TODO: 目前还没有实现rejoin the room，先跳转到login scene。
    window.closeWSConnection();
    window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
    cc.sys.localStorage.removeItem('selfPlayer');
    cc.director.loadScene('login');
  },
  homeBtnOnClick: function homeBtnOnClick(evt) {
    //TODO: 目前没有home scene和相关业务逻辑，先跳转到login scene。
    window.closeWSConnection();
    window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
    cc.sys.localStorage.removeItem('selfPlayer');
    cc.director.loadScene('login');
  },
  showPlayerInfo: function showPlayerInfo(players) {
    var resultPanelNode = this.node;
    var winnerNameNode = resultPanelNode.getChildByName("winnerName");
    var loserNameNode = resultPanelNode.getChildByName("loserName");
    var resultCompareNode = this.resultCompareNode;
    var compareProgressNode = resultCompareNode.getChildByName("progressbar");
    var winnerInfo = null;
    var loserInfo = null;

    for (var playerId in players) {
      var playerInfo = players[playerId];
      if (!winnerInfo) {
        winnerInfo = playerInfo;
        continue;
      }
      if (playerInfo.score >= winnerInfo.score) {
        loserInfo = winnerInfo;
        winnerInfo = playerInfo;
      } else {
        loserInfo = playerInfo;
      }
    }
    winnerNameNode.getComponent(cc.Label).string = winnerInfo.name;
    loserNameNode.getComponent(cc.Label).string = loserInfo.name;

    var progressComp = compareProgressNode.getComponent(cc.ProgressBar);
    var winnerScore = parseInt(winnerInfo.score);
    var loserScore = parseInt(loserInfo.score);
    var ratio = 0.5;
    if (winnerScore != loserScore) {
      ratio = loserScore * winnerScore <= 0 ? 1 : Math.abs(winnerScore) / Math.abs(loserScore + winnerScore);
    }
    progressComp.progress = ratio;

    resultCompareNode.getChildByName("winnerScore").getComponent(cc.Label).string = winnerScore;
    resultCompareNode.getChildByName("loserScore").getComponent(cc.Label).string = loserScore;

    this.showRibbon(winnerInfo, resultPanelNode.getChildByName("ribbon"));
  },
  showRibbon: function showRibbon(winnerInfo, ribbonNode) {
    var selfPlayerInfo = JSON.parse(cc.sys.localStorage.selfPlayer);
    var texture = selfPlayerInfo.playerId == winnerInfo.id ? "textures/resultPanel/WinRibbon" : "textures/resultPanel/loseRibbon";
    cc.loader.loadRes(texture, cc.SpriteFrame, function (err, spriteFrame) {
      if (err) {
        console.log(err);
        return;
      }
      ribbonNode.getComponent(cc.Sprite).spriteFrame = spriteFrame;
    });
  },
  onClose: function onClose(evt) {
    this.node.active = false;
    if (!this.onCloseDelegate) return;
    this.onCloseDelegate();
  }
});

cc._RF.pop();