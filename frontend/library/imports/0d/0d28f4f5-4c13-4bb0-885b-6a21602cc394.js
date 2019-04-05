"use strict";
cc._RF.push(module, '0d28fT1TBNLsIhbaiFgLMOU', 'conf');
// plugin_scripts/conf.js

"use strict";

if (CC_DEBUG) {
  // var backendAddress = {
  //   PROTOCOL: 'http',
  //   HOST: 'localhost',
  //   PORT: "9992",
  //   WS_PATH_PREFIX: "/tsrht",
  // };

  // var wechatAddress = {
  //   PROTOCOL: "http",
  //   HOST: "119.29.236.44",
  //   PORT: "8089",
  //   PROXY: "",
  //   APPID_LITERAL: "appid=wx5432dc1d6164d4e",
  // };

  var backendAddress = {
    PROTOCOL: 'https',
    HOST: 'tsrht.lokcol.com',
    PORT: "443",
    WS_PATH_PREFIX: "/tsrht"
  };

  var wechatAddress = {
    PROTOCOL: "https",
    HOST: "open.weixin.qq.com",
    PORT: "",
    PROXY: "",
    APPID_LITERAL: "appid=wxe7063ab415266544"
  };
} else {
  var backendAddress = {
    PROTOCOL: 'https',
    HOST: 'tsrht.lokcol.com',
    PORT: "443",
    WS_PATH_PREFIX: "/tsrht"
  };

  var wechatAddress = {
    PROTOCOL: "https",
    HOST: "open.weixin.qq.com",
    PORT: "",
    PROXY: "",
    APPID_LITERAL: "appid=wxe7063ab415266544"
  };
}

window.language = "zh";
window.backendAddress = backendAddress;
window.wechatAddress = wechatAddress;

cc._RF.pop();