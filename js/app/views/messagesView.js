/**
 * Base view providing common behavior and configuration for editor views.
 * @file
 * @see module:app/views/common/specialUseEditorView
 */
/**
 * @module app/views/common/specialUseEditorView
 */
define([
        '..',
        'nrm-map/views/spatialEditView', // views with geometry fields use this module instead of nrm-ui/views/editorView
        'jquery',
        'underscore',
        '../utils/handlebars-helpers', // we are using the "inc" helper registered by this module factory function
        'nrm-ui/plugins/nrmDatePicker', // allows synchronous initialization of NrmDatePicker plugin
        'use!select2', // allows synchronous initialization of Select2 plugin
        'require' // enables relative module ids in require calls
    ],
    function(Suds, EditorView, $, _, Handlebars, NrmDatePicker, Select2, require) {
        return Suds.Views.MessagesView =
            EditorView.extend(/** @lends module:app/views/common/specialUseEditorView.prototype */{


                // getSearchUrl: function() {
                //     return 'api/sudsIntroPath/retrieveIntroData';
                // } ,
                /**
                 * Override of {@link module:nrm-ui/views/editorView#getEditorConfig|EditorView#getEditorConfig} to return
                 * default configuration that may be shared, extended or overriden by subclasses.
                 * @returns {module:nrm-ui/views/baseView~FormConfig}
                 */
                getEditorConfig: function() {

                    return {
                        hz: true,
                        inputClass: 'input-sm',
                        controls: [
                            {
                                type: 'inputText',
                                id: 'messageTest',
                                prop: 'helloMessage',
                                labelGrid: 'col-md-4 col-sm-2', // Twitter Bootstrap grid class for the label
                                hzGrid: 'col-md-8 col-sm-10', // Twitter Bootstrap grid class for the field
                                grid: 'col-md-6' // label and field
                            }
                        ]
                        //         {
                        //             type: 'inputText',
                        //             id: 'specialUseFsUnitId',
                        //             label: 'Admin Unit',
                        //             prop: 'fsUnitId',
                        //             labelGrid: 'col-md-4 col-sm-2', // Twitter Bootstrap grid class for the label
                        //             hzGrid: 'col-md-8 col-sm-10', // Twitter Bootstrap grid class for the field
                        //             grid: 'col-md-6', // label and field
                        //             readonly: true
                        //         },
                        //         {
                        //             type: 'select',
                        //             id: 'specialUseProcessingStatus',
                        //             label: 'Status',
                        //             prop: 'statusFk',
                        //             nameAttr: 'processingStatusCode',
                        //             lov: 'lov/processingStatus',
                        //             labelGrid: 'col-md-4 col-sm-2', // Twitter Bootstrap grid class for the label
                        //             hzGrid: 'col-md-8 col-sm-10', // Twitter Bootstrap grid class for the field
                        //             grid: 'col-md-6', // label and field
                        //             group: true // indicates that this is the first control on a new grid row
                        //         },
                        //         {
                        //             type: 'inputDate',
                        //             id: 'specialUseStatusDate',
                        //             label: 'Status Date',
                        //             prop: 'statusDate',
                        //             title: 'Date on which the current status was set, display format is MM/DD/YYYY',
                        //             labelGrid: 'col-md-4 col-sm-2', // Twitter Bootstrap grid class for the label
                        //             hzGrid: 'col-md-8 col-sm-10', // Twitter Bootstrap grid class for the field
                        //             grid: 'col-md-6' // label and field
                        //         },
                        //         {
                        //             type: 'tabs',
                        //             id: 'processingStageTabs',
                        //             pill: true,
                        //             numbered: true,
                        //             tabs: [
                        //                 {
                        //                     id: 'proposalPanel',
                        //                     label: 'Proposal',
                        //                     stage: 'Proposal',
                        //                     config: {
                        //                         controls: [
                        //                             {
                        //                                 id : 'proposalContact',
                        //                                 type: 'inputText',
                        //                                 prop: 'proposalContactFk',
                        //                                 label: 'Contact Name',
                        //                                 grid: 'col-sm-6',
                        //                                 labelGrid: 'col-sm-4',
                        //                                 hzGrid: 'col-sm-8'
                        //                             },
                        //                             {
                        //                                 id : 'proposalShape',
                        //                                 type: 'shape',
                        //                                 prop: 'proposalShape',
                        //                                 allowReplace : true,
                        //                                 grid: 'col-sm-6'
                        //                             }
                        //                         ]
                        //                     }
                        //                     //content: 'Selected the Proposal tab'
                        //                 },
                        //                 {
                        //                     id: 'applicationPanel',
                        //                     label: 'Application',
                        //                     stage: 'Application',
                        //                     content: 'Selected the Application tab'
                        //                 },
                        //                 {
                        //                     id: 'costRecoveryProcessingPanel',
                        //                     label: 'Cost Recovery Processing',
                        //                     stage: 'Cost Recovery Processing',
                        //                     content: 'Selected the Cost Recovery Processing tab'
                        //                 },
                        //                 {
                        //                     id: 'nepaDecisionPanel',
                        //                     label: 'NEPA Decision',
                        //                     stage: 'NEPA Decision/Cost Recovery Monitoring',
                        //                     content: 'Selected the NEPA Decision/Cost Recovery Monitoring tab'
                        //                 },
                        //                 {
                        //                     id: 'authorizationPanel',
                        //                     label: 'Authorization',
                        //                     stage: 'Authorization',
                        //                     content: 'Selected the Authorization tab'
                        //                 },
                        //                 {
                        //                     id: 'administrationPanel',
                        //                     label: 'Administration',
                        //                     stage: 'Administration',
                        //                     content: 'Selected the Administration tab'
                        //                 },
                        //                 {
                        //                     id: 'amendmentPanel',
                        //                     label: 'Amendment',
                        //                     stage: 'Amendment',
                        //                     content: 'Selected the Amendment tab'
                        //                 },
                        //                 {
                        //                     id: 'closurePanel',
                        //                     label: 'Closure',
                        //                     stage: 'Closure',
                        //                     content: 'Selected the Closure tab'
                        //                 }
                        //             ]
                        //         }
                        //     ]
                        // };
                    }
                }
                /**
                 * List of events that will be delegated on the model, notice the pattern used to extend the base, this must be
                 * followed whenever we override this property.
                 * @type {Object<String,String|Function>}
                 * @see {@link module:nrm-ui/models/editorView#modelEvents|EditorView.modelEvents}
                 */
                // modelEvents: $.extend({}, EditorView.prototype.modelEvents, {
                //     'change:statusFk': 'statusChanged'
                // }),
                /**
                 * Event handler for 'change:statusFk' event that is triggered on the model.  Also may be called during initial
                 * rendering.
                 * @param {external:module:backbone} [model]
                 * @returns {undefined}
                 */
                // statusChanged: function(model) {
                //     console.log('status changed');
                //     var stage = this.model && this.model.stage(),
                //         // model parameter will be defined only if the function is called as an event handler.
                //         isChangeEvent = !!model;
                //     if (stage && stage !== this.currentStage) {
                //         this.currentStage = stage;
                //         var tabsControl = _.find(this.config.controls, function(control) {
                //                 return control.id === 'processingStageTabs';
                //             }), tab = tabsControl && _.find(tabsControl.tabs, function(tab) {
                //                     return tab.stage === stage;
                //                 }),
                //             found = false,
                //             selectedTabRestored = false;
                //         function showTabIfSelected($tab, tabId) {
                //             if (tabId || (tabsControl.selectedTab && tabsControl.selectedTab === $tab.attr('aria-controls'))) {
                //                 $tab.tab('show');
                //                 selectedTabRestored = true;
                //             }
                //         }
                //         if (tab) {
                //             $('#processingStageTabs a', this.$el).each(function() {
                //                 var $tab = $(this);
                //                 var $parent = $tab.parent();
                //                 // add or remove disabled class on the <li> parent
                //                 if (!found) {
                //                     // enable all tabs up to and including the tab that will be selected
                //                     $parent.removeClass('disabled');
                //                     if (!isChangeEvent) {
                //                         // restore selected tab if it was previously selected, and still enabled.
                //                         showTabIfSelected($tab, false);
                //                     }
                //                 } else {
                //                     // disable all tabs after the tab that will be selected
                //                     $parent.addClass('disabled');
                //                 }
                //                 if ($tab.attr('aria-controls') === tab.id) {
                //                     if (!selectedTabRestored) {
                //                         //show the tab, unless we restored the
                //                         showTabIfSelected($tab, tab.id);
                //                     }
                //                     // set found = true so that all subsequent tabs are disabled
                //                     found = true;
                //                 }
                //             });
                //         }
                //     }
                // },
                /**
                 * Overrides {@link module:nrm-ui/views/editorView#render|EditorView#render}
                 * @returns {module:app/views/common/specialUseEditorView}
                 */
                // render: function() {
                //     // call base "generic" render implementation...
                //     EditorView.prototype.render.apply(this, arguments);
                //     if (this.rendered) {
                //         // if the view is being re-rendered after a save...
                //         this.currentStage = null;
                //         this.statusChanged();
                //     }
                //     return this;
                // },
                /**
                 * Overrides {@link module:nrm-ui/views/editorView#destroyControl|EditorView#destroyControl} to remove the
                 * tab views when the form is removed or re-rendered.
                 * @returns {undefined}
                 */
                // destroyControl: function(control) {
                //     // always call the base implementation
                //     EditorView.prototype.destroyControl.apply(this, arguments);
                //     if (control.tabs) {
                //         _.each(control.tabs, function(tab) {
                //             /* tab.view could be a variety of different types, including:
                //              * undefined, string, $.Deferred, a view, or a constructor function
                //              * If it's a view, we need to remove it.
                //              */
                //             if (tab.view && _.isFunction(tab.view.remove)) {
                //                 tab.view.remove();
                //                 // set tab.view to the constructor so that it can be re-constructed
                //                 tab.view = tab.view.constructor;
                //             }
                //         });
                //     }
                // },
                /**
                 * Events hash
                 * @type {Object}
                 * @see {@link http://backbonejs.org/#View-events|Backbone.View#events}
                 */
                // events: {
                //     'click li.disabled>a': function(event) {
                //         // prevent showing the tab if it is disabled, should be handled in Core layoutView but isn't (artf65366)
                //         event.preventDefault();
                //         return false;
                //     },
                //     'show.bs.tab #processingStageTabs>li>a': 'tabSelected'
                // },
                /**
                 * Handles the show event triggered by the Twitter Bootstrap Tab plugin
                 * @param {Event} event
                 */
                // tabSelected: function(event) {
                //     var $target = $(event.target), tabId = $target.attr('aria-controls');
                //     var tabsControl = _.find(this.config.controls, function(control) {
                //         return control.id === 'processingStageTabs';
                //     }), tab = tabsControl && _.find(tabsControl.tabs, function(tab) {
                //             return tab.id === tabId;
                //         }), viewModuleId = tab && tab.view, tabLoading;
                //     if (!tab) {
                //         // tab or tabsControl not found
                //         return;
                //     }
                //     if (!viewModuleId && tab.config) {
                //         // use the generic panel view
                //         viewModuleId = '../panelView';
                //     }
                //     tabsControl.selectedTab = tabId;
                //     function renderTab(viewModule) {
                //         if (this.removed) {
                //             // just in case the asynchronous module load finishes after removing the view
                //             return;
                //         }
                //         var view = new viewModule({
                //             config: _.defaults(tab.config, _.pick(this.config, 'hz', 'inputClass')),
                //             model: this.model,
                //             context: this.context
                //         });
                //         var renderFn = view.renderDeferred || view.render, $tabPanel = $('#' + tabId, this.$el);
                //         $.when(renderFn.call(view)).done(function() {
                //             tab.view = view;
                //             $tabPanel.html(view.$el);
                //             view.trigger('renderComplete');
                //             if (tabLoading) {
                //                 tabLoading.resolve(view);
                //             }
                //         });
                //     }
                //     if (_.isString(viewModuleId)) {
                //         // it is an AMD module ID, so load the module, then render the view
                //         // set tab.view to a Deferred object to guard against multiple loads
                //         tabLoading = tab.view = $.Deferred();
                //         require([viewModuleId], _.bind(renderTab, this));
                //     } else if (_.isFunction(viewModuleId)) {
                //         // it is the actual view constructor, this will happen if re-rendering after a save
                //         tabLoading = tab.view = $.Deferred();
                //         // just render the view
                //         renderTab.call(this, viewModuleId);
                //
                //     }
                // },
                /**
                 * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
                 * @returns {undefined}
                 */
                // startListening: function() {
                //     EditorView.prototype.startListening.apply(this,arguments);
                //     this.listenTo(this, {
                //         'renderComplete': function() {
                //             // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                //             // to occur after view is added to the page, which is why we have to use the renderComplete event
                //             // instead of calling it from the render function
                //             this.rendered = true;
                //             this.statusChanged();
                //         }
                //     });
                // }
            });


    });
