cc.Class({
  extends: cc.Component,

  properties: {
    animPrefab: {
      type: cc.Prefab,
      default: null
    }
  },


  playPickedUpAnimAndDestroy() {
    const self = this;
    const parentNode = self.node.parent;
    if (!parentNode) return;
    if (!self.animPrefab) return;
    const animNode = cc.instantiate(self.animPrefab); 
    animNode.setPosition(self.node.position);  
    safelyAddChild(parentNode, animNode);
    setLocalZOrder(animNode, 999);
    this.node.destroy();
  },

  start() {},
})
