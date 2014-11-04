/*
 * The API
 */

var fs = require('fs');

module.exports = (function () {
    // private members
    var self = this;
    
    var ZOOMLEVEL_STATE = 7;
    var ZOOMLEVEL_CITY = 11;
    var ZOOMLEVEL_ZIP = 100;
    
    var stateIndex = [];    // the map of all states
    
    // private helper functions
    /*
     * Check if a location falls within specified bounds.
     */
    function inBounds(lat, long, neLat, neLong, swLat, swLong) {
        var eastBound = long < neLong;
        var westBound = long > swLong;
        var inLong;

        if (neLong < swLong) {
            inLong = eastBound || westBound;
        }else {
            inLong = eastBound && westBound;
        }
        var inLat = lat > swLat && lat < neLat;

        return inLat && inLong;
    };
    
    /*
     * Read a file line by line
     */
    function readFileLines(input, callback) {
        var remaining = '';

        input.on('data', function (data) {
            remaining += data;
            var index = remaining.indexOf('\n');
            while (index > -1) {
                var line = remaining.substring(0, index);
                remaining = remaining.substring(index + 1);
                callback(line);
                index = remaining.indexOf('\n');
            }
        });

        input.on('end', function () {
            if (remaining.length > 0) {
                callback(remaining, true);
            }else {
                callback(null, true);
            }
        });
    };
    
    /*
     * Format latitude values to fall within the range [-90, 90]
     */
    function formatLat(lat) {
        if (lat > 90) {
            return lat - 180;
        }
        return lat;
    };
    
    /*
     * Format longitude values to fall within the range [-180, 180]
     */
    function formatLong(long) {
        if (long > 180) {
            return long - 360;
        }
        return long;
    }
    
    
    // public functions
    
    /*
     * Build index for states (since it can be max ~50 we build it once for all states 
     * and cache it irrespective of viewport bounds.
     */
    self.buildStateIndex = function () {
        stateIndex = [];
        var input = fs.createReadStream('./raw.json');
        readFileLines(input, addToStateIndex);
        
        function addToStateIndex(line) {
            if (!line) {
                return;
            }
            var json = JSON.parse(line);
            json.count = 1;
            var key = json.state_small_name;
            if (stateIndex[key]) {
                stateIndex[key].count++;
                stateIndex[key].title = stateIndex[key].count + " users in " + stateIndex[key]["state_small_name"];
                stateIndex[key]["lat"] = (stateIndex[key]["lat"] + json["lat"]) / 2.0;    // average out location
                stateIndex[key]["lng"] = (stateIndex[key]["lng"] + json["lng"]) / 2.0;    // average out location
            }else {
                stateIndex[key] = json;
            }
        };
    };
    
    /*
     * Builds an array of all user data points lying in the specified viewport according to zoom-based
     * criteria. Should ideally use database query for better performance; currently implemented as 
     * file-based querying for moderate data size.
     */
    self.query = function (zoomLevel, neLat, neLong, swLat, swLong, callback) {
        var index = []; // the map of all required data points
 
        function processLine(data, eof) {
            if (data) {
                var key;
                var keyField;
                var json = JSON.parse(data);
                if (zoomLevel < ZOOMLEVEL_CITY) {
                    keyField = "city_small_name";
                }else {
                    keyField = "zip";
                    json.zip = "ZIP " + json.zip;   // convert to string key as zipcode is numeric
                }

                key = json[keyField];
                json.count = 1;
                json.lat = formatLat(json.lat);
                json.lng = formatLong(json.lng);
                if (inBounds(json.lat, json.lng, neLat, neLong, swLat, swLong)) { 
                    if (index[key]) {
                        index[key].count++;
                        index[key].title = index[key].count + " users in " + index[key][keyField];
                        index[key]["lat"] = (index[key]["lat"] + json["lat"]) / 2.0;
                        index[key]["lng"] = (index[key]["lng"] + json["lng"]) / 2.0;
                    }else {
                        index[key] = json;
                    }
                }
            }
            if (eof) {
                callback(index);
            }
        }
        
        var input = fs.createReadStream('./raw.json');
        readFileLines(input, processLine);
    }
    
    /*
     * This is what the app calls
     */
    self.get = function (zoomLevel, neLat, neLong, swLat, swLong, callback) {
        if (zoomLevel < ZOOMLEVEL_STATE) {
            callback(stateIndex);
        }else {
            this.query(zoomLevel, neLat, neLong, swLat, swLong, callback);
        }
    };
    
    
    return self;
})();

