var ck12 = ck12 || {};

ck12.CMap = function (mapEl, config) {
	// TODO: remove if not required?
	//this.mapEl = mapEl;
	//this.config = config;
	
	this.map = new google.maps.Map(mapEl, config.mapOptions);
	this.markers = [];
	
	// handle zoom
	if (config.events) {
		for (var i = 0; i < config.events.length; i++) {
			//google.maps.event.addListener(this.map, config.events[i].name, config.events[i].handler);
			google.maps.event.addListener(this.map, config.events[i].name, function (callback, context) {
				return function () {
					callback.call(context);
				}
			}(config.events[i].handler, config.events[i].context));
		}
	}
};
	
ck12.CMap.prototype.addMarker = function (location, title) {
	var _self = this;
	var latlng = new google.maps.LatLng(location.lat, location.long);
	var marker = new google.maps.Marker({
    	position: latlng,
    	map: _self.map,
    	title: title
  	});
  	this.markers.push(marker);
};

ck12.CMap.prototype.getZoomLevel = function () {
	if (this.map) {
		return this.map.getZoom();
	}
	return -1;
};

ck12.CMap.prototype.getBounds = function () {
    if (this.map) {
        var lat0 = map.getBounds().getNorthEast().lat(),
            lng0 = map.getBounds().getNorthEast().lng(),
            lat1 = map.getBounds().getSouthWest().lat(),
            lng1 = map.getBounds().getSouthWest().lng();
        
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
	
ck12.CMap.prototype.updateMarkers = function (data) {
	for (var i = 0; i < data.length; i++) {
        this.addMarker(data[i].location, data[i].title);
    }
};

ck12.CMap.prototype.clearMarkers = function () {
	setAllMap(null);
    this.markers = null;
    this.markers = [];
};

ck12.CMap.prototype.renderMarkers = function () {
	for (var i = 0; i < this.markers.length; i++) {
    	this.markers[i].setMap(this.map);
  	}
};
