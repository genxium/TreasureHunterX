"use strict";
cc._RF.push(module, '5eea6zlA0NHdoCk/M1pvQmb', 'Treasure');
// scripts/Treasure.js

'use strict';

cc.Class({
  extends: cc.Component,

  properties: {
    pickedUpanimPrefab: {
      type: cc.Prefab,
      default: null
    },
    animNode: {
      type: cc.Node,
      default: null
    }
  },

  setData: function setData(treasureInfo) {
    var self = this;
    this.score = treasureInfo.score ? treasureInfo.score : 100;

    this.type = treasureInfo.type ? treasureInfo.type : 1;

    var imgName = this.type == 1 ? 'lowScoreTreasure' : 'highScoreTreasure';

    this.treasureInfo = treasureInfo;
    var spriteComponent = this.node.getComponent(cc.Sprite);
    //hardcode treasurePNG's path.
    //cc.loader.loadRes("textures/treasures/"+ this.type, cc.SpriteFrame, function (err, frame) {}
    console.log("textures/treasures/" + imgName);
    cc.loader.loadRes("textures/treasures/" + imgName, cc.SpriteFrame, function (err, frame) {
      if (err) {
        cc.warn(err);
        return;
      }
      spriteComponent.spriteFrame = frame;
    });
    //   const binglingAnimComp = this.animNode.getComponent(cc.Animation);
    //    binglingAnimComp.play(this.type);
  },
  playPickedUpAnimAndDestroy: function playPickedUpAnimAndDestroy() {
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
  start: function start() {}
});

cc._RF.pop();