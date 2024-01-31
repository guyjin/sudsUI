define(['../panelView', "jquery", "nrm-ui", 'underscore','nrm-ui/views/reportLauncherView',
    "app/models/reportInfoModel",'app/models/costRecovery/costRecoveryProcessingModel'],
    function (PanelView, $, Nrm, _, ReportLauncherView, ReportInfoModel,CostRecoveryProcessingModel) {

    return PanelView.extend({

        genericTemplate: 'costRecovery/cr_form',

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);

            config.currentStep = this.model.toJSON();

            if (this.parentModel){

             var record  = this.parentModel.get('record')

                if (record){
                    this.model.set("useCode",record.primaryUseCode)
                }else{
                    this.model.set("useCode","Tailhold (591)")
                }
            }

            this.model.set("estimatedHoursCategory",config.currentStep.processingCategoryNo)

            if (config.currentStep.processingTotalFee){
                this.model.set("netFee","$" + config.currentStep.processingTotalFee);


                /*this.config.processingTotalFee = config.currentStep.processingTotalFee;*/
            }



           config.controls = [{
               id:'autoPopulated',
               type : 'costRecovery/cr_autoPopulatedBlock',
                grid : 'col-md-5',
                controls : this.autopopulatedControls()
            },{
               //id:'userInputContainer',
                //type : 'costRecovery/cr_statusSection-container',
               type : 'panelContent',
                grid : 'col-md-7',
                controls : this.userInputControls(config)
            }]

            return config;
        },

        autopopulatedControls : function () {

            var controls = [{
                label : 'Use Code',
                id: 'useCode',
                className: 'statusDataPoint useCode',
                type : 'costRecovery/cr_statusSection',
                value : 'Tailhold (591)',
                prop :'useCode',
            },{
                label : 'Category',
                id: 'estimatedHoursCategory',
                badge : true,
                'prop': 'estimatedHoursCategory',
                className: 'categoryBadge',
                type : 'costRecovery/cr_statusSection',
                value : '?'
            },{
                /*'prop': 'agencyTime',*/
                id: 'agencyTime',
                label : 'Agency Time (hours)',
                className: 'statusDataPoint timeRange',
                type : 'costRecovery/cr_statusSection',
                value : 'Unknown'
            },{
                id : 'netFee',
                prop : 'netFee',
                containerClass : 'fee',
                label : 'Fee',
                className: 'statusDataPoint timeFee',
                type : 'costRecovery/cr_statusSection',
                value : '$0.00'
            }]

            return controls;
        },


        userInputControls : function (config) {


           var nepaCategory =  config.currentStep.displayOrderToUiAttribute[1];

            nepaCategory = _.map(nepaCategory.multipleSelectValues, function(item) {

                return {
                    value: item.id,
                    text: item.value
                }
            })

            var adjustmentType = config.currentStep.displayOrderToUiAttribute[3];

            adjustmentType = _.map(adjustmentType.multipleSelectValues, function(item) {

                return {
                    value: item.id,
                    text: item.value
                }
            })

            this.model.set('uiAttributeOrder3',adjustmentType[1].value)

            var controls = [ {
                "type" : "select",
                "id" : "nepaCategory",
                "prop" : "uiAttributeOrder1",
                "nameAttr": "nepaCategory",
                "title" : "Select NEPA Category" ,
                "label" : "NEPA Category",
                className : 'nepaTypesDropDown',
                "options" : nepaCategory,
                "placeholder": "Select NEPA Category",
                "required": true
            },{
                "type" : "select",
                "id" : "adjustmentType",
                "prop" : "uiAttributeOrder3",
                "nameAttr": "adjustmentType",
                "title" : "Select Adjustment Type" ,
                "label" : "Adjustment Type",
                "options" : adjustmentType,
                "placeholder": "Select Adjustment Type",
                "required": true,
                /*"group" : true*/
            },{
                "type": "inputNum",
                "inputType": "number",
                "prop" : "uiAttributeOrder4",
                "id": "adjustmentAmount",
                nameAttr : 'adjustmentAmount',
                "title": "Adjustment Amount",
                label : 'Adjustment Amount',
                placeholder : "0.0",
                step:"any",
                className :'adjustments'

            }]

            return controls;
        },
        events: {
                /*'change .formSet' : 'checkRange',*/
                'change .nepaTypesDropDown': function (event) {
                   /* this.model.set("uiAttributeOrder1",$(event.target).val())*/
                   this.updateDisplayAttributes();
                },
                'click .costRecoveryPDF' : "downloadPdf",
                'click .crWorksheetBtn' : 'openWorksheetView',
                /*'keyup .formSet' : 'checkRange',*/
                'change #adjustmentType' : function (event) {

                    /*this.model.set("uiAttributeOrder3",$(event.target).val());*/
                    var timeFee = $('.timeFee',this.$el),
                        selectedAdjustmentType = _.find(this.config.currentStep.displayOrderToUiAttribute[3].multipleSelectValues, function(uiAttribute) {
                        return uiAttribute.id === $(event.target).val();
                    });
                    if(selectedAdjustmentType && selectedAdjustmentType.value.indexOf("No Adjustment") != -1) {
                        $('#adjustmentAmount',this.$el).attr('disabled', true);
                        $('#adjustmentAmount',this.$el).val('');

                    }else if(selectedAdjustmentType && selectedAdjustmentType.value.indexOf("Full Waiver") != -1) {
                        var newFee = $(timeFee).text().substr(1);
                        $('#adjustmentAmount',this.$el).val(parseFloat('-' + this.config.currentStep.processingTotalFee).toFixed(2)).attr('disabled', true);
                        $(timeFee).text('$0.00')

                    }else{
                        $('#adjustmentAmount',this.$el).val('').attr('disabled', false);
                        $(timeFee).text('$' + this.config.currentStep.processingTotalFee)
                    }
                    this.updateDisplayAttributes();
                    this.setNetFee($(timeFee).text().substr(1));
                },
                'change #adjustmentAmount' : 'updateFeeBasedOnAdjustmentAmt',
                'keyup #adjustmentAmount' : 'updateFeeBasedOnAdjustmentAmt'

                //... other custom events go here...
            },


        updateDisplayAttributes : function () {


            var model = this.model.toJSON();

            _.each(model, function(item, key) {

                if (key.indexOf("uiAttributeOrder") != -1){
                    var displayOrder = key.substr(16),
                        uiAttribute =  model.displayOrderToUiAttribute[displayOrder];
                    if (uiAttribute){
                        if(displayOrder == "4"){
                            uiAttribute.userInput = Math.abs(item);
                        }else{
                            uiAttribute.userInput = item;
                        }
                    }
                }
            });

            this.model.set(model);
        },
        openWorksheetView : function () {

            this.destroy();

            var stepView = {
                view: 'app/views/costRecovery/worksheetView',
                className :'costRecoveryWorksheet',
                isStepControlRequired : false,
                config: $.extend({}, this.options.config, {
                    template: 'costRecovery/cr_worksheet'
                })
            };
                
            this.trigger('changeStep', this, stepView);

        },

        destroy: function(){
            this.remove();
            this.unbind();
        },
        updateFeeBasedOnAdjustmentAmt : function (event) {
            var self = this;

            this.updateDisplayAttributes();
            /*this.model.set("uiAttributeOrder4",$('#adjustmentAmount',self.$el).val())*/

            var timeFee = $('.timeFee',this.$el);

            if($(event.target).val() != '') {
                var newFee = self.config.currentStep.processingTotalFee - ($('#adjustmentAmount',self.$el).val()) ;
                $(timeFee).text("$" + newFee);
            }else{
                $(timeFee).text("$" + self.config.currentStep.processingTotalFee);
            }

            this.setNetFee($(timeFee).text().substr(1));
            //this.checkRange();
        },

        setNetFee : function (netFee) {

            if (netFee){
                this.model.set('processingTotalFee',parseFloat(netFee).toFixed(2));
                /*this.config.currentStep.processingTotalFee = parseFloat(netFee).toFixed(2);*/
            }

        },
        render : function () {

            PanelView.prototype.render.apply(this, arguments);

            return this;
        },

        setAutoPopulatedValues : function () {

            var self = this;
            self.setControlEnabled($('.suds-save-btn'), true);
            var badge = $('.badge',this.$el),
                minutes = $('#minutes' ,this.$el),
                timeRange = $('.timeRange',this.$el),
                timeFee = $('.timeFee',this.$el),
                costRecovery = self.config.currentStep;


            if(costRecovery !== '') {
                badge.text(costRecovery.processingCategoryNo);
                timeRange.text(costRecovery.processingRangeOfHours + ' Hours');
                $('.adjustments').attr('disabled',false);
                if(!badge.hasClass('hasCategory')){
                    badge.addClass('hasCategory');
                }
            } else {
                badge.text('?');
                badge.removeClass('hasCategory');
                timeRange.text('Unknown');
                timeFee.text('$0.00');
            }

            this.setNetFee(this.config.currentStep.processingTotalFee);

        },

        /**
         * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
         * @returns {undefined}
         */

        startListening: function() {
            PanelView.prototype.startListening.apply(this,arguments);


            this.listenTo(this, {
                'renderComplete': function() {

                    $('#adjustmentAmount',this.$el).attr('disabled', true);
                    if (this.parentModel && this.parentModel.get('record')){
                        var record = this.parentModel.get('record');
                        $('.useCode', this.$el).text(record.primaryUseCode);
                    }


                    this.setAutoPopulatedValues();

                    this.rendered = true;
                }
            });

        },

        downloadPdf : function () {

            var self = this;
            var recordModel = self.model;
            var reportInfoModel = new ReportInfoModel({}, {instanceUrl: "api/reports/crpEstimate"});

            reportInfoModel.fetch({
                data: JSON.stringify(recordModel.toJSON()),
                type: "POST",
                contentType: "application/json",
                success: function (model, response, options) {

                    var fileDownloadApi = "api/files/" + model.get('fileName');
                    ReportLauncherView.showReportLauncherView({
                        url: fileDownloadApi,
                        documentTitle: model.get('fileName')
                    })
                },
                error: function (model, response, options) {

                    console.log("There was a problem uploading the file");
                }
            });


        },

        applyPlugin: function(parent, c, callback) {

            if (parent && c) {

                /*var el = $("#" + c.id, this.$el);*/

                if (c.type === "select" && c.id == "minutes"){
                    var $container = $("#" + c.id + '-container', this.$el) ;
                    $container.replaceWith($container.html()) ;
                }

                if (c.type === "inputNum" && c.id == "adjustmentAmount"){

                    var $container = $("#" + c.id , this.$el) ;
                    $container.attr('placeholder','0.0') ;
                }

                /*el.attr("data-nrmprop", c.prop);*/
            }

            return PanelView.prototype.applyPlugin.apply(this, arguments) ;
        }

    });
});