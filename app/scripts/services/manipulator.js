'use strict';

/**
 * @ngdoc service
 * @name fomodApp.manipulator
 * @description
 * # manipulator
 * Service in the fomodApp.
 */
angular.module('fomodApp')
  .service('Manipulator', function (utils) {
    return function(site) {
      var eventManager = new utils.EventManager();
      var owner;
      var manRect = site.append('rect')
          .attr({
            'class': 'manipulator',
            fill: '#ffff00',
            stroke: '#ffff00',
            opacity: 0.3
          })
          .on('mouseleave', close);
      var svgZeroPoint = utils.getParentSvgElement(site.node()).createSVGPoint();
      function close() {
        if (!owner) {
          manRect.attr('display', 'none');
          eventManager.fire('close', this);
          owner = undefined;
        }
      }
      return {
        // places the manipulator on top of node and adapts its size to it
        // call this on the mouseenter event for the node
        open: function(d, node) {
          if (!owner) {
            var target = d3.select(node);
            var rect = target.select('rect');
            var rectSvgPos = svgZeroPoint.matrixTransform(rect.node().getCTM());
            manRect.attr({
              x: rectSvgPos.x,
              y: rectSvgPos.y,
              width: rect.attr('width'),
              height: rect.attr('height'),
              display: null
            });
            eventManager.fire('open', this, d, node);
          }
        },
        // what is 'open', 'close'
        on: function(eventKey, listener) {
          eventManager.on(eventKey, listener);
          return this;
        },
        getManRect: function() {
          return manRect;
        },
        becomeMaster: function(key) {
          if (!owner) {
            owner = key;
          }
          console.log('becomeMaster(' + key + '): ' + (key === owner));
          return key === owner;
        },
        unbecomeMaster: function(key) {
          if (owner === key) {
            owner = undefined;
          }
        }
      }
    }
  })
  .service('ContextMenu', function (utils) {
    // Manipulator feature for context menu using https://github.com/mar10/jquery-ui-contextmenu
    return function(manipulator) {
      var eventManager = new utils.EventManager();
      var contextMenuListener;

      manipulator.getManRect().on('mousedown.contextMenu', function() {
        manipulator.becomeMaster('ContextMenu');
      });
      $(manipulator.getManRect().node()).contextmenu({
        beforeOpen: function(event, ui) {
          console.log('beforeOpen');
        },
        close: function(event) {
          console.log('close(event)');
        },
        show: { effect: "slideDown", duration: 10},
        select: function(event, ui) {
          eventManager.fire('select', this, ui.cmd);
        }
      });
      manipulator
      .on('open', function(eventKey, d, node) {
        manipulator.getManRect().on('mousedown.contextMenu', function() {
          if (d3.event.button === 2) {
            manipulator.becomeMaster('ContextMenu');
          }
        });

        var menuItems = contextMenuListener && contextMenuListener(d, node) || [];
        $(manipulator.getManRect().node()).contextmenu("replaceMenu", menuItems);
      })
      .on('close', function() {
        manipulator.getManRect().on('mousedown.contextMenu', null);
      });

      return {
        on: eventManager.on,
        // manipulator calls listener(d, node) on open and expects a menu definition array in return
        setContextMenuListener: function(listener) {
          contextMenuListener = listener;
          return this;
        }
      }
    }
  })
  .service('RelationCreator', function (utils) {
    // CreateRelation Manipulator feature
    // moves the manipulated object by mouse dragging
    return function(manipulator) {
      var moveListeners = [], movedListeners = [];
      var state;  // 'down', 'dragging'
      var downPos;
      var svgElement = utils.getParentSvgElement(manipulator.getManRect().node());

      function atEdgeOf(pos, rect) {
        var maxDist = 5;
        function near(a, b) {
          return Math.abs(a - b) <= maxDist
        }
        return near(pos[0], +rect.attr('x')) || near(pos[0], +rect.attr('x') + +rect.attr('width'))
            || near(pos[1], +rect.attr('y')) || near(pos[1], +rect.attr('y') + +rect.attr('height'));
      }

      manipulator.on('open', function() {
        // listen to mousedown, move and up and call moveListener and movedListener
        manipulator.getManRect().on('mousedown.RelationCreator', function() {
          downPos = d3.mouse(svgElement);
          if (atEdgeOf(downPos, manipulator.getManRect())) {
            if (manipulator.becomeMaster('RelationCreator')) {
              state = 'down';
              console.log('mousedown.RelationCreator at', downPos);
            }
          }
        })
        .on('mousemove.RelationCreator', function() {
          if (state) {
            console.log('mousemove.RelationCreator');
          }
          // if (state === 'down' && )
        })
        .on('mouseup.RelationCreator', function() {
          if (state) {
            console.log('mouseup.RelationCreator');
            state = undefined;
          }
        });
      })
      .on('close', function() {
        manipulator.getManRect()
          .on('mousedown.RelationCreator', null)
          .on('mousemove.RelationCreator', null)
          .on('mouseup.RelationCreator', null);
      });

      return {};
    }
  })
  .service('Mover', function (utils) {
    // Mover Manipulator feature
    // moves the manipulated object by mouse dragging
    return function(manipulator) {
      var eventManager = new utils.EventManager();
      var state;  // 'down', 'dragging'
      var manRect = manipulator.getManRect();
      var downPos;
      var manRectPos;
      var parentSvgElement = utils.getParentSvgElement(manipulator.getManRect().node());
      function getPos() {return d3.mouse(parentSvgElement);}

      manipulator.on('open', function(eventKey, d, node) {
        // listen to mousedown, move and up and call moveListener and movedListener
        manRect.on('mousedown.mover', function() {
          if (manipulator.becomeMaster('Mover')) {
            state = 'down';
            downPos = getPos();
            manRectPos = [+manRect.attr('x'), +manRect.attr('y')];
            console.log('mousedown.mover at', downPos, manRectPos, 'id', d.id);
            eventManager.fire('beginmove', this, downPos);
            //d3.event.preventDefault();
          }
        });
        d3.select(parentSvgElement).on('mousemove.mover', function() {
          if (state) {
            var pos = getPos();
            console.log('mousemove.mover at ', pos);
            manRect.attr({
              x: manRectPos[0] + (pos[0] - downPos[0]),
              y: manRectPos[1] + (pos[1] - downPos[1])
            });
            eventManager.fire('move', this, pos);
            d3.event.preventDefault();
          }
        })
        .on('mouseup.mover', function() {
          if (state) {
            console.log('mouseup.mover');
            state = undefined;
            var pos = getPos();
            eventManager.fire('endmove', this, d, [manRectPos[0] + (pos[0] - downPos[0]), manRectPos[1] + (pos[1] - downPos[1])]);
            d3.event.preventDefault();
            manipulator.unbecomeMaster('Mover');
          }
        });
      })
      .on('close', function() {
        if (!state) {
          manipulator.getManRect()
            .on('mousedown.mover', null)
            .on('mousemove.mover', null)
            .on('mouseup.mover', null);
        }
        //state = undefined;
      });

      return {
        on: eventManager.on
      };
    }
  });
