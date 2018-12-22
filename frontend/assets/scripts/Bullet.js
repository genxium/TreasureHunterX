 module.export = cc.Class({
  extends: cc.Component,

  properties: {
    localIdInBattle: {
      default: null, 
    },
    linearSpeed: {
      default: 0.0,
    },
    activeDirection: {
      default: null, 
    }, 
  },

  onLoad() {
    if (null == this.activeDirection) {
      this.activeDirection = {
        dx: 0.0,
        dy: 0.0,
      };
    } 
  },

  _calculateVecToMoveByWithChosenDir(elapsedTime, sDir) {
    if (0 == sDir.dx && 0 == sDir.dy) {
      return cc.v2();
    }
    const self = this;
    const distanceToMove = (self.linearSpeed * elapsedTime);
    const denominator = Math.sqrt(sDir.dx * sDir.dx + sDir.dy * sDir.dy);
    const unitProjDx = (sDir.dx / denominator);
    const unitProjDy = (sDir.dy / denominator);
    return cc.v2(
      distanceToMove * unitProjDx,
      distanceToMove * unitProjDy,
    );
  },

  _calculateVecToMoveBy(elapsedTime) {
    const self = this;
    // Note that `sDir` used in this method MUST BE a copy in RAM.
    let sDir = {
      dx: self.activeDirection.dx,
      dy: self.activeDirection.dy,
    };

    if (0 == sDir.dx && 0 == sDir.dy) {
      return cc.v2();
    }

    return self._calculateVecToMoveByWithChosenDir(elapsedTime, sDir);
  },

  _canMoveBy(vecToMoveBy) {
    return true;
  },

  update(dt) {
    const self = this;
    const vecToMoveBy = self._calculateVecToMoveBy(dt);
    if (self._canMoveBy(vecToMoveBy)) {
      self.node.position = self.node.position.add(vecToMoveBy);
    }
  },
});
