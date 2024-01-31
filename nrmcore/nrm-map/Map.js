/**
 * @module nrm-map/Map
 * 
 */
// -------- from esrimain.js
//var that;
//var nrmmap;
// Note:
// This code uses ESRI "graphics" and graphicsLayers, rather than "features" and featureLayers.
// http://help.arcgis.com/en/webapi/javascript/arcgis/jsapi/#graphic

define(["require", "jquery", "underscore", "esri/config", "esri/map", "./dijit/MapButtonBar", "esri/toolbars/edit", "esri/toolbars/draw","esri/layers/FeatureLayer", "esri/dijit/Scalebar",
    "esri/geometry/Extent", "esri/layers/GraphicsLayer", "esri/tasks/query", "esri/layers/ArcGISDynamicMapServiceLayer", "esri/layers/ArcGISImageServiceLayer",
    "esri/graphicsUtils", "esri/SpatialReference", "esri/graphic", 
    "esri/geometry/Multipoint", "esri/geometry/Point", "esri/geometry/Polygon", "esri/geometry/webMercatorUtils",
    "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol",
    "esri/geometry/Polyline", "esri/renderers/SimpleRenderer", "esri/renderers/TemporalRenderer",
    "esri/renderers/TimeClassBreaksAger", "dijit/TooltipDialog", "dijit/registry", 
    "dojo/_base/Color", "dojo/_base/connect", "dojo/dom", "dojo/dom-style", "dijit/popup", "dojo/_base/event", 
    "dojo/_base/lang", "nrm-ui", "nrm-ui/models/settings", 
    "esri/geometry/geometryEngine",
    "./dijit/NavButtonBar",
    "esri/geometry/screenUtils",
    "nrm-ui/views/progressView",
    "nrm-ui/views/reportLauncherView",
    "nrm-ui/plugins/messageBox", "nrm-ui/plugins/nrmContextMenu", "dojo/domReady!", "esri/config",
    'esri/layers/ArcGISTiledMapServiceLayer', 'esri/geometry/jsonUtils', "esri/geometry/ScreenPoint"
], 
function(require, $, _, config, Map, MapButtonBar, Edit, Draw, FeatureLayer, 
    Scalebar, Extent, GraphicsLayer, Query, ArcGISDynamicMapServiceLayer, ArcGISImageServiceLayer, 
    graphicsUtils, SpatialReference, Graphic, 
    Multipoint, Point, Polygon, prjUtils,
    SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
    Polyline, SimpleRenderer, TemporalRenderer, TimeClassBreaksAger, TooltipDialog, registry,
    Color, connect, dom, domStyle, popup, dojoEvent, 
    lang, Nrm, Settings, 
    geometryEngine,
    NavButtonBar,
    screenUtils,
    ProgressView,
    ReportLauncherView,
    MessageBox, NRMContextMenu, dojoDOMReady, esriConfig,
    ArcGISTiledMapServiceLayer, JSONUtils, ScreenPoint
    ) {

var that;

// -------- from esrimain.js
 
//var dojoFolderLocation; 
var rootFolder;
function nrmAppRootFolder() {
    ServerLocation();
    return rootFolder;
};

//Sets up the location of where all the dojo files are located. The indexOf function returns -1 if the string is not in the href. 
function ServerLocation() {
    var scriptPath = require.toUrl('nrm-map/Map.js'),
        serverStartIndex = scriptPath.indexOf('//') + 2,
        serverEndIndex = scriptPath.indexOf('/', (serverStartIndex < 2 ? 0 : serverStartIndex));
    //var server = scriptPath.substr(serverStartIndex, serverEndIndex - serverStartIndex);
    rootFolder = scriptPath.substr(serverEndIndex, scriptPath.lastIndexOf( '/' ));
    //console.log('set server = ' + server + ' and rootFolder = ' + rootFolder);
    //dojoFolderLocation = 'js.arcgis.com/3.5'; 
    return require.toUrl('dojo');
}
// ---------- end of code from esrimain.js

var lods = [
    {"level": 0, "resolution": 156543.033928, "scale": 591657527.591555},
    {"level": 1, "resolution": 78271.5169639999, "scale": 295828763.795777},
    {"level": 2, "resolution": 39135.7584820001, "scale": 147914381.897889},
    {"level": 3, "resolution": 19567.8792409999, "scale": 73957190.948944},
    {"level": 4, "resolution": 9783.93962049996, "scale": 36978595.474472},
    {"level": 5, "resolution": 4891.96981024998, "scale": 18489297.737236},
    {"level": 6, "resolution": 2445.98490512499, "scale": 9244648.868618},
    {"level": 7, "resolution": 1222.99245256249, "scale": 4622324.434309},
    {"level": 8, "resolution": 611.49622628138, "scale": 2311162.217155},
    {"level": 9, "resolution": 305.748113140558, "scale": 1155581.108577},
    {"level": 10, "resolution": 152.874056570411, "scale": 577790.554289},
    {"level": 11, "resolution": 76.4370282850732, "scale": 288895.277144},
    {"level": 12, "resolution": 38.2185141425366, "scale": 144447.638572},
    {"level": 13, "resolution": 19.1092570712683, "scale": 72223.819286},
    { "level": 14, "resolution": 9.55462853563415, "scale": 36111.909643 }, // try to remove this level (but it's used by find my location)
    {"level": 15, "resolution": 4.77731426794937, "scale": 18055.954822},
    { "level": 16, "resolution": 2.388657133974685, "scale": 9027.977411 }, // try to remove this level
    {"level": 17, "resolution": 1.1943285668550503, "scale": 4513.988705},
    { "level": 18, "resolution": 0.5971642835598172, "scale": 2256.994353 }, // try to remove this level
    {"level": 19, "resolution": 0.29858214164761665, "scale": 1128.497176}
];

// Note:
// This code uses ESRI "graphics" and graphicsLayers, rather than "features" and featureLayers.
// http://help.arcgis.com/en/webapi/javascript/arcgis/jsapi/#graphic
    /**
     Create a new instance of the ESRI map plugin (s. 04/09)
     Requires:
     jquery, dojo
     @constructor
     @alias module:nrm-map/Map
     @author  Lee Wall
     @version 2013/04/23
     @classdesc
      Wraps the Map class from ArcGIS Javascript API to provide extended functionality for NRM applications.
     @param   domElementID This is a string containing the id of the div container that will be filled by the map
     @param   configOptionsObj This is an object with optional overrides for the default map options
    
     **/    
    var Plugin = function(elem, opts) {

        //load dependencies
        nrmAppRootFolder();
        this.that = this; // Save reference to this plugin object for methods that change context ("this").
        that = this; // maybe...? ebodin
        window.nrmmap = this;
        
        this._db = false; // this will be the localStorage database, when needed

        this.elem = elem;
        this.opts = opts;
        this.options = null; // Will be filled by the init procedure
        this.init();

        var proxyUrl = require.toUrl(this.options.proxyUrl);
        console.log('setting proxy config: ' + proxyUrl);
        esriConfig.defaults.io.proxyUrl = proxyUrl;
        esriConfig.defaults.io.alwaysUseProxy = false;
        _.each(this.options.proxyUrlPrefixes || [], function(item) {
            esriConfig.defaults.io.proxyRules.push({
                urlPrefix: item,
                proxyUrl: proxyUrl
            });
        });
               
//        esriConfig.defaults.io.proxyRules.push({
//            urlPrefix: "166.2.126.54",
//            proxyUrl: proxyUrl
//        });
        // Initialize map
        /** 
         * @member {external:module:esri/map} 
         * @see {@link https://developers.arcgis.com/javascript/jsapi/map-amd.html|Map class - ArcGIS API for Javascript}
         * 
         */
        this.map = new Map(this.elem, {
            center: [this.options.x, this.options.y], zoom: this.options.z, // 3.3 or greater
            slider: false, // this hides zoom buttons, which we add in the navButtonBar
            lods: lods, logo: false, autoResize: this.options.autoResize
            ,showAttribution: false
        });
        this.map.nrmOptions = {nrmmap: this};

//        ebodin moved to mapOnLoad 2015/11/03
//        if (this.options.mobile) {
//            this._initTileCache();
//        }
   
       
        connect.connect(this.map, "onLoad", mapOnLoad);
        if (this.options.errorCallback) {
            this.map.on('layer-add-result', function(event) {
                //console.log('layer-add-result',event);
                if (event.error)
                    that.options.errorCallback(_.extend({source: event.layer.url}, event.error));
            });
        }
        //artf48289 : 508 - add "alt" tag to layer tiles
        this.map.on('update-end', function() {
            //console.log("Map update-end");
            $(".esriMapLayers img,.layersDiv img").not('[alt]').attr("alt", ""); // .layersDiv for jsapi < 3.15
        });
        // Add support objects
        this.mapSupport = {};

        // At this point we should really check to see whether to restore previous session or move to the next block
        //     the one complication is that it has to be async.  So for now, we just load the map as usual, and restore settings in mapOnLoad
        //     ebodin 1/7/2014
        // Add the base map
        //this.setBaseMap(this.options.mapSource);
        this.map.setLevel(this.options.z); // Use this to force the zoom level. This is only valid eith at tile service.

        // Add a dynamic map layer
        // Note: we assume the "dynamicLayerSource" option contains the full URL
        // In the future, we might want to detect a reletiveURL and prepend the "mapServicesSource" accordingly.
        // ebodin: actually, we might want to have multiple dynamic layers, so we'll have to revisit (ebodin did so 12/2013)
        this.mapSupport.dynamicMapLayers = [];
        for (var i = this.options.layers.length - 1; i >= 0; i--) {
            var lyr = this.options.layers[i];
            this.setDynamicMapLayer(lyr.url, lyr.opacity, lyr);
        }
        if (this.options.dynamicLayerSource != null) {
            this.setDynamicMapLayer(this.options.dynamicLayerSource, this.options.dynamicLayerOpacity);
        } //else {
            // Ignore this layer for now. The user might include it later.
            //this.mapSupport.dynamicMapLayer = null;
        //}

        // Add the graphics layer. This layer will contain the features.
        this.mapSupport.selectedGraphics = [];
        this.mapSupport.graphicsLayer = new GraphicsLayer({id: "nrmGraphicsLayer"});
        this.map.addLayer(this.mapSupport.graphicsLayer);

        // Set the default spatial reference
        // 
        // this.map.spatialReference = new esri.SpatialReference(this.options.spatialReferenceWKID);

        // Setup feature dialog/tooltip
        this.map.infoWindow.resize(245, 125);
        this.dialog = new TooltipDialog({
            id: "tooltipDialog",
            style: "position: absolute; width: 250px; font: normal normal normal 10pt Helvetica;z-index:100"
        });
        this.dialog.startup();



        // Initialize toolbars
        this.editToolbar = null;
        this.selectionToolbar = null;
        this.drawGraphicsAttributes = {}; // This will contain the custom attributes to place in the graphic after creation such as "ID"

        //this.scalebar = null;

//        function mapOnUnload(){
//            console.log('mapOnUnload');
//            try {
//                if (nrmmap.options.restoreSettings) {
//    	            nrmmap.saveSettings(nrmmap.options.restoreSettings);
//                }
//            } catch (ex) {
//                    console.log('Error in mapOnUnload: ' + ex.message);
//            }
//        }
//
//        dojo.addOnUnload(mapOnUnload);


        function mapOnLoad(map) {
            // Add toolbars

            // add touch support for zoom buttons
//            if ($.fn.addTouch) {
//              $('.esriSimpleSliderDecrementButton').addTouch(); 
//              $('.esriSimpleSliderIncrementButton').addTouch(); 
//            }

            map.disableKeyboardNavigation();
            
            // JS 09/24/15: the svg element (container for graphics layers) is tabbable by default only in IE
            //  Since there is no keyboard navigation support when the svg element is focused, best option is to disable for now.
            $("#" + that.elem + " svg").attr("focusable", "false");
            
            that.mapdiv = dom.byId(that.elem);
            if (!that.mapdiv.tabIndex || that.mapdiv.tabIndex < 0)
                that.mapdiv.tabIndex = 0;
            connect.connect(that.mapdiv, "onkeydown", function(evt) {
                switch (evt.which) {
                    case 37: // left
                    case 100: // numpad 4
                        map.panLeft();
                        break;

                    case 39: // right
                    case 102: // numpad 6
                        map.panRight();
                        break;

                    case 38: // up
                    case 104: // numpad 8
                        map.panUp();
                        break;

                    case 40: // down
                    case 98: // numpad 2
                        map.panDown();
                        break;

                    case 187: // =+
                    case 107: // numpad +
                        map.setZoom(map.getZoom() + 1);
                        break;

                    case 189: // -_
                    case 109: // numpad -
                        map.setZoom(map.getZoom() - 1);
                        break;

                    case 97: // numpad 1
                        map.panLowerLeft();
                        break;

                    case 99: // numpad 3
                        map.panLowerRight();
                        break;

                    case 103: // numpad 7
                        map.panUpperLeft();
                        break;

                    case 105: // numpad 9
                        map.panUpperRight();
                        break;

//                    case 101: // numpad 5
                    default:
                        return true;
                }
                evt.preventDefault();
                return false;
            });

            that.editToolbar = new Edit(that.map);

            // LW: Facility for toolbar/Dojo widget ========================================================================
            // Now that the editToolbar is defined, we can pass it to the mapButtonBar
            that.mapButtonBar = new MapButtonBar({
                map: that.map,
                editToolbar: that.editToolbar,
                visible: false
            }, "MapButtonBar"); // LW: Tie widget to DIV. There is some Dojo widget magic that happens here related to "dijit/_WidgetBase"

            that.mapButtonBar.startup();
            
            that.navButtonBar = new NavButtonBar({
                cursors: that.options.cursors,
                map: that.map,
                visible: true
            }, "NavButtonBar");
            that.navButtonBar.startup();
        
            // LW: End facility ============================================================================================

            // Draw handles both feature selection and drawing functions. Events are shared.
            that.selectionToolbar = new Draw(that.map);

            // Sets whether the polygon geometry should be modified to be topologically correct.
            // If the polygons are not captured in the correct order, counter-clockwise order, then Oracle error results
            // From: artf36489 : Polygon Drawing Error
            that.selectionToolbar.setRespectDrawingVertexOrder(true); // False switches all gemotry to counter-clockwise

            connect.connect(that.editToolbar, "onActivate", function(tool, graphic) {
                // This is not called unless the toolbar was effectively activated.
                that.options.editFeatureReadyCallback();
            });
            connect.connect(that.editToolbar, "onDeactivate", function(tool, graphic, info) {
                if (info.isModified) {
                    // Possibly execute a "featureWasModified" callback here
                }
            });

            if (that.options.scalebar === true) {
                that.scalebar = new Scalebar({
                    map: that.map,
                    // "dual" displays both miles and kilmometers // NOTE dual doesn't appear to work
                    // "english" is the default, which displays miles
                    // use "metric" for kilometers
                    scalebarUnit: "dual" //"english"
                }, dom.byId(that.elem + "_root"));
                // Apply a positioning fix for the scalebar to place it in the lower left of the map
                $("div.esriScalebar").css("bottom", "18px").css("left", "10px");
            }

            // Add handlers for clicking on Features and activating and deactivating the popups
            that.map.graphics.enableMouseEvents();

            if (that.options.restoreSettings) {
                //console.log("we're going to restore setings on load!");
                that.restoreSettings(that.options.restoreSettings);
                //that.restoreSettings(_.extend(that.options.restoreSettings, {key: location.origin + location.pathname}));
            }

            // User clicks in the map, BUT NOT on a feature
            connect.connect(that.map, "onClick", function(mouseEvent) {
                //console.log('map.onClick');
                //console.dir(mouseEvent);
                // Close the dialog no matter what just in case we entered editing mode with the dialog open
                that.closeDialog();
                //that.clearGraphicSelection();
                that.mapdiv.focus();

                if (that.options.editMode) {
                    that._deactivateEditingToolbar();
                }

                var selectable = false, layerIndex, ids, dynamicMapLayer, featureLayer, selectQuery;
                // did the user click on a selectable dynamic map layer?
                for (layerIndex = 0; layerIndex < that.mapSupport.dynamicMapLayers.length; layerIndex++) {
                    ids = new Array();
                    dynamicMapLayer = that.mapSupport.dynamicMapLayers[layerIndex];
                    if (dynamicMapLayer && dynamicMapLayer.visible && dynamicMapLayer.nrmOptions.selectable && 
                            dynamicMapLayer.visibleAtMapScale) {
                        if (!selectable) {
                            that.clearGraphicSelection();
                            /**
                             * Selected graphics have been cleared in the map
                             * @event module:nrm-ui/event#clearAllTableSelections
                             */
                            Nrm.event.trigger("clearAllTableSelections");
                        }
                        selectable = true;
                        featureLayer = dynamicMapLayer.nrmOptions.featureLayer;
                        //var map = this; //that.map;
                        if (featureLayer.url === undefined) {
                            // TODO: select from graphics
                        } else {
                            // if it's a layer with keyfield and callback, add selected features to the selectedGraphicsLayer,
                            // else use the featureLayer hooked to the map layer to show selections
                            //var selectQueryLayer = dynamicMapLayer;
                            selectQuery = new Query();
                            selectQuery.geometry = mouseEvent.mapPoint;
                            selectQuery.returnGeometry = true;
                            if (dynamicMapLayer.nrmOptions.whereClause) {
                                selectQuery.where = dynamicMapLayer.nrmOptions.whereClause;
                            }
                            if (dynamicMapLayer.nrmOptions.keyFieldName) {
                                selectQuery.outFields = ["*"]; // [dynamicMapLayer.nrmOptions.keyFieldName.toUpperCase()];
                            }
                                //console.log('about to selectFeatures from URL ' + featureLayer.url, selectQuery);
                            //var thisFeatureLayer = featureLayer;
                            featureLayer.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW,
                                function(features, selectionMethod){
                                    //console.log('selectFeatures returned with ' + features.length + ' features from ' + featureLayer.url);
                                    //console.dir(features);
                                    // check if we need to zoom to features
                                    if (features.length > 0) {
                                        if (dynamicMapLayer.nrmOptions.keyFieldName) {
                                            var i, iMax;
                                            //for (i = 0; i < features.length; i++) {
                                            for (i = 0, iMax = features.length; i < iMax; i += 1) {
                                                var f = features[i];
                                                var id = f.attributes[dynamicMapLayer.nrmOptions.keyFieldName];
                                                if (id.trim() !== '') {
                                                    ids.push(id);
                                                    f.id = id;
                                                    that.selectGraphic(f);
                                                }
                                            }
                                            // execute selection callback with all the feature IDs?
                                            if (dynamicMapLayer.nrmOptions.featureClickCallback) {
                                                dynamicMapLayer.nrmOptions.featureClickCallback(ids);
                                            }

                                        }
                                        else {
                                            var symbol = that._getGeometrySymbol(features[0].geometry.type,true);
                                            featureLayer.setSelectionSymbol(symbol);
                                        }
                                        if (dynamicMapLayer.nrmOptions.zoomToSelection) { // && !that.map.extent.contains(features)) {
                                            //that.map.setExtent(esri.graphicsExtent(features), true);
                                            that._zoomTo({graphics: features});
                                        }
                                    }
                                    },
                                    function(err) {
                                        console.warn("Error from selectFeatures service", err);
                                }
                            );
                        }
                    } // selectable layer
                } // dynamicMapLayers loop
                if (!selectable) {
                    that.options.mapClickCallback();
                }
            });
            
            that.mouseOverHandler = that.map.on("mouse-over", function(mouseEvent) {
                that.setCurrentCursor();
            });
            that.setCurrentCursor = function () {
                // if we're in selection mode, add a + or - symbol to the mapcursor
                //console.log("setCurrentCursor " + this.map._cursor + " or " + this.options.cursors.select, this.map, Nrm.app.mapView.mapControl.map);
                var c = this.map._cursor, newC, selectionMethod = "new",
                    isCtrl = this.keyDown ? this.keyDown.ctrlKey : false,
                    isShift = this.keyDown ? this.keyDown.shiftKey : false,
                    isAlt = this.keyDown ? this.keyDown.altKey: false;
                if ([this.options.cursors.select, this.options.cursors.selectAdd, this.options.cursors.selectRemove].indexOf(c) > -1) {
                    if (isCtrl && !isShift && !isAlt) {
                        newC = this.options.cursors.selectRemove;
                        selectionMethod = "subtract";
                    } else if (!isCtrl && isShift && !isAlt) {
                        newC = this.options.cursors.selectAdd;
                        selectionMethod = "add";
                    } else if (!isCtrl && !isShift && !isAlt) {
                        newC = this.options.cursors.select;
                        selectionMethod = "new";
                    }
                }
                this.selectionMethod = selectionMethod;
                if (newC) {
                    if (newC !== c) {
                        this.map.setMapCursor(newC);
                        // next two lines display new cursor without moving mouse
                        $("body").addClass("fake");
                        $("body").removeClass("fake");
                    }
                }
            };
            that.map.on("key-down", function(keyboardEvent) {
                that.keyDown = keyboardEvent;
                that.setCurrentCursor();
            });
            that.map.on("mouse-out", function() {
                that.keyDown = null;
            });
            that.map.on("key-up", function(keyboardEvent) {
                that.keyDown = null;
                that.setCurrentCursor();
            });
            connect.connect(that.map, "onMouseDown", function(evt) {
                if (that.options.mouseDownCursor) {
                    this.setMapCursor(that.options.mouseDownCursor);
                }
            });
            connect.connect(that.map, "onMouseUp", function(evt) {
                that.keyDown = null;
                if (that.options.mouseDownCursor) {
                    this.setMapCursor(that.options.cursor);
                }
            });

            // User clicks on the map, AND on a feature
            connect.connect(that.mapSupport.graphicsLayer, "onClick", that._graphicsLayerClick);

            // This can be called in two circumstances.
            // 1) When the user draw new features to be added to the map
            // 2) When the user draws an extent, meant as a selection box for selecting multiple features
            // If (1) then this adds the graphic to the graphics layer when the drawing is concluded.
            //      Drawing toolbar is automatically disabled after the first graphic is completed
            //      ... so features can only be creted one at a time.
            // if (2) then the extent is compated to existing geometry in the map to determine which
            //      should be selected, and which should be deselected.
            connect.connect(that.selectionToolbar, "onDrawEnd", function(geometry) {

                var newGraphic;
                var existingGraphic;
                var existingGraphicGeometryType;
                var existingFeatureIsSelectable;
                
                if (geometry.type === "polygon" && geometry.rings[0].length < 4) {
                     Nrm.MessageBox("A polygon must have at least three vertices.", {helpContext: "890"});
                    return;
                }
                //if (geometry.type === "extent") {
                if (this._geometryType === "rectangle") {
                    //
                    // Extent box drawing for feature selection completed
                    //
                    // drawing a rectangle with a single-click results in a default 96 pixel square, which is much too big for this purpose
                    var screenExtent = screenUtils.toScreenGeometry(map.extent, map.width, map.height, geometry.getExtent()),
                        isPoint = screenExtent.getWidth() === 96 && screenExtent.getHeight() === 96,
                        geom = isPoint ? Polygon.fromExtent(that.pointToExtent(geometry.getCentroid(), {tolerance: 10})) : geometry;
                    geometry = geom.getExtent();

                    //that.deactivateSelectionMode();
                    
                    if (that.options.selectionEndCallback && that.options.selectionEndCallback(geometry))
                        return;
                    
                    // is this where we need to query map services???? ebodin 1/27/2014
                    //for (var i = 0; i < that.graphicsLayer.graphics.length; i++) {
                    var i, iMax;
                    for (i = 0, iMax = that.graphicsLayer && that.graphicsLayer.graphics.length; i < iMax; i += 1) {
                        existingGraphic = that.graphicsLayer.graphics[i];
                        existingGraphicGeometryType = existingGraphic.geometry.type;

                        // By default, features are selectable unless otherwise specified
                        existingFeatureIsSelectable = (typeof existingGraphic.attributes.selectable !== "undefined") ? existingGraphic.attributes.selectable : true;

                        if ((existingFeatureIsSelectable) && (geometry.contains(existingGraphic.geometry))) {
                            that.selectGraphic(existingGraphic);
                            that._activateEditingToolbar(existingGraphic); // This will only work for one graphic, due to the toolbar design. In this case, the last graphic in the array will be activated for editing.
                        }
                    }
                } else {
                    //
                    // Feature drawing completed
                    //
          
                    that.deactivateDrawMode(); // This line disables the drawing toolbar after the creation and addition of this graphic to the map graphics layer
                    newGraphic = that.addGraphicViaGeometry(geometry, that.drawGraphicsAttributes);
                    that.options.drawEndCallback(that.drawGraphicsAttributes, newGraphic); // User configurable callback
                }
            });

            if (that.options.mobile) {
                that._initTileCache();
            }

            //console.log("DONE EVENT HANDLERS");
        }
        ;

    };

    Plugin.prototype = {
        defaults: {
            debug: false, // This enables or disables the display of console messages
            restoreSettings: "false", // true, false, ask, ["setting types"] - runs restoreSettings
            minZoomToScale: 577790,
            x: -99.3,
            y: 39.0,
            z: 4, //z: 10,
            mapSource: "Satellite",
            proxyUrl: "./proxy.jsp",
            helpContext: "882",
            helpContextShapefilePrep: "895",
            helpContextShapefileLayer: "884",
            helpContextShapefileImport: "894",
            helpContextCopyFeature: "889",
            // The proxy is blocked by the firewall in NITC mid-tier, so this only works on developer machines.
            //proxyUrlPrefixes: [ "166.2.126.54" ],  
            proxyUrlPrefixes: [], 
            printTaskUrl: "https://apps.fs.usda.gov/arcn/rest/services/wo_nrm_iweb/NRM_PrintService_01/GPServer/Export%20Web%20Map",
            layers: [{
                url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer',
                tiled: true
            }],
            mapServicesSource: "https://apps.fs.usda.gov/arcn/rest/services",
            // WGS84(WKID:4326) the projection used by GPS systems
            // Web Mercator Aux Sphere (WKID:3857) a projection meant to replace 102100
            spatialReferenceWKID: 3857,
            dynamicLayerSource: null,
            dynamicLayerOpacity: 0.3,
            symbol: {
                normal: {
                    marker: {
                        style: "STYLE_CIRCLE",
                        size: 18
                    },
                    line: {
                        style: "STYLE_SOLID",
                        color: [255, 0, 0], // was 0,0,0
                        thickness: 1
                    },
                    fill: {
                        style: "STYLE_SOLID",
                        color: [255, 255, 255, 0.33]
                    }
                },
                selected: {
                    // cyan
                    marker: {
                        style: "STYLE_CIRCLE",
                        size: 18
                    },
                    line: {
                        style: "STYLE_SOLID",
                        color: [0, 255, 255], // was 0,0,0
                        thickness: 1
                    },
                    fill: {
                        style: "STYLE_SOLID",
                        color: [72, 209, 204, 0.33]
                    },
                    polygon: {
                        style: "STYLE_SOLID",
                        color: [72, 209, 204, 0.33]
                    }
                }, 
                highlighted: {
                    // yellow?
                    marker: {
                        style: "STYLE_CIRCLE",
                        size: 19
                    },
                    line: {
                        style: "STYLE_SOLID",
                        color: [255, 255, 0], 
                        thickness: 2
                    },
                    fill: {
                        style: "STYLE_SOLID",
                        color: [255, 255, 0, 0.33]
                    },
                    polygon: {
                        style: "STYLE_SOLID",
                        color: [255, 255, 0, 0.33]
                    }
                },
                temporary: {
                    // lime
                    marker: {
                        style: "STYLE_CIRCLE",
                        size: 19,
                        color: [0, 255, 0]
                    },
                    line: {
                        style: "STYLE_SOLID",
                        color: [0, 255, 0],
                        thickness: 2
                    },
                    fill: {
                        style: "STYLE_SOLID",
                        color: [0, 255, 0, 0.33]
                    },
                    polygon: {
                        style: "STYLE_SOLID",
                        color: [0, 255, 0, 0.33]
                }
            },
                imported: {
                    // magenta
                    marker: {
                        style: "STYLE_CIRCLE",
                        size: 19,
                        color: [255, 0, 255]
                    },
                    line: {
                        style: "STYLE_SOLID",
                        color: [255, 0, 255], 
                        thickness: 2
                    },
                    fill: {
                        style: "STYLE_SOLID",
                        color: [255, 0, 255, 0.33]
                    },
                    polygon: {
                        style: "STYLE_SOLID",
                        color: [255, 0, 255, 0.33]
                    }
                },
                singular: {
                    marker: {
                        style: "STYLE_CIRCLE",
                        size: 12,
                        color: [255, 0, 0]
                    },
                    line: {
                        style: "STYLE_SOLID",
                        color: [255, 0, 0],
                        thickness: 2
                    },
                    fill: {
                        style: "STYLE_SOLID",
                        color: [255, 0, 0, 0.33]
                    },
                    polygon: {
                        style: "STYLE_SOLID",
                        color: [255, 0, 0, 0.33]
                    }
                }
            },
            cursors: {
                pan: "url(" + require.toUrl("nrm-ui/img/pan-cursor.cur") + "),move",
                select: "url(" + require.toUrl("nrm-ui/img/select-cursor.cur") + "),auto",
                selectAdd: "url(" + require.toUrl("nrm-ui/img/select-cursor-add.cur") + "),auto",
                selectRemove: "url(" + require.toUrl("nrm-ui/img/select-cursor-remove.cur") + "),auto"
            },
            editMode: false,
            scalebar: true,
            mapClickCallback: function() {
            },
            featureClickCallback: function(id) {
            }, // This is called when the feature is clicked, regardless of edit state (currently executes after "editFeature" callbacks)
            editFeatureStartCallback: function() {
            }, // This is called as soon as the feature is clicked in edit mode
            editFeatureReadyCallback: function() {
            }, // This is called when the edit feature toolbar is activated
            drawEndCallback: function(attributes, graphic) {
            },
            messages: {shapefileMemory: "The file may be too large. Please try a smaller file."
                                   + "\n\nSave any unchanged work."
                                   + "\nRestart the web browser if you continue to receive memory-related errors."
                       },
            mobile: false,
            autoResize: true // set this to false if map is in the NrmLayout panel
        },
        init: function() {
            this.options = $.extend(true, {}, _.omit(this.defaults, 'layers'), this.opts);
            if (!this.options.layers) { // must be extended separately due to array index mismatch
                this.options.layers = $.extend(true, [], this.defaults.layers);
            }
            Object.defineProperty(this,"basemap", {get: function(){return this.getBaseMap();}});
            return this;
        },
        getBaseMap: function(){
            var layers = this.map.getLayersVisibleAtScale(this.map.getScale()),
                i, len = layers.length;
            for (i = 0; i < len; i++) {
                if (layers[i].url !== undefined) {
                    return layers[i];
                }
            }
        },
        destroyAllMaps: function() {
            try {
                registry.forEach(function(w) {
                    w.destroy();
                });
            } catch (err) {
                alert("Error destroying map widgets");
           }
        },
        openDialog: function(graphic, x, y) {
            // Only attempt if popup HTML is defined (popups for the map are enabled)
            if ((typeof this.options.renderPopupHTML !== "undefined") && (this.options.renderPopupHTML !== null)) {
                var popupHtml = this.options.renderPopupHTML(graphic.attributes);
                this.dialog.setContent(popupHtml);
                domStyle.set(this.dialog.domNode, "opacity", 0.85);
                popup.open({popup: this.dialog, x: x, y: y});
            }
        },
        closeDialog: function() {
            // Only attempt if popup HTML is defined (popups for the map are enabled)
            if ((typeof this.options.renderPopupHTML !== "undefined") && (this.options.renderPopupHTML !== null)) {
                popup.close(this.dialog);
            }
        },
        /**
         * Adds an ArcGIS map or image service layer to the map.
         * Returns an ArcGISDynamicMapServiceLayer, ArcGISImageServiceLayer or ArcGISTiledMapServiceLayer, extended as follows:
         *  nrmOptions: the opts object supplied in the opts argument, plus:
         *      nrmmap: a reference to the plugin
         *      featureLayer: to be used in feature selection
         *      setWhereClause(whereClause) function to modify the filter on the layer dynamically
         * @param {string} url - URL ending in MapService or ImageService, or a layer ID (e.g. ...MapService/0)
         * @param {number} opacity - 0 (transparent) to 1 (opaque)
         * @param {Object} [opts]
         * @param {string} [opts.caption] - Caption/title for layer in Table of Contents; defaults to service name from the url.
         * @param {function} [opts.featureClickCallback] - function(ids) callback function that takes an array of values
         * @param {string} [opts.keyFieldName] - when features are selected, the values of this field are sent to featureClickCallback()
         * @param {Object} [opts.layerOptions] - Options to pass to the constructor of the 
         *  {@link https://developers.arcgis.com/javascript/3/jsapi/arcgisdynamicmapservicelayer-amd.html#arcgisdynamicmapservicelayer1 ArcGISDynamicMapServiceLayer}, 
         *  {@link https://developers.arcgis.com/javascript/3/jsapi/arcgisimageservicelayer-amd.html#arcgisimageservicelayer1 ArcGISImageServiceLayer}, 
         *  {@link https://developers.arcgis.com/javascript/3/jsapi/arcgistiledmapservicelayer-amd.html#arcgistiledmapservicelayer1 ArcGISTiledMapServiceLayer}.
         * @param {number} [opts.minScale] - do not display when zoomed out beyond this scale (1:minScale)
         * @param {number} [opts.maxScale] - do not display when zoomed in beyond this scale (must be < maxScale)
         * @param {boolean|string} [opts.offline=false] - enable the layer for disconnected use?
         *      true: create a snapshot feature layer and use it instead of the map layer
         *      false: (default) proceed as usual
         *      onCheckout: (not yet implemented!) flag this for creation of snapshot feature layer on checkout
         * @param {boolean} [opts.selectable=false] - user can click on features to highlight them
         * @param {boolean} [opts.tiled=false] - Force layer to be created as a ArcGISTiledMapServiceLayer.
         * @param {boolean} [opts.visible=true] - Make layer visible (displayed) after loading in map.
         * @param {number[]} [opts.visibleLayers] - layerIDs of layers to make visible
         * @param {string} [opts.whereClause] - sql where clause filters the features returned in the layer
         * @param {boolean} [opts.zoomToSelection=false] - map zooms to selected features 
         * @returns {external:module:esri/layers/Layer}
         */
        setDynamicMapLayer: function(url, opacity, opts) {
            if (opacity === undefined){
                opacity = 1;
            }
            if (opts === undefined) {
                opts = {};
            }

            //var mapServiceOpts = {opacity: opacity};
            var mapServiceOpts = _.extend({
                opacity: opacity, 
                visible: opts.visible === undefined ? true : opts.visible
            }, opts.layerOptions);

            // is this a reference to a map or a layer?  Get both URLs
            var mapServiceURL, serviceType;
            var layernum = url.substr(url.lastIndexOf('/') + 1);
            if (isNaN(layernum)) {
                // last word is not a number, so it's a map service
                mapServiceURL = url;
                layernum = false;
            }
            else {
                mapServiceURL = url.substr(0, url.lastIndexOf('/'));
            }
            //this.mapSupport.dynamicMapLayer = new esri.layers.ArcGISDynamicMapServiceLayer(
            //var lyr = this.mapSupport.dynamicMapLayer;
            //http://166.2.126.55/ArcGIS_RSAC/rest/services/ClearingHouse_Imagery/Nationwide_Select_1m_NAIP08_DC/ImageServer
            //https://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer
            var lyr, 
                mapServiceURLparts = mapServiceURL.split('/'),
                caption = opts.caption,
                match, 
                re = /\/([^\/]+)\/(MapServer|ImageServer)/g;
            if (!caption) {
                while (match = re.exec(mapServiceURL)) {
                    caption = match[1];
                }
            }
            if (caption) {
                caption = caption.replace(/_/g, " ");
                opts.caption = caption;
            }
            if (_.last(mapServiceURLparts).toLowerCase() === "imageserver") {
                serviceType = "image";
                lyr = new ArcGISImageServiceLayer(mapServiceURL, mapServiceOpts);
                lyr.id = mapServiceURLparts[mapServiceURLparts.length -2];
            } else if (opts.tiled) {
                serviceType = "tiled";
                lyr = new ArcGISTiledMapServiceLayer(
                    mapServiceURL, 
                    mapServiceOpts);
                
            } else {
                serviceType = "map";
                lyr = new ArcGISDynamicMapServiceLayer(
                    mapServiceURL, 
                    mapServiceOpts);
            }
            // function to set and update the layer definitions
            lyr.setWhereClause = function(whereClause) {
                this.nrmOptions.whereClause = whereClause;
                var layerDefinitions = [];
                for (var i = 0; i < this.layerInfos.length; i++) {
                    layerDefinitions[i] = whereClause;
                }
                this.setLayerDefinitions(layerDefinitions, false);
            };
            
            if (opts.whereClause) {
                lyr.on("load", 
                        function(evt){
                            evt.layer.setWhereClause(opts.whereClause);
                        }
                );
            }
            
            //this.mapSupport.dynamicMapLayers.push(lyr); // 1/14/2014 moved lower

            if (layernum) {
                lyr.setVisibleLayers([layernum]);
            } else if (opts.visibleLayers) {
                lyr.setVisibleLayers(opts.visibleLayers);
            }

           if (opts.minScale || opts.maxScale) {
               connect.connect(lyr, "onLoad", function() {
                  if (opts.maxScale) {lyr.maxScale = opts.maxScale;}
                  if (opts.minScale) {lyr.minScale = opts.minScale;}
                });
            }

            if (opts.maxScale) {this._layersMaxScale = opts.maxScale;}
            if (opts.minScale) {this._layersMinScale = opts.minScale;}

            opts.nrmmap = this; //11/5/13
            opts.url = url;
            lyr.nrmOptions = opts;
            //console.log('setDynamicLayer using these options for ' + url, opts);
            if (!opts.offline || opts.offline != true) {
                this.mapSupport.dynamicMapLayers.push(lyr);
                this.map.addLayer(lyr); //, 1); // Note: Layer 1 is just above the basemap which is always 0
            }

            // if this is a selectable layer but not involved in callbacks, etc,
            // use a feature layer instead of getting mixed up in the selected graphics layer
            //if (opts.selectable) { // && !opts.KeyFieldName) {
            if (serviceType === "map" && (opts.selectable || opts.offline)) { // && !opts.KeyFieldName) {
                var flayerOpts = {opacity: opacity, name: lyr.name};
                if (opts.offline) {
                    $.extend(flayerOpts, {mode: FeatureLayer.MODE_SNAPSHOT});
                    if (opts.maxScale) {
                        $.extend(flayerOpts, {maxScale: opts.maxScale});
                    }
                    if (opts.minScale) {
                        $.extend(flayerOpts, {minScale: opts.minScale});
                    }
                }
                else {
                    $.extend(flayerOpts, {mode: FeatureLayer.MODE_SELECTION});
                }
                if (opts.keyFieldName) {
                    $.extend(flayerOpts, {outFields: [opts.keyFieldName]});
                }
                var flayer = new FeatureLayer(url, flayerOpts);
                flayer.nrmOptions = lyr.nrmOptions;
                lyr.nrmOptions.featureLayer = flayer;
                //if (!opts.keyFieldName) {
                if (!opts.keyFieldName || opts.offline) {
                    this.map.addLayer(flayer, 1);
                    lyr = flayer;
                    connect.connect(lyr, "onClick", this._graphicsLayerClick);
                }
            }
            return lyr; // added 12/11/2013

        },
        removeDynamicMapLayer: function(lyr) {
            var layers = this.mapSupport.dynamicMapLayers;
            if (lyr) {
                try {
                    this.map.removeLayer(lyr);
                }
                catch (ex) {}
                try {
                    var index = layers.indexOf(lyr);
                    if (index > -1) {
                        layers.splice(index,1);
                    }
                }
                catch (ex) {}
            } else {
                for (var i = 0; i < layers.length; i++) {
                    try {
                        this.map.removeLayer(layers[i]);
                    }
                    catch (ex) {}
                }
                this.mapSupport.dynamicMapLayers = [];
            }
        },
        zoomToAll: function() {
            var graphics = this.mapSupport.graphicsLayer.graphics;
            if (graphics.length !== 0) {
                var extent = graphicsUtils.graphicsExtent(graphics);
                try {
                    this.map.setExtent(extent, true);
                } catch (e) {
                    // Meant to catch the "Uncaught TypeError: Cannot call method 'toJson' of null" error.
                }
            }
        },
        setExtent: function(xmin, ymin, xmax, ymax) {
            // Assumes 4326 as the default "well-known ID" spatial reference
            // http://help.arcgis.com/en/arcgisserver/10.0/apis/rest/pcs.html
            // Set the current extent of the map in map units.
            var ref = new SpatialReference({wkid: 4326});
            var extent = new Extent(xmin, ymin, xmax, ymax, ref);
            try {
                this.map.setExtent(extent, true);
            } catch (e) {
                // Meant to catch the "Uncaught TypeError: Cannot call method 'toJson' of null" error.
            }
        },
        setExtentGeographic: function(xmin, ymin, xmax, ymax) {
            // Set the extent (or bounding box) of the map in geographic coordinates.
            // Available only when the map's spatial reference is Web Mercator or Geographic (wkid 4326).  (As of v3.3)
            var extent = this.map.geographicExtent;
            extent.update(xmin, ymin, xmax, ymax, extent.spatialReference);
            this.map.setExtent(extent, true);
        },
        _getPointSymbol: function(name) {
            var symbol;
            symbol = new SimpleMarkerSymbol(
                    SimpleMarkerSymbol[this.options.symbol[name].marker.style],
                    this.options.symbol[name].marker.size,
                    this._getLineSymbol(name),
                    new Color(this.options.symbol[name].fill.color)
                    );
            return symbol;
        },
        _getLineSymbol: function(name) {
            var symbol;
            symbol = new SimpleLineSymbol(
                    SimpleLineSymbol[this.options.symbol[name].line.style],
                    new Color(this.options.symbol[name].line.color),
                    this.options.symbol[name].line.thickness
                    );
            return symbol;
        },
        _getPolygonSymbol: function(name) {
            var symbol;
            symbol = new SimpleFillSymbol(
                    SimpleFillSymbol[this.options.symbol[name].fill.style],
                    this._getLineSymbol(name),
                    new Color(this.options.symbol[name].fill.color)
                    );
            return symbol;
        },
        _getGeometrySymbol: function(geometryType, selected) {
            // The attributes object may be used in the future for custom geometries.
            // By combining geometryType and a custom attribute value, we can create special lookups
            // in the "this.options.symbol[name]" object structure.

            var symbol = null;
            var flag = selected; //false; // Default to the non-selected symbol for the given geometry.

            switch (geometryType) {
                case "polygon":
                    symbol = (flag) ? this._getPolygonSymbol("selected") : this._getPolygonSymbol("normal");
                    break;
                case "polyline":
                    symbol = (flag) ? this._getLineSymbol("selected") : this._getLineSymbol("normal");
                    break;
                case "point":
                case "multipoint":
                    symbol = (flag) ? this._getPointSymbol("selected") : this._getPointSymbol("normal");
                    break;
                default:
                    // Do nothing if the geometry type is unknown
            }

            return symbol;
        },
        /**
         * 
         * @param {string} geometryType - Geometry type in "type" or "esriGeometryType" format.
         * @param {string} symbolType - normal, selected, highlighted, temporary, imported, singular 
         * @returns {unresolved}
         */
        getGeometrySymbol: function(geometryType, symbolType) {
            var symbol = null;
            switch (geometryType) {
                case "polygon":
                case "esriGeometryPolygon":
                    symbol = this._getPolygonSymbol(symbolType);
                    break;
                case "polyline":
                case "line":
                case "esriGeometryPolyline":
                    symbol = this._getLineSymbol(symbolType);
                    break;
                case "point":
                case "esriGeometryPoint":
                case "multipoint":
                case "esriGeometryMultipoint":
                    symbol = this._getPointSymbol(symbolType);
                    break;
                default:
                    // Do nothing if the geometry type is unknown
            }
            return symbol;
        },

        addGraphicViaGeometry: function(geometry, attributes) {
            var geometryType = geometry.type;
            var symbol;
            var graphic = null;

            symbol = this._getGeometrySymbol(geometryType);

            // Do nothing if the geometry type is unknown
            if (symbol != null) {
                graphic = new Graphic(geometry, symbol);
                graphic.setAttributes(attributes); // Assign ID initially passed in (and other metadata).
                this.mapSupport.graphicsLayer.add(graphic);

                // Return the newly created graphic for convenience
                return graphic;
            } else {

                // Return null if no graphic was created.
                return null;
            }
        },
        addGraphic: function(graphic, attributes) {
            var geometryType = graphic.geometry.type;
            var symbol;

            symbol = this._getGeometrySymbol(geometryType);

            // Do nothing if the geometry type is unknown
            if (symbol != null) {
                // Override whatever symbol was previously set by the user
                graphic.setSymbol(symbol);

                // Add key attributes (namely "id", and any other flags)
                graphic.setAttributes(attributes);
                var layer = this.mapSupport.graphicsLayer,
                    layerIds = this.map.graphicsLayerIds;
                layer.add(graphic);
                // move graphics to top
                if (layerIds.indexOf(layer.id) !== layerIds.length - 1) {
                    this.map.reorderLayer(layer, layerIds.length -1);
                }

                // Automatically zoom to entire graphic collection when it is added?
                // this.zoomToAll();                   
            }
        },
        _reorderLayers: function(layers) {
            // move layers to the top, but always under nrmGraphicsLayer
            var map = this.map;
            _.each(layers, function(layer) {
                var glids = map.graphicsLayerIds,
                    pos = _.indexOf(glids.slice(0).reverse(), 'nrmGraphicsLayer') + 1,
                    newPos = glids.length - pos - 1;
                if (newPos > -1) {
                    map.reorderLayer(layer, newPos);
                }
            }, this);
        },
        addPoint: function(geometry, attributes) {
            var symbol;
            var graphic;
            symbol = this._getPointSymbol("normal");
            graphic = new Graphic(new Point(geometry), symbol);
            graphic.setAttributes(attributes);
            this.mapSupport.graphicsLayer.add(graphic);

            // Return the newly created graphic for convenience.
            return graphic;
        },
        /*                
         addPolygon: function(geometry, attributes) {
         var symbol;
         var graphic;
         symbol = this._getPolygonSymbol("normal");
         graphic = new esri.Graphic(new esri.geometry.Point(geometry), symbol);
         graphic.setAttributes(attributes);
         this.mapSupport.graphicsLayer.add(graphic);
         },                
         */
        removeGraphicByID: function(id) {
            // NOTE: This function returns true if the removal was successful, or false if the graphic was not found.
            var graphic = this._getGraphicByID(id);

            if (graphic != null) {
                this.deselectGraphicByID(id); // Deselect graphic if it existed and was selected
                this.mapSupport.graphicsLayer.remove(graphic); // Remove the graphic from the layer
                return true;
            } else {
                return false;
            }
        },
        removeAllGraphics: function() {
            this.clearGraphicSelection();
            this.mapSupport.graphicsLayer.clear();
        },
        centerMapAtGraphic: function(graphic) {
            var geometryType = graphic.geometry.type;
            var point;
            // We need to center at a point.
            point = (geometryType === "point") ? graphic.geometry : graphic.geometry.getExtent().getCenter();
            this.map.centerAt(point);
        },
        centerMapAtID: function(id) {
            var graphic = this._getGraphicByID(id);
            if (graphic !== null) {
                this.centerMapAtGraphic(graphic);
            }
        },

        setGraphicSelection: function(graphic, flag, options) {
            var geometryType = graphic.geometry.type;
            var symbol, symbolClass;

            // NOTE: Can add code here for custom geometry types.
            // This could be useful for defining features with different looks
            // based on feature attributes. To do so, adding special attributes to the graphic to
            // denote the symbol string to look for in the options object would be the trick.

            // 2/4/2014 ebodin added "highlighted" and "selected" attributes
            if (graphic.attributes.highlighted == undefined) {
                graphic.attributes.highlighted = false;
            }
            if (graphic.attributes.selected == undefined) {
                graphic.attributes.selected = false;
            }

            if (options == undefined) {
                graphic.attributes.selected = flag;
            }
            else {
                if (options.highlighted != undefined) {
                    graphic.attributes.highlighted = options.highlighted;
                }
                if (options.selected != undefined) {
                    graphic.attributes.selected = options.selected;
                }
            }
            
            if (graphic.attributes.highlighted) {
                symbolClass = "highlighted";
            }
            else if (graphic.attributes.selected) {
                symbolClass = "selected";
            }
            else {
                symbolClass = "normal";
            }

            switch (geometryType) {
                case "polygon":
                    symbol = this._getPolygonSymbol(symbolClass);
                    break;
                case "polyline":
                    symbol = this._getLineSymbol(symbolClass);
                    break;
                case "point":
                case "multipoint":
                    symbol = this._getPointSymbol(symbolClass);
                    break;
                default:
                    // Do nothing if the geometry type is unknown
                    return;
            }

            graphic.setSymbol(symbol);
            if (options && options.flash && this.map.extent.intersects(graphic.geometry)) {
//                var s = _.omit(symbol,'inLieuOfClone').setColor('red');
//                if (s.outline) 
//                    s.outline.setColor('red');
                this.flashGraphic(graphic, 2);
            }
        },
            /***
             * @param {graphic} graphic
             * @param {number} count Number of times to flash
             * @param {symbol} highlightSymbol optional
             * @return {undefined}
             */
             flashGraphic: function (graphic, count, highlightSymbol) {
                 if (!highlightSymbol) {
                    highlightSymbol = _.omit(graphic.symbol,'inLieuOfClone').setColor(new Color("red"));
                    if (highlightSymbol.outline) 
                        highlightSymbol.outline.setColor(new Color("red"));
                 }
                 if (!this._flashCount) this._flashCount = count;
                 this._hideRipple();
                 var i = 20, flag;
                 var intervalID = setInterval(lang.hitch(this, function () {
                     if (i == 20) {
                         flag = false;
                         var segmentGraphic = this.map.graphics.add(new Graphic(graphic.geometry, highlightSymbol));
                         segmentGraphic._isGraphicSelected = true;
                         segmentGraphic.setSymbol(highlightSymbol);
                     }
                     else if (i == 17) { //(i == 14) {
                         flag = true;
                     }
                     if (flag) {
                         this._hideRipple();
                         count--;
                         if (count === 0) {
                             this._flashCount = false;
                         } else {
                             this.flashGraphic(graphic, count, highlightSymbol);
                         }
                     }
                     else i--;
                 }), 100);
                 this.intervalIDs[this.intervalIDs.length] = intervalID;
             },
             //Clears all the intervals
             _clearAllIntervals: function () {
                 if (this.intervalIDs) {
                    for (var i = 0; i < this.intervalIDs.length; i++) {
                        clearTimeout(this.intervalIDs[i]);
                    }
                 }
                this.intervalIDs = [];
             },
             //Hide the highlight symbol
             _hideRipple: function () {
                 this._clearAllIntervals();
                 //this._clearGraphics();
                 if (this.map.graphics !== null) {
                     var self = this;
                     this.map.graphics.graphics.forEach(function (graphic) {
                         if (graphic && graphic._isGraphicSelected === true) {
                             self.map.graphics.remove(graphic);
                         }
                     });
                 }
             },
        selectGraphic: function(graphic, options) {
            try {
                this.setGraphicSelection(graphic, true, options);
                this.mapSupport.selectedGraphics.push(graphic);
                //consoleLog('selectGraphic adding graphic to graphicsLayer');
                //consoleDir(graphic);
                //consoleDir(this.mapSupport.graphicsLayer);
                this.mapSupport.graphicsLayer.add(graphic); //2013/11/21
            }
            catch (ex) {
                console.warn('Error in selectGraphic:', ex);
            }
        },

        clearGraphicSelection: function() {
//            for (var i = 0; i < this.mapSupport.selectedGraphics.length; i++) {
//                this.setGraphicSelection(this.mapSupport.selectedGraphics[i], false);
//            }
            //consoleLog('clearGraphicSelection (selectedGraphics and graphicsLayer)');
            this.mapSupport.selectedGraphics = []; // http://stackoverflow.com/questions/1232040/how-to-empty-an-array-in-javascript	
            this.mapSupport.graphicsLayer.clear(); //2013/11/21
            //consoleDir(this.mapSupport.selectedGraphics);
            //consoleDir(this.mapSupport.graphicsLayer);
            //editToolbar.deactivate(); // Since all selection is cleared, disable any editing as well.
        },

        testGraphicPresenceByID: function(id) {
            var graphic = null;
            //for (var i = 0; i < this.mapSupport.graphicsLayer.graphics.length; i++) {
            var i, iMax;
            for (i = 0, iMax = this.mapSupport.graphicsLayer.graphics.length; i < iMax; i += 1) {
                graphic = this.mapSupport.graphicsLayer.graphics[i];
                if ((typeof graphic.attributes.id !== "undefined") && (graphic.attributes.id == id)) {
                    return true;
                }
            }
            return false;
        },

        _getGraphicByID: function(id, callback, options) {
            var graphic = null;
            //for (var i = 0; i < this.mapSupport.graphicsLayer.graphics.length; i++) {
            var i, iMax;
            for (i = 0, iMax = this.mapSupport.graphicsLayer.graphics.length; i < iMax; i += 1) {
                graphic = this.mapSupport.graphicsLayer.graphics[i];
                if ((typeof graphic.attributes.id !== "undefined") && (graphic.attributes.id == id)) {
                    if (callback) {
                        callback(graphic, options);
                        return;
                    }
                    else {
                        return graphic;
                    }
                }
            }
            // search through dynamic layers
            //for (var layerIndex = 0; layerIndex < this.mapSupport.dynamicMapLayers.length; layerIndex++) {
            var layerIndex, max;
            for (layerIndex = 0, max = this.mapSupport.dynamicMapLayers.length; layerIndex < max; layerIndex += 1) {
                var dynamicMapLayer = this.mapSupport.dynamicMapLayers[layerIndex];
                if (dynamicMapLayer && dynamicMapLayer.nrmOptions.selectable && dynamicMapLayer.nrmOptions.keyFieldName) {
                    var featureLayer = dynamicMapLayer.nrmOptions.featureLayer;
                    //var selectQueryLayer = dynamicMapLayer;
                    var selectQuery = new Query();
                    selectQuery.returnGeometry = true;
                    var whereClause = dynamicMapLayer.nrmOptions.keyFieldName + "= '" + id + "'";
                    if (dynamicMapLayer.nrmOptions.whereClause) {
                        whereClause += " and " + dynamicMapLayer.nrmOptions.whereClause;
                    }
                    selectQuery.where = whereClause;
                    //selectQuery.outFields = ["*"]; // [dynamicMapLayer.nrmOptions.keyFieldName.toUpperCase()];
                    //consoleLog('about to selectFeatures');
                    featureLayer.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW,
                        function(features, selectionMethod){
                            //consoleLog('selectFeatures returned with these features:');
                            //consoleDir(features);
                            // check if we need to zoom to features
                            if (features.length > 0) {
                                    graphic = features[0];
                                    if (callback) {
                                        //consoleLog('executing callback after selectFeatures in _getGraphicByID');
                                        callback(graphic, options);
                                    }
                            }
                        }
                    );                            
                } // selectable layer
            } // dynamicMapLayers loop

            
            
            return null;
        },
        getGraphicJSON: function(id) {
            var graphic = this._getGraphicByID(id);
            return (graphic !== null) ? graphic.toJson() : "";
        },

        getGraphicByIDInWGS84: function(id) {
            // Currently creates a copy of the underlying graphic.
            // Not yet sure how reinserting the reprojected graphic back into the map would work out.
            // http://spatialreference.org/ref/epsg/4326/
            var graphic = this._getGraphicByID(id);
            var newGeometry;
            var newGraphic;

            if (graphic !== null) {
                if (graphic.geometry.spatialReference.wkid === 4326) {
                    return graphic;
                } else {
                    newGeometry = prjUtils.webMercatorToGeographic(graphic.geometry);

                    // Not needed
                    //newGeometry.setSpatialReference(new esri.SpatialReference(4326));

                    newGraphic = new Graphic(newGeometry, graphic.symbol);
                    newGraphic.setAttributes(graphic.attributes);
                    //consoleLog("NEWGEOM id:" + id + " - " + newGeometry.spatialReference.wkid);
                    return newGraphic;
                }
            } else {
                return null;
            }
        },

        testIntersectionPolyPoint: function(spatialReferenceWkid, polyJSON, pointJSON) {
            var retJSON;
            $.ajax({
                url: this.options.mapServicesSource + "/Utilities/Geometry/GeometryServer/intersect",
                data: {
                    sr: spatialReferenceWkid,
                    f: "json",
                    geometries: '{"geometryType": "esriGeometryPolygon", "spatialReference" :{"wkid" : ' + spatialReferenceWkid + '}, "geometries" :[' + polyJSON + ']}',
                    geometry: '{"geometryType": "esriGeometryPoint", "geometry": ' + pointJSON + '}' // The JSON for this point can include a spatialReference
                },
                async: false,
                cache: false,
                dataType: "json",
                success: function(jsonObj) {
                    retJSON = jsonObj;
                }
            });
            //consoleLog(retJSON);
            return (!isNaN(retJSON.geometries[0].x));
        },

        testIntersectionPolyPoly: function(spatialReferenceWkid, polyJSON1, polyJSON2) {
            var retJSON;
            $.ajax({
                url: this.options.mapServicesSource + "/Utilities/Geometry/GeometryServer/intersect",
                data: {
                    sr: spatialReferenceWkid,
                    f: "json",
                    geometries: '{"geometryType": "esriGeometryPolygon", "spatialReference" :{"wkid" : ' + spatialReferenceWkid + '}, "geometries" :[' + polyJSON1 + ']}',
                    geometry: '{"geometryType": "esriGeometryPolygon", "spatialReference" :{"wkid" : ' + spatialReferenceWkid + '}, "geometries" :[' + polyJSON2 + ']}'
                },
                async: false,
                cache: false,
                dataType: "json",
                success: function(jsonObj) {
                    retJSON = jsonObj;
                }
            });
            //consoleLog(retJSON);
            return (retJSON.geometries[0].rings.length != 0);
        },

        // TODO: ebodin 1/30/2014.  Add optional options to handle:
        // { selected: true|false(optional, default true), highlighted: true|false (optional, default false) }
        // if selected, do what we've always done.  if highlighted, change the symbol
        toggleSelectGraphicByID: function(id, options) {
            var i, iMax, graphic = null, foundInCurrentSelections = false;
            //for (var i = 0; i < this.mapSupport.selectedGraphics.length; i++) {
            for (i = 0, iMax = this.mapSupport.selectedGraphics.length; i < iMax; i += 1) {
                graphic = this.mapSupport.selectedGraphics[i];
                if ((typeof graphic.attributes.id !== "undefined") && (graphic.attributes.id == id)) {
                    foundInCurrentSelections = true;
                    break;
                }
            }
            if (foundInCurrentSelections) {
                this.deselectGraphicByID(id);
            } else {
                this.selectGraphicByID(id, options);
            }
        },

      selectGraphicByID: function(id, options) {
            var graphic = null;
            //var defaultOptions = {zoomTo: true};
            //options = $.extend({}, defaultOptions, options);
            //graphic = this._getGraphicByID(id);
            this._getGraphicByID(id, function (graphic) {
                if (graphic != null) {
                    //var nrmmap = that;
                    //consoleLog('in selectGraphicByID callback with options');
                    //consoleDir(options);
                    graphic.attributes.id = id; //2/3/14
                    nrmmap.selectGraphic(graphic, options);
                    //nrmmap.centerMapAtGraphic(graphic);
                    if(!options || options.zoomTo !== false) { // LW: Fix which allows us to preserve the logic inside selectGraphic
                        if (_.isObject(options.zoomTo)) {
                            nrmmap._zoomTo(_.extend({graphic: graphic}, options.zoomTo));
                        } else {
                            nrmmap._zoomTo({graphic: graphic});
                        }
                    }
                    if (nrmmap.options.editMode) {
                        nrmmap._activateEditingToolbar(graphic);
                    }
                    // NOTE: It may be useful to return the graphic at some point
                    //return graphic;
                }
            }, options);
        },

        deselectGraphicByID: function(id, options) {
            var graphic = null;
            if (options == undefined) {
                options = {selected: false};
            }
            // Find the graphic and deselect it.
            //for (var i = 0; i < this.mapSupport.selectedGraphics.length; i++) {
            var i, iMax;
            for (i = 0, iMax = this.mapSupport.selectedGraphics.length; i < iMax; i += 1) {
                graphic = this.mapSupport.selectedGraphics[i];
                if ((typeof graphic.attributes.id !== "undefined") && (graphic.attributes.id == id)) {
                    this.setGraphicSelection(graphic, false, options);
                    if (!graphic.attributes.selected && !graphic.attributes.highlighted) {
                        this.mapSupport.selectedGraphics.splice(i, 1);
                    }
                    if (this.options.editMode) {
                        this._deactivateEditingToolbar();
                    }
                    break; // could return the spliced graphic
                }
            }
            // 2013/11/21 update the graphics layer?
            this.mapSupport.graphicsLayer.clear();
            //for (var i = 0; i < this.mapSupport.selectedGraphics.length; i++) {
            for (i = 0, iMax = this.mapSupport.selectedGraphics.length; i < iMax; i += 1) {
                this.mapSupport.graphicsLayer.add(this.mapSupport.selectedGraphics[i]);
            }
            return graphic;
        },

        _activateEditingToolbar: function(graphic) {
            // This is called by event handlers
            var tool = 0;
            var basicOptions = {
                move: true,
                vertices: true,
                scale: true,
                rotate: true,
                addVertices: true,
                deleteVertices: true,
                uniformScaling: true
            };

            if (basicOptions.move) {
                tool = tool | Edit.MOVE;
            }
            if (basicOptions.vertices) {
                tool = tool | Edit.EDIT_VERTICES;
            }
            if (basicOptions.scale) {
                tool = tool | Edit.SCALE;
            }
            if (basicOptions.rotate) {
                tool = tool | Edit.ROTATE;
            }

            //specify toolbar options        
            var options = {
                allowAddVertices: basicOptions.addVertices,
                allowDeleteVertices: basicOptions.deleteVertices,
                uniformScaling: basicOptions.uniformScaling
            };
            // simplify before activating tool
            if (!geometryEngine.isSimple(graphic.geometry)) {
                graphic.geometry = geometryEngine.simplify(graphic.geometry);
            }
            this.editToolbar.activate(tool, graphic, options);
        },
        _deactivateEditingToolbar: function() {
            // This is called by event handlers
            this.editToolbar.deactivate();
            this.mapButtonBar.hide();
        },
        activateEditMode: function(options) {
            // LW: add access to the undo manager. The actual UndoManager here originates in the nrmShapeEditor instance(s).
            // This function is triggered by the "map:activateEditMode" NRM event. The activateShapeEditTool function in nrmShapeEditor is one trigger
            if ((options) && (options.undoManager)) {
                this.mapButtonBar.setUndoManager(options.undoManager);
            }
            // LW: Also handle setting of button visibility based on geometry
            if ((options) && (options.geometryType != null)) {
                this.mapButtonBar.setGeometryType(options.geometryType);
            }
            
            this.options.editMode = true;
            
        },
        deactivateEditMode: function() {
            this.mapButtonBar.clearUndoManager();
            this.options.editMode = false;
        },
        activateSelectionMode: function() {
            //consoleLog('activateSelectionMode');
            if (this.selectionToolbar) this.selectionToolbar.activate(Draw.RECTANGLE);//EXTENT);
            if (this.navButtonBar) this.navButtonBar.setModeButton("selectmode");
        },
        deactivateSelectionMode: function() {
            //consoleLog('deactivateSelectionMode');
            if (this.selectionToolbar) this.selectionToolbar.deactivate();
            if (this.navButtonBar) this.navButtonBar.panmodeHandler(true);
        },
        activateDrawMode: function(geometryType, attributes) {
            // "geometryType" is based on basic constants from here:
            // http://help.arcgis.com/en/webapi/javascript/arcgis/jsapi/draw.html

            this.drawGraphicsAttributes = attributes;
            if (!attributes.suppressCursor) {
                this.setCursor("crosshair", "move");
            }
            this.selectionToolbar.activate(geometryType);
        },
        deactivateDrawMode: function() {
            this.selectionToolbar.deactivate();
            Nrm.event.trigger("map:setCursor");
            this.options.mouseDownCursor = null;
        },
        setCursor: function(cursor, mouseDownCursor) {
            this.options.cursor = cursor;
            this.options.mouseDownCursor = mouseDownCursor;
            this.map.setMapCursor(cursor);
        },
        _addDrawnGraphic: function(geometry) {
            var geometryType = geometry.type;
            var symbol;
            var graphic;

            switch (geometryType) {
                case "polygon":
                    symbol = this._getPolygonSymbol("normal");
                    break;
                case "polyline":
                    symbol = this._getLineSymbol("normal");
                    break;
                case "point":
                case "multipoint":
                    symbol = this._getPointSymbol("normal");
                    break;
                default:
                    // Do nothing if the geometry type is unknown
                    return;
            }

            graphic = new Graphic(geometry, symbol);
            graphic.setAttributes(this.drawGraphicsAttributes); // Assign ID initially passed in (and other metadata).
            this.mapSupport.graphicsLayer.add(graphic);

            // This line disables the drawing toolbar after the creation and addition of this graphic
            // to the map graphics layer
            this.deactivateDrawMode();
        },
        
// <editor-fold defaultstate="collapsed" desc="obsolete setBaseMap">
//         //  Ethan added below starting 7/29
//         setBaseMap: function(baseMap) {
//            if (!tiledLayerSource) {
//                tiledLayerSourceInit();
                //resetWhenDone = true;
//            }
//
//            //consoleLog('setBaseMap: ' + baseMap);
//            var url;
//            if (baseMap.indexOf('http') == 0) {
//                url = baseMap;
//            }
//            else {
//                url = tiledLayerSources[baseMap]; // global from NRMMapCache            
//                $('#baseLayer').val(baseMap);
//            }
//            tiledLayerSource = url; // global from NRMMapCache
//
//            var i, levels = new Array();
//            for (i = 0, max = lods.length; i < max; i += 1) {
//                levels[i] = lods[i].level;
//            }
//            var oldLayer = this.map.getLayer('basemap');
//            if (oldLayer) {
//                this.map.removeLayer(oldLayer);
//            }
//            this.basemap = new esri.layers.ArcGISTiledMapServiceLayer(url, {id: 'basemap'
//                //,displayLevels: levels
//                ,resampling: true
//                ,resamplingTolerance: 3
//            });
            //this.basemap.setScaleRange(0,0);
//            this.map.addLayer(this.basemap, 0);
//        },
// </editor-fold>

        
        // -----------------  Utility Functions  --------------------------------------

        DDtoDMS: function(dd, latOrLong) {
            var retval;
            var d;
            var m;
            var s;

            d = Math.floor(Math.abs(dd));
            m = Math.floor((Math.abs(dd) - d) * 60);
            s = Math.round((Math.abs(dd) - (d + (m / 60))) * 360000) / 100;

            retval = d.toString() + '\u00B0' + this._DMtoString(m) + "'" + this._DMtoString(s) + '"';

            if (latOrLong.toLowerCase() == 'lat') {
                if (dd < 0) {
                    retval = retval + 'S';
                } else {
                    retval = retval + 'N';
                }
            } else {
                if (dd < 0) {
                    retval = retval + 'W';
                } else {
                    retval = retval + 'E';
                }
            }

            return retval;
        },
        _DMtoString: function(MinOrSec) {
            var retval;
            // Pad the minutes or seconds to 2 characters.
            if (MinOrSec < 10) {
                retval = '0' + MinOrSec.toString();
            } else {
                retval = MinOrSec.toString();
            }
            return retval;
        },
        DDtoDMM: function(dd, latOrLong) {
            var retval;
            var d;
            var m;
            var mStr;

            d = Math.floor(Math.abs(dd));
            // Trim the minutes to 4 decimal places.
            m = (Math.round((Math.abs(dd) - d) * 600000)) / 10000;
            // Pad the minutes to 2 characters.
            mStr = this._DMtoString(m);
            retval = d.toString() + '\u00B0' + mStr;

            if (latOrLong.toLowerCase() == 'lat') {
                if (dd < 0) {
                    retval = retval + 'S';
                } else {
                    retval = retval + 'N';
                }
            } else {
                if (dd < 0) {
                    retval = retval + 'W';
                } else {
                    retval = retval + 'E';
                }
            }

            return retval;
        },
        calcAltitude: function(coords) {
            var retval;
            if (coords.altitude) {
                var elevation;
                elevation = Math.floor(coords.altitude * 3.28084).toString();
                retval = Math.floor(coords.altitude).toString() + ' m or ' + elevation + ' ft';
            } else {
                retval = ' is not recorded';
            }
            return retval;
        },
        rndToString: function(myNum, digits) {
            var multiplier;
            var retval;
            multiplier = Math.pow(10, digits);
            retval = (Math.round(myNum * multiplier) / multiplier).toString();
            return retval;
        },
        /**
         * Return the Geometry object constructed from a JSON geometry.
         * @param {Object} jsonGeometry - {@link http://resources.arcgis.com/en/help/rest/apiref/geometry.html|ArcGIS Server REST API JSON geometry object}
         * @returns {external:module:esri/geometry/Geometry}
         */
        shapeToGeometry: function(jsonGeometry){
            return JSONUtils.fromJson(jsonGeometry);
        },
        getMapLayerByName: function(name) {
            var lyr;
            //consoleLog('looking for layer name ' + name);
            //consoleDir(this.map.getLayersVisibleAtScale());
            //for (var layerIndex = 0; layerIndex < this.map.getLayersVisibleAtScale().length; layerIndex++) {
            var layerIndex, max;
            for (layerIndex = 0, max = this.map.getLayersVisibleAtScale().length; layerIndex < max; layerIndex += 1) {
                //consoleLog('layer and layerinfos ' + layerIndex.toString());
                var l = this.map.getLayersVisibleAtScale()[layerIndex];
                //consoleDir(l);
                var layerInfos = l.layerInfos;
                //consoleDir(layerInfos);
                if (layerInfos) {
                    for (var layerInfoIndex = 0; layerInfoIndex < layerInfos.length; layerInfoIndex += 1) {
                        //consoleLog(' layer name: ' + layerInfos[layerInfoIndex].name);
                        if (layerInfos[layerInfoIndex].name == name) {
                            lyr = l;
                            break;
                        }
                    }
                }
            }
            return lyr;
        },
        // <editor-fold desc="-----------------  GPS support --------------------------------------">

        initGPS: function(callback, context) {
            var self = this;
            require(["nrm-map/GPS"], function(GPS) {
                if (!GPS) return;
                if (!self._gps) {
                    self._gps = new GPS({interval: 5});
                }
                if (callback) {
                    callback.call(context || self, self._gps);
                }
            });
        },

        _watchPositionToggle: function() {
            var el = $("#watchPositionControl")[0];
            if (el.innerText == "Show Location") {
                this.watchPositionStart();
                el.innerText="Hide Location";
            }
            else {
                this.watchPositionStop();
                el.innerText="Show Location";
            }
        },

        watchPositionStart: function(){
            this.initGPS(function(GPS) {
            GPS.start(function(pos) {
                    nrmmap.positionDisplayClear();
                    nrmmap.positionDisplayPoint(pos, false);
                });
            }, this);
        },
        
        watchPositionStop: function(){
            if (this._gps != undefined) {
                this._gps.stop();
                this.positionDisplayClear();
            }
        },

        positionDisplayPoint: function(position, suppressExtentChange) {
            var pt = prjUtils.geographicToWebMercator
                    (new Point(position.coords.longitude, position.coords.latitude));
            var symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 12,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([210, 105, 30, 0.5]), 8), new Color([210, 105, 30, 0.9])
                    );
            var graphic = new Graphic(pt, symbol);
            this._positionGraphicsLayer().add(graphic);

            // make sure point is in map extent
            if (!suppressExtentChange && !this.map.extent.contains(pt)) {
                this.map.centerAt(pt);
            }
            return graphic;
        },
        positionDisplayPoints: function(positionArray) {
            var pts = new Array(), position, graphic;
            var pt;
            for (var i = 0; i < positionArray.length; i++) {
                position = positionArray[i];
                graphic = this.positionDisplayPoint(position, true);
                pts.push(graphic.geometry);
            }
            var polyline = new Polyline(this.map.spatialReference);
            polyline.addPath(positionArray);
            if (!this.map.extent.contains(polyline)) {
                this.map.setExtent(polyline.getExtent(), true);
            }
        },
        positionDisplayLine: function(positionArray, suppressExtentChange) {
            var position;
            var pt;
            var pointArray = new Array(positionArray.length);
            for (var i = 0; i < positionArray.length; i++) {
                position = positionArray[i];
                pt = prjUtils.geographicToWebMercator
                        (new Point(position.coords.longitude, position.coords.latitude));
                pointArray[i] = pt;
            }
            var polyline = new Polyline(this.map.spatialReference);
            polyline.addPath(pointArray);
            var graphic = new Graphic(polyline, this._getLineSymbol("normal"));
            this._positionGraphicsLayer().add(graphic);

            if (!suppressExtentChange && !this.map.extent.contains(polyline)) {
                this.map.setExtent(polyline.getExtent(), true);
            }
            return graphic;
        },
        // takes an array of position arrays
        positionDisplayLines: function(positionArrayArray) {
            var extent;
            var graphic;
            try {
                for (var i = 0; i < positionArrayArray.length; i++) {
                    var positionArray = positionArrayArray[i];
                    graphic = this.positionDisplayLine(positionArray, true);
                    if (extent) {
                        extent.union(graphic.geometry.getExtent());
                    }
                    else {
                        extent = graphic.geometry.getExtent();
                    }
                }
                if (!this.map.extent.contains(extent)) {
                    //this.map.setExtent(extent, true);
                }
            }
            catch (ex) {
                console.warn('ERROR in positionDisplayLines: ' + ex.message);
            }
        },
        positionDisplayClear: function() {
            try {
                this._positionFeatureLayer().graphics.clear();
            }
            catch (ex) {
            }

            try {
                this._positionGraphicsLayer().clear();
            }
            catch (ex) {
            }
        },
        _positionGraphicsLayer: function() {
            var graphicsLayer;
            graphicsLayer = this.map.getLayer('positionGraphics');
            if (!graphicsLayer) {
                graphicsLayer = new GraphicsLayer({id: "positionGraphics"});
                this.map.addLayer(graphicsLayer);
            }
            return graphicsLayer;
        },
        _positionFeatureLayer: function() {
            var featureLayer;
            featureLayer = this.map.getLayer('positions');
            if (!featureLayer) {
                var layerDefinition = {
                    "id": 'positions',
                    "geometryType": "esriGeometryPoint",
                    "timeInfo": {
                        "startTimeField": "DATETIME",
                        "endTimeField": null,
                        "timeExtent": [1277412330365],
                        "timeInterval": 1,
                        "timeIntervalUnits": "esriTimeUnitsMinutes"
                    },
                    "fields": [{
                            "name": "DATETIME",
                            "type": "esriFieldTypeDate",
                            "alias": "DATETIME"
                        }]
                };

                var featureCollection = {
                    layerDefinition: layerDefinition,
                    featureSet: null
                };
                // feature layer
                featureLayer = new FeatureLayer(featureCollection);

                //setup a temporal renderer
                var sms = new SimpleMarkerSymbol().setColor(new Color([255, 0, 0])).setSize(8);
                var observationRenderer = new SimpleRenderer(sms);
                var latestObservationRenderer = new SimpleRenderer(new SimpleMarkerSymbol());
                var infos = [
                    {minAge: 0, maxAge: 1, color: new Color([255, 0, 0])},
                    {minAge: 1, maxAge: 5, color: new Color([255, 153, 0])},
                    {minAge: 5, maxAge: 10, color: new Color([255, 204, 0])},
                    {minAge: 10, maxAge: Infinity, color: new Color([0, 0, 0, 0])}
                ];
                var ager = new TimeClassBreaksAger(infos, TimeClassBreaksAger.UNIT_MINUTES);
                var sls = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 3);
                var trackRenderer = new SimpleRenderer(sls);
                var renderer = new TemporalRenderer(observationRenderer, latestObservationRenderer, trackRenderer, ager);
                featureLayer.setRenderer(renderer);
                this.map.addLayer(featureLayer);
            }
            return featureLayer;
        },
        // </editor-fold>

        /**
         *  1. Gather features (either from extent, array of IDs, JSON dataset, or default to selected set of features).
         *  2. Make feature layer from features.
         *  3. Enable grid/map synchronization for feature layer.
         *  4. Add feature layer to map.
         *  5. Turn off service-based layers.
         *  6. Call CacheTiles(status callback function, feature layer).
         *  7. Reset the map's levels of detail to match the levels to be cached (unless options.resetMapLODs is false).
         * @param {Object} options
         * @param {function} [options.progressCallback] - Callback function takes a %complete argument (passed directly to NRMMapCache).
         * @param {Extent} [options.extent] - Cache this extent. Set to true to use the current map extent.
         * @param {string} [options.IDs] - Cache the extent of features with these IDs (from the current selection layer).
         * @param {Array.<Object> | Array.<Geometry>} [options.shapes] - Cache the extent containing all the geometries.
         * @param {boolean} [options.resetMapLODs=true] - Reset the map's levels of detail to match the levels to be cached.
         * @param {boolean} [options.cacheTiles=true]
         * @param {boolean} [options.cacheVectors=true]
         * @param {boolean} [options.clear=true] - Clear/empty cache first.
         * @param {number} [options.minLevel=15] - Minimum (most zoomed out) zoom level to cache.
         * @param {number} [options.maxLevel=19] - Maximum (most zoomed in) zoom level to cache.
         * @param {boolean} [options.zoom=true] - Zoom to the calculated extent.
         * @return {undefined}
         */
        checkout: function(options){
            var defaults = {resetMapLODs: true, cacheTiles: true, cacheVectors: true, 
                            clear: true, minLevel: 12, maxLevel: 19, zoom: true},
                ext, //layerIndex, liMax,
                layerNum = 0, layer, layers = [], tileCache = this.tileCache,
                cacheLayer = function() {
                    tileCache.setLayer(layers[layerNum]);
                    $.when(tileCache.cacheTilesForExtent(ext, options.minLevel, options.maxLevel)).done(function(){
                        layerNum ++;
                        if (layerNum === layers.length)
                            return;
                        cacheLayer();
                    });
                };
            options = _.defaults(options || {}, defaults);
            if (options.extent) {
                ext = _.isBoolean(options.extent) ? this.map.extent : options.extent;
            } else if (options.shapes) {
                var geom, geomExt;
                options.shapes.forEach(function(element, index, array){
                    geom = element.type ? element : JSONUtils.fromJson(element);
                    geomExt = geom.type === 'point' ?
                            new Extent(geom.x, geom.y, geom.x, geom.y, geom.spatialReference) :
                            geom.getExtent();
                    ext = ext ? ext.union(geomExt) : geomExt;
                });
            } else if (options.IDs) {
            } else {
                ext = graphicsUtils.graphicsExtent(this.mapSupport.selectedGraphics);
            }
            if (ext.ymax <= 90) {
                ext = prjUtils.geographicToWebMercator(ext);
            }
            if (options.zoom) {
                this._zoomTo({extent: ext});
            }
            this.map.layerIds.forEach(function (id){
                layer = this.map.getLayer(id);
                if (layer.visible && layer.declaredClass === "esri.layers.ArcGISTiledMapServiceLayer") {
                    layers.push(layer);
                }
            }, this);
            this._initTileCache(function(mapCache) {
                if (options.clear)
                    mapCache.clear(function() {
                        cacheLayer();
//                        $.when(mapCache.cacheTilesForExtent(ext, 16, 18)).done(function(){
//                            alert('done');
//                        });
                    });
                else
                    mapCache.cacheTilesForExtent(ext, options.minLevel, options.maxLevel);
            }, options);
            // remove live layers
//            for (layerIndex = 0, liMax = that.mapSupport.dynamicMapLayers.length; layerIndex < liMax; layerIndex += 1) {
//                that.mapSupport.dynamicMapLayers[layerIndex].hide();
//            }
            if (!options.resetMapLODs) {
                // make it work!
            }

        },
        
        // query the layer to get a feature set
        // create a feature layer from the feature set
        checkoutDynamicMapLayer: function(url, opts) {
            // TODO: this doesn't work
            var featureLayer = new FeatureLayer(url, opts);
            var selectQuery = new Query();
            if (opts.whereClause) {
                selectQuery.where = opts.whereClause;
            }
            else {
                selectQuery.where = '1=1';
            }

            if (opts.keyFieldName) {
                selectQuery.outFields = ["*"]; // [dynamicMapLayer.nrmOptions.keyFieldName.toUpperCase()];
            }
            //consoleLog('about to selectFeatures');
            var thisFeatureLayer = featureLayer;
            featureLayer.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW,
                function(features, selectionMethod){
                    if (features.length > 0) {
                        var symbol = that._getGeometrySymbol(features[0].geometry.type,true);
                        thisFeatureLayer.setSelectionSymbol(symbol);
                        if (featureLayer.nrmOptions.zoomToSelection) { // && !that.map.extent.contains(features)) {
                            that.map.setExtent(graphicsUtils.graphicsExtent(features), true);
                        }
                    }
                }
            );                            
            
        },
        


