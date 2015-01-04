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
    'ngTouch',
    'dr.sortable'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/models', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/objects/:id', {
        templateUrl: 'views/object.html',
        controller: 'ObjectCtrl'
      })
      .when('/templates/:id', {
        templateUrl: 'views/template.html',
        controller: 'TemplateCtrl'
      })
      .when('/templates', {
        templateUrl: 'views/template.html',
        controller: 'TemplateCtrl'
      })
      .otherwise({
        redirectTo: '/models'
      });
  })
  .run(function(dataStore) {
    return dataStore;
  });
