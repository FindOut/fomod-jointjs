'use strict';

/**
 * @ngdoc service
 * @name fomodApp.CustomElementLink
 * @description
 * # CustomElementLink
 * Service in the fomodApp.
 */
angular.module('fomodApp')
  .service('CustomElements', function (attrMap, commander, CreateRelationCommand, CreateObjectCommand) {
    joint.shapes.fomod = {};

    joint.shapes.fomod.Element = joint.shapes.basic.Rect.extend({
      markup: '<g class="rotatable"><g class="scalable"><rect/></g><text/><circle/></g>',
      defaults: joint.util.deepSupplement({
        type: 'fomod.Element',
        attrs: {
          'rect': { fill: 'white', stroke: 'black', 'follow-scale': true, width: 80, height: 40 },
          'text': { 'font-size': 14, 'ref-x': .5, 'ref-y': .5, ref: 'rect', 'y-alignment': 'middle', 'x-alignment': 'middle' },
          'circle': { 'ref-x': 11, 'ref-y': 11, ref: 'rect', fill: 'red', r: '10'}
        }
      }, joint.shapes.basic.Rect.prototype.defaults)
    });

    joint.shapes.fomod.ElementView = joint.dia.ElementView.extend(
      (function() {
        var relDragging;
        var rubberband;
        var center;
        var near = function(a, b) {return Math.abs(a - b) < 5;};
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
            cir.hide();
            cir.on('click', _.bind(this.model.remove, this.model));
            this.$el.on('mouseenter', function() {cir.show();});
            this.$el.on('mouseleave', function() {cir.hide();});
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
                stroke: 'black', 'stroke-width': 1.5, 'stroke-dasharray': '5,5',
                d: 'M ' + center.x + ' ' + center.y + ' ' + center.x + ' ' + center.y
              });
              new V(this.paper.viewport).append(rubberband);
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
        'rect': { fill: 'white', stroke: 'black', 'follow-scale': true, width: 80, height: 40 },
        'text': { 'font-size': 14, 'ref-x': .5, 'ref-y': .5, ref: 'rect', 'y-alignment': 'middle', 'x-alignment': 'middle' }
      }
    }, joint.shapes.basic.Rect.prototype.defaults)
  });

  joint.shapes.fomod.ElementTemplateView = joint.dia.ElementView.extend(
    (function() {
      var templateDragging, dragRect, offset;
      var size;
      return {
        initialize: function() {
          joint.dia.ElementView.prototype.initialize.apply(this, arguments);
        },
        pointerdown: function(evt, x, y) {
          var position = this.model.get('position');
          size = this.model.get('size');
          if (this.model.isTemplate) {
            // create new object from template
            templateDragging = true;
            var dragRectBox = {x: position.x, y: position.y};
            console.log(dragRectBox);
            dragRect = new V('<rect/>', dragRectBox);
            dragRect.attr({fill: 'none', stroke: 'black', 'stroke-width': 1.5, 'stroke-dasharray': '5,5'});
            offset = {x: x - position.x, y: y - position.y};
            new V(this.paper.viewport).append(dragRect);
          }
          joint.dia.ElementView.prototype.pointerdown.apply(this, [evt, x, y]);
        },
        pointermove: function(evt, x, y) {
          if (templateDragging) {
            dragRect.attr({x: x - offset.x, y: y - offset.y, width: size.width, height: size.height});
          } else {
            joint.dia.ElementView.prototype.pointermove.apply(this, [evt, x, y]);
          }
        },
        pointerup: function(evt, x, y) {
          if (templateDragging) {
            // create object
            var newId = joint.util.uuid();
            attrMap[newId] = {x: x - offset.x, y: y - offset.y};
            commander.do(new CreateObjectCommand(newId, 'new obj'));
            dragRect.remove();
            templateDragging = false;
          } //else {
            joint.dia.ElementView.prototype.pointerup.apply(this, [evt, x, y]);
            //}
          }

        }
      })());

    return {};
  });
