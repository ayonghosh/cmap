The app is hosted at:

http://nodejs-ck12map.rhcloud.com/


This is an app to demonstrate clustered rendering of markers on a 
Google map from a very large JSON user data set. Initially the map
displays a marker for each state. On zooming in it shows 
increasing levels of detail: city and zip. Similarly, on zooming 
out it shows decreasing level of detail.

The simple API powering this app is implemented using a file 
based querying system that works with moderately sized data sets,
however for better performance a database sytem should be
used.

The back end has been implemented in NodeJS.


Source hierarchy:

[Back end]
 server.js - web server part (serves static files to client)

 api/index.js - API called through server

[Front end]
 app.js  - the client side web app
 cmap.js - an abstract wrapper over Google maps

Hosted on OpenShift platform (https://openshift.redhat.com/)
