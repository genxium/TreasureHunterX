"use strict";
cc._RF.push(module, 'a36ffw/0PNL64S7ts5SXAMD', 'conf');
// plugin_scripts/conf.js

"use strict";

if (CC_DEBUG) {
  var backendAddress = {
    PROTOCOL: 'http',
    HOST: '192.168.31.241',
    PORT: "9992",
    WS_PATH_PREFIX: "/tsrht",
    PROXY: ""
  };
} else {
  var backendAddress = {
    PROTOCOL: 'https',
    HOST: 'tsrht.lokcol.com',
    PORT: "443",
    WS_PATH_PREFIX: "/tsrht",
    PROXY: ""
  };
}
// Production config.
var wechatAddress = {
  PROTOCOL: "https",
  HOST: "open.weixin.qq.com",
  PORT: "",
  PROXY: "",
  APPID_LITERAL: "appid=wxe7063ab415266544"
};
// fserver config.
/*
var wechatAddress = {
   PROTOCOL: "http",
   HOST: "192.168.31.241",
   PORT: "8089",
   PROXY: "",
   APPID_LITERAL: "appid=wx5432dc1d6164d4e",
};*/
window.language = "en";
window.backendAddress = backendAddress;
window.wechatAddress = wechatAddress;

cc._RF.pop();