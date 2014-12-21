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
  d.objects.add(new FomodObject({id: '345', name: 'glade'}));
  d.relations.add(new FomodRelation({id: '123234', from: '123', to: '234'}));
  return d;
})
.service('CreateObjectCommand', function(data, FomodObject) {
  return function(id, name) {
    var newObject = new FomodObject({id: id, name: name});
    this.do = function() {
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
    var relation = data.relations.get(id);
    this.do = function() {
      if (relation) {
        data.relations.remove(relation);
      }
    };
    this.undo = function() {
      if (relation) {
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
.service('ChangeRelationToCommand', function(data) {
  return function(relationId, toId) {
    var relation = data.relations.get(relationId);
    var previousToId = relation.get('to');
    this.do = function() {
      relation.set('to', toId);
    };
    this.undo = function() {
      relation.set('to', previousToId);
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'ChangeRelationToCommand(' + relationId + ', ' + toId + ')';
    };
  };
})
.service('ChangeNameCommand', function(data) {
  return function(id, newName) {
    var obj, oldName;
    this.do = function() {
      obj = data.objects.get(id);
      if (obj) {
        oldName = obj.get('name');
        obj.set('name', newName);
      }
    };
    this.undo = function() {
      if (obj) {
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
.service('ChangeRelationAttributeCommand', function(data) {
  return function(id, attributeName, newValue) {
    var relation, oldValue;
    this.do = function() {
      relation = data.relations.get(id);
      if (relation) {
        oldValue = relation.get(attributeName);
        relation.set(attributeName, newValue);
      }
    };
    this.undo = function() {
      if (relation) {
        relation.set(attributeName, oldValue);
      }
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'ChangeRelationAttributeCommand(' + id + ', ' + attributeName + ', ' + newValue + ')';
    };
  };
})
.service('commander', function() {
  var undoStack = [], undoI = 0, maxRedoI = 0, inCommand = 0
  return new (function() {
    this.do = function(command) {
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
      if (undoI > 0 && inCommand == 0) {
        inCommand++;
        var cmd = undoStack[--undoI];
        cmd.undo();
        inCommand--;
      }
    };
    this.redo = function() {
      if (undoI < maxRedoI && inCommand == 0) {
        inCommand++;
        undoStack[undoI++].redo();
        inCommand--;
      }
    };
    this.register = function(command) {
      // adds a command to the undo stack without executing it
      // use when the result of a command is already achieved, but it should be undoable
      if (inCommand == 0) {
        inCommand++;
        if (undoI < undoStack.length) {
          undoStack[undoI] = command;
        } else {
          undoStack.push(command);
        }
        undoI++;
        maxRedoI = undoI;
        inCommand--;
      }

    }
  })();
});
