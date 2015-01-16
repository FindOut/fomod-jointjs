#FOMOD - A simple model editor for the web

This is a proof-of-concept implementation of a graphic model editor for the web.

###Primary goals
- Easy to use
- Make beautiful models
- An architecture that encourages further development

###Plans

###Architecture and dependencies

####Main components

![image](http://yuml.me/4eeef7f4)

| component  | role
| -----------| -------------
| Data | is the data in memory (the Model)
| Graph | is the visible diagram (the View)
| Mapper | Presents the data as a graph, keeps the graph updated as data changes, Changes data according to commands performed on the graph  (the Controller)
| DataStore  | Reads database into Data and Graph at startup and writes Data back to the database on each update
| Firebase | A simple database manager on the internet that can be used directly from a web application

###Design and implementation

The main general components are:

| product | role
| ------- | ---------
| AnglularJS | Basic web application structure, services and dependency injection
| JointJS | Graphical presentation and manipulation
| Backbone | Data representation, change notification, formatting for database storage, parsing for database retrieval
| Firebase | Internet service for REST based data storage and change notification

Most parts of this application is built on a graph of angular services.
The services are then referred in other services. Angular creates a singleton for each service and injects it at each ref. Services survives Angular page navigation so that the graph for example, will not be reloaded uneccessarily.

As an example the logical data is defined

```
angular.module('fomodApp')
.service('data', function (FomodModel) {
  return new FomodModel();
});
```
and datastore for example is defined

```
angular.module('fomodApp')
.service('dataStore', function(data, Mapper, graph, FomodObjectTemplate, FomodObject, FomodRelation, commander, attrMap) {
  ...
```
Yo see all service used by dataStore.
This way it is easy to see the dependency graph. Angular prevents circular service references, so you have to have to keep you dependecies healthy.

If you want to see all the dependecies, run the following command from within the fomod top-level dir

```
grep -R '.service(' app|sed -e 's/.*\.service(//;s/, function.*(/: ["/;s/, /", "/g;s/) {/"],/;s/\[""]/[]/'
```
and paste result in the edit box in the page http://www.daviddurman.com/automatic-graph-layout-with-jointjs-and-dagre.html. Soon we could use fomod to display this graph.



###Development environment

Install node, grunt and bower. How to do this, depends on you OS. Se links to each tool below.

Run the following commands:
```
git clone git@github.com:FindOut/fomod.git
cd fomod
npm install
bower install
grunt serve
```

A web browser opens on http://localhost:9000/#/models, reads and displays the model from the database. Currently we all share the same database and the single model in it.

You could register for free on firebase.com and create a database and replace the URL https://fomod.firebaseio.com in app/scripts/services/datastore.js with your URL.

Then use you favourite editor on the code. Currently I use the free open-source editor [Atom](https://atom.io/) from the Github team.

As long as the `grunt serve` command is running, all changes to the source files causes the web browser to reload the current page to show the changes.

I used [Yeoman](http://yeoman.io/) to create the inital source file structure with the command `yo angular fomod` and got a runnable skeleton app to build upon.

I use `yo angular:route page` to create new pages and `yo angular:service servicename` to create services. Each command

###Source tree
```
fomod
├── app
│   ├── 404.html
│   ├── favicon.ico
│   ├── images
│   │   └── yeoman.png
│   ├── index.html
│   ├── robots.txt
│   ├── scripts
│   │   ├── app.js
│   │   ├── controllers
│   │   │   ├── main.js
│   │   │   ├── object.js
│   │   │   └── template.js
│   │   ├── directives
│   │   │   └── sortable.js
│   │   └── services
│   │       ├── customelements.js
│   │       ├── data.js
│   │       ├── datastore.js
│   │       ├── dragthresholder.js
│   │       ├── layouts.js
│   │       ├── mapper.js
│   │       └── palettemanager.js
│   ├── styles
│   │   └── main.css
│   └── views
│       ├── main.html
│       ├── object.html
│       └── template.html
├── bower.json
├── doc
│   ├── design.class.violet.html
│   └── notes.txt
├── firebase.json
├── Gruntfile.js
├── package.json
├── README.md
└── test
```

####Tools
- Git - versioning and code sharing
- [JointJS](http://jointjs.com/tutorial) - graphical editor framework
- [Node](http://nodejs.org/) - tool platform
- [Yeoman](http://yeoman.io/) - code and config scaffolding
- [angular-generator](https://github.com/yeoman/generator-angular) - yeoman scaffold for angular apps
- [Grunt](http://gruntjs.com/) - tool runner
- Jasmine - test framework
- [Firebase](https://www.firebase.com/docs/web/) - cloud database
- [Backbone](http://backbonejs.org/) - memory model manager also the main platform for JointJS
- [Backbone-Associations](http://dhruvaray.github.io/backbone-associations) - adds a relation concept to Backbone
- also JQuery, Underscore and others
