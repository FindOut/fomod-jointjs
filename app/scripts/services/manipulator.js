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
      var listeners = {}; // listeners map by
      var owner;
      var manRect = site.append('rect')
          .attr({
            'class': 'manipulator',
            fill: '#ffff00',
            opacity: 0.3
          })
          .on('mouseleave', function() {
            manRect.attr('display', 'none');
            fireEvent('close');
            owner = undefined;
          });
      var svgZeroPoint = utils.getParentSvgElement(site.node()).createSVGPoint();

      function fireEvent(what) {
        var openListeners = listeners[what];
        for (var i in openListeners) {
          var listener = openListeners[i];
          listener.apply(this, arguments);
        }
      }

      return {
        // places the manipulator on top of node and adapts its size to it
        // call this on the mouseenter event for the node
        open: function(d, node) {
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
          var what = 'open';
          fireEvent('open', d, node);
        },
        // what is 'open', 'close'
        on: function(what, listener) {
          var openListeners = listeners[what] || [];
          listeners[what] = openListeners;
          openListeners.push(listener);
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
        }
      }
    }
  })
  .service('ContextMenu', function () {
    // Manipulator feature for context menu using https://github.com/mar10/jquery-ui-contextmenu
    return function(manipulator) {
      var contextMenuListener;
      var menuSelectListeners = [];

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
            for (var i in menuSelectListeners) {
              var listener = menuSelectListeners[i];
              listener(ui.cmd);
            }
        }
      });
      manipulator
      .on('open', function(eventKey, d, node) {
        manipulator.getManRect().on('mousedown.contextMenu', function() {
          if (d3.event.button === 2) {
            manipulator.becomeMaster('ContextMenu');
          }
        });

        var menuItems = contextMenuListener && contextMenuListener(d, node);
        if (!menuItems) {
          menuItems = [];
        }
        $(manipulator.getManRect().node()).contextmenu("replaceMenu", menuItems);
      })
      .on('close', function() {
        manipulator.getManRect().on('mousedown.contextMenu', null);
      });

      return {
        addMenuSelectListener: function(listener) {
          menuSelectListeners.push(listener);
          return this;
        },
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
      var moveListeners = [], movedListeners = [];
      var state;  // 'down', 'dragging'
      var downPos;

      manipulator.on('open', function() {
        // listen to mousedown, move and up and call moveListener and movedListener
        manipulator.getManRect().on('mousedown.mover', function() {
          if (manipulator.becomeMaster('Mover')) {
            state = 'down';
            downPos = d3.mouse(utils.getParentSvgElement(manipulator.getManRect().node()));
            console.log('mousedown.mover at', downPos);
          }
        })
        .on('mousemove.mover', function() {
          if (state) {
            console.log('mousemove.mover');
            // manipulator.getManRect().attr({
            //   x: rectPos.x,
            //   y: rectPos.y
            // });
          }
        })
        .on('mouseup.mover', function() {
          if (state) {
            console.log('mouseup.mover');
            state = undefined;
          }
        });
      })
      .on('close', function() {
        manipulator.getManRect()
          .on('mousedown.mover', null)
          .on('mousemove.mover', null)
          .on('mouseup.mover', null);
      });

      return {};
    }
  });
