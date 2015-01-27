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
  // name
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
      name: 'unnamed',
      templates: [],
      objects: [],
      relations: []
    },
    // FomodAttribute items for all visible attributes for FomodObject obj
    getVisibleAttributeDefs: function(obj) {
      var templates = this.get('templates');
      var template = templates.get(obj.get('template'));
      if (!template) {
        console.log('missing template for obj', obj);
        return [];
      }
      var templAttrs = template.get('attributes');
      return templAttrs.filter(function(attr) {
        return attr.get('visible');
      });
    },
    getAttributeNameValues: function(obj) {
      return getVisibleAttributeDefs(obj).map(function(attrDef) {
        return {name: attrDef.name, value: obj[attrDef.name]};
      });
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
    },
    addAttribute: function(nameValueMap) {
      this.get('attributes').add(new FomodAttribute(nameValueMap));
      this.trigger('changeAttrDef');
    },
    removeAttribute: function(attributeName) {
      var attr = this.getAttributeByName(attributeName);
      this.get('attributes').remove(attr);
      this.trigger('changeAttrDef');
    },
    getAttributeByName: function(attributeName) {
      return this.get('attributes').find(function(attrDef) {
        return attrDef.get('name') === attributeName;
      });
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
.service('ChangeDataAttributeCommand', function(data) {
  return function(nameValueMap) {
    var oldNameValueMap;
    this.do = function() {
        oldNameValueMap = _.reduce(nameValueMap, function(result, value, key) {result[key] = data.get(key); return result;}, {});
        data.set(nameValueMap);
    };
    this.undo = function() {
      data.set(oldNameValueMap);
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'ChangeDataAttributeCommand(' + JSON.stringify(nameValueMap) + ')';
    };
  };
})
.service('ChangeObjectAttributeCommand', function(data) {
  return function(id, nameValueMap) {
    var obj, oldNameValueMap;
    this.do = function() {
      obj = data.get('objects').get(id) || data.get('templates').get(id);
      if (obj) {
        oldNameValueMap = _.reduce(nameValueMap, function(result, value, key) {result[key] = data.get(key); return result;}, {});
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
.service('AddTemplateAttributeCommand', function(data) {
  return function(templateId) {
    var template = data.get('templates').get(templateId);
    this.do = function() {
      if (template) {
        template.addAttribute({name: 'new attribute', visible: 'true'});
      }
    };
    this.undo = function() {
      if (template) {
        // template.set(oldNameValueMap);
      }
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'AddTemplateAttributeCommand(' + templateId + ')';
    };
  };
})
.service('DeleteTemplateAttributeCommand', function(data) {
  return function(templateId, attributeName) {
    var template = data.get('templates').get(templateId);
    var oldAttribute = template.getAttributeByName(attributeName);
    this.do = function() {
      if (template) {
        template.removeAttribute(attributeName);
        // attribute is deleted - delete it from all objects
        data.get('objects').each(function(obj) {
          if (obj.has(attributeName)) {
            obj.unset(attributeName);
          }
        });
      }
    };
    this.undo = function() {
      if (template) {
        template.addAttribute(oldAttribute.attributes);
      }
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'DeleteTemplateAttributeCommand(' + templateId + ', ' + attributeName + ')';
    };
  };
})
.service('ReorderTemplateAttributeCommand', function(data) {
  return function(templateId, fromIndex, toIndex) {
    var template = data.get('templates').get(templateId);
    function move(from, to) {
      console.log('move(',from,', ',to,')');
      var toAdjusted = from < to ? to - 1 : toIndex;
      var attributes = template.get('attributes');
      var attrToMove = attributes.at(from);
      if (attrToMove) {
        console.log('found attr');
        attributes.remove(attrToMove);
        attributes.add(attrToMove, {at: to});
        template.trigger('changeAttrDef');
      }
    }
    this.do = function() {
      if (template) {
        move(fromIndex, toIndex);
      }
    };
    this.undo = function() {
      if (template) {
        move(toIndex, fromIndex);
      }
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'ReorderTemplateAttributeCommand(' + templateId + ', ' + fromIndex + ', ' + toIndex + ')';
    };
  };
})
.service('ChangeTemplateAttributeCommand', function(data) {
  return function(templateId, attributeName, nameValueMap) {
    var template = data.get('templates').get(templateId);
    var attrDef = template.getAttributeByName(attributeName);
    var oldNameValueMap;
    this.do = function() {
      if (template) {
        oldNameValueMap = _.reduce(nameValueMap, function(result, value, key) {result[key] = data.get(key); return result;}, {});
        console.log('oldNameValueMap',JSON.stringify(oldNameValueMap));
        var oldName = attrDef.get('name');
        if (nameValueMap.name && nameValueMap.name !== oldName) {
          // attribute name is changed - save, delete and restore values for this attribute for all objects having a value for this attribute
          data.get('objects').each(function(obj) {
            if (obj.get(oldName)) {
              obj.set(nameValueMap.name, obj.get(oldName));
              obj.unset(oldName);
            }
          });
        }
        attrDef.set(nameValueMap)
        template.trigger('changeAttrDef');
      }
    };
    this.undo = function() {
      if (template) {
        attrDef.set(oldNameValueMap);
        template.trigger('changeAttrDef');
      }
    };
    this.redo = function() {
      this.do();
    };
    this.toString = function() {
      return 'ChangeTemplateAttributeCommand(' + templateId + ', ' + attributeName + ', ' + JSON.stringify(nameValueMap) + ')';
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
