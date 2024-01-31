/**
 * @file The FLMView is a {@link http://backbonejs.org/#View|Backbone.View} for editing Feature Level Metadata.
 * @see module:nrm-map/views/flmView
 */
/** 
 * @module nrm-map/views/flmView
 * 
 */

define(['nrm-ui', 'jquery', 'underscore', 'backbone', 'handlebars',
    '../models/flm', 'hbs!flm',// 'hbs!NRMmodalView',
    '../collections/flmDataSourceCollection',
    "../models/flmDataSource",
    'nrm-ui/views/baseView',
    //'use!datepicker', 
    'nrm-ui/plugins/nrmDatePicker',
    'use!modernizr', 
    'use!select2'
],
        function(Nrm, $, _, Backbone, Handlebars, 
                FLM, FLMTemplate, //NRMmodalViewTemplate,
                FLMDataSourceCollection, FLMDataSource, BaseView, NrmDatePicker, 
                Modernizr, Select2) {
    
    return Nrm.Views.FLMView = Backbone.View.extend(/**@lends module:nrm-map/views/flmView.prototype */{
        /**
         * Events hash.
         * @type {Object}
         * @see {@link http://backbonejs.org/#View-events|Backbone.View#events}
         */
        events: {
                    //"click .saveModal": "save",
                    //"hide.bs.modal #appModalView": "beforeClose",
                    "change #flmDataSource": "changeDataSource",
                    "change #flmRevisionDate": "changeRevisionDate",
                    "input #flmRevisionDate": "changeRevisionDate",
                    "change #flmAccuracy": "changeAccuracy",
                    "input #flmAccuracy": "changeAccuracy",
                    //"change #flmPersist": "changePersist",
                    "submit form": "onSubmit"
        },
        /* flm model
        {name: "data_source"},
        {name: "rev_date"},
        {name: "accuracy"},
        {name: "persist"} // not used
        */
        /**
         * Create a new instance of the FlmView.  
         * @constructor
         * @alias module:nrm-map/views/flmView
         * @classdesc
         *   A Backbone view for editing Feature Level Metadata (FLM).
         * @param {Object} options 
         * @param {module:nrm-map/models/flm} [options.model] The FLM attributes
         * @param {external:module:backbone.Collection} [options.dataSources] Preloaded FLM data source list of values.
         * @see {@link http://backbonejs.org/#View-constructor|Backbone View constructor / initialize}
         */
        initialize: function initialize(options) {
            var defaults = {
                model: new FLM(),
                title: "Feature Level Metadata"
            };
            /**
             * Initialization options.
             * @type {Object}
             */
            this.options = $.extend({}, defaults, options);
            this.model = new FLM(this.options.model.attributes);
            //$('.saveModal', this.$el).addClass('disabled');
            //$('.notSaveModal', this.$el).removeClass('disabled');
            var onDataSourcesLoaded = _.bind(function(collection, response, options){
                var code = this.model.get('dataSource'), dsModel = code && collection.get(code);
                if (dsModel)
                    dsModel.set('isSelected', true);
                /**
                 * The FLM data source LOV collection
                 * @type {module:nrm-map/collections/flmDataSourceCollection}
                 */
                this.flmDataSourceCollection = collection;
                //that.render();
            }, this);
            if (this.options.dataSources) {
                onDataSourcesLoaded(new FLMDataSourceCollection(this.options.dataSources.toJSON()))
            } else {
                this.flmDataSourceCollection = new FLMDataSourceCollection();
                /**
                 * Loading indicator
                 * @type {?external:module:jquery~jqXHR}
                 */
                this.loading = this.flmDataSourceCollection.fetch({reset:true, 
                    error:function(collection, response, options){console.error('Error fetching FLM Data Sources',collection, response, options);},
                    success: onDataSourcesLoaded 
                });
            }
            //this.render();
        },
        /**
         * Renders the view after loading the FLM data source LOV if necessary
         * @returns {external:module:jquery~Promise}
         * The returned promise is resolved when the view has rendered.
         */
        renderDeferred: function() {
           var renderFn = _.bind(this.render, this);
           return $.when(this.loading).done(renderFn);  
        },
        /**
         * Handles change event for the Data Source field.
         * @param {Event} e Event data.
         * @returns {undefined}
         */
        changeDataSource: function(e){
            this.model.set('dataSource', e.target.value);
            this.setDirty(true);
        },
        /**
         * Handles change event for the Revision Date field.
         * @param {Event} e Event data.
         * @returns {undefined}
         */
        changeRevisionDate: function(e){
            var val = NrmDatePicker.val(e.target); //Nrm.app.formatValue($(e.target).val(), "date", "set");
            // bootstrap-datepicker plugin sometimes triggers change when the value hasn't changed.
            if (val !== this.model.get('revisionDate')) {
                this.model.set('revisionDate', val);
                this.setDirty(true);
            }
        },
        /**
         * Handles change event for the Accuracy field.
         * @param {Event} e Event data.
         * @returns {undefined}
         */
        changeAccuracy: function(e){
            this.model.set('accuracy', e.target.value);
            this.setDirty(true);
        },
//                changePersist: function(e){
//                    this.model.set('persist', e.target.value);
//                    this.setDirty(true);
//                },
        /*
         * Set the dirty flag
         * @param {Boolean} isDirty
         * @returns {undefined}
         */
        setDirty: function(isDirty) {
            // if isDirty is an event, then set dirty
            this.isDirty = (typeof isDirty === "boolean") ? isDirty : true;
            var $saveBtn = $('.saveModal', this.$el.closest('.modal'));
            if (this.isDirty) {
                $saveBtn.removeClass('disabled');
            } else {
                $saveBtn.addClass('disabled');
            }
        },
        /**
         * Handles submit event to simulate clicking the Update button.
         * @param {Event} e
         * @returns {undefined}
         */
        onSubmit: function(e) {
            e.preventDefault();
            $('.saveModal:not(.disabled)', this.$el.closest('.modal')).click();
        },
        /**
         * Check for business rule errors.
         * @param {Boolean} notify Show the message box.
         * @returns {Boolean}
         * Returns true if the model is valid
         */
        validate: function(notify) {
            var error = this.model.validate(), allErrors = "";
            $(".ui-state-error", this.$el).removeClass("ui-state-error");
            if (error) {
                this.model.brokenRules.forEach(function (rule) {
                    var prop = rule.get("property"), msg = rule.get("description"),
                      idMap = {
                          "dataSource": "#flmDataSource",
                          "revisionDate": "#flmRevisionDate",
                          "accuracy": "#flmAccuracy"
                      }, selector = prop && idMap[prop],
                      $el = selector && $(selector, this.$el),
                      $label = BaseView.getLabelForElement($el, this.$el),
                      label = ($label && $label.text()) || prop;
                    $el && $el.not(":invalid").addClass("ui-state-error");
                    allErrors += "<br/><b>" + label + ": </b>" + msg;
                }, this);
            }
            if (notify && allErrors) {
                Nrm.event.trigger('showErrors', allErrors, { allowRecall: false });
            }
            return !error;
        },
        /*beforeClose: function(event) {
            // datepicker is also a modal view, so make sure we're handling the right one
            if (event.target.id === "appModalView" && this.isDirty) {
                if (!confirm("Data have been modified.  Are you sure you want to exit and lose the changes?")) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    return false;
                }
            }
            Nrm.event.trigger("closeModal");
        },*/
        /*save: function(event) {
            //Nrm.event.trigger('closeModal',this.model,this.options);
            this.options.model.set(this.model.attributes);
            this.setDirty(false);
            $('.modal', this.$el).modal('hide');
            Nrm.event.trigger('closeModal', [$.extend({}, this.model.attributes, {id: this.model.cid})], this.options);
        },*/
        /**
         * Render the view
         * @param {Object} options
         * @returns {undefined}
         */
        render: function(options) {
            //Handlebars.registerPartial('modalView', FLMTemplate); 
            var template = FLMTemplate; //NRMmodalViewTemplate;
            var defaults = {
                header: this.options.title,
                footer: true,
                body: true,
                data: this.model.toJSON(),
                dataSources: this.flmDataSourceCollection.toJSON()
            };
            var renderOptions = $.extend({}, defaults, options);
            // remove the time component from a date-time string
            var revDate = (renderOptions.data.revisionDate || ""), 
                    m = revDate.match(/^\d{4}-\d{2}-\d{2}/);
            if (m && m.length > 0)
                revDate = renderOptions.data.revisionDate = m[0];
            this.$el.html(template(renderOptions));
            this.listenToOnce(this, "renderComplete", function() {
                $('.saveModal', this.$el.closest('.modal')).addClass('disabled'); 
            });
            this.listenTo(this.model, "change", function() {
                this.validate(false);
            });
            //$('#modalView').html(this.el);
            //$('#appModalView').modal({backdrop: 'static'});

            //if (!Modernizr.inputtypes.date) {
               //require(['use!datepicker'], function() {
                   /* $("#flmRevisionDate", this.$el).val(Nrm.app.formatValue(revDate, "date", "display")).
                            datepicker({ 
                                format: 'mm/dd/yyyy', 
                                enableOnReadonly: false
                            });*/
                   $("#flmRevisionDate", this.$el).nrmDatePicker();
               //});
            //}
            //$('#flmDataSource', this.$el).select2();
            BaseView.applySelect2($('#flmDataSource', this.$el), { }, this.$el);
        }
    });
});