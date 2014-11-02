var ck12 = ck12 || {};

if (!ck12.CMap) {
	(typeof console !== "undefined") && console.log("FATAL ERROR: Missing required source files. Failed to initialize app");
}

ck12.utils = {
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
                catch(e){
                	console.log("Error in API call " + e);
                }
             } // end for
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
        xhr.send('');
    }
};

ck12.app = {
	ZOOMLEVEL_STATE : 1,
	ZOOMLEVEL_CITY  : 2,
	ZOOMLEVEL_ZIP   : 3,
    
    dirty: false,

	init: function (mapEl) {
		var _self = this;
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
		this.zoomHandler();
	},
	zoomHandler: function () {
        var mapBounds = this.map.getBounds();
		var zoomLevel = this.map.getZoomLevel();
        this.apiQuery(zoomLevel, mapBounds);
		this.lastZoomLevel = zoomLevel;
	},
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