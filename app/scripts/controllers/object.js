'use strict';

/**
 * @ngdoc function
 * @name fomodApp.controller:ObjectCtrl
 * @description
 * # ObjectCtrl
 * Controller of the fomodApp
 */
angular.module('fomodApp')
  .controller('ObjectCtrl', function ($scope, $rootScope, $routeParams, data, commander, ChangeObjectAttributeCommand) {
    var id = $routeParams.id;
    var obj = data.get('objects').get(id);
    if (obj) {
      $scope.text = obj.get('text');
    }
    $rootScope.$on('$locationChangeStart', function (event, next, current) {
      if (obj) {
        console.log('changed $scope.text to', $scope.text);
        commander.do(new ChangeObjectAttributeCommand(id, {text: $scope.text}));
      }
    });
  });
