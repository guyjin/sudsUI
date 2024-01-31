/**
 * Base view providing a generic rendering solution for nested views contained within EditorView implementations.
 * @file
 * @see module:nrm-ui/views/panelView
 */
define([
    './baseView', 
    'jquery',
    'underscore',
    'backbone',
    '..'
], function(BaseView, $, _, Backbone, Nrm) {

    /**
     * @exports nrm-ui/views/panelView
     */
    var PanelView = BaseView.extend(/** @lends module:nrm-ui/views/panelView.prototype */{
        /**
         * Overrides {@link module:nrm-ui/views/baseView#genericTemplate} to set the default generic template for panel 
         * content.
         * @default
         * @type {string}
         */
        genericTemplate: 'panelContent',
        /**
         * Create a new instance of the PanelView.  
         * @constructor
         * @alias module:nrm-ui/views/panelView
         * @classdesc
         *   A Backbone view that extends {@link module:nrm-ui/views/baseView|BaseView} as a generic base view that can 
         *   be used directly or extended, often used for nested child views such as tab panels that may be contained 
         *   within an {@link module:nrm-ui/views/editorView|EditorView} implementation.
         * @param {Object} options
         * @param {module:nrm-ui/models/application~ContextConfig} options.context The context configuration.  If 
         * binding to a child property, this should be the nested context for the child schema, or pass the
         * parentContext with same value to indicate that the view needs to create a nested context. 
         * @param {external:module:backbone.Model} options.model The parent model.
         * @param {string} [options.prop] The child property for binding, should evaluate to a model.  If it evaluates 
         * to undefined, the view will attempt to lazy load from REST API.  If this option is not defined, controls will
         * bind to the parent model.
         * @param {string} [options.path] The parent navigation path for this view.
         * @param {boolean} [options.readonly] Indicates that the view is in read-only mode.
         * @param {Object} [options.ajax] Overrides default ajax options to pass to 
         * {@link module:nrm-ui/models/application#getNestedModel|Nrm.app.getNestedModel}
         * @param {module:nrm-ui/models/application~ContextConfig} [options.parentContext] The parent context
         * configuration.
         * @see {@link http://backbonejs.org/#View-constructor|Backbone View constructor / initialize}
         */
        initialize: function(options) { 
            
            var self = this, 
                    dfd = this.loading = $.Deferred();
            
            this.options = options || {};
            this.context = this.options.context;
            this.readonly = this.options.readonly;    
            
            this.path = this.options.path;
            if (this.path && this.options.prop) {
                this.path = this.path + '/' + this.options.prop;
            }
            // load config AFTER the nested model is loaded, if there is one.
            $.when(this.loadNestedModel()).done(function() {
                $.when(self.getConfig()).done(function(config) {
                    self.config = config || { };
                    self.config.btnClass = self.config.btnClass || 'btn-sm';
                    var templateLoading = self.loadTemplate();
                    var controlsLoading = $.when(self.initControls(self.config.controls, function(control, el) {
                        if (self.config.inputClass && el && el.length > 0) {
                            $('.form-control', el).addClass(self.config.inputClass);
                        }
                    })).done(function (controls) {
                            self.config.controls = controls;
                    });
                    $.when(templateLoading, controlsLoading).done(function() {
                        dfd.resolve(self.config);
                    }).fail(dfd.reject);
                }).fail(dfd.reject);
            }).fail(dfd.reject);

            if (this.customInitialize) {
                this.customInitialize(this.options);
            }
        },
        /**
         * Load a nested child model, either by evaluating an attribute of the parent model, or loading from standard
         * REST API pattern using {@link module:nrm-ui/models/application#getNestedModel|Nrm.app.getNestedModel} if
         * the model attribute evaluates to undefined.
         * @returns {external:module:jquery~Promise|undefined} Return a JQuery promise that will be resolved when the 
         * nested model is loaded, or undefined if the view is not associated with a nested model.
         */
        loadNestedModel: function() {
            if (this.options.prop && this.model) {
                var loading, nested = Nrm.app.getModelVal(this.model, this.options.prop);
                if (nested && nested.loading) {
                    loading = $.Deferred();
                    $.when(nested.loading).done(function() {
                        loading.resolve(nested);
                    }).fail(loading.reject);
                }
                if (nested === undefined) {
                    loading = $.Deferred();
                    function loadNestedModel() {
                        $.when(Nrm.app.getNestedModel(this.context, {
                                model: this.model,
                                attr: this.options.prop,
                                ajax: $.extend({global:false}, this.options.ajax)
                            }, this)).done(function(model) {
                                if (model.loading) {
                                    $.when(model.loading).done(function() {
                                        loading.resolve(model);
                                    }).fail(loading.reject);
                                } else {
                                    loading.resolve(model);
                                }
                            }).fail(loading.reject);
                    }
                    if (this.options.parentContext === this.context) {
                        // no schema configured for the nested model
                        $.when(Nrm.app.getContext({
                            apiKey: this.options.prop
                        }, this)).done(function(ctx) {
                            this.context = $.extend({}, ctx, {parent:this.options.parentContext});
                            loadNestedModel.call(this);
                        });
                    } else {
                        loadNestedModel.call(this);
                    }
                    // moved this to Nrm.app.getNestedModel
                    //$.when(nested).done(function(model) {
                    //    Nrm.app.setModelVal(this.model, this.options.prop, model);
                    //    // the model should extend nrm-ui/models/nestedModel if it needs to propagate the 'change' event.
                    //    //this.model.listenTo(model, 'change', function(model, options) {
                    //    //    this.trigger('change', this, options);
                    //    //});
                    //});
                }
                
                // at this point, nested variable might be a model instance or promise that will be resolved with model as first argument
                return $.when(loading || nested).done(_.bind(function(model) {
                    if (_.isArray(model)) {
                        model = model[0]; // first argument
                    }
                    if (model instanceof Backbone.Model) {
                        // reset this.model, preserving original reference as this.parentModel
                        this.parentModel = this.model;
                        this.model = model;
                        if (_.isFunction(model.registerChildEvents)) {
                            model.registerChildEvents();
                        }
                    }
                }, this)); 
            }
        },
        /**
         * Handles the tab selection event which is typically the "show.bs.tab" event raised by Twitter Bootstrap tab
         * plugin.
         * @param {external:module:jquery.Event} event The event data.
         * @returns {external:module:backbone.View|external:module:jquery~Promise|undefined}
         * The view that was rendered or a promise that will be resolved with the view.
         */
        tabSelected: function (event) {
            var $target = $(event.target), tabId, tabsControl, tab, $panel, previous;
            if ($target.parent().is('.disabled')) {
                // do not show disabled tab
                event.preventDefault();
                return;
            }
            tabId = $target.attr('aria-controls');
            tabsControl = $target.closest('ul.nav').data('nrm-control');
            tab = tabsControl && _.find(tabsControl.tabs, function (tab) {
                return tab.id === tabId;
            });
            
            if (!tab) {
                // tab or tabsControl not found
                return;
            }

            previous = _.find(tabsControl.tabs, function(tab) {
                return tab.selected;
            });
            if (previous) {
                previous.selected = false;
            }
            tabsControl.selectedTab = tab.id;
            tab.selected = true;
            $panel = $('#' + tab.id, this.$el);
            return this.renderPanel(tab, $panel);
        },
        /**
         * Render a child view in a target container element.
         * @param {module:nrm-ui/views/baseView~ControlConfig} control The control configuration
         * @param {external:module:jquery} $panel The target container element as a JQuery object
         * @returns {external:module:backbone.View|external:module:jquery~Promise|undefined}
         * The view that was rendered or a promise that will be resolved with the view.
         */
        renderPanel: function (control, $panel) {
            var viewModuleId = control && control.view, loading, path = this.getPath(), cancel = false;
            if (!viewModuleId && control.config) {
                // default implementation
                viewModuleId = PanelView;
            }
            function checkCancel() {
                if (cancel) {
                    console.log('Cancelled rendering panel', control);
                    return true;
                } else {
                    return false;
                }
            }
            function createView(viewModule) {
                if (checkCancel.call(this)) {
                    return;
                }
                var view = new viewModule({
                    config: _.defaults(control.config || {}, _.pick(this.config || {}, 'hz', 'inputClass', 'btnClass')),
                    model: this.model,
                    context: control.ctx || this.context,
                    parentContext: this.context,
                    readonly: this.readonly,
                    prop: control.prop,
                    path: path && _.isString(control.path) ? control.path.replace(/^\./, path) : path
                }), 
                        parentView = this, 
                        renderFn = view.renderDeferred || view.render,
                        loadingIndicator = false,
                        timeout = setTimeout(function() {
                            if (!checkCancel.call(parentView)) {
                                loadingIndicator = true;
                                parentView.setValueLoading($panel, true, {
                                    opacity: 0
                                });
                            }
                        }, 200);
                $.when(renderFn.call(view)).always(function () {
                    clearTimeout(timeout);
                    if (checkCancel.call(parentView)) {
                        view.remove();
                        return;
                    }
                    if (loadingIndicator) {
                        parentView.setValueLoading($panel, false);
                    }
                    control.view = view;
                    $panel.html(view.$el);
                    if (control.events) {
                        parentView.delegateBackboneEvents(view, control.events);
                    }
                    function onRenderComplete() {
                        view.trigger('renderComplete', this, view);
                    }
                    if (!$.contains(document, $panel[0])) {
                        parentView.listenToOnce(parentView, 'renderComplete', onRenderComplete);
                    } else {
                        onRenderComplete.call(parentView);
                    }
                    if (loading) {
                        loading.resolve(view);
                    }
                });
            }
            if (_.isString(viewModuleId)) {
                // it is an AMD module ID, so load the module, then render the view
                // set control.view to a Deferred object to guard against multiple loads
                loading = control.view = $.Deferred();
                require([viewModuleId], _.bind(createView, this));
            } else if (_.isFunction(viewModuleId)) {
                // it is the actual view constructor, this will happen if re-rendering after a save
                loading = control.view = $.Deferred();
                // just render the view
                createView.call(this, viewModuleId);
            } else if (viewModuleId instanceof Backbone.View) {
                // trigger an event in case the view needs to re-render
                viewModuleId.trigger('redisplay', this, viewModuleId);
            }
            if (loading) {
                loading.fail(function() {
                    cancel = true;
                    if (loading === control.view) {
                        control.view = viewModuleId;
                    }
                });
            }
            return control.view;
        },
        /**
         * Show and render a child view in a panel.
         * @param {module:nrm-ui/views/baseView~ControlConfig} control The control configuration.
         * @returns {external:module:backbone.View|external:module:jquery~Promise|undefined}
         * The view that was rendered or a promise that will be resolved with the view.
         */
        showPanel: function (control) {
            var container = $('#' + control.id, this.$el);
            if (container.is('.collapse')) {
                container.collapse('show');
            } else {
                container.show();
            }
            
            return this.renderPanel(control, container);
        },
        /**
         * Hide a panel.
         * @param {module:nrm-ui/views/baseView~ControlConfig} control The control configuration.
         * @returns {undefined}
         */
        hidePanel: function (control) {
            var container = $('#' + control.id, this.$el);
            if (container.is('.collapse')) {
                container.collapse('hide');
            } else {
                container.hide();
            }
        },
        /**
         * Get the form configuration for the view.
         * @returns {module:nrm-ui/views/baseView~FormConfig}
         */
        getConfig: function() {
            return this.options.config;
        },
        /**
         * Provides a generic render implementation for a panel view.
         * @returns {module:nrm-ui/views/panelView}
         * @see {@link http://backbonejs.org/#View-render|Backbone.View#render}
         */
        render: function () {
            var isNew = this.model && this.model.isNew();
            if (!Nrm.app.isEditable(this.context, this.model)) {
                this.readonly = true;
            }
            this.bindAllData(this.config.controls, this.model);
            this.config.isNew = isNew;
            this.$el.html(this.template(this.config));
            this.applyPlugins(this.$el, this.config.controls);
            this.applyClasses();
            if (this.readonly) {
                this.setControlEnabled($('.btn,ul.dropdown-menu>li', this.$el)
                        .not('.nrm-enable-readonly,.divider,.dropdown-header,.dropdown-submenu'), false);
            } else if (!isNew) {
                this.setControlEnabled($('.nrm-enable-new', this.$el), false);
                this.setControlEnabled($('.nrm-enable-changed', this.$el)
                        .not('.nrm-enable-new,.nrm-disable-new'), this.isDirty());
            } else {
                this.setControlEnabled($('.nrm-enable-changed', this.$el), this.isDirty());
                this.setControlEnabled($('.nrm-disable-new', this.$el), false);
            }

            this.delegateModelEvents();
            this.startListening();
            return this;
        }
    });
    return PanelView;
});