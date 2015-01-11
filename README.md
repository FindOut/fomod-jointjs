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

###Implementation

| product | role
| ------- | ---------
| AnglularJS | Basic web application structure, services and dependency injection
| JointJS | Graphical presentation and manipulation
| Backbone | Data representation, change notification, formatting for database storage, parsing for database retrieval
| Firebase | Internet service for REST based data storage and change notification

###Development environment

To start developing the Fomod app:

####Prerequisites

you have installed node, grunt and bower.

####Steps

```
git clone git@github.com:FindOut/fomod.git
cd fomod
npm install
bower install
grunt serve
```

A web browser opens on http://localhost:9000/#/models, reads and displays the  model from the database.

While the grunt serve command is running, all changes to source files causes the web browser to reload the current page to show the changes.

- Git
- [Node](http://nodejs.org/)
- [Yeoman](http://yeoman.io/)
- [Grunt](http://gruntjs.com/)
- [angular-generator](https://github.com/yeoman/generator-angular)
