'use strict';

/**
 * @ngdoc function
 * @name fomodApp.controller:ObjectCtrl
 * @description
 * # ObjectCtrl
 * Controller of the fomodApp
 */
angular.module('fomodApp')
  .controller('ObjectCtrl', function ($scope, $routeParams, data) {
    var id = $routeParams.id;
    var obj = data.getObjectById(id);
    if (obj) {
      $scope.name = obj.name;
    }
    console.log('getObjectById(' + id + ')',obj);
  });
