'use strict';

/**
* @ngdoc function
* @name fomodApp.controller:ListCtrl
* @description
* # ListCtrl
* Controller of the fomodApp
*/
angular.module('fomodApp')
.controller('ListCtrl', function ($scope, $timeout, fbref, $firebase) {
  $scope.auth = fbref.getAuth();
  var ref = fbref.child('users').child(fbref.getAuth().uid);
  var sync = $firebase(ref);
  $scope.models = sync.$asArray();
  // $scope.models = [];

  $scope.deleteModel = function(model) {
    console.log('delete',model.$id);
    $scope.models.$remove(model);
    var modelRef = fbref.child('models').child(model.$id);
    modelRef.remove(function(err) {
      if (err) {
        console.log('error removing ' + modelRef.toString(), err);
      } else {
        console.log('removed ' + modelRef.toString());
      }
    });
  };
  $scope.addModel = function() {
    var newModelRef = fbref.child('models').push();
    $timeout(function() {window.location.href = '#/models/' + newModelRef.key()});
  };
});
