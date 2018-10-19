"use strict";
cc._RF.push(module, '78830/HTiVJoaf8n504g/J4', 'CameraTracker');
// scripts/CameraTracker.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        mapNode: {
            type: cc.Node,
            default: null
        }
    },

    // onLoad () {},

    start: function start() {},
    update: function update(dt) {
        var self = this;
        var canvasNode = self.node;
        var mapNode = self.mapNode;

        var mapScriptIns = self.mapNode.getComponent("Map");
        var selfPlayerNode = mapScriptIns.selfPlayerNode;
        if (null == selfPlayerNode) return;

        var selfPlayerPosDiffInMapNode = selfPlayerNode.position;
        var canvasNodeScale = canvasNode.getScale();
        var targetPos = selfPlayerPosDiffInMapNode.mul(-1);
        if (targetPos.x == mapNode.position.x && targetPos.y == mapNode.position.y) return;
        mapNode.setPosition(targetPos);
    }
});

cc._RF.pop();