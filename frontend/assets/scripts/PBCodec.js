cc.Class({
  extends: cc.Component,

  encodeFrameSync: (objectData) => {
    const message = window.FrameSync.create(objectData);
    const buffer  = window.FrameSync.encode(message).finish();
    return buffer;
  },

  decodeFrameAck: (buffer) => {
    try {
      const typedArray = new Uint8Array(buffer);
      return this.frameAck.decode(typedArray);
    } catch (e) {
      cc.error('decode frame ack error: %o', e);
    }
    return null;
  },
});
