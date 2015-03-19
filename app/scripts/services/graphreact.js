/** @jsx React.DOM */

var Graph = React.createClass({displayName: "Graph",
    render: function () {
        return React.createElement("svg", React.__spread({},  this.props));
    }
});

var Obj = React.createClass({displayName: "Obj",
  dragging: false,
  getInitialState: function() {
    return {element: this.props.element, graph: this.props.graph};
  },
  dbl: function(ev) {
    console.log('dbl');
    this.state.graph.trigger('cell:doubleclick', {model: this.state.graph.getCell(this.state.element.id)});
  },
  render: function() {
    var el = this.state.element;
    return React.createElement("g", null, 
      React.createElement("rect", {ref: "rect", x: el.get('position').x, y: el.get('position').y, width: "60", height: "40", fill: "#bbb", stroke: "#000", onDoubleClick: this.dbl}), 
      React.createElement("text", {ref: "text", x: el.get('position').x + 3, y: el.get('position').y + 15}, el.attr('text/text'))
    );
  }
});

var Relation = React.createClass({displayName: "Relation",
  getInitialState: function() {
      return {from: this.props.from, to: this.props.to};
  },
  render: function() {
    var mid = function(obj) {
      var pos = obj.get('position');
      return {x: pos.x + 30, y: pos.y + 20};
    }
    var f = mid(this.props.from);
    var t = mid(this.props.to);
    return React.createElement("line", {x1: f.x, y1: f.y, x2: t.x, y2: t.y, strokeWidth: "2", stroke: "orange"});
  }
});

var GraphObjects = React.createClass({displayName: "GraphObjects",
  getInitialState: function() {
    return {graph: this.props.graph};
  },
  listener: function() {
    this.forceUpdate();
  },
  logger: function() {
    console.log(arguments);
  },
  componentDidMount: function() {
    console.log('componentDidMount');
    this.state.graph.on('all', this.logger, this);
    this.state.graph.on('change reopen', this.listener, this);
  },
  componentWillUnmount: function() {
    console.log('componentWillUnmount');
    this.state.graph.off(null, null, this);
  },
  render: function() {
    var graph = this.state.graph;
    var boxes = graph.getElements().map(function(element) {
      return (React.createElement(Obj, {key: element.id, element: element, graph: graph}));
    });

    var connections = this.state.graph.getLinks().map(function(relation) {
      return (React.createElement(Relation, {
        key: relation.id, 
        from: this.state.graph.getCell(relation.get('source').id), 
        to: this.state.graph.getCell(relation.get('target').id)}));
    }.bind(this));

    return (
      React.createElement("g", null, 
          connections, 
          boxes
      )
    );
  }
});
