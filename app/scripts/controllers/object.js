'use strict';

/**
 * @ngdoc function
 * @name fomodApp.controller:ObjectCtrl
 * @description
 * # ObjectCtrl
 * Controller of the fomodApp
 */
angular.module('fomodApp')
  .controller('ObjectCtrl', function ($scope, $routeParams, data, commander, ChangeNameCommand) {
    var id = $routeParams.id;
    var obj = data.get('objects').get(id);
    if (obj) {
      $scope.name = obj.get('name');
    }
    $scope.save = function() {
      if (obj) {
        console.log('changed $scope.name to', $scope.name);
        commander.do(new ChangeNameCommand(id, $scope.name));
      }
    };
  });
