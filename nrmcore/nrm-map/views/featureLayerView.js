/**
 * @file The FeatureLayerView is a {@link http://backbonejs.org/#View|Backbone.View} that manages a set of feature 
 * layers bound to a Backbone collection.
 * @see module:nrm-map/views/featureLayerView
 */
/** 
 * @module nrm-map/views/featureLayerView
 */
/**
 * Configuration for the FeatureLayerView.
 * @typedef LayerConfig
 * @property {module:nrm-map/views/featureLayerView~RendererConfig} [renderer] - define a renderer
 * @property {boolean|object} [tooltip=false] - true to display all model attributes, or provide a config object
 * @property {string[]|object[]} [tooltip.attributes] - array of model attribute names or {name, alias} objects
 * @property {string} [tooltip.header] - HTML fragment to display above attributes
 * @property {Array.<string|module:nrm-map/views/featureLayerView~FieldInfo>} [fields] List of fields to limit the model
 * attributes that are exposed in the layer.
 * @property {string} [shapeAttr="shape"] - shape attribute name
 * @property {string} [nameAttr] - label attribute name
 * @property {string} [nameAlias="Name"] - field alias for the label attribute
 * @property {string} [searchKey="/search"] - search URL suffix, usually obtained from the context configuration.
 * @property {Number} [maxResults=1000] - maximum results to return from a spatial search.
 * @property {Boolean} [postSearch=true] - search requests should use POST method instead of GET.
 * @property {Number} [wkid=4326] - well-known id of the spatial reference.
 * @property {string|module:nrm-ui/views/featureLayerView~SymbolConfig} [symbol="normal"] - symbol configuration
 * @property {Boolean} [zoomToSelection=false] - zoom to selection when it changes.
 * @property {Boolean} [ensureSelectionVisible=false] - pan to selection when it changes, or zoom if outside min/max scale
 * range
 * @property {Boolean} [zoomOnReset=false] - zoom to features when the collection is reloaded
 * @property {Boolean} [ensureVisibleOnReset=true] - ensure features are visible, which may be a pan or a zoom, and make
 * layer visible when the collection is reloaded.
 * @property {Number} [minScale=0] - minimum scale at which the layer is visible
 * @property {Number} [maxScale=0] - maximum scale at which the layer is visible
 * @property {Boolean} [selectable=true] - layer is selectable
 * @property {Boolean} [visible=true] - layer is visible
 * @property {Number} [minZoomToScale=5000000] - minimum scale when zooming
 * @property {Number} [maxZoomToScale=24000] - maximum scale when zooming
 * @property {Number} [tolerance=2] - tolerance in pixels when converting a point to an extent
 * @property {string} [flmDataSource="flmDataSource"] - default attribute name for the FLM Data Source
 * @property {string} [flmRevDate="flmRevDate"] - default attribute name for the FLM Rev Date
 * @property {string} [flmAccuracy="flmAccuracy"] - default attribute name for the FLM Accuracy
 * @property {Number} [opacity=1] - opacity from 0 (fully transparent) to 1 (fully opaque).
 */
/**
 * Field info
 * @typedef FieldInfo
 * @property {string} name Field name (usually a model attribute name)
 * @property {string} alias Field alias to display in the UI
 * @property {string} [type="esriFieldTypeString"] Field type
 */
/**
 * Renderer configuration for the FeatureLayerView.
 * @typedef RendererConfig
 * @property {string} [type] - values: opacity, color, hatch, image
 * @property {string} [fieldName] - field whose values drive symbols
 * @property {string} [fieldName2] - second field whose values drive symbols
 * @property {string} [fieldName3] - third field whose values drive symbols
 * @property {string} [fieldNameAlias] - optional label for legend heading
 * @property {string[]|number[]} [values] - values of fieldName (concatenated if using fieldName2/3)
 * @property {string[]} [labels] - optional label in legend for each value
 * @property {object} [colors] - "color" type only. Color name or rgb array for each value, supplied to dojo.Color()
 * @property {string} [style] - "hatch" type only. values: vertical, horizontal, forward_diagonal, backward_diagonal, 
 * cross, diagonal_cross or 
 * {@link https://developers.arcgis.com/javascript/jsapi/simplefillsymbol-amd.html#constants|ArcGIS SimpleFillSymbol 
 * Constants}
 * @property {string} [imageUri] - "image" type only. URL, relative URL, or data URI for image
 */
