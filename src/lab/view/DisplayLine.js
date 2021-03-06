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

goog.provide('myphysicslab.lab.view.DisplayLine');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.model.Line');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayObject');

goog.scope(function() {

var ConcreteLine = myphysicslab.lab.model.ConcreteLine;
var DisplayObject = myphysicslab.lab.view.DisplayObject;
var Line = myphysicslab.lab.model.Line;
var NF = myphysicslab.lab.util.Util.NF;
var SimObject = myphysicslab.lab.model.SimObject;
var Util = myphysicslab.lab.util.Util;
var Vector = myphysicslab.lab.util.Vector;

/** Displays a {@link Line} as a colored line.

The position is determined by the position of the Line, so {@link #setPosition}
has no effect, and the DisplayLine is never dragable.
The position is reported as the midpoint of the Line by {@link #getPosition}.

* @param {?Line=} line the Line to display
* @param {?DisplayLine=} proto the prototype DisplayLine to inherit properties from
* @constructor
* @final
* @struct
* @implements {DisplayObject}
*/
myphysicslab.lab.view.DisplayLine = function(line, proto) {
  /**
  * @type {!Line}
  * @private
  */
  this.line_ = goog.isDefAndNotNull(line) ? line : new ConcreteLine('proto');
  /** Color used when drawing the line, a CSS3 color value.
  * @type {string|undefined}
  * @private
  */
  this.color_;
  /** Thickness to use when drawing the line, in screen coordinates, so a unit
  * is a screen pixel.
  * @type {number|undefined}
  * @private
  */
  this.thickness_;
  /** Line dash array used when drawing the line.  Corresponds to lengths of dashes
  * and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
  * length 3 with spaces of length 5. Empty array indicates solid line.
  * @type {!Array<number>|undefined}
  * @private
  */
  this.lineDash_;
  /**
  * @type {number|undefined}
  * @private
  */
  this.zIndex_;
  /**
  * @type {?DisplayLine}
  * @private
  */
  this.proto_ = goog.isDefAndNotNull(proto) ? proto : null;
};
var DisplayLine = myphysicslab.lab.view.DisplayLine;

if (!Util.ADVANCED) {
  /** @inheritDoc */
  DisplayLine.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', thickness: '+NF(this.getThickness())
        +', color: "'+this.getColor()+'"'
        +', lineDash: ['+this.getLineDash()+']'
        +', zIndex: '+this.getZIndex()
        +', proto: '+(this.proto_ != null ? this.proto_.toStringShort() : 'null')
        +'}';
  };

  /** @inheritDoc */
  DisplayLine.prototype.toStringShort = function() {
    return 'DisplayLine{line_: '+this.line_.toStringShort()+'}';
  };
};

/** @inheritDoc */
DisplayLine.prototype.contains = function(point) {
  return false;
};

/** @inheritDoc */
DisplayLine.prototype.draw = function(context, map) {
  var thickness = this.getThickness();
  if (thickness > 0) {
    var p1 = map.simToScreen(this.line_.getStartPoint());
    var p2 = map.simToScreen(this.line_.getEndPoint());
    var len = p1.distanceTo(p2);
    if (len < 1e-6)
      return;
    context.save()
    var lineDash = this.getLineDash();
    if (lineDash.length > 0 && context.setLineDash) {
      context.setLineDash(lineDash);
    }
    context.lineWidth = this.getThickness();
    context.strokeStyle = this.getColor();
    context.beginPath();
    context.moveTo(p1.getX(), p1.getY());
    context.lineTo(p2.getX(), p2.getY());
    context.stroke();
    context.restore();
  }
};

/** Color used when drawing the line, a CSS3 color value.
* @return {string}
*/
DisplayLine.prototype.getColor = function() {
  if (this.color_ !== undefined) {
    return this.color_;
  } else if (this.proto_ != null) {
    return this.proto_.getColor();
  } else {
    return 'gray';
  }
};

/** Line dash array used when drawing the line.  Corresponds to lengths of dashes
* and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
* length 3 with spaces of length 5. Empty array indicates solid line.
* @return {!Array<number>}
*/
DisplayLine.prototype.getLineDash = function() {
  if (this.lineDash_ !== undefined) {
    return this.lineDash_;
  } else if (this.proto_ != null) {
    return this.proto_.getLineDash();
  } else {
    return [ ];
  }
};

/** @inheritDoc */
DisplayLine.prototype.getMassObjects = function() {
  return [ ];
};

/** @inheritDoc */
DisplayLine.prototype.getPosition = function() {
  // return midpoint of the line
  return this.line_.getStartPoint().add(this.line_.getEndPoint()).multiply(0.5);
};

/** @inheritDoc */
DisplayLine.prototype.getSimObjects = function() {
  return [ this.line_ ];
};

/** Thickness to use when drawing the line, in screen coordinates, so a unit
* is a screen pixel. Line will appear only with positive thickness.
* Can be set to zero to make the line disappear.
* @return {number}
*/
DisplayLine.prototype.getThickness = function() {
  if (this.thickness_ !== undefined) {
    return this.thickness_;
  } else if (this.proto_ != null) {
    return this.proto_.getThickness();
  } else {
    return 4.0;
  }
};

/** @inheritDoc */
DisplayLine.prototype.getZIndex = function() {
  if (this.zIndex_ !== undefined) {
    return this.zIndex_;
  } else if (this.proto_ != null) {
    return this.proto_.getZIndex();
  } else {
    return 0;
  }
};

/** @inheritDoc */
DisplayLine.prototype.isDragable = function() {
  return false;
};

/** Color used when drawing the line, a CSS3 color value.
* @param {string|undefined} color
* @return {!DisplayLine} this object for chaining setters
*/
DisplayLine.prototype.setColor = function(color) {
  this.color_ = color;
  return this;
};

/** @inheritDoc */
DisplayLine.prototype.setDragable = function(dragable) {
  // does nothing
};

/** Line dash array used when drawing the line.  Corresponds to lengths of dashes
* and spaces, in screen coordinates. For example, `[3, 5]` alternates dashes of
* length 3 with spaces of length 5. Empty array indicates solid line.
* @param {!Array<number>|undefined} lineDash
* @return {!DisplayLine} this object for chaining setters
*/
DisplayLine.prototype.setLineDash = function(lineDash) {
  this.lineDash_ = lineDash;
  return this;
};

/** @inheritDoc */
DisplayLine.prototype.setPosition = function(position) {
};

/** Thickness to use when drawing the line, in screen coordinates, so a unit
* is a screen pixel. Line will appear only with positive thickness.
* Can be set to zero to make the line disappear.
* @param {number|undefined} thickness
* @return {!DisplayLine} this object for chaining setters
*/
DisplayLine.prototype.setThickness = function(thickness) {
  this.thickness_ = thickness;
  return this;
};

/** @inheritDoc */
DisplayLine.prototype.setZIndex = function(zIndex) {
  this.zIndex_ = zIndex;
};

});  // goog.scope
