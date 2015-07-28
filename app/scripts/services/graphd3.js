'use strict';

/**
 * @ngdoc service
 * @name fomodApp.graphd3
 * @description
 * # graphd3
 * Service in the fomodApp.
    usage:
    angular.module('myApp')
      .controller('MyCtrl', function(... graphd3 ...) {
      ...
      d3.select("#viewerSite")
          .datum(myGraph)
        .call(graphd3();
 */
angular.module('fomodApp')
  .service('graphd3', function (utils, Manipulator, ContextMenu, RelationCreator, Mover, commander, MoveObjectCommand, CreateObjectCommand, attrMap) {
    return function() {
      var t0 = performance.now(), tRel0, tRel1;

      function graphView(selection) {
        selection.each(function(graph) {
          // Select the svg element, if it exists.
          var svg = d3.select(this).selectAll("svg").data([graph]);

          // Otherwise, create the skeletal graphView.
          var svgEnter = svg.enter().append("svg");
          svgEnter.append('g')
              .attr('class', 'nodes');
          svgEnter.append('g')
              .attr('class', 'relations');
          svgEnter.append('g')
              .attr('class', 'manipulation');

          var svgZeroPoint = svg.node().createSVGPoint();

          var manipulator = new Manipulator(svg.select('.manipulation'));

          // manipulator
          //   .on('open', function(what) {console.log(what);})
          //   .on('close', function(what) {console.log(what);});

          var contextMenuFeature = new ContextMenu(manipulator)
            .setContextMenuListener(function(d, el) {
              return [
                {title: "Copy", cmd: "copy", uiIcon: "ui-icon-copy"},
                {title: "----"},
                {title: "More", children: [
                  {title: "Sub 1", cmd: "sub1"},
                  {title: "Sub 2", cmd: "sub2"}
                ]}
              ];
            })
            .on('select', function(eventKey, cmd) {
              console.log('selected ' + cmd);
            });

          new Mover(manipulator, {shiftKey: true})
            .on('end', function(newPos, d) {
              console.log('dup!',d);
              var newId = joint.util.uuid();
              attrMap[newId] = {x: newPos[0], y: newPos[1]};
              commander.do(new CreateObjectCommand(newId, 'randomtemplate', 'New object'));
            });

          // new RelationCreator(manipulator);

          new Mover(manipulator)
            .on('end', function(newPos, d) {
              commander.do(new MoveObjectCommand(d, {x: newPos[0], y: newPos[1]}));
            });

          var defs = svg.append('defs');
          var markerData = [
            {name: 'markerArrowEnd', refX: 10, pathd: 'M0,-5 L10,0 L0,5', color: 'black'},
            {name: 'markerRedArrowEnd', refX: 10, pathd: 'M0,-5 L10,0 L0,5', color: 'red'},
            {name: 'markerRedArrowStart', refX: 0, pathd: 'M10,-5 L0,0 L10,5', color: 'red'}
          ];
          defs.selectAll('marker')
            .data(markerData).enter().append('marker')
            .attr("id", function(d) {return d.name})
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", function(d) {return d.refX})
            .attr("refY", 0)
            .attr("markerWidth", 8)
            .attr("markerHeight", 8)
            .attr("orient", "auto")
            .append("path")
              .attr("d", function(d) {return d.pathd})
              .attr('fill', function(d) {return d.color});

          // d here is the item associated with the svg element
          var node = svg.select('.nodes').selectAll('.node')
            .data(function(d) {return d.getElements()}, function(d) {return d.id})

          var nodeEnter = node.enter().append('g')
              .attr('class', 'node')
              .attr('id', function(d) {return 'node_' + d.id});
          nodeEnter.append('rect');
          nodeEnter.append('text');

          node
              .attr("transform", function(d) {
                  return 'translate(' + d.get('position').x +', ' + d.get('position').y + ')'; })

          node.select('text')
              .attr('x', '.2em')
              .attr('dy', '1em')
              .text(function(d) {return d.attr('text/text')});
          node.select('rect')
              .attr('width', 50)
              .attr('height', 60)
              .attr('fill', '#eeeeee')
              .attr('stroke', 'black')
              .on('mouseenter', function(d) {manipulator.open(d, this.parentElement);});

          node.exit().remove();

          // size node rect around text
          node.each(function(d, i) {
            var textBBox = d3.select(this).select('text').node().getBBox();
            var width = Math.max(40, textBBox.width);
            var height = Math.max(50, textBBox.height);
            d3.select(this).select('rect')
              .attr('width', width + textBBox.x * 2.0)
              .attr('height', height + textBBox.y * 2.1);
          });

          tRel0 = performance.now();

          function relations() {
            // prepare and add relations
            var rels = [];
            _.each(graph.getLinks(), function(relation) {
              var fromNodeId = 'node_' + relation.get('source').id;
              var toNodeId = 'node_' + relation.get('target').id;
              var fromNode = document.getElementById(fromNodeId);
              var toNode = document.getElementById(toNodeId);
              var fromEl = d3.select(fromNode).select('rect');
              var toEl = d3.select(toNode).select('rect');
              if (fromEl.node() && toEl.node()) {
                var fromRectTopLeft = svgZeroPoint.matrixTransform(fromEl.node().getCTM());
                var toRectTopLeft = svgZeroPoint.matrixTransform(toEl.node().getCTM());

                var fromRect = {x: fromRectTopLeft.x, y: fromRectTopLeft.y, width: parseFloat(fromEl.attr('width')), height: parseFloat(fromEl.attr('height'))};
                var fromPoint = {x: fromRect.x + fromRect.width / 2, y: fromRect.y + fromRect.height / 2};

                var toRect = {x: toRectTopLeft.x, y: toRectTopLeft.y, width: parseFloat(toEl.attr('width')), height: parseFloat(toEl.attr('height'))};
                var toPoint = {x: toRect.x + toRect.width / 2, y: toRect.y + toRect.height / 2};

                utils.adjustToRectEdge(fromPoint, toPoint, toRect);
                utils.adjustToRectEdge(toPoint, fromPoint, fromRect);

                rels.push({from:{x: fromPoint.x, y: fromPoint.y}, to: {x: toPoint.x, y: toPoint.y}, key: relation.get('source').id + '-' + relation.get('target').id});
              }
            });

            var relation = svg.select('.relations').selectAll(".relation")
                .data(rels, function(rel) {return rel.key});
            var relationEnter = relation.enter().append("line");
            relation
                .attr("class", function(d) {return 'relation'})
                .attr('x1', function(d) {return d.from.x})
                .attr('y1', function(d) {return d.from.y})
                .attr('x2', function(d) {return d.to.x})
                .attr('y2', function(d) {return d.to.y})
                .attr('marker-end', 'url(#markerArrowEnd)')
                .attr('stroke', 'black');
            relation.exit().remove();
          }

          relations();

          tRel1 = performance.now();

          function nodeSelectionSize(sel) {
            var size = {width: 0, height: 0};
            sel.each(function(d, i) {
              var tr = utils.getTranslation(this.getAttribute('transform'));
              var rectSel = d3.select(this).select('rect');
              size.width = Math.max(size.width, +tr.x + +rectSel.attr('width') + 10);
              size.height = Math.max(size.height, +tr.y + +rectSel.attr('height') + 10);
            })
            return size;
          }

          var allNodeSize = nodeSelectionSize(node);
          svg.attr('width', Math.max(allNodeSize.width, $('#paper').innerWidth())).attr('height', Math.max(allNodeSize.height, $('#paper').innerHeight()));


        });

        var t2 = performance.now();
        console.log('rendering time: ' + (t2 - t0) + 'ms (nodes ' + (t2 - t0 - (tRel1 - tRel0)) + 'ms, relations ' + (tRel1 - tRel0) + 'ms)')
      }

      return graphView;
    };
  });
