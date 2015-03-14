'use strict';

/**
 * @ngdoc service
 * @name fomodApp.CustomElementLink
 * @description
 * # CustomElementLink
 * Service in the fomodApp.
 */
angular.module('fomodApp')
  .service('CustomElements', function(attrMap, commander, CreateRelationCommand, CreateObjectCommand) {
    joint.shapes.fomod = {};

    // keeps view size a little larger than its contents
    var growWithTextLayout = function(view) {
      var layout = function() {
        view.model.set('size', {
          width: 1,
          height: 1
        });
        var bbox = view.getBBox();
        view.model.set('size', {
          width: Math.max(50, bbox.width + 14),
          height: bbox.height + 7
        });
      }
      view.model.on('change:attrs', layout);
      layout();
    }


    joint.shapes.fomod.Element = joint.shapes.basic.Rect.extend({
      markup: '<g class="rotatable"><g class="scalable"><rect/></g><text/><circle/><path/></g>',
      defaults: joint.util.deepSupplement({
        type: 'fomod.Element',
        attrs: {
          'rect': {
            fill: 'white',
            stroke: 'black',
            'follow-scale': true,
            width: 80,
            height: 40
          },
          'text': {
            'font-size': 14,
            'ref-x': .5,
            'ref-y': .53,
            ref: 'rect',
            'y-alignment': 'middle',
            'x-alignment': 'middle'
          },
          'circle': {
            'ref-x': 11,
            'ref-y': 11,
            ref: 'rect',
            fill: 'red',
            r: '10'
          },
          'path': {
            'ref-x': 0,
            'ref-y': 0,
            ref: 'circle',
            'y-alignment': 'middle',
            'x-alignment': 'middle',
            stroke: '#ffffff',
            'stroke-width': 3,
            d: 'M -5 -5 L 5 5 M -5 5 L 5 -5'
          }
        }
      }, joint.shapes.basic.Rect.prototype.defaults)
    });

    joint.shapes.fomod.ElementView = joint.dia.ElementView.extend(
      (function() {
        var relDragging;
        var rubberband;
        var center;
        var near = function(a, b) {
          return Math.abs(a - b) < 5;
        };
        var nearEdge = function(x, y, position, size) {
          return near(x, position.x) || near(y, position.y) || near(x, position.x + size.width) || near(y, position.y + size.height);
        };
        return {
          initialize: function() {
            joint.dia.ElementView.prototype.initialize.apply(this, arguments);
          },
          render: function() {
            joint.dia.ElementView.prototype.render.apply(this, arguments);

            var cir = this.$el.find('circle');
            var path = this.$el.find('path');
            cir.hide();
            path.hide();
            cir.on('click', _.bind(this.model.remove, this.model));
            path.on('click', _.bind(this.model.remove, this.model));
            this.$el.on('mouseenter', function() {
              cir.show();
              path.show();
            });
            this.$el.on('mouseleave', function() {
              cir.hide();
              path.hide();
            });

            var view = this;
            this.$el.on('mousemove', function(evt) {
              var paperPoint = new V(view.paper.viewport).toLocalPoint(evt.clientX, evt.clientY);
              var isNearEdge = nearEdge(paperPoint.x, paperPoint.y, view.model.attributes.position, view.model.attributes.size);
              this.style.cursor = isNearEdge ? 'crosshair' : 'move';
            });

            growWithTextLayout(this);
          },
          pointerdown: function(evt, x, y) {
            var position = this.model.get('position');
            var size = this.model.get('size');
            center = g.rect(position.x, position.y, size.width, size.height).center();
            if (nearEdge(x, y, position, size) && !this.model.isPalette && !this.model.isTemplate) {
              // create new relation
              relDragging = this;
              rubberband = new V('<path/>');
              rubberband.attr({
                stroke: 'black',
                'stroke-width': 1.5,
                'stroke-dasharray': '5,5',
                d: 'M ' + center.x + ' ' + center.y + ' ' + center.x + ' ' + center.y
              });
              new V(this.paper.viewport).append(rubberband);
            }
            joint.dia.ElementView.prototype.pointerdown.apply(this, [evt, x, y]);
          },
          pointermove: function(evt, x, y) {
            if (relDragging) {
              rubberband.attr({
                d: 'M ' + center.x + ' ' + center.y + ' ' + x + ' ' + y
              });
            } else {
              joint.dia.ElementView.prototype.pointermove.apply(this, [evt, x, y]);
            }
          },
          pointerup: function(evt, x, y) {
            if (relDragging) {
              // create relation
              var toViews = this.paper.findViewsFromPoint(g.point(x, y));
              if (toViews.length > 0) {
                var destElement = toViews[0].model;
                if (!destElement.isTemplate && !destElement.isPalette) {
                  var cmd = new CreateRelationCommand(joint.util.uuid(), relDragging.model.id, destElement.id);
                  commander.do(cmd);
                }
              }
              rubberband.remove();
              relDragging = false;
            }
            joint.dia.ElementView.prototype.pointerup.apply(this, [evt, x, y]);
          }
        }
      })());


    joint.shapes.fomod.ElementTemplate = joint.shapes.basic.Rect.extend({
      markup: '<g class="rotatable"><g class="scalable"><rect/></g><text/></g>',
      defaults: joint.util.deepSupplement({
        type: 'fomod.ElementTemplate',
        attrs: {
          'rect': {
            fill: 'white',
            stroke: 'black',
            'follow-scale': true,
            width: 80,
            height: 40
          },
          'text': {
            'font-size': 14,
            'ref-x': .5,
            'ref-y': .5,
            ref: 'rect',
            'y-alignment': 'middle',
            'x-alignment': 'middle'
          }
        }
      }, joint.shapes.basic.Rect.prototype.defaults)
    });

    joint.shapes.fomod.ElementTemplateView = joint.dia.ElementView.extend(
      (function() {
        var templateDragging, dragRect, offset, hasMoved;
        var size;
        return {
          initialize: function() {
            joint.dia.ElementView.prototype.initialize.apply(this, arguments);
          },
          pointerdown: function(evt, x, y) {
            hasMoved = false;
            var position = this.model.get('position');
            size = this.model.get('size');
            if (this.model.isTemplate) {
              // create new object from template
              templateDragging = true;
              var dragRectBox = {
                x: position.x,
                y: position.y
              };
              dragRect = new V('<rect/>', dragRectBox);
              dragRect.attr({
                fill: 'none',
                stroke: 'black',
                'stroke-width': 1.5,
                'stroke-dasharray': '5,5'
              });
              offset = {
                x: x - position.x,
                y: y - position.y
              };
              new V(this.paper.viewport).append(dragRect);
            }
            joint.dia.ElementView.prototype.pointerdown.apply(this, [evt, x, y]);
          },
          pointermove: function(evt, x, y) {
            hasMoved = true;
            if (templateDragging) {
              dragRect.attr({
                x: x - offset.x,
                y: y - offset.y,
                width: size.width,
                height: size.height
              });
            } else {
              joint.dia.ElementView.prototype.pointermove.apply(this, [evt, x, y]);
            }
          },
          pointerup: function(evt, x, y) {
            if (templateDragging && hasMoved) {
              // create object
              var newId = joint.util.uuid();
              attrMap[newId] = {
                x: x - offset.x,
                y: y - offset.y
              };
              commander.do(new CreateObjectCommand(newId, this.model.id, 'new object'));
              dragRect.remove();
              templateDragging = false;
            }
            joint.dia.ElementView.prototype.pointerup.apply(this, [evt, x, y]);
            hasMoved = false;
          }
        }
      })());

    return {};
  });