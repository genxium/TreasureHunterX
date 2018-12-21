const BasePlayer = require("./BasePlayer"); 

cc.Class({
  extends: BasePlayer,

  // LIFE-CYCLE CALLBACKS:
  start() {
    BasePlayer.prototype.start.call(this);
  },

  onLoad() {
    BasePlayer.prototype.onLoad.call(this);
    this.attackedClips = {
      '01': 'attackedLeft',
      '0-1': 'attackedRight',
      '-20': 'attackedLeft',
      '20': 'attackedRight',
      '-21': 'attackedLeft',
      '21': 'attackedRight',
      '-2-1': 'attackedLeft',
      '2-1': 'attackedRight'
    };
  },

  update(dt) {
    BasePlayer.prototype.update.call(this, dt);
  },

});
