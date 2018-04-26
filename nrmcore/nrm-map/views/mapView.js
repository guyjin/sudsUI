/**
 * @file The MapView is a {@link http://backbonejs.org/#View|Backbone.View} that provides the core spatial 
 * functionality of the application.
 * @see module:nrm-map/views/mapView
 */
/** 
 * @module nrm-map/views/mapView
 * 
 */

define(['nrm-ui',  'nrm-ui/plugins/messageBox', 'jquery', 'underscore', 'backbone', 
    './featureLayerView', './mapTocView', '../Map', 'dojo/_base/connect', 
    'esri/graphic', 'esri/graphicsUtils', 'esri/geometry/webMercatorUtils', 'esri/toolbars/draw',
    'esri/geometry/Point', 'esri/geometry/Polyline', 'esri/geometry/Polygon', 'esri/geometry/Multipoint', 
    'esri/geometry/Extent', 'esri/geometry/ScreenPoint',
    'esri/geometry/Geometry',
    './mapTabsView',
    'esri/layers/FeatureLayer',
    'esri/tasks/query',
    'dojo/Deferred',
    'esri/tasks/IdentifyParameters', 'esri/tasks/IdentifyTask', 'dojo/DeferredList','esri/geometry/geometryEngine','./bufferView'], 
         function(Nrm, MessageBox, $, _, Backbone, FeatureLayerView, MapTocView, Map, connect, Graphic, graphicsUtils, prjUtils, Draw,
             Point, Polyline, Polygon, Multipoint, Extent, ScreenPoint,
             Geometry,
             MapTabsView,
             FeatureLayer,
             Query,
             Deferred,
             IdentifyParameters, IdentifyTask, DeferredList, GeometryEngine, BufferView) {
    /**
     * Configuration for the MapView.  As well as the properties listed here, it may also include any plugin options for
     *  the {@link module:nrm-map/Map|map control}.
     * @todo Even though the id option is supposed to be optional with a default value, it only works if it is
     * provided as an option.
     * @typedef {module:nrm-map/Map~PluginOptions} MapConfig
     * @property {string} [id="mapDiv"] Element id for the map container element.
     * @property {string} [tocId="mapTocControl"] Override the default id for the map TOC element.
     * @property {Boolean} [tocExpanded=false] Indicates if the map TOC accordion panel should be expanded initially
     * @property {string} [helpContext=882] Context-sensitive help context for map TOC and identify accordion panels.
     * @property {Number} [editSr=4326] Spatial reference for editing, currently only supports the default value.
     */
    /**
     * Persistent settings for dynamic map layers
     * @typedef {Object} DynamicMapLayerSettings
     * @property {string} url Layer URL
     * @property {module:nrm-map/Map~DynamicLayerConfig} nrmOptions Layer configuration, not including any circular 
     * references
     * @property {Number} [pos] Index of the layer, may be undefined to restore at the default index.
     */
    /**
     * Persistent settings for graphics and feature layers
     * @typedef {Object} GraphicsLayerSettings
     * @property {string} id Layer ID
     * @property {module:nrm-map/Map~DynamicLayerConfig} nrmOptions Layer configuration, not including any circular 
     * references
     * @property {Object} [featureCollection] Plain object representation of a FeatureLayer.
     * @property {Object[]} [graphics] Array of graphic objects as plain objects.
     * @see {@link https://developers.arcgis.com/javascript/3/jsapi/graphic-amd.html#tojson|Graphic#toJson} and
     * {@link https://developers.arcgis.com/javascript/3/jsapi/featurelayer-amd.html#tojson|FeatureLayer#toJson}
     */
    return Nrm.Views.MapView = Backbone.View.extend(/**@lends module:nrm-map/views/mapView.prototype */{
        /**
         * Create a new MapView instance.
         * @constructor
         * @alias module:nrm-map/views/mapView
         * @classdesc The MapView is a Backbone.View that interacts with the ArcGIS Javascript API to provide
         * spatial editing and display capabilities. 
         * @param {module:nrm-map/views/mapView~MapConfig} options In addition to the properties described in the 
         * MapConfig type, the following additional options are supported:
         * @param {string} options.accordionId The id of the parent accordion group for map TOC accordion panel.
         */
        initialize: function(options) {
            // need model to trigger event from GetExtentView
            /**
             * Initialization options.
             * @type {Object}
             */
            this.options = $.extend({}, this.defaults, this.options, options);
            //this.setElement($("#" + this.options.id));
            this.id = this.options.id;
            //this.tocId = this.options.tocId || "mapTocControl";
            this.$el.addClass("nrm-map");
            this.$el.attr("tabindex", 0);
            
            // LW: Initially the code for adding the mapButtonBar div was here, but it was moved into the
            // setupMap function.
            // this.$el.append( "<div id=\"" + this.options.mapButtonBarId + "\"></div>");
            
            /**
             * For internal use, indicates whether the view is initializing
             * @type {Boolean}
             */
            this.initializing = true;
            /**
             * Allows calling methods before asynchronous initialization is complete (in theory).
             * @type {external:module:jquery.Deferred}
             */
            this.dfd = new $.Deferred();

            // note: startListening and rendering would normally go in a render method.
            // The MapView is "special" in this regard where the constructor instigates the rendering.
            // This is mostly ok since the expectation is that there will be only one MapView
            //  that will stay around for entire app lifespan.
            this.startListening();

            // The call to setupMap moved to renderComplete event handler.
            // This was necessary because sometimes dojoOnLoad fires synchronously
            // if the dojo script loading finishes before the MapView is created.
            //this.setupMap();        
            
            this.selectionHandlersDeclared = [];
        },
        /**
         * Default options
         * @type {Object}
         */
        defaults: {
            tocId: "mapTocControl",
            restoreSettings: false,
            autoResize: false,
            id: "mapDiv",
            mapButtonBarId: "MapButtonBar", // LW: This is the id that gets assigned to the div inserted into the mapDiv
            navButtonBarId: "NavButtonBar",
            editSr: 4326,
            helpContext: "882",
            temporaryLayers: [],
            geometryServiceURL: "https://apps.fs.usda.gov/arcn/rest/services/Utilities/Geometry/GeometryServer",
            requestInputCallback: function(options) {
                var data = $.extend({}, options);
                Nrm.event.trigger("app:modal", data);
                return data.handled;
            }
            , errorCallback: function(error) {
                console.info('mapView.errorCallback', error);
                var userMsg = 'Map warning: ' + error.message + '\nSource: ' + error.source,
                    d = new Date(),
                    n = d.getUTCFullYear() + '-' +
                        ('0' + (d.getUTCMonth() + 1).toString()).slice(-2) + '-' +
                        ('0' + d.getUTCDate()).slice(-2),
                    msg = error.message + (error.source ? " (" + error.source + ")" : ""),
                    log = {
                        text: msg,
                        date: n,
                        type: "ERROR",
                        info: {"DOMAIN": msg.indexOf('apps.fs') > -1 ? "EDW" : "MAP"}
                    },
                    info = [],
                    msgBoxOptions = {
                        moreMsg: JSON.stringify(_.omit(error, "response")),
                        type: "notice", 
                        hide: true, 
                        delay: 5000
                    };
                info.push(log);
                $.ajax({
                    url: "api/message/log",
                    type: "POST",
                    //async: false,
                    data: JSON.stringify(info),
                    contentType: "application/json"
                })
                        .done(function(data) {
                    console.info('logged map error message', data);
                    if (_.isArray(data) && data.length && data[0].id) {
                        userMsg += "\n Error Log ID: " + data[0].id;
                    }
                    MessageBox(userMsg, msgBoxOptions);
                })
                        .fail(function() {
                    MessageBox(userMsg, msgBoxOptions);
                });
            }
        },
        /**
         * Start listening to global events
         * @returns {undefined}
         */
        startListening: function() {
            // infrastructure
            this.listenTo(Nrm.event, "layout:showMap", this.onShowMap);
            this.listenTo(this, "renderComplete", this.setupMap);

            // triggered by business code
            this.listenTo(Nrm.event, "map:activateEditMode", this.activateEditMode);
            this.listenTo(Nrm.event, "map:activateDrawMode", this.activateDrawMode);
            this.listenTo(Nrm.event, "map:deactivateDrawMode", this.deactivateDrawMode);
            this.listenTo(Nrm.event, "map:disableEditing", this.disableEditing);
            this.listenTo(Nrm.event, "map:addGraphic", this.addSingleGraphic);
            this.listenTo(Nrm.event, "map:setLayerSelectable", this.setCollectionLayerSelectable);
            /**
             * Set visibility of one or more {@link module:nrm-map/views/featureLayerView|FeatureLayerView}
             * @event module:nrm-ui/event#map:setLayerVisible
             * @param {string|string[]} layerKeys A unique key identifying the layer, or an array of keys
             * @param {Boolean} visible New visibility setting
             * @param {Object} [options]
             * @param {Boolean} [options.otherLayerVisible] If specified, indicates the visibility to set on other 
             * layers.
             */
            this.listenTo(Nrm.event, "map:setLayerVisible", this.setCollectionLayerVisible);
            this.listenTo(Nrm.event, "map:zoomToLayer", this.zoomToCollectionLayer);
            this.listenTo(Nrm.event, "map:highlightGraphic", this.highlightActiveRow);
            this.listenTo(Nrm.event, "context:mapSelect", this.activateSelectTool);
            this.listenTo(Nrm.event, "map:configureSelect", this.configureSelect);
            this.listenTo(Nrm.event, "context:zoomTo", this.zoomToFeature);
            this.listenTo(Nrm.event, "context:panTo", this.panToFeature);
            this.listenTo(Nrm.event, "map:importShapefile", this.importShapefile);
            this.listenTo(Nrm.event, "map:printMap", this.printMap);
            this.listenTo(Nrm.event, "map:addPart", this.addPart);
            this.listenTo(Nrm.event, "map:deletePart", this.deletePart);
            this.listenTo(Nrm.event, "map:addLayerFromShapefile", this.addLayerFromShapefile);
            this.listenTo(Nrm.event, "map:addLayerByURL", this.addLayerByURL);
            this.listenTo(Nrm.event, "map:clearFeatures", this.clearFeatures);
            this.listenTo(Nrm.event, "map:copyFeature", this.copyFeature);
            this.listenTo(Nrm.event, "map:reshape", this.reshape); // LW: Listen to the reshape event
            this.listenTo(Nrm.event, "map:buffer", this.buffer);
            this.listenTo(Nrm.event, "map:bufferFeature", this.bufferFeature);
            this.listenTo(Nrm.event, "map:cancelBuffer", this.cancelBuffer);
            this.listenTo(Nrm.event, "map:cancelFeatureListView", this.cancelFeatureListView);
            //this.listenTo(Nrm.event, "app:click #featurelist-ok", this.featurelistOk);
            /**
             * Download layers and map tiles to a local storage implementation for offline use.
             * @event module:nrm-ui/event#map:checkout
             * @param {Object} opts
             * @see {@link module:nrm-map/Map#checkout|MapControl#checkout} for supported options.
             */
            this.listenTo(Nrm.event, "map:checkout", this.checkout);
            this.listenTo(Nrm.event, "map:featureCreate", this.createFeature);
            this.listenTo(Nrm.event, "map:declareSelectionHandler", this.declareSelectionHandler);
            this.listenTo(Nrm.event, "map:deactivateTool", this.onDeactivateTool);
            this.listenTo(Nrm.event, "map:endDraw", this.endDraw);
            this.listenTo(Nrm.event, "layout:clearForm", this.clearFeatures);
            this.listenTo(Nrm.event, "map:setCursor", this.setCursor);
        },
        /**
         * Indicates whether the map is loaded.
         * @returns {Boolean}
         */
        isLoaded: function() {
            return this.dfd && this.dfd.isResolved();
        },
        /**
         * Get a promise that is resolved when the map loads.
         * @returns {external:module:jquery~Promise}
         */
        promise: function() {
            return this.dfd && this.dfd.promise();
        },
        /**
         * Handles global "layout:showMap" event to reset the map control when the panel is opened.
         * @returns {undefined}
         */
        onShowMap: function() {
            //console.log("onShowMap");
            this.mapHidden = false;
            this.enableReset = true;
            this.waitAndResetMap();
        },
        /**
         * For internal use, reset the map control after waiting short period.
         * @returns {undefined}
         */
        waitAndResetMap: function() {
            if (!this.mapControl && !this.initializing) {
                this.initializing = true;
                this.setupMap();
            } else if (this.mapControl && !this.mapHidden && this.enableReset) {
                this.enableReset = false;
                var self = this;
                window.setTimeout(function() {
                    self.enableReset = true;
                    self.resetMap();
                }, 100);
            }
        },
        /**
         * For internal use only, reset the map control when the panel size or visibility changes.
         * @returns {undefined}
         */
        resetMap: function() {
            if (this.enableReset && !this.mapHidden && this.mapControl) {
                var immediate = !!this.doReset;
                // doReset is a work-around for the map control getting messed up if panel is hidden when the map loads.
                if (this.doReset) {
                    this.doReset = false;
                    this.$el.css({"width": "100%", "height": "100%"});
                }
                this.mapControl.map.resize(immediate);
                if (immediate) {
                    if (this.mapControl.restoredExtent) {
                        //this.mapControl._zoomTo({extent: this.mapControl.restoredExtent});
                        this.mapControl.map.setExtent(this.mapControl.restoredExtent);
                    } else {
                        this.mapControl.map.centerAndZoom([this.mapControl.options.x, this.mapControl.options.y], this.mapControl.options.z);
                    }
                }
            }
        },
        /**
         * Handles global "layout:hideMap" event to suspend resize event handlers when the map is hidden.
         * @returns {undefined}
         */
        onHideMap: function() {
            //console.log("onHideMap");
            /**
             * Indicates the map panel is currently hidden.
             * @type {Boolean}
             */
            this.mapHidden = true;
        },
        /**
         * Zoom to a feature
         * @param {Object} options Options
         * @returns {undefined}
         * @see {@link module:nrm-map/views/mapView#setExtentToFeature|setExtentToFeature} for the list of options.
         */
        zoomToFeature: function(options) {
            this.setExtentToFeature(true, options);
        },
        /**
         * Pan to a feature
         * @param {Object} options Options
         * @returns {undefined}
         * @see {@link module:nrm-map/views/mapView#setExtentToFeature|setExtentToFeature} for the list of options.
         */
        panToFeature: function(options) {
            this.setExtentToFeature(false, options);
        },
        // 10/20/2014 ebodin modified to take a geometry option
        /**
         * Pan or zoom to a feature.
         * @param {Boolean} zoomTo
         * @param {Object} options
         * @param {module:nrm-ui/models/application~ContextConfig} [options.context] Context configuration, used to 
         * determine the shape attribute name(s) for the model option
         * @param {external:module:backbone.Model} [options.model] Model with a shape attribute that determines the
         * extent to set.
         * @param {external:module:esri/geometry/Geometry|Object} [options.geometry] Geometry object to determine
         * the extent to set.
         * @param {Array.<external:module:esri/geometry/Geometry|Object>} [options.geometries] Array of geometry objects
         * to determine the extent to set.
         * @returns {undefined}
         */
        setExtentToFeature: function(zoomTo, options) {
            $.when(this.dfd).done(function(self) {
                var shape;
                if (options.geometries) {
                    shape = _.map(options.geometries, function(s) {
                        return new Graphic({geometry: s});
                    });
                } else if (options.geometry) {
                    shape = new Graphic({geometry: options.geometry.shape || options.geometry});
                } else {
                    var model = options.model;
                    var stickyGraphic = self.stickyGraphic || self.previousStickyGraphic;
                    var editAttr = stickyGraphic && stickyGraphic.attributes;
                    if (editAttr && (!model || model.isNew() || model.id === editAttr.id)) {
                        shape = stickyGraphic;
                    }
                    if (!shape) {
                        var shapeVal = Nrm.app.getShapeVal(options.context, model);
                        if (_.isArray(shapeVal)) {
                            shape = _.map(shapeVal, function(s) {
                                return new Graphic({geometry: s});
                            });
                        } else {
                            shape = new Graphic({geometry: shapeVal});
                        }
                    }
                }
                if (shape) {
                    var opt = {
                        "maxZoomToScale": self.mapControl.options.maxZoomToScale || 1000,
                        "minZoomToScale": self.mapControl.options.minZoomToScale || 0,
                        "map": self.mapControl.map,
                        "zoomToFeature": !!zoomTo,
                        "panToFeature": !zoomTo
                    };
                    if (_.isArray(shape)) {
                        opt.graphics = shape;
                    } else {
                        opt.graphic = shape;
                    }
                    FeatureLayerView.setExtent(opt);
                }
            });
        },
        /**
         * Get the current extent
         * @returns {external:module:esri/geometry/Extent|undefined}
         * Returns the current map extent or undefined if the map control has not been created yet.
         */
        getCurrentExtent: function() {
            if (this.mapControl)
                return this.mapControl.map.geographicExtent;
        },
        /**
         * Set the current extent.
         * @todo showPanel option is not supported yet
         * @param {Object} options
         * @param {external:module:esri/geometry/Geometry|Object} [options.geometry] Geometry object to determine
         * the extent to set.
         * @param {Array.<external:module:esri/geometry/Geometry|Object>} [options.geometries] Array of geometry objects
         * to determine the extent to set.
         * @param {external:module:esri/Graphic} [options.graphic] Graphic to determine the extent to set.
         * @param {external:module:esri/Graphic[]} [options.graphics] Array of graphics to determine the extent to set.
         * @param {Boolean} [options.showPanel] Show the panel if it is hidden, not supported yet.
         * @returns {undefined}
         */
        setCurrentExtent: function(options) {
            // TODO: This hasn't been tested yet
            var self = this;
            var extent = options.extent;
            if (!extent) {
                var graphics;
                if (options.geometry) {
                    var graphic = new Graphic({geometry: options.geometry.shape || options.geometry});
                    graphics = [graphic];
                } else if (options.geometries) {
                    graphics = _.map(options.geometries, function(geom) {
                        return new Graphic({geometry: geom});
                    });
                } else if (options.graphic) {
                    graphics = [options.graphic];
                } else if (options.graphics) {
                    graphics = options.graphics;
                }
                if (graphics) {
                    extent = graphicsUtils.graphicsExtent(graphics);
                }
            }
            // Naive input validation assumes that if the extent parameter is a valid format if it's truthy.
            // ESRI JSON format defines "empty" extent is an object with non-numeric xmin attribute.
            // Note that ESRI Map control is vulnerable to epic fail if an invalid object or empty extent is passed in, 
            // so we might want stricter validation.
            if (extent && $.isNumeric(extent.xmin)) {
                var evtData = {
                    callback: function() {
                        $.when(self.dfd).done(function() {
                            self.mapControl.map.setExtent(extent);
                        });
                    },
                    source: this
                };
                if (options && options.showPanel) {
                    /**
                     * Show the map panel.
                     * @todo This event isn't actually handled in Layout plugin yet
                     * @event module:nrm-ui/event#layout:showMapPanel
                     * @param {Object} options
                     * @param {Function} options.callback A function to call when the panel is opened
                     * @param {*} [options.source] Object to use as the "this" reference for the callback option.
                     * @param {Boolean} [options.handled] Event handler should set this to true to indicate that it has
                     * assumed responsibility for calling the callback.
                     */
                    Nrm.event.trigger("layout:showMapPanel", evtData);
                }
                if (!evtData.handled) {
                    evtData.callback.call(this);
                }
            }
        },
        /**
         * Convert a point to an extent
         * @param {external:module:esri/geometry/Point} mapPoint
         * @param {Object} [options]
         * @param {Number} [options.tolerance=2] Number of screen units to expand point.
         * @returns {external:module:esri/geometry/Extent}
         */
        pointToExtent: function(mapPoint, options) {
            var tolerance = (options && options.tolerance) || 2;
            var screenPoint = this.mapControl.map.toScreen(mapPoint);
            // ScreenPoint is relative to top-left
            var bottomLeft = new ScreenPoint();
            bottomLeft.setX(screenPoint.x - tolerance);
            bottomLeft.setY(screenPoint.y + tolerance);
            var topRight = new ScreenPoint();
            topRight.setX(screenPoint.x + tolerance);
            topRight.setY(screenPoint.y - tolerance);
            bottomLeft = this.mapControl.map.toMap(bottomLeft);
            topRight = this.mapControl.map.toMap(topRight);
            return new Extent(bottomLeft.x, bottomLeft.y,
                    topRight.x, topRight.y, this.mapControl.map.spatialReference);
        },
        /**
         * Highlight a geometry.
         * @param {Object} options
         * @param {external:module:esri/Graphic} [options.graphic] The graphic to highlight, must have an id attribute.
         * @param {external:module:esri/geometry/Geometry|Object} [options.geometry] The geometry, either this or the
         * graphic option is required.
         * @param {Object} [options.attributes] An attribute hash.
         * @param {string|Number} [options.attributes.id] The graphic id (required if using the geometry option).
         * @todo Consider adding support for "geometries" option for highlighting multiple geometries
         * @returns {undefined}
         */
        highlightActiveRow: function(options) {
            //this.clearFeatures(); // ebodin 4/10/2015 artf11676
            var id = false;
            options = options || {};
            if (options.graphic) {
                id = options.graphic.attributes && options.graphic.attributes.id;
            }
            else if (options.attributes && options.geometry) {
                id = options.attributes.id;
            }
            
            $.when(this.dfd).done(function(self) {
                options = options || {};
                var graphic, selected,  
                        prevId = self.highlightedGraphic && self.highlightedGraphic.attributes && 
                            self.highlightedGraphic.attributes.id;
                if (prevId) {
                    // remove highlight from previous feature
                    graphic = self.highlightedGraphic;
                    graphic = self.mapControl._getGraphicByID(prevId);
                    if (graphic && graphic.attributes.selected) {
                        self.mapControl.setGraphicSelection(graphic, null, {
                            highlighted: false, 
                            selected: true
                        });
                    } else if (graphic) {
                        self.mapControl.removeGraphicByID(prevId);
                    }
                    //                }
                }
                graphic = id && self.mapControl._getGraphicByID(id);
                if (!graphic) {
                    selected = false;
                    if (options.graphic) {
                        graphic = options.graphic;
                    } else if (options.geometry) {
                        var shape = self.convertExternalShape(options.geometry);
                        if (shape) {
                            graphic = new Graphic({
                                geometry: shape,
                                attributes: options.attributes
                            });
                        }
                    }
                    if (graphic) {
                        self.mapControl.addGraphic(graphic, graphic.attributes);
                    }
                } else {
                    selected = graphic.attributes && graphic.attributes.selected;
                }
                if (graphic) {
                    self.mapControl.setGraphicSelection(graphic, null, {
                        selected: !!selected,
                        highlighted: true, 
                        flash: true
                    });
                }
                /**
                 * Currently highlighted graphic.
                 * @name module:nrm-map/views/mapView#highlightedGraphic
                 * @type {external:module:esri/Graphic}
                 */
                self.highlightedGraphic = graphic;
                if (options.pan && graphic) {
                    var mapExtent = self.getCurrentExtent(), center;
                    if (mapExtent) {
                        if (graphic.geometry.x) {
                            // graphicsExtent can't handle Point geometry
                            center = graphic.geometry;
                        } else if (graphic) {
                            var extent = graphicsUtils.graphicsExtent([graphic]);
                            center = extent && extent.getCenter();
                        }
                        if (center) {
                            if (!mapExtent.contains(center))
                                self.mapControl.map.centerAt(center);
                        }
                    }
                }
            });
            return this.dfd.promise();
        },
        /**
         * Set the map cursor
         * @param {String|Object} cursor Cursor name, or object
         * @param {String} cursor.cursor Cursor name
         * @param {String} [cursor.defaultCursor] Set the default cursor to be restored by {module:module:nrm-map/views/mapView~resetCursor}
         * @returns {undefined}
         */
        setCursor: function(cursor) {
            var newCur;
            if (_.isObject(cursor)) {
                newCur = cursor.cursor;
                if (cursor.defaultCursor) {
                    this.defaultCursor = cursor.defaultCursor;
                }
            } else if (_.isString(cursor)) {
                newCur = cursor;
            } else {
                newCur = this.defaultCursor;
            }
            if (newCur) {
                // override if measuring or identifying
                    if (this.mapIdentifyView && this.mapIdentifyView.isListening) {
                        newCur = this.mapIdentifyView.options.cursor;
                    } else if (this.mapMeasureView && this.mapMeasureView.isListening) {
                        newCur = this.mapMeasureView.options.cursor;
                    }
                this.mapControl.map.setMapCursor(newCur);
            }
        },
        /**
         * Set the map cursor back to a previous value.
         * @returns {undefined}
         */
        resetCursor: function() {
            this.setCursor(this.defaultCursor);
        },
        /**
         * Context for the select tool
         * @typedef {Object} SelectionContext
         * @property {Function} [callback] Function that is called with the search window geometry.
         * @property {string} [apiKey] The context configuration key if selecting from a 
         * {@link module:nrm-map/views/featureLayerView|FeatureLayerView}.
         * @property {string} [layerKey] The unique key identifying the FeatureLayerView
         * @property {string} [path] The navigation path associated with the selection
         */
        /**
         * Activate the select tool.
         * @param {module:nrm-map/views/mapView~SelectionContext} options Options
         * @returns {undefined}
         */
        activateSelectTool: function(options) {
            $.when(this.dfd).done(function(self) {
                options = options || self.selectionContext || {};
                function activate() {
                    this.beforeActivateTool();
                    /**
                     * Selection context, only defined while select tool is active.
                     * @name module:nrm-map/views/mapView#selectionContext
                     * @type {?module:nrm-map/views/mapView~SelectionContext}
                     */
                    this.selectionContext = options;
                    this.mapControl.activateSelectionMode();
                }
                if (options.callback) {
                    activate.call(self);
                } else if (options.apiKey && self.collectionLayers) {
                    // Context-sensitive select mode, hook up the events here so that it only happens once.
                    var layerKey = options.layerKey || _.filter(options.path.split('/'), function(part, idx) {
                        return idx % 2 === 0;
                    }).join('/');
                    var layer = self.collectionLayers[layerKey]; //options.apiKey] || self.collectionLayers[options.path];
                    if (layer) {
                        activate.call(self);
                    }
                } else {
                    self.isToolActivated = true;
                    self.mapControl.activateSelectionMode();
                }
            });
        },
        /**
         * Set spatial search target and enable/disable selection mode control.
         * @param {Object} [options] If not provided will disable selection mode.
         * @param {Boolean} [options.deactivate] Force selection mode to be disabled.
         * @param {module:nrm-ui/models/application~ContextConfig} [options.context] Selection target context
         * @returns {undefined}
         */
        configureSelect: function(options) {
            $.when(this.dfd).done(function(self) {
                //console.log("configureSelect editMode,options", Nrm.app.editMode, options, this.mapControl);
                if (Nrm.app.editMode || !options || !options.context || !Nrm.app.isSpatialSearchEnabled(options.context)) {
                    self.mapControl.deactivateSelectionMode();
                    if (options && options.deactivate) {
                        self.mapControl.navButtonBar && self.mapControl.navButtonBar.enableButton("panmode", true);
                    } else {
                        self.selectionContext = null;
                        self.mapControl.navButtonBar && self.mapControl.navButtonBar.enableButton("selectmode", false);
                    }
                } else {
                    self.selectionContext = options;
                    self.mapControl.navButtonBar && self.mapControl.navButtonBar.enableButton("selectmode", true);
                }
            });
        },
        /**
         * Handle the results of the select tool.
         * @param {external:module:esri/geometry/Extent} geometry
         * @returns {Boolean|undefined}
         * Returns true if the selection was handled by a collection layer, otherwise undefined.
         */
        onSelection: function(geometry) {
            var options = this.selectionContext;
            if (options && geometry && geometry.type === "extent") {
                // Context-sensitive select mode, hook up the events here so that it only happens once.
                //Nrm.event.trigger("map:deactivateTool");
                //this.selectionContext = null;
                if (options.callback) {
                    return options.callback.call(options.source || this, geometry, options);
                } else {

                    var layerKey = options.layerKey || _.filter(options.path.split('/'), function(part, idx) {
                        return idx % 2 === 0;
                    }).join('/');
                    var layer = this.collectionLayers[layerKey]; //options.apiKey] || this.collectionLayers[options.path];
                    if (layer) {
                        var extent = this.convertToGeographic(geometry);
                        layer.selectByExtent(extent, options);
                        console.info("onSelectionEnd");
                        return true;
                    } else {
                        // cancel select tool activation?
                    }
                }
            }
        },
        /**
         * Set or unset indicator for tools listening for selections.
         * @param {Object} options
         * @param {String} options.id Name of tool.
         * @param {Boolean} [options.handling=true] Indicate whether tool is handling or not.
         * @returns {undefined}
         */
        declareSelectionHandler: function(options) {
            if (!options.handling) {
                this.selectionHandlersDeclared = _.without(this.selectionHandlersDeclared, options.id);
            } else {
                this.selectionHandlersDeclared = _.union(this.selectionHandlersDeclared, [options.id]);
            }
        },
        /**
         * @deprecated This function doesn't do anything and may be removed in a future version.
         * @param {Object} extent
         * @returns {undefined}
         */
        selectByExtent: function(extent) {
            console.warn("mapView.selectByExtent deprecated method executed", arguments);
        },
        /**
         * Activate the geometry edit tool.
         * @param {external:module:esri/geometry/Geometry|Object} geometry The geometry to edit
         * @param {Object} attributes The attributes to set on the graphic
         * @param {options} options
         * @param {Boolean} [options.zoomTo=true] Zoom to the geometry to edit.
         * @param {Boolean} [options.select=true] Add selection graphic for the geometry to edit.
         * @param {Boolean} [options.sticky=true] Sets the "sticky" edit graphic, which is not removed if the user 
         * clicks the map outside of the geometry to edit.
         * @param {Boolean} [options.disableSelection=true] Disable selection on all layers.
         * @returns {undefined}
         */
        activateEditMode: function(geometry, attributes, options) {
            $.when(this.dfd).done(function(self) {
                var defaultOptions = {zoomTo: true, select: true, disableSelection: true, sticky: true},
                    clickHandler_connect;
                self.beforeActivateTool();
                // LW: Options needed to be added to mapControl.activateEditMode as a parameter so that it could give
                // MapButtonBar access to the nrmShapeEditor's instance of the UndoManager
                
                // Add current geometry type to the options so that we can decide on buttons that are visible when editing begins
                // If no geometry type is set, set one. Why this wouldn't be already set I have no idea. But debugging indicates it is frequently not.
                if (geometry && geometry.type) {
                    options.geometryType = geometry.type;
                } else {
                    options.geometryType = Nrm.app.getSpatialType({ shape: geometry }, null, true);
                }
                
                self.mapControl.activateEditMode(options);
                
                options = $.extend({}, defaultOptions, options);
                
                self._addSingleGraphic(geometry, attributes, options);
                
                if (options.disableSelection)
                    self.setAllLayersSelectable(false);
                // deactivate edit toolbar (i.e. stop editing) when user clicks outside the map
                function clickHandler(e) {
                    if (!e.target || ($(e.target).parents("#" + self.id + ',div.ui-pnotify').length === 0)) {
                        $("*").off("click.nrmDeactivateEditToolbar");
                        connect.disconnect(clickHandler_connect);
                        if (e.target) {// if e.target is undefined, editToolbar.deactivate is the source of the event
                            self._deactivateEditMode();
                        }
                    }
                }
                setTimeout(function() { // wait a sec to avoid catching the element that launched the tool
                    $("*").on("click.nrmDeactivateEditToolbar", clickHandler);
                    clickHandler_connect = connect.connect(self.mapControl.editToolbar, "onDeactivate", clickHandler);
                });
            });
        },
        /**
         * Activate the Draw tool to sketch a geometry
         * @param {string} geomType Geometry type, supported values include "point", "multipoint", "line", "polygon", 
         * and "rectangle"
         * @param {Object} attributes Attributes to set on the graphic
         * @param {Object} options
         * @param {Boolean} [options.disableSelection=true] Disable selection on all layers.
         * @param {Boolean} [options.restoreStickyGraphic=true] Restore current edit graphic when draw mode is deactivated.
         * @returns {external:module:jquery~Promise}
         * In case the method is called during initialization, the returned promise may resolve asynchronously.
         */
        activateDrawMode: function(geomType, attributes, options) {
            var defaultOptions = {disableSelection: true, restoreStickyGraphic: true};
            var dfd = new $.Deferred();
            var self = this;
            var evtData = {
                callback: function() {
                    $.when(self.dfd).done(function() {
                        var geometryType;

                        switch (geomType.toLowerCase()) {
                            case "point":
                                geometryType = Draw.POINT;
                                break;
                            case "multipoint":
                                geometryType = Draw.MULTI_POINT;
                                break;
                            case "line":
                                geometryType = Draw.POLYLINE;
                                break;
                            case "polygon":
                                geometryType = Draw.POLYGON;
                                break;
                            case "rectangle":
                                geometryType = Draw.RECTANGLE;
                        }
                        if (geometryType) {
                            options = $.extend({}, defaultOptions, options);

                            self.beforeActivateTool();
                            if (attributes.appendTo === undefined) {// ebodin 1/7/2015
                                self.mapControl.removeAllGraphics();
                                self._setStickyGraphic({
                                    previous: true, 
                                    restore: !!options.restoreStickyGraphic
                                });
                            }
                            self.mapControl.activateDrawMode(geometryType, attributes);
                            if (options.disableSelection) {
                                self.setAllLayersSelectable(false);
                            }
                        }
                        dfd.resolve();
                    }).fail(function() {
                        dfd.reject();
                    });
                },
                source: this
            };
            // TODO: implement this event handler in the NrmLayout plugin.
            Nrm.event.trigger("layout:showMapPanel", evtData);
            if (!evtData.handled) {
                evtData.callback.call(this);
            }
            return dfd.promise();
        },
        /**
         * Deactivate the draw mode
         * @returns {undefined}
         */
        deactivateDrawMode: function() {
            this.mapControl.deactivateDrawMode();
            if (this.previousStickyGraphic && this.restorePreviousStickyGraphic) {
                // restore original "stickyGraphic" when deactivating draw mode
                this.clearFeatures({restoreStickyGraphic: true});
            }
        },
        /**
         * Called internally before activating a tool to record and clear previous state.
         * @returns {undefined}
         */
        beforeActivateTool: function(options) {
            Nrm.event.trigger("map:beforeActivateTool");
            this._deactivateEditMode({stopPropagation: true});
            /**
             * Indicates whether a tool is activated.
             * @type {Boolean}
             */
            this.isToolActivated = true;
        },
        /**
         * Record when a select/create/edit tool is deactivated.
         * @returns {undefined}
         */
        onDeactivateTool: function() {
            this.isToolActivated = false;
        },
        /**
         * Deactivate the edit tool.
         * @param {Object} options
         * @param {Boolean} [options.clearFeatures=false] Remove graphics 
         * @param {string|Number} [options.id] Only remove the graphic with matching id.
         * @returns {external:module:jquery~Promise}
         * In case the method is called during initialization, the returned promise may resolve asynchronously.
         */
        disableEditing: function(options) {
            $.when(this.dfd).done(function(self) {
                self._deactivateEditMode();
                if (options && options.clearFeatures)
                    self._clearFeatures(options);
            });
            return this.dfd.promise();
        },
        /**
         * For internal use only, deactivate the active tool and clear related state.
         * @param {Object} options
         * @param {Boolean} [options.stopPropagation=false] Do not restore previous state.
         * @returns {undefined}
         */
        _deactivateEditMode: function(options) {
            options = options || {};
            // Note: I'm not making any assumptions about which toolbar to deactivate.
            //  I tried keeping track of a flag to handle this, but it became difficult to manage.
            //  Also, didn't find a property of the toolbar itself indicating active status.

            //this.selectionContext = null;

            if (this.selectionHandler) {
                connect.disconnect(this.selectionHandler);
                this.selectionHandler = null;
            }
            if (this.activeToolHandler) {
                this.activeToolHandler.remove();
                this.activeToolHandler = null;
            }
            if (this.activeTool) {
                this.activeTool.deactivate();
                this.activeTool = null;
                this.resetCursor();
            }
            
            // TODO: fix in map control:
            // Deactivating the edit mode needs to set the "editMode" flag AND deactivate actual edit toolbar.
            this.mapControl.deactivateEditMode();
            this.mapControl._deactivateEditingToolbar();
            this.deactivateDrawMode();

            // remove temporary layers
            if (this.temporaryLayers) {
                for (var i = 0; i < this.temporaryLayers.length; i++) {
                    this.mapControl.removeDynamicMapLayer(this.temporaryLayers[i]);
                }
            }
            /**
             * List of temporary layers
             * @type {external:module:esri/layers/FeatureLayer[]}
             */
            this.temporaryLayers = [];

            if (!options.stopPropagation) {
                Nrm.event.trigger("map:deactivateTool");
            }
        },
        /**
         * Clear graphics.
         * @param {Object} options
         * @param {string|Number} [options.id] Only remove the graphic with matching id.
         * @param {boolean} [options.restoreStickyGraphic=false] Restore the sticky graphic after clearing all graphics.
         * @returns {external:module:jquery~Promise}
         * In case the method is called during initialization, the returned promise may resolve asynchronously.
         */
        clearFeatures: function(options) {
            $.when(this.dfd).done(function(self) {
                self._clearFeatures(options);
            });
            return this.dfd.promise();
        },
        /**
         * Internal implementation of {@link module:nrm-map/views/mapView#clearFeatures}, do not use externally.
         * @param {Object} options
         * @returns {undefined}
         */
        _clearFeatures: function(options) {
            if (options && options.id) {
                this.mapControl.removeGraphicByID(options.id);
            } else {
                this.mapControl.removeAllGraphics();
            }
            if (options && options.restoreStickyGraphic) {
                if (!this.stickyGraphic && this.previousStickyGraphic) {
                    this._setStickyGraphic({graphic: this.previousStickyGraphic});
                }
                if (this.stickyGraphic && this.stickyGraphic !== true) {
                    this.mapControl.addGraphic(this.stickyGraphic, this.stickyGraphic.attributes || {});
                }
            } else {
                this._setStickyGraphic({graphic:null});
            }
        },
        /**
         * Set the "sticky" edit graphic, for internal use only
         * @param {object} options
         * @param {external:module:esri/Graphic} [options.graphic] The graphic reference to set if the "previous" option 
         * is not true
         * @param {boolean} [options.previous=false] Set the previous sticky graphic to restore if current tool is 
         * cancelled
         * @param {boolean} [options.restore=false] Restore the previous sticky graphic when draw mode is deactivated
         * @returns {undefined}
         */
        _setStickyGraphic: function(options) {
            if (options.previous) {
                if (this.stickyGraphic && this.stickyGraphic !== true) {
                    this.restorePreviousStickyGraphic = !!(options.restore);
                    this.previousStickyGraphic = this.stickyGraphic;
                    this.stickyGraphic = null;
                }
            } else {
                /**
                 * Indicates whether we need to restore previous sticky graphic when deactivating draw mode
                 * @type {boolean}
                 */
                this.restorePreviousStickyGraphic = false;
                /**
                 * Previous edit graphic to restore if current operation is cancelled
                 * @type {external:module:esri/Graphic}
                 */
                this.previousStickyGraphic = null;
                /**
                 * Edit graphic to preserve when graphics are cleared.
                 * @type {external:module:esri/Graphic|Boolean}
                 */
                this.stickyGraphic = options.graphic;
            }
        },
        /**
         * Add a graphic to the map
         * @param {external:module:esri/geometry/Geometry|Object} esriJson Geometry object, usually a plain object.
         * @param {Object} attributes Attributes to set on the graphic
         * @param {Object} options
         * @param {Boolean} [options.zoomTo=false] Zoom to the geometry to edit.
         * @param {Boolean} [options.select=false] Add selection graphic for the geometry to edit.
         * @param {Boolean} [options.sticky=false] Sets the "sticky" edit graphic, which is not removed if the user 
         * clicks the map outside of the geometry to edit.
         * @returns {external:module:jquery~Promise}
         * In case the method is called during initialization, the returned promise may resolve asynchronously.
         */
        addSingleGraphic: function(esriJson, attributes, options) {
            $.when(this.dfd).done(function(self) {
                options = options || {};
                self._addSingleGraphic(esriJson, attributes, options);
            });
            return this.dfd.promise();
        },
        /**
         * Internal implementation of {@link module:nrm-map/views/mapView#addSingleGraphic}, do not use externally.
         * @param {Object} esriJson
         * @param {Object} attributes
         * @param {Object} options
         * @returns {undefined}
         */
        _addSingleGraphic: function(esriJson, attributes, options) {
            esriJson = this.convertExternalShape(esriJson);
            this.mapControl.removeAllGraphics();
            attributes = attributes || {};
            options = options || {};
            var id = attributes.id;
            if (id) {
                this.mapControl.removeGraphicByID(id);
            }
            if (!esriJson) {
                if(this.mapControl.options.editMode) {
                    this.mapControl._deactivateEditingToolbar();
                    this.mapControl.mapButtonBar.show();
                }
                this._setStickyGraphic({graphic: null});
                return;
            }
            var graphic = new Graphic({
                geometry: esriJson,
                attributes: attributes
            });
            this.mapControl.addGraphic(graphic, attributes);
            if (options.zoomTo) {
                if (_.isObject(options.zoomTo)) {
                    this.mapControl._zoomTo(_.extend({graphic: graphic}, options.zoomTo));
                } else {
                    this.mapControl._zoomTo({graphic: graphic});
                }
            }
            if (options.select && id) {
                // Note: tried using selectGraphic method here but it didn't work properly with edit mode.
                options.selected = true;
                this.mapControl.selectGraphicByID(id, options);
            }
            if (options.sticky || this.stickyGraphic) {
                this._setStickyGraphic({graphic: graphic});
            }

        },
        /**
         * Convert an shape object or string that might have incorrect or undefined spatial reference.
         * @param {string|Object} esriJson The JSON string or plain object
         * @param {Boolean} [toEsriType=false] Indicates whether the object should be returned as an Geometry object if 
         * true, or return as plain object if false.
         * @returns {Object|external:module:esri/geometry/Geometry|Boolean|undefined}
         * Returns plain object or Geometry object with spatialReference property set, or false if the string cannot be 
         * parsed, or original value if it is falsey.
         */
        convertExternalShape: function(esriJson, toEsriType) {
            if (_.isString(esriJson)) {
                if (esriJson) {
                    try {
                        esriJson = JSON.parse(esriJson);
                    } catch (error) {
                        console.info("JSON parse error: " + error);
                        esriJson = false;
                    }
                } else {
                    esriJson = null;
                }
            } else if (esriJson) {
                esriJson = $.extend(true, {}, esriJson);
            }
            if (toEsriType && esriJson) {
                if (!(esriJson instanceof Geometry)) {
                    esriJson = this.mapControl.shapeToGeometry(esriJson);
                }
                if (esriJson.spatialReference && esriJson.spatialReference.wkid === 4269) {
                    esriJson.setSpatialReference(this.mapControl.map.geographicExtent.spatialReference);
                }
            } else if (esriJson && esriJson.spatialReference) {
                if (this.options.editSr === 4326 && esriJson.spatialReference.wkid === 4269)
                    esriJson.spatialReference.wkid = 4326;
            } else if (esriJson) {
                esriJson.spatialReference = {wkid: this.options.editSr};
            }
            return esriJson;
        },
        /**
         * Add or remove selected symbol on a graphic, this method is intended for use with tables displaying data in a 
         * dynamic map service.
         * @param {string|Number} id The graphic id which should match an existing graphic already added.
         * @param {Boolean} [selected=true]
         * @returns {external:module:jquery~Promise}
         * In case the method is called during initialization, the returned promise may resolve asynchronously.
         */
        externalFeatureSelection: function(id, selected) {
            $.when(this.dfd).done(function(self) {
                if (selected) {
                    self.mapControl.selectGraphicByID(id, {selected: true});
                }
                else {
                    self.mapControl.deselectGraphicByID(id, {selected: false});
                }
            });
            return this.dfd.promise();
        },
        /**
         * Add or remove highlight symbol on a graphic, this method is intended for use with tables displaying data in 
         * a dynamic map service.
         * @param {string|Number} id The graphic id which should match an existing graphic already added.
         * @param {Boolean} highlighted
         * @returns {external:module:jquery~Promise}
         * In case the method is called during initialization, the returned promise may resolve asynchronously.
         */
        externalFeatureHighlighted: function(id, highlighted) {
            $.when(this.dfd).done(function(self) {
                if (highlighted) {
                    self.mapControl.selectGraphicByID(id, {highlighted: true});
                }
                else {
                    self.mapControl.deselectGraphicByID(id, {highlighted: false});
                }
            });
            return this.dfd.promise();
        },
        /**
         * Refresh the map
         * @deprecated This was an old way of dealing with the problem of extent getting messed up when the map panel 
         * is hidden or resized
         * @param {Object} options
         * @returns {undefined}
         */
        refreshMap: function(options) {
            var self = this;
            var evtData = {
                callback: function() {
                    if (self.isLoaded()) {
                        var currentLevel = self.mapControl.map.getLevel();
                        self.mapControl.map.setLevel(0);
                        self.mapControl.map.setLevel(currentLevel);
                    }
                },
                source: this
            };
            if (options && options.showPanel) {
                // note that this will try to show panel even if extent parameter is falsy or empty.
                Nrm.event.trigger("layout:showMapPanel", evtData);
            }
            if (!evtData.handled) {
                evtData.callback.call(this);
            }
        },
        /**
         * Add or reset a {@link module:nrm-map/views/featureLayerView|FeatureLayerView} aka "collection layer" 
         * @param {string} key Unique key identifying the layer.
         * @param {external:module:backbone.Collection} collection The collection to bind to the layer.
         * @param {module:nrm-map/views/featureLayerView~LayerConfig} options
         * @param {module:nrm-ui/models/application~ContextConfig} [options.context] - context configuration
         * @param {string} [options.path] - The navigation path associated with the view.
         * @returns {module:nrm-map/views/featureLayerView}
         */
        addCollectionLayer: function(key, collection, options) {
            /**
             * Internal list of FeatureLayerView instances.
             * @type {Object.<string,module:nrm-map/views/featureLayerView>}
             */
            this.collectionLayers = this.collectionLayers || {};
            var lyrView; // = this.collectionLayers[key];
            //if (lyrView) {
            this.removeCollectionLayer(key); //lyrView.onReset(collection);
            //} else {
            var opt = {
                collection: collection,
                layerKey: key
            };
            if (this.mapControl)
                opt.mapControl = this.mapControl;
            lyrView = this.collectionLayers[key] = new FeatureLayerView($.extend({}, options, opt));
            lyrView.render();
            return lyrView;
            //}
        },
        /**
         * Remove a {@link module:nrm-map/views/featureLayerView|FeatureLayerView} aka "collection layer" 
         * @param {string} key Unique key identifying the layer.
         * @returns {undefined}
         */
        removeCollectionLayer: function(key) {
            var layerView = this.collectionLayers && this.collectionLayers[key];
            if (layerView) {
                if (this.collectionLayerPreserveKeys.indexOf(key) === -1) {
                    layerView.remove();
                    delete this.collectionLayers[key];
                    this.clearFeatures({restoreStickyGraphic:true});
                } else {
                    this.setCollectionLayerVisible(key, false);
                }
            }
        },
        /**
         * Remove all {@link module:nrm-map/views/featureLayerView|FeatureLayerView} instances
         * @returns {undefined}
         */
        removeAllCollectionLayers: function() {
            if (this.collectionLayers) {
                _.each(this.collectionLayers, function(layerView) {
                    layerView.remove();
                });
                this.collectionLayers = {};
            }
        },
        /**
         * Set visibility of one or more {@link module:nrm-map/views/featureLayerView|FeatureLayerView} aka "collection 
         * layer"
         * @param {string|string[]} layerKeys A unique key identifying the layer, or an array of keys
         * @param {Boolean} visible New visibility setting
         * @param {Object} [options]
         * @param {Boolean} [options.otherLayerVisible] If specified, indicates the visibility to set on other layers.
         * @returns {undefined}
         */
        setCollectionLayerVisible: function(layerKeys, visible, options) {
            if (!this.collectionLayers)
                return;
            if (!_.isArray(layerKeys))
                layerKeys = [layerKeys];
            _.each(this.collectionLayers, function(layerView, key) {
                if ($.inArray(key, layerKeys) > -1) {
                    layerView.setVisibility(visible);
                } else if (options && options.otherLayersVisible !== undefined) {
                    layerView.setVisibility(options.otherLayersVisible);
                }
            });
        },
        /**
         * Show or hide all {@link module:nrm-map/views/featureLayerView|FeatureLayerView} instances
         * @param {Boolean} visible New visibility setting
         * @returns {undefined}
         */
        setAllLayersVisible: function(visible) {
            if (!this.collectionLayers)
                return;
            _.each(this.collectionLayers, function(layerView) {
                layerView.setVisibility(visible);
            });
        },
        /**
         * Enable or disable selection of one or more {@link module:nrm-map/views/featureLayerView|FeatureLayerView} 
         * aka "collection layer"
         * @param {string|string[]} layerKeys A unique key identifying the layer, or an array of keys
         * @param {Boolean} selectable Indicates whether selection should be enabled or disabled.
         * @param {Object} [options]
         * @param {Boolean} [options.otherLayerVisible] If specified, indicates whether selection should be enabled or
         * disabled on other layers.
         * @returns {undefined}
         */
        setCollectionLayerSelectable: function(layerKeys, selectable, options) {
            if (!this.collectionLayers)
                return;
            if (!_.isArray(layerKeys))
                layerKeys = [layerKeys];
            _.each(this.collectionLayers, function(layerView, key) {
                if ($.inArray(key, layerKeys) > -1) {
                    layerView.setSelectable(selectable);
                } else if (options && options.otherLayersSelectable !== undefined) {
                    layerView.setSelectable(options.otherLayersSelectable);
                }
            });
        },
        /**
         * Enable or disable selection on all {@link module:nrm-map/views/featureLayerView|FeatureLayerView} instances
         * @param {Boolean} selectable Indicates whether selection should be enabled or disabled.
         * @returns {undefined}
         */
        setAllLayersSelectable: function(selectable) {
            if (!this.collectionLayers)
                return;
            _.each(this.collectionLayers, function(layerView) {
                layerView.setSelectable(selectable);
            });
        },
        /**
         * Zoom to a {@link module:nrm-map/views/featureLayerView|FeatureLayerView} aka "collection layer".
         * @param {string} key A unique key identifying the layer
         * @param {Object} options Options to pass to the FeatureLayerView.
         * @see {@link module:nrm-map/views/featureLayerView#zoomTo|FeatureLayerView#zoomTo} for the supported options.
         * @returns {undefined}
         */
        zoomToCollectionLayer: function(key, options) {
            if (!this.collectionLayers)
                return;
            var layerView = this.collectionLayers[key];
            if (layerView) {
                layerView.zoomTo(options);
            }
        },
        /**
         * Convert one or more {@link module:nrm-map/views/featureLayerView|FeatureLayerView} to a JSON representation
         * @param {string|string[]} [layerKeys] A unique key identifying the layer, or an array of keys, or all layers 
         * if not specified.
         * @returns {Object|undefined}
         * Returns a plain object JSON representation, or undefined if no collection layers have been added.
         * @see {@link module:nrm-map/views/featureLayerView#zoomTo|FeatureLayerView#layerToJSON} for more information 
         * on the return type.
         */
        layerToJSON: function(layerKeys) {
            if (!this.collectionLayers)
                return;
            if (layerKeys === undefined)
                layerKeys = _.keys(this.collectionLayers);
            else if (!_.isArray(layerKeys))
                layerKeys = [layerKeys];
            var result = {};
            _.each(this.collectionLayers, function(layerView, key) {
                if ($.inArray(key, layerKeys) > -1) {
                    result[key] = layerView.layerToJSON();
                }
            });
            return result;
        },
        /**
         * For internal use, creates a {@link module:nrm-map/views/featureLayerView|FeatureLayerView} for each spatial 
         * root node in the navigation tree.
         * @returns {external:module:jquery~Promise}
         * Returned promise is resolved when all root collections have been added.
         */
        _initContext: function() {
            var self = this;
            this.collectionLayerPreserveKeys = [];
            if (Nrm.app) {
                var dfd = new $.Deferred();
                var onFail = function() {
                    dfd.reject();
                };
                $.when(Nrm.app.getContext()).done(function(ctx) {
                    _.each(ctx, function(t, key) {
                        var eachDfd = [];
                        if (t.topLevel) {
                            if (Nrm.app.isSpatialContext(t)) {
                                eachDfd.push($.when(Nrm.app.getCollection(t)).done(function(collection) {
                                    self.collectionLayerPreserveKeys.push(key);
                                    self.addCollectionLayer(key, collection, {context: t, path: t.apiKey});
                                }));
                            }
                        }
                        $.when.apply($, eachDfd).done(function() {
                            dfd.resolve();
                        }).fail(onFail);
                    });
                }).fail(onFail);
                return dfd.promise();
            }
        },
        /**
         * Convert from web mercator projection to geographic (WGS 84), or return original geometry if it is not in the
         * web mercator projection.  
         * @param {external:module:esri/geometry/Geometry} geometry The geometry to convert
         * @returns {external:module:esri/geometry/Geometry}
         * Converted or original geometry.
         */
        convertToGeographic: function(geometry) {
            var wkid = geometry.spatialReference.wkid;
            if (wkid === 102100 || wkid === 102113 || wkid === 3857) {
                return prjUtils.webMercatorToGeographic(geometry);
            } else {
                // assume geographic because the alternative is too complex for this usage...
                return geometry;
            }
        },
        /**
         * Convert a geometry object from geographic to web mercator projection, 
         * or return original geometry if it is not in a supported geographic coordinate system.  
         * @param {external:module:esri/geometry/Geometry|Object} geometry The geometry to convert, may be a plain 
         * object conforming to ESRI JSON geometry structure
         * @returns {external:module:esri/geometry/Geometry}
         * Converted or original geometry.
         */
        convertToWebMercator: function(geometry) {
            var result = this.convertExternalShape(geometry, true),
                    wkid = result && result.spatialReference.wkid;
            if (wkid === 4326 || wkid === 4269) {
                return prjUtils.geographicToWebMercator(result);
            } else {
                // assume it is already web mercator because the alternative is too complex for this usage...
                return result;
            }
        },
        /**
         * Render the {@link module:nrm-map/views/mapTocView|MapTocView}
         * @param {Boolean} [reload=false] Force reload of the TOC view if it is already rendered.
         * @returns {undefined}
         */
        renderTOC: function(reload) {
            if (this.mapTabsView) {
                this.mapTabsView.remove();
                this.mapTabsView = null;
            }
            if (!this.mapTabsView) {
                /**
                 * The Map Tabs view.
                 * @type {?module:nrm-map/views/mapTabsView}
                 */
                this.mapTabsView = new MapTabsView($.extend(_.omit(this.options, function(value) {
                    return !_.isFunction(value);
                }), {
                    mapControl: this.mapControl
                }));
                reload = true;
            } else if (reload) {
                this.mapTabsView.remove();
            }
            if (reload) {
                this.mapTabsView.render();
                $("#" + this.options.accordionId).append(this.mapTabsView.$el);
            }
        },
        /**
         * Activate a tool to add a part to a geometry.
         * @param {Object} options
         * @param {external:module:esri/geometry/Geometry|Object} options.geometry The geometry object
         * @param {Object} options.attributes Attributes to set on the graphic
         * @returns {undefined}
         * @see {@link module:nrm-map/views/mapView#activateDrawMode|activateDrawMode} for more options.        
         */
        addPart: function(options) {
            var shapeType, oldShape;
            var shape = options.geometry; // Nrm.app.getModelVal(options.model, options.prop);
            if (shape.x) {
                shapeType = "point";
                oldShape = new Point(shape);
            } else if (shape.points) {
                shapeType = "point"; // if this is multipoint the draw tool gets weird
                oldShape = new Multipoint(shape);
            } else if (shape.paths) {
                shapeType = "line";
                oldShape = new Polyline(shape);
            } else if (shape.rings) {
                shapeType = "polygon";
                oldShape = new Polygon(shape);
            }
            oldShape = prjUtils.geographicToWebMercator(oldShape);
            options.attributes.appendTo = oldShape;
            options.attributes.shapeType = shapeType;
            this.activateDrawMode(shapeType, options.attributes, options);
        },
        /**
         * Activate a tool to delete a part from a geometry.
         * @param {Object} options
         * @param {external:module:esri/geometry/Geometry|Object} options.geometry The geometry object
         * @param {Object} options.attributes Attributes to set on the graphic
         * @returns {undefined}
         */
        deletePart: function(options) {
            // Replaced _deactivateEditMode with beforeActivateTool, and moved below the validation logic which might 
            // cancel activation.
            var oldShape;
            var shape = options.geometry; //Nrm.app.getModelVal(options.model, options.prop);
            if (shape.x) {
                //oldShape = new Point(shape);
                // not supported for single points?
                MessageBox('Cannot delete part of a single point; use <i>Clear shape</i> instead.');
                return;
            } else if (shape.points) {
                oldShape = new Multipoint(shape);
            } else if (shape.paths) {
                oldShape = new Polyline(shape);
            } else if (shape.rings) {
                oldShape = new Polygon(shape);
            }
            oldShape = prjUtils.geographicToWebMercator(oldShape);
            var that = this;

            this.beforeActivateTool();

            // get a point from the user
            /**
             * A {https://developers.arcgis.com/javascript/3/jsapi/draw-amd.html|Draw} tool maintained by this view for 
             * certain operations.
             * @name module:nrm-map/views/mapView#activeTool
             * @type {?external:module:esri/toolbars/draw}
             */
            var toolbar = this.activeTool = new Draw(this.mapControl.map, {
                showTooltips: false,
                drawTime: 90
            });
            /**
             * Maintains a reference to an event handler so that it can be removed later.
             * @type {Object}
             */
            this.activeToolHandler = toolbar.on("draw-end", function(evt) {
                that.resetCursor();
                toolbar.deactivate();
                var point = evt.geometry;
                var ext = that.pointToExtent(point);
                var i, j, part, modified = false;
                switch (oldShape.type) {
                    case "point":
                        ext = ext.expand(2);
                        if (ext.contains(oldShape)) {
                            oldShape = null;
                            modified = true;
                        }
                        break;
                    case "multipoint":
                        var pt;
                        ext = ext.expand(2);
                        for (i = 0; i < oldShape.points.length; i++) {
                            pt = new Point(oldShape.points[i], ext.spatialReference);
                            if (ext.contains(pt)) {
                                oldShape.removePoint(i);
                                modified = true;
                                break;
                            }
                        }
                        break;
                    case "polyline":
                        // for each path, make it a polygon
                        var path, newPath = new Array();
                        for (i = 0; i < oldShape.paths.length; i++) {
                            path = oldShape.paths[i];
                            for (j = 0; j < path.length; j++) {
                                if (j === 0 || (path[j][0] !== path[j - 1][0] && path[j][1] !== path[j - 1][1])) // in IE the last two points of a path are duplicates!?!
                                    newPath.push(path[j]);
                            }
                            // if it's a two-point line, add a third to give it some area
                            if (newPath.length === 2) {
                                newPath.push([path[0][0] * 1.00001, path[0][1] * 1.00001]);
                            }
                            newPath.push(path[0]); // close the polygon
                            part = new Polygon(newPath);
                            if (part.contains(ext.getCenter()) ||
                                    part.contains(new Point(ext.xmax, ext.ymax)) ||
                                    part.contains(new Point(ext.xmin, ext.ymax)) ||
                                    part.contains(new Point(ext.xmax, ext.ymin)) ||
                                    part.contains(new Point(ext.xmin, ext.ymin))
                                    )
                            {
                                oldShape.removePath(i);
                                modified = true;
                                break;
                            }
                        }
                        break;
                    case "polygon":
                        //for (i = 0; i < oldShape.rings.length; i++) {
                        // internal polygons seem to have higher indexes, so loop backward
                        //for (i = oldShape.rings.length - 1; i > -1; i--) {
                        //for (i = 0; i < oldShape.rings.length; i++) {
                        // Actually, assumption about index order isn't true.
                        // I think we'll have to find all polys under the point and
                        // delete the smallest one.
                        var smallestPart, smallestPartIndex;
                        for (i = 0; i < oldShape.rings.length; i++) {
                            var ring, moveOn = false;
                            part = new Polygon(oldShape.rings[i]);
                            if (part.contains(ext.getCenter()) ||
                                    part.contains(new Point(ext.xmax, ext.ymax)) ||
                                    part.contains(new Point(ext.xmin, ext.ymax)) ||
                                    part.contains(new Point(ext.xmax, ext.ymin)) ||
                                    part.contains(new Point(ext.xmin, ext.ymin))
                                    )
                            {
                                if (smallestPart === undefined) {
                                    moveOn = false;
                                } else {
                                    ring = part.rings[0];
                                    for (j = 0; j < ring.length; j++) {
                                        if (!smallestPart.contains(new Point(ring[j]))) {
                                            moveOn = true;
                                            break;
                                        }
                                    }
                                }
                                if (!moveOn) {
                                    smallestPart = part;
                                    smallestPartIndex = i;
                                    modified = true;
                                }
                            }
                        }
                        if (modified) {
                            oldShape.removeRing(smallestPartIndex);
                        }
                        break;
                }
                if (modified) {
                    that._clearFeatures();
                    oldShape = prjUtils.webMercatorToGeographic(oldShape);
                    Nrm.event.trigger("map:endDraw", {geometry: oldShape, attributes: options.attributes});
                } else {
                    Nrm.event.trigger("map:deactivateTool");
                }
            });
            that.setCursor("crosshair");
            toolbar.activate(Draw.POINT);
        },
        /**
         * Create a backbone collection from a layer
         * @param {module:esri/layers/FeatureLayer} layer
         * @param {object} [options]
         * @returns {Backbone.Collection}
         */
        layerToCollection: function(layer, options) {
            options = options || {};
            var modelOptions = _.pick(options, "idAttribute"),
                Model = Backbone.Model.extend(modelOptions),
                Collection = Backbone.Collection.extend({model: Model}),
                collection = new Collection();
                
            _.each(layer.graphics, function(graphic){
                var m = new Model(graphic.attributes);
                m.set("geometry", graphic.geometry);
                collection.add(m);
            });
            return collection;
        },
        /**
         * Import from a shapefile
         * @param {Object} options Options that will be passed to the "map:endDraw" event when the user selects a 
         * feature to import
         * @param {Object} options.attributes
         * @param {string} options.attributes.elemId Element id of the input field.
         * @param {string[]} [options.attributes.geometryTypes] Optionally restrict to a list of geometry types.
         * {@link module:nrm-map/nrmShapeEditor|nrmShapeEditor} input field.
         * @returns {undefined}
         */
        importShapefile: function(options) {
            var mapControl = this.mapControl;
            var self = this,
                gTypes = options.attributes.geometryTypes ? _.map(options.attributes.geometryTypes, function(elem){
                        return elem.replace("esriGeometry","").toUpperCase();
                    }) : false;
            var callback = function(data) {
                if (data && data.layer) {
                    var gType = data.layer.geometryType.replace("esriGeometry","").toUpperCase().replace("POLYLINE", "LINE");
                    if (gTypes && _.indexOf(gTypes, gType) === -1) {
                        MessageBox("Shapefile cannot be imported because it has " + gType + " geometry, " +
                            "but this field supports only " + gTypes.join(", ") + " geometry.",
                            {type: "notice", title: "Import from Shapefile"});
                        return;
                    }
                    self.beforeActivateTool();
                    self.removeTemporaryLayers();
                    var collection, lyrView, layer;
                    try {
                        collection = self.layerToCollection(data.layer, {idAttribute: "NRMINDEX"});
                        lyrView = self.addCollectionLayer("ImportShapefile", collection, {
                                fields: data.layer.fields,
                                context: {
                                    alias: "ImportShapefile",
                                    caption: "Import from Shapefile",
                                    collection: collection,
                                    shapeAttr: "geometry"
                                }
                            });
                        
                        // adding the collection layer will remove all graphics
                        // we do not want to restore the "stickyGraphic" until FeatureListView OK or Cancel
                        // equivalent to what happens in the call to activateDrawMode in copyFeature
                        self._setStickyGraphic({previous: true});
                        layer = lyrView.layers[_.keys(lyrView.layers)[0]].layer;
                        mapControl._zoomTo({graphics: layer.graphics});
                        layer.importOptions = options;
                        layer.nrmOptions = _.extend(layer.nrmOptions || {}, {elemId: options.attributes.elemId});
                    } catch (error) {
                        layer = null;
                        lyrView = null;
                        collection = null;
                        var moreMsg = (error.message || error.description || ""),
                            msg = "Error creating layer";
                        if (moreMsg.toLowerCase().indexOf("out of memory") > -1) {
                            msg += ":\n" + mapControl.options.messages.shapefileMemory + "\n";
                        }
                        MessageBox(msg, {title: "Import from Shapefile Error", moreMsg: moreMsg});
                        return;
                    }
                    try {
                        if (!Nrm.app.featureListView) {
                            $(".ajax-progress").show();
                            self.listenTo(Nrm.event, "featureListView:render", function(){
                                  $(".ajax-progress").hide();
                                  self.stopListening(Nrm.event, "featureListView:render");
                            });
                        }
                        // load the refine selection form here
                        /**
                         * Show the {@link module:nrm-map/views/featureListView|FeatureListView}.
                         * @event module:nrm-ui/event#app:featureList
                         * @param {external:module:esri/layers/FeatureLayer|
                         *      module:nrm-map/views/featureListView~FeatureListOptions} layer A layer or options.
                         */
                        Nrm.event.trigger("app:featureList", {
                            featureLayerView: lyrView, 
                            helpContext: self.mapControl.options.helpContextShapefileImport
                        });
                        self.listenTo(Nrm.event, "context:clearForm", function() {
                            self.stopListening(Nrm.event, "context:clearForm");
                            Nrm.event.trigger("map:deactivateTool");
                            lyrView.remove();
                        });
                    } catch (error) {
                        layer = null;
                        lyrView = null;
                        collection = null;
                        var moreMsg = (error.message || error.description || ""),
                            msg = "Error loading list";
                        if (moreMsg.toLowerCase().indexOf("out of memory") > -1) {
                            msg += ":\n" + mapControl.options.messages.shapefileMemory + "\n";
                        }
                        MessageBox(msg, {title: "Import from Shapefile Error", moreMsg: moreMsg});
                        return;
                    }
                }
            };
            this.mapControl.addShapeFile({
                callback: callback, 
                name: "Import from Shapefile",
                allowMultiple: false,
                suppressAdd: true,
                suppressZoom: true
            });
        },
        /**
         * Reshapes function to reshape the polyline and polygon geometries
         * @param {Object} options
         * @param {external:module:esri/geometry/Geometry|Object} options.geometry The geometry object
         * @param {Object} options.attributes Attributes to set on the graphic
         * @returns {undefined}
         */
        reshape: function(options) {
            var thisMapView = this;
            require(['esri/tasks/GeometryService'], function(GeometryService){
                
                var mapControl = thisMapView.mapControl, map = mapControl.map;
                var targetGeometry = thisMapView.mapControl.shapeToGeometry(options.geometry);
                //var targetGeometryJson = JSON.stringify(options.geometry);
                //var gs = new GeometryService(map.nrmOptions.nrmmap.options.mapServicesSource + "/Utilities/Geometry/GeometryServer");
                //var gs = new esri.tasks.GeometryService("https://apps.fs.fed.us/arcn/rest/services/Utilities/Geometry/GeometryServer");

                if (targetGeometry.type !== "polygon" && targetGeometry.type !== "polyline") {
                    MessageBox("Reshape: '" + targetGeometry.type + "' type geometry not supported.");
                    return;
                }
                
                // LW: Cleanup from previous activity
                Nrm.event.trigger("Map:beforeActivateTool"); // use event because measure and identify views are listening
                var tb = thisMapView.mapControl.editToolbar,
                    g = tb.getCurrentState().graphic;
                $(g._shape.rawNode).css("cursor", "crosshair");
                tb.deactivate();
                
                var drawToolbar = thisMapView.activeTool = new Draw(map);
                thisMapView.isToolActivated = true;
                drawToolbar.activate(Draw.POLYLINE);
                thisMapView.setCursor("crosshair");

                thisMapView.activeToolHandler = drawToolbar.on("draw-end", function(evt) {
                    thisMapView.setCursor("wait");
                    drawToolbar.deactivate();
                    thisMapView.isToolActivated = false;
                    var attributes = options.attributes;
                    var geometry = prjUtils.webMercatorToGeographic(evt.geometry);
                    
                    // LW: Simplify turned out to be unnecessary here
                    //geometry = geometryEngine.simplify(geometry);
                    //targetGeometry = geometryEngine.simplify(targetGeometry);
                    
                    var gs = new GeometryService(mapControl.options.mapServicesSource + "/Utilities/Geometry/GeometryServer");
                            
                    gs.reshape(targetGeometry, geometry, function(reshapedGeometry){
                        thisMapView.resetCursor();
                        if ((!reshapedGeometry) ||
                                (
                                ((reshapedGeometry.type === 'polygon') && (reshapedGeometry.rings.length === 0)) ||
                                ((reshapedGeometry.type === 'polyline') && (reshapedGeometry.paths.length === 0))
                                )) {
                            // LW: Revert the geometry back if we have a problem. TODO: We might just be able to call enddraw here. test that.
                            
                            Nrm.MessageBox('Reshape sketch must intersect the polygon boundaries or the line TWICE to add/remove a portion of a polygon or change the path of a line.', {
                                type: "notice", 
                                title: "Reshape",
                                helpContext: "1149",
                                hide: false, // LW: Ken requested the message to stay until user dismisses it
                                delay: 4000
                            });

                            reshapedGeometry = targetGeometry;
                            
                            thisMapView.addSingleGraphic(reshapedGeometry, options.attributes, {sticky: true}); // Put the target geometry back in, rather than the reshaped geometry
                            
                            // Do not call "endDraw". Keep the user in edit mode
                         
                        } else {
                            // LW: For some reason, even though we add to the undo stack, we dont seem to be calling the onChange event
                            // of the undoManager which would update the map menu bar button states.
                            // Fixed by adding a button refresh to undoManager initialization, which is legitamate but a bit of a hack.
                            

                            // LW: Test of JSDocs. Learning here.
                            /**
                             * Triggered after creating or editing a geometry.
                             * @event module:nrm-ui/event#map:endDraw
                             * @param {Object} graphic.attributes Attributes of the edit graphic.
                             * @param {Object|external:module:esri/Graphic} graphic ESRI graphic or plain object.
                             * @param {external:module:esri/geometry/Geometry|Object} graphic.geometry The geometry.
                             * @param {Boolean} [graphic.suppressUndo=false] True to omit geometry from undo/redo stack.
                             * @param {string} [graphic.event]
                             */
                            Nrm.event.trigger("map:endDraw", {
                                attributes: attributes,
                                geometry: reshapedGeometry
                            });                            
                        }
                        
                        // Reactivate edit mode
                        Nrm.event.trigger("map:activateEditMode", reshapedGeometry, attributes, {undoManager: options.undoManager, zoomTo: false});
                    }, function(err) {
                        // LW: The original reshape code performed no error handling for the GeometryService reshape operation
                        // Presumably this error function gets called if the GeometryServer itself is unavailable
                        // https://developers.arcgis.com/javascript/3/jsapi/geometryservice-amd.html#reshape
                        
                        // TEST CASE:
                        // In Chrome Dev Tools, after activating edit mode, check the "Offline" option in the Network tab,
                        // then attempt a reshape.
                        thisMapView.resetCursor();
                        Nrm.event.trigger("map:activateEditMode", targetGeometry, attributes, {undoManager: options.undoManager, zoomTo: false}); // Reactivate edit mode
                        var msg = err.message.replace(/GeometryServer\/reshape?\S*/, 'GeometryServer/reshape') || 
                                'Unknown error';
                        MessageBox($('<div>').text('Reshape operation failed:\n' + msg).css({
                            'word-break': 'break-all'
                        }), {
                            showErrorBadge: false
                        });
                    });
                });                
            });            
        },                
        /**
         * Launches the bufferView
         * @param {Object} options
         * @param {external:module:esri/geometry/Geometry|Object} options.geometry The geometry object
         * @param {Object} options.attributes Attributes to set on the graphic
         * @returns {undefined}
         */
        buffer: function (options) {
            this.setAllLayersSelectable(false);
            // passing "attributes" option has special meaning for Backbone, which is not what we intended.
            var bufferView = new BufferView(_.extend(_.omit(options, 'attributes'), {
               shapeOptions: options.attributes   
            }));
            Nrm.event.trigger("app:workflow", {view: bufferView});
        },
        /**
         * Buffers the passed shape
         * @param {type} options
         * @param {external:module:esri/geometry/Geometry|Object} options.geometry The geometry object
         * @param {Object} options.attributes Attributes to set on the graphic
         * @param {Number} options.distance Buffer distance
         * @param {String} options.units Linear unit for buffer distance, one of the values listed at 
         * {@link https://developers.arcgis.com/javascript/3/jsapi/esri.geometry.geometryengine-amd.html#geodesicbuffer|geometryEngine.geodesicBuffer}
         * @returns {undefined}
         */
        bufferFeature: function (options) {
            
//            var $this = this.$el;
//            var parent = $this.parent();
            var mapControl = this.mapControl, map = mapControl.map;
            var geometry = this.mapControl.shapeToGeometry(options.geometry);

            var distance = options.distance;
            var units = options.units;

            if (!GeometryEngine.isSimple(geometry)) {
                geometry = GeometryEngine.simplify(geometry);
            } 
            geometry.setSpatialReference(map.geographicExtent.spatialReference);
            //geodesicBuffer(geometries, [distance], unit <see sdk for example codes--9036==km>, unionResults);
            var bufferedGeometries = null;
            var bufferedGeometries = GeometryEngine.geodesicBuffer([geometry], [distance], units, false);
            var bufferedGeom = bufferedGeometries[0] || geometry;
            //this.bufferedGeom = bufferedGeom;
            //if (bufferedGeom) {
            //    this.addSingleGraphic(bufferedGeom, _.omit(options.attributes, "selected"), {sticky: true, zoomTo: true});
            //} else {
            //    bufferedGeom = geometry;
            //}

            Nrm.event.trigger("map:featureCreate", {
                attributes: options.attributes
                , geometry: bufferedGeom
                , suppressUndo: true
            });

            // JS 10/18/2017 is this still necessary?
            this._deactivateEditMode();

        },
         /**
         * Undo the buffer 
         * @param {Object} options
         * @param {external:module:esri/geometry/Geometry|Object} [options.geometry] Pre-buffer geometry to be restored.
         * @param {Object} options.attributes Pre-buffer attributes to be restored.
         * @returns {undefined}
         */
        cancelBuffer: function (options) {
            var geometry = options && options.geometry && this.mapControl.shapeToGeometry(options.geometry);
            if (geometry){
                this.addSingleGraphic(geometry, options.attributes, {sticky: true});
            } else {
                this.mapControl.removeAllGraphics();
            }

            this._deactivateEditMode();
            // the following would re-bind the original shape editor control, no longer needed due to refactoring
//            if (geometry) {
//                Nrm.event.trigger("map:featureCreate", _.extend({}, options, {
//                    suppressUndo: true,
//                    attributes: options.attributes,
//                    geometry: geometry
//                }));
//            }
        },
        /**
         * Handles the {@link module:nrm-ui/event#map:cancelFeatureListView|map:cancelFeatureListView} event.
         * @returns {undefined}
         */
        cancelFeatureListView: function() {
            this.clearFeatures({restoreStickyGraphic: true});
            /**
             * Triggered when a map tool is deactivated without triggering a more specific tool deactivation event
             * such as {@link module:nrm-ui/event#map:endDraw|map:endDraw}.
             * @event module:nrm-ui/event#map:deactivateTool
             */
            Nrm.event.trigger("map:deactivateTool");
        },
        /**
         * Return simplified version of geometry, or original geometry if already simple or not a polygon.
         * Multipart polygon rings are processed to assure proper ring orientation and avoid self-intersections.
         * @param {external:module:esri/geometry/Geometry|Object} geometry
         * @returns {external:module:esri/geometry/Geometry}
         */
        simplifyGeometry: function(geometry) {
            var result;
            if (!geometry || !geometry.rings) {
                result = geometry;
            } else {
                console.time("simplifyGeometry");
                // for consistency with Add Part tool, use Web Mercator projection for relational tests.
                geometry = this.convertToWebMercator(geometry);
                var results = [], // all exterior ring candidates
                    innerRings = [], // inner ring candidates for current exterior ring
                    currentRing; // current exterior ring
                function calcArea(ring) {
                    return (-1) * GeometryEngine.geodesicArea(ring, 'square-meters');
                }
                function addRing() {
                    if (innerRings.length > 0) {
                        var orphans = [];
                        // sort descending by area so that we don't have to test for 2nd ring contains 1st ring
                        innerRings = _.sortBy(innerRings, calcArea);
                        _.each(innerRings, function(innerRing) {
                            // test for boundary of innerRing does not interact with interior of currentRing
                            // i.e. rings are disjoint or innerRing contains currentRing
                            if (!currentRing || GeometryEngine.relate(currentRing, innerRing, '*F*******')) {
                                var test = _.find(orphans, function(ring, i) {
                                    if (GeometryEngine.intersects(ring, innerRing)) {
                                        orphans[i] = GeometryEngine.difference(ring, innerRing);
                                        return true;
                                    }
                                });
                                if (!test) {
                                    orphans.push(innerRing);
                                }
                            } else {
                                currentRing = GeometryEngine.difference(currentRing, innerRing);
                            }
                        });
                        results = results.concat(orphans);
                        innerRings = [];
                    }
                    if (currentRing) {
                        results.push(currentRing);
                    }
                }
                _.each(geometry.rings, function(ring) {
                    var clockwise = geometry.isClockwise(ring),
                        nextRing = GeometryEngine.simplify(new Polygon({
                            rings:[ring], spatialReference: geometry.spatialReference
                        }));
                    if (!currentRing) {
                        currentRing = nextRing;
                    } else if (clockwise) {
                        addRing();
                        currentRing = nextRing;
                    } else {
                        innerRings.push(nextRing);
                    }
                });
                addRing();
                // sort descending by area so that we don't have to test for 2nd ring contains 1st ring
                results = _.sortBy(results, calcArea);
                result = _.reduce(results, function(result, ring) {
                    if (result && GeometryEngine.contains(result, ring)) {
                        return GeometryEngine.difference(result, ring);
                    } else {
                        return GeometryEngine.union([result, ring]);
                    }
                });
                result = this.convertToGeographic(result);
                console.timeEnd("simplifyGeometry");
            }
            return result;
        },
        /**
         * Simplify and otherwise process new or edited geometry before passing to draw end methods.
         * @param {Object} options
         * @param {external:module:esri/geometry/Geometry|Object} options.geometry The geometry
         * @param {Boolean} [options.simplify] Execute {@link module:nrm-map/views/mapView#simplifyGeometry|simplifyGeometry}.
         * @param {Object} options.attributes Attributes of the edit graphic.
         * @param {external:module:esri/geometry/Geometry|Object} [options.attributes.appendTo] Previous geometry to 
         * which a new part is added.
         * @param {Boolean} [graphic.suppressUndo=false] True to omit geometry from undo/redo stack.
         * @param {string} [graphic.event] Name of the event that triggered the shape change.
         */
        createFeature: function (options) {
            if (options.simplify) {
                options.geometry = this.simplifyGeometry(options.geometry);
            }
            if (options.attributes.appendTo) {
                var appendTo = this.convertToWebMercator(options.attributes.appendTo),
                        geometry = this.convertToWebMercator(options.geometry);
                this.mapControl.addGraphicViaGeometry(appendTo, _.omit(options.attributes, "appendTo"));
                var graphic = new Graphic(geometry);
                this.mapControl.options.drawEndCallback(_.extend(options.attributes, {
                    appendTo: appendTo
                }), graphic);
                return;
            } else {
                Nrm.event.trigger("map:endDraw", options);
            }
        },
        /**
         * Gets from the map layerIDs for layers that can participate in identify/query operations.
         * @param {Object} [options]
         * @param {String[]} [options.exclude=["nrmGraphicsLayer"]] Map layerIDs to exclude.
         * @param {Boolean} [options.visibleOnly=false] Include only currently visible layers.
         * @returns {string[]}
         */
        getQueryableLayerIds: function(options) {
            options = _.defaults(options, {exclude: ["nrmGraphicsLayer", "Copy From Map Layer"], visibleOnly: false});
            var map = this.mapControl.map, 
                layerIds = [],
                i, layer, layerId,
                mapLayerIds = options.visibleOnly ? 
                        _.pluck(map.getLayersVisibleAtScale(), "id") : 
                        map.layerIds.concat(map.graphicsLayerIds);
            for (i = mapLayerIds.length; i--;) {
                layerId = mapLayerIds[i];
                if (options.exclude.indexOf(layerId.trim()) > -1) {
                    continue;
                }
                layer = map.getLayer(layerId);
                if (!layer.url) {
                    layerIds.push(layerId);
                } else if (layer.capabilities && layer.capabilities.indexOf("Query") !== -1 &&
                        layer.nrmOptions && !layer.nrmOptions.tiled) {
                    // layer.capabilities is undefined if the layer hasn't finished loading
                    // services at the root of services.esri.com are imagery but some have Query-able index layers
                    var parts = layer.url.split('/');
                    if (_.indexOf(parts, "services.arcgisonline.com") === -1 ||
                            _.indexOf(parts, "MapServer") - _.indexOf(parts, "services") > 2) {
                        layerIds.push(layerId);
                    }
                }
            }
            return layerIds;
        },
        /**
         * 
         * @description Copy feature from a map layer
         * @param {Object} options
         * @param {string[]} [options.geometryTypes] - Enable selection of "point", "line", and/or "polygon"
         * @param {Object} options.attributes
         * @param {string} options.attributes.elemId Element id of the 
         * {@link module:nrm-map/nrmShapeEditor|nrmShapeEditor} input field.
         * @returns {undefined}
         */
        copyFeature: function(options) {
            _.defaults(options = (options || {}), {
                geometryTypes: ["point", "multipoint", "polyline", "polygon", "line"],
                title: "Copy From Map Layer"
            });
            if (_.indexOf(options.geometryTypes, "line") === 1 && _.indexOf(options.geometryTypes, "polyline") === -1)
                options.geometryTypes.push("polyline");
            var mapControl = this.mapControl, map = mapControl.map, self = this, lyrView;
            var testLayerIds = this.getQueryableLayerIds({visibleOnly: true, exclude: ["nrmGraphicsLayer", options.title]});
            if (testLayerIds.length === 0) {
                MessageBox('No selectable layers.', {type: "notice", title: options.title, hide: true, delay: 4000});
                return;
            }
          var rowCount = 1;
          var selectionHasBeenHandled = false,
                setHandled = function(evt) {
                    selectionHasBeenHandled = evt && evt.features && evt.features.length > 0;
                };
            this.beforeActivateTool();

            for (var i in map.graphicsLayerIds) {
                map.getLayer(map.graphicsLayerIds[i]).disableMouseEvents();
            }

            var featureListOpts = {
                title: options.title,
                columns: [
                    {"prop": "layerName",
                        "label": "Layer Name"
                    },
                    {"prop": "name",
                        "label": "Name"
                    },
                    {"prop": "flmDataSource",
                        "label": "FLM Data Source"
                    },
                    {"prop": "flmRevDate",
                        "label": "FLM Rev Date"
                    },
                    {"prop": "flmAccuracy",
                        "dataType": "numeric",
                        "label": "FLM Accuracy"
                    }                        
                ],
                helpContext: this.mapControl.options.helpContextCopyFeature,
                message: "<i>Click on the map to select a new set of features."
                         + "<br/>Select a row in the table and click OK to copy the geometry and Feature Level Metadata (FLM).<br/></i>"
            };
            var featureListRemoveHandler = function() {
                this.stopListening(Nrm.event, "context:clearForm");
                //this.stopListening(Nrm.event, "map:endDraw");
                selectionHasBeenHandled = null;
                if (lyrView) {
                    lyrView.remove();
                }
                self.selectionContext = null;
                self.mapControl.navButtonBar.enableButton("selectmode", false);
                self.declareSelectionHandler({id: "copy", handling: false});
                self.resetCursor();
                Nrm.event.trigger("map:deactivateTool");
                self.mapControl.deactivateSelectionMode();
                _.each(map.graphicsLayerIds, function(id) {
                    self.mapControl.clearLayerSelection(id);
                });
            };
            
            var startSelecting = function() {
                selectionHasBeenHandled = false;
                self.selectionContext = {callback: selectionCallback};
                self.declareSelectionHandler({id: "copy", handling: true});
                self.activateDrawMode("rectangle", {source: "CopyFeature", suppressCursor: true}, {
                    disableSelection: false,
                    restoreStickyGraphic: false
                });
                self.mapControl.navButtonBar.enableButton("selectmode");
                self.mapControl.navButtonBar.setModeButton("selectmode");
            };
            var callback = function(results) {
                $(".ajax-progress").hide();
                var Model = Backbone.Model.extend({
                    defaults: {
                        layerName: null,
                        shape: null,
                        name: null,
                        flmDataSource: '24',
                        flmRevDate: null,
                        flmAccuracy: null,
                        objectid: null,
                        allAttributes: null,
                        NRMINDEX: null
                    },
                    idAttribute: "NRMINDEX"
                });
                var Collection = Backbone.Collection.extend({model: Model});
                var collection = new (Collection);
                //var rowCount = 1;
                self.removeTemporaryLayers();
                var layerIds = self.getQueryableLayerIds({visibleOnly: true});
                results.forEach(function(result) {
                    if (result[0] && result[1].length > 0) {
                        result[1].forEach(function(r) {
                            var feature = r.feature;
                            if (_.indexOf(options.geometryTypes, feature.geometry.type) !== -1) {
                                var layerName = r.layerName,
                                    mapLayer, visibleLayers,
                                        found = false,
                                        atts = feature.attributes; //, attCount = 0;
                                for (var i = 0; i < layerIds.length; i++) {
                                    mapLayer = map.getLayer(layerIds[i]);
                                    visibleLayers = mapLayer.visibleLayers;
                                    if (visibleLayers) {
                                        for (var j = 0; j < visibleLayers.length; j++) {
                                        if (mapLayer.layerInfos[visibleLayers[j]].name === layerName) {
                                            var title;
                                            if (mapLayer.nrmOptions && mapLayer.nrmOptions.caption) {
                                                title = mapLayer.nrmOptions.caption;
                                            } else {
                                                var url = mapLayer.url,
                                                        start = url.toLowerCase().indexOf('/rest/services/'),
                                                        end = url.toLowerCase().indexOf('/mapserver', start);
                                                title = url.substring(start + 15, end).replace('/', ' ');
                                            }
                                            layerName = title + " / " + layerName;
                                            found = true;
                                        }
                                    }
                                    } else if (mapLayer.nrmOptions && mapLayer.nrmOptions.caption === layerName) {
                                        r.displayFieldName = mapLayer.nrmOptions && mapLayer.nrmOptions.nameAttr;
                                        found = true;
                                    }
                                    if (found) {
                                        break;
                                    }
                                }
                                var name = r.value;
                                if (r.displayFieldName) {
                                    name = atts[r.displayFieldName];
                                    if (r.displayFieldName.toLowerCase() !== "name") {
                                        name += ' (' + r.displayFieldName + ')';
                                    }
                                }
                                var model = new Model({
                                    shape: self.convertToGeographic(feature.geometry),
                                    layerName: layerName + ' (' + feature.geometry.type + ')',
                                    name: name,
                                    objectid: atts.OBJECTID,
                                    NRMINDEX: rowCount,
                                    allAttributes: JSON.stringify(atts),
                                    flmDataSource: atts.DATA_SOURCE 
                                            || atts["FLM Data Source"]
                                            || atts.data_source 
                                            || atts.dataSource 
                                            || atts.DATA_SOURC
                                            || atts.flmDataSource,
                                    flmRevDate: atts.REV_DATE 
                                            || atts["FLM Rev Date"] 
                                            || atts.revisionDate 
                                            || atts.flmRevisionDate,
                                    flmAccuracy: atts.ACCURACY 
                                            || atts["FLM Accuracy"]
                                            || atts.accuracy 
                                            || atts.flmAccuracy
                                });
                                collection.add(model);
                                rowCount++;
                            }
                        });
                    }
                });
                var selectionMethod = self.mapControl.selectionMethod,
                    refreshView = lyrView && Nrm.app.featureListView && (!selectionMethod || selectionMethod !== "new");
                if (refreshView) {
                    //console.log("copyFeature collection/layer count before", lyrView.collection.length, lyrView.layers.esriGeometryPolygon.layer.graphics.length);
                    var c = lyrView.collection.clone();
                    switch (selectionMethod) {
                        case "add":
                            _.each(collection.models, function(m) {
                                if (lyrView.collection.findWhere({allAttributes: m.get("allAttributes")}) === undefined) {
                                    c.add(m);
                                }
                            });
                            break;
                        case "subtract":
                            _.each(collection.models, function(m) {
                                _.each(c.findWhere({allAttributes: m.get("allAttributes")}), function(mFound) {
                                    c.remove(mFound);
                                });
                            });
                            break;
                    }
                    lyrView.collection.reset(c.toJSON());
                    //console.log("copyFeature collection/layer count after", lyrView.collection.length, lyrView.layers.esriGeometryPolygon.layer.graphics.length);
                    return;
                } else {
                    lyrView = self.addCollectionLayer("CopyFeature", collection, {
                        selectable: true,
                        context: {
                            alias: "CopyFeature",
                            caption: options.title,
                            collection: collection,
                            shapeAttr: "shape"
                        }
                        , fields: [
                            {"name": "layerName",
                                "type": "esriFieldTypeString",
                                "alias": "Layer Name"
                            },
                            {"name": "allAttributes",
                                "type": "esriFieldTypeString"
                            }
                        ]
                    });
                }
                
                var lyrs = _.values(lyrView.layers);
                for (var x = 0; x < lyrs.length; x++) {
                    var layer = lyrs[x].layer;
                    layer.nrmOptions = _.extend(layer.nrmOptions, {
                        elemId: options.attributes.elemId, 
                        caption: options.title,
                        selectByID: _.bind(self.mapControl.selectByID, self.mapControl),
                        selectable: true,
                        keyFieldName: "NRMINDEX"
                    });
                    //layer.temporary = true;
                    layer.importOptions = options;
                    layer.enableMouseEvents();
                    //self.temporaryLayers.push(layer);
                }
                if (Nrm.app.featureListView && !refreshView) {
                    self.stopListening(Nrm.event, "context:clearForm");
                    Nrm.app.featureListView.remove();
                    startSelecting();
                }
                Nrm.event.trigger("app:featureList", _.extend(featureListOpts, {featureLayerView: lyrView}));
                self.listenTo(Nrm.event, "context:clearForm", featureListRemoveHandler);
            	lyrView.on("featuresSelected", setHandled);
            };
            var selectionCallback = function (geometry, options) {
                if (selectionHasBeenHandled) {
                    selectionHasBeenHandled = false;
                    return;
                }
                var geom = geometry,
                    deferreds = [],
                    extent = geom.getExtent(),
                    identifyParams = new IdentifyParameters();
                identifyParams.tolerance = 10;
                identifyParams.returnGeometry = true;
                identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
                identifyParams.geometry = geom;
                identifyParams.mapExtent = map.extent;
                identifyParams.width = map.width;
                identifyParams.height = map.height;

                map.infoWindow.hide();
                // though we've checked at the beginning, the user could've changed layers in the meantime
                var layer, layerIds = self.getQueryableLayerIds({visibleOnly:true});
                for (var i = 0; i < layerIds.length; i++) {
                    layer = map.getLayer(layerIds[i]);
                    layer.enableMouseEvents && layer.enableMouseEvents();
                    if (layer.visible) {
                        if (layer.url) {
                            deferreds.push(new IdentifyTask(layer.url).execute(identifyParams));
                        // non-service layers
                        } else if (layer.nrmOptions && layer.nrmOptions.identifyCallback) {
                            var dfd = new Deferred;
                            deferreds.push(dfd);
                            $.when(layer.nrmOptions.identifyCallback(extent, layer)).done(function(args){
                                dfd.resolve(args);
                            });
                        } else {
                            var dfd = new Deferred,
                                selectQuery = new Query(),
                                selectFeaturesCallback = function(features) {
                                    var results = [], f, graphic, atts;
                                    // fix the layer if selectFeatures reduced the number of graphics
                                    if (layer.graphics.length < layer._graphicsBackup.length) {
                                        layer.graphics = _.clone(layer._graphicsBackup);
                                        layer._graphicsBackup = undefined;
                                        layer.redraw();
                                    }
                                    for (f in features) {
                                        graphic = features[f];
                                        atts = graphic.attributes;
                                        results.push({
                                            layerName: layer.nrmOptions && layer.nrmOptions.caption || layer.id,
                                            value: atts.name || atts.id || atts[layer.objectIdField],
                                            geometryType: graphic.geometry.type,
                                            feature: {
                                                geometry: graphic.geometry,
                                                attributes: atts
                                            }
                                        });
                                    }
                                    dfd.resolve(results);
                                };
                            selectQuery.geometry = extent;
                            selectQuery.returnGeometry = true;
                            selectQuery.outFields = ["*"];
                            layer._graphicsBackup = _.clone(layer.graphics);
                            layer.selectFeatures(
                                    selectQuery,
                                    FeatureLayer.SELECTION_NEW,
                                    selectFeaturesCallback,
                                    function(){dfd.reject();}
                                );
                            deferreds.push(dfd);
                        }
                    }
                }
                if (deferreds.length === 0) {
                    MessageBox('No selectable layers.', {
                        type: "notice", 
                        title: options.title, 
                        hide: true, 
                        delay: 4000
                    });
                    Nrm.event.trigger("map:deactivateTool");
                    return;
                }
                $(".ajax-progress").show();
                var dlist = new DeferredList(deferreds);
                dlist.then(callback);
                startSelecting();
            };
            //);
            if (!Nrm.app.featureListView) {
                $(".ajax-progress").show();
                this.listenTo(Nrm.event, "featureListView:render", _.bind(function(){
                      $(".ajax-progress").hide();
                      this.stopListening(Nrm.event, "featureListView:render");
                }, this));
            }
            startSelecting();
            Nrm.event.trigger("app:featureList", featureListOpts);
            this.listenTo(Nrm.event, "context:clearForm", featureListRemoveHandler);
        },
        
        /**
         * Remove temporary layers.
         * @returns {undefined}
         */
        removeTemporaryLayers: function() {
            // remove temporary layers
            if (this.temporaryLayers) {
                for (var i = 0; i < this.temporaryLayers.length; i++) {
                    this.mapControl.removeDynamicMapLayer(this.temporaryLayers[i]);
                }
            }
            this.temporaryLayers = [];
        },
        // printMap parameters:
        //      options: {layout, 
        //                format, 
        //                textElements: [
        //                    {"subtitle": ""},// "FS Site Number: \nSmithsonian Number:"},
        //                    {"title": "Natural Resource Manager (NRM) Map"},
        //                    {"pagerange": ""},
        //                    {"unit": ""},
        //                    {"forest": ""},
        //                    {"district": ""},
        //                    {"user" : ""},
        //                    {"legal": ""},
        //                    {"date": ""}
        //                    //,{"disclaimer": "Disclaimer"}
        //               ]
        //                callback(url) function,
        //                errorCallback(err) function }
        // If you omit callback function, the map will open in a new window.
        // If you omit errorCallback function, errors will display in an error popup
        /**
         * Export the map for printing, opens a PDF in a new window.
         * @param {Object} options
         * @returns {undefined}
         * @see {@link module:nrm-map/Map#printMap|MapControl#printMap} for supported options.
         */
        printMap: function(options) {
            this.mapControl.printMap(options);
        },
        /**
         * Download layers and map tiles to a local storage implementation for offline use.
         * @param {Object} opts
         * @returns {undefined}
         * @see {@link module:nrm-map/Map#checkout|MapControl#checkout} for supported options.
         */
        checkout: function(opts) {
            //        var progressCallback = function(percentComplete) {
            //            console.log("mapView.checkout.progressCallback " + percentComplete.toString());
            //        };
            //        _.defaults(opts, {progressCallback: progressCallback});
            console.log('mapView.checkout(opts)', opts);
            this.mapControl.checkout(opts);
        },
        /**
         * Add a shapefile to the map.
         * @returns {undefined}
         */
        addLayerFromShapefile: function() {
            this.mapControl.addShapeFile();
        },
        /**
         * Add a dynamic map layer from a URL entered by the user.
         * @returns {undefined}
         */
        addLayerByURL: function() {
            this.mapControl.addLayerByURL();
        },
        /* JS 3/27/15: refactored from nrm-ui/js/settings.js */
        /**
         * Indicates whether the map control is loaded.
         * @returns {Boolean|undefined}
         */
        mapLoaded: function() {
            return this.mapControl && this.mapControl.map && this.mapControl.map.loaded;
        },
        /**
         * Get an object that can be serialized as a JSON string to persist in user preferences.
         * @param {string} key The settings key, supported values include "extent", "basemap", "dynamicLayers", 
         * "graphicsLayers"
         * @returns {*}
         * The object to be serialized in the user preferences.
         */
        getSetting: function(key) {
            function getDynamicLayers() {
                var value;
                try {
                    var saveOptions, nrmOptions, defaults = {
                        'visible': true,
                        'opacity': 1
                    };
                    var illegalProperties = ['featureLayer', 'nrmmap'];
                    value = new Array();
                    _.each(this.mapControl.mapSupport.dynamicMapLayers, function(layer, i) {
                        nrmOptions = layer.nrmOptions;
                        saveOptions = _.omit(nrmOptions, illegalProperties);
                        var omit = [], overrides = {};
                        _.each(defaults, function(value, key) {
                            if (layer[key] !== (nrmOptions[key] === undefined ? value : nrmOptions[key])) {
                                overrides[key] = layer[key];
                            } else {
                                omit.push(key);
                            }
                        });
                        saveOptions.layerOptions = $.extend({}, _.omit(nrmOptions.layerOptions, omit), overrides);
                        var url = (nrmOptions.url) ? nrmOptions.url : layer.url, pos = this.mapControl.map.layerIds.indexOf(layer.id);
                        if (url !== null)
                            value.push({
                                url: url,
                                nrmOptions: saveOptions,
                                pos: pos !== i ? pos : undefined
                            });
                    }, this);
                } catch (e) {
                    console.info("Error in Nrm.Models.Settings.setDynamicLayers", e);
                }
                return value;
            }
            function getGraphicsLayers() {
                var value;
                try {
                    var layer, saveOptions, nrmOptions, prop, map = this.mapControl.map;
                    var illegalProperties = ['featureLayer', 'nrmmap'];
                    value = new Array();
                    for (var i = 0; i < map.graphicsLayerIds.length; i++) {
                        layer = map.getLayer(map.graphicsLayerIds[i]);
                        if (layer.url !== null || (layer.nrmOptions && layer.nrmOptions.persistLayer === false))
                            continue;

                        saveOptions = {};
                        nrmOptions = layer.nrmOptions;
                        for (prop in nrmOptions) {
                            if (illegalProperties.indexOf(prop) === -1) {
                                saveOptions[prop] = nrmOptions[prop];
                            }
                        }
                        layer.nrmOptions = saveOptions;
                        // featureLayer.toJson() serializes a featureCollection
                        // graphicsLayer doesn't have a toJson method, so we'll just get its graphics
                        try {
                            value.push({id: layer.id, featureCollection: layer.toJson(), nrmOptions: saveOptions});
                        }
                        catch (ex) {
                            var j, max, graphics = new Array();
                            for (j = 0, max = layer.graphics.length; j < max; j += 1) {
                                graphics.push(layer.graphics[j].toJson());
                            }
                            value.push({id: layer.id, graphics: graphics, nrmOptions: saveOptions});
                        }
                    }
                } catch (e) {
                    console.info("Error in Nrm.Models.Settings.setGraphicsLayers", e);
                }
                return value;
            }
            if (this.mapLoaded()) {
                switch (key) {
                    case 'extent':
                        return this.getCurrentExtent();
                    case 'basemap':
                        return this.mapControl.basemap.url;
                    case 'dynamicLayers':
                        return getDynamicLayers.call(this);
                    case 'graphicsLayers':
                        return getGraphicsLayers.call(this);
                }
            }
        },
        /**
         * Restore the extent from user preferences
         * @param {Object} extent Plain object representation of an 
         * {@link https://developers.arcgis.com/javascript/3/jsapi/extent-amd.html|Extent}
         * @returns {undefined}
         */
        restoreExtent: function(extent) {
            try {
                if (extent && this.mapLoaded()) {
                    this.mapControl.restoreExtent(extent);
                    //                    extent = new Extent(extent);
                    //                    console.info('attempting to restore extent', extent);
                    //                    this.setCurrentExtent({extent: extent});
                }
            } catch (e) {
                console.error('Error restoring EXTENT', e);
            }
        },
        /**
         * Restore the basemap from user preferences
         * @deprecated This setting doesn't make sense now that we treat the basemaps like any other layer.
         * @param {string} basemap
         * @returns {undefined}
         */
        restoreBasemap: function(basemap) {
            try {
                if (basemap && this.mapLoaded()) {
                    this.mapControl.setBaseMap(basemap);
                }
            } catch (e) {
                console.error('Error restoring BASEMAP', e);
            }
        },
        /**
         * Restore dynamic map layers from user preferences
         * @param {module:nrm-map/views/mapView~DynamicMapLayerSettings[]} layers List of layers.
         * @returns {undefined}
         */
        restoreDynamicLayers: function(layers) {
            try {
                if (layers && this.mapLoaded()) {
                    this.mapControl.restoreDynamicMapLayers(layers);
                    //                var url, layer, addIt, j, jMax, k;
                    //                    var map = this.mapControl.map;
                    //                    for (j = 0, jMax = layers.length; j < jMax; j++) {
                    //                        url = layers[j].url;
                    //                        addIt = true;
                    //                        for(k = 0; k < map.layerIds.length; k++) {
                    //                            layer = map.getLayer(map.layerIds[k]);
                    //                            if (layer.url.substr(0,layer.url.toLowerCase().indexOf('mapserver')) === url.substr(0,url.toLowerCase().indexOf('mapserver'))) {
                    //                                addIt = false;
                    //                                break;
                    //                            }
                    //                        }
                    //                        if (addIt) this.mapControl.setDynamicMapLayer(url, 1, layers[j].nrmOptions);
                    //                    }
                }
            } catch (e) {
                console.error('Settings: Error restoring DynamicLayers', e);
            }
        },
        /**
         * Restore graphics layers from user preferences
         * @param {module:nrm-map/views/mapView~GraphicsLayerSettings[]} layers List of layers.
         * @returns {undefined}
         */
        restoreGraphicsLayers: function(layers) {
            try {
                if (layers && this.mapLoaded()) {
                    //                var layer, saved, k, kMax, j, jMax;
                    //                    var map = this.mapControl.map;
                    //                    for (j = 0, jMax = layers.length; j < jMax; j += 1) {
                    //                        saved = layers[j];
                    //                        if (saved.featureCollection) {
                    //                            layer = new FeatureLayer(saved.featureCollection, {mode: FeatureLayer.MODE_SNAPSHOT, id: saved.id});
                    //                        } else if (saved.graphics) {
                    //                            layer = new GraphicsLayer($.extend({ id: saved.id }, saved.nrmOptions));
                    //                            for (k = 0, kMax = saved.graphics.length; k < kMax; k += 1) {
                    //                                layer.add(new Graphic(saved.graphics[k]));
                    //                            }
                    //                        }
                    //                        if (layer.graphics.length > 0 && layer.graphics[0].geometry !== null) {
                    //                            layer.nrmOptions = layers[j].nrmOptions;
                    //                            connect.connect(layer, "onClick", this.mapControl._graphicsLayerClick);
                    //                            map.addLayer(layer);
                    //                            if (saved.id === "nrmGraphicsLayer") {
                    //                                this.mapControl.mapSupport.graphicsLayer = layer;
                    //                            }
                    //                        }
                    //                    }
                    this.mapControl.restoreGraphicsLayers();
                }
            } catch (e) {
                console.error('Settings: Error restoring GraphicsLayers', e);
            }
        },
        /**
         * Deactivate tool, add new or edited graphic to map, then call 
         * {@link module:nrm-map/mapView#triggerShapeChange|triggerShapeChange}.
         * @param {Object} options
         * @param {external:module:esri/geometry/Geometry|Object} options.geometry The geometry
         * @param {Object} options.attributes Attributes of the edit graphic.
         * @param {String} options.attributes.elemId DOM ID of the geometry's nrmShapeEditor control.
         * @param {Boolean} [graphic.suppressUndo=false] True to omit geometry from undo/redo stack.
         * @param {string} [graphic.event] Name of the event that triggered the shape change.
         * @returns {undefined}
         */
        endDraw: function(options) {
            this.onDeactivateTool(); // Covers the old handler
            this.addSingleGraphic(options.geometry, options.attributes, {sticky: true});
            this.triggerShapeChange(options);
        },                
        /**
         * Trigger the shapechange event in the {@link module:nrm-map/nrmShapeEditor|nrmShapeEditor plugin}.
         * @param {Object} options
         * @param {external:module:esri/geometry/Geometry|Object} options.geometry The geometry
         * @param {Object} options.attributes Attributes of the edit graphic.
         * @param {String} options.attributes.elemId DOM ID of the geometry's nrmShapeEditor control.
         * @param {Boolean} [graphic.suppressUndo=false] True to omit geometry from undo/redo stack.
         * @param {string} [graphic.event] Name of the event that triggered the shape change.
         * @returns {undefined}
         */
        triggerShapeChange: function(options) {
            var elemId = options.attributes && options.attributes.elemId;
            if (elemId) {
                $("#" + elemId).trigger("shapechange.nrmShapeEditor", options);
            }
        },                
        /* JS 3/27/15: END refactored from nrm-ui/js/settings.js */
        /**
         * For internal use only, initialize the map control.
         * @returns {undefined}
         */
        setupMap: function() {
            var that = this; // Preserve the reference for use in the init function
            var f = function(id) {
                //console.log('in featureClickCallback with id ' + id);
                if (that.options.featureClickCallback) {
                    that.options.featureClickCallback.call(that, id);
                }
            };
            // TODO: I'm pretty sure this should have been removed when it was moved to initialize function
            this.dfd = new $.Deferred();
            that._initContext();
            function init() {
                that.initializing = false;
                if (!that.$el.is(":visible")) {
                    that.mapHidden = true;
                    /**
                     * For internal use, enables reset the first time the panel is opened.
                     * @name module:nrm-map/views/mapView#doReset
                     * @type {Boolean}
                     */
                    that.doReset = true;
                    //return;
                }

                /**
                 * For internal use, suspends resetting during a timeout period.
                 * @todo It's likely that we could use Underscore methods to make this less awkward
                 * @name module:nrm-map/views/mapView#enableReset
                 * @type {Boolean}
                 */
                that.enableReset = true;
                //that.startListening();
                that.listenTo(Nrm.event, "layout:reset", that.waitAndResetMap);
                that.listenTo(Nrm.event, "layout:hideMap", that.onHideMap);


                var getGraphicGeom = function(graphic) {
                    return that.convertToGeographic(graphic.geometry);
                };
                
                // LW: Code to add an additional mapButtonBar div inside the mapDiv.
                // Needs to be there before the mapControl instance is initialized
                that.$el.append( "<div id=\"" + that.options.mapButtonBarId + "\"></div>");
                that.$el.append( "<div id=\"" + that.options.navButtonBarId + "\"></div>");
            
                // Map defaults to being roughly centered on North America
                //
                /**
                 * The map control
                 * @name module:nrm-map/views/mapView#mapControl
                 * @type {module:nrm-map/Map}
                 */
                that.mapControl = new Map(that.$el.attr("id"),
                        $.extend({}, that.options, {//debug: true,
                    mapClickCallback: function() {
                        if (that.stickyGraphic && that.stickyGraphic !== true) {
                            that.mapControl.addGraphic(that.stickyGraphic, that.stickyGraphic.attributes || {});
                        }
                        //Nrm.event.trigger("clearAllTableSelections");
                        if (that.options.mapClickCallback) {
                            that.options.mapClickCallback.call(that);
                        }
                    },
                    selectionEndCallback: function(geometry) {
                        if (that.onSelection(geometry))
                            return true;
                        if (that.options.selectionEndCallback)
                            return that.options.selectionEndCallback.call(that, geometry);
                        that.onDeactivateTool();
                    },
                    featureClickCallback: f,
                    drawEndCallback: function(attributes, graphic) {
                        //console.info('In drawEndCallback method', [attributes, graphic]);
                        // ebodin 12/23/2014 to implement multipart features
                        //      if attributes.appendTo (which is a graphic) is supplied...
                        //        merge with new graphic before sending on
                        if (attributes && attributes.appendTo) {
                            var g1 = attributes.appendTo;
                            var shapeType1 = g1.type || attributes.shapeType;
                            var g = graphic.geometry;
                            var shapeType = g.type,
                                dfd = $.Deferred(),
                                resolved = true;
                            // use slice in the comparison to catch polyline/line, point/multipoint
                            if (shapeType.slice(-4) === shapeType1.slice(-4)) {
                                var newPart, i;
                                switch (shapeType.toLowerCase()) {
                                    case "point":
                                        // we'll have to convert this to multipoint first
                                        var mp = new Multipoint(g.spatialReference);
                                        mp.addPoint(g);
                                        g = mp;
                                        graphic.setGeometry(g);
                                        shapeType = "multipoint";
                                        //break; don't break, just continue to multipoint
                                    case "multipoint":
                                        if (shapeType1 === "point") {
                                            g.addPoint(g1);
                                        } else if (shapeType1 === "multipoint") {
                                            for (i = 0; i < g1.points.length; i++) {
                                                newPart = g1.points[i];
                                                g.addPoint(newPart);
                                            }
                                        }
                                        break;
                                    case "line":
                                    case "polyline":
                                        for (i = 0; i < g1.paths.length; i++) {
                                            newPart = g1.paths[i];
                                            g.addPath(newPart);
                                        }
                                        break;
                                    case "polygon":
                                        // 9/13/2017 ebodin: prompt to add or subtract new overlapping polygons per artf77301
                                        var callback = function(modal) {
                                                if (!GeometryEngine.isSimple(g1)) {
                                                    g1 = GeometryEngine.simplify(g1);
                                                }
                                                if (!GeometryEngine.isSimple(g)) {
                                                    g = GeometryEngine.simplify(g);
                                                }
                                                switch (modal.clickedId) {
                                                    case "modal-yes":
                                                        graphic.geometry = GeometryEngine.union([g, g1]);
//                                                        if (graphic.geometry.rings.length > g1.rings.length) {
//                                                            console.warn("union created more rings!", JSON.stringify(g.toJson()), JSON.stringify(g1.toJson()), JSON.stringify(graphic.geometry.toJson()));
//                                                            // try it again after reversing ring
//                                                            console.log("reversing ring");
//                                                            g.rings[0].reverse();
//                                                            if (g1.rings.length !== graphic.geometry.rings.length) {
//                                                                graphic.geometry = GeometryEngine.union([g, g1]);
//                                                                console.warn("union STILL created more rings!!!", JSON.stringify(g.toJson()), JSON.stringify(g1.toJson()), JSON.stringify(graphic.geometry.toJson()));
//                                                            }
//                                                        } else {
//                                                            console.log("union is fine", JSON.stringify(g.toJson()), JSON.stringify(g1.toJson()), JSON.stringify(graphic.geometry.toJson()));
//                                                        }
                                                        dfd.resolve();
                                                        break;
                                                    case "modal-no":
                                                        graphic.geometry = GeometryEngine.difference(g1, g);
                                                        dfd.resolve();
                                                        break;
                                                    default:
                                                        dfd.reject();
                                                }
                                            };
                                        if (!g1.getCacheValue && _.isObject(g1)) {
                                            g1 = new Polygon(g1);
                                        }
                                        if (GeometryEngine.intersects(g, g1) && !GeometryEngine.contains(g1, g)) {
                                            var modalViewName = "drawEndPolyIntersectModalView";
                                            Nrm.event.trigger("app:modal", {
                                                id: modalViewName,
                                                caption: "Add a Part",
                                                text: "There is overlap in your new part, do you want to ADD or SUBTRACT the new part from the existing shape?",
                                                backdrop: "static",
                                                movable: true,
                                                callback: callback,
                                                buttons: 3
                                            });
                                            $("#modal-yes", $("#" + modalViewName)).text("Add");
                                            $("#modal-no", $("#" + modalViewName)).text("Subtract");
                                            resolved = false;
                                        } else {
                                            // new ring should be clockwise, especially if it's contained by another ring
                                            if (!g.isClockwise(g.rings[0])) {
                                                console.log("reversing ring");
                                                g.rings[0].reverse();
                                            }
                                            for (i = 0; i < g1.rings.length; i++) {
                                                newPart = g1.rings[i];
                                                g.addRing(newPart);
                                            }                                            
                                        }
                                        break;
                                }
                                if (resolved) {
                                    dfd.resolve();
                                }
                            }
                        }
                        $.when(dfd).done(function() {
                            if (attributes && !attributes["flmDataSource"])
                                attributes["flmDataSource"] = "24";
                            /**
                             * Triggered after creating or editing a geometry.
                             * @event module:nrm-ui/event#map:featureCreate
                             * @param {Object|external:module:esri/Graphic} graphic ESRI graphic or plain object.
                             * @param {external:module:esri/geometry/Geometry|Object} graphic.geometry The geometry
                             * @param {Object} graphic.attributes Attributes of the edit graphic.
                             * @param {Boolean} [graphic.suppressUndo=false] True to omit geometry from undo/redo stack.
                             * @param {string} [graphic.event]
                             */
                            Nrm.event.trigger("map:featureCreate",
                                    {
                                        attributes: _.omit(attributes, "appendTo"),
                                        geometry: getGraphicGeom(graphic)
                                    });
                            if (that.options.drawEndCallback) {
                                that.options.drawEndCallback.call(that, attributes, graphic);
                            }
                        }).fail(function(){
                            // Canceled the overlap dialog; restore original graphic and geometry editor control state
                            that.addSingleGraphic(attributes.appendTo, _.omit(attributes, "appendTo"), {sticky: true});
                            if (attributes && attributes.$parentControlsEnabled) {
                                attributes.$parentControlsEnabled.removeClass("disabled");
                            }
                        }).always(function(){
                            that.onDeactivateTool();
                        });
                    }
                }));
                var mapLoadHandler = connect.connect(that.mapControl.map, "onLoad", function() {
                    try {
                        if (mapLoadHandler) {
                            connect.disconnect(mapLoadHandler);
                        }
                        // artf75928: select mode should be disabled by default
                        that.mapControl.navButtonBar && that.mapControl.navButtonBar.enableButton("selectmode", false);
                        var featureEditCallback = function(options) {
                            //console.log("mapView.featureEditCallback", options);
                            if (options.graphic) {
                                options.geometry = getGraphicGeom(options.graphic);
                                options.attributes = options.graphic.attributes;
                            }
                            if (options.event === "onDeactivate" && options.info.isModified) {
                                Nrm.event.trigger("map:featureCreate", _.extend(options, {simplify:true}));
                                //Nrm.event.trigger("map:endDraw", options);
                            } else {
                                console.log("mapView featureEditCallback : trigger map:addUndo", options);
                                that.triggerShapeChange(options);
                                /**
                                 * Triggered when the edit graphic is modified
                                 * @event module:nrm-ui/event#map:featureEdit
                                 * @param {Object|external:module:esri/Graphic} graphic ESRI graphic or plain object.
                                 * @param {external:module:esri/geometry/Geometry|Object} graphic.geometry The geometry
                                 * @param {Object} graphic.attributes Attributes of the edit graphic.
                                 */
                                Nrm.event.trigger("map:featureEdit", options);
                            }
                            if (that.options.featureEditCallback) {
                                that.options.featureEditCallback.call(that, options);
                            }
                        };
                        // TODO: refactoring goal: the connect.connect calls should be moved to the map control.
                        //  If that happens, the featureEditCallback above would be passed in to the map control init options
                        connect.connect(that.mapControl.editToolbar, "onGraphicMoveStop", function(graphic, transform) {
                            featureEditCallback({
                                event: "onGraphicMoveStop",
                                graphic: graphic,
                                transform: transform
                            });
                        });
                        connect.connect(that.mapControl.editToolbar, "onRotateStop", function(graphic, info) {
                            featureEditCallback({
                                event: "onRotateStop",
                                graphic: graphic,
                                info: info
                            });
                        });
                        connect.connect(that.mapControl.editToolbar, "onScaleStop", function(graphic, info) {
                            featureEditCallback({
                                event: "onScaleStop",
                                graphic: graphic,
                                info: info
                            });
                        });
                        //connect.connect(that.mapControl.editToolbar, "onVertexAdd", function(graphic, vertexInfo) {
                            // LW: As discussed with John, the number of feature edit callback events that we capture may have been overzealous
                            // In this case, calling this causes double loading of the undo stack
//                            featureEditCallback({
//                                event: "onVertexAdd",
//                                graphic: graphic,
//                                info: vertexInfo
//                            });
                        //});
                        connect.connect(that.mapControl.editToolbar, "onVertexDelete", function(graphic, vertexInfo) {
                            featureEditCallback({
                                event: "onVertexDelete",
                                graphic: graphic,
                                info: vertexInfo
                            });
                        });
                        connect.connect(that.mapControl.editToolbar, "onVertexMoveStop", function(graphic, vertexInfo, transform) {
                            featureEditCallback({
                                event: "onVertexMoveStop",
                                graphic: graphic,
                                info: vertexInfo,
                                transform: transform
                            });
                        });
                        connect.connect(that.mapControl.editToolbar, "onDeactivate", function(tool, graphic, info) {
                            if (info.isModified) {
                                //that.mapControl.addGraphicViaGeometry(graphic.geometry, graphic.attributes);
                                featureEditCallback({
                                    event: "onDeactivate",
                                    graphic: graphic,
                                    info: info
                                });
                            } else {
                                Nrm.event.trigger("map:deactivateTool");
                            }
                            // LW: Hide the MapButtonBar when edit mode is deactivated
                            that.mapControl.mapButtonBar.hide();
                        });
                        
                        // LW: Additional event(s). onActivate and onDeactivate already exist in Map.js
                        connect.connect(that.mapControl.editToolbar, "onActivate", function(tool, graphic) {
                            // This is not called unless the toolbar was effectively activated.
                            //that.mapControl.options.editFeatureReadyCallback();
                            
                            // LW: Show the MapButtonBar when edit mode is activated
                            that.mapControl.mapButtonBar.show();
                        });                    
                        
                        // there has to be a better way to do this...
                        // sometimes the initial features don't show in layers loaded from context.
                        window.setTimeout(function() {
                            if (that.collectionLayers) {
                                _.each(that.collectionLayers, function(layer) {
                                    layer.mapControl = that.mapControl;
                                    layer.render();
                                });
                            }
                            //$.when(that._initContext()).done(function() {
                            that.dfd.resolve(that);
                            console.info("triggering map load");
                            /**
                             * Triggered when the map finishes loading.
                             * @event module:nrm-ui/event#map:onLoad
                             */
                            Nrm.event.trigger("map:onLoad");
                            if (that.options.mapLoadCallback) {
                                that.options.mapLoadCallback.call(that);
                            }
                            //}).fail(function() {
                            //    that.dfd.reject("Failed to load application context layers.");
                            //});
                        }, 500);
                        if (that.options.helpContext) {
                            $("div", that.$el).add(that.$el).addClass("nrm-help-provider").attr("data-nrm-help-context", that.options.helpContext);
                        }
                    } catch (error) {
                        // map doesn't load at all if errors are not trapped here.
                        console.error(error);
                        that.dfd.reject(error);
                    }
                });
                //var layers = that.options.layers || [];
                //for (var i in that.options.layers) {
                //    var lyr = layers[i];
                //                if (!lyr.featureClickCallback)
                //                    lyr.featureClickCallback = f;
                //    that.mapControl.setDynamicMapLayer(lyr.url, lyr.opacity, lyr);
                //}
            }
            require(["dojo/domReady!"], init);
        }

    });
});
