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
.service('dataStore', function(data, graph, FomodObject, FomodRelation, commander) {
  var listeners = [];
  var firebaseRoot = new Firebase('https://fomod.firebaseio.com');
  var fireEvent = function(type) {
    _.each(listeners, function(listener) {
      listener(type);
    });
  };

  if (false) {
    data.get('objects').add(new FomodObject({id: '123', name: 'Hej'}));
    data.get('objects').add(new FomodObject({id: '234', name: 'Du'}));
    data.get('objects').add(new FomodObject({id: '345', name: 'glade'}));
    data.get('relations').add(new FomodRelation({id: '123234', from: '123', to: '234'}));
  } else {

    fireEvent('read-begin');
    firebaseRoot.once('value', function(snapshot) {
      var value = snapshot.val();
      data.set(value.data);
      _.each(value.graph.elements, function(storeElement) {
        var element = graph.getCell(storeElement.id);
        if (element) {
          element.set('position', storeElement.position);
        }
      });
      _.each(value.graph.links, function(storeLink) {
        var link = graph.getCell(storeLink.id);
        if (link) {
          link.set('vertices', storeLink.vertices);
        }
      });
      fireEvent('read-end');
    });
  }

  var getStorableGraph = function(graph) {
    var userElements = _.filter(graph.getElements(), function(element) {return !element.belongsToPalette;});
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

  commander.on(function() {
    fireEvent('write-begin');
    firebaseRoot.set({data: data.toJSON(), graph: getStorableGraph(graph)}, function(error) {fireEvent('write-end')});
  });

  return {
    on: function(listener) {
      listeners.push(listener);
    }
  };
});
