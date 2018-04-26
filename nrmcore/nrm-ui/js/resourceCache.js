/**
 * @file Low-level API that provides helper functions for asynchronous operations.
 * @see module:nrm-ui/resourceCache
 */
/**
 * Low-level API that provides helper functions for asynchronous operations.  Mostly intended for internal use in other 
 * UI Core modules at this point, while application developers will usually interact with higher-level components that 
 * might use this API internally.
 * @module nrm-ui/resourceCache
 * @borrows module:nrm-ui/views/restoreLoginView.restoreLogin as restoreLogin
 */
define(['jquery', 'underscore', 'backbone', '.', './views/restoreLoginView'], 
        function($, _, Backbone, Nrm, RestoreLoginView) {

    function resolve(dfd, data, context) {
        if (context) {
            dfd.resolveWith(context, [data]);
        } else {
           dfd.resolve(data);
        }
        return dfd.promise();
    }

    function reject(dfd, data, context) {
        if (context) {
            dfd.rejectWith(context, [data]);
        } else {
           dfd.reject(data);
        }
        return dfd.promise();
    }
    function resolveWithCallback(dfd, callback, data, response, options, context) {
        if (callback) {
            callback.call(context || this, data, response, options);
        }
        if (context) {
            dfd.resolveWith(context, [data, response, options]);
        } else {
           dfd.resolve(data, response, options);
        }
        return dfd.promise();
    }
    function rejectWithCallback(dfd, callback, data, response, options, context) {
        if (!response && data)
            response = data.response;
        if (callback) {
            callback.call(context || this, data, response, options);
        }
        if (context) {
            dfd.rejectWith(context, [data, response, options]);
        } else {
           dfd.reject(data, response, options);
        }
        return dfd.promise();
    }
    function normalizeErrorInfo(msg, data, resp, options) {
        function getMessageFromResponse() {
            if (!resp) {
                return "An error occurred.";
            } else if (resp.status === 200) {
                return resp.responseText ? "Invalid response format." : "Server response was empty.";
            } else if (resp.readyState === 0 && resp.statusText === "error") {
                return "The server did not respond.";
            } else {
                return resp.statusText;
            }
        }
        var hasMsg = !!msg, error = (data && typeof data.error === "object") ? data.error : { };
        if (!error.message && !msg) {
            msg = getMessageFromResponse();
        } else if (error.message && msg && msg !== error.message) {
            if (error.details) {
                error.details.message = error.message + " \n" + error.details.message;
            } else {
                error.details = { message: error.message };
            }
        }
        if (msg) {
            error.message = msg;
        }

        if (resp && !error.response) {
            if ($.type(resp) === 'object') {
                error.response = _.pick(resp, "readyState", "responseText", "status", "statusText");
            } else {
                error.response = { };
            }
            if (resp.responseJSON) {
                error.details = resp.responseJSON;
            } else if (resp.message) {
                error.details = resp;
            } else if (_.isString(resp)) {
                error.details = {
                    message: resp
                }
            } else if (hasMsg) {
                var statusText = getMessageFromResponse();
                if (statusText !== resp.statusText && statusText !== msg)
                    error.details = { message: statusText };
            }
        }
        return error;
    }
    
    /**
     * Wraps an error object in the format that can be passed directly to the standard "error" Handlebars template.
     * @typedef {Object} ErrorWrapper
     * @property {module:nrm-ui/resourceCache~ErrorInfo} error The error
     */
    /**
     * Represents an error, which might be a server-side or client-side error.
     * @typedef {Object} ErrorInfo
     * @property {string} message High-level error message.
     * @property {Object} [details] Nested error object, typically the server representation described by the
     * {@link http://fsweb.nrm.fs.fed.us/dev/uicore/nrm-java-base/site/apidocs/us/fed/fs/nrm/utils/rest/ErrorInfo.html|
     * ErrorInfo class in NrmJavaBase library}
     * @property {Object} details.message Nested error message.
     * @property {Object} [details.detailMessage] Detailed message, usually omitted in Production usage.
     * @property {Object} [details.moreInfo] More info
     * @property {string} [details.errorLogId] Error log ID to look up details about the error in the server logs.
     * @property {number} [details.status] Numeric status code which might be meaningful to developers, but probably
     * isn't meaningful to the end-user.
     * @property {Object[]} [details.infos] Additional nested error details
     * @property {Object} [response] Subset of XMLHttpRequest properties
     * @property {number} [response.readyState] State of the request
     * @property {number} [response.status] Status of the response
     * @property {number} [response.statusText] Response string returned by the server
     * @property {number} [response.responseText] Response of the request as text
     * @property {Boolean} [isText=false] Render the response text with HTML characters escaped.
     * @property {Boolean} [isHtml=false] Render the response text without escaping HTML, not recommended.
     */

    var module = Nrm.ResourceCache = /**@lends module:nrm-ui/resourceCache**/{
        /**
         * Cache of resources, for internal use only, applications should only interact with the cache via the methods.
         */
        cache: { },
        /**
         * Get JSON data from an AJAX request or from the cache. Guarantees that the request is only sent to the server
         * once per page load.   
         * @param {Object} options
         * @param {string} [options.url] The URL of the resource.
         * @param {string[]} [options.deps] Array of AMD module IDs to load as depenendencies for the configuration.
         * @param {Object} [context] Object reference to bind to the callback function.
         * @returns {external:module:jquery.Promise}
         * Returns a promise that will be resolved with the requested data when the request has completed.
         * If the options.url parameter is omitted, the promise will be resolved synchronously with the input options.
         */
        getJsonData: function(options, context) { //url, caller, callback, async) {
            var dfd = new $.Deferred();
            var loadConfig = _.bind(function(options) {
                if (options && options.url) {
                    var data = this.cache[options.url] || (this.cache[options.url] = Backbone.ajax({
                        url: options.url,
                        async: options.async,
                        dataType: "json",
                        context: this
                    }));
                    $.when(data).done(_.bind(function(resp) {
                        data = this.cache[options.url] = resp;
                        resolve(dfd, data, context);
                     }, this)).fail(_.bind(function(resp) {
                        options.error = normalizeErrorInfo("Failed to load configuration from url " + options.url, { }, resp);
                        if (this.cache[options.url] === data)
                            delete this.cache[options.url]; //error might be temporary (e.g. invalid session)
                        reject(dfd, options, context);
                     }, this));
                } else {
                    resolve(dfd, options, context);
                }
            }, this);
            if (options && options.deps) {
                require(options.deps, function() { loadConfig(options); });
            } else {
                loadConfig(options);
            }
            return dfd.promise();
       },
       /**
        * Load configuration dynamically, either from an AJAX request or AMD load.
        * Due to the complexity of the implementation resulting from evolving requirements over time, this method is mostly 
        * intended for internal use in the other UI Core modules.
        * @param {Object} options
        * @param {string} [options.url] URL to load configuration from an AJAX request
        * @param {string} [options.mid] Module ID to load configuration as an AMD module
        * @param {string[]} [options.deps] Array of AMD module IDs to load as depenendencies for the configuration.
        * @param {string} [options.apiKey] If loading as an AMD module, this option can be used to set the depth of the 
        * module in the resulting configuration object, in other words, config.apiKey = module
        * @param {string} [options.prop] If loading as an AMD module, this option can be used in conjunction with the 
        * apiKey option to set the depth of the module in the resulting configuration object, in other words, 
        * config.apiKey.prop = module
        * @param {string} [options.subtype] If loading as an AMD module, this option can be used in conjunction with the 
        * apiKey and prop options to set the depth of the module in the resulting configuration object, in other words, 
        * config.apiKey.prop.subtype = module 
        * @param {Object} [context]
        * @returns {external:module:jquery.Promise}
        * Returns a promise that will be resolved with the requested configuration.
        */
       getConfig: function(options, context) { //config, callback, caller, async) {
            var config = (options && options.config) || options || { };
            if (config.mid) {
                var dfd = new $.Deferred();
                require([config.mid], _.bind(function(config) {
                    var cfg = { }, target = cfg;
                    if (options.apiKey) {
                        target = (target[options.apiKey] = { });
                        if (options.prop) {
                            target = target[options.prop] = { };
                            if (options.subtype)
                                target = target[options.subtype] = { };
                        }
                    } 
                    $.extend(target, config);
                    $.when(this.getJsonData(config, context)).done(function(data) {
                        if (data !== config)
                            $.extend(cfg, data);
                        options.config = cfg;
                        resolve(dfd, cfg, context);
                    }).fail(function(data) { reject(dfd, data, context); });
                }, this));
                return dfd.promise();
            } else {
                return $.when(this.getJsonData(config, context)).done(function(data) {
                    options.config = data;
                });
            }
        },
        restoreLogin: function() {
            return RestoreLoginView.restoreLogin();
        },
        /**
         * Resolve a Deferred object with one argument and optional context to bind to the "done" callbacks. 
         * This doesn't really do anything special so that these two code blocks are equivalent:
         * <pre><code>
         * require(['jquery'], function($) {
         *   function doSomething() {
         *      var dfd = $.Deferred();
         *      dfd.resolveWith(this, [data]);
         *      return dfd.promise();
         *   }
         * });
         * </code></pre>
         * ...and...
         * <pre><code>
         * require(['jquery', 'nrm-ui/resourceCache'], function($, ResourceCache) {
         *   function doSomething() {
         *      var dfd = $.Deferred();
         *      return ResourceCache.resolve(dfd, data, this);
         *   }
         * });
         * </code></pre>
         * @function
         * @param {external:module:jquery.Deferred} dfd Deferred object
         * @param {*} data An argument to pass to the "done" callbacks.
         * @param {Object} [context] Reference of an object that will be bound to the "done" callbacks. 
         * @returns {external:module:jquery.Promise}
         * Returns the resolved Promise, which is a public subset of the Deferred object methods.
         * @see {@link http://api.jquery.com/category/deferred-object/|jQuery Deferred Object}
         */
        resolve: resolve,
        /**
         * Similar to {@link module:nrm-ui/resourceCache.resolve|ResourceCache.resolve}, except it rejects the Deferred 
         * object instead of resolving it.
         * @function
         * @param {external:module:jquery.Deferred} dfd Deferred object
         * @param {*} data An argument to pass to the "fail" callbacks.
         * @param {Object} [context] Reference of an object that will be bound to the "fail" callbacks. 
         * @returns {external:module:jquery.Promise}
         * Returns the rejected Promise.
         * @see {@link http://api.jquery.com/category/deferred-object/|jQuery Deferred Object}
         */
        reject: reject,
        /**
         * Calls a "success" callback, then resolves the Deferred object.  Passes three arguments to each and binds
         * optional context to the "success" and "done" callbacks.
         * @function
         * @param {external:module:jquery.Deferred} dfd Deferred object
         * @param {function} callback Success callback that will be called with the three following arguments
         * @param {*} data First argument to pass to success callback and done callbacks.
         * @param {external:module:jquery.jqXHR} response Second argument to pass to success callback and done callbacks, 
         * usually a jQuery XMLHttpRequest (jqXHR) object.
         * @param {Object} [options] Third argument to pass to success callback and done callbacks.
         * @param {Object} [context] Reference of an object that will be bound to the "success" and "done" callbacks. 
         * @returns {external:module:jquery.Promise}
         * Returns the resolved Promise
         */
        resolveWithCallback: resolveWithCallback,
        /**
         * Calls an "error" callback, then resolves the Deferred object.  Passes three arguments to each and binds
         * optional context to the "error" and "fail" callbacks.
         * @function
         * @param {external:module:jquery.Deferred} dfd Deferred object
         * @param {function} callback Error callback that will be called with the three following arguments
         * @param {*} data First argument to pass to error callback and fail callbacks.
         * @param {external:module:jquery.jqXHR} response Second argument to pass to error callback and fail callbacks, 
         * usually a jQuery XMLHttpRequest (jqXHR) object.
         * @param {Object} [options] Third argument to pass to error callback and fail callbacks.
         * @param {Object} [context] Reference of an object that will be bound to the "error" and "fail" callbacks. 
         * @returns {external:module:jquery.Promise}
         * Returns the resolved Promise
         */
        rejectWithCallback: rejectWithCallback,
        /**
         * Normalizes error messages in a variety of recognized formats into an object that can be passed to the
         * "error" template. Result may be an aggregation of several nested messages.
         * @function
         * @param {?string} msg High-level error message.
         * @param {?module:nrm-ui/resourceCache~ErrorWrapper} data Nested error info
         * @param {external:module:jquery.jqXHR|string|Error} resp May be a jqXHR, or a Javascript error, or a string
         * @param {Object} options currently unused
         * @returns {module:nrm-ui/resourceCache~ErrorInfo}
         * Returns a normalized error info object that can be set as the "error" property in data passed to the "error"
         * Handlebars template.
         */
        normalizeErrorInfo: normalizeErrorInfo
    };
    /**
     * Wraps an implementation of {@link http://backbonejs.org/#Sync-ajax|Backbone.ajax} function with some customized 
     * behavior to deal with expired or otherwise invalid sessions.
     * @name module:nrm-ui/resourceCache.wrapAjax
     * @function
     * @param {Function} ajax The JQuery ajax implementation or an equivalent function.
     * @returns {Function}
     * Returns the wrapped ajax implementation.
     */
    module.wrapAjax = function(ajax) {
        return function(url, request) {
            var self = this;
            if (!request && typeof url !== "string") request = url;
            var dfd = new $.Deferred(), error = request && request.error, textStatus, errorThrown, errorXHR, ajaxArgs = arguments;
            if (error) request.error = function(jqXHR, status, error) {
                errorXHR = jqXHR, textStatus = status, errorThrown = error;
            };
            var result = ajax.apply(self, ajaxArgs);
            function resolve() {
                dfd.resolve.apply(dfd, arguments);
            }
            function reject() {
                if (error) error(errorXHR, textStatus, errorThrown);
                dfd.reject.apply(dfd, arguments);
            }
            function restoreLogin() {
                var failArgs = arguments;
                $.when(module.restoreLogin()).done(function() {
                    $.when(ajax.apply(self, ajaxArgs)).done(resolve).fail(reject);
                }).fail(function() {
                    reject.apply(self, failArgs);
                });
            }
            $.when(result).done(resolve).fail(function(request, status, error) {
                if (request && status === "parsererror" && /text\/html/.test(request.getResponseHeader("Content-Type"))) {
                    restoreLogin.apply(self, arguments);
                } else if (request && !request.readyState && status === "error") {
                    // TODO: probably a login error, but might be something else... is there a way to check?
                    restoreLogin.apply(self, arguments);
                } else {
                    reject.apply(self, arguments);
                }
            });
            return $.extend(result, dfd.promise());
        };
    };
    return module;
});