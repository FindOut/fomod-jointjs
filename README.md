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

component  | role
-----------| -------------
Data | is the data in memory (the Model)
Graph | is the visible diagram (the View)
Mapper | Presents the data as a graph, keeps the graph updated as data changes, Changes data according to commands performed on the graph  (the Controller)
DataStore  | Reads database into Data and Graph at startup and writes Data back to the database on each update
Firebase | A simple database manager on the internet that can be used directly from a web application
