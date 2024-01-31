/**
 * @file Asynchronous cache using IndexedDB (Nrm.LocalDB) for data storage
 * @see module:nrm-map/AsynchronousCache
 */
/** 
 * @module nrm-map/AsynchronousCache
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

// This is an asynchronous cache
// http://msdn.microsoft.com/en-us/magazine/gg723713.aspx

// Notes:
// http://stackoverflow.com/questions/7145514/whats-the-purpose-of-starting-semi-colon-at-beginning-of-javascript

// History:
// NRM ported and modified in 2014.
// 10/27/2015 ebodin Finished AMD port, refactored with deferreds and properties to eliminate some globals.
// 5/18/2016 http://teamforge.fs.usda.gov/sf/go/artf54311 Cache map tiles in IndexedDB

;
(function(window, undefined) {
    define([
        'jquery',
        'underscore',
        'backbone',
        'nrm-ui/localDB'
    ], function(
            $,
            _,
            Backbone,
            LocalDB
            ) {
            /**
             * 
             * @param {Object} [options]
             * @param {number} [options.dbCacheSizeInMB=41] 
             * @param {string} [options.dbName="nrmcachedb"]
             * @param {string} [options.dbVersion="1.0"]
             * @param {string} [options.dbDescription="NRM database cache"]
             * @param {string} [options.message="Map cache for NRM applications"]
             * @param {boolean} [options.compression=true]
             */
            var AsynchronousCache = function(options) {
                this.options = options;
                this.error = false;
                this.errorMessages = [];
            };

            AsynchronousCache.prototype = {
                defaults: {
                    dbCacheSizeInMB: 41, // was 20
                    dbName: "nrmcachedb", // Can be configured for multiple caches.
                    dbVersion: "1.0",
                    dbDescription: "NRM database cache",
                    message: "Map cache for NRM applications",
                    compression: true
                },
                /**
                 * Initialize cache. Must run to be functional.
                 * @returns {@exp;dfd@call;promise}
                 */
                init: function() {
                    var dfd = $.Deferred(),
                        that = this;
                    try {
                        this.config = _.defaults(this.options || {}, this.defaults);
                        if (!this.db) {
                            try {
                                    var errback = function(err){
                                        console.error('Error in AsynchronousCache.init errback', err);
                                        dfd.reject();
                                    },
                                    initCallback = function(database){
                                        that.db = database;
                                        that.db.tableName = 'tiles';
                                        dfd.resolve();
                                    };
                                var config = {context:{tiles:{noObjectStore:false}}};
                                $.when(LocalDB.initDatabase(this.config.dbName, config)).done(initCallback).fail(errback);
                                //$.when(LocalDB.initDatabase(this.config.dbName)).done(initCallback);
                            } catch (e) {
                                console.error('Error in AsynchronousCache opening database', e);
                                dfd.reject();
                            }
                        }
                    } catch (e) {
                        dfd.reject();
                        console.error('Error in AsynchronousCache init', e);
// <editor-fold defaultstate="collapsed" desc="history">
// During development we chased this error for several days.  We did not find a solution, but
// we did find a work-around at http://stackoverflow.com/questions/9843927/ipad-safari-ios-security-err-dom-exception-18-when-accessing-document-cookie
// The "Force close" operation is completed by closing the app, double-clicking the home button,
// holding down the Safari icon and then tapping the red close button.
// Similar errors at http://stackoverflow.com/questions/13070042/security-err-dom-exception-18-opendatabase-using-phonegap?rq=1
// and http://stackoverflow.com/questions/10005811/phonegap-ios-dom-exception-18?rq=1
// </editor-fold>
                        if (/SECURITY_ERR.*18/.test(e.message)) {
                            var s = 'You have encountered an iOS-specific error. \n Force close the browser and restart.';
                            throw new Error(s + ' Error detail: ' + e.message);
                        } else {
                            throw e;
                        }
                    }
                    return dfd.promise();
                },
                _compress: function(s) {
                    try {
                        // http://labs.ft.com/2012/06/text-re-encoding-for-optimising-storage-capacity-in-the-browser/
                        var i, l, out = '';
                        if (s.length % 2 !== 0)
                            s += ' ';
                        for (i = 0, l = s.length; i < l; i += 2) {
                            out += String.fromCharCode((s.charCodeAt(i) * 256) + s.charCodeAt(i + 1));
                        }

                        // Add a snowman prefix to mark the resulting string as encoded (more on this later)
                        return String.fromCharCode(9731) + out;
                    } catch (e) {
                        console.warn('Error in AsynchronousCache.prototype._compress', e);
                    }
                },
                _decompress: function(s) {
                    try {
                        // http://labs.ft.com/2012/06/text-re-encoding-for-optimising-storage-capacity-in-the-browser/
                        var i, l, n, m, out = '';

                        // If not prefixed with a snowman, just return the (already uncompressed) string
                        if (s.charCodeAt(0) !== 9731)
                            return s;

                        for (i = 1, l = s.length; i < l; i++) {
                            n = s.charCodeAt(i);
                            m = Math.floor(n / 256);
                            out += String.fromCharCode(m, n % 256);
                        }
                        return out;
                    } catch (e) {
                        console.warn('Error in AsynchronousCache.prototype._decompress', e);
                    }
                },
                put: function(key, value, callback) {
                    //console.log('AsynchronousCache.put ' + key, this.db);
                    try {
                        // This is asynchronous. Assumes "value" is a string with normal ASCII characters
                        // Callback returns true or false depending on insert success
                        var compressedValue = (this.config.compression) ? this._compress(value) : value,
                            model = new Backbone.Model({id: key, v: compressedValue}),
                            successCallback = function(){
                                if (_.isFunction(callback))
                                    callback(true);
                            },
                            errorCallback = function(err){
                                if (_.isFunction(callback))
                                    callback(err);
                            };
                        //model.localStorage = this.db;
                        
                        this.db.create(model, successCallback, errorCallback);
                    } catch (e) {
                        console.warn('Error in AsynchronousCache.prototype.put', e);
                    }
                },
                get: function(key, callback) {
                    //console.log('AsynchronousCache.get ' + key, this.db);
                    try {
                        var result,
                            that = this,
                            errorCallback = function(err) {
                                console.warn('AsynchronousCache.get error for ' + key, err);
                            },
                            successCallback = function(tx, data) {
                                //result = data.rows[0] && data.rows[0].v;
                                result = data.result && data.result.v;
                                if (result && that.config.compression)
                                    result = that._decompress(result);
                                if (_.isFunction(callback))
                                    callback(result);
                            },
                            model = new Backbone.Model({id: key});
                        this.db.find(model, successCallback, errorCallback);
                    } catch (e) {
                        console.warn('Error in AsynchronousCache.prototype.get', e);
                    }
                },
                remove: function(key, callback) {
                    try {
                        var successCallback = function(){
                                if (_.isFunction(callback))
                                    callback(true);
                            },
                            errorCallback = function(err){
                                if (_.isFunction(callback))
                                    callback(err);
                            };
                        this.db.destroy({id: key}, successCallback, errorCallback);
                    } catch (e) {
                        console.warn('Error in AsynchronousCache.prototype.remove', e);
                    }
                },
                clear: function(callback) {
                    try {
                        this.db.clear(callback);
                    } catch (e) {
                        console.error('Error in AsynchronousCache.prototype.clear', e);
                    }
                },
                count: function(callback) {
                    try {
                        var successCallback = function(val) {
                            if (_.isFunction(callback))
                                callback(val);
                        };
                        this.db.count(successCallback);
                    } catch (e) {
                        console.warn('Error in AsynchronousCache.prototype.count', e);
                    }
                },
                size: function(callback) {
                    try {
                        console.warn('AsynchronousCache.size is not implemented');
                        callback(0);
                    } catch (e) {
                        console.warn('Error in AsynchronousCache.prototype.size', e);
                    }
              },
                getURLs: function(callback) {
                    var result = {rows: []};
                    console.warn('NOT IMPLEMENTED: AsynchronousCache.getURLs');
                    callback(result);
                },
                cacheSizeInMB: function() {
                    return this.config.dbCacheSizeInMB;
                }


            };
            AsynchronousCache.defaults = AsynchronousCache.prototype.defaults;

            //_nrm.namespace("utils").AsynchronousCache = AsynchronousCache;
        return AsynchronousCache;
    });
})(typeof(window) === "object" ? window : this);