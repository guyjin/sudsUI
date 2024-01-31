/**
* @file The MapMeasureView module.
* @see module:nrm-map/views/mapMeasureView
*/
/** 
* @module nrm-map/views/mapMeasureView
* 
*/

define(['nrm-ui',
        'jquery',
        'underscore',
        'backbone',
        'hbs!mapMeasure',
        "dojo/dom",
        "dojo/parser",
        "esri/config",
        "esri/dijit/Measurement",
        "esri/tasks/GeometryService",
        "dojo/domReady!"
], function(Nrm,
            $,
            _,
            Backbone,
            TabContentTemplate,
            dom, 
            parser,
            esriConfig, 
            Measurement, 
            GeometryService, 
            domReady) {

    return Nrm.Views.MapMeasureView = Backbone.View.extend(/** @lends module:nrm-map/views/mapMeasureView.prototype */{
        /**
         * Create a new instance of mapMeasureView.
         * @constructor
         * @alias module:nrm-map/views/mapMeasureView
         * @classdesc
         *   A Backbone view that renders Measure Results in the Map accordion panel.
         * @param {Object} options
         * @param {esri/map} options.mapControl - Map associated with layers and events.
         * @param {string} [options.helpContext] - Online help page or URL.
         * @param {boolean} [options.panelExpanded=true] - Initial state for panel.
         * @param {string} [options.panelId="mapMeasureControl"] - HTML id for panel.
         * @param {string[]} [options.exclude=["nrmGraphicsLayer"]] - Map layerIDs to exclude from identify behavior.
         * @param {string} [options.geometryServiceURL] - URL of geometry service for projecting coordinates
         * @see {@link https://developers.arcgis.com/javascript/3/jsapi/measurement-amd.html|ArcGIS JSAPI Measure dijit}
         * 
         */
        initialize: function(options) {
            var mapMenuTitle = "Context menu for Map",
                mapMenuId = "map-default-actions";
            this.options = $.extend({}, this.defaultOptions, options);
            this.mapControl = this.options.mapControl;
            this.measureResult = {};
            this.pausableTools = ["area", "distance"];
            this.mapView = (Nrm && Nrm.app && Nrm.app.mapView) || {declareSelectionHandler:function(){
                    console.warn("mapMeasureView found no mapView");
                }};
            var mapEvents = {};
            this.contextmenu = {
                id: mapMenuId,
                title: mapMenuTitle,
                clickEvents: mapEvents,
                items: [
                    {
                        "id": "map-measure-copy",
                        "label": "Copy",
                        "href": "#mapMeasureCopy",
                        "className": "nrm-route-action"
                    },
                    {
                        "id": "map-measure-copy-children",
                        "label": "Copy with Children",
                        "href": "#mapMeasureCopyChildren",
                        "className": "nrm-route-action",
                        "ifHasChildren": true
                    },
                    {
                        "id": "map-measure-zoom",
                        "label": "Zoom to Feature",
                        "href": "#mapMeasureZoom",
                        "className": "nrm-route-action",
                        "nodeTypes": ["clickPoint", "point", "line", "polyline", "polygon", "multipoint", 
                            "esriGeometryPoint", "esriGeometryPolyline", "esriGeometryPolygon", "esriGeometryMultipoint"]
                    },
                    {
                        "id": "map-measure-pan",
                        "label": "Pan to Feature",
                        "href": "#mapMeasurePan",
                        "className": "nrm-route-action",
                        "nodeTypes": ["clickPoint", "point", "line", "polyline", "polygon", "multipoint",
                            "esriGeometryPoint", "esriGeometryPolyline", "esriGeometryPolygon", "esriGeometryMultipoint"]
                    },
                    {
                        "id": "map-measure-url",
                        "label": "Open Link in New Tab",
                        "href": "#mapMeasureOpenUrl",
                        "className": "nrm-route-action",
                        "ifUrl": true
                    }
                    
                ]
            };
        },
        defaultOptions: {
            panelExpanded: true,
            panelId: "mapMeasureControl",
            cursor: "url(" + require.toUrl("nrm-ui/img/measure-cursor.cur") + "),auto",
            exclude: ["nrmGraphicsLayer", "Copy Feature", "Temporary Shapefile"],
            snapping: false,
            helpContext: "979"
        },
        events: {
            "click #mapMeasureClose": "close",
            "contextmenu #map-measure-results-div a": "onContextMenu"
        },
        /**
         * Set up event listeners and tool activation.
         * @override
         */
        startListening: function() {
            var mapView = Nrm.app.mapView,
                declaredHandlers = _.without(mapView.selectionHandlersDeclared, "measure");
            // deactivate selection mode
            if ((this.paused || !this.isListening) && !this.disablingSelection && declaredHandlers.length > 0) {
                this.disablingSelection = true;
                Nrm.event.trigger("map:configureSelect", {deactivate: true});
                this.paused = false;
                this.startListening();
                return;
            }
            this.disablingSelection = null;
            this.setMessage("");
            this.paused = false;
            this.setCursor();
            if (this.closed || mapView.activeTool) {
                //console.log("     avoiding accidental/double activation");
                return;
            }
            this.mapView.declareSelectionHandler({id:"measure", handling:true});
            var m = this.measurement,
                toolName = this.toolName;
            if (this.pausableTools.indexOf(toolName) !== -1) {
                if (this.measureResult.geometry) {
                    m.measure(this.measureResult.geometry);
                } else {
                    m.setTool(toolName, true);
                }
            }
            if (!this.isListening) {
                this.isListening = true;
                this.listenTo(Nrm.event, {
                    "map:endDraw": this.startListening,
                    "map:deactivateTool": this.startListening,
                    "context:results": this.startListening,
                    "map:beforeActivateTool": this.beforeActivateTool
                });
                /**
                 * Clear instructional text after first measurement and store measured geometry for use in re-opening the
                 * view{@link https://developers.arcgis.com/javascript/3/jsapi/measurement-amd.html#event-measure-end|measurement#measure-end}
                 * @param {external:module:esri/dijit/Measurement#event-measure-end} event Measure End event data
                 */
                this.measureEndListener = this.measurement.on("measure-end", _.bind(function(event){
                    this.setMessage("");
                    this.clearPausedGraphic();
                    this.measureResult.geometry = event.geometry;
                    var g = this.measureResult._measureGraphic = this.measurement._measureGraphic;
                    var text = $("[dojoattachpoint=resultValue]").html() || event.values.toString() + " " + event.unitName;
                    if (g) {
                        if (_.has(g.symbol, "outline")) {
                            g.symbol.setOutline(this.measurement._lineSymbol);
                        }
                        g.attributes = {source: "measurement", text: text};
                    }
                }, this));
                /**
                 * Set unit property of stored measurement based on selected unit.
                 * @param {external:module:esri/dijit/Measurement#event-unit-change} event Unit Change event data
                 */
                this.measureUnitListener = this.measurement.on("unit-change", _.bind(function(event){
                    var u = event.toolName.replace("distance", "length"),
                        propertyName = "default" + u.substr(0,1).toUpperCase() + u.substr(1) + "Unit",
                        propertyValue = "esri" + event.unitName.replace("Sq ", "Square").replace(/[\ ()]/g, "");
                    this.measureResult[propertyName] = propertyValue;
                }, this));
                /**
                 * Set informational message and selected tool state based on whether measurement is paused.
                 * @param {external:module:esri/dijit/Measurement#event-tool-change} event Tool Change event data
                 */
                this.toolChangeListener = this.measurement.on("tool-change", _.bind(function(event){
                    var tn = this.toolName = event.toolName || event.previousToolName,
                        clearResult = true;
                    this.$resultValueDiv.html("");
                    if (!event.toolName) {
                        clearResult = false;
                    }
                    if (clearResult) this.measureResult = {};
                    this.paused = false;
                    if (_.without(this.mapView.selectionHandlersDeclared, "measure").length > 0) {
                        Nrm.event.trigger("map:configureSelect", {deactivate: true}); // this will trigger startListening?
                    }
                    //this.showToolPausedState();
                }, this));
                this.measureStartListener = this.measurement.on("measure-start", _.bind(function(event) {
                    this.hasInteracted = true;
                    this.setMessage("");
                    this.measureStartListener.remove();
                }, this));
            }
        },
        /**
         * Remove the graphic (if any) of the most recent measure from the map.
         * @returns {undefined}
         */
        clearPausedGraphic: function() {
            var graphics = this.mapControl.map.graphics,
                g = _.find(graphics.graphics, function(obj) {return obj.attributes && obj.attributes.source === "measurement";});
            if (g) {
                graphics.remove(g);
            }
        },
        /**
         * Set message text and add map graphic for last measurement (if any) based on whether measurement is paused.
         * @returns {undefined}
         */
        showToolPausedState: function() {
          if (this.hasInteracted) {
              this.setMessage("");
          }
          this.clearPausedGraphic();
          if (this.paused) {
                var tn = this.toolName;
                if (this.pausableTools.indexOf(tn) !== -1) {
                    var g = this.measureResult._measureGraphic,
                        msg = tn.substr(0,1).toUpperCase() + tn.substr(1) + " measurement is paused for other map activity.";
                    if (this.options.tabbed) {
                        msg += " Click the Measure tab again or a measurement tool to reactivate.";
                    }
                    this.measurement.clearResult();
                    this.measurement.setTool(tn, false);
                    this.toolName = tn; // setTool resets toolName to null
                    if (g) {
                        this.mapControl.map.graphics.add(g);
                        this.$resultValueDiv.html(g.attributes.text);
                    }
                    this.setMessage(msg);
                } else {
                    this.setCursor();
                    this.setMessage("");
                }
            } else {
                this.setCursor();
            }
        },
        setCursor: function() {
            this.mapView.setCursor(this.options.cursor);
        },
        /**
         * Display text above the measure widget.
         * @param {string} message
         */
        setMessage: function(message) {
            message = message || "";
            if (!this.hasInteracted && message === "" && this.$message.text().trim() === this.defaultMessage) {
                return;
            }
            this.$message.html(message);
        },
        /**
         * Disable area and length measurement when another map tool is activated.
         */
        beforeActivateTool: function() {
            if (!this.paused) {
                this.paused = true;
                this.showToolPausedState();
            }
        },
        /**
         * Override Backbone.View.stopListening to detach dojo events, then call default stopListening
         * @override
         */
        stopListening: function() {
            this.isListening = false;
            Nrm.event.trigger("map:setCursor");
            this.paused = false;
            this.mapView.declareSelectionHandler({id:"measure", handling:false});
            if (this.measurement) {
                this.measurement.destroy();
            }
            this.measureEndListener.remove();
            this.measureStartListener.remove();
            this.measureUnitListener.remove();
            this.toolChangeListener.remove();
            
            Backbone.View.prototype.stopListening.apply(this, arguments);
        },
        remove: function() {
            if (this.measurement) {
                this.measurement.destroy();
                this.measurement = undefined;
            }
            this.clearPausedGraphic();
            this.mapView.resetCursor();
            Backbone.View.prototype.remove.apply(this, arguments);
        },
        /**
         * Overrides Backbone.View.close.
         * Detaches listeners and stores the JSON definition of the current tree.
         * @override
         */
        close: function() {
            this.closed = true; // prevents accidental startListening while closed
        },
        /**
         * Overrides Backbone.View.render.
         * @returns {module:nrm-map/views/mapMeasureView}
         * @override
         */
        render: function() {
            this.closed = false; // enables startListening
            this.setElement(this.options.$el);
            this.$el.html(TabContentTemplate(this.options));
            if (this.hasInteracted) {
                this.setMessage("");
            }
            var map = this.mapControl.map;
            var divName = "measurementDiv";
            if (!this.parsed) {
                //This service is for development and testing purposes only. We recommend that you create your own geometry service for use within your applications
                //esriConfig.defaults.geometryService = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
                esriConfig.defaults.geometryService = new GeometryService(this.options.geometryServiceURL);
                parser.parse();
                this.parsed = true;
            }
            this.measurement = new Measurement(_.extend({
                        map: map,
                        advancedLocationUnits: true
                    }, this.measureResult
                ), dom.byId(divName));
            this.measurement.startup();
            function notUS(s) {
                return s && s.indexOf("(US)") === -1 && s.indexOf("US") !== s.length - 2;
            }
            this.measurement._distanceUnitStringsLong = _.filter(this.measurement._distanceUnitStringsLong, notUS);
            this.measurement._distanceUnitStrings = _.filter(this.measurement._distanceUnitStrings, notUS);
            this.measurement._areaUnitStringsLong = _.filter(this.measurement._areaUnitStringsLong, notUS);
            this.measurement._areaUnitStrings = _.filter(this.measurement._areaUnitStrings, notUS);
            $(".esriMeasurementSeparator").html("");
            this.$resultValueDiv = $("[dojoattachpoint=resultValue]");
            this.$message = $("#map-measure-info-div", this.$el);
            this.defaultMessage = this.$message.text().trim();
            this.startListening();
            this.$el.addClass("nrm-help-provider").attr("data-nrm-help-context", this.options.helpContext);
            return this;
        }
    });
});