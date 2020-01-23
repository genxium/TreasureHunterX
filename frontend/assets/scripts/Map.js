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

window.MAGIC_ROOM_DOWNSYNC_FRAME_ID = {
  BATTLE_READY_TO_START: -99,
  PLAYER_ADDED_AND_ACKED: -98,
  PLAYER_READDED_AND_ACKED: -97,
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
    speedShoePrefab: {
      type: cc.Prefab,
      default: null,
    },
    polygonBoundaryBarrierPrefab: {
      type: cc.Prefab,
      default: null,
    },
    polygonBoundaryShelterPrefab: {
      type: cc.Prefab,
      default: null,
    },
    polygonBoundaryShelterZReducerPrefab: {
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
    guardTowerPrefab: {
      type: cc.Prefab,
      default: null
    },
    forceBigEndianFloatingNumDecoding: {
      default: false,
    },
    backgroundMapTiledIns: {
      type: cc.TiledMap,
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
      guardTowers: refFullFrame.guardTowers,
    };
    const players = diffFrame.players;
    const playersLocalIdStrList = Object.keys(players);
    for (let i = 0; i < playersLocalIdStrList.length; ++i) {
      const k = playersLocalIdStrList[i];
      const playerId = parseInt(k);
      if (true == diffFrame.players[playerId].removed) {
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
        // console.log("Bullet with localIdInBattle == ", bulletLocalIdInBattle, "is removed.");
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
      delete self.recentFrameCache[toDelFrameId];
      --self.recentFrameCacheCurrentSize;
    }
    self.recentFrameCache[fullFrame.id] = fullFrame;
    ++self.recentFrameCacheCurrentSize;
  },

  _onPerUpsyncFrame() {
    const instance = this;
    const ackingFrameId = (instance.resyncing ? 0 : instance.lastRoomDownsyncFrameId);
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
      ackingFrameId: ackingFrameId,
    };
    const wrapped = {
      msgId: Date.now(),
      act: "PlayerUpsyncCmd",
      data: upsyncFrameData,
    }
    window.sendSafely(JSON.stringify(wrapped));
  },

  onEnable() {
    cc.log("+++++++ Map onEnable()");
  },

  onDisable() {
    cc.log("+++++++ Map onDisable()");
  },

  onDestroy() {
    const self = this;
    console.warn("+++++++ Map onDestroy()");
    if (null == self.battleState || ALL_BATTLE_STATES.WAITING == self.battleState) {
      window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
    }
    if (null != window.handleRoomDownsyncFrame) {
      window.handleRoomDownsyncFrame = null;
    }
    if (null != window.handleBattleColliderInfo) {
      window.handleBattleColliderInfo = null;
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
    if (self.testOnlyResyncInterval) {
      clearInterval(self.testOnlyResyncInterval);
    }
    self.closeBottomBannerAd();
  },

  _lazilyTriggerResync() {
    if (true == this.resyncing) return;
    this.lastResyncingStartedAt = Date.now();
    this.resyncing = true; // Will keep `this._onPerUpsyncFrame()` sending `ackingFrameId == 0` till the invocation of `this._onResyncCompleted()`. 

    console.warn("_lazilyTriggerResync, resyncing");

    if (ALL_MAP_STATES.SHOWING_MODAL_POPUP != this.state) {
      if (null == this.resyncingHintPopup) {
        this.resyncingHintPopup = this.popupSimplePressToGo(i18n.t("gameTip.resyncing"), true);
      }
    }
  },

  _onResyncCompleted() {
    if (false == this.resyncing) return;
    this.resyncing = false;
    const resyncingDurationMillis = (Date.now() - this.lastResyncingStartedAt);
    console.warn("_onResyncCompleted, resyncing took ", resyncingDurationMillis, " milliseconds.");
    if (null != this.resyncingHintPopup && this.resyncingHintPopup.parent) {
      this.resyncingHintPopup.parent.removeChild(this.resyncingHintPopup);
      if (ALL_MAP_STATES.SHOWING_MODAL_POPUP == this.state) {
        this.transitToState(ALL_MAP_STATES.VISUAL);
      }
    }
  },

  popupSimplePressToGo(labelString, hideYesButton) {
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

    if (true == hideYesButton) {
      yesButton.active = false;
    }

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

    // Clearing previous info of otherPlayers. [BEGINS]
    if (self.otherPlayerNodeDict) {
      for (let i in self.otherPlayerNodeDict) {
        let node = self.otherPlayerNodeDict[i];
        if (node.parent) {
          node.parent.removeChild(node);
        }
      }
    }
    self.otherPlayerCachedDataDict = {};
    self.otherPlayerNodeDict = {};
    // Clearing previous info of otherPlayers. [ENDS]

    // Clearing previous info of selfPlayer. [BEGINS]
    if (self.selfPlayerNode && self.selfPlayerNode.parent) {
      self.selfPlayerNode.parent.removeChild(self.selfPlayerNode);
    }
    self.selfPlayerNode = null;
    self.selfPlayerScriptIns = null;
    self.selfPlayerInfo = null;
    // Clearing previous info of selfPlayer. [ENDS]

    // Clearing previous info of towers. [BEGINS]
    if (self.guardTowerNodeDict) {
      for (let i in self.guardTowerNodeDict) {
        let node = self.guardTowerNodeDict[i];
        if (node.parent) {
          node.parent.removeChild(node);
        }
      }
    }
    self.guardTowerInfoDict = {};
    self.guardTowerNodeDict = {};
    // Clearing previous info of towers. [ENDS]

    // Clearing previous info of treasures. [BEGINS]
    if (self.treasureNodeDict) {
      for (let i in self.treasureNodeDict) {
        let node = self.treasureNodeDict[i];
        if (node.parent) {
          node.parent.removeChild(node);
        }
      }
    }
    self.treasureInfoDict = {};
    self.treasureNodeDict = {};
    // Clearing previous info of treasures. [ENDS]

    // Clearing previous info of bullets. [BEGINS]
    if (self.trapBulletNodeDict) {
      for (let i in self.trapBulletNodeDict) {
        let node = self.trapBulletNodeDict[i];
        if (node.parent) {
          node.parent.removeChild(node);
        }
      }
    }
    self.trapBulletInfoDict = {};
    self.trapBulletNodeDict = {};
    // Clearing previous info of bullets. [ENDS]

    // Clearing previous info of traps. [BEGINS]
    if (self.trapNodeDict) {
      for (let i in self.trapNodeDict) {
        let node = self.trapNodeDict[i];
        if (node.parent) {
          node.parent.removeChild(node);
        }
      }
    }
    self.trapInfoDict = {};
    self.trapNodeDict = {};
    // Clearing previous info of traps. [BEGINS]

    // Clearing previous info of speedShoes. [BEGINS]
    if (self.speedShoeNodeDict) {
      for (let i in self.speedShoeNodeDict) {
        let node = self.speedShoeNodeDict[i];
        if (node.parent) {
          node.parent.removeChild(node);
        }
      }
    }
    self.speedShoeInfoDict = {};
    self.speedShoeNodeDict = {};
    // Clearing previous info of speedShoes. [ENDS]

    if (self.upsyncLoopInterval) {
      clearInterval(self.upsyncLoopInterval);
    }

    self.resyncing = false;
    self.lastRoomDownsyncFrameId = 0;

    self.recentFrameCache = {};
    self.recentFrameCacheCurrentSize = 0;
    self.recentFrameCacheMaxCount = 2048;
    self.upsyncLoopInterval = null;
    self.transitToState(ALL_MAP_STATES.VISUAL);

    self.battleState = ALL_BATTLE_STATES.WAITING;

    if (self.findingPlayerNode) {
      const findingPlayerScriptIns = self.findingPlayerNode.getComponent("FindingPlayer");
      findingPlayerScriptIns.init();
    }
    safelyAddChild(self.widgetsAboveAllNode, self.playersInfoNode);
    safelyAddChild(self.widgetsAboveAllNode, self.findingPlayerNode);
  },

  onLoad() {
    const self = this;
    window.mapIns = self;
    window.forceBigEndianFloatingNumDecoding = self.forceBigEndianFloatingNumDecoding;

    console.warn("+++++++ Map onLoad()");
    window.handleClientSessionCloseOrError = function() {
      console.warn('+++++++ Common handleClientSessionCloseOrError()');

      if (ALL_BATTLE_STATES.IN_SETTLEMENT == self.battleState) { //如果是游戏时间结束引起的断连
        console.log("游戏结束引起的断连, 不需要回到登录页面");
      } else {
        console.warn("意外断连，即将回到登录页面");
        window.clearLocalStorageAndBackToLoginScene(true);
      }
    };

    const mapNode = self.node;
    const canvasNode = mapNode.parent;
    cc.director.getCollisionManager().enabled = true;
    cc.director.getCollisionManager().enabledDebugDraw = CC_DEBUG;
    // self.musicEffectManagerScriptIns = self.node.getComponent("MusicEffectManager");
    self.musicEffectManagerScriptIns = null;

    /** Init required prefab started. */
    self.confirmLogoutNode = cc.instantiate(self.confirmLogoutPrefab);
    self.confirmLogoutNode.getComponent("ConfirmLogout").mapNode = self.node;

    // Initializes Result panel.
    self.resultPanelNode = cc.instantiate(self.resultPanelPrefab);
    self.resultPanelNode.width = self.canvasNode.width;
    self.resultPanelNode.height = self.canvasNode.height;

    const resultPanelScriptIns = self.resultPanelNode.getComponent("ResultPanel");
    resultPanelScriptIns.mapScriptIns = self;
    resultPanelScriptIns.onAgainClicked = () => {
      self.battleState = ALL_BATTLE_STATES.WAITING; 
      window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
      window.initPersistentSessionClient(self.initAfterWSConnected, null /* Deliberately NOT passing in any `expectedRoomId`. -- YFLu */ );
    };
    resultPanelScriptIns.onCloseDelegate = () => {
      self.closeBottomBannerAd();
    };

    self.gameRuleNode = cc.instantiate(self.gameRulePrefab);
    self.gameRuleNode.width = self.canvasNode.width;
    self.gameRuleNode.height = self.canvasNode.height;

    self.gameRuleScriptIns = self.gameRuleNode.getComponent("GameRule");
    self.gameRuleScriptIns.mapNode = self.node;

    self.findingPlayerNode = cc.instantiate(self.findingPlayerPrefab);
    self.findingPlayerNode.width = self.canvasNode.width;
    self.findingPlayerNode.height = self.canvasNode.height;
    const findingPlayerScriptIns = self.findingPlayerNode.getComponent("FindingPlayer");
    findingPlayerScriptIns.init();

    self.playersInfoNode = cc.instantiate(self.playersInfoPrefab);

    self.countdownToBeginGameNode = cc.instantiate(self.countdownToBeginGamePrefab);
    self.countdownToBeginGameNode.width = self.canvasNode.width;
    self.countdownToBeginGameNode.height = self.canvasNode.height;

    self.mainCameraNode = canvasNode.getChildByName("Main Camera");
    self.mainCamera = self.mainCameraNode.getComponent(cc.Camera);
    for (let child of self.mainCameraNode.children) {
      child.setScale(1 / self.mainCamera.zoomRatio);
    }
    self.widgetsAboveAllNode = self.mainCameraNode.getChildByName("WidgetsAboveAll");
    self.mainCameraNode.setPosition(cc.v2());

    self.playersNode = {};
    const player1Node = cc.instantiate(self.player1Prefab);
    const player2Node = cc.instantiate(self.player2Prefab);
    Object.assign(self.playersNode, {
      1: player1Node
    });
    Object.assign(self.playersNode, {
      2: player2Node
    });

    /** Init required prefab ended. */

    self.clientUpsyncFps = 20;

    window.handleBattleColliderInfo = function(parsedBattleColliderInfo) {
      console.log(parsedBattleColliderInfo);

      self.battleColliderInfo = parsedBattleColliderInfo; 
      const tiledMapIns = self.node.getComponent(cc.TiledMap);

      const fullPathOfTmxFile = cc.js.formatStr("map/%s/map", parsedBattleColliderInfo.stageName);
      cc.loader.loadRes(fullPathOfTmxFile, cc.TiledMapAsset, (err, tmxAsset) => {
        if (null != err) {
          console.error(err);
          return;
        }
        
        /*
        [WARNING] 
        
        - The order of the following statements is important, because we should have finished "_resetCurrentMatch" before the first "RoomDownsyncFrame". 
        - It's important to assign new "tmxAsset" before "extractBoundaryObjects => initMapNodeByTiledBoundaries", to ensure that the correct tilesets are used.
        - To ensure clearance, put destruction of the "cc.TiledMap" component preceding that of "mapNode.destroyAllChildren()".

        -- YFLu, 2019-09-07

        */

        tiledMapIns.tmxAsset = null;
        mapNode.removeAllChildren();
        self._resetCurrentMatch(); // Will set "self.selfPlayerInfo" and remove the residual nodes of previous battle within. 

        tiledMapIns.tmxAsset = tmxAsset;
        const newMapSize = tiledMapIns.getMapSize();
        const newTileSize = tiledMapIns.getTileSize();
        self.node.setContentSize(newMapSize.width*newTileSize.width, newMapSize.height*newTileSize.height);
        self.node.setPosition(cc.v2(0, 0));
        /*
        * Deliberately hiding "ImageLayer"s. This dirty fix is specific to "CocosCreator v2.2.1", where it got back the rendering capability of "ImageLayer of Tiled", yet made incorrectly. In this game our "markers of ImageLayers" are rendered by dedicated prefabs with associated colliders.
        *
        * -- YFLu, 2020-01-23
        */
        const existingImageLayers = tiledMapIns.getObjectGroups();
        for (let singleImageLayer of existingImageLayers) {
          singleImageLayer.node.opacity = 0;  
        }

        const boundaryObjs = tileCollisionManager.extractBoundaryObjects(self.node);
        tileCollisionManager.initMapNodeByTiledBoundaries(self, mapNode, boundaryObjs);
      

        self.selfPlayerInfo = JSON.parse(cc.sys.localStorage.getItem('selfPlayer'));
        Object.assign(self.selfPlayerInfo, {
          id: self.selfPlayerInfo.playerId
        });

        const fullPathOfBackgroundMapTmxFile = cc.js.formatStr("map/%s/BackgroundMap/map", parsedBattleColliderInfo.stageName);
        cc.loader.loadRes(fullPathOfBackgroundMapTmxFile, cc.TiledMapAsset, (err, backgroundMapTmxAsset) => {
          if (null != err) {
            console.error(err);
            return;
          }

          self.backgroundMapTiledIns.tmxAsset = null;
          self.backgroundMapTiledIns.node.removeAllChildren();
          self.backgroundMapTiledIns.tmxAsset = backgroundMapTmxAsset;
          const newBackgroundMapSize = self.backgroundMapTiledIns.getMapSize();
          const newBackgroundMapTileSize = self.backgroundMapTiledIns.getTileSize();
          self.backgroundMapTiledIns.node.setContentSize(newBackgroundMapSize.width*newBackgroundMapTileSize.width, newBackgroundMapSize.height*newBackgroundMapTileSize.height);
          self.backgroundMapTiledIns.node.setPosition(cc.v2(0, 0));

          const wrapped = {
            msgId: Date.now(),
            act: "PlayerBattleColliderAck",
            data: {},
          }
          window.sendSafely(JSON.stringify(wrapped));
        });
      });
    };

    self.initAfterWSConnected = () => {
      const self = window.mapIns;
      self.hideGameRuleNode();
      self.transitToState(ALL_MAP_STATES.WAITING);
      self._inputControlEnabled = false;
      self.setupInputControls();

      let cachedPlayerMetas = {};

      window.handleRoomDownsyncFrame = function(diffFrame) {
        /*
         Right upon establishment of the "PersistentSessionClient", we should receive an initial signal "BattleColliderInfo" earlier than any "RoomDownsyncFrame" containing "PlayerMeta" data. 
      
          -- YFLu, 2019-09-05
        */ 
        if (ALL_BATTLE_STATES.WAITING != self.battleState
          && ALL_BATTLE_STATES.IN_BATTLE != self.battleState
          && ALL_BATTLE_STATES.IN_SETTLEMENT != self.battleState) {
          return;
        }
        const refFrameId = diffFrame.refFrameId;
        if (window.MAGIC_ROOM_DOWNSYNC_FRAME_ID.BATTLE_READY_TO_START == refFrameId) {
          // 显示倒计时
          self.playersMatched(diffFrame.playerMetas);
          cachedPlayerMetas = diffFrame.playerMetas;
          // 隐藏返回按钮
          const findingPlayerScriptIns = self.findingPlayerNode.getComponent("FindingPlayer");
          findingPlayerScriptIns.hideExitButton();
        } else if (window.MAGIC_ROOM_DOWNSYNC_FRAME_ID.PLAYER_ADDED_AND_ACKED == refFrameId) {
          // 显示匹配玩家
          if (window.initWxSdk) {
            window.initWxSdk();
          }
          const findingPlayerScriptIns = self.findingPlayerNode.getComponent("FindingPlayer");
          if (!self.findingPlayerNode.parent) {
            self.showPopupInCanvas(self.findingPlayerNode);
          }
          self.openBottomBannerAd(function() {
            if (null != self.bottomBannerAd) {
              self.bottomBannerAd.autoDisappearTimmer = setTimeout(function() {
                self.closeBottomBannerAd();
              }, 10000);
            }
          });
          findingPlayerScriptIns.updatePlayersInfo(diffFrame.playerMetas);
          cachedPlayerMetas = diffFrame.playerMetas;
          return;
        } else if (window.MAGIC_ROOM_DOWNSYNC_FRAME_ID.PLAYER_READDED_AND_ACKED == refFrameId) {
          cachedPlayerMetas = diffFrame.playerMetas;
          /*
          [WARNING]
          
          In this case, we're definitely in an active battle, thus the "self.findingPlayerNode" should hidden if being presented. 

          -- YFLu, 2019-09-05
          */

          if (self.findingPlayerNode && self.findingPlayerNode.parent) {
            self.findingPlayerNode.parent.removeChild(self.findingPlayerNode);
            self.transitToState(ALL_MAP_STATES.VISUAL);
            if (self.playersInfoNode) {
              for (let i in cachedPlayerMetas) {
                const playerMeta = cachedPlayerMetas[i];
                const playersInfoScriptIns = self.playersInfoNode.getComponent("PlayersInfo");
                playersInfoScriptIns.updateData(playerMeta);
              }
            }
          }
          return;
        } else {
          // Deliberately left blank.
        }

        const frameId = diffFrame.id;
        if (frameId <= self.lastRoomDownsyncFrameId) {
          // Log the obsolete frames?
          return;
        }
        const isInitiatingFrame = (0 >= self.recentFrameCacheCurrentSize || 0 == refFrameId);
        const cachedFullFrame = self.recentFrameCache[refFrameId];

        const missingRequiredRefFrameCache = (false == isInitiatingFrame
          &&
          (refFrameId > 0 || 0 < self.recentFrameCacheCurrentSize) // Critical condition to differentiate between "BattleStarted" or "ShouldResync".
          &&
          null == cachedFullFrame
        );
        if (self.useDiffFrameAlgo && missingRequiredRefFrameCache) {
          self._lazilyTriggerResync();
          return;
        }

        if (true == self.resyncing) {
          if (isInitiatingFrame && 0 == refFrameId) {
            // Reaching here implies that you've received the resync frame.
            self._onResyncCompleted();
          } else {
            return;
          }
        }
        let countdownNanos = diffFrame.countdownNanos;
        if (countdownNanos < 0) {
          countdownNanos = 0;
        }
        const countdownSeconds = parseInt(countdownNanos / 1000000000);
        if (isNaN(countdownSeconds)) {
          console.warn(`countdownSeconds is NaN for countdownNanos == ${countdownNanos}.`);
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
          self.onBattleStopped(cachedPlayerMetas, roomDownsyncFrame.players);
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
            const immediateSelfPlayerMeta = cachedPlayerMetas[k];
            Object.assign(self.selfPlayerInfo, {
              displayName: (null == immediateSelfPlayerMeta.displayName ? (null == immediateSelfPlayerMeta.name ? "" : immediateSelfPlayerMeta.name) : immediateSelfPlayerMeta.displayName),
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
          Object.assign(anotherPlayer, cachedPlayerMetas[k]);
          // Note that this callback is invoked in the NetworkThread, and the rendering should be executed in the GUIThread, e.g. within `update(dt)`.
          self.otherPlayerCachedDataDict[playerId] = anotherPlayer;
        }

        // update `treasureInfoDict`
        self.treasureInfoDict = {};
        const treasures = roomDownsyncFrame.treasures;
        const treasuresLocalIdStrList = Object.keys(treasures);
        for (let i = 0; i < treasuresLocalIdStrList.length; ++i) { //直接根据最新帧的数据覆盖掉treasureInfoDict
          const k = treasuresLocalIdStrList[i];
          const treasureLocalIdInBattle = parseInt(k);
          const treasureInfo = treasures[k];
          self.treasureInfoDict[treasureLocalIdInBattle] = treasureInfo;
        }

        // update `speedShoeInfoDict`
        self.speedShoeInfoDict = {};
        const speedShoes = roomDownsyncFrame.speedShoes;
        const speedShoeLocalIdStrList = Object.keys(speedShoes);
        for (let i = 0; i < speedShoeLocalIdStrList.length; ++i) {
          const k = speedShoeLocalIdStrList[i];
          const speedShoeLocalIdInBattle = parseInt(k);
          const speedShoeInfo = speedShoes[k];
          self.speedShoeInfoDict[speedShoeLocalIdInBattle] = speedShoeInfo;
        }

        // update `trapInfoDict`
        self.trapInfoDict = {};
        const traps = roomDownsyncFrame.traps;
        const trapsLocalIdStrList = Object.keys(traps);
        for (let i = 0; i < trapsLocalIdStrList.length; ++i) {
          const k = trapsLocalIdStrList[i];
          const trapLocalIdInBattle = parseInt(k);
          const trapInfo = traps[k];
          self.trapInfoDict[trapLocalIdInBattle] = trapInfo;
        }

        // update `trapBulletInfoDict`
        self.trapBulletInfoDict = {};
        const bullets = roomDownsyncFrame.bullets;
        const bulletsLocalIdStrList = Object.keys(bullets);
        for (let i = 0; i < bulletsLocalIdStrList.length; ++i) {
          const k = bulletsLocalIdStrList[i];
          const bulletLocalIdInBattle = parseInt(k);
          const bulletInfo = bullets[k];
          self.trapBulletInfoDict[bulletLocalIdInBattle] = bulletInfo;
        }

        // Update `guardTowerInfoDict`.
        self.guardTowerInfoDict = {};
        const guardTowers = roomDownsyncFrame.guardTowers;
        const ids = Object.keys(guardTowers);
        for (let i = 0; i < ids.length; ++i) {
          const id = ids[i];
          const localIdInBattle = parseInt(id);
          const tower = guardTowers[id];
          self.guardTowerInfoDict[localIdInBattle] = tower;
        }

        if (0 == self.lastRoomDownsyncFrameId) {
          /*
          [WARNING]

          This closure is used even for "resyncing", because "_resetCurrentMatch" is called to set "self.lastRoomDownsyncFrameId =0" 
            within "handleBattleColliderInfo" which was invoked anyway upon "WsSession establishment".
          */ 
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

    // The player is now viewing "self.gameRuleNode" with button(s) to start an actual battle. -- YFLu
    const expectedRoomId = window.getExpectedRoomIdSync();
    const boundRoomId = window.getBoundRoomIdFromPersistentStorage();

    console.warn("Map.onLoad, expectedRoomId == ", expectedRoomId, ", boundRoomId == ", boundRoomId);

    if (null != expectedRoomId) {
      self.disableGameRuleNode();

      /* 
        The player is now possibly viewing "self.gameRuleNode" with no button, and should wait for `self.initAfterWSConnected` to be called. 

        -- YFLu, 2019-09-05
      */
      self.battleState = ALL_BATTLE_STATES.WAITING; 
      window.initPersistentSessionClient(self.initAfterWSConnected, expectedRoomId);
    } else if (null != boundRoomId) {
      self.disableGameRuleNode();
      self.battleState = ALL_BATTLE_STATES.WAITING; 
      window.initPersistentSessionClient(self.initAfterWSConnected, expectedRoomId);
    } else {
      self.showPopupInCanvas(self.gameRuleNode);
      // Deliberately left blank. -- YFLu
    }
    self.bottomBannerAd = null;
  },

  openBottomBannerAd(callback) {
    const self = this;
    if (cc.sys.platform === cc.sys.WECHAT_GAME && null == self.bottomBannerAd) {
      let {windowWidth, windowHeight} = wx.getSystemInfoSync();
      self.bottomBannerAd = self.bottomBannerAd || wx.createBannerAd({
        adUnitId: 'adunit-b1088bf52d58a70d',
        style: {
            left: 1,
            top: 9999,
            // WARNING: 如果宽度铺满屏幕，有些广告会出现顶部有占位框的情况。
            width: windowWidth - 2,
        }
      });
      
      self.bottomBannerAd.onLoad(function() {
        self.bottomBannerAd.style.top = windowHeight - self.bottomBannerAd.style.realHeight;
        self.bottomBannerAd.show().then(function() {
          callback && callback.call(self);
        });
      })
      
      self.bottomBannerAd.onError(function(err) {
        console.log(this, err);
      });
    }
  },

  closeBottomBannerAd() {
    const self = this;
    if (cc.sys.platform === cc.sys.WECHAT_GAME && null != self.bottomBannerAd) {
      if (null != self.bottomBannerAd.autoDisappearTimmer) {
        clearTimeout(self.bottomBannerAd.autoDisappearTimmer);
        self.bottomBannerAd.autoDisappearTimmer = null;
      }
      self.bottomBannerAd.destroy();
      self.bottomBannerAd = null;
    }
  },

  disableGameRuleNode() {
    const self = window.mapIns;
    if (null == self.gameRuleNode) {
      return;
    }
    if (null == self.gameRuleScriptIns) {
      return;
    }
    if (null == self.gameRuleScriptIns.modeButton) {
      return;
    }
    self.gameRuleScriptIns.modeButton.active = false;
  },

  hideGameRuleNode() {
    const self = window.mapIns;
    if (null == self.gameRuleNode) {
      return;
    }
    self.gameRuleNode.active = false;
  },

  setupInputControls() {
    const instance = window.mapIns;
    const mapNode = instance.node;
    const canvasNode = mapNode.parent;
    const joystickInputControllerScriptIns = canvasNode.getComponent("TouchEventsManager");
    const inputControlPollerMillis = (1000 / joystickInputControllerScriptIns.pollerFps);

    const ctrl = joystickInputControllerScriptIns;
    instance.ctrl = ctrl;

    instance.inputControlTimer = setInterval(function() {
      if (false == instance._inputControlEnabled) return;
      if (instance.selfPlayerScriptIns != null && ctrl != null) {
        instance.selfPlayerScriptIns.activeDirection = ctrl.activeDirection;
      }
    }, inputControlPollerMillis);
  },

  enableInputControls() {
    this._inputControlEnabled = true;
  },

  disableInputControls() {
    this._inputControlEnabled = false;
  },

  onBattleStarted() {
    console.log('On battle started!');
    const self = window.mapIns;
    if (null != self.musicEffectManagerScriptIns) {
      self.musicEffectManagerScriptIns.playBGM();
    }
    const canvasNode = self.canvasNode;
    self.spawnSelfPlayer();
    self.upsyncLoopInterval = setInterval(self._onPerUpsyncFrame.bind(self), self.clientUpsyncFps);
    self.enableInputControls();
    if (self.countdownToBeginGameNode.parent) {
      self.countdownToBeginGameNode.parent.removeChild(self.countdownToBeginGameNode);
    }
    self.transitToState(ALL_MAP_STATES.VISUAL);
    if (CC_DEBUG) {
      if (self.testOnlyResyncInterval) {
        clearInterval(self.testOnlyResyncInterval);
      }
      self.testOnlyResyncInterval = setInterval(() => {
        self._lazilyTriggerResync();
      }, 10 * 1000);
    }
  },

  onBattleStopped(playerMetas, players) {
    const self = this;
    if (self.musicEffectManagerScriptIns) {
      self.musicEffectManagerScriptIns.stopAllMusic();
    }
    const canvasNode = self.canvasNode;
    const resultPanelNode = self.resultPanelNode;
    const resultPanelScriptIns = resultPanelNode.getComponent("ResultPanel");
    resultPanelScriptIns.showPlayerInfo(playerMetas, players);
    window.clearBoundRoomIdInBothVolatileAndPersistentStorage();
    if (null != self.selfPlayerNode) {
      // Such that it doesn't execute "update(dt)" anymore. 
      self.selfPlayerNode.active = false;
    }
    self.battleState = ALL_BATTLE_STATES.IN_SETTLEMENT;
    self.showPopupInCanvas(resultPanelNode);
    self.openBottomBannerAd();

    // Clear player info
    self.playersInfoNode.getComponent("PlayersInfo").clearInfo();
  },

  spawnSelfPlayer() {
    const instance = this;
    const joinIndex = this.selfPlayerInfo.joinIndex;
    const newPlayerNode = this.playersNode[joinIndex];
    const tiledMapIns = instance.node.getComponent(cc.TiledMap);
    let toStartWithPos = cc.v2(instance.selfPlayerInfo.x, instance.selfPlayerInfo.y)
    newPlayerNode.setPosition(toStartWithPos);
    newPlayerNode.getComponent("SelfPlayer").mapNode = instance.node;

    safelyAddChild(instance.node, newPlayerNode);

    setLocalZOrder(newPlayerNode, 5);
    instance.selfPlayerNode = newPlayerNode;
    instance.selfPlayerNode.active = true;

    instance.selfPlayerScriptIns = newPlayerNode.getComponent("SelfPlayer");
    instance.selfPlayerScriptIns.scheduleNewDirection({dx: 0, dy: -1}, true);
    instance.selfPlayerScriptIns.showArrowTipNode();
  },

  update(dt) {
    const self = this;
    try {
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

      let toRemoveSpeedShoeNodeDict = {};
      Object.assign(toRemoveSpeedShoeNodeDict, self.speedShoeNodeDict);

      let toRemovePlayerNodeDict = {};
      Object.assign(toRemovePlayerNodeDict, self.otherPlayerNodeDict);

      let toRemoveTreasureNodeDict = {};
      Object.assign(toRemoveTreasureNodeDict, self.treasureNodeDict);

      let toRemoveTrapNodeDict = {};
      Object.assign(toRemoveTrapNodeDict, self.trapNodeDict);

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

        // 更新玩家信息展示
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
        const notToMoveDisThreshold = (cachedPlayerData.speed * dt * 1.0);
        if (toMoveByVecMag < notToMoveDisThreshold) {
          aControlledOtherPlayerScriptIns.activeDirection = { 
            dx: 0,
            dy: 0
          };
        } else {
          if (toMoveByVecMag > toTeleportDisThreshold) { 
            console.log("Player ", cachedPlayerData.id, " is teleporting! Having toMoveByVecMag == ", toMoveByVecMag, ", toTeleportDisThreshold == ", toTeleportDisThreshold);
            aControlledOtherPlayerScriptIns.activeDirection = {
              dx: 0,
              dy: 0
            };
            // Deliberately NOT using `cc.Action`. -- YFLu, 2019-09-04
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
          aControlledOtherPlayerScriptIns.scheduleNewDirection(newScheduledDirection, false /* DON'T interrupt playing anim. */ );
        }

        if (null != toRemovePlayerNodeDict[playerId]) {
          delete toRemovePlayerNodeDict[playerId];
        }
      }

      // 更新加速鞋显示 
      for (let k in self.speedShoeInfoDict) {
        const speedShoeLocalIdInBattle = parseInt(k);
        const speedShoeInfo = self.speedShoeInfoDict[speedShoeLocalIdInBattle];
        const newPos = cc.v2(
          speedShoeInfo.x,
          speedShoeInfo.y
        );
        let targetNode = self.speedShoeNodeDict[speedShoeLocalIdInBattle];
        if (!targetNode) {
          targetNode = cc.instantiate(self.speedShoePrefab);
          self.speedShoeNodeDict[speedShoeLocalIdInBattle] = targetNode;
          targetNode.setPosition(newPos);
          safelyAddChild(mapNode, targetNode);
          setLocalZOrder(targetNode, 5);
        }
        if (null != toRemoveSpeedShoeNodeDict[speedShoeLocalIdInBattle]) {
          delete toRemoveSpeedShoeNodeDict[speedShoeLocalIdInBattle];
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
          targetNode.setPosition(newPos);
          safelyAddChild(mapNode, targetNode);
          setLocalZOrder(targetNode, 5);
        }
        if (null != toRemoveTrapNodeDict[trapLocalIdInBattle]) {
          delete toRemoveTrapNodeDict[trapLocalIdInBattle];
        }
      }

      // 更新防御塔显示 
      for (let k in self.guardTowerInfoDict) {
        const localIdInBattle = parseInt(k);
        const towerInfo = self.guardTowerInfoDict[localIdInBattle];
        const newPos = cc.v2(
          towerInfo.x,
          towerInfo.y
        );
        let targetNode = self.guardTowerNodeDict[localIdInBattle];
        if (!targetNode) {
          targetNode = cc.instantiate(self.guardTowerPrefab);
          const theSpriteComp = targetNode.getComponent(cc.Sprite); 
          const targetGid = window.battleEntityTypeNameToGlobalGid["GuardTower"]; 
          theSpriteComp.spriteFrame = window.getOrCreateSpriteFrameForGid(targetGid).spriteFrame;

          const guardTowerNodePolygonColliderScriptIns = targetNode.getComponent(cc.PolygonCollider); 
          guardTowerNodePolygonColliderScriptIns.points = [];

          /* [WARNING] In these cases, the backend recognizes the "ProportionalAnchor a.k.a. `AnchorInCocos` == (0.5, 0)". */
          let theKey = "GuardTower";
          let theBattleColliderInfoListFromRemote = self.battleColliderInfo.strToPolygon2DListMap[theKey].polygon2DList;
          let theBattleColliderInfoFromRemote = theBattleColliderInfoListFromRemote[0]; // Hardcoded temporarily. -- YFLu, 2019-09-04  

          for (let p of theBattleColliderInfoFromRemote.Points) {
            guardTowerNodePolygonColliderScriptIns.points.push(p);
          }
          self.guardTowerNodeDict[localIdInBattle] = targetNode;
          targetNode.setPosition(newPos);
          safelyAddChild(mapNode, targetNode);
          setLocalZOrder(targetNode, 5);
        }
      }

      // 更新bullet显示 
      for (let k in self.trapBulletInfoDict) {
        const bulletLocalIdInBattle = parseInt(k);
        const bulletInfo = self.trapBulletInfoDict[bulletLocalIdInBattle];
        if (true == bulletInfo.removed) {
          continue;
        }
        let targetNode = self.trapBulletNodeDict[bulletLocalIdInBattle];
        let aBulletScriptIns = null;

        if (!targetNode) {
          targetNode = cc.instantiate(self.trapBulletPrefab);
          aBulletScriptIns = targetNode.getComponent("Bullet");
          aBulletScriptIns.ctrl = self.ctrl;

          const res = aBulletScriptIns.setData(bulletLocalIdInBattle, bulletInfo); 
          if (false == res) {
            continue;  
          }

          self.trapBulletNodeDict[bulletLocalIdInBattle] = targetNode;
          safelyAddChild(mapNode, targetNode);
          setLocalZOrder(targetNode, 5);
        }
        if (null == aBulletScriptIns) {
          aBulletScriptIns = targetNode.getComponent("Bullet");
        } 

        let res = aBulletScriptIns.setData(bulletLocalIdInBattle, bulletInfo); // No need to handle the returned result in this case. 

        if (true == res) {
          if (null != toRemoveBulletNodeDict[bulletLocalIdInBattle]) {
            delete toRemoveBulletNodeDict[bulletLocalIdInBattle];
          }
        }
      }

      // 更新宝物显示 
      for (let k in self.treasureInfoDict) {
        const treasureLocalIdInBattle = parseInt(k);
        const treasureInfo = self.treasureInfoDict[treasureLocalIdInBattle];
        if (true == treasureInfo.removed || -1 == [window.LOW_SCORE_TREASURE_TYPE, window.HIGH_SCORE_TREASURE_TYPE].indexOf(treasureInfo.type)) {
          continue;
        }
        const newPos = cc.v2(
          treasureInfo.x,
          treasureInfo.y
        );
        let targetNode = self.treasureNodeDict[treasureLocalIdInBattle];
        if (!targetNode) {
          targetNode = cc.instantiate(self.treasurePrefab);
          const treasureNodeScriptIns = targetNode.getComponent("Treasure");
          treasureNodeScriptIns.setData(treasureInfo);

          const treasureNodePolygonColliderScriptIns = targetNode.getComponent(cc.PolygonCollider); 
          treasureNodePolygonColliderScriptIns.points = [];

          let theKey = null;
          let theBattleColliderInfoListFromRemote = null; 
          let theBattleColliderInfoFromRemote = null;  

          /* [WARNING] In these cases, the backend recognizes the "ProportionalAnchor a.k.a. `AnchorInCocos` == (0.5, 0)". */
          switch (treasureInfo.type) {
          case window.LOW_SCORE_TREASURE_TYPE:
            theKey = "LowScoreTreasure";
          break;
          case window.HIGH_SCORE_TREASURE_TYPE:
            theKey = "HighScoreTreasure";
          break;
          default:
          break;
          }

          if (null == theKey) {
            continue;
          }
          theBattleColliderInfoListFromRemote = self.battleColliderInfo.strToPolygon2DListMap[theKey].polygon2DList;
          theBattleColliderInfoFromRemote = theBattleColliderInfoListFromRemote[0]; // Hardcoded temporarily. -- YFLu, 2019-09-04  

          for (let p of theBattleColliderInfoFromRemote.Points) {
            treasureNodePolygonColliderScriptIns.points.push(p);
          }
          self.treasureNodeDict[treasureLocalIdInBattle] = targetNode;
          targetNode.setPosition(newPos);
          safelyAddChild(mapNode, targetNode);
          setLocalZOrder(targetNode, 5);
        }

        if (null != toRemoveTreasureNodeDict[treasureLocalIdInBattle]) {
          delete toRemoveTreasureNodeDict[treasureLocalIdInBattle];
        }
        targetNode.setPosition(newPos);
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
        toRemoveTreasureNodeDict[k].parent.removeChild(toRemoveTreasureNodeDict[k]);
        if (self.musicEffectManagerScriptIns) {
          if (window.HIGH_SCORE_TREASURE_TYPE == treasureScriptIns.type) {
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

      // Coping with removed speedShoes.
      for (let k in toRemoveSpeedShoeNodeDict) {
        const speedShoeLocalIdInBattle = parseInt(k);
        toRemoveSpeedShoeNodeDict[k].parent.removeChild(toRemoveSpeedShoeNodeDict[k]);
        delete self.speedShoeNodeDict[speedShoeLocalIdInBattle];
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
    } catch (err) {
      console.warn("Map.update(dt)内发生了错误, 即将主动发起resync", err);
      self._lazilyTriggerResync();
    }
  },

  transitToState(s) {
    const self = this;
    self.state = s;
  },

  logout(byClick /* The case where this param is "true" will be triggered within `ConfirmLogout.js`.*/ , shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage) {
    const self = this;
    const localClearance = () => {
      window.clearLocalStorageAndBackToLoginScene(shouldRetainBoundRoomIdInBothVolatileAndPersistentStorage);
    }

    const selfPlayerStr = cc.sys.localStorage.getItem("selfPlayer");
    if (null != selfPlayerStr) {
      const selfPlayer = JSON.parse(selfPlayerStr);
      const requestContent = {
        intAuthToken: selfPlayer.intAuthToken
      };
      try {
        NetworkUtils.ajax({
          url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.INT_AUTH_TOKEN + constants.ROUTE_PATH.LOGOUT,
          type: "POST",
          data: requestContent,
          success: function(res) {
            if (res.ret != constants.RET_CODE.OK) {
              console.log("Logout failed: ", res);
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
    self.showPopupInCanvas(self.confirmLogoutNode);
  },

  onLogoutConfirmationDismissed() {
    const self = this;
    self.transitToState(ALL_MAP_STATES.VISUAL);
    const canvasNode = self.canvasNode;
    canvasNode.removeChild(self.confirmLogoutNode);
    self.enableInputControls();
  },

  onGameRule1v1ModeClicked(evt, cb) {
    const self = this;
    self.battleState = ALL_BATTLE_STATES.WAITING; 
    window.initPersistentSessionClient(self.initAfterWSConnected, null /* Deliberately NOT passing in any `expectedRoomId`. -- YFLu */ );
    self.hideGameRuleNode();
  },

  showPopupInCanvas(toShowNode) {
    const self = this;
    self.disableInputControls();
    self.transitToState(ALL_MAP_STATES.SHOWING_MODAL_POPUP);
    safelyAddChild(self.widgetsAboveAllNode, toShowNode);
    setLocalZOrder(toShowNode, 10);
  },

  playersMatched(playerMetas) {
    console.log("Calling `playersMatched` with:", playerMetas);

    const self = this;
    const findingPlayerScriptIns = self.findingPlayerNode.getComponent("FindingPlayer");
    findingPlayerScriptIns.updatePlayersInfo(playerMetas);
    window.setTimeout(() => {
      self.closeBottomBannerAd();
      if (null != self.findingPlayerNode.parent) {
        self.findingPlayerNode.parent.removeChild(self.findingPlayerNode);
        self.transitToState(ALL_MAP_STATES.VISUAL);
        for (let i in playerMetas) {
          const playerMeta = playerMetas[i];
          const playersInfoScriptIns = self.playersInfoNode.getComponent("PlayersInfo");
          playersInfoScriptIns.updateData(playerMeta);
        }
      }
      const countDownScriptIns = self.countdownToBeginGameNode.getComponent("CountdownToBeginGame");
      countDownScriptIns.setData();
      self.showPopupInCanvas(self.countdownToBeginGameNode);
      return;
    }, 2000);
  },

});
