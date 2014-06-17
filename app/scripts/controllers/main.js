'use strict';

/**
 * @ngdoc function
 * @name fomodApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the fomodApp
 */
angular.module('fomodApp')
  .controller('MainCtrl', function ($scope) {
  	// graph
	var graph = new joint.dia.Graph;

	var ConstraintElementView = joint.dia.ElementView.extend(
		function() {
			var relDragging = undefined;
			var rubberband;
			var center;
			var templateDragging = undefined;
			var near = function(a, b) {return Math.abs(a - b) < 5};
			return {
			    pointerdown: function(evt, x, y) {
			        var position = this.model.get('position');
			        var size = this.model.get('size');
			         center = g.rect(position.x, position.y, size.width, size.height).center();
			        var nearEdge = function(x, y) {return near(x, position.x) || near(y, position.y) || near(x, position.x + size.width) || near(y, position.y + size.height)};
			        if (this.model.get('parent') === palette.id) {
			        	// create new object from template
			        	var newObj = this.model.clone();
			        	graph.addCell(newObj); 
			        	templateDragging = newObj;
			        } else if (nearEdge(x, y) && this.model != palette) {
			        	// create new relation
				        relDragging = this;
				        rubberband = V('<path/>');
						rubberband.attr({ 
						    stroke: 'black', d: 'M ' + center.x + ' ' + center.y + ' ' + center.x + ' ' + center.y
						});
						V(graphPaper.viewport).append(rubberband);
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
			    			graph.addCell(new joint.dia.Link({source: { id: relDragging.model.id }, target: { id: toViews[0].model.id }}));
			    			rubberband.remove();
			    		}
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
		}()
	);

	var graphPaper = new joint.dia.Paper({
	    el: $('#graph'),
	    width: 600,
	    height: 200,
	    model: graph,
	    gridSize: 1,
	    elementView: ConstraintElementView
	});

	var palette = new joint.shapes.basic.Rect({
	    position: { x: 5, y: 5},
	    size: { width: 110, height: 100 },
	    attrs: { rect: { fill: '#eeeeee' }}
	});
	var rectTemplate = new joint.shapes.basic.Rect({
	    position: { x: palette.get('position').x + 5, y: palette.get('position').y + 5},
	    size: { width: 100, height: 30 },
	    attrs: { rect: { fill: 'blue' }, text: { text: 'new box', fill: 'white' } }
	});
	palette.embed(rectTemplate);
	graph.addCells([palette, rectTemplate]);

	// example model
	var rect = new joint.shapes.basic.Rect({
	    position: { x: 150, y: 30 },
	    size: { width: 100, height: 30 },
	    attrs: { rect: { fill: 'blue' }, text: { text: 'my box', fill: 'white' } }
	});
	var rect2 = rect.clone();
	rect2.translate(300);
	var rect3 = rect.clone();
	rect3.translate(300, 50);
	var link = new joint.dia.Link({
	    source: { id: rect.id },
	    target: { id: rect2.id }
	});
	graph.addCells([rect, rect2, rect3, link]);

    function setHeight() {
		graphPaper.setDimensions($(window).width(), $(window).height());
    }
    setHeight();
    $(window).bind("resize", setHeight);

  });
