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

  //layouter

  // keeps rect size a little larger than the text in it
  var growWithTextLayout = function(rect, paper) {
    var layout = function() {
      var view = paper.findViewByModel(rect);
      if (view) {
        rect.set('size', {width: 1, height: 1});
        var bbox = view.getBBox();
        rect.set('size', {width: bbox.width + 20, height: bbox.height + 5});
      }
    }
    rect.on('change:attrs', layout);
    layout();
  }

  // makes all embedded cells line up from top to bottom and container resize around them
  var sizeAroundEmbeddedObjects = function(container, paper) {
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
      palette.set('size', {width: maxWidth + 10, height: y - pos.y});
    }
    container.on('change:embeds', layout);
    layout();
  }

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
            new V(paper.viewport).append(rubberband);
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
            var toViews = paper.findViewsFromPoint(g.point(x, y));
            console.log('toViews',toViews);
            if (toViews.length > 0) {
              console.log('from ' + relDragging.model.id + ' to ', toViews[0].model.id);
              graph.addCell(new joint.dia.Link({
                source: { id: relDragging.model.id },
                target: { id: toViews[0].model.id },
                attrs: {
                  '.': { filter: { name: 'dropShadow', args: { dx: 1, dy: 1, blur: 1.5 } } },
                  '.marker-target': { d: 'M 10 0 L 0 3 L 10 6 z' }
                }

              }));
            }
            rubberband.remove();
            relDragging = false;
          } else if (templateDragging) {
            graph.getCell(this.model.get('parent')).unembed(this.model);
            graph.getCell(templateDragging.get('parent')).embed(templateDragging);
            templateDragging = undefined;
            growWithTextLayout(this.model, paper);

          } else {
            joint.dia.ElementView.prototype.pointerup.apply(this, [evt, x, y]);
          }
        }
      };
    }())
  );

  var paper = new joint.dia.Paper({
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

  sizeAroundEmbeddedObjects(palette, paper);

  var addToPalette = function(shape) {
    graph.addCells([shape]);
    palette.embed(shape);
  };
  graph.addCells([palette]);

  addToPalette(new joint.shapes.basic.Rect({
    size: { width: 100, height: 30 },
    attrs: { rect: { fill: 'blue',
    filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
    text: { text: 'new box 1', fill: 'white' }}
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
  rect2.attr({text: { text: 'my box with long name', fill: 'white' }});

  var rect3 = rect.clone();
  rect3.translate(300, 50);

  var link = new joint.dia.Link({
    source: { id: rect.id },
    target: { id: rect2.id },
    attrs: {
      // Define a filter for the whole link (special selector '.' means the root element )
      '.': { filter: { name: 'dropShadow', args: { dx: 1, dy: 1, blur: 1.5 } } },
      '.marker-target': { d: 'M 10 0 L 0 3 L 10 6 z' }
    }
  });

  graph.addCells([rect, rect2, rect3, link]);

  growWithTextLayout(rect2, paper);

  function setHeight() {
    paper.setDimensions($(window).width(), $(window).height());
  }
  setHeight();
  $(window).bind('resize', setHeight);
  $(window).bind('mousemove', function(evt) {
    var views = paper.findViewsFromPoint({x:evt.clientX, y:evt.clientY});
    if (views.length > 0) {
      var attrs = views[0].model.attributes;
      var isNearEdge = nearEdge(evt.clientX, evt.clientY, attrs.position, attrs.size);
      views[0].el.style.cursor = isNearEdge ? 'crosshair' : 'move';
    }
  });

  var isLong = false;
  paper.on('cell:click', function(cell, evt, x, y) {
    if (isLong) {
      cell.model.attr({text: { text: 'short' }});
    } else {
      cell.model.attr({text: { text: 'long text' }});
    }
    isLong = !isLong;
  });
});
