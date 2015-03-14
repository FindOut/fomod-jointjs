'use strict';

/**
 * @ngdoc service
 * @name fomodApp.paletteManager
 * @description
 * # paletteManager
 * Service in the fomodApp.
 */
angular.module('fomodApp')
  .service('paletteManager', function(graph, sizeAroundEmbeddedObjectsLayout) {
    var palette = new joint.shapes.basic.Rect({
      position: {
        x: 5,
        y: 5
      },
      size: {
        width: 110,
        height: 100
      },
      attrs: {
        rect: {
          fill: '#ccc',
          'stroke-width': 0,
          filter: {
            name: 'dropShadow',
            args: {
              dx: 2,
              dy: 2,
              blur: 3
            }
          }
        }
      }
    });
    palette.isPalette = true;
    graph.addCell(palette);
    sizeAroundEmbeddedObjectsLayout(palette);

    var addToPalette = function(shape) {
      shape.isTemplate = true;
      graph.addCells([shape]);
      palette.embed(shape);
    };

    return {
      addElementTemplate: function(elementTemplate) {
        addToPalette(elementTemplate);
      }
    }
  })
  .service('graph', function(data) {
    var graph = new joint.dia.Graph();


    return graph;
  });