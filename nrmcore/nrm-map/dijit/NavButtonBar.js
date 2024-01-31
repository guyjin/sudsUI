/**
 * @file NRM Map Button Bar
 * @see module:nrm-map/dijit/NavButtonBar
 */
/** 
 * @module nrm-map/dijit/NavButtonBar
 * 
 */

define([
    'nrm-ui',
    "underscore",
    "dojo/Evented",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/has", // feature detection
    "esri/kernel", // esri namespace
    "esri/toolbars/navigation",
    "dijit/_WidgetBase",
    "dijit/a11yclick", // Custom press, release, and click synthetic events which trigger on a left mouse click, touch, or space/enter keyup.
    "dijit/_TemplatedMixin",
    "dojo/on",
    "dojo/text!./templates/NavButtonBar.html", // template html
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/dom-style"
],
function (
    Nrm,
    _,
    Evented,
    declare,
    lang,
    has, 
    esriNS,
    Navigation,
    _WidgetBase, 
    a11yclick, 
    _TemplatedMixin,
    on,
    dijitTemplate, 
    domAttr,
    domClass, 
    domStyle
) {
    var Widget = declare("esri.dijit.NavButtonBar", [_WidgetBase, _TemplatedMixin, Evented], {
        
        // template HTML
        templateString: dijitTemplate,
        
        // default options
        options: {
            theme: "MapButtonBar", // The class assigned to the widget's containing DIV. Referenced in the CSS
            map: null,
            visible: true
        },
        
        // lifecycle: 1
        constructor: function(options, srcRefNode) {
            // mix in settings and defaults
            this.options.cursors = {
                pan: "url(" + require.toUrl("nrm-ui/img/pan-cursor.cur") + "),move",
                select: "url(" + require.toUrl("nrm-ui/img/select-cursor.cur") + "),auto"
            };
            var defaults = this.options = lang.mixin({}, this.options, options);
            // widget node
            this.domNode = srcRefNode;
            // store localized strings
            // properties
            this.set("map", defaults.map);
            this.set("navToolbar", new Navigation(this.map));
            this.set("theme", defaults.theme);
            this.set("visible", defaults.visible);
            // listeners
            this.watch("theme", this._updateThemeWatch);
            this.watch("visible", this._visible);
            // classes
            this._css = { 
                container: "buttonBarContainer",
                previous: "btn btn-default btn-xs previous fa fa-arrow-left disabled",
                next: "btn btn-default btn-xs next fa fa-arrow-right",
                panmode: "btn btn-default btn-xs pan active", //fa fa-hand-paper-o
                selectmode: "btn btn-default btn-xs selectmode",
                zoomin: "btn btn-default btn-xs zoomin fa fa-plus",
                zoomout: "btn btn-default btn-xs zoomout fa fa-minus"
            }; // LW: This is available to the template (NavButtonBar.html)
        },
        // bind listener for button to action
        // LW: This connects the listener to the actual button
        postCreate: function() {
            this.inherited(arguments);
            this.buttonList = {
                previous: {node: this._previousNode},
                next: {node: this._nextNode},
                // Used Visual Studio image editor to create cursors with hotspots
                // Source: http://fa2png.io/ (fa-hand-paper-o), 24 pixel, resized to 16 pixels in gimp
                panmode: {node: this._panmodeNode, cursor: this.options.cursors.pan},
                // Source: http://resources.esri.com/help/9.3/ArcGISEngine/dotnet/bitmaps/3e621b30-8438-4f62-b69a-6d45ef5a54aa170.png
                selectmode: {node: this._selectmodeNode, cursor: this.options.cursors.select},
                zoomin: {node: this._zoominNode},
                zoomout: {node: this._zoomoutNode}
            };
            this.own(on(this._previousNode, a11yclick, lang.hitch(this, this.previousHandler)));
            this.own(on(this._nextNode, a11yclick, lang.hitch(this, this.nextHandler)));
            this.own(on(this._panmodeNode, a11yclick, lang.hitch(this, this.panmodeHandler)));
            this.own(on(this._selectmodeNode, a11yclick, lang.hitch(this, this.selectmodeHandler)));
            this.own(on(this._zoominNode, a11yclick, lang.hitch(this, this.zoominHandler)));
            this.own(on(this._zoomoutNode, a11yclick, lang.hitch(this, this.zoomoutHandler)));
            this.modeNodes = [this._panmodeNode, this._selectmodeNode];
            this.setModeButton(this._panmodeNode);
        },
        // start widget. called by user
        startup: function() {
            // map not defined
            if (!this.map) {
                this.destroy();
                console.warn('NavButtonBar::map required');
            }
            // when map is loaded
            if (this.map.loaded) {
                this._init();
            } else {
                on.once(this.map, "load", lang.hitch(this, function() {
                    this._init();
                }));
            }
            Nrm.event.on("map:endDraw", lang.hitch(this, this.endDrawHandler));
            this.navToolbar.on("extent-history-change", lang.hitch(this, this.extentHistoryChangeHandler));
            this.map.on("zoom-end", lang.hitch(this, this.zoomEndHandler));
        },
        // connections/subscriptions will be cleaned up during the destroy() lifecycle phase
        destroy: function() {
            this.inherited(arguments);
        },
        /* ---------------- */
        /* Public Events */
        /* ---------------- */
        // load
        /* ---------------- */
        /* Public Functions */
        
        /**
         * Style button based on "mode" (for sticky behaviors like selection and pan).
         * May cause other buttons to change style (i.e. change their mode state).
         * @param {node|String} node Either the node or the mode ("selectmode" or "panmode")
         * @returns {undefined}
         */
        setModeButton: function(node) {
            var buttonDef;
            if (_.isString(node)) {
                buttonDef = this.buttonList[node];
            } else if (node) {
                buttonDef = _.findWhere(this.buttonList, {node: node});
            }
            if (buttonDef) {
                node = buttonDef.node;
                Nrm.event.trigger("map:setCursor", {cursor: buttonDef.cursor, defaultCursor: buttonDef.cursor});
                this.modeNodes.forEach(function(n){
                    domClass.remove(n, "active");
                });
                domClass.add(node, "active");
            }
        },
        /**
         * Enable a button.
         * @param {node|String} node or button name
         * @param {Boolean} [enable=true]
         * @returns {undefined}
         */
        enableButton: function(node, enable) {
            enable = enable === undefined ? true : enable;
            if (_.isString(node)) {
                node = this.buttonList[node].node;
            }
            if (node) {
                domAttr.set(node, "disabled", !enable);
                if (enable) {
                    domClass.remove(node, "disabled");
                } else {
                    domClass.add(node, "disabled");
                }
            }
        },
        /* ---------------- */
        zoominHandler: function() {
            this.map.setZoom(this.map.getZoom() + 1);
        },
        zoomoutHandler: function() {
            this.map.setZoom(this.map.getZoom() - 1);
        },
        previousHandler: function() {
            this.navToolbar.zoomToPrevExtent();
        },
        nextHandler: function() {
            this.navToolbar.zoomToNextExtent();
        },
        panmodeHandler: function(e) {
            if (e) {
                this.setModeButton("panmode");
            }
            Nrm.event.trigger("map:declareSelectionHandler", {id: "NavButtonBar", handling: false});
            Nrm.event.trigger("map:deactivateDrawMode");
            Nrm.event.trigger("map:deactivateTool");
        },
        selectmodeHandler: function(e) {
            if (e) {
                this.setModeButton("selectmode");
            }
            Nrm.event.trigger("context:mapSelect");
            Nrm.event.trigger("map:declareSelectionHandler", {id: "NavButtonBar", handling: true});
        },
        endDrawHandler: function(e) {
            if (e.attributes && e.attributes.source === "NavButtonBar") {
                this.selectmodeHandler();
            }
        },
        zoomEndHandler: function(evt) {
            var level = evt.level,
                max = this.map.getMaxZoom(),
                min = this.map.getMinZoom();
            if (level === max) {
                domClass.add(this._zoominNode, "disabled");
                domAttr.set(this._zoominNode, "disabled", true);
                domClass.remove(this._zoomoutNode, "disabled");
                domAttr.set(this._zoomoutNode, "disabled", false);
            } else if (level === min) {
                domClass.remove(this._zoominNode, "disabled");
                domAttr.set(this._zoominNode, "disabled", false);
                domClass.add(this._zoomoutNode, "disabled");
                domAttr.set(this._zoomoutNode, "disabled", true);
            } else {
                domClass.remove(this._zoominNode, "disabled");
                domAttr.set(this._zoominNode, "disabled", false);
                domClass.remove(this._zoomoutNode, "disabled");
                domAttr.set(this._zoomoutNode, "disabled", false);
            }
        },
        extentHistoryChangeHandler: function() {
            if (this.navToolbar.isFirstExtent()) {
                domClass.add(this._previousNode, "disabled");
                domAttr.set(this._previousNode, "disabled", true);
                domClass.remove(this._nextNode, "disabled");
                domAttr.set(this._nextNode, "disabled", false);
            } else if (this.navToolbar.isLastExtent()) {
                domClass.remove(this._previousNode, "disabled");
                domAttr.set(this._previousNode, "disabled", false);
                domClass.add(this._nextNode, "disabled");
                domAttr.set(this._nextNode, "disabled", true);
            } else {
                domClass.remove(this._previousNode, "disabled");
                domAttr.set(this._previousNode, "disabled", false);
                domClass.remove(this._nextNode, "disabled");
                domAttr.set(this._nextNode, "disabled", false);
            }
        },
        /**
         * show widget
         * 
         * @returns {undefined}
         */
        show: function(){
            this.set("visible", true);
        },
        // hide widget
        hide: function(){
            this.set("visible", false);
        },
        /* ---------------- */
        /* Private Functions */
        /* ---------------- */
        _init: function() {
            // show or hide widget
            this._visible();
            // widget is now loaded
            this.set("loaded", true);
            this.emit("load", {});
        },
        // theme changed
        _updateThemeWatch: function(attr, oldVal, newVal) {
            domClass.remove(this.domNode, oldVal);
            domClass.add(this.domNode, newVal);
        },
        // show or hide widget
        _visible: function(){
            if(this.get("visible")){
                domStyle.set(this.domNode, 'display', 'block');
            }
            else{
                domStyle.set(this.domNode, 'display', 'none');
            }
        }
    });
    if (has("extend-esri")) {
        lang.setObject("dijit.NavButtonBar", Widget, esriNS);
    }
    return Widget;
});