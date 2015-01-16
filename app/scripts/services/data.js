'use strict';

/*global Backbone:false */
/*global _:false */

/**
 * @ngdoc service
 * @name fomodApp.data
 * @description
 * # data
 * Service in the fomodApp.
 */
angular.module('fomodApp')
.service('data', function (FomodModel) {
  return new FomodModel();
})
.service('FomodModel', function(FomodObjectTemplate, FomodObject, FomodRelation) {
  return Backbone.AssociatedModel.extend({
    relations: [
      {
        type: Backbone.Many,
        key: 'objects',
        relatedModel:FomodObject
      },
      {
        type: Backbone.Many,
        key: 'relations',
        relatedModel:FomodRelation
      },
      {
        type: Backbone.Many,
        key: 'templates',
        relatedModel:FomodObjectTemplate
      }
    ],
    defaults: {
      templates: [],
      objects: [],
      relations: []
    }
  });
})
.service('FomodObject', function(FomodObjectTemplate) {
  // id, text
  return Backbone.AssociatedModel.extend();
})
.service('FomodRelation', function() {
  // id
  // from, to - id of an object
  return Backbone.AssociatedModel.extend();
})
.service('FomodObjectTemplate', function(FomodAttribute) {
  // id, name
  return Backbone.AssociatedModel.extend({
    relations: [
      {
        type: Backbone.Many,
        key: 'attributes',
        relatedModel:FomodAttribute
      }
    ],
    defaults: {
      attributes: [
        new FomodAttribute({name: 'description', visible: 'true'}),
        new FomodAttribute({name: 'effort', visible: 'false'}),
        new FomodAttribute({name: 'category', visible: 'true'})
      ]
    }
  });
})
.service('FomodAttribute', function() {
  // id, name, visible
  return Backbone.AssociatedModel.extend();
})
.service('CreateObjectCommand', function(data, FomodObject) {
  return function(id, templateId, name) {
    var newObject = new FomodObject({id: id, template: templateId, text: name});
    this.do = function() {
      data.get('objects').add(newObject);
    };
    this.undo = function() {
      data.get('objects').remove(newObject);
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'CreateObjectCommand(' + id + ', ' + name + ')';
    };
  };
})
.service('DeleteObjectCommand', function(data) {
  return function(id) {
    var obj = data.get('objects').get(id);
    this.do = function() {
      if (obj) {
        data.get('objects').remove(obj);
      }
    };
    this.undo = function() {
      if (obj) {
        data.get('objects').add(obj);
      }
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'DeleteObjectCommand object=' + obj;
    };
  };
})
.service('MoveObjectCommand', function() {
  return function(element, startPosition, endPosition) {
    this.do = function() {
      element.set('position', endPosition);
    };
    this.undo = function() {
      element.set('position', startPosition);
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'MoveObjectCommand(' + element + ', ' + JSON.stringify(startPosition) + ', ' + endPosition + ')';
    };
  };
})
.service('CreateRelationCommand', function(data, FomodRelation) {
  return function(id, from, to) {
    var relation = new FomodRelation({id: id, from: from, to: to});
    this.do = function() {
      data.get('relations').add(relation);
    };
    this.undo = function() {
      if (relation) {
        data.get('relations').remove(relation);
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
    var relation = data.get('relations').get(id);
    this.do = function() {
      if (relation) {
        data.get('relations').remove(relation);
      }
    };
    this.undo = function() {
      if (relation) {
        data.get('relations').add(relation);
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
    var relation = data.get('relations').get(relationId);
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
.service('ChangeObjectAttributeCommand', function(data) {
  return function(id, nameValueMap) {
    var obj, oldNameValueMap;
    this.do = function() {
      obj = data.get('objects').get(id) || data.get('templates').get(id);
      if (obj) {
        oldNameValueMap = _.reduce(nameValueMap, function(result, key) {result[key] = obj.get(key);}, {});
        obj.set(nameValueMap);
      }
    };
    this.undo = function() {
      if (obj) {
        obj.set(oldNameValueMap);
      }
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'ChangeObjectAttributeCommand(' + id + ', ' + JSON.stringify(nameValueMap) + ')';
    };
  };
})
.service('ChangeRelationAttributeCommand', function(data) {
  return function(id, attributeName, newValue) {
    var relation, oldValue;
    this.do = function() {
      relation = data.get('relations').get(id);
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
.service('ChangeLinkVerticesCommand', function() {
  return function(link, startVertices, endVertices) {
    this.do = function() {
      link.set('vertices', endVertices);
    };
    this.undo = function() {
      link.set('vertices', startVertices);
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'ChangeLinkVerticesCommand(' + link + ', ' + startVertices + ', ' + endVertices + ')';
    };
  };
})
.service('commander', function() {
  var undoStack = [], undoI = 0, maxRedoI = 0, inCommand = 0, commandListeners = [];
  var Commander = function() {
    this.do = function(command) {
      if (inCommand === 0) {
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
        fireCommandDone(command, 'do');
      }
    };
    this.undo = function() {
      if (undoI > 0 && inCommand === 0) {
        inCommand++;
        var cmd = undoStack[--undoI];
        cmd.undo();
        inCommand--;
        fireCommandDone(cmd, 'undo');
      }
    };
    this.redo = function() {
      if (undoI < maxRedoI && inCommand === 0) {
        inCommand++;
        var cmd = undoStack[undoI++];
        cmd.redo();
        inCommand--;
        fireCommandDone(cmd, 'redo');
      }
    };
    this.register = function(command) {
      // adds a command to the undo stack without executing it
      // use when the result of a command is already achieved, but it should be undoable
      if (inCommand === 0) {
        inCommand++;
        if (undoI < undoStack.length) {
          undoStack[undoI] = command;
        } else {
          undoStack.push(command);
        }
        undoI++;
        maxRedoI = undoI;
        inCommand--;
        fireCommandDone(command, 'register');
      }
    };
    this.on = function(type, commandListener) {
      commandListeners.push(commandListener);
    };
    this.canUndo = function() {
      return undoI > 0 && inCommand === 0;
    };
    this.canRedo = function() {
      return undoI < maxRedoI && inCommand === 0;
    };
    this.clear = function() {
      undoI = 0;
      maxRedoI = 0;
    };
    return this;
  };
  var fireCommandDone = function(cmd, what) {
    console.log('commander.' + what, cmd.toString());
    _.each(commandListeners, function(commandListener) {commandListener(cmd, what);});
  };
  return new Commander();
});
