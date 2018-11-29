cc.Class({
  extends: cc.Component,

  properties: {
    modeButton: {
      type: cc.Button,
      default: null
    },
    mapNode: {
      type: cc.Node,
      default: null
    },
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
     var modeBtnClickEventHandler = new cc.Component.EventHandler();
     modeBtnClickEventHandler.target = this.mapNode; 
     modeBtnClickEventHandler.component = "Map";
     modeBtnClickEventHandler.handler = "initWSConnection";
     modeBtnClickEventHandler.customEventData = () =>{
      this.node.active = false;
     };
     this.modeButton.clickEvents.push(modeBtnClickEventHandler);
  }
  
});
