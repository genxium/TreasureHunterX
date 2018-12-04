const BasePlayer = require("./BasePlayer"); 

cc.Class({
  extends: BasePlayer,

  // LIFE-CYCLE CALLBACKS:
  start() {
    BasePlayer.prototype.start.call(this);
  },

  onLoad() {
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

  _canMoveBy(vecToMoveBy) {
    const superRet = BasePlayer.prototype._canMoveBy.call(this, vecToMoveBy);
    const self = this;

    const computedNewDifferentPosLocalToParentWithinCurrentFrame = self.node.position.add(vecToMoveBy);

    const currentSelfColliderCircle = self.node.getComponent(cc.CircleCollider); 
    let nextSelfColliderCircle = null;
    if (0 < self.contactedBarriers.length || 0 < self.contactedNPCPlayers.length || 0 < self.contactedControlledPlayers) {
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

    for (let aCircleCollider of self.contactedNPCPlayers) {
      let contactedCircleLocalToParentWithinCurrentFrame = {
        position: aCircleCollider.node.position.add(aCircleCollider.offset),  
        radius: aCircleCollider.radius,
      };
      if (cc.Intersection.circleCircle(contactedCircleLocalToParentWithinCurrentFrame, nextSelfColliderCircle)) {
        return false;
      }
    }

    return superRet;
  },

  update(dt) {
    BasePlayer.prototype.update.call(this, dt);
  },

});
