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
.controller('MainCtrl', function ($scope, dragThresholder, data, commander, CreateObjectCommand, CreateRelationCommand, DeleteRelationCommand, mapper, attrMap) {
  var near = function(a, b) {return Math.abs(a - b) < 5;};
  var nearEdge = function(x, y, position, size) {
    return near(x, position.x) || near(y, position.y) || near(x, position.x + size.width) || near(y, position.y + size.height);};
  var adjusting = false;
  var graph = new joint.dia.Graph();

  // keeps rect size a little larger than the text in it
  var growWithTextLayout = function(rect, paper) {
    var layout = function() {
      var view = paper.findViewByModel(rect);
      if (view) {
        rect.set('size', {width: 1, height: 1});
        var bbox = view.getBBox();
        rect.set('size', {width: bbox.width + 20, height: bbox.height + 5});
      }
    };
    rect.on('change:attrs', layout);
    layout();
  };

  // makes all embedded cells line up from top to bottom and container resize around them
  var sizeAroundEmbeddedObjectsLayout = function(container) {
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
    };
    container.on('change:embeds', layout);
    layout();
  };

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
            // create relation
            var toViews = paper.findViewsFromPoint(g.point(x, y));
            if (toViews.length > 0) {
              var cmd = new CreateRelationCommand(joint.util.uuid(), this.model.attr('text/text'), relDragging.model.id, toViews[0].model.id);
              commander.do(cmd);
            }
            rubberband.remove();
            relDragging = false;
          } else if (templateDragging) {
            // create object
            graph.getCell(this.model.get('parent')).unembed(this.model);
            var newId = joint.util.uuid();
            attrMap[newId] = this.model.get('position');
            commander.do(new CreateObjectCommand(newId, this.model.attr('text/text')));
            adjusting = true;
            this.model.remove();
            adjusting = false;
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

  sizeAroundEmbeddedObjectsLayout(palette, paper);

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
    attrs: { rect: { fill: 'blue',
    filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
    text: { text: 'new box 2', fill: 'white' } }
  }));

  addToPalette(new joint.shapes.basic.Rect({
    size: { width: 100, height: 30 },
    attrs: { rect: { fill: 'blue',
    filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
    text: { text: 'new box 3', fill: 'white' } }
  }));

  function setHeight() {
    paper.setDimensions($(window).width(), $(window).height());
  }
  setHeight();
  $(window).bind('resize', setHeight);
  $('#graph').bind('mousemove', function(evt) {
    var views = paper.findViewsFromPoint({x:evt.clientX, y:evt.clientY});
    if (views.length > 0) {
      var attrs = views[0].model.attributes;
      var isNearEdge = nearEdge(evt.clientX, evt.clientY, attrs.position, attrs.size);
      views[0].el.style.cursor = isNearEdge ? 'crosshair' : 'move';
    }
  });

  paper.on('cell:doubleclick', function(cell) {
    if (cell.model.id) {
      window.location.href = '/#/objects/' + cell.model.id;
    }
  });

  $(document).keydown(function(e){
    e = e || window.event; // IE support
    if ( e.which === 90 && (e.ctrlKey || e.metaKey)) {
      if (e.shiftKey) {
        commander.redo();
      } else {
        commander.undo();
      }
    }
  });
  mapper(data, graph);

  graph.on('remove', function(cell) {
    if (cell instanceof joint.dia.Link) {
      console.log(arguments);
      commander.do(new DeleteRelationCommand(cell.id));
    }
  });
});
