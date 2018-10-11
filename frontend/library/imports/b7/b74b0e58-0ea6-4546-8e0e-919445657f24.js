"use strict";
cc._RF.push(module, 'b74b05YDqZFRo4OkZRFZX8k', 'SelfPlayer');
// scripts/SelfPlayer.js

'use strict';

var BasePlayer = require("./BasePlayer");

cc.Class({
  extends: BasePlayer,

  // LIFE-CYCLE CALLBACKS:
  start: function start() {
    BasePlayer.prototype.start.call(this);
  },
  onLoad: function onLoad() {
    BasePlayer.prototype.onLoad.call(this);
    this.clips = {
      '01': 'FlatHeadSisterRunTop',
      '0-1': 'FlatHeadSisterRunBottom',
      '-20': 'FlatHeadSisterRunLeft',
      '20': 'FlatHeadSisterRunRight',
      '-21': 'FlatHeadSisterRunTopLeft',
      '21': 'FlatHeadSisterRunTopRight',
      '-2-1': 'FlatHeadSisterRunBottomLeft',
      '2-1': 'FlatHeadSisterRunBottomRight'
    };
  },
  _canMoveBy: function _canMoveBy(vecToMoveBy) {
    var superRet = BasePlayer.prototype._canMoveBy.call(this, vecToMoveBy);
    var self = this;

    var computedNewDifferentPosLocalToParentWithinCurrentFrame = self.node.position.add(vecToMoveBy);

    var currentSelfColliderCircle = self.node.getComponent(cc.CircleCollider);
    var nextSelfColliderCircle = null;
    if (0 < self.contactedBarriers.length || 0 < self.contactedNPCPlayers.length || 0 < self.contactedControlledPlayers) {
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

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = self.contactedNPCPlayers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var aCircleCollider = _step.value;

        var contactedCircleLocalToParentWithinCurrentFrame = {
          position: aCircleCollider.node.position.add(aCircleCollider.offset),
          radius: aCircleCollider.radius
        };
        if (cc.Intersection.circleCircle(contactedCircleLocalToParentWithinCurrentFrame, nextSelfColliderCircle)) {
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

    return superRet;
  },
  update: function update(dt) {
    BasePlayer.prototype.update.call(this, dt);
    var labelNode = this.node.getChildByName("CoordinateLabel");
    labelNode.getComponent("cc.Label").string = "M_(" + this.node.x.toFixed(2) + ", " + this.node.y.toFixed(2) + ")";
  }
});

cc._RF.pop();