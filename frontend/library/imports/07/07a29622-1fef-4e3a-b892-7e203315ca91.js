"use strict";
cc._RF.push(module, '07a29YiH+9OOriSfiAzFcqR', 'WsSessionMgr');
// scripts/WsSessionMgr.js

"use strict";

window.closeWSConnection = function () {
  if (null == window.clientSession || window.clientSession.readyState != WebSocket.OPEN) return;
  window.clientSession.close();
};

window.boundRoomId = cc.sys.localStorage.selfPlayer && cc.sys.localStorage.selfPlayer.boundRoomId ? cc.sys.localStorage.selfPlayer.boundRoomId : null;
window.handleHbRequirements = function (resp) {
  if (constants.RET_CODE.OK != resp.ret) return;
  if (null == window.boundRoomId) {
    window.boundRoomId = resp.data.boundRoomId;
    // By now, `cc.sys.localStorage.selfPlayer` shouldn't be null.

    var oldVal = JSON.parse(cc.sys.localStorage.selfPlayer);
    var newVal = {};
    Object.assign(newVal, oldVal);
    Object.assign(newVal, {
      boundRoomId: window.boundRoomId
    });
    cc.sys.localStorage.selfPlayer = JSON.stringify(newVal);
  }

  window.clientSessionPingInterval = setInterval(function () {
    if (clientSession.readyState != WebSocket.OPEN) return;
    var param = {
      msgId: Date.now(),
      act: "HeartbeatPing",
      data: {
        clientTimestamp: Date.now()
      }
    };
    clientSession.send(JSON.stringify(param));
  }, resp.data.intervalToPing);
};

window.handleHbPong = function (resp) {
  if (constants.RET_CODE.OK != resp.ret) return;
  // TBD.
};

window.initPersistentSessionClient = function (onopenCb) {
  if (window.clientSession && window.clientSession.readyState == WebSocket.OPEN) {
    if (null == onopenCb) return;
    onopenCb();
    return;
  }

  var intAuthToken = cc.sys.localStorage.selfPlayer ? JSON.parse(cc.sys.localStorage.selfPlayer).intAuthToken : "";

  var existingBoundRoomId = cc.sys.localStorage.selfPlayer && cc.sys.localStorage.selfPlayer.boundRoomId ? cc.sys.localStorage.selfPlayer.boundRoomId : null;

  var urlToConnect = backendAddress.PROTOCOL.replace('http', 'ws') + '://' + backendAddress.HOST + ":" + backendAddress.PORT + backendAddress.WS_PATH_PREFIX + "?intAuthToken=" + intAuthToken;
  if (null != existingBoundRoomId) {
    urlToConnect = urlToConnect + "boundRoomId=" + existingBoundRoomId;
  }
  var clientSession = new WebSocket(urlToConnect);

  clientSession.onopen = function (event) {
    cc.log("The WS clientSession is opened.");
    window.clientSession = clientSession;
    if (null == onopenCb) return;
    onopenCb();
  };

  clientSession.onmessage = function (event) {
    var resp = JSON.parse(event.data);
    switch (resp.act) {
      case "HeartbeatRequirements":
        window.handleHbRequirements(resp);
        break;
      case "HeartbeatPong":
        window.handleHbPong(resp);
        break;
      case "DownsyncRoomFrame":
        if (window.handleDownsyncRoomFrame) {
          window.handleDownsyncRoomFrame(resp.data);
        }
        break;
      default:
        cc.log("" + JSON.stringify(resp));
        break;
    }
  };

  clientSession.onerror = function (event) {
    cc.error("Error caught on the WS clientSession: " + event);
    if (!window.handleClientSessionCloseOrError) return;
    window.handleClientSessionCloseOrError();
  };

  clientSession.onclose = function (event) {
    cc.log("The WS clientSession is closed: " + event);
    if (!window.handleClientSessionCloseOrError) return;
    window.handleClientSessionCloseOrError();
  };
};

cc._RF.pop();