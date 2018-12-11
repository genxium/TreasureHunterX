module.export = cc.Class({
  extends: cc.Component,

  properties: {
    animComp: {
      type: cc.Animation,
      default: null,
    },
    baseSpeed: {
      type: cc.Float,
      default: 300,
    },
    speed: {
      type: cc.Float,
      default: 300
    },
    lastMovedAt: {
      type: cc.Float,
      default: 0 // In "GMT milliseconds"
    },
    eps: {
      default: 0.10,
      type: cc.Float
    },
    magicLeanLowerBound: {
      default: 0.414, // Tangent of (PI/8).
      type: cc.Float
    },
    magicLeanUpperBound: {
      default: 2.414, // Tangent of (3*PI/8).
      type: cc.Float
    },
  },

  // LIFE-CYCLE CALLBACKS:
  start() {
    const self = this;
    self.contactedControlledPlayers = [];
    self.contactedNPCPlayers = [];
    self.coveringShelterZReducers = [];

    self.computedNewDifferentPosLocalToParentWithinCurrentFrame = null;
    self.actionMangerSingleton = new cc.ActionManager();
    self.scheduledDirection = {
      dx: 0.0,
      dy: 0.0
    };

    self.activeDirection = {
      dx: 0.0,
      dy: 0.0
    };
  },

  onLoad() {
    const self = this;
    const canvasNode = self.mapNode.parent;
    self.contactedBarriers = [];
    const joystickInputControllerScriptIns = canvasNode.getComponent("TouchEventsManager");
    self.ctrl = joystickInputControllerScriptIns;
    self.animComp = self.node.getComponent(cc.Animation);
    self.animComp.play();
  },

  scheduleNewDirection(newScheduledDirection, forceAnimSwitch) {
    if (!newScheduledDirection) {
      return;
    }
    if (forceAnimSwitch || null == this.scheduledDirection || (newScheduledDirection.dx != this.scheduledDirection.dx || newScheduledDirection.dy != this.scheduledDirection.dy)) {
      this.scheduledDirection = newScheduledDirection;
      const clipKey = newScheduledDirection.dx.toString() + newScheduledDirection.dy.toString()
      let clip = this.clips[clipKey];
      if (!clip) {
        // Keep playing the current anim.
        if (0 !== newScheduledDirection.dx || 0 !== newScheduledDirection.dy) {
          console.warn('Clip for clipKey === ' + clipKey + ' is invalid: ' + clip + '.');
        }
      } else {
        this.animComp.play(clip);
      }
    }
  },

  _addCoveringShelterZReducer(comp) {
    const self = this;
    for (let coveringShelterZReducer of self.coveringShelterZReducers) {
      if (coveringShelterZReducer._id == comp._id) {
        return false;
      }
    }
    self.coveringShelterZReducers.push(comp);
    return true;
  },

  _removeCoveringShelterZReducer(comp) {
    const self = this;
    self.coveringShelterZReducers = self.coveringShelterZReducers.filter((coveringShelterZReducer) => {
      return coveringShelterZReducer._id != comp._id;
    });
    return true;
  },

  _addContactedBarrier(collider) {
    const self = this;
    if (!self.contactedBarriers) {
      cc.log("self.contactedBarriers is null or undefined" + self.contactedBarriers)
    }
    for (let contactedBarrier of self.contactedBarriers) {
      if (contactedBarrier.id == collider.id) {
        return false;
      }
    }
    self.contactedBarriers.push(collider);
    return true;
  },

  _removeContactedBarrier(collider) {
    const self = this;
    self.contactedBarriers = self.contactedBarriers.filter((contactedBarrier) => {
      return contactedBarrier.id != collider.id;
    });
    return true;
  },

  _addContactedControlledPlayers(comp) {
    const self = this;
    for (let aComp of self.contactedControlledPlayers) {
      if (aComp.uuid == comp.uuid) {
        return false;
      }
    }
    self.contactedControlledPlayers.push(comp);
    return true;
  },

  _removeContactedControlledPlayer(comp) {
    const self = this;
    self.contactedControlledPlayers = self.contactedControlledPlayers.filter((aComp) => {
      return aComp.uuid != comp.uuid;
    });
    return true;
  },

  _addContactedNPCPlayers(comp) {
    const self = this;
    for (let aComp of self.contactedNPCPlayers) {
      if (aComp.uuid == comp.uuid) {
        return false;
      }
    }
    self.contactedNPCPlayers.push(comp);
    return true;
  },

  _removeContactedNPCPlayer(comp) {
    const self = this;
    self.contactedNPCPlayers = self.contactedNPCPlayers.filter((aComp) => {
      return aComp.uuid != comp.uuid;
    });
    return true;
  },

  _canMoveBy(vecToMoveBy) {
    const self = this;
    const computedNewDifferentPosLocalToParentWithinCurrentFrame = self.node.position.add(vecToMoveBy);
    self.computedNewDifferentPosLocalToParentWithinCurrentFrame = computedNewDifferentPosLocalToParentWithinCurrentFrame;

    if (tileCollisionManager.isOutOfMapNode(self.mapNode, computedNewDifferentPosLocalToParentWithinCurrentFrame)) {
      return false;
    }

    const currentSelfColliderCircle = self.node.getComponent(cc.CircleCollider);
    let nextSelfColliderCircle = null;
    if (0 < self.contactedBarriers.length || 0 < self.contactedNPCPlayers.length) {
      /* To avoid unexpected buckling. */
      const mutatedVecToMoveBy = vecToMoveBy.mul(2);
      nextSelfColliderCircle = {
        position: self.node.position.add(vecToMoveBy.mul(2)).add(currentSelfColliderCircle.offset),
        radius: currentSelfColliderCircle.radius,
      };
    } else {
      nextSelfColliderCircle = {
        position: computedNewDifferentPosLocalToParentWithinCurrentFrame.add(currentSelfColliderCircle.offset),
        radius: currentSelfColliderCircle.radius,
      };
    }

    for (let contactedBarrier of self.contactedBarriers) {
      let contactedBarrierPolygonLocalToParentWithinCurrentFrame = [];
      for (let p of contactedBarrier.points) {
        contactedBarrierPolygonLocalToParentWithinCurrentFrame.push(contactedBarrier.node.position.add(p));
      }
      if (cc.Intersection.polygonCircle(contactedBarrierPolygonLocalToParentWithinCurrentFrame, nextSelfColliderCircle)) {
        return false;
      }
    }

    return true;

  /*
   * In a subclass, use 
   * 
   * _canMoveBy(vecToMoveBy) {
   *   BasePlayer.prototype._canMoveBy.call(this, vecToMoveBy);
   *   // Customized codes.
   * }
   *
   * Reference http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/class.html#override
   */
  },

  _calculateVecToMoveBy(elapsedTime) {
    const self = this;
    const sDir = self.activeDirection;

    if (0 == sDir.dx && 0 == sDir.dy) {
      return cc.v2();
    }

    const distanceToMove = (self.speed * elapsedTime);
    const denominator = Math.sqrt(sDir.dx * sDir.dx + sDir.dy * sDir.dy);
    const unitProjDx = (sDir.dx / denominator);
    const unitProjDy = (sDir.dy / denominator);
    return cc.v2(
      distanceToMove * unitProjDx,
      distanceToMove * unitProjDy,
    );
  },

  update(dt) {
    const self = this;
    const vecToMoveBy = self._calculateVecToMoveBy(dt);
    if (self._canMoveBy(vecToMoveBy)) {
      self.node.position = self.computedNewDifferentPosLocalToParentWithinCurrentFrame;
    }
  },

  lateUpdate(dt) {
    const self = this;
    if (0 != self.activeDirection.dx || 0 != self.activeDirection.dy) {
      const newScheduledDirectionInLocalCoordinate = self.ctrl.discretizeDirection(self.activeDirection.dx, self.activeDirection.dy, self.eps);
      self.scheduleNewDirection(newScheduledDirectionInLocalCoordinate);
    }
    const now = new Date().getTime();
    self.lastMovedAt = now;
  },

  onCollisionEnter(other, self) {
    const playerScriptIns = self.getComponent(self.node.name);
    switch (other.node.name) {
      case "NPCPlayer":
        if ("NPCPlayer" != self.node.name) {
          other.node.getComponent('NPCPlayer').showProfileTrigger();
        }
        playerScriptIns._addContactedNPCPlayers(other);
        break;
      case "PolygonBoundaryBarrier":
        playerScriptIns._addContactedBarrier(other);
        break;
      case "PolygonBoundaryShelter":
        break;
      case "PolygonBoundaryShelterZReducer":
        playerScriptIns._addCoveringShelterZReducer(other);
        if (1 == playerScriptIns.coveringShelterZReducers.length) {
          setLocalZOrder(self.node, 2);
        }
        break;
      default:
        break;
    }
  },

  onCollisionStay(other, self) {
    // TBD.
  },

  onCollisionExit(other, self) {
    const playerScriptIns = self.getComponent(self.node.name);
    switch (other.node.name) {
      case "NPCPlayer":
        other.node.getComponent('NPCPlayer').hideProfileTrigger();
        playerScriptIns._removeContactedNPCPlayer(other);
        break;
      case "PolygonBoundaryBarrier":
        playerScriptIns._removeContactedBarrier(other);
        break;
      case "PolygonBoundaryShelter":
        break;
      case "PolygonBoundaryShelterZReducer":
        playerScriptIns._removeCoveringShelterZReducer(other);
        if (0 == playerScriptIns.coveringShelterZReducers.length) {
          setLocalZOrder(self.node, 5);
        }
        break;
      default:
        break;
    }
  },

  _generateRandomDirection() {
    return ALL_DISCRETE_DIRECTIONS_CLOCKWISE[Math.floor(Math.random() * ALL_DISCRETE_DIRECTIONS_CLOCKWISE.length)];
  },

  _generateRandomDirectionExcluding(toExcludeDx, toExcludeDy) {
    let randomDirectionList = [];
    let exactIdx = null;
    for (let ii = 0; ii < ALL_DISCRETE_DIRECTIONS_CLOCKWISE.length; ++ii) {
      if (toExcludeDx != ALL_DISCRETE_DIRECTIONS_CLOCKWISE[ii].dx || toExcludeDy != ALL_DISCRETE_DIRECTIONS_CLOCKWISE[ii].dy) continue;
      exactIdx = ii;
      break;
    }
    if (null == exactIdx) {
      return this._generateRandomDirection();
    }

    for (let ii = 0; ii < ALL_DISCRETE_DIRECTIONS_CLOCKWISE.length; ++ii) {
      if (ii == exactIdx || ((ii - 1) % ALL_DISCRETE_DIRECTIONS_CLOCKWISE.length) == exactIdx || ((ii + 1) % ALL_DISCRETE_DIRECTIONS_CLOCKWISE.length) == exactIdx) continue;
      randomDirectionList.push(ALL_DISCRETE_DIRECTIONS_CLOCKWISE[ii]);
    }
    return randomDirectionList[Math.floor(Math.random() * randomDirectionList.length)]
  },

  startFrozenDisplay() {
    this.node.opacity = 64; 
  },

  stopFrozenDisplay() {
    this.node.opacity = 255; 
  },
});
