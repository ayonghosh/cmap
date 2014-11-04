#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var api     = require('./api');

/**
 *  Define the application.
 */
var App = function() {

    //  Scope.
    var self = this;
    
    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };
    
    // override JSON.stringify
    (function(){
        // Convert array to object
        var convArrToObj = function(array){
            var thisEleObj = new Object();
            if(typeof array == "object"){
                for(var i in array){
                    var thisEle = convArrToObj(array[i]);
                    thisEleObj[i] = thisEle;
                }
            }else {
                thisEleObj = array;
            }
            return thisEleObj;
        };
        var oldJSONStringify = JSON.stringify;
        JSON.stringify = function(input){
            if(oldJSONStringify(input) == '[]')
                return oldJSONStringify(convArrToObj(input));
            else
                return oldJSONStringify(input);
        };
    })();
        
    
    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/asciimo'] = function(req, res) {
            var link = "http://i.imgur.com/kmbjB.png";
            res.send("<html><body><img src='" + link + "'></body></html>");
        };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };
        
        self.routes['/js/cmap.js'] = function (req, res) {
            res.setHeader('Content-Type', 'application/javascript');
            res.send(fs.readFileSync('./js/cmap.js'));
        };
        
        self.routes['/js/app.js'] = function (req, res) {
            res.setHeader('Content-Type', 'application/javascript');
            res.send(fs.readFileSync('./js/app.js'));
        };
        
        self.routes['/api/get'] = function (req, res) {
            // call API
            res.setHeader('Content-Type', 'application/json');
            var zoomLevel = +req.param("zoom"),
                _neLat = +req.param("lat0"),
                _neLong = +req.param("lng0"),
                _swLat = +req.param("lat1"),
                _swLong = +req.param("lng1");
            
            api.get(zoomLevel, _neLat, _neLong, _swLat, _swLong, function (json) { 
                self.sendJSONResponse(res, json);
            });
        };
        
    };
    
    self.sendJSONResponse = function (res, json) {
        var response = JSON.stringify(json);
        res.send(response);
    };

    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express.createServer();

        //  Add handlers for the app (from the routes).
        for (var r in self.routes) {
            self.app.get(r, self.routes[r]);
        }
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
        
        // create state index
        api.buildStateIndex();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };
    
};   /*  Application.  */



/**
 *  main():  Main code.
 */
var zapp = new App();
zapp.initialize();
zapp.start();

