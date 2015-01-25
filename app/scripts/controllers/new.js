'use strict';

/**
* @ngdoc function
* @name fomodApp.controller:NewCtrl
* @description
* # NewCtrl
* Controller of the fomodApp
*/
angular.module('fomodApp')
.controller('NewCtrl', function ($scope, fbref, $timeout, dataStore) {
  var newModelRef = fbref.child('models').push();
  console.log(newModelRef.toString());
  $timeout(function() {window.location.href = '#/models/' + newModelRef.key()});
});
