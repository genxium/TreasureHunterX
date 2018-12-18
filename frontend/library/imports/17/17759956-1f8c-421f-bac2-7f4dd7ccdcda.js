"use strict";
cc._RF.push(module, '17759lWH4xCH7rCf03XzNza', 'NPCPlayer');
// scripts/NPCPlayer.js

'use strict';

var COLLISION_WITH_PLAYER_STATE = {
  WALKING_COLLIDABLE: 0,
  STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM: 1,
  STILL_NEAR_SELF_PLAYER_ONLY_PLAYED_ANIM: 2,
  STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM: 3,
  STILL_NEAR_OTHER_PLAYER_ONLY_PLAYED_ANIM: 4,
  STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM: 5,
  STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM: 6,
  WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER: 7,
  STILL_NEAR_NOBODY_PLAYING_ANIM: 8
};

var STILL_NEAR_SELF_PLAYER_STATE_SET = new Set();
STILL_NEAR_SELF_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM);
STILL_NEAR_SELF_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYED_ANIM);
STILL_NEAR_SELF_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM);
STILL_NEAR_SELF_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM);

var STILL_NEAR_OTHER_PLAYER_STATE_SET = new Set();
STILL_NEAR_OTHER_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM);
STILL_NEAR_OTHER_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYED_ANIM);
STILL_NEAR_OTHER_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM);
STILL_NEAR_OTHER_PLAYER_STATE_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM);

var STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET = new Set();
STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM);
STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYED_ANIM);
STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM);
STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYED_ANIM);
STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM);
STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM);
STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.add(COLLISION_WITH_PLAYER_STATE.STILL_NEAR_NOBODY_PLAYING_ANIM);

function transitWalkingConditionallyCollidableToUnconditionallyCollidable(currentCollisionWithPlayerState) {
  switch (currentCollisionWithPlayerState) {
    case COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER:
      return COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE;
  }

  return currentCollisionWithPlayerState;
}

function transitUponSelfPlayerLeftProximityArea(currentCollisionWithPlayerState) {
  switch (currentCollisionWithPlayerState) {
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM:
      return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_NOBODY_PLAYING_ANIM;

    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYED_ANIM:
      return COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE;

    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM:
      return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM;

    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM:
      return COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER;
  }
  return currentCollisionWithPlayerState;
}

function transitDueToNoBodyInProximityArea(currentCollisionWithPlayerState) {
  switch (currentCollisionWithPlayerState) {
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM:
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM:
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM:
      return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_NOBODY_PLAYING_ANIM;

    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYED_ANIM:
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYED_ANIM:
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM:
      return COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER;
  }
  return currentCollisionWithPlayerState;
}

function transitToPlayingStunnedAnim(currentCollisionWithPlayerState, dueToSelfPlayer, dueToOtherPlayer) {
  if (dueToSelfPlayer) {
    switch (currentCollisionWithPlayerState) {
      case COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE:
      case COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER:
        return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM;
    }
  }

  if (dueToOtherPlayer) {
    switch (currentCollisionWithPlayerState) {
      case COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE:
        return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM;
    }
  }
  // TODO: Any error to throw?
  return currentCollisionWithPlayerState;
}

function transitDuringPlayingStunnedAnim(currentCollisionWithPlayerState, dueToSelfPlayerComesIntoProximity, dueToOtherPlayerComesIntoProximity) {
  if (dueToSelfPlayerComesIntoProximity) {
    switch (currentCollisionWithPlayerState) {
      case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM:
        return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM;

      case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_NOBODY_PLAYING_ANIM:
        return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM;
    }
  }

  if (dueToOtherPlayerComesIntoProximity) {
    switch (currentCollisionWithPlayerState) {
      case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM:
        return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM;

      case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_NOBODY_PLAYING_ANIM:
        return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM;
    }
  }
  // TODO: Any error to throw?
  return currentCollisionWithPlayerState;
}

