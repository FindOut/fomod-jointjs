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
.service('MoveObjectCommand', function() {
  return function(element, startPosition, endPosition) {
    this.do = function() {
      element.set('position', endPosition);
    };
    this.undo = function() {
      element.set('position', startPosition);
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'MoveObjectCommand(' + id + ', ' + name + ')';
    };
  };
})
.service('ChangeLinkVerticesCommand', function() {
  return function(link, startVertices, endVertices) {
    this.do = function() {
      link.set('vertices', endVertices);
    };
    this.undo = function() {
      link.set('vertices', startVertices);
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'MoveObjectCommand(' + id + ', ' + name + ')';
    };
  };
})
.service('attrMap', function() {
    return {'123': {x: 150, y: 30}, '234': {x: 450, y: 30}};
  })
  .service('mapper', function (attrMap, data, commander, DeleteRelationCommand, MoveObjectCommand, ChangeLinkVerticesCommand) {
    var batch;
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
      data.objects.on('change:name', function(obj) {
        var cell = graph.getCell(obj.id);
        cell.attr('text/text', obj.get('name'));
      });

      graph.on('change:vertices', function(cell) {
        if (cell instanceof joint.dia.Link && batch) {
          if (!batch.changeLinkVertices) {
            batch.changeLinkVertices = {link: cell, startVertices: cell.previous('vertices')};
          }
          batch.changeLinkVertices.endVertices = cell.get('vertices');
        }
      });

      graph.on('change:position', function(cell) {
        if (cell instanceof joint.dia.Element && batch) {
          if (!batch.moveElement) {
            batch.moveElement = {element: cell, startPosition: cell.previous('position')};
          }
          batch.moveElement.endPosition = cell.get('position');
        }
      });

      graph.on('batch:start', function() {
          batch = {};
      });

      graph.on('batch:stop', function() {
        if (batch) {
          if (batch.moveElement) {
            commander.register(new MoveObjectCommand(batch.moveElement.element, batch.moveElement.startPosition, batch.moveElement.endPosition));
          } else if (batch.changeLinkVertices) {
            commander.register(new ChangeLinkVerticesCommand(batch.changeLinkVertices.link, batch.changeLinkVertices.startVertices, batch.changeLinkVertices.endVertices));
          }
          batch = undefined;
        }
      });

      graph.on('all', function() {
        // console.log(arguments);
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

      graph.on('remove', function(cell) {
        if (cell instanceof joint.dia.Link) {
          console.log(arguments);
          commander.do(new DeleteRelationCommand(cell.id));
        }
      });
    };
  });
