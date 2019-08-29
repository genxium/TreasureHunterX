#!/bin/bash

basedir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

# You have to install the command according to https://www.npmjs.com/package/protobufjs#pbjs-for-javascrip://www.npmjs.com/package/protobufjs#pbjs-for-javascript.

# The specific filename is respected by "frontend/build-templates/wechatgame/game.js".
pbjs -t static-module -w commonjs --keep-case --force-message -o $basedir/build-templates/wechatgame/libs/room_downsync_frame_proto_bundle.forcemsg.js $basedir/assets/resources/pbfiles/room_downsync_frame.proto

sed -i 's#require("protobufjs/minimal")#require("./protobuf-with-floating-num-decoding-endianess-toggle")#g' $basedir/build-templates/wechatgame/libs/room_downsync_frame_proto_bundle.forcemsg.js
