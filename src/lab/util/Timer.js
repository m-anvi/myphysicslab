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

goog.provide('myphysicslab.lab.util.Timer');

goog.require('goog.asserts');
goog.require('goog.array');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var NF3 = myphysicslab.lab.util.Util.NF3;
var NF5 = myphysicslab.lab.util.Util.NF5;
var NF7 = myphysicslab.lab.util.Util.NF7;
var nf7 = myphysicslab.lab.util.Util.nf7;
var NFE = myphysicslab.lab.util.Util.NFE;
var Util = myphysicslab.lab.util.Util;

/** Periodically executes a callback function.

Timer uses JavaScript's `requestAnimationFrame` to repeatedly schedule the callback.
On older browsers the `setTimeout` function is used.

If the period is left at the default value of zero, then the callback fires at the
rate determined by `requestAnimationFrame`, usually 60 frames per second.

If the period is set to a slower frame rate than 60 fps then Timer skips firing the
callback occasionally to achieve that slower rate of firing.

See
[BlankSlateApp](https://www.myphysicslab.com/develop/build/sims/experimental/BlankSlateApp-en.html)
for example code using a Timer.

* @param {boolean=} opt_legacy turns on legacy mode, which uses the browser method
*    `setTimeout` instead of `requestAnimationFrame`; default is `false`
* @constructor
* @final
* @struct
*/
myphysicslab.lab.util.Timer = function(opt_legacy) {
  /** Whether running under a modern or old browser.
  * @type {boolean}
  * @const
  * @private
  */
  this.legacy_ = opt_legacy || !goog.isFunction(requestAnimationFrame);
  /** the ID used to cancel the callback
  * @type {number|undefined}
  * @private
  */
  this.timeoutID_ = undefined;
  /** the callback function
  * @type {function()|null}
  * @private
  */
  this.callBack_ = null;
  /** the callback function, it must reschedule itself to maintain 'chain of callbacks'
  * @type {function()}
  * @private
  */
  this.timerCallback_ = goog.bind(this.timerCallback, this);
  /** period between callbacks, in seconds
  * @type {number}
  * @private
  */
  this.period_ = 0;
  /** Whether the Timer should be executing the callBacks.
  * @type {boolean}
  * @private
  */
  this.firing_ = false;
  /** When last callback happened
  * @type {number}
  * @private
  */
  this.fired_sys_ = Util.NaN;
  /** How late the last callback was.
  * @type {number}
  * @private
  */
  this.delta_ = 0;
};
var Timer = myphysicslab.lab.util.Timer;

if (!Util.ADVANCED) {
  /** @inheritDoc */
  Timer.prototype.toString = function() {
    return 'Timer{period_: '+this.period_
        +', firing_: '+this.firing_
        +', timeoutID_: '+this.timeoutID_
        +', fired_sys_: '+nf7(this.fired_sys_)
        +', delta_: '+nf7(this.delta_)
        +'}';
  };
};

/**
* @return {undefined}
* @private
*/
Timer.prototype.timerCallback = function() {
  if (this.callBack_ == null) {
    return;
  }
  var now = Util.systemTime();
  var elapsed = now - (this.fired_sys_ - this.delta_);
  if (elapsed >= this.period_) {
    this.callBack_();
    // adjust "last fired time" by how much this callback was late.
    // https://stackoverflow.com/questions/19764018/controlling-fps-with-requestanimationframe
    this.fired_sys_ = now;
    this.delta_ = this.period_ > 0 ? elapsed % this.period_ : 0;
    /*console.log('FIRED now='+NF7(now)
        +' elapsed='+NF7(elapsed)
        +' fired_sys_='+NF7(this.fired_sys_)
        +' delta_='+NF7(this.delta_)
        +' period='+NF7(this.period_));
    */
  } else {
    /*console.log('skip  now='+NF7(now)
        +' elapsed='+NF7(elapsed)
        +' fired_sys_='+NF7(this.fired_sys_)
        +' delta_='+NF7(this.delta_)
        +' period='+NF7(this.period_));
    */
  }
  if (this.legacy_) {
    // when period is zero use 60 fps which is 1/60 = 0.016666 = 17 ms
    var delay_ms = this.period_ > 0 ? Math.round(this.period_*1000) : 17;
    this.timeoutID_ = setTimeout(this.timerCallback_, delay_ms);
  } else {
    this.timeoutID_ = requestAnimationFrame(this.timerCallback_);
  }
};

/** Returns the default time period between callbacks in seconds of system clock
time.
@return {number} the number of seconds between successive callbacks
*/
Timer.prototype.getPeriod = function() {
  return this.period_;
};

/** Whether the chain of callbacks is firing (executing)
@return {boolean}
*/
Timer.prototype.isFiring = function() {
  return this.firing_;
};

/** Sets the callback function to be executed periodically, and calls
{@link #stopFiring} to stop the Timer and any previously scheduled callback.
* @param {?function()} callBack the function to be called periodically; can be `null`
*/
Timer.prototype.setCallBack = function(callBack) {
  this.stopFiring();
  this.callBack_ = callBack;
};

/** Sets the default time period between callback execution in seconds of system
clock time. A setting of zero means to use the default period which is usually 60
frames per second.
@param {number} period the number of seconds between successive callbacks, or zero
    to use the default period (usually 60 frames per second).
@throws {!Error} if period is negative
*/
Timer.prototype.setPeriod = function(period) {
  if (period < 0) {
    throw new Error();
  }
  this.period_ = period;
};

/** Immediately fires the callback and schedules the callback to fire repeatedly in
the future.
@return {undefined}
*/
Timer.prototype.startFiring = function() {
  if (!this.firing_) {
    this.firing_ = true;
    this.delta_ = 0;
    this.fired_sys_ = Util.systemTime() - this.period_ - 1E-7;
    this.timerCallback();
  }
};

/** Stops the Timer from firing callbacks and cancels the next scheduled callback.
@return {undefined}
*/
Timer.prototype.stopFiring = function() {
  this.firing_ = false;
  if (goog.isDef(this.timeoutID_)) {
    if (this.legacy_) {
      clearTimeout(this.timeoutID_);
    } else {
      cancelAnimationFrame(this.timeoutID_);
    }
    this.timeoutID_ = undefined;
  }
  this.fired_sys_ = NaN;
  this.delta_ = 0;
};

}); // goog.scope
