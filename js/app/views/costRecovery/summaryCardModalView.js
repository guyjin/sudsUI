define(['../panelView', "jquery", "nrm-ui", 'underscore','backbone','app/models/costRecovery/updateNepaAnalysis'],
    function (PanelView, $, Nrm, _, Backbone,UpdateNepaAnalysisModel) {

        return PanelView.extend({

            genericTemplate: 'costRecovery/AOApprovalsummaryCard',

            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments) || {};

                var model = this.model.toJSON();
                var self=  this;

                config.crWorksheetDTO = model.crWorksheetDto;

                self.model.set('crpAdjAmount',config.crWorksheetDTO.crpAdjAmount);
                self.model.set('reasonForChange',config.crWorksheetDTO.reasonForChange);

                var nepaCategory =  model.displayOrderToUiAttribute[2];

                _.each(nepaCategory.multipleSelectValues,function (obj) {
                    if (obj.value.toLowerCase().trim() == config.crWorksheetDTO.crpNepaType.toLowerCase().trim()){
                        self.model.set('crpNepaTypeCn',obj.id)
                    }
                })

                nepaCategory = _.map(nepaCategory.multipleSelectValues, function(item) {

                    return {
                        value: item.id,
                        text: item.value
                    }
                })

                var adjustmentType = model.displayOrderToUiAttribute[1];

                _.each(adjustmentType.multipleSelectValues,function (obj) {
                    if (obj.value.toLowerCase().trim() == config.crWorksheetDTO.crpAdjustmentType.toLowerCase().trim()){
                        self.model.set('crpAdjustmentTypeCn',obj.id);
                    }
                })

                adjustmentType = _.map(adjustmentType.multipleSelectValues, function(item) {

                    return {
                        value: item.id,
                        text: item.value
                    }
                })

                config.controls=[{
                    "type" : "select",
                    "id" : "adjustmentType",
                    "prop" : "crpAdjustmentTypeCn",
                    "nameAttr": "adjustmentType",
                    "title" : "Select Adjustment Type" ,
                    "label" : "Adjustment Type",
                    "options" : adjustmentType,
                    "placeholder": "Select Adjustment Type",
                    /*"group" : true*/
                },{
                    "type": "inputNum",
                    "inputType": "number",
                    "prop" : "crpAdjAmount",
                    "id": "adjustmentAmount",
                    nameAttr : 'adjustmentAmount',
                    "title": "Adjustment Amount",
                    label : 'Adjustment Amount',
                    placeholder : "0.0",
                    step:"any",
                    className :'adjustments'

                },{
                    "type" : "select",
                    "id" : "nepaCategory",
                    "prop" : "crpNepaTypeCn",
                    "nameAttr": "nepaCategory",
                    "title" : "Select NEPA Category" ,
                    "label" : "NEPA Category",
                    className : 'nepaTypesDropDown',
                    "options" : nepaCategory,
                    "placeholder": "Select NEPA Category",
                    "required": true
                },{
                    "type" : "textArea",
                    "id" : "reasonForChange",
                    "prop" : "reasonForChange",
                    "nameAttr": "reasonForChange",
                    "title" : "Reason For change" ,
                    "label" : "Reason for Change",
                    required: true,
                    cols:"80",
                    rows:"10"
                }]

                return config;
            },


            events: $.extend({},
                PanelView.prototype.events,
                PanelView.prototype.changeEvents, {
                    'click .saveAndContinue':function (e) {
                        e.preventDefault();

                        /*var model = this.model.toJSON();
                        var self=  this,
                            crWorksheetDTO = model.crWorksheetDto;

                        var nepaCategory =  model.displayOrderToUiAttribute[2];

                        _.each(nepaCategory.multipleSelectValues,function (obj) {

                            if (obj.id ==  model.crpNepaTypeCn){
                                crWorksheetDTO.crpNepaType = obj.value;
                                crWorksheetDTO.crpNepaTypeCn = obj.id;
                            }
                        })


                        var adjustmentType = model.displayOrderToUiAttribute[1];

                        _.each(adjustmentType.multipleSelectValues,function (obj) {

                            if (obj.id ==  model.crpAdjustmentTypeCn){
                                crWorksheetDTO.crpAdjustmentType = obj.value;
                                crWorksheetDTO.crpAdjustmentTypeCn = obj.id;
                            }
                        })

                        crWorksheetDTO.crpAdjAmount  = model.crpAdjAmount;
                        crWorksheetDTO.reasonForChange = model.reasonForChange;


                        var  updateNepaAnalysisModel = new UpdateNepaAnalysisModel();


                        updateNepaAnalysisModel.save(crWorksheetDTO,{
                            type : 'PUT',
                            success : /!*_.bind(,this)*!/ function(model, resp, options) {
                                self.model.set("crWorksheetDto",resp);
                                $("#summaryCardModal",this.$el).modal('hide');
                            },
                            error : function(model, resp, options) {}
                        });*/

                    },
                    'click .resetBtn':function (e) {
                        e.preventDefault();
                        $(':input',this.$el).val('');
                        /*$('option').attr('selected', false);*/

                        $('option').val('').trigger('change')
                    }
                }),



            /*modelEvents: $.extend({}, EditorView.prototype.modelEvents, {
             'change:width': 'calculateMiles'
             'change:width': 'calculateMiles'
             }),*/
            validate : function () {

                var dfd = new $.Deferred();
                var model = this.model.toJSON();
                var self=  this,
                    crWorksheetDTO = model.crWorksheetDto;

                var nepaCategory =  model.displayOrderToUiAttribute[2];

                _.each(nepaCategory.multipleSelectValues,function (obj) {

                    if (obj.id ==  model.crpNepaTypeCn){
                        crWorksheetDTO.crpNepaType = obj.value;
                        crWorksheetDTO.crpNepaTypeCn = obj.id;
                    }
                })


                var adjustmentType = model.displayOrderToUiAttribute[1];

                _.each(adjustmentType.multipleSelectValues,function (obj) {

                    if (obj.id ==  model.crpAdjustmentTypeCn){
                        crWorksheetDTO.crpAdjustmentType = obj.value;
                        crWorksheetDTO.crpAdjustmentTypeCn = obj.id;
                    }
                })

                crWorksheetDTO.crpAdjAmount  = model.crpAdjAmount;
                crWorksheetDTO.reasonForChange = model.reasonForChange;


                var  updateNepaAnalysisModel = new UpdateNepaAnalysisModel();


                updateNepaAnalysisModel.save(crWorksheetDTO,{
                    type : 'PUT',
                    success : /*_.bind(,this)*/ function(model, resp, options) {
                        self.model.set("crWorksheetDto",resp);
                        dfd.resolve(model, resp, options)
                        $("#summaryCardModal",this.$el).modal('hide');
                    },
                    error : function(model, resp, options) {
                        dfd.reject(model, resp, options)
                        var error = Nrm.app.normalizeErrorInfo('Failed to Save',
                            model, resp || model, options);
                        Nrm.event.trigger('showErrors', error, { allowRecall: false });
                    }
                });

                return dfd.promise();
            },

            setDirty : function(){

                return false;
            },
            render : function () {

                var templateData = _.extend({}, this.config);
                this.listenTo(this, {
                    'renderComplete': function() {

                        this.rendered = true;
                        this.setElement(this.$el.closest('.modal-content'));
                        this.$el.html(this.template(templateData));
                        $('.modal-dialog').removeClass();
                        PanelView.prototype.render.apply(this, arguments);

                    }
                });

            },



        });
    });