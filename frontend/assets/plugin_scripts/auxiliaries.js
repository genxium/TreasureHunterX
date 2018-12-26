"use strict";

window.getQueryParamDict = function() {
  // Kindly note that only the first occurrence of duplicated keys will be picked up. 
  var query = window.location.search.substring(1);
  var kvPairs = query.split('&');
  var toRet = {};
  for (var i = 0; i < kvPairs.length; ++i) {
    var kAndV = kvPairs[i].split('=');
    if (undefined === kAndV || null === kAndV || 2 != kAndV.length) return;
    var k = kAndV[0];
    var v = decodeURIComponent(kAndV[1]);
    toRet[k] = v;
  }
  return toRet;
}

let IS_USING_X5_BLINK_KERNEL = null;
window.isUsingX5BlinkKernel = function() {
  if (null == IS_USING_X5_BLINK_KERNEL) {
    // The extraction of `browserType` might take a considerable amount of time in mobile browser kernels.
    IS_USING_X5_BLINK_KERNEL = (cc.sys.BROWSER_TYPE_MOBILE_QQ == cc.sys.browserType);  
  }
  return IS_USING_X5_BLINK_KERNEL;
};

let IS_USING_X5_BLINK_KERNEL_OR_WKWECHAT_KERNEL = null;
window.isUsingX5BlinkKernelOrWebkitWeChatKernel = function() {
  if (null == IS_USING_X5_BLINK_KERNEL_OR_WKWECHAT_KERNEL) {
    // The extraction of `browserType` might take a considerable amount of time in mobile browser kernels.
    IS_USING_X5_BLINK_KERNEL_OR_WKWECHAT_KERNEL = (cc.sys.BROWSER_TYPE_MOBILE_QQ == cc.sys.browserType || cc.sys.BROWSER_TYPE_WECHAT == cc.sys.browserType); 
  }
  return IS_USING_X5_BLINK_KERNEL_OR_WKWECHAT_KERNEL;
};

