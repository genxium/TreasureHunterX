"use strict";
cc._RF.push(module, 'ea9650l7IJHjL2ymsB5gasO', 'Bullet');
// scripts/Bullet.js

"use strict";

module.export = cc.Class({
  extends: cc.Component,

  properties: {
    localIdInBattle: {
      default: null
    },
    linearSpeed: {
      default: 0.0
    },
    activeDirection: {
      default: null
    }
  },

  onLoad: function onLoad() {
    if (null == this.activeDirection) {
      this.activeDirection = {
        dx: 0.0,
        dy: 0.0
      };
    }
  },
  _calculateVecToMoveByWithChosenDir: function _calculateVecToMoveByWithChosenDir(elapsedTime, sDir) {
    if (0 == sDir.dx && 0 == sDir.dy) {
      return cc.v2();
    }
    var self = this;
    var distanceToMove = self.linearSpeed * elapsedTime;
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

    return self._calculateVecToMoveByWithChosenDir(elapsedTime, sDir);
  },
  _canMoveBy: function _canMoveBy(vecToMoveBy) {
    return true;
  },
  update: function update(dt) {
    var self = this;
    var vecToMoveBy = self._calculateVecToMoveBy(dt);
    if (self._canMoveBy(vecToMoveBy)) {
      self.node.position = self.node.position.add(vecToMoveBy);
    }
  }
});

cc._RF.pop();