/**
 * @file The AppRouter module provides a generic implementation of {@link http://backbonejs.org/#Router|Backbone.Router}
 * @see module:nrm-ui/appRouter
 */
/** 
 * @module nrm-ui/appRouter
 * 
 */

define(['.', 'jquery', 'backbone', 'underscore'], function(Nrm, $, Backbone, _) {

    return Nrm.AppRouter = Backbone.Router.extend(/**@lends module:nrm-ui/appRouter.prototype*/{
        /**
         * Routes hash maps URLs with parameters to implementation functions.
         * @see {@link http://backbonejs.org/#Router-routes|Backbone.Router#routes}
         */
        routes: {
            "help": "showHelp",
            "about": "about",
            "home": "home",
            "home/*path": "home",
            "settings": "settings",
            "saveSettings": "saveSettings",
            "restoreSettings": "restoreSettings",
            "user-info": "userInfo",
            "context-help": "contextHelp",
            "edit/*path": "edit",
            "create/*path": "create",
            "search/*path": "search",
            "advSearch/*path": "advSearch",
            "results/*path": "searchResults",
            "extent/*path": "zoomTo",
            "center/*path": "panTo",
            "mapSelect/*path": "mapSelect",
            "main-content": "mainContent",
            "logout": "logout",
            "errors": "showErrors",
            "printMap" : "printMap",
            "mapIdentifyCopy/*path" : function(path){
                /**
                 * Copy the text of a node in the {@link module:nrm-map/views/mapIdentifyView|MapIdentifyView}
                 * @event module:nrm-ui/event#map:identifyCopy
                 * @param {string} path node ID
                 */
                this.triggerRoute("map:identifyCopy", path);
            },
            "mapIdentifyCopyChildren/*path" : function(path){
                /**
                 * Copy the text of child nodes in the {@link module:nrm-map/views/mapIdentifyView|MapIdentifyView}
                 * @event module:nrm-ui/event#map:identifyCopyChildren
                 * @param {string} path node ID
                 */
                this.triggerRoute("map:identifyCopyChildren", path);
            },
            "mapIdentifyZoom/*path" : function(path){
                /**
                 * Zoom to a feature in the {@link module:nrm-map/views/mapIdentifyView|MapIdentifyView}
                 * @event module:nrm-ui/event#map:identifyZoom
                 * @param {string} path node ID
                 */
                this.triggerRoute("map:identifyZoom", path);
            },
            "mapIdentifyPan/*path" : function(path){
                /**
                 * Pan to a feature in the {@link module:nrm-map/views/mapIdentifyView|MapIdentifyView}
                 * @event module:nrm-ui/event#map:identifyPan
                 * @param {string} path node ID
                 */
                this.triggerRoute("map:identifyPan", path);
            },
            "mapIdentifyOpenUrl/*path" : function(path){
                /**
                 * Open a URL in the {@link module:nrm-map/views/mapIdentifyView|MapIdentifyView}
                 * @event module:nrm-ui/event#map:identifyOpenUrl
                 * @param {string} path node ID
                 */
                this.triggerRoute("map:identifyOpenUrl", path);
            },
            "addLayerFromShapefile" : "addLayerFromShapefile",
            "addLayerByURL" : "addLayerByURL",
            "removeLayer/*path" : function(path){
                /**
                 * Remove a layer in the {@link module:nrm-map/views/mapTocView|MapTocView}.
                 * @event module:nrm-ui/event#map:removeLayer
                 * @param {string} path TOC element ID
                 */
                this.triggerRoute("map:removeLayer", path);
            }, 
            "reorderLayerTop/*path" : function(path){ 
                /**
                 * Move a layer to the top in the {@link module:nrm-map/views/mapTocView|MapTocView}.
                 * @event module:nrm-ui/event#map:reorderLayerTop
                 * @param {string} path TOC element ID
                 */
                this.triggerRoute("map:reorderLayerTop", path);
            }, 
            "reorderLayerBottom/*path" : function(path){
                /**
                 * Move a layer to the bottom in the {@link module:nrm-map/views/mapTocView|MapTocView}.
                 * @event module:nrm-ui/event#map:reorderLayerBottom
                 * @param {string} path TOC element ID
                 */
                this.triggerRoute("map:reorderLayerBottom", path);
            }, 
            "reorderLayerUp/*path" : function(path){
                /**
                 * Move a layer up in the {@link module:nrm-map/views/mapTocView|MapTocView}.
                 * @event module:nrm-ui/event#map:reorderLayerUp
                 * @param {string} path TOC element ID
                 */
                this.triggerRoute("map:reorderLayerUp", path);
            }, 
            "reorderLayerDown/*path" : function(path){
                /**
                 * Move a layer down in the {@link module:nrm-map/views/mapTocView|MapTocView}.
                 * @event module:nrm-ui/event#map:reorderLayerDown
                 * @param {string} path TOC element ID
                 */
                this.triggerRoute("map:reorderLayerDown", path);
            }, 
            "*splat": "defaultRoute" // this needs to be the last route in the list
        },
        /**
         * Generic route implementation that delegates to Nrm.app.triggerEvent. 
         * @param {string} evtName Name of the event to trigger on Nrm.event
         * @param {Object|string} [data] First route parameter or data object including a path and optional params.
         * @param {string} [data.path] Path argument that will be translated to a context path.
         * @param {string[]} [data.params] Additional parameters.
         * @returns {undefined}
         * @see {@link module:nrm-ui/models/application#triggerEvent|Nrm.app.triggerEvent}
         */
        triggerRoute: function(evtName, data) {
            console.log("triggerRoute start: " + evtName, data);
            var nav = this.hasNavigated;
            this.hasNavigated = true;
            var args = arguments;
            function navigate() {
                this.initialized = true;
                console.log("triggerRoute fired: " + evtName);
                if (!data)
                    Nrm.app.triggerEvent(evtName);
                else if (data.path)
                    Nrm.app.triggerEvent(evtName, data);
                else
                    Nrm.app.triggerEvent.apply(Nrm.app, args);
                if (!nav && evtName !== "app:defaultRoute")
                    Nrm.app.triggerEvent("app:defaultRoute");
            }
            if (!this.initialized) {
                Nrm.event.once("app:init", navigate, this);
            } else {
                navigate.call(this);
            }
        },
        /**
         * Triggers the {@link module:nrm-ui/event#app:defaultRoute|app:defaultRoute} event on Nrm.event when the page 
         * is loaded with no hash fragment, or attempts to navigate an unrecognized hash fragment.
         * @returns {undefined}
         */
        defaultRoute: function () {
            /**
             * The default route ensures that something is rendered in the main data panel.
             * @event module:nrm-ui/event#app:defaultRoute
             */
            this.triggerRoute("app:defaultRoute");
        },
        /**
         * Triggers {@link module:nrm-ui/event#context:search|context:search} event on Nrm.event to show or focus the 
         * search form.
         * @param {string} path The context path
         * @returns {undefined}
         */
        search: function(path) {
            /**
             * Show or focus the search form in the west panel.
             * @event module:nrm-ui/event#context:search
             * @param {module:nrm-ui/models/application~NestedContextResult} options Path navigation options
             */
            this.triggerRoute("context:search", { path: path });
        },    
        /**
         * Triggers {@link module:nrm-ui/event#context:advSearch|context:advSearch} event on Nrm.event to show the 
         * advanced search form.
         * @param {string} path The context path
         * @returns {undefined}
         */
        advSearch: function(path) {
            /**
             * Display the advanced search view
             * @event module:nrm-ui/event#context:advSearch
             * @param {module:nrm-ui/models/application~NestedContextResult} options Path navigation options
             */
            this.triggerRoute("context:advSearch", { path: path });
        },
        /**
         * Triggers {@link module:nrm-ui/event#context:results|context:results} event on Nrm.event to show the search 
         * results grid.
         * @param {string} path The context path
         * @returns {undefined}
         */
        searchResults: function(path) {
            /**
             * Display the results grid view
             * @event module:nrm-ui/event#context:results
             * @param {module:nrm-ui/models/application~NestedContextResult} options Path navigation options
             */
            this.triggerRoute("context:results", { path: path });
        },
        /**
         * Triggers {@link module:nrm-ui/event#context:beginEdit|context:beginEdit} on Nrm.event to show the edit form 
         * for an existing record.
         * @param {string} path The context path
         * @returns {undefined}
         */
        edit: function(path) {
            /**
             * Display the edit form for an existing model.
             * @event module:nrm-ui/event#context:beginEdit
             * @param {module:nrm-ui/models/application~NestedContextResult} options Path navigation options
             */
            this.triggerRoute("context:beginEdit", { path: path });
        },
        /**
         * Triggers {@link module:nrm-ui/event#context:beginCreate|context:beginCreate} on Nrm.event to show the edit 
         * form for a new record.
         * @param {string} path The context path
         * @returns {undefined}
         */
        create: function(path) {
            /**
             * Display the edit form for a new model.
             * @event module:nrm-ui/event#context:beginCreate
             * @param {module:nrm-ui/models/application~NestedContextResult} options Path navigation options
             */
            this.triggerRoute("context:beginCreate", { path: path });
        },
        /**
         * Triggers {@link module:nrm-ui/event#context:zoomTo|context:zoomTo} on Nrm.event to zoom to the location 
         * represented by a context path.
         * @param {string} path The context path
         * @returns {undefined}
         */    
        zoomTo: function(path) {
            /**
             * Zoom to one or more features.
             * @event module:nrm-ui/event#context:zoomTo
             * @param {Object|module:nrm-ui/models/application~NestedContextResult} options Path navigation options or
             * the zoom options as described in 
             * {@link module:nrm-map/views/mapView#setExtentToFeature|MapView#setExtentToFeature}
             */
            this.triggerRoute("context:zoomTo", { path: path });
        },
        /**
         * Triggers {@link module:nrm-ui/event#context:panTo|context:panTo} on Nrm.event to pan to the location 
         * represented by a context path.
         * @param {string} path The context path
         * @returns {undefined}
         */    
        panTo: function(path) {
            /**
             * Pan to one or more features.
             * @event module:nrm-ui/event#context:panTo
             * @param {Object|module:nrm-ui/models/application~NestedContextResult} options Path navigation options or 
             * the zoom options as described in
             * {@link module:nrm-map/views/mapView#setExtentToFeature|MapView#setExtentToFeature}
             */
            this.triggerRoute("context:panTo", { path: path });
        },
        /**
         * Triggers {@link module:nrm-ui/event#context:mapSelect|context:mapSelect} on Nrm.event to activate the 
         * spatial search tool.
         * @param {string} path The context path
         * @returns {undefined}
         */    
        mapSelect: function(path) {
            /**
             * Activate the spatial search tool
             * @event module:nrm-ui/event#context:mapSelect
             * @param {module:nrm-ui/models/application~NestedContextResult|
             *       module:nrm-map/views/mapView~SelectionContext} options Path navigation options or 
             * select tool options
             */
            this.triggerRoute("context:mapSelect", { path: path });
        },
        /**
         * Triggers {@link module:nrm-ui/event#app:help|app:help} event on Nrm.event.
         * @returns {undefined}
         */
        showHelp: function() {
            /**
             * Show help
             * @event module:nrm-ui/event#app:help
             */
            this.triggerRoute("app:help");
        },
        /**
         * Triggers {@link module:nrm-ui/event#app:about|app:about} event on Nrm.event to show the About box
         * @returns {undefined}
         */
        about: function() {
            /**
             * Show the About box
             * @event module:nrm-ui/event#app:about
             */
            this.triggerRoute("app:about");
        },
        /**
         * Triggers {@link module:nrm-ui/event#app:userInfo|app:userInfo} event on Nrm.event.
         * @returns {undefined}
         */
        userInfo: function() {
            /**
             * Show user info
             * @event module:nrm-ui/event#app:userInfo
             */
            this.triggerRoute("app:userInfo");
        },
        /**
         * Triggers {@link module:nrm-ui/event#app:settings|app:settings} event on Nrm.event.
         * @returns {undefined}
         */
        settings: function() {
            /**
             * Show settings
             * @event module:nrm-ui/event#app:settings
             */
            this.triggerRoute("app:settings");
        },
        /**
         * Triggers {@link module:nrm-ui/event#app:saveSettings|app:saveSettings} event on Nrm.event.
         * @returns {undefined}
         */
        saveSettings: function() {
            /**
             * Save settings
             * @event module:nrm-ui/event#app:saveSettings
             */
            this.triggerRoute("app:saveSettings");
        },
        /**
         * Triggers {@link module:nrm-ui/event#app:restoreSettings|app:restoreSettings} event on Nrm.event.
         * @returns {undefined}
         */
        restoreSettings: function() {
            /**
             * Restore settings
             * @event module:nrm-ui/event#app:restoreSettings
             */
            this.triggerRoute("app:restoreSettings");
        },
        /**
         * Triggers {@link module:nrm-ui/event#app:contextHelp|app:contextHelp} event on Nrm.event.
         * @returns {undefined}
         */
        contextHelp: function() {
            /**
             * Show context-sensitive help
             * @event module:nrm-ui/event#app:contextHelp
             */
            this.triggerRoute("app:contextHelp");
        },
        /**
         * Triggers {@link module:nrm-ui/event#app:home|app:home} event to show a home page, may include a path in 
         * scenarios where there is nothing better to do.
         * @param {string} [path] The context path
         * @returns {undefined}
         */
        home: function(path) {
            if (path) {
                this.triggerRoute("app:home", { path: path });
            } else {
                /**
                 * Show home screen
                 * @event module:nrm-ui/event#app:home
                 */
                this.triggerRoute("app:home");
            }
        },
        /**
         * Triggers the {@link module:nrm-ui/event#app:logout|app:logout} event.
         * @returns {undefined}
         */
        logout: function() {
            /**
             * Log out of the application
             * @event module:nrm-ui/event#app:logout
             */
            this.triggerRoute("app:logout");
        },
        /**
         * Triggers the {@link module:nrm-ui/event#showErrors|showErrors} event to redisplay errors.
         * @returns {undefined}
         */
        showErrors: function() {
            /**
             * Show an error message box.
             * @event module:nrm-ui/event#showErrors
             * @param {string|module:nrm-ui/resourceCache~ErrorInfo} [errors] May be an HTML string, or an error info 
             * that will be rendered with a standard template, or if it is not specified, display the previous error 
             * message if there is one
             * @param {Boolean|module:nrm-ui/views/layoutView~ErrorNotificationOptions} [notify=true] An options hash, 
             * or if it is a boolean, it is equivalent to the notify property in the options hash.
             * @param {Boolean} [append=false] Append the new error message to the current error message, ignored if 
             * the second parameter is an object.
             */
            this.triggerRoute("showErrors");
        },
        /**
         * Triggers the {@link module:nrm-ui/event#app:mainContent|app:mainContent} event.
         * @returns {undefined}
         */
        mainContent: function() {
            /**
             * Skip to main content.
             * @event module:nrm-ui/event#app:mainContent
             */
            this.triggerRoute("app:mainContent");
        },
        /**
         * Triggers the {@link module:nrm-ui/event#map:printMap|map:printMap} event.
         * @returns {undefined}
         */
        printMap: function() {
            /**
             * Print the map.
             * @event module:nrm-ui/event#map:printMap
             */
            this.triggerRoute("map:printMap");
        },
        /**
         * Triggers the {@link module:nrm-ui/event#map:addLayerFromShapefile|map:addLayerFromShapefile} event.
         * @returns {undefined}
         */
        addLayerFromShapefile: function() {
            /**
             * Add a feature layer from a shapefile.
             * @event module:nrm-ui/event#map:addLayerFromShapefile
             */
            this.triggerRoute("map:addLayerFromShapefile");
        },
        /**
         * Triggers the {@link module:nrm-ui/event#map:addLayerByURL|map:addLayerByURL} event.
         * @returns {undefined}
         */
        addLayerByURL: function() {
            /**
             * Add a map service layer from a URL.
             * @event module:nrm-ui/event#map:addLayerByURL
             */
            this.triggerRoute("map:addLayerByURL");
        },
        /**
         * Create a new instance of the AppRouter.  Application developers shouldn't use the constructor directly, instead
         * a singleton instance of the AppRouter will be initialized as {@link module:nrm-ui/main.router|Nrm.router}.
         * @constructor
         * @alias module:nrm-ui/appRouter
         * @classdesc
         *  Generic implementation of the {@link http://backbonejs.org/#Router|Backbone Router}. 
         * @param {external:module:jquery.Promise} [context] JQuery Promise to indicate that we should defer processing
         * routes until the promise is resolved.
         * @returns {undefined}
         * @see {@link http://backbonejs.org/#Router-constructor|Backbone.Router#initialize}
         */
        initialize: function(context) {
            this.loading = context;
            var custom = Nrm.app.get("routes");
            if (custom) {
                _.each(custom, function(value, key) {
                    var fn = _.bind((key.search(/\/\*path$/) > -1) ?
                        function() {
                            var args = Array.prototype.slice.call(arguments, 0);
                            this.triggerRoute(value, { path: args.pop(), params: args });
                        } : function() {
                            var args = Array.prototype.slice.call(arguments);
                            args.unshift(value);
                            this.triggerRoute.apply(this, args)
                        }, this);
                    this.route(key, key, fn);
                }, this);
            }
            $.when(this.loading).done(_.bind(function() {
                this.loading = false;
                /**
                 * Application initialized event, triggered once during startup.
                 * @event module:nrm-ui/event#app:init
                 */
                Nrm.event.trigger("app:init");
                this.initialized = true;
            }, this));
        }

    });
});
