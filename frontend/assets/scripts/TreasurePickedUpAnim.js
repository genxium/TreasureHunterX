cc.Class({
  extends: cc.Component,

  properties: {
    pickedUpAnimNode: {
      type: cc.Node,
      default: null
    },
    durationMillis: {
      default: 4000,
    },
  },

  // LIFE-CYCLE CALLBACKS:
  update (dt) {
    const changingNode = this.pickedUpAnimNode; 
    const elapsedMillis = Date.now() - this.startedAtMillis; 
    console.log(elapsedMillis);
    if (elapsedMillis > this.durationMillis) {
      this.node.destroy();
      return;
    }
    if (elapsedMillis >= this.halfDurationMillis) {
      let posDiff = cc.v2(0, dt * this.yIncreaseSpeed);
      changingNode.setPosition(changingNode.position.add(posDiff));
      changingNode.scale += (this.scaleIncreaseSpeed*dt); 
    }else {
      let posDiff = cc.v2(0, dt * this.yDecreaseSpeed);     
      changingNode.setPosition(changingNode.position.sub(posDiff));
      changingNode.opacity -= dt * this.opacityDegradeSpeed;
    }
  },

  onLoad() {
    this.g = cc.v2(0, self.gY);
    this.halfDurationMillis = (0.5*this.durationMillis);
    this.opacityDegradeSpeed = (255*1000/this.halfDurationMillis);
    this.yIncreaseSpeed = (100*1000/this.halfDurationMillis);
    this.scaleIncreaseSpeed = (2 * 1000/this.halfDurationMillis);
    this.pickedUpAnimNode.scale = 0; 
    this.startedAtMillis = Date.now();
    this.yDecreaseSpeed = (30*1000/this.halfDurationMillis);
  }
});
