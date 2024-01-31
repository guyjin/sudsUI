/**
 * @file The AdvancedSearchView extends {@link module:nrm-ui/views/basicSearchView|BasicSearchView} to provide a generic 
 * implementation of an advanced search form to be rendered in the main data panel.
 * @see module:nrm-ui/views/advancedSearchView
 */
define(['..', 'jquery', './basicSearchView'], function(Nrm, $, BasicSearchView) {
    
    /**
     * A Backbone view that extends {@link module:nrm-ui/views/basicSearchView|BasicSearchView} to provide generic 
     * search functionality.
     * @exports nrm-ui/views/advancedSearchView
     */
    var AdvancedSearchView =  Nrm.Views.AdvancedSearchView = BasicSearchView.extend(
            /** @lends module:nrm-ui/views/advancedSearchView.prototype */{
        /**
         * A class name that will be applied to the container element
         * @default
         * @type {string}
         */
        className: "container",
        /**
         * Overrides {@link module:nrm-ui/views/basicSearchView#searchType} to set the default search type for an
         * advanced search form.
         * @default
         * @type {string}
         */
        searchType: "advanced",
        /**
         * Overrides {@link module:nrm-ui/views/basicSearchView#useGlobalErrorNotification} to return true by
         * default since the search view is rendered in main data panel.
         * @type {boolean}
         */
        useGlobalErrorNotification: true,
        /**
         * Overrides {@link module:nrm-ui/views/basicSearchView#genericTemplate} to set the default generic template 
         * for an advanced search form.
         * @default
         * @type {string}
         */
        genericTemplate: "advSearch",
        defaultEvents: $.extend({ }, BasicSearchView.prototype.defaultEvents, {
              "click .nrm-search-btnCancel" : "backToResults"
        }),
        /**
         * Overrides {@link nrm-ui/views/basicSearchView#mixSearchConfig|BasicSearchView#mixSearchConfig} to mix in 
         * advanced search view configuration from global "forms" configuration.
         * @param {module:nrm-ui/views/basicSearchView~SearchConfig} config The configuration object to mix into.
         * @returns {module:nrm-ui/views/basicSearchView~SearchConfig}
         * The original configuration with global options mixed in.
         */
        mixSearchConfig: function(config) {
            return this.mixConfig('advSearch', config);
        },
        /**
         * Default implementation of the cancel button, which returns to the search result grid.
         * @returns {undefined}
         */
        backToResults: function() {
            if (this.path) {
                Nrm.router.navigate("results/" + this.path, { 
                    trigger: true, 
                    replace: false 
                });
            }
        },
        /**
         * Overrides {@link module:nrm-ui/views/baseView#isDirty|BaseView#isDirty method} to always return false to
         * avoid prompting the user to save changes when they navigate away from the page.
         * @returns {Boolean}
         */
       isDirty: function() {
            return false; // avoids prompt when navigating away from page
        },
        /**
         * Overrides {@link module:nrm-ui/views/basicSearchView#applyContext|BasicSearchView#applyContext} so that it
         * only returns true if the "context:advSearch" navigation event was triggered, or the source of the navigation
         * event is this instance.
         * @param {Object} options
         * @param {string} [options.event] Name of the navigation event
         * @param {*} [options.source] Source of the event.
         * @param {string} options.path The path of the navigation event
         * @returns {Boolean}
         * Indicates whether the navigation context applies to this view.
         */
        applyContext: function(options) {
            if ((options.event === "context:advSearch" || options.source === this) && options.path === this.options.path) {
                return true;
            }
        }, 
        /**
         * Overrides {@link module:nrm-ui/views/basicSearchView#getSearchUrl|BasicSearchView#getSearchUrl}
         * @returns {string}
         */
        getSearchUrl: function() {
            return Nrm.app.getSearchUrl(this.context, this.path, this.searchType);
        },
        /**
         * Overrides {@link module:nrm-ui/views/basicSearchView#render|BasicSearchView#render} to provide
         * generic rendering in the main data panel instead of the specialized rendering of an accordion panel.
         * @returns {module:nrm-ui/views/advancedSearchView}
         * @see {@link http://backbonejs.org/#View-render|Backbone.View#render}
         */
        render: function () {
            if (!this.canRender()) {
                return this;
            }
            if (!this.config.title && this.searchPanel) this.config.title = this.searchPanel.header;
            this.bindAllData(this.config.controls, this.model);
            // TODO: do we need a different generic template for the Advanced Search view?
            //var template = Handlebars.templates[this.config.template || "editForm"];
            this.$el.html(this.template(this.config));
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
        /**
         * Overrides {@link module:nrm-ui/views/baseView#getFocusElement|BaseView#getFocusElement} to return the first
         * non-readonly form element in the search form.
         * @todo Should this return main content element like other views that display in main content panel?
         * @returns {external:module:jquery}
         */
        getFocusElement: function() {
            return this.getDefaultFocusElement();
        }
    });
    
    return AdvancedSearchView;
});