/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("./protobuf-with-floating-num-decoding-endianess-toggle");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.treasurehunterx = (function() {

    /**
     * Namespace treasurehunterx.
     * @exports treasurehunterx
     * @namespace
     */
    var treasurehunterx = {};

    treasurehunterx.Direction = (function() {

        /**
         * Properties of a Direction.
         * @memberof treasurehunterx
         * @interface IDirection
         * @property {number|null} [dx] Direction dx
         * @property {number|null} [dy] Direction dy
         */

        /**
         * Constructs a new Direction.
         * @memberof treasurehunterx
         * @classdesc Represents a Direction.
         * @implements IDirection
         * @constructor
         * @param {treasurehunterx.IDirection=} [properties] Properties to set
         */
        function Direction(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Direction dx.
         * @member {number} dx
         * @memberof treasurehunterx.Direction
         * @instance
         */
        Direction.prototype.dx = 0;

        /**
         * Direction dy.
         * @member {number} dy
         * @memberof treasurehunterx.Direction
         * @instance
         */
        Direction.prototype.dy = 0;

        /**
         * Creates a new Direction instance using the specified properties.
         * @function create
         * @memberof treasurehunterx.Direction
         * @static
         * @param {treasurehunterx.IDirection=} [properties] Properties to set
         * @returns {treasurehunterx.Direction} Direction instance
         */
        Direction.create = function create(properties) {
            return new Direction(properties);
        };

        /**
         * Encodes the specified Direction message. Does not implicitly {@link treasurehunterx.Direction.verify|verify} messages.
         * @function encode
         * @memberof treasurehunterx.Direction
         * @static
         * @param {treasurehunterx.Direction} message Direction message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Direction.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.dx != null && message.hasOwnProperty("dx"))
                writer.uint32(/* id 1, wireType 1 =*/9).double(message.dx);
            if (message.dy != null && message.hasOwnProperty("dy"))
                writer.uint32(/* id 2, wireType 1 =*/17).double(message.dy);
            return writer;
        };

        /**
         * Encodes the specified Direction message, length delimited. Does not implicitly {@link treasurehunterx.Direction.verify|verify} messages.
         * @function encodeDelimited
         * @memberof treasurehunterx.Direction
         * @static
         * @param {treasurehunterx.Direction} message Direction message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Direction.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Direction message from the specified reader or buffer.
         * @function decode
         * @memberof treasurehunterx.Direction
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {treasurehunterx.Direction} Direction
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Direction.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.treasurehunterx.Direction();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.dx = reader.double();
                    break;
                case 2:
                    message.dy = reader.double();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Direction message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof treasurehunterx.Direction
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {treasurehunterx.Direction} Direction
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Direction.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Direction message.
         * @function verify
         * @memberof treasurehunterx.Direction
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Direction.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.dx != null && message.hasOwnProperty("dx"))
                if (typeof message.dx !== "number")
                    return "dx: number expected";
            if (message.dy != null && message.hasOwnProperty("dy"))
                if (typeof message.dy !== "number")
                    return "dy: number expected";
            return null;
        };

        /**
         * Creates a Direction message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof treasurehunterx.Direction
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {treasurehunterx.Direction} Direction
         */
        Direction.fromObject = function fromObject(object) {
            if (object instanceof $root.treasurehunterx.Direction)
                return object;
            var message = new $root.treasurehunterx.Direction();
            if (object.dx != null)
                message.dx = Number(object.dx);
            if (object.dy != null)
                message.dy = Number(object.dy);
            return message;
        };

        /**
         * Creates a plain object from a Direction message. Also converts values to other types if specified.
         * @function toObject
         * @memberof treasurehunterx.Direction
         * @static
         * @param {treasurehunterx.Direction} message Direction
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Direction.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.dx = 0;
                object.dy = 0;
            }
            if (message.dx != null && message.hasOwnProperty("dx"))
                object.dx = options.json && !isFinite(message.dx) ? String(message.dx) : message.dx;
            if (message.dy != null && message.hasOwnProperty("dy"))
                object.dy = options.json && !isFinite(message.dy) ? String(message.dy) : message.dy;
            return object;
        };

        /**
         * Converts this Direction to JSON.
         * @function toJSON
         * @memberof treasurehunterx.Direction
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Direction.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Direction;
    })();

    treasurehunterx.Vec2D = (function() {

        /**
         * Properties of a Vec2D.
         * @memberof treasurehunterx
         * @interface IVec2D
         * @property {number|null} [x] Vec2D x
         * @property {number|null} [y] Vec2D y
         */

        /**
         * Constructs a new Vec2D.
         * @memberof treasurehunterx
         * @classdesc Represents a Vec2D.
         * @implements IVec2D
         * @constructor
         * @param {treasurehunterx.IVec2D=} [properties] Properties to set
         */
        function Vec2D(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Vec2D x.
         * @member {number} x
         * @memberof treasurehunterx.Vec2D
         * @instance
         */
        Vec2D.prototype.x = 0;

        /**
         * Vec2D y.
         * @member {number} y
         * @memberof treasurehunterx.Vec2D
         * @instance
         */
        Vec2D.prototype.y = 0;

        /**
         * Creates a new Vec2D instance using the specified properties.
         * @function create
         * @memberof treasurehunterx.Vec2D
         * @static
         * @param {treasurehunterx.IVec2D=} [properties] Properties to set
         * @returns {treasurehunterx.Vec2D} Vec2D instance
         */
        Vec2D.create = function create(properties) {
            return new Vec2D(properties);
        };

        /**
         * Encodes the specified Vec2D message. Does not implicitly {@link treasurehunterx.Vec2D.verify|verify} messages.
         * @function encode
         * @memberof treasurehunterx.Vec2D
         * @static
         * @param {treasurehunterx.Vec2D} message Vec2D message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Vec2D.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.x != null && message.hasOwnProperty("x"))
                writer.uint32(/* id 1, wireType 1 =*/9).double(message.x);
            if (message.y != null && message.hasOwnProperty("y"))
                writer.uint32(/* id 2, wireType 1 =*/17).double(message.y);
            return writer;
        };

        /**
         * Encodes the specified Vec2D message, length delimited. Does not implicitly {@link treasurehunterx.Vec2D.verify|verify} messages.
         * @function encodeDelimited
         * @memberof treasurehunterx.Vec2D
         * @static
         * @param {treasurehunterx.Vec2D} message Vec2D message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Vec2D.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Vec2D message from the specified reader or buffer.
         * @function decode
         * @memberof treasurehunterx.Vec2D
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {treasurehunterx.Vec2D} Vec2D
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Vec2D.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.treasurehunterx.Vec2D();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.x = reader.double();
                    break;
                case 2:
                    message.y = reader.double();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Vec2D message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof treasurehunterx.Vec2D
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {treasurehunterx.Vec2D} Vec2D
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Vec2D.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Vec2D message.
         * @function verify
         * @memberof treasurehunterx.Vec2D
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Vec2D.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.x != null && message.hasOwnProperty("x"))
                if (typeof message.x !== "number")
                    return "x: number expected";
            if (message.y != null && message.hasOwnProperty("y"))
                if (typeof message.y !== "number")
                    return "y: number expected";
            return null;
        };

        /**
         * Creates a Vec2D message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof treasurehunterx.Vec2D
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {treasurehunterx.Vec2D} Vec2D
         */
        Vec2D.fromObject = function fromObject(object) {
            if (object instanceof $root.treasurehunterx.Vec2D)
                return object;
            var message = new $root.treasurehunterx.Vec2D();
            if (object.x != null)
                message.x = Number(object.x);
            if (object.y != null)
                message.y = Number(object.y);
            return message;
        };

        /**
         * Creates a plain object from a Vec2D message. Also converts values to other types if specified.
         * @function toObject
         * @memberof treasurehunterx.Vec2D
         * @static
         * @param {treasurehunterx.Vec2D} message Vec2D
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Vec2D.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.x = 0;
                object.y = 0;
            }
            if (message.x != null && message.hasOwnProperty("x"))
                object.x = options.json && !isFinite(message.x) ? String(message.x) : message.x;
            if (message.y != null && message.hasOwnProperty("y"))
                object.y = options.json && !isFinite(message.y) ? String(message.y) : message.y;
            return object;
        };

        /**
         * Converts this Vec2D to JSON.
         * @function toJSON
         * @memberof treasurehunterx.Vec2D
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Vec2D.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Vec2D;
    })();

    treasurehunterx.Polygon2D = (function() {

        /**
         * Properties of a Polygon2D.
         * @memberof treasurehunterx
         * @interface IPolygon2D
         * @property {treasurehunterx.Vec2D|null} [Anchor] Polygon2D Anchor
         * @property {Array.<treasurehunterx.Vec2D>|null} [Points] Polygon2D Points
         */

        /**
         * Constructs a new Polygon2D.
         * @memberof treasurehunterx
         * @classdesc Represents a Polygon2D.
         * @implements IPolygon2D
         * @constructor
         * @param {treasurehunterx.IPolygon2D=} [properties] Properties to set
         */
        function Polygon2D(properties) {
            this.Points = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Polygon2D Anchor.
         * @member {treasurehunterx.Vec2D|null|undefined} Anchor
         * @memberof treasurehunterx.Polygon2D
         * @instance
         */
        Polygon2D.prototype.Anchor = null;

        /**
         * Polygon2D Points.
         * @member {Array.<treasurehunterx.Vec2D>} Points
         * @memberof treasurehunterx.Polygon2D
         * @instance
         */
        Polygon2D.prototype.Points = $util.emptyArray;

        /**
         * Creates a new Polygon2D instance using the specified properties.
         * @function create
         * @memberof treasurehunterx.Polygon2D
         * @static
         * @param {treasurehunterx.IPolygon2D=} [properties] Properties to set
         * @returns {treasurehunterx.Polygon2D} Polygon2D instance
         */
        Polygon2D.create = function create(properties) {
            return new Polygon2D(properties);
        };

        /**
         * Encodes the specified Polygon2D message. Does not implicitly {@link treasurehunterx.Polygon2D.verify|verify} messages.
         * @function encode
         * @memberof treasurehunterx.Polygon2D
         * @static
         * @param {treasurehunterx.Polygon2D} message Polygon2D message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Polygon2D.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Anchor != null && message.hasOwnProperty("Anchor"))
                $root.treasurehunterx.Vec2D.encode(message.Anchor, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.Points != null && message.Points.length)
                for (var i = 0; i < message.Points.length; ++i)
                    $root.treasurehunterx.Vec2D.encode(message.Points[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified Polygon2D message, length delimited. Does not implicitly {@link treasurehunterx.Polygon2D.verify|verify} messages.
         * @function encodeDelimited
         * @memberof treasurehunterx.Polygon2D
         * @static
         * @param {treasurehunterx.Polygon2D} message Polygon2D message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Polygon2D.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Polygon2D message from the specified reader or buffer.
         * @function decode
         * @memberof treasurehunterx.Polygon2D
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {treasurehunterx.Polygon2D} Polygon2D
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Polygon2D.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.treasurehunterx.Polygon2D();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.Anchor = $root.treasurehunterx.Vec2D.decode(reader, reader.uint32());
                    break;
                case 2:
                    if (!(message.Points && message.Points.length))
                        message.Points = [];
                    message.Points.push($root.treasurehunterx.Vec2D.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Polygon2D message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof treasurehunterx.Polygon2D
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {treasurehunterx.Polygon2D} Polygon2D
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Polygon2D.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Polygon2D message.
         * @function verify
         * @memberof treasurehunterx.Polygon2D
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Polygon2D.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Anchor != null && message.hasOwnProperty("Anchor")) {
                var error = $root.treasurehunterx.Vec2D.verify(message.Anchor);
                if (error)
                    return "Anchor." + error;
            }
            if (message.Points != null && message.hasOwnProperty("Points")) {
                if (!Array.isArray(message.Points))
                    return "Points: array expected";
                for (var i = 0; i < message.Points.length; ++i) {
                    var error = $root.treasurehunterx.Vec2D.verify(message.Points[i]);
                    if (error)
                        return "Points." + error;
                }
            }
            return null;
        };

        /**
         * Creates a Polygon2D message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof treasurehunterx.Polygon2D
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {treasurehunterx.Polygon2D} Polygon2D
         */
        Polygon2D.fromObject = function fromObject(object) {
            if (object instanceof $root.treasurehunterx.Polygon2D)
                return object;
            var message = new $root.treasurehunterx.Polygon2D();
            if (object.Anchor != null) {
                if (typeof object.Anchor !== "object")
                    throw TypeError(".treasurehunterx.Polygon2D.Anchor: object expected");
                message.Anchor = $root.treasurehunterx.Vec2D.fromObject(object.Anchor);
            }
            if (object.Points) {
                if (!Array.isArray(object.Points))
                    throw TypeError(".treasurehunterx.Polygon2D.Points: array expected");
                message.Points = [];
                for (var i = 0; i < object.Points.length; ++i) {
                    if (typeof object.Points[i] !== "object")
                        throw TypeError(".treasurehunterx.Polygon2D.Points: object expected");
                    message.Points[i] = $root.treasurehunterx.Vec2D.fromObject(object.Points[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a Polygon2D message. Also converts values to other types if specified.
         * @function toObject
         * @memberof treasurehunterx.Polygon2D
         * @static
         * @param {treasurehunterx.Polygon2D} message Polygon2D
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Polygon2D.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.Points = [];
            if (options.defaults)
                object.Anchor = null;
            if (message.Anchor != null && message.hasOwnProperty("Anchor"))
                object.Anchor = $root.treasurehunterx.Vec2D.toObject(message.Anchor, options);
            if (message.Points && message.Points.length) {
                object.Points = [];
                for (var j = 0; j < message.Points.length; ++j)
                    object.Points[j] = $root.treasurehunterx.Vec2D.toObject(message.Points[j], options);
            }
            return object;
        };

        /**
         * Converts this Polygon2D to JSON.
         * @function toJSON
         * @memberof treasurehunterx.Polygon2D
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Polygon2D.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Polygon2D;
    })();

    treasurehunterx.Vec2DList = (function() {

        /**
         * Properties of a Vec2DList.
         * @memberof treasurehunterx
         * @interface IVec2DList
         * @property {Array.<treasurehunterx.Vec2D>|null} [vec2DList] Vec2DList vec2DList
         */

        /**
         * Constructs a new Vec2DList.
         * @memberof treasurehunterx
         * @classdesc Represents a Vec2DList.
         * @implements IVec2DList
         * @constructor
         * @param {treasurehunterx.IVec2DList=} [properties] Properties to set
         */
        function Vec2DList(properties) {
            this.vec2DList = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Vec2DList vec2DList.
         * @member {Array.<treasurehunterx.Vec2D>} vec2DList
         * @memberof treasurehunterx.Vec2DList
         * @instance
         */
        Vec2DList.prototype.vec2DList = $util.emptyArray;

        /**
         * Creates a new Vec2DList instance using the specified properties.
         * @function create
         * @memberof treasurehunterx.Vec2DList
         * @static
         * @param {treasurehunterx.IVec2DList=} [properties] Properties to set
         * @returns {treasurehunterx.Vec2DList} Vec2DList instance
         */
        Vec2DList.create = function create(properties) {
            return new Vec2DList(properties);
        };

        /**
         * Encodes the specified Vec2DList message. Does not implicitly {@link treasurehunterx.Vec2DList.verify|verify} messages.
         * @function encode
         * @memberof treasurehunterx.Vec2DList
         * @static
         * @param {treasurehunterx.Vec2DList} message Vec2DList message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Vec2DList.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.vec2DList != null && message.vec2DList.length)
                for (var i = 0; i < message.vec2DList.length; ++i)
                    $root.treasurehunterx.Vec2D.encode(message.vec2DList[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified Vec2DList message, length delimited. Does not implicitly {@link treasurehunterx.Vec2DList.verify|verify} messages.
         * @function encodeDelimited
         * @memberof treasurehunterx.Vec2DList
         * @static
         * @param {treasurehunterx.Vec2DList} message Vec2DList message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Vec2DList.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Vec2DList message from the specified reader or buffer.
         * @function decode
         * @memberof treasurehunterx.Vec2DList
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {treasurehunterx.Vec2DList} Vec2DList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Vec2DList.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.treasurehunterx.Vec2DList();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.vec2DList && message.vec2DList.length))
                        message.vec2DList = [];
                    message.vec2DList.push($root.treasurehunterx.Vec2D.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Vec2DList message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof treasurehunterx.Vec2DList
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {treasurehunterx.Vec2DList} Vec2DList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Vec2DList.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Vec2DList message.
         * @function verify
         * @memberof treasurehunterx.Vec2DList
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Vec2DList.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.vec2DList != null && message.hasOwnProperty("vec2DList")) {
                if (!Array.isArray(message.vec2DList))
                    return "vec2DList: array expected";
                for (var i = 0; i < message.vec2DList.length; ++i) {
                    var error = $root.treasurehunterx.Vec2D.verify(message.vec2DList[i]);
                    if (error)
                        return "vec2DList." + error;
                }
            }
            return null;
        };

        /**
         * Creates a Vec2DList message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof treasurehunterx.Vec2DList
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {treasurehunterx.Vec2DList} Vec2DList
         */
        Vec2DList.fromObject = function fromObject(object) {
            if (object instanceof $root.treasurehunterx.Vec2DList)
                return object;
            var message = new $root.treasurehunterx.Vec2DList();
            if (object.vec2DList) {
                if (!Array.isArray(object.vec2DList))
                    throw TypeError(".treasurehunterx.Vec2DList.vec2DList: array expected");
                message.vec2DList = [];
                for (var i = 0; i < object.vec2DList.length; ++i) {
                    if (typeof object.vec2DList[i] !== "object")
                        throw TypeError(".treasurehunterx.Vec2DList.vec2DList: object expected");
                    message.vec2DList[i] = $root.treasurehunterx.Vec2D.fromObject(object.vec2DList[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a Vec2DList message. Also converts values to other types if specified.
         * @function toObject
         * @memberof treasurehunterx.Vec2DList
         * @static
         * @param {treasurehunterx.Vec2DList} message Vec2DList
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Vec2DList.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.vec2DList = [];
            if (message.vec2DList && message.vec2DList.length) {
                object.vec2DList = [];
                for (var j = 0; j < message.vec2DList.length; ++j)
                    object.vec2DList[j] = $root.treasurehunterx.Vec2D.toObject(message.vec2DList[j], options);
            }
            return object;
        };

        /**
         * Converts this Vec2DList to JSON.
         * @function toJSON
         * @memberof treasurehunterx.Vec2DList
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Vec2DList.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Vec2DList;
    })();

    treasurehunterx.Polygon2DList = (function() {

        /**
         * Properties of a Polygon2DList.
         * @memberof treasurehunterx
         * @interface IPolygon2DList
         * @property {Array.<treasurehunterx.Polygon2D>|null} [polygon2DList] Polygon2DList polygon2DList
         */

        /**
         * Constructs a new Polygon2DList.
         * @memberof treasurehunterx
         * @classdesc Represents a Polygon2DList.
         * @implements IPolygon2DList
         * @constructor
         * @param {treasurehunterx.IPolygon2DList=} [properties] Properties to set
         */
        function Polygon2DList(properties) {
            this.polygon2DList = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Polygon2DList polygon2DList.
         * @member {Array.<treasurehunterx.Polygon2D>} polygon2DList
         * @memberof treasurehunterx.Polygon2DList
         * @instance
         */
        Polygon2DList.prototype.polygon2DList = $util.emptyArray;

        /**
         * Creates a new Polygon2DList instance using the specified properties.
         * @function create
         * @memberof treasurehunterx.Polygon2DList
         * @static
         * @param {treasurehunterx.IPolygon2DList=} [properties] Properties to set
         * @returns {treasurehunterx.Polygon2DList} Polygon2DList instance
         */
        Polygon2DList.create = function create(properties) {
            return new Polygon2DList(properties);
        };

        /**
         * Encodes the specified Polygon2DList message. Does not implicitly {@link treasurehunterx.Polygon2DList.verify|verify} messages.
         * @function encode
         * @memberof treasurehunterx.Polygon2DList
         * @static
         * @param {treasurehunterx.Polygon2DList} message Polygon2DList message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Polygon2DList.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.polygon2DList != null && message.polygon2DList.length)
                for (var i = 0; i < message.polygon2DList.length; ++i)
                    $root.treasurehunterx.Polygon2D.encode(message.polygon2DList[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified Polygon2DList message, length delimited. Does not implicitly {@link treasurehunterx.Polygon2DList.verify|verify} messages.
         * @function encodeDelimited
         * @memberof treasurehunterx.Polygon2DList
         * @static
         * @param {treasurehunterx.Polygon2DList} message Polygon2DList message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Polygon2DList.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Polygon2DList message from the specified reader or buffer.
         * @function decode
         * @memberof treasurehunterx.Polygon2DList
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {treasurehunterx.Polygon2DList} Polygon2DList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Polygon2DList.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.treasurehunterx.Polygon2DList();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.polygon2DList && message.polygon2DList.length))
                        message.polygon2DList = [];
                    message.polygon2DList.push($root.treasurehunterx.Polygon2D.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Polygon2DList message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof treasurehunterx.Polygon2DList
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {treasurehunterx.Polygon2DList} Polygon2DList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Polygon2DList.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Polygon2DList message.
         * @function verify
         * @memberof treasurehunterx.Polygon2DList
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Polygon2DList.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.polygon2DList != null && message.hasOwnProperty("polygon2DList")) {
                if (!Array.isArray(message.polygon2DList))
                    return "polygon2DList: array expected";
                for (var i = 0; i < message.polygon2DList.length; ++i) {
                    var error = $root.treasurehunterx.Polygon2D.verify(message.polygon2DList[i]);
                    if (error)
                        return "polygon2DList." + error;
                }
            }
            return null;
        };

        /**
         * Creates a Polygon2DList message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof treasurehunterx.Polygon2DList
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {treasurehunterx.Polygon2DList} Polygon2DList
         */
        Polygon2DList.fromObject = function fromObject(object) {
            if (object instanceof $root.treasurehunterx.Polygon2DList)
                return object;
            var message = new $root.treasurehunterx.Polygon2DList();
            if (object.polygon2DList) {
                if (!Array.isArray(object.polygon2DList))
                    throw TypeError(".treasurehunterx.Polygon2DList.polygon2DList: array expected");
                message.polygon2DList = [];
                for (var i = 0; i < object.polygon2DList.length; ++i) {
                    if (typeof object.polygon2DList[i] !== "object")
                        throw TypeError(".treasurehunterx.Polygon2DList.polygon2DList: object expected");
                    message.polygon2DList[i] = $root.treasurehunterx.Polygon2D.fromObject(object.polygon2DList[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a Polygon2DList message. Also converts values to other types if specified.
         * @function toObject
         * @memberof treasurehunterx.Polygon2DList
         * @static
         * @param {treasurehunterx.Polygon2DList} message Polygon2DList
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Polygon2DList.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.polygon2DList = [];
            if (message.polygon2DList && message.polygon2DList.length) {
                object.polygon2DList = [];
                for (var j = 0; j < message.polygon2DList.length; ++j)
                    object.polygon2DList[j] = $root.treasurehunterx.Polygon2D.toObject(message.polygon2DList[j], options);
            }
            return object;
        };

        /**
         * Converts this Polygon2DList to JSON.
         * @function toJSON
         * @memberof treasurehunterx.Polygon2DList
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Polygon2DList.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Polygon2DList;
    })();

    treasurehunterx.BattleColliderInfo = (function() {

        /**
         * Properties of a BattleColliderInfo.
         * @memberof treasurehunterx
         * @interface IBattleColliderInfo
         * @property {string|null} [stageName] BattleColliderInfo stageName
         * @property {Object.<string,treasurehunterx.Vec2DList>|null} [strToVec2DListMap] BattleColliderInfo strToVec2DListMap
         * @property {Object.<string,treasurehunterx.Polygon2DList>|null} [strToPolygon2DListMap] BattleColliderInfo strToPolygon2DListMap
         */

        /**
         * Constructs a new BattleColliderInfo.
         * @memberof treasurehunterx
         * @classdesc Represents a BattleColliderInfo.
         * @implements IBattleColliderInfo
         * @constructor
         * @param {treasurehunterx.IBattleColliderInfo=} [properties] Properties to set
         */
        function BattleColliderInfo(properties) {
            this.strToVec2DListMap = {};
            this.strToPolygon2DListMap = {};
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * BattleColliderInfo stageName.
         * @member {string} stageName
         * @memberof treasurehunterx.BattleColliderInfo
         * @instance
         */
        BattleColliderInfo.prototype.stageName = "";

        /**
         * BattleColliderInfo strToVec2DListMap.
         * @member {Object.<string,treasurehunterx.Vec2DList>} strToVec2DListMap
         * @memberof treasurehunterx.BattleColliderInfo
         * @instance
         */
        BattleColliderInfo.prototype.strToVec2DListMap = $util.emptyObject;

        /**
         * BattleColliderInfo strToPolygon2DListMap.
         * @member {Object.<string,treasurehunterx.Polygon2DList>} strToPolygon2DListMap
         * @memberof treasurehunterx.BattleColliderInfo
         * @instance
         */
        BattleColliderInfo.prototype.strToPolygon2DListMap = $util.emptyObject;

        /**
         * Creates a new BattleColliderInfo instance using the specified properties.
         * @function create
         * @memberof treasurehunterx.BattleColliderInfo
         * @static
         * @param {treasurehunterx.IBattleColliderInfo=} [properties] Properties to set
         * @returns {treasurehunterx.BattleColliderInfo} BattleColliderInfo instance
         */
        BattleColliderInfo.create = function create(properties) {
            return new BattleColliderInfo(properties);
        };

        /**
         * Encodes the specified BattleColliderInfo message. Does not implicitly {@link treasurehunterx.BattleColliderInfo.verify|verify} messages.
         * @function encode
         * @memberof treasurehunterx.BattleColliderInfo
         * @static
         * @param {treasurehunterx.BattleColliderInfo} message BattleColliderInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BattleColliderInfo.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.stageName != null && message.hasOwnProperty("stageName"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.stageName);
            if (message.strToVec2DListMap != null && message.hasOwnProperty("strToVec2DListMap"))
                for (var keys = Object.keys(message.strToVec2DListMap), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 2, wireType 2 =*/18).fork().uint32(/* id 1, wireType 2 =*/10).string(keys[i]);
                    $root.treasurehunterx.Vec2DList.encode(message.strToVec2DListMap[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            if (message.strToPolygon2DListMap != null && message.hasOwnProperty("strToPolygon2DListMap"))
                for (var keys = Object.keys(message.strToPolygon2DListMap), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 3, wireType 2 =*/26).fork().uint32(/* id 1, wireType 2 =*/10).string(keys[i]);
                    $root.treasurehunterx.Polygon2DList.encode(message.strToPolygon2DListMap[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            return writer;
        };

        /**
         * Encodes the specified BattleColliderInfo message, length delimited. Does not implicitly {@link treasurehunterx.BattleColliderInfo.verify|verify} messages.
         * @function encodeDelimited
         * @memberof treasurehunterx.BattleColliderInfo
         * @static
         * @param {treasurehunterx.BattleColliderInfo} message BattleColliderInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BattleColliderInfo.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BattleColliderInfo message from the specified reader or buffer.
         * @function decode
         * @memberof treasurehunterx.BattleColliderInfo
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {treasurehunterx.BattleColliderInfo} BattleColliderInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BattleColliderInfo.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.treasurehunterx.BattleColliderInfo(), key;
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.stageName = reader.string();
                    break;
                case 2:
                    reader.skip().pos++;
                    if (message.strToVec2DListMap === $util.emptyObject)
                        message.strToVec2DListMap = {};
                    key = reader.string();
                    reader.pos++;
                    message.strToVec2DListMap[key] = $root.treasurehunterx.Vec2DList.decode(reader, reader.uint32());
                    break;
                case 3:
                    reader.skip().pos++;
                    if (message.strToPolygon2DListMap === $util.emptyObject)
                        message.strToPolygon2DListMap = {};
                    key = reader.string();
                    reader.pos++;
                    message.strToPolygon2DListMap[key] = $root.treasurehunterx.Polygon2DList.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BattleColliderInfo message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof treasurehunterx.BattleColliderInfo
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {treasurehunterx.BattleColliderInfo} BattleColliderInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BattleColliderInfo.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BattleColliderInfo message.
         * @function verify
         * @memberof treasurehunterx.BattleColliderInfo
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BattleColliderInfo.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.stageName != null && message.hasOwnProperty("stageName"))
                if (!$util.isString(message.stageName))
                    return "stageName: string expected";
            if (message.strToVec2DListMap != null && message.hasOwnProperty("strToVec2DListMap")) {
                if (!$util.isObject(message.strToVec2DListMap))
                    return "strToVec2DListMap: object expected";
                var key = Object.keys(message.strToVec2DListMap);
                for (var i = 0; i < key.length; ++i) {
                    var error = $root.treasurehunterx.Vec2DList.verify(message.strToVec2DListMap[key[i]]);
                    if (error)
                        return "strToVec2DListMap." + error;
                }
            }
            if (message.strToPolygon2DListMap != null && message.hasOwnProperty("strToPolygon2DListMap")) {
                if (!$util.isObject(message.strToPolygon2DListMap))
                    return "strToPolygon2DListMap: object expected";
                var key = Object.keys(message.strToPolygon2DListMap);
                for (var i = 0; i < key.length; ++i) {
                    var error = $root.treasurehunterx.Polygon2DList.verify(message.strToPolygon2DListMap[key[i]]);
                    if (error)
                        return "strToPolygon2DListMap." + error;
                }
            }
            return null;
        };

        /**
         * Creates a BattleColliderInfo message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof treasurehunterx.BattleColliderInfo
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {treasurehunterx.BattleColliderInfo} BattleColliderInfo
         */
        BattleColliderInfo.fromObject = function fromObject(object) {
            if (object instanceof $root.treasurehunterx.BattleColliderInfo)
                return object;
            var message = new $root.treasurehunterx.BattleColliderInfo();
            if (object.stageName != null)
                message.stageName = String(object.stageName);
            if (object.strToVec2DListMap) {
                if (typeof object.strToVec2DListMap !== "object")
                    throw TypeError(".treasurehunterx.BattleColliderInfo.strToVec2DListMap: object expected");
                message.strToVec2DListMap = {};
                for (var keys = Object.keys(object.strToVec2DListMap), i = 0; i < keys.length; ++i) {
                    if (typeof object.strToVec2DListMap[keys[i]] !== "object")
                        throw TypeError(".treasurehunterx.BattleColliderInfo.strToVec2DListMap: object expected");
                    message.strToVec2DListMap[keys[i]] = $root.treasurehunterx.Vec2DList.fromObject(object.strToVec2DListMap[keys[i]]);
                }
            }
            if (object.strToPolygon2DListMap) {
                if (typeof object.strToPolygon2DListMap !== "object")
                    throw TypeError(".treasurehunterx.BattleColliderInfo.strToPolygon2DListMap: object expected");
                message.strToPolygon2DListMap = {};
                for (var keys = Object.keys(object.strToPolygon2DListMap), i = 0; i < keys.length; ++i) {
                    if (typeof object.strToPolygon2DListMap[keys[i]] !== "object")
                        throw TypeError(".treasurehunterx.BattleColliderInfo.strToPolygon2DListMap: object expected");
                    message.strToPolygon2DListMap[keys[i]] = $root.treasurehunterx.Polygon2DList.fromObject(object.strToPolygon2DListMap[keys[i]]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a BattleColliderInfo message. Also converts values to other types if specified.
         * @function toObject
         * @memberof treasurehunterx.BattleColliderInfo
         * @static
         * @param {treasurehunterx.BattleColliderInfo} message BattleColliderInfo
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BattleColliderInfo.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.objects || options.defaults) {
                object.strToVec2DListMap = {};
                object.strToPolygon2DListMap = {};
            }
            if (options.defaults)
                object.stageName = "";
            if (message.stageName != null && message.hasOwnProperty("stageName"))
                object.stageName = message.stageName;
            var keys2;
            if (message.strToVec2DListMap && (keys2 = Object.keys(message.strToVec2DListMap)).length) {
                object.strToVec2DListMap = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.strToVec2DListMap[keys2[j]] = $root.treasurehunterx.Vec2DList.toObject(message.strToVec2DListMap[keys2[j]], options);
            }
            if (message.strToPolygon2DListMap && (keys2 = Object.keys(message.strToPolygon2DListMap)).length) {
                object.strToPolygon2DListMap = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.strToPolygon2DListMap[keys2[j]] = $root.treasurehunterx.Polygon2DList.toObject(message.strToPolygon2DListMap[keys2[j]], options);
            }
            return object;
        };

        /**
         * Converts this BattleColliderInfo to JSON.
         * @function toJSON
         * @memberof treasurehunterx.BattleColliderInfo
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BattleColliderInfo.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return BattleColliderInfo;
    })();

    treasurehunterx.Player = (function() {

        /**
         * Properties of a Player.
         * @memberof treasurehunterx
         * @interface IPlayer
         * @property {number|null} [id] Player id
         * @property {number|null} [x] Player x
         * @property {number|null} [y] Player y
         * @property {treasurehunterx.Direction|null} [dir] Player dir
         * @property {number|null} [speed] Player speed
         * @property {number|null} [battleState] Player battleState
         * @property {number|null} [lastMoveGmtMillis] Player lastMoveGmtMillis
         * @property {number|null} [score] Player score
         * @property {boolean|null} [removed] Player removed
         * @property {number|null} [joinIndex] Player joinIndex
         */

        /**
         * Constructs a new Player.
         * @memberof treasurehunterx
         * @classdesc Represents a Player.
         * @implements IPlayer
         * @constructor
         * @param {treasurehunterx.IPlayer=} [properties] Properties to set
         */
        function Player(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Player id.
         * @member {number} id
         * @memberof treasurehunterx.Player
         * @instance
         */
        Player.prototype.id = 0;

        /**
         * Player x.
         * @member {number} x
         * @memberof treasurehunterx.Player
         * @instance
         */
        Player.prototype.x = 0;

        /**
         * Player y.
         * @member {number} y
         * @memberof treasurehunterx.Player
         * @instance
         */
        Player.prototype.y = 0;

        /**
         * Player dir.
         * @member {treasurehunterx.Direction|null|undefined} dir
         * @memberof treasurehunterx.Player
         * @instance
         */
        Player.prototype.dir = null;

        /**
         * Player speed.
         * @member {number} speed
         * @memberof treasurehunterx.Player
         * @instance
         */
        Player.prototype.speed = 0;

        /**
         * Player battleState.
         * @member {number} battleState
         * @memberof treasurehunterx.Player
         * @instance
         */
        Player.prototype.battleState = 0;

        /**
         * Player lastMoveGmtMillis.
         * @member {number} lastMoveGmtMillis
         * @memberof treasurehunterx.Player
         * @instance
         */
        Player.prototype.lastMoveGmtMillis = 0;

        /**
         * Player score.
         * @member {number} score
         * @memberof treasurehunterx.Player
         * @instance
         */
        Player.prototype.score = 0;

        /**
         * Player removed.
         * @member {boolean} removed
         * @memberof treasurehunterx.Player
         * @instance
         */
        Player.prototype.removed = false;

        /**
         * Player joinIndex.
         * @member {number} joinIndex
         * @memberof treasurehunterx.Player
         * @instance
         */
        Player.prototype.joinIndex = 0;

        /**
         * Creates a new Player instance using the specified properties.
         * @function create
         * @memberof treasurehunterx.Player
         * @static
         * @param {treasurehunterx.IPlayer=} [properties] Properties to set
         * @returns {treasurehunterx.Player} Player instance
         */
        Player.create = function create(properties) {
            return new Player(properties);
        };

        /**
         * Encodes the specified Player message. Does not implicitly {@link treasurehunterx.Player.verify|verify} messages.
         * @function encode
         * @memberof treasurehunterx.Player
         * @static
         * @param {treasurehunterx.Player} message Player message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Player.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
            if (message.x != null && message.hasOwnProperty("x"))
                writer.uint32(/* id 2, wireType 1 =*/17).double(message.x);
            if (message.y != null && message.hasOwnProperty("y"))
                writer.uint32(/* id 3, wireType 1 =*/25).double(message.y);
            if (message.dir != null && message.hasOwnProperty("dir"))
                $root.treasurehunterx.Direction.encode(message.dir, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
            if (message.speed != null && message.hasOwnProperty("speed"))
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.speed);
            if (message.battleState != null && message.hasOwnProperty("battleState"))
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.battleState);
            if (message.lastMoveGmtMillis != null && message.hasOwnProperty("lastMoveGmtMillis"))
                writer.uint32(/* id 7, wireType 0 =*/56).int32(message.lastMoveGmtMillis);
            if (message.score != null && message.hasOwnProperty("score"))
                writer.uint32(/* id 10, wireType 0 =*/80).int32(message.score);
            if (message.removed != null && message.hasOwnProperty("removed"))
                writer.uint32(/* id 11, wireType 0 =*/88).bool(message.removed);
            if (message.joinIndex != null && message.hasOwnProperty("joinIndex"))
                writer.uint32(/* id 12, wireType 0 =*/96).int32(message.joinIndex);
            return writer;
        };

        /**
         * Encodes the specified Player message, length delimited. Does not implicitly {@link treasurehunterx.Player.verify|verify} messages.
         * @function encodeDelimited
         * @memberof treasurehunterx.Player
         * @static
         * @param {treasurehunterx.Player} message Player message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Player.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Player message from the specified reader or buffer.
         * @function decode
         * @memberof treasurehunterx.Player
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {treasurehunterx.Player} Player
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Player.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.treasurehunterx.Player();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.int32();
                    break;
                case 2:
                    message.x = reader.double();
                    break;
                case 3:
                    message.y = reader.double();
                    break;
                case 4:
                    message.dir = $root.treasurehunterx.Direction.decode(reader, reader.uint32());
                    break;
                case 5:
                    message.speed = reader.int32();
                    break;
                case 6:
                    message.battleState = reader.int32();
                    break;
                case 7:
                    message.lastMoveGmtMillis = reader.int32();
                    break;
                case 10:
                    message.score = reader.int32();
                    break;
                case 11:
                    message.removed = reader.bool();
                    break;
                case 12:
                    message.joinIndex = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Player message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof treasurehunterx.Player
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {treasurehunterx.Player} Player
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Player.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Player message.
         * @function verify
         * @memberof treasurehunterx.Player
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Player.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.x != null && message.hasOwnProperty("x"))
                if (typeof message.x !== "number")
                    return "x: number expected";
            if (message.y != null && message.hasOwnProperty("y"))
                if (typeof message.y !== "number")
                    return "y: number expected";
            if (message.dir != null && message.hasOwnProperty("dir")) {
                var error = $root.treasurehunterx.Direction.verify(message.dir);
                if (error)
                    return "dir." + error;
            }
            if (message.speed != null && message.hasOwnProperty("speed"))
                if (!$util.isInteger(message.speed))
                    return "speed: integer expected";
            if (message.battleState != null && message.hasOwnProperty("battleState"))
                if (!$util.isInteger(message.battleState))
                    return "battleState: integer expected";
            if (message.lastMoveGmtMillis != null && message.hasOwnProperty("lastMoveGmtMillis"))
                if (!$util.isInteger(message.lastMoveGmtMillis))
                    return "lastMoveGmtMillis: integer expected";
            if (message.score != null && message.hasOwnProperty("score"))
                if (!$util.isInteger(message.score))
                    return "score: integer expected";
            if (message.removed != null && message.hasOwnProperty("removed"))
                if (typeof message.removed !== "boolean")
                    return "removed: boolean expected";
            if (message.joinIndex != null && message.hasOwnProperty("joinIndex"))
                if (!$util.isInteger(message.joinIndex))
                    return "joinIndex: integer expected";
            return null;
        };

        /**
         * Creates a Player message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof treasurehunterx.Player
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {treasurehunterx.Player} Player
         */
        Player.fromObject = function fromObject(object) {
            if (object instanceof $root.treasurehunterx.Player)
                return object;
            var message = new $root.treasurehunterx.Player();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.x != null)
                message.x = Number(object.x);
            if (object.y != null)
                message.y = Number(object.y);
            if (object.dir != null) {
                if (typeof object.dir !== "object")
                    throw TypeError(".treasurehunterx.Player.dir: object expected");
                message.dir = $root.treasurehunterx.Direction.fromObject(object.dir);
            }
            if (object.speed != null)
                message.speed = object.speed | 0;
            if (object.battleState != null)
                message.battleState = object.battleState | 0;
            if (object.lastMoveGmtMillis != null)
                message.lastMoveGmtMillis = object.lastMoveGmtMillis | 0;
            if (object.score != null)
                message.score = object.score | 0;
            if (object.removed != null)
                message.removed = Boolean(object.removed);
            if (object.joinIndex != null)
                message.joinIndex = object.joinIndex | 0;
            return message;
        };

        /**
         * Creates a plain object from a Player message. Also converts values to other types if specified.
         * @function toObject
         * @memberof treasurehunterx.Player
         * @static
         * @param {treasurehunterx.Player} message Player
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Player.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = 0;
                object.x = 0;
                object.y = 0;
                object.dir = null;
                object.speed = 0;
                object.battleState = 0;
                object.lastMoveGmtMillis = 0;
                object.score = 0;
                object.removed = false;
                object.joinIndex = 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.x != null && message.hasOwnProperty("x"))
                object.x = options.json && !isFinite(message.x) ? String(message.x) : message.x;
            if (message.y != null && message.hasOwnProperty("y"))
                object.y = options.json && !isFinite(message.y) ? String(message.y) : message.y;
            if (message.dir != null && message.hasOwnProperty("dir"))
                object.dir = $root.treasurehunterx.Direction.toObject(message.dir, options);
            if (message.speed != null && message.hasOwnProperty("speed"))
                object.speed = message.speed;
            if (message.battleState != null && message.hasOwnProperty("battleState"))
                object.battleState = message.battleState;
            if (message.lastMoveGmtMillis != null && message.hasOwnProperty("lastMoveGmtMillis"))
                object.lastMoveGmtMillis = message.lastMoveGmtMillis;
            if (message.score != null && message.hasOwnProperty("score"))
                object.score = message.score;
            if (message.removed != null && message.hasOwnProperty("removed"))
                object.removed = message.removed;
            if (message.joinIndex != null && message.hasOwnProperty("joinIndex"))
                object.joinIndex = message.joinIndex;
            return object;
        };

        /**
         * Converts this Player to JSON.
         * @function toJSON
         * @memberof treasurehunterx.Player
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Player.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Player;
    })();

    treasurehunterx.PlayerMeta = (function() {

        /**
         * Properties of a PlayerMeta.
         * @memberof treasurehunterx
         * @interface IPlayerMeta
         * @property {number|null} [id] PlayerMeta id
         * @property {string|null} [name] PlayerMeta name
         * @property {string|null} [displayName] PlayerMeta displayName
         * @property {string|null} [avatar] PlayerMeta avatar
         * @property {number|null} [joinIndex] PlayerMeta joinIndex
         */

        /**
         * Constructs a new PlayerMeta.
         * @memberof treasurehunterx
         * @classdesc Represents a PlayerMeta.
         * @implements IPlayerMeta
         * @constructor
         * @param {treasurehunterx.IPlayerMeta=} [properties] Properties to set
         */
        function PlayerMeta(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PlayerMeta id.
         * @member {number} id
         * @memberof treasurehunterx.PlayerMeta
         * @instance
         */
        PlayerMeta.prototype.id = 0;

        /**
         * PlayerMeta name.
         * @member {string} name
         * @memberof treasurehunterx.PlayerMeta
         * @instance
         */
        PlayerMeta.prototype.name = "";

        /**
         * PlayerMeta displayName.
         * @member {string} displayName
         * @memberof treasurehunterx.PlayerMeta
         * @instance
         */
        PlayerMeta.prototype.displayName = "";

        /**
         * PlayerMeta avatar.
         * @member {string} avatar
         * @memberof treasurehunterx.PlayerMeta
         * @instance
         */
        PlayerMeta.prototype.avatar = "";

        /**
         * PlayerMeta joinIndex.
         * @member {number} joinIndex
         * @memberof treasurehunterx.PlayerMeta
         * @instance
         */
        PlayerMeta.prototype.joinIndex = 0;

        /**
         * Creates a new PlayerMeta instance using the specified properties.
         * @function create
         * @memberof treasurehunterx.PlayerMeta
         * @static
         * @param {treasurehunterx.IPlayerMeta=} [properties] Properties to set
         * @returns {treasurehunterx.PlayerMeta} PlayerMeta instance
         */
        PlayerMeta.create = function create(properties) {
            return new PlayerMeta(properties);
        };

        /**
         * Encodes the specified PlayerMeta message. Does not implicitly {@link treasurehunterx.PlayerMeta.verify|verify} messages.
         * @function encode
         * @memberof treasurehunterx.PlayerMeta
         * @static
         * @param {treasurehunterx.PlayerMeta} message PlayerMeta message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PlayerMeta.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
            if (message.name != null && message.hasOwnProperty("name"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
            if (message.displayName != null && message.hasOwnProperty("displayName"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.displayName);
            if (message.avatar != null && message.hasOwnProperty("avatar"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.avatar);
            if (message.joinIndex != null && message.hasOwnProperty("joinIndex"))
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.joinIndex);
            return writer;
        };

        /**
         * Encodes the specified PlayerMeta message, length delimited. Does not implicitly {@link treasurehunterx.PlayerMeta.verify|verify} messages.
         * @function encodeDelimited
         * @memberof treasurehunterx.PlayerMeta
         * @static
         * @param {treasurehunterx.PlayerMeta} message PlayerMeta message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PlayerMeta.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PlayerMeta message from the specified reader or buffer.
         * @function decode
         * @memberof treasurehunterx.PlayerMeta
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {treasurehunterx.PlayerMeta} PlayerMeta
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PlayerMeta.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.treasurehunterx.PlayerMeta();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.int32();
                    break;
                case 2:
                    message.name = reader.string();
                    break;
                case 3:
                    message.displayName = reader.string();
                    break;
                case 4:
                    message.avatar = reader.string();
                    break;
                case 5:
                    message.joinIndex = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PlayerMeta message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof treasurehunterx.PlayerMeta
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {treasurehunterx.PlayerMeta} PlayerMeta
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PlayerMeta.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PlayerMeta message.
         * @function verify
         * @memberof treasurehunterx.PlayerMeta
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PlayerMeta.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.name != null && message.hasOwnProperty("name"))
                if (!$util.isString(message.name))
                    return "name: string expected";
            if (message.displayName != null && message.hasOwnProperty("displayName"))
                if (!$util.isString(message.displayName))
                    return "displayName: string expected";
            if (message.avatar != null && message.hasOwnProperty("avatar"))
                if (!$util.isString(message.avatar))
                    return "avatar: string expected";
            if (message.joinIndex != null && message.hasOwnProperty("joinIndex"))
                if (!$util.isInteger(message.joinIndex))
                    return "joinIndex: integer expected";
            return null;
        };

        /**
         * Creates a PlayerMeta message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof treasurehunterx.PlayerMeta
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {treasurehunterx.PlayerMeta} PlayerMeta
         */
        PlayerMeta.fromObject = function fromObject(object) {
            if (object instanceof $root.treasurehunterx.PlayerMeta)
                return object;
            var message = new $root.treasurehunterx.PlayerMeta();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.name != null)
                message.name = String(object.name);
            if (object.displayName != null)
                message.displayName = String(object.displayName);
            if (object.avatar != null)
                message.avatar = String(object.avatar);
            if (object.joinIndex != null)
                message.joinIndex = object.joinIndex | 0;
            return message;
        };

        /**
         * Creates a plain object from a PlayerMeta message. Also converts values to other types if specified.
         * @function toObject
         * @memberof treasurehunterx.PlayerMeta
         * @static
         * @param {treasurehunterx.PlayerMeta} message PlayerMeta
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PlayerMeta.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = 0;
                object.name = "";
                object.displayName = "";
                object.avatar = "";
                object.joinIndex = 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.name != null && message.hasOwnProperty("name"))
                object.name = message.name;
            if (message.displayName != null && message.hasOwnProperty("displayName"))
                object.displayName = message.displayName;
            if (message.avatar != null && message.hasOwnProperty("avatar"))
                object.avatar = message.avatar;
            if (message.joinIndex != null && message.hasOwnProperty("joinIndex"))
                object.joinIndex = message.joinIndex;
            return object;
        };

        /**
         * Converts this PlayerMeta to JSON.
         * @function toJSON
         * @memberof treasurehunterx.PlayerMeta
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PlayerMeta.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PlayerMeta;
    })();

    treasurehunterx.Treasure = (function() {

        /**
         * Properties of a Treasure.
         * @memberof treasurehunterx
         * @interface ITreasure
         * @property {number|null} [id] Treasure id
         * @property {number|null} [localIdInBattle] Treasure localIdInBattle
         * @property {number|null} [score] Treasure score
         * @property {number|null} [x] Treasure x
         * @property {number|null} [y] Treasure y
         * @property {boolean|null} [removed] Treasure removed
         * @property {number|null} [type] Treasure type
         */

        /**
         * Constructs a new Treasure.
         * @memberof treasurehunterx
         * @classdesc Represents a Treasure.
         * @implements ITreasure
         * @constructor
         * @param {treasurehunterx.ITreasure=} [properties] Properties to set
         */
        function Treasure(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Treasure id.
         * @member {number} id
         * @memberof treasurehunterx.Treasure
         * @instance
         */
        Treasure.prototype.id = 0;

        /**
         * Treasure localIdInBattle.
         * @member {number} localIdInBattle
         * @memberof treasurehunterx.Treasure
         * @instance
         */
        Treasure.prototype.localIdInBattle = 0;

        /**
         * Treasure score.
         * @member {number} score
         * @memberof treasurehunterx.Treasure
         * @instance
         */
        Treasure.prototype.score = 0;

        /**
         * Treasure x.
         * @member {number} x
         * @memberof treasurehunterx.Treasure
         * @instance
         */
        Treasure.prototype.x = 0;

        /**
         * Treasure y.
         * @member {number} y
         * @memberof treasurehunterx.Treasure
         * @instance
         */
        Treasure.prototype.y = 0;

        /**
         * Treasure removed.
         * @member {boolean} removed
         * @memberof treasurehunterx.Treasure
         * @instance
         */
        Treasure.prototype.removed = false;

        /**
         * Treasure type.
         * @member {number} type
         * @memberof treasurehunterx.Treasure
         * @instance
         */
        Treasure.prototype.type = 0;

        /**
         * Creates a new Treasure instance using the specified properties.
         * @function create
         * @memberof treasurehunterx.Treasure
         * @static
         * @param {treasurehunterx.ITreasure=} [properties] Properties to set
         * @returns {treasurehunterx.Treasure} Treasure instance
         */
        Treasure.create = function create(properties) {
            return new Treasure(properties);
        };

        /**
         * Encodes the specified Treasure message. Does not implicitly {@link treasurehunterx.Treasure.verify|verify} messages.
         * @function encode
         * @memberof treasurehunterx.Treasure
         * @static
         * @param {treasurehunterx.Treasure} message Treasure message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Treasure.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.localIdInBattle);
            if (message.score != null && message.hasOwnProperty("score"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.score);
            if (message.x != null && message.hasOwnProperty("x"))
                writer.uint32(/* id 4, wireType 1 =*/33).double(message.x);
            if (message.y != null && message.hasOwnProperty("y"))
                writer.uint32(/* id 5, wireType 1 =*/41).double(message.y);
            if (message.removed != null && message.hasOwnProperty("removed"))
                writer.uint32(/* id 6, wireType 0 =*/48).bool(message.removed);
            if (message.type != null && message.hasOwnProperty("type"))
                writer.uint32(/* id 7, wireType 0 =*/56).int32(message.type);
            return writer;
        };

        /**
         * Encodes the specified Treasure message, length delimited. Does not implicitly {@link treasurehunterx.Treasure.verify|verify} messages.
         * @function encodeDelimited
         * @memberof treasurehunterx.Treasure
         * @static
         * @param {treasurehunterx.Treasure} message Treasure message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Treasure.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Treasure message from the specified reader or buffer.
         * @function decode
         * @memberof treasurehunterx.Treasure
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {treasurehunterx.Treasure} Treasure
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Treasure.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.treasurehunterx.Treasure();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.int32();
                    break;
                case 2:
                    message.localIdInBattle = reader.int32();
                    break;
                case 3:
                    message.score = reader.int32();
                    break;
                case 4:
                    message.x = reader.double();
                    break;
                case 5:
                    message.y = reader.double();
                    break;
                case 6:
                    message.removed = reader.bool();
                    break;
                case 7:
                    message.type = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Treasure message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof treasurehunterx.Treasure
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {treasurehunterx.Treasure} Treasure
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Treasure.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Treasure message.
         * @function verify
         * @memberof treasurehunterx.Treasure
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Treasure.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                if (!$util.isInteger(message.localIdInBattle))
                    return "localIdInBattle: integer expected";
            if (message.score != null && message.hasOwnProperty("score"))
                if (!$util.isInteger(message.score))
                    return "score: integer expected";
            if (message.x != null && message.hasOwnProperty("x"))
                if (typeof message.x !== "number")
                    return "x: number expected";
            if (message.y != null && message.hasOwnProperty("y"))
                if (typeof message.y !== "number")
                    return "y: number expected";
            if (message.removed != null && message.hasOwnProperty("removed"))
                if (typeof message.removed !== "boolean")
                    return "removed: boolean expected";
            if (message.type != null && message.hasOwnProperty("type"))
                if (!$util.isInteger(message.type))
                    return "type: integer expected";
            return null;
        };

        /**
         * Creates a Treasure message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof treasurehunterx.Treasure
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {treasurehunterx.Treasure} Treasure
         */
        Treasure.fromObject = function fromObject(object) {
            if (object instanceof $root.treasurehunterx.Treasure)
                return object;
            var message = new $root.treasurehunterx.Treasure();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.localIdInBattle != null)
                message.localIdInBattle = object.localIdInBattle | 0;
            if (object.score != null)
                message.score = object.score | 0;
            if (object.x != null)
                message.x = Number(object.x);
            if (object.y != null)
                message.y = Number(object.y);
            if (object.removed != null)
                message.removed = Boolean(object.removed);
            if (object.type != null)
                message.type = object.type | 0;
            return message;
        };

        /**
         * Creates a plain object from a Treasure message. Also converts values to other types if specified.
         * @function toObject
         * @memberof treasurehunterx.Treasure
         * @static
         * @param {treasurehunterx.Treasure} message Treasure
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Treasure.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = 0;
                object.localIdInBattle = 0;
                object.score = 0;
                object.x = 0;
                object.y = 0;
                object.removed = false;
                object.type = 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                object.localIdInBattle = message.localIdInBattle;
            if (message.score != null && message.hasOwnProperty("score"))
                object.score = message.score;
            if (message.x != null && message.hasOwnProperty("x"))
                object.x = options.json && !isFinite(message.x) ? String(message.x) : message.x;
            if (message.y != null && message.hasOwnProperty("y"))
                object.y = options.json && !isFinite(message.y) ? String(message.y) : message.y;
            if (message.removed != null && message.hasOwnProperty("removed"))
                object.removed = message.removed;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = message.type;
            return object;
        };

        /**
         * Converts this Treasure to JSON.
         * @function toJSON
         * @memberof treasurehunterx.Treasure
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Treasure.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Treasure;
    })();

    treasurehunterx.Bullet = (function() {

        /**
         * Properties of a Bullet.
         * @memberof treasurehunterx
         * @interface IBullet
         * @property {number|null} [localIdInBattle] Bullet localIdInBattle
         * @property {number|null} [linearSpeed] Bullet linearSpeed
         * @property {number|null} [x] Bullet x
         * @property {number|null} [y] Bullet y
         * @property {boolean|null} [removed] Bullet removed
         * @property {treasurehunterx.Vec2D|null} [startAtPoint] Bullet startAtPoint
         * @property {treasurehunterx.Vec2D|null} [endAtPoint] Bullet endAtPoint
         */

        /**
         * Constructs a new Bullet.
         * @memberof treasurehunterx
         * @classdesc Represents a Bullet.
         * @implements IBullet
         * @constructor
         * @param {treasurehunterx.IBullet=} [properties] Properties to set
         */
        function Bullet(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Bullet localIdInBattle.
         * @member {number} localIdInBattle
         * @memberof treasurehunterx.Bullet
         * @instance
         */
        Bullet.prototype.localIdInBattle = 0;

        /**
         * Bullet linearSpeed.
         * @member {number} linearSpeed
         * @memberof treasurehunterx.Bullet
         * @instance
         */
        Bullet.prototype.linearSpeed = 0;

        /**
         * Bullet x.
         * @member {number} x
         * @memberof treasurehunterx.Bullet
         * @instance
         */
        Bullet.prototype.x = 0;

        /**
         * Bullet y.
         * @member {number} y
         * @memberof treasurehunterx.Bullet
         * @instance
         */
        Bullet.prototype.y = 0;

        /**
         * Bullet removed.
         * @member {boolean} removed
         * @memberof treasurehunterx.Bullet
         * @instance
         */
        Bullet.prototype.removed = false;

        /**
         * Bullet startAtPoint.
         * @member {treasurehunterx.Vec2D|null|undefined} startAtPoint
         * @memberof treasurehunterx.Bullet
         * @instance
         */
        Bullet.prototype.startAtPoint = null;

        /**
         * Bullet endAtPoint.
         * @member {treasurehunterx.Vec2D|null|undefined} endAtPoint
         * @memberof treasurehunterx.Bullet
         * @instance
         */
        Bullet.prototype.endAtPoint = null;

        /**
         * Creates a new Bullet instance using the specified properties.
         * @function create
         * @memberof treasurehunterx.Bullet
         * @static
         * @param {treasurehunterx.IBullet=} [properties] Properties to set
         * @returns {treasurehunterx.Bullet} Bullet instance
         */
        Bullet.create = function create(properties) {
            return new Bullet(properties);
        };

        /**
         * Encodes the specified Bullet message. Does not implicitly {@link treasurehunterx.Bullet.verify|verify} messages.
         * @function encode
         * @memberof treasurehunterx.Bullet
         * @static
         * @param {treasurehunterx.Bullet} message Bullet message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Bullet.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.localIdInBattle);
            if (message.linearSpeed != null && message.hasOwnProperty("linearSpeed"))
                writer.uint32(/* id 2, wireType 1 =*/17).double(message.linearSpeed);
            if (message.x != null && message.hasOwnProperty("x"))
                writer.uint32(/* id 3, wireType 1 =*/25).double(message.x);
            if (message.y != null && message.hasOwnProperty("y"))
                writer.uint32(/* id 4, wireType 1 =*/33).double(message.y);
            if (message.removed != null && message.hasOwnProperty("removed"))
                writer.uint32(/* id 5, wireType 0 =*/40).bool(message.removed);
            if (message.startAtPoint != null && message.hasOwnProperty("startAtPoint"))
                $root.treasurehunterx.Vec2D.encode(message.startAtPoint, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
            if (message.endAtPoint != null && message.hasOwnProperty("endAtPoint"))
                $root.treasurehunterx.Vec2D.encode(message.endAtPoint, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified Bullet message, length delimited. Does not implicitly {@link treasurehunterx.Bullet.verify|verify} messages.
         * @function encodeDelimited
         * @memberof treasurehunterx.Bullet
         * @static
         * @param {treasurehunterx.Bullet} message Bullet message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Bullet.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Bullet message from the specified reader or buffer.
         * @function decode
         * @memberof treasurehunterx.Bullet
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {treasurehunterx.Bullet} Bullet
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Bullet.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.treasurehunterx.Bullet();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.localIdInBattle = reader.int32();
                    break;
                case 2:
                    message.linearSpeed = reader.double();
                    break;
                case 3:
                    message.x = reader.double();
                    break;
                case 4:
                    message.y = reader.double();
                    break;
                case 5:
                    message.removed = reader.bool();
                    break;
                case 6:
                    message.startAtPoint = $root.treasurehunterx.Vec2D.decode(reader, reader.uint32());
                    break;
                case 7:
                    message.endAtPoint = $root.treasurehunterx.Vec2D.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Bullet message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof treasurehunterx.Bullet
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {treasurehunterx.Bullet} Bullet
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Bullet.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Bullet message.
         * @function verify
         * @memberof treasurehunterx.Bullet
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Bullet.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                if (!$util.isInteger(message.localIdInBattle))
                    return "localIdInBattle: integer expected";
            if (message.linearSpeed != null && message.hasOwnProperty("linearSpeed"))
                if (typeof message.linearSpeed !== "number")
                    return "linearSpeed: number expected";
            if (message.x != null && message.hasOwnProperty("x"))
                if (typeof message.x !== "number")
                    return "x: number expected";
            if (message.y != null && message.hasOwnProperty("y"))
                if (typeof message.y !== "number")
                    return "y: number expected";
            if (message.removed != null && message.hasOwnProperty("removed"))
                if (typeof message.removed !== "boolean")
                    return "removed: boolean expected";
            if (message.startAtPoint != null && message.hasOwnProperty("startAtPoint")) {
                var error = $root.treasurehunterx.Vec2D.verify(message.startAtPoint);
                if (error)
                    return "startAtPoint." + error;
            }
            if (message.endAtPoint != null && message.hasOwnProperty("endAtPoint")) {
                var error = $root.treasurehunterx.Vec2D.verify(message.endAtPoint);
                if (error)
                    return "endAtPoint." + error;
            }
            return null;
        };

        /**
         * Creates a Bullet message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof treasurehunterx.Bullet
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {treasurehunterx.Bullet} Bullet
         */
        Bullet.fromObject = function fromObject(object) {
            if (object instanceof $root.treasurehunterx.Bullet)
                return object;
            var message = new $root.treasurehunterx.Bullet();
            if (object.localIdInBattle != null)
                message.localIdInBattle = object.localIdInBattle | 0;
            if (object.linearSpeed != null)
                message.linearSpeed = Number(object.linearSpeed);
            if (object.x != null)
                message.x = Number(object.x);
            if (object.y != null)
                message.y = Number(object.y);
            if (object.removed != null)
                message.removed = Boolean(object.removed);
            if (object.startAtPoint != null) {
                if (typeof object.startAtPoint !== "object")
                    throw TypeError(".treasurehunterx.Bullet.startAtPoint: object expected");
                message.startAtPoint = $root.treasurehunterx.Vec2D.fromObject(object.startAtPoint);
            }
            if (object.endAtPoint != null) {
                if (typeof object.endAtPoint !== "object")
                    throw TypeError(".treasurehunterx.Bullet.endAtPoint: object expected");
                message.endAtPoint = $root.treasurehunterx.Vec2D.fromObject(object.endAtPoint);
            }
            return message;
        };

        /**
         * Creates a plain object from a Bullet message. Also converts values to other types if specified.
         * @function toObject
         * @memberof treasurehunterx.Bullet
         * @static
         * @param {treasurehunterx.Bullet} message Bullet
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Bullet.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.localIdInBattle = 0;
                object.linearSpeed = 0;
                object.x = 0;
                object.y = 0;
                object.removed = false;
                object.startAtPoint = null;
                object.endAtPoint = null;
            }
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                object.localIdInBattle = message.localIdInBattle;
            if (message.linearSpeed != null && message.hasOwnProperty("linearSpeed"))
                object.linearSpeed = options.json && !isFinite(message.linearSpeed) ? String(message.linearSpeed) : message.linearSpeed;
            if (message.x != null && message.hasOwnProperty("x"))
                object.x = options.json && !isFinite(message.x) ? String(message.x) : message.x;
            if (message.y != null && message.hasOwnProperty("y"))
                object.y = options.json && !isFinite(message.y) ? String(message.y) : message.y;
            if (message.removed != null && message.hasOwnProperty("removed"))
                object.removed = message.removed;
            if (message.startAtPoint != null && message.hasOwnProperty("startAtPoint"))
                object.startAtPoint = $root.treasurehunterx.Vec2D.toObject(message.startAtPoint, options);
            if (message.endAtPoint != null && message.hasOwnProperty("endAtPoint"))
                object.endAtPoint = $root.treasurehunterx.Vec2D.toObject(message.endAtPoint, options);
            return object;
        };

        /**
         * Converts this Bullet to JSON.
         * @function toJSON
         * @memberof treasurehunterx.Bullet
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Bullet.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Bullet;
    })();

    treasurehunterx.Trap = (function() {

        /**
         * Properties of a Trap.
         * @memberof treasurehunterx
         * @interface ITrap
         * @property {number|null} [id] Trap id
         * @property {number|null} [localIdInBattle] Trap localIdInBattle
         * @property {number|null} [type] Trap type
         * @property {number|null} [x] Trap x
         * @property {number|null} [y] Trap y
         * @property {boolean|null} [removed] Trap removed
         */

        /**
         * Constructs a new Trap.
         * @memberof treasurehunterx
         * @classdesc Represents a Trap.
         * @implements ITrap
         * @constructor
         * @param {treasurehunterx.ITrap=} [properties] Properties to set
         */
        function Trap(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Trap id.
         * @member {number} id
         * @memberof treasurehunterx.Trap
         * @instance
         */
        Trap.prototype.id = 0;

        /**
         * Trap localIdInBattle.
         * @member {number} localIdInBattle
         * @memberof treasurehunterx.Trap
         * @instance
         */
        Trap.prototype.localIdInBattle = 0;

        /**
         * Trap type.
         * @member {number} type
         * @memberof treasurehunterx.Trap
         * @instance
         */
        Trap.prototype.type = 0;

        /**
         * Trap x.
         * @member {number} x
         * @memberof treasurehunterx.Trap
         * @instance
         */
        Trap.prototype.x = 0;

        /**
         * Trap y.
         * @member {number} y
         * @memberof treasurehunterx.Trap
         * @instance
         */
        Trap.prototype.y = 0;

        /**
         * Trap removed.
         * @member {boolean} removed
         * @memberof treasurehunterx.Trap
         * @instance
         */
        Trap.prototype.removed = false;

        /**
         * Creates a new Trap instance using the specified properties.
         * @function create
         * @memberof treasurehunterx.Trap
         * @static
         * @param {treasurehunterx.ITrap=} [properties] Properties to set
         * @returns {treasurehunterx.Trap} Trap instance
         */
        Trap.create = function create(properties) {
            return new Trap(properties);
        };

        /**
         * Encodes the specified Trap message. Does not implicitly {@link treasurehunterx.Trap.verify|verify} messages.
         * @function encode
         * @memberof treasurehunterx.Trap
         * @static
         * @param {treasurehunterx.Trap} message Trap message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Trap.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.localIdInBattle);
            if (message.type != null && message.hasOwnProperty("type"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.type);
            if (message.x != null && message.hasOwnProperty("x"))
                writer.uint32(/* id 4, wireType 1 =*/33).double(message.x);
            if (message.y != null && message.hasOwnProperty("y"))
                writer.uint32(/* id 5, wireType 1 =*/41).double(message.y);
            if (message.removed != null && message.hasOwnProperty("removed"))
                writer.uint32(/* id 6, wireType 0 =*/48).bool(message.removed);
            return writer;
        };

        /**
         * Encodes the specified Trap message, length delimited. Does not implicitly {@link treasurehunterx.Trap.verify|verify} messages.
         * @function encodeDelimited
         * @memberof treasurehunterx.Trap
         * @static
         * @param {treasurehunterx.Trap} message Trap message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Trap.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Trap message from the specified reader or buffer.
         * @function decode
         * @memberof treasurehunterx.Trap
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {treasurehunterx.Trap} Trap
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Trap.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.treasurehunterx.Trap();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.int32();
                    break;
                case 2:
                    message.localIdInBattle = reader.int32();
                    break;
                case 3:
                    message.type = reader.int32();
                    break;
                case 4:
                    message.x = reader.double();
                    break;
                case 5:
                    message.y = reader.double();
                    break;
                case 6:
                    message.removed = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Trap message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof treasurehunterx.Trap
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {treasurehunterx.Trap} Trap
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Trap.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Trap message.
         * @function verify
         * @memberof treasurehunterx.Trap
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Trap.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                if (!$util.isInteger(message.localIdInBattle))
                    return "localIdInBattle: integer expected";
            if (message.type != null && message.hasOwnProperty("type"))
                if (!$util.isInteger(message.type))
                    return "type: integer expected";
            if (message.x != null && message.hasOwnProperty("x"))
                if (typeof message.x !== "number")
                    return "x: number expected";
            if (message.y != null && message.hasOwnProperty("y"))
                if (typeof message.y !== "number")
                    return "y: number expected";
            if (message.removed != null && message.hasOwnProperty("removed"))
                if (typeof message.removed !== "boolean")
                    return "removed: boolean expected";
            return null;
        };

        /**
         * Creates a Trap message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof treasurehunterx.Trap
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {treasurehunterx.Trap} Trap
         */
        Trap.fromObject = function fromObject(object) {
            if (object instanceof $root.treasurehunterx.Trap)
                return object;
            var message = new $root.treasurehunterx.Trap();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.localIdInBattle != null)
                message.localIdInBattle = object.localIdInBattle | 0;
            if (object.type != null)
                message.type = object.type | 0;
            if (object.x != null)
                message.x = Number(object.x);
            if (object.y != null)
                message.y = Number(object.y);
            if (object.removed != null)
                message.removed = Boolean(object.removed);
            return message;
        };

        /**
         * Creates a plain object from a Trap message. Also converts values to other types if specified.
         * @function toObject
         * @memberof treasurehunterx.Trap
         * @static
         * @param {treasurehunterx.Trap} message Trap
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Trap.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = 0;
                object.localIdInBattle = 0;
                object.type = 0;
                object.x = 0;
                object.y = 0;
                object.removed = false;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                object.localIdInBattle = message.localIdInBattle;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = message.type;
            if (message.x != null && message.hasOwnProperty("x"))
                object.x = options.json && !isFinite(message.x) ? String(message.x) : message.x;
            if (message.y != null && message.hasOwnProperty("y"))
                object.y = options.json && !isFinite(message.y) ? String(message.y) : message.y;
            if (message.removed != null && message.hasOwnProperty("removed"))
                object.removed = message.removed;
            return object;
        };

        /**
         * Converts this Trap to JSON.
         * @function toJSON
         * @memberof treasurehunterx.Trap
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Trap.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Trap;
    })();

    treasurehunterx.SpeedShoe = (function() {

        /**
         * Properties of a SpeedShoe.
         * @memberof treasurehunterx
         * @interface ISpeedShoe
         * @property {number|null} [id] SpeedShoe id
         * @property {number|null} [localIdInBattle] SpeedShoe localIdInBattle
         * @property {number|null} [x] SpeedShoe x
         * @property {number|null} [y] SpeedShoe y
         * @property {boolean|null} [removed] SpeedShoe removed
         * @property {number|null} [type] SpeedShoe type
         */

        /**
         * Constructs a new SpeedShoe.
         * @memberof treasurehunterx
         * @classdesc Represents a SpeedShoe.
         * @implements ISpeedShoe
         * @constructor
         * @param {treasurehunterx.ISpeedShoe=} [properties] Properties to set
         */
        function SpeedShoe(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SpeedShoe id.
         * @member {number} id
         * @memberof treasurehunterx.SpeedShoe
         * @instance
         */
        SpeedShoe.prototype.id = 0;

        /**
         * SpeedShoe localIdInBattle.
         * @member {number} localIdInBattle
         * @memberof treasurehunterx.SpeedShoe
         * @instance
         */
        SpeedShoe.prototype.localIdInBattle = 0;

        /**
         * SpeedShoe x.
         * @member {number} x
         * @memberof treasurehunterx.SpeedShoe
         * @instance
         */
        SpeedShoe.prototype.x = 0;

        /**
         * SpeedShoe y.
         * @member {number} y
         * @memberof treasurehunterx.SpeedShoe
         * @instance
         */
        SpeedShoe.prototype.y = 0;

        /**
         * SpeedShoe removed.
         * @member {boolean} removed
         * @memberof treasurehunterx.SpeedShoe
         * @instance
         */
        SpeedShoe.prototype.removed = false;

        /**
         * SpeedShoe type.
         * @member {number} type
         * @memberof treasurehunterx.SpeedShoe
         * @instance
         */
        SpeedShoe.prototype.type = 0;

        /**
         * Creates a new SpeedShoe instance using the specified properties.
         * @function create
         * @memberof treasurehunterx.SpeedShoe
         * @static
         * @param {treasurehunterx.ISpeedShoe=} [properties] Properties to set
         * @returns {treasurehunterx.SpeedShoe} SpeedShoe instance
         */
        SpeedShoe.create = function create(properties) {
            return new SpeedShoe(properties);
        };

        /**
         * Encodes the specified SpeedShoe message. Does not implicitly {@link treasurehunterx.SpeedShoe.verify|verify} messages.
         * @function encode
         * @memberof treasurehunterx.SpeedShoe
         * @static
         * @param {treasurehunterx.SpeedShoe} message SpeedShoe message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SpeedShoe.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.localIdInBattle);
            if (message.x != null && message.hasOwnProperty("x"))
                writer.uint32(/* id 3, wireType 1 =*/25).double(message.x);
            if (message.y != null && message.hasOwnProperty("y"))
                writer.uint32(/* id 4, wireType 1 =*/33).double(message.y);
            if (message.removed != null && message.hasOwnProperty("removed"))
                writer.uint32(/* id 5, wireType 0 =*/40).bool(message.removed);
            if (message.type != null && message.hasOwnProperty("type"))
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.type);
            return writer;
        };

        /**
         * Encodes the specified SpeedShoe message, length delimited. Does not implicitly {@link treasurehunterx.SpeedShoe.verify|verify} messages.
         * @function encodeDelimited
         * @memberof treasurehunterx.SpeedShoe
         * @static
         * @param {treasurehunterx.SpeedShoe} message SpeedShoe message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SpeedShoe.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a SpeedShoe message from the specified reader or buffer.
         * @function decode
         * @memberof treasurehunterx.SpeedShoe
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {treasurehunterx.SpeedShoe} SpeedShoe
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SpeedShoe.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.treasurehunterx.SpeedShoe();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.int32();
                    break;
                case 2:
                    message.localIdInBattle = reader.int32();
                    break;
                case 3:
                    message.x = reader.double();
                    break;
                case 4:
                    message.y = reader.double();
                    break;
                case 5:
                    message.removed = reader.bool();
                    break;
                case 6:
                    message.type = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a SpeedShoe message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof treasurehunterx.SpeedShoe
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {treasurehunterx.SpeedShoe} SpeedShoe
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SpeedShoe.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SpeedShoe message.
         * @function verify
         * @memberof treasurehunterx.SpeedShoe
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SpeedShoe.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                if (!$util.isInteger(message.localIdInBattle))
                    return "localIdInBattle: integer expected";
            if (message.x != null && message.hasOwnProperty("x"))
                if (typeof message.x !== "number")
                    return "x: number expected";
            if (message.y != null && message.hasOwnProperty("y"))
                if (typeof message.y !== "number")
                    return "y: number expected";
            if (message.removed != null && message.hasOwnProperty("removed"))
                if (typeof message.removed !== "boolean")
                    return "removed: boolean expected";
            if (message.type != null && message.hasOwnProperty("type"))
                if (!$util.isInteger(message.type))
                    return "type: integer expected";
            return null;
        };

        /**
         * Creates a SpeedShoe message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof treasurehunterx.SpeedShoe
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {treasurehunterx.SpeedShoe} SpeedShoe
         */
        SpeedShoe.fromObject = function fromObject(object) {
            if (object instanceof $root.treasurehunterx.SpeedShoe)
                return object;
            var message = new $root.treasurehunterx.SpeedShoe();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.localIdInBattle != null)
                message.localIdInBattle = object.localIdInBattle | 0;
            if (object.x != null)
                message.x = Number(object.x);
            if (object.y != null)
                message.y = Number(object.y);
            if (object.removed != null)
                message.removed = Boolean(object.removed);
            if (object.type != null)
                message.type = object.type | 0;
            return message;
        };

        /**
         * Creates a plain object from a SpeedShoe message. Also converts values to other types if specified.
         * @function toObject
         * @memberof treasurehunterx.SpeedShoe
         * @static
         * @param {treasurehunterx.SpeedShoe} message SpeedShoe
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SpeedShoe.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = 0;
                object.localIdInBattle = 0;
                object.x = 0;
                object.y = 0;
                object.removed = false;
                object.type = 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                object.localIdInBattle = message.localIdInBattle;
            if (message.x != null && message.hasOwnProperty("x"))
                object.x = options.json && !isFinite(message.x) ? String(message.x) : message.x;
            if (message.y != null && message.hasOwnProperty("y"))
                object.y = options.json && !isFinite(message.y) ? String(message.y) : message.y;
            if (message.removed != null && message.hasOwnProperty("removed"))
                object.removed = message.removed;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = message.type;
            return object;
        };

        /**
         * Converts this SpeedShoe to JSON.
         * @function toJSON
         * @memberof treasurehunterx.SpeedShoe
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SpeedShoe.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return SpeedShoe;
    })();

    treasurehunterx.Pumpkin = (function() {

        /**
         * Properties of a Pumpkin.
         * @memberof treasurehunterx
         * @interface IPumpkin
         * @property {number|null} [localIdInBattle] Pumpkin localIdInBattle
         * @property {number|null} [linearSpeed] Pumpkin linearSpeed
         * @property {number|null} [x] Pumpkin x
         * @property {number|null} [y] Pumpkin y
         * @property {boolean|null} [removed] Pumpkin removed
         */

        /**
         * Constructs a new Pumpkin.
         * @memberof treasurehunterx
         * @classdesc Represents a Pumpkin.
         * @implements IPumpkin
         * @constructor
         * @param {treasurehunterx.IPumpkin=} [properties] Properties to set
         */
        function Pumpkin(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Pumpkin localIdInBattle.
         * @member {number} localIdInBattle
         * @memberof treasurehunterx.Pumpkin
         * @instance
         */
        Pumpkin.prototype.localIdInBattle = 0;

        /**
         * Pumpkin linearSpeed.
         * @member {number} linearSpeed
         * @memberof treasurehunterx.Pumpkin
         * @instance
         */
        Pumpkin.prototype.linearSpeed = 0;

        /**
         * Pumpkin x.
         * @member {number} x
         * @memberof treasurehunterx.Pumpkin
         * @instance
         */
        Pumpkin.prototype.x = 0;

        /**
         * Pumpkin y.
         * @member {number} y
         * @memberof treasurehunterx.Pumpkin
         * @instance
         */
        Pumpkin.prototype.y = 0;

        /**
         * Pumpkin removed.
         * @member {boolean} removed
         * @memberof treasurehunterx.Pumpkin
         * @instance
         */
        Pumpkin.prototype.removed = false;

        /**
         * Creates a new Pumpkin instance using the specified properties.
         * @function create
         * @memberof treasurehunterx.Pumpkin
         * @static
         * @param {treasurehunterx.IPumpkin=} [properties] Properties to set
         * @returns {treasurehunterx.Pumpkin} Pumpkin instance
         */
        Pumpkin.create = function create(properties) {
            return new Pumpkin(properties);
        };

        /**
         * Encodes the specified Pumpkin message. Does not implicitly {@link treasurehunterx.Pumpkin.verify|verify} messages.
         * @function encode
         * @memberof treasurehunterx.Pumpkin
         * @static
         * @param {treasurehunterx.Pumpkin} message Pumpkin message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Pumpkin.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.localIdInBattle);
            if (message.linearSpeed != null && message.hasOwnProperty("linearSpeed"))
                writer.uint32(/* id 2, wireType 1 =*/17).double(message.linearSpeed);
            if (message.x != null && message.hasOwnProperty("x"))
                writer.uint32(/* id 3, wireType 1 =*/25).double(message.x);
            if (message.y != null && message.hasOwnProperty("y"))
                writer.uint32(/* id 4, wireType 1 =*/33).double(message.y);
            if (message.removed != null && message.hasOwnProperty("removed"))
                writer.uint32(/* id 5, wireType 0 =*/40).bool(message.removed);
            return writer;
        };

        /**
         * Encodes the specified Pumpkin message, length delimited. Does not implicitly {@link treasurehunterx.Pumpkin.verify|verify} messages.
         * @function encodeDelimited
         * @memberof treasurehunterx.Pumpkin
         * @static
         * @param {treasurehunterx.Pumpkin} message Pumpkin message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Pumpkin.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Pumpkin message from the specified reader or buffer.
         * @function decode
         * @memberof treasurehunterx.Pumpkin
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {treasurehunterx.Pumpkin} Pumpkin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Pumpkin.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.treasurehunterx.Pumpkin();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.localIdInBattle = reader.int32();
                    break;
                case 2:
                    message.linearSpeed = reader.double();
                    break;
                case 3:
                    message.x = reader.double();
                    break;
                case 4:
                    message.y = reader.double();
                    break;
                case 5:
                    message.removed = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Pumpkin message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof treasurehunterx.Pumpkin
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {treasurehunterx.Pumpkin} Pumpkin
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Pumpkin.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Pumpkin message.
         * @function verify
         * @memberof treasurehunterx.Pumpkin
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Pumpkin.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                if (!$util.isInteger(message.localIdInBattle))
                    return "localIdInBattle: integer expected";
            if (message.linearSpeed != null && message.hasOwnProperty("linearSpeed"))
                if (typeof message.linearSpeed !== "number")
                    return "linearSpeed: number expected";
            if (message.x != null && message.hasOwnProperty("x"))
                if (typeof message.x !== "number")
                    return "x: number expected";
            if (message.y != null && message.hasOwnProperty("y"))
                if (typeof message.y !== "number")
                    return "y: number expected";
            if (message.removed != null && message.hasOwnProperty("removed"))
                if (typeof message.removed !== "boolean")
                    return "removed: boolean expected";
            return null;
        };

        /**
         * Creates a Pumpkin message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof treasurehunterx.Pumpkin
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {treasurehunterx.Pumpkin} Pumpkin
         */
        Pumpkin.fromObject = function fromObject(object) {
            if (object instanceof $root.treasurehunterx.Pumpkin)
                return object;
            var message = new $root.treasurehunterx.Pumpkin();
            if (object.localIdInBattle != null)
                message.localIdInBattle = object.localIdInBattle | 0;
            if (object.linearSpeed != null)
                message.linearSpeed = Number(object.linearSpeed);
            if (object.x != null)
                message.x = Number(object.x);
            if (object.y != null)
                message.y = Number(object.y);
            if (object.removed != null)
                message.removed = Boolean(object.removed);
            return message;
        };

        /**
         * Creates a plain object from a Pumpkin message. Also converts values to other types if specified.
         * @function toObject
         * @memberof treasurehunterx.Pumpkin
         * @static
         * @param {treasurehunterx.Pumpkin} message Pumpkin
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Pumpkin.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.localIdInBattle = 0;
                object.linearSpeed = 0;
                object.x = 0;
                object.y = 0;
                object.removed = false;
            }
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                object.localIdInBattle = message.localIdInBattle;
            if (message.linearSpeed != null && message.hasOwnProperty("linearSpeed"))
                object.linearSpeed = options.json && !isFinite(message.linearSpeed) ? String(message.linearSpeed) : message.linearSpeed;
            if (message.x != null && message.hasOwnProperty("x"))
                object.x = options.json && !isFinite(message.x) ? String(message.x) : message.x;
            if (message.y != null && message.hasOwnProperty("y"))
                object.y = options.json && !isFinite(message.y) ? String(message.y) : message.y;
            if (message.removed != null && message.hasOwnProperty("removed"))
                object.removed = message.removed;
            return object;
        };

        /**
         * Converts this Pumpkin to JSON.
         * @function toJSON
         * @memberof treasurehunterx.Pumpkin
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Pumpkin.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Pumpkin;
    })();

    treasurehunterx.GuardTower = (function() {

        /**
         * Properties of a GuardTower.
         * @memberof treasurehunterx
         * @interface IGuardTower
         * @property {number|null} [id] GuardTower id
         * @property {number|null} [localIdInBattle] GuardTower localIdInBattle
         * @property {number|null} [type] GuardTower type
         * @property {number|null} [x] GuardTower x
         * @property {number|null} [y] GuardTower y
         * @property {boolean|null} [removed] GuardTower removed
         */

        /**
         * Constructs a new GuardTower.
         * @memberof treasurehunterx
         * @classdesc Represents a GuardTower.
         * @implements IGuardTower
         * @constructor
         * @param {treasurehunterx.IGuardTower=} [properties] Properties to set
         */
        function GuardTower(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GuardTower id.
         * @member {number} id
         * @memberof treasurehunterx.GuardTower
         * @instance
         */
        GuardTower.prototype.id = 0;

        /**
         * GuardTower localIdInBattle.
         * @member {number} localIdInBattle
         * @memberof treasurehunterx.GuardTower
         * @instance
         */
        GuardTower.prototype.localIdInBattle = 0;

        /**
         * GuardTower type.
         * @member {number} type
         * @memberof treasurehunterx.GuardTower
         * @instance
         */
        GuardTower.prototype.type = 0;

        /**
         * GuardTower x.
         * @member {number} x
         * @memberof treasurehunterx.GuardTower
         * @instance
         */
        GuardTower.prototype.x = 0;

        /**
         * GuardTower y.
         * @member {number} y
         * @memberof treasurehunterx.GuardTower
         * @instance
         */
        GuardTower.prototype.y = 0;

        /**
         * GuardTower removed.
         * @member {boolean} removed
         * @memberof treasurehunterx.GuardTower
         * @instance
         */
        GuardTower.prototype.removed = false;

        /**
         * Creates a new GuardTower instance using the specified properties.
         * @function create
         * @memberof treasurehunterx.GuardTower
         * @static
         * @param {treasurehunterx.IGuardTower=} [properties] Properties to set
         * @returns {treasurehunterx.GuardTower} GuardTower instance
         */
        GuardTower.create = function create(properties) {
            return new GuardTower(properties);
        };

        /**
         * Encodes the specified GuardTower message. Does not implicitly {@link treasurehunterx.GuardTower.verify|verify} messages.
         * @function encode
         * @memberof treasurehunterx.GuardTower
         * @static
         * @param {treasurehunterx.GuardTower} message GuardTower message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GuardTower.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.localIdInBattle);
            if (message.type != null && message.hasOwnProperty("type"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.type);
            if (message.x != null && message.hasOwnProperty("x"))
                writer.uint32(/* id 4, wireType 1 =*/33).double(message.x);
            if (message.y != null && message.hasOwnProperty("y"))
                writer.uint32(/* id 5, wireType 1 =*/41).double(message.y);
            if (message.removed != null && message.hasOwnProperty("removed"))
                writer.uint32(/* id 6, wireType 0 =*/48).bool(message.removed);
            return writer;
        };

        /**
         * Encodes the specified GuardTower message, length delimited. Does not implicitly {@link treasurehunterx.GuardTower.verify|verify} messages.
         * @function encodeDelimited
         * @memberof treasurehunterx.GuardTower
         * @static
         * @param {treasurehunterx.GuardTower} message GuardTower message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GuardTower.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GuardTower message from the specified reader or buffer.
         * @function decode
         * @memberof treasurehunterx.GuardTower
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {treasurehunterx.GuardTower} GuardTower
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GuardTower.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.treasurehunterx.GuardTower();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.int32();
                    break;
                case 2:
                    message.localIdInBattle = reader.int32();
                    break;
                case 3:
                    message.type = reader.int32();
                    break;
                case 4:
                    message.x = reader.double();
                    break;
                case 5:
                    message.y = reader.double();
                    break;
                case 6:
                    message.removed = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GuardTower message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof treasurehunterx.GuardTower
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {treasurehunterx.GuardTower} GuardTower
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GuardTower.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GuardTower message.
         * @function verify
         * @memberof treasurehunterx.GuardTower
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GuardTower.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                if (!$util.isInteger(message.localIdInBattle))
                    return "localIdInBattle: integer expected";
            if (message.type != null && message.hasOwnProperty("type"))
                if (!$util.isInteger(message.type))
                    return "type: integer expected";
            if (message.x != null && message.hasOwnProperty("x"))
                if (typeof message.x !== "number")
                    return "x: number expected";
            if (message.y != null && message.hasOwnProperty("y"))
                if (typeof message.y !== "number")
                    return "y: number expected";
            if (message.removed != null && message.hasOwnProperty("removed"))
                if (typeof message.removed !== "boolean")
                    return "removed: boolean expected";
            return null;
        };

        /**
         * Creates a GuardTower message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof treasurehunterx.GuardTower
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {treasurehunterx.GuardTower} GuardTower
         */
        GuardTower.fromObject = function fromObject(object) {
            if (object instanceof $root.treasurehunterx.GuardTower)
                return object;
            var message = new $root.treasurehunterx.GuardTower();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.localIdInBattle != null)
                message.localIdInBattle = object.localIdInBattle | 0;
            if (object.type != null)
                message.type = object.type | 0;
            if (object.x != null)
                message.x = Number(object.x);
            if (object.y != null)
                message.y = Number(object.y);
            if (object.removed != null)
                message.removed = Boolean(object.removed);
            return message;
        };

        /**
         * Creates a plain object from a GuardTower message. Also converts values to other types if specified.
         * @function toObject
         * @memberof treasurehunterx.GuardTower
         * @static
         * @param {treasurehunterx.GuardTower} message GuardTower
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GuardTower.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.id = 0;
                object.localIdInBattle = 0;
                object.type = 0;
                object.x = 0;
                object.y = 0;
                object.removed = false;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.localIdInBattle != null && message.hasOwnProperty("localIdInBattle"))
                object.localIdInBattle = message.localIdInBattle;
            if (message.type != null && message.hasOwnProperty("type"))
                object.type = message.type;
            if (message.x != null && message.hasOwnProperty("x"))
                object.x = options.json && !isFinite(message.x) ? String(message.x) : message.x;
            if (message.y != null && message.hasOwnProperty("y"))
                object.y = options.json && !isFinite(message.y) ? String(message.y) : message.y;
            if (message.removed != null && message.hasOwnProperty("removed"))
                object.removed = message.removed;
            return object;
        };

        /**
         * Converts this GuardTower to JSON.
         * @function toJSON
         * @memberof treasurehunterx.GuardTower
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GuardTower.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return GuardTower;
    })();

    treasurehunterx.RoomDownsyncFrame = (function() {

        /**
         * Properties of a RoomDownsyncFrame.
         * @memberof treasurehunterx
         * @interface IRoomDownsyncFrame
         * @property {number|null} [id] RoomDownsyncFrame id
         * @property {number|null} [refFrameId] RoomDownsyncFrame refFrameId
         * @property {Object.<string,treasurehunterx.Player>|null} [players] RoomDownsyncFrame players
         * @property {number|Long|null} [sentAt] RoomDownsyncFrame sentAt
         * @property {number|Long|null} [countdownNanos] RoomDownsyncFrame countdownNanos
         * @property {Object.<string,treasurehunterx.Treasure>|null} [treasures] RoomDownsyncFrame treasures
         * @property {Object.<string,treasurehunterx.Trap>|null} [traps] RoomDownsyncFrame traps
         * @property {Object.<string,treasurehunterx.Bullet>|null} [bullets] RoomDownsyncFrame bullets
         * @property {Object.<string,treasurehunterx.SpeedShoe>|null} [speedShoes] RoomDownsyncFrame speedShoes
         * @property {Object.<string,treasurehunterx.Pumpkin>|null} [pumpkin] RoomDownsyncFrame pumpkin
         * @property {Object.<string,treasurehunterx.GuardTower>|null} [guardTowers] RoomDownsyncFrame guardTowers
         * @property {Object.<string,treasurehunterx.PlayerMeta>|null} [playerMetas] RoomDownsyncFrame playerMetas
         */

        /**
         * Constructs a new RoomDownsyncFrame.
         * @memberof treasurehunterx
         * @classdesc Represents a RoomDownsyncFrame.
         * @implements IRoomDownsyncFrame
         * @constructor
         * @param {treasurehunterx.IRoomDownsyncFrame=} [properties] Properties to set
         */
        function RoomDownsyncFrame(properties) {
            this.players = {};
            this.treasures = {};
            this.traps = {};
            this.bullets = {};
            this.speedShoes = {};
            this.pumpkin = {};
            this.guardTowers = {};
            this.playerMetas = {};
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * RoomDownsyncFrame id.
         * @member {number} id
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @instance
         */
        RoomDownsyncFrame.prototype.id = 0;

        /**
         * RoomDownsyncFrame refFrameId.
         * @member {number} refFrameId
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @instance
         */
        RoomDownsyncFrame.prototype.refFrameId = 0;

        /**
         * RoomDownsyncFrame players.
         * @member {Object.<string,treasurehunterx.Player>} players
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @instance
         */
        RoomDownsyncFrame.prototype.players = $util.emptyObject;

        /**
         * RoomDownsyncFrame sentAt.
         * @member {number|Long} sentAt
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @instance
         */
        RoomDownsyncFrame.prototype.sentAt = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * RoomDownsyncFrame countdownNanos.
         * @member {number|Long} countdownNanos
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @instance
         */
        RoomDownsyncFrame.prototype.countdownNanos = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * RoomDownsyncFrame treasures.
         * @member {Object.<string,treasurehunterx.Treasure>} treasures
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @instance
         */
        RoomDownsyncFrame.prototype.treasures = $util.emptyObject;

        /**
         * RoomDownsyncFrame traps.
         * @member {Object.<string,treasurehunterx.Trap>} traps
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @instance
         */
        RoomDownsyncFrame.prototype.traps = $util.emptyObject;

        /**
         * RoomDownsyncFrame bullets.
         * @member {Object.<string,treasurehunterx.Bullet>} bullets
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @instance
         */
        RoomDownsyncFrame.prototype.bullets = $util.emptyObject;

        /**
         * RoomDownsyncFrame speedShoes.
         * @member {Object.<string,treasurehunterx.SpeedShoe>} speedShoes
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @instance
         */
        RoomDownsyncFrame.prototype.speedShoes = $util.emptyObject;

        /**
         * RoomDownsyncFrame pumpkin.
         * @member {Object.<string,treasurehunterx.Pumpkin>} pumpkin
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @instance
         */
        RoomDownsyncFrame.prototype.pumpkin = $util.emptyObject;

        /**
         * RoomDownsyncFrame guardTowers.
         * @member {Object.<string,treasurehunterx.GuardTower>} guardTowers
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @instance
         */
        RoomDownsyncFrame.prototype.guardTowers = $util.emptyObject;

        /**
         * RoomDownsyncFrame playerMetas.
         * @member {Object.<string,treasurehunterx.PlayerMeta>} playerMetas
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @instance
         */
        RoomDownsyncFrame.prototype.playerMetas = $util.emptyObject;

        /**
         * Creates a new RoomDownsyncFrame instance using the specified properties.
         * @function create
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @static
         * @param {treasurehunterx.IRoomDownsyncFrame=} [properties] Properties to set
         * @returns {treasurehunterx.RoomDownsyncFrame} RoomDownsyncFrame instance
         */
        RoomDownsyncFrame.create = function create(properties) {
            return new RoomDownsyncFrame(properties);
        };

        /**
         * Encodes the specified RoomDownsyncFrame message. Does not implicitly {@link treasurehunterx.RoomDownsyncFrame.verify|verify} messages.
         * @function encode
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @static
         * @param {treasurehunterx.RoomDownsyncFrame} message RoomDownsyncFrame message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RoomDownsyncFrame.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.id != null && message.hasOwnProperty("id"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
            if (message.refFrameId != null && message.hasOwnProperty("refFrameId"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.refFrameId);
            if (message.players != null && message.hasOwnProperty("players"))
                for (var keys = Object.keys(message.players), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 3, wireType 2 =*/26).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]);
                    $root.treasurehunterx.Player.encode(message.players[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            if (message.sentAt != null && message.hasOwnProperty("sentAt"))
                writer.uint32(/* id 4, wireType 0 =*/32).int64(message.sentAt);
            if (message.countdownNanos != null && message.hasOwnProperty("countdownNanos"))
                writer.uint32(/* id 5, wireType 0 =*/40).int64(message.countdownNanos);
            if (message.treasures != null && message.hasOwnProperty("treasures"))
                for (var keys = Object.keys(message.treasures), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 6, wireType 2 =*/50).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]);
                    $root.treasurehunterx.Treasure.encode(message.treasures[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            if (message.traps != null && message.hasOwnProperty("traps"))
                for (var keys = Object.keys(message.traps), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 7, wireType 2 =*/58).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]);
                    $root.treasurehunterx.Trap.encode(message.traps[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            if (message.bullets != null && message.hasOwnProperty("bullets"))
                for (var keys = Object.keys(message.bullets), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 8, wireType 2 =*/66).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]);
                    $root.treasurehunterx.Bullet.encode(message.bullets[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            if (message.speedShoes != null && message.hasOwnProperty("speedShoes"))
                for (var keys = Object.keys(message.speedShoes), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 9, wireType 2 =*/74).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]);
                    $root.treasurehunterx.SpeedShoe.encode(message.speedShoes[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            if (message.pumpkin != null && message.hasOwnProperty("pumpkin"))
                for (var keys = Object.keys(message.pumpkin), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 10, wireType 2 =*/82).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]);
                    $root.treasurehunterx.Pumpkin.encode(message.pumpkin[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            if (message.guardTowers != null && message.hasOwnProperty("guardTowers"))
                for (var keys = Object.keys(message.guardTowers), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 11, wireType 2 =*/90).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]);
                    $root.treasurehunterx.GuardTower.encode(message.guardTowers[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            if (message.playerMetas != null && message.hasOwnProperty("playerMetas"))
                for (var keys = Object.keys(message.playerMetas), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 12, wireType 2 =*/98).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]);
                    $root.treasurehunterx.PlayerMeta.encode(message.playerMetas[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            return writer;
        };

        /**
         * Encodes the specified RoomDownsyncFrame message, length delimited. Does not implicitly {@link treasurehunterx.RoomDownsyncFrame.verify|verify} messages.
         * @function encodeDelimited
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @static
         * @param {treasurehunterx.RoomDownsyncFrame} message RoomDownsyncFrame message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RoomDownsyncFrame.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a RoomDownsyncFrame message from the specified reader or buffer.
         * @function decode
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {treasurehunterx.RoomDownsyncFrame} RoomDownsyncFrame
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RoomDownsyncFrame.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.treasurehunterx.RoomDownsyncFrame(), key;
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.id = reader.int32();
                    break;
                case 2:
                    message.refFrameId = reader.int32();
                    break;
                case 3:
                    reader.skip().pos++;
                    if (message.players === $util.emptyObject)
                        message.players = {};
                    key = reader.int32();
                    reader.pos++;
                    message.players[key] = $root.treasurehunterx.Player.decode(reader, reader.uint32());
                    break;
                case 4:
                    message.sentAt = reader.int64();
                    break;
                case 5:
                    message.countdownNanos = reader.int64();
                    break;
                case 6:
                    reader.skip().pos++;
                    if (message.treasures === $util.emptyObject)
                        message.treasures = {};
                    key = reader.int32();
                    reader.pos++;
                    message.treasures[key] = $root.treasurehunterx.Treasure.decode(reader, reader.uint32());
                    break;
                case 7:
                    reader.skip().pos++;
                    if (message.traps === $util.emptyObject)
                        message.traps = {};
                    key = reader.int32();
                    reader.pos++;
                    message.traps[key] = $root.treasurehunterx.Trap.decode(reader, reader.uint32());
                    break;
                case 8:
                    reader.skip().pos++;
                    if (message.bullets === $util.emptyObject)
                        message.bullets = {};
                    key = reader.int32();
                    reader.pos++;
                    message.bullets[key] = $root.treasurehunterx.Bullet.decode(reader, reader.uint32());
                    break;
                case 9:
                    reader.skip().pos++;
                    if (message.speedShoes === $util.emptyObject)
                        message.speedShoes = {};
                    key = reader.int32();
                    reader.pos++;
                    message.speedShoes[key] = $root.treasurehunterx.SpeedShoe.decode(reader, reader.uint32());
                    break;
                case 10:
                    reader.skip().pos++;
                    if (message.pumpkin === $util.emptyObject)
                        message.pumpkin = {};
                    key = reader.int32();
                    reader.pos++;
                    message.pumpkin[key] = $root.treasurehunterx.Pumpkin.decode(reader, reader.uint32());
                    break;
                case 11:
                    reader.skip().pos++;
                    if (message.guardTowers === $util.emptyObject)
                        message.guardTowers = {};
                    key = reader.int32();
                    reader.pos++;
                    message.guardTowers[key] = $root.treasurehunterx.GuardTower.decode(reader, reader.uint32());
                    break;
                case 12:
                    reader.skip().pos++;
                    if (message.playerMetas === $util.emptyObject)
                        message.playerMetas = {};
                    key = reader.int32();
                    reader.pos++;
                    message.playerMetas[key] = $root.treasurehunterx.PlayerMeta.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a RoomDownsyncFrame message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {treasurehunterx.RoomDownsyncFrame} RoomDownsyncFrame
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RoomDownsyncFrame.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RoomDownsyncFrame message.
         * @function verify
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RoomDownsyncFrame.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.id != null && message.hasOwnProperty("id"))
                if (!$util.isInteger(message.id))
                    return "id: integer expected";
            if (message.refFrameId != null && message.hasOwnProperty("refFrameId"))
                if (!$util.isInteger(message.refFrameId))
                    return "refFrameId: integer expected";
            if (message.players != null && message.hasOwnProperty("players")) {
                if (!$util.isObject(message.players))
                    return "players: object expected";
                var key = Object.keys(message.players);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "players: integer key{k:int32} expected";
                    {
                        var error = $root.treasurehunterx.Player.verify(message.players[key[i]]);
                        if (error)
                            return "players." + error;
                    }
                }
            }
            if (message.sentAt != null && message.hasOwnProperty("sentAt"))
                if (!$util.isInteger(message.sentAt) && !(message.sentAt && $util.isInteger(message.sentAt.low) && $util.isInteger(message.sentAt.high)))
                    return "sentAt: integer|Long expected";
            if (message.countdownNanos != null && message.hasOwnProperty("countdownNanos"))
                if (!$util.isInteger(message.countdownNanos) && !(message.countdownNanos && $util.isInteger(message.countdownNanos.low) && $util.isInteger(message.countdownNanos.high)))
                    return "countdownNanos: integer|Long expected";
            if (message.treasures != null && message.hasOwnProperty("treasures")) {
                if (!$util.isObject(message.treasures))
                    return "treasures: object expected";
                var key = Object.keys(message.treasures);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "treasures: integer key{k:int32} expected";
                    {
                        var error = $root.treasurehunterx.Treasure.verify(message.treasures[key[i]]);
                        if (error)
                            return "treasures." + error;
                    }
                }
            }
            if (message.traps != null && message.hasOwnProperty("traps")) {
                if (!$util.isObject(message.traps))
                    return "traps: object expected";
                var key = Object.keys(message.traps);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "traps: integer key{k:int32} expected";
                    {
                        var error = $root.treasurehunterx.Trap.verify(message.traps[key[i]]);
                        if (error)
                            return "traps." + error;
                    }
                }
            }
            if (message.bullets != null && message.hasOwnProperty("bullets")) {
                if (!$util.isObject(message.bullets))
                    return "bullets: object expected";
                var key = Object.keys(message.bullets);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "bullets: integer key{k:int32} expected";
                    {
                        var error = $root.treasurehunterx.Bullet.verify(message.bullets[key[i]]);
                        if (error)
                            return "bullets." + error;
                    }
                }
            }
            if (message.speedShoes != null && message.hasOwnProperty("speedShoes")) {
                if (!$util.isObject(message.speedShoes))
                    return "speedShoes: object expected";
                var key = Object.keys(message.speedShoes);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "speedShoes: integer key{k:int32} expected";
                    {
                        var error = $root.treasurehunterx.SpeedShoe.verify(message.speedShoes[key[i]]);
                        if (error)
                            return "speedShoes." + error;
                    }
                }
            }
            if (message.pumpkin != null && message.hasOwnProperty("pumpkin")) {
                if (!$util.isObject(message.pumpkin))
                    return "pumpkin: object expected";
                var key = Object.keys(message.pumpkin);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "pumpkin: integer key{k:int32} expected";
                    {
                        var error = $root.treasurehunterx.Pumpkin.verify(message.pumpkin[key[i]]);
                        if (error)
                            return "pumpkin." + error;
                    }
                }
            }
            if (message.guardTowers != null && message.hasOwnProperty("guardTowers")) {
                if (!$util.isObject(message.guardTowers))
                    return "guardTowers: object expected";
                var key = Object.keys(message.guardTowers);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "guardTowers: integer key{k:int32} expected";
                    {
                        var error = $root.treasurehunterx.GuardTower.verify(message.guardTowers[key[i]]);
                        if (error)
                            return "guardTowers." + error;
                    }
                }
            }
            if (message.playerMetas != null && message.hasOwnProperty("playerMetas")) {
                if (!$util.isObject(message.playerMetas))
                    return "playerMetas: object expected";
                var key = Object.keys(message.playerMetas);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "playerMetas: integer key{k:int32} expected";
                    {
                        var error = $root.treasurehunterx.PlayerMeta.verify(message.playerMetas[key[i]]);
                        if (error)
                            return "playerMetas." + error;
                    }
                }
            }
            return null;
        };

        /**
         * Creates a RoomDownsyncFrame message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {treasurehunterx.RoomDownsyncFrame} RoomDownsyncFrame
         */
        RoomDownsyncFrame.fromObject = function fromObject(object) {
            if (object instanceof $root.treasurehunterx.RoomDownsyncFrame)
                return object;
            var message = new $root.treasurehunterx.RoomDownsyncFrame();
            if (object.id != null)
                message.id = object.id | 0;
            if (object.refFrameId != null)
                message.refFrameId = object.refFrameId | 0;
            if (object.players) {
                if (typeof object.players !== "object")
                    throw TypeError(".treasurehunterx.RoomDownsyncFrame.players: object expected");
                message.players = {};
                for (var keys = Object.keys(object.players), i = 0; i < keys.length; ++i) {
                    if (typeof object.players[keys[i]] !== "object")
                        throw TypeError(".treasurehunterx.RoomDownsyncFrame.players: object expected");
                    message.players[keys[i]] = $root.treasurehunterx.Player.fromObject(object.players[keys[i]]);
                }
            }
            if (object.sentAt != null)
                if ($util.Long)
                    (message.sentAt = $util.Long.fromValue(object.sentAt)).unsigned = false;
                else if (typeof object.sentAt === "string")
                    message.sentAt = parseInt(object.sentAt, 10);
                else if (typeof object.sentAt === "number")
                    message.sentAt = object.sentAt;
                else if (typeof object.sentAt === "object")
                    message.sentAt = new $util.LongBits(object.sentAt.low >>> 0, object.sentAt.high >>> 0).toNumber();
            if (object.countdownNanos != null)
                if ($util.Long)
                    (message.countdownNanos = $util.Long.fromValue(object.countdownNanos)).unsigned = false;
                else if (typeof object.countdownNanos === "string")
                    message.countdownNanos = parseInt(object.countdownNanos, 10);
                else if (typeof object.countdownNanos === "number")
                    message.countdownNanos = object.countdownNanos;
                else if (typeof object.countdownNanos === "object")
                    message.countdownNanos = new $util.LongBits(object.countdownNanos.low >>> 0, object.countdownNanos.high >>> 0).toNumber();
            if (object.treasures) {
                if (typeof object.treasures !== "object")
                    throw TypeError(".treasurehunterx.RoomDownsyncFrame.treasures: object expected");
                message.treasures = {};
                for (var keys = Object.keys(object.treasures), i = 0; i < keys.length; ++i) {
                    if (typeof object.treasures[keys[i]] !== "object")
                        throw TypeError(".treasurehunterx.RoomDownsyncFrame.treasures: object expected");
                    message.treasures[keys[i]] = $root.treasurehunterx.Treasure.fromObject(object.treasures[keys[i]]);
                }
            }
            if (object.traps) {
                if (typeof object.traps !== "object")
                    throw TypeError(".treasurehunterx.RoomDownsyncFrame.traps: object expected");
                message.traps = {};
                for (var keys = Object.keys(object.traps), i = 0; i < keys.length; ++i) {
                    if (typeof object.traps[keys[i]] !== "object")
                        throw TypeError(".treasurehunterx.RoomDownsyncFrame.traps: object expected");
                    message.traps[keys[i]] = $root.treasurehunterx.Trap.fromObject(object.traps[keys[i]]);
                }
            }
            if (object.bullets) {
                if (typeof object.bullets !== "object")
                    throw TypeError(".treasurehunterx.RoomDownsyncFrame.bullets: object expected");
                message.bullets = {};
                for (var keys = Object.keys(object.bullets), i = 0; i < keys.length; ++i) {
                    if (typeof object.bullets[keys[i]] !== "object")
                        throw TypeError(".treasurehunterx.RoomDownsyncFrame.bullets: object expected");
                    message.bullets[keys[i]] = $root.treasurehunterx.Bullet.fromObject(object.bullets[keys[i]]);
                }
            }
            if (object.speedShoes) {
                if (typeof object.speedShoes !== "object")
                    throw TypeError(".treasurehunterx.RoomDownsyncFrame.speedShoes: object expected");
                message.speedShoes = {};
                for (var keys = Object.keys(object.speedShoes), i = 0; i < keys.length; ++i) {
                    if (typeof object.speedShoes[keys[i]] !== "object")
                        throw TypeError(".treasurehunterx.RoomDownsyncFrame.speedShoes: object expected");
                    message.speedShoes[keys[i]] = $root.treasurehunterx.SpeedShoe.fromObject(object.speedShoes[keys[i]]);
                }
            }
            if (object.pumpkin) {
                if (typeof object.pumpkin !== "object")
                    throw TypeError(".treasurehunterx.RoomDownsyncFrame.pumpkin: object expected");
                message.pumpkin = {};
                for (var keys = Object.keys(object.pumpkin), i = 0; i < keys.length; ++i) {
                    if (typeof object.pumpkin[keys[i]] !== "object")
                        throw TypeError(".treasurehunterx.RoomDownsyncFrame.pumpkin: object expected");
                    message.pumpkin[keys[i]] = $root.treasurehunterx.Pumpkin.fromObject(object.pumpkin[keys[i]]);
                }
            }
            if (object.guardTowers) {
                if (typeof object.guardTowers !== "object")
                    throw TypeError(".treasurehunterx.RoomDownsyncFrame.guardTowers: object expected");
                message.guardTowers = {};
                for (var keys = Object.keys(object.guardTowers), i = 0; i < keys.length; ++i) {
                    if (typeof object.guardTowers[keys[i]] !== "object")
                        throw TypeError(".treasurehunterx.RoomDownsyncFrame.guardTowers: object expected");
                    message.guardTowers[keys[i]] = $root.treasurehunterx.GuardTower.fromObject(object.guardTowers[keys[i]]);
                }
            }
            if (object.playerMetas) {
                if (typeof object.playerMetas !== "object")
                    throw TypeError(".treasurehunterx.RoomDownsyncFrame.playerMetas: object expected");
                message.playerMetas = {};
                for (var keys = Object.keys(object.playerMetas), i = 0; i < keys.length; ++i) {
                    if (typeof object.playerMetas[keys[i]] !== "object")
                        throw TypeError(".treasurehunterx.RoomDownsyncFrame.playerMetas: object expected");
                    message.playerMetas[keys[i]] = $root.treasurehunterx.PlayerMeta.fromObject(object.playerMetas[keys[i]]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a RoomDownsyncFrame message. Also converts values to other types if specified.
         * @function toObject
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @static
         * @param {treasurehunterx.RoomDownsyncFrame} message RoomDownsyncFrame
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RoomDownsyncFrame.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.objects || options.defaults) {
                object.players = {};
                object.treasures = {};
                object.traps = {};
                object.bullets = {};
                object.speedShoes = {};
                object.pumpkin = {};
                object.guardTowers = {};
                object.playerMetas = {};
            }
            if (options.defaults) {
                object.id = 0;
                object.refFrameId = 0;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.sentAt = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.sentAt = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.countdownNanos = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.countdownNanos = options.longs === String ? "0" : 0;
            }
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.refFrameId != null && message.hasOwnProperty("refFrameId"))
                object.refFrameId = message.refFrameId;
            var keys2;
            if (message.players && (keys2 = Object.keys(message.players)).length) {
                object.players = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.players[keys2[j]] = $root.treasurehunterx.Player.toObject(message.players[keys2[j]], options);
            }
            if (message.sentAt != null && message.hasOwnProperty("sentAt"))
                if (typeof message.sentAt === "number")
                    object.sentAt = options.longs === String ? String(message.sentAt) : message.sentAt;
                else
                    object.sentAt = options.longs === String ? $util.Long.prototype.toString.call(message.sentAt) : options.longs === Number ? new $util.LongBits(message.sentAt.low >>> 0, message.sentAt.high >>> 0).toNumber() : message.sentAt;
            if (message.countdownNanos != null && message.hasOwnProperty("countdownNanos"))
                if (typeof message.countdownNanos === "number")
                    object.countdownNanos = options.longs === String ? String(message.countdownNanos) : message.countdownNanos;
                else
                    object.countdownNanos = options.longs === String ? $util.Long.prototype.toString.call(message.countdownNanos) : options.longs === Number ? new $util.LongBits(message.countdownNanos.low >>> 0, message.countdownNanos.high >>> 0).toNumber() : message.countdownNanos;
            if (message.treasures && (keys2 = Object.keys(message.treasures)).length) {
                object.treasures = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.treasures[keys2[j]] = $root.treasurehunterx.Treasure.toObject(message.treasures[keys2[j]], options);
            }
            if (message.traps && (keys2 = Object.keys(message.traps)).length) {
                object.traps = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.traps[keys2[j]] = $root.treasurehunterx.Trap.toObject(message.traps[keys2[j]], options);
            }
            if (message.bullets && (keys2 = Object.keys(message.bullets)).length) {
                object.bullets = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.bullets[keys2[j]] = $root.treasurehunterx.Bullet.toObject(message.bullets[keys2[j]], options);
            }
            if (message.speedShoes && (keys2 = Object.keys(message.speedShoes)).length) {
                object.speedShoes = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.speedShoes[keys2[j]] = $root.treasurehunterx.SpeedShoe.toObject(message.speedShoes[keys2[j]], options);
            }
            if (message.pumpkin && (keys2 = Object.keys(message.pumpkin)).length) {
                object.pumpkin = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.pumpkin[keys2[j]] = $root.treasurehunterx.Pumpkin.toObject(message.pumpkin[keys2[j]], options);
            }
            if (message.guardTowers && (keys2 = Object.keys(message.guardTowers)).length) {
                object.guardTowers = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.guardTowers[keys2[j]] = $root.treasurehunterx.GuardTower.toObject(message.guardTowers[keys2[j]], options);
            }
            if (message.playerMetas && (keys2 = Object.keys(message.playerMetas)).length) {
                object.playerMetas = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.playerMetas[keys2[j]] = $root.treasurehunterx.PlayerMeta.toObject(message.playerMetas[keys2[j]], options);
            }
            return object;
        };

        /**
         * Converts this RoomDownsyncFrame to JSON.
         * @function toJSON
         * @memberof treasurehunterx.RoomDownsyncFrame
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RoomDownsyncFrame.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return RoomDownsyncFrame;
    })();

    return treasurehunterx;
})();

module.exports = $root;
