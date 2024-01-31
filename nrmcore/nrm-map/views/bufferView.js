/**
 * @file The BufferView extends {@link module:nrm-map/views/spatialEditView|SpatialEditView} that provides a form for entering different 
 * buffer options to buffer a feature.
 * @see module:nrm-map/views/bufferView
 */
/** 
 * @module nrm-map/views/bufferView
 * 
 */
define(['./spatialEditView',
    './featureLayerView',
    '../models/bufferParams',
    'nrm-ui',
    'nrm-ui/views/modalView',
    'jquery', 
   'underscore',
    'backbone',
    'hbs!editForm', // Templates referenced here to assure they are in the optimized layer when bufferView is included.
    'hbs!inputNum',
    'hbs!select',
    'use!select2',
    'hbs!collapse',
    'hbs!formText'
],
        function (SpatialEditView, FeatureLayerView, BufferParams, Nrm, ModalView, $, _, Backbone, template) { 
            var BufferView = SpatialEditView.extend(/** @lends module:nrm-map/views/bufferView.prototype */{
                events: $.extend({}, SpatialEditView.prototype.changeEvents, SpatialEditView.prototype.events, {
                    "click #buffer-buffer": "buffer",
                    "click #buffer-buffer-undo": "undoBuffer",
                    "click #buffer-ok": "ok",
                    "click #buffer-cancel": "cancel"
                }),
                /**
                * Create a new BufferView instance.
                * @constructor
                * @alias module:nrm-map/views/bufferView
                * @classdesc The BufferView is a Backbone.View that supports creating polygon buffers around geometry.
                * @param {Object} options
                * @param {external:module:esri/geometry/Geometry|Object} options.geometry The geometry object to
                * initialize the bufferView's nrmShapeEditor and be the target of buffer operations.
                * @param {external:module:esri/geometry/Geometry|Object} [options.attributes.appendTo] Original polygon
                * to add the new buffer to when adding a part via buffer.
                * @param {Object} options.shapeOptions Attributes to set on the graphic.
                * @param {String} [options.caption="Buffer"]
                */
                initialize: function (options) {
                    options = $.extend({}, this.defaults, options, {
                        attributes: options.shapeOptions
                    });
                    return SpatialEditView.prototype.initialize.call(this, options);
                },
                /**
                 * Override of {@link module:nrm-ui/views/editorView#mixEditorConfig|editorView#mixEditorConfig} to 
                 * avoid mixing in application-specific configuration.
                 * @returns {module:nrm-ui/views/baseView~FormConfig}
                 */
                mixEditorConfig: function(config) {
                    // do not mix in application-specific configuration
                    return config;
                },
                /**
                 * Override of {@link module:nrm-ui/views/baseView#getEditorConfig|baseView#getEditorConfig}
                 * @returns {module:nrm-ui/views/baseView~FormConfig}
                 */
                getEditorConfig: function() {
                    this.config = {
                        title: this.options.caption,
                        helpContext: this.options.helpContext,
                        controls: [
                            {
                                'type': 'formText',
                                'id': 'bufferText',
                                'tag': 'em',
                                'prop': 'instructions'
                            },
                            {
                                id: "buffer-inline-controls",
                                type: "collapse",
                                expand: true,
                                className: "form-inline",
                                "inline": true,
                                template: "panelContent",
                                controls: [
                                    {
                                        'id': 'bufferDistance',
                                        'type': 'inputNum',
                                        'label': 'Buffer Distance',
                                        'prop': 'distance',
                                        'style': {"width": "100px"},
                                        'className': 'nrm-inline-padding',
                                        'required': true,
                                        'step': 'any' // allows any number of digits after the decimal
                                    },
                                    {
                                        'placeholder': 'Select Unit',
                                        'id': 'selectUnit',
                                        'type': 'select',
                                        'label': 'Unit',
                                        'prop': 'unit',
                                        'className': 'nrm-inline-padding',
                                        'required': true,
                                        options: [
                                            {value: 'feet', text: 'Feet'},
                                            {value: 'kilometers', text: 'Kilometers'},
                                            {value: 'meters', text: 'Meters'},
                                            {value: 'miles', text: 'Miles'}]
                                    },
                                    {
                                        type: "btn",
                                        id: "buffer-buffer",
                                        label: "Buffer",
                                        className: "nrm-enable-valid",
                                        title: "Preview the buffered geometry"
                                    },
                                    {
                                        type: "btn",
                                        id: "buffer-buffer-undo",
                                        label: "Undo Buffer",
                                        title: "Revert to the pre-buffer geometry",
                                        hidden: true
                                    }
                                ]
                            }
                        ],
                        actions: [
                            {
                                type: "btn",
                                id: "buffer-ok",
                                label: "OK",
                                disabled: true,
                                btnStyle: "primary",
                                "hzGrid": "col-md-6 col-sm-0",
                                "grid": "col-sm-4"
                            }, {
                                type: "btn",
                                id: "buffer-cancel",
                                label: "Cancel",
                                "hzGrid": "col-md-6 col-sm-0",
                                "grid": "col-sm-4"
                            }
                        ],
                        'shapeEdit': {
                            'id': 'bufferShape',
                            'prop': "shape",
                            'label': "Geometry",
                            'helpContext': this.options.helpContext,
                            'allowReplace': true,
                            'allowMultipart': false,
                            'allowBuffer': false,
                            'allowFlm': false,
                            'required': true,
                            'type': 'shape',
                            'spatialTypes': ['point', 'line', 'polygon']
                        }
                    };
                    return SpatialEditView.prototype.getEditorConfig.apply(this, arguments);
                },
                /**
                 * Override of {@link module:nrm-ui/views/editorView#loadData|editorView#loadData}
                 */
                loadData: function() {
                    var modelAttributes = {
                        shape: this.options.geometry,
                        instructions: "To buffer feature enter buffer distance and select unit." +
                                    " Then click on Buffer button." +
                                    " Click Ok to finish buffer." +
                                    " Click Cancel to cancel buffer."
                    };
                    if (window.sessionStorage) {
                        _.extend(modelAttributes, {
                            unit: window.sessionStorage.bufferunit,
                            distance: window.sessionStorage.bufferdistance
                        });
                    }
                    if (this.options.attributes.appendTo) {
                        modelAttributes.instructions = "Create a shape using the Actions button. " + 
                                modelAttributes.instructions;
                    }
                    this.model = new BufferParams(modelAttributes);
                    return this.configLoading;
                },
                /**
                * Default options
                * @type {Object}
                */
                defaults: {
                    // define default options here
                    caption: 'Buffer',
                    helpContext: '1067' 
                },
                /**
                 * Override of {@link module:nrm-ui/views/baseView#onRemove|BaseView#onRemove} to remove temporary map
                 * layer displaying the appendTo geometry.
                 * @returns {undefined}
                 */
                onRemove: function() {
                    if (this.appendToLayer) {
                        this.appendToLayer.remove();
                    }
                    //this.trigger("remove", this);
                },
                /**
                 * Override of {@link module:nrm-ui/views/editorView#allowRemove|EditorView#allowRemove} to display
                 * custom confirmation prompt if view is dirty.
                 * @returns {Boolean|external:module:jquery~Promise}
                 * Returns boolean indicator of whether the view can be removed, or a promise that is rejected if user 
                 * cancels.
                 */
                allowRemove: function() {
                    if (this.isDirty()) {
                        // do not prompt in the following scenarios:
                        // - the prompt is already displaying (this.removing is a Promise)
                        if (this.removing) {
                            return this.removing;
                        }
                        var dfd = new $.Deferred();
                        /**
                         * A jQuery Promise that is set while the view is prompting user to handle unsaved changes on removal. 
                         * @name module:nrm-ui/views/bufferView#removing
                         * @type {?external:module:jquery~Promise}
                         */
                        this.removing = dfd.promise();
                        Nrm.event.trigger('app:modal', { 
                            buttons: ModalView.YES_NO, // ModalView.SAVE_ABANDON_CANCEL constant
                            caption: 'Buffer is incomplete', 
                            content: '<p>The buffer operation has not been completed and it will be cancelled if you proceed.</p>' +
                                    '<p>Do you want to cancel the buffer?</p>',
                            callback: _.partial(function(view) {
                                if (this.clicked === 0) {
                                    view.clearGeometry();
                                    dfd.resolve();
                                    view.removing = null;
                                } else {
                                    dfd.reject();
                                    view.removing = null;
                                }
                            }, this)
                        }); 
                        return this.removing;
                    } else {
                        this.clearGeometry();
                        return true;
                    }
                },
                /**
                 * Render the view.
                 * @returns {module:nrm-map/views/bufferView}
                 */
                render: function () {
                    if (this.options.attributes.appendTo) {
                        // create a collection layer to hold the appendTo graphics
                        var symbol = {fill: {
                                "style": "STYLE_SOLID",
                                "color": [255, 255, 255, 0.33],
                                "line": {
                                        "color": [255, 0, 0],
                                        "thickness": 0.75,
                                        "style": "STYLE_DASH"
                                }}};
                        this.appendToLayer = new FeatureLayerView({
                            mapControl: Nrm.app.mapView.mapControl,
                            symbol: symbol,
                            selectable: false,
                            caption: "Original Geometry",
                            collection: new Backbone.Collection([
                                _.extend({}, this.options.attributes, {
                                    shape: this.options.attributes.appendTo
                                })
                            ])
                        });
                        this.appendToLayer.render();
                    }
                    this.bindAllData(this.config.controls, this.model);
                    this.bindData(this.config.shapeEdit, this.model);
                    this.$el.html(template(this.config));
                    this.applyPlugins(this.$el, this.config.controls);
                    this.applyPlugin(this.$el, this.config.shapeEdit);
                    this.applyClasses(this.config, this.$el);
                    if (!this.options.geometry === undefined) {
                        $("#buffer-buffer", this.$el).prop('disabled', true);
                    }
                    if (this.model.get('shape')) {
                        $('#bufferShape', this.$el).nrmShapeEditor('renderShape');
                    }
                    this.listenTo(this.model, 'change:unit', this.storeValue);
                    this.listenTo(this.model, 'change:distance', this.storeValue);
                    this.listenTo(this.model, "change", this.onAttributeChange);
                    // set the initial buffer button state, but suppress validation errors
                    this.removeErrors();
                    this.useGlobalErrorNotification = false;
                    this.onAttributeChange();
                    this.useGlobalErrorNotification = true;
                    this.startListening();
                    return this;
                },
                /**
                 * Store a changed model value in sessionStorage.
                 * @param {external:module:backbone.Model} model
                 * @returns {undefined}
                 */
                storeValue: function (model) {
                    //Stores the current attribute value, restored in render method.
                    if (window.sessionStorage) {
                        var attName = _.keys(model.changed)[0],
                            selectedValue = model.changed[attName];
                        window.sessionStorage["buffer" + attName] = selectedValue;
                    }
                },
                /**
                 * Set control state based on model validity.
                 * @param {module:nrm-map/models/bufferParams} [model] Unused
                 * @param {Object} [options] Unused
                 * @returns {undefined}
                 */
                onAttributeChange: function(model, options) {
                    this.setControlEnabled($(".nrm-enable-valid", this.$el), this.validate());
                },
                /**
                 * Remove current (possibly buffered) geometry and restore original geometry.
                 * @returns {undefined}
                 */
                clearGeometry: function() {
                    //geometry is set to existing shape before bufferView is launched
                    var geometry;
                    if (this.options.attributes.appendTo) {
                        geometry = this.options.attributes.appendTo;
                    } else {
                        geometry = this.options.geometry;
                    }
                    this.removeErrors();

                    /**
                    * Undo the buffer 
                    * @event module:nrm-ui/event#map:cancelBuffer
                    * @param {Object} options
                    * @param {external:module:esri/geometry/Geometry|Object} [options.geometry] Pre-buffer geometry to be restored.
                    * @param {Object} options.attributes Pre-buffer attributes to be restored.
                    * @returns {undefined}
                    */
                    Nrm.event.trigger("map:cancelBuffer", {
                        geometry: geometry, 
                        attributes: _.omit(this.options.attributes, "appendTo")
                    });
                },
                /**
                 * Handles Cancel button click, cancels the buffer and removes the view.
                 * @returns {undefined}
                 */
                cancel: function (e) {
                    $.when(this.allowRemove()).done(_.bind(function(result) {
                        if (result !== false) {
                            this.remove(); 
                        }
                    }, this));
                },
                 /**
                 * Handles ok button click, finalizes the buffer and removes the view.
                 * @returns {undefined}
                 */
                ok: function (e) {
                    if (this.validate())
                    {
                        //Buffers the current shape
                        Nrm.event.trigger("map:featureCreate", {
                            attributes: _.extend(this.options.attributes, {flmDataSource: "24"}),
                            geometry: this.model.get("shape")
                        });
                        this.remove();
                    }
                },
                /**
                 * Toggle button state and geometry edit enabled status
                 * @param {external:module:jquery} showButton Button element to show
                 * @param {external:module:jquery} hideButton Button element to hide
                 * @param {boolean} enableOkButton If true, indicates the OK button should be enabled and geometry edit
                 * control disabled
                 * @returns {undefined}
                 */
                toggleButtons: function(showButton, hideButton, enableOkButton) {
                    //Enable or disable the OK button and items in the Actions Menu of the ShapeEditor Control
                    var enableItems = $("ul.dropdown-menu>li", this.$el)
                            .not(".nrm-enable-readonly,.divider,.dropdown-header,.dropdown-submenu");
                    this.setControlEnabled(enableItems, !enableOkButton);
                    $("#buffer-ok", this.$el).prop("disabled", !enableOkButton);
                    
                    hideButton.hide();
                    showButton.show();
                    setTimeout(function() {showButton.focus()}); 
                },
                /**
                 * Undo the buffer preview
                 * @param {Event} e The event data
                 * @returns {undefined}
                 */
                undoBuffer: function(e) {

                    //Undo the buffer and return the last edited geometry before buffer was done

                    Nrm.event.trigger("map:featureCreate", {
                        attributes: _.extend(_.omit(this.options.attributes, "appendTo"), {
                            elemId: "bufferShape"
                        }), geometry: this.model.get("oldShape"),
                        suppressUndo: true
                    });
                    
                    this.toggleButtons($("#buffer-buffer", this.$el), $(e.target), false);           
                },
                 /**
                 * Handles buffer button click, gives options to user to edit geometry before finalizing the buffer
                 * @param {Event} e The event data
                 * @returns {undefined}
                 */
                buffer: function (e) {
                    
                    if (this.validate()) {
                        
                        var geometry = this.model.get("shape");
                        this.model.set("oldShape", geometry);
                        /**
                        * Create the buffer
                        * @event module:nrm-ui/event#map:bufferFeature
                        * @param {type} options
                        * @param {external:module:esri/geometry/Geometry|Object} options.geometry The geometry object
                        * @param {Object} options.attributes Attributes to set on the graphic
                        * @param {Number} options.distance Buffer distance
                        * @param {String} options.units Linear unit for buffer distance, one of the values listed at 
                        * {@link https://developers.arcgis.com/javascript/3/jsapi/esri.geometry.geometryengine-amd.html#geodesicbuffer|geometryEngine.geodesicBuffer}
                        */
                        Nrm.event.trigger("map:bufferFeature", {
                            geometry: geometry,
                            attributes: _.extend(_.omit(this.options.attributes, "appendTo"), {
                                elemId: "bufferShape"
                            }),
                            distance: this.model.get('distance'),
                            units: this.model.get('unit')
                        });
                    
                        this.toggleButtons($("#buffer-buffer-undo", this.$el), $(e.target), true);   
                    }
                }
            }
            );
            return BufferView;
        });

