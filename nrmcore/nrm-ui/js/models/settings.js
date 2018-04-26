/**
 * @file The Settings module is a Backbone.Model that is customized to store user preferences in LocalStorage.
 * @see module:nrm-ui/models/settings
 */
/** 
 * @module nrm-ui/models/settings
 */
define(['backbone', '..', '../localStorage', 'underscore'], function(Backbone, Nrm, LocalStorage, _) {
    
    /**
     * Definition of known settings keys.
     * @typedef KnownSettings
     * @property {Boolean} [path] Set or restore the current route
     * @property {Boolean} [extent] Set or restore the map extent
     * @property {Boolean} [basemap] Set or restore the basemap
     * @property {Boolean} [dynamicLayers] Set or restore dynamic map layers
     * @property {Boolean} [graphicsLayers] Set or restore the graphics layers
     */
    
    
    return Nrm.Models.Settings = Backbone.Model.extend(/** @lends module:nrm-ui/models/settings.prototype */{
        // instance properties
        /**
         * Sets the URL root
         * @default
         * @type {string}
         * @see {@link http://backbonejs.org/#Model-urlRoot|Backbone.Model#urlRoot}
         */
        urlRoot: "api/setting",
        /**
         * The name of the id attribute
         * @default
         * @type {string}
         * @see {@link http://backbonejs.org/#Model-idAttribute|Backbone.Model#idAttribute}
         */
        idAttribute: 'key',
        /**
         * Generate a key (model id) from the url of the current page, or possibly a combination of model attributes
         * in some cases.
         * @returns {string}
         * The key to set.
         */
        _generateKey: function() {
            var url = this.get('_url');
            var id = this.get('id');
            // JS 3/27/15: window.location.origin doesn't work reliably in IE11
            var origin = window.location.origin || (window.location.protocol + "//" + 
                window.location.hostname + (window.location.port ? ':' + window.location.port: ''));
            var key = origin + location.pathname;
            if (key.indexOf('.htm') > -1 ) {
                key = key.replace('/' + _.last(key.split('/')),'');
            }
            if (id.indexOf(url) !== 0 && url.indexOf(id) !== 0)
                key = key + '_' + id;
            return key;
        },
        /**
         * Create a Settings model and load settings from LocalStorage.
         * @constructor
         * @alias module:nrm-ui/models/settings
         * @classdesc
         * Extends {@link http://backbonejs.org/#Model|Backbone.Model} to persist and restore user preferences in 
         * LocalStorage.
         * @returns {undefined}
         */
        initialize: function() {
            this.localStorage = new LocalStorage('settings');  //"Local";
            // JS 3/27/15: Nrm.app.mapView is loaded asynchronously, we can't capture a reference here
            //this.mapView = (Nrm.app && Nrm.app.mapView) ? Nrm.app.mapView : false;
            this.set('key',this._generateKey());
            this.idAttribute = 'key';
            this.id = this.get('key');
            var m = this.localStorage.find(this);

            // to force restore of settings, particularly path
            if (this.id.indexOf('manual') > -1) {
                /**
                 * Force restore of settings, particularly path
                 * @type {Boolean}
                 */
                this._force = true;
            }

            var that = this;
            if (m !== undefined) {
                _.each(m, function(value, key) {
                    if (m.hasOwnProperty(key))
                        that.set(key, value);
                });
            }
    //        var fPath = function(model, value, options){
    //            console.log('in fPath with model, value, options', [model, value, options]);
    //            if (value === undefined || value === 'auto') {
    //                //model.off('change:path');
    //                var s = (Backbone && Backbone.history.history.state !== null) ? Backbone.history.getFragment() : location.href;
    //                //model.set('path',s);
    //                //model.on('change:path', fPath);
    //                value = s;
    //            }
    //            console.log('model at end of fPath',model);
    //        };
    //        this.on('change:path', fPath);
        },
        /**
         * Default attribute values.
         * @type {Object}
         * @see {@link http://backbonejs.org/#Model-defaults|Backbone.Model#defaults}
         */
        defaults: {
          id: location.href
          ,_url: location.href
          ,_app: (Nrm.app && Nrm.app.attributes) ? Nrm.app.get('appName') : 'undefined'
        },    
    //    mapLoaded: function() {
    //        return this.mapView && this.mapView.mapControl && this.mapView.mapControl.map && this.mapView.mapControl.map.loaded;
    //    },
        /**
         * Set all known settings specified in the options
         * @param {module:nrm-ui/models/settings~KnownSettings} [opts] Settings keys to set, or set all known keys if 
         * this parameter is omitted.
         * @returns {undefined}
         */
        setAll: function(opts) {
          try {
            if (opts === undefined) {
                opts = {path: true,
                        extent:true, 
                        basemap:true, 
                        dynamicLayers:true, 
                        graphicsLayers:true};
            }
            var that = this;
            _.each(opts, function(value, key) {
                console.log('setAll',that, key, value);
                switch (key) {
                    case 'path':
                        if (value) 
                            that.setPath();
                        break;
                    case 'extent':
                    case 'basemap':
                    case 'dynamicLayers':
                    case 'graphicsLayers':
                        if (value) 
                            that.setMapSetting(key);
                        break;
                }
            });
          } catch (e) {
              console.log('error saving settings',e);
          }
        },
        /**
         * Restore all known settings.
         * @returns {undefined}
         */
        restoreAll: function(){
            this.restore();
        },
        /**
         * Restore all known settings specified in the options.
         * @param {module:nrm-ui/models/settings~KnownSettings} [opts] Settings keys to restore, or set all known keys 
         * if this parameter is omitted.
         * @returns {undefined}
         */
        restore: function(opts) {
            if (opts === undefined)
                opts = {path: true,
                        extent:true, 
                        basemap:true, 
                        dynamicLayers:true, 
                        graphicsLayers:true};
            var that = this;
            _.each(opts, function(value, key) {
                console.log('restore',that, key, value);
                if (value) {
                    switch (key) {
                        case 'path':
                            that.restorePath();
                            break;
                        case 'extent':
                            that.restoreExtent();
                            break;
                        case 'basemap':
                            that.restoreBasemap();
                            break;
                        case 'dynamicLayers':
                            that.restoreDynamicLayers();
                            break;
                        case 'graphicsLayers':
                            that.restoreGraphicsLayers();
                            break;
                    }
                }
            });
        },
        /**
         * Overrides the default parse implementation to return undefined for some reason.
         * @todo This seems odd, is this really what was intended?  This basically makes it impossible to fetch a model
         * from the server, which is not currently something we do with this model, and also prevents the default
         * behavior of the model constructor from working as expected.
         * @param {Object} response Server attributes
         * @returns {undefined}
         * @see {@link http://backbonejs.org/#Model-parse|Backbone.Model#parse}
         */
        parse: function(response) {
        },
        /**
         * No-op implementation of the validate function
         * @param {Object} attrs
         * @param {Object} options
         * @returns {undefined}
         * @see {@link http://backbonejs.org/#Model-validate|Backbone.Model#validate}
         */
        validate: function(attrs, options) {
        },
        /**
         * Sets the path setting from the hash fragment of the current page URL or an arbitrary value.  
         * @todo The "auto" setting does not work correctly if HTML5 pushstate functionality is enabled.
         * @param {string} [value="auto"] The path value to set, or "auto" to indicate the path should be set from 
         * the current hash fragment.
         * @returns {undefined}
         */
        setPath: function(value){
            console.log('in setPath with value: ', value);
            if (value === undefined || value === 'auto')
                value = (Backbone && Backbone.history.history.state !== null) ? Backbone.history.getFragment() : location.hash; //location.href;
            this.set('path', value);
        },
        /**
         * Set one of the map settings to a value derived from current state of the map or an arbitrary value.
         * @param {string} key One of the known map-related keys 
         * @param {*} [value="auto"] The value, or the string "auto" to use the default value derived from the map.
         * @returns {undefined}
         */
        setMapSetting: function(key, value) {
            if (Nrm.app && Nrm.app.mapView) {
                if (value === undefined || value === 'auto')
                    value = Nrm.app.mapView.getSetting(key);
                if (value !== undefined)
                    this.set(key, value);
            }
        },
        /**
         * Set the extent setting.
         * @param {external:module:esri/geometry/Extent} value The map extent, in geographic coordinates.
         * @returns {undefined}
         */
        setExtent: function(value){
            this.setMapSetting('extent', value);
        },
        /**
         * Set the basemap setting.
         * @deprecated The base map is now treated like an ordinary layer.
         * @param {string} value The URL of the default basemap
         * @returns {undefined}
         */
        setBasemap: function(value){
            this.setMapSetting('basemap', value);
        },
        /**
         * Set the dynamic layers.
         * @param {module:nrm-map/views/mapView~DynamicMapLayerSettings[]} value The dynamic map layers.
         * @returns {undefined}
         */
        setDynamicLayers: function(value){
            this.setMapSetting('dynamicLayers', value);
        },
        /**
         * Set the graphics layers.
         * @todo Some feature layers might contain enough data to exceed the LocalStorage quota.  If we are serious 
         * about restoring these layers, it will most likely be necessary to come up with a different solution, for
         * example, using IndexedDB, which might lead to deprecation of this method since the Settings model is 
         * specialized for synchronous storage in LocalStorage.
         * @param {module:nrm-map/views/mapView~GraphicsLayerSettings[]} value The graphics layers.
         * @returns {undefined}
         */
        setGraphicsLayers: function(value){
            this.setMapSetting('graphicsLayers', value);
        },
        /*setExtent: function(value){
            if (this.mapLoaded()) {
                if (value === undefined || value === 'auto')
                    value = this.mapView.getCurrentExtent();
                console.log('in setExtent with value: ', value);
                this.set('extent', value);
            }
        },
        setBasemap: function(value){
            if (this.mapLoaded()) {
                 if (value === undefined || value === 'auto')
                    value = this.mapView.mapControl.basemap.url;
                console.log('in setBasemap with value: ', value);
                this.set('basemap', value);
            }
        },
        setDynamicLayers: function(value){
            try {
            if (this.mapLoaded()) {
                if (value === undefined || value === 'auto') {
                    var i, max, saveOptions, nrmOptions, prop;
                    var illegalProperties = ['featureLayer', 'nrmmap'];
                    var dmls = this.mapView.mapControl.mapSupport.dynamicMapLayers;
                    value = new Array();
                    for (i = 0, max = dmls.length; i < max; i += 1) {
                        saveOptions = {};
                        nrmOptions = dmls[i].nrmOptions;
                        for (prop in nrmOptions) {
                            if (illegalProperties.indexOf(prop) == -1) {
                                saveOptions[prop] = nrmOptions[prop];
                            }
                        }
                        var url = (nrmOptions.url) ? nrmOptions.url : dmls[i].url;
                        if (url !== null) value.push({ url: url, nrmOptions: saveOptions });
                    }
                }
                console.log('in setDynamicLayers with value: ', value);
                this.set('dynamicLayers', value);
            }
            } catch (e) {
                console.log("Error in Nrm.Models.Settings.setDynamicLayers", e);
            }
        },
        setGraphicsLayers: function(value){
            try {
            if (this.mapLoaded()) {
                if (value === undefined || value === 'auto') {
                    var layer, saveOptions, nrmOptions, prop, map = this.mapView.mapControl.map;
                    var illegalProperties = ['featureLayer', 'nrmmap'];
                    value = new Array();
                    for(var i = 0; i < map.graphicsLayerIds.length; i++) {
                        layer = map.getLayer(map.graphicsLayerIds[i]);
                        if (layer.url !== null || (layer.nrmOptions && layer.nrmOptions.persistLayer === false))
                            continue;

                        saveOptions = {};
                        nrmOptions = layer.nrmOptions;
                        for (prop in nrmOptions) {
                            if (illegalProperties.indexOf(prop) == -1) {
                                saveOptions[prop] = nrmOptions[prop];
                            }
                        }
                        layer.nrmOptions = saveOptions;
                        // featureLayer.toJson() serializes a featureCollection
                        // graphicsLayer doesn't have a toJson method, so we'll just get its graphics
                        try {
                            value.push({ id: layer.id, featureCollection: layer.toJson(), nrmOptions: saveOptions });
                        }
                        catch (ex) {
                            var j, max, graphics = new Array();
                            for (j = 0, max = layer.graphics.length; j < max; j += 1) {
                                graphics.push(layer.graphics[j].toJson());
                            }
                            value.push({ id: layer.id, graphics: graphics, nrmOptions: saveOptions });
                        }
                    }
                }
                console.log('in setGraphicsLayers with value: ', value);
                this.set('graphicsLayers', value);
            }
            } catch (e) {
                console.log("Error in Nrm.Models.Settings.setGraphicsLayers", e);
            }
        },*/
        /**
         * Restore the path setting.
         * @returns {undefined}
         */
        restorePath: function(){
            try {
                 //var path = obj.replace(root,'').replace('/index.html','').replace('index.html').replace('#', '');
                 var path = this.get('path');
                 if (path) {
                    console.log("Do we restore this path?",path,location.href, Nrm.router);
                    if (this._force || (location.hash === "" && path && path.length > 1 && path !== location.href && Nrm.router)) {
                       path = path.substring(1);
                       console.log("... restoring path", path);
                       Nrm.router.navigate(path, { trigger: true, replace: true });
                    }
                 }
             } catch (ex) {
                 console.log("Error restoring PATH (" + path + ")", ex);
             }
        },
        /**
         * Restore the extent setting.
         * @returns {undefined}
         */
        restoreExtent: function() {
            if (Nrm.app && Nrm.app.mapView) {
                Nrm.app.mapView.restoreExtent(this.get('extent'));
            }
        },
        /**
         * Restore the basemap setting
         * @deprecated This setting doesn't make sense now that we treat the basemaps like any other layer.
         * @returns {undefined}
         */
        restoreBasemap: function() {
            if (Nrm.app && Nrm.app.mapView) {
                 Nrm.app.mapView.restoreBasemap(this.get('basemap'));
            }
        },
        /**
         * Restore the dynamic map layers.
         * @returns {undefined}
         */
        restoreDynamicLayers: function() {
            if (Nrm.app && Nrm.app.mapView) {
                 Nrm.app.mapView.restoreDynamicLayers(this.get('dynamicLayers'));
            }
        },
        /**
         * Restore the graphics layers.
         * @todo This may become deprecated if we move graphics layer persistence to a different storage type with
         * larger quota.
         * @returns {undefined}
         */
        restoreGraphicsLayers: function() {
            if (Nrm.app && Nrm.app.mapView) {
                 Nrm.app.mapView.restoreGraphicsLayers(this.get('graphicsLayers'));
            }
        },
        /*restoreExtent: function() {
            try {
                if (this.mapLoaded()){
                    var extent = this.get('extent');
                    if (extent) {
                        extent = new esri.geometry.Extent(extent);
                        console.log('attempting to restore extent', extent);
                        this.mapView.setCurrentExtent({extent: extent});
                    }
                }
            } catch (e) {
                console.log('Error restoring EXTENT', e);
            }
        },
        restoreBasemap: function() {
            try {
                if (this.mapLoaded()){
                    var basemap = this.get('basemap');
                    if (basemap) 
                        this.mapView.mapControl.setBaseMap(basemap);
                }
            } catch (e) {
                console.log('Error restoring BASEMAP', e);
            }
        },
        restoreDynamicLayers: function() {
            try {
                if (this.mapLoaded()){
                    var url, layer, addIt, j, jMax, k;
                    var obj = this.get('dynamicLayers');
                    if (obj) {
                        var map = this.mapView.mapControl.map;
                        for (j = 0, jMax = obj.length; j < jMax; j++) {
                            url = obj[j].url;
                            addIt = true;
                            for(k = 0; k < map.layerIds.length; k++) {
                                layer = map.getLayer(map.layerIds[k]);
                                if (layer.url.substr(0,layer.url.toLowerCase().indexOf('mapserver')) === url.substr(0,url.toLowerCase().indexOf('mapserver'))) {
                                    addIt = false;
                                    break;
                                }
                            }
                            if (addIt) this.mapView.mapControl.setDynamicMapLayer(url, 1, obj[j].nrmOptions);
                        }
                    }
                }
            } catch (e) {
                console.log('Settings: Error restoring DynamicLayers', e);
            }
        },
        restoreGraphicsLayers: function() {
            try {
                if (this.mapLoaded()){
                    var layer, saved, k, kMax, j, jMax;
                    var obj = this.get('graphicsLayers');
                    if (obj) {
                        var map = this.mapView.mapControl.map;
                        for (j = 0, jMax = obj.length; j < jMax; j += 1) {
                            saved = obj[j];
                            if (saved.featureCollection) {
                                layer = new esri.layers.FeatureLayer(saved.featureCollection, {mode: esri.layers.FeatureLayer.MODE_SNAPSHOT, id: saved.id});
                            } else if (saved.graphics) {
                                layer = new esri.layers.GraphicsLayer($.extend({ id: saved.id }, saved.nrmOptions));
                                for (k = 0, kMax = saved.graphics.length; k < kMax; k += 1) {
                                    layer.add(new esri.Graphic(saved.graphics[k]));
                                }
                            }
                            if (layer.graphics.length > 0 && layer.graphics[0].geometry !== null) {
                                layer.nrmOptions = obj[j].nrmOptions;
                                dojo.connect(layer, "onClick", nrmmap._graphicsLayerClick);
                                map.addLayer(layer);
                                if (saved.id === "nrmGraphicsLayer") {
                                    nrmmap.mapSupport.graphicsLayer = layer;
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.log('Settings: Error restoring GraphicsLayers',e);
            }
        },
        */
        /**
         * Overrides {@link http://backbonejs.org/#Model-save|Backbone.Model#save} to interact directly with the
         * {@link module:nrm-ui/localStorage|Nrm.LocalStorage} API directly instead of the usual Backbone.sync method.
         * @param {Object} attributes Parameter inherited from Backbone, but not used here.
         * @param {Object} options Parameter inherited from Backbone, but not used here.
         * @returns {undefined}
         */
        save: function(attributes, options) {
            var s = this.localStorage;
            //s.set(this.get('id'), this);
            s.update(this);
        }, 
        /**
         * Overrides {@link http://backbonejs.org/#Model-destroy|Backbone.Model#destroy} to interact directly with the
         * {@link module:nrm-ui/localStorage|Nrm.LocalStorage} API directly instead of the usual Backbone.sync method.
         * @param {Object} options Parameter inherited from Backbone, but not used here.
         * @returns {undefined}
         */
        destroy: function(options){
            this.localStorage.destroy(this);
        }



    //    sync: function(method, model, options){
    //        this.localStorage.sync(method, model, options);
    //    }

    },
    /** @lends module:nrm-ui/models/settings */
    {
        // class properties
        /**
         * Known attribute names.
         * @type {Array.<Object.<string, string>>}
         */
        properties: [
            {name:"id"},
            {name:"path"},
            {name:"extent"},
            {name:"basemap"},
            {name:"dynamicLayers"},
            {name:"graphicsLayers"}
        ]
    });
});
