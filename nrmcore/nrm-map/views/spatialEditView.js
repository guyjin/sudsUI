/**
 * @file The SpatialEditView extends {@link module:nrm-ui/views/editorView|EditorView} to support generic spatial 
 * editing functionality
 * @see module:nrm-map/views/spatialEditView
 */
/** 
 * @module nrm-map/views/spatialEditView
 * 
 */

define([
    'jquery', 
    'underscore', 
    'nrm-ui', 
    'nrm-ui/views/baseView', 
    'nrm-ui/views/editorView', 
    '../nrmShapeEditor'
], function($, _, Nrm, BaseView, EditorView) {
    
    // Note that this is an unusual technique that we would rarely if ever want to copy to other usages.
    // The goal here is to ensure these defaults are available for any view, including those that do not extend
    // EditorView.
    _.extend(BaseView.prototype, {
        /**
         * Default configuration by control type.
         * @name module:nrm-map/views/spatialEditView#controlDefaults
         * @type {Object.<string,module:nrm-ui/views/baseView~ControlConfig>}
         */
        controlDefaults: _.extend(BaseView.prototype.controlDefaults || {}, {
            shape : {
                flmDataSource : 'flmDataSource',
                flmRevDate : 'flmRevDate',
                flmAccuracy : 'flmAccuracy'
            }
        }),
        bindData: _.wrap(BaseView.prototype.bindData, function(fn, c, model) {
            var args = Array.prototype.slice.call(arguments, 1);
            c = fn.apply(this, args);
            if (c.type === 'shape' && c.prop) {
                var propMap = {
                    flmDataSource: 'dataSource',
                    flmRevDate: 'revisionDate',
                    flmAccuracy: 'accuracy'
                };
                c.valueHandler = function(control, prop, value) {
                    var result = $.extend({}, control.value), nestedProp;
                    if (control.nestedShape) {
                        result[prop] = value;
                    } else if (prop === control.prop) {
                        result.shape = value;
                    } else {
                        nestedProp = _.find(propMap, function(nested, key) {
                            return prop === c[key];
                        });
                        if (nestedProp) {
                            result[nestedProp] = value;
                        }
                    }
                    return result;
                };
                if (!c.nestedShape) {
                    c.value = {
                        shape: c.value
                    };
                    var bindModel = _.isString(c.nested) ? Nrm.app.getModelVal(model, c.nested) : model;
                    _.each(propMap, function(nested, key) {
                        c.value[nested] = Nrm.app.getModelVal(bindModel, c[key]);
                    });
                } else {
                    c.value = $.extend({}, c.value);
                }
                c.modelId = model && (model.id || model.cid);
            }
            return c;
        }),
        applyPlugin: _.wrap(BaseView.prototype.applyPlugin, function(fn, parent, c, callback) {
            var args = Array.prototype.slice.call(arguments, 1);
            var el = fn.apply(this, args);
            if (el && c && c.type === 'shape') {
                c.shapeEditor = el.nrmShapeEditor(c);
            }
            return el;
        }),
        initControl: _.wrap(BaseView.prototype.initControl, function(fn, control, callback) {
            var setItemsTrue = false, args = Array.prototype.slice.call(arguments, 1);
            if (control && control.type === 'shape') {
                if (!control.btn) {
                    control.btn = { 
                        id: control.id + '-btn',
                        label: 'Actions',
                        alignRight: true,
                        title: 'Options for editing the geometry',
                        className: 'nrm-enable-readonly'
                    };
                    setItemsTrue = true;
                    if (control.className && BaseView.hasClassName(control.className, 'input-group-sm')) {
                        control.btn.className = BaseView.addClassName(control.btn.className, 'btn-sm');
                    }
                }
            }
            var ret = fn.apply(this, args);
            if (setItemsTrue && !control.btn.items) {
                // work-around for problem where the "btn" handlebars template doesn't know about menu items added in
                // the shape editor plugin, but needs to render the correct layout for a button with dropdown.
                control.btn.items = true;
            }
            return ret;
        }),
        setControlEnabled: _.wrap(BaseView.prototype.setControlEnabled, function(fn, $selection, enable) {
            var args = Array.prototype.slice.call(arguments, 1), self = this;
            args[0] = $selection.filter(function() {
                var $this = $(this);
                if ($this.is('[data-target-shape]')) {
                    $this.nrmShapeEditor('applyShapeValue', { readonly: !enable });
                    return false;
                } else {
                    return true;
                }
            });
            return fn.apply(this, args);
        }),
        setControlValue: _.wrap(BaseView.prototype.setControlValue, function(fn, $el, control) {
            var args = Array.prototype.slice.call(arguments, 1);
            function getShapeControl(el) {
                return el.filter('[data-target-shape]');
            }
            var shapeEl = getShapeControl($el), displayTarget;
            
            if (shapeEl.length) {
                // shape editor control...
                shapeEl = $el;
            } else {
                displayTarget = $el.attr('data-target-display');
                if (displayTarget) {
                    shapeEl = getShapeControl($(displayTarget, this.$el));
                }
            }
            if (shapeEl.length) {
                $el.nrmShapeEditor('applyShapeValue', {
                    value: control.value,
                    triggerChange: false
                });
            } else {
                return fn.apply(this, args);
            }
        })
    });
      
    return Nrm.Views.SpatialEditView = EditorView.extend(/**@lends module:nrm-map/views/spatialEditView.prototype*/{
        /**
         * Overrides {@link module:nrm-ui/views/baseView#startListening} to hook up default event handlers for global
         * events.
         * @returns {undefined}
         */
        startListening: function() {
            this.listenTo(Nrm.event, { 
                "map:endDraw" : this.drawEnd,
                "map:featureEdit": this.featureEdit
            });
        },
        /**
         * Overrides {@link module:nrm-ui/views/editorView#getEditorConfig|EditorView#getEditorConfig}
         * to initialize a specialized shape editor control.
         * @function
         * @returns {module:nrm-ui/views/baseView~FormConfig|external:module:jquery~Promise}
         * The default implementation returns a promise to support dynamically lazy-loaded configuration, but usually
         * subclasses will override this implementation to return the search configuration synchronously.
         */
        getEditorConfig: _.wrap(EditorView.prototype.getEditorConfig, function(fn) {
            var self = this;
            return $.when(fn.call(this)).done(function(config) {
                self.config = config;
                config.shapeProp = (config.shapeEdit && config.shapeEdit.prop); 
                if (config.shapeProp) {
                    var schema = (self.context.schema && self.context.schema[config.shapeProp]) || { };
                    config.shapeEdit = $.extend({ wkid: 4269 }, 
                        self.controlDefaults && self.controlDefaults["shape"], 
                        schema, 
                        config.shapeEdit);
                    config.wkid = config.shapeEdit.wkid;
                }
                var shapeEdit = config.shapeEdit;
                if (shapeEdit) {
                    shapeEdit.type = shapeEdit.type || "shape";
                    shapeEdit.hz = true;
                    if (!shapeEdit.labelGrid && !shapeEdit.hzGrid) {
                        shapeEdit.labelGrid = "col-md-4 col-sm-2";
                        shapeEdit.hzGrid = "col-md-8 col-sm-10";
                    }
                    var addClass = "input-group-sm";
                    if (shapeEdit.className)
                        shapeEdit.className = shapeEdit.className + " " + addClass;
                    else
                        shapeEdit.className = addClass;
                    self.initControl(shapeEdit);
                }
            });
        }),
        /**
         * Extends {@link module:nrm-ui/views/editorView#render|EditorView#initControl} to
         * add support for the shape editor control
         * @function
         * @returns {module:nrm-map/views/spatialEditView}
         * Returns this instance to allow chaining.
         */
        render: _.wrap(EditorView.prototype.render, function(fn) {
            if (this.model) {
                var isNew = this.model.isNew();
                var shapeEdit = this.config.shapeEdit;
                if (shapeEdit) {
                    this.bindData(shapeEdit, this.model);
                } 
                fn.call(this);
                if (shapeEdit) {
                    if (this.readonly) {
                        shapeEdit.readonly = true;
                    }
                    this.applyPlugin(this.$el, shapeEdit);
                    var shapeEl = $("#" + shapeEdit.id, this.$el);
                    if (isNew) {
                        var shapeType;
                        if (shapeEdit.spatialTypes && shapeEdit.spatialTypes.length === 1) {
                            shapeType = shapeEdit.spatialTypes[0];
                        } else if (this.options.subtype && this.context && this.context.subtype === shapeEdit.subtype) {
                            shapeType = this.options.subtype;
                        }
                        shapeEl.nrmShapeEditor("activateShapeTool", { shapeType: shapeType, control: shapeEdit });
                    } else if (!isNew) {
                        shapeEl.nrmShapeEditor("renderShape");
                        Nrm.event.trigger("context:zoomTo", {geometry: shapeEdit.value});
                    }
                }
            }
            return this;
        }),  
        /**
         * Extends {@link module:nrm-ui/views/editorView#applyContext|EditorView#applyContext} to
         * add support for the shape editor control
         * @function
         * @param {Object} options
         * @param {string} options.path The navigation path
         * @param {string} [options.group] The new group attribute value.
         * @param {string} [options.subtype] The new subtype attribute value.
         * @returns {Boolean}
         * Indicates whether the navigation context applies to this view.
         */
        applyContext: _.wrap(EditorView.prototype.applyContext, function(fn, options) {
            var currentSubtype = this.options.subtype;
            if (fn.call(this, options)) {
                if (options.subtype && options.subtype !== currentSubtype) {
                    var shapeEdit = this.config && this.config.shapeEdit;
                    if (shapeEdit && this.context && this.context.subtype === shapeEdit.subtype) {
                        var shapeEl = $("#" + shapeEdit.id, this.$el);
                        shapeEl.nrmShapeEditor("activateShapeTool", { shapeType: options.subtype, control: shapeEdit });
                    }
                }
                return true;
            }
        }),
        /**
         * Updates the shape value in the {@link module:nrm-map/nrmShapeEditor|NrmShapeEditor plugin}.
         * @param {Object} options
         * @param {external:module:esri/Graphic|Object} options.graphic The updated graphic
         * @param {Boolean} options.editComplete Indicates whether the edit operation was completed.
         * @returns {undefined}
         */
        updateShape: function(options) {
            var data = options.graphic || {}, el, bindings, control, model,
                    elemId = data.attributes && data.attributes.elemId;
            if (elemId) {
                el = $('#' + elemId, this.$el);
                bindings = this.getBindingForElement(el);
                if (bindings && bindings.length) {
                    this.setDirty(true);
                    control = el.data('nrm-control');
                    model = bindings[0].model;
                    el.nrmShapeEditor('updateShape', $.extend({ }, control, {
                        //model: bindings[0].model,
                        modelId: model && (model.id || model.cid),
                        graphic: data,
                        stringifyShape: (this.config && this.config.stringifyShape) || false,
                        editComplete: options.editComplete
                    }));
                }
            }
        },
        /**
         * Event handler for the global "map:drawEnd" event
         * @param {external:module:esri/Graphic|Object} data The updated graphic
         * @returns {undefined}
         */
        drawEnd: function(data) {
            console.log("In EditorView.drawEnd");
            this.updateShape({ graphic: data, editComplete: true });
        },
        /**
         * Event handler for the global "map:featureEdit" event
         * @param {external:module:esri/Graphic|Object} data The updated graphic
         * @returns {undefined}
         */
        featureEdit: function(data) {
            console.log("In EditorView.featureEdit");
            this.updateShape({ graphic: data, editComplete: false });
        }

    });
});