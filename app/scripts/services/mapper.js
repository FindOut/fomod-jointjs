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
      return 'MoveObjectCommand(' + element + ', ' + startPosition + ', ' + endPosition + ')';
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
      return 'ChangeLinkVerticesCommand(' + link + ', ' + startVertices + ', ' + endVertices + ')';
    };
  };
})
.service('attrMap', function() {
    return {'123': {x: 150, y: 30}, '234': {x: 450, y: 30}, '345': {x: 420, y: 120}};
  })
.service('mapper', function (CustomElementLink, attrMap, data, commander, DeleteRelationCommand, DeleteObjectCommand, MoveObjectCommand, ChangeLinkVerticesCommand, ChangeRelationToCommand, ChangeRelationAttributeCommand) {
  var batch;
  return function(model, graph) {
    // add an element for each model object
    var addElement = function(obj) {
      var element = new joint.shapes.fomod.Element({
        id: obj.id,
        position: attrMap[obj.id] || { x: 150, y: 30 },
        size: { width: 100, height: 30 },
        attrs: { rect: { fill: 'blue',
            filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
          text: { text: obj.get('name'), fill: 'white' } }
      });
      graph.addCell(element);
    };
    data.get('objects').forEach(addElement);
    data.get('objects').on('add', addElement);
    data.get('objects').on('remove', function(obj) {
      var cell = graph.getCell(obj.id);
      if (cell) {
        cell.remove();
      }
    });
    data.get('objects').on('change:name', function(obj) {
      var cell = graph.getCell(obj.id);
      cell.attr('text/text', obj.get('name'));
    });


    // add a link for each relation
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
    data.get('relations').forEach(addLink);
    data.get('relations').on('add', addLink);
    data.get('relations').on('remove', function(rel) {
      var link = graph.getCell(rel.id);
      if (link) {
        link.remove();
      }
    });
    data.get('relations').on('change:from', function(rel) {
      var link = graph.getCell(rel.id);
      if (link) {
        link.set('source', {id: rel.get('from')});
      }
    });
    data.get('relations').on('change:to', function(rel) {
      var link = graph.getCell(rel.id);
      if (link) {
        link.set('target', {id: rel.get('to')});
      }
    });

    // handle graph direct manipulation events and run commands that changes model accordingly and make changes undoable
    graph.on('remove', function(cell) {
      console.log('remove');
      if (cell instanceof joint.dia.Link) {
        commander.do(new DeleteRelationCommand(cell.id));
      } else if (cell instanceof joint.dia.Element) {
        commander.do(new DeleteObjectCommand(cell.id));
      }
    });

    // the following commands are enclosed in batch events to mark start and end of a dragging operation
    // some commands use batch inside batch, so we use batchLevel to find the outermost batch:start - batch:stop

    var batchLevel = 0; // no active batch

    graph.on('batch:start', function() {
      if (batchLevel++ === 0) {
        // outermost batch command found
        batch = {}; // create an object to hold data for the command
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

    graph.on('change:source', function(cell, source) {
      if (cell instanceof joint.dia.Link && batch) {
        if (!batch.changeLinkEnd) {
          batch.changeLinkEnd = {link: cell, attributeName: 'from', linkAttr: 'source', oldEndElementId: cell.previous('source').id};
        }
        batch.changeLinkEnd.newEndElementId = source.id;
      }
    });

    graph.on('change:target', function(cell, target) {
      if (cell instanceof joint.dia.Link && batch) {
        if (!batch.changeLinkEnd) {
          batch.changeLinkEnd = {link: cell, attributeName: 'to', linkAttr: 'target', oldEndElementId: cell.previous('target').id};
        }
        batch.changeLinkEnd.newEndElementId = target.id;
      }
    });

    graph.on('change:vertices', function(cell) {
      if (cell instanceof joint.dia.Link && batch) {
        if (!batch.changeLinkVertices) {
          batch.changeLinkVertices = {link: cell, startVertices: cell.previous('vertices')};
        }
        batch.changeLinkVertices.endVertices = cell.get('vertices');
      }
    });

    graph.on('batch:stop', function() {
      if (--batchLevel === 0) {
        // outermost batch command end
        if (batch) {
          if (batch.moveElement) {
            commander.register(new MoveObjectCommand(batch.moveElement.element, batch.moveElement.startPosition, batch.moveElement.endPosition));
          } else if (batch.changeLinkEnd) {
            if (batch.changeLinkEnd.newEndElementId) {
              commander.do(new ChangeRelationAttributeCommand(batch.changeLinkEnd.link.id, batch.changeLinkEnd.attributeName, batch.changeLinkEnd.newEndElementId));
            } else {
              // link end dropped outside any object - set back previous target
              batch.changeLinkEnd.link.set(batch.changeLinkEnd.linkAttr, {id: batch.changeLinkEnd.oldEndElementId});
            }
          } else if (batch.changeLinkVertices) {
            commander.register(new ChangeLinkVerticesCommand(batch.changeLinkVertices.link, batch.changeLinkVertices.startVertices, batch.changeLinkVertices.endVertices));
          }
          batch = undefined;
        }
      }
    });
  };
});
