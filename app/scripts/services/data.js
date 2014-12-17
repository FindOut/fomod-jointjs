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

    this.getRelationById = function(id) {
      for (var i in this.relations) {
        var obj = this.relations[i];
        if (id === obj.id) {
          return obj;
        }
      }
      return undefined;
    };
  })
  .service('arrayRemove', function() {
    return function(arr, item) {
      for(var i = arr.length; i--;) {
        if(arr[i] === item) {
          arr.splice(i, 1);
        }
      }
    };
  })
  .service('CreateRelationCommand', function(data, arrayRemove) {
    return function(id, name, from, to) {
      var relation = {id: id, name: name, from: from, to: to};
      this.do = function() {
        console.log('CreateRelationCommand.do',relation);
        data.relations.push(relation);
      }
      this.undo = function() {
        var relation = data.getRelationById(id);
        if (relation) {
          console.log('will remove'  + JSON.stringify(relation) + ' from ' + JSON.stringify(data.relations))
          arrayRemove(data.relations, relation);
          console.log('data.relations ' + JSON.stringify(data.relations))
        }
      }
      this.redo = function() {
        this.do();
      }
      this.toString = function() {
        return 'CreateRelationCommand relation=' + JSON.stringify(relation);
      }
    }
  })
  .service('DeleteRelationCommand', function(data, arrayRemove) {
    return function(id) {
      var relation;
      this.do = function() {
        relation = data.getRelationById(id);
        if (relation) {
          console.log('DeleteRelationCommand.do',relation);
          arrayRemove(data.relations, relation);
        }
      }
      this.undo = function() {
        if (relation) {
          console.log('DeleteRelationCommand.undo',relation);
          data.relations.push(relation);
        }
      }
      this.redo = function() {
        this.do();
      }
      this.toString = function() {
        return 'DeleteRelationCommand relation=' + relation;
      }
    }
  })
  // .service('MoveObjectCommand', function(graph) {
  //   return function(id, position) {
  //     var element;
  //     this.do = function() {
  //       element = data.getCell(id);
  //       element.set('position', position);
  //     }
  //     this.undo = function() {
  //     }
  //     this.redo = function() {
  //       this.do();
  //     }
  //     this.toString = function() {
  //       return 'MoveObjectCommand';
  //     }
  //   }
  // })
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
      this.toString = function() {
        return 'CreateObjectCommand(' + id + ', ' + name + ')';
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
        console.log('commander.undo undoI=',undoI);
        if (undoI > 0) {
          var cmd = undoStack[--undoI];
          console.log('will undo',cmd.toString());
          cmd.undo();
        }
      }
      this.redo = function() {
        if (undoI < maxRedoI) {
          undoStack[undoI++].redo();
        }
      }
    })();
  });
