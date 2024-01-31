define([
    'jquery',
    'qunit',
    '../NRMMapCache',
    'esri/layers/ArcGISTiledMapServiceLayer',
    'esri/geometry/Extent',
    'esri/SpatialReference',
    'esri/map',
    'module'
], function(
        $,
        QUnit,
        NRMMapCache,
        ArcGISTiledMapServiceLayer,
        Extent,
        SpatialReference,
        Map,
        module
        ) {
    return {
        run: function() {
            if (!QUnit.config.currentModule || QUnit.config.currentModule.name !== module.id) {
                // backwards-compatibility for early Starter Project implementation
                // DO NOT copy this into new tests, all new tests should assume the application is using latest Starter Project
                QUnit.module("nrm-map/NRMMapCache");
            }

            /**
             * 
             * @param {string} dbName
             * @param {string} tableName
             * @param {number} expectedCount - 999999 tests for > 0
             * @param {string} message
             * @returns {@exp;dfd@call;promise}
             */
            QUnit.assert.dbcount = function(dbName, tableName, expectedCount, message){
                var dfd = $.Deferred(), that = this,
                    db, countTransaction, countRequest, objectStore,
                    result, actual, expected = expectedCount,
                    request = indexedDB.open(dbName),
                    errorCallback = function(event) {
                        console.error('Test error', event);
                        return dfd.reject();
                    };
                request.onerror = errorCallback;
                request.onsuccess = function(event) {
                    db = event.target.result;
                    countTransaction = db.transaction([tableName], 'readonly');
                    objectStore = countTransaction.objectStore(tableName);
                    countRequest = objectStore.count();
                    countRequest.onerror = errorCallback;
                    countRequest.onsuccess = function() {
                        actual = countRequest.result;
                        if (expectedCount === 999999) {
                            expected = 'greater than zero';
                            result = (actual > 0);
                        } else {
                            result = (actual === expected);
                        }
                        that.push(result, actual, expected, message);
                        dfd.resolve();
                    };
                };
                return dfd.promise();
            };
            
            QUnit.test('NRMMapCache', function(assert) {
                //assert.expect(3);
                console.log('running NRMMapCache test');
                var tiledLayer = new ArcGISTiledMapServiceLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer');
                //window.nrmmap = {basemap: tiledLayer};
                var
                    extent = new Extent(-122.68,45.53,-122.45,45.60, new SpatialReference({ wkid:4326 })),
                    clearAsync = assert.async(),
                    initAsync = assert.async(),
                    mapAsync = assert.async(),
                    mapCache,
                    testDb, testRequest,
                    clearCallback = function() {
                        console.log('TEST 3 in clearCallback');
                        assert.ok(mapCache, 'clear');
                        $.when(assert.dbcount('nrmcachedb', 'tiles', 0, 'db count after clear')).done(function(){
                            clearAsync();
                            $.when(mapCache.cacheTilesForExtent(extent, 16, 18)).done(function() {
                                $.when(assert.dbcount('nrmcachedb', 'tiles', 999999, 'db count after caching tiles')
                                    ).done(function(){
                                        initAsync();
                                    }
                                );
                            });
                        });
                    },
                    initCallback = function() {
                        console.log('TEST 2 in initCallback');
                        assert.ok(mapCache, 'init');
                        mapCache.clear(clearCallback);
                    },
                    $mapDiv = $('<div id="map"></div>'),
                    map = new Map($mapDiv[0]);
                    
                map.on('load', function(){
                    console.log('TEST 1 before initLocalStorage');
                    assert.ok(map, 'map');
                    mapAsync();
                    mapCache = new NRMMapCache({layer: tiledLayer});
                    assert.ok(mapCache,'declare');
                    $.when(mapCache.initLocalStorage()).done(initCallback);
                });
                map.addLayer(tiledLayer);
            });
        }
    };
});