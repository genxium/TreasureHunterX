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
    canvasNode: {
      type: cc.Node,
      default: null
    },
    tiledAnimPrefab: {
      type: cc.Prefab,
      default: null
    },
    selfPlayerPrefab: {
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
    npcPlayerPrefab: {
      type: cc.Prefab,
      default: null
    },
    type2NpcPlayerPrefab: {
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
    selfPlayerIdLabel: {
      type: cc.Label,
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
    selfPlayerScoreLabel: {
      type: cc.Label,
      default: null
    },
    otherPlayerScoreIndicatorPrefab: {
      type: cc.Prefab,
      default: null
    }
  },

  _onPerUpsyncFrame: function _onPerUpsyncFrame() {
    var instance = this;
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
      y: parseFloat(instance.selfPlayerNode.y)
    };
    var wrapped = {
      msgId: Date.now(),
      act: "PlayerUpsyncCmd",
      data: upsyncFrameData
    };
    window.sendSafely(JSON.stringify(wrapped));
  },


  // LIFE-CYCLE CALLBACKS:
  onDestroy: function onDestroy() {
    var self = this;
    if (self.upsyncLoopInterval) {
      clearInterval(self.upsyncLoopInterval);
    }
    if (self.inputControlTimer) {
      clearInterval(self.inputControlTimer);
    }
  },
  popupSimplePressToGo: function popupSimplePressToGo(labelString) {
    var self = this;
    if (ALL_MAP_STATES.VISUAL != self.state) {
      return;
    }
    self.state = ALL_MAP_STATES.SHOWING_MODAL_POPUP;

    var canvasNode = self.canvasNode;
    var simplePressToGoDialogNode = cc.instantiate(self.simplePressToGoDialogPrefab);
    simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
    simplePressToGoDialogNode.setScale(1 / canvasNode.getScale());
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
    simplePressToGoDialogNode.setScale(1 / canvasNode.getScale());
    safelyAddChild(canvasNode, simplePressToGoDialogNode);
  },
  alertForGoingBackToLoginScene: function alertForGoingBackToLoginScene(labelString, mapIns, shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage) {
    var millisToGo = 3000;
    mapIns.popupSimplePressToGo(cc.js.formatStr("%s Will logout in %s seconds.", labelString, millisToGo / 1000));
    setTimeout(function () {
      mapIns.logout(false, shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage);
    }, millisToGo);
  },


  //onLoad
  onLoad: function onLoad() {
    var _this = this;

    var self = this;
    self.lastRoomDownsyncFrameId = 0;

    cc.director.getCollisionManager().enabled = true;
    cc.director.getCollisionManager().enabledDebugDraw = CC_DEBUG;
    self.selfPlayerNode = null;
    self.selfPlayerScriptIns = null;
    self.selfPlayerInfo = null;
    self.upsyncLoopInterval = null;

    var mapNode = self.node;
    var canvasNode = mapNode.parent;
    cc.director.getCollisionManager().enabled = true;
    cc.director.getCollisionManager().enabledDebugDraw = CC_DEBUG;

    self.battleState = ALL_BATTLE_STATES.WAITING;
    self.otherPlayerCachedDataDict = {};
    self.otherPlayerNodeDict = {};
    self.treasureInfoDict = {};
    self.treasureNodeDict = {};
    self.trapInfoDict = {};
    self.trapNodeDict = {};
    self.scoreInfoDict = {};
    self.confirmLogoutNode = cc.instantiate(self.confirmLogoutPrefab);
    self.confirmLogoutNode.getComponent("ConfirmLogout").mapNode = self.node;
    self.confirmLogoutNode.width = canvasNode.width;
    self.confirmLogoutNode.height = canvasNode.height;

    self.clientUpsyncFps = 20;
    self.upsyncLoopInterval = null;

    window.handleClientSessionCloseOrError = function () {
      self.alertForGoingBackToLoginScene("Client session closed unexpectedly!", self, true);
    };

    initPersistentSessionClient(function () {
      self.state = ALL_MAP_STATES.VISUAL;
      var tiledMapIns = self.node.getComponent(cc.TiledMap);
      self.selfPlayerInfo = JSON.parse(cc.sys.localStorage.selfPlayer);
      Object.assign(self.selfPlayerInfo, {
        id: self.selfPlayerInfo.playerId
      });
      _this._inputControlEnabled = false;
      self.setupInputControls();

      var boundaryObjs = tileCollisionManager.extractBoundaryObjects(self.node);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = boundaryObjs.frameAnimations[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var frameAnim = _step.value;

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

      self.barrierColliders = [];
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = boundaryObjs.barriers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var boundaryObj = _step2.value;

          var newBarrier = cc.instantiate(self.barrierPrefab);
          var newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
          newBarrier.setPosition(newBoundaryOffsetInMapNode);
          newBarrier.setAnchorPoint(cc.v2(0, 0));
          var newBarrierColliderIns = newBarrier.getComponent(cc.PolygonCollider);
          newBarrierColliderIns.points = [];
          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = boundaryObj[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var p = _step6.value;

              newBarrierColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
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

          self.barrierColliders.push(newBarrierColliderIns);
          self.node.addChild(newBarrier);
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

      var allLayers = tiledMapIns.getLayers();
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = allLayers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var layer = _step3.value;

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

      var allObjectGroups = tiledMapIns.getObjectGroups();
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = allObjectGroups[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var objectGroup = _step4.value;

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

      if (_this.joystickInputControllerNode.parent !== _this.node.parent.parent.getChildByName('JoystickContainer')) {
        _this.joystickInputControllerNode.parent = _this.node.parent.parent.getChildByName('JoystickContainer');
      }
      _this.joystickInputControllerNode.parent.width = _this.node.parent.width * 0.5;
      _this.joystickInputControllerNode.parent.height = _this.node.parent.height;
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = boundaryObjs.sheltersZReducer[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var _boundaryObj = _step5.value;

          var newShelter = cc.instantiate(self.shelterZReducerPrefab);
          var newBoundaryOffsetInMapNode = cc.v2(_boundaryObj[0].x, _boundaryObj[0].y);
          newShelter.setPosition(newBoundaryOffsetInMapNode);
          newShelter.setAnchorPoint(cc.v2(0, 0));
          var newShelterColliderIns = newShelter.getComponent(cc.PolygonCollider);
          newShelterColliderIns.points = [];
          var _iteratorNormalCompletion7 = true;
          var _didIteratorError7 = false;
          var _iteratorError7 = undefined;

          try {
            for (var _iterator7 = _boundaryObj[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
              var _p = _step7.value;

              newShelterColliderIns.points.push(_p.sub(newBoundaryOffsetInMapNode));
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

          self.node.addChild(newShelter);
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

      window.handleRoomDownsyncFrame = function (roomDownsyncFrame) {
        if (ALL_BATTLE_STATES.WAITING != self.battleState && ALL_BATTLE_STATES.IN_BATTLE != self.battleState && ALL_BATTLE_STATES.IN_SETTLEMENT != self.battleState) return;

        var frameId = roomDownsyncFrame.id;
        if (frameId <= self.lastRoomDownsyncFrameId) {
          // Log the obsolete frames?
          return;
        }
        if (roomDownsyncFrame.countdownNanos == -1) {
          self.onBattleStopped();
          return;
        }
        self.countdownLabel.string = parseInt(roomDownsyncFrame.countdownNanos / 1000000000).toString();
        var sentAt = roomDownsyncFrame.sentAt;
        var refFrameId = roomDownsyncFrame.refFrameId;
        var players = roomDownsyncFrame.players;
        var playerIdStrList = Object.keys(players);
        self.otherPlayerCachedDataDict = {};
        for (var i = 0; i < playerIdStrList.length; ++i) {
          var k = playerIdStrList[i];
          var playerId = parseInt(k);
          if (playerId == self.selfPlayerInfo.id) {
            var immediateSelfPlayerInfo = players[k];
            Object.assign(self.selfPlayerInfo, {
              x: immediateSelfPlayerInfo.x,
              y: immediateSelfPlayerInfo.y,
              speed: immediateSelfPlayerInfo.speed,
              battleState: immediateSelfPlayerInfo.battleState,
              score: immediateSelfPlayerInfo.score
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
        for (var _i = 0; _i < treasuresLocalIdStrList.length; ++_i) {
          var _k = treasuresLocalIdStrList[_i];
          var treasureLocalIdInBattle = parseInt(_k);
          var treasureInfo = treasures[_k];
          self.treasureInfoDict[treasureLocalIdInBattle] = treasureInfo;
        }

        //初始化trapInfo
        self.trapInfoDict = {};
        var traps = roomDownsyncFrame.traps;
        var trapsLocalIdStrList = Object.keys(traps);
        for (var _i2 = 0; _i2 < trapsLocalIdStrList.length; ++_i2) {
          var _k2 = trapsLocalIdStrList[_i2];
          var trapLocalIdInBattle = parseInt(_k2);
          var trapInfo = traps[_k2];
          self.trapInfoDict[trapLocalIdInBattle] = trapInfo;
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
        // TODO: Cope with FullFrame reconstruction by `refFrameId` and a cache of recent FullFrames.
        // TODO: Inject a NetworkDoctor as introduced in https://app.yinxiang.com/shard/s61/nl/13267014/5c575124-01db-419b-9c02-ec81f78c6ddc/.
      };
    });
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
    self.spawnSelfPlayer();
    self.upsyncLoopInterval = setInterval(self._onPerUpsyncFrame.bind(self), self.clientUpsyncFps);
    self.enableInputControls();
  },
  onBattleStopped: function onBattleStopped() {
    var self = this;
    self.selfPlayerScriptIns.scheduleNewDirection({
      dx: 0,
      dy: 0
    });
    self.disableInputControls();
    self.battleState = ALL_BATTLE_STATES.IN_SETTLEMENT;
    self.alertForGoingBackToLoginScene("Battle stopped!", self, false);
  },
  spawnSelfPlayer: function spawnSelfPlayer() {
    var instance = this;
    var newPlayerNode = cc.instantiate(instance.selfPlayerPrefab);
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
      self.selfPlayerIdLabel.string = self.selfPlayerInfo.id;
      var score = self.selfPlayerInfo.score ? self.selfPlayerInfo.score : 0;
      self.selfPlayerScoreLabel.string = score;
    }

    var toRemovePlayerNodeDict = {};
    Object.assign(toRemovePlayerNodeDict, self.otherPlayerNodeDict);

    var toRemoveTreasureNodeDict = {};
    Object.assign(toRemoveTreasureNodeDict, self.treasureNodeDict);

    var toRemoveTrapNodeDict = {};
    Object.assign(toRemoveTrapNodeDict, self.trapNodeDict);

    for (var k in self.otherPlayerCachedDataDict) {
      var playerId = parseInt(k);
      var cachedPlayerData = self.otherPlayerCachedDataDict[playerId];
      var newPos = cc.v2(cachedPlayerData.x, cachedPlayerData.y);
      //显示分数
      if (!self.scoreInfoDict[playerId]) {
        var scoreNode = cc.instantiate(self.otherPlayerScoreIndicatorPrefab);
        var debugInfoNode = canvasParentNode.getChildByName("DebugInfo");
        scoreNode.getChildByName("title").getComponent(cc.Label).string = "player" + cachedPlayerData.id + "'s score:";
        safelyAddChild(debugInfoNode, scoreNode);
        self.scoreInfoDict[playerId] = scoreNode;
      }
      var playerScore = !cachedPlayerData.score ? cachedPlayerData.score : 0;
      self.scoreInfoDict[playerId].getChildByName("OtherPlayerScoreLabel").getComponent(cc.Label).string = playerScore;
      var targetNode = self.otherPlayerNodeDict[playerId];
      if (!targetNode) {
        targetNode = cc.instantiate(self.selfPlayerPrefab);
        targetNode.getComponent("SelfPlayer").mapNode = mapNode;
        targetNode.getComponent("SelfPlayer").speed = cachedPlayerData.speed;
        self.otherPlayerNodeDict[playerId] = targetNode;
        safelyAddChild(mapNode, targetNode);
        targetNode.setPosition(newPos);
        setLocalZOrder(targetNode, 5);
      }

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
    for (var _k3 in self.trapInfoDict) {
      var trapLocalIdInBattle = parseInt(_k3);
      var trapInfo = self.trapInfoDict[trapLocalIdInBattle];
      var _newPos = cc.v2(trapInfo.pickupBoundary.anchor.x, trapInfo.pickupBoundary.anchor.y);
      var _targetNode = self.trapNodeDict[trapLocalIdInBattle];
      if (!_targetNode) {
        _targetNode = cc.instantiate(self.trapPrefab);
        self.trapNodeDict[trapLocalIdInBattle] = _targetNode;
        safelyAddChild(mapNode, _targetNode);
        _targetNode.setPosition(_newPos);
        setLocalZOrder(_targetNode, 5);
        //初始化trap的标记
        var pickupBoundary = trapInfo.pickupBoundary;
        var anchor = pickupBoundary.anchor;
        var newColliderIns = _targetNode.getComponent(cc.PolygonCollider);
        newColliderIns.points = [];
        var _iteratorNormalCompletion8 = true;
        var _didIteratorError8 = false;
        var _iteratorError8 = undefined;

        try {
          for (var _iterator8 = pickupBoundary.points[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var point = _step8.value;

            var p = cc.v2(parseFloat(point.x), parseFloat(point.y));
            newColliderIns.points.push(p);
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
      }

      if (null != toRemoveTrapNodeDict[trapLocalIdInBattle]) {
        delete toRemoveTrapNodeDict[trapLocalIdInBattle];
      }
      if (0 < _targetNode.getNumberOfRunningActions()) {
        // A significant trick to smooth the position sync performance!
        continue;
      }
      var _oldPos = cc.v2(_targetNode.x, _targetNode.y);
      var _toMoveByVec = _newPos.sub(_oldPos);
      var durationSeconds = dt; // Using `dt` temporarily!
      _targetNode.runAction(cc.moveTo(durationSeconds, _newPos));
    }

    // 更新宝物显示 
    for (var _k4 in self.treasureInfoDict) {
      var treasureLocalIdInBattle = parseInt(_k4);
      var treasureInfo = self.treasureInfoDict[treasureLocalIdInBattle];
      var _newPos2 = cc.v2(treasureInfo.pickupBoundary.anchor.x, treasureInfo.pickupBoundary.anchor.y);
      var _targetNode2 = self.treasureNodeDict[treasureLocalIdInBattle];
      if (!_targetNode2) {
        _targetNode2 = cc.instantiate(self.treasurePrefab);
        self.treasureNodeDict[treasureLocalIdInBattle] = _targetNode2;
        safelyAddChild(mapNode, _targetNode2);
        _targetNode2.setPosition(_newPos2);
        setLocalZOrder(_targetNode2, 5);
        //初始化treasure的标记
        var _pickupBoundary = treasureInfo.pickupBoundary;
        var _anchor = _pickupBoundary.anchor;
        var _newColliderIns = _targetNode2.getComponent(cc.PolygonCollider);
        _newColliderIns.points = [];
        var _iteratorNormalCompletion9 = true;
        var _didIteratorError9 = false;
        var _iteratorError9 = undefined;

        try {
          for (var _iterator9 = _pickupBoundary.points[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
            var _point = _step9.value;

            var _p2 = cc.v2(parseFloat(_point.x), parseFloat(_point.y));
            _newColliderIns.points.push(_p2);
          }
        } catch (err) {
          _didIteratorError9 = true;
          _iteratorError9 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion9 && _iterator9.return) {
              _iterator9.return();
            }
          } finally {
            if (_didIteratorError9) {
              throw _iteratorError9;
            }
          }
        }
      }

      if (null != toRemoveTreasureNodeDict[treasureLocalIdInBattle]) {
        delete toRemoveTreasureNodeDict[treasureLocalIdInBattle];
      }
      if (0 < _targetNode2.getNumberOfRunningActions()) {
        // A significant trick to smooth the position sync performance!
        continue;
      }
      var _oldPos2 = cc.v2(_targetNode2.x, _targetNode2.y);
      var _toMoveByVec2 = _newPos2.sub(_oldPos2);
      var _durationSeconds = dt; // Using `dt` temporarily!
      _targetNode2.runAction(cc.moveTo(_durationSeconds, _newPos2));
    }

    // Coping with removed players.
    for (var _k5 in toRemovePlayerNodeDict) {
      var _playerId = parseInt(_k5);
      toRemovePlayerNodeDict[_k5].parent.removeChild(toRemovePlayerNodeDict[_k5]);
      delete self.otherPlayerNodeDict[_playerId];
    }

    // Coping with removed treasures.
    for (var _k6 in toRemoveTreasureNodeDict) {
      var _treasureLocalIdInBattle = parseInt(_k6);
      toRemoveTreasureNodeDict[_k6].parent.removeChild(toRemoveTreasureNodeDict[_k6]);
      delete self.treasureNodeDict[_treasureLocalIdInBattle];
    }

    // Coping with removed traps.
    for (var _k7 in toRemoveTrapNodeDict) {
      var _trapLocalIdInBattle = parseInt(_k7);
      toRemoveTrapNodeDict[_k7].parent.removeChild(toRemoveTrapNodeDict[_k7]);
      delete self.trapNodeDict[_trapLocalIdInBattle];
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
    self.disableInputControls();
    self.transitToState(ALL_MAP_STATES.SHOWING_MODAL_POPUP);
    var canvasNode = self.canvasNode;
    self.confirmLogoutNode.setScale(1 / canvasNode.getScale());
    safelyAddChild(canvasNode, self.confirmLogoutNode);
    setLocalZOrder(self.confirmLogoutNode, 10);
  },
  onLogoutConfirmationDismissed: function onLogoutConfirmationDismissed() {
    var self = this;
    self.transitToState(ALL_MAP_STATES.VISUAL);
    var canvasNode = self.canvasNode;
    canvasNode.removeChild(self.confirmLogoutNode);
    self.enableInputControls();
  }
});

cc._RF.pop();