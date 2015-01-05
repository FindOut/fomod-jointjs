'use strict';

/**
 * @ngdoc function
 * @name fomodApp.controller:TemplateCtrl
 * @description
 * # TemplateCtrl
 * Controller of the fomodApp
 */
angular.module('fomodApp')
  .controller('TemplateCtrl', function ($scope, $rootScope, $routeParams, data, commander, ChangeObjectAttributeCommand) {
    var id = $routeParams.id;
    var obj = data.get('templates').get(id);
    console.log(id, obj);
    if (obj) {
      $scope.name = obj.get('name');
    }
    $rootScope.$on('$locationChangeStart', function (event, next, current) {
      if (obj) {
        console.log('changed $scope.text to', $scope.name);
        commander.do(new ChangeObjectAttributeCommand(id, {name: $scope.name}));
      }
    });
  });
