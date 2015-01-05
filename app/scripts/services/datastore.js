'use strict';

/*global Firebase:false */
/*global _:false */

/**
 * @ngdoc service
 * @name fomodApp.dataStore
 * @description
 * # dataStore
 * Service in the fomodApp.
 */
angular.module('fomodApp')
.service('dataStore', function(data, mapper, graph, FomodObjectTemplate, FomodObject, FomodRelation, commander, attrMap) {
  console.log('create dataStore');
  var enableSaving = true;
  var listeners = [];
  var firebaseRoot = new Firebase('https://fomod.firebaseio.com');
  var fireEvent = function(type) {
    _.each(listeners, function(listener) {
      listener(type);
    });
  };

  mapper(data, graph);

  fireEvent('read-begin');
  firebaseRoot.once('value', function(snapshot) {
    var value = snapshot.val();
    enableSaving = false;
    if (value) {
      data.set(value.data);
      if (value.graph) {
        _.each(value.graph.elements, function(storeElement) {
          var element = graph.getCell(storeElement.id);
          if (element) {
            element.set('position', storeElement.position);
            attrMap[storeElement.id] = storeElement.position;
          }
        });
        _.each(value.graph.links, function(storeLink) {
          var link = graph.getCell(storeLink.id);
          if (link) {
            link.set('vertices', storeLink.vertices);
          }
        });
      }
    }
    if (data.get('templates').length === 0) {
      var defaultTemplate = new FomodObjectTemplate({id: joint.util.uuid(), name: 'New object'});
      data.get('templates').add(defaultTemplate);
    }
    enableSaving = true;
    fireEvent('read-end');
  });

  var getStorableGraph = function(graph) {
    var userElements = _.filter(graph.getElements(), function(element) {return !(element.isPalette || element.isTemplate);});
    var validLinks = _.filter(graph.getLinks(), function(link) {return link.has('vertices');});
    return {
      elements: _.map(userElements, function(element) {
        return {id: element.id, position: element.get('position')};
      }),
      links: _.map(validLinks, function(link) {
        return {id: link.id, vertices: link.get('vertices')};
      })
    };
  };

  commander.on('execute', function() {
    if (enableSaving) {
      fireEvent('write-begin');
      firebaseRoot.set({data: data.toJSON(), graph: getStorableGraph(graph)}, function(error) {fireEvent('write-end', error);});
    }
  });

  return {
    on: function(listener) {
      listeners.push(listener);
    }
  };
});
