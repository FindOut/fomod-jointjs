'use strict';

/**
 * @ngdoc function
 * @name fomodApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the fomodApp
 */
angular.module('fomodApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
