/*
 * Cluster map app
 * Author: Ayon Ghosh
 * Date: 2 November 2014
 */

// master namespace
var ck12 = ck12 || {};

// check if required scripts have been loaded
if (!ck12.CMap) {
	(typeof console !== "undefined") && console.log("FATAL ERROR: Missing required source files. Failed to initialize app");
}

// common utils
ck12.utils = {
    // Cross browser Ajax wrapper
	doAjax: function (config) {
		var xhr;
         
        if (typeof XMLHttpRequest !== 'undefined') {
        	xhr = new XMLHttpRequest();
        }else {
            var versions = [
            	"MSXML2.XmlHttp.5.0", 
                "MSXML2.XmlHttp.4.0",
                "MSXML2.XmlHttp.3.0", 
                "MSXML2.XmlHttp.2.0",
                "Microsoft.XmlHttp"
            ];
 
            for(var i = 0; i < versions.length; i++) {
                try {
                    xhr = new ActiveXObject(versions[i]);
                    break;
                }
                catch (e){
                	console.log("FATAL: Ajax might not be supported on your browser");
                }
             }
        }
         
        xhr.onreadystatechange = function () {
            if(xhr.readyState < 4) {
                return;
            }
            if(xhr.status !== 200) {
                return;
            }
            // all is well  
            if(xhr.readyState === 4) {
                config.success(xhr);
            }           
        }
         
        xhr.open(config.method.toUpperCase(), config.url, true);
        xhr.send(config.data || '');
    }
};

/*
 * The app.
 */
ck12.app = {
	ZOOMLEVEL_STATE : 1,
	ZOOMLEVEL_CITY  : 2,
	ZOOMLEVEL_ZIP   : 3,

    /*
     * Initializes the map.
     */
	init: function (mapEl) {
		var _self = this;
        // config containing initial zoom, initial center of the map and 
        // event handlers to be attached
		var config = {
			mapOptions: {
		    	zoom: 4,
		    	center: new google.maps.LatLng(41.850033, -87.6500523)	// USA
		    },
		    events: [
                {
                    name: "idle",
                    handler: _self.zoomHandler,
                    context: _self
                }
		    ]
	  	};
	  	this.lastZoomLevel = this.ZOOMLEVEL_STATE;
		this.map = new ck12.CMap(mapEl, config);
	},
    /*
     * Takes necessary action when user zooms in or moves around on the map.
     */
	zoomHandler: function () {
        var mapBounds = this.map.getBounds();
		var zoomLevel = this.map.getZoomLevel();
        this.apiQuery(zoomLevel, mapBounds);
		this.lastZoomLevel = zoomLevel;
	},
    /*
     * Queries the API to return all points for the particular zoom level
     * and viewport boundaries.
     */
    apiQuery: function (zoomLevel, mapBounds) {
        var url = "/api/get?zoom=" + zoomLevel + 
            "&lat0=" + mapBounds.ne.lat + 
            "&lng0=" + mapBounds.ne.long +
            "&lat1=" + mapBounds.sw.lat + 
            "&lng1=" + mapBounds.sw.long;
        
        var callback = this.updateMarkers();
        ck12.utils.doAjax({
            url: url,
            method: "GET",
            success: callback
        });
            
    },
    /*
     * Adds and renders markers returned by API on the map.
     */
    updateMarkers: function (xhr) {
        try {
            this.map.clearMarkers();
            var data = JSON.parse(xhr.responseRext);
            for (var i = 0; i < data.length; i++) {
                this.map.updateMarkers({
                    "location": {
                        "lat": data[i].lat,
                        "lng": data[i].lng
                    },
                    "title": data[i].state_small_name + ", " + data[i].city_small_name + " - " + data[i].zip
                });
            }
            this.map.renderMarkers();
        }catch (e) {
            console.log("ERROR parsing response from API");
        }
    }
};