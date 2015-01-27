'use strict';

/**
 * @ngdoc function
 * @name fomodApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the fomodApp
 */
angular.module('fomodApp')
.controller('LoginCtrl', function ($scope, $rootScope, $timeout, fbref) {

  if (fbref.getAuth()) {
    console.log('logged in auth:', fbref.getAuth());
    $timeout(function() {window.location.href = '#/models'});
  }

  $scope.email = "dag.rende@gmail.com";
  $scope.pw = '';
  $scope.login = function (serviceProvider, data) {
    fbref.authWithOAuthPopup(serviceProvider, function(error, authData) {
      if (error) {
        console.log('Login Failed!', error);
      } else {
        console.log('logged in auth:', authData);
        $timeout(function() {$rootScope.$apply(); window.location.href = '#/models'});
      }
    });

    // if (['google', 'github', 'password'].indexOf(serviceProvider) != -1) {
    //   $scope.auth.$login(serviceProvider, data)
    //   .then(function (user) {
    //     console.log("logged in: ", user);
    //     $timeout(function() {$rootScope.$apply(); window.location.href = "#/list"});
    //   }, function(error) {
    //     console.error("Login failed: " + error);
    //   });
    // }
  };
});
