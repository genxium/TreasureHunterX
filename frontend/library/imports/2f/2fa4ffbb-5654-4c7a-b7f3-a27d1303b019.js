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
    self.clips = {
      '01': 'Top',
      '0-1': 'Bottom',
      '-20': 'Left',
      '20': 'Right',
      '-21': 'TopLeft',
      '21': 'TopRight',
      '-2-1': 'BottomLeft',
      '2-1': 'BottomRight'
    };
    var canvasNode = self.mapNode.parent;
    self.contactedBarriers = [];
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
      var clips = this.attacked ? this.attackedClips : this.clips;
      var clip = clips[clipKey];
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
    if (!self.contactedBarriers) {
      cc.log("self.contactedBarriers is null or undefined" + self.contactedBarriers);
    }
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = self.contactedBarriers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var contactedBarrier = _step2.value;

        if (contactedBarrier._id == collider._id) {
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
      return contactedBarrier._id != collider._id;
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
    if (0 < self.contactedBarriers.length) {
      /* To avoid unexpected buckling. */
      var mutatedVecToMoveBy = vecToMoveBy.mul(5); // To help it escape the engaged `contactedBarriers`.
      nextSelfColliderCircle = {
        position: self.node.position.add(mutatedVecToMoveBy).add(currentSelfColliderCircle.offset),
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

        if (cc.Intersection.pointInPolygon(nextSelfColliderCircle.position, contactedBarrierPolygonLocalToParentWithinCurrentFrame)) {
          // Make sure that the player is "leaving" the PolygonCollider.
          return false;
        }
        if (cc.Intersection.polygonCircle(contactedBarrierPolygonLocalToParentWithinCurrentFrame, nextSelfColliderCircle)) {
          if (null == self.firstContactedEdge) {
            return false;
          }
          if (null != self.firstContactedEdge && self.firstContactedEdge.associatedBarrier != contactedBarrier) {
            var res = self._calculateTangentialMovementAttrs(nextSelfColliderCircle, contactedBarrier);
            if (null == res.contactedEdge) {
              // Otherwise, the current movement is going to transit smoothly onto the next PolygonCollider.
              return false;
            }
          }
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
  _calculateTangentialMovementAttrs: function _calculateTangentialMovementAttrs(currentSelfColliderCircle, contactedBarrier) {
    /*
     * Theoretically when the `contactedBarrier` is a convex polygon and the `PlayerCollider` is a circle, there can be only 1 `contactedEdge` for each `contactedBarrier`. Except only for around the corner.
     *
     * We should avoid the possibility of players hitting the "corners of convex polygons" by map design wherever & whenever possible.
     *
     */
    var self = this;
    var sDir = self.activeDirection;
    var currentSelfColliderCircleCentrePos = currentSelfColliderCircle.position ? currentSelfColliderCircle.position : self.node.position.add(currentSelfColliderCircle.offset);
    var currentSelfColliderCircleRadius = currentSelfColliderCircle.radius;
    var contactedEdgeCandidateList = [];
    var skinDepthThreshold = 0.45 * currentSelfColliderCircleRadius;
    for (var i = 0; i < contactedBarrier.points.length; ++i) {
      var stPoint = contactedBarrier.points[i].add(contactedBarrier.offset).add(contactedBarrier.node.position);
      var edPoint = i == contactedBarrier.points.length - 1 ? contactedBarrier.points[0].add(contactedBarrier.offset).add(contactedBarrier.node.position) : contactedBarrier.points[1 + i].add(contactedBarrier.offset).add(contactedBarrier.node.position);
      var tmpVSt = stPoint.sub(currentSelfColliderCircleCentrePos);
      var tmpVEd = edPoint.sub(currentSelfColliderCircleCentrePos);
      var crossProdScalar = tmpVSt.cross(tmpVEd);
      if (0 < crossProdScalar) {
        // If moving parallel along `st <-> ed`, the trajectory of `currentSelfColliderCircleCentrePos` will cut inside the polygon. 
        continue;
      }
      var dis = cc.Intersection.pointLineDistance(currentSelfColliderCircleCentrePos, stPoint, edPoint, true);
      if (dis > currentSelfColliderCircleRadius) continue;
      if (dis < skinDepthThreshold) continue;
      contactedEdgeCandidateList.push({
        st: stPoint,
        ed: edPoint,
        associatedBarrier: contactedBarrier
      });
    }
    var contactedEdge = null;
    var contactedEdgeDir = null;
    var largestInnerProdAbs = Number.MIN_VALUE;

    if (0 < contactedEdgeCandidateList.length) {
      var sDirMag = Math.sqrt(sDir.dx * sDir.dx + sDir.dy * sDir.dy);
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = contactedEdgeCandidateList[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var contactedEdgeCandidate = _step7.value;

          var tmp = contactedEdgeCandidate.ed.sub(contactedEdgeCandidate.st);
          var contactedEdgeDirCandidate = {
            dx: tmp.x,
            dy: tmp.y
          };
          var contactedEdgeDirCandidateMag = Math.sqrt(contactedEdgeDirCandidate.dx * contactedEdgeDirCandidate.dx + contactedEdgeDirCandidate.dy * contactedEdgeDirCandidate.dy);
          var innerDotProd = (sDir.dx * contactedEdgeDirCandidate.dx + sDir.dy * contactedEdgeDirCandidate.dy) / (sDirMag * contactedEdgeDirCandidateMag);
          var innerDotProdThresholdMag = 0.7;
          if (0 > innerDotProd && innerDotProd > -innerDotProdThresholdMag || 0 < innerDotProd && innerDotProd < innerDotProdThresholdMag) {
            // Intentionally left blank, in this case the player is trying to escape from the `contactedEdge`.    
            continue;
          } else if (innerDotProd > 0) {
            var abs = Math.abs(innerDotProd);
            if (abs > largestInnerProdAbs) {
              contactedEdgeDir = contactedEdgeDirCandidate;
              contactedEdge = contactedEdgeCandidate;
            }
          } else {
            var _abs = Math.abs(innerDotProd);
            if (_abs > largestInnerProdAbs) {
              contactedEdgeDir = {
                dx: -contactedEdgeDirCandidate.dx,
                dy: -contactedEdgeDirCandidate.dy
              };
              contactedEdge = contactedEdgeCandidate;
            }
          }
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
    }
    return {
      contactedEdgeDir: contactedEdgeDir,
      contactedEdge: contactedEdge
    };
  },
  _calculateVecToMoveByWithChosenDir: function _calculateVecToMoveByWithChosenDir(elapsedTime, sDir) {
    if (0 == sDir.dx && 0 == sDir.dy) {
      return cc.v2();
    }
    var self = this;
    var distanceToMove = self.speed * elapsedTime;
    var denominator = Math.sqrt(sDir.dx * sDir.dx + sDir.dy * sDir.dy);
    var unitProjDx = sDir.dx / denominator;
    var unitProjDy = sDir.dy / denominator;
    return cc.v2(distanceToMove * unitProjDx, distanceToMove * unitProjDy);
  },
  _calculateVecToMoveBy: function _calculateVecToMoveBy(elapsedTime) {
    var self = this;
    // Note that `sDir` used in this method MUST BE a copy in RAM.
    var sDir = {
      dx: self.activeDirection.dx,
      dy: self.activeDirection.dy
    };

    if (0 == sDir.dx && 0 == sDir.dy) {
      return cc.v2();
    }

    self.firstContactedEdge = null; // Reset everytime (temporary algorithm design, might change later).
    if (0 < self.contactedBarriers.length) {
      /*
       * Hardcoded to take care of only the 1st `contactedEdge` of the 1st `contactedBarrier` for now. Each `contactedBarrier` must be "counterclockwisely convex polygonal", otherwise sliding doesn't work! 
       *
       */
      var contactedBarrier = self.contactedBarriers[0];
      var currentSelfColliderCircle = self.node.getComponent(cc.CircleCollider);
      var res = self._calculateTangentialMovementAttrs(currentSelfColliderCircle, contactedBarrier);
      if (res.contactedEdge) {
        self.firstContactedEdge = res.contactedEdge;
        sDir = res.contactedEdgeDir;
      }
    }
    return self._calculateVecToMoveByWithChosenDir(elapsedTime, sDir);
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
    var playerScriptIns = self.node.getComponent("SelfPlayer");
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
    var playerScriptIns = self.getComponent("SelfPlayer");
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
  },
  updateSpeed: function updateSpeed(proposedSpeed) {
    if (0 == proposedSpeed && 0 < this.speed) {
      this.startFrozenDisplay();
    }
    if (0 < proposedSpeed && 0 == this.speed) {
      this.stopFrozenDisplay();
    }
    this.speed = proposedSpeed;
  },
  startFrozenDisplay: function startFrozenDisplay() {
    var self = this;
    var clipKey = self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString();
    var clip = this.attackedClips[clipKey];
    self.animComp.play(clip);
    self.attacked = true;
  },
  stopFrozenDisplay: function stopFrozenDisplay() {
    var self = this;
    var clipKey = self.scheduledDirection.dx.toString() + self.scheduledDirection.dy.toString();
    var clip = this.clips[clipKey];
    self.animComp.play(clip);
    self.attacked = false;
  }
});

cc._RF.pop();