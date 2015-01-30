'use strict';

/**
 * @ngdoc function
 * @name fomodApp.controller:TemplateCtrl
 * @description
 * # TemplateCtrl
 * Controller of the fomodApp
 */
angular.module('fomodApp')
  .controller('TemplateCtrl', function ($scope, $rootScope, $routeParams, data, dataStore, commander, ChangeObjectAttributeCommand, AddTemplateAttributeCommand, DeleteTemplateAttributeCommand, ChangeTemplateAttributeCommand, ReorderTemplateAttributeCommand, FomodAttribute) {
    var modelId = $routeParams.modelId;
    var templateId = $routeParams.objectId;
    var templates = data.get('templates');
    var tmpName = {};
    var changeHandler = function(d) {
      var template = templates.get(templateId);
      if (template) {
        $scope.nameGetterSetter = function(name) {
          return angular.isDefined(name) ? commander.do(new ChangeObjectAttributeCommand(templateId, {name: name})) : template.get('name');
        };
        $scope.attributes = template.get('attributes').models;
        $scope.changeAttrVisible = function(attribute) { commander.do(new ChangeTemplateAttributeCommand(templateId, attribute.get('name'), {visible: !attribute.get('visible')}));};
        $scope.attrName = function(attribute, i) {
          return function(newName) {
            if (angular.isDefined(newName)) {
              var attr = template.getAttributeByName(newName);
              if (attr && attr != attribute || newName === 'id' || newName === 'template') {
                tmpName[i] = newName;
              } else {
                tmpName[i] = undefined;
                commander.do(new ChangeTemplateAttributeCommand(templateId, attribute.get('name'), {name: newName}));
              }
            }
            return tmpName[i] || attribute.get('name');
          }
        };
        $scope.invalidAttrClass = function(attribute, i) {return tmpName[i] ? "invalid" : "";};
        $scope.invalidAttrMessage = function(attribute, i) {return tmpName[i] ? "name can't be id, template and existing name" : "";};
        $scope.addAttribute = function() {tmpName = {}; commander.do(new AddTemplateAttributeCommand(templateId));};
        $scope.deleteAttribute = function(attribute) {tmpName = {}; commander.do(new DeleteTemplateAttributeCommand(templateId, attribute.get('name')));};
        $scope.reorderEnd = function(fromIndex, toIndex, elm, attrs, ngModel) {
          commander.do(new ReorderTemplateAttributeCommand(templateId, fromIndex, toIndex));
        };
        setTimeout(function() {$scope.$apply();});
        var off = $rootScope.$on('$locationChangeStart', function (event, next, current) {
          templates.off(null, changeHandler);
          tmpName = {};
          off();
        });
      }
    };
    $(document).keydown(function(e) {
      e = e || window.event; // IE support
      if (e.which === 90 && (e.ctrlKey || e.metaKey)) {
        if (e.shiftKey) {
          commander.redo();
        } else {
          commander.undo();
        }
      }
    });
    commander.on('execute', function() {
      setTimeout(function() {$scope.$apply();});
    });
    templates.on('change add', changeHandler);
    if (templates.get(templateId)) {
      changeHandler();
    }
    dataStore.setCurrentModel(modelId);
  });
