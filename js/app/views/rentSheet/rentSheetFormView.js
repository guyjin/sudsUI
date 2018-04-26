define(['app/views/panelView', "jquery", "nrm-ui", 'underscore','backbone','./addRentSheetModalView',
        'nrm-ui/views/reportLauncherView',
        "app/models/reportInfoModel",'hbs!costRecovery/crWorksheetEntriesChildRow',
        'app/models/rentSheet/rentSheet',
        'app/models/costRecovery/removeSpecialistEstimate','hbs!tableFooter',
        'app/views/rentSheet/rentSheetWorkflowView',
        'app/models/getAuthSummary'],
    function (PanelView, $, Nrm, _, Backbone, WorksheetModalView,
              ReportLauncherView, ReportInfoModel,CRWorksheetEntriesChildRow,
              RentSheet,RemoveSpecialist,tableFooter, RentSheetWorkflowView,GetAuthSummary) {

        return PanelView.extend({

            genericTemplate: 'common/ctrlsIterator',


            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments),
                    authorization = this.model.toJSON(),
                    authorizationCn = /*"603AC9E52FF0DAAEE054020820CFAC7F" || */ authorization.authorizationCn,
                    authCnObject = {authCn:authorizationCn, authorizationCn:authorizationCn},
                    dfd = new $.Deferred();

                var self = this;

                this.model.set(authCnObject);
                this.model.set("currentSectionId", "RentSheet");
                this.model.set("currentSectionStatus", "Complete");
                this.rentSheet = new RentSheet(this.model.toJSON(),{authCn:authorizationCn});


                var tabNames = ['Rent Sheet']
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

                /*this.rentSheet.fetch({
                    success: _.bind(function (model, resp, options) {

                        var authorization = this.parentModel &&  this.parentModel.get('authorization');
                        if (authorization){
                            authorization = $.extend({}, authorization.toJSON(), resp, authCnObject);
                            authorization = this.parentModel.AuthorizationModel(authorization);
                            this.parentModel.set("authorization", authorization);
                            this.model = authorization.clone();
                        }else{
                            authorization = $.extend({}, resp, authCnObject);
                            this.model.set(authorization)
                        }

                        this.groupedByCountyNameRentSheetList = $.extend({},resp.existingRentSheetDetails);


                        var tabNames = ['Rent Sheet']
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
                })*/


                return  dfd.promise();
            },

            getTabHeadingAndSectionsControls: function () {

                var controls = [];

                controls[0] = this.getEntriesTabControls();
                controls[1] = this.getSummariesTabControls();


                return controls;
            },

            getEntriesTabControls: function () {

                var itemsForRentSheetEntriesSection = this.getItemsArrayForRentSheetEntriesSection();

                var entriesControls = {
                    id: 'entriesTab',
                    tabHeading: 'Entries',
                    type: 'common/tabHeadingAndSection',
                    sectionWrap: false,
                    items: [
                        {
                            id: 'worksheetEntriesContainer',
                            fullSection: true,
                            type: 'rentSheet/rentSheetEntriesSection',
                            sectionActionLink : true,
                            sectionActionLinkClasses : ' sectionActionLink singleton addNewButton ',
                            sectionActionLinkText : 'Add New Entry',
                            items: itemsForRentSheetEntriesSection
                        }

                    ]

                };


                return entriesControls;
            },

            getItemsArrayForRentSheetEntriesSection : function () {
               var items = [];
               var self = this;

               // sort entries in county 
               _.sortBy(this.groupedByCountyNameRentSheetList, function(item) { return item.countyName; });
               // Lisa mentioned that state may get added back in.
               // If it does, can sort by county first, then by state since sortBy is stable
               //_.sortBy(this.groupedByCountyNameRentSheetList, function(item) { return item.stateName; });

                $.each(this.groupedByCountyNameRentSheetList, function (idx,obj) {
                    var countyNameWithoutSpaces = obj.countyName && obj.countyName.replace(/\s+/g, '');

                    // make sure rent values always 2 decimals
                    $.each(obj.rentSheetDetailsList, function (rsidx,rsobj) {
                        rsobj.rentFinal = rsobj.rentFinal && rsobj.rentFinal.toFixed(2) || 0;
                    });
                    
                    if (countyNameWithoutSpaces){
                        items.push($.extend(self.getTableControl(self),{
                            countyName : obj.countyName,
                            "prop" : countyNameWithoutSpaces,
                            "id": countyNameWithoutSpaces + "Table",
                            items : $.extend([],obj.rentSheetDetailsList),
                            countiesTotalUseRent : obj.countiesTotalUseRent && obj.countiesTotalUseRent.toFixed(2) || 0
                            /*"label": obj.countyName*/
                        }));
                    }

                    //since we need to display list of entries separated by counties we are creating separate collection for each counties on the model
                    self.model.set(countyNameWithoutSpaces,obj.rentSheetDetailsList);
                })
                return items;
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
                            type: 'rentSheet/rentSheetSummary',
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

                'click .addNewButton' : 'addRentSheet',
                'click .editEntry' : "editRentSheet",
                'click .removeEntry' : "removeRentSheet"
            },



            updateSummaries: function(model) {

                var authorizationModel = this.model;
                var totalRent = authorizationModel.addCommas(model.rent);
                var totalArea = authorizationModel.addCommas(model.area);
                var totalMiles = authorizationModel.addCommas(model.lengthEstimate);

                if (model.rent){
                    $('.badgeCardDataText.rent').text("$" + totalRent);
                }else{
                    $('.badgeCardDataText.rent').text("$0");
                }

                if (model.area){
                    $('.badgeCardDataText.acres').text(totalArea);
                }else {
                    $('.badgeCardDataText.acres').text("0.0");
                }


                if (model.lengthEstimate){
                    $('.badgeCardDataText.miles').text(totalMiles);
                }else{
                    $('.badgeCardDataText.miles').text("0.0");
                }
            },

            addRentOrEditRentSheetModal : function (worksheetModalViewOptions,caption,addOrEdit) {

                var self = this;
                var editModalView = new WorksheetModalView(worksheetModalViewOptions);

                Nrm.event.trigger("app:modal", {
                    modalId: 'addToWorksheetModal',
                    caption : caption,
                    view: editModalView,
                    backdrop: "static",
                    animate : true,
                    /* events:  { 'click #saveAndContinue': 'close' },*/
                    callback: _.bind(function(modal) {


                        if (editModalView.saveClicked){

                            this.trigger('loadFormView','RentSheet');

                            /* this.redisplayAndReloadAllControls();*/

                        }

                        if (editModalView.loadRentSheetWorkFlowView){
                            this.trigger('loadRentSheetWorkflowView',addOrEdit)
                        }

                    },self)
                });
            },

            addRentSheet : function () {

                var options = {
                    model: new RentSheet(this.model.toJSON(),{authCn:this.model.get('authorizationCn')})
                };

                this.addRentOrEditRentSheetModal(options,"Rent Sheet Entry","addRentSheet");

            },

            getModelForTableRow : function (e) {
                var existingRentSheetDetailsDto = this.model.get('existingRentSheetDetails'),
                    countyName = $(e.target).closest('tr').find('.county').text(),
                    rentSheetDetailsList = existingRentSheetDetailsDto[countyName] && existingRentSheetDetailsDto[countyName].rentSheetDetailsList,
                    rentSheetDetailCn = $(e.target).data('modelcn'),
                    model =  _.find(rentSheetDetailsList,function (item) {
                        return item.rentSheetDetailCn == rentSheetDetailCn;
                    });

                return model;
            },
            editRentSheet: function(e) {
                var self = this;

                if (e){
                    var currentRentSheetModel = this.getModelForTableRow(e);
                    self.editRentSheetModel = $.extend({},currentRentSheetModel,{
                        forest : currentRentSheetModel.fsAdminUnitsName,
                        state : currentRentSheetModel.stateName,
                        county : currentRentSheetModel.countyName
                    });
                }


                var options = {
                    model : new RentSheet(this.model.toJSON(),{authCn:this.model.get('authorizationCn')}),
                    worksheetCard : self.editRentSheetModel,
                    updateService : true,
                };

                this.addRentOrEditRentSheetModal(options,"Edit Rent Sheet Entry","updateService");

            },



            /*Todo : Need rest service to delete in permanently*/
            removeRentSheet: function(e) {

                var self = this;
                var rowModel = this.getModelForTableRow(e)
                var authorization = this.model.toJSON();
                var deleteUrlPathVars = authorization.authorizationCn + "/" + rowModel.rentSheetDetailCn;

                var removeRentSheet = new RentSheet(rowModel, { pathVariables : deleteUrlPathVars});

                removeRentSheet.destroy({
                    success: function(model, response){

                       /* var tr = $(e.target).closest('tr');
                        tr.css("background-color","#FF3700");
                        tr.fadeOut(400, function(){
                            tr.remove();
                        });*/
                        self.trigger('loadFormView','RentSheet');
                    },
                    error: function(model, response){
                        console.log ("Error");
                    }
                });


            },



            rentSheetWorkflowView : function (addOrUpdate) {

                var options = {
                    model : this.model
                };

                var rentSheetWorkflowView = new RentSheetWorkflowView(options);

                Nrm.event.trigger("app:workflow", {
                    view: rentSheetWorkflowView
                });

                this.listenTo(rentSheetWorkflowView, "workflowFinished", function(rentSheet) {
                    //this.model.set('shape', rentSheet.model.get('shape'))

                    if (addOrUpdate == "updateService"){
                        this.editRentSheet();
                    }else{
                        this.addRentSheet();
                    }


                });
            },


            getTableControl : function(self){

                var tableControl = {

                    /*"type" : "tableEdit",*/
                    "type" : "rentSheet/rentSheetTableEntries",
                    "id" : "addedEntriesTable",
                    /* className: "entriesTable",*/
                    "prop" :'existingSpecialistEstimateDtos' ,
                    "columns" : [
                        {
                            "prop": 'stateName',
                            "label" : "State",
                            "className" : 'state',
                            "pluginOpts": {
                                "sWidth": "100px"
                            }
                        },
                        {
                            "prop": "countyName",
                            "label" : "County",
                            "className" : 'county',
                            "pluginOpts": {
                                "sWidth": "100px"
                            }
                        },
                        {
                            "prop": "forestName",
                            "label" : "Forest",
                            "className" : 'forest',
                            "pluginOpts": {
                                "sWidth": "100px"
                            }

                        },
                        {
                            "prop": "widthFeet",
                            "label" : "Width (ft)",
                            "className" : 'width',
                            "pluginOpts": {
                                "sWidth": "100px"
                            }
                        },
                        {
                            "prop": "lengthMiles",
                            "label" : "Length (ft)",
                            "className" : 'length',
                            "pluginOpts": {
                                "sWidth": "60px"
                            }
                        },
                        {
                            "prop": "kilowatts",
                            "label" : "Kilovolts",
                            "className" : 'kiloVolts',
                            "pluginOpts": {
                                "sWidth": "60px"
                            }
                        },
                        {
                            "prop": "area",
                            "label" : "Acres",
                            "className" : 'acres',
                            "pluginOpts": {
                                "sWidth": "60px"
                            }
                        },
                        {
                            "prop": "useRent",
                            "label" : "Rate",
                            "className" : 'length',
                            "pluginOpts": {
                                "sWidth": "60px"
                            }
                        },
                        {
                            "label" : "Actions",
                            "control": {
                                type: 'costRecovery/cr_worksheetEntriesTableCtrls',
                                "id": "worksheetEntriesTableCtrls",
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
                                "sWidth": "500px",
                                orderable: false
                            }
                        },
                    ],
                    "pluginOpts" : {
                        "multiSelect" : false,
                        "readOnly": true,
                        "searching": true,
                        "paging": false,
                        "bInfo" : false,
                        footerCallback: _.bind(this.calculateSubtotalCostFooter, this)

                    },
                    footer : true
                }

                return tableControl;
            },


            applyPlugin: function(parent, control) {
                if (control.footer) {
                    var $el = $('#' + control.id, parent), footer = $('tfoot', $el);
                    if (!footer.length) {
                        $('#' + control.id, parent).append('<tfoot><tr></tr></tfoot>');
                    }
                }
                return PanelView.prototype.applyPlugin.apply(this, arguments);
            },

            calculateSubtotalCostFooter: function(tfoot) {

                var row = $(tfoot),
                    collection = this.getCollectionForTable(row.closest('table')),
                    footerData = {
                        columns: [{
                            colspan: 9,
                            className: 'surveycost-total',
                            controls: [
                                {
                                    id: 'sumTotalCost',
                                    prop: 'sumTotalCost',
                                    label: 'Sum of Total Cost'
                                }
                            ]
                        }],
                        hidden: !collection || collection.length === 0
                    };

                if (footerData.hidden) {
                    row.hide();
                } else {
                    row.show();
                }
                _.each(footerData.columns, function(column) {
                    this.bindAllData(column.controls, collection);
                }, this);
                var $footer = $(tfoot).html(tableFooter(footerData));
                _.each(footerData.columns, function(column) {
                    this.applyPlugins($footer, column.controls);
                }, this);
            },

            render : function () {

                PanelView.prototype.render.apply(this, arguments);

                return this;
            },


            showNoEntries: function () {
                this.$el.closest('.rentSheetWorksheet').addClass('noEntries');
            },
            hideNoEntries: function () {
                this.$el.closest("#renderView").addClass('rentSheetWorksheet')
            },

            redisplayAndReloadAllControls : function () {
                this.stopListening()
                this.destroyControls();
                this.renderAndFocus();
            },
            addNewItem: function($table, attributes) {

                var coll = this.getCollectionForTable($table);
                if (!coll) return;
                var newModel = new coll.model(attributes);
                coll.add(newModel);
                this.setDirty(true);
            },


            toggleRentSheetEntries : function(self){


                var existingRentSheetDetailsDto = this.model.get('existingRentSheetDetails');

                if (existingRentSheetDetailsDto){

                    this.hideNoEntries();
                    $('.entriesTable',this.$el).show();
                    //$('.summaries',self.$el).show();
                }else{
                    $('.entriesTable',this.$el).hide();
                    //$('.summaries',self.$el).hide();
                    this.showNoEntries();
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
                        /*$('.entriesTable',this.$el).show();*/
                        this.updateSummaries(this.model.toJSON())
                        this.toggleRentSheetEntries(this);

                    },
                    'loadRentSheetWorkflowView': function(addOrUpdate) {

                        this.rentSheetWorkflowView(addOrUpdate)


                    }
                });




            },

        });
    });