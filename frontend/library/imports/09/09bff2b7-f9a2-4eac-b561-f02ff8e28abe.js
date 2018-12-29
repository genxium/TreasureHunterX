"use strict";
cc._RF.push(module, '09bffK3+aJOrLVh8C/44oq+', 'zh');
// resources/i18n/zh.js

'use strict';

if (!window.i18n) {
  window.i18n = {};
}

if (!window.i18n.languages) {
  window.i18n.languages = {};
}

window.i18n.languages['zh'] = {
  resultPanel: {
    winnerLabel: "Winner",
    loserLabel: "Loser",
    timeLabel: "Time:",
    timeTip: "(the last time to pick up the treasure) ",
    awardLabel: "Award:",
    againBtnLabel: "再来一局",
    homeBtnLabel: "回到首页"
  },
  gameRule: {
    tip: "  游戏以1 v 1形式展开，玩家在1分钟之内获得的分数越高，则最终获胜。分数来自于拾取的宝物，拾取越多的宝物（蘑菇、金块）则分数越高。但要注意躲避蜘蛛射出来的蜘蛛网哦，被击中会被定住5秒的哦。开始游戏吧~",
    mode: "1v1 模式"
  },
  login: {
    tips: {
      loginSuccess: "登录成功，加载中..."
    }
  },
  findingPlayer: {
    exit: "退出",
    tip: "我们正在为你匹配另一位玩家，请稍等",
    finding: "等等我，马上到..."
  },
  gameTip: {
    start: "游戏开始!",
    resyncing: "正在重连，请稍等..."
  }

};

cc._RF.pop();