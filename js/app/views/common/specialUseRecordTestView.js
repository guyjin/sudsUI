/**
 * Base view providing common behavior and configuration for editor views.
 * @file
 * @see module:app/views/common/specialUseEditorView
 */
/**
 * @module app/views/common/specialUseEditorView
 */
define([
        '../..',
        /*'nrm-map/views/spatialEditView',*/ // views with geometry fields use this module instead of nrm-ui/views/editorView
        'nrm-ui/views/editorView' ,
        'jquery',
        'underscore',
        "nrm-ui",
        '../../utils/handlebars-helpers', // we are using the "inc" helper registered by this module factory function
        'nrm-ui/plugins/nrmDatePicker', // allows synchronous initialization of NrmDatePicker plugin
        'use!select2', // allows synchronous initialization of Select2 plugin
        'require', // enables relative module ids in require calls,
        'nrm-ui/views/modalView',
        './specialUseRecordView'
    ],

    function(Suds, EditorView, $, _, Nrm, Handlebars, NrmDatePicker, Select2, require,ModalView,SpecialUseRecordView) {
        return Suds.Views.SpecialUseRecordTestView =

            SpecialUseRecordView.extend(/** @lends module:app/views/common/specialUseEditorView.prototype */{

                //className: 'container suds-container',
                /**
                 * Overrides {@link module:nrm-ui/views/editorView#render|EditorView#render}
                 * @returns {module:app/views/common/specialUseEditorView}
                 */

                render: function() {

                	

                    var baseLoading = SpecialUseRecordView.prototype.render.apply(this, arguments);

                    return $.when(baseLoading).done(_.bind(function (model) {

                        /*if (!this.rendered) {
                            // if the view is being re-rendered after a save...
                            this.stepChanged();
                        }*/
                    },this));
                },

                loadData: function() {


                    var baseLoading = EditorView.prototype.loadData.apply(this, arguments);

                    return $.when(baseLoading).done(function(model) {});


                },

                /**
                 * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
                 * @returns {undefined}
                 */
                startListening: function() {
                    SpecialUseRecordView.prototype.startListening.apply(this,arguments);


                    this.listenTo(this, {
                        'renderComplete': function() {
                            // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                            // to occur after view is added to the page, which is why we have to use the renderComplete event
                            // instead of calling it from the render function
                        	this.currentStepId = this.model && this.model.get("id");
                            this.rendered = true;
                            this.stepChanged();
                            $('.suds-save-btn').attr('disabled',true);
                            this.setControlEnabled($('.suds-save-btn', this.$el), false);


                        }
                    });

                }
            })

    });
