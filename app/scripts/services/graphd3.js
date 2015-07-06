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

          // Update the inner offset
          var g = svg.select("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          var node = svg.selectAll('.node')
            .data(function(d) {return d.getElements()}, function(d) {return d.id})

          var nodeEnter = node.enter().append('g')
              .attr('class', 'node')
              .attr("transform", function(d) {
                return 'translate(' + d.get('position').x +', ' + d.get('position').y + ')'; });
          nodeEnter.append('rect');
          nodeEnter.append('text');

          node.select('rect')
            .attr('width', 50)
            .attr('height', 60)
            .attr('fill', 'yellow');
          node.select('text')
            .attr('x', '.2em')
            .attr('dy', '1em')
            .text(function(d) {return d.attr('text/text')});

          node.exit().remove();

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
