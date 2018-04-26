define(['../panelView', "jquery", "nrm-ui", 'underscore','backbone','app/models/costRecovery/addSpecialistEstimate','nrm-ui/views/validationAwareView'],
    function (PanelView, $, Nrm, _, Backbone,AddSpecialistEstimateModel,ValidationAwareView) {

        return ValidationAwareView.extend({

            initialize :PanelView.prototype.initialize,

            loadNestedModel :PanelView.prototype.loadNestedModel,

            genericTemplate: 'costRecovery/cr_worksheet_modal',

            useGlobalErrorNotification : false,

            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments) || {};

                var model = this.model.toJSON(),self=this;

                this.saveClicked = false;
                var worksheetCard  = this.options && this.options.worksheetCard;

                if (worksheetCard &&  worksheetCard.role){

                    var crActivityTypes = this.model.get('crActivityTypes');


                    if (crActivityTypes){
                        crActivityTypes.each(function(crActivityTypeModel) {

                            if ( crActivityTypeModel.get("name") == worksheetCard.role){
                                worksheetCard.crActivityTypeCn = crActivityTypeModel.get('crActivityTypeCn')
                            }
                        });
                    }

                    this.model.set(worksheetCard);

                }else{
                    worksheetCard  = {
                        crActivityTypeCn : null,
                        role: null,
                        rate:null,
                        name: null,
                        scope:null,
                        processingTimeEst : null,
                        monitoringTimeEst : null,

                    }
                    this.model.set(worksheetCard, { unset: true, silent:true })
                }
                config.controls=[{
                    id:"row1",
                    type: "costRecovery/worksheetFormRow",
                    controls : [this.form1Controls(model),this.form2Controls(),this.form3Controls()]
                },{
                    id:"row2",
                    type: "costRecovery/worksheetFormRow",
                    controls : [this.row2Controls()]
                },{
                    id:"row3",
                    type: "costRecovery/worksheetFormRow",
                    controls : [this.row3Controls()]
                }]


                return config;
            },


            form1Controls : function (model) {


                var data = [
                    { value: "Biologist", text: "Biologist" },
                    { id: "Geologist", text: "Geologist"},
                    { id: "Zoologist", text: "Zoologist" }
                ];

                var form1Controls  = {
                    id: "form1",
                    formClass : 'form1',
                    type : 'costRecovery/worksheetForm'
                }

                form1Controls.controls = [
                    {
                        "type" : "select",
                        "id" : "selectSpecialistRole",
                        "prop" : "crActivityTypeCn",
                        "nameAttr": "adjustmentType",
                        "title" : "Select Specialist Role" ,
                        "label" : "Specialist Role",
                        /*"options" : data,*/
                        lov :'lov/crActivityTypes',
                        "placeholder": "Select Specialist Role",
                        "required": true
                    },{
                        "type": "inputText",
                        "prop" : "name",
                        "id": "specialistName",
                        nameAttr : 'specialistName',
                        "title": "Specialist Name",
                        label : 'Specialist Name'
                    }]

                return form1Controls;
            },

            form2Controls : function () {

                var form2Controls  = {
                    id: "form2",
                    formClass : 'form2',
                    type : 'costRecovery/worksheetForm'
                }


                form2Controls.controls = [
                    {
                        "type": "inputNum",
                        "inputType": "number",
                        "prop" : "processingTimeEst",
                        "id": "processingTimeEst",
                        nameAttr : 'processingTimeEst',
                        "title": "Processing Time Estimate (hours)",
                        label : 'Processing Time Estimate (hours)',
                        placeholder : "0.0",
                        step:"any",
                        className :'adjustments',
                        required : true

                    },{
                        "type": "inputNum",
                        "inputType": "number",
                        "prop" : "monitoringTimeEst",
                        "id": "monitoringTimeEst",
                        nameAttr : 'adjustmentAmount',
                        "title": "Monitoring Time Estimate (hours)",
                        label : 'Monitoring Time Estimate (hours)',
                        placeholder : "0.0",
                        step:"any",
                        className :'adjustments'

                    }]

                return form2Controls;
            },

            form3Controls : function () {

                var form3Controls  = {
                    id: "form3",
                    formClass : 'form3',
                    type : 'costRecovery/worksheetForm'
                }


                form3Controls.controls = [
                    {
                        "type": "inputNum",
                        "inputType": "number",
                        "prop" : "rate",
                        "id": "rate",
                        nameAttr : 'rate',
                        "title": "Rate",
                        label : 'Rate',
                        placeholder : "0.0",
                        step:"any",
                        className :'adjustments',
                        disabled: true,

                    }]

                return form3Controls;
            },

            row2Controls : function () {

                var row2Controls  = {
                    id: "row2Form",
                    type : 'costRecovery/worksheetForm'
                }


                row2Controls.controls = [{
                    type : 'textArea',
                    "id" : "workScope",
                    "prop" : "scope",
                    "label" : "Description of Work Scope",
                    "title" : "Description of Work Scope" ,
                    "rows" : 10,
                     cols:80,
                    "maxlength": 4000,
                    required : true
                }]

                return row2Controls;
            },

            row3Controls : function () {

                var row3Controls  = {
                    id: "controls",
                    type:'costRecovery/worksheetFormCtrls',
                }


                row3Controls.controls = [
                    {
                        id: 'reset',
                        type: 'btn',
                        prop: 'resetBtn',
                        btnStyle: "default",
                        className: "resetBtn",
                        label: 'Reset',
                    },{
                        id: 'saveAndContinue',
                        type: 'btn',
                        prop: 'saveAndContinueBtn',
                        btnStyle: "primary",
                        className: "saveAndContinue",
                        label: 'Save & Continue' ,
                    }]

                return row3Controls;
            },

            events: $.extend({},
                PanelView.prototype.events,
                PanelView.prototype.changeEvents, {
                    'click .saveAndContinue': "saveAndContinue",
                    'click .resetBtn':function (e) {
                        e.preventDefault();
                        $(':input',this.$el).val('');
                        $('option').attr('selected', false);
                    }
                }),



            /*modelEvents: $.extend({}, EditorView.prototype.modelEvents, {
             'change:width': 'calculateMiles'
             'change:width': 'calculateMiles'
             }),*/
            validate : function () {


                return $.when(this.model.validate()).done(_.bind(function (errors) {

                    if (this.saveClicked){
                       this.showErrors(true);
                   }

                },this));


            },

            saveAndContinue : function (e) {
                e.preventDefault();

                this.saveClicked = true;
                $.when(this.validate()).done(_.bind(function (errors) {

                    if (errors){
                        return;
                    }


                    var  self = this,
                        formData = this.model.toJSON();



                    if (this.options.updateService){

                        this.model.save(formData,{
                            type:'PUT',
                            success : function(model, resp, options) {
                                self.model.set(resp);
                                $("#addToWorksheetModal",this.$el).modal('hide');

                            },
                            error : function(model, resp, options) {
                                self.saveClicked = false;
                            }
                        });
                    }else{
                        this.model.save(formData,{
                            success : function(model, resp, options) {
                                self.model.set(resp);
                                $("#addToWorksheetModal",this.$el).modal('hide');

                            },
                            error : function(model, resp, options) {
                                self.saveClicked = false;
                            }
                        });
                    }
                },this))




            },
            setDirty : function(){

                return false;
            },
            render : function () {

                this.listenTo(this, {

                    'renderComplete' : function() {

                        this.rendered = true;
                        this.setElement(this.$el.closest('.modal-body'));
                        //this.$el.html(this.template(templateData));
                        $('.modal-footer').remove();
                        PanelView.prototype.render.apply(this, arguments);

                    }
                });

                this.listenTo(this.model, 'change', _.bind(function(select){
                    this.validate();
                },this));

            },



        });
    });