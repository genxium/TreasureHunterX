cc.Class({
  extends: cc.Component,

  properties: {
    selfPlayer: null,
    tiledAnimPrefab: {
      type: cc.Prefab,
      default: null, 
    },
    selfPlayerPrefab: {
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
  },

  // LIFE-CYCLE CALLBACKS:
  onDestroy () {
    clearInterval(this.inputControlTimer)
  },

  onLoad() {
    const self = this;
    const mapNode = self.node;
    const canvasNode = mapNode.parent;
    cc.director.getCollisionManager().enabled = true;
    cc.director.getCollisionManager().enabledDebugDraw = true;

    self.state = ALL_MAP_STATES.VISUAL;
    const tiledMapIns = self.node.getComponent(cc.TiledMap); 
    self.spawnSelfPlayer();
    this._inputControlEnabled = true;
    self.setupInputControls();

    const boundaryObjs = tileCollisionManager.extractBoundaryObjects(self.node); 
    for (let frameAnim of boundaryObjs.frameAnimations) {
      const animNode = cc.instantiate(self.tiledAnimPrefab);  
      const anim = animNode.getComponent(cc.Animation); 
      animNode.setPosition(frameAnim.posInMapNode);
      animNode.width = frameAnim.sizeInMapNode.width;
      animNode.height = frameAnim.sizeInMapNode.height;
      animNode.setScale(frameAnim.sizeInMapNode.width/frameAnim.origSize.width, frameAnim.sizeInMapNode.height/frameAnim.origSize.height);
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


    // self.spawnNPCs();
    self.spawnType2NPCs();

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
  },

  setupInputControls() {
    const instance = this;
    const mapNode = instance.node;
    const canvasNode = mapNode.parent;
    const joystickInputControllerScriptIns = canvasNode.getComponent("TouchEventsManager");
    const inputControlPollerMillis = (1000 / joystickInputControllerScriptIns.pollerFps);

    const selfPlayerScriptIns = instance.selfPlayer.getComponent("SelfPlayer");
    const keyboardInputControllerScriptIns = instance.keyboardInputControllerNode.getComponent("KeyboardControls");

    instance.inputControlTimer = setInterval(function() {
      if (false == instance._inputControlEnabled) return;

      const ctrl = keyboardInputControllerScriptIns.activeDirection.dPjX || keyboardInputControllerScriptIns.activeDirection.dPjY ? keyboardInputControllerScriptIns : joystickInputControllerScriptIns;

      const newScheduledDirectionInWorldCoordinate = {
        dx: ctrl.activeDirection.dPjX,
        dy: ctrl.activeDirection.dPjY
      };

      const newScheduledDirectionInLocalCoordinate = newScheduledDirectionInWorldCoordinate;
      selfPlayerScriptIns.scheduleNewDirection(newScheduledDirectionInLocalCoordinate);
    }, inputControlPollerMillis);
  },

  enableInputControls() {
    this._inputControlEnabled = true; 
  },

  disableInputControls() {
    this._inputControlEnabled = false;
  },

  spawnSelfPlayer() {
    const self = this;
    const newPlayer = cc.instantiate(self.selfPlayerPrefab);
    newPlayer.uid = 0;
    newPlayer.setPosition(cc.v2(0, 0));
    newPlayer.getComponent("SelfPlayer").mapNode = self.node;

    self.node.addChild(newPlayer);

    setLocalZOrder(newPlayer, 5);
    this.selfPlayer = newPlayer;
  },

  spawnNPCs() {
    const self = this;
    const tiledMapIns = self.node.getComponent(cc.TiledMap);
    const npcPatrolLayer = tiledMapIns.getObjectGroup('NPCPatrol');

    const npcList = npcPatrolLayer.getObjects();
    npcList.forEach(function (npcPlayerObj, index) {
      const npcPlayerNode = cc.instantiate(self.npcPlayerPrefab);
      const npcPlayerContinuousPositionWrtMapNode = tileCollisionManager.continuousObjLayerOffsetToContinuousMapNodePos(self.node, npcPlayerObj.offset);
      npcPlayerNode.getChildByName('username').getComponent(cc.Label).string = npcPlayerObj.name;
      npcPlayerNode.setPosition(npcPlayerContinuousPositionWrtMapNode);

      npcPlayerNode.getComponent('NPCPlayer').mapNode = self.node;
      safelyAddChild(self.node, npcPlayerNode);
      setLocalZOrder(npcPlayerNode, 5);
    });
  },

  spawnType2NPCs() {
    const self = this;
    const tiledMapIns = self.node.getComponent(cc.TiledMap);
    const type2NpcPatrolSrcLayer = tiledMapIns.getObjectGroup('Type2NPCPatrolSrc');
    const type2NpcPatrolDstLayer = tiledMapIns.getObjectGroup('Type2NPCPatrolDst');

    const npcSrcList = type2NpcPatrolSrcLayer.getObjects();
    const npcDstList = type2NpcPatrolDstLayer.getObjects();

    for (let indice = 0; indice < npcSrcList.length; ++indice) {
      let type2NpcSrc = npcSrcList[indice]; 
      const npcPlayerNode = cc.instantiate(self.type2NpcPlayerPrefab);
      const npcPlayerSrcContinuousPositionWrtMapNode = tileCollisionManager.continuousObjLayerOffsetToContinuousMapNodePos(self.node, type2NpcSrc.offset);
      const npcPlayerIns = npcPlayerNode.getComponent('Type2NPCPlayer');
      npcPlayerIns.mapNode = self.node;
      npcPlayerNode.setPosition(npcPlayerSrcContinuousPositionWrtMapNode);
      safelyAddChild(self.node, npcPlayerNode);
      setLocalZOrder(npcPlayerNode, 5);

      let type2NpcDst = npcDstList[indice]; 
      const npcPlayerDstContinuousPositionWrtMapNode = tileCollisionManager.continuousObjLayerOffsetToContinuousMapNodePos(self.node, type2NpcDst.offset);
      const eps = 10.0;
      const initialGuessedCountOfSteps = 10;
      const stops = findPathForType2NPCWithDoubleAstar(npcPlayerSrcContinuousPositionWrtMapNode, npcPlayerDstContinuousPositionWrtMapNode, eps, initialGuessedCountOfSteps, npcPlayerNode.getComponent(cc.CircleCollider), self.barrierColliders, null, self.node);
	  if (null == stops) continue;
      let ccSeqActArray = [];
      for (let i = 0; i < stops.length; ++i) {
        const stop = stops[i];
        // Note that `stops[0]` is always `npcPlayerSrcContinuousPositionWrtMapNode`.
        ccSeqActArray.push(cc.moveTo(2, stop)); 
        if (i < stops.length - 1) {
          const nextStop = stops[i + 1];
          const tmpVec = nextStop.sub(stop);
          const diffVec = {
            dx: tmpVec.x,
            dy: tmpVec.y,
          };
          const discretizedDirection = npcPlayerIns._discretizeDirection(diffVec);
          ccSeqActArray.push(cc.callFunc(() => {
            npcPlayerIns.scheduleNewDirection(discretizedDirection);
          }, npcPlayerIns)); 
        }
      } 
      for (let act of ccSeqActArray) {
        cc.log(act.toString());
      } 
      npcPlayerNode.runAction(cc.sequence(ccSeqActArray));
    }
  },

  update(dt) {
  },

});

