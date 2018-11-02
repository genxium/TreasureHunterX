"use strict";
cc._RF.push(module, '2fa4f+7VlRMerfzon0TA7AZ', 'BasePlayer');
// scripts/BasePlayer.js

'use strict';

module.export = cc.Class({
  extends: cc.Component,

  properties: {
    animComp: {
      type: cc.Animation,
      default: null
    },
    baseSpeed: {
      type: cc.Float,
      default: 300
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
    }
  },

  // LIFE-CYCLE CALLBACKS:
  start: function start() {
    var self = this;
    self.contactedControlledPlayers = [];
    self.contactedNPCPlayers = [];
    self.contactedBarriers = [];
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
  onLoad: function onLoad() {
    var self = this;
    var canvasNode = self.mapNode.parent;
    var joystickInputControllerScriptIns = canvasNode.getComponent("TouchEventsManager");
    self.ctrl = joystickInputControllerScriptIns;
    self.animComp = self.node.getComponent(cc.Animation);
    self.animComp.play();
  },
  scheduleNewDirection: function scheduleNewDirection(newScheduledDirection, forceAnimSwitch) {
    if (!newScheduledDirection) {
      return;
    }
    if (forceAnimSwitch || null == this.scheduledDirection || newScheduledDirection.dx != this.scheduledDirection.dx || newScheduledDirection.dy != this.scheduledDirection.dy) {
      this.scheduledDirection = newScheduledDirection;
      var clipKey = newScheduledDirection.dx.toString() + newScheduledDirection.dy.toString();
      var clip = this.clips[clipKey];
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
  _addCoveringShelterZReducer: function _addCoveringShelterZReducer(comp) {
    var self = this;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = self.coveringShelterZReducers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var coveringShelterZReducer = _step.value;

        if (coveringShelterZReducer._id == comp._id) {
          return false;
        }
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

    self.coveringShelterZReducers.push(comp);
    return true;
  },
  _removeCoveringShelterZReducer: function _removeCoveringShelterZReducer(comp) {
    var self = this;
    self.coveringShelterZReducers = self.coveringShelterZReducers.filter(function (coveringShelterZReducer) {
      return coveringShelterZReducer._id != comp._id;
    });
    return true;
  },
  _addContactedBarrier: function _addContactedBarrier(collider) {
    var self = this;
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = self.contactedBarriers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var contactedBarrier = _step2.value;

        if (contactedBarrier.id == collider.id) {
          return false;
        }
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

    self.contactedBarriers.push(collider);
    return true;
  },
  _removeContactedBarrier: function _removeContactedBarrier(collider) {
    var self = this;
    self.contactedBarriers = self.contactedBarriers.filter(function (contactedBarrier) {
      return contactedBarrier.id != collider.id;
    });
    return true;
  },
  _addContactedControlledPlayers: function _addContactedControlledPlayers(comp) {
    var self = this;
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = self.contactedControlledPlayers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var aComp = _step3.value;

        if (aComp.uuid == comp.uuid) {
          return false;
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

    self.contactedControlledPlayers.push(comp);
    return true;
  },
  _removeContactedControlledPlayer: function _removeContactedControlledPlayer(comp) {
    var self = this;
    self.contactedControlledPlayers = self.contactedControlledPlayers.filter(function (aComp) {
      return aComp.uuid != comp.uuid;
    });
    return true;
  },
  _addContactedNPCPlayers: function _addContactedNPCPlayers(comp) {
    var self = this;
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = self.contactedNPCPlayers[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var aComp = _step4.value;

        if (aComp.uuid == comp.uuid) {
          return false;
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

    self.contactedNPCPlayers.push(comp);
    return true;
  },
  _removeContactedNPCPlayer: function _removeContactedNPCPlayer(comp) {
    var self = this;
    self.contactedNPCPlayers = self.contactedNPCPlayers.filter(function (aComp) {
      return aComp.uuid != comp.uuid;
    });
    return true;
  },
  _canMoveBy: function _canMoveBy(vecToMoveBy) {
    var self = this;
    var computedNewDifferentPosLocalToParentWithinCurrentFrame = self.node.position.add(vecToMoveBy);
    self.computedNewDifferentPosLocalToParentWithinCurrentFrame = computedNewDifferentPosLocalToParentWithinCurrentFrame;

    if (tileCollisionManager.isOutOfMapNode(self.mapNode, computedNewDifferentPosLocalToParentWithinCurrentFrame)) {
      return false;
    }

    var currentSelfColliderCircle = self.node.getComponent(cc.CircleCollider);
    var nextSelfColliderCircle = null;
    if (0 < self.contactedBarriers.length || 0 < self.contactedNPCPlayers.length) {
      /* To avoid unexpected buckling. */
      var mutatedVecToMoveBy = vecToMoveBy.mul(2);
      nextSelfColliderCircle = {
        position: self.node.position.add(vecToMoveBy.mul(2)).add(currentSelfColliderCircle.offset),
        radius: currentSelfColliderCircle.radius
      };
    } else {
      nextSelfColliderCircle = {
        position: computedNewDifferentPosLocalToParentWithinCurrentFrame.add(currentSelfColliderCircle.offset),
        radius: currentSelfColliderCircle.radius
      };
    }

    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = self.contactedBarriers[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var contactedBarrier = _step5.value;

        var contactedBarrierPolygonLocalToParentWithinCurrentFrame = [];
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = contactedBarrier.points[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var p = _step6.value;

            contactedBarrierPolygonLocalToParentWithinCurrentFrame.push(contactedBarrier.node.position.add(p));
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

        if (cc.Intersection.polygonCircle(contactedBarrierPolygonLocalToParentWithinCurrentFrame, nextSelfColliderCircle)) {
          return false;
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
  _calculateVecToMoveBy: function _calculateVecToMoveBy(elapsedTime) {
    var self = this;
    var sDir = self.activeDirection;

    if (0 == sDir.dx && 0 == sDir.dy) {
      return cc.v2();
    }

    var distanceToMove = self.speed * elapsedTime;
    var denominator = Math.sqrt(sDir.dx * sDir.dx + sDir.dy * sDir.dy);
    var unitProjDx = sDir.dx / denominator;
    var unitProjDy = sDir.dy / denominator;
    return cc.v2(distanceToMove * unitProjDx, distanceToMove * unitProjDy);
  },
  update: function update(dt) {
    var self = this;
    var vecToMoveBy = self._calculateVecToMoveBy(dt);
    if (self._canMoveBy(vecToMoveBy)) {
      self.node.position = self.computedNewDifferentPosLocalToParentWithinCurrentFrame;
    }
  },
  lateUpdate: function lateUpdate(dt) {
    var self = this;
    if (0 != self.activeDirection.dx || 0 != self.activeDirection.dy) {
      var newScheduledDirectionInLocalCoordinate = self.ctrl.discretizeDirection(self.activeDirection.dx, self.activeDirection.dy, self.eps);
      self.scheduleNewDirection(newScheduledDirectionInLocalCoordinate);
    }
    var now = new Date().getTime();
    self.lastMovedAt = now;
  },
  onCollisionEnter: function onCollisionEnter(other, self) {
    var playerScriptIns = self.getComponent(self.node.name);
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
  onCollisionStay: function onCollisionStay(other, self) {
    // TBD.
  },
  onCollisionExit: function onCollisionExit(other, self) {
    var playerScriptIns = self.getComponent(self.node.name);
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
  _generateRandomDirection: function _generateRandomDirection() {
    return ALL_DISCRETE_DIRECTIONS_CLOCKWISE[Math.floor(Math.random() * ALL_DISCRETE_DIRECTIONS_CLOCKWISE.length)];
  },
  _generateRandomDirectionExcluding: function _generateRandomDirectionExcluding(toExcludeDx, toExcludeDy) {
    var randomDirectionList = [];
    var exactIdx = null;
    for (var ii = 0; ii < ALL_DISCRETE_DIRECTIONS_CLOCKWISE.length; ++ii) {
      if (toExcludeDx != ALL_DISCRETE_DIRECTIONS_CLOCKWISE[ii].dx || toExcludeDy != ALL_DISCRETE_DIRECTIONS_CLOCKWISE[ii].dy) continue;
      exactIdx = ii;
      break;
    }
    if (null == exactIdx) {
      return this._generateRandomDirection();
    }

    for (var _ii = 0; _ii < ALL_DISCRETE_DIRECTIONS_CLOCKWISE.length; ++_ii) {
      if (_ii == exactIdx || (_ii - 1) % ALL_DISCRETE_DIRECTIONS_CLOCKWISE.length == exactIdx || (_ii + 1) % ALL_DISCRETE_DIRECTIONS_CLOCKWISE.length == exactIdx) continue;
      randomDirectionList.push(ALL_DISCRETE_DIRECTIONS_CLOCKWISE[_ii]);
    }
    return randomDirectionList[Math.floor(Math.random() * randomDirectionList.length)];
  }
});

cc._RF.pop();