'use strict';

/**
 * @ngdoc function
 * @name fomodApp.controller:TemplateCtrl
 * @description
 * # TemplateCtrl
 * Controller of the fomodApp
 */
angular.module('fomodApp')
  .controller('TemplateCtrl', function ($scope, $rootScope, $routeParams, data, commander, ChangeObjectAttributeCommand, FomodAttribute) {
    var id = $routeParams.id;
    var templates = data.get('templates');
    var changeHandler = function(d) {
      var obj = templates.get(id);
      if (obj) {
        $scope.mops = {getterSetter: true};
        $scope.templName = function(name) {return angular.isDefined(name) ? commander.do(new ChangeObjectAttributeCommand(id, {name: name})) : obj.get('name');};
        $scope.name = obj.get('name');
        $scope.attributes = obj.get('attributes').models;
        $scope.changeAttrVisible = function(attribute) { attribute.set('visible', !attribute.get('visible'));};
        $scope.changeAttrName = function(attribute, name) { attribute.set('name', name);};
        $scope.attrName = function(attribute) {
          return function(newName) {
            return angular.isDefined(newName) ? attribute.set('name', newName) : attribute.get('name');
          }
        };
        $scope.addAttribute = function() { obj.get('attributes').add(new FomodAttribute({name: 'new attribute', visible: 'true'}));};
        console.log($scope.attributes);
        setTimeout(function() {$scope.$apply();});
        var off = $rootScope.$on('$locationChangeStart', function (event, next, current) {
          templates.off(null, changeHandler);

          off();
        });
      }
    };
    templates.on('change add', changeHandler);
    if (templates.get(id)) {
      changeHandler();
    }
  });
