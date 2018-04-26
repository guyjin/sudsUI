/**
 * @file The Application module.
 * @see module:nrm-ui/models/application
 */
/** 
 * @module nrm-ui/models/application
 */

define(['require', 'jquery', 'underscore', 'backbone', '..', '../resourceCache', 'hbs!error'], 
        function(require, $, _, Backbone, Nrm, ResourceCache, errorTemplate) {

    /**
     * Configuration options for the application (aka attributes of Application model).
     * @typedef {Object} AppConfig
     * @property {string} appName The application name to display in the nav bar and about box.
     * @property {string} version  The application version to display in the about box.
     * @property {string} namespace The application namespace.
     * @property {module:nrm-ui/models/application~ContextConfigMap} context A mapping of entity context configurations.
     * @property {string} defaultSearch The entity context key for the default "quick search" view to render when the 
     *  application loads.
     * @property {Array.<string>} preload A list of collections (identified by entity context key) to load before the
     *  application begins navigating routes.
     * @property {Object.<string,string>} routes Mapping of custom 
     *  {@link http://backbonejs.org/#Router-routes|Backbone routes} (keys) to event names (values) that will be 
     *  triggered on {@link module:nrm-ui/main.event|Nrm.event} when the route is navigated. 
     * @property {string} helpUrl The URL for the product support page.
     * @property {string} helpContextRoot Base URL for context-sensitive help.
     * @property {string} helpContext Default context-sensitive help topic (usually an ID) for the application.
     * @property {boolean} mobileApp Indicates that the application is a mobile app.
     * @property {boolean} enableMap Indicates whether the map panel should be displayed.
     * @property {boolean} singlePanel Indicates that the application uses the single-panel design.
     * @property {module:nrm-ui/views/baseView~FormConfigMap} forms Default configuration for generic view rendering.
     * @property {module:nrm-ui/plugins/nrmLayout~LayoutConfig} layout Configuration for the layout panels.
     * @property {module:nrm-map/views/mapView~MapConfig} map Configuration for the map view.
     * @property {module:nrm-ui/views/contextView~TreeConfig} tree Configuration for the Navigator tree plugin.
     * @property {module:nrm-ui/views/contextView~ToolsConfig} tools Configuration for the Tools panel.
     * @property {Array.<module:nrm-ui/views/baseView~MenuItemConfig>} navActions Configuration for custom nav bar menus.
     * @property {module:nrm-ui/models/settings~SettingsConfig} restoreSettings Options for automatically restoring user 
     *  preferences when the application loads.
     * @property {boolean} enableSettings Enables the Save/Restore Settings menu item on the nav bar for manually saving
     *  and restoring user preferences.
     * @property {string} accordionId The id attribute of the accordion group, only need if for some reason the default
     *  id needs to be overriden.
     * @property {boolean} debug Enables debug mode.
     * @property {boolean} pushState Indicates that the application wants to use the "pushState" option in
     *   {@link http://backbonejs.org/#History|Backbone.history}, also requires setting the urlRoot property.
     * @property {string} urlRoot If using "pushState" support in {@link http://backbonejs.org/#History|Backbone.history}
     *  this should be set to the application's context path.
     * @property {string} userInfoUrl The URL of the REST API endpoint that provides standard user info
     * @property {string} versionUrl The URL of the resource that provides version and SVN revision info
     * @property {string} appGroupName The application group name in OID, used to generate a URL for the Authorization 
     *  Management Tool (AMT)
     * @property {string} apiRootUrl The prefix for all URLs in the REST API, only needed if not using the default "api/".
     * @property {string} apiSearchUrl The prefix for all URLs for searches in the REST API, typically not needed.
     * @property {string} searchUrlSuffix Default search URL suffix, usually it's better to configure this in the 
     *  {@link module:nrm-ui/views/basicSearchView~SearchConfig|SearchConfig} instead.
     * @property {Array.<string>} subtypedEvents Custom path navigation events that allow subtypes.
     */
    /**
     * Configuration options for an entity context, which describes application behavior of an entity type 
     * within a hierarchical context.
     * @typedef {Object} ContextConfig
     * @property {string} apiKey The path component for this entity context, typically corresponds to a 
     *  REST API url component for the collection resource.
     * @property {string} refType The entity context key for the root context for the entity type described by this 
     *  configuration.  If not specified, it is assumed that the apiKey value is the key for the root context.
     * @property {string} caption A user-friendly plural descriptive name of the entity type to be used when the UI 
     *  needs to format a generic message or captions referring to a list of entities of this type.
     * @property {string} alias A user-friendly singular descriptive name of the entity type to be used  when the UI 
     *  needs to format a generic message or captions referring to an entity of this type.
     * @property {string} namespace The namespace for this context (if different from the application namespace).
     * @property {module:nrm-ui/models/application~ModuleConfig} modules Configuration object identifying the AMD 
     *  module identifier for views, models, and/or collections for this entity type.
     * @property {boolean} topLevel Should this context be exposed for top-level path navigation events 
     *  and displayed in top level Navigator tree. This should not be specified in dynamically loaded configuration
     *  because it is used to determine which configuration to load dynamically on startup (among other things).
     * @property {string} loadType Indicator of how to load the collection. Currently supported values:
     *  "search": initialize an empty collection, to be populated later via user-defined search parameters.
     *  "auto": load the collection when it is first retrieved, using standard URL templates for the REST API.
     *  Default value is "search" for top-level context configuration, or "auto" for LOV and nested context.
     * @property {module:nrm-ui/models/application~SchemaConfigMap} schema List of schema configuration objects.
     * @property {module:nrm-ui/views/editorView~EditorConfig} editor Generic view configuration for the "editor" view.
     * @property {module:nrm-ui/models/application~SearchConfigMap} search List of search configuration objects.
     * @property {boolean|module:nrm-ui/views/resultsView~SearchResultsConfig} searchResults Configuration for the
     *  search results grid, or indicates that the search results grid is enabled if it is boolean type.
     * @property {boolean} postSearch Indicates that the REST API requires the POST method for searches.
     * @property {boolean} enableCount Indicates that the REST API supports getting a count of records that will be
     *  returned for the search parameters.
     * @property {Array.<module:nrm-ui/views/baseView~MenuItemConfig>|Function} contextItems List of context menu items.
     * @property {number} maxResults The max results to limit a search.
     * @property {string} nodetype Default node type
     * @property {string} subtype Name of an attribute that identifies a subtype for the entity.  Subtypes might be 
     *  displayed differently in the nav tree, have distinct menu items for creating new items within the subtype, etc.
     * @property {Object.<string,(string|module:nrm-ui/views/contextView~SubtypeConfig)>} typemap Configuration
     *  for subtypes
     * @property {module:nrm-map/views/featureLayerView~SymbolConfig} symbol Configuration for symbology in the map.
     * @property {module:nrm-map/views/featureLayerView~RendererConfig} renderer Configuration for a unique value
     * renderer for the map layers.
     * @property {module:nrm-map/views/featureLayerView~LayerConfig} layer Additional layer options.
     * @property {boolean} editable If set explictly to false, indicates that any model should be non-editable within 
     *  this context.
     * @property {string} modelName A unique name for this entity type, typically following naming convention that
     *  would be suitable from a class name.  If not specified, it will be derived as described in
     *  {@link module:nrm-ui/models/application#getModelName|getModelName}.
     * @property {boolean} loadRules Indicates whether business rules should be loaded automatically when retrieving 
     *  the model constructor via {@link module:nrm-ui/models/application#getModelConstructor|getModelConstructor}
     * @property {string} idAttr Name of the ID attribute, only required if using a generic model constructor for an 
     *  entity where the ID attribute is not "id" 
     *  (see {@link http://backbonejs.org/#Model-idAttribute|Backbone.Model#idAttribute}).
     * @property {string} nameAttr Name of the primary display attribute.  Note that this can be a function as described 
     *  in {@link module:nrm-ui/models/application#getModelVal|getModelVal}.
     * @property {string} shapeAttr Name of the attribute (or function) that provides the geometry for a spatial context.
     * @property {string} groupAttr Name of the attribute (or function) to use for grouping a collection into subfolders
     *  in the Navigator tree.
     * @property {string} editAttr Name of the attribute (or function) that indicates the editable status of a model,
     *  see {@link module:nrm-ui/models/application#isEditable|isEditable} for more information.
     * @property {(string|Array.<string>|function)} sortAttr This can be either an attribute name or function suitable 
     *  for the  {@link http://backbonejs.org/#Collection-comparator|Backbone.Collection#comparator} property, or an 
     *  array of attribute names as described in {@link module:nrm-ui/models/application#getComparator|getComparator}.
     * @property {Object} defaults If using a generic model constructor, this value will be used as the
     *  {@link http://backbonejs.org/#Model-defaults|Backbone.Model#defaults}
     * @property {external:module:backbone.Collection} collection 
     *  The {@link http://backbonejs.org/#Collection|Backbone.Collection} for a root context.  Normally, this property 
     *  is initialized in the {@link module:nrm-ui/models/application#getCollection|getCollection} method.
     *  However, if customized collection initialization is required, the collection property can be set manually.
     *  Note: this property is not used on a nested ContextConfig object, where a custom collection would be retrieved 
     *  from the model.
     * @property {string} triggerRoute A route that should be executed if the context is does not have topLevel set
     *  to true, and it is encountered as a top-level context.
     * @property {string} url The URL for a one-time load of dynamic configuration to merge with this object.  
     *  If specified, the URL should return JSON content that conforms to the 
     *  {@link module:nrm-ui/models/application~ContextConfigMap|ContextConfigMap} type.
     *  Once the dynamic configuration is loaded, this property will be undefined.
     * @property {string} mid The absolute AMD module id of a configuration module to load dynamically.
     * @property {module:nrm-ui/models/application~ContextConfig} parent The parent ContextConfig for a 
     *  nested ContextConfig object.
     */
    var ContextConfig = function(options) {
        // Normally we use plain object for context configuration, but this can cause circular referenc issues when
        // passed to $.extend(true,...), so now we use this object constructor in getNestedContext.
        _.extend(this, options);
        return this;
    };
    /**
     * Configuration object containing information about a model attribute such as nested context configuration,
     * plus expected data types and shared control configuration used for generic rendering.
     * @typedef {Object} SchemaConfig
     * @property {boolean|function} navigate Indicates that this attribute is an entity relationship that should be
     *  exposed in the Navigator tree.  If it is a function, it will be passed with single options argument containing 
     *  context, model and path properties.
     * @property {string} label Default label or column header to use for controls bound to this attribute.
     * @property {string} refType The entity context key to look up in the 
     *  {@link module:nrm-ui/models/application~ContextConfigMap|ContextConfigMap} to retrieve entity context
     *  configuration. If this property is not defined, and the attribute is used in a way that infers that 
     *  it is an entity relationship, the attribute name associated with this schema 
     *  (i.e. the key in {@link module:nrm-ui/models/application~SchemaConfigMap|SchemaConfigMap}) will
     *  be used as the entity context key. 
     * @property {module:nrm-ui/models/application~ContextConfig} context Configuration that will override the 
     *  root entity context configuration for any behavior that needs to be different than the behavior
     *  at the root level.
     * @property {string} backRef The attribute name in the related entity that references this entity. 
     *  This is only necessary if the related entity has multiple relationships to this entity type.
     * @property {string} nameAttr The primary display attribute name related to this attribute.
     * @property {string} countAttr Attribute name for a count attribute associated with this entity relationship
     *  property that may be updated when a child is added or removed.
     * @property {string} delAttr Attribute name for list of deleted model IDs for a collection.
     * @property {string} dataType Indicates the type of special formatting that may be required.  For example,
     *  the "date" dataType indicates that the value should be displayed in the standard display format 'MM/DD/YYYY'
     *  even if the value is formatted as 'YYYY-MM-DD' in the JSON representation.
     * @property {Array.<string>} spatialTypes List of allowed spatial types (such as point, line, polygon) for a 
     *  geometry attribute.
     * @property {string} subtype A related attribute that should be updated when this attribute is updated.   
     * @property {boolean|string|module:nrm-ui/models/application~InheritanceConfig} inherit Provides instructions for 
     *  attribute inheritance. If it is boolean value true, it indicates that the attribute should be inherited for 
     *  creating new entities for editing and searching.
     *  If it is a string, the expected values are "edit" or "search" to indicate the attribute should only be inherit
     *  entities created for that purpose.
     *  If it is an object, the keys may represent child attribute names in the child with values representing parent
     *  attribute names, or may also include the special keys "edit" and "search", which may have boolean values
     *  or objects mapping child attribute names as keys to parent attribute names as values.
     * @property {Array.<string>} attributes If the dataType is "object" or "collection" and the attribute is inherited,
     *  this provides a list of attribute (or function) names to pick when creating the inherited value.
     */ 
    /**
     * Configuration for attribute inheritance, note that as well as the properties listed here, this type
     * also may include key/value pairs as described in 
     * {@link module:nrm-ui/models/application~InheritancePropertyMap|InheritancePropertyMap}
     * @typedef {Object} InheritanceConfig
     * @augments {module:nrm-ui/models/application~InheritancePropertyMap}
     * @property {(boolean|module:nrm-ui/models/application~InheritancePropertyMap)} edit Indicates whether attribute 
     *  inheritance is enabled when creating a new child model for editing, or identifies a mapping of additional 
     *  attributes that should be inherited from the parent.
     * @property {(boolean|module:nrm-ui/models/application~InheritancePropertyMap)} search Indicates whether attribute 
     *  inheritance is enabled when creating a new child model for searching, or identifies a mapping of additional 
     *  attributes that should be inherited from the parent.
     */
    /**
     * Map of child attribute names (key) to the parent attribute names (value) that will provide the values when
     * inheriting attributes in a new child model.
     * @typedef {Object.<string,string>} InheritancePropertyMap
     */
    /**
     * Maps a module type key to an absolute module ID to load as the constructor for the type.
     * Currently the following type keys are recognized:
     * "model" and "collection" for Model and Collection, plus "editor", "search", "advSearch" and "results"
     * for various types of views.  Custom keys are also allow if the application finds it useful.
     * @typedef {Object.<string,string>} ModuleConfig
     */
    /**
     * Dictionary of entity context configuration objects, with keys corresponding to the apiKey (or refType when 
     * referenced in a nested context) for the entity context.  The keys are referred to elsewhere in the documentation 
     * as "entity context keys".
     * @typedef {Object.<string,module:nrm-ui/models/application~ContextConfig>} ContextConfigMap
     */
    /**
     * Dictionary of SchemaConfig objects for an entity type.  The keys represent attribute names.
     * @typedef {Object.<string,module:nrm-ui/models/application~SchemaConfig>} SchemaConfigMap
     */
    /**
     * Dictionary of SearchConfig objects for an entity type. The keys currently supported include  
     * "basic", "advanced" and "spatial" although it can also include custom keys if the application
     * finds it useful. The values may be a boolean indicating that the search type is enabled, or 
     * configuration for generic rendering.
     * @typedef {Object.<string,module:nrm-ui/views/basicSearchView~SearchConfig|boolean>} SearchConfigMap
     */
    
    var resolve = ResourceCache.resolve;
    var reject = ResourceCache.reject;
    var resolveWithCallback = ResourceCache.resolveWithCallback;
    var rejectWithCallback = ResourceCache.rejectWithCallback;
    var normalizeErrorInfo = ResourceCache.normalizeErrorInfo;
    var resolveUrl = Nrm.resolveUrl;
    var requireDeferred = function(deps, fn, caller, require) {
        if (!require) require = window.require;
        var dfd = new $.Deferred();
        require(deps, function() {
            if (typeof fn !== "function")
                fn = function() {};
            resolve(dfd, fn.apply(caller || this, arguments), caller);
        });
        return dfd;
    };

    function ensureRulesLoaded(entityName, model, options, caller) {
        if (model && !model.rules) {
            var rulesDfd = new $.Deferred();
            var rulesUrl = options.rulesUrl || (options.context && options.context.rulesUrl) || "Rules.txt";
            require(['../collections/ruleCollection', './businessObject'], function(RuleCollection, BusinessObject) {
                var rules = new RuleCollection();
                /**
                 * The rules collection.
                 * @name module:nrm-ui/models/businessObject.rules
                 * @type {module:nrm-ui/collections/ruleCollection}
                 */
                model.rules = rules;
            model.rulesLoading = rulesDfd.promise();
                BusinessObject.addBusinessRules(rulesUrl, entityName, rules, function() {
                delete model.rulesLoading;
                if (model.rulesLoaded)
                    model.rulesLoaded(rules);
                resolve(rulesDfd, model, caller);
            },
             function(data, response, opt) {
                 options.error = normalizeErrorInfo("Failed to load rules for " + (entityName || options.apiKey) + " entity.", 
                    data, response, opt); 

                 reject(rulesDfd, options, caller);
             });
            });
            return rulesDfd.promise();
        } else {
            return (model && model.rulesLoading) || model;
        }
    }

    var contextLoading = { };
    var namespaces = { };
    // dateIsoRe is used to transform a ISO format date to display as "mm/dd/yyyy" or "mm/dd/yyyy hh24:mi"
    // Since this is for display purpose, we don't care about unmatched trailing characters (e.g. seconds, time zones)
    var dateIsoRe = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?/;
    // dateDisplayRe is used to transform a date entered in "mm/dd/yyyy" or "mm/dd/yyyy hh24:mi" or "mm/dd/yyyy hh24:mi:ss"
    // This has to match the entire string, so that partially valid values can be flagged as errors in a business rule.
    var dateDisplayRe = /^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}:\d{2}(?::\d{2})?))?$/;
    // dateAltRe is used to transform DBF formatted dates (yyyymmdd) as "mm/dd/yyyy"
    var dateAltRe = /^(\d{4})(\d{2})(\d{2})$/;

    Nrm.Models.Application = Backbone.Model.extend(/** @lends module:nrm-ui/models/application.prototype */{

        /**
         * Create a new instance of the Application model.  
         * @constructor
         * @alias module:nrm-ui/models/application
         * @classdesc
         *   A Backbone model that is a representation of the application.  
         *   It provides methods to assist with hierarchical data context navigation and other application-level behavior.
         * @param {module:nrm-ui/models/application~AppConfig} [attributes] The model attributes, aka main application configuration.
         * @param {Object} [options] Inherited from Backbone Model.
         * @see {@link http://backbonejs.org/#Model-constructor|Backbone Model constructor / initialize}
         */
        constructor: function Application() { return Backbone.Model.apply(this, arguments); },
        
        initialize: function() {
            //_.extend(this, Backbone.Events);
        },
               
        /**
         * The "done" callback for the promise returned from the 
         * {@link module:nrm-ui/models/application#getContext|getContext} method.
         * @callback ContextConfigCallback
         * @param {module:nrm-ui/models/application~ContextConfig|module:nrm-ui/models/application~ContextConfigMap} config 
         * The requested {@link module:nrm-ui/models/application~ContextConfig|ContextConfig} object (or 
         * {@link module:nrm-ui/models/application~ContextConfigMap|ContextConfigMap} if apiKey option was omitted)
         * after loading any dynamic configuration.
         */ 
        /**
         * Asynchronously retrieves the {@link module:nrm-ui/models/application~ContextConfig|ContextConfig} 
         * for the apiKey specified in the options parameter.
         * The returned promise object will be resolved after loading any dynamic configuration 
         * from the "url" or "mid" config properties if they are defined. 
         * If no apiKey is specified, retrieves the hash of all context configuration objects.
         * @param {Object} [options] Options
         * @param {string} [options.apiKey] The key for the context config object to retrieve.
         * @param {Object} [caller] Object that will be passed to the deferred callbacks as the "this" object.
         * @returns {external:module:jquery~Promise} A {@link http://api.jquery.com/Types/#Promise|JQuery Promise object}
         * that will resolved as {@link module:nrm-ui/models/application~ContextConfigCallback|ContextConfigCallback} 
         * after loading any dynamic configuration via AMD or AJAX if necessary.
         * If no dynamic configuration loading occurs, the promise will be resolved immediately.
         */
        getContext: function(options, caller) { //apiKey, async, callback, caller) {
            options = $.extend({ }, options);
            var apiKey = options.apiKey || "", loading = contextLoading[apiKey];
            if (loading && !caller) return loading;
            var dfd = new $.Deferred();
            if (loading) {
                $.when(loading).done(function(ctx) {
                    resolve(dfd, ctx, caller);
                }).fail(function(ctx) {
                    reject(dfd, ctx, caller);
                });
            } else {
                contextLoading[apiKey] = $.when(dfd).done(function() {
                    contextLoading[apiKey] = false; // avoids memory leaks
                });
                var allCtx = this.get("context") || { };
                var ctx = options.apiKey ? allCtx[options.apiKey] : allCtx;
                if (!ctx && options.apiKey) {
                    ctx = { "apiKey": options.apiKey };
                    allCtx[options.apiKey] = ctx;
                    resolve(dfd, ctx, caller);
                } else {
                    options.config = ctx;
                    var initContext = function(context, apiKey) {
                        if (context && !context.apiKey) context.apiKey = apiKey;
                        else if (context && !context.refType && context.apiKey !== apiKey) context.refType = apiKey;
                        if (!context.loadType && context.topLevel) context.loadType = "search"; // TODO: this might not be the best place to default this value
                    };
                    $.when(ResourceCache.getConfig(options, this)).done(function(config) {
                        if (ctx !== config) {
                            function extend(key, x, y) {
                                if ((!options.apiKey && !key) || (options.apiKey === key))
                                    return _.omit(_.extend({ }, x, y), "url", "mid", "deps");
                                else
                                    return _.extend({ }, x, y);

                            }
                            if (options.apiKey) {
                                _.each(config, function(item, key) {
                                    allCtx[key] = extend(key, allCtx[key], item);
                                });
                            } else {
                                allCtx = extend("", allCtx, config);
                            }
                            this.set("context", allCtx);
                            ctx = options.apiKey ? allCtx[options.apiKey] : allCtx;
                        }
                        if (options.apiKey) {
                            initContext(ctx, options.apiKey);
                            resolve(dfd, ctx, caller);
                        } else {
                            var dfdQueue = [];
                            _.each(ctx, function(item, key) {
                                initContext(item, key);
                                if (item.topLevel) {
                                    dfdQueue.push(this.getContext({ apiKey: key }));
                                }
                            }, this);
                            if (dfdQueue.length) {
                                $.when.apply($, dfdQueue).always(function() { resolve(dfd, ctx, caller); });
                            } else {
                                resolve(dfd, ctx, caller);
                            }
                        }
                    }).fail(function(config) {
                        reject(dfd, config, caller);
                    });
                }
            }
            return dfd.promise();
        },
        
        /**
         * Indicates whether context subtypes are legal for a given path navigation event.
         * Default behavior only allows subtypes for the "context:beginCreate" event.
         * Applications can customize this behavior by specifying the 
         * {@link module:nrm-ui/models/application~AppConfig|AppConfig#subtypedEvents} option.
         * @param {string} eventName Name of the path navigation event
         * @returns {boolean} 
         */
        enableSubtypeInPath: function(eventName) {
            if (eventName === "context:beginCreate")
                return true;
            var customEvents = this.get("subtypedEvents");
            return ($.isArray(customEvents) && $.inArray(eventName, customEvents) > -1) || !!customEvents;
        },
                
        /**
         * Indicates whether the application uses the {@link http://backbonejs.org/#History|Backbone.History} support for
         * HTML5 "push state" (History API).
         * @returns {boolean} 
         */
        supportsPushState: function() {
            return this.get("pushState") && this.get("urlRoot");
        },
        /**
         * Navigates a Backbone route in a repeatable way that is guaranteed to execute every time the function is called, 
         * in contrast to {@link http://backbonejs.org/#Router-navigate|Backbone.Router#navigate},
         * which will do nothing if the current location is already set to the requested route.
         * @param {string} url The route to navigate, may exclude the # (hash) character.
         * @returns {undefined}
         */
        loadUrl: function(url) {
            Backbone.history.loadUrl(url);
        },
                
        /**
         * Navigates a Backbone route. The navigation will not occur if @link{module:nrm-ui/main.router|Nrm.router} 
         * has not been initialized. Otherwise it behaves identically to Backbone.Router#navigate.
         * @param {string} url
         * @param {Object} options
         * @returns {undefined}
         * @see {@link http://backbonejs.org/#Router-navigate|Backbone.Router#navigate} for a description of the parameters.
         */
        navigateUrl: function(url, options) {
            if (Nrm.router) Nrm.router.navigate(url, options);
        },
                
        /**
         * The "done" callback for the promise returned from the 
         * {@link module:nrm-ui/models/application#getNestedContext|getNestedContext} method.
         * @callback NestedContextCallback
         * @param {module:nrm-ui/models/application~NestedContextResult} options 
         * 
         */ 
        /**
         * @typedef NestedContextResult
         * @property {module:nrm-ui/models/application~ContextConfig} context The nested context result.
         * @property {string} path The original path with group and subtype removed.
         * @property {string} event Name of the event that triggered navigation (if available).
         * @property {string} subtype The subtype value for the navigated path if applicable.
         * @property {string} group The group value for the navigated path if applicable.
         * @property {Array.<string>} paths The individual path components.
         * @property {number} index The current path level.
         * @property {external:module:backbone.Model} model The {@link http://backbonejs.org/#Model|Backbone.Model} that owns the nested context result.
         * @property {string} modelId The id of the model that owns the nested context result.
         * @property {external:module:backbone.Model} parentModel The parent of the model that owns the nested context result.
         *  This property will only be defined on results with nested depth greater than one level.
         * @property {string} parentId The id of the parent of the model that owns the nested context result.
         *  This property will only be defined on results with nested depth greater than one level.
         * @property {string} apiKey For internal use, the root apiKey for the nested context result.
         * @property {module:nrm-ui/models/application~ContextConfig} root The context configuration for 
         *  the first path component.
         * 
         */
        /**
         * Asynchronously retrieves the {@link module:nrm-ui/models/application~ContextConfig|ContextConfig} 
         * for the path specified in the options parameter.
         * @param {Object} options Nested path navigation options. When the function is called recursively, 
         *  the options might also include any properties documented on the 
         *  {@link module:nrm-ui/models/application~NestedContextResult|NestedContextResult} type.
         * @param {string} options.path The path to navigate.
         * @param {module:nrm-ui/models/application~ContextConfig} [options.context] Parent context that the path is relative to.
         * @param {string} [options.event] Name of the event that triggered navigation (required if the path may include subtypes).
         * @param {external:module:jquery~Deferred} [options.dfd] For internal use when called recursively
         * @param {Object} [caller] Object that will be passed to the deferred callbacks as the "this" object.
         * @returns {external:module:jquery~Promise} A {@link http://api.jquery.com/Types/#Promise|JQuery Promise object}
         * that will resolved as {@link module:nrm-ui/models/application~NestedContextCallback|NestedContextCallback} 
         * after navigating the requested path, loading any dynamic configuration via AMD or AJAX if necessary,
         * and overriding the root context configuration from nested context configuration.
         */
        getNestedContext: function(options, caller) {
            var i = options.index = options.index || 0;
            var paths = options.paths;
            if (!paths) {
                paths = options.paths = options.path.split('/');
                if (paths.length > 1 && paths[0] === 'lov') {
                    paths.shift();
                    paths[0] = 'lov/' + paths[0];
                }
                // "beginCreate" event might pass a subtype e.g. create/sites;polygon
                if (this.enableSubtypeInPath(options.event)) { 
                    if (paths.length > 0) {
                        var last = paths[paths.length - 1];
                        var idx = last.indexOf(";");
                        if (idx > 0) {
                            options.subtype = last.substring(idx + 1);
                            paths[paths.length - 1] = last.substring(0, idx);
                        }
                    }
                    options.path = paths.join('/');
                };
                if (options.event === "context:beginCreate" && paths.length > 0 && paths[paths.length - 1] !== "")
                    options.path = options.path + '/';
            }
            if (!options.dfd) {
                options.dfd = new $.Deferred();
            }
            var getResult = function(options) {
                return _.omit(options, "dfd");
            };
            var getModel = function(options, id, parentOpt) {
                return $.when(this.getModel(options.context, id, parentOpt, this)).done(function(model) {
                         options.parentModel = options.model;
                         options.model = model;
                         options.modelId = model.id;
                    }).fail(function(model, response) {
                        options.modelId = id;
                        // model with id not found in this context
                        options.error = this.normalizeErrorInfo((options.context.alias || "Item") + " not found.", model, response);
                        reject(options.dfd, options, caller);
                    });
            };
            if (i >= paths.length) {
                if (options.context && options.subtype && options.context.groupAttr) {
                    var sep = options.subtype.indexOf(",");
                    if (sep > -1) {
                        options.group = options.subtype.substring(0, sep).replace(/%2C/g, ',');
                        if (sep < options.subtype.length - 1)
                            options.subtype = options.subtype.substring(sep + 1);
                        else
                            delete options.subtype;
                    }
                    if (options.group) options.group.replace(/%2C/g, ',');
                    if (options.subtype) options.subtype.replace(/%2C/g, ',');
                } 
                if (options.path.lastIndexOf('/') === options.path.length - 1) {
                    $.when(getModel.call(this, options, "", { 
                        model : options.model, 
                        modelId: options.parentId, 
                        path: options.path.substring(0, options.path.length - 1)
                    })).done(function() {
                        resolve(options.dfd, getResult(options), caller);
                    });
                } else {
                    resolve(options.dfd, getResult(options), caller);
                }
                return;
            }

            var parent = options.context;
            options.apiKey = paths[i];
            var childKey = options.apiKey;
            var child = parent && parent.schema && parent.schema[options.apiKey];
            if (parent) {
                // convert property to context type
                if (!child) {
                    // child context isn't valid for this parent.
                    options.error = { message: "Child context [" + options.apiKey + "] not found in parent context [" + parent.apiKey + "]"};
                    reject(options.dfd, getResult(options), caller);
                    return;
                }
                options.apiKey = child.refType || options.apiKey;
            } 
            function cloneContext(ctx) {
                var clone = _.omit(ctx, "collection", "parent", "topLevel", "schema", "search");
                var schema = ctx.schema, search = ctx.search;
                if (schema) {
                    clone.schema = { };
                    _.each(schema, function(obj, key) {
                        obj = clone.schema[key] = _.clone(obj);
                        if (obj.context) {
                            obj.context = cloneContext(obj.context);
                        }
                    });
                }
                if (search) {
                    clone.search = { };
                    _.each(search, function(obj, key) {
                        if (typeof obj === "object") {
                            obj = _.omit(obj, "lastSearch");
                        }
                        clone.search[key] = obj;
                    });
                }
                return new ContextConfig(clone);
            };
            var parentOpt = { 
                model : options.model, 
                modelId: options.modelId, 
                path: paths.slice(0, i + 1).join('/') 
            };
            $.when(this.getContext(options, this)).done(function(ctx) {
                if (parent) {
                    // schema may override context attributes
                    var ext = child.context;
                    if (!ext || ext.parent !== parent) {
                        var clone = cloneContext(ctx), schema = clone.schema; //, search = clone.search;
                        options.context = _.extend(clone, ext);
                        if (schema && ext && ext.schema) {
                            options.context.schema = _.extend(schema, ext.schema);
                        }
                        // if we wanted a deeper extend of nested search config...
//                        if (search && ext && ext.search) {
//                            _.each(search, function(baseSearch, key) {
//                                var extSearch = ext.search[key];
//                                if (extSearch === false) {
//                                    search[key] = false;
//                                } else if (extSearch) {
//                                    search[key] = _.extend(baseSearch, extSearch);
//                                }
//                            });
//                        }
                        options.context.parent = parent;
                        if (childKey && !options.context.refType) {
                            options.context.refType = options.context.apiKey;
                            options.context.apiKey = childKey;
                        }
                        child.context = options.context;
                    } else {
                        // child schema context was already initialized
                        options.context = child.context;
                    }
                } else {
                    options.root = ctx;
                    options.context = ctx;
                    if (!ctx.topLevel && ctx.triggerRoute) {
                        this.loadUrl("#" + ctx.triggerRoute);
                    }
                }
                options.index = i + 2;
                options.parentId = options.modelId;
                var id = paths.length > i + 1 ? paths[i + 1] : null;
                if (id) {
                    $.when(getModel.call(this, options, id, parentOpt)).done(function() {
                        this.getNestedContext(options, caller);
                    });
    //                 $.when(this.getModel(options.context, id, parentOpt, this)).done(function(model) {
    //                     options.parentModel = options.model;
    //                     options.model = model;
    //                    this.getNestedContext(options, caller);
    //                }).fail(function(model, response) {
    //                    // model with id not found in this context
    //                    options.error = { message: (options.context.alias || "Item") + " not found.", response : response };
    //                    reject(options);
    //                });
                } else {
                    this.getNestedContext(options, caller);
                }
            }).fail(function(model, response) {
                options.error = this.normalizeErrorInfo("Context configuration not found for " + options.apiKey, model, response);
                reject(options.dfd, options, caller);
            });
            return options.dfd.promise();
        },
        
        /**
         * Computes a formatted path that includes the group name.
         * @param {string} path
         * @param {string} groupName
         * @returns {string} The formatted path
         * @todo This could be moved to a static method.
         */
        getGroupPath: function(path, groupName) {
            if (path) return path + ";" + groupName.replace(/,/g, '%2C');
        },
                
        /**
         * Computes a path for a possibly nested ContextConfig object.
         * DO NOT USE the return value is likely to be incorrect, an actual nested path would include model IDs.
         * @deprecated
         * @param {module:nrm-ui/models/application~ContextConfig} ctx
         * @returns {undefined}
         * @todo is this used anywhere?  It seems wrong (path should include model ID).
         */
        getPath: function(ctx) {
           var parent = ctx;
           var path;
           while (parent) {
               path = path ? parent.apiKey + "/" + path : parent.apiKey;
               parent = ctx.parent;
           }
           return path;
        },
        
        /**
         * Asynchronously trigger a path navigation event on {@link module:nrm-ui/main.event|Nrm.event} after navigating
         * to the context via {@link module:nrm-ui/models/application#getNestedContext|getNestedContext}. 
         * If a path is not provided in the data parameter (i.e. it is not a path navigation event), 
         * it is equivalent to calling Nrm.event.trigger directly.
         * @param {type} evtName Name of the event.
         * @param {Object} data Event data
         * @param {string} [data.path] The path to navigate.
         * @param {Object} [caller] Object that will be passed to the deferred callbacks as the "this" object.
         * @fires module:nrm-ui/main.event#"app:routeError"
         * @returns {external:module:jquery~Promise|undefined} The return value from the getNestedContext function
         * if the event data has path information, otherwise undefined.
         */
        triggerEvent: function(evtName, data, caller) {
            if (data && data.path) {
                if (this.userIsAuthorized() === false) {
                    return;
                }
                var options = _.extend({ }, data),
                        dfd = $.Deferred(),
                        async = true,
                        loading;
                
                options.event = evtName;
                
                dfd.done(function(result) {
                    Nrm.event.trigger(evtName, result);
                }).fail(function(result) {
                    /**
                     * Route processing has failed.
                     * @event module:nrm-ui/event#app:routeError
                     * @param {Object} result Error data.
                     */
                    Nrm.event.trigger("app:routeError", result);
                }).always(function() {
                    async = false;
                    if (loading) {
                        Nrm.hideLoadingIndicator(loading);
                    }
                });
                if (async) {
                    loading = Nrm.showLoadingIndicator({
                        message: evtName
                    });
                }

                options.dfd = dfd;
                return this.getNestedContext(options, caller);
            } else {
                Nrm.event.trigger.apply(Nrm.event, arguments);
            }
        },
            
        /**
         * The "done" callback for the promise returned from the 
         * {@link module:nrm-ui/models/application#getMergedConfig|getMergedConfig} method.
         * @callback MergedConfigCallback
         * @param {Object} config The requested config object 
         * 
         */ 
        /**
         * Retrieve a configuration property asynchronously to merge into a ContextConfig object to allow for
         * dynamic loading of configuration.
         * @param {Object} options Options
         * @param {string} options.prop The property name within the ContextConfig to retrieve.
         * @param {string} options.subtype The subkey within the configuration object.
         * @param {module:nrm-ui/models/application~ContextConfig} [options.context] 
         *  The ContextConfig object for the requested configuration. Either this option or "apiKey" option is required.
         * @param {string} [options.apiKey] The apiKey to retrieve the ContextConfig object for the requested configuration.
         *  Either this option or "context" option is required.
         * @param {type} [caller]  Object that will be passed to the deferred callbacks as the "this" object.
         * @returns {external:module:jquery~Promise}
         *  Resolved as {@link module:nrm-ui/models/application~MergedConfigCallback|MergedConfigCallback}
         *  after loading any dynamic configuration via AMD or AJAX if necessary.
         *  If no dynamic configuration loading occurs, the promise will be resolved immediately.
         */
        getMergedConfig: function(options, caller) { 
             var dfd = new $.Deferred();
             var onFail = function(data) {
                reject(dfd, data, caller);
             };
             var apiKey = options.apiKey || (options.context && (options.context.refType || options.context.apiKey));
             var getConfig = function(ctx) {
                 var orig = ctx[options.prop];
                 if (options.subtype && orig)
                     orig = orig[options.subtype];
                 options.config = orig;
                 $.when(ResourceCache.getConfig(options, this)).done(function(cfg) { 
                     var config = cfg;
                     if (cfg && orig !== cfg) {
                         config = cfg[apiKey];
                         if (config) {
                             var ext = ctx[options.prop];
                             ctx = $.extend(ctx, config);
                             config = $.extend({ }, _.omit(ext, "url", "mid", "deps"), ctx[options.prop]);
                             ctx[options.prop] = config;
                             if (options.subtype)
                                config = config[options.subtype];
                         } else {
                             config = orig;
                         }
                     }
                     resolve(dfd, config, caller);
                 }).fail(onFail);
             };
             if (options.context)
                 getConfig.call(this, options.context);
             else
                $.when(this.getContext(options, this)).done(getConfig).fail(onFail);
             return dfd.promise();
        },
                
        /**
         * Retrieve the editor configuration asynchronously to merge into a ContextConfig object to allow for
         * dynamic loading of configuration.  
         * @param {module:nrm-ui/models/application~ContextConfig} context 
         *   The ContextConfig object for the requested configuration
         * @param {Object} [caller]  Object that will be passed to the deferred callbacks as the "this" object.
         * @returns {external:module:jquery~Promise}
         * @see {@link module:nrm-ui/models/application#getMergedConfig|getMergedConfig} for details on the return value.
         */
        getEditorConfig: function(context, caller) {
            var options = { context: context, async: true, prop: "editor" };
            return this.getMergedConfig(options, caller);
        },
                
        /**
         * Retrieve the editor configuration asynchronously to merge into a ContextConfig object to allow for
         * dynamic loading of configuration.
         * @param {module:nrm-ui/models/application~ContextConfig} context 
         *   The ContextConfig object for the requested configuration
         * @param {string} searchKey the search subkey to retrieve, e.g. "basic", "advanced"
         * @param {Object} [caller]  Object that will be passed to the deferred callbacks as the "this" object.
         * @returns {external:module:jquery~Promise}
         * @see {@link module:nrm-ui/models/application#getMergedConfig|getMergedConfig} for details on the return value.
         */
        getSearchConfig: function(context, searchKey, caller) {
            var options = { context: context, async: true, prop: "search", subtype: searchKey };
            return this.getMergedConfig(options, caller);
        },
                
        /**
         * Get the namespace object for the provided entity context, used for caching modules retrieved dynamically
         * via {@link module:nrm-ui/models/application#getCtor|getCtor} and the related functions.  
         * If the ContextConfig does not define a namespace, the application namespace will be used as the namespace key.
         * If neither are specified, the default value "Nrm" will be used as the key.
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration
         * @returns {Object} The namespace object.  Note that before AMD was adopted, this function returned the global 
         * namespace object, but this was changed to a private namespace based on AMD best practice of avoiding globals.
         */
        getNamespace: function(ctx) {
            var ns = (ctx && ctx.namespace) || this.get("namespace") || "Nrm";
            return namespaces[ns] || (namespaces[ns] = { }); //window[ns];
        },
                
        /**
         * The "done" callback for the promise returned from the 
         * {@link module:nrm-ui/models/application#getCtor|getCtor} method.
         * @callback GetCtorResolvedCallback
         * @param {function} ctor The requested view, model or collection constructor.
         */
        /**
         * A callback that can be passed as an option to the {@link module:nrm-ui/models/application#getCtor|getCtor} 
         * method to provide a generic constructor if the application does not have a module configured
         * for the requested constructor type.
         * @callback GenericCtorCallback
         * @param {module:nrm-ui/models/application~ContextConfig} context The entity context configuration
         * @param {external:module:jquery~Deferred} dfd Do not use this, instead create a new Deferred object.
         *   This parameter may be removed in a future version.
         * @return {?external:module:jquery~Promise} 
         *  The callback function may return a {@link http://api.jquery.com/Types/#Promise|JQuery Promise object}
         *  that resolves as {@link module:nrm-ui/models/application~GetCtorResolvedCallback|GetCtorResolvedCallback} 
         *  if further asynchronous processing such as loading an AMD module is required to create the 
         *  generic constructor.
         * @todo While documenting this callback function, I discovered a flaw in the design.
         *  By exposing the {@link http://api.jquery.com/Types/#Deferred|jQuery.Deferred} object as a parameter,
         *  we allow the generic implementation to resolve it prematurely, when the 
         *  {@link module:nrm-ui/models/application~GetCtorPostProcessCallback|GetCtorPostProcessCallback} 
         *  might expect to complete further asynchronous processing (e.g. loading business rules)
         *  that should be completed before the promise is resolved.
         *  
         */
        /**
         * A callback that can be passed as an option to the {@link module:nrm-ui/models/application#getCtor|getCtor} 
         * method to allow for further post-processing of the constructor before resolving the promise.
         * @callback GetCtorPostProcessCallback
         * @param {object} ns The namespace object that provided the constructor definition.
         * @param {string} name The name of the entity
         * @param {function} ctor The requested view, model or collection constructor.
         * @returns {?external:module:jquery~Promise} 
         *  The callback function may return a {@link http://api.jquery.com/Types/#Promise|JQuery Promise object}
         *  if further asynchronous processing is required.
         */
        /**
         * Get the constructor for a type of view, model or collection either by loading an AMD module
         * or using a generic constructor.  Usually applications will not call this function directly.
         * Note that the result will be cached by namespace 
         * (see {@link module:nrm-ui/models/application#getNamespace|getNamespace}), 
         *  then by type option, then by suffix option.
         * @param {Object} options Options
         * @param {module:nrm-ui/models/application~ContextConfig} [options.context] 
         *  The ContextConfig object for the requested constructor. Either this option or "apiKey" option is required.
         * @param {string} [options.apiKey] The apiKey to retrieve the ContextConfig object for the requested constructor.
         *  Either this option or "context" option is required.
         * @param {string} [options.suffix] Suffix which may be converted to a module type key as described in 
         *   {@link module:nrm-ui/models/application#getModuleLookup|getModuleLookup} function.
         * @param {string} [options.module] Module type key to assist with looking up a custom suffix 
         *   that is not supported in {@link module:nrm-ui/models/application#getModuleLookup|getModuleLookup} function
         * @param {string} [options.type] Type key, expected values include "Views", "Models" or "Collections"
         * @param {module:nrm-ui/models/application~GenericCtorCallback} [options.generic]
         *  A callback function to create a generic constructor if the application does not have a module configured
         *  for the request constructor type.
         * @param {module:nrm-ui/models/application~GetCtorPostProcessCallback} [options.callback] 
         *  Callback for post-processing the constructor.
         * @param {Object} [caller]  Object that will be passed to the deferred callbacks as the "this" object.
         * @returns {external:module:jquery~Promise}
         *  Resolves as {@link module:nrm-ui/models/application~GetCtorPostProcessCallback|GetCtorResolvedCallback} 
         *  after loading any dynamic configuration via AMD or AJAX if necessary.
         *  If no dynamic configuration or module loading occurs, the promise will be resolved immediately.
         * 
         */
        getCtor: function(options, caller) { //context, apiKey, type, suffix, generic, callback, caller) {
            var ctx = options.context || this.getContext(options);
            var self = this;
            var dfd = new $.Deferred();
            var onFail = function(data) {
                 reject(dfd, data, caller);
            };
            var onSuccess = function(ns, name, memo) {
                if (options.callback) {
                    $.when(options.callback(ns, name, memo)).done(function() {
                        resolve(dfd, memo, caller); 
                    }).fail(onFail);
                } else {
                    resolve(dfd, memo, caller); 
                }
            };
            $.when(ctx).done(function(context) {
               var ns = self.getNamespace(context);
               var name = options.entityName = self.getModelName(context);
               var mod = options.module || self.getModuleLookup(options);
               if (context.modules && context.modules[mod]) {
                   require([context.modules[mod]], function(ctor) {
                       onSuccess(ns, options.entityName, ctor);
                   });
               } else {
                    if (options.suffix) name = name + options.suffix;
                    if (ns && !ns[options.type])
                        ns[options.type] = { };
                    var ctor = ns && name && ns[options.type][name];
                    if (!ctor) {
                        console.log("Generating generic constructor for " + name);
                        if (!options.generic) {
                            onFail({ error: normalizeErrorInfo("Generic constructor not available for " + name) });
                            return;
                        }
                        ctor = options.generic.call(self, context, dfd);
                        if (ctor && ns && name) {
                             ns[options.type][name] = ctor;
                        }
                    }
                    if (!ctor.promise) {
                        onSuccess(ns, options.entityName, ctor);
                    } else { 
                        $.when(ctor).done(function(c) {
                            if (c && ns && name) ns[options.type][name] = c;
                            onSuccess(ns, options.entityName, c);
                        }).fail(onFail);
                    }
               }
            }).fail(onFail);
            return dfd.promise();
        },
        
        /**
         * Maps a type suffix to a module type key.
         * If the suffix is not recognized, the suffix specified in the options param will be returned.
         * Currently this function will translate the following suffixes to module type keys:
         * Collection => collection, 
         * View => editor, 
         * SearchView => search, 
         * AdvSearchView => advSearch,
         * ResultsView => results
         * @param {Object} options Options
         * @param {string} options.suffix The suffix to translate to a module key.
         * @returns string The module type key.
         */
        getModuleLookup: function(options) {
            var suffixes = {
                "Collection": "collection",
                "View": "editor",
                "SearchView": "search",
                "AdvSearchView": "advSearch",
                "ResultsView": "results",
                "ModalSearchView": "modalSearch"
            };
            return options.suffix ? (suffixes[options.suffix] || options.suffix) : null;
        },
        
        /**
         * Retrieves a view constructor asynchronously to allow for dynamic configuration loading.
         * The result may be an AMD module if it is found in the application configuration,
         * or a "generic" constructor created on the fly.
         * @param {Object} options Options 
         * @param {string} [options.suffix=View] Indicator of the type of view.
         * @param {Object} [caller] Object that will be passed to the deferred callbacks as the "this" object.
         * @returns {external:module:jquery~Promise}
         * @see {@link module:nrm-ui/models/application#getCtor|getCtor} for more details on the options and return value.
         */
        getViewConstructor: function(options, caller) { //context, apiKey, suffix, generic, callback, src) {
            options.type = "Views";
            options.suffix = options.suffix || "View";
            return this.getCtor(options, caller);
        },
                
        /**
         * Do not use this function, it will be removed in future version.
         * @deprecated
         * @param {string} viewName
         * @param {Object} generic
         * @returns {Object}
         * The view constructor.
         * @todo Remove this function after making sure all references to it are removed.
         */
        getExtendedView: function(viewName, generic) {
            console.warn("Nrm.app.getExtendedView is deprecated in AMD implementation.");
            var ns = this.getNamespace();
            if (!generic && Nrm.Views)
                generic = Nrm.Views[viewName];
            return (ns && ns.Views && viewName && ns.Views[viewName]) || generic;
        },
                
        /**
         * Retrieves a collection constructor asynchronously to allow for dynamic configuration 
         * and business rule loading.
         * The result may be an AMD module if it is found in the application configuration,
         * or a "generic" constructor created on the fly.
         * @param {Object} options Options 
         * @param {string} [options.suffix=Collection] Indicator of the type of collection.
         * @param {Object} [caller]  Object that will be passed to the deferred callbacks as the "this" object.
         * @returns {external:module:jquery~Promise}
         * @see {@link module:nrm-ui/models/application#getCtor|getCtor} for more details on the options and return value.
         */
        getCollectionConstructor: function(options, caller) { //context, apiKey, url, callback, src) {
            options.type = "Collections";
            options.suffix = options.suffix || "Collection";
            options.apiKey = options.apiKey || options.context.refType || options.context.apiKey;
            options.generic = options.generic || function(ctx, dfd) {
                var rootApiKey = (options.context && (options.context.refType || options.context.apiKey)) || options.apiKey;
                var ext = { 
                    url: options.url || this.getDefaultUrl(rootApiKey)
                };
                var sort = ctx.sortAttr !== undefined ? ctx.sortAttr : ctx.nameAttr;
                if (sort) {
                    ext.comparator = this.getComparator(sort);
                }
                $.when(this.getModelConstructor({ 
                    apiKey: options.apiKey, 
                    context: options.context
                }, caller)).done(function(model) {
                    ext.model = model;
                    resolve(dfd, Backbone.Collection.extend(ext), caller);
                }).fail(function(data) { reject(dfd, data, caller); });
                return dfd;
            };
            options.callback = function(ns, modelName, ctor) {
                if (options.context && options.context.loadRules && ctor && ctor.prototype.model) {
                    var match = modelName.match(new RegExp("(.+)" + options.suffix + "$"));
                    if (match && match.length > 1) modelName = match[1];
                    return ensureRulesLoaded(modelName, ctor.prototype.model, options, caller);
                }
            };
            return this.getCtor(options, caller);
        },
                
        /**
         * Converts an array of attribute names (or function names as described in 
         * {@link module:nrm-ui/models/application#getModelVal|getModelVal}) into a comparator suitable for the 
         * Backbone.Collection#comparator property. If the input is a string or function, it's assumed to be a 
         * suitable comparator value and returned as-is.
         * @param {(string|Array.<string>|function)} attr
         * @returns {(string|function)}
         * @todo consider support for descending sorts if the parameter or an item in the array-valued parameter 
         * is an object like { prop: "name", desc: true } instead of a string.
         * @see {@link http://backbonejs.org/#Collection-comparator|Backbone.Collection#comparator}
         */
        getComparator: function(attr) {
            if (_.isArray(attr)) {
                return function(m1, m2) {
                    var ret = 0;
                    $.each(attr, function(i, t) {
                        var t1 = Nrm.app.getModelVal(m1, t), t2 = Nrm.app.getModelVal(m2, t);
                        if (t1 === t2)
                            return true;
                        var sortee = [t1, t2];
                        sortee.sort();
                        ret = (sortee[0] === t1) ? -1 : 1;
                        return false;
                    });
                    return ret;
                };
            } else {
                return attr;
            }
        },
                
        /**
         * Retrieves a model constructor asynchronously to allow for dynamic configuration 
         * and business rule loading.
         * The result may be an AMD module if it is found in the application configuration,
         * or a "generic" constructor created on the fly.
         * @param {Object} options Options 
         * @param {Object} [caller] Object that will be passed to the deferred callbacks as the "this" object.
         * @returns {external:module:jquery~Promise}
         * @see {@link module:nrm-ui/models/application#getCtor|getCtor} for more details on the options and return value.
         */
        getModelConstructor: function(options, caller) { //ctx, apiKey, callback, src) {
            options.type = "Models", options.module = "model";
            options.apiKey = options.apiKey || options.context.refType || options.context.apiKey;
            options.generic = options.generic || function(ctx,dfd) {
               var generic = _.bind(function(RuleCollection, BusinessObject) {
                    var rootApiKey = (options.context && (options.context.refType || options.context.apiKey)) || options.apiKey;
                    var modelOpts = { 
                       urlRoot: this.getDefaultUrl(rootApiKey),
                       validate: function(attributes, opts) {
                           var mc = this.constructor;
                           if (mc && mc.rules) {
                               if (!this.brokenRules)
                                   this.brokenRules = new RuleCollection();
                               return mc.checkRules(this);
                           }
                       }
                   };
                   if (ctx.idAttr && ctx.idAttr !== "id") {
                       modelOpts.idAttribute = ctx.idAttr;
                   }   
                   if (ctx.defaults)
                       modelOpts.defaults = ctx.defaults;
                   resolve(dfd, BusinessObject.extend(modelOpts), caller);
               }, this);
               require(['../collections/ruleCollection', './businessObject'], generic); 
               return dfd;
            };
            options.callback = function(ns, modelName, ctor) {
                if (options.context && options.context.loadRules)
                    return ensureRulesLoaded(modelName, ctor, options, caller);
            };
            return this.getCtor(options, caller);
        },
        
        /**
         * Gets the entity name from a ContextConfig object.
         * This may be configured directly with the "modelName" property, or derived from "alias" or "apiKey".
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration
         * @returns {string}
         * @see {@link module:nrm-ui/models/application#toIdentifier|toIdentifier function} for details on how the
         *  alias is translated to entity name.
         * @see {@link module:nrm-ui/models/application#pathToIdentifier|pathToIdentifier function} for details on how the
         *  apiKey is translated to entity name.
         */
        getModelName: function(ctx) {
            var model = ctx.modelName;
            return ctx.modelName = model || this.toIdentifier(ctx.alias) || this.pathToIdentifier(ctx.apiKey);
        },
        
        /**
         * Converts a "user-friendly" string to a value closely resembling a the standard naming convention for an
         * identifier by stripping all whitespace characters.
         * Note that this is not intended to be foolproof, it is just a quick way to provide a fallback value
         * that will be correct most of the time for cases where the actual identifier can be configured if the
         * default fallback is not what we want.
         * @param {string} s An input string that may contain spaces
         * @returns {string} An identifier string
         * @todo Consider stripping all non-alphanumeric characters that are commonly considered invalid for an identifier.
         */
        toIdentifier: function(s) {
            return s && s.replace(/\W/g, '');
        },
        
        /**
         * Converts a path string to a value closely resembling a the standard naming convention for an identifier 
         * by extracting the value after the last path separator and capitalizing the first character.
         * Note that this is not intended to be foolproof, it is just a quick way to provide a fallback value
         * that will be correct most of the time for cases where the actual identifier can be configured if the
         * default fallback is not what we want.
         * @param {string} s An input string that may path separators (forward-slash character)
         * @returns {string} An identifier string
         * @todo Consider stripping all non-alphanumeric characters that are commonly considered invalid for an identifier.
         */
        pathToIdentifier: function(s) {
            var p = s.split("/");
            return _.reduce(p, function(memo, part) {
                return memo + (part && (part.substring(0, 1).toUpperCase() + part.substring(1)));
            }, "");
        },
        /**
         * Convert a PascalCase or camelCase identifier to a format with spaces between the words.
         * @param {String} s The text to convert
         * @returns {String}
         * The converted text
         */
        identifierToLabel: function(s) {
            if (s && _.isString(s)) {
                s = s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([a-z])([0-9])/g, '$1 $2').replace('_', ' ');
                return s.substr(0,1).toUpperCase() + s.substr(1);
            }
            return s;
        },
        /**
         * Get the REST API "root URL" relative to the application context path.  This will use the default value "api/" 
         * unless it is configured via the apiRootUrl property in {@link module:nrm-ui/models/application~AppConfig|AppConfig}.
         * @returns {string} The REST API URL prefix
         */
        getRootUrl: function() {
            return this.get("apiRootUrl") || "api/";
        },
          
        /**
         * If {@link module:nrm-ui/models/application#supportsPushState|supportsPushState} returns true, prefixes a 
         * relative URL with the urlRoot to work around the problem with broken relative URLs. Input string will be 
         * returned unchanged if not using "pushState" or the input is an absolute URL.
         * @param {string} url The url to convert from a relative URL.
         * @returns {string} the prefixed URL if relative URLs need to be converted otherwise returns the original URL.
         */
        resolveUrl: function(url) {
            return resolveUrl(url);
        },
                
        /**
         * Computes the default URL for a root-level entity context key. Primarily used in generic model/collection 
         * constructors.
         * @param {string} apiKey The entity context key
         * @returns {string} The URL for this entity context (relative to application context path)
         */
        getDefaultUrl: function(apiKey) {
            return this.getRootUrl() + apiKey;
        },
                
        /**
         * Computes the default URL for the specified kind of search for an entity context.
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration
         * @param {string} [path] The path minus root prefix and search suffix.  Currently not used.
         * @param {string} [type] The search type, should be a key in the
         *  {@link module:nrm-ui/models/application~SearchConfigMap|SearchConfigMap} from the configuration, although
         *  defaults will be used if the key is not found.
         * @returns {string} The search URL (relative to application context path)
         */
        getSearchUrl: function(ctx, path, type) {
            if (!type || !ctx.search || !ctx.search[type])
                return this.formatSearchUrl(ctx, path, ctx.searchUrlSuffix);
            else {
                return this.formatSearchUrl(ctx, path, ctx.search[type].searchSuffix);
            }
        },
                
        /**
         * Computes the URL for a search in an entity context.
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration
         * @param {string} [path] The path minus root prefix and search suffix.  Currently not used.
         * @param {string} [suffix] The search suffix, which defaults to "/search" only if POST method is used for searches.
         * @returns {string} The search URL (relative to application context path)
         * @todo Consider using the path parameter, instead of overriding with properties of the ContextConfig which
         *  might be better to in the {@link module:nrm-ui/models/application#getSearchUrl|getSearchUrl function} 
         *  (or perhaps not at all).
         */  

        formatSearchUrl: function(ctx, path, suffix) {
            var url = (this.get("apiSearchUrl") || this.getRootUrl()) + (ctx.refType || ctx.apiKey); //path;
            if (suffix === undefined && ctx["postSearch"])
                suffix = "/search";
            return suffix ? url + suffix : url;
        },
                
        /**
         * Computes the default URL for a count REST API request for the specified kind of search in an entity context.
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration
         * @param {string} [path] The path minus root prefix and search suffix.  Currently not used.
         * @param {string} [searchType=basic] The search type, should be a key in the
         *  {@link module:nrm-ui/models/application~SearchConfigMap|SearchConfigMap} from the configuration
         *  to provide a suffix other than the default "/count" which will be used if the key is not found.
         * @returns {string} The count URL (relative to application context path)
         * @todo Consider using the path parameter, instead of overriding with properties of the ContextConfig which
         *  might be better to in the {@link module:nrm-ui/models/application#getSearchUrl|getSearchUrl function} 
         *  (or perhaps not at all).
         */
        getCountUrl: function(ctx, path, searchType) {
            searchType = searchType || "basic";
            var url = (this.get("apiSearchUrl") || this.getRootUrl()) + (ctx.refType || ctx.apiKey); //path;
            var suffix = ctx.search && ctx.search[searchType] && ctx.search[searchType].countSuffix;
            if (suffix === undefined)
                suffix = "/count";
            return suffix ? url + suffix : url;
        },
        
  
        /**
         * The "done" callback for the promise returned from the 
         * {@link module:nrm-ui/models/application#getCollection|getCollection} method.
         * @callback GetCollectionCallback
         * @param {external:module:backbone.Collection} collection The requested collection.
         */
        /**
         * Asynchronously retrieve a collection for an entity context.  This may be a root collection, or a nested collection.
         * Supports lazy loading and ensures that multiple simultaneous calls to the same collection path will not spawn
         * duplicate requests to the REST API.
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration
         * @param {Object} [options] Options
         * @param {Boolean} [options.immediate=false] Return a promise as soon as possible, mabye before collection is 
         * done loading.
         * @param {string} [options.ajax] Additional ajax options
         * @param {string} [options.model] Parent model for retrieving a nested collection, or if not specified, then both 
         *  modelId and path are required if retrieving a nested collection.
         * @param {string} [options.modelId] ID of the parent model for retrieving a nested collection, can be omitted 
         * if the model option is specified but otherwise required if retrieving a nested collection.
         * @param {string} [options.path] Path for retrieving a nested collection, can be omitted if the model option is 
         *  specified but otherwise required if retrieving a nested collection. The path should represent the full path
         *  to the requested collection.
         * @param {Object} [caller] Object that will be passed to the deferred callbacks as the "this" object.
         * @fires module:nrm-ui/main.event#"context:collectionLoaded"
         * @returns {external:module:jquery~Promise}
         *  Resolves as {@link module:nrm-ui/models/application~GetCollectionCallback}
         * @todo: I'm not sure why the modelId option is required along with the path option, seems like it could
         *  determine the model id from the path although it's quite likely that there was a complication that prevented this.
         */
        getCollection: function(ctx, options, caller) {
            var parentId = options && ((options.model && options.model.id) || options.modelId),
                    dfd = new $.Deferred(),
                    path = options && options.path,
                    successCallback = options && options.ajax && options.ajax.success,
                    errorCallback = options && options.ajax && options.ajax.error,
                    immediate = options && options.immediate,
                    modelOpt,
                    subPath,
                    paths,
                    opt = _.extend({}, ctx && ctx.ajaxOptions, options && options.ajax, { 
                        success: function(collection, response, options) {
                           resolveWithCallback(dfd, successCallback, collection, response, options, caller);
                        }, 
                        error: function(model, response, options) {
                           rejectWithCallback(dfd, errorCallback, model, response, options, caller);
                        },
                        reset: true
                   });
            function ensureCollection(model, attr, value) {
                if (!model.collections) {
                    model.collections = {};
                } else if (model.collections === model.constructor.prototype.collections) {
                    // do not modify the collections object on the model prototype if it is defined
                    model.collections = _.clone(model.collections);
                }
                model.collections[attr] = value;
            }
            function loadCollection(collection, model, id, attr) {
                function triggerRootLoadEvent(coll) {
                    if (!model) {
                        /**
                         * Triggered when a root collection has loaded.
                         * @event module:nrm-ui/event#context:collectionLoaded
                         * @param {external:module:backbone.Collection} collection The collection that was loaded.
                         * @param {Object} options
                         * @param {module:nrm-ui/models/application~ContextConfig} options.context The context
                         *  configuration.
                         */
                        Nrm.event.trigger("context:collectionLoaded", coll, { context: ctx });
                    }
                }
                if (collection && collection.promise) {
                    // subsequent calls after initial load but before async resolution has occurred will end up here
                    $.when(collection).done(opt.success).fail(opt.error);
                } else if (!collection || _.isArray(collection)) {
                    // temporary set the collection to the deferred object for async handling of multiple calls
                    $.when(this.getCollectionConstructor({ context: ctx }, this)).done(function(factory) {
                        var newColl;
                        if (model) {
                            newColl = getCollectionForModel.call(this, model);
                        } else {
                            newColl = ctx.collection;
                        }
                        if (newColl instanceof Backbone.Collection) {
                            if (!immediate && newColl && newColl.loading) {
                                $.when(newColl.loading).done(opt.success).fail(opt.error);
                            } else {
                                opt.success(newColl, { }, options);
                            }
                            return;
                        }
                        if (model) {
                            // pass attr and parentModel options to be consistent with getNestedModel
                            newColl = new factory(collection || null, {
                                attr: attr,
                                parentModel: model
                            });
                        } else {
                            newColl = collection ? new factory(collection) : new factory();
                        }
                        if (ctx.parent && id) {
                            //it's possible this should only happen for loadType === "auto"
                            // also, may need to use full path in some cases
                            newColl.url = this.getDefaultUrl(ctx.parent.refType || ctx.parent.apiKey) + "/" + id + "/" 
                                    + attr;
                        }
                        if (model) {
                            // moved from registerChildEvents - Make sure cloning the prototype object (if it is one) is done first
                            ensureCollection(model, attr, newColl);
                            this.registerChildEvents(model, newColl, ctx, path, attr);
                        }
                        else {
                            ctx.collection = newColl;
                        }

                        if (!collection && ctx.loadType === "auto" && !(model && model.isNew())) {
                            if (!immediate) {
                                newColl.loading = dfd.promise(); // if immediate, this deferred needs to resolve when there's a collection instance
                                $.when(newColl.fetch(opt)).done(function() {
                                    newColl.loading = false;
                                    triggerRootLoadEvent(newColl);
                                });
                            } else {
                                fetchImmediate(newColl);
                            }
                        } else {
                            // collection was loaded from an array OR loadType is not "auto" OR the parent is a new model.
                            if (ctx.loadType == "auto") {
                                newColl.loading = false;
                            }
                            opt.success(newColl, { }, options);
                            if (model) {
                                if (collection) {
                                    // this event is required for tree binding if the collection was loaded from an array
                                    model.trigger("child:load", model, newColl, $.extend({ }, opt, { 
                                        context: ctx, 
                                        attr: attr, 
                                        path: path }));
                                }
                                if (ctx.loadType == "auto" || collection) {
                                    // Remove the collection after saving so that it will be rehydrated from the model
                                    // The "saved" event is only triggered if model is saved using Nrm.app.saveModel
                                    // This needs to happen if the collection was loaded from an array, 
                                    // or the loadType == "auto" and the parent is a new model.
                                    model.listenToOnce(model, 'saved', function() {
                                        if (attr && model.collections) {
                                            delete model.collections[attr];
                                        }
                                    });
                                }
                            }
                            triggerRootLoadEvent(newColl);
                        }               
                    }).fail(opt.error);
                } else if (_.isFunction(collection)) {
                    $.when(collection.call(model || this, ctx, path, options)).done(opt.success).fail(opt.error);
                } else if (collection.loading === undefined && collection.length === 0 && ctx.loadType === "auto") {
                    if (!immediate) {
                        collection.loading = dfd.promise();
                        $.when(collection.fetch(opt)).done(function() {
                            collection.loading = false;
                        });
                    } else {
                        fetchImmediate(collection);
                    }
                } else if (!immediate && collection.loading) {
                    $.when(collection.loading).done(function(collection, response, options) {
                       opt.success(collection, response, options); 
                    }).fail(opt.error);
                } else {
                    opt.success(collection, { }, options);
                }
            };
            function fetchImmediate(c) {
                var fetching = $.when(c.fetch(opt)).done(function() {
                    c.loading = false;
                    fetching = false;
                });
                if (fetching) {
                    var whenFetched = $.Deferred();
                    $.when(fetching).done(function(resp){
                        whenFetched.resolve(c, resp, opt);
                    }).fail(function(resp){
                        whenFetched.reject(c, resp, opt);
                    });
                    c.loading = whenFetched.promise();
                }
                opt.success(c, {}, options);
            }
            function getCollectionForModel(model) {
                var collection;
                if (model.collections) {
                    collection = model.collections[ctx.apiKey];
                }
                if (!collection) {
                    collection = this.getModelVal(model, ctx.apiKey); //model.get(ctx.apiKey);
                }
                return collection;
            }
            function loadFromModel(model) {
                var collection = getCollectionForModel.call(this, model);
                loadCollection.call(this, collection, model, parentId, ctx.apiKey);
            }
            
            if (options && options.model) {
                loadFromModel.call(this, options.model);
            } else if (ctx.parent) {
                modelOpt = { };
                subPath = "/" + parentId + "/" + ctx.apiKey;
                if (path && path.length > subPath.length) {
                    modelOpt.path = path.substring(0, path.length - subPath.length);
                    paths = modelOpt.path.split("/");
                    if (paths.length > 2) {
                        modelOpt.modelId = paths[paths.length - 2];
                    }
                }
                $.when(this.getModel(ctx.parent, parentId, modelOpt, this)).done(function(model) {
                    loadFromModel.call(this, model);
                }).fail(opt.error);
            } else {
                loadCollection.call(this, ctx.collection);
            }
            return dfd.promise();
        },

        /**
         * Asynchronously retrieve a nested model for an entity context.  If the parent is an existing model, the nested
         * model will be fetched from REST API using default URL pattern api/{context.parent.refType}/id/{options.attr}
         * if it is not already set as a model attribute, and by default sets the model attribute as the result.
         * If the context apiKey doesn't match the attribute to fetch, and the parent model has an attribute for the 
         * apiKey that evaluates as a string, the child model will be fetched by ID instead of the association.
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration
         * @param {Object} options Options
         * @param {string} options.model Parent model
         * @param {string} options.attr Child attribute name 
         * @param {boolean} [options.temporary=false] Indicates that the result should not be set as a model attribute.
         * @param {Object} [options.ajax] Additional ajax options
         * @param {Object} [caller] Object that will be passed to the deferred callbacks as the "this" object.
         * @returns {external:module:jquery~Promise}
         *  Resolves as {@link module:nrm-ui/models/application~GetModelCallback|GetModelCallback}
         */
        getNestedModel: function(context, options, caller) {
            var dfd = $.Deferred(),
                    parentModel = options.model,
                    attr = options.attr,
                    loading,
                    successCallback = options && options.ajax && options.ajax.success,
                    errorCallback = options && options.ajax && options.ajax.error,
                    opt = _.extend({}, context && context.ajaxOptions, options && options.ajax, { 
                        success: function(model, response, options) {
                            if (model.loading && model.loading === loading) {
                                model.loading = false;
                            }
                            resolveWithCallback(dfd, successCallback, model, response, options, caller);
                        }, 
                        error: function(model, response, options) {                            
                            if (model.loading && model.loading === loading) {
                                model.loading = false;
                            }
                            rejectWithCallback(dfd, errorCallback, model, response, options, caller);
                        }
                   });
            
            $.when(this.getModelConstructor({context: context}, this)).done(function(Model) {
                var childModel = this.getModelVal(parentModel, attr), plainObj, fkValue;
                if (childModel instanceof Backbone.Model) {
                    opt.success(childModel, false, options);
                    return;
                } else if (childModel !== undefined) {
                    fkValue = childModel;
                } else {
                    plainObj = $.isPlainObject(childModel);
                    fkValue = context.apiKey !== attr && this.getModelVal(parentModel, context.apiKey);
                }
                childModel = new Model(plainObj && childModel, {
                    attr: attr,
                    parentModel: parentModel
                });
                // set the parent model attribute 
                if (!options.temporary) {
                    this.setModelVal(parentModel, attr, childModel);
                }
                // if the model attribute is a plain object, just convert it to a Backbone model and don't fetch
                // also don't fetch if the parent model is new and we don't have an FK value
                // or the FK value is an empty string or null
                if (plainObj || (!_.isString(fkValue) && parentModel.isNew()) || (fkValue === '' || fkValue === null)) {
                    opt.success(childModel, false, options);
                } else {
                    if (_.isString(fkValue)) {
                        childModel.set(childModel.idAttribute, fkValue);
                    } else {
                        childModel.url = _.result(parentModel, 'url') + "/" + context.apiKey;
                    }
                    loading = childModel.loading = childModel.fetch(opt);
                }
            }).fail(opt.error);
            return dfd.promise();
        },
        /**
         * Hooks up events triggered by the collection so that they bubble up to the parent model.
         * @param {external:module:backbone.Model} model The parent model
         * @param {external:module:backbone.Collection} collection The child collection
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The child entity context configuration
         * @param {string} path The path to the collection; null indicates a lazy-loaded collection, e.g. from 
         * {@link module:nrm-ui/models/nestedModel}.
         * @param {string} attr Attribute name (or path component) of the child collection
         * @returns {external:module:backbone.Model}
         * Returns the parent model to support chaining.
         */
        registerChildEvents: function(model, collection, ctx, path, attr) {
            attr = attr || (ctx && ctx.apiKey);
            if (!path) {
                // relative path e.g. triggered by child collection initialized in nrm-ui/models/nestedModel
                path = './' + attr;
            }
            // note: the "collection" might be a child model in some nested model scenarios
            var isCollection = collection instanceof Backbone.Collection;
            model.listenTo(collection, 'all', function(event) {
                var args = Array.prototype.slice.apply(arguments),
                    // many Backbone events have three arguments (not counting event name which is args[0])
                    // e.g. collection.trigger('add', model, collection, options)
                    // some only have two arguments e.g. collection.trigger('reset', collection, options)
                    //  or model.trigger('change', model, options)
                    optIdx = args.length > 3 ? 3 : 2,
                    // if there are at least three arguments (not counting event name), assume the 3rd arg is options
                    // otherwise, avoid extending an unknown second arg unless it is a plain object
                    hasOptions = optIdx === 3 || $.isPlainObject(args[optIdx]),
                    options = (hasOptions && _.extend({}, arguments[optIdx])) || {},
                    parent;
                    
                if (optIdx === 2) {
                    // NOTE: all mentions of argument index in the comments in this block don't count the event name
                    // always pass the child options as the third argument to event handlers
                    optIdx = 3;
                    // inject a reference to the child collection as the second argument only in following scenarios:
                    // - first arg is not the child collection/model 
                    //   e.g. exclude reset event or change event if child is a model
                    // - second arg is null/undefined OR a plain object (assumed options hash, shifted to third arg) 
                    //   e.g. change event if child is a collection
                    // this ensures the child:change event propagated from a model in a child collection will pass a
                    // reference to the child collection as second argument to event handlers
                    if (args[1] !== collection && (args[2] == null || hasOptions)) {
                        args[2] = collection;
                    }
                }
                args[optIdx] = options;
                if (event.substring(0, 6) === 'child:') {
                    // a child event has propagated from a grandchild
                    if (_.isString(options.path) && options.path.indexOf('.') === 0) {
                        // change a relative path to absolute or relative to current parent
                        parent = options.currentParent || options.parent;
                        if (isCollection && parent) {
                            path += '/' + (parent.id || parent.cid);
                        }
                        options.path = path + options.path.substr(1);
                    }
                    options.currentParent = this;
                    this.trigger.apply(this, args);
                } else {
                    // propagate events triggered on child model or collection to the parent model with child: prefix
                    args[0] = 'child:' + event;
                    // nrm-ui/views/contextView expects options.path to represent the collection path
                    //if (isCollection && model instanceof Backbone.Model && isRelativePath(path)) {
                    //    path += '/' + (model.id || model.cid);
                    //}
                    _.extend(options, { 
                        context: ctx, // may be undefined
                        attr: attr || '', 
                        path: path, 
                        parent: this
                    });
                    this.trigger.apply(this, args);
                }
            });
//            } else {
//                model.listenTo(collection, "all", function(event, sourceModel, sourceColl, options) {
//                    if (event.substring(0, 6) === "child:") {
//                        model.trigger.apply(model, arguments);
//                    } else {
//                        var opt = $.extend({ }, options || sourceColl, { 
//                            context: ctx, 
//                            attr: attr || "", 
//                            path: path, 
//                            parent: model
//                        });
//                        model.trigger("child:" + event, sourceModel, sourceColl, opt);
//                    }
//                });
//            }
            return model;
        },
        /**
         * The "done" callback for the promise returned from the 
         * {@link module:nrm-ui/models/application#getModel|getModel} method.
         * @callback GetModelCallback
         * @param {external:module:backbone.Model} model The requested model.
         */
        /**
         * Asynchronously retrieve a model for an entity context, either from a root collection or nested collection.
         * This method may be used to create a new model, or retrieve an existing model from the collection.
         * If it is an existing model, it may be fetched from REST API unless the context is configured with "auto"
         * loadType.
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration
         * @param {string} [id] The model id if requesting an existing model, if not specified then a new model
         *  will be created.
         * @param {Object} [options] Options
         * @param {string} [options.ajax] Additional ajax options
         * @param {string} [options.model] Parent model for retrieving from a nested collection, or if not specified, then 
         *  both modelId and path are required if retrieving from a nested collection.
         * @param {string} [options.modelId] ID of the parent model for retrieving from a nested collection, can be omitted 
         *  if the model option is specified but otherwise required if retrieving from a nested collection.
         * @param {string} [options.path] Path for retrieving from a nested collection, can be omitted if the model option
         *  is specified but otherwise required if retrieving from a nested collection.  The path might represent the full 
         *  path to the parent collection, or the full path to the requested model.
         * @param {Object} [caller] Object that will be passed to the deferred callbacks as the "this" object.
         * @returns {external:module:jquery~Promise}
         *  Resolves as {@link module:nrm-ui/models/application~GetModelCallback|GetModelCallback}
         */        
        getModel: function(ctx, id, options, caller) {
            options = options || { };
            var parentModel = options.model;
            var dfd = new $.Deferred();
            var successCallback = options.ajax && options.ajax.success;
            var errorCallback = options.ajax && options.ajax.error;
            var error = function(model, response, options) {
                rejectWithCallback(dfd, errorCallback, model, response, options, caller);
             };
             var parentPath = options.path, test = "/" + id;
             var pathIdx = parentPath && id ? parentPath.indexOf(test, parentPath.length - test.length) : -1;
             if (pathIdx !== -1) parentPath = options.path.substring(0, pathIdx);
             var collOpts = { model: options.model, path: parentPath, modelId: options.modelId };
             $.when(this.getCollection(ctx, collOpts, this)).done(function(collection) {
                var opt = _.extend({}, ctx && ctx.ajaxOptions, options.ajax, 
                { 
                     success: function(model , response, options) {
                        if (response) {
                            collection.set(model, { remove: false });
                        } else if (model.isNew()) {
                            model.collection = collection;
                        } else if (response !== false) {
                            error(model, response, options);
                            return;
                        }
                        // TODO: how do we handle a null response?
                        resolveWithCallback(dfd, successCallback, model, response, options, caller);
                     }, 
                     error: error
                 });
                 var model;
                 if (id)
                     model = collection.get(id);
                 else {
                     model = this.setInheritedAttributes(ctx, new collection.model(), parentModel, true);
                 }
                 if (!model) {
                     model = new collection.model();
                     if (ctx && ctx.parent) {
                        /* If this is a child collection, we must prefer the collection url over model urlRoot here
                         * or risk navigating to non-existent relationships. */
                        var collUrl = _.result(collection, 'url');
                        if (collUrl) model.urlRoot = collUrl;
                     }
                     model.id = id;
                     model.cached = false;
                     model.fetch(opt);
                 } else {
                    if (id) model.cached = true;
                    opt.success(model, false, options);
                 } 
            }).fail(error);
            return dfd.promise();
        },
        
        /**
         * Tests for editable status of a model in the given entity context by checking the "editable" attribute 
         * (or function) which is assumed to be a true/false value if the model and the value is defined.
         * The default attribute name can be overriden in the context configuration.
         * @param {module:nrm-ui/models/application~ContextConfig} [ctx] The entity context configuration.
         *  if omitted then default "editable" attribute name will be checked.
         * @param {external:module:backbone.Model|Object} [model] The model
         * @returns {boolean} 
         */
        isEditable: function(ctx, model) {
            ctx = ctx || { };
            if (ctx.editable === false) return false;
            var editAttr = ctx.editAttr || "editable";
            var editVal = Nrm.app.getModelVal(model, editAttr);
            // The "editable" value needs to be explicitly defined to be evaluated.
            // An undefined value should be interpreted as editable (e.g. new model without defaults)
            if (editVal === undefined)
                return true; 

            return !!editVal;
        },
        
        /**
         * Checks a schema configuration to see if should be inherited from the parent model
         * in the given entity context. This can be used to auto-populate attributes from the parent model when
         * creating a new child model, or creating search parameters for a child search.
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration.
         * @param {module:nrm-ui/models/application~SchemaConfig} schema The schema configuration.
         * @param {boolean} editMode Indicates whether we are creating a new model for editing (true) or searching (false).
         * @returns {(boolean|Object)} If a boolean is returned, it is a indication of whether the property associated
         *  with this schema object is inherited. If an object is returned, it is a list of additional attributes
         *  that should be inherited along with with the property associated with this schema object.
         * @see {@link module:nrm-ui/models/application~SchemaConfig|SchemaConfig} for information on how to configure 
         *  schema inheritance.
         */
        isInheritedAttribute: function(ctx, schema, editMode) {
            if (!ctx || !ctx.parent || !schema) return false;

            if (schema.inherit && schema.refType === (ctx.parent.refType || ctx.parent.apiKey) &&
                (!schema.backRef || schema.backRef === ctx.apiKey)) {
                /* backRef can be used in a scenario where there are more than one property
                   matching the parent refType. 
                   In that case, ctx.apiKey matches the property name in the parent model.
                   Setting the value of "inherit" option to "search" or "edit" enables conditional inheritance.
                   e.g. schema: { 
                          project: { 
                            refType: "project", 
                            dataType: "object", 
                            inherit: "edit" 
                          }, 
                          projectFk: { 
                            refType: "project", 
                            inherit: "search" 
                          } 
                        }
                    In this example, the new child will get "project" attribute assigned to the attributes 
                    of the parent model if creating a new child for editing, or "projectFk" attribute 
                    assigned to the parent id if creating a child search model.
                    If we also need to inherit other attributes besides the parent id, the "inherit" object
                     can contain "edit" or "search" keys set to true or a hash of additional attributes to inherit.
                    Here's another example:
                     schema: { 
                          projects: { 
                            refType: "project", 
                            dataType: "collection"
                            inherit: { edit: true, projectName: "name", fsUnitId: "fsUnitId" }
                          }, 
                          projectFk: { 
                            refType: "project",
                            dataType: "object",
                            inherit: { search: true },
                            attributes: [ "projectId", "fsUnitId" ]
                          } 
                        }
                   In this example, the new child will get "project" attribute set to a collection
                   populated with the parent model, and "projectName" and "fsUnitId" attributes
                    set to "name" and "fsUnitId" attributes from the parent if creating a new child 
                    for editing, or "project" attribute set to an object with "projectId" and "fsUnitId"
                    attributes if creating a child search model.  Confusing enough? :-)
                */
                var test = [ "search", "edit" ];
                var disable = test[editMode ? 0 : 1];
                var enable = test[editMode ? 1 : 0];
                var inherit = true;
                if (schema.inherit === disable) 
                    inherit = false;
                else if (schema.inherit !== true && schema.inherit !== enable) {
                    disable = schema.inherit[disable];
                    enable = schema.inherit[enable];
                    if (disable && !_.isString(disable))
                        inherit = !_.isString(enable) && (enable || false);
                    else if (enable === undefined && disable === undefined) {
                        inherit = editMode ? schema.inherit : true;
                    } else {
                        if (editMode && typeof enable !== "object")
                            enable = schema.inherit; // inherit additional attributes for a new edit model only
                        inherit = enable && (!_.isString(enable) ? enable : true);
            }
                }
                return inherit;
            }
            return false;
        },
                
        /**
         * Gets a list of inherited attributes.  
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration.
         * @param {boolean} editMode Indicates whether we are creating a new model for editing (true) or searching (false).
         * @returns {Array.<string>} Array of attribute names
         */
        getInheritedAttributes: function(ctx, editMode) {
            var ret = [ ];
            if (ctx && ctx.schema && ctx.parent) {
                ret = _.reduce(ctx.schema, function(memo, value, name) {
                    var inherit = this.isInheritedAttribute(ctx, value, editMode);
                    if (inherit) {
                        memo.push(name);
                        if (typeof inherit === "object") {
                            _.each(inherit, function(value, key) {
                                memo.push(key);
                            });
                        }
                    }
                    return memo;
                }, ret, this);
            }
            return ret;
        },
        
        /**
         * Sets inherited attributes in a child model with attribute values from a parent model.
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration.
         * @param {(external:module:backbone.Model|Object)} model The child model
         * @param {external:module:backbone.Model} parentModel The parent model to inherit from.
         * @param {boolean} editMode Indicates whether we are creating a new model for editing (true) or searching (false).
         * @returns {(external:module:backbone.Model|Object)} The child model, after attributes are set.
         */
        setInheritedAttributes: function(ctx, model, parentModel, editMode) {
            if (ctx.schema && ctx.parent && parentModel) {
                _.each(ctx.schema, function(p, name) {
                    var inherit = this.isInheritedAttribute(ctx, p, editMode);
                    // this value may return true, false, or a set of attributes
                    if (inherit) {
                        var isColl = p.dataType === "collection"; 
                        var isNested = isColl || p.dataType === "object";
                        var isArray = !isNested && p.dataType === "array";
                        var val = isNested ? parentModel.attributes : parentModel.id;
                        if (isNested && p.attributes) {
                            val = _.reduce(p.attributes, function(memo, value) {
                                memo[value] = this.getModelVal(parentModel, value);
                                return memo;
                            }, { }, this);
                        }
                        if (isArray || isColl) {
                            this.setModelVal(model, name, [ val ]);
                        } else {
                            this.setModelVal(model, name, val);
                        }
                        // 
                        if (typeof inherit === "object") {
                            _.each(inherit, function(value, key) {
                                if (_.isString(value)) {
                                    this.setModelVal(model, key, this.getModelVal(parentModel, value));
                                }
                            }, this);
                        }
                    } 
                }, this);
            }
            return model;
        },
        
        /**
         * An extended way to get a model attribute that also supports evaluating a function or plain object property
         * if the model attribute is not defined (or the model is a plain object instead of a Backbone.Model).
         * If the attribute name turns out to be a function name, the function will be called with no arguments and 
         * the model as "this" context.
         * @param {(external:module:backbone.Model|Object)} model The model
         * @param {string} propName The attribute name to retrieve from the model.
         * @returns {*} The attribute, property or function result value
         */
        getModelVal: function(model, propName) {
            if (!model || !propName) return;
            var value = model.get && model.get(propName);
            if (value === undefined) {
                value = model[propName];
                if ($.isFunction(value)) {
                    value = value.call(model);
                }
            }
            return value;
        },
        
        /**
         * An extended way to set a model attribute.  If the model has a property named "setFunctions" with array type,
         * the function will be called instead of setting the model attribute, with the value to set as an argument,
         * and the model as "this" context.
         * @param {(external:module:backbone.Model|Object)} model The model
         * @param {string} propName The attribute name to set on the model.
         * @param {*} value The value to set
         * @returns {undefined}
         */
        setModelVal: function(model, propName, value) {
            if (!model || !propName) return;
            if (model.set && (!model.setFunctions || $.inArray(propName, model.setFunctions) <= -1)) {
                model.set(propName, value);
                return;
            } 
            var test = propName && model[propName];
            if (test !== undefined && $.isFunction(test)) {
                test.call(model, value);
            } else if (!model.set) {
                model[propName] = value;
            }
        },
        
        /** 
         * Tests an entity context for spatially-enabled attribute.
         * A spatial context is identifiied by either having the shapeAttr property defined, or having a schema 
         * configuration that either defines the spatialTypes property or has "geometry" dataType 
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration.
         * @returns {boolean} Indicator that the context is spatial.
         */
        isSpatialContext: function(ctx) {
            return !!(ctx && (ctx.shapeAttr || 
                (ctx.schema && _.find(ctx.schema, function(prop) {
                     return !!prop.spatialTypes || prop.dataType === "geometry";
                }))));
        },
        
        /**
         * Get the type of geometry for the model.  Only works if the shapeAttr property is defined in the 
         * entity context configuration.
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration.
         * @param {(external:module:backbone.Model|Object)} The model
         * @param {boolean} [strict] Indicates that boolean false value should be returned if the geometry type cannot
         *  be determined.
         * @returns {string|boolean} 
         *   A string value indicating the type of the geometry, expected return values include 
         *    "point", "line", "polygon", "multipoint" or "extent",
         *  or if the shape type cannot be determined, and strict parameter is false, returns the default node type
         *  (see {@link module:nrm-ui/models/application#getDefaultNodeType|getDefaultNodeType}).
         *  Returns false if strict parameter is true and shape type cannot be determined.
         */
        getSpatialType: function(ctx, model, strict) {
            //var shape = this.formatValue(this.getModelVal(model, ctx.shapeAttr), "geometry");
            var shape = (ctx.shape) ? ctx.shape : this.formatValue(this.getModelVal(model, ctx.shapeAttr), "geometry");
            if (shape && shape.shape) {
                // check for nested geometry object
                shape = shape.shape;
            }
            if (!shape) {
                // fall back to default node type
            } else if (shape.x) {
                return "point";
            } else if (shape.paths) {
                return "line";
            } else if (shape.rings) {
                return "polygon";
            } else if (shape.points) {
                return "multipoint";
            } else if (shape.xmin) {
                return "extent"
            }
            return strict ? false : this.getDefaultNodeType(ctx);
        },
                
        /**
         * Gets the ESRI JSON geometry (aka shape) value for a model.
         * Optionally transforms from NAD83 (wkid=4269) to WGS84 (wkid=4326) using the no-op transformation.
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration.
         * @param {(external:module:backbone.Model|Object)} model The model
         * @param {boolean} transformToWgs84 Indicates that NAD83 should be returned as WGS84
         * @returns {Object|Array.<Object>}
         * The ESRI JSON geometry object, or an array of geometry objects if the entity context has multiple
         * geometry attributes.
         * @see {@link http://resources.arcgis.com/en/help/rest/apiref/geometry.html|ESRI JSON Geometry Objects}
         */
        getShapeVal: function(ctx, model, transformToWgs84) {
            var shapeVal, shapeAttr = (ctx && ctx.shapeAttr) || 
                (ctx.schema && _.reduce(ctx.schema, function(memo, prop, key) {
                     if (prop.spatialTypes || prop.dataType === "geometry") {
                         memo.push(key);
                     }
                }, []));
            if (_.isArray(shapeAttr)) {
                if (shapeAttr.length > 0) {
                    shapeVal = [];
                    _.each(shapeAttr, function(attr) {
                        var p = this.convertShape(this.getModelVal(model, attr), transformToWgs84);
                        if (p) shapeVal.push(p);
                    });
                }
            } else if (shapeAttr) {
                shapeVal = this.convertShape(this.getModelVal(model, shapeAttr), transformToWgs84);
            }
            return shapeVal;
        },
                
        /**
         * Tests a geometry value for empty or undefined condition.
         * @param {Object} shapeVal The geometry value.
         * @returns {boolean} True if the shape can be considered "empty" or undefined.
         * @see {@link http://resources.arcgis.com/en/help/rest/apiref/geometry.html|ESRI JSON Geometry Objects}
         *  for a definition of empty geometry for each spatial type.
         */
        shapeIsEmpty: function(shapeVal) {
            if (shapeVal && shapeVal.shape) {
                // check for nested geometry object
                shapeVal = shapeVal.shape;
            }
            if (!shapeVal) {
                return true;
            } else if (shapeVal.x !== undefined) {
                return !$.isNumeric(shapeVal.x);
            } else if (shapeVal.points) {
                return shapeVal.points.length === 0;
            } else if (shapeVal.paths) {
                return shapeVal.paths.length === 0;
            } else if (shapeVal.rings) {
                return shapeVal.rings.length === 0;
            } else if (shapeVal.xmin !== undefined) {
                return !$.isNumeric(shapeVal.xmin);
            } else {
                return true;
            }
        },
                
        /**
         * Converts a geometry from JSON string to object.
         * Optionally transforms from NAD83 (wkid=4269) to WGS84 (wkid=4326) using the no-op transformation.
         * @param {Object|string} p The geometry value
         * @param {boolean} transformToWgs84 Indicates that NAD83 should be returned as WGS84
         * @returns {Object} The converted geometry.  If the input geometry is "empty", returns undefined.
         * @todo Empty geometry probably return null instead of undefined.
         */
        convertShape: function(p, transformToWgs84) {
            if (p) {
                var isCopy = false;
                if (typeof p === 'string' || p instanceof String) {
                    try {
                      p = JSON.parse(p);
                      isCopy = true;
                    } catch (error) {
                        console.log("JSON parse error: " + error);
                    }
                } else if (_.has(p, 'shape')) {
                    p = p.shape;
                }
                if (this.shapeIsEmpty(p))
                    return;
                if (transformToWgs84 && p.spatialReference.wkid === 4269) {
                    if (!isCopy) p = $.extend(true, { }, p);
                    p.spatialReference.wkid = 4326; // fake it
                }
            }
            return p;
        },
                
        /**
         * Get the default node type for an entity context, as configured by the nodetype property,
         * defaulting to "row" if the property is not defined.
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration
         * @returns {string} The default node type.
         */
        getDefaultNodeType: function(ctx) {
            return ctx.nodetype || "row";
        },
        
        /**
         * Adds the local timezone to a datetime-local string.  This is required if you are attempting
         * conversion to the Javascript Date object and you want it to be consistent across browsers,
         * because some browsers interpret a date with no timezone as the local timezone, while others
         * assume it is GMT. Note that using Date conversions like this perform poorly in IE11
         * because the Date constructor is slow, you may be better off parsing dates using regular expressions
         * instead of the native Date object.
         * @param {string} date The date in YYYY-MM-DDTHH:mm format
         * @returns {string}The date in YYYY-MM-DDTHH:mm+/-HH:mm format e.g. 2015-09-16T16:08-07:00
         */
        addTimeZone: function(date) {
            var shortDate = date.substring(0,10);
            var test = new Date(shortDate);
            if (!test.getDate()) return date;
            var d = test.getDate() !== Number(shortDate.substring(8));
            var mi = test.getMinutes();
            if (d && mi) mi = 60 - mi;
            var hr = d ? (24 - (mi ? 1 : 0) - test.getHours()) : test.getHours();
            var pad = function(num) {
                return num < 10 ? ("0" + num) : num;
            };
            return date + (d ? "-" : "+") + pad(Math.abs(hr)) + ":" + pad(mi);
        },
        
        /**
         * Format a value according to various data types either for setting, displaying or sorting an attribute.
         * Note that currently the formatting support for data types are rather limited as formatting behavior
         * is added only when a use case is identified.
         * @param {*} value The value to format
         * @param {string} dataType The data type, in theory accepts any value that is valid for an input element,
         *  and possibly other custom data types.
         *  Currently only "date", "datetime", "datetime-local", "numeric", "number", "range" and "geometry"
         *  are handled.
         * @param {string} [type] The format type, either "display", "sort", "set" (currently any other value is assumed 
         *  to be equivalent to "display").  Some data types are always formatted the same way for any value of this parameter.
         * @returns {*} The formatted value.
         *  For any date type that is not handled, the input value will be returned unchanged.
         */
        formatValue: function(value, dataType, type) {
            if (dataType === "datetime-local")
                dataType = "datetime"; // currently no difference between datetime-local and datetime format.
            if (dataType === "date" || dataType === "datetime") {
                var date, display = !(type === "sort" || type === "set");
                if (display && value && value.getDate) {
                    date = value;
                } else if (display && _.isNumber(value)) {
                    date = new Date(parseFloat(value));
                }
                if (date && date.getDate()) {
                    value = date.toISOString();
                }
                if (_.isString(value)) {
                    var m = value.match(display ? dateIsoRe : dateDisplayRe), newValue = value;
                    if (display && !m && dataType === "date") {
                        m = value.match(dateAltRe); // for shapefiles
                    }
                    if (!display) {
                        if (m) newValue = m[3] + '-' + m[1] + '-' + m[2];
                    } else {
                        if (m) newValue = m[2] + '/' + m[3] + '/' + m[1]; 
                    }
                    if (m && dataType === "datetime" && m.length > 4) {
                        newValue += (display ? " " : "T") + (m[4] || "00:00");
                    }
                    value = newValue;
                }
            } else if (dataType === "geometry") {
               if (_.isString(value)) {
                   try {
                      value = JSON.parse(value);
                   } catch (error) {
                       console.log("Failed to parse JSON string as geometry: " + error);
                       value = null;
                   }
               }
            } else if (dataType === "numeric" || dataType === "number" || dataType === "range") {
                if ($.isNumeric(value))
                    value = parseFloat(value);
                else if (value === "")
                    value = null;
            }
            return value;
        },
        
        /**
         * Indicates whether quick (aka basic) search is enabled for the entity context
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration
         * @returns {boolean}
         */
        isQuickSearchEnabled: function(ctx) {
            if (!ctx || !ctx.search) return false;
            return !!ctx.search.basic;
        },
                
       /**
         * Indicates whether advanced search is enabled for the entity context
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration
         * @returns {boolean}
         */
        isAdvancedSearchEnabled: function(ctx) {
            if (!ctx || !ctx.search) return false;
            return !!ctx.search.advanced;
        },

        /**
         * Indicates whether spatial search is enabled for the entity context
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration
         * @returns {boolean}
         */
        isSpatialSearchEnabled: function(ctx) {
            if (!ctx || !ctx.search) return false;
            return !!ctx.search.spatial;
        },
                
        /**
         * Transforms a model's attributes to search parameters.
         * The special value "@extent" indicates that the value should be the current map extent.
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration
         * @param {external:module:backbone.Model} model The model
         * @param {Object} [options] Options
         * @param {boolean} [options.limit] Indicates that the results should be limited (paged) by adding the standard
         *  limits parameter.
         * @param {boolean} [options.firstResult] The first result to return, to retrieve the next set of results
         *  in a paged search.
         * @returns {Object} The search paramater JSON object.
         * @todo The handling of "@extent" should be revised so it can be distinguished from an actual value
         *  entered by the user.  
         */
        getSearchData: function(ctx, model, options) {
            options = options || { };
            var search = $.extend({ }, model.toJSON());
            _.each(search, function(value, key) {
               if (value === "@extent") {
                   if (Nrm.app.mapView) {
                        // special case for search form checkbox to filter by current map extent
                        var extent = Nrm.app.mapView.getCurrentExtent();
                        search[key] = extent ? extent.toJson() : null;
                   }
               } 
            });
            if (options.limit || options.firstResult) {
                search.limits = { startRow: options.firstResult || 0,
                    maxRows: ctx.maxResults || options.maxResults || 1000
                };
            }
            return search;
        },
                
        /**
         * Removes the model id from a path to get the container (folder node) path. If the path ends with the apiKey
         * for the entity context, then it is returned unchanged.
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The entity context configuration
         * @param {string} path The original path
         * @returns {string} The path with model id removed.
         */
        getContainerPath: function(ctx, path) {
            if (ctx) {
                var re = new RegExp(ctx.apiKey + "$");
                if (!re.test(path))
                    return path.substring(0, path.lastIndexOf('/'));
            }
            return path;
        },
             
        /**
         * Callback for Backbone sync success
         * @callback SyncSuccessCallback
         * @param {external:module:backbone.Model|external:module:backbone.Collection} data
         * @param {external:module:jquery~jqXHR} response
         * @param {Object} options
         * @see success callback described in {@link http://backbonejs.org/#Model-save|Backbone.Model#save} and
         * {@link http://backbonejs.org/#Collection-fetch|Backbone.Collection#fetch}
         */
        /**
         * Callback for Backbone sync error
         * @callback SyncErrorCallback
         * @param {Object} data
         * @param {external:module:jquery~jqXHR} response
         * @param {Object} options
         * @see error callback described in {@link http://backbonejs.org/#Model-save|Backbone.Model#save} and
         * {@link http://backbonejs.org/#Collection-fetch|Backbone.Collection#fetch}
         */
        /**
         * Callback parameter for {@link module:nrm-ui/models/application#doSearch|doSearch} function
         * @callback ExecuteSearchCallback
         * @param {Object} evtData Event data, this will include all options passed to the 
         *  {@link module:nrm-ui/models/application#doSearch|doSearch} function as well as the properties listed here.
         * @param {Object} evtData.search The search parameters
         * @param {external:module:backbone.Collection#constructor} evtData.collectionType The collection module
         * @param {module:nrm-ui/models/application~SyncSuccessCallback} successCallback
         * @param {module:nrm-ui/models/application~SyncErrorCallback} errorCallback
         */
        /**
         * Options to pass to the {@link module:nrm-ui/event#context:beginSearch|context:beginSearch} event.
         * @typedef {Object} ExecuteSearchOptions
         * @property {Object} search The search parameters.
         * @property {string} searchType  The type of search which should match a key in
         *  {@link module:nrm-ui/models/application~SearchConfigMap|SearchConfigMap}
         * @property {module:nrm-ui/models/application~ContextConfig} context The entity context configuration
         * @property {module:nrm-ui/models/application~ExecuteSearchCallback} callback Callback function that is 
         * responsible for executing the search if the "context:beginSearch" event is not cancelled.
         * @property {*} [source] Object that will be passed to the various callbacks as the "this" object.
         * @property {Object} [model] Parent model for nested collection
         * @property {Object} [path] Path for nested collection
         * @property {Object} [modelId] Parent model ID for nested collection
         * @see {@link module:nrm-ui/models/application#getCollection|getCollection} for more details on how the model,
         * path and modelId options are used.
         */
        /**
         * Triggers the {@link module:nrm-ui/event#context:beginSearch|context:beginSearch} event and handles the result
         *  by resetting the collection specified in the options. 
         * @param {module:nrm-ui/models/application~ExecuteSearchOptions} options Options that will be passed on as the 
         * event data to the event.
         * @param {module:nrm-ui/models/application~SyncSuccessCallback} completedCallback
         *  Callback function that will be called after the search is executed successfully and the collection is reset
         * @param {module:nrm-ui/models/application~SyncErrorCallback} errorCallback 
         *  Callback function that will be called if the search fails.
         * @fires module:nrm-ui/main.event#"context:beginSearch"
         * @returns {undefined}
         * @todo Currently the errorCallback is not bound to options.source which is not ideal.
         */
        doSearch: function(options, completedCallback, errorCallback) {
            function successCallback(results, response, opt) {
                var cfg = (options.searchType && options.context.search[options.searchType]) || { };
                if (cfg === true) {
                    cfg = options.context.search[options.searchType] = { };
                }
                cfg.lastSearch = options.search;
                
                $.when(Nrm.app.getCollection(options.context, { 
                    path: options.path, 
                    model: options.model, 
                    modelId: options.modelId
                }, this)).done(function(collection) {
                    var selectionMethod = options.selectionMethod || "new";
                    if (selectionMethod === "add") {
                        results.add(collection.toJSON());
                        collection.reset(results.toJSON());
                    } else if (selectionMethod === "subtract") {
                        var c = collection.clone();
                        c.remove(results.models);
                        collection.reset(c.toJSON());
                    } else {
                        collection.reset(results.toJSON());
                    }
                    if (completedCallback)
                        completedCallback.call(options.source || this, collection, response, opt);
                });
            }
            function onFail(model, resp) {
                if (!resp || resp.statusText !== 'abort') {
                    errorCallback.apply(options.source || this, arguments); 
                }
            }
            $.when(this.getCollectionConstructor( { context: options.context }, this)).done(function(factory) {
                /**
                 * Initiates a search, providing an opportunity to cancel before executing the search.
                 * @event module:nrm-ui/event#context:beginSearch
                 * @param {module:nrm-ui/models/application~ExecuteSearchOptions} options
                 * @param {Function} options.collectionType The collection constructor.
                 * @param {Boolean} [options.cancel] Event handler may set this to true to cancel the event.
                 */
                Nrm.event.trigger("context:beginSearch", $.extend({ }, options, {
                    collectionType: factory,
                    callback: function(evtData) {
                        if (!evtData.cancel && options.callback) {
                            options.callback.call(this, evtData, successCallback, onFail);
                        }
                    },
                    source: options.source || this
                }));

            });

        },
        
        /**
         * Asynchronously delete a model and remove it from the associated collection.
         * @param {Object} options Options
         * @param {external:module:backbone.Model} options.model The model to delete.
         * @param {external:module:backbone.Collection} [options.collection] The collection to delete the model from.  
         *  If not specified, then the model must be associated with a collection, or the context option must 
         *  be specified (along with parentModel or combination of parentId and path if it needs to delete from a 
         *  nested collection).
         * @param {module:nrm-ui/models/application~ContextConfig} [options.context] Entity context configuration
         *  for the model to delete. Only required if the collection option is not specified and the model is not 
         *  associated with a collection.
         * @param {external:module:backbone.Model} [options.parentModel] The parent model of the model to delete.
         *  This is only required together with context option if the model needs to be deleted from a nested collection, 
         *  and the collection option is not specified, and the model is not associated with a collection, and 
         *  combination of parentId and path options are not specified.
         * @param {string} [options.parentId] The ID of the parent model of the model to delete.  This is only required 
         *  together with context and path options if the model needs to be deleted from a nested collection, and the 
         *  collection and parentModel options are not specified and the model is not associated with a collection.
         * @param {string} [options.path] Path for the model.  Only required the model needs to be deleted from a nested
         *  collection, and the collection and parentModel options are not specified and the model is not associated 
         *  with a collection.
         * @param {Object} [options.deleteOptions] Additional options to pass to 
         *  {@link http://backbonejs.org/#Model-destroy|Backbone.Model#destroy}
         * @param {Object} [caller] Object that will be passed to the deferred callbacks as the "this" object.
         * @returns {external:module:jquery~Promise}
         *  Resolves as {@link module:nrm-ui/models/application~SyncSuccessCallback|SyncSuccessCallback}
         * @todo The undocumented modelId option is currently partially supported as a way to delete the model by id
         *  without already having a reference to it.  It will work for a root collection, but will most likely fail 
         *  due to some inconsistency in option names between this function and the 
         *  {@link module:nrm-ui/models/application#getModel|getModel} function.
         */
        deleteModel: function(options, caller) {
            var dfd = new $.Deferred();
            function deleteSucceeded(model, collection, xhr, options) {
                if (collection && model.id) {
                    var delModel = collection.get(model.id);
                    if (delModel) {
                        delModel.deleted = true;
                        collection.remove(delModel);
                    }
                    model = delModel;
                };
                resolveWithCallback(dfd, null, delModel, xhr, options, caller);
            }
            function deleteFailed(model, xhr, options) {
                if (!model) {
                    model = {
                        error: {
                            message: "Invalid options for deleting the model."
                        }
                    };
                    if (!xhr) {
                        xhr = { status: 0, statusText: model.error.message, responseJSON: model.error };
                    }
                }
                rejectWithCallback(dfd, null, model, xhr, options, caller);
            }
            function doModelDelete(model, collection) {
                model.destroy($.extend({ }, options.deleteOptions, {
                    success: function onSuccess(rModel, xhr, options) {
                        deleteSucceeded(rModel || model, collection, xhr, options);
                    },
                    error: function onError(rModel, xhr, options) {
                        if (xhr.status === 200) {
                            deleteSucceeded(rModel || model, collection, xhr, options);
                        } else {
                            deleteFailed(rModel, xhr, options);
                        }
                    },
                    wait: true
                }));
            }
            if (options.model) {
                var collection = options.collection || options.model.collection;
                if (collection)
                    doModelDelete(options.model, collection);
                else if (options.context && (!options.context.parent || options.parentModel || options.parentId)) {
                    var collOpts = {
                        context: options.context,
                        model: options.parentModel || null,
                        modelId : options.parentId || null,
                        path: options.path ? this.getContainerPath(options.path) : options.context.apiKey
                    };
                    $.when(this.getCollection(options.context, collOpts, this)).done(function(collection) {
                        doModelDelete(options.model, collection);
                    });
                } else {
                    deleteFailed();
                }
            } else if (options.context && options.modelId && (!options.context.parent || options.path)) {
                $.when(this.getModel(options.context, options.modelId, options, this)).done(function(model) {
                    doModelDelete(model, model.collection); 
                });
            } else {
                deleteFailed();
            }
            return dfd.promise();
        },
                
        /**
         * Asynchronously save a model
         * @param {Object} options Options
         * @param {external:module:backbone.Model} options.model The model to save.
         * @param {external:module:backbone.Collection} [options.collection] The collection to update when the model 
         *  is saved.  If not specified, then the model must be associated with a collection, or the context option must 
         *  be specified (along with parentModel or combination of parentId and path if it needs to update a 
         *  nested collection).
         * @param {boolean} [options.merge=true] Merge the saved model into its collection.
         * @param {Object} [options.attributes] Attributes to update when saving.
         * @param {Object} [options.saveOptions] Additional options to pass to 
         *  {@link http://backbonejs.org/#Model-save|Backbone.Model#save}
         * @param {string} [options.modelCid] If set, set the "originalCid" property on the saved model.  This can
         *  be used to identify two new model instances as equals.
         * @param {module:nrm-ui/models/application~ContextConfig} [options.context] Entity context configuration
         *  for the model to save. Only required if the collection option is not specified and the model is not 
         *  associated with a collection.
         * @param {external:module:backbone.Model} [options.parentModel] The parent model of the model to save.
         *  This is only required together with context option if the model needs to be updated in a nested collection, 
         *  and the collection option is not specified, and the model is not associated with a collection, and 
         *  combination of parentId and path options are not specified.
         * @param {string} [options.parentId] The ID of the parent model of the model to save.  This is only required 
         *  together with context and path options if the model needs to be updated in a nested collection, and the 
         *  collection and parentModel options are not specified and the model is not associated with a collection.
         * @param {string} [options.path] Path for the model.  Only required the model needs to be updated in a nested
         *  collection, and the collection and parentModel options are not specified and the model is not associated 
         *  with a collection.
         * @param {Object} [caller] Object that will be passed to the deferred callbacks as the "this" object.
         * @returns {external:module:jquery~Promise}
         *  Resolves as {@link module:nrm-ui/models/application~SyncSuccessCallback|SyncSuccessCallback}
         * @todo The undocumented modelId option is currently partially supported as a way to save the model by id
         *  without already having a reference to it.  It will work for a root collection, but will most likely fail 
         *  due to some inconsistency in option names between this function and the 
         *  {@link module:nrm-ui/models/application#getModel|getModel} function.
         */
        saveModel: function(options, caller) {
            options = $.extend({ merge: true }, options);
            var cid = options.modelCid, merge = options.merge, isNew;
            var dfd = new $.Deferred();
            var saveSucceeded = _.bind(function(model, collection, xhr, options) {
                var reloadHandler, reload, mergeModel, existing;
                merge = !!(merge && collection); 
                if (merge) {
                    reloadHandler = function(parentModel, childCollection, options) {
                        if (options && options.attr) {
                            (reload || (reload = {}))[options.attr] = options;
                        }
                    };
                    model.on('child:reload', reloadHandler);
                }
                try {
                    model.trigger('saved', model, xhr, options);
                } finally {
                    model.off('child:reload', reloadHandler)
                }
                if (merge) {
                    mergeModel = model.clone();
                    mergeModel.cached = true;
                    if (isNew && !cid) {
                        cid = model.cid;
                    }
                    if (cid) {
                        // new model
                        mergeModel.originalCid = cid;
                    }
                    existing = reload && collection.get(mergeModel.id);
                    collection.set(mergeModel, { remove: false });
                    if (reload && existing) {
                        _.each(reload, function(options, attr) {
                            var newChild = model.get(attr), oldChild = existing.get(attr);
                            var collection = this.resetChildCollection(existing, attr);
                            if (!newChild && oldChild) {
                                existing.unset(attr);
                            }
                            existing.trigger('child:reload', existing, collection, options);
                        }, this);
                    }
                }     
                resolveWithCallback(dfd, null, model, xhr, options, caller);
            }, this);
            function saveFailed(model, xhr, options) {
                if (!model) {
                    model = {
                        error: {
                            message: "Invalid options for saving the model."
                        }
                    };
                    if (!xhr) {
                        xhr = { status: 0, statusText: model.error.message, responseJSON: model.error };
                    }
                }
                rejectWithCallback(dfd, null, model, xhr, options, caller);
            }
            function doModelSave(model, collection) {
                isNew = model.isNew();
                return model.save(options.attributes || { }, $.extend({ }, options.saveOptions, {
                    success: function onSuccess(rModel, xhr, options) {
                        saveSucceeded(rModel || model, collection, xhr, options);
                    },
                    error: saveFailed
                }));
            }
            if (options.model) {
                var collection = options.collection || options.model.collection;
                if (collection)
                    doModelSave(options.model, collection);
                else if (options.context && (!options.context.parent || options.parentModel || options.parentId)) {
                    var collOpts = {
                        context: options.context,
                        model: options.parentModel || null,
                        modelId : options.parentId || null,
                        path: options.path ? this.getContainerPath(options.path) : options.context.apiKey
                    };
                    $.when(this.getCollection(options.context, collOpts, this)).done(function(collection) {
                        doModelSave(options.model, collection);
                    }).fail(saveFailed);
                } else {
                    saveFailed();
                }
            } else if (options.context && options.modelId && (!options.context.parent || options.path)) {
                $.when(this.getModel(options.context, options.modelId, options, this)).done(function(model) {
                    doModelSave(model, model.collection); 
                }).fail(saveFailed);
            } else {
                saveFailed();
            }
            return dfd.promise();
        },
        /**
         * Resets a child collection loaded via
         * {@link module:nrm-ui/models/application#getCollection|Nrm.app.getCollection} by removing it from the child
         * collection cache (model.collections).
         * @param {external:module:backbone.Model} model The parent model
         * @param {String} attr The child collection attribute name
         * @returns {external:module:backbone.Collection|undefined}
         * Returns the old collection instance if it was removed from the child collection cache.
         */
        resetChildCollection: function(model, attr) {
            var collection;
            if (model.collections 
                    && model.collections !== model.constructor.prototype.collections 
                    && model.collections[attr] instanceof Backbone.Collection) {
                collection = model.collections[attr];
                delete model.collections[attr];
            }
            return collection;
        },
                
        /**
         * Updates a count attribute in a parent model for a provided child context
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The child entity context configuration
         * @param {(external:module:backbone.Model|Object)} model The parent model to update
         * @param {number} increment The amount to add or substract from the current attribute value.
         * @returns {undefined}
         */
        updateCount: function(ctx, model, increment) {
            var parentSchema = ctx && ctx.parent && ctx.parent.schema && ctx.parent.schema[ctx.apiKey];
            var countAttr = parentSchema && parentSchema.countAttr;
            if (countAttr) {
                var c = Nrm.app.getModelVal(model, countAttr);
                if ($.isNumeric(c)) {
                    c = parseInt(c) + increment;
                    Nrm.app.setModelVal(model, countAttr, c < 0 ? 0 : c);
                } 
            }
        },
                
        /**
         * Gets user info model
         * @param {string} [url] Optionally override the URL provided in application configuration.
         * @returns {external:module:jquery~Promise}
         * Passes the user info as a {@link http://backbonejs.org/#Model|Backbone.Model} to the deferred callbacks. 
         */
        getUserInfo: function(url) {
            url = url || this.get("userInfoUrl");
            var dfd = new $.Deferred(),
                    resolveUserInfo = _.bind(function(model) {
                        dfd.resolveWith(this, [ model ]);
                    }, this),
                    handleError = function(message, data, resp, options) {
                        if (this.userInfo && (navigator.onLine || !this.get("mobileApp"))) {
                            var error = this.normalizeErrorInfo(message, data, resp, options);
                            if (error.details && error.details.userName)
                                this.userInfo.set("userName", error.details.userName);
                            this.userInfo.set("error", error);
                        }
                        resolveUserInfo(this.userInfo);
                    },
                    userInfoLoaded = _.bind(function(model) {
                        if (model && model.loading) {
                            model.loading = false;
                        }
                        if (model && model.get('disabled') && model.get('reactivationUrl')) {
                            var enableUserModel = new Backbone.Model();
                            if (navigator.onLine) {
                                enableUserModel.localStorage = false;
                            }
                            enableUserModel.url = model.get('reactivationUrl');
                            enableUserModel.set('userName', model.get('userName'));
                            enableUserModel.save(null, {
                                success: function() {
                                    resolveUserInfo(model)
                                },
                                error: _.bind(handleError, this, 'User account reactivation failed.')
                                       
                            });
                        } else {
                            resolveUserInfo(model);
                        }
                    }, this);
                    
            if (this.userInfo) {
                return $.when(this.userInfo.loading).always(userInfoLoaded);
            } else if (url) {

                this.userInfo = new Backbone.Model();
                this.userInfo.url = url;
                // TODO: what do we do when navigator.onLine is false?
                if (navigator.onLine) {
                    this.userInfo.localStorage = false;
                }
                this.userInfo.loading = this.userInfo.fetch({
                    success: userInfoLoaded,
                    error: _.bind(handleError, this, 'User info is not available.')
                });
            } else {
                userInfoLoaded();
            }
            return dfd;
        },
        /**
         * Checks user authorization status after user info is loaded.
         * @returns {Boolean|undefined} Returns boolean indicating whether user is authorized.  Returns undefined if it 
         * is called before the user info has finished loading.
         */
        userIsAuthorized: function() {
            if (this.userInfo && !this.userInfo.loading) {
                return this.userInfo.get('authorized') !== false && !this.userInfo.get('error');
            }
        },
        /**
         * Converts varying kinds of error responses or error info objects to a normalized format,
         * optionally adding additional text as the main error message.
         * @function
         * @param {string} [msg] Text to use as the main error message
         * @param {{error: module:nrm-ui/resourceCache~ErrorInfo}} [data] error data
         * @param {external:module:jquery~jqXHR} [resp] JQuery response object
         * @returns {module:nrm-ui/resourceCache~ErrorInfo}
         *   Normalized error info object suitable for rendering as the "error" attribute in 
         *   module:nrm-templates/error.handlebars.
         */
        normalizeErrorInfo: normalizeErrorInfo,
        
        /**
         * Formats an error info object as an HTML string, removes whitespace between HTML elements and optionally 
         * replace new lines with line break elements. 
         * @param {(string|module:nrm-ui/resourceCache~ErrorInfo|external:module:jquery)} html An error info object
         *  or HTML string (or jQuery object, which will be returned unchanged).
         * @param {boolean} replaceNewLines Indicates whether newline characters should be replaced with line break 
         *  elements.
         * @returns {(string|external:module:jquery)} Returns a formatted HTML string, or if the input is a jQuery 
         *  object, returns the input unchanged.
         * @todo This needs to replace newline characters within HTML tags with a single space to avoid the risk of
         *  creating invalid tags. Until that change is made, the problem can be avoided by carefully avoiding this
         *  condition in the Handlebars template that formats the input string.
         */
        formatErrorHtml: function(html, replaceNewLines) {
            if (html instanceof jQuery) return html;
            if (html && html.message) {
                html = errorTemplate({ 
                    error: html
                });
            }
            html = (html || '').replace(/>\s*</g, "><").trim();
            if (replaceNewLines)
                html = html.replace(/\n/g, "<br/>");
            return html;
        },
                
        /**
         * Return a URL based on a help system refID (if a URL is supplied as the parameter, returns that URL).
         * @param {string} helpContext Help system refID or absolute URL.
         * @returns {string}
         */
        resolveHelpUrl: function(helpContext) {
            var url;
            if (helpContext && /^((https?:\/\/)|([\/#]))/.test(helpContext)) {
                url = helpContext;
            } else if (this.get("helpContextRoot")) {
                url = this.get("helpContextRoot") + helpContext;
            }
            return url;
        },

        /**
         * Loads Handlebars templates as AMD modules for any templates referenced in various known control configurations
         * within the provided form configuration.
         * @param {module:nrm-ui/views/baseView~FormConfig} config The form configuration.
         * @param {function} [fn] The callback function that will be passed each resolved template as parameters,
         *  the return value will be passed as the parameter to the "done" callback.
         * @param {Object} [caller] Object that will be passed to the deferred callbacks as the "this" object.
         * @returns {external:module:jquery~Promise|undefined}
         * Resolves with the return value from the callback function parameter, or returns undefined if no templates
         * were found in the configuration.
         */
        loadTemplates: function(config, fn, caller) {
            var deps = [];
            function addDep(dep) {
                if ($.inArray(dep, deps) === -1) {
                    deps.push("hbs!" + dep);
                }
            }
            function getControlDeps(item) {
                if (item.type) {
                    addDep(item.type);
                }
                getConfigDeps(item);
                if (item.btn && item.btn !== true) {
                    getControlDeps(item.btn);
                }
            }
            function getConfigDeps(config) {
                if (config.template) {
                    addDep(config.template);
                }
                var recurse = [ "controls", "actions", "items", "tabs" ];
                _.each(recurse, function(prop) {
                   if (config[prop])
                       _.each(config[prop], function(item) {
                           getControlDeps(item);
                       });
                });
                if (config.columns) {
                    _.each(config.columns, function(column) {
                        if (column.control) {
                            getControlDeps(column.control);
                        }
                    });
                }
            }
            getConfigDeps(config);
            if (deps.length) {
                return requireDeferred(deps, fn, caller);
            }
        }
    }, /** @lends module:nrm-ui/models/application */ {
        /**
         * Wraps the AMD require function in a jQuery Deferred object.
         * @function
         * @param {Array.<string>} deps The dependency list
         * @param {function} [fn] The callback function that will be passed each resolved module as parameters,
         *  the return value will be passed as the parameter to the "done" callback.
         * @param {Object} [caller] Object that will be passed to the deferred callbacks as the "this" object.
         * @param {function} [require] Context-sensitive require function to enable relative module identifiers.
         * @returns {external:module:jquery~Promise|undefined}
         * Resolves with the return value from the callback function parameter.
         */
        requireDeferred: requireDeferred
    });
    /*
    Nrm.Models.Version = Backbone.Model.extend({
        urlRoot: "utils"
    });*/
    return Nrm.Models.Application;
});


