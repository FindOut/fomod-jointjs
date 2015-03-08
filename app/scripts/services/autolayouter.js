'use strict';

/**
 * @ngdoc service
 * @name fomodApp.AutoLayouter
 * @description
 * # AutoLayouter
 * Service in the fomodApp.

<button ng-click="autolayout()">Auto-layout</button>

$scope.autolayout = function() {
 autoLayouter.layout(graph, { setLinkVertices: false });
};

 */
angular.module('fomodApp')
  .service('autoLayouter', function () {
    var dg = joint.layout.DirectedGraph;
    dg._prepareData = function(graph) {

      var dagreGraph = new dagre.Digraph();

      // For each element.
      _.each(graph.getElements(), function(cell) {

        if (dagreGraph.hasNode(cell.id) || cell.isPalette || cell.isTemplate) return;

        dagreGraph.addNode(cell.id, {
          width: cell.get('size').width,
          height: cell.get('size').height,
          rank: cell.get('rank')
        });
      });

      // For each link.
      _.each(graph.getLinks(), function(link) {

        if (dagreGraph.hasEdge(link.id)) return;

        var sourceId = link.get('source').id;
        var targetId = link.get('target').id;

        dagreGraph.addEdge(link.id, sourceId, targetId, { minLen: link.get('minLen') || 1 });
      });

      return dagreGraph;
    };
    function shift(graph, dx, dy) {
      _.each(graph.getElements(), function(cell) {
        if (!(cell.isPalette || cell.isTemplate)) {
          var pos = cell.get('position');
          cell.set('position', {x: pos.x + dx, y: pos.y + dy});
        }
      });
      _.each(graph.getLinks(), function(link) {
      });
    }
    return {
      layout: function(graph, opt) {
        dg.layout(graph, opt);
      }
    };
  });
