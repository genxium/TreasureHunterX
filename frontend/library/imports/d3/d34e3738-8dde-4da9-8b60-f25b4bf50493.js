"use strict";
cc._RF.push(module, 'd34e3c4jd5NqYtg8ltL9QST', 'TouchEventsManager');
// scripts/TouchEventsManager.js

"use strict";

cc.Class({
  extends: cc.Component,
  properties: {
    // For joystick begins.
    stickhead: {
      default: null,
      type: cc.Node
    },
    base: {
      default: null,
      type: cc.Node
    },
    joyStickEps: {
      default: 0.10,
      type: cc.Float
    },
    magicLeanLowerBound: {
      default: 0.414, // Tangent of (PI/8).
      type: cc.Float
    },
    magicLeanUpperBound: {
      default: 2.414, // Tangent of (3*PI/8).
      type: cc.Float
    },
    // For joystick ends.
    pollerFps: {
      default: 10,
      type: cc.Integer
    },
    linearScaleFacBase: {
      default: 1.00,
      type: cc.Float
    },
    minScale: {
      default: 1.00,
      type: cc.Float
    },
    maxScale: {
      default: 2.50,
      type: cc.Float
    },
    maxMovingBufferLength: {
      default: 1,
      type: cc.Integer
    },
    zoomingScaleFacBase: {
      default: 0.10,
      type: cc.Float
    },
    zoomingSpeedBase: {
      default: 4.0,
      type: cc.Float
    },
    linearSpeedBase: {
      default: 320.0,
      type: cc.Float
    },
    canvasNode: {
      default: null,
      type: cc.Node
    },
    mapNode: {
      default: null,
      type: cc.Node
    },
    linearMovingEps: {
      default: 0.10,
      type: cc.Float
    },
    scaleByEps: {
      default: 0.0375,
      type: cc.Float
    }
  },

  start: function start() {},
  onLoad: function onLoad() {
    this.cachedStickHeadPosition = cc.v2(0.0, 0.0);
    this.activeDirection = {
      dx: 0.0,
      dy: 0.0
    };
    this.maxHeadDistance = 0.5 * this.base.width;

    this._initTouchEvent();
    this._cachedMapNodePosTarget = [];
    this._cachedZoomRawTarget = null;

    this.mapScriptIns = this.mapNode.getComponent("Map");
    this.initialized = true;

    this._startMainLoop();
  },
  onDestroy: function onDestroy() {
    clearInterval(this.mainLoopTimer);
  },
  _startMainLoop: function _startMainLoop() {
    var self = this;
    var linearSpeedBase = self.linearSpeedBase;
    var zoomingSpeed = self.zoomingSpeedBase;

    self.mainLoopTimer = setInterval(function () {
      if (false == self.mapScriptIns._inputControlEnabled) return;
      if (null != self._cachedMapNodePosTarget) {
        while (self.maxMovingBufferLength < self._cachedMapNodePosTarget.length) {
          self._cachedMapNodePosTarget.shift();
        }
        if (0 < self._cachedMapNodePosTarget.length && 0 == self.mapNode.getNumberOfRunningActions()) {
          var nextMapNodePosTarget = self._cachedMapNodePosTarget.shift();
          var linearSpeed = linearSpeedBase;
          var finalDiffVec = nextMapNodePosTarget.pos.sub(self.mapNode.position);
          var finalDiffVecMag = finalDiffVec.mag();
          if (self.linearMovingEps > finalDiffVecMag) {
            // Jittering.
            // cc.log("Map node moving by finalDiffVecMag == %s is just jittering.", finalDiffVecMag);
            return;
          }
          var durationSeconds = finalDiffVecMag / linearSpeed;
          cc.log("Map node moving to %o in %s/%s == %s seconds.", nextMapNodePosTarget.pos, finalDiffVecMag, linearSpeed, durationSeconds);
          var bufferedTargetPos = cc.v2(nextMapNodePosTarget.pos.x, nextMapNodePosTarget.pos.y);
          self.mapNode.runAction(cc.sequence(cc.moveTo(durationSeconds, bufferedTargetPos), cc.callFunc(function () {
            if (self._isMapOverMoved(self.mapNode.position)) {
              self.mapNode.setPosition(bufferedTargetPos);
            }
          }, self)));
        }
      }
      if (null != self._cachedZoomRawTarget && false == self._cachedZoomRawTarget.processed) {
        cc.log("Processing self._cachedZoomRawTarget == " + self._cachedZoomRawTarget);
        self._cachedZoomRawTarget.processed = true;
        self.mapNode.setScale(self._cachedZoomRawTarget.scale);
      }
    }, 1000 / self.pollerFps);
  },
  _initTouchEvent: function _initTouchEvent() {
    var self = this;
    self.touchStartPosInMapNode = null;
    self.inTouchPoints = new Map();
    self.inMultiTouch = false;

    self.canvasNode.on(cc.Node.EventType.TOUCH_START, function (event) {
      self._touchStartEvent(event);
    });
    self.canvasNode.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
      self._touchMoveEvent(event);
    });
    self.canvasNode.on(cc.Node.EventType.TOUCH_END, function (event) {
      self._touchEndEvent(event);
    });
    self.canvasNode.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
      self._touchEndEvent(event);
    });
  },
  _touchStartEvent: function _touchStartEvent(event) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = event._touches[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var touch = _step.value;

        this.inTouchPoints.set(touch._id, touch);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    if (1 < this.inTouchPoints.size) {
      this.inMultiTouch = true;
    }

    if (!this.inMultiTouch) {
      this.touchStartPosInMapNode = this.mapNode.convertToNodeSpaceAR(event.currentTouch);
    }
  },
  _isMapOverMoved: function _isMapOverMoved(mapTargetPos) {
    var virtualPlayerPos = cc.v2(-mapTargetPos.x, -mapTargetPos.y);
    return tileCollisionManager.isOutOfMapNode(this.mapNode, virtualPlayerPos);
  },
  _touchMoveEvent: function _touchMoveEvent(event) {
    if (ALL_MAP_STATES.VISUAL != this.mapScriptIns.state) {
      return;
    }
    var linearScaleFacBase = this.linearScaleFacBase;
    var zoomingScaleFacBase = this.zoomingScaleFacBase;
    if (!this.inMultiTouch) {
      if (!this.inTouchPoints.has(event.currentTouch._id)) {
        return;
      }
      var diffVec = event.currentTouch._point.sub(event.currentTouch._startPoint);
      var scaleFactor = linearScaleFacBase / this.canvasNode.scale;
      var diffVecScaled = diffVec.mul(scaleFactor);
      var distance = diffVecScaled.mag();
      var overMoved = distance > this.maxHeadDistance;
      if (overMoved) {
        var ratio = this.maxHeadDistance / distance;
        this.cachedStickHeadPosition = diffVecScaled.mul(ratio);
      } else {
        var _ratio = distance / this.maxHeadDistance;
        this.cachedStickHeadPosition = diffVecScaled.mul(_ratio);
      }
    } else {
      if (2 == event._touches.length) {
        var firstTouch = event._touches[0];
        var secondTouch = event._touches[1];

        var startMagnitude = firstTouch._startPoint.sub(secondTouch._startPoint).mag();
        var currentMagnitude = firstTouch._point.sub(secondTouch._point).mag();

        var scaleBy = currentMagnitude / startMagnitude;
        scaleBy = 1 + (scaleBy - 1) * zoomingScaleFacBase;
        if (1 < scaleBy && Math.abs(scaleBy - 1) < this.scaleByEps) {
          // Jitterring.
          cc.log("ScaleBy == " + scaleBy + " is just jittering.");
          return;
        }
        if (1 > scaleBy && Math.abs(scaleBy - 1) < 0.5 * this.scaleByEps) {
          // Jitterring.
          cc.log("ScaleBy == " + scaleBy + " is just jittering.");
          return;
        }
        var targetScale = this.canvasNode.scale * scaleBy;
        if (this.minScale > targetScale || targetScale > this.maxScale) {
          return;
        }
        this._cachedZoomRawTarget = {
          scale: targetScale,
          timestamp: Date.now(),
          processed: false
        };
      }
    }
  },
  _touchEndEvent: function _touchEndEvent(event) {
    do {
      if (this.inMultiTouch) {
        break;
      }
      if (!this.inTouchPoints.has(event.currentTouch._id)) {
        break;
      }
      var diffVec = event.currentTouch._point.sub(event.currentTouch._startPoint);
      var diffVecMag = diffVec.mag();
      if (this.linearMovingEps <= diffVecMag) {
        break;
      }
      // Only triggers map-state-switch when `diffVecMag` is sufficiently small.

      if (ALL_MAP_STATES.VISUAL != this.mapScriptIns.state) {
        break;
      }

      // TODO: Handle single-finger-click event.
    } while (false);
    this.touchStartPosInMapNode = null;
    this.cachedStickHeadPosition = cc.v2(0.0, 0.0);
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = event._touches[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var touch = _step2.value;

        if (touch) {
          this.inTouchPoints.delete(touch._id);
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    if (0 == this.inTouchPoints.size) {
      this.inMultiTouch = false;
    }
  },
  _touchCancelEvent: function _touchCancelEvent(event) {},
  update: function update(dt) {
    if (this.inMultiTouch) return;
    if (true != this.initialized) return;
    this.stickhead.setPosition(this.cachedStickHeadPosition);
    var eps = this.joyStickEps;

    if (Math.abs(this.cachedStickHeadPosition.x) < eps && Math.abs(this.cachedStickHeadPosition.y) < eps) {
      this.activeDirection.dx = 0;
      this.activeDirection.dy = 0;
      return;
    }

    // TODO: Really normalize the following `normalizedDir`.
    var cachedStickHeadPositionMag = this.cachedStickHeadPosition.mag();
    var normalizedDir = {
      dx: this.cachedStickHeadPosition.x / cachedStickHeadPositionMag,
      dy: this.cachedStickHeadPosition.y / cachedStickHeadPositionMag
    };
    this.activeDirection = normalizedDir;
  },
  discretizeDirection: function discretizeDirection(continuousDx, continuousDy, eps) {
    var ret = {
      dx: 0,
      dy: 0
    };
    if (Math.abs(continuousDx) < eps) {
      ret.dx = 0;
      ret.dy = continuousDy > 0 ? +1 : -1;
    } else if (Math.abs(continuousDy) < eps) {
      ret.dx = continuousDx > 0 ? +2 : -2;
      ret.dy = 0;
    } else {
      var criticalRatio = continuousDy / continuousDx;
      if (criticalRatio > this.magicLeanLowerBound && criticalRatio < this.magicLeanUpperBound) {
        ret.dx = continuousDx > 0 ? +2 : -2;
        ret.dy = continuousDx > 0 ? +1 : -1;
      } else if (criticalRatio > -this.magicLeanUpperBound && criticalRatio < -this.magicLeanLowerBound) {
        ret.dx = continuousDx > 0 ? +2 : -2;
        ret.dy = continuousDx > 0 ? -1 : +1;
      } else {
        if (Math.abs(criticalRatio) < 1) {
          ret.dx = continuousDx > 0 ? +2 : -2;
          ret.dy = 0;
        } else {
          ret.dx = 0;
          ret.dy = continuousDy > 0 ? +1 : -1;
        }
      }
    }
    return ret;
  }
});

cc._RF.pop();