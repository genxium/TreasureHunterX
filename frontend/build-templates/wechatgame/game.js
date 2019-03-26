/****** Kobako: copy from the built file ******/

require('libs/weapp-adapter/index');
var Parser = require('libs/xmldom/dom-parser');
window.DOMParser = Parser.DOMParser;
require('libs/wx-downloader.js');
require('src/settings');
var settings = window._CCSettings;
require('main');
require(settings.debug ? 'cocos2d-js.js' : 'cocos2d-js-min.js');
require('./libs/engine/index.js');

wxDownloader.REMOTE_SERVER_ROOT = "";
wxDownloader.SUBCONTEXT_ROOT = "";
var pipeBeforeDownloader = cc.loader.md5Pipe || cc.loader.assetLoader;
cc.loader.insertPipeAfter(pipeBeforeDownloader, wxDownloader);

if (cc.sys.browserType === cc.sys.BROWSER_TYPE_WECHAT_GAME_SUB) {
    require('./libs/sub-context-adapter');
}
else {
    // Release Image objects after uploaded gl texture
    cc.macro.CLEANUP_IMAGE_CACHE = true;
}

window.boot();

/****** Kobako: copy from the built file ******/


//kobako: Add for decoding protobuf 
var protobuf = require('libs/protobuf.js');
var bundle = require('libs/room_downsync_frame_proto_bundle.js');
window.RoomDownsyncFrameForWeapp = bundle.models.RoomDownsyncFrame;
