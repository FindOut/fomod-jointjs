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
.service('paletteManager', function(graph, sizeAroundEmbeddedObjectsLayout) {
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

  // addToPalette(new joint.shapes.fomod.ElementTemplate({
  //   size: { width: 100, height: 30 },
  //   attrs: { rect: { fill: 'blue',
  //   filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
  //   text: { text: 'new box 1', fill: 'white' }}
  // }));
  //
  // addToPalette(new joint.shapes.fomod.ElementTemplate({
  //   size: { width: 100, height: 30 },
  //   attrs: { rect: { fill: 'blue',
  //   filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
  //   text: { text: 'new box 2', fill: 'white' } }
  // }));
  //
  // addToPalette(new joint.shapes.fomod.ElementTemplate({
  //   size: { width: 100, height: 30 },
  //   attrs: { rect: { fill: 'blue',
  //   filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
  //   text: { text: 'new box 3', fill: 'white' } }
  // }));

  return {
    addElementTemplate: function(elementTemplate) {
      addToPalette(elementTemplate);
    }
  }
})
.service('graph', function(data) {
  var graph = new joint.dia.Graph();


  return graph;
})
.controller('MainCtrl', function ($scope, dragThresholder, dataStore, graph, data, commander,
      CreateObjectCommand, CreateRelationCommand, DeleteRelationCommand, mapper, attrMap) {
  mapper(data, graph);
        $scope.commander = commander;
  $scope.status = 'reading';

  commander.on('execute', function() {
    setTimeout(function() {$scope.$apply();});
  });

  console.log('use dataStore');
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
