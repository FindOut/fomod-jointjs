'use strict';

/**
 * @ngdoc service
 * @name fomodApp.data
 * @description
 * # data
 * Service in the fomodApp.
 */
angular.module('fomodApp')
  .service('data', function () {
    this.objects = [
      {name: 'hej', id: '123'},
      {name: 'du', id: '234'}
    ];
    this.relations = [
      {name: 'hejdu', id: '123234', from: '123', to: '234'}
    ];

    this.getObjectById = function(id) {
      for (var i in this.objects) {
        var obj = this.objects[i];
        if (id === obj.id) {
          return obj;
        }
      }
      return undefined;
    };
  });
