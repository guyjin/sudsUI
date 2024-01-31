/**
 * Generic modal search view that renders a search form and results grid in the modal body.
 * @file
 * @see module:nrm-ui/views/modalSearchView
 */
define(['jquery', 
    'underscore',
    '..', 
    './basicSearchView', 
    './baseView',
    './modalView'
], function($, _, Nrm, BasicSearchView, BaseView, ModalView) {
    
    /**
     * Extends {@link module:nrm-ui/views/basicSearchView|BasicSearchView} to provide a modal search view implementation.
     * @exports nrm-ui/views/modalSearchView
     */
    var ModalSearchView = Nrm.Views.ModalSearchView = BasicSearchView.extend(
            /** @lends module:nrm-ui/views/modalSearchView.prototype */ {
        /**
         * Overrides {@link module:nrm-ui/views/basicSearchView#genericTemplate} to set the default generic template 
         * for an LOV search form.
         * @default
         * @type {string}
         */
        genericTemplate: 'modalSearch',
        /**
         * Overrides {@link module:nrm-ui/views/basicSearchView#searchType} to set the default search type for an LOV 
         * search form.
         * @default
         * @type {string}
         */
        searchType: 'lov',
        /**
         * Overrides {@link module:nrm-ui/views/validationAwareView#useGlobalErrorNotification} to return false by
         * default since the modal backdrop prevents using the nav bar error badge.
         * @type {boolean}
         */
        useGlobalErrorNotification: false,
        /**
         * Extends {@link module:nrm-ui/views/basicSearchView#defaultEvents|BasicSearchView#defaultEvents} to include
         * additional events
         * @type {object}
         */
        defaultEvents: $.extend({ }, BasicSearchView.prototype.defaultEvents, {
            'click .nrm-lov-clearselection': 'clearSelection'
        }),        
        /**
         * Overrides {@link nrm-ui/views/basicSearchView#mixSearchConfig|BasicSearchView#mixSearchConfig} to mix in 
         * modal search view configuration from global "forms" configuration.
         * @param {module:nrm-ui/views/basicSearchView~SearchConfig} config The configuration object to mix into.
         * @returns {module:nrm-ui/views/basicSearchView~SearchConfig}
         * The original configuration with global options mixed in.
         */
        mixSearchConfig: function(config) {
            return this.mixConfig('modalSearch', config);
        },
        /**
         * Overrides {@link module:nrm-ui/views/baseView#destroyControls|BaseView#destroyControls}.
         * @returns {undefined}
         */
        destroyControls: function() {
            if (this.config && this.config.searchResults && this.config.searchResults.nrmDataTable) {
                this.config.searchResults.nrmDataTable.fnDestroy();
                this.config.searchResults.nrmDataTable = null;
            }
            BasicSearchView.prototype.destroyControls.apply(this, arguments);
        },
        /**
         * Overrides {@link module:nrm-ui/views/baseView#isDrity|BaseView#isDirty} so that it always returns false to
         * avoid prompt to save changes when closing modal.
         * @returns {Boolean}
         */
        isDirty: function() {
            return false; // avoids prompt when navigating away from page
        },
        /**
         * Get the selected value as a Backbone model.
         * @todo Consider supporting multi-select.
         * @returns {external:module:backbone.Model}
         * The selected model in the collection.
         */
        getSelection: function() {
            var coll = this.config && this.config.searchResults.value;
            if (!coll) {
                return;
            }
            // NOTE: currently this does not support multi-select
            return coll.findWhere({ 'selected' : true });
        },
        /**
         * Clear the selected item.
         * @returns {undefined}
         */
        clearSelection: function() {
            $('.nrm-lov-selected', this.$el).val('');
            this.selectionCleared = true;
            var selectedItem = this.getSelection();
            if (!selectedItem) {
                this.setButtonStatus();
            } else {
                // NOTE: currently this does not support multi-select
                selectedItem.set('selected', false);
                if (selectedItem.collection) {
                    selectedItem.collection.trigger('updateSelection', selectedItem.collection, { fromMap: true });
                }
            }
        },
        /**
         * Overrides {@link module:nrm-ui/views/basicSearchView#searchCompleted|BasicSearchView#searchCompleted} to
         * render the results when a search completes successfully.   
         * @param {external:module:backbone.Collection} collection A Backbone collection containing the search results.
         * @param {external:module:jquery~jqXHR} response The XHR request object.
         * @param {Object} options Options passed to the Backbone sync operation, extended with searchData option.
         * @param {Object} options.searchData Search options, refer to the first parameter of the 
         * {@link module:nrm-ui/views/basicSearchView#executeSearch|executeSearch method} for more information. 
         * @returns {undefined}
         */
        searchCompleted: function(collection, response, options) {
            if (!this.removed && collection) {
               this.collection = this.config.searchResults.value = collection;
               this.config.error = null;
               this.renderAndFocus();
            }
        },
        /**
         * Overrides {@link module:nrm-ui/views/basicSearchView#searchFailed|BasicSearchView#searchFailed} to show an 
         * error message when a search fails.
         * @param {external:module:backbone.Model} model The requested model aka search parameters.
         * @param {external:module:jquery~jqXHR} xhr The XHR request object
         * @param {Object} options Options passed to the Backbone sync operation
         * @returns {undefined}
         */
        searchFailed: function(model, xhr, options) {
            this.config.error  = Nrm.app.normalizeErrorInfo('Query failed.', model, xhr, options);
            this.collection = this.config.searchResults.value = null;
            this.renderAndFocus();
        },
        /**
         * Provides a generic render implementation for a modal search view.
         * @returns {module:nrm-ui/views/modalSearchView}
         * @see {@link http://backbonejs.org/#View-render|Backbone.View#render}
         */
        render: function () {
            if (!this.canRender()) {
                return this;
            }
            if (this.rendered) {
                this.destroyControls();
                this.stopListening();
            }
            this.config = this.config || { };
            // set defaults...
            this.config.searchResults = $.extend({ }, this.context.searchResults, {
                type: 'tableEdit',
                id: 'modalLovSearchResults',
                actions: [],
                caption: 'Displaying available ' + this.context.caption + ' that match the search criteria.\n' +
                        'Select a record in the table, then activate the OK button to choose the selection.'
            }, this.config.searchResults);
            this.config.searchResults.pluginOpts = $.extend({
                multiSelect : false
            }, this.config.searchResults.pluginOpts);

            var fnEnableCallback = this.config.searchResults.pluginOpts.fnEnableCallback;
            this.config.searchResults.pluginOpts.fnEnableCallback = _.bind(function() {
                this.setButtonStatus();
                if (_.isFunction(fnEnableCallback)) {
                    fnEnableCallback.apply(this, arguments);
                }
            },this); 

            if (this.config.setColumns) {
                var cols = _.map(this.config.searchResults.columns, function(item) {
                    return  _.isString(item) ? item : item.prop;
                });
                var idAttr = this.context.idAttr || 'id';
                if ($.inArray(idAttr, cols) <= -1) {
                    cols.push(idAttr);
                }
                this.model.set('cols', cols);
            }

            this.config.selectedItem = this.options.selectedItem;
            if (this.config.selectedItem && this.config.hz) {
                this.config.selectedItem.hz = true;
            }
            if (this.selectionCleared) {
                this.config.selectedItem.value = null;
            }
            this.bindAllData(this.config.controls, this.model);
            this.$el.html(this.template(this.config));

            this.applyPlugins(this.$el, this.config.controls);
            if (this.config.searchResults.value) {
                this.applyPlugin(this.$el, this.config.searchResults);
            }
            this.delegateEvents();
            this.delegateModelEvents();
            this.startListening();
            this.applyClasses();
            if (!this.rendered) {
                this.listenToOnce(this,'renderComplete', function() {
                    this.rendered = true;
                    this.setButtonStatus();
                    this.setFocus();
                });
            } else {
                this.setButtonStatus();
            }
            return this;
        },
        /**
         * Updates the status of modal buttons and selected value indicator.
         * @returns {undefined}
         */
        setButtonStatus: function() {
            var $modal = this.$el.closest('.modal');
            var selectedValue, selectedItem = this.getSelection();
            var $selected = $('.nrm-lov-selected', this.$el);
            // NOTE: currently this does not support multi-select
            if (selectedItem) {
                this.selectionCleared = false;
                if (this.context && this.context.nameAttr) {
                    selectedValue = Nrm.app.getModelVal(selectedItem, this.context.nameAttr);
                } else {
                    selectedValue = selectedItem.id;
                }
                $selected.val(selectedValue);
            } else if (this.options.selectedItem && !this.selectionCleared) {
                $selected.val(this.options.selectedItem.value);
            }
            this.setControlEnabled($('.nrm-lov-clearselection', this.$el), !!$selected.val())
            this.setControlEnabled($('#modal-ok', $modal), this.selectionCleared || !!selectedItem);
        },
        /**
         * Overrides {@link nrm-ui/views/baseView#initControls|BaseView#initControls} to initialize the selected item
         * indicator control.
         * @returns {module:nrm-ui/views/baseView~ControlConfig[]|external:module:jquery~Promise}
         * Initialized controls which may be a shallow copy of the original configuration objects or a promise that
         * will resolve when asynchronous initialization is completed.
         */
        initControls: function() {
            var ret = BasicSearchView.prototype.initControls.apply(this, arguments);
            if (!this.hasInitialized && this.options.selectedItem) {
                this.hasInitialized = true;
                this.initControl(this.options.selectedItem);
            }
            return ret;
        },
        /**
         * Overrides {@link module:nrm-ui/views/baseView#getFocusElement|BaseView#getFocusElement} to return the first
         * non-readonly form element in the search form.
         * @returns {external:module:jquery}
         */
        getFocusElement: function() {
            return this.getDefaultFocusElement();
        }
    }, /**@lends module:nrm-ui/views/modalSearchView */{
        /**
         * Show a modal search view in response to a UI event.  The selected value returned from the modal view is 
         * bound to a hidden input field which should have "data-target" set to a JQuery selector string identifying the
         * button associated with the control, and the element that triggered the event should have "data-target" 
         * attribute set to a JQuery selector string identifying the hidden input.
         * @param {external:module:backbone.View} view The view containing the target element that triggered the event.
         * @param {external:module:jquery} $target The target element as a JQuery element, may be the input field or
         * button.
         * @returns {Boolean}
         * Indicates whether the view will be displayed.
         */
        showModalSearchView: function(view, $target) {
            var ctor = this,
                    selector,
                    $input,
                    $btn,
                    displaySelector,
                    $display,
                    control,
                    parentContext,
                    parentModel,
                    current;
            
            if (!view || !$target || !$target.length) {
                return false;
            }

            // get the hidden input field
            selector = $target.attr('data-target');
            $input = selector && $(selector, view.$el);
            if (!$input || !$input.length) {
                return false;
            }

            // get the LOV button to check for disabled status
            selector = $input.attr('data-target');
            $btn = $target.is(selector) ? $target : $(selector, view.$el);
            if (!$btn || !$btn.length || $btn.prop('disabled') || $btn.is('.disabled')) {
                return false;
            }

            displaySelector = $input.attr('data-target-display');
            $display = displaySelector && $(displaySelector, view.$el);

            control = $input.data('nrm-control') || {};

            if (control.inheritFromParent) {
                parentContext = view.context.parent;
                parentModel = view.options.parentModel;
            } else {
                parentContext = view.context;
                parentModel = view.model;
            }
            if (parentModel) {
                // this is necessary to avoid weird side effects
                parentModel = parentModel.clone();
            }
            current = control.selectedItem;
            if (current !== false && $display && $display.length) {
                current = $.extend({
                   allowClear: !$display.prop('required'),
                   readonly: true,
                   id: 'modalSearchCurrentSelection',
                   label: 'Current Selection'
                }, current);
                current.type = current.type || (current.allowClear || current.actions ? 'inputBtn' : 'inputText');
                current.value = ($display && $display.length) ? $display.val() : $input.val();
                current.className = BaseView.addClassName(current.className, 'nrm-lov-selected');
                if (current.allowClear) {
                    current.actions = current.actions || [ {
                        id: 'modalSearchClearSelection',
                        label: 'Clear Selection',
                        className: 'nrm-lov-clearselection'
                    }];
                }
            }
            if (current && current.type) {
               require(['hbs!' + current.type], showModal);
            } else {
               showModal();
            }
            function showModalForContext(ctx) {
                var nameAttr = ctx.nameAttr || control.nameAttr;
                $.when(Nrm.app.getViewConstructor( {
                        context: ctx,
                        suffix: 'ModalSearchView',
                        generic: function() { 
                            return ctor; //Nrm.Views.ModalSearchView;
                        }
                }, this)).done(function(view) {
                    Nrm.event.trigger('app:modal', {
                        caption: control.caption,
                        buttons: ModalView.OK_CANCEL,
                        modalClass: control.modalClass,
                        backdrop: 'static',
                        view: new view({
                            context: $.extend(_.omit(ctx, 'collection'), { parent: parentContext }), 
                            path: this.getPath(), 
                            model: parentModel,
                            selectedItem: current
                        }),
                        callback: _.bind(function(modal) {
                            var ok = modal.clicked === 0, selected = ok && modal.options.view.getSelection();
                            if (ok && (selected || modal.options.view.selectionCleared)) {
                                control.selection = selected;
                                control.collection = modal.options.view.collection;

                                // NOTE: currently this does not support multi-select
                                $input.val(selected ? selected.id : null).trigger('change');

                                if (nameAttr && $display) {
                                    $display.val(selected ? selected.get(nameAttr) : null).trigger('change');
                                }
                                this.setDirty(true);
                            } 
                            $target.focus();
                        }, this)
                    });
                });
                
            }
            function showModal() {
                var apiKey = control.refType || control.prop;
                if (apiKey) {
                    $.when(Nrm.app.getContext({apiKey: apiKey}, view)).done(showModalForContext);
                } else {
                    console.warn('Modal search view context key is undefined for control:', control);
                    showModalForContext.call(view, {});
                }
            }
            return true;
        }
    });
    return ModalSearchView;
});