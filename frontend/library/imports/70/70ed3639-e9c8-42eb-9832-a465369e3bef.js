"use strict";
cc._RF.push(module, '70ed3Y56chC65gypGU2njvv', 'PBCodec');
// scripts/PBCodec.js

'use strict';

cc.Class({
  extends: cc.Component,

  encodeFrameSync: function encodeFrameSync(objectData) {
    var message = window.FrameSync.create(objectData);
    var buffer = window.FrameSync.encode(message).finish();
    return buffer;
  },

  decodeFrameAck: function decodeFrameAck(buffer) {
    try {
      var typedArray = new Uint8Array(buffer);
      return undefined.frameAck.decode(typedArray);
    } catch (e) {
      cc.error('decode frame ack error: %o', e);
    }
    return null;
  }
});

cc._RF.pop();