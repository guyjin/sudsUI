/**
 * @file The MapTocView is a {@link http://backbonejs.org/#View|Backbone.View} that displays a list of the layers in 
 * the map.
 * @see module:nrm-map/views/mapTocView
 */
/** 
 * @module nrm-map/views/mapTocView
 * 
 */

define([
    'nrm-ui', 
    'jquery', 
    'underscore', 
    'backbone', 
    'hbs!dropdown',
    'nrm-ui/plugins/nrmContextMenu', 
    'dojo/_base/connect',
    "dijit/registry", 
    "dojo/parser", 
    "nrm-map/dijit/TOC", 
    "dojo/domReady!" // dojo/domReady! should always be the last dependency
  ], function(
          Nrm, 
          $, 
          _, 
          Backbone, 
          dropdownTemplate, 
          NRMContextMenu, 
          connect, 
          registry, 
          parser, 
          TOC,
          domReady
    ) {
    return Nrm.Views.MapTocView = Backbone.View.extend(/**@lends module:nrm-map/views/mapTocView.prototype*/{

        /**
         * Create a new instance of the MapTocView.  
         * @constructor
         * @alias module:nrm-map/views/mapTocView
         * @classdesc
         *   A Backbone view for editing Feature Level Metadata (FLM).
         * @param {Object} options 
         * @param {module:nrm-map/Map} options.mapControl The map control.
         * @param {string} options.accordionId The id of the parent accordion group.
         * @param {string} [options.tocId="mapTocControl"] The id for the map TOC element.
         * @param {Boolean} [options.tocExpanded=true] Indicates if the accordion panel should be expanded initially
         * @param {string} [options.helpContext="893"] Context-sensitive help context
         * @param {Object<string,Function>} [options.tocMenuEvents] Event handlers to delegate on click events in the
         * actions menu. Keys are element selectors, values are the handler functions.
         * @see {@link http://backbonejs.org/#View-constructor|Backbone View constructor / initialize}
         */
        initialize: function(options) {
            /**
             * Initialization options.
             * @type {Object}
             */
            this.options = $.extend({ }, this.defaultOptions, options);
            /**
             * The map control.
             * @type {module:nrm-map/Map}
             */
            this.mapControl = this.options.mapControl;
            
            var mapMenuTitle = "Context menu for Map";
            var mapMenuId = "map-default-actions";
            var mapEvents = { };
            // TODO: consider supporting custom layer context menu items
            /**
             * Configuration for the layer context menu.
             * @type {module:nrm-ui/views/contextView~ContextMenuConfig}
             */
            this.layercontextmenu = { 
                id: mapMenuId,
                title: mapMenuTitle,
                clickEvents: mapEvents,
                items: [
                   {
                    "id" : "map-layer-remove",
                    "label" : "Remove layer",
                    "href" : "#removeLayer",
                    "className" : "nrm-route-action",
                    "disableWhenRequired" : true
                   },
    //                   {
    //                    "id" : "map-layer-movetop",
    //                    "label" : "Move to Top",
    //                    "href" : "#reorderLayerTop",
    //                    "group" : true,
    //                    "className" : "nrm-route-action"
    //                   },
                   {
                    "id" : "map-layer-moveup",
                    "label" : "Move Up",
                    "group" : true,
                    "href" : "#reorderLayerUp",
                    "className" : "nrm-route-action"
                   },
                   {
                    "id" : "map-layer-movedown",
                    "label" : "Move Down",
                    "href" : "#reorderLayerDown",
                    //"title" : "Cannot be moved beyond \nthe group of feature layers",
                    "className": "nrm-route-action"
                   }
    //                   ,{
    //                    "id" : "map-layer-movebottom",
    //                    "label" : "Move to Bottom",
    //                    "href" : "#reorderLayerBottom",
    //                    "className": "nrm-route-action"
    //                   }
    //                   ,{
    //                    "id" : "map-layer-about",
    //                    "label" : "About layer",
    //                    "href" : "#aboutLayer",
    //                    "group": true,
    //                    "className": "nrm-route-action"
    //                   }
                ]
            };
            /**
             * Selected TOC element id, or false if there is no selection.
             * @type {string|Boolean}
             */
            this.tocSelectedID = false;
            /**
             * Selected layer id, or false if there is no selection.
             * @type {string|Boolean}
             */
            this.tocSelectedLayerID = false;
            /**
             * TOC container element id.
             * @type {string}
             */
            this.tocId = this.options.tocId;
            /**
             * Accordion panel configuration.
             * @type {module:nrm-ui/views/contextView~AccordionPanelConfig}
             */
            var content = '<div id="' + this.tocId + '" class="nrm-help-provider" data-nrm-help-context="' 
                    + this.options.helpContext + '" ></div>';
            this.$el.append(content);
        },
        /**
         * Default options
         * @type {Object}
         */
        defaultOptions: {
            tocExpanded: true,
            helpContext: "893",
            tocId: "mapTocControl"
        },
        /**
         * Default menu click events
         * @type {Object.<string,Function>}
         */
        defaultMapEvents: {},
        /**
         * Default menu items
         * @deprecated Not currently used, items are defined in the constructor since we are not anticipating
         * that applications will extend this view.
         */
        defaultMapActions: [ /*{
            "id" : "nrmtree-default-noaction",
            "label" : "No node selected",
            "href" : "#"
        }*/],
        /**
         * Events hash.
         * @type {Object}
         * @see {@link http://backbonejs.org/#View-events|Backbone.View#events}
         */
        events: {
            // could set this on the .agsjsTOCNode class, but it puts the menu in odd locations
            "contextmenu .agsjsTOCRootLayerLabel": "onMapContextMenu",
            "click .agsjsTOCNode": "tocSelect",
            "keydown .agsjsTOCRootLayerLabel": "tocKeyHandler"
        },
        /**
         * Start listening to global events.
         * @returns {undefined}
         */
        startListening: function() {
            this.listenTo(Nrm.event, {
                "map:removeLayer": this.removeLayer,
                "map:reorderLayerTop": this.reorderLayerTop,
                "map:reorderLayerUp": this.reorderLayerUp,
                "map:reorderLayerBottom": this.reorderLayerBottom,
                "map:reorderLayerDown": this.reorderLayerDown,
                "map:reorderLayer": this.reorderLayer 
            });
        },
        /**
         * Render the view
         * @returns {module:nrm-ui/views/mapTocView}
         * Returns this instance to allow chaining.
         * @see {@link http://backbonejs.org/#View-render|Backbone.View#render}
         */
        render: function() {
            this.setElement(this.options.$el);
            this.startListening();
            this.renderTOC();
            return this;
        },
                
        renderView: function() {
            this.renderTOC(true);
        },

        // <editor-fold desc="map context menu events">
        /**
         * Handles context menu event.
         * @param {Event} e Event data
         * @returns {undefined}
         */
        onMapContextMenu: function(e) {
            if (this.layercontextmenu) {
                this.tocSelect(e);
                e.preventDefault();            
                var evt = { "evt" : e};
                //$("#nrm-contextmenu-btn").nrmContextMenu("hideMenu");
                this.showMapContextMenu(evt);
                if (!evt.cancel) {
                    e.stopPropagation();
                }
            }
        },
        /**
         * Return an array of menu item definitions specific to the selected layer.
         * @param {Object} options
         * @param {String} [options.tocID] ID of the selected TOC element. Defaults to this.tocSelectedID.
         * @returns {Object[]}
         */
        contextItems: function(options) {
            var items = [];
            if ($('#' + this.tocSelectedID).length > 0) {
                var it, item,
                    tocID = this.tocSelectedID,
                    layer = this.getLayerByTocID(tocID);
                for (var i = 0; i < this.layercontextmenu.items.length; i++) {
                    item = this.layercontextmenu.items[i];
                    it = _.omit(item,'href','disableWhenRequired');
                    if (i === 0 && items.length > 0)
                        it.group = true;
                    it.href = item.href + '/' + tocID; //$target.context.id; 
                    if (item.disableWhenRequired && layer && layer.nrmOptions && layer.nrmOptions.required) {
                        it.className += ' disabled';
                        it.title = 'This layer is required by the \napplication and cannot be removed.';
                    }
                    // disable unusable move commands
                    else if (item.href === '#reorderLayerUp' && this.layerOrder(layer).isTop) {
                        it.className += ' disabled';
                        it.title = 'Cannot move layer beyond the top of the \ngroup of ' + ((layer.url) ? 'web service' : 'feature') + ' layers';
                    }
                    else if (item.href === '#reorderLayerDown' && this.layerOrder(layer).isBottom) {
                        it.className += ' disabled';
                        it.title = 'Cannot move layer beyond the bottom of the \ngroup of ' + ((layer.url) ? 'web service' : 'feature') + ' layers';
                    }
                    items.push(it);
                }
            }
            return items;
        },
        /**
         * Show the context menu, either from right-click or Actions button dropdown
         * @param {Object} options
         * @param {external:module:jquery} [options.$el] Target of the event
         * @param {Event} [options.evt] Event data (either this or the $el option is required).
         * @returns {undefined}
         */
        showMapContextMenu: function(options) {
            Nrm.app.triggerEvent("app:setHelpContext", this.options.helpContext);
            var $dropdown = $("#nrm-contextmenu-btn"),
                $target = options.$el ? options.$el : $(options.evt.target),
                isContextMenu = (options.evt.type === "contextmenu"),
                menu = (isContextMenu) ? _.omit(this.layercontextmenu, "items") : _.omit(this.mapactions,"items"),
                items = (isContextMenu) ? [] : _.clone(this.mapActionsItems),
                tocID = (isContextMenu) ? $target.context.id : this.tocSelectedID;
            if (tocID) {
                var contextItems = this.contextItems();
                if (contextItems.length > 0) {
                    contextItems[0].group = !isContextMenu;
                    items = items.concat(contextItems);
                }
            }
            menu.items = items;
            if (!menu.items || !menu.items.length) {
                options.cancel = true;
            } else {
                var html = dropdownTemplate(menu);
                //var template = Handlebars.templates["dropdown"];
                //var html = template(menu);
                options.menu = $(html);
                options.clickEvents = this.layercontextmenu.clickEvents;
            }
            if (options.cancel) {
                $dropdown.nrmContextMenu("hideMenu");       
            } else {
                $dropdown.nrmContextMenu("showMenu", options); 
            }
        },
        /**
         * TOC node selection event handler, called from click, keyboard or contextmenu event.
         * @param {Event} e Event data
         * @returns {undefined}
         */
        tocSelect: function(e){
            var tocNode = $(e.currentTarget).closest('.agsjsTOCNode'), $el = tocNode.parent();
            if ($el.closest('.agsjsTOCNode').length) {
                // This is a nested TOC node, the event will be handled when it bubbles up.
                // Not using stopPropagation here so that it doesn't interfere with document-level click handlers.
                return;
            }
            var idbase = $el.attr('id'), 
                toBeHandled = (e.type === 'contextmenu' || e.target.type === 'checkbox' || e.target.outerHTML.toLowerCase().indexOf('slider') > -1);
            if (idbase) {
                if (this.tocSelectedID) {
                    if (this.tocSelectedID === idbase && toBeHandled) 
                        return;
                    $('#' + this.tocSelectedID).removeClass('tocSelected');
                    if (this.tocSelectedID === idbase) {
                        this.tocSelectedID = false;
                        this.tocSelectedLayerID = false;
                        /**
                         * Selection changed in the {@link module:nrm-map/views/mapTocView|MapTocView}
                         * @event module:nrm-ui/event#map:tocSelectionChanged
                         * @param {string} selected layer id
                         */
                        Nrm.event.trigger("map:tocSelectionChanged", this.tocSelectedLayerID);
                        return;
                    }
                }
                this.tocSelectedID = idbase;
                this.tocSelectedLayerID = this.getLayerByTocID(this.tocSelectedID).id;
                $el.addClass('tocSelected');
                Nrm.event.trigger("map:tocSelectionChanged", this.tocSelectedLayerID);
            } else {
                console.warn('contextView.tocSelect could not find parent toc element');
            }
        },
        /**
         * Refresh the selection state after loading the TOC widget
         * @returns {undefined}
         */
        onRefresh: function() {
            if (this.tocSelectedLayerID) {
                var id = this.getTocIDByLayerID(this.tocSelectedLayerID);
                if (id) {
                    this.tocSelectedID = id;
                    var el = $('#' + this.tocSelectedID).addClass('tocSelected');
                    if (this.tocFocusedLayerID === this.tocSelectedLayerID) {
                        el = $('.agsjsTOCRootLayerLabel', el);
                        el.focus();
                        this.tocFocusedLayerID = false;
                    }
                }
            }    
        },
        /**
         * Handles space, enter, up and down key events triggered on TOC nodes.
         * @param {Event} e Event data
         * @returns {undefined}
         */
        tocKeyHandler: function(e) {
            switch (e.keyCode) {
                case 32: // space
                case 13: // enter
                    e.preventDefault();
                    this.tocSelect(e);
                    break;
                case 38: // up arrow
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.target.id.indexOf(this.tocSelectedID) > -1) {
                        /**
                         * Reorder a layer in the {@link nrm-map/views/mapTocView|MapTocView}.
                         * @event module:nrm-ui/event#map:reorderLayer
                         * @param {Object} options
                         * @param {string} options.direction Expected values: "bottom", "top", "up" or "down"
                         * @param {string} options.id TOC element id
                         */
                        Nrm.app.triggerEvent("map:reorderLayer", { direction: "up", id: e.target.id });
                    }
                    break;
                case 40: // down arrow
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.target.id.indexOf(this.tocSelectedID) > -1) {
                        Nrm.app.triggerEvent("map:reorderLayer", { direction: "down", id: e.target.id });
                    }
                    break;
            }
        },
        // </editor-fold>
        /**
         * Overrides {@link http://backbonejs.org/#View-remove|Backbone.View#remove} to destroy the TOC widget.
         * @returns {undefined}
         */
        remove: function() {
           Backbone.View.prototype.remove.apply(this, arguments);
           this._destroyTOC();
        },
        /**
         * Destroy the TOC widget.
         * @returns {undefined}
         */
        _destroyTOC: function() {
            if (this.tocHandlers) {
                _.each(this.tocHandlers, function(handler) {
                    handler.remove();
                });
            }
            this.tocHandlers = [];
            if (this.toc) {
                this.toc.destroyRecursive();
            }
            this.toc = null;
            this.tocLoading = false;
        },
        /**
         * Render the TOC widget.
         * @param {Boolean} [reload=false] Force reload
         * @returns {undefined}
         */
        renderTOC: function(reload) {
            var mapControl = this.mapControl,
                map = mapControl.map;
            if (!map.loaded) {
                map.on("load", _.bind(this.renderTOC, this));
                return;
            }
            if (reload && this.toc) {
                this._destroyTOC();
            }
            if (!this.options.tocExpanded) {
                this.options.tocExpanded = true;
                return;
            } else if (this.tocLoading) {
                return;
            }
            var dynamicLayers = mapControl.mapSupport.dynamicMapLayers;
            function getLayerInfos(map) {
                var layerInfos = [];
                var processLayer = function(layerId) {
                    if (layerId === "nrmGraphicsLayer") return;
                    var lyr = map.getLayer(layerId);
                    // check for feature layer created in setDynamicMapLayer for selectable layer
                    if (lyr.nrmOptions && lyr.nrmOptions.featureLayer === lyr && !lyr.nrmOptions.offline &&
                            _.indexOf(dynamicLayers, lyr) === -1) return;
                    var caption = lyr.nrmOptions && lyr.nrmOptions.caption;
                    layerInfos.unshift({
                        slider: true,
                        layer: lyr,
                        title: caption || layerId,
                        collapsed: !lyr.visible
                    });
                };
                _.each(map.layerIds, processLayer);
                _.each(map.graphicsLayerIds, processLayer);
                return layerInfos;
            }
            if (!this.toc) {
                /**
                 * Internal list of event handlers that need to be removed when the TOC is destroyed.
                 * @type {Array}
                 */
                this.tocHandlers = [];
                /**
                 * Indicates that the TOC widget is currently loading.
                 * @type {Boolean}
                 */
                this.tocLoading = true;
                // call the parser to create the dijit layout dijits
                parser.parse(); // note djConfig.parseOnLoad = false;

                if (registry.byId(this.tocId)) registry.remove(this.tocId);
                /**
                 * The TOC widget. 
                 * @name module:nrm-map/views/mapTocView#toc  
                 * @type {module:nrm-map/dijit/TOC}
                 */
                var toc = this.toc = new TOC({
                        map: map,
                        layerInfos: getLayerInfos(map)
                }, this.tocId);
                toc.startup();
                this.tocHandlers.push(toc.on('load', _.bind(function () {
                    //console.info("TOC LOADED");
                    // Refresh?
                    this.tocLoading = false;
                    // Note: it would be ideal to move this to event delegation at the view element, 
                    //       but the widget _onClick doesn't handle legend node clicks properly.
                    // attach legend checkbox handlers, but make sure we do it only once
                    var events, self = this;
                    $('.agsjsTOCLegendCheckbox').each (function() {
                        events = $._data(this, "events");
                        if (events === undefined || events.length === 0) {
                            $(this).on('click',function(event){
                                event.stopPropagation(); // prevents the TOC widget from fumbling this event.
                                self.toggleLegendElement(this);
                            });
                        }
                    });
                    this.onRefresh();
                    /**
                     * Triggered after loading the TOC widget in the {@link module:nrm-map/views/mapTocView|MapTocView}.
                     * @event module:nrm-ui/event#map:tocLoaded
                     */
                    Nrm.event.trigger('map:tocLoaded');
                }, this)));	
                this.tocHandlers.push(map.on('layer-add-result', function (evt) {
                    toc.layerInfos = getLayerInfos(map);
                    toc.refresh();
                }));

                this.tocHandlers.push(map.on('layers-reordered', _.bind(function (evt) {
                    var focused = $(".agsjsTOCRootLayerLabel:focus", this.$el),
                       layer = focused.length && this.getLayerByTocID(focused.attr("id"));
                    /**
                     * Focused layer ID, to restore focus after moving a layer, set to false if we don't need to 
                     * maintain focus
                     * @type {string|Boolean}
                     */
                    this.tocFocusedLayerID = (layer && layer.id) || false;
                    toc.layerInfos = getLayerInfos(map);
                    toc.refresh();
                }, this)));
            } else {
                toc.layerInfos = getLayerInfos(map);
                this.toc.refresh();
            }

        },
        /**
         * Remove a layer
         * @param {string} data TOC element id for the layer to remove
         * @returns {undefined}
         */
        removeLayer: function(data) {
            var layer = this.getLayerByTocID(data);
            if (layer) {
                //this.mapControl.map.removeLayer(layer);
                this.mapControl.removeDynamicMapLayer(layer);
            }
        },
        /**
         * Get the root ID for a TOC node
         * @param {string} childID ID of the child element
         * @returns {string}
         * The TOC node id.
         */
        tocLayerID: function(childID){
            var idparts = childID.split('-');
            return (idparts.length === 1) ? idparts[0] : idparts[1];
        },
        /**
         * Get the TOC node id for a layer id.
         * @param {string} layerID Layer id
         * @returns {string}
         * The TOC node id.
         */
        getTocIDByLayerID: function(layerID){
            var tocLayerID;
            for (var i = 0; i < this.toc._rootLayerTOCs.length; i++) {
                if (layerID === this.toc._rootLayerTOCs[i].rootLayer.id) {
                    tocLayerID = this.toc._rootLayerTOCs[i].id;
                    break;
                }
            }
            return tocLayerID;
        },
        /**
         * Get a layer from the TOC element id
         * @param {string} id The TOC element id
         * @returns {external:module:esri/layers/Layer}
         * The root layer associated with the TOC node.
         */
        getLayerByTocID: function(id){
            var layer, tocNode, idbase = this.tocLayerID(id);
            for (var i = 0; i < this.toc._rootLayerTOCs.length; i++) {
                tocNode = this.toc._rootLayerTOCs[i];
                if (tocNode.id === idbase) {
                    layer = tocNode.rootLayer;
                    break;
                }
            }
            return layer;
        },
        /***
         * Toggles display of a particular class in a unique value renderer
         * @param {HTMLElement} el A DOM element representing a checkbox in a TOC
         * @returns {undefined}
         */
        toggleLegendElement: function(el) {
            var id = this.tocLayerID(el.id),
                layer = this.getLayerByTocID(id),
                renderer = layer.renderer,
                label = el.title.replace('Toggle visibility for ', ''),
                transparency, // = el.checked ? 1 : 0,
                info, symbol;
            for (var i = 0; i < renderer.infos.length; i++) {
                info = renderer.infos[i];
                transparency = el.checked ? (info.initialColor ? info.initialColor.a : 1) : 0;
                if (info.label === label) {
                    symbol = info.symbol;
                    symbol.color.a = transparency;
                    if (symbol.outline)
                        symbol.outline.color.a = transparency ? 1 : 0;  //transparency;
                    layer.redraw();
                    break;
                }
            }
        },
        /**
         * Object representing order of a layer.
         * @typedef LayerOrder
         * @property {Number} pos Index of the layer, or -1 if it was not found
         * @property {Boolean} isBottom It is the bottom layer
         * @property {Boolean} isTop It is the top layer.
         */
        /***
         * Returns the order of a layer in the map
         * @param {external:module:esri/layers/Layer} layer layer in a map
         * @return {module:nrm-map/views/mapTocView~LayerOrder} order of the layer in the map; position: -1 means 
         * something went wrong
         */
        layerOrder: function(layer) {
            var map = this.mapControl.map,
                layerids = (layer.url) ? map.layerIds : _.without(map.graphicsLayerIds, "nrmGraphicsLayer"),// _.initial(map.graphicsLayerIds);
                pos = layerids.indexOf(layer.id),
                retval = {
                    position: pos,
                    isBottom: (pos === 0),
                    isTop: (pos === layerids.length - 1)
                };
            return retval;
        },
        /**
         * Reorder a layer
         * @param {Object} options
         * @param {string} options.direction Expected values: "bottom", "top", "up" or "down"
         * @param {string} options.id TOC element id
         * @returns {undefined}
         */
        reorderLayer: function(options) {
            var newPosition = -1, layer = this.getLayerByTocID(options.id);
            //console.log("reorderLayer " + options.direction + " "  + options.id + ' ' + layer.id, options);
            switch (options.direction){
                case "bottom":
                    newPosition = 0;
                    break;
                case "top":
                    newPosition = this.mapControl.map._layerSize;
                    break;
                case "up":
                    newPosition = this.layerOrder(layer).position;
                    if (newPosition > -1) newPosition += 1;
                    break;
                case "down":
                    newPosition = this.layerOrder(layer).position;
                    if (newPosition > -1) newPosition -= 1;
                    break;
            }
            if (newPosition > -1) {
                this.mapControl.map.reorderLayer(layer, newPosition);
            }
        },
        /**
         * Move a layer up.
         * @param {string} id TOC element id
         * @returns {undefined}
         */
        reorderLayerUp: function(id) {
            this.reorderLayer({direction: "up", id: id});
        },
        /**
         * Move a layer to the top
         * @param {string} id TOC element id
         * @returns {undefined}
         */
        reorderLayerTop: function(id) {
            this.reorderLayer({direction: "top", id: id});
        },
        /**
         * Move a layer down.
         * @param {string} id TOC element id
         * @returns {undefined}
         */
        reorderLayerDown: function(id) {
            this.reorderLayer({direction: "down", id: id});
        },
        /**
         * Move a layer to the bottom.
         * @param {string} id TOC element id
         * @returns {undefined}
         */
        reorderLayerBottom: function(id) {
            this.reorderLayer({direction: "bottom", id: id});
        }
    });
});