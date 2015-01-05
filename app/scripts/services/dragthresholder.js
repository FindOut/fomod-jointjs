'use strict';

/*global jQuery:false */

/**
 * @ngdoc service
 * @name fomodApp.dragThresholder
 * @description
 * # dragThresholder
 * Service in the fomodApp.
 */
angular.module('fomodApp')
  .service('dragThresholder', function () {
    return function(viewType) {
      var isSpecial = false;
      var isDrag = false;
      var isDown = false;
      var downEvt, downX, downY, downTimestamp;
      var dist2 = function(x1, y1, x2, y2) {
        var dx = x2 - x1, dy = y2 - y1;
        return dx * dx + dy * dy;
      };
      return viewType.extend({
        pointerdown: function (evt, x, y) {
          console.log('dragThresholder.pointerdown');
          if (!evt.target.id) {
            // click or drag joint defined link button - remove link/remove knee/move end
            isSpecial = true;
            viewType.prototype.pointerdown.apply(this, arguments);
          }
          else {
            if (new Date().getTime() - downTimestamp < 300) {
              this.notify('cell:doubleclick', evt, x, y);
            }
            isDown = true;
            downEvt = jQuery.extend({}, evt);
            downX = x;
            downY = y;
            downTimestamp = new Date().getTime();
          }
        },
        pointermove: function (evt, x, y) {
          console.log('dragThresholder.pointermove');
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
          console.log('dragThresholder.pointerup');
          if (isSpecial || isDrag) {
            isDrag = false;
            isDown = false;
            isSpecial = false;
            viewType.prototype.pointerup.apply(this, arguments);
          } else {
            isDrag = false;
            isDown = false;
            this.notify('cell:click', evt, x, y);
            if (this instanceof joint.dia.ElementView) {
              viewType.prototype.pointerdown.apply(this, arguments);
              viewType.prototype.pointerup.apply(this, arguments);
            }
          }
        }
      });
    };
  });
