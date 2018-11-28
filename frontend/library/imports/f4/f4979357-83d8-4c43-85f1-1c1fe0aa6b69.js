"use strict";
cc._RF.push(module, 'f4979NXg9hMQ4XxHB/gqmtp', 'conf');
// plugin_scripts/conf.js

"use strict";
/*
var backendAddress = {
  PROTOCOL: 'http',
  HOST: '192.168.31.241',
  PORT: "9990",
  WS_PATH_PREFIX: "/tsrht",
};
*/

var backendAddress = {
  PROTOCOL: 'https',
  HOST: 'tsrht.lokcol.com',
  PORT: "443",
  WS_PATH_PREFIX: "/tsrht"
};
window.language = "en";
window.backendAddress = backendAddress;

cc._RF.pop();