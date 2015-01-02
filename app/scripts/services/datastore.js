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
.service('dataStore', function(data, graph, FomodObject, FomodRelation, commander, attrMap) {
  var listeners = [];
  var firebaseRoot = new Firebase('https://fomod.firebaseio.com');
  var modelId;
  var firebaseModelRoot;
  var isClearing = false;

  var load = function(id) {
    modelId = id;
    console.log('datastore.load(' + modelId + ')')
    if (!modelId || modelId === 'new') {
      console.log('  new model - clear the old first without saving it');
      isClearing = true;
      modelId = 'new';
      firebaseModelRoot = undefined;
      data.get('relations').reset();
      data.get('objects').reset();
      fireEvent('clear-model');
      isClearing = false;
    } else {
      console.log('  read model ', data);
      firebaseModelRoot = new Firebase('https://fomod.firebaseio.com/' + modelId);
      fireEvent('read-begin');
      firebaseModelRoot.once('value',
        function(snapshot) {
          var value = snapshot.val();
          console.log('fb returned value:', value);
          data.set(value.data);
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
          fireEvent('read-end');
        }, function (err) {
          console.log(err);
        }
      );
    }
  };

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

  commander.on('execute', function() {
    // a command has been executed - save current model to database
    if (!isClearing) {
      var modelData = {data: data.toJSON(), graph: getStorableGraph(graph)};
      fireEvent('write-begin');
      if (!firebaseModelRoot) {
        firebaseModelRoot = firebaseRoot.push(modelData,
          function(error) {
            fireEvent('write-end', error);
            if (!error) {
              console.log('redir to models/' + modelId);
              fireEvent('create-model', modelId);
            }
          }
        );
        modelId = firebaseModelRoot.key();
      } else {
        firebaseModelRoot.set(modelData, function(error) {fireEvent('write-end', error);});
      }
    }
  });

  var fireEvent = function(type, error) {
    _.each(listeners, function(listener) {
      console.log('dataStore.fireEvent ', type, error);
      listener(type, error);
    });
  };

  return {
    on: function(listener) {
      listeners.push(listener);
    },
    load: function(modelId) {
      load(modelId);
    }
  };
});
