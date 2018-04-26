define(['../panelView', "jquery", "nrm-ui", 'underscore','nrm-ui/views/reportLauncherView',
    "app/models/reportInfoModel",'app/models/costRecovery/costRecoveryProcessingModel',
        'app/models/costRecovery/getCrEstimate'],
    function (PanelView, $, Nrm, _, ReportLauncherView, ReportInfoModel,CostRecoveryProcessingModel,CrEstimateModel) {

    return PanelView.extend({

        genericTemplate: 'common/ctrlsIterator',

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments),
                authorization = this.model.toJSON(),
                dfd = new $.Deferred(),
                crEstimateModel = new CrEstimateModel({id:authorization.authorizationCn/*'5A241E07F92CA234E0540208205BCEF0'*/});


            this.model.set("crpSummarySave", "Y");
            this.model.set("currentSectionId", "CRprocessing");
            this.model.set("currentSectionStatus", "Complete");
            this.model.set("screenId", "crpSummary", {silent : true});

            crEstimateModel.fetch({
                success: _.bind(function (model, resp, options) {

                    var authorization = this.parentModel.get('authorization');
                    authorization = $.extend({}, authorization.toJSON(), resp);
                    authorization = this.parentModel.AuthorizationModel(authorization);

                    this.parentModel.set("authorization", authorization);
                    this.model = authorization.clone();

                    var tabNames = ['Cost Recovery Processing']

                    config.costRecovery = authorization.toJSON();
                    config.controls = [
                        {
                            type: 'common/soloTabSummaryHeader',
                            screenName: {
                                tabNames: tabNames
                            }
                        }, {
                            type: 'common/screenContentControls',
                            controls: this.getTabHeadingAndSectionsControls(config),
                        }]
                    dfd.resolve(config);
                },this),
                error: function (model, resp, options) {

                    dfd.reject(model, resp, options);
                }
            })


            return dfd.promise();
        },


        getTabHeadingAndSectionsControls: function (config) {

            var controls = [];

            controls[0] = this.getRecoveryProcessingTabControls(config);

            return controls;
        },



        getRecoveryProcessingTabControls: function (config) {


            var entriesControls = {
                id: 'recoveryProcessingTab',
                tabHeading: 'Recovery Processing',
                type: 'common/tabHeadingAndSection',
                sectionWrap: false,
                items: [
                    {
                        id: 'worksheetEntriesContainer',
                        fullSection: true,
                        type: 'costRecovery/cr_summary-badgecards',
                        sectionActionLink : true,
                        sectionActionLinkClasses : 'sectionActionLink singleton costRecoveryPDF ',
                        sectionActionLinkText : 'Download Agreement (PDF)',
                        items: [

                            {
                            id: 'nepaCategoryContainer',
                            type: 'costRecovery/cr_summary-nepa-categorycontainer',
                            items: [
                                {
                                    "type" : "select",
                                    "id" : "nepaCategory",
                                    "prop" : "crpNepaTypeCn",
                                    "nameAttr": "nepaCategory",
                                    "title" : "Select NEPA Category" ,
                                    "label" : "NEPA Category",
                                    className : 'nepaTypesDropDown',
                                    "lov" : "lov/nepaCategories",
                                    "placeholder": "Select NEPA Category",
                                    "required": true,
                                    "group" : false
                                }]
                        }, {
                                id:"adjustmentFieldsContainer",
                                type: "costRecovery/cr_summary-adjustmentfields",
                                items :[{
                                    "type" : "select",
                                    "id" : "adjustmentType",
                                    "prop" : "crpAdjustmentTypeCn",
                                    "nameAttr": "adjustmentType",
                                    "title" : "Select Adjustment Type" ,
                                    "label" : "Adjustment Type",
                                    "lov" : "lov/crAdjustmentTypes",
                                    "placeholder": "Select Adjustment Type",
                                    "required": true,
                                    "group" : false
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
                                    max:config.costRecovery.processingTotalFee,
                                    className :'adjustments',
                                    "group" : false

                                }]

                            }]
                    }

                ]

            };


            return entriesControls;
        },


        events: {
                /*'change .formSet' : 'checkRange',*/
                'change .nepaTypesDropDown': function (event) {
                    this.model.set("crpNepaTypeCn",$(event.target).find(":selected").val())

                },
                'click .costRecoveryPDF' : "downloadPdf",
                'click .crWorksheetBtn' : 'openWorksheetView',
                /*'keyup .formSet' : 'checkRange',*/
                'change #adjustmentType' : function (event) {

                    var timeFee = $('#timeFeeText',this.$el),
                        selectedAdjustmentType = $(event.target).find(":selected").text();

                    if(selectedAdjustmentType && selectedAdjustmentType.indexOf("No Adjustment") != -1) {
                        $('#adjustmentAmount',this.$el).attr('disabled', true);
                        $('#adjustmentAmount',this.$el).val('');

                    }else if(selectedAdjustmentType && selectedAdjustmentType.indexOf("Full Waiver") != -1) {

                        $('#adjustmentAmount',this.$el).val(parseFloat('-' + this.config.costRecovery.processingTotalFee).toFixed(2)).attr('disabled', true);
                        $(timeFee).text('$0.00')

                    }else{
                        $('#adjustmentAmount',this.$el).val('').attr('disabled', false);
                        $(timeFee).text('$' + this.config.costRecovery.processingTotalFee)
                    }

                    this.model.set('crpAdjustmentTypeCn', $(event.target).find(":selected").val());
                    this.setNetFee($(timeFee).text().substr(1));


                },
                'change #adjustmentAmount' : 'updateFeeBasedOnAdjustmentAmt',
                'keyup #adjustmentAmount' : 'updateFeeBasedOnAdjustmentAmt'

                //... other custom events go here...
            },



        updateDisplayAttributes : function () {


            var model = this.model.toJSON();


            this.model.set(model);
        },



        updateFeeBasedOnAdjustmentAmt : function (event) {
            var self = this;

            var timeFee = $('#timeFeeText',this.$el),
                newFee,
                processingTotalFee = self.config.costRecovery && self.config.costRecovery.processingTotalFee;



            if($(event.target).val() != '') {
                var adjustmentAmt = $('#adjustmentAmount',self.$el);

                if (processingTotalFee){

                    if (adjustmentAmt && processingTotalFee &&  adjustmentAmt.val() > processingTotalFee){
                        adjustmentAmt.val(processingTotalFee);
                    }else if (adjustmentAmt && adjustmentAmt.val() < 0){
                        adjustmentAmt.val(0)
                    }

                    newFee = processingTotalFee - (adjustmentAmt.val()) ;
                    $(timeFee).text("$" + newFee);
                }

            }else if (processingTotalFee){
                $(timeFee).text("$" + processingTotalFee);

            }

            if (adjustmentAmt && adjustmentAmt.val){
                this.model.set('crpAdjAmount',adjustmentAmt.val());
            }

            this.setNetFee(timeFee && $(timeFee).text().substr(1));

        },

        setNetFee : function (netFee) {

            if (netFee){
                this.model.set('processingTotalFee',parseFloat(netFee).toFixed(2));
            }

        },

        render : function () {

            PanelView.prototype.render.apply(this, arguments);

            var newPath = document.createElementNS('http://www.w3.org/2000/svg', "path");
            newPath.setAttribute("id", "myPath");
            newPath.setAttribute("fill", "transparent");
            newPath.setAttribute("d", circlePath(50, 50, 37));

            document.getElementsByTagName('defs')[0].appendChild(newPath);

            function circlePath(cx, cy, r) {
                return 'M ' + cx + ' ' + cy + ' m -' + r + ', 0 a ' + r + ',' + r + ' 0 1,1 ' + (r * 2) + ',0 a ' + r + ',' + r + ' 0 1,1 -' + (r * 2) + ',0';
            }

            this.setAutoPopulatedValues();
            return this;
        },

        setAutoPopulatedValues : function () {

            var self = this;
            self.setControlEnabled($('.suds-save-btn'), true);
            var categoryText = $('#categoryText',this.$el),
                useCodeText = $('#useCodeText' ,this.$el),
                useCodeNameText = $('#useCodeNameText' ,this.$el),
                timeRange = $('#agencyHoursText',this.$el),
                timeFee = $('#timeFeeText',this.$el),
                costRecovery = self.config.costRecovery,
                processingTotalFee = costRecovery && costRecovery.processingTotalFee;


            if(costRecovery && costRecovery !== '') {
                var useCodeBlock = costRecovery.useCode && costRecovery.useCode.split("("),
                    useCodeName = useCodeBlock && useCodeBlock[0],
                    useCode = useCodeBlock && useCodeBlock[1] && useCodeBlock[1].split(")")[0];

                if (useCode){
                    useCodeText.text(useCode)
                }

                if (useCodeName){
                    useCodeNameText.text(useCodeName)
                }

                if (costRecovery.processingRangeOfHours){
                    timeRange.text(costRecovery.processingRangeOfHours);
                }

                if (costRecovery.processingCategoryNo){
                    categoryText.text(costRecovery.processingCategoryNo);
                }

                if (processingTotalFee){
                    timeFee.text("$" + processingTotalFee);
                }

                $('.adjustments').attr('disabled',false);

            } else {
                timeRange.text('Unknown');
                timeFee.text('$0.00');
            }

            if (processingTotalFee){
                this.setNetFee(processingTotalFee);
            }


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