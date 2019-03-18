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
    homeBtnLabel: "回到首页",
  },
  gameRule:{
    tip: "经典吃豆人玩法，加入了实时对战元素。金豆1分，煎蛋3分，玩家在1分钟之内得分高则获胜。要注意躲避防御塔攻击，被击中会被定住5秒的哦。开始游戏吧~",
    mode: "1v1 模式",
  },
  login: {
    tips: {
      loginSuccess: "登录成功，加载中..."
    }
  },
  findingPlayer: {
    exit: "退出",
    tip: "我们正在为你匹配另一位玩家，请稍等",
    finding: "等等我，马上到...",
  },
  gameTip: {
    start: "游戏开始!",
    resyncing: "正在重连，请稍等...",
  },

};
