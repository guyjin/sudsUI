/**
 * @file NRM Map Button Bar
 * @see module:nrm-map/dijit/MapButtonBar
 */
/** 
 * @module nrm-map/dijit/MapButtonBar
 * 
 */

define([
    'nrm-ui',
    "dojo/Evented",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/has", // feature detection
    "esri/kernel", // esri namespace
    "dijit/_WidgetBase",
    "dijit/a11yclick", // Custom press, release, and click synthetic events which trigger on a left mouse click, touch, or space/enter keyup.
    "dijit/_TemplatedMixin",
    "dojo/on",
    "dojo/text!./templates/MapButtonBar.html", // template html
    "dojo/dom-class",
    "dojo/dom-style",
    'dojo/_base/connect'
],
function (
    Nrm,
    Evented,
    declare,
    lang,
    has, esriNS,
    _WidgetBase, 
    a11yclick, 
    _TemplatedMixin,
    on,
    dijitTemplate, 
    domClass, 
    domStyle,
    connect
) {
    var Widget = declare("esri.dijit.MapButtonBar", [_WidgetBase, _TemplatedMixin, Evented], {
        
        // template HTML
        templateString: dijitTemplate,
        
        // default options
        options: {
            theme: "MapButtonBar", // The class assigned to the widget's containing DIV. Referenced in the CSS
            map: null,
            extent: null,
            fit: false,
            visible: true
        },
        
        // lifecycle: 1
        constructor: function(options, srcRefNode) {
            // mix in settings and defaults
            var defaults = lang.mixin({}, this.options, options);
            // widget node
            this.domNode = srcRefNode;
            // store localized strings
            // properties
            this.set("map", defaults.map);
            this.set("editToolbar", defaults.editToolbar);
            this.set("theme", defaults.theme);
            this.set("visible", defaults.visible);
            this.set("extent", defaults.extent);
            this.set("fit", defaults.fit);
            // listeners
            this.watch("theme", this._updateThemeWatch);
            this.watch("visible", this._visible);
            // classes
            this._css = {
                container: "buttonBarContainer",
                undo: "btn btn-default btn-xs undo fa fa-undo",
                redo: "btn btn-default btn-xs redo fa fa-repeat",
                reshape: "btn btn-default btn-xs reshape"
            }; // LW: This is available to the template (MapButtonBar.html)
        },
        // bind listener for button to action
        // LW: This connects the listener to the actual button
        postCreate: function() {
            this.inherited(arguments);
            this.own(
                on(this._undoNode, a11yclick, lang.hitch(this, this.undo))
            );
            this.own(
                on(this._redoNode, a11yclick, lang.hitch(this, this.redo))
            );
            this.own(
                on(this._reshapeNode, a11yclick, lang.hitch(this, this.reshape))
            );                
        },
        // start widget. called by user
        startup: function() {
            // map not defined
            if (!this.map) {
                this.destroy();
                console.log('MapButtonBar::map required');
            }
            // when map is loaded
            if (this.map.loaded) {
                this._init();
            } else {
                on.once(this.map, "load", lang.hitch(this, function() {
                    this._init();
                }));
            }
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
        /* ---------------- */
        setUndoManager: function(undoManager) {
            var that = this;
            this.set("undoManager", undoManager);
            that.refreshUndoState(); // LW: This is a fix to address the apparent cases where the onChange event is not triggered. TODO: Investigate more
            this.undoManager_connect = connect.connect(undoManager,"onChange",function(){
                that.refreshUndoState();
            });
        },
        setGeometryType: function(type) {
            if ((type === "line") || (type === "polyline") || (type === "polygon")) {
                domClass.remove(this._reshapeNode, "disabled");
            } else {
                domClass.add(this._reshapeNode, "disabled");
            }
        },
        refreshUndoState: function() {
            var undoManager = this.get("undoManager");
            if(undoManager) {
                if (undoManager.canUndo) {
                    domClass.remove(this._undoNode, 'disabled');
                } else {
                    domClass.add(this._undoNode, 'disabled');
                }

                if (undoManager.canRedo) {
                    domClass.remove(this._redoNode, 'disabled');
                } else {
                    domClass.add(this._redoNode, 'disabled');
                }
// // jQuery version
//                var idSelector = "#" + this.domNode.id; // Selector for the menu button bar
//                if (undoManager.canUndo) {
//                    $(idSelector + " .undo").addClass("active");
//                } else {
//                    $(idSelector + " .undo").removeClass("active");
//                }
//
//                if (undoManager.canRedo) {
//                    $(idSelector + " .redo").addClass("active");
//                } else {
//                    $(idSelector + " .redo").removeClass("active");
//                } 
            }
        },
        clearUndoManager: function (){
            // LW: May have to research "unsetting" if memory leaks end up being detected
            if(this.undoManager_connect) {
                connect.disconnect(this.undoManager_connect);
                this.set("undoManager", null);  
            }
        },
        undo: function() {
            this.undoManager.undo(); // LW: Add some saftey code to see if undoManager is actually not null
            // LW: Some diagnostics
            //console.log("MapButtonBar UNDOMANAGER UNDO: ", this.undoManager.length, this.undoManager.position, this.undoManager.canUndo, this.undoManager.canRedo);            
        },
        redo: function() {
            this.undoManager.redo();
            // LW: Some diagnostics
            //console.log("MapButtonBar UNDOMANAGER REDO: ", this.undoManager.length, this.undoManager.position, this.undoManager.canUndo, this.undoManager.canRedo);            
        },
        reshape: function() {
            var currentState = this.editToolbar.getCurrentState();
            var attributes;
            var shape;
            
            if ((currentState) && (currentState.graphic)) {
                attributes = currentState.graphic.attributes;
                shape = currentState.graphic.geometry;
                
                Nrm.event.trigger("map:reshape", {
                    attributes: attributes,
                    geometry: shape,
                    undoManager: this.undoManager
                });
            }
        },
        // show widget
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
            // if no extent set, set extent to map extent
            if(!this.get("extent")){
                this.set("extent", this.map.extent);   
            }
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
        lang.setObject("dijit.MapButtonBar", Widget, esriNS);
    }
    return Widget;
});