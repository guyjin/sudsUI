/**
 * Base view providing common behavior and configuration for editor views.
 * @file
 * @see module:app/views/common/specialUseEditorView
 */
/**
 * @module app/views/common/specialUseRecordView
 */
define([
        '../..',
        'nrm-ui/views/editorView',
        'nrm-ui/views/panelView',
        'jquery',
        'underscore',
        "nrm-ui",
        "backbone",
        'nrm-ui/plugins/nrmDatePicker', // allows synchronous initialization of NrmDatePicker plugin
        'use!select2', // allows synchronous initialization of Select2 plugin
        'require', // enables relative module ids in require calls,
    'app/views/contactsManagement/contactTypeSelectionView'
    ],

    function (Suds, EditorView, PanelView, $, _, Nrm, Backbone, NrmDatePicker, Select2, require,ContactTypeSelectionView) {
        return Suds.Views.ContactManagementView =

            EditorView.extend(/** @lends module:app/views/common/specialUseEditorView.prototype */{
                /**
                 * Override of {@link module:nrm-ui/views/editorView#getEditorConfig|EditorView#getEditorConfig} to return
                 * default configuration that may be shared, extended or overriden by subclasses.
                 * @returns {module:nrm-ui/views/baseView~FormConfig}
                 */
                genericTemplate: 'contacts/contactsBaseForm',
                className: 'container suds-container',
                useGlobalErrorNotification: false,


                getEditorConfig: function() {
                    var dfd = $.Deferred();

                    $.when(Nrm.app.getCollection(this.context, null, this)).done(function(collection) {
                        this.collection = collection;
                        this.setCurrentStep(this.options);
                        var config = this.getConfigObject();

                        dfd.resolve(config);
                    }).fail(dfd.reject);
                    return dfd.promise();
                },


                getConfigObject : function () {

                    var config = {
                        /* hz: true,*/
                        inputClass: 'input-sm',
                        btnClass: 'btn',
                        title: "Special Use",
                        controls: [
                            {
                                id: 'processingStepViews',
                                steps: [
                                    {
                                        id: 'contactSearchFormId',
                                        stepName: 'search',
                                        isStepControlRequired: false,
                                        //prop: 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: [],
                                            tabName : 'Contact Search',
                                            breadCrumbs :[{
                                                value:'Search',
                                                id:'search'
                                            }]

                                        },
                                        view: 'app/views/contactsManagement/contactsSearchView'
                                    }, {
                                        id: 'contactViewId',
                                        stepName: 'contactView',
                                        isStepControlRequired: false,
                                        //prop: 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: [],
                                            tabName : 'Contact View',
                                            breadCrumbs :[{
                                                value:'Search',
                                                id:'search'
                                            },{
                                                value:'Contact View',
                                                id:'contactView'
                                            }]

                                        },
                                        view: 'app/views/contactsManagement/contactView'
                                    }, {
                                        id: 'contactTypeSelectionForm',
                                        stepName: "contactType",
                                        //prop: 'authorization',
                                        config: {
                                            /*template: 'primaryUseCode/primaryUseCodes',*/
                                            /* the control config is defined under individual views*/
                                            controls: [],
                                            tabName : 'New Contact - Contact Type',
                                            breadCrumbs :[{
                                                value:'Search',
                                                id:'search'
                                            },{
                                                value:'Contact Type',
                                                id:'contactType'
                                            }]
                                        },

                                        view: 'app/views/contactsManagement/contactTypeSelectionView',

                                    }, {
                                        id: 'newContactTypeForm',
                                        stepName: "newContactForm",
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/contactsManagement/addNewForms/placeHolder'

                                    },{
                                        id: 'personForm',
                                        stepName: "Person",
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/contactsManagement/addNewForms/addNewPersonView'
                                       /* view: 'app/views/contactsManagement/editContact/editPersonView',*/

                                    }, {
                                        id: 'SoleProprForm',
                                        stepName: "SolePropr",
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/contactsManagement/addNewForms/addNewSoleProprView'

                                    }, {
                                        id: 'TrustForm',
                                        stepName: "Trust",
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/contactsManagement/addNewForms/addNewTrustView'

                                    },{
                                        id: 'MarriedForm',
                                        stepName: "Married",
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/contactsManagement/addNewForms/addNewMarriedView'

                                    }, {
                                        id: 'AssociationForm',
                                        stepName: "Assocatn",
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/contactsManagement/addNewForms/addNewAssociationView'

                                    },{
                                        id: 'PartnershipForm',
                                        stepName: "Partner",
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/contactsManagement/addNewForms/addNewAssociationView'

                                    }, {
                                        id: 'FedGovForm',
                                        stepName: "FedGovt",
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/contactsManagement/addNewForms/addNewGovernmentView'

                                    },{
                                        id: 'StateGovForm',
                                        stepName: "StateGvt",
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/contactsManagement/addNewForms/addNewGovernmentView'

                                    },{
                                        id: 'TribalGovForm',
                                        stepName: "Tribal",
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/contactsManagement/addNewForms/addNewGovernmentView'

                                    },{
                                        id: 'LocalGovForm',
                                        stepName: "LocalGvt",
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/contactsManagement/addNewForms/addNewGovernmentView'

                                    },{
                                        id: 'ForeignGovForm',
                                        stepName: "FrgnGovt",
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/contactsManagement/addNewForms/addNewGovernmentView'

                                    },{
                                        id: 'CorporationForm',
                                        stepName: "Corp",
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/contactsManagement/addNewForms/addNewCorpView'

                                    },{
                                        id: 'LLCForm',
                                        stepName: "LLC",
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/contactsManagement/addNewForms/addNewCorpView'

                                    },{
                                        id: 'LLPForm',
                                        stepName: "LLP",
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/contactsManagement/addNewForms/addNewCorpView'

                                    }
                                ]
                            }
                        ]
                    };

                    return config;

                },

                /**
                 * List of events that will be delegated on the model, notice the pattern used to extend the base, this must be
                 * followed whenever we override this property.
                 *
                 * you can add event listeners for model events by adding to the modelEvents hash
                 * there is a change:attrName for individual model attributes, e.g. change:name when the "name" attribute changes
                 * @type {Object<String,String|Function>}
                 * @see {@link module:nrm-ui/models/editorView#modelEvents|EditorView.modelEvents}
                 */
                modelEvents: $.extend({}, EditorView.prototype.modelEvents, {

                }),

                /**
                 * Event handler for 'change:statusFk' event that is triggered on the model.  Also may be called during initial
                 * rendering.
                 * @param {external:module:backbone} [model]
                 * @returns {undefined}
                 */
                stepChanged: function () {

                    var stepView = this.getCurrentStepViewControl();

                    if (!stepView) {
                        // step Control not found
                        return;
                    }
                    stepView.config.collection  = this.model && this.model.collection || this.collection;

                    this.renderStep(this, stepView);

                },

                renderStep: function(parentView, stepView) {
                    if (!stepView) {
                        // step Control not found
                        return;
                    }
                    // apply custom classes on renderView tags for "this" ('stepView' object)  screen
                    var sudsContainer = $(this.$el);
                    var $stepPanel = $('.' + "contactContentSecCtrlsContainer",this.$el);

                    $.when(PanelView.prototype.renderPanel.call(parentView, stepView, $stepPanel)).done(_.bind(function(view) {
                        this.listenTo(view, "save", this.onSave);


                    }, this));

                },

                /**
                 * Overrides {@link module:nrm-ui/views/editorView#render|EditorView#render}
                 * @returns {module:app/views/common/specialUseEditorView}
                 */

                render: function () {
                    this.getCurrentStepViewControl();
                    // call base "generic" render implementation...
                    EditorView.prototype.render.apply(this, arguments);

                    if (this.rendered) {
                        // if the view is being re-rendered after a save...

                        this.stepChanged();
                    }

                    return this;
                },

                fadeIn : function () {
                    var self = this;
                    setTimeout(function () {
                        self.$el.animate({
                            opacity: 1,
                            left: 0
                        }, 800, 'easeOutCirc')
                    }, 300);
                },


                getCurrentStepViewControl :function () {

                    var stepName  = this.currentStep || "search";

                    var contactManagementViews = _.find(this.config.controls, function (control) {
                        return control.id === 'processingStepViews';
                    });

                    var stepView = contactManagementViews && _.find(contactManagementViews.steps, function (stepView) {
                            return (stepView.stepName === stepName);
                        });

                    if (!stepView){
                        return;
                    }

                    this.setTabNamesAndBreadCrumbs(stepView);
                    this.config.contactsTab = stepView.config.tabName;
                    this.config.breadCrumbs = stepView.config.breadCrumbs;

                    stepView.config.screenId = stepName; // can be used to determine contact form type

                    return  stepView;
                },


                /*
                * Todo: need to come back and probably pass the object instead of hardcoding if the midtier does decide to pass
                * these options
                * */
                setTabNamesAndBreadCrumbs : function (stepView) {
                    var str ="New Contact - ",
                        self= this,
                        breadCrumbs =[{
                            value:'SEARCH',
                            id:'search'
                        },{
                            value:'CONTACT TYPE',
                            id:'contactType'
                        }]




                    if (this.options.params[0] == "contactView"){
                        stepView.config.breadCrumbs[1].id = "contactView/" + this.options.params[1] + "/" +  + this.options.params[2] ;
                        stepView.config.orgCn = this.options.params[2];
                        this.config.contactView = true;
                        this.config.contactTypeForm = this.options.params[1];
                        this.config.orgCn = this.options.params[2];
                        this.model.set("id",this.options.params[2])
                    }else{
                        this.config.contactView = false;
                    }

                    if (this.options.params[0] === "editView"){
                        this.config.orgCn =  stepView.config.OrgCn = this.options.params[2];
                        this.config.contactTypeForm = this.options.params[1];
                        this.model.set("id",this.options.params[2])
                    }


                    var contactTypesSelectedValues = _.find(this.getContactTypesSelectionValues(),function (item) {
                        return item.value == self.currentStep;
                    });

                    if (contactTypesSelectedValues){
                        stepView.config.tabName = contactTypesSelectedValues.text;

                    }
                     if (self.currentStep && contactTypesSelectedValues && contactTypesSelectedValues.text){

                        stepView.config.tabName = str + contactTypesSelectedValues.text.toUpperCase();
                        breadCrumbs.push({
                            value: contactTypesSelectedValues.text,
                            id: contactTypesSelectedValues.value
                        });

                        stepView.config.breadCrumbs = breadCrumbs;

                    }
                },
                /**
                 * Overrides {@link module:nrm-ui/views/editorView#destroyControl|EditorView#destroyControl} to remove the
                 * tab views when the form is removed or re-rendered.
                 * @returns {undefined}
                 */

                destroyControl: function (control) {
                    // always call the base implementation
                    EditorView.prototype.destroyControl.apply(this, arguments);
                    if (control.steps) {
                        _.each(control.steps, function (step) {
                            this.destroyControl(step);
                        }, this);
                    }
                },


                /**
                 * Events hash
                 * @type {Object}
                 * @see {@link http://backbonejs.org/#View-events|Backbone.View#events}
                 */

                events: {

                },

                setCurrentStep: function(options) {
                    var action = options.params && options.params[0]; // options.params[0] is the :action from tools/:action/*path

                    if((action === "editView" || action === "contactType") && options.params.length > 1){
                        action = options.params[1]
                    }

                    if (this.collection){
                        this.model = new this.collection.model();// new this.collection.searchModel(); // or something
                        this.model.collection = this.collection;
                    }else{
                        this.model = options.model;
                    }

                    this.currentStep = action;


                },




                applyContext: function(options) {
                    this.options.params = options.params;

                    if (this.model && this.model.collection){
                        this.collection = this.model.collection.reset([]);
                    }
                    this.stopListening(this.model);
                    this.setCurrentStep(options);
                    this.renderDeferred();

                },


                onSave : function () {
                    var self = this;

                    $.when(EditorView.prototype.onSave.apply(self,arguments)).done(_.bind(function(validated){
                        if(validated){
                            this.model.clear({silent :true})
                            EditorView.prototype.useGlobalErrorNotification  = false;
                        }

                    },self));


                },


                getContactTypesSelectionValues :function () {

                    var contactTypeSelectionOptions = ContactTypeSelectionView.prototype.getContactContentSectionControls.apply(this,arguments);


                    return contactTypeSelectionOptions;
                },
                hideNorthAndWestPanes  : function () {
                    $('.ui-layout-toggler-north-open,.ui-layout-toggler-west-open').click();
                    $('.nrm-westpane-container .panel-collapse').not('#nrm-app-accordion-layers-panel').collapse('show');
                    $('#nrm-app-accordion-layers-panel').collapse('hide');
                },



                /**
                 * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
                 * @returns {undefined}
                 */
                startListening: function () {

                    EditorView.prototype.startListening.apply(this, arguments);

                    this.listenTo(this, {
                        'renderComplete': function () {
                            // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                            // to occur after view is added to the page, which is why we have to use the renderComplete event
                            // instead of calling it from the render function
                            var self = this;

                            this.rendered = true;
                            this.stepChanged();

                            this.setControlEnabled($('.suds-save-btn', this.$el), false);

                            /*var options = {
                                status: 'close',
                                paneName: 'west'
                            }
                            Nrm.event.trigger('suds:toggle-navigation', options);*/


                        }
                    });

                },

            });


    });
