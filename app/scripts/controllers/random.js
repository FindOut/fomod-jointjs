'use strict';

/**
 * @ngdoc function
 * @name fomodApp.controller:RandomCtrl
 * @description
 * # RandomCtrl
 * Controller of the fomodApp
 */
angular.module('fomodApp')
  .controller('RandomCtrl', function ($scope, $timeout, fbref, attrMap) {
    var parameters = {
      name: '',
      objectCount: 10,
      relationCount: 10,
      allowMultipleRelsBetweenObjectPair: false,
      allowRelationToSelf: false
    };
    $scope.parameters = parameters;

    // add templates objects and relations to model
    function addRandomContent(model) {
      model.data.templates = [
        {id: 'randomtemplate',
        name: 'New object',
        attributes: [
          {name: 'text', visible: true}
        ]}
      ]
      var objects = [];
      for (var i = 0; i < parameters.objectCount; i++) {
        objects.push({id: 'object' + i, template: 'randomtemplate', text: 'object' + i});
        attrMap['object' + i] = undefined;
      }
      model.data.objects = objects;

      var relations = [];
      var relMap = {};
      for (var i = 0; i < parameters.objectCount * parameters.objectCount && relations.length < parameters.relationCount; i++) {
        var fromi = _.random(parameters.objectCount - 1), toi = _.random(parameters.objectCount - 1);
        var relKey = fromi + '_' + toi, relKeyRev = toi + '_' + fromi;
        console.log('relKey=' + relKey);
        if ((parameters.allowMultipleRelsBetweenObjectPair || !(relMap[relKey] || relMap[relKeyRev]))
            && (parameters.allowRelationToSelf || fromi != toi)) {
          var rel = {id: 'relation' + relations.length, from: objects[fromi].id, to: objects[toi].id};
          relMap[relKey] = rel;
          relations.push(rel);
        }
      }
      model.data.relations = relations;
    }

    function layout(model) {
      var opt = {setLinkVertices: false};

      var dagreGraph = new dagre.Digraph();

      // For each element.
      _.each(model.data.objects, function(object) {
        if (!dagreGraph.hasNode(object.id)) {
          console.log('addnode id',object.id);
          dagreGraph.addNode(object.id, {
            width: 60,
            height: 25
          });
        }
      });

      // For each link.
      _.each(model.data.relations, function(link) {
        if (!dagreGraph.hasEdge(link.id)) {
          console.log('addEdge id ',link.id);
          dagreGraph.addEdge(link.id, link.from, link.to, { minLen: 1 });
        }
      });

      var runner = dagre.layout();
      console.log('runner ',runner);
      var layoutGraph = runner.run(dagreGraph);

      console.log('layouted');

      model.graph.elements = [];
      layoutGraph.eachNode(function(u, value) {
          if (!value.dummy) {
              model.graph.elements.push({id: u, position: {
                 x: value.x - value.width/2 + 130,
                 y: value.y - value.height/2 + 10
              }});
          }
      });

      // if (opt.setLinkVertices) {
      //     layoutGraph.eachEdge(function(e, u, v, value) {
      //         var link = graph.getCell(e);
      //         if (link) {
      //             opt.setVertices
      //               ? opt.setVertices(link, value.points)
      //               : link.set('vertices', value.points);
      //         }
      //     });
      // }

      var size = {width: layoutGraph.graph().width, height: layoutGraph.graph().height };

    }

    $scope.create = function() {
      // create model and add it to the models
      var fbModelRef = fbref.child('models').push();

      var model = {data: {name: parameters.name}, graph: {}, owner: fbModelRef.getAuth().uid};
      addRandomContent(model);
      layout(model);
      fbModelRef.set(
        model,
        function(error) {
          if (error) {
            console.log('database write error',error);
          }
        }
      );
      var userRef = fbref.child('users').child(fbref.getAuth().uid).child(fbModelRef.key());
      userRef.set({name: parameters.name, access: 'rw'}, function(error) {
        if (error) {
          console.log('error writing user info', error);
        }
      });
      $timeout(function() {window.location.href = '#/models/' + fbModelRef.key()});
    }
  });
