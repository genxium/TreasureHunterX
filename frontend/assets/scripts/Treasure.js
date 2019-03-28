cc.Class({
  extends: cc.Component,

  properties: {
    lowScoreSpriteFrame: {
      type: cc.SpriteFrame,
      default: null,
    },
    highScoreSpriteFrame: {
      type: cc.SpriteFrame,
      default: null,
    }
  },

  setData (treasureInfo) {
    const self = this;
    this.score = treasureInfo.score ? treasureInfo.score : 100 ;

    this.type = treasureInfo.type ? treasureInfo.type : 1;


    this.treasureInfo = treasureInfo;


    //const imgName = this.type == 1 ? 'lowScoreTreasure' : 'highScoreTreasure';
    const spriteComponent = this.node.getComponent(cc.Sprite);
    spriteComponent.spriteFrame = this.type == 1 ? this.lowScoreSpriteFrame : this.highScoreSpriteFrame;


    //hardcode treasurePNG's path.
    //cc.loader.loadRes("textures/treasures/"+ this.type, cc.SpriteFrame, function (err, frame) {}
    /*
    console.log("textures/treasures/"+ imgName);
    cc.loader.loadRes("textures/treasures/"+ imgName, cc.SpriteFrame, function (err, frame) {
      if(err){
        cc.warn(err);
        return;
      }
      spriteComponent.spriteFrame = frame; 
    })
    */
 //   const binglingAnimComp = this.animNode.getComponent(cc.Animation);
//    binglingAnimComp.play(this.type);
  },

  playPickedUpAnimAndDestroy() {
    /*
    const self = this;
    const parentNode = self.node.parent;
    if (!parentNode) return;
    if (!self.pickedUpanimPrefab) return;
    const animNode = cc.instantiate(self.pickedUpanimPrefab); 
    const animScriptIns = animNode.getComponent("TreasurePickedUpAnim");
    animScriptIns.setData(this.treasureInfo);
    animNode.setPosition(self.node.position);  
    safelyAddChild(parentNode, animNode);
    setLocalZOrder(animNode, 999);
    */
    this.node.destroy();
  },

  start() {},
})
