/** @jsx React.DOM */

var Graph = React.createClass({
    render: function () {
        return <svg {...this.props}></svg>;
    }
});

var Obj = React.createClass({
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
    return <g>
      <rect ref="rect" x={el.get('position').x} y={el.get('position').y} width="60" height="40" fill="#bbb" stroke="#000" onDoubleClick={this.dbl}/>
      <text ref="text" x={el.get('position').x + 3} y={el.get('position').y + 15}>{el.attr('text/text')}</text>
    </g>;
  }
});

var Relation = React.createClass({
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
    return <line x1={f.x} y1={f.y} x2={t.x} y2={t.y} strokeWidth="2" stroke="orange"/>;
  }
});

var GraphObjects = React.createClass({
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
      return (<Obj key={element.id} element={element} graph={graph}/>);
    });

    var connections = this.state.graph.getLinks().map(function(relation) {
      return (<Relation
        key={relation.id}
        from={this.state.graph.getCell(relation.get('source').id)}
        to={this.state.graph.getCell(relation.get('target').id)} />);
    }.bind(this));

    return (
      <g>
          {connections}
          {boxes}
      </g>
    );
  }
});
