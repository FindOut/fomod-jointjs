'use strict';

/*global Backbone:false */


/**
 * @ngdoc service
 * @name fomodApp.data
 * @description
 * # data
 * Service in the fomodApp.
 */
angular.module('fomodApp')
.service('FomodObject', function() {
  return Backbone.Model.extend();
})
.service('FomodRelation', function() {
  return Backbone.Model.extend();
})
.service('FomodObjectCollection', function(FomodObject) {
  return Backbone.Collection.extend({
    model: FomodObject
  });
})
.service('FomodRelationCollection', function(FomodRelation) {
  return Backbone.Collection.extend({
    model: FomodRelation
  });
})
.service('FomodModel', function(FomodObjectCollection, FomodRelationCollection) {
  return Backbone.Model.extend({
    initialize : function() {
      this.objects = new FomodObjectCollection();
      this.relations = new FomodRelationCollection();
    }
  });
})
.service('data', function (FomodModel, FomodObject, FomodRelation) {
  var d = new FomodModel();
  d.objects.add(new FomodObject({id: '123', name: 'Hej'}));
  d.objects.add(new FomodObject({id: '234', name: 'Du'}));
  d.relations.add(new FomodRelation({id: '123234', from: '123', to: '234'}));
  return d;
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
.service('CreateObjectCommand', function(data, FomodObject) {
  return function(id, name) {
    var newObject;
    this.do = function() {
      newObject = new FomodObject({id: id, name: name});
      data.objects.add(newObject);
    };
    this.undo = function() {
      data.objects.remove(newObject);
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'CreateObjectCommand(' + id + ', ' + name + ')';
    };
  };
})
.service('CreateRelationCommand', function(data, FomodRelation) {
  return function(id, name, from, to) {
    var relation = new FomodRelation({id: id, name: name, from: from, to: to});
    this.do = function() {
      data.relations.add(relation);
    };
    this.undo = function() {
      console.log('CreateRelationCommand.undo', relation);
      if (relation) {
        data.relations.remove(relation);
      }
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'CreateRelationCommand relation=' + JSON.stringify(relation);
    };
  };
})
.service('DeleteRelationCommand', function(data) {
  return function(id) {
    var relation;
    this.do = function() {
      relation = data.relations.get(id);
      if (relation) {
        console.log('DeleteRelationCommand.do',relation);
        data.relations.remove(relation);
      }
    };
    this.undo = function() {
      if (relation) {
        console.log('DeleteRelationCommand.undo',relation);
        data.relations.add(relation);
      }
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'DeleteRelationCommand relation=' + relation;
    };
  };
})
.service('commander', function() {
  var undoStack = [];
  var undoI = 0, maxRedoI = 0;

  return (function() {
    this.do = function(command) {
      if (undoI < undoStack.length) {
        undoStack[undoI] = command;
      } else {
        undoStack.push(command);
      }
      undoI++;
      maxRedoI = undoI;
      command.do();
    };
    this.undo = function() {
      console.log('commander.undo undoI=',undoI);
      if (undoI > 0) {
        var cmd = undoStack[--undoI];
        console.log('will undo',cmd.toString());
        cmd.undo();
      }
    };
    this.redo = function() {
      if (undoI < maxRedoI) {
        undoStack[undoI++].redo();
      }
    };
  })();
});
