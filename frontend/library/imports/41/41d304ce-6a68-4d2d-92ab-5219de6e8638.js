"use strict";
cc._RF.push(module, '41d30TOamhNLZKrUhneboY4', 'Map');
// scripts/Map.js

"use strict";

var i18n = require('LanguageData');
i18n.init(window.language); // languageID should be equal to the one we input in New Language ID input field

window.ALL_MAP_STATES = {
  VISUAL: 0, // For free dragging & zooming.
  EDITING_BELONGING: 1,
  SHOWING_MODAL_POPUP: 2
};

window.ALL_BATTLE_STATES = {
  WAITING: 0,
  IN_BATTLE: 1,
  IN_SETTLEMENT: 2,
  IN_DISMISSAL: 3
};

cc.Class({
  extends: cc.Component,

  properties: {
    useDiffFrameAlgo: {
      default: true
    },
    canvasNode: {
      type: cc.Node,
      default: null
    },
    tiledAnimPrefab: {
      type: cc.Prefab,
      default: null
    },
    player1Prefab: {
      type: cc.Prefab,
      default: null
    },
    player2Prefab: {
      type: cc.Prefab,
      default: null
    },
    pumpkinPrefab: {
      type: cc.Prefab,
      default: null
    },
    treasurePrefab: {
      type: cc.Prefab,
      default: null
    },
    trapPrefab: {
      type: cc.Prefab,
      default: null
    },
    acceleratorPrefab: {
      type: cc.Prefab,
      default: null
    },
    barrierPrefab: {
      type: cc.Prefab,
      default: null
    },
    shelterPrefab: {
      type: cc.Prefab,
      default: null
    },
    shelterZReducerPrefab: {
      type: cc.Prefab,
      default: null
    },
    keyboardInputControllerNode: {
      type: cc.Node,
      default: null
    },
    joystickInputControllerNode: {
      type: cc.Node,
      default: null
    },
    confirmLogoutPrefab: {
      type: cc.Prefab,
      default: null
    },
    simplePressToGoDialogPrefab: {
      type: cc.Prefab,
      default: null
    },
    boundRoomIdLabel: {
      type: cc.Label,
      default: null
    },
    countdownLabel: {
      type: cc.Label,
      default: null
    },
    trapBulletPrefab: {
      type: cc.Prefab,
      default: null
    },
    resultPanelPrefab: {
      type: cc.Prefab,
      default: null
    },
    gameRulePrefab: {
      type: cc.Prefab,
      default: null
    },
    findingPlayerPrefab: {
      type: cc.Prefab,
      default: null
    },
    countdownToBeginGamePrefab: {
      type: cc.Prefab,
      default: null
    },
    playersInfoPrefab: {
      type: cc.Prefab,
      default: null
    },
    guardTowerPrefab: {
      type: cc.Prefab,
      default: null
    },
    forceBigEndianFloatingNumDecoding: {
      default: false
    }
  },

  _generateNewFullFrame: function _generateNewFullFrame(refFullFrame, diffFrame) {
    var newFullFrame = {
      id: diffFrame.id,
      treasures: refFullFrame.treasures,
      traps: refFullFrame.traps,
      bullets: refFullFrame.bullets,
      players: refFullFrame.players,
      speedShoes: refFullFrame.speedShoes,
      pumpkin: refFullFrame.pumpkin,
      guardTowers: refFullFrame.guardTowers //TODO: 根据diffFrame信息增删或者移动守护塔
    };
    var players = diffFrame.players;
    var playersLocalIdStrList = Object.keys(players);
    for (var i = 0; i < playersLocalIdStrList.length; ++i) {
      var k = playersLocalIdStrList[i];
      var playerId = parseInt(k);
      if (true == diffFrame.players[playerId].removed) {
        delete newFullFrame.players[playerId];
      } else {
        newFullFrame.players[playerId] = diffFrame.players[playerId];
      }
    }

    var pumpkin = diffFrame.pumpkin;
    var pumpkinsLocalIdStrList = Object.keys(pumpkin);
    for (var _i = 0; _i < pumpkinsLocalIdStrList.length; ++_i) {
      var _k = pumpkinsLocalIdStrList[_i];
      var pumpkinLocalIdInBattle = parseInt(_k);
      if (true == diffFrame.pumpkin[pumpkinLocalIdInBattle].removed) {
        delete newFullFrame.pumpkin[pumpkinLocalIdInBattle];
      } else {
        newFullFrame.pumpkin[pumpkinLocalIdInBattle] = diffFrame.pumpkin[pumpkinLocalIdInBattle];
      }
    }

    var treasures = diffFrame.treasures;
    var treasuresLocalIdStrList = Object.keys(treasures);
    for (var _i2 = 0; _i2 < treasuresLocalIdStrList.length; ++_i2) {
      var _k2 = treasuresLocalIdStrList[_i2];
      var treasureLocalIdInBattle = parseInt(_k2);
      if (true == diffFrame.treasures[treasureLocalIdInBattle].removed) {
        delete newFullFrame.treasures[treasureLocalIdInBattle];
      } else {
        newFullFrame.treasures[treasureLocalIdInBattle] = diffFrame.treasures[treasureLocalIdInBattle];
      }
    }

    var speedShoes = diffFrame.speedShoes;
    var speedShoesLocalIdStrList = Object.keys(speedShoes);
    for (var _i3 = 0; _i3 < speedShoesLocalIdStrList.length; ++_i3) {
      var _k3 = speedShoesLocalIdStrList[_i3];
      var speedShoesLocalIdInBattle = parseInt(_k3);
      if (true == diffFrame.speedShoes[speedShoesLocalIdInBattle].removed) {
        delete newFullFrame.speedShoes[speedShoesLocalIdInBattle];
      } else {
        newFullFrame.speedShoes[speedShoesLocalIdInBattle] = diffFrame.speedShoes[speedShoesLocalIdInBattle];
      }
    }

    var traps = diffFrame.traps;
    var trapsLocalIdStrList = Object.keys(traps);
    for (var _i4 = 0; _i4 < trapsLocalIdStrList.length; ++_i4) {
      var _k4 = trapsLocalIdStrList[_i4];
      var trapLocalIdInBattle = parseInt(_k4);
      if (true == diffFrame.traps[trapLocalIdInBattle].removed) {
        delete newFullFrame.traps[trapLocalIdInBattle];
      } else {
        newFullFrame.traps[trapLocalIdInBattle] = diffFrame.traps[trapLocalIdInBattle];
      }
    }

    var bullets = diffFrame.bullets;
    var bulletsLocalIdStrList = Object.keys(bullets);
    for (var _i5 = 0; _i5 < bulletsLocalIdStrList.length; ++_i5) {
      var _k5 = bulletsLocalIdStrList[_i5];
      var bulletLocalIdInBattle = parseInt(_k5);
      if (true == diffFrame.bullets[bulletLocalIdInBattle].removed) {
        console.log("Bullet with localIdInBattle == ", bulletLocalIdInBattle, "is removed.");
        delete newFullFrame.bullets[bulletLocalIdInBattle];
      } else {
        newFullFrame.bullets[bulletLocalIdInBattle] = diffFrame.bullets[bulletLocalIdInBattle];
      }
    }

    var accs = diffFrame.speedShoes;
    var accsLocalIdStrList = Object.keys(accs);
    for (var _i6 = 0; _i6 < accsLocalIdStrList.length; ++_i6) {
      var _k6 = accsLocalIdStrList[_i6];
      var accLocalIdInBattle = parseInt(_k6);
      if (true == diffFrame.speedShoes[accLocalIdInBattle].removed) {
        delete newFullFrame.speedShoes[accLocalIdInBattle];
      } else {
        newFullFrame.speedShoes[accLocalIdInBattle] = diffFrame.speedShoes[accLocalIdInBattle];
      }
    }
    return newFullFrame;
  },

  _dumpToFullFrameCache: function _dumpToFullFrameCache(fullFrame) {
    var self = this;
    while (self.recentFrameCacheCurrentSize >= self.recentFrameCacheMaxCount) {
      // Trick here: never evict the "Zero-th Frame" for resyncing!
      var toDelFrameId = Object.keys(self.recentFrameCache)[1];
      delete self.recentFrameCache[toDelFrameId];
      --self.recentFrameCacheCurrentSize;
    }
    self.recentFrameCache[fullFrame.id] = fullFrame;
    ++self.recentFrameCacheCurrentSize;
  },

  _onPerUpsyncFrame: function _onPerUpsyncFrame() {
    var instance = this;
    if (instance.resyncing) return;
    if (null == instance.selfPlayerInfo || null == instance.selfPlayerScriptIns || null == instance.selfPlayerScriptIns.scheduledDirection) return;
    var upsyncFrameData = {
      id: instance.selfPlayerInfo.id,
      /**
      * WARNING
      *
      * Deliberately NOT upsyncing the `instance.selfPlayerScriptIns.activeDirection` here, because it'll be deduced by other players from the position differences of `RoomDownsyncFrame`s.
      */
      dir: {
        dx: parseFloat(instance.selfPlayerScriptIns.scheduledDirection.dx),
        dy: parseFloat(instance.selfPlayerScriptIns.scheduledDirection.dy)
      },
      x: parseFloat(instance.selfPlayerNode.x),
      y: parseFloat(instance.selfPlayerNode.y),
      ackingFrameId: instance.lastRoomDownsyncFrameId
    };
    var wrapped = {
      msgId: Date.now(),
      act: "PlayerUpsyncCmd",
      data: upsyncFrameData
    };
    window.sendSafely(JSON.stringify(wrapped));
  },
  onEnable: function onEnable() {
    cc.warn("+++++++ Map onEnable(), mapIns.counter: " + window.mapIns.counter);
  },
  onDisable: function onDisable() {
    cc.warn("+++++++ Map onDisable(), mapIns.counter: " + window.mapIns.counter);
  },
  onDestroy: function onDestroy() {
    var self = this;
    cc.warn("+++++++ Map onDestroy(), mapIns.counter: " + window.mapIns.counter);
    if (null == self.battleState || ALL_BATTLE_STATES.WAITING == self.battleState) {
      window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
    }
    if (null != window.handleRoomDownsyncFrame) {
      window.handleRoomDownsyncFrame = null;
    }
    if (null != window.handleClientSessionCloseOrError) {
      window.handleClientSessionCloseOrError = null;
    }
    if (self.upsyncLoopInterval) {
      clearInterval(self.upsyncLoopInterval);
    }
    if (self.inputControlTimer) {
      clearInterval(self.inputControlTimer);
    }
  },
  _lazilyTriggerResync: function _lazilyTriggerResync() {
    if (true == this.resyncing) return;
    this.lastResyncingStartedAt = Date.now();
    this.resyncing = true;

    console.warn("_lazilyTriggerResync, resyncing");

    if (ALL_MAP_STATES.SHOWING_MODAL_POPUP != this.state) {
      if (null == this.resyncingHintPopup) {
        this.resyncingHintPopup = this.popupSimplePressToGo(i18n.t("gameTip.resyncing"), true);
      }
    }
  },
  _onResyncCompleted: function _onResyncCompleted() {
    if (false == this.resyncing) return;
    this.resyncing = false;
    var resyncingDurationMillis = Date.now() - this.lastResyncingStartedAt;
    console.warn("_onResyncCompleted, resyncing took ", resyncingDurationMillis, " milliseconds.");
    if (null != this.resyncingHintPopup && this.resyncingHintPopup.parent) {
      this.resyncingHintPopup.parent.removeChild(this.resyncingHintPopup);
    }
  },
  popupSimplePressToGo: function popupSimplePressToGo(labelString, hideYesButton) {
    var self = this;
    self.state = ALL_MAP_STATES.SHOWING_MODAL_POPUP;

    var canvasNode = self.canvasNode;
    var simplePressToGoDialogNode = cc.instantiate(self.simplePressToGoDialogPrefab);
    simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
    simplePressToGoDialogNode.setScale(1 / canvasNode.scale);
    var simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
    var yesButton = simplePressToGoDialogNode.getChildByName("Yes");
    var postDismissalByYes = function postDismissalByYes() {
      self.transitToState(ALL_MAP_STATES.VISUAL);
      canvasNode.removeChild(simplePressToGoDialogNode);
    };
    simplePressToGoDialogNode.getChildByName("Hint").getComponent(cc.Label).string = labelString;
    yesButton.once("click", simplePressToGoDialogScriptIns.dismissDialog.bind(simplePressToGoDialogScriptIns, postDismissalByYes));
    yesButton.getChildByName("Label").getComponent(cc.Label).string = "OK";

    if (true == hideYesButton) {
      yesButton.active = false;
    }

    self.transitToState(ALL_MAP_STATES.SHOWING_MODAL_POPUP);
    safelyAddChild(self.widgetsAboveAllNode, simplePressToGoDialogNode);
    setLocalZOrder(simplePressToGoDialogNode, 20);
    return simplePressToGoDialogNode;
  },
  alertForGoingBackToLoginScene: function alertForGoingBackToLoginScene(labelString, mapIns, shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage) {
    var millisToGo = 3000;
    mapIns.popupSimplePressToGo(cc.js.formatStr("%s will logout in %s seconds.", labelString, millisToGo / 1000));
    setTimeout(function () {
      mapIns.logout(false, shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage);
    }, millisToGo);
  },
  _resetCurrentMatch: function _resetCurrentMatch() {
    var self = this;
    var mapNode = self.node;
    var canvasNode = mapNode.parent;
    self.countdownLabel.string = "";
    if (self.playersNode) {
      for (var i in self.playersNode) {
        var node = self.playersNode[i];
        node.getComponent(cc.Animation).play("Bottom");
        node.getComponent("SelfPlayer").start();
        node.active = true;
      }
    }
    if (self.otherPlayerNodeDict) {
      for (var _i7 in self.otherPlayerNodeDict) {
        var _node = self.otherPlayerNodeDict[_i7];
        if (_node.parent) {
          _node.parent.removeChild(_node);
        }
      }
    }
    if (self.selfPlayerNode && self.selfPlayerNode.parent) {
      self.selfPlayerNode.parent.removeChild(self.selfPlayerNode);
    }
    if (self.treasureNodeDict) {
      for (var _i8 in self.treasureNodeDict) {
        var _node2 = self.treasureNodeDict[_i8];
        if (_node2.parent) {
          _node2.parent.removeChild(_node2);
        }
      }
    }
    if (self.trapBulletNodeDict) {
      for (var _i9 in self.trapBulletNodeDict) {
        var _node3 = self.trapBulletNodeDict[_i9];
        if (_node3.parent) {
          _node3.parent.removeChild(_node3);
        }
      }
    }
    if (self.trapNodeDict) {
      for (var _i10 in self.trapNodeDict) {
        var _node4 = self.trapNodeDict[_i10];
        if (_node4.parent) {
          _node4.parent.removeChild(_node4);
        }
      }
    }

    if (self.pumpkinNodeDict) {
      for (var _i11 in self.pumpkinNodeDict) {
        var _node5 = self.pumpkinNodeDict[_i11];
        if (_node5.parent) {
          _node5.parent.removeChild(_node5);
        }
      }
    }

    if (self.acceleratorNodeDict) {
      for (var _i12 in self.acceleratorNodeDict) {
        var _node6 = self.acceleratorNodeDict[_i12];
        if (_node6.parent) {
          _node6.parent.removeChild(_node6);
        }
      }
    }

    if (self.upsyncLoopInterval) {
      clearInterval(self.upsyncLoopInterval);
    }

    self.mainCameraNode = canvasNode.getChildByName("Main Camera");
    self.mainCamera = self.mainCameraNode.getComponent(cc.Camera);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = self.mainCameraNode.children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var child = _step.value;

        child.setScale(1 / self.mainCamera.zoomRatio);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    self.widgetsAboveAllNode = self.mainCameraNode.getChildByName("WidgetsAboveAll");
    self.mainCameraNode.setPosition(cc.v2());

    self.resyncing = false;
    self.lastRoomDownsyncFrameId = 0;

    self.recentFrameCache = {};
    self.recentFrameCacheCurrentSize = 0;
    self.recentFrameCacheMaxCount = 2048;
    self.selfPlayerNode = null;
    self.selfPlayerScriptIns = null;
    self.selfPlayerInfo = null;
    self.upsyncLoopInterval = null;
    self.transitToState(ALL_MAP_STATES.VISUAL);

    self.battleState = ALL_BATTLE_STATES.WAITING;

    self.pumpkinInfoDict = {};
    self.pumpkinNodeDict = {};
    self.otherPlayerCachedDataDict = {};
    self.otherPlayerNodeDict = {};
    self.treasureInfoDict = {};
    self.treasureNodeDict = {};
    self.trapInfoDict = {};
    self.trapBulletInfoDict = {};
    self.trapBulletNodeDict = {};
    self.trapNodeDict = {};
    self.towerNodeDict = {};
    self.acceleratorNodeDict = {};
    if (self.findingPlayerNode) {
      var findingPlayerScriptIns = self.findingPlayerNode.getComponent("FindingPlayer");
      findingPlayerScriptIns.init();
    }
    self.showPopupInCanvas(self.gameRuleNode);
    safelyAddChild(self.widgetsAboveAllNode, self.playersInfoNode);
  },
  clearLocalStorageAndBackToLoginScene: function clearLocalStorageAndBackToLoginScene(shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage) {
    var self = this;
    if (self.musicEffectManagerScriptIns) {
      self.musicEffectManagerScriptIns.stopAllMusic();
    }
    /**
     * Here I deliberately removed the callback in the "common `handleClientSessionCloseOrError` callback"
     * within which another invocation to `clearLocalStorageAndBackToLoginScene` will be made.
     *
     * It'll be re-assigned to the common one upon reentrance of `Map.onLoad`.
     *
     * -- YFLu 2019-04-06
     */
    window.handleClientSessionCloseOrError = function () {
      console.warn('+++++++ Special handleClientSessionCloseOrError() assigned within `clearLocalStorageAndBackToLoginScene`, mapIns.counter:', window.mapIns.counter);
      // TBD.
      window.handleClientSessionCloseOrError = null; // To ensure that it's called at most once. 
    };
    window.closeWSConnection();
    window.clearSelfPlayer();
    if (true != shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage) {
      window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
    }
    if (cc.sys.platform == cc.sys.WECHAT_GAME) {
      cc.director.loadScene('wechatGameLogin');
    } else {
      cc.director.loadScene('login');
    }
  },
  onLoad: function onLoad() {
    var self = this;
    window.mapIns = self;
    window.forceBigEndianFloatingNumDecoding = self.forceBigEndianFloatingNumDecoding;

    self.counter = function () {
      if (window.mapIns == null || null == window.mapIns.counter) {
        return 0;
      } else {
        return window.mapIns.counter + 1;
      }
    }();

    cc.warn('+++++++ Map onLoad(), map counter:', window.mapIns.counter);
    window.handleClientSessionCloseOrError = function () {
      console.warn('+++++++ Common handleClientSessionCloseOrError(), mapIns.counter:', window.mapIns.counter);

      if (ALL_BATTLE_STATES.IN_SETTLEMENT == self.battleState) {
        //如果是游戏时间结束引起的断连
        console.log("游戏结束引起的断连, 不需要回到登录页面");
      } else {
        console.warn("意外断连，即将回到登录页面");
        self.clearLocalStorageAndBackToLoginScene(true);
      }
    };

    var mapNode = self.node;
    var canvasNode = mapNode.parent;
    cc.director.getCollisionManager().enabled = true;
    cc.director.getCollisionManager().enabledDebugDraw = CC_DEBUG;
    self.musicEffectManagerScriptIns = self.node.getComponent("MusicEffectManager");

    /** Init required prefab started. */
    self.confirmLogoutNode = cc.instantiate(self.confirmLogoutPrefab);
    self.confirmLogoutNode.getComponent("ConfirmLogout").mapNode = self.node;

    // Initializes Result panel.
    self.resultPanelNode = cc.instantiate(self.resultPanelPrefab);
    self.resultPanelNode.width = self.canvasNode.width;
    self.resultPanelNode.height = self.canvasNode.height;

    var resultPanelScriptIns = self.resultPanelNode.getComponent("ResultPanel");
    resultPanelScriptIns.mapScriptIns = self;
    resultPanelScriptIns.onAgainClicked = function () {
      window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
      self._resetCurrentMatch();
      window.initPersistentSessionClient(self.initAfterWSConnected, null /* Deliberately NOT passing in any `expectedRoomId`. -- YFLu */);
    };

    self.gameRuleNode = cc.instantiate(self.gameRulePrefab);
    self.gameRuleNode.width = self.canvasNode.width;
    self.gameRuleNode.height = self.canvasNode.height;

    self.gameRuleScriptIns = self.gameRuleNode.getComponent("GameRule");
    self.gameRuleScriptIns.mapNode = self.node;

    self.findingPlayerNode = cc.instantiate(self.findingPlayerPrefab);
    self.findingPlayerNode.width = self.canvasNode.width;
    self.findingPlayerNode.height = self.canvasNode.height;
    var findingPlayerScriptIns = self.findingPlayerNode.getComponent("FindingPlayer");
    findingPlayerScriptIns.init();

    self.playersInfoNode = cc.instantiate(self.playersInfoPrefab);

    self.countdownToBeginGameNode = cc.instantiate(self.countdownToBeginGamePrefab);
    self.countdownToBeginGameNode.width = self.canvasNode.width;
    self.countdownToBeginGameNode.height = self.canvasNode.height;

    self.playersNode = {};
    var player1Node = cc.instantiate(self.player1Prefab);
    var player2Node = cc.instantiate(self.player2Prefab);
    Object.assign(self.playersNode, {
      1: player1Node
    });
    Object.assign(self.playersNode, {
      2: player2Node
    });

    /** Init required prefab ended. */

    self.clientUpsyncFps = 20;
    self._resetCurrentMatch();

    var tiledMapIns = self.node.getComponent(cc.TiledMap);
    var boundaryObjs = tileCollisionManager.extractBoundaryObjects(self.node);
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = boundaryObjs.frameAnimations[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var frameAnim = _step2.value;

        var animNode = cc.instantiate(self.tiledAnimPrefab);
        var anim = animNode.getComponent(cc.Animation);
        animNode.setPosition(frameAnim.posInMapNode);
        animNode.width = frameAnim.sizeInMapNode.width;
        animNode.height = frameAnim.sizeInMapNode.height;
        animNode.setScale(frameAnim.sizeInMapNode.width / frameAnim.origSize.width, frameAnim.sizeInMapNode.height / frameAnim.origSize.height);
        animNode.setAnchorPoint(cc.v2(0.5, 0)); // A special requirement for "image-type Tiled object" by "CocosCreator v2.0.1".
        safelyAddChild(self.node, animNode);
        setLocalZOrder(animNode, 5);
        anim.addClip(frameAnim.animationClip, "default");
        anim.play("default");
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    self.barrierColliders = [];
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = boundaryObjs.barriers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var boundaryObj = _step3.value;

        var newBarrier = cc.instantiate(self.barrierPrefab);
        var newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
        newBarrier.setPosition(newBoundaryOffsetInMapNode);
        newBarrier.setAnchorPoint(cc.v2(0, 0));
        var newBarrierColliderIns = newBarrier.getComponent(cc.PolygonCollider);
        newBarrierColliderIns.points = [];
        var _iteratorNormalCompletion7 = true;
        var _didIteratorError7 = false;
        var _iteratorError7 = undefined;

        try {
          for (var _iterator7 = boundaryObj[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var p = _step7.value;

            newBarrierColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
          }
        } catch (err) {
          _didIteratorError7 = true;
          _iteratorError7 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion7 && _iterator7.return) {
              _iterator7.return();
            }
          } finally {
            if (_didIteratorError7) {
              throw _iteratorError7;
            }
          }
        }

        self.barrierColliders.push(newBarrierColliderIns);
        self.node.addChild(newBarrier);
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    var allLayers = tiledMapIns.getLayers();
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = allLayers[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var layer = _step4.value;

        var layerType = layer.getProperty("type");
        switch (layerType) {
          case "normal":
            setLocalZOrder(layer.node, 0);
            break;
          case "barrier_and_shelter":
            setLocalZOrder(layer.node, 3);
            break;
          default:
            break;
        }
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }

    var allObjectGroups = tiledMapIns.getObjectGroups();
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = allObjectGroups[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var objectGroup = _step5.value;

        var objectGroupType = objectGroup.getProperty("type");
        switch (objectGroupType) {
          case "barrier_and_shelter":
            setLocalZOrder(objectGroup.node, 3);
            break;
          default:
            break;
        }
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5.return) {
          _iterator5.return();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }

    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = boundaryObjs.sheltersZReducer[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var _boundaryObj = _step6.value;

        var newShelter = cc.instantiate(self.shelterZReducerPrefab);
        var newBoundaryOffsetInMapNode = cc.v2(_boundaryObj[0].x, _boundaryObj[0].y);
        newShelter.setPosition(newBoundaryOffsetInMapNode);
        newShelter.setAnchorPoint(cc.v2(0, 0));
        var newShelterColliderIns = newShelter.getComponent(cc.PolygonCollider);
        newShelterColliderIns.points = [];
        var _iteratorNormalCompletion8 = true;
        var _didIteratorError8 = false;
        var _iteratorError8 = undefined;

        try {
          for (var _iterator8 = _boundaryObj[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var _p = _step8.value;

            newShelterColliderIns.points.push(_p.sub(newBoundaryOffsetInMapNode));
          }
        } catch (err) {
          _didIteratorError8 = true;
          _iteratorError8 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion8 && _iterator8.return) {
              _iterator8.return();
            }
          } finally {
            if (_didIteratorError8) {
              throw _iteratorError8;
            }
          }
        }

        self.node.addChild(newShelter);
      }
    } catch (err) {
      _didIteratorError6 = true;
      _iteratorError6 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion6 && _iterator6.return) {
          _iterator6.return();
        }
      } finally {
        if (_didIteratorError6) {
          throw _iteratorError6;
        }
      }
    }

    self.initAfterWSConnected = function () {
      var self = window.mapIns;
      self.hideGameRuleNode();
      self.selfPlayerInfo = JSON.parse(cc.sys.localStorage.getItem('selfPlayer'));
      Object.assign(self.selfPlayerInfo, {
        id: self.selfPlayerInfo.playerId
      });
      self.transitToState(ALL_MAP_STATES.WAITING);
      self._inputControlEnabled = false;
      self.setupInputControls();

      window.handleRoomDownsyncFrame = function (diffFrame) {
        if (ALL_BATTLE_STATES.WAITING != self.battleState && ALL_BATTLE_STATES.IN_BATTLE != self.battleState && ALL_BATTLE_STATES.IN_SETTLEMENT != self.battleState) {
          return;
        }
        var refFrameId = diffFrame.refFrameId;
        if (-99 == refFrameId) {
          //显示倒计时
          self.playersMatched(diffFrame.players);
          //隐藏返回按钮
          var _findingPlayerScriptIns = self.findingPlayerNode.getComponent("FindingPlayer");
          _findingPlayerScriptIns.hideExitButton();
        } else if (-98 == refFrameId) {
          //显示匹配玩家
          if (window.initWxSdk) {
            window.initWxSdk();
          }
          var _findingPlayerScriptIns2 = self.findingPlayerNode.getComponent("FindingPlayer");
          if (!self.findingPlayerNode.parent) {
            self.showPopupInCanvas(self.findingPlayerNode);
          }
          _findingPlayerScriptIns2.updatePlayersInfo(diffFrame.players);
          return;
        }

        var frameId = diffFrame.id;
        if (frameId <= self.lastRoomDownsyncFrameId) {
          // Log the obsolete frames?
          return;
        }
        var isInitiatingFrame = 0 >= self.recentFrameCacheCurrentSize || 0 == refFrameId;
        /*
        if (frameId % 300 == 0) {
          // WARNING: For testing only!
          if (0 < frameId) {
            self._lazilyTriggerResync(); 
          }
          console.log(JSON.stringify(diffFrame));
        }
        */

        //For test --kobako
        if (isInitiatingFrame) {
          console.warn('---------------InitiatingFrame');
          console.log(diffFrame);
          console.warn('---------------InitiatingFrame');
        }

        var cachedFullFrame = self.recentFrameCache[refFrameId];
        if (!isInitiatingFrame && self.useDiffFrameAlgo && (refFrameId > 0 || 0 < self.recentFrameCacheCurrentSize) // Critical condition to differentiate between "BattleStarted" or "ShouldResync". 
        && null == cachedFullFrame) {
          self._lazilyTriggerResync();
          // Later incoming diffFrames will all suffice that `0 < self.recentFrameCacheCurrentSize && null == cachedFullFrame`, until `this._onResyncCompleted` is successfully invoked.
          return;
        }

        if (isInitiatingFrame && 0 == refFrameId) {
          // Reaching here implies that you've received the resync frame.
          self._onResyncCompleted();
        }
        var countdownNanos = diffFrame.countdownNanos;
        if (countdownNanos < 0) {
          countdownNanos = 0;
        }
        var countdownSeconds = parseInt(countdownNanos / 1000000000);
        if (isNaN(countdownSeconds)) {
          cc.warn("countdownSeconds is NaN for countdownNanos == " + countdownNanos + ".");
        }
        self.countdownLabel.string = countdownSeconds;
        var roomDownsyncFrame = //根据refFrameId和diffFrame计算出新的一帧
        isInitiatingFrame || !self.useDiffFrameAlgo ? diffFrame : self._generateNewFullFrame(cachedFullFrame, diffFrame);

        if (countdownNanos <= 0) {
          self.onBattleStopped(roomDownsyncFrame.players);
          return;
        }
        self._dumpToFullFrameCache(roomDownsyncFrame);
        var sentAt = roomDownsyncFrame.sentAt;

        var players = roomDownsyncFrame.players;
        var playerIdStrList = Object.keys(players);
        self.otherPlayerCachedDataDict = {};
        for (var i = 0; i < playerIdStrList.length; ++i) {
          var k = playerIdStrList[i];
          var playerId = parseInt(k);
          if (playerId == self.selfPlayerInfo.id) {
            var immediateSelfPlayerInfo = players[k];
            Object.assign(self.selfPlayerInfo, {
              displayName: null == immediateSelfPlayerInfo.displayName ? null == immediateSelfPlayerInfo.name ? "" : immediateSelfPlayerInfo.name : immediateSelfPlayerInfo.displayName,
              x: immediateSelfPlayerInfo.x,
              y: immediateSelfPlayerInfo.y,
              speed: immediateSelfPlayerInfo.speed,
              battleState: immediateSelfPlayerInfo.battleState,
              score: immediateSelfPlayerInfo.score,
              joinIndex: immediateSelfPlayerInfo.joinIndex
            });
            continue;
          }
          var anotherPlayer = players[k];
          // Note that this callback is invoked in the NetworkThread, and the rendering should be executed in the GUIThread, e.g. within `update(dt)`.
          self.otherPlayerCachedDataDict[playerId] = anotherPlayer;
        }

        //update pumpkin Info 
        self.pumpkinInfoDict = {};
        var pumpkin = roomDownsyncFrame.pumpkin;
        var pumpkinsLocalIdStrList = Object.keys(pumpkin);
        for (var _i13 = 0; _i13 < pumpkinsLocalIdStrList.length; ++_i13) {
          var _k7 = pumpkinsLocalIdStrList[_i13];
          var pumpkinLocalIdInBattle = parseInt(_k7);
          var pumpkinInfo = pumpkin[_k7];
          self.pumpkinInfoDict[pumpkinLocalIdInBattle] = pumpkinInfo;
        }

        //update treasureInfoDict
        self.treasureInfoDict = {};
        var treasures = roomDownsyncFrame.treasures;
        var treasuresLocalIdStrList = Object.keys(treasures);
        for (var _i14 = 0; _i14 < treasuresLocalIdStrList.length; ++_i14) {
          //直接根据最新帧的数据覆盖掉treasureInfoDict
          var _k8 = treasuresLocalIdStrList[_i14];
          var treasureLocalIdInBattle = parseInt(_k8);
          var treasureInfo = treasures[_k8];
          self.treasureInfoDict[treasureLocalIdInBattle] = treasureInfo;
        }

        //update acceleratorInfoDict
        self.acceleratorInfoDict = {};
        var accelartors = roomDownsyncFrame.speedShoes;
        var accLocalIdStrList = Object.keys(accelartors);
        for (var _i15 = 0; _i15 < accLocalIdStrList.length; ++_i15) {
          var _k9 = accLocalIdStrList[_i15];
          var accLocalIdInBattle = parseInt(_k9);
          var accInfo = accelartors[_k9];
          self.acceleratorInfoDict[accLocalIdInBattle] = accInfo;
        }

        //update trapInfoDict
        self.trapInfoDict = {};
        var traps = roomDownsyncFrame.traps;
        var trapsLocalIdStrList = Object.keys(traps);
        for (var _i16 = 0; _i16 < trapsLocalIdStrList.length; ++_i16) {
          var _k10 = trapsLocalIdStrList[_i16];
          var trapLocalIdInBattle = parseInt(_k10);
          var trapInfo = traps[_k10];
          self.trapInfoDict[trapLocalIdInBattle] = trapInfo;
        }

        self.trapBulletInfoDict = {};
        var bullets = roomDownsyncFrame.bullets;
        var bulletsLocalIdStrList = Object.keys(bullets);
        for (var _i17 = 0; _i17 < bulletsLocalIdStrList.length; ++_i17) {
          var _k11 = bulletsLocalIdStrList[_i17];
          var bulletLocalIdInBattle = parseInt(_k11);
          var bulletInfo = bullets[_k11];
          self.trapBulletInfoDict[bulletLocalIdInBattle] = bulletInfo;
        }

        // Update `guardTowerInfoDict`.
        self.guardTowerInfoDict = {};
        var guardTowers = roomDownsyncFrame.guardTowers;
        var ids = Object.keys(guardTowers);
        for (var _i18 = 0; _i18 < ids.length; ++_i18) {
          var id = ids[_i18];
          var localIdInBattle = parseInt(id);
          var tower = guardTowers[id];
          self.guardTowerInfoDict[localIdInBattle] = tower;
        }

        if (0 == self.lastRoomDownsyncFrameId) {
          self.battleState = ALL_BATTLE_STATES.IN_BATTLE;
          if (1 == frameId) {
            // No need to prompt upon rejoined.
            self.popupSimplePressToGo(i18n.t("gameTip.start"));
          }
          self.onBattleStarted();
        }
        self.lastRoomDownsyncFrameId = frameId;
        // TODO: Inject a NetworkDoctor as introduced in https://app.yinxiang.com/shard/s61/nl/13267014/5c575124-01db-419b-9c02-ec81f78c6ddc/.
      };
    };

    // The player is now viewing "self.gameRuleNode" with button(s) to start an actual battle. -- YFLu
    var expectedRoomId = window.getExpectedRoomIdSync();
    console.warn("expectedRoomId: ", expectedRoomId);
    if (null != expectedRoomId) {
      self.disableGameRuleNode();
      // The player is now viewing "self.gameRuleNode" with no button, and should wait for `self.initAfterWSConnected` to be called. -- YFLu
      window.initPersistentSessionClient(self.initAfterWSConnected, expectedRoomId);
    } else {
      // Deliberately left blank. -- YFLu
    }
  },
  disableGameRuleNode: function disableGameRuleNode() {
    var self = window.mapIns;
    if (null != self.gameRuleNode && null != self.gameRuleNode.active && null != self.gameRuleScriptIns) {
      self.gameRuleScriptIns.modeButton.active = false;
    }
  },
  hideGameRuleNode: function hideGameRuleNode() {
    var self = window.mapIns;
    if (null != self.gameRuleNode && null != self.gameRuleNode.active) {
      self.gameRuleNode.active = false;
    }
  },
  setupInputControls: function setupInputControls() {
    var instance = window.mapIns;
    var mapNode = instance.node;
    var canvasNode = mapNode.parent;
    var joystickInputControllerScriptIns = canvasNode.getComponent("TouchEventsManager");
    var inputControlPollerMillis = 1000 / joystickInputControllerScriptIns.pollerFps;

    var ctrl = joystickInputControllerScriptIns;
    instance.ctrl = ctrl;

    instance.inputControlTimer = setInterval(function () {
      if (false == instance._inputControlEnabled) return;
      if (instance.selfPlayerScriptIns != null && ctrl != null) {
        instance.selfPlayerScriptIns.activeDirection = ctrl.activeDirection;
      }
    }, inputControlPollerMillis);
  },
  enableInputControls: function enableInputControls() {
    this._inputControlEnabled = true;
  },
  disableInputControls: function disableInputControls() {
    this._inputControlEnabled = false;
  },
  onBattleStarted: function onBattleStarted() {
    cc.warn('On battle started!');
    var self = window.mapIns;
    if (self.musicEffectManagerScriptIns) {
      self.musicEffectManagerScriptIns.playBGM();
    }
    var canvasNode = self.canvasNode;
    self.spawnSelfPlayer();
    self.upsyncLoopInterval = setInterval(self._onPerUpsyncFrame.bind(self), self.clientUpsyncFps);
    self.enableInputControls();
    if (self.countdownToBeginGameNode.parent) {
      self.countdownToBeginGameNode.parent.removeChild(self.countdownToBeginGameNode);
    }
    self.transitToState(ALL_MAP_STATES.VISUAL);
  },
  onBattleStopped: function onBattleStopped(players) {
    var self = this;
    if (self.musicEffectManagerScriptIns) {
      self.musicEffectManagerScriptIns.stopAllMusic();
    }
    var canvasNode = self.canvasNode;
    var resultPanelNode = self.resultPanelNode;
    var resultPanelScriptIns = resultPanelNode.getComponent("ResultPanel");
    resultPanelScriptIns.showPlayerInfo(players);
    window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
    // Such that it doesn't execute "update(dt)" anymore. 
    self.selfPlayerNode.active = false;
    self.battleState = ALL_BATTLE_STATES.IN_SETTLEMENT;
    self.showPopupInCanvas(resultPanelNode);

    // Clear player info
    self.playersInfoNode.getComponent("PlayersInfo").clearInfo();
  },
  spawnSelfPlayer: function spawnSelfPlayer() {
    var instance = this;
    var joinIndex = this.selfPlayerInfo.joinIndex;
    var newPlayerNode = this.playersNode[joinIndex];
    var tiledMapIns = instance.node.getComponent(cc.TiledMap);
    var toStartWithPos = cc.v2(instance.selfPlayerInfo.x, instance.selfPlayerInfo.y);
    newPlayerNode.setPosition(toStartWithPos);
    newPlayerNode.getComponent("SelfPlayer").mapNode = instance.node;

    instance.node.addChild(newPlayerNode);
    instance.selfPlayerScriptIns = newPlayerNode.getComponent("SelfPlayer");
    instance.selfPlayerScriptIns.showArrowTipNode();

    setLocalZOrder(newPlayerNode, 5);
    instance.selfPlayerNode = newPlayerNode;
  },
  update: function update(dt) {
    var self = this;
    try {
      var mapNode = self.node;
      var canvasNode = mapNode.parent;
      var canvasParentNode = canvasNode.parent;
      if (null != window.boundRoomId) {
        self.boundRoomIdLabel.string = window.boundRoomId;
      }
      if (null != self.selfPlayerInfo) {
        var playersScriptIns = self.playersInfoNode.getComponent("PlayersInfo");
        playersScriptIns.updateData(self.selfPlayerInfo);
        if (null != self.selfPlayerScriptIns) {
          self.selfPlayerScriptIns.updateSpeed(self.selfPlayerInfo.speed);
        }
      }

      var toRemoveAcceleratorNodeDict = {};
      Object.assign(toRemoveAcceleratorNodeDict, self.acceleratorNodeDict);

      var toRemovePlayerNodeDict = {};
      Object.assign(toRemovePlayerNodeDict, self.otherPlayerNodeDict);

      var toRemoveTreasureNodeDict = {};
      Object.assign(toRemoveTreasureNodeDict, self.treasureNodeDict);

      var toRemoveTrapNodeDict = {};
      Object.assign(toRemoveTrapNodeDict, self.trapNodeDict);

      var toRemovePumpkinNodeDict = {};
      Object.assign(toRemovePumpkinNodeDict, self.pumpkinNodeDict);

      /*
      * NOTE: At the beginning of each GUI update cycle, mark all `self.trapBulletNode` as `toRemoveBulletNode`, while only those that persist in `self.trapBulletInfoDict` are NOT finally removed. This approach aims to reduce the lines of codes for coping with node removal in the RoomDownsyncFrame algorithm.
      */
      var toRemoveBulletNodeDict = {};
      Object.assign(toRemoveBulletNodeDict, self.trapBulletNodeDict);

      for (var k in self.otherPlayerCachedDataDict) {
        var playerId = parseInt(k);
        var cachedPlayerData = self.otherPlayerCachedDataDict[playerId];
        var newPos = cc.v2(cachedPlayerData.x, cachedPlayerData.y);

        //更新玩家信息展示
        if (null != cachedPlayerData) {
          var _playersScriptIns = self.playersInfoNode.getComponent("PlayersInfo");
          _playersScriptIns.updateData(cachedPlayerData);
        }
        var targetNode = self.otherPlayerNodeDict[playerId];
        if (!targetNode) {
          targetNode = self.playersNode[cachedPlayerData.joinIndex];
          targetNode.getComponent("SelfPlayer").mapNode = mapNode;
          self.otherPlayerNodeDict[playerId] = targetNode;
          safelyAddChild(mapNode, targetNode);
          targetNode.setPosition(newPos);
          setLocalZOrder(targetNode, 5);
        }
        var aControlledOtherPlayerScriptIns = targetNode.getComponent("SelfPlayer");
        aControlledOtherPlayerScriptIns.updateSpeed(cachedPlayerData.speed);

        var oldPos = cc.v2(targetNode.x, targetNode.y);

        var toMoveByVec = newPos.sub(oldPos);
        var toMoveByVecMag = toMoveByVec.mag();
        aControlledOtherPlayerScriptIns.toMoveByVecMag = toMoveByVecMag;
        var toTeleportDisThreshold = cachedPlayerData.speed * dt * 100;
        //const notToMoveDisThreshold = (cachedPlayerData.speed * dt * 0.5);
        var notToMoveDisThreshold = cachedPlayerData.speed * dt * 1.0;
        if (toMoveByVecMag < notToMoveDisThreshold) {
          aControlledOtherPlayerScriptIns.activeDirection = { //任意一个值为0都不会改变方向
            dx: 0,
            dy: 0
          };
        } else {
          if (toMoveByVecMag > toTeleportDisThreshold) {
            //如果移动过大 打印log但还是会移动
            console.log("Player ", cachedPlayerData.id, " is teleporting! Having toMoveByVecMag == ${toMoveByVecMag}, toTeleportDisThreshold == ", toTeleportDisThreshold);
            aControlledOtherPlayerScriptIns.activeDirection = {
              dx: 0,
              dy: 0
            };
            // TODO: Use `cc.Action`?
            targetNode.setPosition(newPos);
          } else {
            // The common case which is suitable for interpolation.
            var normalizedDir = {
              dx: toMoveByVec.x / toMoveByVecMag,
              dy: toMoveByVec.y / toMoveByVecMag
            };
            aControlledOtherPlayerScriptIns.toMoveByVec = toMoveByVec;
            aControlledOtherPlayerScriptIns.toMoveByVecMag = toMoveByVecMag;

            if (isNaN(normalizedDir.dx) || isNaN(normalizedDir.dy)) {
              aControlledOtherPlayerScriptIns.activeDirection = {
                dx: 0,
                dy: 0
              };
            } else {
              aControlledOtherPlayerScriptIns.activeDirection = normalizedDir;
            }
          }
        }

        if (0 != cachedPlayerData.dir.dx || 0 != cachedPlayerData.dir.dy) {
          var newScheduledDirection = self.ctrl.discretizeDirection(cachedPlayerData.dir.dx, cachedPlayerData.dir.dy, self.ctrl.joyStickEps);
          aControlledOtherPlayerScriptIns.scheduleNewDirection(newScheduledDirection, false /* DON'T interrupt playing anim. */);
        }

        if (null != toRemovePlayerNodeDict[playerId]) {
          delete toRemovePlayerNodeDict[playerId];
        }
      }

      // 更新加速鞋显示 
      for (var _k12 in self.acceleratorInfoDict) {
        var accLocalIdInBattle = parseInt(_k12);
        var acceleratorInfo = self.acceleratorInfoDict[accLocalIdInBattle];
        var _newPos = cc.v2(acceleratorInfo.x, acceleratorInfo.y);
        var _targetNode = self.acceleratorNodeDict[accLocalIdInBattle];
        if (!_targetNode) {
          _targetNode = cc.instantiate(self.acceleratorPrefab);
          self.acceleratorNodeDict[accLocalIdInBattle] = _targetNode;
          safelyAddChild(mapNode, _targetNode);
          _targetNode.setPosition(_newPos);
          setLocalZOrder(_targetNode, 5);
        }
        if (null != toRemoveAcceleratorNodeDict[accLocalIdInBattle]) {
          delete toRemoveAcceleratorNodeDict[accLocalIdInBattle];
        }
      }
      // 更新陷阱显示 
      for (var _k13 in self.trapInfoDict) {
        var trapLocalIdInBattle = parseInt(_k13);
        var trapInfo = self.trapInfoDict[trapLocalIdInBattle];
        var _newPos2 = cc.v2(trapInfo.x, trapInfo.y);
        var _targetNode2 = self.trapNodeDict[trapLocalIdInBattle];
        if (!_targetNode2) {
          _targetNode2 = cc.instantiate(self.trapPrefab);
          self.trapNodeDict[trapLocalIdInBattle] = _targetNode2;
          safelyAddChild(mapNode, _targetNode2);
          _targetNode2.setPosition(_newPos2);
          setLocalZOrder(_targetNode2, 5);
        }
        if (null != toRemoveTrapNodeDict[trapLocalIdInBattle]) {
          delete toRemoveTrapNodeDict[trapLocalIdInBattle];
        }
      }

      // 更新陷阱塔显示 
      for (var _k14 in self.guardTowerInfoDict) {
        var _trapLocalIdInBattle = parseInt(_k14);
        var towerInfo = self.guardTowerInfoDict[_trapLocalIdInBattle];
        var _newPos3 = cc.v2(towerInfo.x, towerInfo.y);
        var _targetNode3 = self.towerNodeDict[_trapLocalIdInBattle];
        if (!_targetNode3) {
          _targetNode3 = cc.instantiate(self.guardTowerPrefab);
          self.towerNodeDict[_trapLocalIdInBattle] = _targetNode3;
          safelyAddChild(mapNode, _targetNode3);
          _targetNode3.setPosition(_newPos3);
          setLocalZOrder(_targetNode3, 5);
        }
      }

      // 更新bullet显示 

      var _loop = function _loop(_k15) {
        var bulletLocalIdInBattle = parseInt(_k15);
        var bulletInfo = self.trapBulletInfoDict[bulletLocalIdInBattle];
        var newPos = cc.v2(bulletInfo.x, bulletInfo.y);
        var targetNode = self.trapBulletNodeDict[bulletLocalIdInBattle];
        if (!targetNode) {
          targetNode = cc.instantiate(self.trapBulletPrefab);

          //kobako: 创建子弹node的时候设置旋转角度
          targetNode.rotation = function () {
            if (null == bulletInfo.startAtPoint || null == bulletInfo.endAtPoint) {
              console.error("Init bullet direction error, startAtPoint:" + startAtPoint + ", endAtPoint:" + endAtPoint);
              return 0;
            } else {

              var dx = bulletInfo.endAtPoint.x - bulletInfo.startAtPoint.x;
              var dy = bulletInfo.endAtPoint.y - bulletInfo.startAtPoint.y;
              var radian = function () {
                if (dx == 0) {
                  return Math.PI / 2;
                } else {
                  return Math.abs(Math.atan(dy / dx));
                }
              }();
              var angleTemp = radian * 180 / Math.PI;
              var angle = function () {
                if (dx >= 0) {
                  if (dy >= 0) {
                    //第一象限
                    return 360 - angleTemp;
                    //return angleTemp;
                  } else {
                    //第四象限
                    return angleTemp;
                    //return -angleTemp;
                  }
                } else {
                  if (dy >= 0) {
                    //第二象限
                    return 360 - (180 - angleTemp);
                    //return 180 - angleTemp;
                  } else {
                    //第三象限
                    return 360 - (180 + angleTemp);
                    //return 180 + angleTemp;
                  }
                }
              }();
              return angle;
            }
          }();
          //

          self.trapBulletNodeDict[bulletLocalIdInBattle] = targetNode;
          safelyAddChild(mapNode, targetNode);
          targetNode.setPosition(newPos);
          setLocalZOrder(targetNode, 5);
        }
        var aBulletScriptIns = targetNode.getComponent("Bullet");
        aBulletScriptIns.localIdInBattle = bulletLocalIdInBattle;
        aBulletScriptIns.linearSpeed = bulletInfo.linearSpeed * 1000000000; // The `bullet.LinearSpeed` on server-side is denoted in pts/nanoseconds. 

        var oldPos = cc.v2(targetNode.x, targetNode.y);
        var toMoveByVec = newPos.sub(oldPos);
        var toMoveByVecMag = toMoveByVec.mag();
        var toTeleportDisThreshold = aBulletScriptIns.linearSpeed * dt * 100;
        var notToMoveDisThreshold = aBulletScriptIns.linearSpeed * dt * 0.5;
        if (toMoveByVecMag < notToMoveDisThreshold) {
          aBulletScriptIns.activeDirection = {
            dx: 0,
            dy: 0
          };
        } else {
          if (toMoveByVecMag > toTeleportDisThreshold) {
            console.log("Bullet ", bulletLocalIdInBattle, " is teleporting! Having toMoveByVecMag == ${toMoveByVecMag}, toTeleportDisThreshold == ", toTeleportDisThreshold);
            aBulletScriptIns.activeDirection = {
              dx: 0,
              dy: 0
            };
            // TODO: Use `cc.Action`?
            targetNode.setPosition(newPos);
          } else {
            // The common case which is suitable for interpolation.
            var _normalizedDir2 = {
              dx: toMoveByVec.x / toMoveByVecMag,
              dy: toMoveByVec.y / toMoveByVecMag
            };
            if (isNaN(_normalizedDir2.dx) || isNaN(_normalizedDir2.dy)) {
              aBulletScriptIns.activeDirection = {
                dx: 0,
                dy: 0
              };
            } else {
              aBulletScriptIns.activeDirection = _normalizedDir2;
            }
          }
        }
        if (null != toRemoveBulletNodeDict[bulletLocalIdInBattle]) {
          delete toRemoveBulletNodeDict[bulletLocalIdInBattle];
        }
      };

      for (var _k15 in self.trapBulletInfoDict) {
        _loop(_k15);
      }

      //更新南瓜少年的显示
      for (var _k16 in self.pumpkinInfoDict) {
        var pumpkinLocalIdInBattle = parseInt(_k16);
        var pumpkinInfo = self.pumpkinInfoDict[pumpkinLocalIdInBattle];
        var _newPos4 = cc.v2(pumpkinInfo.x, pumpkinInfo.y);
        var _targetNode4 = self.pumpkinNodeDict[pumpkinLocalIdInBattle];
        if (!_targetNode4) {
          _targetNode4 = cc.instantiate(self.pumpkinPrefab);
          self.pumpkinNodeDict[pumpkinLocalIdInBattle] = _targetNode4;
          safelyAddChild(mapNode, _targetNode4);
          _targetNode4.setPosition(_newPos4);
          setLocalZOrder(_targetNode4, 5);
        }
        var aPumpkinScriptIns = _targetNode4.getComponent("Pumpkin");
        aPumpkinScriptIns.localIdInBattle = pumpkinLocalIdInBattle;
        aPumpkinScriptIns.linearSpeed = pumpkinInfo.linearSpeed * 1000000000; // The `pumpkin.LinearSpeed` on server-side is denoted in pts/nanoseconds. 

        var _oldPos = cc.v2(_targetNode4.x, _targetNode4.y);
        var _toMoveByVec = _newPos4.sub(_oldPos);
        var _toMoveByVecMag = _toMoveByVec.mag();
        var _toTeleportDisThreshold = aPumpkinScriptIns.linearSpeed * dt * 100;
        var _notToMoveDisThreshold = aPumpkinScriptIns.linearSpeed * dt * 0.5;
        if (_toMoveByVecMag < _notToMoveDisThreshold) {
          aPumpkinScriptIns.activeDirection = {
            dx: 0,
            dy: 0
          };
        } else {
          if (_toMoveByVecMag > _toTeleportDisThreshold) {
            console.log("Pumpkin ", pumpkinLocalIdInBattle, " is teleporting! Having toMoveByVecMag == ${toMoveByVecMag}, toTeleportDisThreshold == ", _toTeleportDisThreshold);
            aPumpkinScriptIns.activeDirection = {
              dx: 0,
              dy: 0
            };
            // TODO: Use `cc.Action`?
            _targetNode4.setPosition(_newPos4);
          } else {
            // The common case which is suitable for interpolation.
            var _normalizedDir = {
              dx: _toMoveByVec.x / _toMoveByVecMag,
              dy: _toMoveByVec.y / _toMoveByVecMag
            };
            if (isNaN(_normalizedDir.dx) || isNaN(_normalizedDir.dy)) {
              aPumpkinScriptIns.activeDirection = {
                dx: 0,
                dy: 0
              };
            } else {
              aPumpkinScriptIns.activeDirection = _normalizedDir;
            }
          }
        }
        if (null != toRemovePumpkinNodeDict[pumpkinLocalIdInBattle]) {
          delete toRemovePumpkinNodeDict[pumpkinLocalIdInBattle];
        }
      }

      // 更新宝物显示 
      for (var _k17 in self.treasureInfoDict) {
        var treasureLocalIdInBattle = parseInt(_k17);
        var treasureInfo = self.treasureInfoDict[treasureLocalIdInBattle];
        var _newPos5 = cc.v2(treasureInfo.x, treasureInfo.y);
        var _targetNode5 = self.treasureNodeDict[treasureLocalIdInBattle];
        if (!_targetNode5) {
          _targetNode5 = cc.instantiate(self.treasurePrefab);
          var treasureNodeScriptIns = _targetNode5.getComponent("Treasure");
          treasureNodeScriptIns.setData(treasureInfo);
          self.treasureNodeDict[treasureLocalIdInBattle] = _targetNode5;
          safelyAddChild(mapNode, _targetNode5);
          _targetNode5.setPosition(_newPos5);
          setLocalZOrder(_targetNode5, 5);
        }

        if (null != toRemoveTreasureNodeDict[treasureLocalIdInBattle]) {
          delete toRemoveTreasureNodeDict[treasureLocalIdInBattle];
        }
        if (0 < _targetNode5.getNumberOfRunningActions()) {
          // A significant trick to smooth the position sync performance!
          continue;
        }
        var _oldPos2 = cc.v2(_targetNode5.x, _targetNode5.y);
        var _toMoveByVec2 = _newPos5.sub(_oldPos2);
        var durationSeconds = dt; // Using `dt` temporarily!
        _targetNode5.runAction(cc.moveTo(durationSeconds, _newPos5));
      }

      // Coping with removed players.
      for (var _k18 in toRemovePlayerNodeDict) {
        var _playerId = parseInt(_k18);
        toRemovePlayerNodeDict[_k18].parent.removeChild(toRemovePlayerNodeDict[_k18]);
        delete self.otherPlayerNodeDict[_playerId];
      }

      // Coping with removed pumpkins.
      for (var _k19 in toRemovePumpkinNodeDict) {
        var _pumpkinLocalIdInBattle = parseInt(_k19);
        toRemovePumpkinNodeDict[_k19].parent.removeChild(toRemovePlayerNodeDict[_k19]);
        delete self.pumpkinNodeDict[_pumpkinLocalIdInBattle];
      }

      // Coping with removed treasures.
      for (var _k20 in toRemoveTreasureNodeDict) {
        var _treasureLocalIdInBattle = parseInt(_k20);
        var treasureScriptIns = toRemoveTreasureNodeDict[_k20].getComponent("Treasure");
        treasureScriptIns.playPickedUpAnimAndDestroy();
        if (self.musicEffectManagerScriptIns) {
          if (2 == treasureScriptIns.type) {
            self.musicEffectManagerScriptIns.playHighScoreTreasurePicked();
          } else {
            self.musicEffectManagerScriptIns.playTreasurePicked();
          }
        }
        delete self.treasureNodeDict[_treasureLocalIdInBattle];
      }

      // Coping with removed traps.
      for (var _k21 in toRemoveTrapNodeDict) {
        var _trapLocalIdInBattle2 = parseInt(_k21);
        toRemoveTrapNodeDict[_k21].parent.removeChild(toRemoveTrapNodeDict[_k21]);
        delete self.trapNodeDict[_trapLocalIdInBattle2];
      }

      // Coping with removed accelerators.
      for (var _k22 in toRemoveAcceleratorNodeDict) {
        var _accLocalIdInBattle = parseInt(_k22);
        toRemoveAcceleratorNodeDict[_k22].parent.removeChild(toRemoveAcceleratorNodeDict[_k22]);
        delete self.acceleratorNodeDict[_accLocalIdInBattle];
      }

      // Coping with removed bullets.
      for (var _k23 in toRemoveBulletNodeDict) {
        var _bulletLocalIdInBattle = parseInt(_k23);
        toRemoveBulletNodeDict[_k23].parent.removeChild(toRemoveBulletNodeDict[_k23]);
        delete self.trapBulletNodeDict[_bulletLocalIdInBattle];
        if (self.musicEffectManagerScriptIns) {
          self.musicEffectManagerScriptIns.playCrashedByTrapBullet();
        }
      }
    } catch (err) {
      console.warn("Map.update(dt)内发生了错误, 即将清空localStorage并回到登录页面", err);
      self.clearLocalStorageAndBackToLoginScene(true);
    }
  },
  transitToState: function transitToState(s) {
    var self = this;
    self.state = s;
  },
  logout: function logout(byClick /* The case where this param is "true" will be triggered within `ConfirmLogout.js`.*/, shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage) {
    var self = this;
    var localClearance = function localClearance() {
      self.clearLocalStorageAndBackToLoginScene(shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage);
    };

    var selfPlayerStr = cc.sys.localStorage.getItem("selfPlayer");
    if (null != selfPlayerStr) {
      var selfPlayer = JSON.parse(selfPlayerStr);
      var requestContent = {
        intAuthToken: selfPlayer.intAuthToken
      };
      try {
        NetworkUtils.ajax({
          url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.INT_AUTH_TOKEN + constants.ROUTE_PATH.LOGOUT,
          type: "POST",
          data: requestContent,
          success: function success(res) {
            if (res.ret != constants.RET_CODE.OK) {
              console.log("Logout failed: ", res);
            }
            localClearance();
          },
          error: function error(xhr, status, errMsg) {
            localClearance();
          },
          timeout: function timeout() {
            localClearance();
          }
        });
      } catch (e) {} finally {
        // For Safari (both desktop and mobile).
        localClearance();
      }
    } else {
      localClearance();
    }
  },
  onLogoutClicked: function onLogoutClicked(evt) {
    var self = this;
    self.showPopupInCanvas(self.confirmLogoutNode);
  },
  onLogoutConfirmationDismissed: function onLogoutConfirmationDismissed() {
    var self = this;
    self.transitToState(ALL_MAP_STATES.VISUAL);
    var canvasNode = self.canvasNode;
    canvasNode.removeChild(self.confirmLogoutNode);
    self.enableInputControls();
  },
  onGameRule1v1ModeClicked: function onGameRule1v1ModeClicked(evt, cb) {
    var self = this;
    window.initPersistentSessionClient(self.initAfterWSConnected, null /* Deliberately NOT passing in any `expectedRoomId`. -- YFLu */);
    self.hideGameRuleNode();
  },
  showPopupInCanvas: function showPopupInCanvas(toShowNode) {
    var self = this;
    self.disableInputControls();
    self.transitToState(ALL_MAP_STATES.SHOWING_MODAL_POPUP);
    safelyAddChild(self.widgetsAboveAllNode, toShowNode);
    setLocalZOrder(toShowNode, 10);
  },
  playersMatched: function playersMatched(players) {
    console.log("Calling `playersMatched`", players);

    var self = this;
    var findingPlayerScriptIns = self.findingPlayerNode.getComponent("FindingPlayer");
    findingPlayerScriptIns.updatePlayersInfo(players);
    window.setTimeout(function () {
      if (self.findingPlayerNode.parent) {
        self.findingPlayerNode.parent.removeChild(self.findingPlayerNode);
        self.transitToState(ALL_MAP_STATES.VISUAL);
        for (var i in players) {
          //更新在线玩家信息面板的信息
          var playerInfo = players[i];
          var playersScriptIns = self.playersInfoNode.getComponent("PlayersInfo");
          playersScriptIns.updateData(playerInfo);
        }
      }
      var countDownScriptIns = self.countdownToBeginGameNode.getComponent("CountdownToBeginGame");
      countDownScriptIns.setData();
      self.showPopupInCanvas(self.countdownToBeginGameNode);
      return;
    }, 2000);
  }
});

cc._RF.pop();