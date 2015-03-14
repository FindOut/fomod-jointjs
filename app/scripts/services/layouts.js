'use strict';

/**
 * @ngdoc service
 * @name fomodApp.layouts
 * @description
 * # layouts
 * Service in the fomodApp.
 */
angular.module('fomodApp')
  .service('sizeAroundEmbeddedObjectsLayout', function() {
    // makes all embedded cells line up from top to bottom and container resize around them
    return function(container) {
      var layout = function() {
        var pos = container.get('position');
        var y = pos.y + 5;
        var maxWidth = 0;
        var embedded = container.getEmbeddedCells();
        var ei;
        for (ei in embedded) {
          var shape = embedded[ei];
          var shapeSize = shape.get('size');
          shape.set('position', {
            x: pos.x + 5,
            y: y
          });
          y += shapeSize.height + 5;
          maxWidth = Math.max(maxWidth, shapeSize.width);
        }
        container.set('size', {
          width: maxWidth + 10,
          height: y - pos.y
        });
      };
      container.on('change:embeds', layout);
      layout();
    };
  });