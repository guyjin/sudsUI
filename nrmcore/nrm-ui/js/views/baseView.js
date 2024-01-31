/**
 * @file The BaseView extends {@link http://backbonejs.org/#View|Backbone.View} to provide support for generic
 * rendering techniques. 
 * @see module:nrm-ui/views/baseView
 */
define([
    'require', 
    '..', 
    'jquery', 
    'underscore', 
    'backbone', 
    'handlebars', 
    'use!modernizr', 
    'hbs!error',
    '../plugins/nrmLoadingIndicator',
    '../models/rule'
], function(require, Nrm, $, _, Backbone, Handlebars, Modernizr, errorTemplate, NrmLoadingIndicator, Rule) {
  
    var lovLoading = 0,
            //if practical, declare regular expression variables in module scope for performance optimization
            cellTitlePattern = /{{name}}/g, 
            whitespace = /\s+/;
  
    /**
     * The context configuration associated with this view.
     * @name module:nrm-ui/views/baseView#context
     * @type {module:nrm-ui/models/application~ContextConfig}
     */
    
    /**
     * Initialization options.
     * @name module:nrm-ui/views/baseView#options
     * @type {Object}
     */
    
    /**
     * Name of the default generic template, undefined or empty string indicates that the view does not
     * use generic rendering.
     * @name module:nrm-ui/views/baseView#genericTemplate
     * @type {string}
     */
    /**
     * A promise that will be resolved when initialization is completed.  Should be set to false, null
     * or undefined if the view is not being loaded.
     * @name module:nrm-ui/views/baseView#loading
     * @type {?external:module:jquery~Promise|Boolean}
     */
    /**
     * Represents a UI control, often a combination of label and data entry field, but might be any UI element
     * which might include nested child controls.   Note that each type of control might support different properties,
     * including some not listed here.  Also note that control configuration may inherit properties from the schema
     * configuration associated with the data bound model attribute identified by "prop" attribute.
     * @typedef {module:nrm-ui/models/application~SchemaConfig} module:nrm-ui/views/baseView~ControlConfig
     * @property {string} type The control type which should correspond to a Handlebars template name.  This
     * control configuration object will be passed as the context to the template when it is rendered.  
     * @property {string} id The element id, must be unique.
     * @property {string} label The label or equivalent display text.
     * @property {string} title The title tag aka "tooltip"
     * @property {string} prop The name of the model attribute for data binding, also identifies the schema
     * configuration from which the control may inherit additional properties during initialization.
     * @property {string} path For nested property binding, the path relative to the parent model, set via data binding.
     * @property {boolean} inherited Indicates that the control is bound to a property whose value was inherited from
     * a parent model, which means that it should be read-only.  This is set during control initialization.
     * @property {*} value The control value, usually set via data binding during the rendering process.
     * @property {string} className Value of the class attribute which might be one or more CSS classes separated by a 
     * space character.  Some templates might add additional classes if required, even if they are not specified here.
     * @property {string} labelClass Additional CSS class(es) to add to the label.
     * @property {string} hiddenClass CSS class that should be used to hide the element if hidden is true.
     * @property {boolean} hidden Element should be hidden, including its container if there is one.  The default 
     * behavior is to set display:none CSS style but a CSS class can be used instead by setting hiddenClass.
     * @property {boolean} required Indicates the control is a required field
     * @property {boolean} readonly Indicates the control is read-only (some controls should set disabled if readonly
     * is not supported)
     * @property {boolean} disabled Indicates the control is disabled (some controls should set readonly instead if it
     * is supported)
     * @property {string|Object} style Inline style attribute, please use this sparingly.  Value should be a valid 
     * CSS string suitable for the style attribute, or an object hash of style properties and values suitable for the 
     * {@link https://api.jquery.com/css/#css-properties|jQuery.css(properties)} method.
     * @property {module:nrm-ui/views/baseView~ControlConfig[]} controls Nested controls
     * @property {module:nrm-ui/views/baseView~ControlConfig[]} actions Nested controls that are typically
     * rendered as a toolbar.
     * @property {module:nrm-ui/views/baseView~MenuItemConfig[]} items Nested controls that are typically
     * rendered as a dropdown menu or sub-menu.
     * @property {module:nrm-ui/views/baseView~ControlConfig} btn Button configuration for composite controls that with
     * a button add-on element.
     * @property {Object} pluginOpts Options to pass to a plugin associated with the control type.  Supported options
     * will vary depending on the plugin type.
     * @property {Object} pluginOpt Deprecated variant of pluginOpts.
     * @property {boolean} group Indicates whether this control is the first item in a new group
     * @property {boolean} hz Indicates that the control is participating in a horizontal grid layout, this is set
     * automatically during control initialization if the hz property is set on the form config.  Note that this may
     * be deprecated in the future if we can work out how to use block helpers to accomplish this in the templates.
     * @property {boolean} tablecell Indicates the control is being rendered in a cell in a data table.
     * @property {string} nested Identifies the parent attribute name for a nested binding context, so that the value of 
     * the control is evaluated as a property of the parent attribute.
     * @property {boolean|external:module:jquery~Promise} valueLoading indicates whether asynchronous data binding is in
     * progress.
     * @property {string|Array.<string>} dependencies Either an array of dependent property names or a JQuery selector 
     * string identifying a set of dependent elements.   If it is an array, it will be translated to a selector using 
     * the data-nrmprop attribute.  The selector will be scoped to the parent element for the binding, which is the 
     * table row for a child collection or the element bound to the parent property if it is a nested property.
     * @property {module:nrm-ui/models/application~ContextConfig} parentContext The parent context providing schema 
     * configuration for this control, set during control initialization if the context is different than the context 
     * associated with the view.
     * @property {module:nrm-ui/models/application~ContextConfig} ctx The implicit context configuration that is derived
     * during control configuration. Usually this is a nested context configuration based on the schema configuration
     * associated with the control, except for non-dependent lov controls where it is a top-level context.
     * @property {Function} valueHandler Optional callback function that custom controls with special binding 
     * requirements may define to compute the control value when it changes.  If defined, function will execute with 
     * the current view as "this" context and three arguments: the control configuration, property name for the binding,
     * and the new value.
     */
    
    /**
     * Represents an input control.
     * @typedef {module:nrm-ui/views/baseView~ControlConfig} module:nrm-ui/views/baseView~InputConfig
     * @property {Number|String} min Minimum value for a number or date field.  For dates, this should be provided as 
     * string with yyyy-mm-dd format.
     * @property {Number|String} max Maximum value for a number or date field.  For dates, this should be provided as 
     * string with yyyy-mm-dd format.
     * @property {Number} minlength Minimum length for a text field.
     * @property {Number} maxlength Maximum length for a text field.
     * @property {Number|String} step The step for a number field, may be a number or "any" for decimal numbers.
     * @property {String} pattern Regular expression pattern for text field validation.
     * @property {String} placeholder Placeholder value, note that IE11 has issues with placeholders in input fields so
     * it is usually best not to use this until/unless we can come up with a work around
     * @property {String} inputType The input type to override default.
     */
    
    /**
     * Represents a checkbox control.
     * @typedef {module:nrm-ui/views/baseView~ControlConfig} module:nrm-ui/views/baseView~CheckboxConfig
     * @property {String} trueVal Value to set on model if the checkbox is checked.
     * @property {String} falseVal Value to set on model if the checkbox is unchecked.
     * @property {Boolean} checked Initial checked state, usually set via data binding.
     */
    
    /**
     * Represents a panel control.
     * @typedef {module:nrm-ui/views/baseView~ControlConfig} module:nrm-ui/views/baseView~PanelConfig
     * @property {module:nrm-ui/views/baseView~FormConfig} config Form configuration, often this is factored out into
     * a child view instead of defining the configuration on the parent control.
     * @property {String|Function|external:module:backbone.View|external:module:jquery~Promise} view The view module 
     * typically configured as a module ID string, but can also be set to a view constructor.  While the view is 
     * loading, it will be set to a JQuery Promise and when it has finished loading it will be set to the view instance.
     * @property {Array.<String|FieldConfig>} fields A list of fields contained in the panel, to associate rule 
     * validation errors with the panel in cases where the association cannot be inferred from the HTML content, such
     * as before the child view is rendered.
     * @property {String} helpContext Help topic id for the panel.
     * @property {String} content The HTML content as a string.
     * @property {String} template A template name to render the panel content.
     * @property {Boolean} expand Indicates that the panel is expanded, if it is a collapsible panel.
     * @property {Boolean} selected Indicates that it is the active tab panel in an array of tabs.
     */
    
    /**
     * Represents a tab list control
     * @typedef {module:nrm-ui/views/baseView~ControlConfig} module:nrm-ui/views/baseView~TabsConfig
     * @property {Array.<module:nrm-ui/views/baseView~PanelConfig>} tabs The list of tabs.
     * @property {String} selectedTab The id of the currently selected tab.
     */
    
    /**
     * Field configuration for panel controls to assist with validation feedback.
     * @typedef {Object} module:nrm-ui/views/baseView~FieldConfig
     * @property {String} prop Model attribute name
     * @property {String} label Field label to display in validation error messages.
     */
    
    /**
     * Represents a list of value (LOV) control type, such as a select dropdown or radio buttons.  The generic 
     * rendering of a an LOV control will generate a list of selection options from a Backbone collection as described
     * in the "lov" property description below.
     * @typedef {module:nrm-ui/views/baseView~ControlConfig} module:nrm-ui/views/baseView~LovConfig
     * @property {boolean|string} lov Indicates that the control is an LOV control.  If it is a boolean, the type of lov
     * should be identified using refType property in the schema configuration for the property bound to the control in 
     * order to use generic rendering techniques to load the collection.  If it is a string, it may be equivalent to the
     * refType, or if it contains the dot character (.), it represents a dependent LOV.  If the first character is a dot
     * character, the remainder of the string is evaluated as a child collection of the model in the current binding
     * context.  Otherwise if it is a dependent LOV, it is evaluated as a child collection of a parent LOV, with the 
     * part before the dot identifying a model attribute that provides the id of the parent LOV model and the part after
     * the dot representing the child collection to evaluate.
     * @property {Array.<module:nrm-ui/views/baseView~OptionConfig>} options List of selection options.  Usually this is
     * generated from a collection based on value of lov and/or refType as described in the "lov" property description 
     * above.  If the list is already defined when the control is initialized, the predefined list will override the 
     * generic rendering behavior.  This property will be ignored if optgroups is defined.
     * @property {Array.<module:nrm-ui/views/baseView~OptGroupConfig>} optgroups List of selection option groups.  
     * Usually this is generated from a collection based on value of lov and/or refType as described in the "lov" 
     * property description above if the groupAttr property is defined.  If the list is already defined when the control
     * is initialized, the predefined list will override the generic rendering behavior.
     * @property {string} groupAttr Attribute name that defines the option groups, may be inherited from the associated
     * context configuration.
     * @property {string} idAttr The id attribute name, if it cannot be determined from the context configuration or
     * collection.
     * @property {string} nameAttr The display attribute name.  If it is an "unwrapped" relationship property, this 
     * should be set to the attribute name in the current binding context, not the attribute name in the collection.
     * @property {external:module:backbone.Collection} collection The collection providing list options, usually set
     * during control initialization, but the generic loading may be overridden by providing a predefined collection.
     * @property {boolean} loading Indicates that the control is currently loading.
     * @property {boolean} error Indicates that the LOV loading failed.
     * @property {boolean} multiple Indicates that the control supports multiple selections.
     * @property {boolean} preload Indicates that rendering should be deferred until the LOV has loaded.
     * @property {string} placeholder Placeholder text to display in a select control with no selection, a default 
     * value will be assigned if it is not specified because it is required to support data binding.
     * @property {*} displayValue The display value.
     * @property {*} parentValue The parent value.
     * @property {string} rowClass The CSS class for rows in a dropdown with columns, default is "row".
     * @property {Array.<string|module:nrm-ui/views/baseView~OptionColumnConfig>} columns List of columns.
     * @property {boolean} header Indicates that column headers should be displayed.
     * @property {string} headerSep (deprecated) separator character to delimit column headers within an optgroup label.
     * @property {boolean} searchAllColumns Indicates that the matcher should match all columns instead of the default
     * which only matches the primary display column.
     * @property {boolean} openDropdown Indicates that the dropdown should open after the Select2 plugin is initialized.
     */
    
    /**
     * Configuration for select dropdown options.
     * @typedef {Object} module:nrm-ui/views/baseView~OptionConfig
     * @property {string} text Display value
     * @property {string} value Selection value
     * @property {boolean} selected Indicates that the option is selected
     * @property {boolean} disabled Indicates that the option is disabled     
     * @property {boolean} title Title tag value, implemented for radio buttons.
     * @property {Array.<module:nrm-ui/views/baseView~OptionColumnConfig>} columns List of columns.
     */
    
    /**
     * Configuration for select dropdown optgroups.
     * @typedef {Object} module:nrm-ui/views/baseView~OptGroupConfig
     * @property {string} text Display value
     * @property {Array.<module:nrm-ui/views/baseView~OptionConfig>} options List of selection options in the group. 
     * @property {boolean} isHeader Indicates that the optgroup represents column headers.
     * @property {Array.<module:nrm-ui/views/baseView~OptionColumnConfig>} columns List of columns if the optgroup is a
     * represents column header.
     */
    
    /**
     * Configuration for columns in select dropdown options.
     * @typedef {Object} module:nrm-ui/views/baseView~OptionColumnConfig
     * @property {string} label Column header label
     * @property {string} value The column value for the current selection option, or header label if it is an optgroup.
     * @property {boolean} matchStart Indicates that the matcher should only match the start of the value.
     * @property {string} className The class name for the column, usually this should be set to one of the Twitter 
     * Bootstrap grid column classes.
     * @property {string} style Additional CSS styles, formatted as a style attribute value.
     */
            
    /**
     * Represents a menu item in a dropdown or context menu.  
     * @typedef {module:nrm-ui/views/baseView~ControlConfig} module:nrm-ui/views/baseView~MenuItemConfig
     * @property {string} [href="#"] The href attribute value.  Note that if activation of this menu item should not 
     * update the address bar, i.e. the menu item is not considered a navigation event in the browser history, then the
     * className property should include the "nrm-route-action" class.
     * @property {Boolean} [generateHref] Indicates that the href is dynamic, in other words, we need to append the 
     * path of the selected item if it is available.  Defaults to true except for custom items provided by a function 
     * where it defaults to false. 
     * @property {Boolean} [disabled=false] Indicates whether the menu item should be disabled, yet still visible.
     * @property {Boolean} [enable=true] Indicates whether this menu item is available. In contrast to the "disabled"
     * option, the menu item will not be visible at all if this property is set to false.
     * @property {Boolean} [override=false] Indicates whether this item should override a default item.  If true, it
     * will override a default item by matching either the id or the href property (or route property, if the href 
     * already includes the path of the selected item)
     * @property {string} [route] If the href already includes the path, this property can be used to match the href
     * of a default item to override that does not include the path.
     * @property {Boolean} [enableEditable=false] If true, indicates that this menu item should only be enabled if the
     * selected model or folder is editable.  If false, the editable state has no effect on the enabled or available
     * status of the menu item.
     * @property {Boolean} [enableSpatial=false] If true, indicates that this menu item should only be enabled if the
     * selected model or folder is spatially enabled.  If false, the spatial state has no effect on the enabled or 
     * available status of the menu item.
     * @property {Boolean} [enableFolder=true] Indicates whether this item should be visible on a folder node.
     * @property {Boolean|string[]} [enableGroups=false] Indicates whether this item should be visible on a group 
     * folder node.  If the value is an array, it indicates specific group values for which this item should be 
     * enabled on a group folder node, and for any group values not matching an item in the array, the menu item
     * will be visible but disabled.
     * @property {Boolean} [enableNew=false] Indicates whether this item should be visible on a new model.
     * @property {Boolean} [enableSubtypes=false] Indicates whether we should dynamically create a submenu derived
     * from the configured subtype values provided in the "typemap" option in the 
     * {@link module:nrm-ui/models/application~ContextConfig|context configuration}.
     * @property {string} [subtypePrefix] A prefix to prepend to the subtype display value for the menu item label 
     * in the dynamically generated submenu
     * @property {string[]} [nodetypes] A specific list of node types for which this item should be visible.
     * @property {Boolean} [standalone=false] Indicates whether this item should be a separate item when the menu 
     * items are arranged in a toolbar.  Ignored when the menu items is arranged in a context menu.
     * @property {Boolean} [bottomGroup=false] Indicates whether this item should be located in the bottom group
     * below the custom items.
     */
    
    /**
     * Configuration of a generic form.
     * @typedef {Object} module:nrm-ui/views/baseView~FormConfig
     * @property {Boolean} hz Indicates whether we should use the horizontal form layout.
     * @property {string} title Form title aka header.
     * @property {string} helpContext Context-sensitive help link.
     * @property {string} inputClass A class name that should be added to all input elements.
     * @property {string} btnClass A class name that should be added to all buttons.
     * @property {string} containerClass A class name that should be added to the container element. Overriding the
     * className property is preferable in most cases.
     * @property {string} template Name of the template to render the view.  If not specified, a default may be set 
     * during initialization if the genericTemplate property defined on the view.
     * @property {module:nrm-ui/views/baseView~ControlConfig[]} controls List of controls
     * @property {module:nrm-ui/views/baseView~ControlConfig[]} actions List of button-like controls to render at the
     * bottom of the form.  Should include one submit button with primary style and any number of other buttons with 
     * default style, but technically could also include other types of controls besides button.
     * @property {Boolean} alignRight Indicates that the actions buttons should be aligned to the right edge of the
     *  container.
     */
    /**
     * Extends {@link module:nrm-ui/views/baseView~FormConfig|FormConfig} to include an optional map of additional
     * class names to add to existing configuration property values.
     * @typedef {module:nrm-ui/views/baseView~FormConfig} FormConfigMixin}
     * @property {module:nrm-ui/views/baseView~FormConfig} defaults Default configuration.
     * @property {Object.<string,string>} addClasses Additional classes to add to specific configuration properties such
     * as inputClass, btnClass, etc.  The keys in this object are the configuration property names, the values are the 
     * class name(s) to add to the existing value.
     */
    /**
     * Dictionary of form configuration objects to mix into the configuration for all generic views, with keys 
     * indicating the type of view, equivalent to the keys defined in 
     * {@link module:nrm-ui/models/application~ModuleConfig|ModuleConfig} plus "all" key which applies to all views, and
     * values containing default configuration properties that can be applied to all views of the specified type.
     * @typedef {Object.<string,module:nrm-ui/views/baseView~FormConfigMixin>} FormConfigMap
     */
    /**
     * Extends {@link http://backbonejs.org/#View|Backbone.View} to provide support for generic rendering techniques.
     * This module is intended to be an abstract base class for a variety of other views in the UI Core 
     * library.  Application developers will typically extend one of those subclasses instead of extending the 
     * BaseView directly. 
     * @exports nrm-ui/views/baseView
     * @borrows module:nrm-ui/models/application#formatValue as module:nrm-ui/views/baseView#formatValue
     * @borrows module:nrm-ui/views/baseView.applySelectedValue as module:nrm-ui/views/baseView#applySelectedValue
     * @borrows module:nrm-ui/views/baseView.applySelect2 as module:nrm-ui/views/baseView#applySelect2
     * @borrows module:nrm-ui/views/baseView.initLov as module:nrm-ui/views/baseView#initLov
     * @borrows module:nrm-ui/views/baseView.isInputControl as module:nrm-ui/views/baseView#isInputControl
     * @borrows module:nrm-ui/views/baseView.isSelect2 as module:nrm-ui/views/baseView#isSelect2
     * @borrows module:nrm-ui/views/baseView.isMultiSelect as module:nrm-ui/views/baseView#isMultiSelect
     * @borrows module:nrm-ui/views/baseView.mixinBusinessRule as module:nrm-ui/views/baseView#mixinBusinessRule
     * @borrows module:nrm-ui/views/baseView.mixinBusinessRules as module:nrm-ui/views/baseView#mixinBusinessRules
     * @borrows module:nrm-ui/views/baseView.onLovError as module:nrm-ui/views/baseView#onLovError
     * @borrows module:nrm-ui/views/baseView.setControlEnabled as module:nrm-ui/views/baseView#setControlEnabled
     * @borrows module:nrm-ui/views/baseView.setEditable as module:nrm-ui/views/baseView#setEditable
     * @borrows module:nrm-ui/views/baseView.setItemsEnabled as module:nrm-ui/views/baseView#setItemsEnabled
     * @borrows module:nrm-ui/views/baseView.setReadOnly as module:nrm-ui/views/baseView#setReadOnly
     * @borrows module:nrm-ui/views/baseView.setValueLoading as module:nrm-ui/views/baseView#setValueLoading
     * @borrows module:nrm-ui/views/baseView.setControlHidden as module:nrm-ui/views/baseView#setControlHidden
     * @borrows module:nrm-ui/views/panelView.renderPanel as module:nrm-ui/views/baseView#renderPanel
     * @borrows module:nrm-ui/views/panelView.tabSelected as module:nrm-ui/views/baseView#tabSelected
     */
    var BaseView = Nrm.Views.BaseView = Backbone.View.extend(/** @lends module:nrm-ui/views/baseView.prototype */{
        /**
         * Overrides {@link http://backbonejs.org/#View-remove|Backbone.View#remove} to trigger an event and call the 
         * {@link module:nrm-ui/views/baseView#onRemove} function which is intended to be overriden by derived classes.
         * @returns {module:nrm-ui/views/baseView}
         * Returns this instance to allow chaining.
         */
        remove: function() {
            /**
             * Indicates whether the view has been removed.
             * @name module:nrm-ui/views/baseView#removed
             * @type {Boolean}
             */
            this.removed = true;
            Backbone.View.prototype.remove.apply(this, arguments);
            try {
                this.destroyControls();
                this.onRemove();
                this.trigger("remove", this);
            } catch (error) {
                console.log("Error on remove: " + error);
            }
            return this;
        },
        /**
         * Recursively destroy all configured controls
         * @returns {undefined}
         */
        destroyControls: function() {
            if (this.config && this.config.controls) {
                _.each(this.config.controls, function(ctrl) {
                    this.destroyControl(ctrl);
                }, this);
            }  
        },
        /**
         * Destroy a control, then recursively destroy all of its child controls.
         * @param {module:nrm-ui/views/baseView~ControlConfig} c The control to destroy.
         * @returns {undefined}
         */
        destroyControl: function(c) {
            if (c.nrmDataTable) {
                c.nrmDataTable.fnDestroy();
                c.nrmDataTable = null;
            }
            if (c.controls) {
                _.each(c.controls, function(ctrl) {
                    this.destroyControl(ctrl);
                }, this);
            }
            function removeChildView(control) {
                if (control.view instanceof Backbone.View) {
                    var ctor = control.view.constructor;
                    this.stopListening(control.view);
                    control.view.remove();
                    control.view = ctor;
                } else if (control.view && _.isFunction(control.view.reject)) {
                    control.view.reject();
                }
            }
            removeChildView.call(this, c);
            if (c.tabs) {
                _.each(c.tabs, removeChildView, this);
            }
        },
        /**
         * Called when the view is removed, the no-op implementation defined here is intended to be overridden if 
         * derived classes need to customize the behavior of the remove function
         * @returns {undefined}
         * @see {@link module:nrm-ui/views/baseView#remove}
         */
        onRemove: function() { },
        /**
         * Provides a hook that can be called at the end of the initialize function in a derived class that is intended
         * to be extended further. This is a convenience feature, to avoid having to override initialize in the 
         * subclass and call the base implementation from the override.
         * @returns {undefined}
         */
        customInitialize: function() { },
        /**
         * Renders the view after any prerequisite asynchronous processing is complete, and only if the view was not
         * removed before the asynchronous processing completes.
         * @returns {external:module:jquery~Promise}
         * Returns a promise that is resolved or rejected when the asynchronous processing suceeds or fails.
         */
        renderDeferred: function() {
            this.removed = false;
            var self = this;
            return $.when(this.loading).done(function() {
                if (!self.removed)
                    self.renderAndFocus();
            }).fail(function(error, response, options) {
                self.onFail(error, response, options);
            });
        },
        /**
         * Displays an error if the view was unable to complete asynchronous loading.
         * @param {*} error Arbitrary data which might vary depending on the kind of error.
         * @param {external:module:jquery.jqXHR|string|Error} [response] The response object that produced the error
         * or something equivalent for client-side errors.
         * @param {Object} [options] Additional options.
         * @returns {undefined}
         */
        onFail: function(error, response, options) {
            //var template = Handlebars.templates["error"];
            response = error.response || response || { };
            if (response.statusText !== "abort") {
                var title = (this.config && this.config.title) || this.title || "item";
                var html = errorTemplate({ 
                    error: Nrm.app.normalizeErrorInfo( "Unable to retrieve the requested " + title + ".", 
                            error, response, options)
                });
                this.$el.html(Nrm.app.formatErrorHtml(html, true));
            }
        },
        onLovError: function(ctx, data, response) {
            return BaseView.onLovError.apply(this, arguments);
        },
        /**
         * Render the view, then set focus either to the originally focused element or the default focus element in the
         * view, but only if the current active element is contained in the view.
         * @param {Object} [options]
         * @param {boolean} [options.restore=true] Indicates whether we should try to restore focus to the previously
         * focused element after rendering.
         * @returns {module:nrm-ui/views/baseView}
         * This instance to allow chaining.
         */
        renderAndFocus: function(options) {
            this.recordFocus(options).render();
            return this.restoreFocus(options);
        },
        /**
         * Records the id of the current active element if it is contained by this view.
         * @param {Object} [options]
         * @param {boolean} [options.restore=true] Indicates whether we should try to restore focus to the previously
         * focused element after rendering.
         * @returns {module:nrm-ui/views/baseView}
         * This instance to allow chaining.
         */
        recordFocus: function(options) {
            if (document.activeElement && $.contains(this.el, document.activeElement)) {
                // Set this.activeElement to true if view contains the active element and options.restore is false 
                // or active element has no id, this indicates that setFocus should be called after rendering.
                // Otherwise, set this.activeElement to the id of the active element to be restored after rendering.
                /**
                 * Id of the previously active element, or boolean indicator of whether we
                 * should restore focus.
                 * @name module:nrm-ui/views/baseView#activeElement
                 * @type {string|Boolean}
                 */
                this.activeElement = (options && options.restore === false) || document.activeElement.id || true;
            } else {
                // If the active element is outside the view, unset this.activeElement so it will not restore focus
                delete this.activeElement;
            }
            return this;
        },
        /**
         * Restores the focus based on information recorded in 
         * {@link module:nrm-ui/views/baseView#recordFocus|recordFocus method}
         * @returns {module:nrm-ui/views/baseView}
         * This instance to allow chaining.
         */
        restoreFocus: function() {
            if (this.activeElement) {
                if (this.activeElement !== true) {
                    // assume this.activeElement is an element id, try to set focus the element matching that id.
                   $("#" + this.activeElement, this.$el).focus();
                }
                // if resetting focus didn't work or this.activeElement was set to true, call the setFocus method.
                if (!document.activeElement || !$.contains(this.el, document.activeElement)) {
                    this.setFocus();
                }
            }
            return this;
        },
        /**
         * Set focus to the default focusable element in the view, typically the first focusable field.  The base
         * implementation does nothing, it is up to derived views to implement.
         * @returns {module:nrm-ui/views/baseView}
         * Returns this instance to allow chaining.
         */
        setFocus: function() { 
            var el = this.getFocusElement();
            if (el && el.length) {
                el.focus();
            }
            return this;
        },        
        /**
         * Get the default focus element.
         * @returns {external:module:jquery}
         * Returns a JQuery object representing the element that should capture focus when the view is focused 
         * programmatically.  May be null if the view does not support programmatic focus.
         */
        getFocusElement: function() {
            return $(Nrm.getFocusableSelector(), this.$el).first();
        },
        /**
         * Default event hash to delegate events if it is not overriden. Note that even if most views will 
         * override this property, they will most likely want to include the default events, but be careful
         * not to extend this object directly, for example:
         * <br><br>
         * <strong>Bad:</strong>
         * <pre><code>
         * define(['nrm-ui/views/baseView', 'jquery'], function(BaseView, $) {
         *    return BaseView.extend({
         *      events: $.extend(BaseView.prototype.events, {
         *         'event selector': 'method'
         *      })
         *    });
         * });
         * </code></pre>
         * <strong>Good:</strong>
         * <pre><code>
         * define(['nrm-ui/views/baseView', 'jquery'], function(BaseView, $) {
         *    return BaseView.extend({
         *      // start with empty object so that we are not modifying BaseView.prototype.events
         *      events: $.extend({ }, BaseView.prototype.events, {
         *         'event selector': 'method'
         *      })
         *    });
         * });
         * </code></pre>
         * @type {Object}
         */
        events: { 
            "submit form": "onSubmit"
        },
        /**
         * Mixes defaults and overrides into a copy of the base object.  The base object might also be a function, in
         * which case we return a function that evaluates the base function and mixes the defaults and overrides into
         * the return vale of the base function.
         * @param {Object|Function} base Base object or function to extend
         * @param {Object} [defaults] Default properties to use if they are not specified in base or overrides.
         * @param {Object} [overrides] Properties to override the base and default properties.
         * @param {Function} [callback] A callback function for further processing after the mixing occurs.
         * @returns {Object|Function}
         * Returns a copy of the base object, or a function wrapping the base function.
         */
        mixObjectOrFunction: function(base, defaults, overrides, callback) {
            callback = callback || function(obj) { return obj; };
            if (_.isFunction(base)) {
                return function() {
                    return callback.call(this, $.extend({ }, defaults, base.apply(this, arguments), overrides));
                };
            } else {
                return callback.call(this, $.extend({ },defaults, base, overrides));
            }
        },
        /**
         * Mixes the provided defaults and overrides into this.events.
         * @param {Object} defaultEvents Default events.
         * @param {Object} overrideEvents Events to override the defaults and base events.
         * @returns {Object|Function}
         * @see {@link module:nrm-ui/views/baseView#mixObjectOrFunction} for implementation details
         */
        mixEvents: function(defaultEvents, overrideEvents) {
            return this.mixObjectOrFunction(this.events, defaultEvents, overrideEvents);
        },
        /**
         * Default events hash to include in any view that uses the generic data binding solution.
         * @type {Object}
         */
        changeEvents: { 
            'change select[data-nrmprop],input[data-nrmprop],textArea[data-nrmprop]' : 'onChange',
            'change div[contenteditable="true"][data-nrmprop]' : 'onChange',
            'input textArea[data-nrmprop],table[data-nrmprop] textArea' : 'onInput',
            'input input[data-nrmprop],table[data-nrmprop] input' : 'onInput',
            'click .nrm-lov-btn': 'onClickSelectModal',
            'keydown .nrm-lov-display': 'onKeyDownSelectModal'
        },
        /**
         * Event handler for the "submit" event that cancels the default action.  This is essential for any view that
         * contains a form in a single-page application, because otherwise the page refreshes, causing havoc.
         * @param {Event} e The event object.
         * @returns {Boolean} Cancel the event.
         */
        onSubmit: function(e) {
            e.preventDefault();
            return false;
        },
        /**
         * Event handler for the "input" event.  Sets the dirty state so that buttons that reflect the dirty state
         * will update immediately, but does not perform data binding because input events are sometimes triggered
         * at a high frequency while typing in a field.
         * @param {Event} e The event object.
         * @returns {undefined}
         */
        onInput: function(e) {
            this.setDirty(true);
        },
        /**
         * Hash of events that will be listened to in the 
         * {@link module:nrm-ui/views/baseView#delegateModelEvents|delegateModelEvents function}. 
         * <br>
         * When overriding this object on a view prototype that extends a subclass of BaseView, use the following 
         * pattern (replacing module id and define callback parameter name with the appropriate base module that the 
         * view needs to extend) to make a copy of the base object instead of extending it in place:
         * @example
         * define(['nrm-ui/views/editorView'], function(EditorView) {
         *     var CustomView = EditorView.extend(
         *        modelEvents: $.extend({}, EditorView.prototype.modelEvents, {
         *           // custom events go here.
         *        }),
         *        ...
         *     });
         *     return CustomView;
         * });
         * @name module:nrm-ui/views/baseView#modelEvents
         * @type {Object.<String,String|Function>}
         * @see {@link module:nrm-ui/views/baseView|delegateBackboneEvents} description of events parameter for 
         * details on the object format.
         */
        modelEvents: null,
        /**
         * Start listening to model events configured by {module:nrm-ui/views/baseView#modelEvents|modelEvents}
         * @returns {undefined}
         */
        delegateModelEvents: function() {
            this.delegateBackboneEvents(this.model, this.modelEvents);
        },
        /**
         * Add event listeners on a Backbone.Events implementation using 
         * {@link http://backbonejs.org/#Events-listenTo|Backbone.Events#listenTo}.
         * @param {external:module:backbone.Events} target The target instance, which should implement the 
         * Backbone.Events API.
         * @param {Object.<String,String|Function>} events The events hash, with keys indicating the event names, and
         * values are either a function or a string which is interpreted as the name of a function defined on the view 
         * prototype.
         * @returns {module:nrm-ui/views/baseView}
         * Returns this instance to allow chaining.
         */
        delegateBackboneEvents: function(target, events) {
            if (!_.isEmpty(events) && target) {
                _.each(events, function(evt, key) {
                    if (_.isString(evt)) {
                       events[key] = this[evt];    
                    }
                }, this);
                this.listenTo(target, events);
            }
            return this;            
        },
        /**
         * Provides default no-op implementation of a method to be called by generic render functions to start listening
         * to Backbone events, except for model events that will be hooked up with 
         * {@link module:nrm-ui/views/baseView#delegateModelEvents|delegateModelEvents method}.  Derived views may 
         * override this.  If overriding the method in a view that extends a subclass of this view instead of extending
         * BaseView directly, the recommended pattern is to call the base implementation before listening to custom
         * events, because other views may override the implementation.
         * @returns {undefined}
         */
        startListening: function() { },
        /**
         * Event handler for the "change" event. Performs data binding if the element has the "data-nrmprop" attribute,
         * and sets the dirty state.
         * @param {Event} event The event object.
         * @returns {undefined}
         */
        onChange: function(event) {
            var el = $(event.target), 
                    val, // value to set on model, may be converted from actual element value
                    bindings = this.getBindingForElement(el), // array of nested bindings, starting with current binding
                    binding, // the binding information for this control
                    dataType, // data type may be derived from data-nrmprop-type attribute, or input type attribute
                    control, // the control data, obtained from 'nrm-control' key stored with JQuery Data API.
                    tablecell, // indicates whether the control represents a cell in a table row
                    newModels, // array of new models for multiple select control bound to a Backbone collection
                    changed = false, // indicates that the value has changed even if the value reference has is the same
                    idAttr, // id attribute name if the value is a Backbone colection
                    controlVal, // value to set in the control data, may be different than the model value
                    dependencies, // selector that identifies related elements that need to be reset
                    parentSelector, // selector for parent of related elements
                    relatedEl, // related elements
                    inherited; // inherited attributes
            function wrapValues(control, value, idAttr) {
                if (!control || !value) {
                    return value;
                }
                if (_.isArray(value)) {
                    return _.map(value, function(sel) {
                        var result = wrapValue(control, sel, idAttr),
                                inherit = inheritValues.call(this, control, result, idAttr, 'object');
                        if (inherit && inherit[binding.prop]) {
                            _.extend(result, inherit[binding.prop]);
                        }
                        return result;
                    }, this);
                } else {
                    return wrapValue(control, value, idAttr);
                }
            }
            function wrapValue(control, value, idAttr) {
                idAttr = control.idAttr || idAttr || 'id';
                var result = {};
                result[idAttr] = value;
                return result;
            }
            function findModel(collection, wrappedValue, idAttr) {
                if (!idAttr || collection.model.prototype.idAttribute === idAttr) {
                    return collection.get(wrappedValue[idAttr || 'id']);
                } else {
                    return collection.find(function(model) {
                       return Nrm.app.getModelVal(model, idAttr) === wrappedValue[idAttr];
                    });
                }        
            }
            function inheritValues(control, wrappedValue, idAttr, type) {
                if (wrappedValue && control.inherit && control.ctx) {
                    var ctx, parentModel;
                    idAttr = control.idAttr || idAttr;
                    if (control.collection instanceof Backbone.Collection) {
                        parentModel = findModel(control.collection, wrappedValue, idAttr);
                    }
                    if (!parentModel && idAttr && idAttr !== 'id') {
                        parentModel = new (Backbone.Model.extend({idAttribute:idAttr}))(wrappedValue);
                    } else if (!parentModel) {
                        parentModel = new Backbone.Model(wrappedValue);
                    }
                    ctx = $.extend({}, control.parentContext || this.context || this.options.context, {
                        parent: control.ctx,
                        schema: { }
                    });
                    if (type) {
                        ctx.schema[binding.prop] = _.extend({}, control, {dataType:type});
                    } else {
                        ctx.schema[binding.prop] = control;
                    }
                    return Nrm.app.setInheritedAttributes(ctx, {}, parentModel, !this.searchType);
                }
            }
            if (bindings && bindings.length) {
                binding = bindings[0];
                control = el.data('nrm-control');
                if (el.is('input[type="checkbox"]')) {
                    dataType = el.attr('data-nrmprop-type');
                    if (_.isBoolean(binding.value) || dataType === 'boolean') {
                        val = el.prop('checked');
                    } else if (!el.prop('checked')) {
                        val = el.attr('data-falsevalue') || null;
                    } else {
                        val = el.val();
                    }
                    controlVal = val;
                } else {
                    val = el.val();
                    if (el.is('input')) {
                        dataType = el.attr('data-nrmprop-type') || el.attr('type');
                        controlVal = val = Nrm.app.formatValue(val, dataType, 'set');
                    } else if (el.is('select')) {
                        controlVal = val;
                        if (binding.value instanceof Backbone.Collection) {
                            // multi-select or "taggable" Select2 bound to a collection
                            idAttr = binding.value.model.prototype.idAttribute;
                            val = wrapValues.call(this, control, val, idAttr);
                            newModels = _.map(val || [], function(sel) {
                                var model = findModel(binding.value, sel, control.idAttr || idAttr);
                                if (!model) {
                                    model = sel;
                                }
                                return model;
                            });
                            binding.value.on('add remove', function() { changed = true; }, binding);
                            try {
                                binding.value.set(newModels, {add: true, remove: true, merge: false});
                            } finally {
                                binding.value.off(null, null, binding);
                            }
                            val = binding.value;
                        } else if (el.attr('data-nrmprop-type') === 'collection') {
                            val = wrapValues.call(this, control, val);
                        }
                    }
                }
                changed = changed || binding.value !== val;
                if (control && _.isFunction(control.valueHandler)) {
                    control.value = control.valueHandler.call(this, control, binding.prop, controlVal);
                } else if (control && control.prop === binding.prop) {
                    control.value = controlVal;
                    // in some cases, we might want to "inherit" other attributes from a selected value in an LOV.
                    if (!_.isArray(controlVal)) {
                        inherited = inheritValues.call(this, control, wrapValue(control, controlVal));
                        if (inherited && inherited[binding.prop]) {
                            val = inherited[binding.prop];
                        }
                    }
                }
                Nrm.app.setModelVal(binding.model, binding.prop, val);
                dependencies = changed && el.attr('data-nrmprop-dependencies');
                if (inherited) {
                    // set additional attributes inherited from LOV collection
                    _.each(inherited, function(value, key) {
                        if (key !== binding.prop) {
                            Nrm.app.setModelVal(binding.model, key, value);
                            var selector = '[data-nrmprop="' + key + '"]';
                            if (dependencies) {
                                dependencies += ',' + selector;
                            } else {
                                dependencies = selector;
                            }
                        }
                    }, this);
                }
                if (changed || dependencies) {
                    this.setDirty(true);
                    // ensure change notification occurs if we changed a property on a nested object.
                    _.each(bindings, function(binding) {
                        if (binding.cloned) {
                            Nrm.app.setModelVal(binding.model, binding.prop, binding.value);
                        }
                        if (binding.tablecell) {
                            tablecell = true;
                        }
                    });
                    if (dependencies) {
                        parentSelector = _.reduceRight(bindings, function(parent, binding, index) {
                            if (index === 0) {
                                return parent;
                            } else if (parent) {
                                return parent + ' ' + binding.selector;
                            } else {
                                return binding.selector;
                            }
                        }, '');
                        relatedEl = $(dependencies,  parentSelector ? $(parentSelector, this.$el) : this.$el);
                        _.each(relatedEl, function(el) {
                            this.resetBindings($(el));
                        }, this);
                    }
                    if (tablecell) {
                        // nrmDataTable uses this event to clear cached sorts
                        el.trigger('invalidate.nrm.dataTable');
                    }
                }
            }/* else {
                this.setDirty(true);
            }*/
        },
        /**
         * Handles button click event for modal search LOV control.
         * @param {Event} e
         * @returns {undefined}
         */
        onClickSelectModal: function(e) {
            require(['./modalSearchView'], _.bind(function(ModalSearchView) {
                ModalSearchView.showModalSearchView(this, $(e.currentTarget));
            }, this));
        },
        /**
         * Handles enter key event for modal search LOV control.
         * @param {Event} e
         * @returns {undefined}
         */
        onKeyDownSelectModal: function(e) {
            if (e.which === 13) {
                require(['./modalSearchView'], _.bind(function(ModalSearchView) {
                    ModalSearchView.showModalSearchView(this,  $(e.target));
                }, this));
                e.stopPropagation();
                e.preventDefault();
            }
        },
        /**
         * Sets the dirty state, triggers "dirtyChanged" if the state changes.
         * @param {boolean} isDirty New dirty state
         * @returns {undefined}
         */
        setDirty: function(isDirty) {
           var initDirty = this.dirty || false;
           this.dirty = isDirty;
           if (this.dirty !== initDirty) {
               this.trigger("dirtyChanged", this);
           }
        },
        /**
         * Current dirty state indicating whether the form has unsaved changes.
         * @returns {Boolean} Indicates whether the form is dirty.
         */
        isDirty: function() {
            //return this.model && this.model.hasChanged();
            return this.dirty;
        },
        /**
         * Recursively bind data from the model to an array of control configuration objects in preparation for generic
         * rendering.
         * @param {module:nrm-ui/views/baseView~ControlConfig[]} controls List of control configuration objects.
         * @param {external:module:backbone.Model} model The Backbone model.
         * @returns {undefined}
         */
        bindAllData: function(controls, model) {
            if (controls && controls.length) {
                    for (var i = 0; i < controls.length; i++) {
                        this.bindData(controls[i], model);
                    }
            }
        },
        isSelect2: function(el, c) {
            return BaseView.isSelect2.apply(this, arguments);
        },
        isMultiSelect: function(c) {
           return BaseView.isMultiSelect.apply(this, arguments);
        },
        /**
         * Bind data from the model to the control configuration in preparation for generic rendering. Also recursively
         * binds child controls.
         * @param {module:nrm-ui/views/baseView~ControlConfig} c Control configuration
         * @param {external:module:backbone.Model} model The Backbone model, note that the model reference passed to
         * this function might be different than this.model if we are binding edit controls in an editable data table.
         * @returns {module:nrm-ui/views/baseView~ControlConfig}
         * Returns the control configuration.
         */
        bindData: function(c, model) {            
            function unwrapValues(prop, value) {
                if (_.isArray(value)) {
                    return _.map(value, _.partial(unwrapValue, prop));
                } else if (value instanceof Backbone.Collection) {
                    return value.map(_.partial(unwrapValue, prop));
                } else {
                    return unwrapValue(prop, value);
                }
            }
            function unwrapValue(prop, value) {
                if ($.type(value) === 'object') {
                    return Nrm.app.getModelVal(value, prop);
                } else {
                    return value;
                }
            }
            function bindRecursive(controls, model, path) {
                if (path) {
                    _.each(controls, function(control) {
                        control.path = path;
                    });
                }
                this.bindAllData(controls, model);
            }
            function bindDependentLov(options) {
                c.loading = true;
                var async = true, 
                        result = $.when(this.initLov(c, c.ctx, this.initLovCallback, function(data, response) {
                            async = false;
                            c.error = true;
                            this.onLovError(c.ctx, data, response);
                        }, options)).done(function() {
                            async = false;
                        });
                if (async && !valueLoading && (c.optgroups || c.options || []).length > 0) {
                    valueLoading = $.when(result).done(function() {
                        if (afterLoad) {
                            // clear loading indicator
                            afterLoad(false);
                        } else {
                            valueLoading = false;
                        }
                    });
                }
            }
            var collectionLoading, afterLoad,
                isCollection = this.isCollectionControl(c),
                propValue, btn, dataType, idAttr, dependentLovIdx = -1, dependentLovFk, valueLoading, modelLoading,
                loadFromContext = _.bind(function(context) {
                    var async = true;
                    function onFail() {
                        if (collectionLoading) {
                            collectionLoading.reject.apply(collectionLoading, arguments);
                        }
                    }
                    $.when(modelLoading || propValue).done(_.bind(function(resolved){
                        if (resolved && (resolved.models || c.dataType === "array")) {
                            if (collectionLoading) {
                                collectionLoading.resolve(resolved);
                                collectionLoading = false;
                            }
                            async = false;
                            return;
                        }
                        var path = this.options.path,
                            localCtx = $.extend({}, context, {
                                apiKey: c.prop || context.apiKey,
                                //refType: apiKey,
                                loadType: "auto",
                                parent: context.parent || c.parentContext || this.context || this.options.context || {}
                            });
                        if (!localCtx.idAttr && c.idAttr) {
                            localCtx.idAttr = c.idAttr;
                        }
                        if (!localCtx.nameAttr && c.nameAttr) {
                            localCtx.nameAttr = c.nameAttr;
                        }
                        if (_.isString(c.path)) {
                            // nested model...
                            path = (path && c.path.replace(/^\./, path)) | c.path;
                        }
                        $.when(Nrm.app.getCollection(localCtx, {
                            model: model,
                            attr: localCtx.apiKey,
                            immediate: true,
                            ajax: {global: false},
                            path: path && (path + "/" + localCtx.apiKey)
                        }, this)).done(function(collection){
                            async = false;
                            propValue = collection;
                            if (collectionLoading) {
                                collectionLoading.resolve(collection);
                                collectionLoading = false;
                            }
                        }).fail(onFail);
                    }, this)).fail(onFail);
                    if (async && !collectionLoading) {
                        collectionLoading = $.Deferred();
                    }
                }, this);
            function initValue(model) {
                propValue = Nrm.app.getModelVal(model, c.prop);
                if (model && model.loading) {
                    modelLoading = $.Deferred();
                }
                if (isCollection) {
                    if (c.ctx) {
                        loadFromContext(c.ctx);
                    } else {
                        // context needs to be loaded before we can load the collection
                        if (!collectionLoading) {
                            collectionLoading = $.Deferred();
                        }
                        $.when(Nrm.app.getContext({apiKey: c.refType || c.prop})).done(function(context){
                            c.ctx = context;
                            loadFromContext(context);
                        }).fail(collectionLoading.reject);
                    }
                    if (collectionLoading && !valueLoading) {
                        valueLoading = collectionLoading.promise();
                    }
                }
                if (modelLoading) {
                    if (!valueLoading) {
                        valueLoading = modelLoading.promise();
                    }
                    $.when(model.loading).done(function() {
                        propValue = Nrm.app.getModelVal(model, c.prop);
                        modelLoading.resolve(propValue);
                        modelLoading = false;
                    });
                } else if (!valueLoading && propValue && propValue.loading) {
                    valueLoading = propValue.loading;
                }
                return propValue;
            }
            if (c && model) {
                if (c.prop) {
                    if (_.isString(c.nested)) {
                        // supports one level of nested objects.
                        model = Nrm.app.getModelVal(model, c.nested) || {};
                        c.path = (c.path || '.') + '/' + c.nested;
                    }
                    if (_.isFunction(model.promise)) {
                        // model may be loaded asynchronously...
                        modelLoading = $.Deferred();
                        if (isCollection) {
                            collectionLoading = $.Deferred();
                            valueLoading = collectionLoading.promise();
                        } else {
                            valueLoading = modelLoading.promise();
                        }
                        $.when(model).done(function(asyncModel) {
                            model = asyncModel;
                            if (asyncModel.loading) {
                                $.when(asyncModel.loading).done(modelLoading.resolve(initValue(asyncModel)));
                            } else {
                                modelLoading.resolve(initValue(asyncModel));
                            }
                            modelLoading = false;
                        });
                    } else {
                        initValue(model);
                    }
                    if (valueLoading) {
                        $.when(valueLoading).done(_.bind(function(value, resolved) {
                            value = value || resolved;
                            function finishLoading() {
                                if (afterLoad) {
                                    // clear loading indicator and reset bindings
                                    afterLoad(true);
                                } else {
                                    valueLoading = false;
                                }
                            }
                            if (!value || !value.loading) { // || value.loading === valueLoading) {
                                // reset now
                                finishLoading();
                            } else {
                                // reset later
                                valueLoading = c.valueLoading = value.loading;
                                $.when(value.loading).done(function() {
                                    setTimeout(finishLoading);
                                });
                            }
                        }, this, propValue));
                    }
                    dataType = c.dataType || $.type(propValue);
                    if (collectionLoading) {
                        propValue = collectionLoading.promise();
                    }
                    
                    if (c.nameAttr) {
                        if (dataType === 'object' || _.isArray(propValue)) {
                            c.displayValue = unwrapValues(c.nameAttr, propValue);
                        } else {
                            c.displayValue = Nrm.app.formatValue(Nrm.app.getModelVal(model, c.nameAttr), c.dataType, "");
                        }
                    }
                    if (c.lov) {
                        idAttr = BaseView.getIdAttributeName(c, c.ctx, propValue);
                        propValue = unwrapValues(idAttr, propValue);
                    } else {
                        switch (c.type) {
                            case 'inputDate':
                            case 'inputDateTime':
                                if ($.isNumeric(propValue)) {
                                    propValue = new Date(propValue).toISOString();
                                }
                                if (_.isString(propValue) && c.type === 'inputDate') {
                                    propValue = propValue.substring(0, 10);
                                }
                                break;
                            case 'checkbox':
                                c.checked = _.isBoolean(propValue) ? propValue : (propValue === c.trueVal);
                                break;
                            default:
                                break;
                        }
                    }
                    c.value = propValue;
                    if (c.controls) {
                        if (dataType === 'object') {
                            bindRecursive.call(this, c.controls, propValue, (c.path || '.') + '/' + c.prop);
                        } else {
                            bindRecursive.call(this, c.controls, model, c.path);
                        }
                    }
                } else if (c.controls) {
                    bindRecursive.call(this, c.controls, model, c.path);
                }
                
                if (_.isString(c.lov)) {
                    dependentLovIdx = c.lov.indexOf(".");
                }
                if (dependentLovIdx === 0) {
                    // load child collection from model...
                    bindDependentLov.call(this, {
                        model: model,
                        path: (c.path || '.') + '/' + c.ctx.apiKey                       
                    });
                } else if (dependentLovIdx > 0) {
                    // dependent lov as child of another attribute...
                    dependentLovFk = Nrm.app.getModelVal(model, c.lov.substr(0, dependentLovIdx));
                    idAttr = BaseView.getIdAttributeName(c, c.ctx.parent, dependentLovFk);
                    dependentLovFk = unwrapValues(idAttr, dependentLovFk);
                    if (c.parentValue !== dependentLovFk) {
                        c.parentValue = dependentLovFk;
                        bindDependentLov.call(this, {
                            modelId: c.parentValue,
                            path: c.ctx.parent.refType + '/' + c.parentValue + '/' + c.ctx.apiKey                     
                        });
                    }
                }
                
                if (valueLoading) {
                    c.valueLoading = valueLoading;
                    afterLoad = _.bind(function(reset) {
                        if (c.valueLoading === valueLoading) {
                            c.valueLoading = false;
                            var loadedEl = $('#' + c.id, this.$el);
                            if (loadedEl.length) {
                                this.setValueLoading(loadedEl, false);
                                if (reset) {
                                    this.resetBindings(loadedEl);
                                }
                            }
                        }
                        valueLoading = false;
                    }, this);
                }
                
                var btn = c.items ? c : c.btn;
                if (btn && btn.items && btn.items !== true) {
                    bindRecursive.call(this, btn.items, model, c.path);
                }
                if (this.readonly) {
                    this.setReadOnly(c);
                } else if (c.inherited) { //Nrm.app.isInheritedAttribute(this.context, c, true)) {
                    this.setReadOnly(c);
                } 
                this.applySelectedValue(c);
                this.mixinBusinessRules(c, model);

                if (c.required) {
                     c.labelClass = BaseView.addClassName(c.labelClass, "nrm-required-field");
                     c.title = BaseView.formatRequiredFieldTitle(c.title);
                }

                if(c.type === 'select') {
                    // LW: As per artf60928, we always want a default placeholder to be displayed.
                    // If the developer provides it, we use that one. Otherwise we create assemble the default.
                    // This means that the code for providing a "pluginOpt" inside the control is always overridden if 
                    // control.ctx is set.
                    // START SET DEFAULTS
//                    function isVowel(x){
//                        var argument = x.toLowerCase();
//                        var vowels = (['a', 'e', 'i', 'o', 'u']);
//                        for (var i = 0; i <= vowels.length; i++){
//                            if (argument !== vowels[i]) {
//                                continue;
//                            }
//                            return true;
//                        }
//                        return false;
//                    }
                    if (!c.placeholder) {
                        // LW: Provide the placeholder if there is none, as long as the context is available
                        //if (c.ctx) {
                            //var caption = (!c.multiple) ? c.ctx.alias : c.ctx.caption;
                            //var firstChar = caption.charAt(0);
                            if (!c.multiple) {
                                //c.placeholder = "Select " + ((isVowel(firstChar)) ? "an" : "a") + " " + caption;
                                c.placeholder = "Select one";
                            } else {
                                //c.placeholder = "Select One or More " + caption;
                                c.placeholder = "Select one or more";
                            }
                        //}
                    }
                    // END SET DEFAULTS                   
                }
            }
            return c;
        },
        mixinBusinessRules: function(c, model) {
            return BaseView.mixinBusinessRules.apply(this, arguments);
        },
        mixinBusinessRule: function(c, model, rule) {
            return BaseView.mixinBusinessRule.apply(this, arguments);
        },
        /**
         * Conditionally set an element required if dependent value changes after rendering.
         * @param {string|external:module:jquery} selector JQuery selector string or JQuery object
         * @param {Boolean} req Is the field required
         * @param {Boolean} disable Should the field be disabled when it is not required.
         * @returns {external:module:jquery} The JQuery object returned from the selector.
         */
        conditionalRequirementChanged: function(selector, req, disable) {
            var self = this;            
            return $(selector, this.$el).each(function() {
                var $sel = $(this).prop("required", req), title = $sel.attr('title'); 
                if (disable) {
                    self.setControlEnabled($sel, req);
                }
                var $label = self.getLabelForElement($sel);
                if (!$label) {
                    return;
                }
                if (req) {
                    $label.addClass("nrm-required-field");
                    $sel.attr('title', BaseView.formatRequiredFieldTitle(title));
                    if ($sel.is('.ui-state-error:invalid') && !$sel.is('.select2-offscreen')) {
                        // use CSS :invalid pseudo class for styling unless it is a Select2 element
                        $sel.removeClass('ui-state-error');
                    }
                }
                else {
                    $label.removeClass("nrm-required-field");
                    if (title === 'Required field') {
                        $sel.removeAttr(title);
                    } else if (title) {
                        $sel.attr('title', title.replace(/^REQUIRED: /, ''));
                    }
                }
            });
        },
        /**
         * Get the collection bound to a data table.
         * @param {external:module:jquery} $table A JQuery element representing the data table
         * @param {module:nrm-ui/views/baseView~ControlConfig} [control] Control configuration which can be used
         * to identify the collection property name if it cannot be determined from the "data-nrmprop" attribute on the
         * element.
         * @returns {external:module:backbone.Collection} The collection or undefined if we couldn't figure it out.
         */
        getCollectionForTable: function($table, control) {
            var collProp, coll;
            control = $table.data('nrm-control') || control;
            coll = control && control.value;
            if (coll instanceof Backbone.Collection) {
                // should be true most of the time
                return coll;
            } else if (_.isArray(coll) && $table.attr('data-nrmprop-type') === 'array') {
                return coll;
            }
            // TODO: now that we are using JQuery Data API to store reference to the control, perhaps we can remove this
            // code which was the old way of doing things...
            var collProp = ($table && $table.attr('data-nrmprop')) || (control && control.prop);
            var coll = collProp && this.model && 
                    ((this.model.collections && this.model.collections[collProp]) || 
                    Nrm.app.getModelVal(this.model, collProp));
            if (!coll) {
                console.error('Failed to retrieve ' + collProp + ' collection');
            }
            return coll;
        },
        /**
         * Get the model bound to a table row.
         * @param {external:module:jquery} $target A JQuery object representing the table row.
         * @returns {external:module:backbone.Model} The model or undefined if it couldn't be determined.
         */
        getModelForTableRow: function($target) {
            var coll = this.getCollectionForTable($target.closest('table')), $tr, id, model;
            if (!coll) {
                return null;
            }
            $tr = $target.closest('tr');
            id = $tr.attr('data-nrm-rowid');
            if (!id) {
                console.error('Failed to retrieve row ID');
                return null;
            }
            if (coll instanceof Backbone.Collection) {
                model = coll.get(id);
            } else if (_.isArray(coll)) {
                // unusual case, assuming 'id' is the id attribute name for now
                model = _.find(coll, function(model) {
                    return model.id === id;
                });
            }
            if (!model)  {
                console.error('Failed to retrieve model with ID ' + id);
            }
            return model;
        },
        /**
         * Add a new model to the collection.
         * @param {external:module:jquery} $table A JQuery element representing the data table
         * @param {Object} [attributes] Attributes to set on the new model.
         * @returns {external:module:backbone.Model}
         * The model that was added
         */
        addNewItem: function($table, attributes) {
            var coll = this.getCollectionForTable($table);
            if (!coll) {
                return null;
            }
            var newModel = new coll.model(attributes);
            var control = $table.data('nrm-control'),
                parentModel,
                bindings = control.ctx && this.getBindingForElement($table);
            if (bindings && bindings.length) {
                parentModel = bindings[0].model;
                if (parentModel) {
                    Nrm.app.setInheritedAttributes(control.ctx, newModel, parentModel, true);
                }
            }
            
            coll.add(newModel);
            this.setDirty(true);
            return newModel;
        },
        /**
         * Delete the child model associated with a table row. 
         * @param {Event} event The event data.  The event target must be a table row or element contained by a table
         * row so that we can determine the model from the table row.
         * @param {Object} [options] Additional options to pass to the "app:modal" event.
         * @param {String|Boolean} [options.prompt] Message to display in modal prompt to override the default prompt, 
         * or pass false to disable the default prompt.  The message will be displayed as unescaped HTML content. 
         * @returns {undefined}
         */
        deleteChild: function(event, options) {
            event.preventDefault();
            var prompt = options && options.prompt, model = this.getModelForTableRow($(event.target)), 
                    deleteCallback = _.bind(function() {
                        if (!model.isNew()) {
                            this.setDirty(true);
                        }
                        model.collection.remove(model);
                    }, this);
            if (!model) {
                return;
            }
            if (prompt === false) {
                deleteCallback();
            } else {
                if (!prompt) {
                    prompt = '<p>Are you sure you want to delete this row?</p>';
                    if (!model.isNew()) {
                        prompt = '<p>The selected row will be deleted when the form is saved.</p>' + prompt;
                    }
                }
                Nrm.event.trigger("app:modal", $.extend(_.omit(options || {}, 'prompt'), { 
                    buttons: 2,
                    caption: "Confirm Delete", 
                    content: prompt,
                    callback: function() {
                        var doIt = this.clicked === 0;
                        if (doIt) {
                            deleteCallback();
                        }
                    }
                }));
            }
        },
        /**
         * Represents binding information for an element.
         * @typedef {Object} module:nrm-ui/views/baseView~BindingInfo
         * @property {external:module:backbone.Model|external:module:backbone.Collection|Object} model The target model 
         * or collection for the binding.
         * @property {*} value The value of the binding property.
         * @property {boolean} tablecell Indicates that the binding represents a element in a collection instead of a
         * property on a model.
         * @property {string} prop The property name, defined if tablecell is false.
         * @property {string} id The id of the element in the collection, defined if tablecell is true.
         * @property {external:module:jquery} $el The element as a JQuery object.
         * @property {string} selector JQuery selector for the element.
         */
        /**
         * Get binding information for an element.
         * @param {external:module:jquery} $target A JQuery object representing the bound element.
         * @returns {Array.<module:nrm-ui/views/baseView~BindingInfo>} List of binding info, starting with the target 
         * property with subsequent items representing the parent bindings up to the model associated with the view.  
         * The list will be empty if the element does not have the 'data-nrmprop' attribute.
         */
        getBindingForElement: function($target) {
            var model = this.model, hierarchy = [], prop = $target.attr('data-nrmprop'), nested;
            if (prop && model) {
                nested = $target.parentsUntil(this.$el, '[data-nrmprop],[data-nrm-rowid]').get().reverse();
                _.each(nested, function(el) {
                    var $parent = $(el), childModel, parentProp, dataType, entry;
                    parentProp = $parent.attr('data-nrmprop');
                    if (parentProp) {
                        childModel = Nrm.app.getModelVal(model, parentProp);
                        dataType = $parent.attr('data-nrmprop-type') || $.type(childModel);
                        if (dataType === 'object') {
                            entry = {
                                tablecell: false,
                                model: model,
                                prop: parentProp,
                                $el: $parent,
                                selector: '[data-nrmprop="' + parentProp + '"]'
                            };
                            if (childModel && _.isFunction(childModel.promise)) {
                                // attribute resolved as a JQuery promise, not ideal but result should be synchronous here.
                                $.when(childModel).done(function(value) {
                                    childModel = value;
                                });
                            }
                            if (childModel instanceof Backbone.Collection || childModel instanceof Backbone.Model) {
                                // assume the parent model will propagate nested collection or model events if needed.
                                entry.value = (model = childModel);
                            } else {
                                // clone existing object to trigger change event
                                entry.value = (model = $.extend({}, childModel));
                                entry.cloned = true;
                            }
                            // record arguments to pass to Nrm.app.setModelVal
                            hierarchy.unshift(entry);
                        }
                    } else {
                        parentProp = $parent.attr('data-nrm-rowid');
                        if (parentProp) {
                            entry = {
                                tablecell: true,
                                model: model,
                                id: parentProp,
                                $el: $parent,
                                selector: '[data-nrm-rowid="' + parentProp + '"]'
                            };
                            entry.value = (model = this.getModelForTableRow($parent));
                            hierarchy.unshift(entry);
                        }
                    }
                }, this);
                hierarchy.unshift({
                    tablecell: false,
                    model: model,
                    prop: prop,
                    value: Nrm.app.getModelVal(model, prop),
                    $el: $target,
                    selector: '[data-nrmprop="' + prop + '"]'
                });
            }
            return hierarchy;
        },
        applySelectedValue: function(c, opt) {
            return BaseView.applySelectedValue.apply(this, arguments);
        },
        /**
         * Recursively apply plugins and/or any other dynamic DOM manipulation after rendering the controls.
         * @param {external:module:jquery} parent The parent element that contains all of the controls.
         * @param {module:nrm-ui/views/baseView~ControlConfig[]} controls List of control configuration objects.
         * @param {Function} [eachCallback] optional callback function that will be called for each control.
         * @returns {undefined}
         */
        applyPlugins: function(parent, controls, eachCallback) {
            if (controls) {
                 for (var i = 0; i < controls.length; i++) {
                    this.applyPlugin(parent, controls[i], eachCallback);
                }                   
            }
        },
        applySelect2: function(el, control, parent) { 
            return BaseView.applySelect2.call(this, el, control, parent || this.$el);
        },
        /**
         * Applies plugin and/or any other dynamic DOM manipulation after rendering the controls.  Also recursively
         * applies plugins to child controls.
         * @param {external:module:jquery} parent The parent element that contains the control.
         * @param {module:nrm-ui/views/baseView~ControlConfig} c The control configuration.
         * @param {Function} [callback] optional callback function that will be called after applying the plugin.
         * @returns {external:module:jquery}
         * The JQuery element associated with the control
         */
        applyPlugin: function(parent, c, callback) {
            var el, bindEl, displaySelector, $display, displayId, val, apiKey, btn, itemsParent, depsSelector;
            if (parent && c) {
                // originally there was some confusion between "pluginOpts" and "pluginOpt"
                // while "pluginOpt" is now deprecated in favor of "pluginOpts", this will help ease the transition.
                if (c.pluginOpt && !c.pluginOpts) {
                    c.pluginOpts = c.pluginOpt;
                }
                el = $('#' + c.id, parent);
                if (el.length) {
                    el.data('nrm-control', c);
                    itemsParent = el.parent();
                    // if it is not a container control, check for elements rendered with data-nrmprop
                    bindEl = !c.controls && !c.fields && $('[data-nrmprop]', el).filter(function(i, candidate) {
                        // don't overwrite existing control data
                        return !$(candidate).data('nrm-control');
                    });
                    if (bindEl && bindEl.length) {
                        // if the data-nrmprop has already been added to a child element in the template, associate the 
                        // control with the existing elements and do not set it on the outer element.
                        bindEl.data('nrm-control', c);
                    } else if (c.prop) {
                        if (c.type === 'radio') {
                            bindEl = el.find('input[type="radio"]');
                            bindEl.data('nrm-control', c);
                        } else {
                            bindEl = el;
                        }
                        bindEl.attr('data-nrmprop', c.prop);
                        if (c.dataType) {
                            // extended type information may be useful in onChange.
                            bindEl.attr('data-nrmprop-type', c.dataType);
                        }
                    }
                    depsSelector = c.dependencies;
                    if (_.isArray(depsSelector)) {
                        // dependencies are a list of related properties...
                        depsSelector = _.reduce(depsSelector, function(memo, dep) {
                            var selector = '[data-nrmprop="' + dep + '"]'; 
                            if (memo) {
                                return memo + ',' + selector;
                            } else {
                                return selector;
                            }
                        }, '');
                    }
                    if (depsSelector) {
                        bindEl.attr('data-nrmprop-dependencies', depsSelector);
                    }
                    if (_.isString(c.nested)) {
                        // supports one level of nested objects.
                        el.parent().attr({
                            'data-nrmprop': c.nested, 
                            'data-nrmprop-type': 'object'
                        });
                    }
                    if (c.inherited) { //Nrm.app.isInheritedAttribute(this.context, c, true)) {
                        el.removeClass('nrm-enable-new nrm-enable-changed nrm-disable-new');
                    }

                    if (c.valueLoading) {
                        this.setValueLoading(el, true, { size: 'small' });
                    }
                    
                    if (c.hidden) {
                        this.setControlHidden(el, true, c.hiddenClass);
                    }
                    
                    if ((c.config || c.view) && el.is('.collapse.in')) {
                        // expanded collapsible panel with child view...
                        this.renderPanel(c, el);
                    }

                    if (_.isString(c.style)) {
                        el.attr('style', c.style);
                    } else if (_.isObject(c.style)) {
                        el.css(c.style);
                    }

                    if (this.isSelect2(el, c)) {
                        this.applySelect2(el, c);
                    } else if (c.type === 'selectModal') {
                        displaySelector = el.attr('data-target-display');
                        $display = displaySelector && $(displaySelector, parent);
                        if ($display) {
                            displayId = $display.attr('id');
                            if (displayId) {
                                // fix incorrect label association, there is probably a better way to do this.
                                this.getLabelForElement(el, parent).attr('for', $display.attr('id'));
                            }
                            if (c.nameAttr) {
                                $display.attr('data-nrmprop', c.nameAttr);
                            }
                        }
                    } else if (c.type === 'shuttle') {
                        require(['../plugins/nrm-shuttle'], function() {

                        });
                    } else if (c.type === 'textArea') {
                        if (c.btn) {
                            require(['../plugins/nrmTextAreaButton'], function() {
                                // plugin is applied to the button, not the textarea
                                var $btn = $('[data-target="#' + c.id + '"]', parent);
                                var opts = c.pluginOpts || { };
                                if (c.richText) {
                                    _.defaults(opts, { title: c.label });
                                }
                                opts.richText = !!c.richText;
                                $btn.nrmTextAreaButton(opts);
                            });
                        } else {
                            require(['../plugins/nrmTextArea'], function() {
                                el.nrmTextArea();
                            });
                        }
                    } else if (c.type === 'inputNum') {
                        _.each(['min', 'max'], function(attr) {
                            // work-around for Handlebars {{#if}} helper testing false for value of 0
                           if (c[attr] === 0) el.attr(attr, '0');
                        });
                    } else if (c.type === 'inputDate') {
                        require(['../plugins/nrmDatePicker'], function() {
                            el.nrmDatePicker(c.pluginOpts || {});
                        });
        //                if (!Modernizr.inputtypes.date) {
        //                    var val = el.val();
        //                    if (val) el.val(Nrm.app.formatValue(val, "date", "display"));
        //                    require(['use!datepicker'], function() {
        //                        //if (!c.readonly)
        //                            el.datepicker({ format: 'mm/dd/yyyy', enableOnReadonly: false });
        //                    });
        //                }
                    } else if (c.type === 'inputDateTime') {
                        // This control type is not recommended for editable date/time, standard is to use separate fields
                        // May be acceptable for readonly fields.
                        if (!Modernizr.inputtypes['datetime-local']) {
                           val = el.val();
                           if (val) el.val(Nrm.app.formatValue(val, 'datetime-local', 'display'));    
                        }
                    } else if (c.type === 'btn' && c.items) {
                        require(['../plugins/nrmContextMenu'], function() {
                            el.nrmContextMenu(); // adds handler for disabled items, keyboard nav
                        });
                    } else if (c.type === 'tableEdit') {
                        $.when(c.value).done(_.bind(function(collection) {
                            c.value = collection;
                            this.applyDataTable(el, c, c.ctx || this.context || this.options.context);
                        }, this));
                    } else if (c.type === 'tabs') {
                        _.each(c.tabs, function(tab) {
                            var $tabHeader, $tab = $('#' + tab.id, itemsParent).data('nrm-control', tab);
                            if (c.path) {
                                tab.path = c.path;
                            }
                            if (tab.selected) {
                                $tabHeader = $('a[aria-controls="' + tab.id +'"]', this.$el);
                                if ($tabHeader.length) {
                                    this.tabSelected($.Event('show.bs.tab', {
                                        target: $tabHeader[0]
                                    }));
                                }
                            }
                            if (tab.prop) {
                                $tab.attr('data-nrmprop', tab.prop);
                            }
                        }, this);
                    }
                } else if (c.prop || c.nested) {
                    console.error('Element with id ' + c.id + 
                            ' not found for property binding, please ensure that the ' + c.type + 
                            ' template sets id attribute on an element that is appropriate for data binding.');
                } else {
                    //allow recursive properties of templates without id if there is no property binding on this control
                    el = parent;
                    itemsParent = parent;
                }
                
                if (callback) {
                    callback.call(this, el, c);
                }
                if (c.controls) {
                    this.applyPlugins(el, c.controls);
                }
                if (c.actions) {
                    this.applyPlugins(parent, c.actions);
                }
                btn = c.items ? c : c.btn;
                if (btn && btn.items) {
                    this.applyPlugins(itemsParent, btn.items);
                }
                return el;
            }  
        },
        /**
         * Event handler for the "show.bs.collapse" event triggered by the Collapse plugin.
         * @param {external:module:jquery.Event} event The event data.
         * @returns {undefined}
         */
        onPanelExpanded: function(event) {
            if (event.target !== event.currentTarget) {
                return;
            }
            var $panel = $(event.target), control = $panel.data('nrm-control');
            if (control) {
                this.renderPanel(control, $panel);
            }
        },
        renderPanel: function(control, $panel) {
            require(['./panelView'], _.bind(function(PanelView) {
                PanelView.prototype.renderPanel.call(this, control, $panel);
            }, this));
        },
        tabSelected: function(event) {
            require(['./panelView'], _.bind(function(PanelView) {
                PanelView.prototype.tabSelected.call(this, event);
            }, this));
        },
        /**
         * Recursively initialize control configuration.
         * @param {module:nrm-ui/views/baseView~ControlConfig[]} controls List of control configuration objects.
         * @param {Function} [eachCallback] Optional callback function that will be called for each control.
         * @param {module:nrm-ui/models/application~ContextConfig} [context] Context configuration, defaults to the
         * context configuration associated with the view if omitted.
         * @returns {module:nrm-ui/views/baseView~ControlConfig[]|external:module:jquery~Promise}
         * Initialized controls which may be a shallow copy of the original configuration objects or a promise that
         * will resolve when asynchronous initialization is completed.
         */
        initControls: function(controls, eachCallback, context) {
            var clist = [],
                    dfdQueue = [],
                    inherited,
                    dfd,
                    opt = {
                        context: context || this.context || (this.options && this.options.context)
                    };
                                
            if (controls && controls.length) {
                _.each(controls, function(c, i) {
                    var nestedDfd, nestedInherited, async, prop = c.nested || c.prop, 
                            schema = opt.context && prop && opt.context.schema && opt.context.schema[prop];
                            
                    function init(result) {
                        
                        var ctrl = $.extend({}, c.prop && schema, c);
                        ctrl.inherited = ctrl.prop && $.inArray(ctrl.prop, nestedInherited || inherited) > -1;
                        clist[i] = ctrl;
                        return this.initControl(ctrl, eachCallback, result.context);
                    }
                    if (c.nested && c.prop && schema) {
                        async = true;
                        // shift context to the "nested context"
                        dfd = $.when(Nrm.app.getNestedContext({
                            context: opt.context,
                            path: prop
                        }, this)).done(function(result) {
                            async = false;
                            nestedInherited = (c.prop && 
                                    Nrm.app.getInheritedAttributes(result.context, !this.searchType)) || [];
                            schema = result.context.schema && result.context.schema[c.prop];
                        });
                    } else if (!inherited && c.prop) {
                        inherited = Nrm.app.getInheritedAttributes(opt.context, !this.searchType);
                    }
                    if (!async) {
                        nestedDfd = init.call(this, opt);
                    } else {
                        nestedDfd = $.Deferred();
                        $.when(dfd).done(function(result) {
                            $.when(init.call(this, result)).done(nestedDfd.resolve).fail(nestedDfd.reject);
                        }).fail(nestedDfd.reject);
                    }
                    if (nestedDfd && nestedDfd.promise) {
                        dfdQueue.push(nestedDfd);
                    }
                }, this);
            }
            if (dfdQueue.length > 0) {
                // dfdQueue contains deferred control initialization that must complete before rendering.
                dfd = $.Deferred();
                $.when.apply($, dfdQueue).done(function() {
                    dfd.resolve(clist);
                }).fail(dfd.reject);
                return dfd.promise();
            } else {
                return clist;
            }
        },
        initLov: function(control, context, callback) {
            return BaseView.initLov.apply(this, arguments);
        },
        /**
         * Reset the value and select options for a LOV element.  Note that if this function is called on an element
         * in a data table row where the value is changing in response to another value in the table row, it is the 
         * caller's responsibility to ensure that the element is selected only for the row that has changed, so the 
         * selector should be limited to the changing row, for example:
         * <br>
         * <pre>
         * $('#myTable [data-nrm-rowid="' + model.id + '"] [data-nrmprop="' + attr + '"]', this.$el);
         * </pre>
         * Also note that it is recommended to use resetBindings method instead of resetLov for a control that uses the 
         * generic dependent LOV configuration identified by "lov" property set to a string with dot character.
         * @param {external:module:jquery} $el The LOV element to reset
         * @param {external:module:backbone.Collection|Array.<Object>} [collection]  The new collection, if it needs to
         * change.
         * @returns {module:nrm-ui/views/editorView}
         * Returns this instance to allow chaining.
         */
        resetLov: function($el, collection) {
            var control = $el.data('nrm-control') || {}, context = control.ctx, bindings;
            collection = collection || control.collection;
            if (!context) {
                context = {
                    apiKey: 'undefined',
                    collection: collection  || []
                };
            } else if (collection && context.collection !== collection) {
                // force it to load this collection, even if the context would prefer to load some other collection
                context = $.extend({}, context, {
                    collection: collection,
                    parent: null
                });
            }
            bindings = this.getBindingForElement($el);
            if (bindings && bindings.length) {
                this.bindData(control, bindings[0].model);
                if (!control.valueLoading) {
                    control.valueLoading = true;
                }
            }
            this.initLov(control, context, this.initLovCallback);
            if (control.valueLoading === true) {
                control.valueLoading = false;
            }
            return this;
        },
        /**
         * Reset control value and other dynamic properties by resetting the control bindings.   Note that this method 
         * will be called automatically on each dependent element identified by the "dependencies" property of a control
         * configuration when the related element value changes.
         * @param {external:module:jquery} $el The control element to reset.
         * @returns {module:nrm-ui/views/editorView}
         * Returns this instance to allow chaining.
         */
        resetBindings: function($el) {
            var model, changing = {}, inputTypes = BaseView.inputTypes(), control = $el.data('nrm-control'),
                    controlId = control.id,
                    bindings = control && this.getBindingForElement($el),
                    dynamicProps = ['value', 'required', 'hidden', 'readonly', 'disabled', 'valueLoading',
                        'min', 'max', 'minlength', 'maxlength', 'pattern'],
                    recursiveProps = ['tabs', 'controls', 'items', 'actions'];
            
            function setAttr($target, key, value) {
                if (value) {
                    $target.attr(key, value);
                } else {
                    $target.removeAttr(key);
                }
            }
            function trackChanges(control) {
                if (control.id) {
                    changing[control.id] = new Backbone.Model(_.pick(control, dynamicProps));
                }
                _.each(recursiveProps, function(prop) {
                    var controls = control[prop];
                    if (controls && controls !== true) {
                        _.each(controls, trackChanges);
                    }
                });
                if (control.btn) {
                    trackChanges(control.btn);
                }
            }
            function applyChanges(control) {
                var model = control.id && changing[control.id], changed, $target = $el;
                if (model) {
                    model.set(_.pick(control, dynamicProps));
                    changed = model.changedAttributes();
                    if (changed) {
                        if (control.id !== controlId) {
                            $target = $('#' + control.id, this.$el);
                        }
                        _.each(changed, function(value, key) {
                            switch (key) {
                                case 'value':
                                    this.setControlValue($target, control);
                                    break;
                                case 'valueLoading':
                                    this.setValueLoading($target, !!value, { size: 'small' });
                                    break;
                                case 'required':
                                    this.conditionalRequirementChanged($target, value, 
                                            $target.is(inputTypes.selectors.enableRequired));
                                    break;
                                case 'hidden':
                                    this.setControlHidden($target, value, control.hiddenClass);
                                    break;
                                case 'readonly':
                                case 'disabled':
                                    this.setControlEnabled($target, !value);
                                    break;
                                case 'min':
                                case 'max':
                                    if ($target.data('nrm.datepicker')) {
                                        if (key === 'min') {
                                            $target.nrmDatePicker('setStartDate', value);
                                        } else {
                                            $target.nrmDatePicker('setEndDate', value);
                                        }
                                    } else if ($target.is('input')) {
                                        setAttr($target, key, value);
                                    }
                                    break;
                                default:
                                    if ($target.is('input,textarea')) {
                                        setAttr($target, key, value);
                                    }
                                    break;
                            }
                        }, this);
                    }
                }
                _.each(recursiveProps, function(prop) {
                    var controls = control[prop];
                    if (controls) {
                        _.each(controls, applyChanges, this);
                    }
                }, this);
                if (control.btn) {
                    applyChanges.call(this, control.btn);
                }
            }
            if (bindings && bindings.length) {
                model = bindings[0].model;
                if (!control.valueLoading) {
                    control.valueLoading = true;
                }
                trackChanges(control);
                this.bindData(control, model);
                applyChanges.call(this, control);
                if (control.valueLoading === true) {
                    control.valueLoading = false;
                }
            }
            return this;
        },
        /**
         * Set value of element from control configuration
         * @param {external:module:jquery} $el A JQuery element
         * @param {module:nrm-ui/views/baseView~ControlConfig} control The control configuration
         * @returns {undefined}
         */
        setControlValue: function($el, control) {
            var datePicker, displayTarget;
            if ($el.is('input[type="radio"]')) {
                if (!control.value) {
                    $el.prop('checked', false);
                } else {
                    $el.filter('[value="' + control.value + '"]').prop('checked', true);
                }
            } else if ($el.is('input[type="checkbox"]')) {
                $el.prop('checked', !!control.checked);
            } else if ($el.is('input[type="hidden"]')) {
                if ($el.is('.select2-offscreen')) {
                    if (_.isArray(control.value)) {
                        $el.select2('data', _.map(control.value, function(val, i) {
                            return {
                                id: val,
                                text: (control.displayValue && control.displayValue[i]) || val
                            };
                        }));
                    } else {
                        $el.select2('data', {
                            id: control.value,
                            text: control.displayValue || control.value
                        });
                    }
                } else {
                    $el.val(control.value);
                    displayTarget = $el.attr('data-target-display');
                    if (displayTarget) {
                        $(displayTarget, this.$el).val(control.displayValue || control.value);
                    }
                }
            } else if ($el.is('select.select2-offscreen')) {
                $el.select2('val', control.value);
            } else if ($el.is('input,select,textarea,div[contenteditable="true"]')) {
                datePicker = $el.data('nrm.datepicker');
                if (datePicker && datePicker.hasPlugin) {
                    // note: the Bootstrap Datepicker plugin will trigger change event which we don't really want, 
                    // but this is currently the only way to update the plugin value correctly.
                    $el.nrmDatePicker('update', control.value);
                } else {
                    $el.val(control.value);
                }
            } else if ($el.is("table")) {
                if (control.nrmDataTable) {
                    // heavy-handed, but currently the only way to rebind an nrmDataTable to a different collection
                    $.when(control.value).done(_.bind(function(collection) {
                        control.value = collection;
                        control.nrmDataTable.resetData(control.value);
                    }, this));
                } else {
                    console.warn("Resetting control value for table not supported", $el);
                }
            } else if (control.view instanceof Backbone.View) {
                control.view.remove();
                control.view = control.view.constructor;
                this.renderPanel(control, $el);
            } else if (control.dataType === 'html') {
                $el.html(control.value);
            } else if (!$el.children().length) {
                $el.text(control.value);
            } else {
                console.warn('Resetting control value not supported for element', $el);
            }
        },
        /**
         * Initialize a control configuration object.  Also recursively initializes child controls.
         * @param {module:nrm-ui/views/baseView~ControlConfig} control Control configuration object
         * @param {Function} [callback] Optional callback function that will be called for each control.
         * @param {module:nrm-ui/models/application~ContextConfig} [context] Context configuration, defaults to the
         * context configuration associated with the view if omitted.
         * @returns {module:external:jquery~Promise|undefined}
         * The return value may be undefined if the initialization occurs synchronously, or a promise that is resolved
         * or rejected when asynchronous initialization is complete.  
         */
        initControl: function(control, callback, context) {
            if (!control) {
                return ret;
            }
            var callbackNow = true, 
                    ret, 
                    dfdQueue = [], 
                    ctxLoading, 
                    apiKey,
                    dependentLov = false,
                    dependentLovIdx,
                    dependentLovParent,
                    initDfd, 
                    nestedDfd,
                    ctrlDefaults = this.controlDefaults && control.type && this.controlDefaults[control.type],
                    thisContext = this.context || (this.options && this.options.context) || {};
            
            if (!context) {
                context = thisContext;
            } else if (context !== thisContext) {
                control.parentContext = context;
            }
            if (!this.controlCollection) {
                /**
                 * Collection of all initialized controls.
                 * @name module:nrm-ui/views/baseView#controlCollection
                 * @deprecated Recommended approach is to find the element by id and then obtain control configuration
                 * using JQuery Data API:
                 * <br>
                 * <pre>
                 *   var control = $('#myControl', this.$el).data('nrm-control');
                 * </pre>
                 * @type {external:module:backbone.Collection}
                 */
                this.controlCollection = new Backbone.Collection();
            }
            
            function addDeferred(dfd) {
                if (dfd && _.isFunction(dfd.promise)) {
                    dfdQueue.push(dfd);
                    return dfd;
                } else {
                    return ret;
                }

            }
            
            function lovFailedCallback(ctx, data, response) {
                control.error = true;
                this.onLovError(ctx, data, response);
                if (initDfd) {
                    initDfd.reject();
                }
            }
            
            function initLov(ctx) {
                if (this.removed) {
                    return this;
                }
                if (!control.idAttr) {
                    control.idAttr = (control.context && control.context.idAttr) || ctx.idAttr;
                }
                if (control.collection && ctx.collection !== control.collection) {
                    ctx = $.extend({}, ctx, {
                        collection: control.collection
                    });
                }
                this.initLov(control, ctx, function(control, el, collection) {
                    if (callback) {
                        callback.call(this, control, el, collection);
                    }
                    if (this.controlCollection) {
                        this.controlCollection.set(new Backbone.Model(control), { remove: false });
                    }
                    if (initDfd) {
                        initDfd.resolve();
                    }
                }, function(data, response) {
                    lovFailedCallback.call(this, ctx, data, response);
                });
                return this;
            }
            
            function initColumns(context, columns) {
                var columnQueue = [], columnRet;
                _.each(columns, function(column) {
                    if (column.control) {
                        column.prop = column.prop || column.control.prop;
                        column.control.id = BaseView.ensureId(column.control.id);
                        column.control = $.extend(column.control, { 
                             className: BaseView.addClassName(column.control.className, column.control.id),
                             nolabel: true,
                             tablecell: true,
                             hz: false,
                             prop: column.prop
                        });
                        var maybeDfd = this.initControl(column.control, callback, context);
                        if (maybeDfd && _.isFunction(maybeDfd.promise)) {
                            columnQueue.push(maybeDfd);
                            columnRet = maybeDfd;
                        }
                    }
                }, this);
                   
                if (columnQueue.length > 1) {
                    // columnQueue contains deferred control initialization that must complete before rendering.
                    columnRet = $.when.apply($, columnQueue);
                }
                return columnRet;
            }
            
            function initRecursive(controlsProp, context) {
                var controls = control[controlsProp];
                return $.when(this.initControls(controls, callback, context)).done(function(controls) {
                    control[controlsProp] = controls;
                });
            }
            
            function initNestedContext(context) {
                var schema, localCtx = context;
                apiKey = apiKey || control.prop || control.refType;
                schema = context.schema && context.schema[apiKey];
                // Nrm.app.getNestedContext requires schema key matching apiKey...
                if (!schema || (control.context && schema.context !== control.context)) {
                    localCtx = $.extend({}, context, {
                        schema: {}
                    });
                    localCtx.schema[apiKey] = control;
                }
                $.when(Nrm.app.getNestedContext({ 
                    context: localCtx,
                    path: apiKey
                }, this)).done(function(result) {
                    control.ctx = result.context;
                    ctxLoading.resolveWith(this, [result.context]);
                }).fail(function() {
                    ctxLoading.rejectWith(this, arguments);
                });
            }
            
            // TODO: this may be deprecated soon.
            if (this.config && this.config.hz && control.hz === undefined && this.isInputControl(control.type)) {
                control.hz = true;
            }
            // every control must have an id
            control.id = BaseView.ensureId(control.id);
            // assign defaults
            if (ctrlDefaults) {
                _.defaults(control, ctrlDefaults);
            }
            
            // determine lov status
            if (control.lov === true && control.refType) {
                control.lov = control.refType;
            } else if (_.isString(control.lov)) {
                dependentLov = (dependentLovIdx = control.lov.indexOf(".")) !== -1;
                if (!dependentLov) {
                    control.refType = control.lov;
                } else {
                    apiKey = control.lov.substr(dependentLovIdx + 1);
                    if (dependentLovIdx === 0) {
                        // control.lov = ".childCollection"
                        // LOV will be loaded as child collection of model identified by "childCollection"
                        if (!control.refType && context.schema && context.schema[apiKey]) {
                            control.refType = context.schema[apiKey].refType;
                        }
                    } else {
                        // control.lov = "parentFk.childCollection"
                        // LOV will be loaded as child collection identified by "childCollection" from parent 
                        // identified by model attribute "parentFk"
                        dependentLovParent = control.lov.substr(0, dependentLovIdx);
                    }
                }
            }
            
            // ensure the associated context is loaded
            if (control.refType && control.lov && !dependentLov) {
                ctxLoading = $.when(Nrm.app.getContext({ 
                    apiKey: control.refType 
                }, this)).done(function(ctx) {
                    // Note: the cryptic "ctx" property name instead of "context" is intentional at this point,
                    // because control.context may contain configuration that needs to override the base context.
                    control.ctx = ctx;
                });
            } else if (dependentLov || control.refType) {
                ctxLoading = $.Deferred();
                if (dependentLovParent) {
                    $.when(Nrm.app.getContext({ 
                        apiKey: (context.schema && context.schema[dependentLovParent] && 
                                context.schema && context.schema[dependentLovParent].refType) || 
                                dependentLovParent
                    }, this)).done(initNestedContext).fail(function() {
                        ctxLoading.rejectWith(this, arguments);
                    });;
                } else {
                    initNestedContext.call(this, context);
                }
            }
            
            if (control.lov && !control.options && !control.optgroups) {
                if ((ctxLoading && !dependentLov) || control.collection) {
                    callbackNow = false;
                    control.loading = true;
                    //ret = addDeferred(new $.Deferred());
                    if (control.preload) {
                        ret = initDfd = addDeferred($.Deferred());
                    }
                    if (!ctxLoading) {
                        initLov.call(this, {
                            apiKey: 'undefined',
                            collection: control.collection
                        });
                    } else {
                        $.when(ctxLoading).done(initLov).fail(function(data) {
                            lovFailedCallback.call(this, null, data);
                        });
                    }
                }
            }
            // if context resolved synchronously, reset it to false.
            $.when(ctxLoading).done(function() {
                ctxLoading = false;
            });
            if (ctxLoading && (control.controls || control.columns)) {
                ret = nestedDfd = addDeferred($.Deferred());
                // pass nested context to the controls and columns arrays
                $.when(ctxLoading).done(function(ctx) {
                    var columnsLoading, nestedLoading;
                    if (control.controls) {
                        nestedLoading = initRecursive.call(this, 'controls', ctx);
                    }
                    if (control.columns) {
                        columnsLoading = initColumns.call(this, ctx, control.columns);
                    }
                    $.when(nestedLoading, columnsLoading).done(nestedDfd.resolve).fail(nestedDfd.reject);
                });
            } else if (ctxLoading) {
                ret = addDeferred(ctxLoading);
            } else {
                if (control.controls) {
                    ret = addDeferred(initRecursive.call(this, 'controls', context));
                }
                if (control.columns) {
                    ret = initColumns.call(this, context, control.columns);
                }
            }
            if (control.actions) {
                ret = addDeferred(initRecursive.call(this, 'actions', context));
            }
            if (control.btn && control.btn !== true) {
                ret = addDeferred(this.initControl(control.btn, callback, context));
            }
            if (control.items) {
                ret = addDeferred(initRecursive.call(this, 'items', context));
            }
            if (control.tabs) {
                ret = addDeferred(initRecursive.call(this, 'tabs', context));
            }
            
            if (dfdQueue.length > 1) {
                // dfdQueue contains deferred control initialization that must complete before rendering.
                ret = $.when.apply($, dfdQueue);
            }
            $.when(ret).done(_.bind(function() {
                if (callbackNow && callback) {
                    callback.call(this, control);
                }
            }, this));
            if (this.controlCollection) {
                this.controlCollection.set(new Backbone.Model(control), { remove: false });
            }

            return ret && ret.promise();
        },
        isInputControl: function(type) {
            return BaseView.isInputControl.apply(this, arguments);
        },
        /**
         * Apply the NrmDataTable plugin
         * @param {external:module:jquery} el The JQuery element for the table.
         * @param {module:nrm-ui/views/baseView~ControlConfig} control The control configuration.
         * @param {module:nrm-ui/models/application~ContextConfig} context Context configuration object for the
         * collection to bind to the table.
         * @returns {undefined}
         * @see {@link module:nrm-ui/plugins/nrmDataTable|NrmDataTable plugin}
         */
        /**
         * Indicates whether a control should use {@link module:nrm-ui/models/application#getCollection|Nrm.app.getCollection}
         * for data binding.
         * @param {module:nrm-ui/views/baseView~ControlConfig} control The control configuration
         */
        isCollectionControl: function(c) {
            return c.type === "tableEdit" && (c.ctx || c.refType || c.prop);
        },
        applyDataTable: function(el, control, context) {
            if (this.removed) return;
            context = context || { };
            if (!control.nameAttr && context.nameAttr) 
                control.nameAttr = context.nameAttr;
            
            var dtProps = $.extend({ aaSorting: [], nameAttr: control.nameAttr }, control.pluginOpts),
                    formConfig = _.pick(this.config || { }, 'btnClass', 'inputClass'),
                    aoColumns = [],
                    columns = null,
                    props = [],
                    self = this,
                    path = this.getPath(),
                    fnEnableCallback = dtProps.fnEnableCallback,
                    fnCreatedRow = dtProps.createdRow || dtProps.fnCreatedRow;
            
            if (path && control.prop) {
                if (_.isString(control.path)) {
                    path = control.path.replace(/^\./, path);
                }
                path = path + "/" + control.prop;
            }
            
            function getIdForRow(data) {
                var idAttr = BaseView.getIdAttributeName(control, context, control.value);
                return data && (data[idAttr] || data._cid);
            }
            function getModelForRow(data) {
                var id = getIdForRow(data), collection = control.value;
                if (collection && _.isFunction(collection.get)) {
                    return collection.get(id);
                } else {
                    return data;
                }
            }
            function getTableDataFunc(col) {
                return function(data, type, value) {
                    var defaultValue = null, model, current, result;
                    if (col && col.defaultValue !== undefined) {
                        defaultValue = col.defaultValue;
                    }
                    if (!col || !col.prop) {
                        return defaultValue;
                    }
                    model = getModelForRow(data);
                    if (type === "set") {
                        if (col.prop === "selected") {
                            var current = Nrm.app.getModelVal(model, col.prop);
                            if ((!current && value) || (!value && current))
                                Nrm.app.setModelVal(model, col.prop, value);
                        } else {
                            Nrm.app.setModelVal(model, col.prop, value);
                        }
                        if (model !== data) {
                            Nrm.app.setModelVal(data, col.prop, value);
                        }
                    } else {
                        result = Nrm.app.getModelVal(model, col.prop);
                        return (result === undefined) ? defaultValue : result;
                    }
                };
            }
            function applyTitle(cell, row) {
                if (!control.nameAttr) return;
                if (cell.title && cellTitlePattern.test(cell.title))
                    cell.title = cell.title.replace(cellTitlePattern, Nrm.app.getModelVal(row, control.nameAttr));
            }
            function initCellControl(cell, row, model) {
                cell.id = BaseView.ensureId(cell.id) + (row._cid || getIdForRow(row) || '');
                if (control.prop) {
                    cell.path = (control.path || '.') + '/' + control.prop;
                }
                applyTitle(cell, model);
                var children = [ 'actions', 'controls', 'items' ]
                _.each(children, function(childList) {
                    if (cell[childList]) {
                        _.each(cell[childList], function(item) {
                            initCellControl(item, row, model);
                        });
                    }
                });
                if (cell.btn && cell.btn !== true) {
                    initCellControl(cell.btn, row, model);
                }
            }
            function getControlForCell(data, col, i, refresh) {
                if (!col.control) {
                    return null;
                }
                var ret, model;
                if (!refresh && data._nrmControls) {
                    ret = data._nrmControls[i];
                }
                if (!ret) {
                    ret = $.extend(true, { }, col.control);
                    model = getModelForRow(data);
                    initCellControl(ret, data, model);
                    if (!data._nrmControls) {
                        data._nrmControls = [];
                    }
                    data._nrmControls[i] = ret;
                    self.bindData(ret, model);
                }
                return ret;
            }
            function getRenderFunc(col) {
                return function(data, type, row, options) {
                    data = Nrm.app.formatValue(data, col.dataType, type);
                    var refresh = type === 'display', 
                            rawValue = (type === "filter" || type === "type" || type === "sort"),
                            cell = getControlForCell(row, col, options.col, refresh);
                    
                    if (data && rawValue && cell && cell.nameAttr) {
                        /* The display value is different than bound value, and we sort and filter on display value.
                         * Unfortunately, the display value cannot be obtained from model because it might not
                         * update when the selection changes.
                         */
                        function getSelectedOption(options, value) {
                            return _.find(options, function(opt) {
                                return opt.value === value;
                            });
                        }
                        function getSelection(value) {
                            var selection;
                            if (cell.optgroups) {
                                _.find(cell.optgroups, function(optgroup) {
                                    selection = getSelectedOption(optgroup.options, value);
                                    return !!selection;
                                });
                            } else if (cell.options) {
                                selection = getSelectedOption(cell.options, value); 
                            }
                            return (selection && selection.text) || value;
                        }
                        if (_.isArray(data)) {
                            return _.map(data, getSelection);
                        } else {
                            return getSelection(data);
                        }
                    } else if (rawValue) {
                        return data;
                    }
                    if (col.template) {
                        cell = $.extend({}, col, { 
                            "data": data, 
                            "type": type, 
                            "row": row, 
                            "readonly": self.readonly
                        });
                        applyTitle(cell, getModelForRow(row)); 
                        return Handlebars.templates[col.template](cell);
                    } else if (cell && cell.type) {
                        return Handlebars.templates[cell.type](cell);
                    } else {
                        return col.dataType === 'html' ? data : Handlebars.Utils.escapeExpression(data);
                    }
                };
            }
            function getCreatedCellFunc(col) {
                return function(cell, cellData, rowData, iRow, iCol) {
                    if (col.control) {
                        // can't use :focusable here because the cell is not yet visible
                        var $cell = $(cell);
                        var $focusable = $('a[href],input,button,textarea,select,[tabindex]:not([tabindex=""])', $cell)
                                .not('select.select2-offscreen,.select2-container :not(input)');
                        $focusable.attr("tabindex", "-1");
                        var c = getControlForCell(rowData, col, iCol, false);
                        self.applyPlugin($cell, c);
                        self.applyClasses(formConfig, $cell);
                        var $enable = $('.dropdown-menu>li:not(.disabled),.btn:not(.disabled,[disabled])', $cell);
                        if ($enable.length) {
                            var model = getModelForRow(rowData);
                            self.setItemsEnabled({
                                control: control,
                                context: context,
                                model: model,
                                path: path,
                                $items: $enable,
                                routes: self.getRoutes({
                                    control: c,
                                    path: path
                                }),
                                enable: true,
                                singleItem: true
                            });
                        }
                    }
                    var fnCreatedCell = col.pluginOpts && (col.pluginOpts.createdCell || col.pluginOpts.fnCreatedCell);
                    if (typeof fnCreatedCell === "function")
                        fnCreatedCell.apply(this, arguments);
                };
            }
            //var isBackbone = control.value && control.value.models;
            if (control.columns) {
                columns = _.map(control.columns, function(col) {
                    var schema, colProps = _.isString(col) ? { prop: col } : col;
                    if (colProps.prop) {
                        schema = $.extend({}, context.schema, control.context && control.context.schema)[colProps.prop];
                        if (colProps.control) {
                            _.defaults(colProps.control, schema);
                        }
                        return $.extend({ }, schema, colProps);
                    } else {
                        return colProps;
                    }
                }, this);
            }
            if (control.rowActions) {
                columns = columns || [];
                columns.unshift({
                    control: {
                        type: "toolbar",
                        id: control.id + '-actions-toolbar',
                        actions: _.map(control.rowActions, function(action) {
                            action = $.extend({
                                type: "btn",
                                btnStyle: "link",
                                className: "btn-xs nrm-route-action"
                            }, _.isString(action) ? this.rowActions && this.rowActions[action] : action);
                            if (action.title && context.alias) {
                                action.title = action.title.replace(/{{alias}}/g, context.alias);
                            }
                            action.id = BaseView.ensureId(action.id);
                            return action;
                        }, this),
                        btnClass: "btn-xs"
                    },
                    className: 'nrm-cell-rowactions',
                    pluginOpts: {
                        bSortable: false,
                        sWidth: (6*control.rowActions.length) + "px"
                    }
                })
            }
            if (columns) {
                _.each(columns, function(col, i) {
                    var colDef = aoColumns[i] = $.extend({ }, {
                        sTitle: col.label || Nrm.app.identifierToLabel(col.prop) || "",
                        mData: getTableDataFunc(col), //isBackbone ? getTableDataFunc(control, col) : col.prop
                        mRender: getRenderFunc(col)
                    }, col.pluginOpts), 
                        clsProp = colDef.className ? "className" : "sClass",
                        collection = control.value;
                    if (col.control) {
                        col.control.label = col.control.label || col.label;
                        if (col.prop && collection && collection.model && collection.model.rules) {
                            collection.model.rules.forEach(function(rule) {
                                this.mixinBusinessRule(col.control, collection.model, rule);
                            }, this);
                            if (col.control.required)
                                colDef[clsProp] = BaseView.addClassName(colDef[clsProp], "nrm-required-field");
                        }
                        colDef.fnCreatedCell = getCreatedCellFunc(col);
                    }
                    if (col.className || col.control) {
                        colDef[clsProp] = BaseView.addClassName(colDef[clsProp], col.className || "nrm-cell-edit");
                    }
                    props[i] = col.prop;
                }, this);
            }
            dtProps.aoColumns = aoColumns;
            dtProps.fnEnableCallback = function(el, options) {
                var collection = control.value || [], zoomOpt;
                options = $.extend({ }, options, { control: control, collection: collection });
                if (path) options.path = path;
                if (!control.updating && collection.trigger) {
                    zoomOpt = _.pick(control, "ensureVisible", "zoomToSelection");
                    collection.trigger("updateSelection", collection, zoomOpt);
                }
                self.onRowSelect(el, options); 
                if (fnEnableCallback) {
                    fnEnableCallback.apply(this, arguments);
                }
            };
            dtProps.fnSelected = function(data, type, value) {
                if (type === "set") {
                    data["selected"] = value;
                    var model = getModelForRow(data);
                    var current = Nrm.app.getModelVal(model, "selected");
                    if ((!current && value) || (!value && current))
                        Nrm.app.setModelVal(model, "selected", value);
                } else {
                    var p = data["selected"];
                    if (p === undefined)
                        p = dtProps.defaultSelectedValue ? true : false;
                    return p;
                }
            };
            if (control.value instanceof Backbone.Collection) {
                dtProps.collection = control.value;
                dtProps.fnCreatedRow = function(nRow, aData, iDataIndex) {
                    // Add path to row to allow for tabular highlighting
                    var id = getIdForRow(aData) || "";
                    if (path) $(nRow).attr("data-nrmtree-path", path + "/" + id);
                    $(nRow).attr("data-nrm-rowid", id);
                    if (fnCreatedRow) {
                        fnCreatedRow.apply(this, arguments);
                    }
                };
                 
                this.listenTo(control.value, "updateSelection", function(collection, options) {
                    if (options.fromMap && control.nrmDataTable) {
                       var aoData =  control.nrmDataTable.dataTable.fnGetData(), first = true;
                       control.updating = true;
                       _.each(aoData, function(row, idx) {
                          var model = getModelForRow(row), selected = Nrm.app.getModelVal(model, "selected");
                          if ((row.selected && !selected) || (!row.selected && selected)) {
                              control.nrmDataTable.selectRowExternal(idx, { toggle: true }); //{ selected: selected });
                              if (first && selected) {
                                  first = false;
                                  model.updatingSelection = true;
                                  try {
                                    control.nrmDataTable.setActiveRow(idx, false);
                                  } finally {
                                      model.updatingSelection = false;
                          }
                              }
                          }
                       });
                       control.updating = false;
                    } 
                });
                this.listenTo(Nrm.event, "context:activeRow", function(data) {
                    var pathSep = data.path && data.path.lastIndexOf("/");
                    if (control.nrmDataTable && pathSep && pathSep > -1 && data.path.substring(0, pathSep) === path) {
                        var $row = control.nrmDataTable.dataTable.$('[data-nrmtree-path="'+ data.path + '"]');
                        control.nrmDataTable.setActiveRow($row, false);
                    }
                });
            } else {
                dtProps.aaData = control.value || [];
            }
            require(['../plugins/nrmDataTable'], function() {
                control.nrmDataTable = el.nrmDataTable(dtProps);
                control.nrmDataTable.fnDestroy = _.wrap(control.nrmDataTable.fnDestroy, function(fn) {
                    fn.call(control.nrmDataTable);
                    self = null;
                });
            });
        },
        /**
         * Default configuration for actions buttons to disply in table rows.
         * @property {module:nrm-ui/views/baseView~ControlConfig} edit The default edit button configuration
         * @property {module:nrm-ui/views/baseView~ControlConfig} delete The default delete button configuration
         */
        rowActions: {
            "edit": {
                "href": "#edit",
                "title": "Edit {{alias}}: {{name}}",
                "className": "btn-xs nrm-edit-row nrm-enable-readonly",
                "icon": "glyphicon glyphicon-pencil",
                "id": "nrm-edit-row"
            },
            "delete": {
                "title": "Delete {{alias}}: {{name}}",
                "className": "btn-xs nrm-delete-row nrm-route-action",
                "icon": "glyphicon glyphicon-remove",
                "id": "nrm-delete-row"
            }
        },
        /**
         * Extract dynamic hrefs (aka routes) from a data table control configuration mapped by element id.
         * @param {Object} options
         * @param {string} options.path Navigation path for this control (usually the concatenation of the navigation
         * path and the property bound to the table)
         * @param {module:nrm-ui/views/baseView~ControlConfig} options.control Control configuration that is
         * expected to have an array of "actions".
         * @returns {Object}
         * Hash of element ids mapped to an object with the "href" property.
         */
        getRoutes: function(options) {
            function mapHrefs(memo, item) {
                if (item.href && item.href !== "#" && item.generateHref !== false) {
                        if (!memo) memo = { };
                        memo[item.id] = { "href" : item.href };
                    }
                if (item.items)
                    return _.reduce(item.items, mapHrefs, memo);
                else
                    return memo;
            }
            if (options.path && options.control && options.control.actions) {
                return _.reduce(options.control.actions, mapHrefs, false);
            }
        },
        /**
         * Update the enabled state for table actions based on currently selected rows in the data table. 
         * @param {external:module:jquery} element The JQuery element for the table actions container
         * @param {Object} options
         * @param {string} options.path Navigation path for this control (usually the concatenation of the navigation
         * path and the property bound to the table)
         * @param {module:nrm-ui/views/baseView~ControlConfig} options.control Control configuration that is
         * expected to have an array of "actions", like a data table.
         * @param {Number} options.cnt Selection count 
         * @param {external:module:backbone.Collection options.collection The collection bound to the data table.
         * @returns {undefined}
         */
        onRowSelect: function(element, options) {
            var routes = this.getRoutes(options);
    //        function mapHrefs(memo, item) {
    //            if (item.href && item.href !== "#" && item.generateHref !== false) {
    //                    if (!memo) memo = { };
    //                    memo[item.id] = { "href" : item.href };
    //                }
    //            if (item.items)
    //                return _.reduce(item.items, mapHrefs, memo);
    //            else
    //                return memo;
    //        }
    //        if (options.path && options.control && options.control.actions) {
    //            routes = _.reduce(options.control.actions, mapHrefs, false);
    //        }
            var enableOpts = $.extend({ }, options, { 
                "routes": routes, 
                "model": this.model,
                "context": this.context || this.options.context
            });
            var selectors = {
                ".nrmDataTable-singleSelect": {
                    "enable": options.cnt === 1, 
                    "singleItem": true
                },
                ".nrmDataTable-multiSelect": {
                "enable": options.cnt > 0, 
                "singleItem" : false
                },
                ".nrmDataTable-atLeastOne": {
                "enable": options.collection.length > 0,
                "singleItem" : false
                }
            };
            _.each(selectors, function(opt, sel) {
                enableOpts = $.extend(enableOpts, opt);
                enableOpts.$items = $(sel, element);
                this.setItemsEnabled(enableOpts);
            }, this);

            enableOpts = $.extend(enableOpts, {
                "$items": $(".nrmDataTable-enablePath,.nrmDataTable-enableEditable,.nrmDataTable-rootPath", element)
                        .not(_.keys(selectors).join(",")),
                "enable": true,
                "singleItem" : false
            });
            this.setItemsEnabled(enableOpts);
        },
        setItemsEnabled: function(options) { //$items, enable, routes, singleItem) {
            return BaseView.setItemsEnabled.apply(this, arguments);
        },
        formatValue: function(value, dataType, type) {
            return Nrm.app.formatValue(value, dataType, type);
        },
        /**
         * Convenience method to get the navigation path for this view.
         * @returns {string} Navigation path that can be plugged in to a route in the format #route/*path to refresh 
         * the page and redisplay this view.
         */
        getPath: function() {
            return this.path || this.options.path;
        },
        setValueLoading: function($el, loading) {
            return BaseView.setValueLoading.apply(this, arguments);
        },
        setControlHidden: function($selection, hidden, hiddenClass) {
            return BaseView.setControlHidden.apply(this, arguments);
        },
        setControlEnabled: function($selection, enable) {
            return BaseView.setControlEnabled.apply(this, arguments);
        },
        setReadOnly: function(control) {
            return BaseView.setReadOnly.apply(this, arguments);
        },
        /**
         * Load generic Handlebar templates discovered from configuration.
         * @returns {external:module:jquery~Promise|undefined}
         * @see {@link module:nrm-ui/models/application#loadTemplates}
         */
        loadTemplate: function() {
            if (this.config) {
                var name = this.config.template;
                if (!name && this.genericTemplate) {
                    name = this.config.template = this.genericTemplate;
                }
                return Nrm.app.loadTemplates(this.config, function(template) {
                    if (name) {
                        /**
                         * The generic template function, initialized in 
                         * {@link module:nrm-ui/views/baseView#loadTemplate|loadTemplate function}
                         * @name module:nrm-ui/views/baseView#template
                         * @type {Function}
                         */
                        this.template = template;
                    }
                }, this);
            }
        },
        setEditable: function(control, enable) {
            return BaseView.setEditable.apply(this, arguments);

        },
        /**
         * Indicates whether there is enough information to perform generic rendering.
         * @returns {Boolean}
         */
        canRender: function() {
            /**
             * Form configuration, this must be set to support generic rendering.
             * @name module:nrm-ui/views/baseView#config
             * @type {module:nrm-ui/views/baseView~FormConfig}
             */
            var error = !this.config ? "Config is not initialized." : void 0;
            if (!error && typeof this.template !== "function") {
                error = "Template must be defined.";
            }
            if (error) console.log(error);
            return !error;
        },
        /**
         * Apply classes and other dynamic properties at the view level after rendering all controls.
         * @param {module:nrm-ui/views/baseView~FormConfig} [config] The form configuration, defaults to the config
         * property if it is defined on this view instance.
         * @param {external:module:jquery} [$el] The parent element, defaults to the view container element.
         * @returns {module:nrm-ui/views/baseView}
         * Returns this instance to allow chaining.
         */
        applyClasses: function(config, $el) {
            return BaseView.applyClasses.call(this, config || this.config, $el || this.$el);
        },
        /**
         * Default asynchronous LOV callback implementation.
         * @param {module:nrm-ui/views/baseView~ControlConfig} control The control configuration.
         * @param {external:module:jquery} $el The JQuery element that the control represents.
         * @param {external:module:backbone.Collection} collection The LOV collection.
         * @returns {module:nrm-ui/views/baseView}
         * Returns this instance to allow chaining.
         */
        initLovCallback: function(control, $el, collection) {
            return BaseView.applyClasses.call(this, this.config, $el, 'inputClass');
        },
        /**
         * Get the label element associated to a control element.
         * @param {external:module:jquery} $el The element 
         * @param {external:module:jquery} [parent] The parent element that contains the label, defaults to the view container element
         * @returns {external:module:jquery}
         * The associated label element 
         */
        getLabelForElement: function($el, parent) {
            return BaseView.getLabelForElement.call(this, $el, parent || this.$el);
        },
        /**
         * Mix in configuration from global "forms" configuration.  Note that the global configuration will override
         * the option with the same name in each generic view implementation, unless it is defined via defaults or
         * addClasses property described in {module:nrm-ui/views/baseView~FormConfigMixin|FormConfigMixin}.
         * @param {String} [type] The type of form configuration, equivalent to one of the keys described in 
         * {@link module:nrm-ui/models/application~ModuleConfig|ModuleConfig}.  If omitted, the first argument may be
         * the form configuration described as the second argument.
         * @param {module:nrm-ui/views/baseView~FormConfig} config The configuration object to mix into.
         * @returns {module:nrm-ui/views/baseView~FormConfig}
         * @see {module:nrm-ui/models/application~AppConfig|AppConfig.forms} for information on the format of the global
         * configuration object.
         * The original configuration with global options mixed in.
         */
        mixConfig: function(type, config) {
            var typed = _.isString(type), 
                    fc = Nrm.app.get('forms'),
                    all = fc && fc.all, 
                    addCls = all && all.addClasses,
                    defaults = all && all.defaults;
            config = (typed || !type ? config : type) || { };
            if (!fc) {
                return config;
            }
            type = typed ? type : "";
            if (type) {
                fc = fc[type];
                addCls = _.extend({}, addCls, fc && fc.addClasses);
                defaults = _.extend({}, defaults, fc && fc.defaults);
                all = _.extend({}, all, fc)
            }
            config = _.extend(config, _.omit(all, "addClasses", "defaults"));
            if (defaults) {
                config = _.defaults(config, defaults);
            }
            if (addCls) {
                _.each(addCls, function(value, key) {
                    config[key] = BaseView.addClassName(config[key], value);
                });
            }
            return config;
        }
    }, /**@lends module:nrm-ui/views/baseView */{
        /**
         * Find the container element (or the control itself if there is no container) for a control configuration 
         * within a parent element
         * @param {external:module:jquery} el The parent element
         * @param {module:nrm-ui/views/baseView~ControlConfig} control The control configuration
         * @returns {external:module:jquery}
         */
        findControl: function(el, control) {
            var selector = '#' + control.id, selectors = [selector, selector + '-container'], $control, $table, 
                    dataTable;
            if (!control.tablecell) {
                return $(selectors.join(','), el).first();
            } else {
                selectors = _.map(selectors, function(selector) {
                    return 'table.dataTable ' + selector;
                });
                $control = $(selectors.join(','), el);
                if (!$control.length) {
                    selector = '.' + control.id;
                    $control = $('table.dataTable ' + selector, el);
                }
                $table = $control.closest('table.dataTable');
                if ($table.length) {
                    dataTable = $table.DataTable();
                    if (dataTable.page.info().pages > 1) {
                        var $controlInTable = $table.dataTable().$(selector);
                        if ($controlInTable.length) {
                            return $controlInTable;
                        }
                    }
                }
                return $control;
            }
        },
        /**
         * Indicates whether we should apply the {@link http://select2.github.io/select2/|Select2} plugin for a
         * control.
         * @param {external:module:jquery} el JQuery object
         * @param {module:nrm-ui/views/baseView~ControlConfig} c Control configuration
         * @returns {Boolean}
         */
        isSelect2: function(el, c) {
            return c && c.type === "select" && el && el.length > 0 && el.closest(".dropdown-menu").length === 0;
        },
        /**
         * Indicates whether the control is a multi-valued select element.
         * @param {module:nrm-ui/views/baseView~ControlConfig} c Control configuration
         * @returns {Boolean}
         */
        isMultiSelect: function(c) {
           return c && ((c.type === "select" && c.multiple) || c.type === "checkMulti" || 
                            c.type === "shuttle" );
        },
        /**
         * Mixes in all business rules defined by the model during data binding.
         * @param {module:nrm-ui/views/baseView~ControlConfig} c Control configuration
         * @param {external:module:backbone.Model} model The Backbone model
         * @returns {undefined}
         */
        mixinBusinessRules: function(c, model) {
            if (c.prop && model.constructor.rules) {
                var rules = model.constructor.rules;
                rules.forEach(function(rule) {
                    this.mixinBusinessRule(c, model, rule);
                }, this);
            }
        },
        /**
         * 
         * Mixes in a single business rule defined by the model during data binding.
         * @param {module:nrm-ui/views/baseView~ControlConfig} c Control configuration
         * @param {external:module:backbone.Model} model The Backbone model
         * @param {module:nrm-ui/models/rule} rule The business rule
         * @returns {undefined}
         */
        mixinBusinessRule: function(c, model, rule) {
            var r, condition;
            if (rule.get("property") === c.prop) {
                r = rule.get("rule");
                if (r === "IsRequired") {
                    c.required = true;
                } else if (r === "IsNumeric") {
                    if ($.isNumeric(rule.get("minValue"))) {
                        c.min = rule.get("minValue");
                    } else if (rule.get("isPercent") || !rule.get("allowNegative")) {
                        c.min = 0;
                    }
                    if ($.isNumeric(rule.get("maxValue"))) {
                        c.max = rule.get("maxValue");
                    } else if (rule.get("isPercent")) {
                        c.max = 100;
                    }
                    if (rule.get("allowDecimalPoint") && !c.step) {
                        c.step = "any";
                    }
                } else if (r === "IsAlpha") {
                    if (rule.get("maxLength")) {
                        c.maxlength = rule.get("maxLength");
                    }
                } else if (r === "IsDate") {
                    function formatDate(date) {
                        if (date === 'today' || date === 'now') {
                            var d = new Date();
                            // get today's date in current timezone
                            d = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
                            if (date === 'today')
                                date = d.substr(0,10);
                            else
                                date = d;
                        }
                        return date;
                    }
                    if (rule.get("minValue")) {
                        c.min = formatDate(rule.get("minValue"));
                    }
                    if (rule.get("maxValue")) {
                        c.max = formatDate(rule.get("maxValue"));
                    }
                } else if (r === "IsConditionallyRequired") {
                    c.required = Rule.evaluateCondition(rule, model);
                    if (BaseView.hasClassName(c.className, 'nrm-enable-required')) {
                        this.setEditable(c, c.required);
                    } else if (rule.get("valueAllowed") === false) {
                        c.hidden = !c.required;
                    }
                } else if (r === "IsConditionallyAllowed") {
                    condition = Rule.evaluateCondition(rule, model);
                    if (BaseView.hasClassName(c.className, 'nrm-enable-allowed')) {
                        this.setEditable(c, condition);
                    } else {
                        c.hidden = !condition;
                    }
                }
            }
        },
        /**
         * Sets the selected property on the configuration for a select option element if the value of the option
         * matches the value of the control, should be called after binding the data to the control configuration.
         * @param {module:nrm-ui/views/baseView~LovConfig} c The control configuration
         * @param {module:nrm-ui/views/baseView~OptionConfig} [opt] The select option configuration.  If this
         * parameter is omitted, the selected value will be applied to all options defined for the controls.
         * @returns {Boolean}
         * Indicates whether the option was selected.
         */
        applySelectedValue: function(c, opt) {
            
            function forEachOption(opt) {
                if (this.isMultiSelect(c)) {
                    var idx = $.inArray(opt.value, c.value);
                    opt.selected = idx > -1;
                    return idx;
                } else {
                    opt.selected = opt.value === c.value;
                    return opt.selected ? 0 : -1;
                }
            }
            function forEachGroup(optgroup) {
                _.each(optgroup.options, function(opt) {
                    var idx = forEachOption.call(this, opt);
                    if (idx > -1) {
                        found.push(idx);
                    }
                }, this);
            }
            function getContextAttr(attr, dflt) {
                return (c.context && c.context[attr]) || (c.ctx && c.ctx[attr]) || dflt;
            }
            function createSelectedValue(options, value, index) {
                if ($.inArray(index, found) > -1) {
                    return false;
                }
                var selected = { value: value, selected: true }, displayVal;
                displayVal = c.displayValue;
                if (displayVal) {
                    if (_.isArray(displayVal) && $.isNumeric(index)) {
                        displayVal = displayVal[index];
                    }
                    selected.text = displayVal;
                }
                
                if (c.columns) {
                    var idAttr = c.idAttr || getContextAttr('idAttr', 'id');
                    var nameAttr = displayVal && getContextAttr('nameAttr');
                    selected.columns = _.map(c.columns, function(col) {
                        if (_.isString(col)) {
                            col = { prop: col };
                        }
                        var colValue = "";
                        if (col.prop === idAttr) {
                            colValue = value;
                        } else if (col.prop === nameAttr) {
                            colValue = displayVal;
                        }
                        return $.extend({ }, col, { value: colValue });
                    });
                }
                options.push(selected);
                return selected;
            };
            function addSelectedValues() {
                var options = [], optgroup;
                if (c.optgroups) {
                    optgroup = _.find(c.optgroups, function(group) {
                        return !group.text || group.isHeader;
                    }) || c.optgroups.unshift(optgroup = { text: "" });
                } else {
                    optgroup = c;
                }
                if (_.isArray(c.value)) {
                    _.each(c.value, _.partial(createSelectedValue, options));
                } else if (c.value) {
                    createSelectedValue(options, c.value, 0);
                }
                if (_.isArray(optgroup.options)) {
                    options = optgroup.options.concat(options);
                } 
                return (optgroup.options = options);
            }
            var found = [];
            if (opt) {
                return forEachOption.call(this, opt) > -1;
            } else {
                if (c.options || c.optgroups) {
                    if (c.optgroups) {
                        _.each(c.optgroups, forEachGroup, this);
                    } else {
                        forEachGroup.call(this, c);
                    }
                    if (_.isArray(c.value)) {
                        if (found.length < c.value.length) {
                            addSelectedValues();
                        }
                    } else if (c.value && !found.length) {
                        addSelectedValues();
                    }
                } else if (c.lov && c.value) {
                    addSelectedValues();
                }
            }
            return found;
        },
        /**
         * Apply the Select2 plugin to an element.
         * @param {external:module:jquery} el The JQuery element that should be initialized with the Select2 plugin.
         * @param {module:nrm-ui/views/baseView~ControlConfig} control The control configuration
         * @param {external:module:jquery} parent The parent element that contains the control.
         * @returns {undefined}
         * @see {@link http://select2.github.io/select2/|Select2 3.5.x documentation}
         */
        applySelect2: function(el, control, parent) { 
            var pluginOpt;
            // originally there was some confusion between "pluginOpts" and "pluginOpt"
            // while "pluginOpt" is now deprecated in favor of "pluginOpts", this will help ease the transition.
            if (control.pluginOpt && !control.pluginOpts) {
                control.pluginOpts = control.pluginOpt;
            }
            if (control.placeholder) {
                pluginOpt = {
                    placeholder: control.placeholder,
                    allowClear: !control.required
                };
                if (!control.multiple)
                    pluginOpt.placeholderOption = 'first';
                if (control.pluginOpts) {
                    pluginOpt = $.extend(pluginOpt, control.pluginOpts);
                }
            } else {
                pluginOpt = control.pluginOpts;
            }

            if (control.columns && (!control.pluginOpts || !control.pluginOpts.formatResult)) {
                pluginOpt = $.extend({ }, pluginOpt, {
                    formatResult: function(item, container, query, escapeMarkup) {
                        function appendColumn(memo, col, value) {
                            var cls = col.className ? ' class="' + col.className + '"' : "", 
                                    style = _.isString(col.style) ? ' style="' + col.style + '"' : "";
                            return memo + '<div' + cls + style + '><span>' + escapeMarkup(value) + ' </span></div>';
                        }
                        var rowClass = control.rowClass || "row", opt = $(item.element[0]), 
                                ret = '<div class="' + rowClass + '">', firstCol = opt.attr('data-nrm-col0');
                        if (firstCol == null && opt.is('optgroup')) {
                            // deprecated: optgroup label is delimited list of column headers
                            var captions = opt.attr('label') || '', sep = control.headerSep || ',';
                            if (captions.indexOf(sep) <= -1) return captions;
                            captions = (opt.attr('label') || '').split(control.headerSep || ',');
                            ret = _.reduce(control.columns, function(memo, col, i) {
                                if (i > captions.length) return memo;
                                return appendColumn(memo, col, captions[i]);
                            }, ret);
                        } else if (firstCol == null) {
                            return opt.html();
                        } else {
                            ret = _.reduce(control.columns, function(memo, col, i) {
                                return appendColumn(memo, col, opt.attr('data-nrm-col' + i) || '');
                            }, ret);
                        }
                        return ret + '</div>';

                    }
                });
                if (control.header && !control.groupAttr) {
                    pluginOpt.dropdownCssClass = BaseView.addClassName(pluginOpt.dropdownCssClass, 'nrm-lov-header');
                }
                if (control.searchAllColumns && !pluginOpt.matcher) {
                    pluginOpt.matcher = function(term, text, option) {
                        term = term.toUpperCase();
                        return !!_.find(control.columns, function(col, i) {
                            var text = option.attr('data-nrm-col' + i) || '',
                                match = text.toUpperCase().indexOf(term);
                            if (col.matchStart) {
                                return match === 0;
                            } else {
                                return match !== -1;
                            }
                        });
                    };
                }
            }
            if (control.type === 'select' && (control.multiple || control.loading)) {
                pluginOpt = $.extend({
                     formatNoMatches : function(term) { 
                         if (control.error)
                             return '<strong class="text-danger">Failed to load values</strong>';
                         if (control.loading)
                             return '<strong>Loading...</strong>';
                         else if (term)
                             return 'No matches found';
                         else
                             return 'All items are selected'; 
                     }
                }, pluginOpt);
            }
            require(['use!select2'], _.bind(function() {
                if (control.loading) {
                    pluginOpt = $.extend({}, pluginOpt, {
                        dropdownCssClass: BaseView.addClassName(pluginOpt && pluginOpt.dropdownCssClass, 'nrm-loading')
                    });
                }
                
                var valueLoading = control.valueLoading;
                if (valueLoading && valueLoading.promise) {
                    // remove loading indicator before applying select2
                    this.setValueLoading(el, false);
                    $.when(valueLoading).done(function() {
                        valueLoading = false;
                    });
                } else {
                    valueLoading = false;
                }
                if (pluginOpt) {
                    el.select2(pluginOpt);
                } else {
                    el.select2();
                }
                if (valueLoading) {
                    // restore loading indicator
                    this.setValueLoading(el, true, {size: 'small'});
                }
                var title = el.attr('title'), 
                    $select2 = el.select2('container'), $input = $('input', $select2),
                    focusId = $input.attr('id'),$label, labelId;
                if (title) $input.attr('title', title);
                if (focusId) {
                    $label = this.getLabelForElement(el, parent);
                    if ($label.length) {
                        labelId = $label.attr('id');
                        if (!labelId) {
                            $label.attr('id', (labelId = _.uniqueId('nrm-label')));
                        }
                        el.attr('aria-labelledby', labelId);
                        $label.attr('for', focusId);
                    }
                }
                if (control.openDropdown) {
                    el.select2('open');
                }
            }, this));
        },
        /**
         * Initialize a "list of values" (LOV) type of control.
         * @param {module:nrm-ui/views/baseView~LovConfig} control Control configuration object
         * @param {module:nrm-ui/models/application~ContextConfig} context Context configuration object for the
         * associated LOV entity type.
         * @param {Function} [callback] A function that will be called if the initialization succeeds.
         * @param {Function} [failCallback] A function that will be called if the initialization fails.
         * @param {Object} [options] Additional options to pass to 
         * {@link module:nrm-ui/models/application#getCollection|Nrm.app.getCollection}
         * @returns {module:external:jquery~Promise}
         * Returns a promise that will be resolved or rejected when the initialization is completed.
         */
        initLov: function(control, ctx, callback, failCallback, options) {
            ctx.loadType = ctx.loadType || 'auto';
            control.nameAttr = control.nameAttr || ctx.nameAttr; 
            var loading = control.loading = ++lovLoading, 
                    valueLoading = control.valueLoading, 
                    doCallback = _.bind(function() {
                        if (_.isFunction(callback)) {
                            callback.apply(this, arguments);
                        }
                    }, this);
            options = $.extend({
                ajax:{global:false}
            }, options);
            return $.when(Nrm.app.getCollection(ctx, options, this)).done(function(collection) {
                if (this.removed || control.loading !== loading) {
                    return this;
                }
                // shallow extend for now, if we need a deeper extend it may need to borrow from Nrm.app.getNestedContext
                ctx = $.extend({ }, ctx, control.context);
                ctx.idAttr = ctx.idAttr || control.idAttr;
                ctx.nameAttr = ctx.nameAttr || control.nameAttr;
                control.idAttr = BaseView.getIdAttributeName(control, ctx, collection);
                if (ctx.groupAttr && control.groupAttr === undefined) {
                    control.groupAttr = ctx.groupAttr;
                }
                control.collection = collection;
                var impl = { };
                _.each(['applySelectedValue', 'isSelect2', 'applySelect2','setValueLoading'], function(method) {
                   if (_.isFunction(this[method])) {
                       impl[method] = _.bind(this[method], this);
                   } else {
                       impl[method] = _.bind(BaseView[method], BaseView);
                   }
                }, this);
                function eachModel(element, index) {
                    var opt = { 
                        value: Nrm.app.getModelVal(element, control.idAttr)
                    };
                    control.titleAttr = control.titleAttr || ctx.titleAttr; 
                    if (control.titleAttr) {
                        opt.title = Nrm.app.getModelVal(element, control.titleAttr);
                    }
                    if (control.columns) {
                        // commented out experimental default grid classes (col-xs-2 for first column and distribute remaining 10 grid cols
                        /*var len = control.columns.length - 1, grid = len && Math.floor(10 / len), mod = len && 10 % len;
                        control.columns = _.map(control.columns, function(col, i) {
                            if (_.isString(col)) col = { prop: col };
                            if (!col.className && grid) col.className = "col-xs-" + (i < len ? (i && grid) || 2 : grid + mod);
                            return col;
                        });*/
                        opt.columns = _.map(control.columns, function(col) {
                            if (_.isString(col)) col = { prop: col };
                            return $.extend({ }, col, { value: Nrm.app.getModelVal(element, col.prop) });
                        });
                    }
                    if (ctx.nameAttr) {
                        opt.text = Nrm.app.getModelVal(element, ctx.nameAttr);
                    }
                    return opt;
                }
                if (control.groupAttr) {
                    var groups = collection.groupBy(function(model) {
                        return Nrm.app.getModelVal(model, control.groupAttr) || '';
                    });
                    control.optgroups = _.map(groups, function(group, key) {
                        return {
                            text: key,
                            options: _.map(group, eachModel, this)
                        }
                    }, this);
                } else {
                    var opts = collection.map(eachModel, this);
                    if (control.columns && control.header) {
                        control.optgroups = [{
                            text: '[HEADER]',
                            isHeader: true,
                            columns: _.map(control.columns, function(col) {
                                if (_.isString(col)) col = { prop: col };
                                var label = col.label || (col.prop || '').toUpperCase();
                                return $.extend({ }, col, { value: label });
                            }),
                            options: opts
                        }];
                    } else {
                        control.options = opts;
                    }
                }
                control.loading = false;
                var el = BaseView.findControl(this.$el, control);
                if (el && el.length > 0) {
                    var selector = (control.tablecell ? '.' : '#') + control.id, 
                        template = Handlebars.templates[control.type], isSelect2;
                    if (control.tablecell) {
                        el = el.not('.select2-container');
                    }
                    isSelect2 = impl.isSelect2(el, control);
                    el.each(function() {
                        var $this = $(this), newEl, controlEl, origEl = $this.is(selector) ? $this : $(selector, $this), 
                            selectedOptions, ctrl = control, origControl = origEl.data('nrm-control'),
                            isContainer = !origEl.is(':input');
                        if (ctrl.tablecell) {
                            ctrl = $.extend({ }, control, { id: origEl.attr('id') });
                            if (_.isArray(ctrl.optgroups)) {
                                ctrl.optgroups = [].concat(control.optgroups);
                            } else if (_.isArray(ctrl.options)) {
                                ctrl.options = [].concat(control.options);
                            }
                        }
                        // TODO: do we really need this now that we have $(...).data('nrm-control')?
                        if (!valueLoading) {
                            if (origEl.is('select')) {
                                selectedOptions = $('option:selected', origEl);
                            } else if (!isContainer) {
                                selectedOptions = origEl;
                            } else {
                                selectedOptions = $('input:checked', origEl);
                            }
                            if (ctrl.multiple || selectedOptions.length > 1) {
                                ctrl.value = _.map(selectedOptions, function(item) {
                                    return $(item).val();
                                });
                                ctrl.displayValue = _.map(selectedOptions, function(item) {
                                    return $(item).text();
                                });
                            } else {
                                ctrl.value = selectedOptions.val();
                                ctrl.displayValue = selectedOptions.text();
                            }
                        }
                        impl.applySelectedValue(ctrl);
                        newEl = $(template(ctrl));
                        controlEl = $(selector, newEl);
                        if (isSelect2 && origEl.is('.select2-offscreen')) {
                            ctrl.openDropdown = origEl.select2('container').is('.select2-dropdown-open');
                            origEl.select2('destroy');
                        }
                        origEl.html(controlEl.html());
                        if (origControl && origControl !== control) {
                            // keep the control data in sync for controls in a data table
                            // this allows inheritance and sorting to work correctly
                            $.extend(origControl, _.pick(ctrl, 'collection', 'options', 'optgroups', 'idAttr'));
                        }
                        if (isSelect2) {
                            impl.applySelect2(origEl, ctrl);
                        }
                        if (isContainer && origControl && origControl.prop) {
                            // set the data-nrmprop attribute on child input elements (typically radio buttons), 
                            // but only if the attribute wasn't rendered in the template
                            if (!$('[data-nrmprop="' + origControl.prop + '"]', origEl)
                                    .data('nrm-control', origControl).length) {
                                $('input', origEl).attr('data-nrmprop', ctrl.prop).data('nrm-control', origControl);
                            }
                        }
                        //if (value) origEl.val(value);
                    });
                } else {
                    impl.applySelectedValue(control);
                }
                doCallback(control, el, collection);
            }).fail(function() {
                if (_.isFunction(failCallback)) {
                    failCallback.apply(this, arguments);
                }
            });
        },
        /**
         * Error handler for errors encountered while loading a LOV
         * @param {module:nrm-ui/models/application~ContextConfig} ctx Entity context
         * @param {*} data Arbitrary data
         * @param {external:module:jquery.jqXHR|string|Error} response The response object that produced the error
         * or something equivalent for client-side errors.
         * @returns {undefined}
         */
        onLovError: function(ctx, data, response) {
            data = data || { };
            if (!data.error) {
                var msg = ctx ? "Failed to load LOV for " + (ctx.caption || ctx.apiKey) : "Failed to load LOV";
                data.error = Nrm.app.normalizeErrorInfo(msg, data, response);
            }
            //var template = Handlebars.templates["error"];
            Nrm.event.trigger("showErrors", errorTemplate(data), { notify: true, append: true, allowRecall: false });
        },
        /**
         * Indicates whether a control type should be considered an input type.
         * @param {string} type The type of control.
         * @returns {Boolean}
         */
        isInputControl: function(type) {
            return type === "checkbox" || type === "radio" || type === "textArea" || type == "shape" ||
                    /^input|^select/.test(type);
        },
        /**
         * Set the state for context-sensitive elements, typically the "actions" associated with a data table.
         * @param {Object} options
         * @param {external:module:jquery} options.$items The selection of JQuery objects to update
         * @param {Boolean} options.enable Indicates whether item should be enabled, although this may be overridden
         * by a combination of the <pre><code>nrmDataTable-enableEditable</code></pre> and a higher priority indicator
         * of editable state.
         * @param {Boolean} options.singleItem Indicates that the item should only be enabled if a single row is 
         * selected.
         * @param {Object} options.routes A mapping of element ids to href, corresponding to the return value from
         *  {@link module:nrm-ui/views/baseView#getRoutes}. The href values for these elements will be dynamically
         *  computed from a concatenation of the original href and the path option, plust the selected row if the 
         *  singleItem option is set.
         * @param {module:nrm-ui/views/baseView~ControlConfig} options.control The parent control configuration
         * @param {module:nrm-ui/models/application~ContextConfig} options.context The context configuration 
         * associated with the view.
         * @param {external:module:backbone.Model} options.model The model associated with the view
         * @param {external:module:backbone.Collection} options.collection The collection bound to the data table.
         * @param {string} options.path Navigation path for this control (usually the concatenation of the navigation
         * path and the property bound to the table)
         * @returns {undefined}
         */
        setItemsEnabled: function(options) { //$items, enable, routes, singleItem) {
            var editable = !(options.control && options.control.readonly) && 
                    Nrm.app.isEditable(options.context, options.model);
            var refType = options.control && options.control.refType; 
            if (editable)
                this.setControlEnabled(options.$items, options.enable);
            else {
                this.setControlEnabled(options.$items.not(".nrmDataTable-enableEditable"), options.enable);
                this.setControlEnabled(options.$items.filter(".nrmDataTable-enableEditable"), false);
            }
            if (options.routes) {
                $.each(options.$items, function() {
                var $this = $(this);
                    if ($this.is('li'))
                        $this = $this.children('a');
                    var id = $this.attr("id");
                    if (id && options.routes[id]) {
                        var path = options.enable && options.path;
                        if (path && $this.is(".nrmDataTable-rootPath")) {
                            path = refType;
                        }
                        var href = options.routes[id].href, selected, isEditItem = href === "#edit";
                        if (options.singleItem && options.collection) {
                            if (path) {
                                var selector = {"selected": true};
                                if (options.collection.findWhere) {
                                    selected = options.collection.findWhere(selector);
                                } else {
                                    selected = _.findWhere(options.collection, selector);
                                }
                            }
                        } else if (options.singleItem) {
                            selected = options.model;
                        }
                        if (path) {
                            href = href + "/" + path + (selected ? "/" + selected.id : "");
                        }
                        if (path && isEditItem && !$this.is(".nrmDataTable-enableEditable,.nrmDataTable-enableReadonly")) {
                            editable = (selected ? Nrm.app.isEditable(options.context, selected) : editable);
                            var text = $this.text(), titleAttr = [ 'title', 'aria-label'];
                            if (text && text.replace(/\s/g, '')) {
                                $this.text(BaseView.replaceEditText(text, editable)); 
                            } else {
                                _.find(titleAttr, function(attr) {
                                    text = $this.attr(attr);
                                    return text && $this.attr(attr, BaseView.replaceEditText(text, editable));
                                });
                            }
                        }
                        $this.attr("href", href);
                    }
                });
            }
        },
        /**
         * Convenience function for toggling between two text variants.
         * @param {string} text Original text
         * @param {Boolean} flag If true, replace the first token with the second token, if false, replace the second
         * token with the first token.
         * @param {string[]} tokens Array of two tokens that either be the replacement or value to replace depending on
         * the flag parameter
         * @returns {string}
         * The input text with replacement applied
         */
        toggleText: function(text, flag, tokens) {
            var s1 = tokens[flag ? 0 : 1], s2 = tokens[flag ? 1 : 0];
            return text.replace(s1, s2);
        },
        /**
         * Replaces "View" with "Edit" or vice versa, depending on the editable parameter.
         * @param {string} text Original text
         * @param {Boolean} editable Indicates whether the resulting text should reflect editable state or view-only.
         * @returns {string}
         * The input text with replacement applied.
         */
        replaceEditText: function(text, editable) {
            return BaseView.toggleText(text, editable, ["View", "Edit"]);
        },
        /**
         * Set a loading indicator on an element.
         * @param {external:module:jquery} $el The element that is loading
         * @param {Boolean} loading indicates whether loading indicator should be activated or deactivated
         * @param {module:nrm-ui/plugins/nrmLoadingIndicator~PluginOptions} [options] Options to pass to the 
         * {@link nrm-ui/plugins/nrmLoadingIndicator|NrmLoadingIndicator plugin}
         * @returns {undefined}
         */
        setValueLoading: function($el, loading, options) {
            if (loading) {
                $el.nrmLoadingIndicator('activate', options);
            } else {
                $el.nrmLoadingIndicator('deactivate');
            }
            if ($el.is("table")) {
                var disableElements, 
                    tableActions = $('.table-actions', $el.closest('.nrm-table-edit-container'));
                if (tableActions.length && loading) {
                    // disable all buttons and input elements in the table-actions div, if not already disabled
                    disableElements = $(':input,.btn', tableActions).not('.disabled,[disabled],[readonly]');
                    this.setControlEnabled(disableElements, false).addClass('nrm-loading-actions');
                } else if (tableActions.length) {
                    // enable all buttons disabled by a previous call to setValueLoading)
                    disableElements = $('.nrm-loading-actions', tableActions).removeClass('nrm-loading-actions');
                    this.setControlEnabled(disableElements, true);
                }
            }
        },
        /**
         * Show or hide an element. 
         * @param {external:module:jquery} $selection The JQuery object to update
         * @param {Boolean} hidden Indicates whether the element should be hidden (true) or visible (false).
         * @param {String} [hiddenClass] Optional class that should be added or removed to hide or show the element.
         * @returns {external:module:jquery} The original JQuery selection.
         */
        setControlHidden: function($selection, hidden, hiddenClass) {
            
            var toggleVisibility = _.bind(function($el) {
                // find container using id + '-container' convention first...
                var id = $el.attr('id'), 
                        $container = id && $('#' + id + '-container', this.$el), 
                        method = hidden ? 'hide' : 'show',
                        $label,
                        displayTarget;
                if (!$container || !$container.length) {
                    // if element is contained in an input-group, hide the group
                    $container = $el.closest('.input-group');
                    if ($el.is('input[type="hidden"]')) {
                        displayTarget = $el.attr('data-target-display');
                        if (displayTarget) {
                            $el = $(displayTarget, this.$el);
                        }
                    }
                    if (!$container.length) {
                        $container = $el;
                    }
                    if ($el.is('.tab-pane')) {
                        $container = $('[aria-controls="' + id + '"]', this.$el).parent();
                        if (hidden && $el.is('.active')) {
                            // if hiding the active tab, select first enabled and visible tab.
                            $el.siblings().each(function() {
                                var $tab = $('[aria-controls="' + this.id + '"]', $container.parent()), 
                                    $li = $tab.parent(); 
                                if (!$li.is('.disabled') && $li.css('display') !== 'none') {
                                    $tab.tab('show');
                                    return false;
                                }
                            });
                        }
                    } else if (!$el.is('.collapse')) {
                        // hide both control and label
                        $label = this.getLabelForElement($el, this.$el);
                        $container = $container.add($label);
                    }
                }
                if (hiddenClass) {
                    // add or remove CSS class to hide or show (for example, "invisible")
                    $container[hidden ? 'addClass' : 'removeClass'](hiddenClass);
                } else if ($container.is('.collapse')) {
                    // use Bootstrap Collapse plugin for elements with .collapse class
                    $container.collapse(method);
                } else {
                    // JQuery show/hide method
                    $container[method]();
                }
            }, this);
                    
            return $selection.each(function() {
                toggleVisibility($(this));
            });
        },
        /**
         * Update the enabled status of an element.  The actual property that is modified depends on the type of
         * element, it may be the "readonly" attribute for certain input elements, "disabled" for others, or
         * the "disabled" class for elements that can't be disabled in the HTML standard.
         * @param {external:module:jquery} $selection The JQuery object to update
         * @param {Boolean} enable Indicates whether the element should be enabled (true) or readonly (false).
         * @returns {external:module:jquery} The original JQuery selection.
         */
        setControlEnabled: function($selection, enable) {
            var types = BaseView.inputTypes();
            $selection.each(function() {
                var $this = $(this), children, target, $container;
                if ($this.is('.nrm-loading-actions')) {
                    // action control was disabled due to related control loading status
                    if (!enable) {
                        // prevent the control from being enabled when setValueLoading is called
                        $this.removeClass('nrm-loading-actions');
                    }
                    return; // don't actually enable or disable now
                }
                if ($this.is('input[type="hidden"]')) {
                    target = $this.attr('data-target');
                    if (target) {
                        $this = $(target);
                    }
                } else if ($this.is('.tab-pane')) {
                    $container = $('[aria-controls="' + this.id + '"]', this.$el).parent();
                    if (!enable && $this.is('.active')) {
                        // if disabling the active tab, select first enabled and visible tab.
                        $this.siblings().each(function() {
                            var $tab = $('[aria-controls="' + this.id + '"]', $container.parent()), 
                                $li = $tab.parent(); 
                            if (!$li.is('.disabled') && $li.css('display') !== 'none') {
                                $tab.tab('show');
                                return false;
                            }
                        });
                    }
                    $this = $container;
                }
                if ($this.is(types.selectors.disabledProp)) {
                    $this.prop('disabled', !enable);
                } else if ($this.is(':input')) {
                    $this.prop('readonly', !enable);
                } else {
                    if (enable) {
                        $this.removeClass('disabled');
                    } else {
                        $this.addClass('disabled');
                    }
                    children = $this.children().filter('a');
                    if (children.length) {
                        $this = children;
                    }
                    $this.attr('aria-disabled', !enable);
                }
            });
            return $selection;
        },
        /**
         * Sets a control configuration object to readonly state. Actual property that is set may vary depending on
         * the type of control.
         * @param {module:nrm-ui/views/baseView~ControlConfig} control The control configuration
         * @returns {module:nrm-ui/views/baseView~ControlConfig} The original control
         */
        setReadOnly: function(control) {
           return this.setEditable(control, false);
        },
        /**
         * Sets editable state of a control configuration object.  Actual property that is set may vary depending on
         * the type of control.
         * @param {module:nrm-ui/views/baseView~ControlConfig} control The control configuration
         * @param {Boolean} enable Indicates whether the control should be editable
         * @returns {module:nrm-ui/views/baseView~ControlConfig} The original control
         */
        setEditable: function(control, enable) {
            if (!control) {
                return control;
            }
            var types = BaseView.inputTypes();
            if (control.type === 'textArea' || control.type === 'shape' || 
                    ((!control.inputType || types[control.inputType].disabled === 'readonly') 
                    &&/^input/.test(control.type))) {
                control.readonly = !enable;
            } else {
                control.disabled = !enable;
            }
            return control;
        },
        /**
         * Test a string representing one or more class names separated by spaces to determine whether it contains a 
         * specific class name.
         * @param {string} className The class attribute value (one or more class names separated by spaces)
         * @param {string} match The class name to search for.
         * @returns {Boolean}
         * Indicates whether the class attribute value contains the class name.
         */
        hasClassName: function(className, match) {
            className = _.isString(className) && className.trim();
            match = _.isString(match) && match.trim();
            if (!className || !match) {
                return false;
            }
            var existing = className.split(whitespace), 
                    test = _.uniq(match.split(whitespace)),
                    matches = _.intersection(existing, test);
            return matches.length === test.length;
        },
        /**
         * Append a class name to a string representing one or more class names separated by spaces, but only if the
         * class name to append is not already in the string.
         * @param {string} className Original class attribute value.
         * @param {string} addClass The class to append
         * @returns {String}
         * Original class attribute value with the new class appended if necessary.
         */
        addClassName: function(className, addClass) {
            if (!_.isString(addClass) || !(addClass = addClass.trim())) {
                return className;
            }
            className = _.isString(className) && className.trim();
            if (!className) {
                return addClass;
            }
            
            var existing = className ? className.split(whitespace) : [], 
                    test = addClass.split(whitespace), 
                    combined = _.union(existing, test);
            return combined.join(' ');
        },
        /**
         * Remove a class name from a string representing one or more class names separated by spaces.
         * @param {string} className Original class attribute value.
         * @param {string} removeClass The class to remove
         * @returns {String}
         * Original class attribute value with the matching class name removed.
         */
        removeClassName: function(className, removeClass) {
            if (!_.isString(className) || !_.isString(removeClass) || !(removeClass = removeClass.trim())) {
                return className;
            }
            className = className.trim();
            if (!className) {
                return className;
            }
            
            var existing = className.split(whitespace), 
                    test = removeClass.split(whitespace), 
                    combined = _.difference(existing, test);
            return combined.join(' ');
        },
        /**
         * Get the name of the id attribute either from the "idAttr" property of the control configuration or context 
         * configuration, or the "idAttribute" property of the model prototype associated with the collection, or
         * assume the id attribute name is "id" if it can't be determined
         * associated with the
         * @param {module:nrm-ui/views/baseView~ControlConfig} [control] Control configuration
         * @param {module:nrm-ui/models/application~ContextConfig} [context] Context configuration
         * @param {external:module:Backbone.Collection|external:module:Backbone.Model} [collection] A Backbone 
         * collection or model instance.
         * @returns {String}
         * The computed id attribute name based on best available information.
         */
        getIdAttributeName: function(control, context, collection) {
            if (control && control.idAttr) {
                return control.idAttr;
            } else if (collection instanceof Backbone.Collection) {
                return collection.model && collection.model.prototype.idAttribute;
            } else if (collection instanceof Backbone.Model) {
                return collection.idAttribute;
            } else {
                return (control && control.context && control.context.idAttr) || (context && context.idAttr) || "id";
            }
        },
        /**
         * Get the label element associated to a control element.
         * @param {external:module:jquery} $el The element 
         * @param {external:module:jquery} [parent] The parent element that contains the label
         * @returns {external:module:jquery}
         * The associated label element 
         */
        getLabelForElement: function($el, parent) {
            var $label;
            $el && $el.each(function() {
                var $this = $(this), label = $this.attr('aria-labelledby'), id = $this.attr('id');
                $label = $(label ? ('#' + label) : 'label[for="' + id + '"]', parent);
                if (!$label.length)
                    $label = $el.closest('label');
                return !$label.length;
            });
            return $label;
        },
        /**
         * Apply classes and other dynamic properties at the view level after rendering all controls.
         * @param {module:nrm-ui/views/baseView~FormConfig} [config] The form configuration.
         * @param {external:module:jquery} [$el] The parent element.
         * @param {String|array.<String>} [props] Optional configuration property or list of configuration properties to 
         * apply.
         * @returns {module:nrm-ui/views/baseView}
         * Returns this instance to allow chaining.
         */
        applyClasses: function(config, $el, props) {
            if (config && $el && $el.length) {
                if (props) {
                    config = _.pick(config, props);
                }
                if (config.containerClass)
                    $el.addClass(config.containerClass);
                if (config.inputClass)
                    $('.form-control', $el).addClass(config.inputClass);
                if (config.btnClass)
                    $('.btn', $el).not('.btn-xs').addClass(config.btnClass);
                if (config.helpContext) {
                    $el.addClass('nrm-help-provider').attr('data-nrm-help-context', config.helpContext);
                }
            }
            return this;
        },
        /**
         * Computes dynamic href and enabled status for a context menu item based on the navigation context path of the
         * selected item (e.g. node in the Navigator tree, or row in a search results grid), including optional submenu 
         * generated from subtype configuration and recursive submenu item processing.
         * @param {module:nrm-ui/views/baseView~MenuItemConfig} item The menu item configuration
         * @param {Object} options
         * @param {string} options.path The navigation path for the selected item
         * @param {module:nrm-ui/models/application~ContextConfig} options.context Context configuration
         * @param {string} [options.group] The group value for the selected item if it is a group folder node.
         * @param {Boolean} [options.editable] Any menu items with "enableEditable" set to true will only be enabled if
         * this option is set to true.
         * @param {Boolean} [options.enableSpatial] Any menu items with "enableSpatial" set to true will only be 
         * enabled if this option is set to true.
         * @returns {module:nrm-ui/views/baseView~MenuItemConfig}
         * Returns the original context menu item with dynamic configuration options set.
         */
        computeHref: function(item, options) {
            var enabled, selectedPath = options.path, 
                    group = options.group, 
                    ctx = options.context,
                    editable = options.editable,
                    enableSpatial = options.enableSpatial;    
            function createSubmenu(item) {
                if (!item.items && item.enableSubtypes && ctx.typemap && _.size(ctx.typemap) > 0) {
                    var isRouteAction = BaseView.hasClassName(item.className, "nrm-route-action");
                    item.items = _.reduce(ctx.typemap, function(memo, value, key) {
                        if (value.enableMenu === false) return memo;
                        memo = memo || [ ];
                        var nodetype = value.nodetype || value;
                        var alias = value.alias || (_.isString(key) ? key : value);
                        var subtype = nodetype.replace(/,/g, '%2C');
                        var subitem = { "id" : item.id + "-" + nodetype,
                                 "label" : (item.subtypePrefix ? item.subtypePrefix + " " + alias : alias),
                                 "enableSpatial" : !!item.enableSpatial
                        };
                        if (item.href && item.href !== "#")
                            subitem.href = (item.enableGroups && group) ? (item.href + subtype) : (item.href + ';' + subtype);
                        if (isRouteAction)
                            subitem.className = "nrm-route-action";
                        memo.push(subitem);
                        return memo;
                    }, null);
                    if (item.items) {
                        item.className = BaseView.addClassName(item.className, "dropdown-submenu");
                    }
                    item.href = "#";
                }
                return item;
            }
            function setEnabled(item) {
                if (!enabled) {
                    if (!item.items) {
                        item.disabled = true;
                    } else {
                        _.each(item.items, setEnabled);
                    }
                }
                return item;
            }
            function computeHref(item) {
                var generateHref = item.generateHref !== false && _.reduce([ 
                    "nrmDataTable-singleSelect", 
                    "nrmDataTable-rootPath" 
                ], function(memo, className) {
                        if (!memo) return false;
                        return !BaseView.hasClassName(item.className, className);
                    }, true);
                if (item.href && item.href !== "#" && generateHref) {
                    var re = new RegExp("/" + (ctx.refType || ctx.apiKey) + "$");
                    var appendGroup = item.enableGroups && group;
                    var path = "/" + (appendGroup ? Nrm.app.getGroupPath(selectedPath, group) : selectedPath);
                    if (appendGroup && item.enableSubtypes)
                        path += ",";
                    if (re.test(item.href))
                        item.route = item.href.replace(re, '');
                    else
                        item.route = item.href;
                    item.href = item.route + path;
                    item.generateHref = false;
                }
                if (item.items)
                    _.each(item.items, computeHref, this);
                enabled = !(item.disabled || 
                        (item.enableEditable && !editable) || 
                        (item.enableSpatial && !enableSpatial) ||
                        (group && $.isArray(item.enableGroups) && $.inArray(group, item.enableGroups) < 0));
                return setEnabled.call(this, createSubmenu.call(this, item));
            }
            return computeHref.call(this, item);
        },
    
        /**
         * Get dynamic context menu items including a set of default items that may be overridden or extended by the
         * context configuration.
         * @param {*} node The item that provides the context menu, type of this parameter will vary depending on the 
         * UI component that is associated with the context menu.  The default implementation does not use this
         * parameter, except to pass it on to the custom function if it is defined.
         * @param {Object} options
         * @param {string} options.nodetype The node type.
         * @param {string} options.path The navigation path for the selected item.
         * @param {module:nrm-ui/models/application~ContextConfig} options.context Context configuration.
         * @param {string} options.id The id value for the selected item, could be a model id or the last component of
         * the context navigation path if the item represents a collection, or empty/undefined if the item represents
         * a new model.
         * @param {string} [options.group] The group value for the selected item if it is a group folder node.
         * @param {external:module:backbone.Model} [options.model] The model that is associated with the selected item,
         * this may be used to determine editable and spatially enabled status.
         * @param {external:module:backbone.Collection} [options.collection] The collection that is associated with the
         * selected item.
         * @param {module:nrm-ui/views/baseView~MenuItemConfig[]} [options.items] Additional custom items that should 
         * be provided for this context menu, these items may override default items and context configuration.
         * @param {string} [options.prefix] Prefix to prepend to context menu item ids to ensure uniqueness.
         * @param {Boolean} [options.enableGroups] Indicates whether menu items should be enabled by default on group 
         * folder nodes, the behavior may be overridden in individual menu item configuration.
         * @returns {module:nrm-ui/views/baseView~MenuItemConfig[]}
         * Array of context menu items.
         */
        getContextItems: function(node, options) {
           var nodetype = options.nodetype, 
                    ctx = options.context, 
                    nodeId = options.id, 
                    group = options.group, 
                    model = options.model, 
                    collection = options.collection,
                    selectedPath = options.path, 
                    idPrefix = options.prefix, 
                    enableGroups = options.enableGroups,
                    contextItems = [ ];
            if (!ctx || nodetype === "error") {
                return contextItems;
            }
            function enableSpatialForModel(model) {
                return !!Nrm.app.getSpatialType(ctx, model, true);
            }
            var i, addItems = options.items || [ ],
                    defaultPrefix = "nrmTree-menu-",
                    applyPrefix = !!idPrefix,
                    prefixRe = applyPrefix && new RegExp("^" + defaultPrefix + "|^" + idPrefix),
                    lastGroup = false,
                    ids = { }, 
                    routes = { },
                    overrides = [ ],
                    menuBottom = [ ],
                    isNew = nodeId === "",
                    isFolder = nodetype === "folder",
                    spatial = Nrm.app.isSpatialContext(ctx),
                    custom = ctx.contextItems || [ ],
                    customFn = false,
                    editable = Nrm.app.isEditable(ctx, model),
                    enableSpatial = !isFolder && spatial && enableSpatialForModel(model);

            if (isFolder && spatial && collection && collection.find(enableSpatialForModel)) {
                enableSpatial = true; // collection has at least one model with a geometry
            }
            // ensure options include any state used in computeHref function to determine enabled status
            options = $.extend(options, { editable: editable, enableSpatial: enableSpatial });
            function addCustomItem(list, item) {
                item = $.extend(true, { }, item);
                item.id = item.id || _.uniqueId((idPrefix || defaultPrefix) + "item");
                if (customFn && !item.generateHref) {
                    // do not generate href for custom items provided by a function unless explicitly indicated
                    item.generateHref = false; 
                }
                if (item && item.className === "hidden") {
                    // grandfathering old work-around for hiding default items
                    item.override = true;
                    item.enable = false;
                }
                var route = item.route || item.href, found = ids[item.id] || (route && routes[route]);
                if (found) {
                    item = $.extend(found, item);
                }
                ids[item.id] = item;
                if (route && route !== "#")
                    routes[route] = item;
                if (applyPrefix && !item.id.match(prefixRe)) {
                    item.id = idPrefix + item.id;
                }

                if (!found) {
                    list.push(item)
                }
                return list;
            }
            function filterCustomItems(item) {
                var ret = item.enable;
                if (group && (item.enableGroups !== undefined || !enableGroups)) {
    //                if ($.isArray(item.enableGroups))
    //                    ret = $.inArray(group, item.enableGroups) > -1;
    //                else if (item.enableGroups !== undefined || !enableGroups)
                        ret = !!item.enableGroups
                }
                if (item.nodetypes && $.inArray(nodetype, item.nodetypes) <= -1)
                    ret = false; // TODO: set disabled instead of hide?
                else if (item.enableFolder === false && nodetype === "folder")
                    ret = false; // hide menu items on folder, show for any other node type

                if (isNew && !item.enableNew)
                    ret = false; // hide menu items for "New Item" nodes unless explicitly enabled

                // only set item.enable if it is defined
                if (ret !== undefined) item.enable = ret;
                else ret = true; // do not hide unless explicitly set to false

                if (ret && item.items)
                    item.items = _.filter(item.items, filterCustomItems, this);
                return ret;
            }
            customFn = $.isFunction(custom);
            if (customFn) {
                custom = custom.call(this, node, {
                    "context": ctx,
                    "nodetype": nodetype,
                    "isNew": isNew,
                    "nodeId": nodeId,
                    "path": selectedPath,
                    "group": group,
                    "model": model || null,
                    "editable": editable
                }); 
            }
            custom = _.reduce(custom, addCustomItem, [ ], this);
            customFn = false;
            applyPrefix = false;
            custom = _.filter(_.reduce(addItems, addCustomItem, custom, this), filterCustomItems, this);

            function createDefaultItem(item) {
                var customIds = [];
                var custom = _.reduce([ids[item.id], (item.href && routes[item.href])], function(memo, c) {
                    if (!c) return memo;
                    customIds.push(c.id);
                    return _.extend(memo, c);
                }, { }, this);
                if (custom.override) 
                    _.each(customIds, function(id) { overrides.push(id); });
                item = customIds.length ? $.extend({ }, item, (custom.override ? custom : { enable: false })) : item;
                if (item.enable) {
                    BaseView.computeHref.call(this, item, options);
                }
                return item;
            }

            var defaultItems = [{
                    "id" : defaultPrefix + "edit",
                    "label" : (editable ? "Edit " : "View ") + (ctx.alias || "Item"),
                    "href": "#edit",
                    "enableFolder": false,
                    "enable": !isFolder && !isNew
                }, { 
                    "id": defaultPrefix + "create",
                    "label": "New " + (ctx.alias || "Item"),
                    "href": "#create",
                    "enableSubtypes": true,
                    "subtypePrefix": "as",
                    "standalone": true, // may be used to move certain items outside of an "Actions" menu
                    "enableEditable": true,
                    "nodeTypes": ["folder"],
                    "enable": isFolder && (!group || enableGroups) && !ctx.disableNew
// Select in Map menu entry is redundant after implementing selection mode button in map toolbar
//                },{
//                    "id" : defaultPrefix + "mapSelect",
//                    "label" : "Select in Map",
//                    "href": "#mapSelect",
//                    "enable": isFolder && (!group || enableGroups) && Nrm.app.isSpatialSearchEnabled(ctx) 
                },{
                    "id" : defaultPrefix + "search",
                    "label" : "Go to Search Form", //childCtx.caption ? "Search for " + childCtx.caption : "Search",
                    "href": "#search",
                    "className" : "nrm-route-action",
                    "enable" : isFolder && (!group || enableGroups) && Nrm.app.isQuickSearchEnabled(ctx)
                },{
                    "id" : defaultPrefix + "advSearch",
                    "label" : "Advanced Search", 
                    "href": "#advSearch",
                    "enable": isFolder && (!group || enableGroups) && Nrm.app.isAdvancedSearchEnabled(ctx)
                },{
                    "id" : defaultPrefix + "zoom",
                    "label" : "Zoom to Feature",
                    "href" : "#extent",
                    "className": "nrm-route-action",
                    "enableSpatial": true,
                    "enableFolder": false,
                    "enable": !isFolder && spatial,
                    "bottomGroup": true
                },{
                    "id" : defaultPrefix + "pan",
                    "label" : "Pan to Feature",
                    "href" : "#center",
                    "className": "nrm-route-action", 
                    "enableSpatial": true,
                    "enableFolder": false,
                    "enable": !isFolder && spatial,
                    "bottomGroup": true
                } 
            ];

            function addContextItem(item) {
                if (!lastGroup && item.bottomGroup)
                    menuBottom.push(item); // these items will be added last
                else {
                    if (prefixRe) item.id = item.id.replace(prefixRe, idPrefix);
                    if (i === 0 && contextItems.length > 0)
                        item.group = true;
                    i = contextItems.push(item);
                }
            }
            _.each(defaultItems, function(item) {
                item = createDefaultItem.call(this, item);
                if (item.enable) {
                    addContextItem.call(this, item);
                }
            }, this);
            i = 0; // start a new group
            _.each(custom, function(item) {
                if (item.enable !== false && $.inArray(item.id, overrides) <= -1) {
                    BaseView.computeHref.call(this, item, options);
                    addContextItem.call(this, item);
                }
            });
            i = 0; // start a new group
            lastGroup = true;
            _.each(menuBottom, addContextItem, this);
            return contextItems;
        },
        /**
         * Returns capabilities for each type of input control.  Currently only handles the question of readonly or
         * disabled attribute, but over time this might change.
         * @returns {Object} A lookup table of each input type with values providing information about attribute
         * support for the type.
         */
        inputTypes: function() {
            if (this._inputTypes) {
                return this._inputTypes;
            }
            var disabled = {
                /**
                 * Name of the property to set the input element readonly or disabled.
                 */
                disabled: 'disabled'
            }, readonly = {
                disabled: 'readonly'
            }, types = { // 0 = disabled, 1 = readonly
                button: 0,
                checkbox: 0,
                color: 0,
                date: 1,
                datetime: 1,
                'datetime-local': 1,
                email: 1,
                file: 0, //1, // is readonly supported?
                hidden: 0,
                image: 0,
                month: 1,
                number: 1,
                password: 1,
                radio: 0,
                range: 0,
                reset: 0,
                search: 0,
                select: 0,
                submit: 0,
                tel: 1,
                text: 1,
                textarea: 1,
                time: 1,
                url: 1,
                week: 1
            }, disabledSelector = 'select,button';
            _.each(types, function(flag, type) {
                if (flag) {
                    types[type] = _.extend({}, readonly);
                } else {
                    types[type] = _.extend({}, disabled);
                    disabledSelector += ',input[type="' + type + '"]';
                }
            });
            types.selectors = {
                /**
                 * Selects input elements that should be set readonly by setting disabled property instead of readonly
                 * property.
                 */
                disabledProp: disabledSelector,
                /**
                 * Selects elements that should be readonly when the form is in a readonly or loading state.
                 */
                disableReadonly: ':input,.btn,div[contenteditable="true"],textarea,ul.dropdown-menu>li,.nrmDataTable-enableEditable',
                /**
                 * Selects elements that are enabled in conditions where they would otherwise be included in the
                 * disableReadonly selector.
                 */
                enableReadonly: '.nrm-enable-readonly,.divider,.dropdown-header,.dropdown-submenu',
                /**
                 * Selects elements that are currently disabled via one of the known techniques for setting a control
                 * readonly.
                 */
                isDisabled: 'input[readonly],textarea[readonly],select[disabled],input[disabled],button[disabled],.disabled',
                /**
                 * Selects elements that are set readonly based on a condition that occurs while editing data.  Note that
                 * this is not inclusive to all elements that may be set readonly conditionally, only the ones that where
                 * the condition is liable to change while the form is editable.  Be careful of changing this value
                 * because any new conditions will most likely need to be handled in code referencing this property.
                 */
                disabledConditional: '.nrm-enable-required,.nrm-enable-changed',
                /**
                 * Selects elements that are only enabled when the form is dirty.
                 */
                enableChanged: '.nrm-enable-changed',
                /**
                 * Selects elements that are only enabled when the field is required.
                 */
                enableRequired: '.nrm-enable-required'
            };
            return this._inputTypes = types;
        },
        /**
         * Generates a unique id for an id value or control configuration object if the existing id is not set.
         * @param {module:nrm-ui/views/baseView~ControlConfig|String} $el A Jquery object, 
         * control configuration or id value.
         * @returns {String} The existing or generated id.
         */
        ensureId: function(el) {
            var str = _.isString(el), id;
            if (str) {
                id = el;
            } else if (el) {
                id = el.id;
            }
            return Nrm.ensureId(id);
        },
        /**
         * Format standard title text for a required field
         * @param {String} title The title attribute value
         * @returns {String}
         */
        formatRequiredFieldTitle: function(title) {
             if (!title) {
                return 'Required field';
            } else if (_.isString(title) && title.toLowerCase().indexOf('required') === -1) {
                return 'REQUIRED: ' + title;
            } else {
                return title;
            }
        }
    });
    return BaseView;
});

