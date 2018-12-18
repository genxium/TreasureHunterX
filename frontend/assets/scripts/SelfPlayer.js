const BasePlayer = require("./BasePlayer"); 

cc.Class({
  extends: BasePlayer,

  // LIFE-CYCLE CALLBACKS:
  start() {
    BasePlayer.prototype.start.call(this);
  },

  onLoad() {
    BasePlayer.prototype.onLoad.call(this);
    this.clips = {
      '01': 'FlatHeadSisterRunTop',
      '0-1': 'FlatHeadSisterRunBottom',
      '-20': 'FlatHeadSisterRunLeft',
      '20': 'FlatHeadSisterRunRight',
      '-21': 'FlatHeadSisterRunTopLeft',
      '21': 'FlatHeadSisterRunTopRight',
      '-2-1': 'FlatHeadSisterRunBottomLeft',
      '2-1': 'FlatHeadSisterRunBottomRight'
    };
    this.attackedClips = {
      '01': 'attackedTop',
      '0-1': 'attackedBottom',
      '-20': 'attackedLeft',
      '20': 'attackedRight',
      '-21': 'attackedTopLeft',
      '21': 'attackedTopRight',
      '-2-1': 'attackedBottomLeft',
      '2-1': 'attackedBottomRight'
    };
  },

  update(dt) {
    BasePlayer.prototype.update.call(this, dt);
  },

});
