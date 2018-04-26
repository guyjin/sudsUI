define(['../panelView', "jquery", "nrm-ui", 'underscore','backbone','./worksheetModalView',
        'nrm-ui/views/reportLauncherView',
        "app/models/reportInfoModel",'hbs!costRecovery/crWorksheetEntriesChildRow','app/models/costRecovery/getCrEstimate'],
                            function (PanelView, $, Nrm, _, Backbone, WorksheetModalView,
                                      ReportLauncherView, ReportInfoModel,CRWorksheetEntriesChildRow,CrEstimateModel) {

    return PanelView.extend({

        genericTemplate: 'costRecovery/cr_worksheet',

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments),
                dfd = new $.Deferred(),
                record = this.parentModel.get('record'),
                crEstimateModel = new CrEstimateModel({id: (record.recordCn ? record.recordCn : "4EB7D6F443704AB5E054020820CFAC7F")});;

            config.controls=[this.getTableControl(this),{
                id:"processinEstimate",
                type: "costRecovery/cr_worksheetSummaries",
                summaryContainerClass:"processingSummary",
                summaryLabelText : "Processing",
                categoryHours : "processingRangeOfHours",
                categoryNumber : "processingCategoryNo",
                feeValue : "processingFee",
                indirectFeeValue : 'processingIndirectsCost',
                totalFee : "processingTotalFee",

            },{
                id:"monitoringEstimate",
                type: "costRecovery/cr_worksheetSummaries",
                summaryContainerClass:"monitoringSummary",
                summaryLabelText : "Monitoring",
                categoryHours : "monitoringRangeOfHours",
                categoryNumber : "monitoringCategoryNo",
                indirectFeeValue : 'monitoringIndirectCost',
                feeValue : "monitoringFee",
                totalFee : "monitoringTotalFee",

            }];



            crEstimateModel.fetch({
                success: _.bind(function (model, resp, options) {

                    var currentStep = this.parentModel.get('currentStep');
                    currentStep = $.extend(true, {}, currentStep.toJSON(), resp);
                    this.parentModel.set("currentStep", new  this.parentModel.AuthorizationModel(currentStep));
                    this.model.set(currentStep);
                    dfd.resolve(config);
                },this),
                error: function (model, resp, options) {

                    dfd.reject(model, resp, options);
                }
            });

            return dfd.promise();
        },

        events: {
            'click .toggleMore' : function (event) {
                $(event.currentTarget).parent().toggleClass('openScope')
            },
            'click .downloadPdf' : 'downloadPdf',
            'click .addNewButton' : 'addNewSpecialist',
            'click .crSummaryBtn' : 'openSummaryPage',
             'click .editEntry' : "editSpecialist",
             'click .removeEntry' : "removeSpecialist"
            },

        /*modelEvents: $.extend({}, EditorView.prototype.modelEvents, {
            'change:width': 'calculateMiles'
            'change:width': 'calculateMiles'
        }),*/

        destroy: function(){
            this.remove();
            this.unbind();
        },
        openSummaryPage : function () {
            this.destroy();

            var stepView = {
                    view: 'app/views/costRecovery/costRecoveryView',
                    className :'costRecovery',
                    isStepControlRequired : true,
                    config: $.extend({}, this.options.config, {
                        template: 'costRecovery/cr_form'
                    })
                };
                
            this.trigger('changeStep', this, stepView);
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
        addNewSpecialist : function () {

            var self = this;
            var options = {
                model: this.model
            };

            var editModalView = new WorksheetModalView(options);

            Nrm.event.trigger("app:modal", {
                modalId: 'addToWorksheetModal',
                view: editModalView,
                backdrop: "static",
                animate : true,
               /* events:  { 'click #saveAndContinue': 'close' },*/
                callback: _.bind(function(modal) {

                    if (editModalView.saveClicked){

                        var existingSpecialists = editModalView.model.get('existingSpecialistEstimateDtos');

                        this.setCRProcessingAndMonitoringValues(editModalView.model.toJSON())

                        var editEntriesTblSelector = $("#addedEntriesTable", self.$el);

                        if (existingSpecialists && existingSpecialists.length){
                            $('.costRecoveryWorksheet').removeClass('noEntries');

                            self.addNewItem(editEntriesTblSelector,existingSpecialists[existingSpecialists.length - 1]);
                            $('.crSummaryBtn',self.$el).show()
                        }else{
                            $('.costRecoveryWorksheet').addClass('noEntries');
                            $('.crSummaryBtn',this.$el).hide();
                        }
                    }

                },this)
            });
        },
        editSpecialist: function(e) {

            var model = this.getModelForTableRow($(e.target));

            var options = {
                model : this.model,
                worksheetCard : model.toJSON(),
                updateService : true,
            };
            var editModalView = new WorksheetModalView(options);

            Nrm.event.trigger("app:modal", {
                modalId: 'addToWorksheetModal',
                view: editModalView,
                backdrop: "static",
                animate : true,
               /* events:  { 'click #saveAndContinue': 'close' },*/
                callback: _.bind(function(modal) {

                    debugger
                    if (editModalView.saveClicked){

                        var index = model.collection.indexOf(model),
                            editModalViewModel = editModalView.model.toJSON(),
                            worksheetCard  = _.pick(editModalViewModel, 'role', 'rate','name','scope','processingTimeEst','monitoringTimeEst');

                        if(editModalViewModel && editModalViewModel.role){
                            model.collection.add(worksheetCard);
                            model.collection.remove(model)
                        }

                    }

                },this)
            });

        },

        /*Todo : Need rest service to delete in permanently*/
        removeSpecialist: function(e) {

            var model = this.getModelForTableRow($(e.target))
            model.collection.remove(model);

            this.toggleNoEntries();

        },

        toggleNoEntries : function () {

            var coll = this.getCollectionForTable($("#addedEntriesTable", this.$el));

            if (coll && coll.length){
                $('.costRecoveryWorksheet').removeClass('noEntries');
                $('.crSummaryBtn',this.$el).show()
            }else{
                $('.costRecoveryWorksheet').addClass('noEntries');
                $('.crSummaryBtn',this.$el).hide();
            }
        },
        getTableControl : function(self){


            var tableControl = {

                "type" : "tableEdit",
                "id" : "addedEntriesTable",
               /* className: "entriesTable",*/
                "prop" :'existingSpecialistEstimateDtos' ,
                "columns" : [
                    {
                        "prop": 'role',
                        "label" : "Specialist Title",
                        "className" : 'role',
                        "pluginOpts": {
                            "sWidth": "100px"
                        }
                    },
                    {
                        "prop": "name",
                        "label" : "Name",
                        "className" : 'name',
                        "pluginOpts": {
                            "sWidth": "100px"
                        }
                    },
                    {
                        "prop": "processingTimeEst",
                        "label" : "Processing Time Est.",
                        "className" : 'procTimeEst',
                        "pluginOpts": {
                            "sWidth": "100px"
                        }

                    },
                    {
                        "prop": "monitoringTimeEst",
                        "label" : "Monitoring Time Est.",
                        "className" : 'monTimeEst',
                        "pluginOpts": {
                            "sWidth": "100px"
                        }
                    },
                    {
                        "prop": "rate",
                        "label" : "Rate",
                        "className" : 'rate',
                        "pluginOpts": {
                            "sWidth": "60px"
                        }
                    },
                    {
                        "control": {
                            type: 'costRecovery/cr_worksheetEntriesTableCtrls',
                            "id": "rate",
                            controls :[{
                                "title": "Edit",
                                type:'btn',
                                btnStyle:"primary",
                                "className": "btn-sm nrm-route-action editEntry",
                                "icon": "fa fa-edit",
                                "label" :'Edit',
                                "id": "editEntry-row"
                            },{
                                "title": "Remove",
                                type:'btn',
                                btnStyle:"danger",
                                "className": "btn-sm nrm-route-action removeEntry",
                                "icon": "fa fa-times",
                                "label" :'Remove',
                                "id": "removeEntry-row"
                            }]
                        },
                        "pluginOpts": {
                            "sWidth": "500px"
                        }
                    },
                ],
                "pluginOpts" : {
                    "multiSelect" : false,
                    "readOnly": true,
                    "searching": true,
                    createdRow: _.bind(function(tr, data) {

                        if (data.scope){
                            var templateData = {
                                scopeSnippet : data.scope.substring(0,80),
                                scopeBody : data.scope.substring(81,data.scope.length)
                            }
                        }

                       var html = CRWorksheetEntriesChildRow(templateData || 'No scope defined.')
                        $('#addedEntriesTable', this.$el)
                            .DataTable().row(tr)
                                        .child(html).show();

                        }, self)



                },
            }

            return tableControl;
        },

        render : function () {

            PanelView.prototype.render.apply(this, arguments);

            return this;
        },

        addNewItem: function($table, attributes) {

            var coll = this.getCollectionForTable($table);
            if (!coll) return;
            var newModel = new coll.model(attributes);
            coll.add(newModel);
            this.setDirty(true);
        },
        setCRProcessingAndMonitoringValues : function (model) {


                $('.processingRangeOfHours',this.$el).text(model.processingRangeOfHours + ' Hours');
                $('.processingCategoryNo',this.$el).text(model.processingCategoryNo);
                $('.processingFee',this.$el).text("$" + model.processingFee);
                $('.processingIndirectsCost',this.$el).text("$" + model.processingIndirectsCost);
                $('.processingTotalFee',this.$el).text("$" + model.processingTotalFee);
                $('.monitoringRangeOfHours',this.$el).text(model.monitoringRangeOfHours + ' Hours');
                $('.monitoringCategoryNo',this.$el).text(model.monitoringCategoryNo);
                $('.monitoringIndirectCost',this.$el).text("$" + model.monitoringIndirectCost);
                $('.monitoringFee',this.$el).text("$" + model.monitoringFee);
                $('.monitoringTotalFee',this.$el).text("$" + model.monitoringTotalFee);

        },

        /**
         * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
         * @returns {undefined}
         */
        startListening: function() {
            PanelView.prototype.startListening.apply(this,arguments);


            this.listenTo(this, {
                'renderComplete': function() {
                    // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                    // to occur after view is added to the page, which is why we have to use the renderComplete event
                    // instead of calling it from the render function

                    this.rendered = true;

                    var existingSpecialists = this.model.get('existingSpecialistEstimateDtos');

                    if (existingSpecialists && existingSpecialists.length){
                        $('.costRecoveryWorksheet').removeClass('noEntries');
                        $('.crSummaryBtn',this.$el).show();
                    }else{
                        $('.crSummaryBtn',this.$el).hide()
                        /*$('.crSummaryBtn').attr("disabled","disabled")*/
                        $('.costRecoveryWorksheet').addClass('noEntries');
                    }

                    if (!this.model.get('monitoringIndirectCost')){
                        $('.monitoringSummary .indirectCosts',this.$el).hide();
                    }

                    if (!this.model.get('processingIndirectsCost')){
                        $('.processingSummary .indirectCosts',this.$el).hide();
                    }

                    this.setCRProcessingAndMonitoringValues(this.model.toJSON())
                }
            });

        },

    });
});