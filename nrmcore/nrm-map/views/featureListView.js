/**
 * @file The FeatureListView extends {@link module:nrm-ui/views/baseView|BaseView} to display a list of features.
 * @see module:nrm-map/views/featureListView
 */
/** 
 * @module nrm-map/views/featureListView
 * @borrows module:nrm-ui/views/resultsView#applyContext as module:nrm-map/views/featureListView#applyContext
*/

define([
    'nrm-ui', 
    'jquery', 
    'underscore', 
    'backbone', 
    'nrm-ui/views/baseView', 
    'hbs!searchResults', 
    'hbs!dropdown',
    'hbs!tableSingleRecord',
    'esri/geometry/geometryEngine',
    'esri/graphicsUtils', 
    'nrm-ui/plugins/messageBox', 
    'nrm-ui/plugins/nrmDataTable', 
    'nrm-ui/plugins/nrmContextMenu',
    '../models/flm'], 
        function(
                Nrm, 
                $, 
                _, 
                Backbone, 
                BaseView, 
                template, 
                dropdownTemplate, 
                AttributeDialogTemplate,
                geometryEngine,
                graphicsUtils, 
                MessageBox, 
                DataTable, 
                NRMContextMenu, 
                FLM
        ) {
    // based on resultsView.  ebodin 8/5/2014
    /** 
     * Options for displaying the view.
     * @typedef {Object} FeatureListOptions
     * @property {external:module:esri/layers/FeatureLayer[]} [featureLayers] List of feature layers to bind 
     * to the grid.
     * @property {external:module:esri/layers/FeatureLayer} [featureLayer] A feature layer to bind to the grid, 
     * either this or the featureLayers option is required, and they are mutually exclusive.
     * @property {string[]} [skipFields] Field names to ignore.
     * @property {string} [path] The navigation path.
     * 
     */
    
    return Nrm.Views.FeatureListView = BaseView.extend(/** @lends module:nrm-map/views/featureListView.prototype */{
        /**
         * A class name that will be applied to the container element
         * @type {string}
         * @default
         */
        className: "container",
        
        /**
         * Create a new instance of the FeatureListView.  
         * @constructor
         * @alias module:nrm-map/views/featureListView
         * @classdesc
         *   A Backbone view that extends {@link module:nrm-ui/views/baseView|BaseView} to display a list of features
         *   in a grid.
         * @param {module:nrm-map/views/featureListView~FeatureListOptions} options 
         * @see {@link http://backbonejs.org/#View-constructor|Backbone View constructor / initialize}
         */
        initialize: function(options){
            Nrm.app.featureListView = this;
            if (this.context === undefined) this.context = {};
            if (options === undefined) {
                options = {};
            }
            if (options.featureLayers) {
                /**
                 * The feature layers to display in the grid.
                 * @type {external:module:esri/layers/FeatureLayer[]}
                 */
                this.layers = options.featureLayers;
            } else if (options.featureLayerView) {
                this.layers = _.map(options.featureLayerView.layers, function(layerData){return layerData.layer;});
            } else {
                this.layers = [options.featureLayer];
            }
            this.options = $.extend(true, { }, this.defaults, options);
            /**
             * The first layer which is used to assemble the columns and determine the model id attribute name.
             * @type {external:module:esri/layers/FeatureLayer}
             */
            this.layerSample = this.layers[0];

            var actionsButton = false;
            var i = 0;
            if (this.options.actions === undefined) {
                this.options.actions = [];
            }
            _.each(this.options.actions || [], function(action) {
                if (action.label === "Actions" || action.id === "searchresults-actions") {
                    actionsButton = action;  
                }
                if (!actionsButton) i++;
            }); 
            var spatial = true;
            if (spatial) {
                if (!actionsButton) {
                    actionsButton = { 
                        type: "btn", 
                        id: "searchresults-actions", 
                        label: "Actions"
                    };
                    this.options.actions.unshift(actionsButton);
                }
                actionsButton.items = actionsButton.items || [];
                var ids = _.map(actionsButton.items, function(item) {
                    return item.id;
                });

                _.each(this.defaultMapActions, function(action, idx) {
                    if ($.inArray(action.id, ids) <= -1) {
                        action = $.extend(true, { }, action);
                        if (idx === 0 && ids.length > 0) {
                            action.group = true;
                        }
                        actionsButton.items.push(action);
                    }
                });
            }

            if (this.layerSample) {
                var layerOIDField = this.layerSample.objectIdField;
                //this.options.skipFields = this.defaults.skipFields;
                this.options.skipFields = _.union(this.options.skipFields, this.defaults.skipFields);
                this.options.skipFields.push(layerOIDField);

                var Model = Backbone.Model.extend({idAttribute: layerOIDField});

                // set this.options.columns array to the Fields list, string field name or {label: field alias, prop: model attribute name)}
                // may want to add shape column
                this.options.columns = options.columns || [];
                //this.options.columns.push({label: "hideme", prop: "selected", bVisible: false, visible: false});
                if (this.options.columns.length === 0) {
                    var f, fdef;
                    for (var i in this.layerSample.fields){
                        f = this.layerSample.fields[i];
                        if (this.options.skipFields.indexOf(f.name ) !== -1) continue;
                        fdef = {label: f.alias, prop: f.name};
                        switch (f.type) {
                            case "esriFieldTypeSmallInteger":
                            case "esriFieldTypeInteger":
                            case "esriFieldTypeSingle":
                            case "esriFieldTypeDouble":
                                fdef.dataType = "numeric";
                                break;
                            case "esriFieldTypeDate":
                                fdef.dataType = "date";
                                break;
                            // esriFieldTypeString esriFieldTypeOID esriFieldTypeGeometry esriFieldTypeBlob esriFieldTypeRaster esriFieldTypeGUID esriFieldTypeGlobalID esriFieldTypeXML
                        }
                        this.options.columns.push(fdef);
                    }
                }
                //this.options.columns.push("geometry");

                /**
                 * The collection bound to this view.
                 * @type {external:module:backbone.Collection}
                 */
                if (this.options.featureLayerView) {
                    this.collection = options.featureLayerView.collection;
                    this.collectionContext = options.featureLayerView.context;
                } else {
                    this.collection = new Backbone.Collection(); //({model: this.model});
                    this.collection.model = Model;
                    this.layers.forEach(function(layer){
                        for (var i in layer.graphics){
                            var g = layer.graphics[i];
                            var m = $.extend({}, g.attributes, {geometry: g.geometry});
                            var model = new Model(m);
                            this.collection.add(model);
                        }
                    }, this);
                    this.collectionContext = {
                        alias: "CopyFeature",
                        caption: "Copy From Map Layer",
                        collection: this.collection,
                        shapeAttr: "geometry"
                    };
                }
                this.shapeAttr = this.collectionContext.shapeAttr;
            }
            
            this.path = options.path;
            this.events = $.extend({ }, this.defaultEvents, this.events);
            /**
             * The element id for the table.
             * @todo Change the default value to something that is not likely to collide with the default table id in 
             * {@link module:nrm-ui/views/resultsView|ResultsView}
             * @default
             * @type {string}
             */
            this.tableId = "nrmSearchResultsTable";
            this.events["contextmenu tbody>tr"] = "onContextMenu";
            if (spatial) {
                /**
                 * Context menu configuration 
                 * @type {module:nrm-ui/views/contextView~ContextMenuConfig}
                 */
                this.contextmenu = { 
                            id: "featurelist-tableActions", 
                            label: "Table Actions",
                            items: [{
                                id: "featurelist-context-attributes",
                                label: "Show Detail",
                                href: "#",
                                className: "nrm-route-action" // prevents default action
                            }, {
                                id: "featurelist-context-zoom",  
                                label: "Zoom to Feature",
                                href: "#",
                                className: "nrm-route-action" // prevents default action
                            }, {
                                id: "featurelist-context-pan",  
                                label: "Pan to Feature",
                                href: "#",
                                className: "nrm-route-action"
                            }]
                        };
            }
            if (this.customInitialize)
                this.customInitialize(options);
        },
        /**
         * Override of {@link module:nrm-ui/views/baseView#onRemove|BaseView#onRemove} to destroy the NrmDataTable 
         * instance which is necessary to avoid memory leaks.
         * @returns {undefined}
         */
        onRemove: function() {
            if (this.dataTable) {
                try {
                    this.dataTable.fnDestroy();
                } catch (e) {
                    this.dataTable = null;
                    console.warn("featureListView error removing table", e);
                }
            } 
            // TODO: pretty sure we can remove the "context:clearForm" event here (and perhaps everywhere)
            // NOPE: 2/16/2017 mapIdentifyView and mapView are listening for this to know featureListView is removed
            Nrm.event.trigger("context:clearForm", { 
                path: this.options.path,
                context: this.context,
                view: this
            });
            Nrm.app.featureListView = undefined;
            //this.trigger("remove", this); 
        },
        /**
         * Handles the context menu event for rows in the table body.
         * @param {Event} e Event data.
         * @returns {undefined}
         */
        onContextMenu: function(e) {
            if (!this.contextmenu) return;
            e.preventDefault();            
            var options = { "evt" : e, "clickLoc" : true };
            //var template = Handlebars.templates["dropdown"];
            var html = dropdownTemplate(this.contextmenu);
            var $menu = options.menu = $(html);
            var rowid = $(e.target).closest('tr').attr("data-nrm-rowid");
            var dt = this.dataTable;
            var $row = dt.dataTable.$('[data-nrm-rowid="'+ rowid + '"]');
            this.collection.trigger("highlightRow", {dataTable: dt.dataTable, $row: $row});
            var forEach = function(items) {
                if (!items) return;
                _.each(items, function(item) {
                    var el = $("#" + item.id, $menu);
                    el.attr("rowid", rowid);
                    /**
                     * Context menu item event for the {@link module:nrm-map/views/featureListView|FeatureListView}
                     * @todo fix this implementation so that it uses a route, which means the parameters will change
                     * @event module:nrm-ui/event#featureList:contextmenu
                     * @param {HTMLElement} item The target of the event
                     */
                    el.attr("onclick","Nrm.event.trigger('featureList:contextmenu',this);");
    //                if (item.href && item.href !== "#")
    //                    el.attr("href", item.href + "/" + path); 
                    forEach(item.items);
                });
            };
            forEach(this.contextmenu.items);
            $("#nrm-contextmenu-btn").nrmContextMenu("showMenu", options);        
            if (!options.cancel) {
                e.stopPropagation();
            }
        },
        /**
         * Default initialization options.
         * @type {Object}
         */
        defaults: {
            actions:  [
               { 
                    type: "btn",
                    id: "featurelist-ok",  
                    label: "OK",
                    btnStyle: "primary"
                    //,className: "nrmDataTable-singleSelect" //, nrm-route-action 
                }, {
                    type: "btn",
                    id: "featurelist-cancel",  
                    label: "Cancel"
                },
                { id: "searchresults-actions", label: "Actions" } // puts buttons before actions menu
            ],
            skipFields: [ "SHAPE", "shape", "geometry", "GEOMETRY" ],
            tableOptions: { defaultSelectedValue: true }
        },
        /**
         * Default actions to add to the actions menu.
         * @type {module:nrm-ui/views/baseView~MenuItemConfig}
         */
        defaultMapActions: [
            {
                id: "searchresults-zoomselected",  
                label: "Zoom to Selected", 
                className: "nrmDataTable-multiSelect nrm-route-action"    
            }, {
                id: "searchresults-zoomall",  
                label: "Zoom to All",
                className: "nrmDataTable-atLeastOne nrm-route-action"
            }
        ],
        /**
         * Default events
         * @type {Object.<string,string|function>}
         * @see {@link |Backbone.View#events}
         */
        defaultEvents:  {
                "click #searchresults-zoomselected": "zoomToSelected",
                "click #searchresults-zoomall": "zoomToAll",
                "click #featurelist-attributes": "showAttributes",
                "click #featurelist-ok": "ok",
                "click #featurelist-cancel": "cancel",
                "activerow.nrm.dataTable": "onActiveRowChanged"
        },
        /**
         * Handles click event on context menu items
         * @todo fix this implementation so that it uses a route, and doesn't rely on an invalid attribute name
         * @param {HTMLElement} item The target of the event
         * @returns {undefined}
         */
        handleContextMenu: function(item){
            var rowid = item.attributes["rowid"].value;
            switch (item.id) {
                case "featurelist-context-zoom":
                    this.zoomToSelected(rowid);
                    break;
                case "featurelist-context-pan":
                    this.zoomToSelected(rowid, true);
                    break;
                case "featurelist-context-attributes":
                    this.showAttributes(rowid);
                    break;
            }
        },
        /**
         * Display all attributes of feature
         * @param {Event|string|Number} e Event data if called from an event handler, or index of the selected row in
         *  the collection as a string or number
         * @returns {undefined}
         */
        showAttributes: function(e) {
            var self = this;
            var rowid;
            switch (typeof e) {
                case 'string':
                    rowid = parseInt(e);
                    break;
                case 'number':
                    rowid = e;
                    break;
                default:
                    var model = self.collection && self.collection.findWhere({ "selected" : true });
                    if (!model) return;
                    rowid = parseInt(model.id);
            }
            if (!model) {
                model = self.collection.get(rowid);
                if (!model) return;
            }
            var atts = model.has("allAttributes") ? JSON.parse(model.get("allAttributes")) : model.attributes,
                layerName = model.get("layerName"),
                templateOpts = {
                    id: "show-attributes-" + rowid,
                    "max-height": "400px",
                    nameValuePairs: _.pairs(atts)
                };
            if (layerName) {
                templateOpts.caption = "Layer: " + layerName;
            }
            var s = AttributeDialogTemplate(templateOpts).replace(/[\r\n]/g,"");
            if ($(".nrm-featurelist-attributes").length > 0 && self.$attributeDialog.length > 0) {
                $(".ui-pnotify-text", self.$attributeDialog).html(s).removeClass("hidden");
            } else {
                self.$attributeDialog = MessageBox(s, {
                    title: "Attributes", 
                    type: "info", 
                    collapsible: true, 
                    movable:true,
                    addclass: "nrm-featurelist-attributes",
                    after_close: function(p){p.closed = true;}
                });
            }
            self.$attributeDialog.closed = null;
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
         * Zoom to the selected feature
         * @param {Event|string|Number} e Event data if called from an event handler, or index of the selected row in
         *  the collection as a string or number
         * @param {Boolean} [pan=false] Pan instead of zoom
         * @returns {undefined}
         */
        zoomToSelected: function(e, pan) {
            var rowid, geometries = [];
            switch (typeof e) {
                case 'string':
                    rowid = parseInt(e);
                    break;
                case 'number':
                    rowid = e;
                    break;
                default:
                    geometries = _.pluck(_.where(this.collection.toJSON(),{selected: true}), this.collectionContext.shapeAttr);
            }
            if (geometries.length === 0 && rowid !== undefined) {
                var model = this.collection.get(rowid);
                geometries.push(model.get(this.collectionContext.shapeAttr));
            }
            if (geometries.length > 0) {
                if (pan) {
                    Nrm.event.trigger("context:panTo", {geometries: geometries});
                } else {
                    Nrm.event.trigger("context:zoomTo", {geometries: geometries});
                }
            }
        },
        /**
         * Zoom to the extent of all features
         * @param {Event} [e] Event data if called from an event handler.
         * @returns {undefined}
         */
        zoomToAll: function(e) {
            if (e) e.preventDefault();
            var extents = _.map(this.layers, function(layer){return graphicsUtils.graphicsExtent(layer.graphics);}),
                geometry = extents[0];
            if (extents.length > 1) {
                for (var i = 1; i < extents.length; i++) {
                    geometry = geometry.union(extents[i]);
                }
            }
            Nrm.event.trigger("context:zoomTo", {geometry: geometry});
        },
        /**
         * Render the view.
         * @returns {module:nrm-ui/views/featureListView}
         * Returns this instance to allow chaining.
         * @see {@link http://backbonejs.org/#View-render|Backbone.View#render}
         */
        render: function () {
            $.when(FLM.getFlmDataSourceLov()).done(_.bind(function(dataSourceCollection) {
                //var template = Handlebars.templates[this.options.template || "searchResults"];
                var layer = this.layerSample,
                    title = this.options.title || "";
                if (layer) {
                    title = (layer.nrmOptions && layer.nrmOptions.caption) || "Map Layer " + layer && layer.id;
                    _.each(this.collection.models, function(m){
                        var dsAttName = FLM.getDataSourceAttName(m.attributes),
                            ds = m.get(dsAttName),
                            dsVerified = FLM.getDataSource(m.attributes) || "00";
                        if (dsVerified !== ds) {
                            if (dsVerified === "00") {
                                m.set(dsAttName, ds + " (Unknown)");
                            } else {
                                m.set(dsAttName, dsVerified);
                            }
                        }
                    });
                }
                var ctx = { "title": title, //this.context.caption, //"Search Results: " + this.context.caption,
                    "type" : "tableEdit",
                    "actions": this.options.actions,
                    "id": this.tableId,
                    "path": this.options.path,
                    "hasResults" : this.collection && this.collection.size() > 0,
                    "value" : this.collection,
                    "columns" : this.options.columns,
                    "idAttr" : this.collection && this.collection.model && this.collection.model.prototype.idAttribute,
                    "skipFields" : this.options.skipFields,
                    "pluginOpts" : {
                        "multiSelect" : true,
                        "readOnly" : false
                    }            
                };
                this.$el.html(template(ctx));
                this.applyPlugin(this.$el, ctx);
                /**
                 * The NrmDataTable instance.
                 * @name module:nrm-map/views/featureListView#dataTable
                 * @type {module:nrm-ui/plugins/nrmDataTable}
                 */
                var dt = this.dataTable = ctx.nrmDataTable;
                //this.dataTable = new NrmDataTable({aoColumns: this.options.columns}); //why not? ebodin
                //this.dataTable.dataTable.fnSetColumnVis( 0, false ); // hide the selection boxes
                this.listenTo(Nrm.event, "featureList:contextmenu", this.handleContextMenu);

                if (this.options.message) {
                    var $e = $("#" + ctx.id + "-label", this.$el),
                        html = "<div id=" + ctx.id + "-message>" + this.options.message + "</div>";
                    $e.after(html);
                }
                
                if (this.collection && this.collection.length === 1) {
                    this.collection.models[0].set("selected", true);
                    this.collection.trigger("updateSelection", this.collection, {fromMap: true, flash: true});
                }
                var $attributeDialog = $(".nrm-featurelist-attributes");
                if ($attributeDialog.filter(":visible").length > 0) {
                    this.$attributeDialog = $attributeDialog;
                }
                this.$el.addClass("nrm-help-provider").attr("data-nrm-help-context", this.options.helpContext);
                Nrm.event.trigger("featureListView:render", this);
                return this;
            }, this));
        },
        applyContext: function(options) {
            if ((options.event === "context:results" || options.search) && 
                    options.path === this.options.path) {
                return true;
            }
        },
        /**
         * Handle the custom activerow event triggered by {@link module:nrm-ui/plugins/nrmDataTable|NrmDataTable} to
         * select the row when it is highlighted, i.e. the equivalent of the row selection checkbox.
         * @param {Event} e Event data.
         * @returns {undefined}
         */
        onActiveRowChanged: function(e) {
            var row = $(e.target).closest('tr'),
                model = row.length && this.getModelForTableRow(row),
                shapeVal = model && Nrm.app.getShapeVal(this.collectionContext, model);
            if (shapeVal) {
                var options = { 
                        attributes: { 
                            id: model.id, 
                            selected: model.get("selected"),
                            highlighted: model.get("highlighted")
                        },
                        pan: true 
                    };
                options.geometry = shapeVal;
                Nrm.event.trigger("map:highlightGraphic", options);
            }
            if (model && this.$attributeDialog && !this.$attributeDialog.closed) {
                this.showAttributes(model.id);
            }
        },
        /**
         * Select row by an object id.
         * @param {string|Number} id The object id value
         * @returns {undefined}
         */
        selectRowByID: function(id){
            // highlight
            var dt = this.dataTable;
            var $row = dt.dataTable.$('[data-nrm-rowid="'+ id + '"]');
            this.collection.trigger("highlightRow", {dataTable: dt.dataTable, $row: $row});
        },
        /**
         * Handles the OK button click, triggers the global "map:endDraw" event and removes the view.
         * @returns {undefined}
         */
        ok: function() {
           var  models = this.collection.where({ "selected" : true });
           if (models.length === 0) {
               // TODO: probably could do better with this error message.
               MessageBox("Please select a row in the grid.");
               return;
           }

           try {
               var attributes = [], geometries = [], gtypes = [];
               $.when(FLM.getFlmDataSourceLov()).done(_.bind(function() {
                    _.each(models, function(model) {
                         var geometry = Nrm.app.getShapeVal(this.collectionContext, model),
                             atts = model.attributes,
                             flmDataSource = FLM.getDataSource(atts),
                             flmRevDate = FLM.getRevDate(atts),
                             flmAccuracy = FLM.getAccuracy(atts);
                         attributes.push({
                             flmDataSource: flmDataSource,
                             flmAccuracy: flmAccuracy != null ? flmAccuracy : null,
                             flmRevDate: flmRevDate
                         });
                         geometries.push(geometry);
                    }, this);
                    var data = this.layerSample.importOptions !== undefined ? $.extend({}, this.layerSample.importOptions) : {},
                        atts;
                    if (geometries.length === 1) {
                        data.geometry = geometries[0];
                        atts = attributes[0];
                    } else if (geometries.length > 1) {
                        if (_.unique(_.pluck(geometries, "type")).length > 1) {
                            MessageBox("Plase limit your selection to only one geometry type (i.e. point OR line OR polygon).");
                            return;
                        }
                        data.geometry = geometryEngine.union(geometries);
                        var datasources = _.unique(_.pluck(attributes, "flmDataSource")),
                            revdates = _.unique(_.pluck(attributes, "flmRevDate")),
                            accuracies = _.unique(_.pluck(attributes, "flmAccuracy"));
                        atts = {
                            flmDataSource: datasources.length === 1 ? datasources[0] : "24", // other
                            flmRevDate: revdates.length === 1 ? revdates[0] : undefined,
                            flmAccuracy: accuracies.length === 1 ? accuracies[0] : null
                        };
                    }
                    _.extend(data.attributes, atts);
                    Nrm.event.trigger("map:featureCreate", data);
                    this.close();
               }, this));
           } catch (ex) {
                console.warn('featureListView error in ok', ex);
                this.close();
           }
        },
        /**
         * Handles Cancel button click, removes the view and triggers global "map:deactivateTool" event.
         * @returns {undefined}
         */
        cancel: function() {
            /**
             * Triggered when {module:nrm-map/views/featureListView|FeatureListView} is cancelled
             * @event module:nrm-ui/event#map:cancelFeatureListView
             */
            Nrm.event.trigger("map:cancelFeatureListView");
            // the context:clearForm event is triggered in the close method
            //Nrm.event.trigger("context:clearForm");
            this.close();
        },
        /**
         * Remove the view
         * @todo This is basically an override of the remove function, so why not just override remove?
         * @returns {undefined}
         */
        close: function() {
            try { 
                if (this.layerSample && this.layerSample.temporary)
                    Nrm.app.mapView.removeTemporaryLayers();
            } catch (ex) {
               console.warn('featureListView error in close', ex);
            } finally {
                this.remove();
            }
        },
        /**
         * Get the model id attribute name, which is the same as the objectIdField from the first layer.
         * @returns {string}
         */
        getIdAttributeName: function(){
            return this.collection.model.prototype.idAttribute;
        }
    });
});