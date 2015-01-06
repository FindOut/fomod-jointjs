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
    var objects = data.get('objects');
    var changeHandler = function(d) {
      var obj = objects.get(id);
      if (obj) {
        $scope.text = obj.get('text');
        setTimeout(function() {$scope.$apply();});
        var off = $rootScope.$on('$locationChangeStart', function (event, next, current) {
          objects.off(null, changeHandler);
          commander.do(new ChangeObjectAttributeCommand(id, {text: $scope.text}));
          off();
        });
      }
    };
    objects.on('change add', changeHandler);
    if (objects.get(id)) {
      changeHandler();
    }
  });
