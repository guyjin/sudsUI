/**
 * @file
 * @see module:app/models/process
 */
/**
 * @module app/models/common/recordModel
 */
define(['../..',
        /*'nrm-ui/models/businessObject',*/
        "nrm-ui/models/nestedModel",
        '../questionModel',
        '../authorizationModel',
        '../contactModel',
        '../contactsSearchModel',
        '../basicProposalModel',
        '../costRecovery/costRecoveryProcessingModel',
        '../summaryModel',
        'nrm-ui',
        'backbone',
        'underscore',
        'nrm-ui/collections/ruleCollection',
        '../editSubFlowModel'],

    function(Suds, NestedModel, QuestionModel,
             AuthorizationModel, ContactModel, ContactSearchModel,
             BasicProposalModel, CostRecoveryModel,
             SummaryModel,Nrm, Backbone, _, RuleCollection,EditSubflow) {

        return Suds.Models.RecordModel = NestedModel.extend(/** @lends module:app/models/process.prototype */{

                constructor: function RecordModel() { return NestedModel.apply(this, arguments); }, // helps with debugging/profiling

                /**
                 * The urlRoot is required for each non-generic model. By convention, should match the root context key.
                 * @type {string}
                 * @see {@link http://backbonejs.org/#Model-urlRoot|Backbone.Model#urlRoot}
                 */

                urlRoot: "api/recordservice",
                idAttribute: 'authorizationCn',

               /* initialize: function() {
                    var mc = this.constructor;

                    function listenToCurrentStep() {

                        var currentStep = this.previous('currentStep');
                        if (currentStep) {
                            this.stopListening(currentStep);
                        }
                        currentStep = this.get('currentStep');
                        if (currentStep) {
                            currentStep.isChanged = false;
                            this.listenTo(currentStep, 'change', function(model) {
                                model.isChanged = true;
                                this.trigger('change');
                            });
                        }
                    }

                    listenToCurrentStep.call(this);
                    this.listenTo(this, 'change:currentStep', listenToCurrentStep);

                    if (!mc.rules) {
                        var rules = mc.rules = new RuleCollection();

                        BusinessObject.addBusinessRules("Rules.txt", "RecordModel", rules, function() {


                            console.log("Record Model rules are added");

                        }, function() {

                            console.log("Failed to load rules for RecordModel entity.");
                        });
                    }
                },*/
                initialize: function() {
                    var children = this.initializeChildren(this.attributes);
                    this.set(children);
                    this.registerChildEvents();
                },


                "sync": function(method, model, options){

                    if(method == 'create'){
                        options.url = this.urlRoot + '/createAuth';
                    }else if(method == 'update'){

                        options.url = this.urlRoot + '/updateAuth/'+ this.id;
                    }

                    return Backbone.sync.apply(this, arguments);
                },



                getCurrentStepName : function() {


                    var currentStepObj = this.get('currentStep'),
                         stepName;

                    if (!currentStepObj || _.isEmpty(currentStepObj)){
                        stepName = "NewPermitCheck";
                    }else{
                        stepName = currentStepObj.get("stepId");

                    }

                    return stepName;

                },

                isSubWorkFlow:  function () {

                    var currentStepObj = this.get('currentStep'),
                        flowName = currentStepObj.get("stepId") && currentStepObj.get("flowId");

                    if (flowName === "subflow"){
                        return true;
                    }

                    return false;

                },

                summary : function(id) {

                    return new SummaryModel({id : id});

                },

                EditSubflow : function () {

                            return new EditSubflow;
                    },

                /*convertCurrentStepToModel : function(response) {


                    if (response && response.currentStep){

                        var stepName  = response.currentStep.stepId

                        if (stepName === "EnterBasicProposalData"){
                            response.currentStep = new BasicProposalModel(response.currentStep);
                        }else if (stepName === "SelectContacts"){
                            response.currentStep = new ContactModel(response.currentStep);
                        }else if (stepName === "CostRecoveryProcessing"){
                            response.currentStep = new CostRecoveryModel(response.currentStep);
                        }else{
                            // generic fallback implementation
                            response.currentStep = new StepModel(response.currentStep);
                        }

                    }


                    return response;

                },*/
                SearchContacts : function() {

                    return new ContactSearchModel;

                },

                getNextStep : function() {

                     return new StepModel;
                },

                AuthorizationModel : function (response) {

                    return new AuthorizationModel(response);
                },


                parse: function() {
                    var response = NestedModel.prototype.parse.apply(this, arguments);
                   /* response.id = (response.record ? response.record.recordCn : response.authorizationCn);*/
                   /* this.convertCurrentStepToModel(response);*/
                   /* console.log("response in parent model", response)*/

                    return response;
                },

               /* toJSON: function() {

                    var proponentTypesTbl = this.get("proponentTypesTbl");

                    debugger
                    if (proponentTypesTbl && _.isObject(proponentTypesTbl)){
                        this.set("proponentTypesTbl",proponentTypesTbl.proponentTypeCn)
                    }


                    return NestedModel.prototype.toJSON.apply(this, arguments);;
                },*/

                /**
                 * The default attributes to set on new models.
                 * @returns {Object}
                 * Default attributes hash
                 * @see {@link http://backbonejs.org/#Model-defaults|Backbone.Model#defaults}
                 */
                defaults : function() {

                    return {
                        authorization: {}
                    }
                },

                startListening: function () {

                    this.listenTo(this, {
                        'renderComplete': function () {

                        }
                    });

                }
            },
            {
                childProperties: {
                    authorization: {
                        model: AuthorizationModel,
                        triggerChange : true
                    },

                }
            });
    });