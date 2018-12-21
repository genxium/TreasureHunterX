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
    treasurePrefab: {
      type: cc.Prefab,
      default: null
    },
    trapPrefab: {
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
    }

  },

  _generateNewFullFrame: function _generateNewFullFrame(refFullFrame, diffFrame) {
    var newFullFrame = {
      id: diffFrame.id,
      treasures: refFullFrame.treasures,
      traps: refFullFrame.traps,
      bullets: refFullFrame.bullets,
      players: refFullFrame.players
    };

    var players = diffFrame.players;
    var playersLocalIdStrList = Object.keys(players);
    for (var i = 0; i < playersLocalIdStrList.length; ++i) {
      var k = playersLocalIdStrList[i];
      var playerId = parseInt(k);
      if (true == diffFrame.players[playerId].removed) {
        // cc.log(`Player id == ${playerId} is removed.`);
        delete newFullFrame.players[playerId];
      } else {
        newFullFrame.players[playerId] = diffFrame.players[playerId];
      }
    }

    var treasures = diffFrame.treasures;
    var treasuresLocalIdStrList = Object.keys(treasures);
    for (var _i = 0; _i < treasuresLocalIdStrList.length; ++_i) {
      var _k = treasuresLocalIdStrList[_i];
      var treasureLocalIdInBattle = parseInt(_k);
      if (true == diffFrame.treasures[treasureLocalIdInBattle].removed) {
        // cc.log(`Treasure with localIdInBattle == ${treasureLocalIdInBattle} is removed.`);
        delete newFullFrame.treasures[treasureLocalIdInBattle];
      } else {
        newFullFrame.treasures[treasureLocalIdInBattle] = diffFrame.treasures[treasureLocalIdInBattle];
      }
    }

    var traps = diffFrame.traps;
    var trapsLocalIdStrList = Object.keys(traps);
    for (var _i2 = 0; _i2 < trapsLocalIdStrList.length; ++_i2) {
      var _k2 = trapsLocalIdStrList[_i2];
      var trapLocalIdInBattle = parseInt(_k2);
      if (true == diffFrame.traps[trapLocalIdInBattle].removed) {
        // cc.log(`Trap with localIdInBattle == ${trapLocalIdInBattle} is removed.`);
        delete newFullFrame.traps[trapLocalIdInBattle];
      } else {
        newFullFrame.traps[trapLocalIdInBattle] = diffFrame.traps[trapLocalIdInBattle];
      }
    }

    var bullets = diffFrame.bullets;
    var bulletsLocalIdStrList = Object.keys(bullets);
    for (var _i3 = 0; _i3 < bulletsLocalIdStrList.length; ++_i3) {
      var _k3 = bulletsLocalIdStrList[_i3];
      var bulletLocalIdInBattle = parseInt(_k3);
      if (true == diffFrame.bullets[bulletLocalIdInBattle].removed) {
        // cc.log(`Bullet with localIdInBattle == ${bulletLocalIdInBattle} is removed.`);
        delete newFullFrame.bullets[bulletLocalIdInBattle];
      } else {
        newFullFrame.bullets[bulletLocalIdInBattle] = diffFrame.bullets[bulletLocalIdInBattle];
      }
    }

    return newFullFrame;
  },

  _dumpToFullFrameCache: function _dumpToFullFrameCache(fullFrame) {
    var self = this;
    while (self.recentFrameCacheCurrentSize >= self.recentFrameCacheMaxCount) {
      // Trick here: never evict the "Zero-th Frame" for resyncing!
      var toDelFrameId = Object.keys(self.recentFrameCache)[1];
      // cc.log("toDelFrameId is " + toDelFrameId + ".");
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
  onDestroy: function onDestroy() {
    var self = this;
    if (self.upsyncLoopInterval) {
      clearInterval(self.upsyncLoopInterval);
    }
    if (self.inputControlTimer) {
      clearInterval(self.inputControlTimer);
    }
  },
  _lazilyTriggerResync: function _lazilyTriggerResync() {
    if (true == this.resyncing) return;
    this.resyncing = false;
    if (ALL_MAP_STATES.SHOWING_MODAL_POPUP != this.state) {
      this.popupSimplePressToGo("Resyncing your battle, please wait...");
    }
  },
  _onResyncCompleted: function _onResyncCompleted() {
    if (false == this.resyncing) return;
    cc.log("_onResyncCompleted");
    this.resyncing = true;
  },
  popupSimplePressToGo: function popupSimplePressToGo(labelString) {
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
    self.transitToState(ALL_MAP_STATES.SHOWING_MODAL_POPUP);
    safelyAddChild(self.widgetsAboveAllNode, simplePressToGoDialogNode);
    setLocalZOrder(simplePressToGoDialogNode, 20);
  },
  alertForGoingBackToLoginScene: function alertForGoingBackToLoginScene(labelString, mapIns, shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage) {
    var millisToGo = 3000;
    mapIns.popupSimplePressToGo(cc.js.formatStr("%s will logout in %s seconds.", labelString, millisToGo / 1000));
    setTimeout(function () {
      mapIns.logout(false, shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage);
    }, millisToGo);
  },
  onLoad: function onLoad() {
    var self = this;
    self.resyncing = false;
    self.lastRoomDownsyncFrameId = 0;

    self.recentFrameCache = {};
    self.recentFrameCacheCurrentSize = 0;
    self.recentFrameCacheMaxCount = 2048;

    var mapNode = self.node;
    var canvasNode = mapNode.parent;
    cc.director.getCollisionManager().enabled = true;
    cc.director.getCollisionManager().enabledDebugDraw = CC_DEBUG;

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

    self.selfPlayerNode = null;
    self.selfPlayerScriptIns = null;
    self.selfPlayerInfo = null;
    self.upsyncLoopInterval = null;
    self.transitToState(ALL_MAP_STATES.VISUAL);

    self.battleState = ALL_BATTLE_STATES.WAITING;
    self.otherPlayerCachedDataDict = {};
    self.otherPlayerNodeDict = {};
    self.treasureInfoDict = {};
    self.treasureNodeDict = {};
    self.trapInfoDict = {};
    self.trapBulletInfoDict = {};
    self.trapBulletNodeDict = {};
    self.trapNodeDict = {};

    /** init requeired prefab started */
    self.confirmLogoutNode = cc.instantiate(self.confirmLogoutPrefab);
    self.confirmLogoutNode.getComponent("ConfirmLogout").mapNode = self.node;

    self.resultPanelNode = cc.instantiate(self.resultPanelPrefab);

    self.gameRuleNode = cc.instantiate(self.gameRulePrefab);
    self.gameRuleScriptIns = self.gameRuleNode.getComponent("GameRule");
    self.gameRuleScriptIns.mapNode = self.node;
    self.showPopopInCanvas(self.gameRuleNode);

    self.findingPlayerNode = cc.instantiate(self.findingPlayerPrefab);

    self.playersInfoNode = cc.instantiate(self.playersInfoPrefab);
    safelyAddChild(self.widgetsAboveAllNode, self.playersInfoNode);

    self.countdownToBeginGameNode = cc.instantiate(self.countdownToBeginGamePrefab);

    self.playersNode = {};
    var player1Node = cc.instantiate(self.player1Prefab);
    var player2Node = cc.instantiate(self.player2Prefab);
    Object.assign(self.playersNode, { 1: player1Node });
    Object.assign(self.playersNode, { 2: player2Node });
    /** init requeired prefab ended */

    self.clientUpsyncFps = 20;
    self.upsyncLoopInterval = null;

    window.reconnectWSWithoutRoomId = function () {
      var _this = this;

      return new Promise(function (resolve, reject) {
        if (window.clientSessionPingInterval) {
          clearInterval(clientSessionPingInterval);
        }
        window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
        return resolve();
      }).then(function () {
        _this.initPersistentSessionClient(_this.initAfterWSConncted);
      });
    };

    window.handleClientSessionCloseOrError = function () {
      if (!self.battleState) self.alertForGoingBackToLoginScene("Client session closed unexpectedly!", self, true);
    };

    self.initAfterWSConncted = function () {
      self.transitToState(ALL_MAP_STATES.VISUAL);
      var tiledMapIns = self.node.getComponent(cc.TiledMap);
      self.selfPlayerInfo = JSON.parse(cc.sys.localStorage.selfPlayer);
      Object.assign(self.selfPlayerInfo, {
        id: self.selfPlayerInfo.playerId
      });
      self._inputControlEnabled = false;
      self.setupInputControls();

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

      window.handleRoomDownsyncFrame = function (diffFrame) {
        if (ALL_BATTLE_STATES.WAITING != self.battleState && ALL_BATTLE_STATES.IN_BATTLE != self.battleState && ALL_BATTLE_STATES.IN_SETTLEMENT != self.battleState) return;
        var refFrameId = diffFrame.refFrameId;
        if (-99 == refFrameId) {
          if (self.findingPlayerNode.parent) {
            self.findingPlayerNode.parent.removeChild(self.findingPlayerNode);
            self.transitToState(ALL_MAP_STATES.VISUAL);
            for (var i in diffFrame.players) {
              //更新在线玩家信息面板的信息
              var playerInfo = diffFrame.players[i];
              var playersScriptIns = self.playersInfoNode.getComponent("PlayersInfo");
              playersScriptIns.updateData(playerInfo);
            }
          }
          self.showPopopInCanvas(self.countdownToBeginGameNode);
          return;
        } else if (-98 == refFrameId) {
          self.showPopopInCanvas(self.findingPlayerNode);
          return;
        }
        var frameId = diffFrame.id;
        if (frameId <= self.lastRoomDownsyncFrameId) {
          // Log the obsolete frames?
          return;
        }
        var isInitiatingFrame = 0 > self.recentFrameCacheCurrentSize || 0 == refFrameId;
        /*
        if (frameId % 300 == 0) {
          // WARNING: For testing only!
          if (0 < frameId) {
            self._lazilyTriggerResync(); 
          }
          cc.log(`${JSON.stringify(diffFrame)}`);
        }
        */
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
        if (countdownNanos < 0) countdownNanos = 0;
        var countdownSeconds = parseInt(countdownNanos / 1000000000);
        if (isNaN(countdownSeconds)) {
          cc.log("countdownSeconds is NaN for countdownNanos == " + countdownNanos + ".");
        }
        self.countdownLabel.string = countdownSeconds;
        var roomDownsyncFrame = isInitiatingFrame || !self.useDiffFrameAlgo ? diffFrame : self._generateNewFullFrame(cachedFullFrame, diffFrame);
        if (countdownNanos <= 0) {
          self.onBattleStopped(roomDownsyncFrame.players);
          return;
        }
        self._dumpToFullFrameCache(roomDownsyncFrame);
        var sentAt = roomDownsyncFrame.sentAt;
        var players = roomDownsyncFrame.players;
        var playerIdStrList = Object.keys(players);
        self.otherPlayerCachedDataDict = {};
        for (var _i4 = 0; _i4 < playerIdStrList.length; ++_i4) {
          var k = playerIdStrList[_i4];
          var playerId = parseInt(k);
          if (playerId == self.selfPlayerInfo.id) {
            var immediateSelfPlayerInfo = players[k];
            Object.assign(self.selfPlayerInfo, {
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
        self.treasureInfoDict = {};
        var treasures = roomDownsyncFrame.treasures;
        var treasuresLocalIdStrList = Object.keys(treasures);
        for (var _i5 = 0; _i5 < treasuresLocalIdStrList.length; ++_i5) {
          var _k4 = treasuresLocalIdStrList[_i5];
          var treasureLocalIdInBattle = parseInt(_k4);
          var treasureInfo = treasures[_k4];
          self.treasureInfoDict[treasureLocalIdInBattle] = treasureInfo;
        }

        self.trapInfoDict = {};
        var traps = roomDownsyncFrame.traps;
        var trapsLocalIdStrList = Object.keys(traps);
        for (var _i6 = 0; _i6 < trapsLocalIdStrList.length; ++_i6) {
          var _k5 = trapsLocalIdStrList[_i6];
          var trapLocalIdInBattle = parseInt(_k5);
          var trapInfo = traps[_k5];
          self.trapInfoDict[trapLocalIdInBattle] = trapInfo;
        }

        self.trapBulletInfoDict = {};
        var bullets = roomDownsyncFrame.bullets;
        var bulletsLocalIdStrList = Object.keys(bullets);
        for (var _i7 = 0; _i7 < bulletsLocalIdStrList.length; ++_i7) {
          var _k6 = bulletsLocalIdStrList[_i7];
          var bulletLocalIdInBattle = parseInt(_k6);
          var bulletInfo = bullets[_k6];
          self.trapBulletInfoDict[bulletLocalIdInBattle] = bulletInfo;
        }

        if (0 == self.lastRoomDownsyncFrameId) {
          self.battleState = ALL_BATTLE_STATES.IN_BATTLE;
          if (1 == frameId) {
            // No need to prompt upon rejoined.
            self.popupSimplePressToGo("Battle started!");
          }
          self.onBattleStarted();
        }
        self.lastRoomDownsyncFrameId = frameId;
        // TODO: Inject a NetworkDoctor as introduced in https://app.yinxiang.com/shard/s61/nl/13267014/5c575124-01db-419b-9c02-ec81f78c6ddc/.
      };
    };
  },
  setupInputControls: function setupInputControls() {
    var instance = this;
    var mapNode = instance.node;
    var canvasNode = mapNode.parent;
    var joystickInputControllerScriptIns = canvasNode.getComponent("TouchEventsManager");
    var inputControlPollerMillis = 1000 / joystickInputControllerScriptIns.pollerFps;

    var ctrl = joystickInputControllerScriptIns;
    instance.ctrl = ctrl;

    instance.inputControlTimer = setInterval(function () {
      if (false == instance._inputControlEnabled) return;
      instance.selfPlayerScriptIns.activeDirection = ctrl.activeDirection;
    }, inputControlPollerMillis);
  },
  enableInputControls: function enableInputControls() {
    this._inputControlEnabled = true;
  },
  disableInputControls: function disableInputControls() {
    this._inputControlEnabled = false;
  },
  onBattleStarted: function onBattleStarted() {
    var self = this;
    var canvasNode = self.canvasNode;
    self.spawnSelfPlayer();
    self.upsyncLoopInterval = setInterval(self._onPerUpsyncFrame.bind(self), self.clientUpsyncFps);
    self.transitToState(ALL_MAP_STATES.VISUAL);
    self.enableInputControls();
    if (self.countdownToBeginGameNode.parent) {
      self.countdownToBeginGameNode.parent.removeChild(self.countdownToBeginGameNode);
      self.transitToState(ALL_MAP_STATES.VISUAL);
    }
  },
  onBattleStopped: function onBattleStopped(players) {
    var self = this;
    var canvasNode = self.canvasNode;
    var resultPanelNode = self.resultPanelNode;
    var resultPanelScriptIns = resultPanelNode.getComponent("ResultPanel");
    resultPanelScriptIns.showPlayerInfo(players);
    // Such that it doesn't execute "update(dt)" anymore. 
    self.selfPlayerNode.active = false;
    self.battleState = ALL_BATTLE_STATES.IN_SETTLEMENT;
    self.showPopopInCanvas(resultPanelNode);
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

    setLocalZOrder(newPlayerNode, 5);
    instance.selfPlayerNode = newPlayerNode;
    instance.selfPlayerScriptIns = newPlayerNode.getComponent("SelfPlayer");
  },
  update: function update(dt) {
    var self = this;
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

    var toRemovePlayerNodeDict = {};
    Object.assign(toRemovePlayerNodeDict, self.otherPlayerNodeDict);

    var toRemoveTreasureNodeDict = {};
    Object.assign(toRemoveTreasureNodeDict, self.treasureNodeDict);

    var toRemoveTrapNodeDict = {};
    Object.assign(toRemoveTrapNodeDict, self.trapNodeDict);

    var toRemoveBulletNodeDict = {};
    Object.assign(toRemoveBulletNodeDict, self.trapBulletNodeDict);

    for (var k in self.otherPlayerCachedDataDict) {
      var playerId = parseInt(k);
      var cachedPlayerData = self.otherPlayerCachedDataDict[playerId];
      var newPos = cc.v2(cachedPlayerData.x, cachedPlayerData.y);
      //更新信息
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

      if (null != toRemovePlayerNodeDict[playerId]) {
        delete toRemovePlayerNodeDict[playerId];
      }
      if (0 != cachedPlayerData.dir.dx || 0 != cachedPlayerData.dir.dy) {
        var newScheduledDirection = self.ctrl.discretizeDirection(cachedPlayerData.dir.dx, cachedPlayerData.dir.dy, self.ctrl.joyStickEps);
        targetNode.getComponent("SelfPlayer").scheduleNewDirection(newScheduledDirection, false /* DON'T interrupt playing anim. */);
      }
      var oldPos = cc.v2(targetNode.x, targetNode.y);
      var toMoveByVec = newPos.sub(oldPos);
      var toMoveByVecMag = toMoveByVec.mag();
      var toTeleportDisThreshold = cachedPlayerData.speed * dt * 100;
      var notToMoveDisThreshold = cachedPlayerData.speed * dt * 0.5;
      if (toMoveByVecMag < notToMoveDisThreshold) {
        targetNode.getComponent("SelfPlayer").activeDirection = {
          dx: 0,
          dy: 0
        };
      } else {
        if (toMoveByVecMag >= toTeleportDisThreshold) {
          cc.log("Player " + cachedPlayerData.id + " is teleporting! Having toMoveByVecMag == " + toMoveByVecMag + ", toTeleportDisThreshold == " + toTeleportDisThreshold);
          targetNode.getComponent("SelfPlayer").activeDirection = {
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
          targetNode.getComponent("SelfPlayer").activeDirection = normalizedDir;
        }
      }
    }

    // 更新陷阱显示 
    for (var _k7 in self.trapInfoDict) {
      var trapLocalIdInBattle = parseInt(_k7);
      var trapInfo = self.trapInfoDict[trapLocalIdInBattle];
      var _newPos = cc.v2(trapInfo.x, trapInfo.y);
      var _targetNode = self.trapNodeDict[trapLocalIdInBattle];
      if (!_targetNode) {
        _targetNode = cc.instantiate(self.trapPrefab);
        self.trapNodeDict[trapLocalIdInBattle] = _targetNode;
        safelyAddChild(mapNode, _targetNode);
        _targetNode.setPosition(_newPos);
        setLocalZOrder(_targetNode, 5);
        /*
        //初始化trap的标记
        const pickupBoundary = trapInfo.pickupBoundary;
        const anchor = pickupBoundary.anchor; 
        const newColliderIns = targetNode.getComponent(cc.PolygonCollider);
        newColliderIns.points = [];
        for (let point of pickupBoundary.points) {
          const p = cc.v2(parseFloat(point.x), parseFloat(point.y));
          newColliderIns.points.push(p);
        }
        */
      }
      if (null != toRemoveTrapNodeDict[trapLocalIdInBattle]) {
        delete toRemoveTrapNodeDict[trapLocalIdInBattle];
      }
    }

    // 更新bullet显示 
    for (var _k8 in self.trapBulletInfoDict) {
      var bulletLocalIdInBattle = parseInt(_k8);
      var bulletInfo = self.trapBulletInfoDict[bulletLocalIdInBattle];
      var _newPos2 = cc.v2(bulletInfo.x, bulletInfo.y);
      var _targetNode2 = self.trapBulletNodeDict[bulletLocalIdInBattle];
      if (!_targetNode2) {
        _targetNode2 = cc.instantiate(self.trapBulletPrefab);
        self.trapBulletNodeDict[bulletLocalIdInBattle] = _targetNode2;
        safelyAddChild(mapNode, _targetNode2);
        _targetNode2.setPosition(_newPos2);
        setLocalZOrder(_targetNode2, 5);
      } else {
        _targetNode2.setPosition(_newPos2);
      }
      if (null != toRemoveBulletNodeDict[bulletLocalIdInBattle]) {
        delete toRemoveBulletNodeDict[bulletLocalIdInBattle];
      }

      if (0 < _targetNode2.getNumberOfRunningActions()) {
        // A significant trick to smooth the position sync performance!
        continue;
      }
      var _oldPos = cc.v2(_targetNode2.x, _targetNode2.y);
      var _toMoveByVec = _newPos2.sub(_oldPos);
      var durationSeconds = dt; // Using `dt` temporarily!
      _targetNode2.runAction(cc.moveTo(durationSeconds, _newPos2));
    }

    // 更新宝物显示 
    for (var _k9 in self.treasureInfoDict) {
      var treasureLocalIdInBattle = parseInt(_k9);
      var treasureInfo = self.treasureInfoDict[treasureLocalIdInBattle];
      var _newPos3 = cc.v2(treasureInfo.x, treasureInfo.y);
      var _targetNode3 = self.treasureNodeDict[treasureLocalIdInBattle];
      if (!_targetNode3) {
        _targetNode3 = cc.instantiate(self.treasurePrefab);
        var treasureNodeScriptIns = _targetNode3.getComponent("Treasure");
        treasureNodeScriptIns.setData(treasureInfo);
        self.treasureNodeDict[treasureLocalIdInBattle] = _targetNode3;
        safelyAddChild(mapNode, _targetNode3);
        _targetNode3.setPosition(_newPos3);
        setLocalZOrder(_targetNode3, 5);

        /* 
        //初始化treasure的标记
        const pickupBoundary = treasureInfo.pickupBoundary;
        const anchor = pickupBoundary.anchor; 
        const newColliderIns = targetNode.getComponent(cc.PolygonCollider);
        newColliderIns.points = [];
        for (let point of pickupBoundary.points) {
          const p = cc.v2(parseFloat(point.x), parseFloat(point.y));
          newColliderIns.points.push(p);
        }
        */
      }

      if (null != toRemoveTreasureNodeDict[treasureLocalIdInBattle]) {
        delete toRemoveTreasureNodeDict[treasureLocalIdInBattle];
      }
      if (0 < _targetNode3.getNumberOfRunningActions()) {
        // A significant trick to smooth the position sync performance!
        continue;
      }
      var _oldPos2 = cc.v2(_targetNode3.x, _targetNode3.y);
      var _toMoveByVec2 = _newPos3.sub(_oldPos2);
      var _durationSeconds = dt; // Using `dt` temporarily!
      _targetNode3.runAction(cc.moveTo(_durationSeconds, _newPos3));
    }

    // Coping with removed players.
    for (var _k10 in toRemovePlayerNodeDict) {
      var _playerId = parseInt(_k10);
      toRemovePlayerNodeDict[_k10].parent.removeChild(toRemovePlayerNodeDict[_k10]);
      delete self.otherPlayerNodeDict[_playerId];
    }

    // Coping with removed treasures.
    for (var _k11 in toRemoveTreasureNodeDict) {
      var _treasureLocalIdInBattle = parseInt(_k11);
      var treasureScriptIns = toRemoveTreasureNodeDict[_k11].getComponent("Treasure");
      treasureScriptIns.playPickedUpAnimAndDestroy();
      delete self.treasureNodeDict[_treasureLocalIdInBattle];
    }

    // Coping with removed traps.
    for (var _k12 in toRemoveTrapNodeDict) {
      var _trapLocalIdInBattle = parseInt(_k12);
      toRemoveTrapNodeDict[_k12].parent.removeChild(toRemoveTrapNodeDict[_k12]);
      delete self.trapNodeDict[_trapLocalIdInBattle];
    }

    // Coping with removed bullets.
    for (var _k13 in toRemoveBulletNodeDict) {
      var _bulletLocalIdInBattle = parseInt(_k13);
      toRemoveBulletNodeDict[_k13].parent.removeChild(toRemoveBulletNodeDict[_k13]);
      delete self.trapBulletNodeDict[_bulletLocalIdInBattle];
    }
  },
  transitToState: function transitToState(s) {
    var self = this;
    self.state = s;
  },
  logout: function logout(byClick /* The case where this param is "true" will be triggered within `ConfirmLogout.js`.*/, shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage) {
    var localClearance = function localClearance() {
      if (byClick) {
        /**
        * WARNING: We MUST distinguish `byClick`, otherwise the `window.clientSession.onclose(event)` could be confused by local events!
        */
        window.closeWSConnection();
      }
      if (true != shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage) {
        window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
      }
      cc.sys.localStorage.removeItem('selfPlayer');
      cc.director.loadScene('login');
    };

    var self = this;
    if (null != cc.sys.localStorage.selfPlayer) {
      var selfPlayer = JSON.parse(cc.sys.localStorage.selfPlayer);
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
              cc.log("Logout failed: " + res + ".");
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
    self.showPopopInCanvas(self.confirmLogoutNode);
  },
  onLogoutConfirmationDismissed: function onLogoutConfirmationDismissed() {
    var self = this;
    self.transitToState(ALL_MAP_STATES.VISUAL);
    var canvasNode = self.canvasNode;
    canvasNode.removeChild(self.confirmLogoutNode);
    self.enableInputControls();
  },
  initWSConnection: function initWSConnection(evt, cb) {
    var self = this;
    if (cb) {
      cb();
    }
    initPersistentSessionClient(self.initAfterWSConncted);
  },
  showPopopInCanvas: function showPopopInCanvas(toShowNode) {
    var self = this;
    self.disableInputControls();
    self.transitToState(ALL_MAP_STATES.SHOWING_MODAL_POPUP);
    safelyAddChild(self.widgetsAboveAllNode, toShowNode);
    setLocalZOrder(toShowNode, 10);
  }
});

cc._RF.pop();