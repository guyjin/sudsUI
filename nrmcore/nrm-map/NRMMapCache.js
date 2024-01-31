/**
 * @file The NRMMapCache extends the ArcGISTiledMapServiceLayer from ArcGIS Javascript API
 * to retrieve tiles from local storage to display map imagery in offline mode.
 * @see module:nrm-map/NRMMapCache
 */
/** 
 * @module nrm-map/NRMMapCache
 * 
 */

// History:
// NRM ported and modified in 2014.
// 10/27/2015 ebodin Finished AMD port, refactored with deferreds and properties to eliminate some globals.
// 5/18/2016 http://teamforge.fs.usda.gov/sf/go/artf54311 Cache map tiles in IndexedDB
define([
    'jquery',
    './AsynchronousCache',
    './WorkerPool',
    './Map',
    'dojo/_base/lang',
    'esri/config',
    'esri/layers/ArcGISTiledMapServiceLayer',
    'nrm-ui/views/modalView'
], function(
        $,
        AsynchronousCache,
        WorkerPool,
        Map,
        lang,
        config,
        ArcGISTiledMapServiceLayer,
        ModalView
        ) {

    /**
     * 
     * @param {Object} options
     * @param {ArcGISTiledMapServiceLayer} options.layer - must have been loaded in a map to initialize properties.
     *              Note that more than this layer may be cached, this is just needed to get LODs and tile counts.
     * @param {boolean} [options.debug=false] - Set true to draw white/red borders around cached/uncached tiles.
     * @param {function} [options.progressCallback] - Supply to override status display, takes percentComplete argument.
     * @returns {_L9.NRMMapCache}
     */
    return NRMMapCache = function(options) {
        if (options === undefined || options.layer === undefined)
            throw new Error("NRMMapCache requires a {layer: }");
        var
            proxyPage = Map.nrmAppRootFolder() + '/proxy.ashx', //'/iRangeMobile/Map/proxy.ashx',
            numTilesToCache,
            numTilesCached,
            mapIsCaching = false,
            emptyImage = "PCFET0NUWVBFIGh0bWwgUFVCTElDICItLy9XM0MvL0RURCBYSFRNTCAxLjAgVHJhbnNpdGlvbmFsLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL1RSL3hodG1sMS9EVEQveGh0bWwxLXRyYW5zaXRpb25hbC5kdGQiPg0KPGh0bWwgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiPg0KPGhlYWQ+DQogICAgPHRpdGxlPk9mZmxpbmUgTWVzc2FnZTwvdGl0bGU+DQo8L2hlYWQ+DQo8Ym9keT4NCjxoND5Tb3JyeSEgVGhpcyBmZWF0dXJlIGlzIG5vdCBhdmFpbGFibGUgb2ZmbGluZS48L2g0Pg0KPC9ib2R5Pg0KPC9odG1sPg0KAA==",
            maxTileCount = 1000, // default, which should take about 10mb of space
            tilesPerMB = 150, // this is a rough average to be used when calculating max tiles
            currentTileCount = 0,
            opts = options,
            progressDiv = $('.nrm-progress'),
            progressBar = $('.nrm-progress-bar', progressDiv),
            deferred;
        
        this.setLayer = function (layer) {
            this.layer = opts.layer = layer;
            this.baseUrl = layer.url;
            var x = this.baseUrl.substring(0, this.baseUrl.toLowerCase().indexOf('/mapserver'));
            this.layerName = opts.layerName = x.substring(x.lastIndexOf('/') + 1);
        };
        
        this.setLayer(opts.layer);
        this.keepCaching = true;
        //this.ioWorkerPath = Map.nrmAppRootFolder() + "/ioWorker.js"; //"/iRangeMobile/Map/ioWorker.js";
        //this.ioWorker;
        //this.dbMapCache;
        //this.dbPositionsCache;
        //this.myTileInfo;
        //this.mapExtent; //Used to clear debug on changing of map extent
        //this.alertedDBFull = false;

        var _cache = null;
        this._pool = null;
        this._queue = {};
        this.tileWorkerPath = window.location.origin + require.toUrl('nrm-map') +'/tileWorker.js';

        this.initLocalStorage = function() {
            //console.log('this in NRMMapCache.initLocalStorage', this);
            var cacheMapByDefault = true,
                dfd = $.Deferred(),
                that = this;

            config.defaults.io.corsEnabledServers.push('http://help.arcgis.com/');
            config.defaults.io.corsEnabledServers.push('http://sxphegis002.phe.fs.fed.us/');
            config.defaults.io.corsEnabledServers.push('http://localhost:2641/');
            config.defaults.io.corsEnabledServers.push('http://localhost:2146/');
            config.defaults.io.corsEnabledServers.push('http://localhost/');
            config.defaults.io.corsEnabledServers.push('http://servicesbeta.esri.com/');

            // Initialize cache
            _cache = new AsynchronousCache();
            this._pool = new WorkerPool();
            //console.log('initializing cache');
            $.when(_cache.init()).done(function(){
                //console.log('NRMMapCache.init done, extending map service layer', this);
                lang.extend(ArcGISTiledMapServiceLayer, {//extend ArcGISTiledMapServiceLayer
                    getTileUrl: function(level, row, col, img) {
                        img = img || {};
                        //that.baseUrl = this.url;
                        //var ti = myTiledMapServiceLayer.tileInfo;
                        //var lods = ti.lods;
                        //console.log('getTileUrl level ' + level.toString(), that.baseUrl, this.url, that, this); // + '  with LOD level ' + lods[level].level.toString());
                        //var url = this.getTileURL(level, row, col, that._url.path);

                        var proxyRoot = "",
                        //proxyRoot = window.location.protocol + '//' + window.location.host + proxyPage + "?";
                            url = proxyRoot + this._url.path + "/tile/" + level + "/" + row + "/" + col;
                        //console.log('initMapCache : cache get ' + url);

                        _cache.get(url, function(result) {
                            if (result != null) {
                                //console.log('cache hit on image ' + url);
                                img.src = "data:image/jpeg;base64," + result; // "image" generated warnings
                                if (opts.debug) {
                                    $(img).css("border", "1px solid white");
                                }
                                $(img).css("margin", "-1px");
                            } else {
                                console.warn('cache miss on image ' + url);
                                img.src = that.getTileAsync(level, row, col, url);
                                if (opts.debug) {
                                    $(img).css("border", "1px solid red");
                                }
                                $(img).css("margin", "-1px");
                            }
                        });
                        return null; // The image updated asynchronously via the img.src references above.
                    } // getTileUrl
                }); //extend map service layer
               dfd.resolve();
            }).fail(function() {
                dfd.reject();
            });
            
            return dfd.promise();
        };

        this.getTileURL = function(level, row, col, baseUrl) {
            // This function uses the "tiledLayerSource" global variable, and "window".
            var url = (baseUrl || this.baseUrl) + "/tile/" + level + "/" + row + "/" + col;
            if (Map.ServerLocation().toString().indexOf('.com') < 0) {
                url = window.location.protocol + '//' + window.location.host + proxyPage + "?" + url;
            }
            return url;
        };

        this.tileWorkerCallback = function(event) {
            //console.log('tileWorkerCallback event and this:', event, this);
            var result = JSON.parse(event.data),
                    myEvent = result.answer;
            if (result.type === 'debug') {
                console.info("tileWorker.debug: " + result.msg);
            } else if (result.type === 'response') {
                updateMapSavingPercentage();
                //console.log('tileWorker.response.');
                try {
                    if (myEvent[1] !== emptyImage) {
                        _cache.put(myEvent[0], myEvent[1], function(success) {
                            if (success) {
                                //console.log('tile cache success');

                                // Update tile count automatically
                                // Uses Lo-dash's debounce function
                                //debouncedGetTileCountTransitional();

                                // mapCacheSuccess();
                            } else {
                                console.warn('tile cache failure', myEvent);
                                // mapCacheError();
                            }
                        });
                    } else {
                        console.info("tileWorkerCallback tried to cache an empty record");
                    }
                } catch (e) {
                    console.warn('tileWorkerCallback Error: ' + e.message);
                }
            }
        };

        this.getTileAsync = function(level, row, col, url) {
            // This function always returns the URL, and performs the async caching in the background.
            // There is no other choice since the cache is asynchronous.
            url = url || this.getTileURL(level, row, col, url);
            //console.log('getTileAsync : retrieving ' + url);
            //console.log('getTileAsync cache get: tile level, row, col: ' + level.toString() + ', ' + row.toString() + ', ' + col.toString());

            // Use worker to retrieve the actual tile data asyncronously and cache it.
            this._pool.addWorkerTask(new WorkerPool.Task(this.tileWorkerPath, this.tileWorkerCallback, [url], this));

            // Immediately return URL (not the encoded image).
            return url;
        };

        this.clearMapCache = this.clear = function(callback) {
            try {
                _cache.clear(function(result) {
                    // Based on the old code:
                    // Could of computed the zero, but unnecessary.
                        $("#tileCount").text("0");
                    if ($.isFunction(callback)) {
                        callback(result);
                    }
                });
            } catch (e) {
                console.warn('clearMapCache Error: ' + e.message);
            }
        };

        this.getTileCount = function() {
            //  The following command was added only for debugging purposes.
            //initLocalStorage();
            try {
                _cache.count(function(result) {
                    //console.log('tiles currently stored: ' + result);
                    // The following from old code:
                    if (document.getElementById("tileCount")) {
                        $("#tileCount").text(result);
                    }
                });
            } catch (e) {
                console.warn('getTileCount Error: ' + e.message);
            }
        };

// Uses Lo-dash's debounce function
//var debouncedGetTileCount = _.debounce(getTileCount, 300);

// =================================================================


//Changed maxrow, minrow lower left has mincol and max row, upper right has maxcol and min row the way the counting is....? 
// ebodin 7/11/13 changed to use Lee's "transitional" approach
// ebodin 7/12/13 TODO: make sure that "level" is the tiledmaplayer level, not the relative LOD level
        this.cacheMapTiles = function(level, mincol, maxrow, maxcol, minrow, rowsAlreadyCached) {
            //console.log('Caching tiles starting at level ' + level.toString() + '... minrow/maxrow ' + minrow.toString() + '/' + maxrow.toString() + ', mincol/maxcol ' + mincol.toString() + '/' + maxcol.toLocaleString());
            this.keepCaching = true;
            var row, col;
            for (row = minrow; row <= maxrow; row++) {
                for (col = mincol; col <= maxcol; col++) {
                    if (currentTileCount < maxTileCount) {
                        if (this.isTileInDB(level, row, col, rowsAlreadyCached) == false) {
                            //console.log('cacheMapTiles calling getTileAsync for level, row, col ' + level.toString() + ', ' + row.toString() + ', ' + col.toString());
                            this.getTileAsync(level, row, col);
                            this.currentTileCount++;
                        }
                        else {
                            //console.log('cacheMapTiles skipping because tile is already cached for level, row, col ' + level.toString() + ', ' + row.toString() + ', ' + col.toString());
                            //this.updateMapSavingPercentage();
                        }
                    }
                    else {
                        this.keepCaching = false;
                        return;
                    }
                }
            }

            this.keepCaching = false;
        };

//We want to see if the Tile is already stored, if so we don't want to try and store it again, 
//and we don't want to add to our number of tiles cached
//If we aren't inserting a new tile. 
// ebodin 7/11/13 changed to use Lee's "transitional" approach
        this.isTileInDB = function(level, row, col, rowsAlreadyCached) {
            var retval = false,
                url = level + "/" + row + "/" + col,
                i, len = rowsAlreadyCached.length;
            for (i = 0; i < len; i++) {
                if (rowsAlreadyCached.item(i).URL.indexOf(url) > -1) {
                    retval = true;
                    break;
                }
            }
            //console.log('isTileInDB for ' + level.toString() + ', ' + row.toString() + ', ' + col.toString() + '? ' + retval.toString());
            return retval;
        };

        /**
         * Cache tiles for the current extent of the map (using {@link cacheTilesForExtent}).
         * @param {Map} map
         * @returns {undefined}
         */
        this.cacheTilesForMapExtent = function(map) {
            //myTiledMapServiceLayer = map.getLayer('basemap');
            cacheTilesForExtent(map.extent, map.getLevel(), Map.lods.length);
        };

        /**
         * Cache extent starting at level and going six levels deep.
         * Six levels is just arbitrary for now. Could be any number.
         * @param {Map} map
         * @param {Extent} extent - The current map extent.
         * @param {integer} level - Current level of detail, can be from 0-20, as specified in the lods in NRMMobileMap.
         * @param {integer} length - Length of the current lods. We show a subset of the overall 20 currently.
         * @returns {undefined}
         */
        this.cacheTilesForExtent = function(extent, level, length) {
            //console.info('cacheTilesForExtent', extent, level, length);
            deferred = $.Deferred();
            updateDebugOutput("");
            mapIsCaching = true;
            //console.log('starting cacheTilesForExtent at level ' + level.toString() + ' with total length of ' + length.toString());
            numTilesCached = 0;
            //We will end up doing a little more checking this way, the problem is if we set the current tile count to what is already in the DB
            //when we go to save if it tries to save tiles we already have first those get included in this count, so we update the count only when we don't have the image
            //it also is this way because of the asynchronous calls. 
            currentTileCount = 0;

            // calculate or re-calculate max tiles
            maxTileCount = _cache.cacheSizeInMB() * tilesPerMB;
            //console.log('calculated maxTileCount ' + maxTileCount.toString() + ' = ' + _cache.cacheSizeInMB().toString() + ' * ' + tilesPerMB.toString());
            this.getNumberOfTilesToCache(extent, level, length);
            //console.log('number of tiles to cache ' + numTilesToCache.toString());
            //if (numTilesToCache > maxTileCount) {
            if (numTilesToCache > 100000) {
                var msg = 'You have selected a very large area, and downloading the imagery (' 
                          + numTilesToCache.toString() + ' tiles) will take a long time and could exceed your device storage.'
                          + '\n\n OK to proceed, or Cancel to select a smaller area or turn off background layers.';
                if (!confirm(msg)) {
                    updateProgressBar(-1);
                    return;
                }
            }
            if (!$.isFunction(opts.progressCallback)) {
                progressDiv = $('.nrm-progress');
                progressBar = $('.nrm-progress-bar');
                if (progressDiv.length === 0 || progressBar.length === 0) {
                    var $parent = $('.navbar').length > 0 ? $('.navbar') : $('body');
                    progressDiv = $('<div class="nrm-progress" '
                                    + 'title="' + numTilesToCache.toString() + ' images total for layer ' + this.baseUrl + '"  >' 
                                    + '<div class="nrm-progress-bar progress-bar-success" '
                                    + 'role="progressbar" aria-valuenow="0" '
                                    + 'aria-valuemin="0" aria-valuemax="100" '
                                    + 'style="width:0%;">'
                                    + 'Saving layer ' + this.layerName + ' . . .  </div></div>'
                                    );
                    $parent.append(progressDiv);
                    //progressDiv = $('.nrm-progress', $parent);
                    progressBar = $('.nrm-progress-bar', progressDiv);
                    progressDiv.css('background-color', $('.navbar-header').css('background-color') || 'rgb(200, 200, 200)');
                }
                updateProgressBar(0);
                progressDiv.show();
            }

            var that = this;
            _cache.getURLs(function(result) {
                //console.log('callback for getURLs, result: ', result, this);
                if (result && result.rows) {
                    currentTileCount = result.rows.length;
                }
                else {
                    result = {rows: []};
                    currentTileCount = 0;
                }
                if (currentTileCount < maxTileCount) {
                    //Currently saving the level the user is at plus six levels deeper, this could end up being a variable number that the user gets to choose
                    //var ti = myTiledMapServiceLayer.tileInfo;
                    //var lods = ti.lods;
                    for (var i = level; i <= length && i < level + 6; i++) { // 12/29/2013 ebodin changed < to <= 
                        // ebodin - this is where the LOD level is getting set incorrectly.  WHY?????????
                        //console.info('cacheTilesForExtent is on level ' + i.toString() + ' (which is LOD ' + Map.lods[i].level.toString() + ')');
                        if (currentTileCount < maxTileCount) {
                            var llRowCol = that.getTileRowCol(Map.lods[i].level, extent.xmin, extent.ymin);
                            var urRowCol = that.getTileRowCol(Map.lods[i].level, extent.xmax, extent.ymax);
                            if (llRowCol && urRowCol) {
                                that.cacheMapTiles(Map.lods[i].level, llRowCol.col, llRowCol.row, urRowCol.col, urRowCol.row, result.rows);
                            }
                        }
                        else {
                            //alert('max image storage (' + maxTileCount.toString() + ') has been hit after caching ' + currentTileCount.toString() + ' tiles.');
                            updateProgressBar(-1);
                            return deferred.reject();
                        }
                    }
                }
                else {
                    alert('Tile cache is full.  Please select a smaller area or Clear Tiles and try again');
                    updateProgressBar(-1);
                    return deferred.reject();
                }
            });
            return deferred.promise();
        };

        this.getTileRowCol = function(level, xcoord, ycoord) {
            try {
                var ti = opts.layer.tileInfo, 
                    resolution = ti.lods[level].resolution,
                    xorigin = ti.origin.x,
                    widthInPixels = ti.width,
                    col = Math.floor((xcoord - xorigin) / (resolution * widthInPixels)),
                    yorigin = ti.origin.y,
                    heightInPixels = ti.height,
                    //need abs value, sometimes the value was negative a tile row shouldn't ever be negative
                    row = Math.abs(Math.floor((ycoord - yorigin) / (resolution * heightInPixels))),
                    returnval = {row: row || 0, col: col ||0};
                //console.log('  row,col,x,y: ' + row.toString() + ',' + col.toString() + ',' + xcoord.toString() + ',' + ycoord.toString());
                return returnval;
            } catch (ex) {
                console.warn('NRMMapCache.getTileRowCol missed tile ' + level.toString() + '/' + xcoord.toString() + '/' + ycoord.toString(), ex);
                return {row:0, col:0};
            }
        };

// Functions used to calculate percentage of map that has been cached and update the progress bar accordingly

        this.getNumberOfTilesToCache = function(extent, level, length) {
            //var ti = myTiledMapServiceLayer.tileInfo;
            //var lods = ti.lods;
            var numTilesForLevel = 0;

            numTilesToCache = 0;

            //console.log('getNumberOfTilesToCache sees this lods:', Map.lods);
            for (var i = level; i <= length && i < level + 6; i++) {
                //console.log('getNumberOfTilesToCache sees this lod at level ' + i, Map.lods[i]);
                //console.log('getNumberOfTilesToCache is on level ' + i.toString() + ' (which is LOD ' + Map.lods[i].level.toString() + ')');
                var llRowCol = this.getTileRowCol(Map.lods[i].level, extent.xmin, extent.ymin);
                var urRowCol = this.getTileRowCol(Map.lods[i].level, extent.xmax, extent.ymax);
                if (llRowCol && urRowCol) {
                    numTilesForLevel = this.getNumberOfTilesPerLevel(Map.lods[i].level, llRowCol.col, llRowCol.row, urRowCol.col, urRowCol.row);
                    numTilesToCache = numTilesToCache + numTilesForLevel;
                }
            }
        };

//Changed maxrow, minrow lower left has mincol and max row, upper right has maxcol and min row the way the counting is....?
        this.getNumberOfTilesPerLevel = function(level, mincol, maxrow, maxcol, minrow) {
            var tilesForLevel = (maxcol-mincol+1)*(maxrow-minrow+1);
            return tilesForLevel;
        };

        function updateMapSavingPercentage () {
            //mapIsCaching - used when user initiates a map save call, since we only want to increment the number of tiles that have been stored during this process
            var percentageCached = 0;
            if (mapIsCaching) {
                numTilesCached++;
                if (numTilesToCache == 0) {
                    percentageCached = 100;
                }
                else {
                    percentageCached = (numTilesCached / numTilesToCache) * 100;
                }
                if (percentageCached == 100) {
                    mapIsCaching = false;
                }
                //console.log('updateMapSavingPercentage: ' + numTilesToCache.toString() + ' : ' + numTilesCached.toString() + '  (' + percentageCached.toString() + '%)');
                if ($.isFunction(opts.progressCallback)) {
                    opts.progressCallback(percentageCached);
                    if (!mapIsCaching && deferred) {
                        return deferred.resolve();
                    }
                } else {
                    updateProgressBar(percentageCached);
                }
            }
        }

        function updateProgressBar (percentageCached) {
            //console.info('progressbar ' + percentageCached + '%');
            if (percentageCached === -1) {
                mapIsCaching = false;
            }
            var val = Math.max(percentageCached.toFixed(0), 0);
            progressBar.attr('aria-valuenow', val).css('width', val.toString() + '%').html('Saving layer ' + opts.layerName + ' . . .  ' + val.toString() + '%');
            if (!mapIsCaching) {
                progressDiv.hide();
                if (deferred) {
                    return deferred.resolve();
                }
            }
        }

////Used to check if the map extent has changed. We use this to clear debug output. 
//function checkMapExtent() {
//    if (mapExtent == undefined) {
//        mapExtent = map.extent;
//    }
//    //if the map extent has changed we want to clear the debug output and set the new map extent
//    if (mapExtent != map.extent) {
//        debug = "";
//        mapExtent = map.extent;
//    }
//}

        function updateDebugOutput (debugText) {
                $("#debug").text(debugText);
            }

        /* The following is the minimum amount of "globals" to satisfy external references for now,
         * but this module is in desparate need of a more comprehensive refactoring.
         */
        //this.initLocalStorage = initLocalStorage;
        //this.cacheTilesForExtent = cacheTilesForExtent;
    };
//    return NRMMapCache;
});
