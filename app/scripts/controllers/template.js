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
    var templates = data.get('templates');
    var changeHandler = function(d) {
      var obj = templates.get(id);
      if (obj) {
        $scope.name = obj.get('name');
        $scope.attributes = obj.get('attributes').models;
        setTimeout(function() {$scope.$apply();});
        var off = $rootScope.$on('$locationChangeStart', function (event, next, current) {
          templates.off(null, changeHandler);
          commander.do(new ChangeObjectAttributeCommand(id, {name: $scope.name}));
          off();
        });
      }
    };
    templates.on('change add', changeHandler);
    if (templates.get(id)) {
      changeHandler();
    }
  });
