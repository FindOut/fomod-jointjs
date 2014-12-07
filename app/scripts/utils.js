'use strict';
/*global jQuery:false */
/*jshint unused:false */

function dragThresholder(viewType) {
  var isSpecial = false;
  var isDrag = false;
  var isDown = false;
    var downEvt, downX, downY;
    var dist2 = function(x1, y1, x2, y2) {
        var dx = x2 - x1, dy = y2 - y1;
        return dx * dx + dy * dy;
    };
    return viewType.extend({
        pointerdown: function (evt, x, y) {
            if (!evt.target.id) {
              // click or drag joint defined link button - remove link/remove knee/move end
              isSpecial = true;
              viewType.prototype.pointerdown.apply(this, arguments);
            }
            else {
                isDown = true;
                downEvt = jQuery.extend({}, evt);
                downX = x;
                downY = y;
            }
        },
        pointermove: function (evt, x, y) {
            if (isSpecial || isDrag || !isDown) {
                viewType.prototype.pointermove.apply(this, arguments);
            } else {
                if (isDown && dist2(downX, downY, x, y) > 9) {
                    isDrag = true;
                    viewType.prototype.pointerdown.apply(this, [downEvt, downX, downY]);
                    viewType.prototype.pointermove.apply(this, arguments);
                }
            }
        },
        pointerup: function (evt, x, y) {
            if (isSpecial || isDrag) {
                isDrag = false;
                isDown = false;
                isSpecial = false;
                viewType.prototype.pointerup.apply(this, arguments);
            } else {
                isDrag = false;
                isDown = false;
                this.notify('cell:click', evt, x, y);
            }
        }
    });
}

function throttle(fn, threshhold, scope) {
  threshhold = threshhold || 250;
  var last,
      deferTimer;
  return function () {
    var context = scope || this;

    var now = +new Date(),
        args = arguments;
    if (last && now < last + threshhold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshhold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}

if (window) {
    window.log = function(){
      if(this.console){
        console.log.apply(console, Array.prototype.slice.call(arguments));
      }
    };
}

function remove(arr, item) {
    for (var i = arr.length; i--;) {
        if (arr[i] === item) {
            arr.splice(i, 1);
        }
    }
}
