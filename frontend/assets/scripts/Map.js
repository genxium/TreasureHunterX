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
    treasurePrefab: {
      type: cc.Prefab,
      default: null,
    },
    trapPrefab: {
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
      type:cc.Prefab,
      default: null
    },
    resultPanelPrefab: {
      type:cc.Prefab,
      default: null
    },
    gameRulePrefab: {
      type:cc.Prefab,
      default: null
    },
    findingPlayerPrefab: {
      type:cc.Prefab,
      default: null
    },
    countdownToBeginGamePrefab: {
      type:cc.Prefab,
      default: null
    },
    playersInfoPrefab: {
      type:cc.Prefab,
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
        // cc.log(`Bullet with localIdInBattle == ${bulletLocalIdInBattle} is removed.`);
        delete newFullFrame.bullets[bulletLocalIdInBattle];
      } else {
        newFullFrame.bullets[bulletLocalIdInBattle] = diffFrame.bullets[bulletLocalIdInBattle];  
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
    if (self.upsyncLoopInterval) {
      clearInterval(self.upsyncLoopInterval);
    }
    if (self.inputControlTimer) {
      clearInterval(self.inputControlTimer)
    }
  },

  _lazilyTriggerResync() {
    if (true == this.resyncing) return; 
    this.resyncing = false;
    if (ALL_MAP_STATES.SHOWING_MODAL_POPUP != this.state) {
      this.popupSimplePressToGo("Resyncing your battle, please wait...");
    }
  },

  _onResyncCompleted() {
    if (false == this.resyncing) return; 
    cc.log(`_onResyncCompleted`);
    this.resyncing = true;
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
  },

  alertForGoingBackToLoginScene(labelString, mapIns, shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage) {
    const millisToGo = 3000;
    mapIns.popupSimplePressToGo(cc.js.formatStr("%s will logout in %s seconds.", labelString, millisToGo / 1000));
    setTimeout(() => {
      mapIns.logout(false, shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage);
    }, millisToGo);
 },

  onLoad() {
    const self = this;
    self.resyncing = false;
    self.lastRoomDownsyncFrameId = 0;

    self.recentFrameCache = {};
    self.recentFrameCacheCurrentSize = 0;
    self.recentFrameCacheMaxCount = 2048;

    const mapNode = self.node;
    const canvasNode = mapNode.parent;
    cc.director.getCollisionManager().enabled = true;
    cc.director.getCollisionManager().enabledDebugDraw = CC_DEBUG;

    self.mainCameraNode = canvasNode.getChildByName("Main Camera");
    self.mainCamera = self.mainCameraNode.getComponent(cc.Camera);
    for (let child of self.mainCameraNode.children) {
      child.setScale(1/self.mainCamera.zoomRatio); 
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
    const player1Node = cc.instantiate(self.player1Prefab);
    const player2Node = cc.instantiate(self.player2Prefab);
    Object.assign(self.playersNode,{1: player1Node});
    Object.assign(self.playersNode,{2: player2Node});
    /** init requeired prefab ended */

    self.clientUpsyncFps = 20;
    self.upsyncLoopInterval = null;

    window.reconnectWSWithoutRoomId = function() {
      return  new Promise((resolve,reject) => {
      if (window.clientSessionPingInterval) {
        clearInterval(clientSessionPingInterval);
      }
      window.clearBoundRoomIdInBothVolatileAndPersistentStorage()
      return resolve();
      })
      .then(() =>{
        this.initPersistentSessionClient(this.initAfterWSConncted);
      });
    }

    window.handleClientSessionCloseOrError = function() {
      if(!self.battleState)
        self.alertForGoingBackToLoginScene("Client session closed unexpectedly!", self, true);
    };

    self.initAfterWSConncted = () => {
      self.transitToState(ALL_MAP_STATES.VISUAL);
      const tiledMapIns = self.node.getComponent(cc.TiledMap);
      self.selfPlayerInfo = JSON.parse(cc.sys.localStorage.selfPlayer);
      Object.assign(self.selfPlayerInfo, {
        id: self.selfPlayerInfo.playerId
      });
      self._inputControlEnabled = false;
      self.setupInputControls();

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

      window.handleRoomDownsyncFrame = function(diffFrame) {
        if (ALL_BATTLE_STATES.WAITING != self.battleState && ALL_BATTLE_STATES.IN_BATTLE != self.battleState && ALL_BATTLE_STATES.IN_SETTLEMENT != self.battleState) return;
        const refFrameId = diffFrame.refFrameId;
        if( -99 == refFrameId ) {
          if(self.findingPlayerNode.parent){
            self.findingPlayerNode.parent.removeChild(self.findingPlayerNode);
            self.transitToState(ALL_MAP_STATES.VISUAL);
            for(let i in diffFrame.players) {
              //更新在线玩家信息面板的信息
              const playerInfo = diffFrame.players[i];
              const playersScriptIns = self.playersInfoNode.getComponent("PlayersInfo");
              playersScriptIns.updateData(playerInfo);
            }
          }
          self.showPopopInCanvas(self.countdownToBeginGameNode);
          return;
        } else if( -98 == refFrameId ) {
          self.showPopopInCanvas(self.findingPlayerNode);
          return;
        }
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
        if (countdownNanos < 0) countdownNanos = 0;
        const countdownSeconds = parseInt(countdownNanos / 1000000000);
        if (isNaN(countdownSeconds)) {
          cc.log(`countdownSeconds is NaN for countdownNanos == ${countdownNanos}.`);
        }
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
        self.treasureInfoDict = {};
        const treasures = roomDownsyncFrame.treasures;
        const treasuresLocalIdStrList = Object.keys(treasures);
        for (let i = 0; i < treasuresLocalIdStrList.length; ++i) {
          const k = treasuresLocalIdStrList[i];
          const treasureLocalIdInBattle = parseInt(k);
          const treasureInfo = treasures[k];
          self.treasureInfoDict[treasureLocalIdInBattle] = treasureInfo;
        }

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
            self.popupSimplePressToGo("Battle started!");
          }
          self.onBattleStarted();
        }
        self.lastRoomDownsyncFrameId = frameId;
        // TODO: Inject a NetworkDoctor as introduced in https://app.yinxiang.com/shard/s61/nl/13267014/5c575124-01db-419b-9c02-ec81f78c6ddc/.
      };
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
    const canvasNode = self.canvasNode;
    self.spawnSelfPlayer();
    self.upsyncLoopInterval = setInterval(self._onPerUpsyncFrame.bind(self), self.clientUpsyncFps);
    self.transitToState(ALL_MAP_STATES.VISUAL);
    self.enableInputControls();
    if(self.countdownToBeginGameNode.parent) {
      self.countdownToBeginGameNode.parent.removeChild(self.countdownToBeginGameNode);
      self.transitToState(ALL_MAP_STATES.VISUAL);
    }
  },

  onBattleStopped(players) {
    const self = this;
    const canvasNode = self.canvasNode;
    const resultPanelNode = self.resultPanelNode;
    const resultPanelScriptIns =  resultPanelNode.getComponent("ResultPanel");
    resultPanelScriptIns.showPlayerInfo(players);
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

    setLocalZOrder(newPlayerNode, 5);
    instance.selfPlayerNode = newPlayerNode;
    instance.selfPlayerScriptIns = newPlayerNode.getComponent("SelfPlayer");
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

    let toRemovePlayerNodeDict = {};
    Object.assign(toRemovePlayerNodeDict, self.otherPlayerNodeDict);

    let toRemoveTreasureNodeDict = {};
    Object.assign(toRemoveTreasureNodeDict, self.treasureNodeDict);

    let toRemoveTrapNodeDict = {};
    Object.assign(toRemoveTrapNodeDict, self.trapNodeDict);

    let toRemoveBulletNodeDict = {};
    Object.assign(toRemoveBulletNodeDict, self.trapBulletNodeDict);

    for (let k in self.otherPlayerCachedDataDict) {
      const playerId = parseInt(k);
      const cachedPlayerData = self.otherPlayerCachedDataDict[playerId];
      const newPos = cc.v2(
        cachedPlayerData.x,
        cachedPlayerData.y
      );
     //更新信息
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

      if (null != toRemovePlayerNodeDict[playerId]) {
        delete toRemovePlayerNodeDict[playerId];
      }
      if (0 != cachedPlayerData.dir.dx || 0 != cachedPlayerData.dir.dy) {
        const newScheduledDirection = self.ctrl.discretizeDirection(cachedPlayerData.dir.dx, cachedPlayerData.dir.dy, self.ctrl.joyStickEps);
        targetNode.getComponent("SelfPlayer").scheduleNewDirection(newScheduledDirection, false /* DON'T interrupt playing anim. */ );
      }
      const oldPos = cc.v2(
        targetNode.x,
        targetNode.y
      );
      const toMoveByVec = newPos.sub(oldPos);
      const toMoveByVecMag = toMoveByVec.mag();
      const toTeleportDisThreshold = (cachedPlayerData.speed * dt * 100);
      const notToMoveDisThreshold = (cachedPlayerData.speed * dt * 0.5);
      if (toMoveByVecMag < notToMoveDisThreshold) {
        targetNode.getComponent("SelfPlayer").activeDirection = {
          dx: 0,
          dy: 0
        };
      } else {
        if (toMoveByVecMag >= toTeleportDisThreshold) {
          cc.log(`Player ${cachedPlayerData.id} is teleporting! Having toMoveByVecMag == ${toMoveByVecMag}, toTeleportDisThreshold == ${toTeleportDisThreshold}`);
          targetNode.getComponent("SelfPlayer").activeDirection = {
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
          targetNode.getComponent("SelfPlayer").activeDirection = normalizedDir;
        }
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
      }else {
        targetNode.setPosition(newPos);
      }
      if (null != toRemoveBulletNodeDict[bulletLocalIdInBattle]) {
        delete toRemoveBulletNodeDict[bulletLocalIdInBattle];
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

    // Coping with removed treasures.
    for (let k in toRemoveTreasureNodeDict) {
      const treasureLocalIdInBattle = parseInt(k);
      const treasureScriptIns = toRemoveTreasureNodeDict[k].getComponent("Treasure");
      treasureScriptIns.playPickedUpAnimAndDestroy();
      delete self.treasureNodeDict[treasureLocalIdInBattle];
    }

    // Coping with removed traps.
    for (let k in toRemoveTrapNodeDict) {
      const trapLocalIdInBattle = parseInt(k);
      toRemoveTrapNodeDict[k].parent.removeChild(toRemoveTrapNodeDict[k]);
      delete self.trapNodeDict[trapLocalIdInBattle];
    }

    // Coping with removed bullets.
    for (let k in toRemoveBulletNodeDict) {
      const bulletLocalIdInBattle = parseInt(k);
      toRemoveBulletNodeDict[k].parent.removeChild(toRemoveBulletNodeDict[k]);
      delete self.trapBulletNodeDict[bulletLocalIdInBattle];
    }
  },

  transitToState(s) {
    const self = this;
    self.state = s;
  },

  logout(byClick /* The case where this param is "true" will be triggered within `ConfirmLogout.js`.*/ , shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage) {
    const localClearance = function() {
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
    if(cb){ 
      cb()
    } 
    initPersistentSessionClient(self.initAfterWSConncted);
  },

  showPopopInCanvas(toShowNode) {
    const self = this;
    self.disableInputControls();
    self.transitToState(ALL_MAP_STATES.SHOWING_MODAL_POPUP);
    safelyAddChild(self.widgetsAboveAllNode, toShowNode);
    setLocalZOrder(toShowNode, 10);
  },

});
