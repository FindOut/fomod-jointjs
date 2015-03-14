'use strict';

/**
 * @ngdoc directive
 * @name dr.sortable.directive:sortable
 * @description
 * # sortable
 */
angular.module('dr.sortable', [])
  .directive('sortable', function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, elm, attrs, ngModel) {
        function elPath(el) {
          return (el.parentElement ? elPath(el.parentElement) : '') +
            '/' + el.tagName +
            (el.parentElement && $(el.parentElement).children(el.tagName).size() > 1 ? '[' + $(el).index() + ']' : '');
        }

        scope.dragStart = function(e, ui) {
          ui.item.data('start', ui.item.index());
        }

        // returns index of first md-item element in the parent direction
        function getItemIndexAtPoint(x, y) {
          for (var el = document.elementFromPoint(x, y); el; el = el.parentElement) {
            console.log('el:', el.tagName);
            if (el.tagName === 'MD-ITEM') {
              return $(el).index();
            }
          }
          return undefined;
        }

        scope.dragEnd = function(e, ui) {
          console.log('endIndex:', getItemIndexAtPoint(e.clientX, e.clientY));
          var start = ui.item.data('start');
          var end = getItemIndexAtPoint(e.clientX, e.clientY);
          scope.reorderEnd(start, end, elm, attrs, ngModel);
        }
        var sortableEle = $(elm).sortable({
          start: scope.dragStart,
          update: scope.dragEnd,
          stop: scope.dragEnd
        });
      }
    }
  });