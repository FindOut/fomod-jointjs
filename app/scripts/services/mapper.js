'use strict';

/*global joint:false */

/**
 * @ngdoc service
 * @name fomodApp.mapper
 * @description
 * # mapper
 * Service in the fomodApp.
 */
angular.module('fomodApp')
  .service('attrMap', function() {
    return {'123': {x: 150, y: 30}, '234': {x: 450, y: 30}};
  })
  .service('mapper', function (attrMap, data) {
    return function(model, graph) {
      // add element for each model object
      var addElement = function(obj) {
        var element = new joint.shapes.basic.Rect({
          id: obj.id,
          position: attrMap[obj.id] || { x: 150, y: 30 },
          size: { width: 100, height: 30 },
          attrs: { rect: { fill: 'blue',
              filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
            text: { text: obj.get('name'), fill: 'white' } }
        });
        graph.addCell(element);
      };
      data.objects.forEach(addElement);
      data.objects.on('add', addElement);
      data.objects.on('remove', function(obj) {
        var cell = graph.getCell(obj.id);
        if (cell) {
          cell.remove();
        }
      });

      // add link for each relation
      var addLink = function(rel) {
        var link = new joint.dia.Link({
          id: rel.id,
          source: { id: rel.get('from') },
          target: { id: rel.get('to') },
          attrs: {
            // Define a filter for the whole link (special selector '.' means the root element )
            '.': { filter: { name: 'dropShadow', args: { dx: 1, dy: 1, blur: 1.5 } } },
            '.marker-target': { d: 'M 10 0 L 0 3 L 10 6 z' }
          }
        });
        graph.addCell(link);
      };
      data.relations.forEach(addLink);
      data.relations.on('add', addLink);
      data.relations.on('remove', function(rel) {
        var link = graph.getCell(rel.id);
        if (link) {
          link.remove();
        }
      });
    };
  });
