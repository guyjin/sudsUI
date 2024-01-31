/**
 * @file The ResultsView extends {@link module:nrm-ui/views/baseView|BaseView} to provide a generic implementation
 * of a grid view that displays a list of results. 
 * @see module:nrm-ui/views/resultsView
 */
/** 
 * @module nrm-ui/views/resultsView
 */

define(['..', 'jquery', 'underscore', './baseView', 'hbs!dropdown',
    '../plugins/nrmDataTable', '../plugins/nrmContextMenu'], 
         function(Nrm, $, _, BaseView, dropdownTemplate) {
    
    /**
     * Configuration of a results grid.
     * @typedef {module:nrm-ui/views/baseView~FormConfig} SearchResultsConfig
     * @property {Array.<string|module:nrm-ui/views/baseView~ColumnConfig>} columns Array of columns, each item can be
     * either a string that indicates the attribute name to bind to the column, or a column configuration object.
     * @property {module:nrm-ui/plugins/nrmDataTable~PluginOptions} pluginOpts Options to pass to the NrmDataTable 
     * plugin initialization to override defaults defined in the tableOptions property.
     * @property {module:nrm-ui/plugins/nrmDataTable~PluginOptions} tableOptions Default options to pass to the 
     * NrmDataTable plugin initialization, each option specified here can be overridden by an option set on the
     * pluginOpts property.
     * @property {string} [caption] Accessible description of the table to override the default.
     * @property {Boolean} [showCaption=false] Caption will be visible for all users, not just screen-readers.
     * @property {string[]} [rowActions] Array of row action keys matching a key defined in the 
     * {@link module:nrm-ui/views/baseView#rowActions|rowActions property} of this view. The default array includes
     * the "edit" key only.
     * @property {string} [groupLabel] Display name of the group attribute, default value will be obtained from the 
     * context configuration.
     * @property {string} [layerKey] Only used for child collections with spatial attribute, this is the key that 
     * uniquely identifies the {@link module:nrm-ui/views/featureLayerView|FeatureLayerView} associated with the 
     * collection bound to this view. If not specified, a default key will be generated from the navigation path.
     * @property {string} [layerCaption] Only used for child collections with spatial attribute, this is the caption 
     * for the layer that will be displayed in the map legend.  If not specified, a default caption will be generated.
     * @property {Boolean} [triggerNodeSelection=true] Indicates whether grid should be synchronized with tree so that
     * highlighting a row in the grid will select the node in the tree.
     * @property {string} [tableId="nrmSearchResultsTable"] The id of the table element.
     * @property {Object.<string,Function> [contextMenuEvents] Click event handlers to bind to the context menu for 
     * each row, keys are JQuery selectors and values are the event handler functions.
     * @property {Boolean} [ensureVisible=false] For collections with a spatial attribute, determines whether the map
     * should pan or zoom to ensure the selected rows are visible when the selection changes.
     * @property {Boolean} [zoomToSelection=false] For collections with a spatial attribute, determines whether the 
     * map zoom to the selected rows when the selection changes.
     */
    
    return Nrm.Views.SearchResultsView = BaseView.extend(/** @lends module:nrm-ui/views/resultsView.prototype */{
        /**
         * A class name that will be applied to the container element
         * @type {string}
         * @default
         */
        className: "container",
        /**
         * Create a new instance of the ResultsView.  
         * @constructor
         * @alias module:nrm-ui/views/resultsView
         * @classdesc
         *   A Backbone view that extends {@link module:nrm-ui/views/baseView|BaseView} to display a generic list of
         *   results in a grid.
         * @param {module:nrm-ui/views/resultsView~SearchResultsConfig} options 
         * @param {module:nrm-ui/models/application~ContextConfig} options.context The context configuration.
         * @param {string} options.path The navigation path.
         * @param {external:module:backbone.Model} [options.model] The parent model if this a nested child results view.
         * @param {string} [options.modelId] The id of the parent model.
         * @param {string} [options.group] The group attribute value if a group folder node was selected to display the
         * view.
         * @see {@link http://backbonejs.org/#View-constructor|Backbone View constructor / initialize}
         */
        initialize: function(options){
            var context = this.context = (options && options.context) || { }, 
                    path = this.path = options && options.path,
                    model = options && options.model;

            this.options = $.extend($.extend(true, { }, this.defaults), options, context.searchResults);
            this.config = this.options;
            /**
             * Indicates whether the view is bound to a spatial collection.
             * @type {Boolean}
             */
            this.isSpatialContext = Nrm.app.get("enableMap") && 
                Nrm.app.isSpatialContext(context);

            //var results = this.context.lastResults;
            var collectionLoading = $.when(Nrm.app.getCollection(context, { 
                path: path, 
                model: model, 
                modelId: this.options.modelId 
            }, this)).done(function(collection) {
                /**
                 * The collection bound to this view.
                 * @name module:nrm-ui/views/resultsView#collection
                 * @type {external:module:backbone.Collection}
                 */
                this.collection = collection; //results ? collection.reset(results.toJSON()) : collection;
            }), configLoading = $.when(this.getResultsConfig()).done(_.bind(function(config) {
                this.config = this.mixResultsConfig(config || {});
                if (this.config !== this.options) {
                    this.tableId = this.config.tableId || this.tableId;
                    if (!this.config.rowActions) {
                        this.config.rowActions = this.options.rowActions;
                    }
                }
            }, this));

            this.loading = $.when(collectionLoading, this.loadTemplate(), configLoading);
            /**
             * Max results from the last search.
             * @type {?Number}
             */
            this.maxResults = context.lastSearch && context.lastSearch.maxResults;
            this.events = this.mixEvents(this.defaultEvents);
            /**
             * Element id for the table.
             * @type {string}
             */
            this.tableId = this.config.tableId;

            if (!this.config.rowActions) {
                this.config.rowActions = [ "edit" ];
            }
            /**
             * Callback that will be called when row selection changes.
             * @deprecated This property is not used and may be removed in a future version
             * @type {Function}
             * @see {@link module:nrm-ui/plugins/nrmDataTable~EnableActionsCallback}
             */
            this.rowSelectCallback = this.config.tableOptions && this.config.tableOptions.fnEnableCallback;
            /**
             * Active context menu configuration that will be updated with menu items generated for the highlighted
             * row.
             * @type {module:nrm-ui/views/contextView~ContextMenuConfig}
             */
            this.activeContextMenu = { 
                id: "nrm-contextmenu-btn", 
                label: "Table Actions"
            };
            /**
             * Customized context menu configuration that will be used to generate the active context menu.
             * @type {module:nrm-ui/views/contextView~ContextMenuConfig}
             */
            this.contextmenu = $.extend({ }, this.activeContextMenu, this.contextmenu);
            if (this.customInitialize)
                this.customInitialize(options);
        },
        /**
         * Gets the form configuration for generic rendering.
         * @returns {module:nrm-ui/views/resultsView~SearchResultsConfig|external:module:jquery~Promise}
         * Default implementation returns the configuration obtained from searchResults property of the context 
         * configuration.  Subclasses may return a promise to support dynamically lazy-loaded configuration, but usually
         * if subclasses override the default implementation they will return the configuration synchronously.
         */
        getResultsConfig: function() {
            return this.config;
        },
        /**
         * Mix in results view configuration from global "forms" configuration.
         * @param {module:nrm-ui/views/resultsView~SearchResultsConfig} config The configuration object to mix into.
         * @returns {module:nrm-ui/views/resultsView~SearchResultsConfig}
         * The original configuration with options mixed in.
         */
        mixResultsConfig: function(config) {
            return this.mixConfig('results', config);
        },
        /**
         * Generates the actions button configuration, adding default menu items to synchronize the menu with the
         * context menu on the associated folder node in the navigation tree.
         * @returns {module:nrm-ui/views/baseView~ControlConfig[]}
         */
        initializeActions: function() {
            // merge custom actions with default context mennu
            var allActions = [], i = 0, standaloneCount = 0, ids = { }, 
                    actionsButton = false, 
                    actionsButtonId = "searchresults-actions";
            _.each(this.config.actions || [], function(item, idx) {
                if (item.label === "Actions" || item.id === actionsButtonId) {
                    actionsButton = item;
                    i = idx;
                    _.each(item.items, function(item) {
                        allActions.push(item);
                        ids[item.id] = 1; 
                    });
                } else {
                    item.standalone = true;
                    item.group = !!item.group; // makes the implied false value explicit
                    allActions.push(item);
                    standaloneCount++;
                }
            });
            if (this.isSpatialContext) {
                _.each(this.defaultMapActions, function(action) {
                    if (!ids[action.id]) {
                        allActions.push(action);
                    }
                });
            }
            if (this.path) {
                allActions = BaseView.getContextItems.call(this, null, {
                    context: this.context,
                    nodetype: "folder", 
                    id: this.context.apiKey,
                    model: this.model,
                    path: this.path,
                    items: allActions,
                    prefix: "searchresults-",
                    group: this.options.group,
                    enableGroups: true
                    /*,collection: self.collection*/
                });
            }
            var actionItems = [], standalone = [], first = true;
            _.each(allActions, function(item) {
                if (item.standalone) {
                    if (item.group !== false) {
                        // add spacing between buttons for default standalone items added via BaseView.getContextItems
                        item.group = true; 
                    }
                    standalone.push(item);
                } else {
                    if (first && item.group)
                        item.group = false; // no separator on first item
                    first = false;
                    actionItems.push(item);
                }
            });
            if (actionItems.length > 0) {
                if (!actionsButton) {
                    actionsButton = { 
                        type: "btn", 
                        id: actionsButtonId, 
                        label: "Actions"
                    };
                    var title = this.getTitle();
                    if (title) actionsButton.title = "Actions for " + title + " table";
                } else {
                    actionsButton = _.omit(actionsButton, "items");
                    if (i > 0 && standalone.length > standaloneCount)
                        i += (standalone.length - standaloneCount);
                }
                actionsButton.items = actionItems;
                standalone.splice(i, 0, actionsButton);
            }
            this.actionsButtonId = actionsButton ? actionsButton.id : "nrm-contextmenu-btn";
            return this.currentActions = standalone;
        },
        /**
         * Override of {@link module:nrm-ui/views/baseView#onRemove|BaseView#onRemove} to destroy the NrmDataTable 
         * instance which is necessary to avoid memory leaks, and remove the associated layer from the map if it was
         * added in the generic render.
         * @returns {undefined}
         */
        onRemove: function() {
            if (this.dataTable) {
                this.dataTable.fnDestroy();
            } 
            if (this.managedLayer && this.layerKey && Nrm.app.mapView) {
                Nrm.app.mapView.removeCollectionLayer(this.layerKey);
            }
            Nrm.event.trigger("context:clearForm", { 
                path: this.options.path,
                context: this.context,
                view: this
            });
        },
        /**
         * Overrides {@link module:nrm-ui/views/resultView#getCollectionForTable|BaseView#getCollectionForTable} to get
         * the collection bound to this view.
         * @param {external:module:jquery} $table A JQuery element representing the data table
         * @returns {external:module:backbone.Collection} The collection or undefined if we couldn't figure it out.
         */
        getCollectionForTable: function($table) {
            if (this.collection && $table && !$table.attr("data-nrmprop")) {
                return this.collection;
            }
            return BaseView.prototype.getCollectionForTable.apply(this, arguments);
        },
        /**
         * Handles the context menu event for rows in the table body.
         * @param {Event} e Event data.
         * @returns {undefined}
         */
        onContextMenu: function(e) {
            //this.clickOnTableRow(e);
            // this.activeContextMenu is assigned in onActiveRowChanged
            var menu = this.activeContextMenu;
            if (!menu || !menu.items || !menu.items.length) return;
            e.preventDefault();
            var menuEvents = $.extend({ }, this.contextMenuEvents, this.config.contextMenuEvents);
            var clickEvents = _.object(_.map(menuEvents, function(value, key) {
                var handler = value;
                if (_.isString(value)) {
                    handler = _.bind(function(e) { 
                        if (_.isFunction(this[value])) 
                            this[value].call(this, e);
                    }, this);
                }
                return [key, _.isFunction(handler) ? _.bind(handler, this) : handler];
            }, this));
            var html = dropdownTemplate(menu), options = { 
                "evt" : e, 
                "clickLoc" : true, 
                menu: $(html), 
                clickEvents: clickEvents 
            };
            $("#nrm-contextmenu-btn").nrmContextMenu("showMenu", options);        
            if (!options.cancel) {
                e.stopPropagation();
            }
        },
        /**
         * Overrides {@link module:nrm-ui/views/baseView#genericTemplate} to set the default generic template for a
         * grid view.
         * @type {string}
         * @default
         */
        genericTemplate: "searchResults",
        /**
         * Default configuration.
         * @type {module:nrm-ui/views/resultsView~SearchResultsConfig}
         */
        defaults: {
            btnClass: "btn-sm",
            triggerNodeSelection: true,
            /*actions:  [
               { 
                   type: "btn", 
                   id: "searchresults-edit", 
                   label: "Edit", 
                   className: "nrmDataTable-singleSelect",
                   href: "#edit"
               }
            ],*/
            tableOptions: { /*defaultSelectedValue: true*/ },
            tableId: "nrmSearchResultsTable"
        },
        /**
         * Default context menu events, not currently used.
         * @type {Object.<string,Function>}
         */
        defaultMenuEvents: { },
        /**
         * Default actions to add to the actions menu if the collection has a spatial attribute.
         * @type {module:nrm-ui/views/baseView~MenuItemConfig}
         */
        defaultMapActions: [{
                id: "searchresults-zoomselected",  
                label: "Zoom to Selected", 
                className: "nrmDataTable-multiSelect",
                bottomGroup: true
            }, {
                id: "searchresults-zoomall",  
                label: "Zoom to All",
                className: "nrmDataTable-atLeastOne",
                bottomGroup: true
            }/*, {
                id: "searchresults-selMode",
                label: "Activate Select Tool"
            }*/],
        /**
         * Default events
         * @type {Object.<string,string|function>}
         * @see {@link |Backbone.View#events}
         */
        defaultEvents:  {
                "click #searchresults-zoomselected": "zoomToSelected",
                "click #searchresults-zoomall": "zoomToAll",
                "click #searchresults-selMode": "setSelectionMode",
                "click #searchresults-workList": "workList",
                //"click td": "clickOnTableRow"
                "activerow.nrm.dataTable": "onActiveRowChanged",
                "contextmenu tbody>tr": "onContextMenu"
        },
        /**
         * Triggers the {module:nrm-ui/event#context:workList|context:workList} global event.
         * @deprecated The work list functionality was an early idea that didn't pan out.
         * @returns {undefined}
         */
        workList: function() {
            // TODO: we can remove this, left over from early days
            //var dtData = this.dataTable.fnGetData();
            //var data = new Backbone.Collection(dtData, { model: this.results.model });
            var data = this.collection;
            /**
             * Load a "work list" of selected records.
             * @event module:nrm-ui/event#context:workList
             * @deprecated The work list functionality was an early idea that didn't pan out.
             * @param {Object} evtData
             * @param {module:nrm-ui/models/application~ContextConfig} evtData.context The context configuration
             * @param {external:module:backbone.Collection} evtData.tableData The collection.
             * @param {string} evtData.path The navigation path.
             */
            Nrm.event.trigger("context:workList", { 
                    context: this.context, 
                    tableData: data,
                    path: this.path
                });
        },
        /**
         * Handles the click event on the "Zoom to Selected" menu item to zoom to the geometry of all rows
         * with selection checkbox checked.
         * @param {Event} e Event data
         * @returns {undefined}
         */
        zoomToSelected: function(e) {
            e.preventDefault();
            if (this.layerKey) {
                /**
                 * Zoom to all or selected features of a {@link module:nrm-map/views/featureLayerView|FeatureLayerView}
                 * @event module:nrm-ui/event#map:zoomToLayer
                 * @param {string} layerKey Unique key identifying the FeatureLayerView.
                 * @param {Object} options Options to pass to the FeatureLayerView.
                 * @see {@link module:nrm-map/views/featureLayerView#zoomTo|FeatureLayerView#zoomTo} for the supported 
                 * options.
                 */
                Nrm.event.trigger("map:zoomToLayer", this.layerKey, { selection: true });
            }
        },
        /**
         * Handles the click event on the "Zoom to All" menu item to zoom to the geometry of all rows.
         * @param {Event} e
         * @returns {undefined}
         */
        zoomToAll: function(e) {
            e.preventDefault();
            if (this.context && this.collection && (!this.layerKey || typeof this.filter === "function")) {
                var geometries = this.collection.reduce(function(memo, model) {
                    if (this.filter(model)) {
                        var shape = Nrm.app.getShapeVal(this.context, model);
                        if (shape) memo.push(shape);
                    }
                    return memo;
                }, [], this);
                if (!geometries.length) return;
                Nrm.event.trigger("context:zoomTo", { geometries: geometries });
            } else if (this.layerKey) {
                Nrm.event.trigger("map:zoomToLayer", this.layerKey, { selection: false });
            }
        },
        /**
         * Gets the header text.
         * @returns {string}
         */
        getTitle: function() {
            return (this.config && this.config.title) || (this.context && this.context.caption);
        },
        /**
         * Render the view.
         * @returns {module:nrm-ui/views/resultsView}
         * Returns this instance to allow chaining.
         * @see {@link http://backbonejs.org/#View-render|Backbone.View#render}
         */
        render: function () {
            if (!this.canRender()) return this;
            /**
             * Indicates that the view was rendered using the generic rendering technique. 
             * @name module:nrm-ui/views/resultsView#useDefaultRendering
             * @type {Boolean}
             */
            this.useDefaultRendering = true;
            var caption = this.config.caption; 
            var title = this.getTitle();
            var searchEnabled = false;
            if (this.context.search)
                $.each(this.context.search, function(key, item) {
                   if (item) {
                       searchEnabled = true;
                       return false;
                   } 
                });
            if (!caption && searchEnabled) {
                caption = this.context.alias ? (this.context.alias + " search results") : "Search results for " + this.context.caption;
            } else if (!caption) {
                caption = "List of " + this.context.caption;
            }
            var actions = this.initializeActions();
            var ctx = $.extend({ }, this.config, { "title": title, //"Search Results: " + this.context.caption,
                "caption": caption,
                "type" : "tableEdit",
                "actions": actions,
                "id": this.tableId,
                "hasResults" : this.collection && this.collection.size() > 0,
                "value" : this.collection,
                "pluginOpts" : $.extend({ }, this.config.tableOptions, this.config.pluginOpts)
            });
            
            if (this.options.modelId && this.options.model && this.context && this.context.parent) {
                var par = ctx.parentLabel = {
                    label: this.context.parent.alias,
                    value:  Nrm.app.getModelVal(this.options.model, this.context.parent.nameAttr),
                    id: this.tableId + "-parentlabel"
                };
                if (!this.config.caption)
                    ctx.caption = ctx.caption + " for " + par.label + ": " + par.value;
            }
            var groupAttr = this.context && this.context.groupAttr, group = this.options.group;
            if (groupAttr) {
                _.find(ctx.columns, function(col, i) {
                    var prop = _.isString(col) ? col : col.prop;
                    if (prop === groupAttr) {
                        /**
                         * The index of the group attribute column.
                         * @type {?Number}
                         */
                        this.groupIdx = (ctx.rowActions ? 1 : 0) + i;
                        return true;
                    }
                }, this);
                if (group) {
                    /**
                     * An optional callback function that will be called on each model to filter the results before 
                     * binding to the table. Return value of the function indicates whether the model should be
                     * included in the table.
                     * @name module:nrm-ui/views/resultsView#filter
                     * @type {?Function}
                     */
                    this.filter = ctx.pluginOpts.nrmFilter = function(data) {
                        return Nrm.app.getModelVal(data, groupAttr) === group;
                    };
                } 
                ctx.groupLabel = this.createGroupLabel(groupAttr, group);
            }
            this.$el.html(this.template(ctx));
            var $table = this.applyPlugin(this.$el, ctx);
            if (this.config.showCaption) {
                $("caption", $table).removeClass("sr-only");
            }
            /**
             * A reference to the JQuery object extended with the NrmDataTable plugin.
             * @name module:nrm-ui/views/resultsView#dataTable
             * @type {module:nrm-ui/plugins/nrmDataTable}
             */
            this.dataTable = ctx.nrmDataTable;
            if (groupAttr && group && this.groupIdx > -1)
                this.dataTable.setColumnVisible(this.groupIdx, false);

            this.applyClasses();

            this.startListening();
            var layerKey = this.context.apiKey;
            if (this.isSpatialContext && Nrm.app.mapView && 
                    ((ctx.parentLabel && this.path) || this.config.layerKey)) {
                layerKey = this.config.layerKey || _.filter(this.path.split('/'), function(part, idx) {
                    return idx % 2 === 0;
                }).join('/');
                var layerCaption = this.config.layerCaption || this.config.title || (ctx.parentLabel &&
                        (ctx.parentLabel.label + " " + this.context.caption + ": " + ctx.parentLabel.value)) ||
                        this.context.caption;

                Nrm.app.mapView.addCollectionLayer(layerKey, this.collection, { 
                    context: this.context,
                    caption: layerCaption,
                    path: this.path,
                    model: this.model // the parent model for the collection
                });
                /**
                 * Indicates that there is a {@link module:nrm-map/views/featureLayerView|FeatureLayerView} that is
                 * managed by this view.
                 * @name module:nrm-ui/views/resultsView#managedLayer
                 * @type {Boolean}
                 */
                this.managedLayer = true;
            }
            /**
             * The key for the {@link module:nrm-map/views/featureLayerView|FeatureLayerView} associated with this view.
             * @name module:nrm-ui/views/resultsView#layerKey
             * @type {string}
             */
            this.layerKey = layerKey;
            /**
             * Enable or disable selection of one or more {@link module:nrm-map/views/featureLayerView|FeatureLayerView} 
             * @event module:nrm-ui/event#map:setLayerSelectable
             * @param {string|string[]} layerKeys A unique key identifying the layer, or an array of keys
             * @param {Boolean} selectable Indicates whether selection should be enabled or disabled.
             * @param {Object} [options]
             * @param {Boolean} [options.otherLayerVisible] If specified, indicates whether selection should be enabled
             *  or disabled on other layers.
             */
            Nrm.event.trigger("map:setLayerSelectable", layerKey, true, { otherLayersSelectable: false });
            return this;
        },
        /**
         * Overrides {@link module:nrm-ui/views/baseView#startListening} to hook up default event handlers for global
         * events.
         * @returns {undefined}
         */
        startListening: function() {
            this.listenTo(Nrm.event, {
                "clearAllTableSelections": this.clearSelection
            });
        },
        /**
         * Handles the "clearAllTableSelections" global event to uncheck all selection checkboxes when the selection
         * is cleared in the map.
         * @returns {undefined}
         */
        clearSelection: function() {
            if (!this.collection) return;
                this.collection.forEach(function(model) {
                    Nrm.app.setModelVal(model, "selected", false);
                }, this);
                this.collection.trigger("updateSelection", this.collection, { fromMap: true });
        },
        /**
         * Create the group label control configuration.
         * @param {string} groupAttr Group attribute name
         * @param {string} groupName Group attribute value
         * @returns {module:nrm-ui/views/baseView~ControlConfig}
         * The configuration for the group label
         */
        createGroupLabel: function(groupAttr, groupName) {
            var groupSchema = this.context.schema && this.context.schema[groupAttr],
                    label = this.config.groupLabel || (groupSchema && groupSchema.label) || groupAttr;
            return { 
                label: label, 
                value: groupName, 
                className: "nrm-results-group",
                id: this.tableId + "-grouplabel"
            };
        },
    //    renderGroupLabel: function(groupAttr, groupName) {
    //         var $label = $(".nrm-results-group", this.$el);
    //         if (!$label.length) {
    //             require(['hbs!staticLabel'], _.bind(function (template) {
    //             var $container = $("#" + this.tableId + "-grouplabel-container", this.$el);
    //             //var template = Handlebars.templates["staticLabel"];
    //             if ($container.length) {
    //                 $container.replaceWith(template(this.createGroupLabel(groupAttr, groupName)));
    //             }
    //             }, this));
    //         } else if (groupName) {
    //             $label.text(groupName);
    //         } else {
    //             $("#" + this.tableId + "-grouplabel-container", this.$el).empty().removeClass("row");
    //         }
    //         if (this.groupIdx || this.groupIdx === 0)
    //            this.dataTable.setColumnVisible(this.groupIdx, !groupName);
    //    },
        /**
         * Apply the context from a navigation event, returning true if the navigation event applies to this view.
         * The base implementation returns true if the path matches the path that was initially passed in to this view,
         * and also the event data contains certain information that distinguishes it as an appropriate event to 
         * display the results view.
         * @param {Object} options
         * @param {string} options.path The navigation path
         * @param {string} [options.event] The event name
         * @param {Object} [options.search] Search options
         * @returns {Boolean}
         * Indicates whether the navigation context applies to this view.
         */
        applyContext: function(options) {
            if ((options.event === "context:results" || options.search) && 
                    options.path === this.options.path) {
                this.applyGroup(options);
                return true;
            }
        },
        /**
         * Handles the "activerow" event triggered by the {@link module:nrm-ui/plugins/nrmDataTable|NrmDataTable plugin}
         * to update the context menu for the active row and also trigger the "context:activeRow" event to synchronize
         * the navigation tree selection.
         * @param {Event} event Event data
         * @returns {undefined}
         */
        onActiveRowChanged: function(event) {
            var model, items = null, row = $(event.target).closest('tr'),
                    path = row.attr("data-nrmtree-path");
            if (path) {
                model = this.getModelForTableRow(row);
                if (model) {
                    items = BaseView.getContextItems.call(this, row, {
                        context: this.context,
                        nodetype: Nrm.app.getDefaultNodeType(this.context), // for now...
                        id: model && model.id,
                        model: model,
                        path: path,
                        items: this.contextmenu && this.contextmenu.items,
                        prefix: "searchresults-context-"
                    });
                }
                var menu = { items: items };
                if (this.actionsButtonId) 
                    menu.id = this.actionsButtonId;
                this.activeContextMenu = $.extend({ }, this.activeContextMenu, menu);
                if (this.config.triggerNodeSelection)
                    Nrm.app.triggerEvent("context:activeRow", { path: path });
            }
            /* The commented-out lines below would select the folder node when the header row is activated.
             * This might improve consistency of the selected node matching the highlighted row in the grid,
             * but it makes the tree selection jump around while navigating multiple pages in the grid. */
            //else if (this.path)
            //    Nrm.app.triggerEvent("context:activeRow", { path: this.path });
        },
        /**
         * Update or remove the group label to reflect the selected node.
         * @param {Object} options
         * @param {string} [options.group] The new group attribute value.
         * @returns {undefined}
         */
        applyGroup: function(options) {
            if (this.dataTable && this.context && this.context.groupAttr && this.options.group !== options.group) {
                console.log("applying group filter: " + options.group);
                this.options.group = options.group;
                if (this.useDefaultRendering) {
                    this.clearSelection(); // maybe?
                    this.stopListening();
                    if (this.dataTable) {
                        this.dataTable.fnDestroy();
                    }
                    this.renderAndFocus();
    //                var groupAttr = this.context.groupAttr;
    //                this.filter = options.group ? function(data) {
    //                    return Nrm.app.getModelVal(data, groupAttr) === options.group;
    //                } : null;
    //                this.collection.trigger("filter", this.collection, { filter: this.filter });
    //                this.renderGroupLabel(groupAttr, options.group);
                }
            }
        },
        /**
         * Overrides {@link module:nrm-ui/views/baseView#getFocusElement|BaseView#getFocusElement} to return the main
         * content element.
         * @returns {external:module:jquery}
         */
        getFocusElement: function() {
            return $("#main-content");
        }
    });
});