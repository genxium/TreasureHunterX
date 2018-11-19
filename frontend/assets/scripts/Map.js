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
    canvasNode: {
      type: cc.Node,
      default: null,
    },
    tiledAnimPrefab: {
      type: cc.Prefab,
      default: null,
    },
    selfPlayerPrefab: {
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
    npcPlayerPrefab: {
      type: cc.Prefab,
      default: null,
    },
    type2NpcPlayerPrefab: {
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
      type:cc.Prefab,
      default: null
    },
    trapBulletPrefab: {
      type:cc.Prefab,
      default: null
    },

  },

  _onPerUpsyncFrame() {
    const instance = this;
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
    };
    const wrapped = {
      msgId: Date.now(),
      act: "PlayerUpsyncCmd",
      data: upsyncFrameData,
    }
    window.sendSafely(JSON.stringify(wrapped));
  },

  // LIFE-CYCLE CALLBACKS:
  onDestroy() {
    const self = this;
    if (self.upsyncLoopInterval) {
      clearInterval(self.upsyncLoopInterval);
    }
    if (self.inputControlTimer) {
      clearInterval(self.inputControlTimer)
    }
  },

  popupSimplePressToGo(labelString) {
    const self = this;
    if (ALL_MAP_STATES.VISUAL != self.state) {
      return;
    }
    self.state = ALL_MAP_STATES.SHOWING_MODAL_POPUP;

    const canvasNode = self.canvasNode;
    const simplePressToGoDialogNode = cc.instantiate(self.simplePressToGoDialogPrefab);
    simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
    simplePressToGoDialogNode.setScale(1 / canvasNode.getScale());
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
    simplePressToGoDialogNode.setScale(1 / canvasNode.getScale());
    safelyAddChild(canvasNode, simplePressToGoDialogNode);
  },

  alertForGoingBackToLoginScene(labelString, mapIns, shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage) {
    const millisToGo = 3000;
    mapIns.popupSimplePressToGo(cc.js.formatStr("%s Will logout in %s seconds.", labelString, millisToGo / 1000));
    setTimeout(() => {
      mapIns.logout(false, shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage);
    }, millisToGo);
  },

  //onLoad
  onLoad() {
    const self = this;
    self.lastRoomDownsyncFrameId = 0;

    cc.director.getCollisionManager().enabled = true;
    cc.director.getCollisionManager().enabledDebugDraw = CC_DEBUG;
    self.selfPlayerNode = null;
    self.selfPlayerScriptIns = null;
    self.selfPlayerInfo = null;
    self.upsyncLoopInterval = null;

    const mapNode = self.node;
    const canvasNode = mapNode.parent;
    cc.director.getCollisionManager().enabled = true;
    cc.director.getCollisionManager().enabledDebugDraw = CC_DEBUG;

    self.battleState = ALL_BATTLE_STATES.WAITING;
    self.otherPlayerCachedDataDict = {};
    self.otherPlayerNodeDict = {};
    self.treasureInfoDict = {};
    self.treasureNodeDict = {};
    self.trapInfoDict = {};
    self.trapBulletInfoDict = {};
    self.trapBulletNodeDict = {};
    self.trapNodeDict = {};
    self.scoreInfoDict = {};
    self.confirmLogoutNode = cc.instantiate(self.confirmLogoutPrefab);
    self.confirmLogoutNode.getComponent("ConfirmLogout").mapNode = self.node;
    self.confirmLogoutNode.width = canvasNode.width;
    self.confirmLogoutNode.height = canvasNode.height;

    self.clientUpsyncFps = 20;
    self.upsyncLoopInterval = null;

    window.handleClientSessionCloseOrError = function() {
      self.alertForGoingBackToLoginScene("Client session closed unexpectedly!", self, true);
    };

    initPersistentSessionClient(() => {
      self.state = ALL_MAP_STATES.VISUAL;
      const tiledMapIns = self.node.getComponent(cc.TiledMap);
      self.selfPlayerInfo = JSON.parse(cc.sys.localStorage.selfPlayer);
      Object.assign(self.selfPlayerInfo, {
        id: self.selfPlayerInfo.playerId
      });
      this._inputControlEnabled = false;
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

      if (this.joystickInputControllerNode.parent !== this.node.parent.parent.getChildByName('JoystickContainer')) {
        this.joystickInputControllerNode.parent = this.node.parent.parent.getChildByName('JoystickContainer');
      }
      this.joystickInputControllerNode.parent.width = this.node.parent.width * 0.5;
      this.joystickInputControllerNode.parent.height = this.node.parent.height;
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

      window.handleRoomDownsyncFrame = function(roomDownsyncFrame) {
        if (ALL_BATTLE_STATES.WAITING != self.battleState && ALL_BATTLE_STATES.IN_BATTLE != self.battleState && ALL_BATTLE_STATES.IN_SETTLEMENT != self.battleState) return;

        const frameId = roomDownsyncFrame.id;
        if (frameId <= self.lastRoomDownsyncFrameId) {
          // Log the obsolete frames?
          return;
        }
        if (roomDownsyncFrame.countdownNanos == -1) {
          self.onBattleStopped();
          return;
        }
        self.countdownLabel.string = parseInt(roomDownsyncFrame.countdownNanos / 1000000000).toString();
        const sentAt = roomDownsyncFrame.sentAt;
        const refFrameId = roomDownsyncFrame.refFrameId;
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

//初始化trapInfo
        self.trapInfoDict = {};
        const traps = roomDownsyncFrame.traps;
        const trapsLocalIdStrList = Object.keys(traps);
        for (let i = 0; i < trapsLocalIdStrList.length; ++i) {
          const k = trapsLocalIdStrList[i];
          const trapLocalIdInBattle = parseInt(k);
          const trapInfo = traps[k];
          self.trapInfoDict[trapLocalIdInBattle] = trapInfo;
        }

//初始化trapBulletsInfo
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
      // TODO: Cope with FullFrame reconstruction by `refFrameId` and a cache of recent FullFrames.
      // TODO: Inject a NetworkDoctor as introduced in https://app.yinxiang.com/shard/s61/nl/13267014/5c575124-01db-419b-9c02-ec81f78c6ddc/.
      };
    });
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
    self.spawnSelfPlayer();
    self.upsyncLoopInterval = setInterval(self._onPerUpsyncFrame.bind(self), self.clientUpsyncFps);
    self.enableInputControls();
  },

  onBattleStopped() {
    const self = this;
    self.selfPlayerScriptIns.scheduleNewDirection({
      dx: 0,
      dy: 0
    });
    self.disableInputControls();
    self.battleState = ALL_BATTLE_STATES.IN_SETTLEMENT;
    self.alertForGoingBackToLoginScene("Battle stopped!", self, false);
  },

  spawnSelfPlayer() {
    const instance = this;
    const newPlayerNode = cc.instantiate(instance.selfPlayerPrefab);
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
      self.selfPlayerIdLabel.string = self.selfPlayerInfo.id;
      const score  = self.selfPlayerInfo.score ? self.selfPlayerInfo.score : 0 
      self.selfPlayerScoreLabel.string = score;
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
     //显示分数
     if(!self.scoreInfoDict[playerId]){
        const scoreNode = cc.instantiate(self.otherPlayerScoreIndicatorPrefab);  
        const debugInfoNode = canvasParentNode.getChildByName("DebugInfo");
        scoreNode.getChildByName("title").getComponent(cc.Label).string = "player"+cachedPlayerData.id+"'s score:";
        safelyAddChild(debugInfoNode,scoreNode);
        self.scoreInfoDict[playerId] = scoreNode;
      }
      const playerScore  = !cachedPlayerData.score ? cachedPlayerData.score  : 0 
      self.scoreInfoDict[playerId].getChildByName("OtherPlayerScoreLabel").getComponent(cc.Label).string = playerScore;
      let targetNode = self.otherPlayerNodeDict[playerId];
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
        trapInfo.pickupBoundary.anchor.x,
        trapInfo.pickupBoundary.anchor.y
      );
      let targetNode = self.trapNodeDict[trapLocalIdInBattle];
      if (!targetNode) {
        targetNode = cc.instantiate(self.trapPrefab);
        self.trapNodeDict[trapLocalIdInBattle] = targetNode;
        safelyAddChild(mapNode, targetNode);
        targetNode.setPosition(newPos);
        setLocalZOrder(targetNode, 5);
        //初始化trap的标记
        const pickupBoundary = trapInfo.pickupBoundary;
        const anchor = pickupBoundary.anchor; 
        const newColliderIns = targetNode.getComponent(cc.PolygonCollider);
        newColliderIns.points = [];
           for (let point of pickupBoundary.points) {
             const p = cc.v2(parseFloat(point.x), parseFloat(point.y));
             newColliderIns.points.push(p);
           }
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
        bulletInfo.immediatePosition.x,
        bulletInfo.immediatePosition.y
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
        treasureInfo.pickupBoundary.anchor.x,
        treasureInfo.pickupBoundary.anchor.y
      );
      let targetNode = self.treasureNodeDict[treasureLocalIdInBattle];
      if (!targetNode) {
        targetNode = cc.instantiate(self.treasurePrefab);
        self.treasureNodeDict[treasureLocalIdInBattle] = targetNode;
        safelyAddChild(mapNode, targetNode);
        targetNode.setPosition(newPos);
        setLocalZOrder(targetNode, 5);
        //初始化treasure的标记
        const pickupBoundary = treasureInfo.pickupBoundary;
        const anchor = pickupBoundary.anchor; 
        const newColliderIns = targetNode.getComponent(cc.PolygonCollider);
        newColliderIns.points = [];
           for (let point of pickupBoundary.points) {
             const p = cc.v2(parseFloat(point.x), parseFloat(point.y));
             newColliderIns.points.push(p);
           }
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
      toRemoveTreasureNodeDict[k].parent.removeChild(toRemoveTreasureNodeDict[k]);
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
    self.disableInputControls();
    self.transitToState(ALL_MAP_STATES.SHOWING_MODAL_POPUP);
    const canvasNode = self.canvasNode;
    self.confirmLogoutNode.setScale(1 / canvasNode.getScale());
    safelyAddChild(canvasNode, self.confirmLogoutNode);
    setLocalZOrder(self.confirmLogoutNode, 10);
  },

  onLogoutConfirmationDismissed() {
    const self = this;
    self.transitToState(ALL_MAP_STATES.VISUAL);
    const canvasNode = self.canvasNode;
    canvasNode.removeChild(self.confirmLogoutNode);
    self.enableInputControls();
  },
});
