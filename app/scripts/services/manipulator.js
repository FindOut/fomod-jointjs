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
      var dispatch = d3.dispatch('open', 'close');
      var owner;
      var manRect = site.append('rect')
          .attr({
            'class': 'manipulator',
            fill: '#ffff00',
            stroke: '#000000',
            'fill-opacity': 0.3
          })
          .on('mouseleave', close);
      var svgZeroPoint = utils.getParentSvgElement(site.node()).createSVGPoint();
      function close() {
        if (!owner) {
          manRect.attr('display', 'none');
          dispatch.close();
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
            dispatch.open(d, node);
          }
        },
        // what is 'open', 'close'
        on: function(eventKey, listener) {
          dispatch.on(eventKey, listener);
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
            console.log('unbecomeMaster(' + key + ')');
            owner = undefined;
          }
        },
        getMaster: function() {
          return owner;
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
        console.log('mousedown.contextMenu 1');
        manipulator.becomeMaster('ContextMenu');
      });
      $(manipulator.getManRect().node()).contextmenu({
        beforeOpen: function(event, ui) {
          console.log('beforeOpen');
        },
        close: function(event) {
          console.log('close(event)');
          manipulator.unbecomeMaster('ContextMenu');
          event.preventDefault();
        },
        select: function(event, ui) {
          eventManager.fire('select', this, ui.cmd);
        }
      });
      manipulator
      .on('open.ContextMenu', function(d, node) {
        console.log('ContextMenu manipulator open');
        manipulator.getManRect().on('mousedown.contextMenu', function() {
          console.log('mousedown.contextMenu 2');
          if (d3.event.button === 2) {
            manipulator.becomeMaster('ContextMenu');
          }
        });

        var menuItems = contextMenuListener && contextMenuListener(d, node) || [];
        $(manipulator.getManRect().node()).contextmenu("replaceMenu", menuItems);
      })
      .on('close.ContextMenu', function() {
        console.log('ContextMenu manipulator close');
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
    // moves the manipulated object when dragged
    // emits events:
    //   begin, move and end
    // options - object with attrs
    //    shiftKey, altKey, ctrlKey, metaKey - requires the specified state for these keys, in order to recognize dragging
    return function(manipulator, options) {
      options = options || {};
      var randint = Math.floor(Math.random() * 100000);
      var dispatch = d3.dispatch('begin', 'move', 'end');
      var state;  // 'down', 'dragging'
      var downPos;
      var manRectPos;
      var manRect = manipulator.getManRect();
      var parentSvgElement = utils.getParentSvgElement(manipulator.getManRect().node());
      function getPos() {return d3.mouse(parentSvgElement);}
      function dist2(p0, p1) {
        var dx = p1[0] - p0[0];
        var dy = p1[1] - p0[1];
        return dx * dx + dy * dy;
      }
      var validKeysMap = {shiftKey: true, altKey: true, ctrlKey: true, metaKey: true};
      function keysMatch(event) {
        var keys = Object.keys(options);
        for (var i in keys) {
          var key = keys[i];
          console.log('keysMatch',key,validKeysMap[key],event[key],options[key]);
          if (validKeysMap[key] && event[key] != options[key]) {
            return false;
          }
        }
        return true;
      }

      manipulator.on('open.mover' + randint, function(d, node) {
        manRect.on('mousedown.mover' + randint, function() {
          console.log('mousedown.mover');
          if (!manipulator.getMaster() && keysMatch(d3.event)) {
            state = 'down';
          }
          downPos = getPos();
          manRectPos = [+manRect.attr('x'), +manRect.attr('y')];
        });
        d3.select(parentSvgElement).on('mousemove.mover' + randint, function() {
          if (state) {
            console.log('mousemove.mover');
            var pos = getPos();
            if (state === 'down' && dist2(downPos, pos) > 9) {
              if (manipulator.becomeMaster('Mover' + randint)) {
                state = 'dragging'
                dispatch.begin(downPos, d, node);
              } else {
                state = undefined;
              }
            }
            if (state === 'dragging') {
              manRect.attr({
                x: manRectPos[0] + (pos[0] - downPos[0]),
                y: manRectPos[1] + (pos[1] - downPos[1])
              });
              var newPos = [manRectPos[0] + (pos[0] - downPos[0]), manRectPos[1] + (pos[1] - downPos[1])];
              dispatch.move(newPos, d, node);
              d3.event.preventDefault();
            }
          }
        })
        .on('mouseup.mover' + randint, function() {
          console.log('mouseup.mover');
          if (state) {
            if (state === 'dragging') {
              var pos = getPos();
              var newPos = [manRectPos[0] + (pos[0] - downPos[0]), manRectPos[1] + (pos[1] - downPos[1])];
              dispatch.end(newPos, d, node);
            }
            state = undefined;
            d3.event.preventDefault();
            manipulator.unbecomeMaster('Mover' + randint);
          }
        });
      })
      .on('close.mover' + randint, function() {
        if (!state) {
          manipulator.getManRect()
            .on('mousedown.mover' + randint, null)
            .on('mousemove.mover' + randint, null)
            .on('mouseup.mover' + randint, null);
        }
      });
      return {
        on: function(type, listener) {
          dispatch.on(type, listener);
          return this;
        }
      };
    }
  });
