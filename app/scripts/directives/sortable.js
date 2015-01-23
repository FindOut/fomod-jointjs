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
     restrict : 'A',
     require: 'ngModel',
     link: function(scope, elm, attrs, ngModel) {
       scope.dragStart = function(e, ui) {
         ui.item.data('start', ui.item.index());
       }

       scope.dragEnd = function(e, ui) {
         var start = ui.item.data('start');
         var end = ui.item.index();
         scope.reorderEnd(start, end, elm, attrs, ngModel);
       }

       var sortableEle = $(elm).sortable({
         start: scope.dragStart,
         update: scope.dragEnd
       });


     }
   }
 });
