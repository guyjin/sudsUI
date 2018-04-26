define(['../panelView', "jquery", "nrm-ui", 'underscore','backbone','./worksheetModalView',
        'nrm-ui/views/reportLauncherView',
        "app/models/reportInfoModel",'hbs!costRecovery/crWorksheetEntriesChildRow',
        'app/models/costRecovery/getCrEstimate','app/models/costRecovery/addSpecialistEstimate','app/models/costRecovery/removeSpecialistEstimate'],
    function (PanelView, $, Nrm, _, Backbone, WorksheetModalView,
              ReportLauncherView, ReportInfoModel,CRWorksheetEntriesChildRow,CrEstimateModel,AddSpecialistEstimate,RemoveSpecialist) {

        return PanelView.extend({

            genericTemplate: 'common/ctrlsIterator',


            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments),
                    authorization = this.model.toJSON(),
                    dfd = new $.Deferred(),
                    crEstimateModel = new CrEstimateModel({id:authorization.authorizationCn});

                this.model.set("nextStepId", "CostRecoveryProcessi");
                //this.model.set("nextStepId", authorization.caseFileId);
                this.model.set("currentSectionId", "CRprocessing");
                this.model.set("currentSectionStatus", "InProgress");


                crEstimateModel.fetch({
                    success: _.bind(function (model, resp, options) {

                        var authorization = this.parentModel.get('authorization');
                        authorization = $.extend({}, authorization.toJSON(), resp);
                        authorization = this.parentModel.AuthorizationModel(authorization);

                        this.parentModel.set("authorization", authorization);
                        this.model = authorization.clone();

                        var tabNames = ['Cost Recovery Processing']
                        config.controls = [
                            {
                                type: 'common/soloTabSummaryHeader',
                                screenName: {
                                    tabNames: tabNames
                                }
                            }, {
                                type: 'common/screenContentControls',
                                controls: this.getTabHeadingAndSectionsControls(),
                            }
                        ]
                        dfd.resolve(config);
                    },this),
                    error: function (model, resp, options) {

                        dfd.reject(model, resp, options);
                    }
                })


                return dfd.promise();
            },

            getTabHeadingAndSectionsControls: function () {

                var controls = [];

                controls[0] = this.getEntriesTabControls();
                controls[1] = this.getSummariesTabControls();


                return controls;
            },

            getEntriesTabControls: function () {


                var entriesControls = {
                    id: 'entriesTab',
                    tabHeading: 'Entries',
                    type: 'common/tabHeadingAndSection',
                    sectionWrap: false,
                    items: [
                        {
                            id: 'worksheetEntriesContainer',
                            fullSection: true,
                            type: 'costRecovery/cr_worksheet-entries-section',
                            sectionActionLink : true,
                            sectionActionLinkClasses : ' sectionActionLink singleton addNewButton ',
                            sectionActionLinkText : 'Add New Entry',
                            items: [this.getTableControl(this)]
                        }

                    ]

                };


                return entriesControls;
            },
            getSummariesTabControls: function () {


                var summariesControls = {
                    id: 'summariesTab',
                    tabHeading: 'Summary',
                    type: 'common/tabHeadingAndSection',
                    sectionWrap: false,
                    items: [
                        {
                            id: 'summariesContainer',
                            fullSection: true,
                            type: 'costRecovery/cr_worksheet-badgeCard-summaries',
                            items: []
                        }

                    ]

                };

                return summariesControls;


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

            mergeAuthorizationAndCrWorksheetDto :  function(crworksheetDtoResponse){
                var authorization = this.parentModel.get('authorization');
                authorization = $.extend({}, authorization.toJSON(), crworksheetDtoResponse);
                authorization = this.parentModel.AuthorizationModel(authorization);
                this.parentModel.set("authorization", authorization);
                this.model = authorization.clone();
            },
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
                    model: new AddSpecialistEstimate(this.model.toJSON(),{context :"addSpecialistEstimate"})
                };


                var editModalView = new WorksheetModalView(options);

                Nrm.event.trigger("app:modal", {
                    modalId: 'addToWorksheetModal',
                    caption : 'Worksheet Entry',
                    view: editModalView,
                    backdrop: "static",
                    animate : true,
                    /* events:  { 'click #saveAndContinue': 'close' },*/
                    callback: _.bind(function(modal) {

                        if (editModalView.saveClicked){

                            var crWrkSheetDto = editModalView.model.toJSON();
                            var existingSpecialists = editModalView.model.get('existingSpecialistEstimateDtos');

                           this.mergeAuthorizationAndCrWorksheetDto(crWrkSheetDto);
                            this.setCRProcessingAndMonitoringValues(crWrkSheetDto);

                            var editEntriesTblSelector = $("#addedEntriesTable", self.$el);

                            if (existingSpecialists && existingSpecialists.length){
                                this.$el.closest('.costRecoveryWorksheet').removeClass('noEntries');

                                self.addNewItem(editEntriesTblSelector,existingSpecialists[existingSpecialists.length - 1]);
                                $('.summaries',self.$el).show()
                            }else{
                                this.$el.closest('.costRecoveryWorksheet').addClass('noEntries');
                                $('.summaries',this.$el).hide();
                            }
                        }

                    },this)
                });
            },

            editSpecialist: function(e) {

                var model = this.getModelForTableRow($(e.target));

                var options = {
                    model : new AddSpecialistEstimate(this.model.toJSON(), {context :"updateCrActivity"}),
                    worksheetCard : model.toJSON(),
                    updateService : true,
                };
                var editModalView = new WorksheetModalView(options);

                Nrm.event.trigger("app:modal", {
                    modalId: 'addToWorksheetModal',
                    caption : 'Edit Worksheet Entry',
                    view: editModalView,
                    backdrop: "static",
                    animate : true,
                    /* events:  { 'click #saveAndContinue': 'close' },*/
                    callback: _.bind(function(modal) {

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

                var self = this;
                var rowModel = this.getModelForTableRow($(e.target))
                var authorization = this.model.toJSON();
                var deleteUrlPathVars = rowModel.get('crActivityTypeCn') + "/" + authorization.authorizationCn;
                var removeSpecialist = new RemoveSpecialist(authorization, { pathVariables : deleteUrlPathVars});

                removeSpecialist.destroy({
                    success: function(model, response){
                        rowModel.collection.remove(rowModel);
                        console.log ("Success");
                    },
                    error: function(model, response){
                        console.log ("Error");
                    }
                });


            },

            toggleNoEntries : function () {

                var coll = this.getCollectionForTable($("#addedEntriesTable", this.$el));

                if (coll && coll.length){
                    this.$el.closest('.costRecoveryWorksheet').removeClass('noEntries');
                    $('.summaries',this.$el).show();
                }else{
                    this.$el.closest('.costRecoveryWorksheet').addClass('noEntries');
                    $('.summaries',this.$el).hide();
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
                        "paging": false,
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


                if (!model.monitoringRangeOfHours || model.monitoringCategoryNo == "0"){
                    $('.monitoringRangeOfHours',this.$el).html('');
                    $('.monitoringCategoryText',this.$el).html('No Entry');
                    $('.monitoringCategoryNo',this.$el).html('');
                }else{
                    $('.monitoringCategoryText',this.$el).html('category');
                    $('.monitoringRangeOfHours',this.$el).text(model.monitoringRangeOfHours + ' Hours');
                    $('.monitoringCategoryNo',this.$el).text(model.monitoringCategoryNo);
                }

                if (model.monitoringFee){
                    $('.monitoringFee',this.$el).text("$" + model.monitoringFee);
                }else{
                    $('.monitoringFee',this.$el).text("$");
                }

                if (model.monitoringIndirectCost){
                    $('.monitoringIndirectCost',this.$el).text("$" + model.monitoringIndirectCost);
                }else{
                    $('.monitoringIndirectCost',this.$el).text("$");
                }

                if (model.monitoringTotalFee){
                    $('.monitoringTotalFee',this.$el).text("$" + model.monitoringTotalFee);
                }else{
                    $('.monitoringTotalFee',this.$el).text("$");
                }


            },

            toggleSpecialistEntries : function(self){

                var existingSpecialists = self.model.get('existingSpecialistEstimateDtos');

                if (existingSpecialists && existingSpecialists.length){

                    self.$el.closest('.costRecoveryWorksheet').removeClass('noEntries');

                    //self.$el.closest("#renderView").addClass('costRecoveryWorksheet').removeClass('noEntries');
                    $('.summaries',self.$el).show();
                }else{
                    $('.summaries',self.$el).hide();
                    this.$el.closest("#renderView").addClass('costRecoveryWorksheet noEntries');
                    // this.$el.closest('.costRecoveryWorksheet').addClass('noEntries');
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
                        // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                        // to occur after view is added to the page, which is why we have to use the renderComplete event
                        // instead of calling it from the render function
                        this.rendered = true;
                        $('.addNewButton',this.$el).closest('.sectionTop').css({"margin-left" : "auto"});
                        this.toggleSpecialistEntries(this);

                    },

                    'classesApplied': function() {
                        // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                        // to occur after view is added to the page, which is why we have to use the renderComplete event
                        // instead of calling it from the render function

                       // this.toggleSpecialistEntries(this);


                        if (!this.model.get('monitoringIndirectCost')){
                            $('.monitoringSummary .indirectCosts',this.$el).hide();
                        }

                        if (!this.model.get('processingIndirectsCost')){
                            $('.processingSummary .indirectCosts',this.$el).hide();
                        }


                        $.when(Nrm.app.getContext({
                            apiKey: "lov/crActivityTypes"
                        }, this)).done(function(context) {
                            $.when(Nrm.app.getCollection(context, null, this)).done(function (collection) {
                                this.model.set("crActivityTypes",collection)
                            });
                        });
                        this.setCRProcessingAndMonitoringValues(this.model.toJSON())
                    }
                });

            },

        });
    });