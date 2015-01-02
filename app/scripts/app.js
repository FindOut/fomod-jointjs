'use strict';

/**
 * @ngdoc overview
 * @name fomodApp
 * @description
 * # fomodApp
 *
 * Main module of the application.
 */
angular
  .module('fomodApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
    .when('/models', {
      templateUrl: 'views/main.html',
      controller: 'MainCtrl'
    })
    .when('/models/:modelId', {
      templateUrl: 'views/main.html',
      controller: 'MainCtrl'
    })
    .when('/objects/:id', {
        templateUrl: 'views/object.html',
        controller: 'ObjectCtrl'
      })
      .otherwise({
        redirectTo: '/models'
      });
  })
  .run(function(dataStore) {
    return dataStore;
  });
