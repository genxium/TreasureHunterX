"use strict";
cc._RF.push(module, '27562q//mhCf7WYuOU6ym6H', 'SimplePressToGoDialog');
// scripts/SimplePressToGoDialog.js

"use strict";

cc.Class({
  extends: cc.Component,
  properties: {},

  start: function start() {},
  onLoad: function onLoad() {},
  update: function update(dt) {},
  dismissDialog: function dismissDialog(postDismissalByYes, evt) {
    var self = this;
    var target = evt.target;
    self.node.parent.removeChild(self.node);
    if ("Yes" == target._name) {
      // This is a dirty hack!
      postDismissalByYes();
    }
  }
});

cc._RF.pop();