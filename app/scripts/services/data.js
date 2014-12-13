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
  })
  .service('CreateObjectCommand', function(data) {
    return function(id, name) {
      this.do = function() {
        data.objects.push({id: id, name: name});
      }
      this.undo = function() {
        data.objects.pop();
      }
      this.redo = function() {
        this.do();
      }
    }
  })
  .service('CreateRelationCommand', function(data) {
    return function(id, name, from, to) {
      this.do = function() {
        data.relations.push({id: id, name: name, from: from, to: to});
      }
      this.undo = function() {
        data.relations.pop();
      }
      this.redo = function() {
        this.do();
      }
    }
  })
  .service('commander', function(data) {
    var undoStack = [];
    var undoI = 0, maxRedoI = 0;

    return new (function() {
      this.do = function(command) {
        if (undoI < undoStack.length) {
          undoStack[undoI] = command;
        } else {
          undoStack.push(command);
        }
        undoI++;
        maxRedoI = undoI;
        command.do();
      }
      this.undo = function() {
        if (undoI > 0) {
          undoStack[--undoI].undo();
        }
      }
      this.redo = function() {
        if (undoI < maxRedoI) {
          undoStack[undoI++].redo();
        }
      }
    })();
  });