function transitStunnedAnimPlayingToPlayed(currentCollisionWithPlayerState, forceNotCollidableWithOtherPlayer) {
  switch (currentCollisionWithPlayerState) {
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYING_ANIM:
      return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_ONLY_PLAYED_ANIM;

    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYING_ANIM:
      return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYED_ANIM;

    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYING_ANIM:
      return COLLISION_WITH_PLAYER_STATE.STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM;

    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_NOBODY_PLAYING_ANIM:
      return true == forceNotCollidableWithOtherPlayer ? COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER : COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE;
  }
  // TODO: Any error to throw?
  return currentCollisionWithPlayerState;
}

function transitStunnedAnimPlayedToWalking(currentCollisionWithPlayerState) {
  /*
  * Intentionally NOT transiting for 
  *
  * - STILL_NEAR_SELF_PLAYER_NEAR_OTHER_PLAYER_PLAYED_ANIM, or 
  * - STILL_NEAR_SELF_PLAYER_ONLY_PLAYED_ANIM,
  *
  * which should be transited upon leaving of "SelfPlayer".
  */
  switch (currentCollisionWithPlayerState) {
    case COLLISION_WITH_PLAYER_STATE.STILL_NEAR_OTHER_PLAYER_ONLY_PLAYED_ANIM:
      return COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER;
  }
  // TODO: Any error to throw?
  return currentCollisionWithPlayerState;
}

var BasePlayer = require("./BasePlayer");

