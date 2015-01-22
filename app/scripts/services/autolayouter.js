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
      _.each(graph.getLinks(), function(cell) {

        if (dagreGraph.hasEdge(cell.id)) return;

        var sourceId = cell.get('source').id;
        var targetId = cell.get('target').id;

        dagreGraph.addEdge(cell.id, sourceId, targetId, { minLen: cell.get('minLen') || 1 });
      });

      return dagreGraph;
    };
    return dg;
  });