//        _getDb: function() {
//            if (!this._db) {
//                try {
//                        this._db = window.openDatabase(
//					        "nrmmapdb",
//					        "1.0",
//					        "NRM map database",
//					        2 * 1024 * 1024
//				        );
//  					    this._db.transaction(function (tx) {
//						    tx.executeSql("CREATE TABLE IF NOT EXISTS SETTINGS(" + "PAGE TEXT, SETTING TEXT, VAL TEXT, CONSTRAINT PK PRIMARY KEY(PAGE, SETTING))", []
//                                ,function(tx, rs) {
//		            	            // success
//                                 },
//		                        function(tx, e) {
//		            	            // failure
//                                    console.error('Error creating SETTINGS table:', e);
//		                        }
//                            );
//					    });
//                    } catch (e) {
//                        this._db = false;
//                        console.error('Error initializing map database ' + e.message);
//                    }
//            }
//            //consoleLog('_getDb returning:');
//            //consoleDir(this._db);
//            return(this._db);
//        },

        // save everything we can
        saveSettings: function(opts) {
            var saveAll = true, settingsOpts, opts = opts || {},
                id, settings;
            if (opts.extent || opts.mapOptions || opts.basemap || opts.dynamicLayers || opts.graphicsLayers) {
                saveAll = false;
                settingsOpts = _.omit(opts, 'tag');
            }
            if (opts.tag) {
                id = "map" + opts.tag;
                settings = new Settings({id: id});
            } else {
                settings = new Settings();
                }
            settings.setAll(settingsOpts);
            settings.save();
            Nrm.event.trigger("app:modal", {
                "text": "Map configuration including extent, background, and layers has been saved.  Use Restore from the map Tools menu at any time to apply the configuration.", 
                "caption": "Save Map Settings"
			        });
        },
        restoreDynamicMapLayers: function(obj) {
            var url, addIt, j, jMax, layer, lyrObj, opt, reorder = [], adds = [], 
                    matched = [], unmatched = this.map.layerIds.slice();
            for (j = 0, jMax = obj.length; j < jMax; j++) {
                lyrObj = obj[j];
                url = lyrObj.url;
                if (lyrObj.pos < 0)
                    continue;
                addIt = true;
                for(var k = 0; k < this.map.layerIds.length; k++) {
                    layer = this.map.getLayer(this.map.layerIds[k]);
                    if (layer.url.substr(0,layer.url.toLowerCase().indexOf('mapserver')) === url.substr(0,url.toLowerCase().indexOf('mapserver'))) {
                        if (lyrObj.pos !== undefined) {
                            reorder.push({ layer: layer, pos: lyrObj.pos });
                            //console.log("Layer: " + layer.url + " found at position " + k + " will be restored at position " + lyrObj.pos);
                        }
                        matched.push(layer.id);
                        addIt = false;
                        opt = lyrObj.nrmOptions && lyrObj.nrmOptions.layerOptions;
                        if (opt && opt.visible !== undefined) {
                            layer.setVisibility(opt.visible);
                        }
                        if (opt && opt.opacity !== undefined) {
                            layer.setOpacity(opt.opacity);
                        }
                        break;
                    }
                }
                if (addIt)
                    adds.push($.extend({ pos: j }, lyrObj)); //this.setDynamicMapLayer(url, 1, lyrObj.nrmOptions);
            }
            function sortByPos(a, b) {
                if (a.pos > b.pos)
                    return 1;
                else if (a.pos < b.pos)
                    return -1;
                else
                    return 0;
            }
            adds.sort(sortByPos);
            _.each(adds, function(item) {
                this.setDynamicMapLayer(item.url, 1, item.nrmOptions);
            }, this);
            // find indexes of any layers in the map not found in restored set
            var newItems = _.reduce(unmatched, function(memo, value, i) {
                if (_.indexOf(matched, value) === -1) {
                    memo.push(i);
                }
                return memo;
            }, []);
            // reorder top down
            reorder.sort(function(a, b) { return sortByPos(a, b) * -1; });
            _.each(reorder, function(item) {
                var insertAfter = _.filter(newItems, function(i) {
                    return i <= item.pos;
                })
                console.log("Reordering layer: " + item.layer.url + " to position " + (item.pos + insertAfter.length));
                this.map.reorderLayer(item.layer, item.pos + insertAfter.length);
            }, this);
        },
        restoreExtent: function(obj) {
            var ext = new Extent(obj);
            this.map.setExtent(ext);
            this.restoredExtent = ext;
        },
        restoreGraphicsLayers: function(obj) {
            var layer, saved, k, kMax, j, jMax;
            for (j = 0, jMax = obj.length; j < jMax; j += 1) {
                saved = obj[j];
                if (saved.featureCollection) {
                    layer = new FeatureLayer(saved.featureCollection, {mode: FeatureLayer.MODE_SNAPSHOT, id: saved.id});
                } else if (saved.graphics) {
                    layer = new GraphicsLayer($.extend({id: saved.id}, saved.nrmOptions));
                    for (k = 0, kMax = saved.graphics.length; k < kMax; k += 1) {
                        layer.add(new Graphic(saved.graphics[k]));
                    }
                }
                if (layer.graphics.length > 0 && layer.graphics[0].geometry !== null) {
                    layer.nrmOptions = obj[j].nrmOptions;
                    connect.connect(layer, "onClick", this._graphicsLayerClick);
                    this.map.addLayer(layer);
                    if (saved.id === "nrmGraphicsLayer") {
                        this.mapSupport.graphicsLayer = layer;
                    }
                }
                this.map.addLayer(layer);
            }    
        },
        /***
         * restore everything, or only what's identified in opts
         * @param {object} opts
         * @param {boolean} opts.basemap
         * @param {boolean} opts.dynamicLayers
         * @param {boolean} opts.graphicsLayers
         * @param {boolean} opts.extent
         * @param {boolean} opts.tag - part of key to settings record
         * @return {unresolved}
         */
        restoreSettings: function(opts) {
            //console.log('map.restoreSettings',JSON.stringify(opts));
            var restoreAll = (opts === undefined || opts.length < 2) ? true : false,
                askUser, id;
            if (this.options.restoreSettings && this.options.restoreSettings.askUser === 'ask') {
                askUser = true;
            } else {
                askUser = false;
            }
            if (opts.tag) {
                id = "map" + opts.tag;
                if (opts.tag === "manual") {
                    askUser = false;
                    restoreAll = true;
                                }
                            }
                            
            var _loadSetting = function(setting, obj){
                switch (setting) {
                    case "basemap":
                        if (restoreAll || opts.basemap) {//nrmmap.setBaseMap(obj);
                            var url = obj, map = nrmmap.map, addIt = true,
                                layer, layerNames = _.keys(map._layers), layerlen = layerNames.length;
                            for (var i = 0; i < layerlen; i++) {
                                layer = map.getLayer(layerNames[i]);
                                if (layer.url === obj) {
                                    console.log('   found it');
                                    addIt = false;
                                    layer.setVisibility(true);
                                } else if (layer.nrmOptions && layer.nrmOptions.tiled) {
                                    layer.setVisibility(false);
                                }
                            }
                            if (addIt) {
                                nrmmap.setDynamicMapLayer(obj);
                            }
                        }
                        break;
                    case "dynamicLayers":
                        if (restoreAll || opts.dynamicLayers) {
                            nrmmap.restoreDynamicMapLayers(obj);
                                        }
                        break;
                    case "extent":
                        if (restoreAll || opts.extent) {
                            nrmmap.restoreExtent(obj);
                        }
                        break;
                    case "graphicsLayers":
                        if (restoreAll || opts.graphicsLayers) {
                            nrmmap.restoreGraphicsLayers(obj);
                        }
                        break;
                }
            };
            
            //data = Nrm.views.layoutView.getSettings(_.omit(_.extend(opts, {id:key}), 'key'));
            var f = function(result){
                for (var setting in result) {
                    if (result[setting]) _loadSetting(setting, result[setting]);
                            }
            };
            var theOpts = _.extend(that.options.restoreSettings, {callback:f});
            if (id) {
                theOpts.id = id;
                        }
            //console.log('map sending request to app:getSettings', theOpts);
            /**
             * Retrieve user preferences 
             * @event module:nrm-ui/event#app:getSettings
             * @param {Object} opts Hash of settings to retrieve, plus the properties listed below:
             * @param {string} [opts.id] Key in the LocalStorage object store, or use the automatically restored settings
             * if available if this option is not set.
             * @param {string} [opts.key="manual"] Key in the LocalStorage object store, only used if the application does
             * not have restoreSettings option set in the main application configuration.
             * @param {Function} [opts.callback] Callback function that will be passed the return value.
            */
            Nrm.event.trigger("app:getSettings", theOpts);
        }, // end restoreSettings

        /**
         * 
         * @param {Object} options
         * @param {string} [options.layout="rangePermitISb"] - Name of a layout installed on the server.
         * @param {string} [options.format="PDF"]
         * @param {number} [options.scale] - Fixes mapscale, eg scale: 24000.
         * @param {Object} [options.textElements] - Fill in named text element placeholders in the layout.
         * @param {string} [options.textElements.subtitle="FS Site Number: \nSmithsonian Number:"]
         * @param {string} [options.textElements.title="Natural Resource Manager (NRM) Map"]
         * @param {string} [options.textElements.pagerange=""]
         * @param {string} [options.textElements.unit=""]
         * @param {string} [options.textElements.forest=""]
         * @param {string} [options.textElements.district=""]
         * @param {string} [options.textElements.user=""]
         * @param {string} [options.textElements.legal=""]
         * @param {string} [options.textElements.date=""]
         * @param {string} [options.textElements.disclaimer="Disclaimer"'
         * @param {function} [options.callback] - Callback function takes url as an argument.
         * @param {function} [options. errorCallback] - Callback function takes err as an argument.
         * @return {undefined}
         */
        printMap: function(options) {
            var map = this.map, proxyErrorWorkaround = false, retrying = false, cancel = false, progressView,
                title = "Print map to PDF", nrmmap = this;
            var $parent = $(".panel-heading", $(".panel[data-nrm-help-context='882']"));
            progressView = new ProgressView({
                $parent: $parent,
                closeIconTitle: "Cancel " + title,
                text: title.split(" ")[0] + "ing " + title.substr(title.indexOf(" ") + 1) + "...",
                animated: true,
                callback: function(){
                    cancel = true;
                }    
            });
            progressView.render();
            
            // TEMPORARY!!!  10/8/2014, until we open a firewall between NRM AGS and apps.fs.fed.us,
            //              turn off layers from that source
            if (proxyErrorWorkaround) {
                // TODO: can we remove this now that we are using apps.fs.usda.gov print service?
                for(var j = 0; j < map.layerIds.length; j++) {
                    var layer = map.getLayer(map.layerIds[j]);
                    if (layer.url && layer.url.indexOf('apps.fs') > -1) {
                        layer.setVisibility(false);
                        }
                }
            }

            var username = "";
            try {
                username = "User Name: " + Nrm.app.userInfo.attributes.user.authenticatedIdentity;
            } catch (e) {
                //consoleLog('NRM username not found');
            }
            var defaults = {
                layout: "rangePermitISb", //heritageSiteISb
                format: "PDF",
                textElements: [
                    {"subtitle": ""},// "FS Site Number: \nSmithsonian Number:"},
                    {"title": "Natural Resource Manager (NRM) Map"},
                    {"pagerange": ""},
                    {"unit": ""},
                    {"forest": ""},
                    {"district": ""},
                    {"user" : username},
                    {"legal": ""},
                    {"date": new Date().toDateString()}
                    //,{"disclaimer": "Disclaimer"}
               ]
            }
            var opts = $.extend({}, defaults, options);
                
            var printMapCallback = function(url){
                if (progressView) progressView.remove();// if ($(".ajax-progress")) {$(".ajax-progress").hide();}
                if (cancel) {
                    return;
                }
                nrmmap.printed = true;
                if (retrying) {
                    // TODO: can we remove this now that we are using apps.fs.usda.gov print service?
                    proxyErrorWorkaround = true;
                    retrying = false;
                }
                // before 10.2, urls aren't necessarily unique and can be cached
                // so add time to the url
                // https://geonet.esri.com/thread/76171
                url.url = url.url + '?time=' + new Date(); 
                url.url = url.url.replace(/^http:\/\//, "https://");
                if (opts.callback) {
                    opts.callback(url);
                } else {
                    //window.open(url.url);//, "map", "location=no");
                    var fileUrl = url.url.replace(' ', '%20');
                    var title = "";
                    for (var k in opts.textElements){
                        if (opts.textElements[k].title !== undefined) {
                            title = opts.textElements[k].title;
                            break;
                        }
                    }
                    ReportLauncherView.showReportLauncherView({
                        url: fileUrl, 
                        caption: title, 
                        documentTitle: "map",
                        message: "The map is ready to download.",
                        button: {label: "View Map"}
                    });
                }
            };
            var printMapErrorCallback = function(err){
                if (progressView) progressView.remove(); //if ($(".ajax-progress")) {$(".ajax-progress").hide();}
                if (cancel) {
                    return;
                }
                console.log("printMap Error: " + err.message);
                // see if the error is because of edw map layers
                if (!nrmmap.printed && err.message.toLowerCase().indexOf('proxy') > -1) {
                    retrying = true;
                    nrmmap.printed = true;
                    // TODO: can we remove this now that we are using apps.fs.usda.gov print service?
                    var layer, map = nrmmap.map;
                    for(var j = 0; j < map.layerIds.length; j++) {
                        layer = map.getLayer(map.layerIds[j]);
                        if (layer.url && layer.url.indexOf('apps.fs') > -1) {
                            layer.setVisibility(false);
                        }
                    }
                    nrmmap.printMap(options);
                    return;
                }
                //if ($(".ajax-progress")) {$(".ajax-progress").hide();}
                console.error('error in printMap',err);
                var msg = err.message;
                //if (msg === "Cannot read property 'document' of undefined") { //artf11102
                //    msg = "Could not display the file. Please turn off pop-up blockers and try again.";
               // }
                if (opts.errorCallback) {
                    opts.errorCallback(err);
                } else {
                    MessageBox("Print service: " + msg);
                } 
            };
            //if ($(".ajax-progress")) {$(".ajax-progress").show();}
            var printTaskUrl = (options && options.printTaskUrl)||(this.options && this.options.printTaskUrl)||"${map.printServiceUrl}";
            require([
                'esri/tasks/PrintTemplate', 
                'esri/tasks/PrintParameters', 
                'esri/tasks/PrintTask'
            ], function(
                    PrintTemplate, 
                    PrintParameters, 
                    PrintTask
            ) {
            var template = new PrintTemplate();
            //var printTaskUrl = "https://nrmgisdeva.fs.usda.gov/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
            //template.layout = "Letter ANSI A Landscape";
            //var printTaskUrl = "https://nrmgisdeva.fs.usda.gov/arcgis/rest/services/dev/ExportWebMap/GPServer/Export%20Web%20Map";
            template.layout = opts.layout;
            template.format = opts.format;
            template.exportOptions = {dpi: 300};
            // http://resources.arcgis.com/en/help/main/10.1/index.html#/ExportWebMap_specification/0154000004w8000000/
            template.layoutOptions = {customTextElements: opts.textElements};
            var params = new PrintParameters();
            params.map = map;
            params.template = template;
            var printTask = new PrintTask(printTaskUrl);
            printTask.execute(params, printMapCallback, printMapErrorCallback);
                });
        },
                
        _graphicsLayerClick: function(evt) {
            var id;

            // By default, features are selectable upon clicks on the map
            //var featureIsSelectable = (typeof evt.graphic.attributes.selectable !== "undefined") ? evt.graphic.attributes.selectable : true;
            var graphic = evt.graphic;
            var layer = graphic.getLayer();
            var featureIsSelectable = false;
            if (graphic.attributes.selectable || (layer.nrmOptions && layer.nrmOptions.selectable)) {
                featureIsSelectable = true;
            }
            // By default, features are editable upon clicks on the map
            var featureIsEditable = false;
            if (graphic.attributes.editable || (layer.nrmOptions && layer.nrmOptions.editable)) {
                featureIsEditable = true;
            }

            if (!featureIsEditable && !featureIsSelectable) {
                return;
            }

            //consoleLog("ONCLICK FEATURE");

            dojoEvent.stop(evt); // Prevent the event from bubbling to the map.

            // Start a spinner up here if necessary
            if (layer.nrmOptions && layer.nrmOptions.keyFieldName) {
                graphic.attributes.id = graphic.attributes[layer.nrmOptions.keyFieldName];
            }
            
            if ((nrmmap.options.editMode) && (featureIsEditable)) {
                nrmmap.options.editFeatureStartCallback();
            }

            if (featureIsSelectable) {
                nrmmap.clearGraphicSelection();
                //that.centerMapAtGraphic(evt.graphic);
                nrmmap.selectGraphic(graphic);
            }

            if ((nrmmap.options.editMode) && (featureIsEditable)) {
                nrmmap._activateEditingToolbar(graphic);
            } else {
                nrmmap.openDialog(graphic, evt.pageX, evt.pageY);
            }

            try {
                layer.clearSelection();
            }
            catch (ex) {
                // this probably isn't a featureLayer, but it's okay
            }

            var suppressZoom = (layer.nrmOptions && layer.nrmOptions.zoomToSelection) ? false : true;
            nrmmap._zoomTo({graphic: graphic, suppressZoom: suppressZoom});

            // Pass the ID to the featureClickCallback function
            id = (typeof graphic.attributes.id !== "undefined") ? graphic.attributes.id : null;
            if (id != null && layer.nrmOptions && layer.nrmOptions.featureClickCallback) {
                //nrmmap.options.featureClickCallback(id);
                layer.nrmOptions.featureClickCallback(id);
            }
        },

        getGraphicFromLayerClick: function(evt) {
            var graphic = evt.graphic;
            if (graphic) {
                var layer = graphic.getLayer();
                dojoEvent.stop(evt); // Prevent the event from bubbling to the map.
                layer.selectGraphicCallback(graphic);
            }
        },

        _initTileCache: function(callback, options, context) {
            var that = this,
                defaults = {layer: that.basemap, debug: that.options.debug},
                opts = _.pick(_.defaults(options || {}, defaults), 'layer', 'debug');
            require(['nrm-map/NRMMapCache'], function(NRMMapCache) {
                that.tileCache = new NRMMapCache(opts);
                $.when(that.tileCache.initLocalStorage()).done(function(){
                    //console.log('Map._initTileCache.initLocalStorage done', that.tileCache);
                    if (callback) callback.call(context || this, that.tileCache);
                });
            });
        },

        pointToExtent: function(mapPoint) {
            var tolerance = 2;
            var screenPoint = this.map.toScreen(mapPoint);
            // ScreenPoint is relative to top-left
            var bottomLeft = new ScreenPoint();
            bottomLeft.setX(screenPoint.x - tolerance);
            bottomLeft.setY(screenPoint.y + tolerance);
            var topRight = new ScreenPoint();
            topRight.setX(screenPoint.x + tolerance);
            topRight.setY(screenPoint.y - tolerance);
            bottomLeft = this.map.toMap(bottomLeft);
            topRight = this.map.toMap(topRight);
            return new Extent(bottomLeft.x, bottomLeft.y, 
                topRight.x, topRight.y, this.map.spatialReference);
        },

        /**
         * 
         * @param {Object} options contains the type of thing to zoom to, and the thing itself. Must contain one of
         * these properties: graphic, graphics, extent, geometry
         * @param {external:module:esri/Graphic} graphic
         * @param {external:module:esri/Graphic[]} graphics
         * @param {external:module:esri/geometry/Extent} extent
         * @param {external:module:esri/geometry} geometry
         * @param {boolean} [suppressIfPartial=false] Do not change extent if zoomed in to part of the input.
         * @param {boolean} [suppressZoom=false] Pan, but do not change zoom level.
         * @returns {unresolved}
         */
        // options  Enter one of the following valid values:
        // {  graphic: <graphic>, graphics: <array of graphics>, extent: <extent>, geometry: <geometry> }
        _zoomTo: function(options) {
            try {
                var extent = false,
                    layer = false,
                    map = this.map,
                    graphic = false;
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
                    extent = options.extent;
                }
                else if (options.geometry) {
                    extent = options.geometry.getExtent() || this.pointToExtent(options.geometry);
                }

                if (extent) {
                    var mapext = prjUtils.webMercatorToGeographic(map.extent);
                    if (options.suppressIfPartial && !mapext.contains(extent) && mapext.intersects(extent)
                            && (mapext.getHeight() < extent.getHeight() || mapext.getWidth() < extent.getWidth())) {
                        return;
                    }
                    map.centerAt(extent.getCenter());
                    //consoleLog('centered map');
                    if (!options.suppressZoom) {
                        //var minScale = Math.max(nrmmap._layersMinScale, layer.minScale);
                        var minScale = Math.min(Math.max(this._layersMinScale, layer.minScale), this.options.minZoomToScale);
                        //consoleLog('minscale: ' + minScale.toString() + '  map scale: ' + map.getScale().toString());
                        //map.setExtent(extent); // 7/17/14
                        var deferred = map.setExtent(extent, true);
                        deferred.then(function(){
                            //consoleLog("in deferred from setExtent!");
                            //map.setZoom(map.getZoom() + 1); // 7/17/14
                            if (map.getScale() > minScale || (layer && !layer.isVisibleAtScale(map.getScale()))) {
                                //consoleLog('setting scale to ' + minScale.toString());
                                map.setScale(minScale);
                                // 7/17/14 map.centerAt(extent.getCenter());
                            }
                            if (!map.extent.contains(extent) || (graphic && !graphic.visible)) {
                                map.setExtent(extent, true);
                                //consoleLog("setting map to extent because it didn't include the extent.  New scale: " + map.getScale().toString());
                            }
                        });
                    }
                }
            } catch (ex) {
                console.warn('Error in zoomTo: ' + ex.message);
            }

        },

        _layersMinScale: 0,

        _layersMaxScale: 0

        ,addLayerByURL: function(url){
            var inputCallback = function(url) {
                if (url) {
                    this.setDynamicMapLayer(url.replace(/^http:/i,"https:"));
                }
            };
            if (url == undefined) {
                var message = 'Enter a "MapServer" or "ImageServer" URL.  \nFor example: <span style="font-size:12px;">https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_ForestSystemBoundaries_01/MapServer</span>';
                var defaultValue = '';
                var caller = this;
                var handled = this.options.requestInputCallback && this.options.requestInputCallback.call(this, {
                       caption: "Add Layer from URL",
                       buttons: 1,
                       inputField: '#mapControlInput',
                       backdrop: 'static',
                       //modalClass: 'modal-lg',
                       callback: function() {
                            if (this.inputVal)
                                inputCallback.call(caller, this.inputVal);
                       },
                       content: '<form class="nrm-edit-form" role="form" action="#"><div id="mapControlInput-container" class="form-group">' +
'<label id="mapControlInput-label" class="control-label">'+ message + // removed for="mapControlInput" to make text selectable
'</label><input class="form-control" type="text" id="mapControlInput" value="' + defaultValue + 
'"></div><br>Browse "MapServer" sources: <ul>' +
'<li><a href="https://apps.fs.usda.gov/arcn/rest/services/" target="_blank">FS Enterprise Data Warehouse (EDW) Internal services</a></li>' + 
'<li><a href="https://apps.fs.usda.gov/arcx/rest/services/" target="_blank">FS Enterprise Data Warehouse (EDW) External services</a></li>' + 
/* http://teamforge.fs.usda.gov/sf/go/artf62519: we can't support RSAC services unless they provide an SSL proxy, or we
 * open the NITC firewall for the RSAC IP to do the proxy ourselves.
 */
//'<li><a href="http://166.2.126.54/arcgis/rest/services/" target="_blank">FS Remote Sensing Applications Center (RSAC)</a></li>' + 
'<li><a href="https://server.arcgisonline.com/arcgis/rest/services/" target="_blank">ArcGIS Online</a></li>' +
'<li><a href="https://viewer.nationalmap.gov/services/" target="_blank">The National Map (USGS)</a></li>' +
'<li><a href="https://wildfire.usgs.gov/geomac/services.shtml" target="_blank">GeoMAC Wildland Fire Support</a></li>' +
'</ul></form>'
                    }, inputCallback);
                if (!handled) url = prompt(message,defaultValue);
                else return;
            }
            inputCallback.call(this, url);
        }
        
        // ebodin 6/16/2014 removed stub code using AGOL service in lieu of processing shapefile locally
        //                  (based on Stony Lohr's extension of a Google sample)
        /**
         * 
         * @param {Object} [options] - If not supplied, prompts user to select files.
         * @param {boolean} [options.allowMultiple=true] - Support more than one shapefile in fileList.
         * @param {function} [options.callback] - Callback takes argument {layer: }
         * @param {function} [options.cancelCallback]
         * @param {FileList} [options.fileList] - From a file input dialog.
         * @param {boolean} [options.suppressAdd=false] - If true, do not add layer to map.
         * @param {boolean} [options.suppressZoom=false] - If true, do not zoom to layer extent.
         * @return {unresolved}
         */
        ,addShapeFile: function (options) {
            options = _.defaults(options || {}, {allowMultiple: true});
            if (options.callback) {
                this.options.shapefileLoadedCallback = options.callback;
                options.helpContext = this.options.helpContextShapefileImport;
            } else {
                options.helpContext = this.options.helpContextShapefileLayer;
            }
            var fileListInput = options.fileList;

            var self = this;
            if (!fileListInput || !fileListInput.length) {
                var $ajax = $(".ajax-progress");
                $("#fileinput").remove();
                var $fileinput = $('<input id="fileinput" type="file" style="display:none" accept=".shp,.dbf,.prj" multiple/>');
                var $body = $('body');
                $body.append($fileinput);
                if ($ajax.length) $ajax.show();
                $fileinput.one("change", function(evt){ 
                    self.addShapeFile($.extend(true, {}, options, {fileList: evt.target.files})); 
                }).one("click", function(evt){
                    document.body.onfocus = function() { 
                        document.body.onfocus = null;
                        if ($ajax.length) $ajax.hide();
                    };
                }).click();
                 return;
            }
            
            // verify files, etc.
            if (fileListInput.length < 3) {
                var msg = "Missing Files.\n Please select all three shapefile files. \nFor example:  xy.DBF, xy.PRJ, and xy.SHP";
                MessageBox(msg, {title: "Shapefile error", helpContext: options.helpContext});
                return;
            }

            if (!options.allowMultiple) {
                var rootNames = _.keys(_.groupBy(fileListInput, function(obj){return obj.name.substr(0, obj.name.lastIndexOf("."));}));
                if (rootNames.length !== 1) {
                    var msg = "Only one shapefile can be used with Import from Shapefile. Please try again and select the .dbf, .prj, and .shp files for only one shapefile.";
                    MessageBox(msg, {title: "Shapefile error", helpContext: options.helpContext});                    
                    return;
                }
                //rootNames = [rootNames[0]];
            }
                var $parent = $(".panel-heading", $(".panel[data-nrm-help-context='882']")),
                    worker = new Worker(window.location.origin + require.toUrl('nrm-map') +'/shapefileWorker.js'),
                    featureCollectionsInProgress = [], errorsInProgress, // handle interim responses from worker
                    progressView = new ProgressView({
                        $parent: $parent,
                        text: "Shapefile...",
                        closeIconTitle: "Cancel shapefile processing",
                        callback: function(){
                            if (worker) {
                                worker.terminate();
                                worker = undefined;
                            }
                            var err = {message: "User canceled operation."},
                                errs = errorsInProgress ? JSON.parse(errorsInProgress) : [];
                            errs.push(err);
                            processResult({featureCollections: featureCollectionsInProgress, errors: JSON.stringify(errs)});
                        }
                    });
                progressView.render();
                function hideProgress() {
                    progressView.remove();
                }
                function processResult(result) {
                    var layers = [], addedLayers = false, finalExtent;
                    if (!result || !result.featureCollections || result.featureCollections.length === 0) {
                        var msg = "Could not import shapefile.",
                            moreMsg = "",
                            errors = JSON.parse(result.errors),
                            title = "Shapefile processing error";
                        if (_.every(errors, function(e){return e.message === "User canceled operation.";})) {
                            return;
                        }
                        errors.forEach(function(error) {
                            moreMsg += "\n" + (error.message || error.description || "") + "\n";
                        });
                        if (moreMsg.toLowerCase().indexOf("out of memory") > -1) {
                            msg += "\n" + self.options.messages.shapefileMemory + "\n";
                        }
                        MessageBox(msg, {title: title, helpContext: options.helpContext, moreMsg: moreMsg});
                        hideProgress();
                        return;
                    }
                    try {
                        result.featureCollections.forEach(function(featureCollection){
                            var layer = new FeatureLayer(featureCollection),
                                nameAttr = layer.displayField,
                                sym = self.getGeometrySymbol(layer.geometryType, "imported"),
                                renderer = new SimpleRenderer(sym);
                            if (!nameAttr) {
                                nameAttr = _.find(["NAME", "LABEL", "ID"], function(val){
                                    return(_.pluck(layer.fields, "name").indexOf(val) > -1 || _.pluck(layer.fields, "alias").indexOf(val) > -1);
                                });
                                if (!nameAttr) {
                                    nameAttr = _.find(_.pluck(layer.fields, "name"), function(val){
                                        return val.indexOf("NAME") > -1;
                                    });
                                }
                                if (nameAttr) {
                                    layer.displayField = nameAttr;
                                }
                            }
                            layer.nrmOptions = {
                                caption: options.name || featureCollection.layerDefinition.caption,
                                keyFieldName: "NRMINDEX", 
                                selectByID: _.bind(self.selectByID, self),
                                featureLayer: layer, 
                                nameAttr: nameAttr
                            };
                            layer.setRenderer(renderer);
                            sym = self.getGeometrySymbol(layer.geometryType, "selected");
                            layer.setSelectionSymbol(sym);
                            layer.opacity = (options.opacity === undefined) ? 1 : options.opacity;
                            self.mapSupport.dynamicMapLayers.push(layer);
                            if (self.options.shapefileLoadedCallback) {
                                self.options.shapefileLoadedCallback({layer: layer});
                                self.options.shapefileLoadedCallback = false;
                            };
                            if (!options.suppressZoom) {
                                if (finalExtent) {
                                    finalExtent = finalExtent.union(graphicsUtils.graphicsExtent(layer.graphics));
                                } else {
                                    finalExtent = graphicsUtils.graphicsExtent(layer.graphics);
                                }
                            }
                            layers.push(layer);
                        });
                        if (!options.suppressAdd) {
                            addedLayers = true;
                            progressView.setPercentComplete(95);
                            var layerAddListener = self.map.on("layers-add-result", function(event){
                                    //console.log("addlayers done, hiding progress");
                                    if (finalExtent) {
                                        self._zoomTo({extent: finalExtent});
                                    }
                                    self._reorderLayers(layers);
                                    hideProgress();
                                    layerAddListener.remove();
                                });
                            self.map.addLayers(layers);
                        }
                        if (result.errors && result.errors.length > 2) { // "[]" is empty list of errors
                            var msg = "", errors = JSON.parse(result.errors),
                                title = "Shapefile processing error" + (result.errors.length > 1 ? "s:\n" : ":\n");
                            errors.forEach(function(error) {
                                msg += "\n" + (error.message || error.description) + "\n";
                            });
                            MessageBox(msg, {title: title, helpContext: options.helpContext});
                        }
                    } catch (error) {
                        MessageBox((error.message || error.description), {title: "Shapefile processing error", helpContext: options.helpContext});
                    } finally {
                        if (!addedLayers) {
                            hideProgress();
                        }
                    }
                }
                function workerEventHandler(event) {
                    //console.log("workerHandler received event", event);
                    var result = event.data;
                    switch (result.type) {
                        case "progress":
                            //console.log("progress received " + result.percentComplete.toString());
                            progressView.setPercentComplete(result.percentComplete);
                            if (result.errors) {
                                errorsInProgress = result.errors;
                            }
                            if (result.featureCollection) {
                                featureCollectionsInProgress.push(result.featureCollection);
                            }
                            break;
                        case "response": 
                            //console.log("shapefile processing complete", result);
                            if (worker) {
                                worker.terminate();
                                worker = undefined;
                            }
                            processResult(result);
                            break;
                        default:
                            console.warn("Unhandled message from shapefile worker", result);
                            break;
                    }
                }
                
                worker.addEventListener('message', workerEventHandler);
                var workerData = {fileList: fileListInput, scripts: [
                    location.origin + require.toUrl("nrm-map/shapefileloader" + "/shapefile-nonAMD.js"), 
                    location.origin + require.toUrl("proj4") + ".js"
                ]};
                worker.postMessage(workerData);//, [workerData.fileList]);
          }
          ,selectByID: function(id, layer) {
              var graphicsBackup = _.clone(layer.graphics);
              this.clearLayerSelection(layer);
              for (var i = layer.graphics.length - 1; i >= 0; i -= 1) {
                  var g = layer.graphics[i];
                  if (g.attributes[layer.objectIdField] === id) {
                      var s = layer.getSelectionSymbol();
                      g.setSymbol(s);
                      layer._selectedFeatures = {0: g};
                      layer._selectedFeaturesArray = [g];
                      this.flashGraphic(g, 2);
                      break;
                  }
              }
              // selectFeatures can reduce the number of graphics
              layer.graphics = graphicsBackup;
              layer.redraw();
          }
          ,clearLayerSelection: function (layer) {
              if (_.isString(layer)) {
                  layer = this.map.getLayer(layer);
              }
              if (layer.id !== "nrmGraphicsLayer") {
                  layer._selectedFeatures = {};
                  layer._selectedFeaturesArray = [];
                  layer._selectedFeaturesArr = [];
                  _.each(layer.graphics, function(g) {g.symbol = undefined;});
                  layer.redraw();
              }
          }



    }; // end of prototype

        //_nrm.namespace("controls").Map = Plugin;
    Plugin.ServerLocation = ServerLocation;
    Plugin.nrmAppRootFolder = nrmAppRootFolder;
    Plugin.lods = lods;
    return Plugin;
});