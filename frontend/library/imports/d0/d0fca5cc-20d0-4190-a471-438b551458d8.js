"use strict";
cc._RF.push(module, 'd0fcaXMINBBkKRxQ4tVFFjY', 'conf');
// plugin_scripts/conf.js

"use strict";

if (CC_DEBUG) {
  var backendAddress = {
    PROTOCOL: 'http',
    HOST: 'localhost',
    PORT: "9992",
    WS_PATH_PREFIX: "/tsrht"
  };
} else {
  var backendAddress = {
    PROTOCOL: 'https',
    HOST: 'tsrht.lokcol.com',
    PORT: "443",
    WS_PATH_PREFIX: "/tsrht"
  };
}
window.language = "en";
window.backendAddress = backendAddress;

cc._RF.pop();