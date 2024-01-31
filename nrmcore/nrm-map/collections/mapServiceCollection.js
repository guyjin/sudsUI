/**
 * @file The MapServiceCollection extends {@link http://backbonejs.org/#Collection|Backbone.Collection} to provide a 
 * base collection that supports loading LOV data from ArcGIS Server map services and other external services.
 */
define([
    'require', 
    'backbone', 
    'nrm-ui', 
    'jquery', 
    'underscore', 
    'esri/tasks/QueryTask',
    'esri/tasks/query',
    'esri/geometry/jsonUtils'
], function (require, Backbone, Nrm, $, _, QueryTask, Query, geometryJsonUtils) {
    /** 
     * Extends {@link http://backbonejs.org/#Collection|Backbone.Collection} to provide support for loading external 
     * services as an LOV.
     * @exports nrm-map/collections/mapServiceCollection
     */
    var MapServiceCollection = Nrm.Collections.MapServiceCollection = Backbone.Collection.extend(
        /**@lends module:nrm-map/collections/mapServiceCollection.prototype*/
        {
            /**
             * Create a new instance of the MapServiceCollection.  
             * @constructor
             * @alias module:nrm-map/collections/mapServiceCollection
             * @classdesc
             *   A Backbone collection for loading from an external service, with dynamic URL determined by querying
             *   another service.  The default external service behavior is tailored for an ESRI ArcGIS Server map 
             *   service, but implementations may override the default behavior to load from any kind of service.
             * @param {Array} [models] Inherited from Backbone Collection constructor.
             * @param {Object} [options] Inherited from Backbone Collection constructor.
             * @see {@link http://backbonejs.org/#Collection-constructor|Backbone Collection constructor / initialize}
             */
            constructor : function MapServiceCollection() {
                this.loading = false;
                return Backbone.Collection.apply(this, arguments);
            },
            /**
             * Schema configuration for the REST API service that provides URLs for external services.  The default 
             * configuration uses default context configuration key "lov/service" and extends the context to ensure the
             * loadType is "auto" and ajax options disable global events to prevent showing the global ajax progress
             * indicator. 
             * @type {module:nrm-ui/models/application~SchemaConfig}
             */
            servicesOptions: {
                refType: 'lov/service',
                context: {
                    loadType: 'auto',
                    ajaxOptions: {
                        global: false
                    }
                }
            },
            /**
             * Indicates that the default fetch implementation should use the 
             * {@link module:nrm-map/collections/mapServiceCollection#ajaxQuery} method instead of ArcGIS API.
             * @default
             * @type {Boolean}
             */
            useAjax: false,
            //timeout: 30000,
            /**
             * Error log message.
             * @default
             * @type {String}
             */
            errorMessage: 'Failed to load data from service.',
            /**
             * Error info object to pass to log service
             * @type {Object}
             */
            errorInfo: {'DOMAIN': 'EDW'},
            /**
             * URL of the mid-tier log service, may be set to null or empty string to disable mid-tier logging.
             * @default
             * @type {String}
             */
            logUrl: 'api/message/log',
            //nameAttr: 'name',
            /**
             * Determines the URL for the collection based on the service entry associated with this collection.
             * @return {string}
             * @see {@link http://backbonejs.org/#Collection-url|Backbone.Collection#url}
             */
            url: function () {
                var url;
                if (this.service) {
                    url = this.service.get('uri');
                    if (this.service.get('useProxy') === 'Y') {
                        url = require.toUrl('../proxy.jsp?') + url;
                    }
                }
                return url;
            },
            /**
             * Find the service entry in a collection of services.
             * @param {external:module:backbone.Collection} collection The collection providing list of service URLs.
             * @returns {?external:module:backbone.Model}
             * The Backbone model representing the service entry that provides the URL for this collection, returns null
             * if service was not found.
             */
            findService: function (collection) {
                /**
                 * The information to use as a predicate to find the service entry, may be a string representing the
                 * value of "name" attribute, or an object with attribute values identifying the service entry.  This
                 * property MUST BE DEFINED in subtypes or the service URL cannot be determined.
                 * @name module:nrm-map/collections/mapServiceCollection#serviceInfo
                 * @type {String|Object}
                 */
                var serviceInfo = this.serviceInfo;
                if (_.isString(serviceInfo)) {
                    return collection.findWhere({name: serviceInfo});
                } else if (_.isObject(serviceInfo)) {
                    return collection.findWhere(serviceInfo);
                } else {
                    return null;
                }
            },            
            /**
             * Service name, used in error log messages.
             * @param {external:module:backbone.Collection} collection The collection providing list of service URLs.
             * @returns {?String}
             * The name attribute of the service entry for this collection.
             */
            getServiceName: function() {
                if (_.isString(this.serviceInfo)) {
                    return this.serviceInfo;
                } else if (_.isObject(this.serviceInfo)) {
                    return this.serviceInfo.name;
                } else {
                    return null;
                }
            },
            /**
             * Default query options to set as properties on the Query if the services uses ArcGIS API for queries.
             * @type {Object}
             * @see {@link https://developers.arcgis.com/javascript/3/jsapi/query-amd.html|Query properties}
             */
            queryDefaults: {
                returnGeometry: false
            },
            /**
             * A placeholder response to populate the collection if the service request fails.  Default is an empty 
             * array, but may be populated with a placeholder object if required, or set to null if the failure should
             * propagate as an error.
             * @type {Array.<Object>}
             */
            errorResponse: [],
            /**
             * Extract query params from options passed to fetch method.
             * @param {Object} options
             * @param {Object} [options.params] Query parameters.
             * @returns {Object}
             * Converted options hash.
             */
            parseOptions: function (options) {
                options = _.extend({}, options);
                if (!this.useAjax && this.translation) {
                    options.params = options.params || {};
                    options.params.outFields = _.keys(this.translation);
                }
                return options;
            },
            /**
             * Abort the query.
             * @returns {undefined}
             */
            cancelQuery: function() {
                if (this.currentRequest) {
                    if (_.isFunction(this.currentRequest.cancel)) {
                        this.currentRequest.cancel('abort');
                    } else if (_.isFunction(this.currentRequest.abort)) {
                        this.currentRequest.abort();
                    }
                    this.currentRequest = null;
                }
            },
            /**
             * Default implementation for services that do not use ArcGIS API, delegates to 
             * {@link http://backbonejs.org/#Collection-fetch|Backbone.Collection#fetch}.
             * @param {Object} options Options to pass to the AJAX request.
             * @returns {external:module:jquery~jqXHR}
             * The request object.
             */
            ajaxQuery: function (options) {
                return this.currentRequest = Backbone.Collection.prototype.fetch.call(this, options);
            },
            /**
             * Default implementation for services that use ArcGIS API map service query.
             * @param {Object} options Fetch optoins
             * @param {Object} options.params The 
             * {@link https://developers.arcgis.com/javascript/3/jsapi/query-amd.html|query parameters}, must be 
             * provided with at least one parameter that is a supported predicate in ArcGIS API: where, text or geometry.
             * @param {Boolean} [options.reset] Indicates that the collection be loaded with reset method instead of set
             * method (recommended).
             * @param {Function} [options.success] Success callback that will be called using the Backbone success
             * callback signature (model, response, options).
             * @param {Function} [options.error] Error callback that will be called using the Backbone error callback 
             * signature (model, response, options).
             * @returns {external:module:jquery~Promise}
             * A JQuery Promise that will be resolved or rejected depending on success or failure of the ArcGIS API
             * query.
             */
            esriQuery: function (options) {
                var url, queryTask, query, dfd = $.Deferred(), onSuccess, onFail = _.bind(function(error) {
                    if (_.isFunction(options.error)) {
                        options.error(this, error, options);
                    }
                    this.trigger('error', this, error, options);
                    dfd.rejectWith(this, arguments);
                }, this);
                //setTimeout(_.bind(function() {
                try {
                    // validate params... at least one of the three query task filter properties is required.
                    if (options.params == null || _.isEmpty(_.pick(options.params, 'where', 'text', 'geometry'))) {
                        throw new Error('At least one query filter is required.');
                    }
                    // validate url...
                    url = _.result(this, 'url');
                    if (!url) {
                        throw new Error('At least one query filter is required.');
                    }
                    if (options.params.geometry) {
                        options.params.geometry = geometryJsonUtils.fromJson(options.params.geometry);
                    }
                    queryTask = new QueryTask(url);
                    query = new Query();
                    _.defaults(_.extend(query, options.params), _.result(this, 'queryDefaults'));
                    onSuccess = _.bind(function(results) {
                        var method = options.reset ? 'reset' : 'set';
                        this[method](this.parse(results), _.extend({add: true, remove: true, merge: false}, options));
                        if (_.isFunction(options.success)) {
                            options.success(this, results, options);
                        }
                        this.trigger('sync', this, results, options);
                        dfd.resolveWith(this, arguments);
                    }, this);
                    
                    /**
                     * The current request object.
                     * @name module:nrm-map/collections/mapServiceCollection#currentRequest
                     * @type {?(external:module:dojo/Deferred|external:module:jquery~jqXHR)}
                     */
                    this.currentRequest = queryTask.execute(query, onSuccess, onFail);
                } catch (error) {
                    onFail(error);
                }
            //}, this), 5000);
                return dfd.promise();
            },
            /**
             * Overrides {@link http://backbonejs.org/#Collection-parse|Backbone.Collection#parse} to translate server
             * attributes into model attributes.
             * @param {Array.<Object>} resp
             * @returns {Array.<Object>}
             * The array of model attributes to be added to the collection.
             */
            parse: function(resp) {
                /**
                 * A hash of server attribute names to translate to model attribute names for each item in a response,
                 * used in the default parse override.
                 * @name module:nrm-map/collections/mapServiceCollection#translation
                 * @type {Object}
                 */
                var translation = this.translation;
                function translate(item) {
                    var ret = {};
                    _.each(translation, function(to, from) {
                        ret[to] = item[from];
                    });
                    return ret;
                }
                if (resp.features) {
                    return _.map(resp.features, function(feature) {
                        if (translation) {
                            return translate.call(this, feature.attributes);
                        } else {
                            return feature.attributes;
                        }
                    }, this);
                } else if (translation) {
                    return _.map(resp, translate, this);
                } else {
                    return resp;
                }
            },
            /**
             * Overrides {@link http://backbonejs.org/#Collection-fetch|Backbone.Collection#fetch} to provide an 
             * implementation that loads from a URL determined by querying another service, then call either the ArcGIS
             * query API or JQuery AJAX.  Also supports aborting previous fetch if it is called again before the first
             * call completes.
             * @param {Object} options Options to pass to underlying query mechanism.
             * @returns {external:module:jquery~Promise}
             */
            fetch: function (options) {
                var dfd, result, success, error, onFail = _.bind(function (model, resp) {
                    if (resp && (resp.statusText  === 'abort' || resp.message === 'Request canceled')) {
                        // ajax request was aborted due to second fetch call before first has completed.
                        console.log('MapServiceCollection request aborted.');
                        return;
                    }
                    if (!resp) {
                        resp = model;
                    }
                    var callback, errorResponse = _.result(this, 'errorResponse');
                    if (errorResponse) {
                        var method = options.reset ? 'reset' : 'set';
                        // pretend it was a success to populate the value with a placeholder
                        this[method](_.isArray(errorResponse) ? errorResponse : [errorResponse]);
                        callback = options.success;
                    } else {
                        callback = error;
                    }
                    if (_.isFunction(callback)) {
                        callback(this, resp, options);
                    }
                    if (dfd && errorResponse) {
                        dfd.resolveWith(this, arguments);
                    } else if (dfd) {
                        dfd.rejectWith(this, arguments);
                    }
                    this.logError(resp);
                }, this);
                options = this.parseOptions(options) || {};
                error = options.error;
                success = options.success;
                
                function doQuery(options) {
                    this.cancelQuery();
                    var result;
                    options.error = onFail;
                    if (this.useAjax) {
                        result = this.ajaxQuery(options);
                    } else {
                        result = this.esriQuery(options);
                    }
                    return result.always(_.bind(function() {
                        this.currentRequest = null;
                        this.loading = false;
                    }, this));
                }
                /**
                 * Indicates whether the collection is loading
                 * @name module:nrm-map/collections/mapServiceCollection#loading
                 * @type {(external:module:jquery.Deferred|Boolean)}
                 */
                this.loading = dfd = $.Deferred();
                options.success = function () {
                    if (_.isFunction(success)) {
                        success.apply(this, arguments);
                    }
                    dfd.resolveWith(this, arguments);
                };
                if (this.service) {
                    result = doQuery.call(this, options);
                } else {
                    $.when(this.loadServices(this)).done(function (collection) {
                        /**
                         * The service entry, typically lazy-loaded from the list of services when the collection is
                         * fetched.
                         * @name module:nrm-map/collections/mapServiceCollection#service
                         * @type {?(external:module:backbone.Model)}
                         */
                        this.service = this.findService(collection);
                        if (this.service) {
                            doQuery.call(this, options);
                        } else {
                            // call onFail with arguments approximating the normal Backbone error callback.
                            var error = {
                                message: 'Service entry not found for name: ' + this.getServiceName()
                            };
                            onFail(this, { 
                                statusText: 'error',
                                responseText: JSON.stringify(error),
                                responseJSON: error
                            });
                        }
                    }).fail(onFail);
                    result = dfd.promise();
                }
                this.trigger('loading', this, options);
                return result;
            },
            /**
             * Log an error message, possibly calling a mid-tier service if configured.
             * @param {Object} error
             * @returns {undefined}
             */
            logError: function(error) {
                var d = new Date(),
                    n = d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1).toString()).slice(-2) + '-' +
                    ('0' + d.getUTCDate()).slice(-2),
                    msg = _.isString(error) ? error : (error && error.message),
                    log = {
                        text: this.errorMessage || msg || 'Unspecified service error.',
                        date: n,
                        type: 'ERROR',
                        info: msg ? _.extend({}, this.errorInfo, { message: msg }) : this.errorInfo
                    },
                    info = [log];
                if (this.logUrl && navigator.onLine !== false) {
                    Backbone.ajax({
                        url: this.logUrl,
                        type: 'POST',
                        //async: false,
                        data: JSON.stringify(info),
                        contentType: 'application/json'
                    });
                }
                console.error(msg, log);
            },
            /**
             * Load the list of services, uses 
             * {@link module:nrm-ui/models/application#getCollection|Nrm.app.getCollection} to ensure the list of 
             * services is only loaded once.
             * @param {*} caller Context for "this" keyword for deferred callbacks.
             * @returns {external:module:jquery~Promise}
             * A JQuery promise object that will be resolved or rejected when the list of services has loaded or fails.
             */
            loadServices: function (caller) {
                var dfd = $.Deferred();
                caller = caller || this;
                function onFail() {
                    dfd.rejectWith(caller, arguments);

                }
                $.when(Nrm.app.getContext({apiKey: this.servicesOptions.refType}, this)).done(function (context) {
                    if (this.servicesOptions.context) {
                        context = $.extend({}, context, this.servicesOptions.context);
                    }
                    $.when(Nrm.app.getCollection(context, null, this)).done(function (collection) {
                        dfd.resolveWith(caller, [collection]);
                    }).fail(onFail);
                }).fail(onFail);
                return dfd.promise();
            }
        });
    return MapServiceCollection;
});