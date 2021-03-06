// Copyright 2016 Erik Neumann.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('myphysicslab.sims.roller.PathObserver');

goog.require('myphysicslab.lab.model.NumericalPath');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayList');
goog.require('myphysicslab.lab.view.DisplayPath');
goog.require('myphysicslab.lab.view.LabView');
goog.require('myphysicslab.lab.view.SimView');

goog.scope(function() {

var DisplayList = myphysicslab.lab.view.DisplayList;
var DisplayPath = myphysicslab.lab.view.DisplayPath;
var DoubleRect = myphysicslab.lab.util.DoubleRect;
var GenericObserver = myphysicslab.lab.util.GenericObserver;
var LabView = myphysicslab.lab.view.LabView;
var NF = myphysicslab.lab.util.Util.NF;
var NumericalPath = myphysicslab.lab.model.NumericalPath;
var Observer = myphysicslab.lab.util.Observer;
var SimList = myphysicslab.lab.model.SimList;
var SimObject = myphysicslab.lab.model.SimObject;
var SimView = myphysicslab.lab.view.SimView;
var Subject = myphysicslab.lab.util.Subject;
var Util = myphysicslab.lab.util.Util;
var Vector = myphysicslab.lab.util.Vector;

/** Automatically creates a DisplayPath when a NumericalPath is added to a SimList.
Observes the SimList of a Simulation, adding or removing DisplayPath to represent the
NumericalPath in SimView with a `zIndex` of -10 so that it appears underneath other
objects.

Note that the DisplayPath shows only a single NumericalPath, and is destroyed when that
NumericalPath is removed from the SimList.


### Setting Style of DisplayPath

To control the style (color, line thickness, etc) used for a particular DisplayPath
there are two approaches:

#### 1. Modify the DisplayPath style directly

Modify the DisplayPath's style directly, for example:

    var dispPath1 = simView.getDisplayList().find(path1);
    dispPath1.setStyle(0, DrawingStyle.lineStyle('red', 2));

#### 2. Modify the prototype

PathObserver has a **prototype** DisplayPath. When a display property of a DisplayPath
is `undefined`, then the property is fetched from the prototype DisplayPath. If it is
also `undefined` on the prototype then a default value is used.

Keep in mind that **all** objects with a given prototype will be affected by any
changes made to the prototype.

Here is an example where we set the prototype to have a thin blue line.

    var pathObs = new PathObserver(simList, simView, null);
    pathObs.protoDisplayPath.setStyle(0, DrawingStyle.lineStyle('blue', 1));


### Resize the SimView to match NumericalPath

Often we want the SimView's dimensions to match that of the NumericalPath. To have the
PathObserver change the bounding rectangle of the SimView to match that of the
NumericalPath, specify the `simRectSetter` argument in the constructor. This will
occur whenever the NumericalPath changes.


@param {!SimList} simList SimList to observe
@param {!SimView} simView the SimView to add DisplayObjects to
@param {?function(!DoubleRect)} simRectSetter function to use for resizing the
    simulation rectangle of the SimView; if `null` then resizing is not done
@param {number=} opt_expand  factor to multiply the width and height by
     to expand the path bounds, which yields the rectangle used for resizing the
     SimView.  For example, 1.1 will make the bounds 10% larger.
@implements {Observer}
@constructor
@final
@struct
*/
myphysicslab.sims.roller.PathObserver = function(simList, simView, simRectSetter,
      opt_expand) {
  /**
  * @type {!SimView}
  * @private
  */
  this.simView_ = simView;
  /**
  * @type {!DisplayList}
  * @private
  */
  this.displayList_ = simView.getDisplayList();
  /**
  @type {!SimList}
  @private
  */
  this.simList_ = simList;
  /**
  @type {?function(!DoubleRect)}
  @private
  */
  this.simRectSetter_ = simRectSetter;
  /**
  * @type {number}
  * @private
  */
  this.expansionFactor_ = opt_expand || 1.1;
  this.simList_.addObserver(this);
  /** List of DisplayPaths and GenericObservers we made. When DisplayPath is removed
  * from SimView we disconnect things, which helps garbage collection.
  * @type {!Array<!PathObserver.memObjects>}
  * @private
  */
  this.memObjs_ = [];
  /** The prototype DisplayPath.
  * @type {!DisplayPath|undefined}
  */
  this.protoDisplayPath = new DisplayPath();
  this.protoDisplayPath.setZIndex(-10);
};
var PathObserver = myphysicslab.sims.roller.PathObserver;

if (!Util.ADVANCED) {
  /** @inheritDoc */
  PathObserver.prototype.toString = function() {
    return 'PathObserver{'
      +'simList_: '+this.simList_.toStringShort()
      +', simView_: '+this.simView_.toStringShort()
      +', expansionFactor: '+NF(this.expansionFactor_)
      +', displayList_: '+this.displayList_.toStringShort()
      +', protoDisplayPath: '+(this.protoDisplayPath ?
           this.protoDisplayPath.toStringShort() : 'undefined')
      +'}';
  };

  /** @inheritDoc */
  PathObserver.prototype.toStringShort = function() {
    return 'PathObserver{}';
  };
};

/**
* @typedef {{simObj: !NumericalPath, obs: !GenericObserver, dispPath: !DisplayPath}}
*/
PathObserver.memObjects;

/** Creates DisplayPath for the NumericalPath, and adds DisplayPath to SimView.
* @param {!NumericalPath} np
* @private
*/
PathObserver.prototype.addPath = function(np) {
  if (this.displayList_.find(np) != null) {
    // we already have a DisplayPath for this NumericalPath, don't add a new one.
    return;
  }
  var displayPath = new DisplayPath(this.protoDisplayPath);
  displayPath.setScreenRect(this.simView_.getScreenRect());
  displayPath.addPath(np);
  this.displayList_.add(displayPath);
  if (this.simRectSetter_ != null) {
    // modify size of display to fit this path
    var r = np.getBoundsWorld().scale(this.expansionFactor_);
    if (r.isEmpty()) {
      // for empty rectangle: expand bounds to be at least a unit square
      var unitRect = DoubleRect.makeCentered(r.getCenter(), 1, 1);
      r = r.union(unitRect);
    }
    this.simRectSetter_(r);
  }
  var obs = new GenericObserver(this.simView_, goog.bind(function(event) {
    if (event.getSubject() == this.simView_) {
      if (event.nameEquals(LabView.SCREEN_RECT_CHANGED)) {
        displayPath.setScreenRect(this.simView_.getScreenRect());
      }
    }
  }, this), 'resize displayPath when screenRect changes');
  // Remember the combo of NumericalPath, GenericObserver and DisplayPath.
  this.memObjs_.push({simObj: np, obs: obs, dispPath: displayPath});
};

/** Removes DisplayPath for the given NumericalPath from SimView.
* @param {!NumericalPath} np
* @private
*/
PathObserver.prototype.removePath = function(np) {
  var memObj = goog.array.find(this.memObjs_, function(element) {
    return element.simObj == np;
  });
  if (memObj != null) {
    // Disconnect things to help with garbage collection.
    this.displayList_.remove(memObj.dispPath);
    memObj.obs.disconnect();
    memObj.dispPath.removePath(np);
    goog.array.remove(this.memObjs_, memObj);
  }
};

/** @inheritDoc */
PathObserver.prototype.observe =  function(event) {
  if (event.getSubject() == this.simList_) {
    var obj = /** @type {!SimObject} */ (event.getValue());
    if (obj instanceof NumericalPath) {
      var np = /** @type {!NumericalPath} */(obj);
      if (event.nameEquals(SimList.OBJECT_ADDED)) {
        this.addPath(np);
      } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
        this.removePath(np);
      }
    }
  }
};

});  // goog.scope
