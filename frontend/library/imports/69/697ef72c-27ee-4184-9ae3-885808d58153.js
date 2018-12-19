"use strict";
cc._RF.push(module, '697efcsJ+5BhJrjiFgI1YFT', 'TreasurePickedUpAnim');
// scripts/TreasurePickedUpAnim.js

"use strict";

cc.Class({
  extends: cc.Component,

  properties: {
    pickedUpAnimNode: {
      type: cc.Node,
      default: null
    },
    durationMillis: {
      default: 4000
    }
  },

  // LIFE-CYCLE CALLBACKS:
  update: function update(dt) {
    var changingNode = this.pickedUpAnimNode;
    var elapsedMillis = Date.now() - this.startedAtMillis;
    console.log(elapsedMillis);
    if (elapsedMillis > this.durationMillis) {
      this.node.destroy();
      return;
    }
    if (elapsedMillis >= this.halfDurationMillis) {
      var posDiff = cc.v2(0, dt * this.yIncreaseSpeed);
      changingNode.setPosition(changingNode.position.add(posDiff));
      changingNode.scale += this.scaleIncreaseSpeed * dt;
    } else {
      var _posDiff = cc.v2(0, dt * this.yDecreaseSpeed);
      changingNode.setPosition(changingNode.position.sub(_posDiff));
      changingNode.opacity -= dt * this.opacityDegradeSpeed;
    }
  },
  onLoad: function onLoad() {
    this.g = cc.v2(0, self.gY);
    this.halfDurationMillis = 0.5 * this.durationMillis;
    this.opacityDegradeSpeed = 255 * 1000 / this.halfDurationMillis;
    this.yIncreaseSpeed = 100 * 1000 / this.halfDurationMillis;
    this.scaleIncreaseSpeed = 2 * 1000 / this.halfDurationMillis;
    this.pickedUpAnimNode.scale = 0;
    this.startedAtMillis = Date.now();
    this.yDecreaseSpeed = 30 * 1000 / this.halfDurationMillis;
  }
});

cc._RF.pop();