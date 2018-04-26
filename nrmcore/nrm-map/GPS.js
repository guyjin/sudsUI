/**
 * @file A GPS Support library
 * @see module:nrm-map/GPS
 */
/** 
 * @module nrm-map/GPS
 * 
 */

/*
 * "Highly configurable" mutable plugin boilerplate
 * Author: @markdalgleish
 * Further changes, comments: @addyosmani
 * Licensed under the MIT license
 */
// http://addyosmani.com/resources/essentialjsdesignpatterns/book/
// http://markdalgleish.com/2011/05/creating-highly-configurable-jquery-plugins/
// http://markdalgleish.com/2011/09/html5data-creating-highly-configurable-jquery-plugins-part-2/
// Note that with this pattern, as per Alex Sexton's, the plugin logic
// hasn't been nested in a jQuery plugin. Instead, we just use
// jQuery for its instantiation.
//
// This is a GPS Support library
// http://diveintohtml5.info/geolocation.html
// Notes:
// http://stackoverflow.com/questions/7145514/whats-the-purpose-of-starting-semi-colon-at-beginning-of-javascript
;

//
// These are from the original NRMMobileMap.js file. Not all are necessary for GPS functionality... possibly none.
//

(function (window, navigator, undefined) {
    define([ 'use!modernizr'], function(Modernizr) {
        if (!Modernizr.geolocation) return null;
    try {
        var GPS = function (options) {
            var that = this; // Save reference to this plugin object for methods that change context ("this").

            this.options = options;
            this.config = null;

            // Custom code
            // All plugin globals explicitly defined here.

            this.geoLocationAvailable = Modernizr.geolocation;
            this.webSQLAvailable = !! window.openDatabase;
            this.db = null;

            // Error functions
            this.error = false;
            this.errorMessages = [];

            // Object globals
            this.positionHandle = null;
            this.position = null; // Current position (last position)
            this.newPosition = null; // Position being formed between update intervals.
            this.userDefinedPositionCallback = null;
            this.userDefinedWatchPositionCallback = null;
            this.lastTime = null;
            this.countPosition = 0;
            this.positionsArray = []; //use it for returning lat,long.
            this.positionAttributes = []; //use it for returning lat, long and accuracy.
            this.dataType = {
                POINT: 0,
                LINE: 1
            };

            // Perform initialization
            this.init();
        };
    } catch (e) {
        // Not compatible with IE
        console.log('Error creating GPS support library: ' + e.message);
        return null;
    }

    try {
        GPS.prototype = {
            defaults: {
                dbSizeInMB: 3,
                dbName: "nrmgpsdb",
                dbVersion: "1.0",
                dbDescription: "NRM GPS database",
                compression: true,

                // Default variables
                interval: 30,

                // Default functions
                defaultPositionErrorCallback: function (error) {
                    // Empty for default action (for now).
                    // The "error" parameter follows the W3C standard: http://www.w3.org/TR/geolocation-API/#position_error_interface
                }
            },

            //
            // GPS OBJECT INITIALIZATION
            //

            init: function () {
                // Introduce defaults that can be extended either 
                // globally or using an object literal. 
                this.config = $.extend({}, this.defaults, this.options);
                // This line binds a custom event to the top level of the DOM Should probably call it "_nrm.utils.GPS.event.myCustomGPSEvent" or something.
                // This binding prevides the context needed by the methods.

                if (this.webSQLAvailable) {
                    if (!this.db) {
                        try {
                            this.db = window.openDatabase(
                                this.config.dbName,
                                this.config.dbVersion,
                                this.config.dbDescription,
                                this.config.dbSizeInMB * 1024 * 1024
                            );
                        } catch (e) {
                            console.log('Error in GPS.prototype "db = opendatabase()" command: ' + e.message);
                        }
                        try {
                            this.db.transaction(function (tx) {
                                var p = "CREATE TABLE IF NOT EXISTS POSITIONS(" + "POSITION TEXT, TIMESTAMP TEXT, LATITUDE TEXT, LONGITUDE TEXT, HEADING TEXT, ACCURACY TEXT)";
                                tx.executeSql(p, []);
                                console.log('positions table created');
                            });

                            this.db.transaction(function (tx) {
                                var pp = "CREATE TABLE IF NOT EXISTS POSITIONPATHS(" + "POSITION TEXT, DATATYPE TEXT, NAME TEXT, TIMESTAMP TEXT, LATITUDE TEXT, LONGITUDE TEXT, HEADING TEXT, ACCURACY TEXT)";
                                tx.executeSql(pp, []);
                                console.log('position paths table created');
                            });

                        } catch (e) {
                            console.log('Error in GPS.prototype db.transaction: ' + e.message);
                        }
                    }
                } else {
                    // Initialization of the database failed, because webSQL is not available
                    this.error = true;
                    this.errorMessages.push("GPS initialization failed. webSQL not available.");
                    console.log("GPS initialization failed. webSQL not available.");
                    alert(this.errorMessages[this.errorMessages.length]);

                }
            },

            start: function (userDefinedWatchPositionCallback, positionErrorCallback) {

                $(document).on('watchPositionEvent', null, {
                    context: this
                }, this._watchPositionGPSEventHandler);

                this.userDefinedWatchPositionCallback = userDefinedWatchPositionCallback;

                //this.positionHandle = navigator.geolocation.watchPosition(this._watchPositionCallback, positionErrorCallback || this.config.defaultPositionErrorCallback);
                this.positionHandle = navigator.geolocation.watchPosition(this._triggerWatchPositionUpdateEvent, positionErrorCallback || this.config.defaultPositionErrorCallback);

            },

            _triggerWatchPositionUpdateEvent: function (pos) {
                // Whenever we get a new position, we trigger the custom GPS event.
                console.log("event triggered");
                $.event.trigger('watchPositionEvent', [pos]);
            },

            _watchPositionGPSEventHandler: function (e, pos) {
                var that = e.data.context;

                console.log("_watchPositionGPSEventHandler says 'this' is:");
                console.log(this);
                console.log(e.data.context);
                console.log(that.config.message);

                // Call subsequent functions with the proper context.

                // Call the user's function directly
                // that.userWatchPositionCb.call(that, pos);

                // Call the user function indirectly
                //  that._processPosition.call(that, pos);
                that._watchPositionCallback(pos);
            },

            _triggerCurrentPositionUpdateEvent: function (pos) {
                // Whenever we get a new position, we trigger the custom GPS event.
                console.log("event triggered");
                $.event.trigger('getCurrentPositionEvent', [pos]);
            },

            _getCurrentPositionGPSEventHandler: function (e, pos) {
                var that = e.data.context;

                console.log("_getCurrentPositionGPSEventHandler says 'this' is:");
                console.log(this);
                console.log(e.data.context);
                //console.log(that.config.message);

                that._getCurrentPositionCallback(pos);
            },

            stop: function () {
                // nrmmap.stopTracking
                $(document).off('watchPositionEvent', null, this._watchPositionGPSEventHandler);
                navigator.geolocation.clearWatch(this.positionHandle);
                //this._getAllPositions();
                // this.countPosition = 0; //reset the counter.
            },

            getPositionsArray: function (userDefinedPositionCallback) {
                if (this.positionsArray.length > 0) {
                    userDefinedPositionCallback(this.positionsArray)
                } else {
                    console.log('No positions were recorded.');
                }
            },

            //returns all positions Lat and Long
            getAllPositionsLatLong: function (userDefinedPositionCallback) {
                var that = this;
                try {
                    this.db.transaction(function (tx) {
                        var p = "SELECT * FROM POSITIONS";
                        tx.executeSql(p, [], function (tx, results) {
                            var len = results.rows.length;
                            that.positionsArray.length = 0;
                            for (var i = 0; i < len; i++) {
                                var item = [parseFloat(results.rows.item(i).LONGITUDE.replace(/['"]/g, '')), parseFloat(results.rows.item(i).LATITUDE.replace(/['"]/g, ''))];
                                that.positionsArray.push(item);
                            }
                            userDefinedPositionCallback(that.positionsArray);
                        });

                    });

                } catch (e) {
                    console.log('Error in GPS.prototype db.transaction: ' + e.message);
                }
            },

            //return all positions from db with lat, long and accuracy.
            getAllPositions: function (userDefinedPositionCallback) {
                var that = this;
                try {
                    this.db.transaction(function (tx) {
                        var p = "SELECT * FROM POSITIONS";
                        tx.executeSql(p, [], function (tx, results) {
                            var len = results.rows.length;
                            that.positionAttributes.length = 0;
                            for (var i = 0; i < len; i++) {
                                var item = [parseFloat(results.rows.item(i).LONGITUDE.replace(/['"]/g, '')), parseFloat(results.rows.item(i).LATITUDE.replace(/['"]/g, '')), results.rows.item(i).ACCURACY];
                                that.positionAttributes.push(item);
                            }
                            userDefinedPositionCallback(that.positionAttributes);
                        });

                    });

                } catch (e) {
                    console.log('Error in GPS.prototype db.transaction: ' + e.message);
                }
            },

            savePoint: function (dataType, positionName) {
                var that = this;
                var allAccuratePositions = new Array();
                var averagePt;

                //                   that.getAllPositions(function (posArray) {
                //                        allPositionsRecorded = posArray;
                //                        if (allPositionsRecorded.length > 0) {
                //                            that.getAllAccuratePositions(allPositionsRecorded, function (allAccuratePosCallback) {
                //                                allAccuratePositions = allAccuratePosCallback;
                //                           });
                //                          //averagePt = nrmMap.getAveragePoint(allAccuratePositions); ???
                //                        }
                //                    });


                this._prepareDataForPositionPathsDB(function (data) {

                    //this._insertPositionsIntoPermanentDB(that.dataType, averagePt, positionName, data);
                    //that._insertPositionsIntoPermanentDB(that.dataType, averagePt, positionName, data, function (success) {
                    that._insertPositionsIntoPermanentDB(that.dataType, positionName, data, function (success) {
                        if (success) {
                            console.log('positionpaths point insert success');
                        } else {
                            console.log('positionpaths point insert failure');
                        }
                    });
                });
            },

            getAllAccuratePositions: function (allPositionsArray, userDefinedPositionCallback) {

                var allPositionsFromDb = new Array();
                var accuracyArray = new Array();
                var allAccuratePositions = new Array();

                allPositionsFromDb = allPositionsArray;
                for (i = 0; i < allPositionsFromDb.length; i++) {
                    accuracyArray.push(allPositionsFromDb[i][2]);
                }
                accuracyArray.sort();

                for (i = 0; i < allPositionsFromDb.length; i++) {
                    var coordArray = new Array();
                    if (allPositionsFromDb[i][2] == accuracyArray[0]) {
                        coordArray.push(allPositionsFromDb[i][0], allPositionsFromDb[i][1]);
                        allAccuratePositions.push(coordArray);
                    }
                }

                userDefinedPositionCallback(allAccuratePositions);
            },


            saveLine: function (dataType, positionName) {
                var that = this;
                this._prepareDataForPositionPathsDB(function (data) {
                    //this._insertPositionsIntoPermanentDB(that.dataType, lineGraphic, positionName, data, function (success) {
                    that._insertPositionsIntoPermanentDB(that.dataType, positionName, data, function (success) {
                        if (success) {
                            console.log('positionpaths line insert success');
                        } else {
                            console.log('positionpaths line insert failure');
                        }
                    });
                });
            },

            getExportData: function (userDefinedExportDataCallback) {
                var that = this;
                var exportData = new Array();
                this.db.transaction(function (tx) {
                    tx.executeSql('SELECT * FROM POSITIONPATHS', [], function (tx3, results) {
                        var len = results.rows.length;
                        for (var i = 0; i < len; i++) {
                            var item = [
                                results.rows.item(i).POSITION,
                                results.rows.item(i).DATATYPE,
                                results.rows.item(i).NAME,
                                results.rows.item(i).TIMESTAMP,
                                parseFloat(results.rows.item(i).LONGITUDE.replace(/['"]/g, '')),
                                parseFloat(results.rows.item(i).LATITUDE.replace(/['"]/g, '')),
                                results.rows.item(i).HEADING,
                                results.rows.item(i).ACCURACY,
                                null
                            ];

                            exportData.push({
                                countPosition: results.rows.item(i).POSITION,
                                dataType: results.rows.item(i).DATATYPE,
                                name: results.rows.item(i).NAME,
                                timeStamp: results.rows.item(i).TIMESTAMP,
                                longitude: parseFloat(results.rows.item(i).LONGITUDE.replace(/['"]/g, '')),
                                latitude: parseFloat(results.rows.item(i).LATITUDE.replace(/['"]/g, '')),
                                heading: results.rows.item(i).HEADING,
                                accuracy: results.rows.item(i).ACCURACY.replace('"', '')
                            });
                        }
                        userDefinedExportDataCallback(exportData);
                    });
                });

            },

            _prepareDataForPositionPathsDB: function (data) {

                var tSavePositions = new Array();
                this.db.transaction(function (tx) {
                    tx.executeSql('SELECT * FROM POSITIONS', [], function (tx3, results) {
                        var len = results.rows.length;
                        for (var i = 0; i < len; i++) {
                            var item = [
                                results.rows.item(i).POSITION, //position number (auto incremented field)
                                results.rows.item(i).TIMESTAMP,
                                parseFloat(results.rows.item(i).LONGITUDE.replace(/['"]/g, '')),
                                parseFloat(results.rows.item(i).LATITUDE.replace(/['"]/g, '')),
                                results.rows.item(i).HEADING,
                                results.rows.item(i).ACCURACY,
                                null
                            ];

                            tSavePositions.push({
                                countPosition: results.rows.item(i).POSITION,
                                timeStamp: results.rows.item(i).TIMESTAMP,
                                longitude: parseFloat(results.rows.item(i).LONGITUDE.replace(/['"]/g, '')),
                                latitude: parseFloat(results.rows.item(i).LATITUDE.replace(/['"]/g, '')),
                                heading: results.rows.item(i).HEADING,
                                accuracy: results.rows.item(i).ACCURACY.replace('"', '')
                            });
                        }
                        data(tSavePositions);
                    });
                });
            },

            _insertPositionsIntoPermanentDB: function (dataType, userSavedName, data, callback) {

                var that = this;
                try {
                    that.db.transaction(function (tx) {

                        var row;
                        for (i = 0; i < data.length; i++) {

                            row = data[i];
                            console.log('inserting ' + i.toString() + ' of ' + data[i].toString());
                            tx.executeSql('INSERT INTO POSITIONPATHS(POSITION, DATATYPE, NAME, TIMESTAMP, LATITUDE, LONGITUDE, HEADING, ACCURACY) VALUES (?,?,?,?,?,?,?,?)', [row.countPosition,
                                    //JSON.stringify(dataType),
                                    (dataType == "0") ? "Point" : "Line",
                                    userSavedName,
                                    row.timeStamp,
                                    row.latitude,
                                    row.longitude,
                                    row.heading,
                                    row.accuracy
                                    //null
                                ],
                                function (tx, rs) {
                                    // Query success
                                    result = true;
                                    if (callback && typeof (callback) === "function") callback(result);
                                },
                                function (tx, e) {
                                    // Query failure
                                    result = false;
                                    if (callback && typeof (callback) === "function") callback(result);
                                }
                            );
                        }
                        //                        that.db.transaction(function (tx4) {
                        //                            tx4.executeSql('INSERT INTO POSITIONPATHS(POSITION, DATATYPE, NAME, TIMESTAMP, LATITUDE, LONGITUDE, HEADING, ACCURACY, VALUE) VALUES (?,?,?,?,?,?,?,?,?)', [JSON.stringify(data.length + 1), (dataType == 0) ? "AVG" : "GRAPHIC",
                        //                                    JSON.stringify(userSavedName),
                        //                                    null,
                        //                                    null,
                        //                                    null,
                        //                                    null,
                        //                                    null,
                        //                                    JSON.stringify(toStoreValue)
                        //                                ],
                        //                                function (tx, rs) {
                        //                                    // Query success
                        //                                    result = true;
                        //                                    if (callback && typeof (callback) === "function") callback(result);
                        //                                },
                        //                                function (tx, e) {
                        //                                    // Query failure
                        //                                    result = false;
                        //                                    if (callback && typeof (callback) === "function") callback(result);
                        //                                }
                        //                            );
                        //                        });
                    });
                } catch (e) {
                    console.log('Error in GPS.prototype.insert: ' + e.message);
                }
                //  deletePositionsCache(); // mscanlon added on 06/27 to allow points to accumulate.
            },

            getCurrentPosition: function (userDefinedPositionCallback, positionErrorCallback) {
                // https://developer.mozilla.org/en-US/docs/Web/API/window.navigator.geolocation.getCurrentPosition
                // Handle missing 'errorCallback' parameter: http://stackoverflow.com/questions/6486307/default-argument-values-in-javascript-functions

                $(document).on('getCurrentPositionEvent', null, {
                    context: this
                }, this._getCurrentPositionGPSEventHandler);


                this.userDefinedPositionCallback = userDefinedPositionCallback;
                //navigator.geolocation.getCurrentPosition(this._getCurrentPositionCallback, positionErrorCallback || this.config.defaultPositionErrorCallback);
                navigator.geolocation.getCurrentPosition(this._triggerCurrentPositionUpdateEvent, positionErrorCallback || this.config.defaultPositionErrorCallback);
            },

            _watchPositionCallback: function (position) {

                // Here we want to wait until "interval" had been passed. Use the time to get more accurate readings, if available.
                // ** Investigate this logic to make sure it is valid.
                var that = this;

                var now = position.timestamp;
                var lastTime = (this.lastTime == null) ? now : this.lastTime;
                console.dir(this);
                var timeInterval = this.config.interval;

                if ((this.newPosition == null) || (this.newPosition.coords.accuracy <= position.coords.accuracy)) {
                    this.newPosition = position;
                }

                if (now > (lastTime + (timeInterval * 1000))) {

                    this.position = this.newPosition;

                   // if(this.position.coords.accuracy < 75) { // I'm not sure about this idea. But, might help in avoiding weird positions.
                    this._insertPosition(this.position, function (success) {
                        if (success) {
                            console.log('position insert success');
                            that.userDefinedWatchPositionCallback(that.newPosition, that.countPosition); // Call the user supplied function with the position.
                            that.newPosition = null;                           
                        } else {
                            console.log('position insert failure');
                        }
                    });
                    //this.newPosition = null;
                    this.lastTime = now;
                  //}
                } else {
                    this.lastTime = now;
                }

            },

            _formatTimestamp: function (rawTimestamp) {

                var d = new Date(rawTimestamp);
                var hours = d.getHours(),


                    minutes = d.getMinutes(),
                    seconds = d.getSeconds(),
                    month = d.getMonth() + 1,
                    day = d.getDate(),
                    year = d.getFullYear() % 100;

                function pad(d) {
                    return (d < 10 ? "0" : "") + d;
                }

                var formattedDate = pad(hours) + ":" + pad(minutes) + ":" + pad(seconds) + " " + pad(month) + "-" + pad(day) + "-" + pad(year);

                return formattedDate;
            },


            _insertPosition: function (position, callback) {
                try {
                    var that = this;
                    // This is asynchronous. Assumes "value" is a string with normal ASCII characters
                    // Callback returns true or false depending on insert success
                    var formattedDateString = this._formatTimestamp(position.timestamp);
                    var result;
                    this.countPosition++;
                    this.db.transaction(function (tx) {
                        tx.executeSql('INSERT INTO POSITIONS(POSITION, TIMESTAMP, LATITUDE, LONGITUDE, HEADING, ACCURACY) VALUES (?,?,?,?,?,?)', [JSON.stringify(that.countPosition),
                                //JSON.stringify(userCurrentPosition.timestamp),
                                formattedDateString,
                                JSON.stringify(position.coords.latitude),
                                JSON.stringify(position.coords.longitude),
                                JSON.stringify(position.coords.heading),
                                JSON.stringify(position.coords.accuracy)
                            ],
                            function (tx, rs) {
                                // Query success
                                result = true;
                                that.positionsArray.push(position);
                                if (callback && typeof (callback) === "function") callback(result);
                            },
                            function (tx, e) {
                                // Query failure
                                result = false;
                                if (callback && typeof (callback) === "function") callback(result);
                            }
                        );
                    }, function (tx) {
                        // Transaction failure
                        // May add more error handling here since failure due to lack of space apparently arises here:
                        // tx.code == 4
                    }, function (tx) {
                        // Transaction success
                    });
                } catch (e) {
                    console.log('Error in GPS.prototype.insert: ' + e.message);
                }
            },

            _getCurrentPositionCallback: function (position) {
                // This method could theoretically contain fixes or adjustments for the position if necessary.
                // Call the user supplied function with the position.
                $(document).off('getCurrentPositionEvent', null, this._getCurrentPositionGPSEventHandler);
                this.userDefinedPositionCallback(position);
            },

            clearPositionsCache: function () {

                try {
                    this.db.transaction(function (tx) {
                        var p = "DELETE FROM POSITIONS";
                        tx.executeSql(p, []);
                        console.log('positions table records deleted');
                        this.countPosition = 0; //reset the counter.
                    });
                } catch (e) {
                    console.log('Error in GPS.prototype db.transaction: ' + e.message);
                }
            },


            clearSavedPositionsCache: function () {

                try {
                    this.db.transaction(function (tx) {
                        var pp = "DELETE FROM POSITIONPATHS";
                        tx.executeSql(pp, []);
                        console.log('position paths table records deleted');
                    });

                } catch (e) {
                    console.log('Error in GPS.prototype db.transaction: ' + e.message);
                }
            },

//            getLineFromDB: function (userDefinedPositionCallback) {
//                var graphicArray = new Array();
//                this.db.transaction(function (tx) {
//                    graphicArray.clear();
//                    tx.executeSql("SELECT VALUE FROM POSITIONPATHS WHERE DATATYPE = ?", ['GRAPHIC'],
//                        function (tx, results) {
//                            for (var i = 0; i < results.rows.length; i++) {
//                                var graphic = results.rows.item(i).VALUE;
//                                graphicArray.push(graphic);
//                            }
//                            userDefinedPositionCallback(graphicArray);
//                        },
//                        function (transaction, error) {
//                            console.log('An error occured while retrieving graphic from positionpaths table.');
//                        });
//                });
//            },

//            getAvgPtFromDB: function (userDefinedPositionCallback) {
//                var graphicArray = new Array();
//                this.db.transaction(function (tx) {
//                    graphicArray.clear();
//                    tx.executeSql("SELECT VALUE FROM POSITIONPATHS WHERE DATATYPE = ?", ['AVG'],
//                        function (tx, results) {
//                            for (var i = 0; i < results.rows.length; i++) {
//                                var avgPt = results.rows.item(i).VALUE;
//                                graphicArray.push(avgPt);
//                            }
//                            userDefinedPositionCallback(graphicArray);
//                        },
//                        function (transaction, error) {
//                            console.log('An error occured while retrieving average point from positionpaths table.');
//                        });
//                });
//            },

            //
            // UTILITY FUNCTIONS (THESE WILL BE MOVED TO A SEPARATE LIBRARY)
            //         

            latLonToMercator: function (lat, lon) {
                // http://dotnetfollower.com/wordpress/2011/08/javascript-how-to-convert-latitude-and-longitude-to-mercator-coordinates/
                // Alternative: http://www.gal-systems.com/2011/07/convert-coordinates-between-web.html
                var rMajor = 6378137; //Equatorial Radius, WGS84
                var shift = Math.PI * rMajor;
                var x = lon * shift / 180;
                var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
                y = y * shift / 180;
                return {
                    'x': x,
                    'y': y
                };
            },

            mercatorToLatLon: function (mercX, mercY) {
                // http://dotnetfollower.com/wordpress/2011/07/javascript-how-to-convert-mercator-sphere-coordinates-to-latitude-and-longitude/
                var rMajor = 6378137; //Equatorial Radius, WGS84
                var shift = Math.PI * rMajor;
                var lon = mercX / shift * 180.0;
                var lat = mercY / shift * 180.0;
                lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180.0)) - Math.PI / 2.0);
                return {
                    'lon': lon,
                    'lat': lat
                };
            },

            getDistance: function (lat1, lon1, lat2, lon2) {
                var R = 3960; // miles
                var dLat = this.toRad(lat2 - lat1);
                var dLon = this.toRad(lon2 - lon1);
                var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return R * c;
            },

            toRad: function (val) {
                // Converts numeric degrees to radians
                return val * Math.PI / 180;
            }
        };

    } catch (e) {
        console.log('Error creating GPS.prototype: ' + e.message);
        return null;
    }

    //
    // Namespace assignment
    //

    // Set the object to null if 
//    if (Modernizr.geolocation) {
//        _nrm.namespace("controls").GPS = GPS;
//        //_nrm.namespace("controls.Map").GPS = GPS;
//    } else {
//        _nrm.namespace("controls").GPS = null;
//        //_nrm.namespace("controls.Map").GPS = null;
//    }
        return GPS;
    });
})((typeof window === "object" ? window : this), (typeof navigator === "object" ? navigator : undefined), undefined);