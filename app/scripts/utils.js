function PriorityQueue() {
    var a = [];
    return {
        length: function() {
            return a.length;
        },
        isEmpty: function() {
            return a.length === 0;
        },
        pop: function() {
            if (a.length === 0) {
                return undefined;
            }
            return a.splice(0, 1)[0];
        },
        add: function(v) {
            for (var i = 0; ; i++) {
                if (i >= a.length || v < a[i]) {
                    a.splice(i, 0, v);
                    break;
                }
            }
        }
    };
}

function makeLoopLink(paper, link) {
    var linkWidth = 40;
    var preferredSide = 'top';
    
    var graph = paper.model;
    var paperRect = g.rect({x: 0, y: 0, width: paper.options.width, height: paper.options.height});
    var source = link.get('source');
    var nodeView = paper.findViewByModel(source.id);
    var el = nodeView.el;
    var node = V(el);
    var bbox = node.bbox(false, paper.viewport);
    var p1, p2;
 
    var sides = _.uniq([preferredSide, 'top', 'bottom', 'left', 'right']);
    var sideFound = _.find(sides, function(side) {
        var centre, dx = 0, dy = 0;
     
        switch (side) {
     
          case 'top':
            centre = g.point(bbox.x + bbox.width / 2, bbox.y - linkWidth);
            dx = linkWidth / 2;
            break;
     
          case 'bottom':
            centre = g.point(bbox.x + bbox.width / 2, bbox.y + bbox.height + linkWidth);
            dx = linkWidth / 2;
            break;
     
          case 'left':
            centre = g.point(bbox.x - linkWidth, bbox.y + bbox.height / 2);
            dy = linkWidth / 2;
            break;
     
          case 'right':
            centre = g.point(bbox.x + bbox.width + linkWidth, bbox.y + bbox.height / 2);
            dy = linkWidth / 2;
            break;
        };
     
        p1 = g.point(centre).offset(-dx, -dy);
        p2 = g.point(centre).offset(dx, dy);
     
        return paperRect.containsPoint(p1) && paperRect.containsPoint(p2);
    }, this);
 
    if (sideFound) link.set('vertices', [p1,p2]);
} 

function dragThresholder(viewType) {
    var isDrag = false;
    var isDown = false;
    var downEvt, downX, downY;
    var dist2 = function(x1, y1, x2, y2) {
        var dx = x2 - x1, dy = y2 - y1;
        return dx * dx + dy * dy;
    };
    return viewType.extend({
        pointerdown: function (evt, x, y) {
            isDown = true;
            downEvt = jQuery.extend({}, evt);
            downX = x;
            downY = y;
        },
        pointermove: function (evt, x, y) {
            if (isDrag || !isDown) {
                viewType.prototype.pointermove.apply(this, arguments);
            } else {
                if (isDown && dist2(downX, downY, x, y) > 9) {
                    isDrag = true;
                    viewType.prototype.pointerdown.apply(this, [downEvt, downX, downY]);
                    viewType.prototype.pointermove.apply(this, arguments);
                }
            }
        },
        pointerup: function (evt, x, y) {
            if (isDrag) {
                isDrag = false;
                isDown = false;
                viewType.prototype.pointerup.apply(this, arguments);
            } else {
                isDrag = false;
                isDown = false;
                this.notify('cell:click', evt, x, y);
            }
        }
    });
};

function throttle(fn, threshhold, scope) {
  threshhold || (threshhold = 250);
  var last,
      deferTimer;
  return function () {
    var context = scope || this;
  
    var now = +new Date,
        args = arguments;
    if (last && now < last + threshhold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshhold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}

if (window) {
    window.log = function(){
      if(this.console){
    //    console.log.apply(console, Array.prototype.slice.call(arguments))
      }
    };
}

function remove(arr, item) {
    for (var i = arr.length; i--;) {
        if (arr[i] === item) {
            arr.splice(i, 1);
        }
    }
}

function formatDate(date, format, utc) {
    var MMMM = ["\x00", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var MMM = ["\x01", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dddd = ["\x02", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var ddd = ["\x03", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    function ii(i, len) {
        var s = i + "";
        len = len || 2;
        while (s.length < len) s = "0" + s;
        return s;
    }

    var y = utc ? date.getUTCFullYear() : date.getFullYear();
    format = format.replace(/(^|[^\\])yyyy+/g, "$1" + y);
    format = format.replace(/(^|[^\\])yy/g, "$1" + y.toString().substr(2, 2));
    format = format.replace(/(^|[^\\])y/g, "$1" + y);

    var M = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
    format = format.replace(/(^|[^\\])MMMM+/g, "$1" + MMMM[0]);
    format = format.replace(/(^|[^\\])MMM/g, "$1" + MMM[0]);
    format = format.replace(/(^|[^\\])MM/g, "$1" + ii(M));
    format = format.replace(/(^|[^\\])M/g, "$1" + M);

    var d = utc ? date.getUTCDate() : date.getDate();
    format = format.replace(/(^|[^\\])dddd+/g, "$1" + dddd[0]);
    format = format.replace(/(^|[^\\])ddd/g, "$1" + ddd[0]);
    format = format.replace(/(^|[^\\])dd/g, "$1" + ii(d));
    format = format.replace(/(^|[^\\])d/g, "$1" + d);

    var H = utc ? date.getUTCHours() : date.getHours();
    format = format.replace(/(^|[^\\])HH+/g, "$1" + ii(H));
    format = format.replace(/(^|[^\\])H/g, "$1" + H);

    var h = H > 12 ? H - 12 : H == 0 ? 12 : H;
    format = format.replace(/(^|[^\\])hh+/g, "$1" + ii(h));
    format = format.replace(/(^|[^\\])h/g, "$1" + h);

    var m = utc ? date.getUTCMinutes() : date.getMinutes();
    format = format.replace(/(^|[^\\])mm+/g, "$1" + ii(m));
    format = format.replace(/(^|[^\\])m/g, "$1" + m);

    var s = utc ? date.getUTCSeconds() : date.getSeconds();
    format = format.replace(/(^|[^\\])ss+/g, "$1" + ii(s));
    format = format.replace(/(^|[^\\])s/g, "$1" + s);

    var f = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
    format = format.replace(/(^|[^\\])fff+/g, "$1" + ii(f, 3));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])ff/g, "$1" + ii(f));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])f/g, "$1" + f);

    var T = H < 12 ? "AM" : "PM";
    format = format.replace(/(^|[^\\])TT+/g, "$1" + T);
    format = format.replace(/(^|[^\\])T/g, "$1" + T.charAt(0));

    var t = T.toLowerCase();
    format = format.replace(/(^|[^\\])tt+/g, "$1" + t);
    format = format.replace(/(^|[^\\])t/g, "$1" + t.charAt(0));

    var tz = -date.getTimezoneOffset();
    var K = utc || !tz ? "Z" : tz > 0 ? "+" : "-";
    if (!utc) {
        tz = Math.abs(tz);
        var tzHrs = Math.floor(tz / 60);
        var tzMin = tz % 60;
        K += ii(tzHrs) + ":" + ii(tzMin);
    }
    format = format.replace(/(^|[^\\])K/g, "$1" + K);

    var day = (utc ? date.getUTCDay() : date.getDay()) + 1;
    format = format.replace(new RegExp(dddd[0], "g"), dddd[day]);
    format = format.replace(new RegExp(ddd[0], "g"), ddd[day]);

    format = format.replace(new RegExp(MMMM[0], "g"), MMMM[M]);
    format = format.replace(new RegExp(MMM[0], "g"), MMM[M]);

    format = format.replace(/\\(.)/g, "$1");

    return format;
};