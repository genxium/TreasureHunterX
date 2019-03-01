const i18n = require('LanguageData');
i18n.init(window.language); // languageID should be equal to the one we input in New Language ID input field

window.ALL_MAP_STATES = {
  VISUAL: 0, // For free dragging & zooming.
  EDITING_BELONGING: 1,
  SHOWING_MODAL_POPUP: 2,
};

window.ALL_BATTLE_STATES = {
  WAITING: 0,
  IN_BATTLE: 1,
  IN_SETTLEMENT: 2,
  IN_DISMISSAL: 3,
};

cc.Class({
  extends: cc.Component,

  properties: {
    useDiffFrameAlgo: {
      default: true
    },
    canvasNode: {
      type: cc.Node,
      default: null,
    },
    tiledAnimPrefab: {
      type: cc.Prefab,
      default: null,
    },
    player1Prefab: {
      type: cc.Prefab,
      default: null,
    },
    player2Prefab: {
      type: cc.Prefab,
      default: null,
    },
    pumpkinPrefab: {
      type: cc.Prefab,
      default: null,
    },
    treasurePrefab: {
      type: cc.Prefab,
      default: null,
    },
    trapPrefab: {
      type: cc.Prefab,
      default: null,
    },
    acceleratorPrefab: {
      type: cc.Prefab,
      default: null,
    },
    barrierPrefab: {
      type: cc.Prefab,
      default: null,
    },
    shelterPrefab: {
      type: cc.Prefab,
      default: null,
    },
    shelterZReducerPrefab: {
      type: cc.Prefab,
      default: null,
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

  },

  _generateNewFullFrame: function(refFullFrame, diffFrame) {
    let newFullFrame = {
      id: diffFrame.id,
      treasures: refFullFrame.treasures,
      traps: refFullFrame.traps,
      bullets: refFullFrame.bullets,
      players: refFullFrame.players,
      speedShoes: refFullFrame.speedShoes,
      pumpkin: refFullFrame.pumpkin,
    };
    const players = diffFrame.players;
    const playersLocalIdStrList = Object.keys(players);
    for (let i = 0; i < playersLocalIdStrList.length; ++i) {
      const k = playersLocalIdStrList[i];
      const playerId = parseInt(k);
      if (true == diffFrame.players[playerId].removed) {
        // cc.log(`Player id == ${playerId} is removed.`);
        delete newFullFrame.players[playerId];
      } else {
        newFullFrame.players[playerId] = diffFrame.players[playerId];
      }
    }

    const pumpkin = diffFrame.pumpkin;
    const pumpkinsLocalIdStrList = Object.keys(pumpkin);
    for (let i = 0; i < pumpkinsLocalIdStrList.length; ++i) {
      const k = pumpkinsLocalIdStrList[i];
      const pumpkinLocalIdInBattle = parseInt(k);
      if (true == diffFrame.pumpkin[pumpkinLocalIdInBattle].removed) {
        delete newFullFrame.pumpkin[pumpkinLocalIdInBattle];
      } else {
        newFullFrame.pumpkin[pumpkinLocalIdInBattle] = diffFrame.pumpkin[pumpkinLocalIdInBattle];
      }
    }

    const treasures = diffFrame.treasures;
    const treasuresLocalIdStrList = Object.keys(treasures);
    for (let i = 0; i < treasuresLocalIdStrList.length; ++i) {
      const k = treasuresLocalIdStrList[i];
      const treasureLocalIdInBattle = parseInt(k);
      if (true == diffFrame.treasures[treasureLocalIdInBattle].removed) {
        // cc.log(`Treasure with localIdInBattle == ${treasureLocalIdInBattle} is removed.`);
        delete newFullFrame.treasures[treasureLocalIdInBattle];
      } else {
        newFullFrame.treasures[treasureLocalIdInBattle] = diffFrame.treasures[treasureLocalIdInBattle];
      }
    }

    const speedShoes = diffFrame.speedShoes;
    const speedShoesLocalIdStrList = Object.keys(speedShoes);
    for (let i = 0; i < speedShoesLocalIdStrList.length; ++i) {
      const k = speedShoesLocalIdStrList[i];
      const speedShoesLocalIdInBattle = parseInt(k);
      if (true == diffFrame.speedShoes[speedShoesLocalIdInBattle].removed) {
        // cc.log(`Treasure with localIdInBattle == ${treasureLocalIdInBattle} is removed.`);
        delete newFullFrame.speedShoes[speedShoesLocalIdInBattle];
      } else {
        newFullFrame.speedShoes[speedShoesLocalIdInBattle] = diffFrame.speedShoes[speedShoesLocalIdInBattle];
      }
    }

    const traps = diffFrame.traps;
    const trapsLocalIdStrList = Object.keys(traps);
    for (let i = 0; i < trapsLocalIdStrList.length; ++i) {
      const k = trapsLocalIdStrList[i];
      const trapLocalIdInBattle = parseInt(k);
      if (true == diffFrame.traps[trapLocalIdInBattle].removed) {
        // cc.log(`Trap with localIdInBattle == ${trapLocalIdInBattle} is removed.`);
        delete newFullFrame.traps[trapLocalIdInBattle];
      } else {
        newFullFrame.traps[trapLocalIdInBattle] = diffFrame.traps[trapLocalIdInBattle];
      }
    }

    const bullets = diffFrame.bullets;
    const bulletsLocalIdStrList = Object.keys(bullets);
    for (let i = 0; i < bulletsLocalIdStrList.length; ++i) {
      const k = bulletsLocalIdStrList[i];
      const bulletLocalIdInBattle = parseInt(k);
      if (true == diffFrame.bullets[bulletLocalIdInBattle].removed) {
        cc.log(`Bullet with localIdInBattle == ${bulletLocalIdInBattle} is removed.`);
        delete newFullFrame.bullets[bulletLocalIdInBattle];
      } else {
        newFullFrame.bullets[bulletLocalIdInBattle] = diffFrame.bullets[bulletLocalIdInBattle];
      }
    }

    const accs = diffFrame.speedShoes;
    const accsLocalIdStrList = Object.keys(accs);
    for (let i = 0; i < accsLocalIdStrList.length; ++i) {
      const k = accsLocalIdStrList[i];
      const accLocalIdInBattle = parseInt(k);
      if (true == diffFrame.speedShoes[accLocalIdInBattle].removed) {
        delete newFullFrame.speedShoes[accLocalIdInBattle];
      } else {
        newFullFrame.speedShoes[accLocalIdInBattle] = diffFrame.speedShoes[accLocalIdInBattle];
      }
    }
    return newFullFrame;
  },

  _dumpToFullFrameCache: function(fullFrame) {
    const self = this;
    while (self.recentFrameCacheCurrentSize >= self.recentFrameCacheMaxCount) {
      // Trick here: never evict the "Zero-th Frame" for resyncing!
      const toDelFrameId = Object.keys(self.recentFrameCache)[1];
      // cc.log("toDelFrameId is " + toDelFrameId + ".");
      delete self.recentFrameCache[toDelFrameId];
      --self.recentFrameCacheCurrentSize;
    }
    self.recentFrameCache[fullFrame.id] = fullFrame;
    ++self.recentFrameCacheCurrentSize;
  },

  _onPerUpsyncFrame() {
    const instance = this;
    if (instance.resyncing) return;
    if (
      null == instance.selfPlayerInfo ||
      null == instance.selfPlayerScriptIns ||
      null == instance.selfPlayerScriptIns.scheduledDirection
      ) return;
    const upsyncFrameData = {
      id: instance.selfPlayerInfo.id,
      /**
      * WARNING
      *
      * Deliberately NOT upsyncing the `instance.selfPlayerScriptIns.activeDirection` here, because it'll be deduced by other players from the position differences of `RoomDownsyncFrame`s.
      */
      dir: {
        dx: parseFloat(instance.selfPlayerScriptIns.scheduledDirection.dx),
        dy: parseFloat(instance.selfPlayerScriptIns.scheduledDirection.dy),
      },
      x: parseFloat(instance.selfPlayerNode.x),
      y: parseFloat(instance.selfPlayerNode.y),
      ackingFrameId: instance.lastRoomDownsyncFrameId,
    };
    const wrapped = {
      msgId: Date.now(),
      act: "PlayerUpsyncCmd",
      data: upsyncFrameData,
    }
    window.sendSafely(JSON.stringify(wrapped));
  },

  onDestroy() {
    const self = this;
    if (null == self.battleState || ALL_BATTLE_STATES.WAITING == self.battleState) {
      window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
    }
    if (null != window.handleRoomDownsyncFrame) {
      window.handleRoomDownsyncFrame = null;
    }
    if (self.upsyncLoopInterval) {
      clearInterval(self.upsyncLoopInterval);
    }
    if (self.inputControlTimer) {
      clearInterval(self.inputControlTimer)
    }
  },

  _lazilyTriggerResync() {
    if (true == this.resyncing) return;
    this.resyncing = true;
    if (ALL_MAP_STATES.SHOWING_MODAL_POPUP != this.state) {
      if (null == this.resyncingHintPopup) {
        this.resyncingHintPopup = this.popupSimplePressToGo(i18n.t("gameTip.resyncing"));
      }
    }
  },

  _onResyncCompleted() {
    if (false == this.resyncing) return;
    cc.log(`_onResyncCompleted`);
    this.resyncing = false;
    if (null != this.resyncingHintPopup && this.resyncingHintPopup.parent) {
      this.resyncingHintPopup.parent.removeChild(this.resyncingHintPopup);
    }
  },

  popupSimplePressToGo(labelString) {
    const self = this;
    self.state = ALL_MAP_STATES.SHOWING_MODAL_POPUP;

    const canvasNode = self.canvasNode;
    const simplePressToGoDialogNode = cc.instantiate(self.simplePressToGoDialogPrefab);
    simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
    simplePressToGoDialogNode.setScale(1 / canvasNode.scale);
    const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
    const yesButton = simplePressToGoDialogNode.getChildByName("Yes");
    const postDismissalByYes = () => {
      self.transitToState(ALL_MAP_STATES.VISUAL);
      canvasNode.removeChild(simplePressToGoDialogNode);
    }
    simplePressToGoDialogNode.getChildByName("Hint").getComponent(cc.Label).string = labelString;
    yesButton.once("click", simplePressToGoDialogScriptIns.dismissDialog.bind(simplePressToGoDialogScriptIns, postDismissalByYes));
    yesButton.getChildByName("Label").getComponent(cc.Label).string = "OK";
    self.transitToState(ALL_MAP_STATES.SHOWING_MODAL_POPUP);
    safelyAddChild(self.widgetsAboveAllNode, simplePressToGoDialogNode);
    setLocalZOrder(simplePressToGoDialogNode, 20);
    return simplePressToGoDialogNode;
  },

  alertForGoingBackToLoginScene(labelString, mapIns, shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage) {
    const millisToGo = 3000;
    mapIns.popupSimplePressToGo(cc.js.formatStr("%s will logout in %s seconds.", labelString, millisToGo / 1000));
    setTimeout(() => {
      mapIns.logout(false, shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage);
    }, millisToGo);
  },

  _resetCurrentMatch() {
    const self = this;
    const mapNode = self.node;
    const canvasNode = mapNode.parent;
    self.countdownLabel.string = "";
    if (self.playersNode) {
      for (let i in self.playersNode) {
        let node = self.playersNode[i];
        node.getComponent(cc.Animation).play("Bottom");
        node.getComponent("SelfPlayer").start();
        node.active = true;
      }
    }
    if (self.otherPlayerNodeDict) {
      for (let i in self.otherPlayerNodeDict) {
        let node = self.otherPlayerNodeDict[i];
        if (node.parent) {
          node.parent.removeChild(node);
        }
      }
    }
    if (self.selfPlayerNode && self.selfPlayerNode.parent) {
      self.selfPlayerNode.parent.removeChild(self.selfPlayerNode);
    }
    if (self.treasureNodeDict) {
      for (let i in self.treasureNodeDict) {
        let node = self.treasureNodeDict[i];
        if (node.parent) {
          node.parent.removeChild(node);
        }
      }
    }
    if (self.trapBulletNodeDict) {
      for (let i in self.trapBulletNodeDict) {
        let node = self.trapBulletNodeDict[i];
        if (node.parent) {
          node.parent.removeChild(node);
        }
      }
    }
    if (self.trapNodeDict) {
      for (let i in self.trapNodeDict) {
        let node = self.trapNodeDict[i];
        if (node.parent) {
          node.parent.removeChild(node);
        }
      }
    }

    if (self.pumpkinNodeDict) {
      for (let i in self.pumpkinNodeDict) {
        let node = self.pumpkinNodeDict[i];
        if (node.parent) {
          node.parent.removeChild(node);
        }
      }
    }

    if (self.acceleratorNodeDict) {
      for (let i in self.acceleratorNodeDict) {
        let node = self.acceleratorNodeDict[i];
        if (node.parent) {
          node.parent.removeChild(node);
        }
      }
    }

    if (self.upsyncLoopInterval) {
      clearInterval(self.upsyncLoopInterval);
    }

    self.mainCameraNode = canvasNode.getChildByName("Main Camera");
    self.mainCamera = self.mainCameraNode.getComponent(cc.Camera);
    for (let child of self.mainCameraNode.children) {
      child.setScale(1 / self.mainCamera.zoomRatio);
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
    self.acceleratorNodeDict = {};
    if (self.findingPlayerNode) {
      const findingPlayerScriptIns = self.findingPlayerNode.getComponent("FindingPlayer");
      findingPlayerScriptIns.init();
    }
    self.showPopopInCanvas(self.gameRuleNode);
    safelyAddChild(self.widgetsAboveAllNode, self.playersInfoNode);
  },

  onLoad() {
    const self = this;
    const mapNode = self.node;
    const canvasNode = mapNode.parent;
    cc.director.getCollisionManager().enabled = true;
    cc.director.getCollisionManager().enabledDebugDraw = CC_DEBUG;
    self.musicEffectManagerScriptIns = self.node.getComponent("MusicEffectManager");

    /** init requeired prefab started */
    self.confirmLogoutNode = cc.instantiate(self.confirmLogoutPrefab);
    self.confirmLogoutNode.getComponent("ConfirmLogout").mapNode = self.node;

    //Result panel init
    self.resultPanelNode = cc.instantiate(self.resultPanelPrefab);
    const resultPanelScriptIns = self.resultPanelNode.getComponent("ResultPanel");
    resultPanelScriptIns.mapScriptIns = self;
    resultPanelScriptIns.onAgainClicked = () => {
      window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
      self._resetCurrentMatch();
      let shouldReconnectState = parseInt(cc.sys.localStorage.shouldReconnectState);
      switch (shouldReconnectState) {
        case 2:
        case 1:
          // Clicking too fast?
          return;
        default:
          break;
      }

      if (null == window.clientSession || window.clientSession.readyState != WebSocket.OPEN) {
        // Already disconnected. 
        cc.log("Ws session is already closed when `again/replay` button is clicked. Reconnecting now.");
        window.initPersistentSessionClient(self.initAfterWSConncted);
      } else {
        // Should disconnect first and reconnect within `window.handleClientSessionCloseOrError`. 
        cc.log("Ws session is not closed yet when `again/replay` button is clicked, closing the ws session now.");
        cc.sys.localStorage.shouldReconnectState = 2;
        window.closeWSConnection();
      }
    };

    self.gameRuleNode = cc.instantiate(self.gameRulePrefab);
    self.gameRuleScriptIns = self.gameRuleNode.getComponent("GameRule");
    self.gameRuleScriptIns.mapNode = self.node;

    self.findingPlayerNode = cc.instantiate(self.findingPlayerPrefab);
    self.findingPlayerNode.width = self.canvasNode.width;
    self.findingPlayerNode.height = self.canvasNode.height;
    const findingPlayerScriptIns = self.findingPlayerNode.getComponent("FindingPlayer");
    findingPlayerScriptIns.init();

    self.playersInfoNode = cc.instantiate(self.playersInfoPrefab);

    self.countdownToBeginGameNode = cc.instantiate(self.countdownToBeginGamePrefab);

    self.playersNode = {};
    const player1Node = cc.instantiate(self.player1Prefab);
    const player2Node = cc.instantiate(self.player2Prefab);
    Object.assign(self.playersNode, {
      1: player1Node
    });
    Object.assign(self.playersNode, {
      2: player2Node
    });

    /** init requeired prefab ended */

    self.clientUpsyncFps = 20;
    self._resetCurrentMatch();

    const tiledMapIns = self.node.getComponent(cc.TiledMap);
    const boundaryObjs = tileCollisionManager.extractBoundaryObjects(self.node);
    for (let frameAnim of boundaryObjs.frameAnimations) {
      const animNode = cc.instantiate(self.tiledAnimPrefab);
      const anim = animNode.getComponent(cc.Animation);
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

    self.barrierColliders = [];
    for (let boundaryObj of boundaryObjs.barriers) {
      const newBarrier = cc.instantiate(self.barrierPrefab);
      const newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
      newBarrier.setPosition(newBoundaryOffsetInMapNode);
      newBarrier.setAnchorPoint(cc.v2(0, 0));
      const newBarrierColliderIns = newBarrier.getComponent(cc.PolygonCollider);
      newBarrierColliderIns.points = [];
      for (let p of boundaryObj) {
        newBarrierColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
      }
      self.barrierColliders.push(newBarrierColliderIns);
      self.node.addChild(newBarrier);
    }
    const allLayers = tiledMapIns.getLayers();
    for (let layer of allLayers) {
      const layerType = layer.getProperty("type");
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

    const allObjectGroups = tiledMapIns.getObjectGroups();
    for (let objectGroup of allObjectGroups) {
      const objectGroupType = objectGroup.getProperty("type");
      switch (objectGroupType) {
        case "barrier_and_shelter":
          setLocalZOrder(objectGroup.node, 3);
          break;
        default:
          break;
      }
    }

    for (let boundaryObj of boundaryObjs.sheltersZReducer) {
      const newShelter = cc.instantiate(self.shelterZReducerPrefab);
      const newBoundaryOffsetInMapNode = cc.v2(boundaryObj[0].x, boundaryObj[0].y);
      newShelter.setPosition(newBoundaryOffsetInMapNode);
      newShelter.setAnchorPoint(cc.v2(0, 0));
      const newShelterColliderIns = newShelter.getComponent(cc.PolygonCollider);
      newShelterColliderIns.points = [];
      for (let p of boundaryObj) {
        newShelterColliderIns.points.push(p.sub(newBoundaryOffsetInMapNode));
      }
      self.node.addChild(newShelter);
    }

    window.handleClientSessionCloseOrError = function() {
      let shouldReconnectState = parseInt(cc.sys.localStorage.shouldReconnectState);
      switch (shouldReconnectState) {
        case 2:
          shouldReconnectState = 1;
          cc.sys.localStorage.shouldReconnectState = shouldReconnectState;
          cc.log("Reconnecting because 2 == shouldReconnectState and it's now set to 1.");
          window.initPersistentSessionClient(self.initAfterWSConncted);
          return;
        case 1:
          cc.log("Neither reconnecting nor alerting because 1 == shouldReconnectState and it's now removed.");
          cc.sys.localStorage.removeItem("shouldReconnectState");
          return;
        default:
          break;
      }
      if (null == self.battleState || ALL_BATTLE_STATES.WAITING == self.battleState) {
        window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
        self.alertForGoingBackToLoginScene("Client session closed unexpectedly!", self, true);
      }
    };

    self.initAfterWSConncted = () => {
      self.selfPlayerInfo = JSON.parse(cc.sys.localStorage.selfPlayer);
      Object.assign(self.selfPlayerInfo, {
        id: self.selfPlayerInfo.playerId
      });
      self.transitToState(ALL_MAP_STATES.VISUAL);
      self._inputControlEnabled = false;
      self.setupInputControls();
      window.handleRoomDownsyncFrame = function(diffFrame) {
        //console.log(diffFrame);

        if (ALL_BATTLE_STATES.WAITING != self.battleState && ALL_BATTLE_STATES.IN_BATTLE != self.battleState && ALL_BATTLE_STATES.IN_SETTLEMENT != self.battleState) return;
        const refFrameId = diffFrame.refFrameId;
        if (-99 == refFrameId) { //显示倒计时
          self.matchPlayersFinsihed(diffFrame.players);
        } else if (-98 == refFrameId) { //显示匹配玩家
          if (window.initWxSdk) {
            window.initWxSdk();
          }
          const findingPlayerScriptIns = self.findingPlayerNode.getComponent("FindingPlayer");
          if (!self.findingPlayerNode.parent) {
            self.showPopopInCanvas(self.findingPlayerNode);
          }
          findingPlayerScriptIns.updatePlayersInfo(diffFrame.players);
          return;
        }

        //根据downFrame显示游戏场景

        const frameId = diffFrame.id;
        if (frameId <= self.lastRoomDownsyncFrameId) {
          // Log the obsolete frames?
          return;
        }
        const isInitiatingFrame = (0 > self.recentFrameCacheCurrentSize || 0 == refFrameId);
        /*
        if (frameId % 300 == 0) {
          // WARNING: For testing only!
          if (0 < frameId) {
            self._lazilyTriggerResync(); 
          }
          cc.log(`${JSON.stringify(diffFrame)}`);
        }
        */
        const cachedFullFrame = self.recentFrameCache[refFrameId];
        if (
          !isInitiatingFrame
          && self.useDiffFrameAlgo
          && (refFrameId > 0 || 0 < self.recentFrameCacheCurrentSize) // Critical condition to differentiate between "BattleStarted" or "ShouldResync". 
          && null == cachedFullFrame
        ) {
          self._lazilyTriggerResync();
          // Later incoming diffFrames will all suffice that `0 < self.recentFrameCacheCurrentSize && null == cachedFullFrame`, until `this._onResyncCompleted` is successfully invoked.
          return;
        }

        if (isInitiatingFrame && 0 == refFrameId) {
          // Reaching here implies that you've received the resync frame.
          self._onResyncCompleted();
        }
        let countdownNanos = diffFrame.countdownNanos;
        if (countdownNanos < 0)
          countdownNanos = 0;
        const countdownSeconds = parseInt(countdownNanos / 1000000000);
        if (isNaN(countdownSeconds)) {
          cc.log(`countdownSeconds is NaN for countdownNanos == ${countdownNanos}.`);
        }
        // if(self.musicEffectManagerScriptIns && 10 == countdownSeconds ) {
        //   self.musicEffectManagerScriptIns.playCountDown10SecToEnd();
        // }
        self.countdownLabel.string = countdownSeconds;
        const roomDownsyncFrame = (
        (isInitiatingFrame || !self.useDiffFrameAlgo)
          ?
          diffFrame
          :
          self._generateNewFullFrame(cachedFullFrame, diffFrame)
        );
        if (countdownNanos <= 0) {
          self.onBattleStopped(roomDownsyncFrame.players);
          return;
        }
        self._dumpToFullFrameCache(roomDownsyncFrame);
        const sentAt = roomDownsyncFrame.sentAt;


        //update players Info
        const players = roomDownsyncFrame.players;
        const playerIdStrList = Object.keys(players);
        self.otherPlayerCachedDataDict = {};
        for (let i = 0; i < playerIdStrList.length; ++i) {
          const k = playerIdStrList[i];
          const playerId = parseInt(k);
          if (playerId == self.selfPlayerInfo.id) {
            const immediateSelfPlayerInfo = players[k];
            Object.assign(self.selfPlayerInfo, {
              x: immediateSelfPlayerInfo.x,
              y: immediateSelfPlayerInfo.y,
              speed: immediateSelfPlayerInfo.speed,
              battleState: immediateSelfPlayerInfo.battleState,
              score: immediateSelfPlayerInfo.score,
              joinIndex: immediateSelfPlayerInfo.joinIndex,
            });
            continue;
          }
          const anotherPlayer = players[k];
          // Note that this callback is invoked in the NetworkThread, and the rendering should be executed in the GUIThread, e.g. within `update(dt)`.
          self.otherPlayerCachedDataDict[playerId] = anotherPlayer;
        }

        //update pumpkin Info 
        self.pumpkinInfoDict = {};
        const pumpkin = roomDownsyncFrame.pumpkin;
        const pumpkinsLocalIdStrList = Object.keys(pumpkin);
        for (let i = 0; i < pumpkinsLocalIdStrList.length; ++i) {
          const k = pumpkinsLocalIdStrList[i];
          const pumpkinLocalIdInBattle = parseInt(k);
          const pumpkinInfo = pumpkin[k];
          self.pumpkinInfoDict[pumpkinLocalIdInBattle] = pumpkinInfo;
        }
        

        //update treasureInfoDict
        self.treasureInfoDict = {};
        const treasures = roomDownsyncFrame.treasures;
        const treasuresLocalIdStrList = Object.keys(treasures);
        for (let i = 0; i < treasuresLocalIdStrList.length; ++i) {
          const k = treasuresLocalIdStrList[i];
          const treasureLocalIdInBattle = parseInt(k);
          const treasureInfo = treasures[k];
          self.treasureInfoDict[treasureLocalIdInBattle] = treasureInfo;
        }

        //update acceleratorInfoDict
        self.acceleratorInfoDict = {};
        const accelartors = roomDownsyncFrame.speedShoes;
        const accLocalIdStrList = Object.keys(accelartors);
        for (let i = 0; i < accLocalIdStrList.length; ++i) {
          const k = accLocalIdStrList[i];
          const accLocalIdInBattle = parseInt(k);
          const accInfo = accelartors[k];
          self.acceleratorInfoDict[accLocalIdInBattle] = accInfo;
        }

        //update trapInfoDict
        self.trapInfoDict = {};
        const traps = roomDownsyncFrame.traps;
        const trapsLocalIdStrList = Object.keys(traps);
        for (let i = 0; i < trapsLocalIdStrList.length; ++i) {
          const k = trapsLocalIdStrList[i];
          const trapLocalIdInBattle = parseInt(k);
          const trapInfo = traps[k];
          self.trapInfoDict[trapLocalIdInBattle] = trapInfo;
        }

        self.trapBulletInfoDict = {};
        const bullets = roomDownsyncFrame.bullets;
        const bulletsLocalIdStrList = Object.keys(bullets);
        for (let i = 0; i < bulletsLocalIdStrList.length; ++i) {
          const k = bulletsLocalIdStrList[i];
          const bulletLocalIdInBattle = parseInt(k);
          const bulletInfo = bullets[k];
          self.trapBulletInfoDict[bulletLocalIdInBattle] = bulletInfo;
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
    }

    /*
    * The following code snippet is a dirty fix.
    */
    let expectedRoomId = null;
    const qDict = window.getQueryParamDict();
    if (qDict) {
      expectedRoomId = qDict["expectedRoomId"];
    } else {
      if (window.history && window.history.state) {
        expectedRoomId = window.history.state.expectedRoomId;
      }
    }
    if (expectedRoomId) {
      self.gameRuleNode.active = false;
      window.initPersistentSessionClient(self.initAfterWSConncted);
      return;
    } else {
      if (cc.sys.localStorage.boundRoomId) {
        self.gameRuleNode.active = false;
        window.initPersistentSessionClient(self.initAfterWSConncted);
        return;
      }
    }
  },

  setupInputControls() {
    const instance = this;
    const mapNode = instance.node;
    const canvasNode = mapNode.parent;
    const joystickInputControllerScriptIns = canvasNode.getComponent("TouchEventsManager");
    const inputControlPollerMillis = (1000 / joystickInputControllerScriptIns.pollerFps);

    const ctrl = joystickInputControllerScriptIns;
    instance.ctrl = ctrl;

    instance.inputControlTimer = setInterval(function() {
      if (false == instance._inputControlEnabled) return;
      instance.selfPlayerScriptIns.activeDirection = ctrl.activeDirection;
    }, inputControlPollerMillis);
  },

  enableInputControls() {
    this._inputControlEnabled = true;
  },

  disableInputControls() {
    this._inputControlEnabled = false;
  },

  onBattleStarted() {
    const self = this;
    if (self.musicEffectManagerScriptIns)
      self.musicEffectManagerScriptIns.playBGM();
    const canvasNode = self.canvasNode;
    self.spawnSelfPlayer();
    self.upsyncLoopInterval = setInterval(self._onPerUpsyncFrame.bind(self), self.clientUpsyncFps);
    self.transitToState(ALL_MAP_STATES.VISUAL);
    self.enableInputControls();
    if (self.countdownToBeginGameNode.parent) {
      self.countdownToBeginGameNode.parent.removeChild(self.countdownToBeginGameNode);
      self.transitToState(ALL_MAP_STATES.VISUAL);
    }
  },

  onBattleStopped(players) {
    const self = this;
    if (self.musicEffectManagerScriptIns) {
      self.musicEffectManagerScriptIns.stopAllMusic();
    }
    const canvasNode = self.canvasNode;
    const resultPanelNode = self.resultPanelNode;
    const resultPanelScriptIns = resultPanelNode.getComponent("ResultPanel");
    resultPanelScriptIns.showPlayerInfo(players);
    window.clearBoundRoomIdInBothVolatileAndPersistentStorage(); //清除cached boundRoomId
    // Such that it doesn't execute "update(dt)" anymore. 
    self.selfPlayerNode.active = false;
    self.battleState = ALL_BATTLE_STATES.IN_SETTLEMENT;
    self.showPopopInCanvas(resultPanelNode);
  },

  spawnSelfPlayer() {
    const instance = this;
    const joinIndex = this.selfPlayerInfo.joinIndex;
    const newPlayerNode = this.playersNode[joinIndex];
    const tiledMapIns = instance.node.getComponent(cc.TiledMap);
    let toStartWithPos = cc.v2(instance.selfPlayerInfo.x, instance.selfPlayerInfo.y)
    newPlayerNode.setPosition(toStartWithPos);
    newPlayerNode.getComponent("SelfPlayer").mapNode = instance.node;

    instance.node.addChild(newPlayerNode);
    instance.selfPlayerScriptIns = newPlayerNode.getComponent("SelfPlayer");
    instance.selfPlayerScriptIns.showArrowTipNode();

    setLocalZOrder(newPlayerNode, 5);
    instance.selfPlayerNode = newPlayerNode;
  },

  update(dt) {
    const self = this;
    const mapNode = self.node;
    const canvasNode = mapNode.parent;
    const canvasParentNode = canvasNode.parent;
    if (null != window.boundRoomId) {
      self.boundRoomIdLabel.string = window.boundRoomId;
    }
    if (null != self.selfPlayerInfo) {
      const playersScriptIns = self.playersInfoNode.getComponent("PlayersInfo");
      playersScriptIns.updateData(self.selfPlayerInfo);
      if (null != self.selfPlayerScriptIns) {
        self.selfPlayerScriptIns.updateSpeed(self.selfPlayerInfo.speed);
      }
    }

    let toRemoveAcceleratorNodeDict = {};
    Object.assign(toRemoveAcceleratorNodeDict, self.acceleratorNodeDict);

    let toRemovePlayerNodeDict = {};
    Object.assign(toRemovePlayerNodeDict, self.otherPlayerNodeDict);

    let toRemoveTreasureNodeDict = {};
    Object.assign(toRemoveTreasureNodeDict, self.treasureNodeDict);

    let toRemoveTrapNodeDict = {};
    Object.assign(toRemoveTrapNodeDict, self.trapNodeDict);

    let toRemovePumpkinNodeDict = {};
    Object.assign(toRemovePumpkinNodeDict, self.pumpkinNodeDict);

    /*
    * NOTE: At the beginning of each GUI update cycle, mark all `self.trapBulletNode` as `toRemoveBulletNode`, while only those that persist in `self.trapBulletInfoDict` are NOT finally removed. This approach aims to reduce the lines of codes for coping with node removal in the RoomDownsyncFrame algorithm.
    */
    let toRemoveBulletNodeDict = {};
    Object.assign(toRemoveBulletNodeDict, self.trapBulletNodeDict);

    for (let k in self.otherPlayerCachedDataDict) {
      const playerId = parseInt(k);
      const cachedPlayerData = self.otherPlayerCachedDataDict[playerId];
      const newPos = cc.v2(
        cachedPlayerData.x,
        cachedPlayerData.y
      );

      //更新玩家信息展示
      if (null != cachedPlayerData) {
        const playersScriptIns = self.playersInfoNode.getComponent("PlayersInfo");
        playersScriptIns.updateData(cachedPlayerData);
      }
      let targetNode = self.otherPlayerNodeDict[playerId];
      if (!targetNode) {
        targetNode = self.playersNode[cachedPlayerData.joinIndex];
        targetNode.getComponent("SelfPlayer").mapNode = mapNode;
        self.otherPlayerNodeDict[playerId] = targetNode;
        safelyAddChild(mapNode, targetNode);
        targetNode.setPosition(newPos);
        setLocalZOrder(targetNode, 5);
      }
      const aControlledOtherPlayerScriptIns = targetNode.getComponent("SelfPlayer");
      aControlledOtherPlayerScriptIns.updateSpeed(cachedPlayerData.speed);



      const oldPos = cc.v2(
        targetNode.x,
        targetNode.y
      );

      const toMoveByVec = newPos.sub(oldPos);
      const toMoveByVecMag = toMoveByVec.mag();
      aControlledOtherPlayerScriptIns.toMoveByVecMag = toMoveByVecMag;
      const toTeleportDisThreshold = (cachedPlayerData.speed * dt * 100);
      //const notToMoveDisThreshold = (cachedPlayerData.speed * dt * 0.5);
      const notToMoveDisThreshold = (cachedPlayerData.speed * dt * 1.0);
      if (toMoveByVecMag < notToMoveDisThreshold) { 
        aControlledOtherPlayerScriptIns.activeDirection = { //任意一个值为0都不会改变方向
          dx: 0,
          dy: 0
        };
      } else {
        if (toMoveByVecMag > toTeleportDisThreshold) { //如果移动过大 打印log但还是会移动
          cc.log(`Player ${cachedPlayerData.id} is teleporting! Having toMoveByVecMag == ${toMoveByVecMag}, toTeleportDisThreshold == ${toTeleportDisThreshold}`);
          aControlledOtherPlayerScriptIns.activeDirection = {
            dx: 0,
            dy: 0
          };
          // TODO: Use `cc.Action`?
          targetNode.setPosition(newPos);
        } else {
          // The common case which is suitable for interpolation.
          const normalizedDir = {
            dx: toMoveByVec.x / toMoveByVecMag,
            dy: toMoveByVec.y / toMoveByVecMag,
          };
          aControlledOtherPlayerScriptIns.toMoveByVec = toMoveByVec;
          aControlledOtherPlayerScriptIns.toMoveByVecMag = toMoveByVecMag;

          if (isNaN(normalizedDir.dx) || isNaN(normalizedDir.dy)) {
            aControlledOtherPlayerScriptIns.activeDirection = {
              dx: 0,
              dy: 0,
            };
          } else {
            aControlledOtherPlayerScriptIns.activeDirection = normalizedDir;
          }
        }
      }


      if (0 != cachedPlayerData.dir.dx || 0 != cachedPlayerData.dir.dy) {
        const newScheduledDirection = self.ctrl.discretizeDirection(cachedPlayerData.dir.dx, cachedPlayerData.dir.dy, self.ctrl.joyStickEps);
        //console.log(newScheduledDirection);
        aControlledOtherPlayerScriptIns.scheduleNewDirection(newScheduledDirection, false /* DON'T interrupt playing anim. */ );
      }

      if (null != toRemovePlayerNodeDict[playerId]) {
        delete toRemovePlayerNodeDict[playerId];
      }


    }

    // 更新加速鞋显示 
    for (let k in self.acceleratorInfoDict) {
      const accLocalIdInBattle = parseInt(k);
      const acceleratorInfo = self.acceleratorInfoDict[accLocalIdInBattle];
      const newPos = cc.v2(
        acceleratorInfo.x,
        acceleratorInfo.y
      );
      let targetNode = self.acceleratorNodeDict[accLocalIdInBattle];
      if (!targetNode) {
        targetNode = cc.instantiate(self.acceleratorPrefab);
        self.acceleratorNodeDict[accLocalIdInBattle] = targetNode;
        safelyAddChild(mapNode, targetNode);
        targetNode.setPosition(newPos);
        setLocalZOrder(targetNode, 5);
      }
      if (null != toRemoveAcceleratorNodeDict[accLocalIdInBattle]) {
        delete toRemoveAcceleratorNodeDict[accLocalIdInBattle];
      }
    }
    // 更新陷阱显示 
    for (let k in self.trapInfoDict) {
      const trapLocalIdInBattle = parseInt(k);
      const trapInfo = self.trapInfoDict[trapLocalIdInBattle];
      const newPos = cc.v2(
        trapInfo.x,
        trapInfo.y
      );
      let targetNode = self.trapNodeDict[trapLocalIdInBattle];
      if (!targetNode) {
        targetNode = cc.instantiate(self.trapPrefab);
        self.trapNodeDict[trapLocalIdInBattle] = targetNode;
        safelyAddChild(mapNode, targetNode);
        targetNode.setPosition(newPos);
        setLocalZOrder(targetNode, 5);
      }
      if (null != toRemoveTrapNodeDict[trapLocalIdInBattle]) {
        delete toRemoveTrapNodeDict[trapLocalIdInBattle];
      }
    }

    // 更新bullet显示 
    for (let k in self.trapBulletInfoDict) {
      const bulletLocalIdInBattle = parseInt(k);
      const bulletInfo = self.trapBulletInfoDict[bulletLocalIdInBattle];
      const newPos = cc.v2(
        bulletInfo.x,
        bulletInfo.y
      );
      let targetNode = self.trapBulletNodeDict[bulletLocalIdInBattle];
      if (!targetNode) {
        targetNode = cc.instantiate(self.trapBulletPrefab);
        self.trapBulletNodeDict[bulletLocalIdInBattle] = targetNode;
        safelyAddChild(mapNode, targetNode);
        targetNode.setPosition(newPos);
        setLocalZOrder(targetNode, 5);
      }
      const aBulletScriptIns = targetNode.getComponent("Bullet");
      aBulletScriptIns.localIdInBattle = bulletLocalIdInBattle;
      aBulletScriptIns.linearSpeed = bulletInfo.linearSpeed * 1000000000; // The `bullet.LinearSpeed` on server-side is denoted in pts/nanoseconds. 

      const oldPos = cc.v2(
        targetNode.x,
        targetNode.y,
      );
      const toMoveByVec = newPos.sub(oldPos);
      const toMoveByVecMag = toMoveByVec.mag();
      const toTeleportDisThreshold = (aBulletScriptIns.linearSpeed * dt * 100);
      const notToMoveDisThreshold = (aBulletScriptIns.linearSpeed * dt * 0.5);
      if (toMoveByVecMag < notToMoveDisThreshold) {
        aBulletScriptIns.activeDirection = {
          dx: 0,
          dy: 0,
        };
      } else {
        if (toMoveByVecMag > toTeleportDisThreshold) {
          cc.log(`Bullet ${bulletLocalIdInBattle} is teleporting! Having toMoveByVecMag == ${toMoveByVecMag}, toTeleportDisThreshold == ${toTeleportDisThreshold}`);
          aBulletScriptIns.activeDirection = {
            dx: 0,
            dy: 0
          };
          // TODO: Use `cc.Action`?
          targetNode.setPosition(newPos);
        } else {
          // The common case which is suitable for interpolation.
          const normalizedDir = {
            dx: toMoveByVec.x / toMoveByVecMag,
            dy: toMoveByVec.y / toMoveByVecMag,
          };
          if (isNaN(normalizedDir.dx) || isNaN(normalizedDir.dy)) {
            aBulletScriptIns.activeDirection = {
              dx: 0,
              dy: 0,
            };
          } else {
            aBulletScriptIns.activeDirection = normalizedDir;
          }
        }
      }
      if (null != toRemoveBulletNodeDict[bulletLocalIdInBattle]) {
        delete toRemoveBulletNodeDict[bulletLocalIdInBattle];
      }
    }

    //更新南瓜少年的显示
    for (let k in self.pumpkinInfoDict) {
      const pumpkinLocalIdInBattle = parseInt(k);
      const pumpkinInfo = self.pumpkinInfoDict[pumpkinLocalIdInBattle];
      const newPos = cc.v2(pumpkinInfo.x, pumpkinInfo.y);
      let targetNode = self.pumpkinNodeDict[pumpkinLocalIdInBattle];
      if (!targetNode) {
        targetNode = cc.instantiate(self.pumpkinPrefab);
        self.pumpkinNodeDict[pumpkinLocalIdInBattle] = targetNode;
        safelyAddChild(mapNode, targetNode);
        targetNode.setPosition(newPos);
        setLocalZOrder(targetNode, 5);
      }
      const aPumpkinScriptIns = targetNode.getComponent("Pumpkin");
      aPumpkinScriptIns.localIdInBattle = pumpkinLocalIdInBattle;
      aPumpkinScriptIns.linearSpeed = pumpkinInfo.linearSpeed * 1000000000; // The `pumpkin.LinearSpeed` on server-side is denoted in pts/nanoseconds. 

      const oldPos = cc.v2(
        targetNode.x,
        targetNode.y,
      );
      const toMoveByVec = newPos.sub(oldPos);
      const toMoveByVecMag = toMoveByVec.mag();
      const toTeleportDisThreshold = (aPumpkinScriptIns.linearSpeed * dt * 100);
      const notToMoveDisThreshold = (aPumpkinScriptIns.linearSpeed * dt * 0.5);
      if (toMoveByVecMag < notToMoveDisThreshold) {
        aPumpkinScriptIns.activeDirection = {
          dx: 0,
          dy: 0,
        };
      } else {
        if (toMoveByVecMag > toTeleportDisThreshold) {
          cc.log(`Pumpkin ${pumpkinLocalIdInBattle} is teleporting! Having toMoveByVecMag == ${toMoveByVecMag}, toTeleportDisThreshold == ${toTeleportDisThreshold}`);
          aPumpkinScriptIns.activeDirection = {
            dx: 0,
            dy: 0
          };
          // TODO: Use `cc.Action`?
          targetNode.setPosition(newPos);
        } else {
          // The common case which is suitable for interpolation.
          const normalizedDir = {
            dx: toMoveByVec.x / toMoveByVecMag,
            dy: toMoveByVec.y / toMoveByVecMag,
          };
          if (isNaN(normalizedDir.dx) || isNaN(normalizedDir.dy)) {
            aPumpkinScriptIns.activeDirection = {
              dx: 0,
              dy: 0,
            };
          } else {
            aPumpkinScriptIns.activeDirection = normalizedDir;
          }
        }
      }
      if (null != toRemovePumpkinNodeDict[pumpkinLocalIdInBattle]) {
        delete toRemovePumpkinNodeDict[pumpkinLocalIdInBattle];
      }
    }

    // 更新宝物显示 
    for (let k in self.treasureInfoDict) {
      const treasureLocalIdInBattle = parseInt(k);
      const treasureInfo = self.treasureInfoDict[treasureLocalIdInBattle];
      const newPos = cc.v2(
        treasureInfo.x,
        treasureInfo.y
      );
      let targetNode = self.treasureNodeDict[treasureLocalIdInBattle];
      if (!targetNode) {
        targetNode = cc.instantiate(self.treasurePrefab);
        const treasureNodeScriptIns = targetNode.getComponent("Treasure");
        treasureNodeScriptIns.setData(treasureInfo);
        self.treasureNodeDict[treasureLocalIdInBattle] = targetNode;
        safelyAddChild(mapNode, targetNode);
        targetNode.setPosition(newPos);
        setLocalZOrder(targetNode, 5);
      }

      if (null != toRemoveTreasureNodeDict[treasureLocalIdInBattle]) {
        delete toRemoveTreasureNodeDict[treasureLocalIdInBattle];
      }
      if (0 < targetNode.getNumberOfRunningActions()) {
        // A significant trick to smooth the position sync performance!
        continue;
      }
      const oldPos = cc.v2(
        targetNode.x,
        targetNode.y
      );
      const toMoveByVec = newPos.sub(oldPos);
      const durationSeconds = dt; // Using `dt` temporarily!
      targetNode.runAction(cc.moveTo(durationSeconds, newPos));
    }

    // Coping with removed players.
    for (let k in toRemovePlayerNodeDict) {
      const playerId = parseInt(k);
      toRemovePlayerNodeDict[k].parent.removeChild(toRemovePlayerNodeDict[k]);
      delete self.otherPlayerNodeDict[playerId];
    }

    // Coping with removed pumpkins.
    for (let k in toRemovePumpkinNodeDict) {
      const pumpkinLocalIdInBattle = parseInt(k);
      toRemovePumpkinNodeDict[k].parent.removeChild(toRemovePlayerNodeDict[k]);
      delete self.pumpkinNodeDict[pumpkinLocalIdInBattle];
    }

    // Coping with removed treasures.
    for (let k in toRemoveTreasureNodeDict) {
      const treasureLocalIdInBattle = parseInt(k);
      const treasureScriptIns = toRemoveTreasureNodeDict[k].getComponent("Treasure");
      treasureScriptIns.playPickedUpAnimAndDestroy();
      if (self.musicEffectManagerScriptIns) {
        if (2 == treasureScriptIns.type) {
          self.musicEffectManagerScriptIns.playHighScoreTreasurePicked();
        } else {
          self.musicEffectManagerScriptIns.playTreasurePicked();
        }
      }
      delete self.treasureNodeDict[treasureLocalIdInBattle];
    }

    // Coping with removed traps.
    for (let k in toRemoveTrapNodeDict) {
      const trapLocalIdInBattle = parseInt(k);
      toRemoveTrapNodeDict[k].parent.removeChild(toRemoveTrapNodeDict[k]);
      delete self.trapNodeDict[trapLocalIdInBattle];
    }

    // Coping with removed accelerators.
    for (let k in toRemoveAcceleratorNodeDict) {
      const accLocalIdInBattle = parseInt(k);
      toRemoveAcceleratorNodeDict[k].parent.removeChild(toRemoveAcceleratorNodeDict[k]);
      delete self.acceleratorNodeDict[accLocalIdInBattle];
    }

    // Coping with removed bullets.
    for (let k in toRemoveBulletNodeDict) {
      const bulletLocalIdInBattle = parseInt(k);
      toRemoveBulletNodeDict[k].parent.removeChild(toRemoveBulletNodeDict[k]);
      delete self.trapBulletNodeDict[bulletLocalIdInBattle];
      if (self.musicEffectManagerScriptIns) {
        self.musicEffectManagerScriptIns.playCrashedByTrapBullet();
      }
    }
  },

  transitToState(s) {
    const self = this;
    self.state = s;
  },

  logout(byClick /* The case where this param is "true" will be triggered within `ConfirmLogout.js`.*/ , shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage) {
    const localClearance = function() {
      window.closeWSConnection();
      if (true != shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage) {
        window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
      }
      cc.sys.localStorage.removeItem('selfPlayer');
      cc.director.loadScene('login');
    };

    const self = this;
    if (null != cc.sys.localStorage.selfPlayer) {
      const selfPlayer = JSON.parse(cc.sys.localStorage.selfPlayer);
      const requestContent = {
        intAuthToken: selfPlayer.intAuthToken
      }
      try {
        NetworkUtils.ajax({
          url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.INT_AUTH_TOKEN + constants.ROUTE_PATH.LOGOUT,
          type: "POST",
          data: requestContent,
          success: function(res) {
            if (res.ret != constants.RET_CODE.OK) {
              cc.log(`Logout failed: ${res}.`);
            }
            localClearance();
          },
          error: function(xhr, status, errMsg) {
            localClearance();
          },
          timeout: function() {
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

  onLogoutClicked(evt) {
    const self = this;
    self.showPopopInCanvas(self.confirmLogoutNode);
  },

  onLogoutConfirmationDismissed() {
    const self = this;
    self.transitToState(ALL_MAP_STATES.VISUAL);
    const canvasNode = self.canvasNode;
    canvasNode.removeChild(self.confirmLogoutNode);
    self.enableInputControls();
  },

  initWSConnection(evt, cb) {
    const self = this;
    window.initPersistentSessionClient(self.initAfterWSConncted);
    if (cb) {
      cb()
    }
  },

  showPopopInCanvas(toShowNode) {
    const self = this;
    self.disableInputControls();
    self.transitToState(ALL_MAP_STATES.SHOWING_MODAL_POPUP);
    safelyAddChild(self.widgetsAboveAllNode, toShowNode);
    setLocalZOrder(toShowNode, 10);
  },

  matchPlayersFinsihed(players) {
    const self = this;
    const findingPlayerScriptIns = self.findingPlayerNode.getComponent("FindingPlayer");
    findingPlayerScriptIns.updatePlayersInfo(players);
    window.setTimeout(() => {
      if (self.findingPlayerNode.parent) {
        self.findingPlayerNode.parent.removeChild(self.findingPlayerNode);
        self.transitToState(ALL_MAP_STATES.VISUAL);
        for (let i in players) {
          //更新在线玩家信息面板的信息
          const playerInfo = players[i];
          const playersScriptIns = self.playersInfoNode.getComponent("PlayersInfo");
          playersScriptIns.updateData(playerInfo);
        }
      }
      const countDownScriptIns = self.countdownToBeginGameNode.getComponent("CountdownToBeginGame");
      countDownScriptIns.setData();
      self.showPopopInCanvas(self.countdownToBeginGameNode);
      return;
    }, 2000);
  },
});
