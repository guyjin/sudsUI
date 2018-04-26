/**
* @file The MapIdentifyView module.
* @see module:nrm-map/views/mapIdentifyView
*/
/** 
* @module nrm-map/views/mapIdentifyView
* 
*/

define(['nrm-ui',
        'jquery',
        'underscore',
        'backbone',
        'hbs!dropdown',
        'hbs!mapIdentify',
        'handlebars',
        'nrm-ui/plugins/nrmContextMenu',
        'jstree',
        'esri/tasks/IdentifyParameters',
        'esri/tasks/IdentifyTask', 
        'dojo/_base/Color',
        'esri/geometry/jsonUtils',
        'esri/symbols/PictureMarkerSymbol',
        'esri/graphic',
        'esri/geometry/ScreenPoint',
        'esri/geometry/Extent',
        'esri/tasks/query',
        'esri/layers/FeatureLayer',
        "dojo/domReady!" // dojo/domReady! should always be the last dependency
], function(Nrm,
            $,
            _,
            Backbone,
            DropdownTemplate,
            TabContentTemplate,
            Handlebars,
            NRMContextMenu,
            JSTree,
            IdentifyParameters,
            IdentifyTask,
            Color,
            geometryJsonUtils,
            PictureMarkerSymbol,
            Graphic,
            ScreenPoint,
            Extent,
            Query,
            FeatureLayer,
            domReady) {
    return Nrm.Views.MapIdentifyView = Backbone.View.extend(/** @lends module:nrm-map/views/mapIdentifyView.prototype */{
        /**
         * Create a new instance of mapIdentifyView.
         * @constructor
         * @alias module:nrm-map/views/mapIdentifyView
         * @classdesc
         *   A Backbone view that renders Identify Results in the Map accordion panel
         *   and displays information on features where the user clicks on the map.
         * @param {Object} options
         * @param {esri/map} options.mapControl - Map associated with layers and events.
         * @param {string} [options.helpContext] - Online help page or URL.
         * @param {boolean} [options.panelExpanded=true] - Initial state for panel.
         * @param {string} [options.panelId="mapIdentifyControl"] - HTML id for panel.
         * @param {string[]} [options.exclude=["nrmGraphicsLayer"]] - Map layerIDs to exclude from identify behavior.
         * @param {Object} [options.tree] - jsTree options.
         * @see {@link https://www.jstree.com/api/#/?q=defaults|jsTree defaults}
         * 
         */
        initialize: function(options) {
            var mapMenuTitle = "Context menu for Map",
                mapMenuId = "map-default-actions";
            this.options = $.extend({}, this.defaultOptions, options);
            this.mapControl = this.options.mapControl;
            Nrm.app.mapView.mapIdentifyView = this;
            this.treeId = "map-identify-results-div";
            this.treeOptions = this.options.tree || {};
            var mapEvents = {};
            this.contextmenu = {
                id: mapMenuId,
                title: mapMenuTitle,
                clickEvents: mapEvents,
                items: [
                    {
                        "id": "map-identify-copy",
                        "label": "Copy",
                        "href": "#mapIdentifyCopy",
                        "className": "nrm-route-action"
                    },
                    {
                        "id": "map-identify-copy-children",
                        "label": "Copy with Children",
                        "href": "#mapIdentifyCopyChildren",
                        "className": "nrm-route-action",
                        "ifHasChildren": true
                    },
                    {
                        "id": "map-identify-zoom",
                        "label": "Zoom to Feature",
                        "href": "#mapIdentifyZoom",
                        "className": "nrm-route-action",
                        "nodeTypes": ["clickPoint", "point", "line", "polyline", "polygon", "multipoint", 
                            "esriGeometryPoint", "esriGeometryPolyline", "esriGeometryPolygon", "esriGeometryMultipoint"]
                    },
                    {
                        "id": "map-identify-pan",
                        "label": "Pan to Feature",
                        "href": "#mapIdentifyPan",
                        "className": "nrm-route-action",
                        "nodeTypes": ["clickPoint", "point", "line", "polyline", "polygon", "multipoint",
                            "esriGeometryPoint", "esriGeometryPolyline", "esriGeometryPolygon", "esriGeometryMultipoint"]
                    },
                    {
                        "id": "map-identify-url",
                        "label": "Open Link in New Tab",
                        "href": "#mapIdentifyOpenUrl",
                        "className": "nrm-route-action",
                        "ifUrl": true
                    }
                    
                ]
            };
        },
        defaultOptions: {
            panelExpanded: true,
            helpContext: "1093",
            panelId: "mapIdentifyControl",
            cursor: "url(" + require.toUrl("nrm-ui/img/identify-cursor.cur") + "),auto",
            exclude: ["nrmGraphicsLayer", "Copy Feature", "Temporary Shapefile"]
        },
        nodeTypes: {
            "point": {"icon": require.toUrl("nrm-ui/img/point.png")},
            "line": {"icon": require.toUrl("nrm-ui/img/line.png")},
            "polyline": {"icon": require.toUrl("nrm-ui/img/line.png")},
            "polygon": {"icon": require.toUrl("nrm-ui/img/polygon.png")},
            "multipoint": {"icon": require.toUrl("nrm-ui/img/point.png")},
            "esriGeometryPoint": {"icon": require.toUrl("nrm-ui/img/point.png")},
            "esriGeometryPolyline": {"icon": require.toUrl("nrm-ui/img/line.png")},
            "esriGeometryPolygon": {"icon": require.toUrl("nrm-ui/img/polygon.png")},
            "esriGeometryMultipoint": {"icon": require.toUrl("nrm-ui/img/point.png")},
            "clickPoint": {"icon": "glyphicon glyphicon-map-marker text-danger", "marker": require.toUrl("nrm-ui/img/glyphicon-map-marker.png")},
            "row": {"icon": require.toUrl("nrm-ui/img/row.png")},
            "wait": {"icon":  "glyphicon glyphicon-time"},
            "error": {"icon": "glyphicon glyphicon-exclamation-sign"}
        },
        events: {
            "click #mapIdentifyClose": "close",
            "contextmenu #map-identify-results-div a": "onContextMenu"
        },
        /**
         * Set up event listeners.
         * @override
         */
        startListening: function() {
            //console.log("mapIdentifyView.startListening");
            var mapView = Nrm.app.mapView,
                declaredHandlers = mapView.selectionHandlersDeclared;
            // deactivate selection mode
            if (!this.isListening && !this.disablingSelection && declaredHandlers && declaredHandlers.length > 0) {
                //console.log("     disabling selection");
                this.disablingSelection = true;
                Nrm.event.trigger("map:configureSelect", {deactivate: true});
                this.startListening();
                return;
            }
            this.disablingSelection = null;
            if (this.closed || this.isListening || mapView.activeTool) {
                //console.log("     avoiding accidental activation");
                // avoids accidental activation while closed or double-activation
                // this.closed is set to false in render function, and true in close function
                this.isListening = !!this.isListening;
                this.listenTo(Nrm.event, {
                    "map:deactivateTool": this.startListening,
                    "map:endDraw": this.startListening
                });
                return;
            }
            var map = this.mapControl.map;
            mapView.declareSelectionHandler({id:"identify", handling:true});
            this.isListening = true;
            this.onMapClickListener = map.on('click', _.bind(this.onMapClick, this));
            mapView.setCursor(this.options.cursor);
            this.onMapLayerAddListener = map.on('layer-add-result', _.bind(this.onLayerAdded, this));
            this.listenTo(Nrm.event, {
                "map:identifyZoom": this.zoomTo,
                "map:identifyPan": this.panTo,
                "map:identifyCopy": this.copyNodeText,
                "map:identifyCopyChildren": this.copyChildText,
                "map:identifyOpenUrl": this.openUrl,
                "map:deactivateTool": this.startListening,
                "map:endDraw": this.startListening,
                "map:beforeActivateTool": this.stopMapListeners
            });
            this.setMessage("default");
        },
        /**
         * Stop listening to map events when another map tool is activated.
         */
        stopMapListeners: function() {
            this.stopListening({mapOnly: true});
            this.setMessage("pause");
        },
        /**
         * Override Backbone.View.stopListening to detach dojo events, then call default stopListening
         * @param {Object} [options]
         * @param {Boolean} [options.mapOnly=false] Stop listening only to map events, don't call default stopListening.
         * @override
         */
        stopListening: function(options) {
            options = options || {};
            Nrm.app.mapView.declareSelectionHandler({id:"identify", handling:false});
            this.isListening = false;
            Nrm.event.trigger("map:setCursor");
            this.onMapClickListener && this.onMapClickListener.remove();
            this.onMapLayerAddListener && this.onMapLayerAddListener.remove();
            if (!options.mapOnly) {
                Backbone.View.prototype.stopListening.apply(this, arguments);
            }
        },
        /**
         * @property {regex} urlRegex - Regular expression to verify an entire string is a URL.
         */
        urlRegex: /^(http|https)\:\/\/\S+$/,
        /**
         * If a tree node's attribute value contains only a URL, open it in a new window.
         * @param {string} nodeId - Node ID.
         */
        openUrl: function(nodeId) {
            var node = this.tree.jstree("get_node", nodeId),
                text = this.getNodeText(node),
                parts = this.urlRegex.exec(text);
            if (parts) {
                window.open(parts[0], "_blank");
            }
        },
        /**
         * If a tree node represents a geometry, zoom to it.
         * @param {string} nodeId - Node ID.
         * @param {boolean} [panOnly=false] - True re-centers the map only, without changing zoom level.
         * @listens module:nrm-ui/main.event~event:map:identifyZoom
         */
        zoomTo: function(nodeId, panOnly) {
            var node = this.tree.jstree("get_node", nodeId),
                geometry = (node && node.original && node.original.geometry) ? node.original.geometry : undefined;
            if (geometry) {
                this.mapControl._zoomTo({geometry: geometryJsonUtils.fromJson(geometry), suppressZoom: panOnly});
            }
        },
        /**
         * If a tree node represents a geometry, pan to it.
         * @param {string} nodeId - Node ID.
         * @listens module:nrm-ui/main.event~event:map:identifyPan
         */
        panTo: function(nodeId) {
            this.zoomTo(nodeId, true);
        },
        /**
         * Copy text to the system clipboard.
         * @param {type} text - Text copied to clipboard.
         */
        copyToClipboard: function(text) {
            $('body').append('<textarea id="nrmClipboard"></textarea>');
            var $el = $('#nrmClipboard');
            $el.val(text);
            var copyTextarea = document.querySelector('#nrmClipboard');
            copyTextarea.select();
            if (!document.execCommand('copy')) {
                alert('try ctrl-c');
            }
            $el.remove();
        },
        /**
         * Get the text value from a tree node.
         * @param {Object|string} node - jsTree node or node ID.
         * @see {@link https://www.jstree.com/docs/json/|jsTree JSON}
         * @param {Boolean} [all=false] - True gets all text, false gets attribute value.
         * @returns {string}
         */
        getNodeText: function(node, all) {
            node = node.jquery ? this.tree.jstree("get_node", node) : node;
            var text;
            if (node.original && node.original.attName) {
                text = all ? node.original.attName + ": " + node.original.attValue : node.original.attValue;
            } else {
                text = this.tree.jstree("get_text", node);
            }
            return text;
        },
        /**
         * Copy the text of a single tree node to the system clipboard.
         * @param {string} nodeId - Node ID.
         * @listens module:nrm-ui/main.event~event:map:identifyCopy
         */
        copyNodeText: function(nodeId) {
            var tree = this.tree,
                node = tree.jstree("get_node", nodeId),
                text = this.getNodeText(node);
            this.copyToClipboard(text);
        },
        /**
         * Copy the text of a tree node and all its children to the system clipboard.
         * @param {string} nodeId - Node ID.
         * @listens module:nrm-ui/main.event~event:map:identifyCopyChildren
         */
        copyChildText: function(nodeId) {
            var tree = this.tree,
                self = this,
                startNode = tree.jstree("get_node", nodeId),
                text = "",
                processChildren = function(node, depth) {
                    if (_.isNumber(depth)) {
                        depth++;
                    } else {
                        depth = 0;
                    }
                    text += Array(depth * 4).join(" ") + self.getNodeText(node, true) + '\n';
                    _.each(node.children, function(id) {
                        var childNode = tree.jstree("get_node", id);
                        processChildren(childNode, depth);
                    });
                };
            processChildren(startNode);
            text = text.substring(0, text.length - 1);
            this.copyToClipboard(text);
        },
        /**
         * Place a graphic on the map where the user clicked.
         */
        drawPoint: function() {
            var map = this.mapControl.map;
            map.graphics.clear();
            map.graphics.add(new Graphic(this.clickPoint, this.clickPointSymbol));
        },
        /**
         * Handle a map click event: identify features and place a graphic.
         * @param {external:module:esri/map~event:click} event - Map click event.
         * @see {@link https://developers.arcgis.com/javascript/jsapi/map-amd.html#event-click|ArcGIS JSAPI Map click event}
         * @listens external:module:esri/map~event:click
         */
        onMapClick: function(event) {
            var mapView = Nrm.app.mapView,
                mapControl = this.mapControl,
                layerId, layerIds = this.getMapLayerIds(),
                tree = this.tree, node,
                geoPoint = mapView.convertToGeographic(event.mapPoint),
                node;
            this.clickPoint = event.mapPoint;
            this.clickExtent = undefined;
            this.drawPoint();
            $('#map-identify-info-div', this.$el).html(""); // clear instructional text after first click
            // display point info
            tree.jstree("get_node", "clickNode").original.geometry = this.clickPoint.toJson();
            node = tree.jstree("get_node", "clickLatitude");
            node.original.attName = "Latitude";
            node.original.attValue = geoPoint.y.toFixed(6).toString();
            tree.jstree("set_text", node, "<i>" + node.original.attName + "</i>: " + node.original.attValue);
            node = tree.jstree("get_node", "clickLongitude");
            node.original.attName = "Longitude";
            node.original.attValue = geoPoint.x.toFixed(6).toString();
            tree.jstree("set_text", node, "<i>" + node.original.attName + "</i>: " + node.original.attValue);
            
            for (var i in layerIds) {
                layerId = layerIds[i];
                node = tree.jstree("get_node", this.getLayerNodeId(layerId));
                if (node) {
                    if (tree.jstree("is_open", node)) {
                        this.identifyNode(node);
                    }
                }
            }
        },
        /**
         * In response to a user map click, display in the tree the attributes of features .
         * from layers associated with the node.
         * @param {Object} node - jsTree node.
         */
        identifyNode: function(node) {
            if (!this.clickPoint) {
                return;
            }
            var children = node.children, //this.tree.jstree("get_children_dom", node),
                dfd = $.Deferred(),
                nResults = 0,
                map = this.mapControl.map,
                tolerance = Math.ceil(map.getZoom()/3),
                layerIds = this.getNodeLayerIds(node.id),
                callbackCount = 0,
                callbackDone = function() {
                    callbackCount++;
                    if (callbackCount === layerIds.length) {
                        dfd.resolve();
                    }
                },
                self = this, tree = this.tree,
                pointToExtent = function(tolerance) {
                    if (!self.clickExtent) {
                        // ScreenPoint is relative to top-left
                        var screenPoint = map.toScreen(self.clickPoint),
                            bottomLeft = new ScreenPoint(),
                            topRight = new ScreenPoint();
                        bottomLeft.setX(screenPoint.x - tolerance);
                        bottomLeft.setY(screenPoint.y + tolerance);
                        topRight.setX(screenPoint.x + tolerance);
                        topRight.setY(screenPoint.y - tolerance);
                        bottomLeft = map.toMap(bottomLeft);
                        topRight = map.toMap(topRight);
                        self.clickExtent = new Extent(bottomLeft.x, bottomLeft.y, 
                            topRight.x, topRight.y, map.spatialReference);
                    }
                    return self.clickExtent;
                };
            try {
                for (var i in layerIds) {
                    var layerId = layerIds[i],
                        layer = map.getLayer(layerId),
                        callback = function(results) {
                            _.each(results, function(result) {
                                var layerNodeId = result.layerName === layer.id ? node.id : node.id + result.layerName,
                                    layerNode = tree.jstree("get_node", layerNodeId) || tree.jstree("create_node", node, {id: layerNodeId, text: result.layerName}),
                                    resultNodeText = 
                                        layer.displayField ? result.feature.attributes[(_.findWhere(layer.fields,{name:layer.displayField})|| _.findWhere(layer.fields,{alias:layer.displayField})).alias]
                                            : (layer.nrmOptions && layer.nrmOptions.nameAttr) ? result.feature.attributes[layer.nrmOptions.nameAttr]
                                            : result.value,
                                    resultNodeJson = {
                                        text: resultNodeText,
                                        type: result.geometryType,
                                        modelId: result.modelId,
                                        hasCustomContext: (layer.nrmOptions && layer.nrmOptions.contextCallback) ? true : false,
                                        layerId: layer.id, // not layerIds
                                        geometry: result.feature.geometry.toJson()
                                    },
                                    resultNode = tree.jstree("create_node", layerNode, resultNodeJson),
                                    atts = result.feature.attributes,
                                    attNodeJson, field;
                                nResults++;
                                _.each(atts, function(value, att){
                                    field = _.findWhere(layer.fields,{name:att})|| _.findWhere(layer.fields,{alias:att});
                                    if (field) {
                                        //switch (layer._getField(att).type) {
                                        switch (field.type) {
                                            case "esriFieldTypeDate":
                                                value = Nrm.app.formatValue(value, "date");
                                                break;
                                            case "esriFieldTypeSmallInteger":
                                            case "esriFieldTypeInteger":
                                            case "esriFieldTypeSingle":
                                            case "esriFieldTypeDouble":
                                                value = Nrm.app.formatValue(value, "numeric");
                                                break;
                                        }
                                    }
                                    attNodeJson = {text: "<i>" + att + ":</i> " + value, icon: false, attName: att, attValue: value};
                                    tree.jstree("create_node", resultNode, attNodeJson);
                                });
                                self.flashFeature(resultNode, 1);
                            });
                            callbackDone();
                        },
                        errorCallback = function(err) {
                            tree.jstree("set_type", node, "error");
                            tree.jstree("create_node", node, {text: err.name + ": " + err.message, icon: false});
                            callbackDone();
                        };
                    if (!this.clickPoint || !layer || !map) {
                        callbackDone();
                        continue;
                    }
                    tree.jstree("delete_node", children);
                    if (layer.url) {
                        var task = new IdentifyTask(layer.url),
                            identifyParams = new IdentifyParameters();
                        identifyParams.tolerance = tolerance;// 1;
                        identifyParams.returnGeometry = true;
                        //identifyParams.geometryPrecision = 1; this should make it faster, but makes no difference
                        identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL; //LAYER_OPTION_VISIBLE;
                        identifyParams.geometry = self.clickPoint;
                        identifyParams.mapExtent = map.extent;
                        identifyParams.width  = map.width;
                        identifyParams.height = map.height;
                        this.tree.jstree("set_type", node, "wait");
                        task.execute(identifyParams, callback, errorCallback);
                    } else if (layer.nrmOptions && layer.nrmOptions.identifyCallback) {
                        var extent = pointToExtent(tolerance);
                        $.when(layer.nrmOptions.identifyCallback(extent, layer)).done(callback).fail(errorCallback);
                    } else {
                        var extent = pointToExtent(tolerance),
                            selectQuery = new Query(),
                            selectFeaturesCallback = function(features) {
                                var results = [], f, graphic, atts;
                                // selectFeatures can reduce the number of graphics
                                layer.graphics = _.clone(layer._graphicsBackup);
                                layer._graphicsBackup = undefined;
                                layer.redraw();
                                for (f in features) {
                                    graphic = features[f];
                                    atts = graphic.attributes;;
                                    results.push({
                                        layerName: layer.id,
                                        value: atts.name || atts.id || atts[layer.objectIdField],
                                        geometryType: graphic.geometry.type,
                                        feature: {
                                            geometry: graphic.geometry,
                                            attributes: atts
                                        }
                                    });
                                }
                                callback(results);
                            };
                        selectQuery.geometry = extent;
                        selectQuery.returnGeometry = true;
                        selectQuery.outFields = ["*"];
                        layer._graphicsBackup = _.clone(layer.graphics);
                        layer.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW, 
                            selectFeaturesCallback, errorCallback);
                    }
                }
            } catch (e) {
                errorCallback(e);
            }
            $.when(dfd).done(function(){
                tree.jstree("set_type", node, "default");
                if (nResults === 0 && node.children.length === 0) {
                    tree.jstree("create_node", node, {text: "No features at Map Point", icon: false});
                }
            });
        },
        // <editor-fold desc="tree context menu events">
        /**
         * Handle the contextmenu event for tree nodes.
         * @param {Object} e - Contextmenu event.
         * @listens external:module:jstree~event:contextmenu
         */
        onContextMenu: function(e) {
            if (this.contextmenu) {
                e.preventDefault();
                var evt = { "evt" : e, "clickLoc" : false };
                //$("#nrm-contextmenu-btn").nrmContextMenu("hideMenu");
                this.showContextMenu(evt);
                if (!evt.cancel) {
                    e.stopPropagation();
                }
            }
        },
        /**
         * Return an array of menu item definitions specific to the selected layer.
         * @param {Object} options
         * @param {String} [options.$selNode] Selected tree node element. Gets top selected node if not supplied.
         * @returns {Object[]}
         */
        contextItems: function(options) {
            var items = [],
                tree = this.tree,
                $selNode = options && options.$selNode || tree.jstree("get_top_selected"),
                isSelection, selId;
            tree.jstree("deselect_all");
            tree.jstree("select_node", $selNode);
            isSelection = tree.jstree("get_selected").length > 0;
            // make sure the node selection wasn't cancelled...
            if (this.contextmenu.items  && this.contextmenu.items.length) {
                var selNode = tree.jstree("get_node", $selNode),
                    item;
                if (isSelection) {
                    _.each(this.contextmenu.items, function(value, index) {
                        if ((value.nodeTypes === undefined || value.nodeTypes.indexOf(selNode.type) !== -1)
                                && (!value.ifHasChildren || selNode.children.length > 0)
                                && (!value.ifUrl || this.urlRegex.test(this.getNodeText(selNode)))
                            ) {
                            item = _.clone(value);
                            if (index === 0 && items.length > 0)
                                item.group = true;
                            selId = _.isString($selNode[0]) ? $selNode[0] : $selNode[0].id;
                            item.href = item.href + "/" + selId;
                            items.push(item);
                        }
                    }, this); 
                    // add business layer and feature context menu items (as in the navtree)
                    if (selNode.original.hasCustomContext) {
                        var layer = this.mapControl.map.getLayer(selNode.original.layerId || selNode.original.layerIds[0]),
                            selNodeContextItems = layer.nrmOptions.contextCallback(
                                _.extend(tree.jstree("get_json", selNode, {no_children: true}), selNode.original)
                            );
                        if (_.isArray(selNodeContextItems)) {
                            // remove duplicates
                            selNodeContextItems = _.filter(selNodeContextItems, function(it) {
                                if (!_.findWhere(items, {label: it.label})) {
                                    return it;
                                }
                            });
                            if (selNodeContextItems.length > 0) {
                                if (items.length > 0) {
                                    selNodeContextItems[0].group = true;
                                }
                                items.push.apply(items, selNodeContextItems);
                            }
                        }
                    }
                }
            }
            return items;
        },
        /**
         * 
         * @param {Object} options
         * @param {Object} [options.evt] - Event data.
         * @param {external:module:jquery} [options.$el] - Target element.
         */
        showContextMenu: function(options) {
            var $dropdown = $("#nrm-contextmenu-btn"),
                $target = options.$el || $(options.evt.target),
                isContextMenu = (options.evt.type === "contextmenu"),
                menu = isContextMenu ? _.omit(this.contextmenu, "items") : _.omit(this.mapactions,"items"),
                tree = this.tree,
                items = isContextMenu ? [] : _.clone(this.mapActionsItems),
                $selNode = isContextMenu ? ($target.is("li") ? $target : $target.parentsUntil("ul", "li")) : tree.jstree("get_top_selected"),
                isSelection, selId;
            tree.jstree("deselect_all");
            tree.jstree("select_node", $selNode);
            isSelection = tree.jstree("get_selected").length > 0;
            // make sure the node selection wasn't cancelled...
            if (!this.contextmenu.items || !this.contextmenu.items.length) {
                options.cancel = true;
            } else {
                var html = DropdownTemplate(this.contextmenu),
                    selNode = tree.jstree("get_node", $selNode),
                    item;
                options.menu = $(html);
                if (selNode && isContextMenu)
                    options.$el = $selNode.children("a");
                if (isSelection) {
                    _.each(this.contextmenu.items, function(value, index) {
                        if ((value.nodeTypes === undefined || value.nodeTypes.indexOf(selNode.type) !== -1)
                                && (!value.ifHasChildren || selNode.children.length > 0)
                                && (!value.ifUrl || this.urlRegex.test(this.getNodeText(selNode)))
                            ) {
                            item = _.clone(value);
                            if (index === 0 && items.length > 0)
                                item.group = true;
                            selId = _.isString($selNode[0]) ? $selNode[0] : $selNode[0].id;
                            item.href = item.href + "/" + selId;
                            items.push(item);
                        }
                    }, this); 
                    // add business layer and feature context menu items (as in the navtree)
                    if (selNode.original.hasCustomContext) {
                        var layer = this.mapControl.map.getLayer(selNode.original.layerId || selNode.original.layerIds[0]),
                            selNodeContextItems = layer.nrmOptions.contextCallback(
                                _.extend(tree.jstree("get_json", selNode, {no_children: true}), selNode.original)
                            );
                        if (_.isArray(selNodeContextItems)) {
                            // remove duplicates
                            selNodeContextItems = _.filter(selNodeContextItems, function(it) {
                                if (!_.findWhere(items, {label: it.label})) {
                                    return it;
                                }
                            });
                            if (selNodeContextItems.length > 0) {
                                if (items.length > 0) {
                                    selNodeContextItems[0].group = true;
                                }
                                items.push.apply(items, selNodeContextItems);
                            }
                        }
                    }
                }
                options.items = items;
            }
            menu.items = items;
            if (!menu.items || !menu.items.length) {
                options.cancel = true;
            } else {
                var html = DropdownTemplate(menu);
                options.menu = $(html);
            }
            if (options.cancel) {
                $dropdown.nrmContextMenu("hideMenu");       
            } else {
                $dropdown.nrmContextMenu("showMenu", options); 
            }
        },
        // </editor-fold>
        /**
         * Extends Backbone View.remove
         */
        remove: function() {
            this.close();
            Backbone.View.prototype.remove.apply(this, arguments);
        },
        /**
         * Flash the node's geometry on the map.
         * @param {Object|string} node - jsTree node or node ID.
         * @param {number} count - Number of times to flash.
         */
        flashFeature: function(node, count) {
            if (!node.original) {
                node = this.tree.jstree("get_node", node);
            }
            if (node.original.geometry) {
                var geometry = geometryJsonUtils.fromJson(node.original.geometry),
                    symbol = this.mapControl.getGeometrySymbol(node.type.replace("clickPoint", "point"), "normal"),
                    graphic = new Graphic(geometry, symbol);
                this.mapControl.flashGraphic(graphic, 1);
            }
        },
        /**
         * Handles node selection event.
         * @param {Object|string} node - jsTree node or node ID.
         * @listens external:module:jstree~event:
         * @see {@link https://www.jstree.com/api/#/?q=select_node|jsTree select_node event}
         */
        onNodeSelected: function(event, data) {
            var node = data.node;
            this.flashFeature(data.node, 2);
            if (data.event && data.event.which === 13 && (node.id === "clickNode" || node.text === "Click on the map...")) {
                $(".nrm-map").focus();
            }
        },
        /**
         * Gets from the map layerIDs for layers that can participate in Identify.
         * @returns {string[]}
         */
        getMapLayerIds: function() {
            var map = this.mapControl.map, 
                layerIds = [], // _.difference(map.graphicsLayerIds, this.options.exclude),
                i, layer, layerId, 
                mapLayerIds = _.difference(map.layerIds, this.options.exclude);
            _.each(map.graphicsLayerIds, function(id){
                if (this.options.exclude.indexOf(id.trim()) === -1 ) {
                    layer = map.getLayer(id);
                    if (!layer.nrmOptions || this.options.exclude.indexOf(layer.nrmOptions.caption) === -1) {
                        layerIds.push(id);
                    }
                }
            }, this);
            for (i = mapLayerIds.length; i--;) {
                layerId = mapLayerIds[i];
                layer = map.getLayer(layerId);
                // layer.capabilities is undefined if the layer hasn't finished loading.
                if (!layer.url ||
                    layer.url && (layer.capabilities && layer.capabilities.indexOf("Query") !== -1 &&
                                  layer.nrmOptions && !layer.nrmOptions.tiled)
                    ) {
                    layerIds.push(layerId);
                }
            }
            return layerIds;
        },
        /** 
         * Layer configuration for constructing Identify tree.
         * @typedef {Object} LoadLayersResult
         * @property {Object} nodes - JSON defining tree nodes.
         * @see {@link https://www.jstree.com/docs/json/|jsTree JSON}
         * @property {string[]} newLayerIDs - Map layer IDs of layers not included in the nodes JSON.
         */
        /**
         * Define the tree nodes for all map layers.
         * @param {Object[]} headerNodes - Nodes to appear at the top of the tree.
         * @see {@link https://www.jstree.com/docs/json/|jsTree JSON}
         * @returns {module:nrm-map/views/mapIdentifyView~LoadLayersResult}
         */
        loadLayers: function(headerNodes) {
            var i, layerId, layerIds = this.getMapLayerIds(),
                layerDef, 
                nodes = this.treeJson ? [_.findWhere(this.treeJson,{id:"clickNode"})] : headerNodes || [],
                newLayerIds = [];
            this.mapControl.map.graphics.clear();
            for (i in layerIds) {
                layerId = layerIds[i];
                if (this.treeJson) {
                    var layerNodeId = this.getLayerNodeId(layerId);
                    layerDef = _.findWhere(this.treeJson, {id:layerNodeId});
                    if (layerDef && (layerDef.layerIds === undefined || (layerDef.layerIds && layerDef.layerIds.indexOf(layerId) > -1))) {
                        if (!_.findWhere(nodes, {id:layerNodeId})) {
                            nodes.push(layerDef);
                        }
                    } else {
                        newLayerIds.push(layerId);
                    }
                } else {
                    layerDef = this.defineLayer(layerId);
                    if (_.findWhere(nodes,{id: layerDef.id})) {
                        var def, j;
                        for (j in nodes) {
                            def = nodes[j];
                            if (def.id === layerDef.id) {
                                def.layerIds = _.union(def.layerIds, layerDef.layerIds);
                                break;
                            }
                        }
                    } else {
                        nodes.push(layerDef);
                    }
                }
            }
            this.treeJson = undefined;
            return {nodes: nodes, newLayerIds: newLayerIds};
        },
        /**
         * Construct a tree nodeID based on a map layerID. Collection layers will have the same nodeID.
         * @param {string|external:module:esri/map~layer} input - Layer ID or Layer.
         * @see {@link https://developers.arcgis.com/javascript/jsapi/layer-amd.html|ArcGIS JSAPI Layer}
         * @returns {string}
         */
        getLayerNodeId: function(input) {
            var layerId = _.isString(input) ? input : input.id,
                layer = _.isString(input) ? this.mapControl.map.getLayer(layerId) : input,
                nodeId;
            if (layer.url) {
                nodeId = layer.id;
            } else {
                if (layer.nrmOptions && layer.nrmOptions.caption) {
                    nodeId = layer.nrmOptions.caption.trim();
                } else {
                    nodeId = layer.id.trim();
                }
            }
            return nodeId;
        },
        /**
         * Return the map layerIDs associated with a tree node.
         * @param {Object |string} node - jsTree node or node ID.
         * @returns {string[]}
         */
        getNodeLayerIds: function(node) {
            node = _.isString(node) ? this.tree.jstree("get_node", node) : node;
            return node.original.layerIds;
        },
        /**
         * Definition of a tree node, with custom attributes.
         * @typedef {Object} NodeDefinition
         * @property {string} id - Node ID.
         * @property {string[]} layerIds - Associated map layers.
         * @property {boolean} hasCustomContext - Indicates whether the node has a context callback function.
         * @property {string} text - Node's caption.
         * @property {Object} state - Initial rendering of node.
         * @see {@link https://www.jstree.com/docs/json/|jsTree JSON}
         * @property {string} children - Caption of initial child.
         */
         /**
          * Get the definition of a node based on a layer
          * @param {string} layerId - Layer ID.
          * @returns {module:nrm-map/views/mapIdentifyView~NodeDefinition}
          */
        defineLayer: function(layerId) {
            var map = this.mapControl.map,
                layer = map.getLayer(layerId),
                caption = (layer.nrmOptions && layer.nrmOptions.caption) ? layer.nrmOptions.caption.trim() : layerId.trim(),
                nodeId = this.getLayerNodeId(layer);
                if (layer.disableMouseEvents) {
                    layer.disableMouseEvents();
                }
                return {id: nodeId, 
                        layerIds: [layerId], 
                        hasCustomContext: (layer.nrmOptions && layer.nrmOptions.contextCallback) ? true : false,
                        text: caption, 
                        state: {opened: layer.visible}, 
                        children: ['Click on the map...']
                        };
        },
        /**
         * Handler for map event that fires when a layer is added.
         * @param {external:module:esri/map~event:layer-add-result} evt - Map event layer-add-result.
         * @see {@link https://developers.arcgis.com/javascript/jsapi/map-amd.html#event-layer-add-result|ArcGIS JSAPI Map layer-add-result event}
         * @listens external:module:esri/map~event:layer-add-result
         */
        onLayerAdded: function(evt) {
            if (this.options.exclude.indexOf(evt.layer.id.trim()) === -1 && 
                    (!evt.layer.nrmOptions || this.options.exclude.indexOf(evt.layer.nrmOptions.caption.trim()) === -1)) {
                this.loadLayer(evt.layer.id);
            }
        },
        /**
         * Add a node to the tree based on a layer, then execute identifyNode.
         * @param {string} layerId - Layer ID.
         */
        loadLayer: function(layerId) {
            var layerDef = this.defineLayer(layerId),
                nodeId = layerDef.id,
                node = this.tree.jstree("get_node", nodeId),
                layerIds = this.getMapLayerIds();
            if (node) {
                node.original.layerIds = _.union(node.original.layerIds, layerDef.layerIds);
            } else {
                // get this layer's position in map layers
                // if it's the top, put under clickpoint
                // if it's the bottom, put it on the bottom
                // else use the position of the layer beneath it
                var pos, thisPos = layerIds.indexOf(layerId);
                if (thisPos === 0) {
                    pos = 1; // because the top is the click point
                } else if (thisPos === layerIds.length - 1) {
                    pos = "last";
                } else {
                    var nodeIds = _.map(this.tree.jstree("get_json", this.tree), function(val){return(val.id);});
                    pos = nodeIds.indexOf(this.getLayerNodeId(layerIds[thisPos + 1]));
                }
                this.tree.jstree("create_node", "#", layerDef, pos);
                node = this.tree.jstree("get_node", nodeId);
            }
            this.identifyNode(node);
        },
       /**
        * Render the tree and attach tree event listeners.
        */
       renderTree: function() {
            var treeDiv = $('#' + this.treeId), 
                self = this,
                headerNodes = [{id: 'clickNode', text: "Map Point", type: "clickPoint", state: {opened: false}, 
                        children: [
                            {id: "clickLatitude", text: "Latitude:", icon: false},
                            {id: "clickLongitude", text: "Longitude:", icon: false}
                        ]}],
                loadLayersResult = this.loadLayers(headerNodes),
                nodes = loadLayersResult.nodes,
                newLayerIds = loadLayersResult.newLayerIds;
            if (!treeDiv || treeDiv.length === 0)
                return;
            this.tree = treeDiv.jstree($.extend({}, this.treeOptions, {
                "core": $.extend({}, this.treeOptions.core, {
                    "check_callback" : true,
                    "multiple": false,
                    "data": nodes
                }),
                "types": this.nodeTypes,
                "plugins": _.union(["types"], this.treeOptions.plugins || [])
            })).on("open_node.jstree", function (event, data) {
                self.identifyNode(data.node);
            }).on("select_node.jstree", function (event, data) {
                self.onNodeSelected(event, data);
            }).one("loaded.jstree", function(){
                for (var i in newLayerIds) {
                    self.loadLayer(newLayerIds[i]);
                }
                $("#map-identify-results-div", this.$el).focus();
            });
        },
        /**
         * Overrides Backbone.View.close.
         * Detaches listeners and stores the JSON definition of the current tree.
         * @override
         */
        close: function() {
            var map = this.mapControl.map, i, layer, layerIds = this.getMapLayerIds(), self = this;
            this.treeJson = this.tree && this.tree.jstree("get_json", this.tree);
            function processChildren(nodeJson) {
                var id = nodeJson.id, node = self.tree.jstree("get_node", id);
                _.each(_.omit(node.original, "state"), function(val, key){
                    nodeJson[key] = (key === "text" && node.original.attValue) ? node.text : val;
                });
                _.each(nodeJson.children, function(childNodeJson) {
                    processChildren(childNodeJson);
                });
            };
            _.each(this.treeJson, function(val){
                processChildren(val);
            });
            if (this.treeJson.length === 0 || !_.findWhere(this.treeJson,{type:"clickPoint"})) {
                // something went wrong reading the tree and it doesn't have the correct first node
                this.treeJson = undefined;
            }
            Nrm.app.mapView.resetCursor();
            map.graphics.clear();
            for (i in layerIds) {
                layer = map.getLayer(layerIds[i]);
                if (layer.enableMouseEvents) {
                    layer.enableMouseEvents();
                }
            }
            this.closed = true; // prevents accidental startListening while closed
        },
        /**
         * Overrides Backbone.View.render.
         * @returns {module:nrm-map/views/mapIdentifyView}
         * @override
         */
        render: function() {
            var declaredHandlers = Nrm.app.mapView.selectionHandlersDeclared;
            if (!declaredHandlers || declaredHandlers.length === 0) {
                Nrm.app.mapView._deactivateEditMode();
            }
            this.closed = false; // enables startListening
            this.setElement(this.options.$el);
            this.$el.html(TabContentTemplate);
            this.startListening();
            if (!this.isListening) {
                this.setMessage("pause");
            }
            return this;
        },
        /**
         * Display informational text.
         * @param {string} message
         */
        setMessage: function(message) {
            var txt;
            switch (message) {
                case "default":
                    txt = "<p>Click on map to view information about a location.</p>";
                    break;
                case "pause":
                    if (this.options.tabbed) {
                        txt = "<p>Identify is paused for other map activity. Click the Identify tab again to reactivate.</p>";
                    } else {
                        txt = "<p>Identify is paused for other map activity.</p>";
                    }
                    break;
                case "":
                case undefined:
                    txt = "";
                    break;
                default:
                    txt = "<p>" + message + "</p>";
            }
            $("#map-identify-info-div").html(txt);
        },
        /**
         * Called after initial view rendering to add the view to the DOM and restore saved tree (if any).
         */
        renderView: function() {
            this.$el.html(TabContentTemplate(this.options));
            if (this.treeJson) {
                this.setMessage(); // clear instructional text
            }
            this.renderTree();
            if (!this.clickPointSymbol) {
                this.clickPointSymbol = new PictureMarkerSymbol({
                    angle: 0,
                    height: 25,
                    type: "esriPMS",
                    url: this.nodeTypes.clickPoint.marker,
                    width: 15,
                    xoffset: 0,
                    yoffset: 11
                });
                this.clickPointSymbol.setColor(new Color("#a94442"));
            }
            if (this.isListening) {
                this.drawPoint();
            } else {
                this.setMessage("pause");
            }
         this.$el.addClass("nrm-help-provider").attr("data-nrm-help-context", this.options.helpContext);
         return;
        }
    });
});