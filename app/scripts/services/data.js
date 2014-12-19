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
      console.log('CreateObjectCommand.do', id, name);
      newObject = new FomodObject({id: id, name: name});
      data.objects.add(newObject);
    };
    this.undo = function() {
      console.log('CreateObjectCommand.undo', newObject);
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
      console.log('CreateRelationCommand.do', relation);
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
.service('ChangeNameCommand', function(data) {
  return function(id, newName) {
    var obj, oldName;
    this.do = function() {
      obj = data.objects.get(id);
      if (obj) {
        console.log('ChangeNameCommand.do',id,newName);
        oldName = obj.get('name');
        obj.set('name', newName);
      }
    };
    this.undo = function() {
      if (obj) {
        console.log('ChangeNameCommand.undo',id,oldName);
        obj.set('name', oldName);
      }
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'ChangeNameCommand(' + id + ', ' + newName + ')';
    };
  };
})
.service('commander', function() {
  var undoStack = [], undoI = 0, maxRedoI = 0, inCommand = 0

  return new (function() {
    this.do = function(command) {
      console.log('commander.do(' + command.toString() + ') inCommand=',inCommand);
      if (inCommand == 0) {
        inCommand++;
        if (undoI < undoStack.length) {
          undoStack[undoI] = command;
        } else {
          undoStack.push(command);
        }
        undoI++;
        maxRedoI = undoI;
        command.do();
        inCommand--;
      }
    };
    this.undo = function() {
      console.log('commander.undo undoI=',undoI,'inCommand=',inCommand);
      if (undoI > 0 && inCommand == 0) {
        inCommand++;
        var cmd = undoStack[--undoI];
        console.log('  commander will undo',cmd.toString());
        cmd.undo();
        console.log('  commander undoI=',undoI);
        inCommand--;
      }
    };
    this.redo = function() {
      if (undoI < maxRedoI) {
        undoStack[undoI++].redo();
      }
    };
  })();
});
