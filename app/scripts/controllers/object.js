'use strict';

/**
 * @ngdoc function
 * @name fomodApp.controller:ObjectCtrl
 * @description
 * # ObjectCtrl
 * Controller of the fomodApp
 */
angular.module('fomodApp')
.controller('ObjectCtrl', function ($scope, $rootScope, $routeParams, data, dataStore, commander, ChangeObjectAttributeCommand) {
  var modelId = $routeParams.modelId;
    var objectId = $routeParams.objectId;
  var objects = data.get('objects');
  var obj = objects.get(objectId);
  var changeHandler = function(d) {
    if (d && d.id === objectId) {
      obj = objects.get(objectId);
      if (obj) {
        var templates = data.get('templates');
        var template = templates.get(obj.get('template'));
        var templAttrs = template.get('attributes');

        $scope.obj = obj;
        $scope.attributes = data.getVisibleAttributeDefs(obj);
        $scope.attrValue = function(attribute) {
          return function(newValue) {
            return angular.isDefined(newValue) ? obj.set(attribute.get('name'), newValue) : obj.get(attribute.get('name'));
          }
        };

        $scope.text = obj.get('text');
        setTimeout(function() {$scope.$apply();});
        var off = $rootScope.$on('$locationChangeStart', function (event, next, current) {
          objects.off(null, changeHandler);
          commander.do(new ChangeObjectAttributeCommand(objectId, {text: $scope.text}));
          off();
        });
      }
    }
  };
  objects.on('change add', changeHandler);
  if (obj) {
    changeHandler(obj);
  }
  dataStore.setCurrentModel(modelId);
});
