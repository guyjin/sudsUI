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
        /*'nrm-map/views/spatialEditView',*/ // views with geometry fields use this module instead of nrm-ui/views/editorView
        'nrm-ui/views/editorView',
        'nrm-ui/views/panelView',
        'jquery',
        'underscore',
        "nrm-ui",
        "backbone",
        '../../utils/handlebars-helpers', // we are using the "inc" helper registered by this module factory function
        'nrm-ui/plugins/nrmDatePicker', // allows synchronous initialization of NrmDatePicker plugin
        'use!select2', // allows synchronous initialization of Select2 plugin
        'require', // enables relative module ids in require calls,
        'nrm-ui/views/modalView',
        '../summaryView',
        'app/models/common/recordModel',
        'app/models/costRecovery/getCrEstimate',
        'app/models/costRecovery/updateCrp'

    ],

    function (Suds, EditorView, PanelView, $, _, Nrm, Backbone,
              Handlebars, NrmDatePicker, Select2, require, ModalView, SummaryView, RecordModel,CrEstimateModel,UpdateCrp) {
        return Suds.Views.SpecialUseRecordView =

            EditorView.extend(/** @lends module:app/views/common/specialUseEditorView.prototype */{
                /**
                 * Override of {@link module:nrm-ui/views/editorView#getEditorConfig|EditorView#getEditorConfig} to return
                 * default configuration that may be shared, extended or overriden by subclasses.
                 * @returns {module:nrm-ui/views/baseView~FormConfig}
                 */
                genericTemplate: 'sudsBaseEditForm',
                className: 'container suds-container',
                useGlobalErrorNotification: false,

                getEditorConfig: function () {

                    return {
                        /* hz: true,*/
                        inputClass: 'input-sm',
                        btnClass: 'btn',
                        title: "Special Use",
                        controls: [
                            {
                                id: 'processingStepViews',
                                steps: [
                                    {
                                        id: 'NewPermitCheckId',
                                        stepName: 'NewPermitCheck',
                                        isStepControlRequired: false,
                                        prop: 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/newOrReissueView'
                                    }, {
                                        id: 'EnterUseCodesId',
                                        stepName: "UseCode",
                                        isSubflow : true,
                                        isStepControlRequired: true,
                                        prop: 'authorization',
                                        className :'useCodeSelection',
                                        config: {
                                            /*template: 'primaryUseCode/primaryUseCodes',*/
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },
                                        view: 'app/views/useCode/useCodeFormView'
                                    }, {
                                        id: 'SelectProposalTypeId',
                                        stepName: "SelectProposalType",
                                        isStepControlRequired: false,
                                        prop: 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view: 'app/views/selectProposalTypeView'
                                    }, {
                                        id: 'SelectContactsId',
                                        stepName: "Contacts",
                                        isSubflow : true,
                                        className: 'contactSelection',
                                        isStepControlRequired: true,
                                        prop: 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view: 'app/views/addContacts/addContactsToProposalFormView'
                                    }, {
                                        id: 'EnterBasicProposalDaId',
                                        stepName: "BasicInfo",
                                        isSubflow : true,
                                        isStepControlRequired: true,
                                        prop: 'authorization',
                                        className : 'basicInfo',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view: 'app/views/basicInfo/basicInfoFormView'
                                    },{
                                        id: 'closureFormId',
                                        stepName: "Closure",
                                        isSubflow : true,
                                        isStepControlRequired: true,
                                        prop: 'authorization',
                                        className : 'basicInfo',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view: 'app/views/closure/closureFormView'
                                    },{
                                        id: 'ncguId',
                                        stepName: "NCGU",
                                        isSubflow : true,
                                        isStepControlRequired: true,
                                        prop: 'authorization',
                                        className : 'ncguCheck',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view: 'app/views/ncguCheck/ncguFormView'
                                    }, {
                                        id: 'CostRecoverySummaryFormId',
                                        stepName :"CostRecoveryProcessi",
                                        className : "costRecovery",
                                        isSubflow : true,
                                        isStepControlRequired : true,
                                        prop : 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view :'app/views/costRecovery/costRecoverySummaryFormView'
                                    },

                                    {
                                        id: 'AOLevel1ScreeningId',
                                        stepName: "AO1stLevelScreening",
                                        className: "AOLevel1Screening",
                                        isStepControlRequired: false,
                                        prop: 'authorization',
                                        isSubflow : true,
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view: 'app/views/aoLevelScreening/screeningQuestionsView'
                                    },
                                    {
                                        id: 'AOLevel2ScreeningId',
                                        stepName: "AO2ndLevelScreening",
                                        className: "AOLevel1Screening",
                                        isStepControlRequired: false,
                                        prop: 'authorization',
                                        isSubflow : true,
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view: 'app/views/aoLevelScreening/screeningQuestionsView'
                                    },
                                    {
                                        id: 'CostRecoveryWorksheetId',
                                        stepName: "CRprocessing",
                                        className: "costRecoveryWorksheet noEntries",
                                        isStepControlRequired: true,
                                        isSubflow: true,
                                        prop: 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view: 'app/views/costRecovery/CostRecoveryWorksheetFormView'
                                    }, {
                                        id: 'CostRecoveryAOAprrovalId',
                                        stepName: "AOCRProcessing",
                                        className: "costRecoveryAOApproval",
                                        isStepControlRequired: false,
                                        prop: 'authorization',
                                        isSubflow : true,
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view: 'app/views/costRecovery/aoApprovalProcessing'
                                    },{
                                        id: 'authoritySelectionScreen',
                                        stepName: "AuthSelection",
                                        isSubflow : true,
                                        className: "authoritySelection",
                                        isStepControlRequired: true,
                                        prop: 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view: 'app/views/authSelection/authSelectionFormView'
                                    }, {
                                        id: 'level1Screening',
                                        stepName: "level1Screening",
                                        className: "level1Screening",
                                        isSubflow : true,
                                        isStepControlRequired: true,
                                        prop: 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: [],
                                            questionType: 'SCREEN1'
                                        },

                                        view: 'app/views/screening/screening'
                                    },{
                                        id: 'level2Screening',
                                        isSubflow : true,
                                        stepName: "level2Screening",
                                        className: "level2Screening",
                                        isStepControlRequired: true,
                                        prop: 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: [],
                                            questionType: 'SCREEN2'
                                        },

                                        view: 'app/views/screening/screening'
                                    },{
                                        id: 'authRequired',
                                        stepName: "AuthNeeded",
                                        className: "authRequired",
                                        isSubflow : true,
                                        isStepControlRequired: true,
                                        prop: 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: [],
                                            questionType: 'AUTHREQ'
                                        },

                                        view: 'app/views/screening/screening'
                                    },{
                                        id: 'geoSpatial',
                                        stepName: "Geospatial",
                                        isStepControlRequired: false,
                                        prop: 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view: 'app/views/geoSpatial/geoSpatialView'
                                    },{
                                        id: 'gisTestViewId',
                                        stepName: "GISTestView",
                                        isStepControlRequired: false,
                                        prop: 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view: 'app/views/sudsGISTestView'
                                    },{
                                        id: 'testSummaryView',
                                        stepName: "TestSummaryView",
                                        isStepControlRequired: true,
                                        prop: 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view: 'app/views/caseFile/summaryViews/authorization/testGISPdfSummaryView'
                                    },{
                                        id: 'caseFileId',
                                        stepName: "Proposal",
                                        className: "caseFile proposalCaseFile",
                                        isStepControlRequired: true,
                                        prop: 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view: 'app/views/caseFile/proposalCaseFileView'
                                    },{
                                        id: 'onBoardingScreenId',
                                        stepName: "Pre-Propsal",
                                        className: "onBoarding caseFile",
                                        isStepControlRequired: true,
                                        prop: 'authorization',
                                        config: {
                                            /* the control config is defined under individual views*/
                                            controls: []
                                        },

                                        view: 'app/views/caseFile/preliminaryCaseFileView'
                                    }, {
                                        id: 'UnderConstructionId',
                                        stepName: "UnderConstruction",
                                        isStepControlRequired: false,
                                        config: {
                                            template: 'underConstruction',
                                            controls: []
                                        }
                                    }, {
                                        id: 'applicationCaseFile',
                                        stepName: "Application",
                                        className: "caseFile authorizationCaseFile",
                                        isStepControlRequired: false,
                                        prop: 'authorization',
                                        config: {
                                            controls: []
                                        },
                                        view: 'app/views/caseFile/applicationCaseFileView'
                                    },{
                                        id: 'authorizationCaseFile',
                                        stepName: "Authorization",
                                        className: "caseFile authorizationCaseFile",
                                        isStepControlRequired: false,
                                        prop: 'authorization',
                                        config: {
                                            controls: []
                                        },
                                        view: 'app/views/caseFile/authorizationCaseFileView'
                                    },{
                                        id: 'administrationCaseFileId',
                                        stepName: "Administration",
                                        className: "caseFile administrationCaseFile",
                                        isStepControlRequired: false,
                                        prop: 'authorization',
                                        config: {
                                            controls: []
                                        },
                                        view: 'app/views/caseFile/administrationCaseFileView'
                                    },{
                                        id: 'accordionTest',
                                        stepName: "accordionTest",
                                       /* className: "caseFile authorizationCaseFile",*/
                                        isStepControlRequired: false,
                                        prop: 'authorization',
                                        config: {
                                            controls: []
                                        },
                                        view: 'app/views/proposalTabView'
                                    }, {
                                        id: 'testCaseFile',
                                        stepName: "TestCaseFile",
                                        className: "caseFile authorizationCaseFile",
                                        isStepControlRequired: false,
                                        prop: 'authorization',
                                        config: {
                                            controls: []
                                        },
                                        view: 'app/views/caseFile/testCaseFileView'
                                    },{
                                        id: 'rentSheetFormView',
                                        stepName: "RentSheet",
                                        className: "rentSheetWorksheet",
                                        isStepControlRequired: true,
                                        prop: 'authorization',
                                        config: {
                                            controls: []
                                        },
                                        view: 'app/views/rentSheet/rentSheetFormView'
                                    },{
                                        id: 'rentSheetRecEventSingle',
                                        stepName: "RecEventSingle",
                                        className: "rentSheetWorksheet",
                                        isStepControlRequired: true,
                                        prop: 'authorization',
                                        config: {
                                            controls: []
                                        },
                                        view: 'app/views/rentSheet/rentEventSingleView'
                                    },{
                                        id: 'rentSheetRecEventMultiple',
                                        stepName: "RecEventMultiple",
                                        className: "rentSheetWorksheet",
                                        isStepControlRequired: true,
                                        prop: 'authorization',
                                        config: {
                                            controls: []
                                        },
                                        view: 'app/views/rentSheet/rentEventMultipleView'
                                    }
                                ]
                            }
                        ]
                    };
                },

                // overriding the default Actions list originally found in editorView
                defaultActions: [
                    {
                        type: "btn",
                        id: "suds-reset",
                        icon: "fa fa-refresh",
                        label: "Reset",
                        btnStyle: "default",
                        className: "btn resetQuestions suds-reset-btn",
                        title: "Reload the form"

                    },
                    {
                        type: "btn",
                        id: "suds-save",
                        icon: "fa fa-floppy-o",
                        btnStyle: "primary",
                        label: "Save & Continue",
                        className: "btn suds-save-btn nrm-enable-changed nrm-edit-btnsave",
                        title: "Save the step and go to next step",
                        submit: true
                    },
                    {
                        type: "btn",
                        id: "suds-cancel",
                        icon: "fa fa-ban",
                        btnStyle: "danger",
                        label: "Cancel",
                        className: "btn suds-cancel-btn",
                        title: "Cancel edits and return to last step"
                    }

                ],


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
                    'change:statusFk': 'stepChanged'
                }),


                /*getErrorList: function(model, errorList, $parent, isTable) {

                 if (model === this.model) {
                 var args = Array.prototype.slice.call(arguments);
                 args[0] = model.get('currentStep');
                 return EditorView.prototype.getErrorList.apply(this, args);
                 } else {
                 return EditorView.prototype.getErrorList.apply(this, arguments);
                 }
                 },*/
                /**
                 * Event handler for 'change:statusFk' event that is triggered on the model.  Also may be called during initial
                 * rendering.
                 * @param {external:module:backbone} [model]
                 * @returns {undefined}
                 */
                stepChanged: function (stepId) {

                    /*var newModel = this.options.isNew;*/
                    /*var stage = this.model && this.model.stage(),
                     // model parameter will be defined only if the function is called as an event handler.
                     isChangeEvent = !!model;*/
                    var authorization = this.model.get('authorization')  && this.model.get('authorization').toJSON();                   

                   // stepId = "CostRecoveryProcessi";
                    var stepName = stepId || this.currentStepId || authorization.caseFileId || "UnderConstruction";

                    if (window.location.hostname === 'localhost' && window.location.port === '3000'){
                        // just for test:
                        //stepName = 'Application';
                        //stepName = 'TestCaseFile';
                        // stepName = 'accordionTest';
                        //stepName = 'RentSheet';
                        //stepName = "CRprocessing"
                        //stepName = "CostRecoveryProcessi"
                        //stepName = 'GISTestView';
                        //stepName = 'Authorization';
                        //stepName = "Administration"
                        //stepName ="Closure"
                        //stepName = "BasicInfo"
                        //stepName = "Geospatial"
                        //stepName ="accordionTest"
                        stepName = "RecEventSingle"
                    }



                    var recordViews = _.find(this.config.controls, function (control) {
                        return control.id === 'processingStepViews';
                    });


                    //this.questionStepConfig(recordViews);
                    var stepView = recordViews && _.find(recordViews.steps, function (stepView) {
                            return stepView.stepName === stepName;
                        });



                    if (!stepView) {
                        // step Control not found
                        return;
                    }

                    this.renderStep(this, stepView);

                },

                renderStep: function(parentView, stepView) {
                    if (!stepView) {
                        // step Control not found
                        return;
                    }

                    // apply custom classes on renderView tags for "this" ('stepView' object)  screen
                    var sudsContainer = $(this.$el);
                    var $stepPanel = $('#' + "renderView",this.$el),
                        previousStep = stepView.currentStep;

                    if (stepView.className){
                        $stepPanel.removeClass()
                        $stepPanel.addClass(stepView.className);
                    }

                    sudsContainer.removeClass('subflow');

                    stepView.currentStep = stepView;

                    $.when(PanelView.prototype.renderPanel.call(parentView, stepView, $stepPanel)).done(_.bind(function(view) {
                       /* if (previousStep && previousStep.view) {
                            this.destroyControl(previousStep);
                        }*/
                       var animations;


                        if (stepView.isSubflow && stepView.isSubflow === true ){

                            sudsContainer.addClass('subflow');
                            sudsContainer.css("left","800px");

                            animations = sudsContainer.animate({
                                opacity: 1,
                                left: 0
                            }, 800, 'easeOutCirc')
                        }else{

                            animations = sudsContainer.animate({
                                opacity: 1,
                                left: 0
                            }, 800, 'easeOutCirc')

                        }

                        $.when(animations).done(_.bind(function () {
                            if (stepView.isStepControlRequired) {
                                $('.stepControls', this.$el).show();
                            } else {
                                $('.stepControls', this.$el).hide();
                            }

                            view.trigger("classesApplied");

                            this.renderViewScroll();
                        },this))



                        this.listenTo(view, "renderViewScroll", _.bind(function(screenId) {

                            this.renderViewScroll();
                        },this));


                        this.listenTo(view, 'dirtyChanged', function () {

                            this.setControlEnabled($('.suds-save-btn', this.$el), true);
                            if (view.isDirty()) {
                                this.setDirty(true);
                            }
                        });

                        this.listenTo(view, "loadFormView", _.bind(function(screenId) {
                            this.currentStepId = screenId;
                            this.stopListening()
                            this.destroyControls();
                            this.renderAndFocus();
                        },this));

                        this.listenTo(view, "validateForm", _.bind(function() {
                            EditorView.prototype.useGlobalErrorNotification = true;

                           $.when(this.validate(true,this.options)).done(function (valid) {

                               view.trigger("screenValidated",valid);
                           });
                        },this));


                        view.trigger("scrollToLastSectionOfCaseFile",this.lastSectionTarget);

                        this.listenTo(view, "save", this.onSave);
                        this.listenTo(view, "onGISViewSave", this.onGISViewSave);
                        this.listenTo(view, "cancel", this.onCancel);
                        this.listenTo(view, "changeStep", function(step) {
                            this.renderStep(view, step);
                        });

                    }, this));


                },

                /**
                 * Overrides {@link module:nrm-ui/views/editorView#render|EditorView#render}
                 * @returns {module:app/views/common/specialUseEditorView}
                 */

                render: function () {

                    this.pageTransitionTime = 800;

                    // call base "generic" render implementation...
                    EditorView.prototype.render.apply(this, arguments);

                    if (this.rendered) {
                        // if the view is being re-rendered after a save...
                        this.stepChanged(this.currentStepId);
                    }

                    return this;
                },

                loadData: function () {

                    var self = this;
                    var baseLoading = EditorView.prototype.loadData.apply(this, arguments);

                    var authorization = this.model && this.model.get('authorization') && this.model.get('authorization').toJSON();

                    if (authorization && !authorization.authorizationCn) {

                        var dfd = new $.Deferred();

                        this.model.save({}, {
                            success: function (model, resp, options) {

                                dfd.resolve(model, resp, options);
                            },
                            error: function (model, resp, options) {

                                dfd.reject(model, resp, options);
                            }
                        })

                        return $.when(baseLoading, dfd).done(function (model) {
                        });
                    }else{

                        return $.when(baseLoading).done(function (model) {
                        });
                    }

                    /*return $.when(baseLoading).done(function (model) {
                    });*/


                },


                renderViewScroll : function () {

                    var self = this;
                    var nrmEditForm = $('.nrm-edit-form',this.$el);
                    var renderView = $('#renderView',this.$el);
                    var pageTransitionTime = 800;
                    var $stepControls = $('.stepControls',self.$el);
                    var screenSections = $('.screenSections',this.$el);
                    var screenNav = $('.screenNav',this.$el);


                    screenNav.css({
                        "margin-top" : '3em'
                    })

                    nrmEditForm.scroll(function() {
                        var sectionNavOffsetFromRenderViewTop = $('.summaryHeader',this.$el).height();
                        var isThisASubflow = $(self.$el).hasClass('subflow');
                        var isThisAPreCaseFile = renderView.hasClass('onBoarding');
                        var isThisAProposalCaseFile = renderView.hasClass('proposalCaseFile');

                        if (isThisAPreCaseFile || isThisASubflow){

                            if ($(this).scrollTop() > 52) {

                                var t = $(this).offset().top + 16;
                                screenNav.addClass('fixed').css({
                                    top: t + 'px',"margin-top" : '0em'
                                });

                                $stepControls.addClass('fixed').css({
                                    top: t + 'px'
                                });

                                screenSections.css({
                                    top: '60px'
                                })
                            } else {

                                screenNav.removeClass('fixed').css({
                                    top: 'auto', "margin-top" : '3em'
                                });

                                $stepControls.removeClass('fixed').removeAttr('style');

                                screenSections.removeAttr('style');
                            }


                        }else if (isThisAProposalCaseFile){

                            nrmEditForm.scroll(function() {
                                if ($(this).scrollTop() > sectionNavOffsetFromRenderViewTop + 10) {
                                    var t = $(this).offset().top + 10;
                                    $('.screenNav').addClass('fixed').css({
                                        top: t + 'px'
                                    });
                                    $stepControls.addClass('fixed').css({
                                        top: t + 'px'
                                    });
                                } else {
                                    $stepControls.removeClass('fixed').removeAttr('style');
                                    screenNav.removeClass('fixed').css({
                                        top: 'auto'
                                    });
                                }
                            })
                        }


                    })

                },

                questionStepConfig: function (recordViews) {

                    var stepName = this.model && this.model.getCurrentStepName() /*"1stLevelScreening"*/,
                        isQuestionStep,
                        quesStepArray = ["ThreeCriteriaCheck", "1stLevelScreening", "2ndLevelScreening", "NCGUCheck"],
                        self = this;

                    var questionConfig = {
                        id: 'QuestionsId',
                        prop: 'authorization',
                        isStepControlRequired: true,
                        config: {
                            template: '',
                            /* the control config is defined under individual  views*/
                            controls: []

                        },
                        view: 'app/views/isProposalRequiredView'
                    }

                    if (stepName) {

                        isQuestionStep = _.find(quesStepArray, function (each) {
                            return each === stepName;
                        })

                        if (!isQuestionStep) {
                            return
                        }
                        switch (stepName) {

                            case "ThreeCriteriaCheck" :
                            case "NCGUCheck" :
                            case "1stLevelScreening" :
                            case "2ndLevelScreening" :
                                addQuestionConfig("isProposalRequired/permitRequired");
                                break;

                            default :
                                break;
                        }
                    }


                    function addQuestionConfig(template) {

                        questionConfig.stepName = stepName;
                        questionConfig.config.template = template;
                        recordViews.steps.push(questionConfig);
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
                    'click li.disabled>a': function (event) {

                        event.preventDefault();
                        return false;
                    },
                    'click .testingChanges' : function (event) {

                        console.log("this is working in specialUseRecordView")
                    },
                    'click .summaryBlock': 'summaryView',
                    'click .proposalTypeSelected': 'proposalTypeSelected',
                    /*'change .stageSelected' : 'stageSelected',
                     'change .stepSelected': 'stepSelected',*/
                    'click .suds-reset-btn': 'onReset',
                    'click .suds-save-btn' : 'onSave',
                    'click .navAnchorLink' : 'onNavAnchorLinkClick',
                    'click .sectionActionLink>a' : 'sectionActionLink',
                    'click .noContentButton' : 'sectionActionLink',
                    'click .suds-cancel-btn': 'onCancel',
                },


                updateCrp : function (crWorksheetDto) {

                    var updateCrp = new UpdateCrp();

                    updateCrp.save(crWorksheetDto,{
                        type:'PUT',
                        success : function(model, resp, options) {

                        },
                        error : function(model, resp, options) {}
                    });
                },



                onSave : function () {

                    this.hideNorthAndWestPanes();

                    var authorization = this.model.get('authorization'),
                    nextStepId = authorization && authorization.get('nextStepId');

                    if (authorization){
                        EditorView.prototype.useGlobalErrorNotification = true;
                    }


                    if (nextStepId){
                        this.currentStepId = nextStepId;
                    }else{
                        this.currentStepId = undefined;
                    }


                    if (this.currentStepId == "SCREEN1"){
                        this.currentStepId = "level1Screening";
                    }else if (this.currentStepId == "SCREEN2"){
                        this.currentStepId = "level2Screening";
                    }else if (this.currentStepId == "AUTHREQ"){
                        this.currentStepId = "AuthNeeded"
                    }



                    this.model.set(authorization);
                    var $sudsContainer = $(this.$el);
                    $.when(this.animateScreens(true)).done(_.bind(function(){

                        $.when(EditorView.prototype.onSave.apply(this,arguments)).done(_.bind(function(validated){

                            if(!validated){

                                $sudsContainer.animate({
                                    opacity: 1,
                                    left: 0
                                }, 800, 'easeOutCirc')
                            }else{
                                /*after successfully validating all the fields reset the authorization.formSave..
                                this is a work around for the issue where the error message starts getting displayed on model change
                                we can do triggerChange false in recordModel to show error messages on Save only
                                 but then we also need to clear errors from the error list as the user clears the error in the form*/
                                EditorView.prototype.useGlobalErrorNotification  = false;

                            }

                        },this));


                    },this));


                },

                hideNorthAndWestPanes  : function () {
                    $('.ui-layout-toggler-north-open,.ui-layout-toggler-west-open').click();
                    $('.nrm-westpane-container .panel-collapse').not('#nrm-app-accordion-layers-panel').collapse('show');
                    $('#nrm-app-accordion-layers-panel').collapse('hide');
                },
                sectionActionLink : function(e) {
                    e.preventDefault();
                    var self = this,
                        flowId = $(e.target).attr('href');

                    if (flowId && flowId == "Screening"){
                        flowId = "level1Screening";
                    }


                    this.clonedAuthorizationObj = this.model.get('authorization').clone();

                    if (flowId && flowId != "#"){
                        this.currentStepId = flowId;

                        $.when(self.leavePage()).done(function () {
                            self.stopListening()
                            self.destroyControls();
                            self.renderAndFocus();
                        })


                    }

                },



                leavePage : function () {
                    var self = this;

                   return $(this.$el).animate({
                        opacity: 0,
                        left: -600
                    }, self.pageTransitionTime, 'easeOutCirc')
                },


                onNavAnchorLinkClick : function (e) {
                    var $target = $(e.target);
                    e.preventDefault();

                    var caseSections = $('.caseSections',this.$el);
                    var renderView = $('.nrm-edit-form',this.$el);

                    if ($target.attr('data-target') === '#home') {
                        renderView.animate({
                            scrollTop: 0
                        }, 500)
                    } else {
                        var dataTarget = $.attr(e.currentTarget, 'data-target');

                        renderView.animate({
                            scrollTop: ($(dataTarget).offset().top - $(dataTarget).offsetParent().offset().top)
                        }, 500);

                    }

                    if (caseSections.hasClass('open')) {
                        caseSections.removeClass('open');
                        $('.screenNav',this.$el).toggleClass('opened');
                    }
                    this.lastSectionTarget = {
                        renderView: renderView,
                        event : e
                    }

                },


                /*changeEvents: _.reduce(EditorView.prototype.changeEvents, function (events, handler, event) {


                 event = _.reduce(event.split(','), function (result, part) {
                 if (result) {
                 result += ',';
                 }
                 return result += part + '.suds-outer-edit-control';
                 }, '');
                 events [event] = handler;
                 return events;
                 }, {}),*/
                // changeEvents: { }, // if there is no need for binding outside the inner views

                summaryView: function (event) {
                    event.preventDefault();

                    var recordObj = this.model.get('record');

                    var options = {
                        model: new Backbone.Model(recordObj)
                    };

                    Nrm.event.trigger("app:modal", {
                        view: new SummaryView(options),
                        backdrop: "static",
                        animate: true,
                    });
                },


                /**
                 * Notifies the user when the save failed. Default implementation shows a non-modal message box if the error
                 * response indicates a validation error, or modal box for all other errors.
                 * @todo We should probably show the same type of message box for all errors, or at least interpret other
                 * 400-series errors as validation errors.
                 * @param {external:module:backbone.Model} model The model that failed to save.
                 * @param {external:module:jquery~jqXHR} xhr The XHR object.
                 * @param {Object} options The options that were passed to the Backbone sync.
                 * @returns {undefined}
                 */
                saveFailed: function(model, xhr, options) {

                    var sudsContainer = $(this.$el);
                    var authorization = this.model.get('authorization') && this.model.get('authorization').toJSON();
                    authorization.currentSectionId = null;
                    authorization.currentSectionStatus = null;
                    this.model.set('authorization',this.model.AuthorizationModel(authorization));

                    $.when(sudsContainer.animate({
                        opacity: 1,
                        left: 0
                    }, 800, 'easeOutCirc')).done(_.bind(function () {

                        return EditorView.prototype.saveFailed.apply(this,arguments);
                    },this))


                },
                /**
                 * Notifies the user when the save is successful.  Default implementation shows a modal box with a generic
                 * message.
                 * @todo Change this from a modal to the PNotify non-modal message box.
                 * @param {external:module:backbone.Model} model The model that was saved.
                 * @param {external:module:jquery~jqXHR} response The XHR object.
                 * @param {Object} options The options that were passed to the Backbone sync.
                 * @returns {undefined}
                 */
                saveCompleted: function (model, response, options) {

                    var authorization = response.authorization;

                    if (!this.currentStepId) {
                        this.currentStepId = authorization.caseFileId;
                    }
                    console.log("Save Completed")
                },

                onGISViewSave:function () {

                    var authorization = this.model.get('authorization'),
                        nextStepId = authorization && authorization.get('nextStepId');

                    this.currentStepId = nextStepId;

                    $.when(this.animateScreens(true)).done(_.bind(function(){
                            this.stepChanged(nextStepId);
                    },this));
                },

                onCancel: function (event) {

                    if (event){
                        event.preventDefault();
                    }

                    EditorView.prototype.useGlobalErrorNotification  = false;
                    this.removeErrors();
                    var authorization = this.model.get('authorization');
                    this.currentStepId = authorization && authorization.caseFileId;

                    if (this.clonedAuthorizationObj){
                        this.model.set('authorization',this.clonedAuthorizationObj);
                    }

                    this.animateScreens(false)

                },


                animateScreens : function(isSave){

                    var $sudsContainer = $(this.$el);
                    var dfd = new $.Deferred();

                    if ($sudsContainer.hasClass('subflow')){

                        $.when($sudsContainer.animate({
                            opacity: 0,
                            left: '800px'
                        }, 800, 'easeOutCirc')).done(_.bind(function () {

                            $sudsContainer.css({left : "-600px"});
                            if (!isSave){
                                this.destroyCurrentViewControlsAndRenderAndFocus();
                            }
                            dfd.resolve();

                        },this));

                    }else{
                        $.when(this.leavePage()).done(_.bind(function () {
                            $sudsContainer.css({left : "800px"});

                            if (!isSave){
                                this.destroyCurrentViewControlsAndRenderAndFocus();
                            }
                            dfd.resolve();
                        },this));
                    }

                    return dfd.promise();                },

                destroyCurrentViewControlsAndRenderAndFocus : function () {
                    var self = this;
                    self.stopListening();
                    self.destroyControls();
                    self.renderAndFocus();
                },

                onReset: function (event) {

                    EditorView.prototype.useGlobalErrorNotification  = false;
                    this.removeErrors();

                    if (this.clonedAuthorizationObj){
                        this.model.set('authorization',this.clonedAuthorizationObj);
                    }

                    this.stopListening()
                    this.destroyControls();
                    this.renderAndFocus();


                },

                applyContext: function(options) {

                    var stepId = options.params &&  options.params[0],
                        ret = EditorView.prototype.applyContext.apply(this,arguments);

                    if (ret && stepId  !== this.currentStepId) {
                        this.currentStepId = stepId;
                        this.stepChanged(stepId);
                    }

                    return ret;
                },

                getUICaseFileId : function (stepId) {
                    var uiCaseFileId = ""

                    switch (stepId){
                        case "PRELIMINARY":
                            uiCaseFileId = "PreliminaryCaseFile";
                            break;
                        case "Proposal".to:
                            uiCaseFileId = "ProposalCaseFile";
                            break;
                        case "Administration":
                            uiCaseFileId = "PreliminaryCaseFile";
                            break;
                        case "Authorization":
                            uiCaseFileId = "PreliminaryCaseFile";
                            break;
                        case "Closure":
                            uiCaseFileId = "PreliminaryCaseFile";
                            break;
                        default:
                            uiCaseFileId = stepId;
                            break;
                    }

                    return uiCaseFileId;
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

                            setTimeout(function () {
                                $('.suds-container',this.$el).animate({
                                    opacity: 1,
                                    left: 0
                                }, self.pageTransitionTime, 'easeOutCirc')
                            }, 300);

                            this.rendered = true;
                            this.stepChanged();


                            /*$('.suds-save-btn').attr('disabled',true);*/
                            this.setControlEnabled($('.suds-save-btn', this.$el), false);

                            var options = {
                                status: 'close',
                                paneName: 'west'
                            }
                            Nrm.event.trigger('suds:toggle-navigation', options);

                            this.clonedAuthorizationObj = this.model.get('authorization').clone();





                        }
                    });

                },

            });


    });
