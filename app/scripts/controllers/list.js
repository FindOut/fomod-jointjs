'use strict';

/**
* @ngdoc function
* @name fomodApp.controller:ListCtrl
* @description
* # ListCtrl
* Controller of the fomodApp
*/
angular.module('fomodApp')
.controller('ListCtrl', function ($scope, $timeout, $mdSidenav, fbref, $firebase) {
  $scope.toggleLeft = function() {
    $mdSidenav('left').toggle()
    .then(function(){
      console.log('toggle left is done');
    });
  };
  document.title = 'My models - fomod';
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
})
.controller('LeftCtrl', function($scope, $rootScope, $timeout, $mdSidenav, fbref) {
  $scope.close = function() {
    $mdSidenav('left').close()
    .then(function(){
      console.log('close LEFT is done');
    });
  };
  $scope.logout = function() {
    fbref.unauth();
    console.log("logged out");
    $timeout(function() {$rootScope.$apply(); window.location.href = "#/login"});
  };
});
