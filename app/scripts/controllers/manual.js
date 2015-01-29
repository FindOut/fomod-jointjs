'use strict';

/**
 * @ngdoc function
 * @name fomodApp.controller:ManualCtrl
 * @description
 * # ManualCtrl
 * Controller of the fomodApp
 */
angular.module('fomodApp')
  .controller('ManualCtrl', function ($scope, $http) {
    $http.get('/manual/manual.md')
    .then(function(res){
      $scope.content = res.data;
      console.log('res',res.data);
    });
    $scope.content = '#Hej\ndu glade\n'
  });