define(['nrm-ui', 'jquery', 'underscore', 'backbone', 
    'dojo/_base/connect', 'dojo/_base/event', 'dojo/_base/Color', 'esri/kernel', 'esri/symbols/jsonUtils',
    'esri/layers/FeatureLayer','esri/tasks/FeatureSet', 'esri/tasks/query','esri/geometry/ScreenPoint', 'esri/geometry/Extent', 'esri/graphic',
    'esri/symbols/SimpleLineSymbol', 'esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleMarkerSymbol', 'esri/symbols/PictureFillSymbol',
    'esri/renderers/SimpleRenderer', 'esri/renderers/UniqueValueRenderer', 
    'esri/graphicsUtils', 'esri/geometry/webMercatorUtils', 'esri/geometry/scaleUtils',
    'dijit/TooltipDialog', 'dijit/popup', 
    '../models/flm',
    'nrm-ui/views/baseView'
], 
         function(Nrm, $, _, Backbone, connect, dojoEvent, Color, esri, symbolUtils,
             FeatureLayer, FeatureSet, Query, ScreenPoint, Extent, Graphic,
             SimpleLineSymbol, SimpleFillSymbol, SimpleMarkerSymbol, PictureFillSymbol,
             SimpleRenderer, UniqueValueRenderer, graphicsUtils, prjUtils, scaleUtils,
             TooltipDialog, dijitPopup,
             FLM,
             BaseView
         ) {

    // Order of geomTypes array is important ensure points are above lines and lines are above polygons (top layer is greatest index)
    var geomTypes = ["esriGeometryPolygon", "esriGeometryPolyline", "esriGeometryMultipoint", "esriGeometryPoint" ];

    // The selectPriority array is used to determine order in which layers are searched to find first selected feature in mapClick event.
    // Polylines with line weight 1 are difficult to click on directly to get the layer onClick event to fire... 
    // Points are easier but also may be difficult if symbol is small.
    // Polygons are generally easy to click on if zoomed in close enough so select from this last. 
    var selectPriority = ["esriGeometryPolyline", "esriGeometryPoint", "esriGeometryMultipoint", "esriGeometryPolygon" ];

    return Nrm.Views.FeatureLayerView = Backbone.View.extend(/** @lends module:nrm-map/views/featureLayerView.prototype */ {
        /**
         * Create a new FeatureLayerView instance.
         * The complete set of options are determined in the following precedence:
         * 
         * <ol>
         * <li>Options passed directly to constructor</li>
         * <li>A subset of options from the context.schema configuration for the shape attribute:
         *   <ul>
         *   <li>flmDataSource</li>
         *   <li>flmRevDate</li>
         *   <li>flmAccuracy</li>
         *   </ul>
         * </li>
         * <li>The "searchSuffix" option from the {@link module:nrm-ui/models/application~SearchConfigMap|search 
         * configuration} with key="spatial" if found in the context configuration.</li>
         * <li>The "layer" configuration object found in the context configuration</li>
         * <li>A subset of options from the context configuration:
         *   <ul>
         *   <li>caption</li>
         *   <li>symbol</li>
         *   <li>renderer</li>
         *   <li>maxResults</li>
         *   <li>postSearch</li>
         *   <li>nameAttr</li>
         *   <li>shapeAttr</li>
         *   </ul>
         * </li>
         * <li>{@link module:nrm-map/views/featureLayerView#defaults|FeatureLayerView.defaults}</li>
         * </ol>
         * 
         * @constructor
         * @alias module:nrm-map/views/featureLayerView
         * @classdesc The FeatureLayerView is a Backbone.View that adds a layer or group of layers based on a 
         * collection when the render function is called.  
         * The view listens to collection events to refresh the layer contents when the collection changes.
         * @param {module:nrm-map/views/featureLayerView~LayerConfig} options In addition to the properties described 
         * in the LayerConfig type, the following additional options are supported:
         * @param {external:module:backbone.Collection} options.collection - The collection to bind to the layers.
         * @param {module:nrm-map/Map} options.mapControl - The map control
         * @param {string|function} [options.caption] - layer caption for TOC, either a string or 
         *        a function that runs in context of this view and returns a string.
         * @param {string[]} [options.captionAttributes] - Overrides automatically detected value of 
         * {@link module:nrm-map/views/featureLayerView#captionAttributes|captionAttributes property} if the caption 
         * option is a function.
         * @param {module:nrm-ui/models/application~ContextConfig} [options.context] - context configuration
         * @param {string} [options.path] - The navigation path associated with the view.
         */
        initialize: function(options) {
            /**
             * The map control.
             * @type {module:nrm-map/Map}
             */
            this.mapControl = options.mapControl;
            /**
             * The collection bound to this view
             * @type {external:module:backbone.Collection}
             */
            this.collection = options.collection;
            /**
             * The context configuration associated with this view.
             * @type {module:nrm-ui/models/application~ContextConfig}
             */
            this.context = options.context || {};
            /**
            * Array of attribute names to listen for change events to trigger reloading the layer to update the TOC 
            * caption. If not provided, will be populated by searching for ".get(" statements in the caption function.
            * @type {string[]}
            */
            this.captionAttributes = options.captionAttributes || [];

            var shapeAttr = options.shapeAttr || this.context.shapeAttr || this.defaults.shapeAttr,
                    contextKeys = ["caption", "symbol", "renderer", "maxResults", "postSearch", "nameAttr", "shapeAttr"],
                    ctxOpt = _.extend(_.pick(this.context, contextKeys), this.context.layer),
                    allSchema = this.context.schema || {},
                    shapeSchema = allSchema[shapeAttr],
                    displayField;

            // setting nameAlias refactored 
            //        if (ctxOpt.nameAttr) {
            //            if (allSchema[ctxOpt.nameAttr]) {
            //                var alias = allSchema[ctxOpt.nameAttr].label;
            //                if (alias) ctxOpt.nameAlias = alias;
            //            }
            //        }
            if (this.context.search && this.context.search.spatial && this.context.search.spatial.searchSuffix) {
                ctxOpt.searchKey = this.context.search.spatial.searchSuffix;
            }

            // add relevant options from the schema object for the shape field
            // flmDataSource, flmAccuracy, flmRevDate identify the attribute names in the model
            if (shapeSchema) {
                ctxOpt = $.extend(ctxOpt, _.pick(shapeSchema, "flmDataSource", "flmAccuracy", "flmRevDate"));
            }
            /**
             * Initialization options
             * @type {Object}
             */
            this.options = $.extend({}, this.defaults, ctxOpt, options);
            function schemaToField(schema, name) {
                // schema may be undefined
                // convert schema dataType to esriFieldType, default to string
                var dataType = "esriFieldTypeString";
                if (schema && schema.dataType) {
                    switch (schema.dataType) {
                        case "date":
                        case "datetime":
                        case "datetime-local":
                            dataType = "esriFieldTypeDate";
                            break;
                            //                    case "number":
                            //                    case "numeric":
                            //                    case "range":
                            //                        // TODO: provide a way to determine if a numeric field is integer or decimal?
                            //                        dataType = "esriFieldTypeDouble"
                            //                        break;
                    }
                }
                return {
                    "name": name,
                    "alias": (schema && schema.label) || name,
                    //"dataType": schema.dataType,
                    "type": dataType
                };
            }
            function findField(fields, fieldName) {
                // TODO: should this be case-insensitive?
                return _.findWhere(fields, {name: fieldName});
            }
            function addField(fields, fieldName) {
                var field = findField(fields, fieldName);
                if (!field) {
                    field = schemaToField(allSchema[fieldName], fieldName);
                    fields.push(field);
                }
                return field;
            }
            if (!this.options.fields) {
                // build field array from context.schema
                this.options.fields = _.reduce(allSchema, function(fields, obj, name) {
                    if (name !== shapeAttr && name !== this.context.shapeAttr &&
                            !obj.refType && !obj.spatialTypes && obj.dataType !== "geometry") { //&& !obj.subtype) {
                        fields.push(schemaToField(obj, name));
                    }
                    return fields;
                }, [], this);
            } else {
                // allow array of strings and/or proper field definitions
                this.options.fields = _.map(this.options.fields, function(field) {
                    if (_.isString(field)) {
                        return schemaToField(allSchema[field], field);
                    } else {
                        return field;
                    }
                });
            }
            if (this.options.nameAttr) {
                // add the primary display name field and set the alias
                displayField = addField(this.options.fields, this.options.nameAttr);
                if (displayField.alias === displayField.name) {
                    // set default alias
                    displayField.alias = this.options.nameAlias;
                } else {
                    // override default alias
                    this.options.nameAlias = displayField.alias;
                }
            }
            if (this.options.renderer) {
                // ensure all renderer fields are included in the field list
                _.each(['fieldName', 'fieldName2', 'fieldName3'], function(attr) {
                    var fieldName = this.options.renderer[attr];
                    if (fieldName) {
                        addField(this.options.fields, fieldName);
                    }
                }, this);
            }
            /**
             * Layer definitions. 
             * @type {Object.<string, module:nrm-map/views/featureLayerView~LayerInfo>}
             */
            this.layers = {};
            /**
             * Map of model ids to feature info for internal use only. 
             * @type {Object.<string, module:nrm-map/views/featureLayerView~FeatureIdMap>}
             */
            this.idMap = {}; // to retrieve ObjectID and geometryType by model ID.
            //dojo.require("esri.layers.FeatureLayer"); 
            // get FLM field names
            var fieldNames = this.collection.models && this.collection.models.length ? 
                    this.collection.models[0] : 
                    (this.options.fields && _.pluck(this.options.fields, "name")) || (this.options.context && this.options.context.schema);
            this.flmDataSourceFieldName = FLM.getDataSourceAttName(fieldNames) || this.flmDataSourceFieldName;
            this.flmRevDateFieldName = FLM.getRevDateAttName(fieldNames) || this.flmRevDateFieldName;
            this.flmAccuracyFieldName = FLM.getAccuracyAttName(fieldNames) || this.flmAccuracyFieldName;
            var fields = [{
                    "name": "ObjectID",
                    "alias": "ObjectID",
                    "type": "esriFieldTypeOID"
                }, {
                    "name": "id",
                    "type": "esriFieldTypeString",
                    "alias": "ID"
                }, /*{ 
                 // refactored adding the name field in case it is included in this.options.fields
                 "name": this.options.nameAttr,
                 "type": "esriFieldTypeString",
                 "alias": this.options.nameAlias
                 }, */ {
                    "name": this.flmDataSourceFieldName,
                    "type": "esriFieldTypeString",
                    "alias": "FLM Data Source"
                }, {
                    "name": this.flmRevDateFieldName,
                    "type": "esriFieldTypeDate",
                    "alias": "FLM Rev Date"
                }];

            // adding renderer field refactored in case it is included in this.options.fields
            //        // begin artf11295 
            //        var r = this.options.context.renderer;
            //        if (r && r.fieldName) {
            //            fields.push({
            //                "name": r.fieldName,
            //                "type": "esriFieldTypeString"
            //                //,"alias": r.fieldNameAlias ? r.fieldNameAlias : r.fieldName
            //            });
            //        }
            //        // end artf11295 
            if (this.options.flmAccuracy) {
                fields.push({
                    "name": this.flmAccuracyFieldName,
                    "type": "esriFieldTypeDouble",
                    "alias": "FLM Accuracy"
                });
            }

            if (this.options.fields) {
                _.each(this.options.fields, function(value) {
                    if (!findField(fields, value.name)) {
                        fields.push(value);
                    }
                });
            }


            // The layerDef object should conform to the ArcGIS Server REST API specification.
            // Add any properties to this object if they are shared by ALL layers managed by this view.
            // Omit properties that are specific to a geometry type and make sure they are set in addFeatures
            /**
             * Common layer definition for all layers.
             * @type {Object} 
             * @see {@link http://resources.arcgis.com/en/help/rest/apiref/layer.html|ArcGIS REST API Layer definition}
             */
            this.layerDef = {
                //"displayFieldName": this.options.nameAttr,
                "displayField": this.options.nameAttr,
                "spatialReference": {"wkid": this.options.wkid},
                "fields": fields
            };

        },
        /**
         * Standard field name for the FLM Data Source field
         * @default
         * @type {string}
         */
        flmDataSourceFieldName: "DATA_SOURCE",
        /**
         * Standard field name for the FLM Rev Date field
         * @default
         * @type {string}
         */
        flmRevDateFieldName: "REV_DATE",
        /**
         * Standard field name for the FLM Accuracy field
         * @default
         * @type {string}
         */
        flmAccuracyFieldName: "ACCURACY",
        /**
         * Default configuration
         * @type {module:nrm-map/views/featureLayerView~LayerConfig}
         */
        defaults: {
            "shapeAttr": "shape",
            "nameAttr": "name",
            "nameAlias": "Name",
            "searchKey": "/search",
            "maxResults": 1000,
            "postSearch": true,
            "wkid": 4326,
            "symbol": "normal",
            "zoomToSelection": false,
            "ensureSelectionVisible": false,
            "zoomOnReset": false,
            "ensureVisibleOnReset": true,
            "minScale": 0, //5000000, // for easy zoom testing
            "maxScale": 0, //24000, // for easy zoom testing
            "selectable": true,
            "visible": true,
            "maxZoomToScale": 1000,
            "minZoomToScale": 5000000,
            "tolerance": 2,
            "flmDataSource": "flmDataSource",
            "flmRevDate": "flmRevDate",
            "flmAccuracy": "flmAccuracy",
            "opacity": 1,
            "tooltip": false
        },
        /**
         * Render the view by loading the feature layers from the collection and adds the layer to the map.
         * @returns {undefined}
         */
        render: function() {
            var self = this;
            if (this.mapControl && !this.loading) {
                /**
                 * Indicates that the view is loading
                 * @type {?Boolean}
                 */
                this.loading = true;
                //dojo.addOnLoad(function() {
                require(["dojo/domReady!"], function() {
                    if (self.removed)
                        return;
                    self.loading = false;
                    self.startListening();
                    if (!self.mapClickHandler) {
                        /**
                         * Reference to the map click event handler so that it can be removed correctly.
                         * @name module:nrm-map/views/featureLayerView#mapClickHandler
                         * @type {Object}
                         */
                        self.mapClickHandler = connect.connect(self.mapControl.map, "onClick", function(event) {
                            self.onMapClick(event);
                        });
                    }
                    if (self.collection) {
                        self.onReset(self.collection);
                    }
                });
            }
        },
        /**
         * Converts the set of layers to a plain object that is safe to stringify. 
         * @returns {Object}
         * JSON representation of the set of layers, top-level keys are the geometry types
         */
        layerToJSON: function() {
            var json = {};
            _.each(this.layers, function(layerData, key) {
                if (layerData.layer) {
                    json[key] = layerData.layer.toJson();
                }
            });
            return json;
        },
        // <editor-fold desc="tooltip">
        /**
         * Handles mouse-over event on a layer to show tooltip.
         * @todo Refactor this method so that this is actually this, I recommend using _.bind function when the event
         * listener is added.
         * @param {MouseEvent} mouseEvent
         * @returns {undefined}
         * @this external:module:esri/layers/FeatureLayer
         */
        onMouseOver: function(mouseEvent) {
            /**
             * Clear layer tooltips
             * @event module:nrm-ui/event#map:clearTooltips
             */
            Nrm.event.trigger('map:clearTooltips');
            var that = this.nrmOptions.view;
            this.previousCursor = this._map.cursor;
            if (that.options.selectable) {
                Nrm.app.mapView.setCursor("pointer");
            }
            if (that.showTooltips && !Nrm.app.mapView.isToolActivated) {
                var att, attName, attVal, attLabel, field,
                        content = (that.options.tooltip.header || "<b><u>" + (this.nrmOptions.caption || this.id) + "</u></b>") + "<br>",
                        skipAtts = ['objectid', 'ObjectID', 'selectable', 'id'],
                        inGraphic = mouseEvent.graphic,
                        //symbol = _.omit(inGraphic.symbol,'inLieuOfClone').setColor('red'),
                        symbol = that.getSymbol(inGraphic.geometry.type, 'singular'),
                        graphic = inGraphic, //graphic = new Graphic(inGraphic.geometry, symbol),
                        model = that.collection.get(inGraphic.attributes.id),
                        attNames = _.isArray(that.options.tooltip.attributes) ? that.options.tooltip.attributes : _.omit(_.keys(model.attributes), skipAtts),
                        atts = _.extend(inGraphic.attributes, model.attributes);
                //if (symbol.outline) 
                //    symbol.outline.setColor('red');
                graphic.dialog = that.dialog;
                /**
                 * Current tooltip graphic
                 * @name module:nrm-map/views/featureLayerView#tooltipGraphic
                 * @type {?external:module:esri/Graphic}
                 */
                that.tooltipGraphic = graphic;
                graphic.setSymbol(symbol);
                //that.mapControl.map.graphics.add(graphic);
                for (var i = 0; i < attNames.length; i++) {
                    attName = attNames[i];
                    if (_.isString(attName)) {
                        field = _.findWhere(that.layerDef.fields, {name: attName});
                        attLabel = field ? field.alias || field.name : attName.replace('TOCentry', 'Name');
                    } else {
                        attLabel = attName.alias || attName.name;
                        attName = attName.name;
                    }
                    attVal = atts[attName] === undefined ? "" : atts[attName];
                    content += '<b>' + attLabel + ':</b> ' + attVal + '<br>';
                }
                that.dialog.setContent(content);
                //domStyle.set(that.dialog.domNode, "opacity", 0.9);
                var dijitDialog = that.dialog;
                dijitPopup.open({
                    popup: that.dialog,
                    x: mouseEvent.pageX,
                    y: mouseEvent.pageY
                });
                $('#' + that.dialog.id).mouseleave(function() {
                    that.dialog.keepOpen = false;
                    that.onMouseOut();
                    dijitPopup.close(dijitDialog); // just in case the view has been removed
                });
                $('#' + that.dialog.id).mouseenter(function() {
                    that.dialog.keepOpen = true;
                });
                // onMouseOut is now set for all layers
                //if (graphic.geometry.type === "polygon") {
                //  this.nrmOptions.mouseOutHandler = this.on('mouse-out', that.onMouseOut);
                //}
            }
        },
        /**
         * Handles the mouse-out event on the layer
         * @param {MouseEvent} [mouseEvent]
         * @returns {undefined}
         * @this external:module:esri/layers/FeatureLayer
         */
        onMouseOut: function(mouseEvent) {
            Nrm.event.trigger("map:setCursor", this.previousCursor);
            this.previousCursor = null;
            if (!Nrm.app.mapView.isToolActivated) {
                setTimeout(function() {
                    Nrm.event.trigger('map:clearTooltips');
                }, 50);
            }
        },
        /**
         * Clear tooltips.
         * @returns {undefined}
         */
        clearTooltips: function() {
            var graphic = this.tooltipGraphic;
            if (graphic) {
                try {
                    if (this.dialog && !this.dialog.keepOpen) {
                        this.dialog.keepOpen = false;
                        dijitPopup.close(this.dialog);
                        var layer = this.layers["esriGeometry" + graphic.geometry.type[0].toUpperCase() + graphic.geometry.type.substr(1)].layer;
                        graphic.setSymbol(layer.renderer.getSymbol(graphic));
                        this.tooltipGraphic = undefined;
                        if (graphic.geometry.type === "polygon" && layer.nrmOptions && layer.nrmOptions.mouseOutHandler) {
                            layer.nrmOptions.mouseOutHandler.remove();
                            layer.nrmOptions.mouseOutHandler = undefined;
                        }
                    }
                } catch (e) {
                    console.warn('featureLayerView.clearTooltips error ', e);
                }
            }
        },
        // </editor-fold>

        /**
         * Supports the {@link module:nrm-map/views/mapIdentifyView|MapIdentifyView}.
         * @todo Document the identify results somewhere
         * @param {external:module:esri/geometry/Extent} extent
         * @param {external:module:esri/layers/FeatureLayer} layer
         * @return {external:module:jquery~Promise}
         * Returned promise is resolved when the identify results are returned, with array of results passed as only
         * parameter to done callbacks.
         */
        _identify: function(extent, layer) {
            var dfd = $.Deferred(),
                    selectCallback = _.bind(function(features, selectionMethod) {
                var results = [], result, graphic,
                        skipAtts = ['objectid', 'ObjectID', 'selectable', 'id'],
                        model,
                        collection = this.options.collection,
                        nameAttr = layer.displayField || this.options.nameAttr || layer.objectIdField,
                        atts, f, attName, field;
                for (f in features) {
                    graphic = features[f];
                    model = collection.get(graphic.attributes.id);
                    //atts = _.extend(graphic.attributes, _.omit(model.attributes, skipAtts));
                    atts = {};
                    _.each(_.omit(graphic.attributes, skipAtts), function(val, name) {
                        field = _.findWhere(layer.fields, {name: name});
                        if (field) {
                            attName = field.alias || name;
                            if (name === nameAttr) {
                                nameAttr = attName;
                            }
                            switch (field.type) {
                                case "esriFieldTypeDate":
                                    val = Nrm.app.formatValue(val, "date");
                                    break;
                                case "esriFieldTypeGeometry":
                                case "esriFieldTypeBlob":
                                case "esriFieldTypeRaster":
                                case "esriFieldTypeXML":
                                    val = "[" + field.type.replace("esriFieldType", "") + "]";
                                    break;
                                    //                                case "esriFieldTypeSmallInteger":
                                    //                                case "esriFieldTypeInteger":
                                    //                                case "esriFieldTypeSingle":
                                    //                                case "esriFieldTypeDouble":
                                    //                                case "esriFieldTypeString":
                                    //                                case "esriFieldTypeOID":
                                    //                                case "esriFieldTypeGUID":
                                    //                                case "esriFieldTypeGlobalID":
                            }
                            atts[attName] = val;
                        }
                    });
                    result = {
                        layerName: layer.id,
                        value: atts[nameAttr],
                        modelId: model.id,
                        geometryType: graphic.geometry.type,
                        feature: {
                            geometry: graphic.geometry,
                            attributes: atts
                        }
                    };
                    results.push(result);
                }

                //layer.clearSelection();
                dfd.resolve(results);
            }, this),
                    errCallback = function(err) {
                dfd.reject(err);
            },
                    selectQuery = new Query();
            layer.clearSelection();
            selectQuery.geometry = extent;
            selectQuery.returnGeometry = true;
            selectQuery.outFields = ["*"];
            layer.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW,
                    selectCallback, errCallback);

            return dfd;
        },
        /**
         * Get context menu items for a node in the {@link module:nrm-map/views/mapIdentifyView|MapIdentifyView} tree.
         * @todo Document the custom values mentioned in the parameter description.
         * @param {Object} node - JSON of jstree node extended with custom values in mapIdentifyView
         * @return {Array}
         */
        getContextItems: function(node) {
            //console.log("featureLayer.getContextItems(node)", node, this.model, this.collection);
            if (this.options.path === undefined) {
                return this.options.contextItems;
            }
            var items = [];
            if (node.type === "default" || node.type === "folder") {
                if (!this.menuItems) {
                    this.menuItems = BaseView.getContextItems.call(this, null, {
                        context: this.context,
                        nodetype: "folder",
                        id: this.context.apiKey,
                        model: this.model, // parent model of the collection
                        path: this.options.path,
                        items: this.options.contextItems, // allows custom items passed into view constructor options
                        prefix: "collectionlayer-" // prefix for menu item element id, to ensure uniqueness
                    });
                }
                items = this.menuItems;
            } else {
                var modelId = node.modelId;
                items = BaseView.getContextItems.call(this, node, {
                    context: this.context,
                    nodetype: node.type,
                    id: modelId,
                    model: this.collection.get(modelId),
                    path: this.options.path + "/" + modelId,
                    items: this.options.contextItems, // allows custom items passed into view constructor options
                    prefix: "collectionlayer-context"
                });
            }
            return items;
        },
        /**
         * Handles click event on map
         * @param {MouseEvent} mouseEvent
         * @returns {undefined}
         * */
        onMapClick: function(mouseEvent) {
            if (!this.options.selectable)
                return;
            this.selectingFeatures = true;
            var self = this;

            // We're listening to this event to make it easier to click on a single feature.
            // This means we stop after finding the first one, to be consistent with the layer onClick behavior.
            // Selection priority gives precedence to polylines which are hardest to click on directly

            //console.log('about to selectFeatures');
            var layerData, selectQuery, i = 0;
            fnSelect();

            // odd-looking recursion here is designed to enforce a specific selection order...
            function selectCallback(features, selectionMethod) {
                //console.info('selectFeatures returned with ' + features.length + ' features from ' + layerData.layer.id);
                self.trigger("featuresSelected", {features: features, selectionMethod: selectionMethod});
                if (features.length > 0) {
                    i = selectPriority.length;
                    var feat = features[0];
                    self.selectFeature(layerData.layer, feat);
                    //self.mapControl.selectGraphic(new esri.Graphic({ geometry: feat.geometry, attributes: feat.attributes }));
                } else {
                    fnSelect();
                }
            }
            ;
            function errCallback(error) {
                console.warn('featureLayerView.selectFeatures error: ' + error);
                fnSelect();
            }
            function fnSelect() {
                while (i < selectPriority.length) {
                    layerData = self.layers[selectPriority[i]];
                    i++;
                    if (layerData && layerData.layer && layerData.layer.visible &&
                            layerData.layer.visibleAtMapScale &&
                            (layerData.layer.nrmOptions && layerData.layer.nrmOptions.selectable !== false)) {
                        if (!selectQuery) {
                            selectQuery = new Query();
                            selectQuery.geometry = self.pointToExtent(mouseEvent.mapPoint);
                            selectQuery.returnGeometry = true;
                            selectQuery.outFields = ["*"];
                        }
                        var test = layerData.layer.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW,
                                selectCallback, errCallback);
                        break;
                    }
                }
            }
            ;
        },
        /**
         * Converts a point geometry to an extent.
         * @param {external:module:esri/geometry/Point} mapPoint
         * @returns {external:module:esri/geometry/Extent}
         */
        pointToExtent: function(mapPoint) {
            var screenPoint = this.mapControl.map.toScreen(mapPoint);
            // ScreenPoint is relative to top-left
            var bottomLeft = new ScreenPoint();
            bottomLeft.setX(screenPoint.x - this.options.tolerance);
            bottomLeft.setY(screenPoint.y + this.options.tolerance);
            var topRight = new ScreenPoint();
            topRight.setX(screenPoint.x + this.options.tolerance);
            topRight.setY(screenPoint.y - this.options.tolerance);
            bottomLeft = this.mapControl.map.toMap(bottomLeft);
            topRight = this.mapControl.map.toMap(topRight);
            return new Extent(bottomLeft.x, bottomLeft.y,
                    topRight.x, topRight.y, this.mapControl.map.spatialReference);
        },
        /**
         * Start listening to global events.
         * @returns {undefined}
         */
        startListening: function() {
            this.stopListening();
            this.listenTo(this.collection, "add", this.onAdd);
            this.listenTo(this.collection, "remove", this.onDelete);
            this.listenTo(this.collection, "change", this.onUpdate);
            this.listenTo(this.collection, "reset", this.onReset);
            this.listenTo(this.collection, "updateSelection", this.onSelectionUpdate);
            this.listenTo(Nrm.event, "map:clearTooltips", this.clearTooltips);
        },
        /**
         * Overrides {@link http://backbonejs.org/#View-remove|Backbone.View#remove} to disconnect Dojo/ArcGIS event 
         * handlers and clear internal state.
         * @todo There may be some event handlers and Dijit resources added in the tooltip functionality that are not
         * properly removed.
         * @function 
         * @returns {undefined}
         */
        remove: _.wrap(Backbone.View.prototype.remove, function(fn) {
            this.removed = true;
            fn.call(this);
            var self = this;
            if (this.mapClickHandler) {
                connect.disconnect(this.mapClickHandler);
            }
            _.each(this.layers, function(layerData) {
                try {
                    if (layerData.eventHandlers) {
                        _.each(layerData.eventHandlers, function(eh) {
                            connect.disconnect(eh);
                        });
                    }
                    if (self.mapControl && layerData.layer) {
                        self.mapControl.map.removeLayer(layerData.layer);
                        layerData.layer = null;
                    }
                } catch (error) {
                    console.warn("featureLayerView.remove error", error);
                }
            });
            this.layers = {};
            this.idMap = {};
        }),
        /**
         * Adds a model to the layer.
         * @param {external:module:backbone.Model} model The model to add
         * @param {external:module:backbone.Collection} collection The collection
         * @param {Object} options Options passed from the event
         * @param {module:nrm-map/views/featureLayerView~FeatureInfo} [options.result] The model converted to a feature. 
         * @returns {undefined}
         */
        onAdd: function(model, collection, options) {
            var result = (options && options.result) || this.modelToFeature(model, 1);
            if (result) {
                this.addFeatures(result.layerData, [result.feature]);
                this.cleanupMapLayers();
            }
        },
        /**
         * Deletes a model from the layer.
         * @param {external:module:backbone.Model} model The model to delete
         * @param {external:module:backbone.Collection} collection The collection
         * @param {Object} options Options passed from the event
         * @param {boolean} [options.deleteLayer=false] - Force delete of the layer
         * @param {module:nrm-map/views/featureLayerView~FeatureIdMap} [options.featureInfo] The feature info
         * @returns {undefined}
         */
        onDelete: function(model, collection, options) {
            var finfo = (options && options.featureInfo) || this.idMap[model.id];
            if (finfo && this.layers[finfo.geometryType]) {
                var lyrData = this.layers[finfo.geometryType];
                if (lyrData.layer) {
                    if (options.deleteLayer) {
                        if (lyrData.eventHandlers) {
                            _.each(lyrData.eventHandlers, function(eh) {
                                connect.disconnect(eh);
                            });
                            lyrData.eventHandlers = [];
                        }
                        this.mapControl.map.removeLayer(lyrData.layer);
                        delete lyrData.layer;
                    } else {
                        var graphic = new Graphic({attributes: {"ObjectID": finfo.objectId}});

                        if (!lyrData.layer.isEditable()) {
                            lyrData.layer.setEditable(true);
                        }
                        lyrData.layer.applyEdits(null, null, [graphic], _.bind(function(adds, updates, deletes) {
                            var test = deletes;
                            this.cleanupMapLayers();
                        }, this));
                    }
                }
            }
        },
        /**
         * Update a model in the layer.
         * @param {external:module:backbone.Model} model The model to update
         * @param {external:module:backbone.Collection} collection The collection
         * @param {Object} options Options passed from the event
         * @returns {undefined}
         */
        onUpdate: function(model, collection, options) {
            var finfo = this.idMap[model.id];
            if (this.captionAttributes && this.captionAttributes.length && 
                    !_.isEmpty(_.pick(model.changedAttributes(), this.captionAttributes))) {
                this.onDelete(model, collection, {deleteLayer: true});
                this.onAdd(model, collection, options);
                return;
            }
            if (finfo && this.layers[finfo.geometryType]) {
                var result = this.modelToFeature(model, finfo.objectId);
                var geomType = result && result.layerData.layerDef.geometryType;
                if (geomType !== finfo.geometryType) {
                    options = $.extend({}, options, {featureInfo: finfo});
                    this.onDelete(model, collection, options);
                    if (result) {
                        options.result = result;
                        this.onAdd(model, collection, options);
                    }
                    return;
                }
                if (result && result.layerData.layer) {
                    result.feature.attributes["ObjectID"] = finfo.objectId;
                    var graphic = new Graphic(result.feature);

                    if (!result.layerData.layer.isEditable()) {
                        result.layerData.layer.setEditable(true);
                    }
                    var that = this, thatLayer = result.layerData.layer;
                    result.layerData.layer.applyEdits(null, [graphic], null, function(adds, updates, deletes) {
                        var rendererFields = that.options.renderer && _.values(_.pick(that.options.renderer, 'fieldName', 'fieldName2', 'fieldName3'));
                       /* todo: changes might not be detected if renderer uses a derived value which is actually a function and not a real model attribute.
                        * in this case, it may be that the only practical resolution is to allow the model to override the changedAttributes method which is a 
                        * good reason to use model.changedAttributes() instead of model.changed. 
                        */
                       if (rendererFields &&  rendererFields.length && !_.isEmpty(_.pick(model.changedAttributes(), rendererFields))) {
                            var i, j, objectId, graphic, doRedraw = false, oidFieldName = thatLayer.objectIdField;
                            for (i = 0; i < updates.length; i++) {
                                if (updates[i].success) {
                                    objectId = updates[i].objectId;
                                    for (j = 0; j < thatLayer.graphics.length; j++) {
                                        graphic = thatLayer.graphics[j]; 
                                        if (graphic.attributes[oidFieldName] === objectId) { 
                                               _.each(rendererFields, function(fieldName) {
                                                        var modelVal = that.getModelVal(model, fieldName);
                                                        if (graphic.attributes[fieldName] !== modelVal) {
                                                                 graphic.attributes[fieldName] = modelVal;
                                                                 doRedraw = true;
                                                        }
                                              });
                                        }
                                    }
                                }
                            }
                            if (doRedraw)
                                thatLayer.redraw();
                        }
                    }, function(err) {
                        console.error("featureLayerView.onUpdate error", err);
                    });
                }
            } else {
                this.onAdd(model, collection, options);
            }
            // wrong place for cleanupMapLayers (moved to onDelete)
            //this.cleanupMapLayers();
        },
        /**
         * Remove empty map layers, perhaps temporarily
         * @returns {undefined}
         */
        cleanupMapLayers: function() {
            var map = this.mapControl.map, added = false;
            _.each(this.layers, function(layerData, key) {
                var layer = layerData.layer;
                if (layer) {
                    //console.log('cleanupMapLayers ' + layer.graphics.length.toString() + ' features for layer ' + layer.geometryType + layer.id);
                    if (layer.graphics.length === 0) {
                        map.removeLayer(layer);
                    } else if (!map.getLayer(layer.id)) {
                        map.addLayer(layer, 0);
                        added = true;
                    }
                }
            });
            if (added) {
                // TODO: maybe it would be better to determine the position relative to other existing layers in same view?
                // _reorderLayers will move all layers associated with this view
                this._reorderLayers();
            }
        },
        /**
         * Handles the updateSelection event triggered on a collection
         * @param {external:module} collection
         * @param {Object} options
         * @param {Boolean} [options.fromMap=false] Indicates that map interaction is the source of the event.
         * @param {Boolean} [options.ensureVisible] Overrides default behavior set by the ensureSelectionVisible 
         * initialization option.
         * @param {Boolean} [options.zoomToSelection] Overrides default behavior set by the zoomToSelection
         * initialization option.
         * @returns {undefined}
         */
        onSelectionUpdate: function(collection, options) {
            if (options && options.fromMap)
                return;
            if (this.updatingSelection)
                return;
            /**
             * For internal use, selection update is in progress.
             * @type {Boolean}
             */
            this.updatingSelection = true;
            var self = this;
            window.setTimeout(function() {
                self._updateSelection(collection, $.extend({}, {
                    ensureVisible: self.options.ensureSelectionVisible,
                    zoomToSelection: self.options.zoomToSelection
                }, options));
                self.updatingSelection = false;
            }, 100);

        },
        /**
         * For internal use only, synchronizes the selection graphics with the selected status of models in the 
         * collection.
         * @param {external:module:backbone.Collection} collection The collection to synchronize with.
         * @param {Object} options
         * @param {Boolean} [options.fromMap=false] Indicates that map interaction is the source of the event.
         * @param {Boolean} [options.ensureVisible=false] Ensure the selection is visible by setting the layer visible,
         *  panning the map to show the selected features or zooming if the map is outside of the visible scale range.
         * @param {Boolean} [options.zoomToSelection=false] Zoom to the selected features.
         * @param {Boolean} [options.extentOnly=false] Do not synchronize to the collection, just update the extent as
         * dictated by the other options.
         * @returns {undefined}
         */
        _updateSelection: function(collection, options) {
            if (!options || !options.extentOnly) {
                this.mapControl.clearGraphicSelection();
            }
            var selected = {};
            var self = this;

            collection.each(function(model) {
                if (self.getModelVal(model, "selected")) {
                    var finfo = self.idMap[model.id];
                    if (finfo) {
                        var idList = selected[finfo.geometryType];
                        if (!idList) {
                            selected[finfo.geometryType] = [finfo.objectId];
                        } else {
                            idList.push(finfo.objectId);
                        }
                    }
                }
            });
            var allKeys = _.keys(selected);
            var allFeatures = [], i = 0, layerData, firstLayer;
            doQuery();

            function afterSelect() {
                if ((options.zoomToSelection || options.ensureVisible) && allFeatures.length > 0) {
                    self._zoomTo({
                        graphics: allFeatures,
                        suppressZoom: !options.ensureVisible,
                        zoomToFeature: options.zoomToSelection
                    });
                    if (!options.extentOnly && options.ensureVisible)
                        self.setVisibility(true);
                }
            }
            function queryCallback(featureSet) {
                _.each(featureSet.features, function(feat) {
                    allFeatures.push(feat);
                    if (!options || !options.extentOnly) {
                        var graphic = new Graphic(feat.toJson());
                        self.mapControl.selectGraphic(graphic, {
                            highlighted: false,
                            selected: true
                        });
                    }
                });
                if (i === allKeys.length) {
                    afterSelect();
                } else {
                    doQuery();
                }
            }
            function errCallback(error) {
                console.warn("featureLayerView._updateSelection error", error);
                if (i === allKeys.length) {
                    afterSelect();
                } else {
                    doQuery();
                }
            }
            function doQuery() {
                while (i < allKeys.length) {
                    var geomType = allKeys[i];
                    var idList = selected[geomType];
                    layerData = self.layers[geomType];
                    i++;
                    if (layerData && layerData.layer) {
                        if (!firstLayer)
                            firstLayer = layerData.layer;
                        var oidQuery = new Query();
                        oidQuery.objectIds = idList;
                        layerData.layer.queryFeatures(oidQuery, queryCallback, errCallback);
                        break;
                    }
                }
                // wrong place for cleanupMapLayers (moved to onReset)
                //self.cleanupMapLayers();
            }
        },
        /**
         * Reloads the layers from the collection
         * @param {external:module:backbone.Collection} collection The collection to load.
         * @param {Object} [options] Options passed from the event.
         * @returns {undefined}
         */
        onReset: function(collection, options) {
            if (!this.mapControl)
                return;
            //        if (collection === undefined)
            //            collection = this.collection ? this.collection : this.context.collection;
            if (collection !== this.collection) {
                this.collection = collection;
                this.render();
                return;
            }
            var self = this;
            _.each(this.layers, function(layerData, key) {
                if (layerData.layer)
                    //map.removeLayer(layerData.layer);    
                    layerData.layer.clear();
                layerData.features = [];
            });
            this.idMap = {};
            //this.mapControl.clearGraphicSelection();
            var i = 1;
            collection.each(function(model) {
                var result = self.modelToFeature(model, i);
                if (result) {
                    result.layerData.features.push(result.feature);
                    i++;
                }
            });
            _.each(this.layers, function(layerData) {
                self.addFeatures(layerData, layerData.features);
            });
            this._reorderLayers();
            var setExtent = this.options.zoomOnReset || this.options.ensureVisibleOnReset;
            this.cleanupMapLayers();
            this._updateSelection(collection, {
                ensureVisible: !setExtent && this.options.ensureSelectionVisible,
                zoomToSelection: !setExtent && this.options.zoomToSelection
            });
            if (setExtent) {
                this._zoomToAll({
                    suppressZoom: !this.options.ensureVisibleOnReset,
                    zoomToFeature: this.options.zoomOnReset
                });
                if (this.options.ensureVisibleOnReset)
                    this.setVisibility(true);
            }
        },
        _reorderLayers: function() {
            //console.log("featureLayerView._reorderLayers");
            var map = this.mapControl.map;
            _.each(geomTypes, function(gt) {
                // move layers to the top, but always under nrmGraphicsLayer
                var layerData = this.layers[gt], pos;
                if (layerData && layerData.layer && map.getLayer(layerData.layer.id)) {
                    pos = _.indexOf(map.graphicsLayerIds.slice(0).reverse(), 'nrmGraphicsLayer') + 1;
                    //console.log("  " + layerData.layer.id + " moving from " + _.indexOf(map.graphicsLayerIds.slice(0).reverse(), layerData.layer.id) + " to " + (map.graphicsLayerIds.length - pos - 1));
                    map.reorderLayer(layerData.layer, map.graphicsLayerIds.length - pos - 1);
                }
            }, this);
        },
        /**
         * For internal use, zoom to all features in the layers 
         * @param {Object} options Zoom options
         * @returns {undefined}
         */
        _zoomToAll: function(options) {
            options = options || {};
            var extent, firstLayer;
            _.each(this.layers, function(layerData) {
                var layerExt = layerData.layer && layerData.layer.graphics.length > 0 && graphicsUtils.graphicsExtent(layerData.layer.graphics);
                if (!layerExt && layerData.layer && layerData.layer.graphics.length === 1) {
                    // single point geometry has no extent
                    var pt = layerData.layer.graphics[0].geometry;
                    if (!Nrm.Views.FeatureLayerView.shapeIsEmpty(pt) && pt.type === "point") {
                        layerExt = this.pointToExtent(pt);
                    }
                }
                
                if (!(layerExt && $.isNumeric(layerExt.xmin))) {
                    return;
                }
                if (layerExt && layerExt.spatialReference && [4326, 4269].indexOf(layerExt.spatialReference.wkid) !== -1 ) {
                    layerExt = prjUtils.geographicToWebMercator(layerExt);
                }
                if (extent && layerExt) {
                    extent = extent.union(layerExt);
                }
                else if (layerData.layer) {
                    extent = layerExt;
                    firstLayer = layerData.layer;
                }
            }, this);
            var zoomOpt = $.extend({}, options, {extent: extent, layer: firstLayer});
            if (extent && $.isNumeric(extent.xmin))
                this._zoomTo(zoomOpt);
        },
        /**
         * For internal use, zoom to selection
         * @returns {undefined}
         */
        _zoomToSelection: function() {
            this._updateSelection(this.collection, {extentOnly: true, zoomToSelection: true});
        },
        /**
         * Select features by a search window geometry of any type.
         * @param {external:module:esri/geometry/Geometry} geometry The search window geometry
         * @param {Object} [options]
         * @param {module:nrm-ui/models/application~ContextConfig} [options.context] Only required if different than
         * the context of this view.
         * @param {string} [options.path] The navigation path
         * @param {external:module:backbone.Model} [options.model] The parent model.
         * @param {string} [options.modelId] The id of the parent model.
         * @returns {undefined}
         */
        selectByExtent: function(geometry, options) {
            options = options || {context: this.context, path: this.context.apiKey};
            var searchModel = Nrm.app.setInheritedAttributes(options.context, new Backbone.Model(), options.model, false);
            searchModel.set(this.options.shapeAttr, geometry);
            var limits = {
                firstResult: 0,
                limit: true
            };
            if (this.options.maxResults)
                limits.maxResults = this.options.maxResults;
            var search = Nrm.app.getSearchData(this.context, searchModel, limits);
            var searchOpt = {
                context: options.context,
                path: options.path,
                search: search,
                callback: this.executeSearch,
                source: this
            };
            if (options.model) {
                searchOpt.model = options.model;
                searchOpt.modelId = options.modelId;
            }
            searchOpt.selectionMethod = this.mapControl.selectionMethod;
            Nrm.app.doSearch(searchOpt, function() {
                Nrm.router.navigate("results/" + searchOpt.path, {trigger: true, replace: false});
            }, this.searchFailed);
        },
        /**
         * Compute the search URL.
         * @returns {string}
         */
        getSearchUrl: function() {
            return this.context ? Nrm.app.formatSearchUrl(this.context, this.collection.url, this.options.searchKey) :
                    this.collection.url + this.options.searchKey;
        },
        /**
         * Execute the search.
         * @param {Object} evtData
         * @param {Object} evtData.search The search paramaters.
         * @param {Object} evtData.collectionType The collection constructor.
         * @param {Function} successCallback Called when the search request is successful
         * @param {Function} errorCallback Called when the search request fails.
         * @returns {external:module:jquery~jqXHR} The XHR object.
         */
        executeSearch: function(evtData, successCallback, errorCallback) {
            var modelType = this.collection.searchModel || Backbone.Model;
            var model = new modelType(evtData.search);
            if (this.context.postSearch) {
                model.urlRoot = this.getSearchUrl();
                return model.save(null, {
                    success: function(model, response, options) {
                        var models = _.map(model.changed, function(value) {
                            return value;
                        });
                        var results = new evtData.collectionType(models);
                        successCallback(results, response, options);
                    },
                    error: errorCallback
                });
            } else {
                // use GET request with query params UNTESTED in this use case...
                var results = new evtData.collectionType();
                return results.fetch({
                    data: model.toJSON(),
                    success: successCallback,
                    error: errorCallback
                });
            }
        },
        /**
         * Called when a search fails.
         * @param {external:module:backbone.Model} model The search model.
         * @param {external:module:jquery~jqXHR} xhr The response
         * @param {Object} options Sync options
         * @returns {undefined}
         */
        searchFailed: function(model, xhr, options) {
            Nrm.event.trigger("app:modal", {
                "error": Nrm.app.normalizeErrorInfo("Query failed.", model, xhr, options)
            });
        },
        /**
         * Enable or disable selection triggered by user interaction in the map.
         * @param {Boolean} enableSelect Indicates whether selection should be enabled.
         * @returns {undefined}
         */
        setSelectable: function(enableSelect) {
            // only applies to selecting in the map, synchronization from table select might still occur
            this.options.selectable = enableSelect;
        },
        /**
         * Show or hide the layers.
         * @param {Boolean} visible Indicates whether layers should be visible.
         * @returns {undefined}
         */
        setVisibility: function(visible) {

            var opt = visible ? true : false;
            _.each(this.layers, function(layerData) {
                if (layerData.layer) {
                    layerData.layer.setVisibility(opt);
                }
            });
            this.options.visible = opt;
        },
        /**
         * Zoom to features in the layer.
         * @param {Object} options
         * @param {Boolean} options.selection Indicates whether we should zoom to selection or all features.
         * @returns {undefined}
         */
        zoomTo: function(options) {
            if (options.selection) {
                this._zoomToSelection();
            } else {
                this._zoomToAll({zoomToFeature: true});
            }
        },
        /**
         * Symbol configuration for points, lines and polygons.
         * @typedef SymbolConfig
         * @property {MarkerSymbol} marker Marker symbol for points
         * @property {LineSymbol} line Line symbol for polylines
         * @property {FillSymbol} fill Fill symbol for polygons
         */
        /**
         * Marker symbol configuration
         * @typedef MarkerSymbol
         * @property {string} style Marker style
         * @property {Number} size Marker size
         * @property {module:nrm-map/views/featureLayerView~LineSymbol} [line] Line symbol for the border, or if not 
         * specified. use the symbol for line geometries.
         * @property {external:module:esri/Color|Object} [color] The fill color, or if not specified, use the color of 
         * the fill symbol for polygon geometries.
         * @see {@@link https://developers.arcgis.com/javascript/3/jsapi/simplemarkersymbol-amd.html|SimpleMarkerSymbol}
         * for more details about valid values for each configuration property.
         */
        /**
         * Line symbol configuration
         * @typedef LineSymbol
         * @property {string} style Line style
         * @property {external:module:esri/Color|Object} color The line color
         * @property {Number} thickness Line thickness
         * @see {@link https://developers.arcgis.com/javascript/3/jsapi/simplelinesymbol-amd.html|SimpleLineSymbol} for 
         * more details about valid values for each configuration property.
         */
        /**
         * Fill symbol configuration
         * @typedef FillSymbol
         * @property {string} style Fill style
         * @property {external:module:esri/Color|Object} color The fill color
         * @property {module:nrm-map/views/featureLayerView~LineSymbol} [line] Line symbol for the border, or if not 
         * specified, use the symbol for line geometries.
         * @see {@link https://developers.arcgis.com/javascript/3/jsapi/simplefillsymbol-amd.html|SimpleFillSymbol} for
         * more details about valid values for each configuration property.
         */
        /**
         * Create a symbol by geometry type and name or configuration.
         * @param {string} geomType The geometry type.
         * @param {string|module:nrm-map/views/featureLayerView~SymbolConfig} symbolName Named symbol configuration
         * or the actual symbol configuration object.
         * @returns {external:module:esri/symbols/Symbol}
         * The symbol for the geometry type.
         */
        getSymbol: function(geomType, symbolName) {
            if (this.mapControl) {
                if (geomType === "esriGeometryPoint" || geomType === "point")
                    return this._getPointSymbol(symbolName);
                if (geomType === "esriGeometryPolyline" || geomType === "polyline")
                    return this._getLineSymbol(symbolName);
                if (geomType === "esriGeometryPolygon" || geomType === "polygon")
                    return this._getPolygonSymbol(symbolName);
                if (geomType === "esriGeometryMultipoint" || geomType === "multipoint")
                    return this._getPointSymbol(symbolName);
            }
        },
        /**
         * Get the named symbol if the parameter is a string
         * @param {string|module:nrm-map/views/featureLayerView~SymbolConfig} name Named symbol configuration
         * or the actual symbol configuration object.
         * @returns {module:nrm-map/views/featureLayerView~SymbolConfig}
         */
        _getSymbol: function(name) {
            var symbol;
            if (name && typeof(name) === "string")
                symbol = this.mapControl.options.symbol[name];
            else
                symbol = name;

            if (!symbol)
                symbol = this.mapControl.options.symbol["normal"];
            return symbol;
        },
        /**
         * Create a symbol for point geometries.
         * @param {string|module:nrm-map/views/featureLayerView~SymbolConfig} symbolName Named symbol configuration
         * or the actual symbol configuration object.
         * @returns {external:module:esri/symbols/SimpleMarkerSymbol}
         * The marker symbol.
         */
        _getPointSymbol: function(name) {
            var symbol = this._getSymbol(name);

            return new SimpleMarkerSymbol(
                    SimpleMarkerSymbol[symbol.marker.style],
                    symbol.marker.size,
                    this._createLineSymbol(symbol.marker.line || symbol.line),
                    new Color(symbol.marker.color || symbol.fill.color)
                    );
        },
        /**
         * Create a line symbol.
         * @param {module:nrm-map/views/featureLayerView~LineSymbol} line Symbol configuration for the line.
         * @returns {external:module:esri/symbols/SimpleLineSymbol}
         * The line symbol
         */
        _createLineSymbol: function(line) {
            if (!line)
                line = this.mapControl.options.symbol["normal"].line;
            return new SimpleLineSymbol(
                    SimpleLineSymbol[line.style],
                    new Color(line.color),
                    line.thickness
                    );
        },
        /**
         * Create a symbol for line geometries.
         * @param {string|module:nrm-map/views/featureLayerView~SymbolConfig} symbolName Named symbol configuration
         * or the actual symbol configuration object.
         * @returns {external:module:esri/symbols/SimpleLineSymbol}
         * The line symbol
         */
        _getLineSymbol: function(name) {
            var symbol = this._getSymbol(name);
            return this._createLineSymbol(symbol.line);
        },
        /**
         * Create a symbol for polygon geometries.
         * @param {string|module:nrm-map/views/featureLayerView~SymbolConfig} symbolName Named symbol configuration
         * or the actual symbol configuration object.
         * @returns {external:module:esri/symbols/SimpleFillSymbol}
         * The fill symbol
         */
        _getPolygonSymbol: function(name) {
            var symbol = this._getSymbol(name);
            return new SimpleFillSymbol(
                    SimpleFillSymbol[symbol.fill.style],
                    this._createLineSymbol(symbol.fill.line || symbol.line),
                    new Color(symbol.fill.color)
                    );
        },
        /**
         * Layer info
         * @typedef LayerInfo
         * @property {Object} layerDef Layer definition from ArcGIS REST API
         * @property {module:nrm-map/views/featureLayerView~Feature[]} features Initial features
         * @property {external:module:esri/symbols/Symbol} symbol Layer symbol
         * @property {external:module:esri/symbols/Symbol} selectedSymbol Layer selection symbol
         * @property {external:module:esri/layers/FeatureLayer} layer The layer reference
         * @property {Array} eventHandlers Event handler reference that need to be removed when removing the view.
         */
        /**
         * Feature info
         * @typedef FeatureInfo
         * @property {module:nrm-map/views/featureLayerView~LayerInfo} layerData Layer info
         * @property {module:nrm-map/views/featureLayerView~Feature} feature Feature data
         * @property {Number} objectId The ObjectID
         */
        /**
         * Used internally to map a model to an existing feature in one of the layers. 
         * @typedef FeatureIdMap
         * @property {Number} objectId The ObjectID
         * @property {string} geometryType The geometry type.
         */
        /**
         * Plain object representation of a feature
         * @typedef Feature
         * @property {external:module:esri/geometry/Geometry|Object} geometry
         * @property {Object} attributes
         */
        /**
         * Convert a model to a feature.
         * @param {type} model The model to convert
         * @param {Number} oid The ObjectID
         * @returns {module:nrm-maps/views/featureLayerView~FeatureInfo|undefined}
         * Returns an object that can be used to construct a feature, or undefined if the geometry type could not be 
         * determined.
         */
        modelToFeature: function(model, oid) {
            var geomType, 
                    shape = this.getModelVal(model, this.options.shapeAttr), 
                    p = Nrm.Views.FeatureLayerView.convertShape(shape, this.options.wkid === 4326);
            if (p) {
                if (p.x) {
                    geomType = "esriGeometryPoint";
                } else if (p.paths) {
                    geomType = "esriGeometryPolyline";
                } else if (p.rings) {
                    geomType = "esriGeometryPolygon";
                } else if (p.points) {
                    // if the ESRI docs can be trusted, this geomType isn't supported.
                    geomType = "esriGeometryMultipoint";
                }
                if (geomType) {
                    var lyr = this.layers[geomType];
                    if (!lyr) {
                        lyr = this.layers[geomType] = {
                            layerDef: $.extend({}, this.layerDef, {
                                geometryType: geomType
                            }),
                            features: [],
                            symbol: this.getSymbol(geomType, this.options.symbol),
                            selectedSymbol: this.getSymbol(geomType, "selected")
                        };
                    }
                    var feat = {
                        geometry: p,
                        attributes: {
                            "ObjectID": oid,
                            "id": model.id
                        }
                    };
                    this.idMap[model.id] = {"objectId": oid, "geometryType": geomType};
                    feat.attributes[this.options.nameAttr] = this.getModelVal(model, this.options.nameAttr);
                    if (shape.shape) {
                        feat.attributes[this.flmDataSourceFieldName] = shape.dataSource;
                        feat.attributes[this.flmRevDateFieldName] = shape.revisionDate;
                        feat.attributes[this.flmAccuracyFieldName] = shape.accuracy;
                    } else {
                        if (this.options.flmDataSource)
                            feat.attributes[this.flmDataSourceFieldName] = this.getModelVal(model, this.options.flmDataSource);
                        if (this.options.flmRevDate)
                            feat.attributes[this.flmRevDateFieldName] = this.getModelVal(model, this.options.flmRevDate);
                        if (this.options.flmAccuracy)
                            feat.attributes[this.flmAccuracyFieldName] = this.getModelVal(model, this.options.flmAccuracy);
                    }
                    if (this.options.fields) {
                        _.each(this.options.fields, function(fld) {
                            var f = fld.name || fld;
                            feat.attributes[f] = this.getModelVal(model, f);
                        }, this);
                    }
                    var renderer = this.options.renderer;
                    if (renderer) {
                        _.find([renderer.fieldName, renderer.fieldName2, renderer.fieldName3], function(attr) {
                            if (!attr) {
                                return true; // stop the loop
                            }
                            var modelVal = this.getModelVal(model, attr);
                            if (modelVal != null) { // same as modelVal !== undefined && modelVal !== null
                                feat.attributes[attr] = modelVal.toString();
                            } // do we need an else for the case where the attribute changed from not-null to null?
                            return false; // continue the loop
                       }, this);
                    }
                    return {layerData: lyr, feature: feat, objectId: oid};
                }
            }
        },
        /**
         * Get a model attribute value.
         * @deprecated use {@link module:nrm-ui/models/application#getModelVal|Nrm.app.getModelVal} instead.
         * @param {external:module:backbone.Model} model The model
         * @param {string} propName Attribute name
         * @returns {*}
         */
        getModelVal: function(model, propName) {
            // TODO: remove if/once it's safe to assume all applications are implementing Nrm.app.
            if (Nrm.app)
                return Nrm.app.getModelVal(model, propName);
            else
                return model.get(propName);
        },
        /**
         * Set a model attribute value.
         * @deprecated use {@link module:nrm-ui/models/application#setModelVal|Nrm.app.setModelVal} instead.
         * @param {external:module:backbone.Model} model The model
         * @param {string} propName Attribute name
         * @param {*} value The value to set
         * @returns {undefined}
         */
        setModelVal: function(model, propName, value) {
            // TODO: remove if/once it's safe to assume all applications are implementing Nrm.app.
            if (Nrm.app)
                Nrm.app.setModelVal(model, propName, value);
            else
                return model.set(propName, value);
        },
        /**
         * Add features to a layer, creating the layer if it does not exist yet.
         * @param {module:nrm-map/views/featureLayerView~LayerInfo} layerData
         * @param {module:nrm-map/views/featureLayerView~Feature[]} features
         * @returns {undefined}
         */
        addFeatures: function(layerData, features) {
            if (features && features.length > 0) {
                var fs = new FeatureSet({
                    geometryType: layerData.layerDef.geometryType,
                    features: features
                });
                if (!layerData.layer) {
                    var geomTypeName = fs.geometryType.substring(12);
                    // layer is not created until we need it
                    var flyr = new FeatureLayer({
                        layerDefinition: layerData.layerDef,
                        featureSet: fs
                    }, {
                        id: "nrm-" + (this.options.layerKey || this.context.apiKey) + "-" + geomTypeName,
                        minScale: this.options.minScale,
                        maxScale: this.options.maxScale,
                        visible: this.options.visible,
                        opacity: this.options.opacity
                    }),
                    renderer,
                            rendererOpts = this.options.renderer;
                    flyr.on('mouse-over', this.onMouseOver);
                    flyr.on("mouse-out", this.onMouseOut);
                    if (this.options.tooltip) {
                        /**
                         * The tooltip dialog
                         * @type {?external:module:dijit/TooltipDialog}
                         */
                        this.dialog = new TooltipDialog({
                            //id: flyr.id + "-tooltip",
                            style: "position: absolute; width: 250px; font: normal normal normal 10pt Helvetica;z-index:100"
                        });
                        this.dialog.startup();
                        //flyr.on('mouse-over', this.onMouseOver); //onMouseOver now set for all layers
                        /**
                         * Indicates whether tooltips are enabled.
                         * @type {Boolean}
                         */
                        this.showTooltips = true;
                    } else {
                        this.showTooltips = false;
                    }

                    // begin artf11295 flyr.setRenderer(new esri.renderer.SimpleRenderer(layerData.symbol));
                    var renderer;
                    var rendererOpts = this.options.renderer;
                    if (rendererOpts !== undefined) {
                        var symbol, info;
                        switch (rendererOpts.type) {
                            case "opacity":
                                renderer = new SimpleRenderer(layerData.symbol);
                                if (!renderer.setOpacityInfo) {
                                    console.warn("featureLayerView: Opacity renderer requires jsapi version 3.11 or greater");//, and your version is " + esri.version.toString());
                                    break;
                                }
                                if (rendererOpts.fieldName && rendererOpts.values && rendererOpts.values.length > 1) {
                                    renderer.setOpacityInfo({
                                        field: rendererOpts.fieldName,
                                        minDataValue: rendererOpts.values[0],
                                        maxDataValue: rendererOpts.values[rendererOpts.values.length - 1],
                                        // normalizeField: "normalizeFieldName",
                                        // stops: [
                                        //   { value: 10, opacity: 0   }, 
                                        //   { value: 39, opacity: 0.5 },  
                                        //   { value: 68, opacity: 1   }   
                                        // ]
                                        // OR, you can specify alphaValues using:
                                        opacityValues: [0, 1]
                                    });
                                }
                                break;
                            case "color":
                                var defaultSymbol, color, defaultOpacity = 1;
                                if (_.indexOf(rendererOpts.values, "default") === -1) {
                                    defaultSymbol = null;
                                } else {
                                    defaultSymbol = symbolUtils.fromJson(layerData.symbol.toJson());
                                    defaultOpacity = defaultSymbol.color.a;
                                    defaultSymbol.setColor(rendererOpts.colors[_.indexOf(rendererOpts.values, "default")]);
                                }
                                if (rendererOpts.fieldName2)
                                    if (rendererOpts.fieldName3)
                                        renderer = new UniqueValueRenderer(defaultSymbol, rendererOpts.fieldName, rendererOpts.fieldName2, rendererOpts.fieldName3);
                                    else
                                        renderer = new UniqueValueRenderer(defaultSymbol, rendererOpts.fieldName, rendererOpts.fieldName2);
                                else
                                    renderer = new UniqueValueRenderer(defaultSymbol, rendererOpts.fieldName);
                                for (var i = 0; i < rendererOpts.values.length; i++) {
                                    if (rendererOpts.values[i] !== "default") {
                                        //var symbol = _.clone(layerData.symbol);
                                        symbol = symbolUtils.fromJson(layerData.symbol.toJson());
                                        if (rendererOpts.colors) {
                                            color = new Color(rendererOpts.colors[i]);
                                            if (geomTypeName.indexOf("olygon") === -1)
                                                color.a = Math.min(defaultOpacity, 1);
                                            symbol.setColor(color);
                                            //if (symbol.outline) symbol.outline.setColor(color);
                                        }
                                        info = {
                                            value: rendererOpts.values[i],
                                            //description: "",
                                            label: (rendererOpts.labels) ? rendererOpts.labels[i] : rendererOpts.values[i].toString(),
                                            symbol: symbol
                                                    , initialColor: _.clone(symbol.color)
                                        };
                                        renderer.addValue(info);
                                        //renderer.addValue(rendererOpts.values[i], symbol);
                                    }
                                }
                                break;
                            case "hatch":
                            case "image":
                                if (flyr.geometryType !== "esriGeometryPolygon") {
                                    //console.info('Applying simple renderer to ' + flyr.geometryType + ' layer because ' + rendererOpts.type + ' is only supported for polygons.');
                                    renderer = new SimpleRenderer(layerData.symbol);
                                    break;
                                }
                                // use a single image and vary the scale. Image urls generated at http://www.patternify.com/
                                var pfs, imageSize = 10, imageUri; // = 'lib/nrm-map/img/';
                                if (rendererOpts.imageUri) {
                                    imageUri = rendererOpts.imageUri;
                                    if (rendererOpts.imageSize) {
                                        imageSize = rendererOpts.imageSize;
                                    }
                                } else {
                                    if (rendererOpts.style.toLowerCase().indexOf('vertical') > -1) {
                                        //imageUri = imageUri + 'vertical.png';
                                        imageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAHElEQVQYV2NkwAT/oUKMyFIoHKjEqEJ4CFE/eAARkQoLu5PdZwAAAABJRU5ErkJggg==';
                                        //thicker imageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAG0lEQVQYV2NkQAX/kbiMyFIoHAYGhlGFNA4eADlpCgv0xQpbAAAAAElFTkSuQmCC';
                                    } else if (rendererOpts.style.toLowerCase().indexOf('horizontal') > -1) {
                                        //imageUri = imageUri + 'horizontal.png';
                                        imageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIklEQVQYV2NkIBIwEqmOgTYK/xNjPchqohUSYyCNPEOU1QDDvQIJos+LIgAAAABJRU5ErkJggg==';
                                    } else if (rendererOpts.style.toLowerCase().indexOf('forward_diagonal') > -1) {
                                        imageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAQklEQVQYV2NkQID/DAwMjEh8FCZMAq8ikA6QQoKKYApx2YYs/h+nm9DdTkgh3Fn4FKK4HZdCDA9iU4g1FNAV4gwqAPy3CgrSmY8aAAAAAElFTkSuQmCC';
                                        //imageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAH0lEQVQIW2NkQAX/GZH4/xkYGBhhAmAOSBJEwDkgAQCCrgQEqRgDDwAAAABJRU5ErkJggg==';
                                        //imageSize = 4;
                                    } else if (rendererOpts.style.toLowerCase().indexOf('backward_diagonal') > -1) {
                                        imageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAPklEQVQYV2NkwA/+MzAwMIKUgAliFBOjEGTOf5BCuPH4TIaZSFAxstV4FaO7EadibJ7BqhiXrzEU4wseFMUA/I4KCvh9R8wAAAAASUVORK5CYII=';
                                    } else if (rendererOpts.style.toLowerCase().indexOf('diagonal_cross') > -1) {
                                        //imageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAPUlEQVQYV2NkYGD4z8DAwMiAH/yHKcCnGCyHbBI2xXAxdCuRFaNoxOY2kAIQQJEjWyFRVhPlGaKCh6gABwBcgBIJDnDinwAAAABJRU5ErkJggg==';
                                        imageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAR0lEQVQYV2NkQID/DAwMjEh8EBMuBpPApgimBywHUohPEVwxSQpR3ILmRrgcsuOJ8gyKw6EcFI3owQGzCkSjyJGtENk6FKsBUesSCZ/ruvgAAAAASUVORK5CYII=';
                                    } else if (rendererOpts.style.toLowerCase().indexOf('cross') > -1) {
                                        imageUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIElEQVQYV2NkwA7+MzAwMCJLoXCQJAabQpB7CIKh4BkA/OUKCp2jSIEAAAAASUVORK5CYII=';
                                    }
                                }
                                pfs = new PictureFillSymbol(imageUri,
                                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                        new Color('#000'), 1),
                                        imageSize, imageSize);
                                if (rendererOpts.values && rendererOpts.fieldName) {
                                    // unique for each value
                                    var i, n = rendererOpts.values.length;
                                    //renderer = UniqueValueRenderer(null, rendererOpts.fieldName);
                                    if (rendererOpts.fieldName2)
                                        if (rendererOpts.fieldName3)
                                            renderer = new UniqueValueRenderer(null, rendererOpts.fieldName, rendererOpts.fieldName2, rendererOpts.fieldName3);
                                        else
                                            renderer = new UniqueValueRenderer(null, rendererOpts.fieldName, rendererOpts.fieldName2);
                                    else
                                        renderer = new UniqueValueRenderer(null, rendererOpts.fieldName);
                                    for (i = 0; i < n; i++) {
                                        symbol = symbolUtils.fromJson(pfs.toJson());
                                        // 0.25 is the lowest scale that renders well in IE (ebodin 2/5/2015)
                                        symbol.xscale = 0.25 + (i / n);
                                        symbol.yscale = 0.25 + (i / n);
                                        info = {
                                            value: rendererOpts.values[i],
                                            //description: "",
                                            label: (rendererOpts.labels) ? rendererOpts.labels[i] : rendererOpts.values[i].toString(),
                                            symbol: symbol
                                        }
                                        renderer.addValue(info);
                                    }
                                } else {
                                    renderer = new SimpleRenderer(pfs);
                                }
                                break;
                            default:
                                renderer = new SimpleRenderer(layerData.symbol);
                        }
                    } else {
                        renderer = new SimpleRenderer(layerData.symbol);
                    }
                    renderer.rendererOpts = rendererOpts;
                    flyr.setRenderer(renderer);
                    // end artf11295
                    flyr.setSelectionSymbol(layerData.selectedSymbol);
                    flyr.nrmOptions = {
                        featureClickCallback: this.options.featureClickCallback || function() {
                        },
                        minScale: this.options.minScale,
                        maxScale: this.options.maxScale,
                        zoomToSelection: this.options.zoomToSelection,
                        keyFieldName: "id",
                        persistLayer: false,
                        required: true,
                        identifyCallback: _.bind(this._identify, this),
                        contextCallback: _.bind(this.getContextItems, this),
                        view: this
                    };
                    if (this.options.caption) {
                        if (_.isFunction(this.options.caption) && this.captionAttributes.length === 0) {
                             var re = /\.get\('([^']*)'/gm,
                                    match = [], attName,
                                    text = this.options.caption.toString().replace(/"/g, "\'");
                            while((match = re.exec(text)) !== null) {
                                    attName = match[1]; // first capture group
                                    this.captionAttributes.push(attName);
                            }
                        }
                        var c = flyr.nrmOptions.caption = this.getCaption(); //this.options.caption; // ebodin 1/6/2015 Heritage artf11260 + " - " + geomTypeName;
                        //flyr.id = this.options.caption + " - " + geomTypeName;
                        //flyr.id = flyr.nrmOptions.caption; // ebodin to improve printed map legend
                        // ... but non-unique ids make previous points disappear when adding to a multipoint feature
                        //flyr.id = this.options.caption + "\n" + geomTypeName; // this is good, but maybe the next...
                        flyr.id = (c + "            ").substr(0, c.length + geomTypeName.length);
                    }
                    layerData.layer = flyr;
                    if (this.mapControl) {
                        // reordering happens later
                        this.mapControl.map.addLayer(flyr, 0);
                        var self = this;
                        layerData.eventHandlers = layerData.eventHandlers || [];
                        layerData.eventHandlers.push(connect.connect(flyr, "onClick", function(event) {
                            if (!self.options.selectable)
                                return;
                            //self.mapControl.clearGraphicSelection();
                            if (event.graphic) {
                                try {
                                    if (_.without(Nrm.app.mapView.selectionHandlersDeclared, "NavButtonBar").length === 0) {
                                        dojoEvent.stop(event);
                                    }
                                } catch (e) {
                                    dojoEvent.stop(event);
                                }
                                self.selectFeature(flyr, event.graphic, event);
                            }
                        }));
                    }
                } else {
                    if (!layerData.layer.isEditable()) {
                        layerData.layer.setEditable(true);
                    }
                    var self = this;
                    layerData.layer.applyEdits(fs.features, null, null, function(adds) {
                        if (adds) {
                            _.each(adds, function(item, key) {
                                if (key < fs.features.length) {
                                    var id = fs.features[key].attributes.id;
                                    self.idMap[id] = {
                                        "objectId": item.objectId,
                                        "geometryType": layerData.layerDef.geometryType
                                    };
                                    //console.log("setting id for " + id + " to " + item.objectId);
                                }
                            });
                        }
                    });
                }
            }
        },
		/**
		 * Get the layer caption to display in the Map TOC widget.
		 * @returns {string} The layer caption.
		 */
        getCaption: function() {
            var caption = this.options.caption;
            if (_.isFunction(caption)) {
                caption = caption.call(this);
            }
            return caption;
        },
        /**
         * Select a feature.
         * @param {external:module:esri/layers/FeatureLayer} flyr The feature layer
         * @param {module:nrm-map/views/featureLayerView~Feature|external:module:esri/Graphic} graphic The feature to 
         * select
         * @param {MouseEvent} [event] Mouse event
         * @returns {undefined}
         */
        selectFeature: function(flyr, graphic, event) {
            var graphic = new Graphic({
                geometry: graphic.geometry,
                attributes: graphic.attributes
            });
            flyr.clearSelection();
            if (event) {
                this.mapControl.openDialog(graphic, event.pageX, event.pageY);
            }
            var id = graphic.attributes && graphic.attributes.id, 
                    model = this.collection.find(function(model) {
                        return model.id === id;
                    }, this);
            if (this.collection.size() === 1) {
                this.mapControl.selectGraphic(graphic);
                this.setModelVal(model, 'selected', true);
                this.collection.trigger("updateSelection", this.collection, {fromMap: true});
            } else {
                this.collection.trigger("highlight", model, this.collection);
            }
            // this might seem redundant with the "highlight" event getting triggered on collection, but it isn't.
            Nrm.event.trigger("map:highlightGraphic", {
                graphic: graphic
            });
            flyr.nrmOptions.featureClickCallback(id);
        },
        /**
         * Internal implementation of setting the extent
         * @param {Object} options
         * @returns {undefined}
         */
        _zoomTo: function(options) {
            Nrm.Views.FeatureLayerView.setExtent($.extend({
                map: this.mapControl.map,
                minZoomToScale: this.options.minZoomToScale,
                maxZoomToScale: this.options.maxZoomToScale
            }, options));
        }
    },
    /** @lends module:nrm-map/views/featureLayerView */
    {
        // This function borrowed temporarily from map control _zoomTo method and tweaked a little.
        /**
         * Set the map extent, the default behavior is to pan to the extent and zoom only if the current extent
         * is outside of the min/max scale range determined from a layer or other options.
         * @param {Object} options 
         * @param {external:module:esri/Map} options.map The map.
         * @param {external:module:esri/Graphic} [options.graphic] Derive the new extent from a graphic.
         * @param {external:module:esri/Graphic[]} [options.graphics] Derive the new extent from an array of graphics.
         * @param {external:module:esri/geometry/Extent} [options.extent] The new extent to set.
         * @param {external:module:esri/geometry/Geometry} [options.geometry] Derive the new extent from a geometry.
         * @param {external:module:esri/layers/Layer} [options.layer] A layer to determine min and max extents.
         * @param {Boolean} [options.suppressZoom] Override default behavior of zooming to make the layer visible.
         * @param {Boolean} [options.panToFeature] Pan instead of zoom, using the extent as the center.
         * @param {Boolean} [options.zoomToFeature] Always zoom to the feature.
         * @param {Number} [options.minZoomToScale] Minimum scale to set when zooming.
         * @param {Number} [options.maxZoomToScale] Maximum scale to set when zooming.
         * @returns {undefined}
         */
        setExtent: function(options) {
            try {
                var extent = false;
                var layer = false;
                var center = false;
                var map = options.map;
                var graphic = false;
                if (options.graphic) {
                    graphic = options.graphic;
                    extent = graphicsUtils.graphicsExtent([graphic]);
                    layer = graphic.getLayer();
                }
                else if (options.graphics) {
                    graphic = options.graphics[0];
                    extent = graphicsUtils.graphicsExtent(options.graphics);
                    layer = graphic.getLayer();
                }
                else if (options.extent) {
                    extent = new Extent(options.extent.toJson());
                }
                else if (options.geometry) {
                    extent = options.geometry.getExtent();
                }
                if (!layer && options.layer) {
                    layer = options.layer;
                }
                if (!extent) {
                    if (graphic && graphic.geometry && $.isNumeric(graphic.geometry.x)) {
                        // a single point feature, graphics extent returns null
                        center = graphic.geometry;
                    }
                } else {
                    center = extent.getCenter();
                }
                if (!center)
                    return;
                var mapSr = map.spatialReference.wkid, geomSr = center && center.spatialReference.wkid;
                if ((geomSr === 4326 || geomSr === 4269) &&
                        (mapSr === 102100 || mapSr === 102113 || mapSr === 3857)) {
                    center = prjUtils.geographicToWebMercator(center);
                    if (extent)
                        extent = prjUtils.geographicToWebMercator(extent);
                }
                var minZoomToScale = options.minZoomToScale;
                var maxZoomToScale = options.maxZoomToScale;
                var suppressZoom = (options.suppressZoom || options.panToFeature) && !options.zoomToFeature;

                // determine min and max scales
                var nrmMax = layer && layer.nrmOptions && layer.nrmOptions.maxScale ? layer.nrmOptions.maxScale : 0;
                var nrmMin = layer && layer.nrmOptions && layer.nrmOptions.minScale ? layer.nrmOptions.minScale : 0;
                // if maxZoomToScale is defined, use that even if layer maxScale is smaller.
                var maxScale = Math.max(layer ? layer.maxScale : 0, maxZoomToScale, nrmMax);
                var minScale = layer ? layer.minScale : 0;
                if (nrmMin > 0)
                    minScale = minScale === 0 ? nrmMin : Math.min(minScale, nrmMin);
                // if layer has minScale defined, use that instead of the global minZoomToScale.
                if (!minScale && minZoomToScale > 0)
                    minScale = minZoomToScale;


                // is map zoomed out beyond minScale?
                if (minScale > 0 && map.getScale() > minScale && !options.zoomToFeature && !options.panToFeature) {
                    // If map scale is zoomed out farther than minScale, just zoom to the minScale
                    // and make sure it's centered on the input extent rather than zooming all the way to the extent,
                    // unless the options specify we specifically want to zoom to the input extent.
                    //console.info("Current scale " + map.getScale() + " less than minScale " + minScale + ".");
                    // find minimum LOD scale that is greater than minScale.
                    //var lods = map.getLayer("basemap").tileInfo.lods; // got rid of basemap concept 5/15/15
                    var lods = map.__tileInfo.lods;
                    var scales = [];
                    for (var i = 0; i < lods.length; i++) {
                        scales.push(lods[i].scale);
                    }
                    scales.sort(function(a, b) {
                        return b - a;
                    });
                    for (var i = 0; i < scales.length; i++) {
                        if (scales[i] <= minScale) {
                            minScale = scales[i];
                            break;
                        }
                    }
                    var scaleExtent = scaleUtils.getExtentForScale(map, minScale).centerAt(center);
                    // if extent is actually greater than the minScale, don't zoom to it because it won't do any good.
                    if (!suppressZoom && scaleExtent.contains(extent || center)) {
                        //console.info("Setting scale to minScale " + minScale + ".");
                        //map.setScale(minScale).then(function() { recenter(minScale, maxScale); });
                        map.setExtent(scaleExtent, false).then(logFinalScale);
                    } else if (!suppressZoom) {
                        // not sure what to do here... 
                        //console.info("Zoom suppressed because extent scale is less than minScale.");
                        logFinalScale();
                    }
                } else if (!map.extent.contains(extent || center) || options.zoomToFeature || options.panToFeature || !layer.visibleAtMapScale) {
                    var panExtent = map.extent.centerAt(center);
                    var scaleExtent = maxScale === 0 ? false : scaleUtils.getExtentForScale(map, maxScale).centerAt(center);

                    if (suppressZoom || ((!scaleExtent || !scaleExtent.contains(panExtent)) &&
                            panExtent.contains(extent || center) && !options.zoomToFeature)) {
                        //console.info("Panning to feature.", center, options);
                        map.centerAt(center).then(logFinalScale);
                    }
                    else if (extent && (!scaleExtent || !scaleExtent.contains(extent || center))) {
                        //console.info("Zooming to feature.", extent, options);
                        map.setExtent(extent, true).then(logFinalScale);
                    } else if (maxScale > 0) {
                        //console.info("Setting scale to maxScale", maxScale, options);
                        map.setExtent(scaleExtent, true).then(logFinalScale);
                    } else {
                        logFinalScale();
                    }
                }


                function logFinalScale() {
                    console.info("Final map scale and level", map.getScale(), map.getLevel());
                }
            } catch (ex) {
                console.warn('featureLayerView.zoomTo error', ex);
            }
        },
        /**
         * Determines if a shape value is empty.
         * @deprecated Use {@link module:nrm-ui/models/application#shapeIsEmpty|Nrm.app.shapeIsEmpty} instead.
         * @param {external:module:esri/geometry/Geometry|Object} shapeVal
         * @returns {Boolean} 
         */
        shapeIsEmpty: function(shapeVal) {
            return !shapeVal ||
                    (shapeVal.x !== undefined && !$.isNumeric(shapeVal.x)) ||
                    (shapeVal.points && shapeVal.points.length === 0) ||
                    (shapeVal.paths && shapeVal.paths.length === 0) ||
                    (shapeVal.rings && shapeVal.rings.length === 0) ||
                    (shapeVal.xmin !== undefined && !$.isNumeric(shapeVal.xmin));
        },
        /**
         * Convert a shape value that may be a string or an object to a geometry object, optionally transforming from
         * NAD83 to WGS84.
         * @deprecated Use {@link module:nrm-ui/models/application#convertShape|Nrm.app.convertShape} instead.
         * @param {string|external:module:esri/geometry/Geometry|Object} p
         * @param {Boolean} [transformToWgs84] Transform NAD83 geographic to WGS84, currently uses no-op transformation.
         * @returns {undefined|external:module:esri/geometry/Geometry|Object}
         * Returns undefined if the shape is not valid or is empty, a plain object that is a JSON representation of an
         * ESRI geometry object, or an actual geometry object in some cases.
         */
        convertShape: function(p, transformToWgs84) {
            if (Nrm.app)
                return Nrm.app.convertShape(p, transformToWgs84);
            if (p) {
                var isCopy = false;
                if (typeof p === 'string' || p instanceof String) {
                    try {
                        p = JSON.parse(p);
                        isCopy = true;
                    } catch (error) {
                        console.warn("featureLayerView.convertShape JSON parse error: " + error);
                    }
                }
                if (this.shapeIsEmpty(p))
                    return;
                if (transformToWgs84 && p.spatialReference.wkid === 4269) {
                    if (!isCopy)
                        p = $.extend(true, {}, p);
                    p.spatialReference.wkid = 4326; // fake it
                }
            }
            return p;
        }
    });
});