window.getRandomInt = function(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

window.safelyAssignParent = function(proposedChild, proposedParent) {
  if (proposedChild.parent == proposedParent) return false;
  proposedChild.parent = proposedParent;
  return true;
};

window.setLocalZOrder = function(aCCNode, zIndex) {
  aCCNode.zIndex = zIndex; // For cc2.0+ 
};

window.getLocalZOrder = function(aCCNode) {
  return aCCNode.zIndex; // For cc2.0+ 
};

window.safelyAddChild = function(proposedParent, proposedChild) {
  if (proposedChild.parent == proposedParent) return false;
  setLocalZOrder(proposedChild, getLocalZOrder(proposedParent) + 1);
  proposedParent.addChild(proposedChild);
  return true;
};

window.setVisible = function(aCCNode) {
  aCCNode.opacity = 255;
};

window.setInvisible = function(aCCNode) {
  aCCNode.opacity = 0;
};

window.randomProperty = function (obj) {
  var keys = Object.keys(obj)
  return obj[keys[ keys.length * Math.random() << 0]];
};

window.findPathForType2NPCWithDoubleAstar = function(srcPt /* cc.Vec2 */ , dstPt /* cc.Vec2 */ , eps /* Float */ , initialGuessedCountOfSteps /* Integer */ , thisType2NPCCollider /* cc.CircleCollider */ , barrierColliders /* [cc.PolygonCollider] */ , controlledPlayerColliders /* [cc.CircleCollider] */ , mapNode /* cc.Node with a cc.TiledMap component */ ) {

  cc.log("Double A*+heap start:");

  var debug = 0;

  //Time Comsumer

  var EndTime,
    StartTime = (new Date()).getTime();



  var maxStepsCount = 600;

  var currentStepsCount = 0;



  var diffVecMag = dstPt.sub(srcPt).mag();



  let guessedCountOfSteps = initialGuessedCountOfSteps;

  let immediateStepMag = Math.max(eps, diffVecMag / guessedCountOfSteps);



  // Essential storage.

  var srcSet = new Set();

  var dstSet = new Set();

  var closedSet = new Set();

  let srcd = {}; // Actial distance for path "srcPt -> k (end of current path)".

  let srch = {}; // Heuristically estimated total distance for path "srcPt -> k (must pass) -> dstPt".

  let dstd = {};

  let dsth = {};

  var srcheap = new Heap();

  var dstheap = new Heap();

  // Initialization of essential storage.

  srcSet.add(srcPt);

  srcd[srcPt.toString()] = {

    val: 0,

    pre: null

  };

  srch[srcPt.toString()] = (srcd[srcPt.toString()].val + dstPt.sub(srcPt).mag());

  srcheap.insert(srch[srcPt.toString()], srcPt);



  dstSet.add(dstPt);

  dstd[dstPt.toString()] = {

    val: 0,

    pre: null

  };

  dsth[dstPt.toString()] = (dstd[dstPt.toString()].val + srcPt.sub(dstPt).mag());

  dstheap.insert(dsth[dstPt.toString()], dstPt);



  // Main iteration by the essential storage.

  while (srcSet.size > 0 && dstSet.size > 0 && currentStepsCount < maxStepsCount) {

    // TODO: Optimize the search of "expanderK" by heapifying openSet.

    let node = srcheap.extractMinimum();

    let src_expanderKVal = node.key;

    let src_expanderK = node.value;

    node = dstheap.extractMinimum();

    let dst_expanderKVal = node.key;

    let dst_expanderK = node.value;



    var expanderKDiffVecFromDstPt = dst_expanderK.sub(src_expanderK);

    var expanderKDiffVecFromDstPtMag = expanderKDiffVecFromDstPt.mag();

    /*

     * Check whether `expanderK` is already so close to the `dstPt` within eps, i.e. arrived.

     */

    if (eps > expanderKDiffVecFromDstPtMag) {

      if (debug) cc.log("From %o to %o, the path found is at immediateStepMag == %f and expanderK == %o", src_expanderK, dst_expanderK, immediateStepMag);

      let pathToRet = [];

      let currentIntermediatePoint = dst_expanderK;

      while (null != dstd[currentIntermediatePoint.toString()].pre) {

        if (3 * eps < currentIntermediatePoint.sub(src_expanderK).mag()) pathToRet.push(currentIntermediatePoint);

        currentIntermediatePoint = dstd[currentIntermediatePoint.toString()].pre;

      }

      pathToRet.push(dstPt);

      pathToRet.reverse();

      currentIntermediatePoint = src_expanderK;

      while (null != srcd[currentIntermediatePoint.toString()].pre) {

        if (3 * eps < currentIntermediatePoint.sub(dst_expanderK).mag()) pathToRet.push(currentIntermediatePoint);

        currentIntermediatePoint = srcd[currentIntermediatePoint.toString()].pre;

      }

      pathToRet.push(srcPt);

      pathToRet.reverse();

      if (debug == 0) {

        cc.log("the path is %o", pathToRet);

        //Time Comsumer

        EndTime = (new Date()).getTime();

        cc.log("Section1 Time Comsume :%d ms", EndTime - StartTime);

        cc.log("Section1 Search Scale :%d steps", currentStepsCount);

      }

      return pathToRet;

    }



    ++currentStepsCount;

    /*

     * Check whether `expanderK` is already so close to the `dstPt` within immediateStepMag.

     */

    if (immediateStepMag > expanderKDiffVecFromDstPtMag) {

      // Update `guessedCountOfSteps` and `immediateStepMag`.

      guessedCountOfSteps = (guessedCountOfSteps >> 1);

      if (0 == guessedCountOfSteps) {

        guessedCountOfSteps = 1;

      }

      immediateStepMag = Math.max(eps, expanderKDiffVecFromDstPtMag / guessedCountOfSteps);

    }



    // Calculation of neighbouring points determined by "immediateStepMag" and "ALL_DISCRETE_DIRECTIONS_CLOCKWISE". 

    let composedNeighbours = [],
      cnt = -1;

    for (let direction of ALL_DISCRETE_DIRECTIONS_CLOCKWISE) {

      // Note that the magnitudes of all "direction"s could vary, and such isotropic property is intentionally made use of here. 

      let diff = cc.v2(direction.dx * immediateStepMag, direction.dy * immediateStepMag);

      composedNeighbours.push(src_expanderK.add(diff));

      composedNeighbours.push(dst_expanderK.add(diff));

    }

    for (let neighbour of composedNeighbours) {

      let expanderK = (++cnt % 2 == 0) ? src_expanderK : dst_expanderK;

      let intersectsWithImpenetrableCollider = false;

      let nextThisType2NPCCollider = {

        position: neighbour.add(

          thisType2NPCCollider.offset

        ),

        radius: thisType2NPCCollider.radius,

      };

      if (tileCollisionManager.isOutOfMapNode(mapNode, nextThisType2NPCCollider.position)) {
        continue;
      }

      for (let aComp of barrierColliders) {

        let toColliderPolygon = [];

        for (let p of aComp.points) {

          toColliderPolygon.push(aComp.node.position.add(p));

        }

        if (cc.Intersection.linePolygon(expanderK, nextThisType2NPCCollider.position, toColliderPolygon)) {

          intersectsWithImpenetrableCollider = true;

          break;

        }

        if (cc.Intersection.polygonCircle(toColliderPolygon, nextThisType2NPCCollider)) {

          intersectsWithImpenetrableCollider = true;

          break;

        }

      }

      if (intersectsWithImpenetrableCollider) {

        continue;

      }

      if (cnt % 2 == 0) {

        var tmpDVal = srcd[src_expanderK.toString()].val + neighbour.sub(dst_expanderK).mag();

        if (null == srcd[neighbour.toString()] || tmpDVal < srcd[neighbour.toString()].val) {

          srcd[neighbour.toString()] = {

            val: tmpDVal,

            pre: src_expanderK

          };

          srch[neighbour.toString()] = (tmpDVal + dstPt.sub(neighbour).mag());

          srcheap.insert(srch[neighbour.toString()], neighbour);

          if (debug == 2) cc.log("Direction diff neighbour:%o", neighbour);

          srcSet.add(neighbour);

        }

      } else {

        var tmpDVal = dstd[dst_expanderK.toString()].val + neighbour.sub(src_expanderK).mag();

        if (null == dstd[neighbour.toString()] || tmpDVal < dstd[neighbour.toString()].val) {

          dstd[neighbour.toString()] = {

            val: tmpDVal,

            pre: dst_expanderK

          };

          dsth[neighbour.toString()] = (tmpDVal + srcPt.sub(neighbour).mag());

          dstheap.insert(dsth[neighbour.toString()], neighbour);

          if (debug == 2) cc.log("Direction diff neighbour:%o", neighbour);

          dstSet.add(neighbour);

        }

      }

    }

    srcSet.delete(src_expanderK);

    dstSet.delete(dst_expanderK);

    closedSet.add(src_expanderK);

    closedSet.add(dst_expanderK);

  }

  if (debug == 0) {
    EndTime = (new Date()).getTime();
    cc.log("Section2 Time Comsume :%d ms", EndTime - StartTime);
    cc.log("Section2 Search Scale :%d steps", currentStepsCount);
  }
  return null;

};

window.gidAnimationClipMap = {};
window.getOrCreateAnimationClipForGid = function(gid, tiledMapInfo, tilesElListUnderTilesets) {
  if (null != gidAnimationClipMap[gid]) return gidAnimationClipMap[gid];   
  if (false == gidAnimationClipMap[gid]) return null;

  var tilesets = tiledMapInfo.getTilesets();
  var targetTileset = null;
  for (var i = 0; i < tilesets.length; ++i) {
    // TODO: Optimize by binary search.
    if (gid < tilesets[i].firstGid) continue;
    if (i < tilesets.length - 1) {
      if (gid >= tilesets[i + 1].firstGid) continue;
    }
    targetTileset = tilesets[i];
    break;
  }
  if (!targetTileset) return null;
  var tileIdWithinTileset = (gid - targetTileset.firstGid); 
  var tilesElListUnderCurrentTileset = tilesElListUnderTilesets[targetTileset.name + ".tsx"]; 

  var targetTileEl = null;
  for (var tileIdx = 0; tileIdx < tilesElListUnderCurrentTileset.length; ++tileIdx) {
    var tmpTileEl = tilesElListUnderCurrentTileset[tileIdx]; 
    if (tileIdWithinTileset != parseInt(tmpTileEl.id)) continue;
    targetTileEl = tmpTileEl;
    break;
  }

  if (!targetTileEl) return null;
  var animElList = targetTileEl.getElementsByTagName("animation"); 
  if (!animElList || 0 >= animElList.length) return null;
  var animEl = animElList[0]; 

  var uniformDurationSecondsPerFrame = null;
  var totDurationSeconds = 0; 
  var sfList = [];
  var frameElListUnderAnim = animEl.getElementsByTagName("frame"); 
  var tilesPerRow = (targetTileset.sourceImage.width/targetTileset._tileSize.width);

  for (var k = 0; k < frameElListUnderAnim.length; ++k) {
    var frameEl = frameElListUnderAnim[k];   
    var tileId = parseInt(frameEl.attributes.tileid.value);
    var durationSeconds = frameEl.attributes.duration.value/1000; 
    if (null == uniformDurationSecondsPerFrame) uniformDurationSecondsPerFrame = durationSeconds;
    totDurationSeconds += durationSeconds;
    var row = parseInt(tileId / tilesPerRow);
    var col = (tileId % tilesPerRow);
    var offset = cc.v2(targetTileset._tileSize.width*col, targetTileset._tileSize.height*row);
    var origSize = targetTileset._tileSize;
    var rect = cc.rect(offset.x, offset.y, origSize.width, origSize.height);
    var sf = new cc.SpriteFrame(targetTileset.sourceImage, rect, false /* rotated */, offset, origSize);
    sfList.push(sf);
  } 
  var sampleRate = 1/uniformDurationSecondsPerFrame; // A.k.a. fps.
  var animClip = cc.AnimationClip.createWithSpriteFrames(sfList, sampleRate);
  // http://docs.cocos.com/creator/api/en/enums/WrapMode.html.
  animClip.wrapMode = cc.WrapMode.Loop;
  return {
    origSize: targetTileset._tileSize,
    animationClip: animClip,
  };
};
