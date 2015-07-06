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
  .service('dataStore', function(data, Mapper, graph, FomodObjectTemplate, FomodObject, FomodRelation, commander, attrMap, fbref, autoLayouter) {
    var enableSaving = true;
    var listeners = [];
    var fbModelRef;

    new Mapper(data, graph);

    // set id of model to work on
    function setCurrentModel(id) {
      if (!fbModelRef || id !== fbModelRef.key()) {
        fbModelRef = fbref.child('models/' + id);
        readFbModel();
      }
    }

    // read the model from database
    function readFbModel() {
      if (fbModelRef) {
        fireEvent('read-begin');
        fbModelRef.once('value',
          function(snapshot) {
            var value = snapshot.val();
            enableSaving = false;
            if (value) {
              data.set(value.data);
              for (var key in attrMap) {
                delete attrMap[key];
              }
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
              } else {
                var opt = {
                  setPosition: function(cell, value) {
                    cell.set('position', {
                      x: value.x - value.width / 2 + 130,
                      y: value.y - value.height / 2 + 10
                    });
                  },
                  setLinkVertices: false
                };
                autoLayouter.layout(graph, opt);
              }
            } else {
              //data.set({objects: [], relations: []});
              data.get('relations').reset();
              data.get('objects').reset();
              data.get('templates').reset();
              data.set('name', 'unnamed');
            }
            if (data.get('templates').length == 0) {
              // there were no templates in the database - create one
              console.log('there were no templates in the database - create one');
              data.get('templates').add(new FomodObjectTemplate({
                id: joint.util.uuid(),
                name: 'New object'
              }));
            }
            enableSaving = true;
            fireEvent('read-end');
            commander.clear();
          },
          function function_name(error) {
            console.log('database read error for ' + fbModelRef.toString(), error);
            //data.set({objects: [], relations: []});
            data.get('relations').reset();
            data.get('objects').reset();
            data.get('templates').reset(new FomodObjectTemplate({
              id: joint.util.uuid(),
              name: 'New object'
            }));
            data.set('name', 'unnamed');
            enableSaving = true;
            fireEvent('read-end');
          }
        );
      }
    }

    // write model id, name, access rights to the users tree
    function updateUserInfo() {
      var userRef = fbref.child('users').child(fbref.getAuth().uid).child(fbModelRef.key());
      userRef.set({
        name: data.get('name'),
        access: 'rw'
      }, function(error) {
        if (error) {
          console.log('error writing user info', error);
        }
      });
    }

    // on each command on the model, write it to database
    commander.on('execute', function() {
      if (enableSaving && fbModelRef) {
        fireEvent('write-begin');
        fbModelRef.set({
            owner: fbModelRef.getAuth().uid,
            data: data.toJSON(),
            graph: getStorableGraph(graph)
          },
          function(error) {
            if (error) {
              console.log('database write error', error);
            }
            fireEvent('write-end', error);
          }
        );
        updateUserInfo();
      }
    });

    function getStorableGraph(graph) {
      var userElements = _.filter(graph.getElements(), function(element) {
        return !(element.isPalette || element.isTemplate);
      });
      var validLinks = _.filter(graph.getLinks(), function(link) {
        return link.has('vertices');
      });
      return {
        elements: _.map(userElements, function(element) {
          return {
            id: element.id,
            position: element.get('position')
          };
        }),
        links: _.map(validLinks, function(link) {
          return {
            id: link.id,
            vertices: link.get('vertices')
          };
        })
      };
    }

    function fireEvent(type) {
      _.each(listeners, function(listener) {
        listener(type);
      });
    }

    return {
      on: function(listener) {
        listeners.push(listener);
      },
      setCurrentModel: setCurrentModel
    };
  });
