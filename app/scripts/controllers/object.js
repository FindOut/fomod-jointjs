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
  var obj = objects.get(id);
  var changeHandler = function(d) {
    if (d && d.id === id) {
      console.log(JSON.stringify(d));
      obj = objects.get(id);
      if (obj) {
        var templates = data.get('templates');
        var template = templates.get(obj.get('template'));
        var templAttrs = template.get('attributes');

        $scope.obj = obj;
        $scope.attributes = data.getVisibleAttributeDefs(obj);
        console.log('$scope.attributes',$scope.attributes);
        $scope.attrValue = function(attribute) {
          return function(newValue) {
            console.log('getterSetter',newValue);
            return angular.isDefined(newValue) ? obj.set(attribute.get('name'), newValue) : obj.get(attribute.get('name'));
          }
        };

        console.log($scope.attributes);

        $scope.text = obj.get('text');
        setTimeout(function() {$scope.$apply();});
        var off = $rootScope.$on('$locationChangeStart', function (event, next, current) {
          objects.off(null, changeHandler);
          commander.do(new ChangeObjectAttributeCommand(id, {text: $scope.text}));
          off();
        });
      }
    }
  };
  objects.on('change add', changeHandler);
  if (obj) {
    changeHandler(obj);
  }
});
