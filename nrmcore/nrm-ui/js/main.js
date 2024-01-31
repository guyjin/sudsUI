/**
 * @file Main module for the NRM UI Core "nrm-ui" package.
 * @see module:nrm-ui/main
 */
/**
 * Main module for the nrm-ui package.
 * @module nrm-ui/main
 */
define([
    'jquery', 
    'underscore', 
    'backbone', 
    'handlebars', 
    './event', 
    'require', 
    'use!bootstrap'
], function($, _, Backbone, Handlebars, Events, require) {
    
    var evt = new Events(), 
            globalIndicatorCount = 1,
            globalIndicatorEnabled = true,
            globalIndicatorStatus = true,
            loadingDefaults = {
                delay: 250
            };
            
    if (!Date.now) {
        Date.now = function() {
            return new Date().getTime();
        };
    }
    
    var Nrm = window.Nrm = /** @lends module:nrm-ui/main */{
        /**
         * Models namespace.  Along with {@link module:nrm-ui/main.Collections|Nrm.Collections} and 
         * {@link module:nrm-ui/main.Views|Nrm.Views}, this is a Backbone convention that doesn't really play a 
         * significant role now that we are using Asynchronous Module Definition (AMD) to define proper modules.
         */
        Models: {},
        /**
         * Collections namespace.
         * @see {@link module:nrm-ui/main.Models|Nrm.Models} for an explanation.
         */
        Collections: {},
        /**
         * Views namespace.
         * @see {@link module:nrm-ui/main.Models|Nrm.Models} for an explanation.
         */
        Views: {},
        /**
         * Emits global application events.
         * @type {module:nrm-ui/event}
         */
        event: evt,
        /**
         * Initializes some application-level event listeners, this should only be called once during startup.
         * @param {Function} callback 
         * @param {Object} [context] Object reference to bind to the callback function.
         * @returns {undefined}
         */
        startup: function(callback, context) {
            require.on("error", function(error) {
               var id = error && (error.id || error.message);
               var err = {
                    message: "Module load failed" + (id ? ": " + id : ""),
                    response: true
               };
               function showError() {
                   evt.trigger("showErrors", err);
               }
               if (error && _.isArray(error.info) && error.info.length) {
                   var url = error.info[0];
                   err.details = { message: error.info[0] };
                   if (id === "scriptError" && url.charAt(0) === "/") {
                       $.when($.get(url)).done(function() {
                            showError();
                       }).fail(function(resp) {
                           if (resp.status === 403) {
                               err.details.message += "\n\nYour session may have expired.  Please refresh the page and try again.";
                           } 
                           showError();
                       });
                       return;
                   }
               }
               showError();
            });
            
            if (window.applicationCache) {
                window.applicationCache.addEventListener('error', function(err) {
                    console.error('applicationCache error', err);
                    Nrm.appCacheError = err;
                }, false);
            }
            var $document = $(document);
            $document.ready(function () {
                Nrm.hideLoadingIndicator({
                    message: 'Page loaded'
                });
                var timer = null;
                $document.ajaxStart(function() {
                    if (Nrm.useGlobalAjaxIndicator) {
                        timer = Nrm.showLoadingIndicator({
                            message: 'Global ajax event'
                        });
                    }
                });
                $document.ajaxStop(function() {
                    if (timer != null) {
                        Nrm.hideLoadingIndicator(timer);
                        timer = null;
                    }
                });
                if (callback) {
                    callback.call(context || this);
                }
            });
        },
        /**
         * Get the Backbone sync implementation that is potentially overriden by one of the supported offline storage options.
         * @param {external:Backbone.model} model The current model that we are sync'ing.
         * @returns {Function} Implementation of Backbone.sync
         * @see {@link http://backbonejs.org/#Sync|Backbone.sync}
         */
        getSyncMethod: function(model) {
            // adapted from nrm.storage.js
            var sync = Backbone.ajaxSync; // default to ajaxSync unless using offline storage and the model doesn't opt out
            if (Nrm.offlineStorage && (model.localStorage === undefined || model.localStorage)) {
                if (Nrm.offlineStorage === "Local") {
                    sync = Nrm.LocalStorage && Nrm.LocalStorage.sync;
                } else if (Nrm.offlineStorage === "WebSQL") {
                    sync = Nrm.WebSQL && Nrm.WebSQL.sync;
                } else if (Nrm.offlineStorage === "LocalDB") {
                    sync = Nrm.LocalDB.sync;
                } else {
                    throw "Nrm.offlineStorage type " + Nrm.offlineStorage + " is not supported.";
                }
                if (!sync) {
                    throw "Nrm.offlineStorage type " + Nrm.offlineStorage + 
                         " is not defined, ensure the correct module is loaded as a dependency before calling Backbone.sync.";
                }
            }
            return sync;
        },
        /**
         * Gets the width of the vertical scrollbar, this is used in tree view and nrmDataTable to scroll active node 
         * into view.
         * @returns {number} The width of the vertical scrollbar.
         */
        getScrollbarWidth: function() {
            if(this.scrollbarWidth===undefined) {
              var parent = $('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body');
              var child = parent.children();
              this.scrollbarWidth = child.innerWidth() - child.height(99).innerWidth();
              parent.remove();
            }

           return this.scrollbarWidth;
        },
        /**
         * Resolves a relative URL using configuration information to determine the domain-relative root.
         * Only used when the application is using the HTML5 History API aka "push state" functionality support in
         * {@link http://backbonejs.org/#History|Backbone.history}
         * @param {string} url Relative URL to resolve.
         * @returns {string} Resolved URL
         */
        resolveUrl: function(url) {
            if (Nrm.app && Nrm.app.supportsPushState() && !/^(\/|https?:)/.test(url)) {
                url = Nrm.app.get("urlRoot") + url;
                if (url.indexOf("/") !== 0)
                    url = "/" + url;
            }
            return url;
        },
        /**
         * Get selector for focusable elements, uses JQuery UI :focusable pseudo selector if it is available, otherwise 
         * uses a simplified version that supports most focusable elements except for a few unusual ones which can be 
         * included by setting tabindex attribute.  Note that this selector will only work for visible elements, which 
         * also means it doesn't work in document fragments (for example, when rendering a view before adding to the 
         * page).
         * @returns {String}
         */
        getFocusableSelector: function() {
            if ($.expr[':'].focusable) {
                return ':focusable';
            } else {
                return 'a[href]:visible,:input:visible:enabled,[tabindex]:visible:not([tabindex=""])';
            }
        },
        /**
         * Get selector for tabbable elements, uses JQuery UI :focusable pseudo selector if it is available, otherwise 
         * uses a simplified version that supports most tabbable elements except for a few unusual ones which can be 
         * included by setting tabindex attribute to "0".  Note that this selector will only work for visible elements, 
         * which also means it doesn't work in document fragments (for example, when rendering a view before adding to 
         * the page).
         * @returns {String}
         */
        getTabbableSelector: function() {
            if ($.expr[':'].tabbable) {
                return ':tabbable';
            } else {
                return 'a[href]:visible,:input:visible:enabled,[tabindex="0"]:visible';
            }
        },
        /**
         * Indicates whether the application should use the global JQuery ajax events to show the ajax "progress"
         * indicator.
         */
        useGlobalAjaxIndicator: true,
        /**
         * Show the global loading indicator.
         * @param {Object} options
         * @param {Number} [options.delay=250] Delay in milliseconds before the indicator should display
         * @param {String} [options.message] Status message
         * @returns {Object}
         * Returns an object that can be passed to the 
         * {@link module:nrm-ui/main.hideLoadingIndicator|Nrm.hideLoadingIndicator method} to cancel showing the 
         * loading indicator.
         */
        showLoadingIndicator: function(options) {
            options = _.defaults(options || {}, loadingDefaults);
            options.time = Date.now();
            globalIndicatorCount++;
            options.timeoutId = setTimeout(function() {
                if (globalIndicatorCount > 0) {
                    globalIndicatorStatus = true;
                    console.log('Load event, count:', globalIndicatorCount, options);
                    if (globalIndicatorEnabled) {
                        $('.ajax-progress').show();
                    }
                }
            }, options.delay);
            return options;
        },
        /**
         * Hide the global loading indicator.
         * @param {Object} options The return value from 
         * {@link module:nrm-ui/main.showLoadingIndicator|Nrm.showLoadingIndicator method}
         * @param {Number} options.timeoutId The timeout id to clear the timer.
         * @param {Number} options.time The time at which the loading indicator was displayed.
         * @param {String} [options.message] Status message
         * @returns {Boolean}
         * Returns true if the loading indicator was actually hidden.
         */
        hideLoadingIndicator: function(options) {
            options = options || {};
            if (options.timeoutId) {
                clearTimeout(options.timeoutId);
            }
            if (globalIndicatorCount > 0) {
                globalIndicatorCount--;
            }
            console.log('Load event finished:', options.time && (Date.now() - options.time), 
                    'count:', globalIndicatorCount, options);
                    
            if (globalIndicatorCount === 0) {
                globalIndicatorStatus = false;
                $('.ajax-progress').hide();
                return true;
            }
            return false;
        },
        /**
         * Enable or disable the global loading indicator
         * @param {Boolean} enable
         * @returns {Boolean}
         * Returns the current global loading indicator status.   True means it is visible only enabled, false means it 
         * is not visible even if enabled.
         */
        setLoadingIndicatorEnabled: function(enable) {
            globalIndicatorEnabled = !!enable;
            if (globalIndicatorStatus) {
                console.log('Set loading indicator enabled:', globalIndicatorEnabled);
                if (enable) {
                    $('.ajax-progress').show();
                } else {
                    $('.ajax-progress').hide();
                }
            }
            return globalIndicatorStatus;
        },
        /**
         * Indicates whether the global loading indicator is currently enabled.
         * @returns {Boolean}
         */
        isLoadingIndicatorEnabled: function() {
            return globalIndicatorEnabled;
        },
        /**
         * Helper function to ensure an id value is defined.
         * @param {String} [id]
         * @returns {String}
         * Returns the input parameter if it is a truthy value or a generated unique id.
         */
        ensureId: function(id) {
            if (!id) {
                id = _.uniqueId('nrm-control-idgen');
            }
            return id;
        }
    };
    
    // Override 'Backbone.sync', formerly in nrm.storage.js
    Backbone.ajaxSync = Backbone.sync;
    Backbone.sync = function(method, model, options) {
            return Nrm.getSyncMethod(model,options).apply(this, [method, model, options]);
    };    
    
    /* Handlebars helper functions for modular templates */
    
    function renderPartial(templateName) {
        var context = this, options;
        if (arguments.length > 1) {
            // {{partial arg}}
            if (templateName) {
                options = arguments[arguments.length - 1];
                //console.log("Running partial helper for template " + templateName);
                var compiledPartial = Handlebars.templates[templateName];
                if (!compiledPartial) {
                    var msg = 'Template name ' + templateName + ' not found';
                    console.error(msg);
                } else {
                    // allow the caller to override properties by passing hash options to the helper.
                    if (options.hash) {
                        // {{partial arg prop=value}}
                        context = Handlebars.Utils.extend(Handlebars.createFrame(context), options.hash);
                    }
                    return new Handlebars.SafeString(compiledPartial(context, options));
                }
            }
        } else {
            // {{partial}}
            return this.partial;
        }
    }

    Handlebars.registerHelper('partial', renderPartial);

    Handlebars.registerHelper('apply-label', function() {
        if (this.label) {
            return renderPartial.call(this, 'label', arguments[arguments.length - 1]);
        }
    });
    
    Handlebars.registerHelper('increment', function(value) {
        if (arguments.length <= 1) {
            // {{increment}}
            return this.increment;
        } else if ($.isNumeric(value)) {
            // {{increment arg}}
            return parseInt(value) + 1;
        } else {
            return value;
        }
    });
    
    Handlebars.registerHelper('data', function() {
        var options = arguments[arguments.length - 1], hash;
        if (options.fn) {
            // {{#data prop=value}}{{/set-data}}
            hash = options.hash;
            if (options.data) {
                hash = Handlebars.Utils.extend(Handlebars.createFrame(options.data), hash);
            }
            return options.fn(this, {data:hash});
        } else {
            // {{data}}
            return this.data;
        }
    });
    
    Handlebars.registerHelper('ensureId', function(id) {
        if (arguments.length > 1) {
            // {{ensureId arg}}
            return Nrm.ensureId(id);
        } else {
            // {{ensureId}}
            return this.ensureId;
        }
    })
    
    // http://codereview.stackexchange.com/questions/13338/hasscroll-function-checking-if-a-scrollbar-is-visible-in-an-element
    function hasScroll(el, index, match) {
        var $el = $(el),
            sX = $el.css('overflow-x'),
            sY = $el.css('overflow-y'),
            hidden = 'hidden', 
            visible = 'visible',
            scroll = 'scroll',
            axis = match[3]; // regex for filter -> 3 == args to selector

        if (!axis) { 
            //Check both x and y declarations
            if (sX === sY && (sY === hidden || sY === visible)) { 
                return false;
            }
            if (sX === scroll || sY === scroll) { return true; }
        } else if (axis === 'x') { 
            if (sX === hidden || sX === visible) { return false; }
            if (sX === scroll) { return true; }
        } else if (axis === 'y') {
            if (sY === hidden || sY === visible) { return false; }
            if (sY === scroll) { return true; };
        }

        //Compare client and scroll dimensions to see if a scrollbar is needed

        return $el.innerHeight() < el.scrollHeight || 
            $el.innerWidth() < el.scrollWidth;
    }
    $.expr[':'].hasScroll = hasScroll;
    
    // TODO: do we really need this?
    $.fn.nrmSaveButton = function(options) {
        return $(this).text("Save");
    };

    return Nrm;
});
