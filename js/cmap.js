/* 
 * CMap - an abstract wrapper over Google maps.
 * Author: Ayon Ghosh
 * Date: 2 Nov 2014
 */

// master namespace
var ck12 = ck12 || {};

/*
 * Constructor. Initializes a map on the specified DOM element
 * using configuration
 */
ck12.CMap = function (mapEl, config) {
	this.map = new google.maps.Map(mapEl, config.mapOptions);  // the Google map object
	this.markers = []; // a hash map of all currently visible markers
	
	// handle zoom
	if (config.events) {
		for (var i = 0; i < config.events.length; i++) {
			google.maps.event.addListener(this.map, config.events[i].name, function (callback, context) {
				return function () {
					callback.call(context);
				}
			}(config.events[i].handler, config.events[i].context));
		}
	}
};

/*
 * Gets the zoom level (integer) of the map.
 */
ck12.CMap.prototype.getZoomLevel = function () {
	if (this.map) {
		return this.map.getZoom();
	}
	return -1;
};

/*
 * Gets the viewport bounds (of northeast and southwest corners) in latitude and longitude.
 * Returns JSON of the format:
 * { "ne": { "lat", "long" }, "sw": { "lat", "long"} }
 */
ck12.CMap.prototype.getBounds = function () {
    if (this.map) {
        var lat0 = this.map.getBounds().getNorthEast().lat(),
            lng0 = this.map.getBounds().getNorthEast().lng(),
            lat1 = this.map.getBounds().getSouthWest().lat(),
            lng1 = this.map.getBounds().getSouthWest().lng();
        
        return {
            "ne": {
                "lat": lat0, 
                "long": lng0
            },
            "sw": {
                "lat": lat1, 
                "long": lng1
            }
        };
    }
    return null;
};

/*
 * Adds a marker but doesn't render it.
 */
ck12.CMap.prototype.addMarker = function (hashKey, location, title) {
	var latlng = new google.maps.LatLng(location.lat, location.long);
	var marker = new google.maps.Marker({
    	position: latlng,
    	title: title
  	});
    if (!this.markers[hashKey]) {
        this.markers[hashKey] = marker;
    }
};

/*
 * Generates a unique key for a location (latitude-longitude pair)
 */
ck12.CMap.prototype.hash = function (location) {
    return location.lat + "_" + location.long;
};

/*
 * Adds all markers to map from specified data but does not render them.
 */
ck12.CMap.prototype.updateMarkers = function (data) {
    var hashKeys = [];  // hash map of currently visible markers
	for (var i = 0; i < data.length; i++) {
        var hashKey = this.hash(data[i].location);
        this.addMarker(hashKey, data[i].location, data[i].title);
        hashKeys[hashKey] = true;
    }
    // remove markers that are no longer visible
    for (hashKey in this.markers) {
        if (!hashKeys[hashKey]) {
            this.markers[hashKey].setMap(null);
            this.markers[hashKey] = null;
            delete this.markers[hashKey];
        }
    }
};

/*
 * Clears all existing markers from the map.
 */   
ck12.CMap.prototype.clearMarkers = function () {
	for (var i = 0; i < this.markers.length; i++) {
    	this.markers[i].setMap(null);
  	}
    this.markers = null;
    this.markers = [];
};

/*
 * Renders all currently unrendered markers on the map.
 */
ck12.CMap.prototype.renderMarkers = function () {
    for (var hashKey in this.markers) {
        if (!this.markers[hashKey].getMap()) {
    	   this.markers[hashKey].setMap(this.map);
        }
  	}
};

