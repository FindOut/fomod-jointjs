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
.controller('MainCtrl', function ($scope, dragThresholder, data, commander, CreateObjectCommand, CreateRelationCommand, DeleteRelationCommand) {
  var near = function(a, b) {return Math.abs(a - b) < 5;};
  // var sqr = function(x) {return x * x;};
  // var dist2 = function(x1, y1, x2, y2) {return sqr(x1 - x2) + sqr(y1 - y2);};
  var nearEdge = function(x, y, position, size) {
    return near(x, position.x) || near(y, position.y) || near(x, position.x + size.width) || near(y, position.y + size.height);};
  var graph = new joint.dia.Graph();
  var attrMap = {};
  var adjusting = false;

  var adjustViewToData = function(data, graph) {
    // compare graph with data and add/remove graph objects accordingly
    adjusting = true;
    // adjust elements
    var graphElementsToRemove = {};
    var dataElementsToAdd =[];
    graph.getElements().forEach(function(element) {graphElementsToRemove[element.id] = element;});

    graphElementsToRemove[palette.id] = undefined;
    palette.getEmbeddedCells().forEach(function(element) {graphElementsToRemove[element.id] = undefined;});

    data.objects.forEach(function(obj) {
      if (graphElementsToRemove[obj.id]) {
        graphElementsToRemove[obj.id] = undefined;
      } else {
        dataElementsToAdd.push(obj);
      }
    });

    // remove unneeded elements
    Object.keys(graphElementsToRemove).forEach(function(key) {
      var element = graphElementsToRemove[key];
      if (element) {
        element.remove();
      }
    });

    // add new elements
    graph.addCells(dataElementsToAdd.map(function(obj) {
      var element = new joint.shapes.basic.Rect({
        id: obj.id,
        position: attrMap[obj.id] || { x: 150, y: 30 },
        size: { width: 100, height: 30 },
        attrs: { rect: { fill: 'blue',
        filter: { name: 'dropShadow', args: { dx: 2, dy: 2, blur: 3 } } },
        text: { text: obj.name, fill: 'white' } }
      });
      return element;
    }));

    // adjust links
    var graphLinksToRemove = {};
    var dataRelationsToAdd =[];
    graph.getLinks().forEach(function(link) {graphLinksToRemove[link.get('source') + '|' + link.get('target')] = link;});

    data.relations.forEach(function(relation) {
      var key = relation.from + '|' + relation.to;
      if (graphLinksToRemove[key]) {
        graphLinksToRemove[key] = undefined;
      } else {
        dataRelationsToAdd.push(relation);
      }
    });

    // remove unneeded links
    Object.keys(graphLinksToRemove).forEach(function(key) {
      var element = graphLinksToRemove[key];
      if (element) {
        element.remove();
      }
    });

    // add new links
    graph.addCells(dataRelationsToAdd.map(function(relation) {
      return new joint.dia.Link({
        id: relation.id,
        source: { id: relation.from },
        target: { id: relation.to },
        attrs: {
          // Define a filter for the whole link (special selector '.' means the root element )
          '.': { filter: { name: 'dropShadow', args: { dx: 1, dy: 1, blur: 1.5 } } },
          '.marker-target': { d: 'M 10 0 L 0 3 L 10 6 z' }
        }
      })
    }));
    adjusting = false;
  };

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
            var toViews = paper.findViewsFromPoint(g.point(x, y));
            if (toViews.length > 0) {
              var cmd = new CreateRelationCommand(undefined, this.model.attr('text/text'), relDragging.model.id, toViews[0].model.id);
              commander.do(cmd);
              adjustViewToData(data, graph);
            }
            rubberband.remove();
            relDragging = false;
          } else if (templateDragging) {
            graph.getCell(this.model.get('parent')).unembed(this.model);
            var cmd = new CreateObjectCommand(this.model.id, this.model.attr('text/text'));
            commander.do(cmd);
            attrMap[this.model.id] = this.model.get('position');
            this.model.remove();
            graph.getCell(templateDragging.get('parent')).embed(templateDragging);
            templateDragging = undefined;
            growWithTextLayout(this.model, paper);

            adjustViewToData(data, graph);

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
    e = e || window.event // IE support
    if ( e.which === 90 && (e.ctrlKey || e.metaKey)) {
      if (e.shiftKey) {
        commander.redo();
      } else {
        commander.undo();
      }
      adjustViewToData(data, graph);
    }
  });
  adjustViewToData(data, graph);

  graph.on('remove', function(cell) {
    if (!adjusting) {
      console.log(arguments);
      commander.do(new DeleteRelationCommand(cell.id));
      adjustViewToData(data, graph);
    }
  });
});
