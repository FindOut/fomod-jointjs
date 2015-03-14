'use strict';

/**
 * @ngdoc directive
 * @name fomodApp.directive:selectOnPageLoad
 * @description
 * # selectOnPageLoad
 */
angular.module('fomodApp')
  .directive('selectOnPageLoad', function($timeout) {
    return {
      link: function(scope, element) {
        $timeout(function() {
          element[0].select();
        });
      }
    };
  });