/**
 * @file The BasicSearchView extends {@link module:nrm-ui/views/baseView|BaseView} to provide a generic implementation
 * of a search form to be rendered in an accordion group. 
 * @see module:nrm-ui/views/basicSearchView
 */
define([
    '..', 
    'jquery', 
    'underscore', 
    'backbone', 
    './validationAwareView', 
    '../models/application'
], function(Nrm, $, _, Backbone, ValidationAwareView, Application) {
             
    /**
     * Search form configuration. Properties with "parent" prefix will only be defined if it is a child search.
     * @typedef {module:nrm-ui/views/baseView~FormConfig} module:nrm-ui/views/basicSearchView~SearchConfig
     * @property {Object} lastSearch The search parameters from the previous search.
     * @property {string} [parentId] Id of the parent model.
     * @property {string} [parentName] Name attribute value from the parent model.
     * @property {string} [parentType] Alias of the parent entity type.
     * @property {module:nrm-ui/views/baseView~ControlConfig} [parentLabel] Parent label configuration.
     */
    /**
     * @exports nrm-ui/views/basicSearchView
     */
    var BasicSearchView = Nrm.Views.BasicSearchView = ValidationAwareView.extend(
            /** @lends module:nrm-ui/views/basicSearchView.prototype */{
        /**
         * Create a new instance of the BasicSearchView.  
         * @constructor
         * @alias module:nrm-ui/views/basicSearchView
         * @classdesc
         *   A Backbone view that extends {@link module:nrm-ui/views/baseView|BaseView} to provide generic search 
         *   functionality.
         * @param {Object} options
         * @param {module:nrm-ui/models/application~ContextConfig} options.context The context configuration.
         * @param {string} options.path The navigation path for this search.
         * @param {external:module:backbone.Model} [options.model] The parent model if this is a child search.
         * @param {string} [options.modelId] The id of the parent model.
         * @param {Boolean} [options.expand=true] Indicates whether the panel should be initially expanded.
         * @param {string} [options.accordionId="accordion-nrmSearch"] The id of the accordion group that will contain
         * this search panel.
         * @see {@link http://backbonejs.org/#View-constructor|Backbone View constructor / initialize}
         */
        initialize: function(options){
            this.options = options || { };
            var ctx = this.context = options.context || { };
            this.searchId = options.searchId || "nrmSearch";
            /**
             * The navigation path
             * @type {string}
             */
            this.path = options.path;
            /**
             * The search form configuration
             * @type {module:nrm-ui/views/basicSearchView~SearchConfig}
             */
            this.config = { };
            /**
             * The parent model.
             * @type {external:module:backbone.Model}
             */
            this.parentModel = options.model;
            /**
             * Indicates whether the view is initially expanded.
             * @type {Boolean}
             */
            this.expand = options.expand === undefined ? true : options.expand;

            var accordionId = this.options.accordionId || "accordion-" + this.searchId;
            /**
             * The control configuration for the search panel.
             * @type {module:nrm-ui/views/contextView~AccordionPanelConfig}
             */
            this.searchPanel =  { 
                id: accordionId + (this.options.accordionId ? "-nrmSearch-" : "-") + this.context.apiKey,
                parentId: accordionId,
                header: "Search for " + this.context.caption,
                expand: this.expand
            };
            this.accordion = { 
                type: "accordion",
                id: accordionId,
                controls: [ this.searchPanel ] 
            };
            var formatId = function(id) {
                return id + "-" + ctx.apiKey;
            };
            var evt = { };
            evt["show.bs.collapse #" + this.searchPanel.id] = function() {
                console.log("accordion search panel expand");
                this.expand = true;
            };
            evt["hide.bs.collapse #" + this.searchPanel.id] = function() {
                console.log("accordion search panel collapse");
                this.expand = false;
            }; 
            this.events = this.mixEvents(this.defaultEvents, evt);

            /**
             * The model representing the search parameters.
             * @type {external:module:backbone.Model}
             */
            this.model = this.createSearchModel();
            this.loading = new $.Deferred();
            var self = this;
            $.when(this.getSearchConfig()).done(function(config) {
                var cfg = self.config = self.mixSearchConfig(config || { });
                cfg.btnClass = cfg.btnClass || "btn-sm";
                cfg.parentId = self.options.modelId;
                cfg.errorOptions = $.extend({
                    title: 'Invalid Search'
                }, cfg.errorOptions);
                if (self.parentModel && ctx.parent) {
                    cfg.parentName = Nrm.app.getModelVal(self.parentModel, ctx.parent.nameAttr);
                    cfg.parentType = ctx.parent.alias;
                    cfg.parentLabel = $.extend({
                        type: "staticLabel",
                        label: cfg.parentType,
                        value: cfg.parentName
                    }, cfg.parentLabel);
                    if (!cfg.parentLabel.value) {
                        cfg.parentLabel.value = cfg.parentLabel.defaultValue;
                    }
                }

                self.setSearchAttributes(config, config.lastSearch);
                var td = self.loadTemplate();
                var dfdQueue = [td, $.when(self.initControls(cfg.controls, function(control, el) {
                    if (cfg.inputClass && el && el.length > 0) {
                        $(".form-control", el).addClass(cfg.inputClass);
                    }
                })).done(function (controls) {
                    cfg.controls = controls;
                })];
                if (td && self.options.accordionId) {
                    dfdQueue.push(Application.requireDeferred(["hbs!accordionPanel"], function(template) {
                        self.accordionTemplate = template;
                    }));
                }
                $.when.apply($, dfdQueue).done(function() {
                    self.loading.resolve(cfg);
                });
                if (!cfg.actions) {
                    cfg.actions = [];
                    var i = 0;
                    if (cfg.advanced && this.path) {
                        cfg.actions[i++] = { 
                            id: formatId("btnAdvanced"),
                            title: "Go to the advanced search page",
                            label: "Advanced",
                            btnStyle: "link",
                            href: "#advSearch/" + this.path
                        };
                    }
                    cfg.actions[i++] = { 
                        id: formatId("btnClear"),
                        title: "Clear search parameters",
                        className: "nrm-search-btnClear",
                        label: "Clear"
                    };
                    if (ctx.enableCount) {
                        cfg.actions[i++] = { 
                            id: formatId("btnCount"),
                            className: "nrm-search-btnCount",
                            title: "Get count of " + ctx.caption + " matching the search parameters",
                            label: "Count"
                        };
                    }
                    cfg.actions[i++] = { 
                        id: formatId("btnQuery"),
                        className: "nrm-search-btnQuery",
                        title: "Find " + ctx.caption + " matching the search parameters",
                        label: "Search",
                        btnStyle: "primary",
                        submit: true
                    };
                    if (ctx.enableCancel) {
                        cfg.actions[i++] = { 
                            id: formatId("btnCancel"),
                            className: "nrm-search-btnCancel",
                            title: "Return to previous search results",
                            label: "Cancel"
                        };
                    }
                } 
                cfg.alignRight = true;
            });
            if (this.customInitialize)
                this.customInitialize(options);

        },
        /**
         * Mix in search view configuration from global "forms" configuration.
         * @param {module:nrm-ui/views/basicSearchView~SearchConfig} config The configuration object to mix into.
         * @returns {module:nrm-ui/views/basicSearchView~SearchConfig}
         * The original configuration with global options mixed in.
         */
        mixSearchConfig: function(config) {
            return this.mixConfig('search', config);
        },
        /**
         * Default events includes the {@link module:nrm-ui/views/baseView#changeEvents|BaseView#changeEvents} for data
         * binding and click events for the default buttons identified by class name.
         * @type {object}
         */
        defaultEvents: $.extend({ }, ValidationAwareView.prototype.events, ValidationAwareView.prototype.changeEvents, {
            "click .nrm-search-btnQuery" : "doSearch",
            "click .nrm-search-btnClear" : "doClear",
            "click .nrm-search-btnCount" : "doCount",
            "click a.nrm-search-errors" : function(e) {
                this.displayErrors(this.errorMessageHtml, true);
                e.preventDefault();
            }

        }),
        /**
         * Create a Backbone model to bind to the view as the search parameters.  
         * @returns {external:module:backbone.Model}
         * Backbone model representing the search parameters.
         */
        createSearchModel: function() {
            var model = new this.searchModel();
            return Nrm.app.setInheritedAttributes(this.context, model, this.parentModel, false);
        },
        /**
         * Sets attributes after configuration has initialized, including restoring the parameters from previous search.
         * @param {module:nrm-ui/views/basicSearchView~SearchConfig} config The search form configuration.
         * @param {Object} [attributes] Attributes of previous search.
         * @returns {undefined}
         */
        setSearchAttributes: function(config, attributes) {
            if (this.model && config) {
                if (typeof config.inherit === "object") {
                    _.each(config.inherit, function(item, key) {
                        Nrm.app.setModelVal(this.model, key, Nrm.app.getModelVal(this.parentModel, item));
                    }, this);
                }
                var defaults = $.extend({ }, config.defaults, attributes);
                _.each(defaults, function(item, key) {
                    var val = Nrm.app.getModelVal(this.model, key);
                    if (val === undefined) {
                        Nrm.app.setModelVal(this.model, key, item);
                    }
                }, this);
            }
        },
        /**
         * Constructor for the search model that will be created for data binding, defaults to Backbone.Model but may
         * be overriden to use a custom model.
         * @type {Function}
         */
        searchModel: Backbone.Model,
        /**
         * The type of search, corresponding to one of the keys found in the
         * {@link nrm-ui/models/application~SearchConfigMap|"search" property} in the 
         * {@link nrm-ui/models/application~ContextConfig|context configuration}. 
         * @default
         * @type {string}
         */
        searchType: "basic",
        /**
         * Overrides {@link module:nrm-ui/views/validationAwareView#useGlobalErrorNotification} to return false by
         * default since the search view is rendered in west pane.
         * @type {boolean}
         */
        useGlobalErrorNotification: false,
        /**
         * Overrides {@link module:nrm-ui/views/baseView#genericTemplate} to set the default generic template for 
         * a search form in an accordion panel.
         * @default
         * @type {string}
         */
        genericTemplate: "genericSearch",
        /**
         * Hash of events that will be listened to in the 
         * {@link module:nrm-ui/views/baseView#delegateModelEvents|delegateModelEvents function}.
         * Keys are model event names, values are either a function or a string which is interpreted
         * as the name of a function defined on the view prototype.
         * @type {Object}
         */
        modelEvents: {
            change: 'onModelChanged'
        },
        onModelChanged: function() {
            this.validate(false, {
                changed: this.model.changedAttributes() 
            });
        },
//        startListening: function() {
//            this.listenTo(this, 'errorMessageClosed', this.showErrorBadge);
//        },
        /**
         * Load the search configuration.
         * @returns {external:module:jquery~Promise|module:nrm-ui/views/basicSearchView~SearchConfig}
         * The default implementation returns a promise to support dynamically lazy-loaded configuration, but usually
         * subclasses will override this implementation to return the search configuration synchronously.
         */
        getSearchConfig: function() {
            // to facilitate overriding in derived view
            var dfd = new $.Deferred();
            var base = this.config || { };
            $.when(Nrm.app.getSearchConfig(this.context, this.searchType)).done(function(config) {
                dfd.resolve($.extend(true, base, config));
            }).fail(function(config) {
                dfd.reject(config);
            });
            return dfd.promise();
        },
        /**
         * Provides a generic render implementation for a search accordion panel in an accordion group.
         * @returns {module:nrm-ui/views/basicSearchView}
         * @see {@link http://backbonejs.org/#View-render|Backbone.View#render}
         */
        render: function () {
            if (!this.canRender()) {
                return this;
            }
            this.bindAllData(this.config.controls, this.model);
            //var template = Handlebars.templates[this.config.template || "genericSearch"];
            var content = this.template(this.config), $panel, currentEl;
            if (this.searchPanel) {
                this.searchPanel.content = content;
            }
            if (this.accordionTemplate) {
                $panel = $(this.accordionTemplate(this.searchPanel));
                currentEl = this.$el;
                this.setElement($panel);
                if (this.className) {
                    this.$el.addClass(this.className);
                }

                if (currentEl && currentEl.parent().length) {
                    // rendering again, cannot reset element without replacing it in its parent
                    currentEl.replaceWith(this.$el);
                }
            } else {
                this.$el.html(content);
            }
            this.applyPlugins(this.$el, this.config.controls);
            this.delegateEvents();
            this.delegateModelEvents();
            this.startListening();
            this.applyClasses();
    //        if (this.config.containerClass)
    //            this.$el.addClass(this.config.containerClass);
    //        if (this.config.inputClass)
    //            $(".form-control", this.$el).addClass(this.config.inputClass);
            return this;
        },
        validate: function(notify, options) {
            if (!notify || (options && options.search)) {
                // only perform validation if handling model change event or performing a search 
                return ValidationAwareView.prototype.validate.apply(this, arguments);
            }
            return true;
        },
        showErrorBadge: function(notify) {
            var errorBadge = this.errorMessageHtml && $('.nrm-search-errors', this.$el), buttons, prepend;            
            if (errorBadge && !errorBadge.length) {
            //if (!notify && errorBadge && !errorBadge.length) {
                errorBadge = $('<a>').attr('href', '#')
                        .addClass('badge badge-errors nrm-search-errors')
                        .text('Errors');
                buttons = !this.showErrorsInHeader && $('.nrm-search-buttons', this.$el);
                if (buttons && buttons.children().first().is('.pull-right')) {
                    buttons = buttons.children().first();
                    prepend = true;
                }
                if (!buttons || !buttons.length) {
                    // fall back to accordion header...
                    buttons = $('.panel-heading>.panel-title', this.$el);
                }
                if (prepend) {
                    buttons.prepend(errorBadge);
                } else {
                    buttons.append(errorBadge);
                }
            }
        },
        hideErrorBadge: function() {
            var errorBadge = $('.nrm-search-errors', this.$el);
            if (errorBadge.length) {
                errorBadge.remove();
            }
        },
        /**
         * Clears the form by creating a new model, setting default attributes, and rendering the view again.
         * @returns {undefined}
         */
        doClear: function() {
            this.model = this.createSearchModel();
            this.setSearchAttributes(this.config);
            this.destroyControls();
            this.stopListening();
            this.renderAndFocus();
        },
        /**
         * Execute a count request.
         * @returns {external:module:jquery~jqXHR}
         * Returns the XHR request object.
         */
        doCount: function() {
            var self = this;
            var search = Nrm.app.getSearchData(this.context, this.model, { 
                firstResult: 0, 
                limit: true 
            });
            var urlRoot = this.getCountUrl();
            var model = new Backbone.Model(search, { 
                            urlRoot: urlRoot
                        });
            return model.save(null, { 
                success: function(model, response, options) {
                    //self.context.lastSearch = search;
                    var result = model.get("result");
                    var alias = self.context.alias || Nrm.app.getModelName(self.context);
                    Nrm.event.trigger("app:modal", {
                        caption: alias + " Count",
                        text: result + " " + (result == 1 ? alias : self.context.caption) + " found matching the search parameters."
                    });
                },
                error: function(model, xhr, options) {
                    Nrm.event.trigger("app:modal", {
                        "error": Nrm.app.normalizeErrorInfo("Query failed.", model, xhr, options)
                    });
                }
            });
        },
        /**
         * Show the advanced search form, does nothing by default and may be deprecated in the future since this is 
         * normally accomplished from the Navigator tree context menu.
         * @returns {undefined}
         */
        doAdvanced: function() {

        },
        /**
         * Begin a search operation by calling {@link module:nrm-ui/models/application#doSearch|Nrm.app.doSearch}, 
         * so that the search may be cancelled by external influences.  Note that the actual search request is 
         * performed in the {@link module:nrm-ui/views/basicSearchView#executeSearch|executeSearch method}, 
         * the success handler is the {@link module:nrm-ui/views/basicSearchView#searchCompleted|searchCompleted method}, 
         * and the error handler is the {@link module:nrm-ui/views/basicSearchView#searchFailed|searchFailed method}.  
         * If a subclass needs to customize the behavior, usually it is better to override one of those methods instead
         * of this one.
         * @returns {undefined}
         */
        doSearch: function(event) {
            var search = Nrm.app.getSearchData(this.context, this.model, { 
                                firstResult: 0, 
                                limit: true 
                              }), 
                    validated = this.validate(true, {event: event, search: search}), dfd,
                    afterValidate = _.bind(function() {
                        var options = {
                            context: this.context, 
                            path: this.path,
                            model: this.parentModel,
                            modelId: this.parentId,
                            searchType: this.searchType,
                            search: search,
                            callback: this.executeSearch,
                            source: this
                        };
                        return Nrm.app.doSearch(options, this.searchCompleted, this.searchFailed);
                    }, this);
            if (validated && _.isFunction(validated.promise)) {
                dfd = $.Deferred();
                $.when(validated).done(function(result) {
                    //console.log('BasicSearchView - doSearch after validating async rules');
                    if (result) {
                        $.when(afterValidate(result)).done(dfd.resolve).fail(dfd.reject);
                    } else {
                        //console.log('BasicSearchView - doSearch after validating async rules REJECTED');
                        dfd.reject(result);
                    }
                }).fail(function() {
                    dfd.reject.apply(dfd, arguments);
                });
                validated = dfd.promise();
            } else if (validated) {
                validated = afterValidate(validated);
            }
            return validated;
        },
        /**
         * Called when a search completes successfully.   
         * @param {external:module:backbone.Collection} collection A Backbone collection containing the search results.
         * @param {external:module:jquery~jqXHR} response The XHR request object.
         * @param {Object} options Options passed to the Backbone sync operation, extended with searchData option.
         * @param {Object} options.searchData Search options, refer to the first parameter of the 
         * {@link module:nrm-ui/views/basicSearchView#executeSearch|executeSearch method} for more information. 
         * @returns {undefined}
         */
        searchCompleted: function(collection, response, options) {
            if (!this.removed && options && options.searchData && options.searchData.path)
               Nrm.router.navigate("results/" + options.searchData.path, { trigger: true, replace: false });
        },
        /**
         * Called when a search fails.
         * @param {external:module:backbone.Model} model The requested model aka search parameters.
         * @param {external:module:jquery~jqXHR} xhr The XHR request object
         * @param {Object} options Options passed to the Backbone sync operation
         * @returns {undefined}
         */
        searchFailed: function(model, xhr, options) {
            Nrm.event.trigger("app:modal", {
                "error": Nrm.app.normalizeErrorInfo("Query failed.", model, xhr, options)
            });
        },
        /**
         * Compute the search URL, the base implementation determines the URL based on convention
         * and context configuration, but subclasses may override this if necessary.
         * @returns {string}
         * The URL for the search request.
         * @see {@link module:nrm-ui/models/application#getSearchUrl|Nrm.app.getSearchUrl}
         */
        getSearchUrl: function() {
            return Nrm.app.getSearchUrl(this.context, this.path);
        },
        /**
         * Compute the count URL, the base implementation determines the URL based on convention
         * and context configuration, but subclasses may override this if necessary.
         * @returns {string}
         * The URL for the count request.
         * @see {@link module:nrm-ui/models/application#getCountUrl|Nrm.app.getCountUrl}
         */
        getCountUrl: function() {
            return Nrm.app.getCountUrl(this.context, this.path, this.searchType);
        },
        /**
         * Execute the search.  The base implementation provides a simple generic search request that uses either
         * a POST with search parameters in the request body or GET with search parameters as URL query parameters,
         * depending on the value of the "postSearch" option in the 
         * {@link module:nrm-ui/models/application~ContextConfig|context configuration}.
         * @param {module:nrm-ui/models/application~ExecuteSearchOptions} evtData Options passed to the callback 
         * from the {@link module:nrm-ui/event#context:beginSearch|context:beginSearch} event handler.
         * @param {Function} evtData.collectionType The collection constructor.
         * @param {Function} successCallback Success callback function
         * @param {Function} errorCallback Error callback function
         * @returns {external:module:jquery~jqXHR}
         * Returns the XHR request object.
         */
        executeSearch: function(evtData, successCallback, errorCallback) {
            var search = evtData.search,
                    modelType = evtData.collectionType.prototype.searchModel || Backbone.Model,
                    model = new modelType(search),
                    onFail = _.bind(function() {
                        this.currentRequest = null;
                        errorCallback.apply(this, arguments);
                    }, this),
                    onSuccess = _.bind(function() {
                        this.currentRequest = null;
                        successCallback.apply(this, arguments);
                    });
            if (this.currentRequest && _.isFunction(this.currentRequest.abort)) {
                this.currentRequest.abort();
            }
            if (this.context.postSearch) {
                model.urlRoot = this.getSearchUrl();
                return this.currentRequest = model.save(null, { 
                    success: function(model, response, options) {
                        var models = _.map(model.changed, function(value) {
                            return value;
                        });
                        var results = new evtData.collectionType(models);
                        onSuccess(results, response, $.extend({ }, options, { searchData: evtData }));
                    },
                    error: onFail
                });
            } else {
                // use GET request with query params 
                var collection = new evtData.collectionType();
                if (this.controls) {
                    _.each(this.controls, function(c) {
                        if (c.prop && search[c.prop] === undefined) {
                            search[c.prop] = null;
                        }
                    });
                }
                return this.currentRequest = collection.fetch( { 
                    data: model.toJSON(),
                    success: function(data, resp, options) { 
                        onSuccess(data, resp, $.extend({ }, options, { searchData: evtData }));
                    },
                    error: onFail
                });
            }     
        },
        /**
         * Apply the context from a navigation event, returning true if the navigation event applies to this view.
         * The base implementation returns true if the path matches the path that was initially passed in to this view.
         * @param {Object} options
         * @param {string} options.path The navigation path
         * @returns {Boolean}
         * Indicates whether the navigation context applies to this view.
         */
        applyContext: function(options) {
            if (options.path === this.options.path) {
                return true;
            }
        },
        /**
         * Sets the focus to the first visible and enabled input field in the view and ensures the panel is expanded.
         * @returns {module:nrm-ui/views/basicSearchView}
         * Returns this instance to allow chaining.
         */
        setFocus: function() {
            if (this.searchPanel) {
                var panel = $("#" + this.searchPanel.id, this.$el);
                if (!panel.hasClass("in")) {
                    panel.collapse("show");
                }
            }
            return ValidationAwareView.prototype.setFocus.apply(this, arguments);
        },
        getFocusElement: function() {
            var el = this.getDefaultFocusElement();
            if (!el.length) {
                el = $('.panel-heading a[data-toggle="collapse"]', this.$el);
            }
            return el;
        },
        /**
         * Get the default focus element for a search form, which is the first non-readonly focusable form element.
         * @returns {external:module:jquery}
         */
        getDefaultFocusElement: function() {
            return $(':input:visible:enabled:not([readonly]):first', this.$el);
        }
    });
    return BasicSearchView;
});
