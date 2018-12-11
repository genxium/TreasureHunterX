cc.Class({
    extends: cc.Component,

    properties: {
        mapNode: {
            type: cc.Node,
            default: null
        }
    },

    // onLoad () {},

    start() {},

    update(dt) {
      const self = this;
      const canvasNode = self.node;
      const mapNode = self.mapNode;
  
      if (0 < mapNode.getNumberOfRunningActions()) {
        return;
      }

      const mapScriptIns = self.mapNode.getComponent("Map");
      const selfPlayerNode = mapScriptIns.selfPlayerNode;
      if (null == selfPlayerNode) return;

      const selfPlayerPosDiffInMapNode = selfPlayerNode.position;
      const canvasNodeScale = canvasNode.scale;
      const targetPos = selfPlayerPosDiffInMapNode.mul(-1);  
      if (targetPos.x == mapNode.position.x && targetPos.y == mapNode.position.y) return;
      mapNode.runAction(cc.moveTo(0.2 /* hardcoded, in seconds */, targetPos));
    }
});