cc.Class({
  extends: BasePlayer,

  // LIFE-CYCLE CALLBACKS:
  start: function start() {
    BasePlayer.prototype.start.call(this);

    this.scheduleNewDirection(this._generateRandomDirectionExcluding(0, 0));
  },
  onLoad: function onLoad() {
    var _this = this;

    BasePlayer.prototype.onLoad.call(this);
    var self = this;

    this.collisionWithPlayerState = COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE;

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

    self.onStunnedAnimPlayedSafe = function () {
      var oldCollisionWithPlayerState = self.collisionWithPlayerState;
      self.collisionWithPlayerState = transitStunnedAnimPlayingToPlayed(_this.collisionWithPlayerState, true);
      if (oldCollisionWithPlayerState == self.collisionWithPlayerState || !self.node) return;

      // TODO: Be more specific with "toExcludeDx" and "toExcludeDy".
      self.scheduleNewDirection(self._generateRandomDirectionExcluding(0, 0));
      self.collisionWithPlayerState = transitStunnedAnimPlayedToWalking(self.collisionWithPlayerState);
      setTimeout(function () {
        self.collisionWithPlayerState = transitWalkingConditionallyCollidableToUnconditionallyCollidable(self.collisionWithPlayerState);
      }, 5000);
    };

    self.onStunnedAnimPlayedSafeAction = cc.callFunc(self.onStunnedAnimPlayedSafe, self);

    self.playStunnedAnim = function () {
      var colliededAction1 = cc.rotateTo(0.2, -15);
      var colliededAction2 = cc.rotateTo(0.3, 15);
      var colliededAction3 = cc.rotateTo(0.2, 0);

      self.node.runAction(cc.sequence(cc.callFunc(function () {
        self.player.pause();
      }, self), colliededAction1, colliededAction2, colliededAction3, cc.callFunc(function () {
        self.player.resume();
      }, self), self.onStunnedAnimPlayedSafeAction));

      // NOTE: Use <cc.Animation>.on('stop', self.onStunnedAnimPlayedSafe) if necessary.
    };
  },
  _canMoveBy: function _canMoveBy(vecToMoveBy) {
    if (COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE_WITH_SELF_PLAYER_BUT_NOT_OTHER_PLAYER != this.collisionWithPlayerState && COLLISION_WITH_PLAYER_STATE.WALKING_COLLIDABLE != this.collisionWithPlayerState) {
      return false;
    }

    var superRet = BasePlayer.prototype._canMoveBy.call(this, vecToMoveBy);
    var self = this;

    var computedNewDifferentPosLocalToParentWithinCurrentFrame = self.node.position.add(vecToMoveBy);

    var currentSelfColliderCircle = self.node.getComponent("cc.CircleCollider");
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
      for (var _iterator = self.contactedControlledPlayers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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
    var self = this;

    BasePlayer.prototype.update.call(this, dt);

    if (0 < self.contactedBarriers.length) {
      self.scheduleNewDirection(self._generateRandomDirectionExcluding(self.scheduledDirection.dx, self.scheduledDirection.dy));
    }

    if (tileCollisionManager.isOutOfMapNode(self.mapNode, self.computedNewDifferentPosLocalToParentWithinCurrentFrame)) {
      self.scheduleNewDirection(self._generateRandomDirectionExcluding(self.scheduledDirection.dx, self.scheduledDirection.dy));
    }
  },
  onCollisionEnter: function onCollisionEnter(other, self) {
    BasePlayer.prototype.onCollisionEnter.call(this, other, self);
    var playerScriptIns = self.getComponent(self.node.name);
    switch (other.node.name) {
      case "SelfPlayer":
        playerScriptIns._addContactedControlledPlayers(other);
        if (1 == playerScriptIns.contactedControlledPlayers.length) {
          // When "SelfPlayer" comes into proximity area.
          if (!STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.has(playerScriptIns.collisionWithPlayerState)) {
            playerScriptIns.collisionWithPlayerState = transitToPlayingStunnedAnim(playerScriptIns.collisionWithPlayerState, true, false);
            playerScriptIns.playStunnedAnim();
          } else {
            playerScriptIns.collisionWithPlayerState = transitDuringPlayingStunnedAnim(playerScriptIns.collisionWithPlayerState, true, false);
          }
        }
        break;
      case "NPCPlayer":
        if (1 == playerScriptIns.contactedNPCPlayers.length) {
          // When one of the other "OtherPlayer"s comes into proximity area.
          if (!STILL_SHOULD_NOT_PLAY_STUNNED_ANIM_SET.has(playerScriptIns.collisionWithPlayerState)) {
            var oldState = playerScriptIns.collisionWithPlayerState;
            playerScriptIns.collisionWithPlayerState = transitToPlayingStunnedAnim(oldState, false, true);
            if (playerScriptIns.collisionWithPlayerState != oldState) {
              playerScriptIns.playStunnedAnim();
            }
          } else {
            playerScriptIns.collisionWithPlayerState = transitDuringPlayingStunnedAnim(playerScriptIns.collisionWithPlayerState, false, true);
          }
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
    BasePlayer.prototype.onCollisionExit.call(this, other, self);
    var playerScriptIns = self.getComponent(self.node.name);
    switch (other.node.name) {
      case "SelfPlayer":
        playerScriptIns._removeContactedControlledPlayer(other);
        if (0 == playerScriptIns.contactedControlledPlayers.length) {
          // Special release step.
          if (STILL_NEAR_SELF_PLAYER_STATE_SET.has(playerScriptIns.collisionWithPlayerState)) {
            playerScriptIns.collisionWithPlayerState = transitUponSelfPlayerLeftProximityArea(playerScriptIns.collisionWithPlayerState);
          }
        }
        if (0 == playerScriptIns.contactedControlledPlayers.length && 0 == playerScriptIns.contactedNPCPlayers.length) {
          transitDueToNoBodyInProximityArea(playerScriptIns.collisionWithPlayerState);
        }
        break;
      case "NPCPlayer":
        if (0 == playerScriptIns.contactedControlledPlayers.length && 0 == playerScriptIns.contactedNPCPlayers.length) {
          transitDueToNoBodyInProximityArea(playerScriptIns.collisionWithPlayerState);
        }
        break;
      default:
        break;
    }
  }
});

cc._RF.pop();