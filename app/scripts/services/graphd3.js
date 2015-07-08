'use strict';

/**
 * @ngdoc service
 * @name fomodApp.graphd3
 * @description
 * # graphd3
 * Service in the fomodApp.
 */
angular.module('fomodApp')
  .service('graphd3', function () {
    /*
    usage:
      d3.select("#viewerSite")
          .datum(graph)
        .call(graphd3()
          .x(function(listItem) { return +listItem.longitude; })
          .y(function(listItem) { return +listItem.latitude; }));
    */
    return function() {
      var margin = {top: 20, right: 20, bottom: 20, left: 20},
          width = 760,
          height = 120,
          xValue = function(d) { return d[0]; },
          yValue = function(d) { return d[1]; },
          keyValue = function(d) { return d[2]; },
          clickHandler = function(id) {console.log(id);},
          xScale = d3.scale.linear(),
          yScale = d3.scale.linear(),
          selId = undefined;

      function graphView(selection) {
        selection.each(function(data) {
          // Select the svg element, if it exists.
          var svg = d3.select(this).selectAll("svg").data([data]);

          // Otherwise, create the skeletal graphView.
          var gEnter = svg.enter().append("svg").append("g");
          // Update the outer dimensions
          svg
              .attr("width", width)
              .attr("height", height);

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

          // Update the inner offset
          var g = svg.select("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          var node = svg.selectAll('.node')
            .data(function(d) {return d.getElements()}, function(d) {return d.id})

          var nodeEnter = node.enter().append('g')
              .attr('class', 'node')
              .attr("transform", function(d) {
                return 'translate(' + d.get('position').x +', ' + d.get('position').y + ')'; })
              .attr('id', function(d) {return 'node_' + d.id});
          nodeEnter.append('rect');
          nodeEnter.append('text');

          node.select('text')
            .attr('x', '.2em')
            .attr('dy', '1em')
            .text(function(d) {return d.attr('text/text')});
          node.select('rect')
            .attr('width', 50)
            .attr('height', 60)
            .attr('fill', '#eeeeee')
            .attr('stroke', 'black');

          node.exit().remove();

          function lineCrossing(result, x1, y1, x2, y2, x3, y3, x4, y4) {
            var px = ((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-((y1-y2)*(x3-x4)));
            var py = ((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-((y1-y2)*(x3-x4)));
            result.x = px;
            result.y = py;
          }

          function adjustToRectEdge(p, rp, r) {
            var x3, y3, x4, y4;
            var dx = rp.x - p.x;
            var dy = rp.y - p.y;
            var k = dx == 0 ? 1000000 : dy / dx;
            var rk = r.height / r.width;
            x3 = r.x;
            y3 = r.y;
            if (Math.abs(k) < Math.abs(rk)) {
              // line crosses left or right rect edge
              x4 = r.x;
              y4 = r.y + r.height;
              if (dx < 0) {
                // line crosses right edge
                x3 += r.width;
                x4 += r.width;
              }
            } else {
              // line crosses top or bottom rect edge
              x4 = r.x + r.width;
              y4 = r.y;
              if (dy < 0) {
                // line crosses bottom edge
                y3 += r.height;
                y4 += r.height;
              }
            }
            lineCrossing(rp, p.x, p.y, rp.x, rp.y, x3, y3, x4, y4);
          }

          function relations() {
            // prepare and add relations
            var zp = svg.node().createSVGPoint();
            var rels = [];
            _.each(data.getLinks(), function(relation) {
              console.log('relation', relation);
              var fromEl = d3.select(document.getElementById('node_' + relation.get('source').id)).select('rect');
              var toEl = d3.select(document.getElementById('node_' + relation.get('target').id)).select('rect');
              if (fromEl.node() && toEl.node()) {
                var fromRectTopLeft = zp.matrixTransform(fromEl.node().getCTM());
                var toRectTopLeft = zp.matrixTransform(toEl.node().getCTM());

                var fromRect = {x: fromRectTopLeft.x, y: fromRectTopLeft.y, width: parseFloat(fromEl.attr('width')), height: parseFloat(fromEl.attr('height'))};
                var fromPoint = {x: fromRect.x + fromRect.width / 2, y: fromRect.y + fromRect.height / 2};

                var toRect = {x: toRectTopLeft.x, y: toRectTopLeft.y, width: parseFloat(toEl.attr('width')), height: parseFloat(toEl.attr('height'))};
                var toPoint = {x: toRect.x + toRect.width / 2, y: toRect.y + toRect.height / 2};

                adjustToRectEdge(fromPoint, toPoint, toRect);
                adjustToRectEdge(toPoint, fromPoint, fromRect);

                rels.push({from:{x: fromPoint.x, y: fromPoint.y}, to: {x: toPoint.x, y: toPoint.y}, key: relation.get('source').id + '-' + relation.get('target').id});
              }
            });

            var relation = svg.selectAll(".relation")
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

          // size node rect around text
          node.each(function(d, i) {
            var textBBox = d3.select(this).select('text').node().getBBox();
            var width = Math.max(40, textBBox.width);
            var height = Math.max(50, textBBox.height);
            d3.select(this).select('rect')
              .attr('width', width + textBBox.x * 2.0)
              .attr('height', height + textBBox.y * 2.1);
          });

          relations();

          var regexTranslate2Args = /translate\(([0-9.]+)[, ]+([0-9.]+)\)/;
          var regexTranslate1Arg = /translate\(([0-9.]+)\)/;
          function getTranslation(tr) {
            var tr = regexTranslate2Args.exec(tr);
            if (tr) {
              return {x: +tr[1], y: +tr[2]};
            }
            tr = regexTranslate1Arg.exec(transform);
            return tr && {x: +tr[1], y: 0};
          }

          function nodeSelectionSize(sel) {
            var size = {width: 0, height: 0};
            sel.each(function(d, i) {
              var tr = getTranslation(this.getAttribute('transform'));
              var rectSel = d3.select(this).select('rect');
              size.width = Math.max(size.width, +tr.x + +rectSel.attr('width') + 10);
              size.height = Math.max(size.height, +tr.y + +rectSel.attr('height') + 10);
            })
            return size;
          }

          var allNodeSize = nodeSelectionSize(node);
          svg.attr('width', allNodeSize.width).attr('height', allNodeSize.height);

        });
      }

      graphView.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return graphView;
      };

      graphView.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return graphView;
      };

      graphView.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return graphView;
      };

      graphView.key = function(_) {
        if (!arguments.length) return keyValue;
        keyValue = _;
        return graphView;
      };

      graphView.click = function(_) {
        if (!arguments.length) return clickHandler;
        clickHandler = _;
        return graphView;
      };

      graphView.selectedId = function(_) {
        if (!arguments.length) return selId;
        selId = _;
        return graphView;
      };

      return graphView;
    };
  });
