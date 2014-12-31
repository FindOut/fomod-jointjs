'use strict';
/*global $:false */
/*global joint:false */
/*global g:false */
/*global V:false */

/**
* @ngdoc function
* @name fomodApp.controller:MainCtrl
* @description
* # MainCtrl
* Controller of the fomodApp
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
        shape.set('position', {x: pos.x + 5, y: y});
        y += shapeSize.height + 5;
        maxWidth = Math.max(maxWidth, shapeSize.width);
      }
      container.set('size', {width: maxWidth + 10, height: y - pos.y});
    };
    container.on('change:embeds', layout);
    layout();
  };
})
.service('graph', function(mapper, data, sizeAroundEmbeddedObjectsLayout) {
  var graph = new joint.dia.Graph();

  var palette = new joint.shapes.basic.Rect({
    position: { x: 5, y: 5},
    size: { width: 110, height: 100 },
    attrs: { rect: { fill: '#888', 'stroke-width': 0,
    filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } }}
  });
  palette.isPalette = true;
  graph.addCell(palette);
  sizeAroundEmbeddedObjectsLayout(palette);

  var addToPalette = function(shape) {
    shape.isTemplate = true;
    graph.addCells([shape]);
    palette.embed(shape);
  };

  addToPalette(new joint.shapes.fomod.ElementTemplate({
    size: { width: 100, height: 30 },
    attrs: { rect: { fill: 'blue',
    filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
    text: { text: 'new box 1', fill: 'white' }}
  }));

  addToPalette(new joint.shapes.fomod.ElementTemplate({
    size: { width: 100, height: 30 },
    attrs: { rect: { fill: 'blue',
    filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
    text: { text: 'new box 2', fill: 'white' } }
  }));

  addToPalette(new joint.shapes.fomod.ElementTemplate({
    size: { width: 100, height: 30 },
    attrs: { rect: { fill: 'blue',
    filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
    text: { text: 'new box 3', fill: 'white' } }
  }));

  mapper(data, graph);

  return graph;
})
.controller('MainCtrl', function ($scope, dragThresholder, dataStore, graph, data, commander, CreateObjectCommand, CreateRelationCommand, DeleteRelationCommand, mapper, attrMap) {
  $scope.commander = commander;
  $scope.status = 'reading';
  commander.on(function() {
    setTimeout(function() {$scope.$apply();});
  });
  dataStore.on(function(type) {
    if (type === 'read-begin') {
      $scope.status = 'reading';
    } else if (type === 'read-end') {
      $scope.status = '';
    } else if (type === 'write-begin') {
      $scope.status = 'writing';
    } else if (type === 'write-end') {
      $scope.status = '';
    }
    setTimeout(function() {$scope.$apply();});
  });

  var near = function(a, b) {return Math.abs(a - b) < 5;};
  var nearEdge = function(x, y, position, size) {
    return near(x, position.x) || near(y, position.y) || near(x, position.x + size.width) || near(y, position.y + size.height);
  };

  var WrappedPaper = joint.dia.Paper.extend({
    // paper that wraps all elements and links in a dragThresholder
    createViewForModel: function(cell) {
      var view;
      var type = cell.get('type');
      var module = type.split('.')[0];
      var entity = type.split('.')[1];
      // If there is a special view defined for this model, use that one instead of the default `elementView`/`linkView`.
      if (joint.shapes[module] && joint.shapes[module][entity + 'View']) {
        view = new (dragThresholder(joint.shapes[module][entity + 'View']))({ model: cell, interactive: this.options.interactive });
      } else if (cell instanceof joint.dia.Element) {
        view = new (dragThresholder(this.options.elementView))({ model: cell, interactive: this.options.interactive });
      } else {
        view = new (dragThresholder(this.options.linkView))({ model: cell, interactive: this.options.interactive });
      }
      return view;
    }
  });

  var paper = new WrappedPaper({
    el: $('#paper'),
    width: 600,
    height: 200,
    model: graph,
    gridSize: 1
  });
  paper.resetCells(graph.get('cells'));


  function setHeight() {
    paper.setDimensions($(window).width(), $(window).height());
  }
  setHeight();
  $(window).bind('resize', setHeight);

  $('#paper').bind('mousemove', function(evt) {
    var paperPoint = new V(paper.viewport).toLocalPoint(evt.clientX, evt.clientY);
    var views = paper.findViewsFromPoint(paperPoint);
    if (views.length > 0) {
      var view = views[0];
      if (view instanceof joint.shapes.fomod.ElementView) {
        var isNearEdge = nearEdge(paperPoint.x, paperPoint.y, view.model.attributes.position, view.model.attributes.size);
        view.el.style.cursor = isNearEdge ? 'crosshair' : 'move';
      }
    }
  });

  paper.on('cell:doubleclick', function(cell) {
    if (cell.model.id) {
      window.location.href = '/#/objects/' + cell.model.id;
    }
  });

  $(document).keydown(function(e) {
    e = e || window.event; // IE support
    if (e.which === 90 && (e.ctrlKey || e.metaKey)) {
      if (e.shiftKey) {
        commander.redo();
      } else {
        commander.undo();
      }
    }
  });


});
