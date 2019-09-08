cc.Class({
    extends: cc.Component,

    properties: {
      mapNode: {
        type: cc.Node,
        default: null
      },
      
    },

    onLoad () {
      this.mainCamera = this.mapNode.parent.getChildByName("Main Camera").getComponent(cc.Camera);
      this.mapScriptIns = this.mapNode.getComponent("Map");
    },

    start() {},

    update(dt) {
      // const self = this;
      // const canvasNode = self.node;
      // const mapNode = self.mapNode;
  
      // if (0 < mapNode.getNumberOfRunningActions()) {
      //   return;
      // }

      // const mapScriptIns = self.mapNode.getComponent("Map");
      // const selfPlayerNode = mapScriptIns.selfPlayerNode;
      // if (null == selfPlayerNode) return;

      // const selfPlayerPosDiffInMapNode = selfPlayerNode.position;
      // const canvasNodeScale = canvasNode.scale;
      // const targetPos = selfPlayerPosDiffInMapNode.mul(-1);  
      // if (targetPos.x == mapNode.position.x && targetPos.y == mapNode.position.y) return;
      // mapNode.runAction(cc.moveTo(0.2 /* hardcoded, in seconds */, targetPos));

      const self = this;
      if (!self.mainCamera) return;
      if (!self.mapScriptIns) return;
      const selfPlayerNode = self.mapScriptIns.selfPlayerNode;
      if (!selfPlayerNode) return;
      self.mainCamera.node.setPosition(selfPlayerNode.position);
    }
});
