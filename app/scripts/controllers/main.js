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
.controller('MainCtrl', function ($scope, dragThresholder) {
  var near = function(a, b) {return Math.abs(a - b) < 5;};
  var nearEdge = function(x, y, position, size) {return near(x, position.x) || near(y, position.y) || near(x, position.x + size.width) || near(y, position.y + size.height);};
  var graph = new joint.dia.Graph();

  var ConstraintElementView = joint.dia.ElementView.extend(
    (function() {
      var relDragging;
      var rubberband;
      var center;
      var templateDragging;
      return {
        pointerdown: function(evt, x, y) {
          var position = this.model.get('position');
          var size = this.model.get('size');
          center = g.rect(position.x, position.y, size.width, size.height).center();
          if (this.model.get('parent') === palette.id) {
            // create new object from template
            var newObj = this.model.clone();
            graph.addCell(newObj);
            templateDragging = newObj;
          } else if (nearEdge(x, y, position, size) && this.model !== palette) {
            // create new relation
            relDragging = this;
            rubberband = new V('<path/>');
            rubberband.attr({
              stroke: 'black', d: 'M ' + center.x + ' ' + center.y + ' ' + center.x + ' ' + center.y
            });
            new V(graphPaper.viewport).append(rubberband);
          }
          joint.dia.ElementView.prototype.pointerdown.apply(this, [evt, x, y]);
        },
        pointermove: function(evt, x, y) {
          if (relDragging) {
            rubberband.attr({d: 'M ' + center.x + ' ' + center.y + ' ' + x + ' ' + y});
          } else {
            joint.dia.ElementView.prototype.pointermove.apply(this, [evt, x, y]);
          }
        },
        pointerup: function(evt, x, y) {
          if (relDragging) {
            var toViews = graphPaper.findViewsFromPoint(g.point(x, y));
            console.log('toViews',toViews);
            if (toViews.length > 0) {
              console.log('from ' + relDragging.model.id + ' to ', toViews[0].model.id);
              graph.addCell(new joint.dia.Link({
                source: { id: relDragging.model.id },
                target: { id: toViews[0].model.id },
                attrs: {
                  '.': { filter: { name: 'dropShadow', args: { dx: 1, dy: 1, blur: 1.5 } } }
                }

              }));
            }
            rubberband.remove();
            relDragging = false;
          } else if (templateDragging) {
            graph.getCell(this.model.get('parent')).unembed(this.model);
            graph.getCell(templateDragging.get('parent')).embed(templateDragging);
            templateDragging = undefined;
          } else {
            joint.dia.ElementView.prototype.pointerup.apply(this, [evt, x, y]);
          }
        }
      };
    }())
  );

  var graphPaper = new joint.dia.Paper({
    el: $('#graph'),
    width: 600,
    height: 200,
    model: graph,
    gridSize: 1,
    elementView: dragThresholder(ConstraintElementView),
    linkView: dragThresholder(joint.dia.LinkView)
  });

  var palette = new joint.shapes.basic.Rect({
    position: { x: 5, y: 5},
    size: { width: 110, height: 100 },
    attrs: { rect: { fill: '#888', 'stroke-width': 0,
    filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } }}
  });

  var addToPalette = function(shape) {
    var maxBottom = palette.getEmbeddedCells().reduce(
      function(max, shape) {return Math.max(max, shape.get('position').y + shape.get('size').height);}, 5);
      shape.set('position', {x: palette.get('position').x + 5, y: maxBottom + 5});
      palette.embed(shape);
      graph.addCells([shape]);
      var maxWidth = palette.getEmbeddedCells().reduce(
        function(max, shape) {return Math.max(max, shape.get('size').width);}, 0);
        palette.set('size', {width: maxWidth + 10, height: maxBottom + shape.get('size').height + 10 - palette.get('position').y});
      };
      graph.addCells([palette]);

      addToPalette(new joint.shapes.basic.Rect({
        size: { width: 100, height: 30 },
        attrs: { rect: { fill: 'blue',
        filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
        text: { text: 'new box', fill: 'white' }}
      }));

      addToPalette(new joint.shapes.basic.Rect({
        size: { width: 100, height: 30 },
        attrs: { rect: { fill: 'green',
        filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
        text: { text: 'new box 2', fill: 'white' } }
      }));

      addToPalette(new joint.shapes.basic.Rect({
        size: { width: 100, height: 30 },
        attrs: { rect: { fill: 'yellow',
        filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
        text: { text: 'new box 3', fill: 'black' } }
      }));

      // example model
      var rect = new joint.shapes.basic.Rect({
        position: { x: 150, y: 30 },
        size: { width: 100, height: 30 },
        attrs: { rect: { fill: 'blue',
        filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
        text: { text: 'my box', fill: 'white' } }
      });

      var rect2 = rect.clone();
      rect2.translate(300);

      var rect3 = rect.clone();
      rect3.translate(300, 50);

      var link = new joint.dia.Link({
        source: { id: rect.id },
        target: { id: rect2.id },
        attrs: {
          // Define a filter for the whole link (special selector '.' means the root element )
          '.': { filter: { name: 'dropShadow', args: { dx: 1, dy: 1, blur: 1.5 } } }
        }
      });

      graph.addCells([rect, rect2, rect3, link]);

      function setHeight() {
        graphPaper.setDimensions($(window).width(), $(window).height());
      }
      setHeight();
      $(window).bind('resize', setHeight);
      $(window).bind('mousemove', function(evt) {
        var views = graphPaper.findViewsFromPoint({x:evt.clientX, y:evt.clientY});
        if (views.length > 0) {
          var attrs = views[0].model.attributes;
          var isNearEdge = nearEdge(evt.clientX, evt.clientY, attrs.position, attrs.size);
          views[0].el.style.cursor = isNearEdge ? 'crosshair' : 'move';
        }
      });
    });
