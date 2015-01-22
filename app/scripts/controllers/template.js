'use strict';

/**
 * @ngdoc function
 * @name fomodApp.controller:TemplateCtrl
 * @description
 * # TemplateCtrl
 * Controller of the fomodApp
 */
angular.module('fomodApp')
  .controller('TemplateCtrl', function ($scope, $rootScope, $routeParams, data, commander, ChangeObjectAttributeCommand, AddTemplateAttributeCommand, DeleteTemplateAttributeCommand, ChangeTemplateAttributeCommand, FomodAttribute) {
    var id = $routeParams.id;
    var templates = data.get('templates');
    var tmpName = {};
    var changeHandler = function(d) {
      var template = templates.get(id);
      if (template) {
        $scope.mops = {getterSetter: true};
        $scope.nameGetterSetter = function(name) {
          return angular.isDefined(name) ? commander.do(new ChangeObjectAttributeCommand(id, {name: name})) : template.get('name');
        };
        $scope.name = template.get('name');
        $scope.attributes = template.get('attributes').models;
        $scope.changeAttrVisible = function(attribute) { commander.do(new ChangeTemplateAttributeCommand(id, attribute.get('name'), {visible: !attribute.get('visible')}));};
        $scope.changeAttrName = function(attribute, name) { attribute.set('name', name);};
        $scope.invalidAttrClass = function(attribute, i) {return tmpName[i] ? "invalid" : "";};
        $scope.invalidAttrMessage = function(attribute, i) {return tmpName[i] ? "name can't be id, template and existing name" : "";};
        $scope.attrName = function(attribute, i) {
          return function(newName) {
            if (angular.isDefined(newName)) {
              var attr = template.getAttributeByName(newName);
              if (attr && attr != attribute || newName === 'id' || newName === 'template') {
                tmpName[i] = newName;
              } else {
                tmpName[i] = undefined;
                commander.do(new ChangeTemplateAttributeCommand(id, attribute.get('name'), {name: newName}));
              }
            }
            return tmpName[i] || attribute.get('name');
          }
        };
        $scope.addAttribute = function() {tmpName = {}; commander.do(new AddTemplateAttributeCommand(id));};
        $scope.deleteAttribute = function(attribute) {tmpName = {}; commander.do(new DeleteTemplateAttributeCommand(id, attribute.get('name')));};
        setTimeout(function() {$scope.$apply();});
        var off = $rootScope.$on('$locationChangeStart', function (event, next, current) {
          templates.off(null, changeHandler);
          tmpName = {};
          off();
        });
      }
    };
    templates.on('change add', changeHandler);
    if (templates.get(id)) {
      changeHandler();
    }
  });
