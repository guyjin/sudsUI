define(['app/views/panelView', "jquery", "nrm-ui", 'underscore',
        'backbone',
        'nrm-ui/views/reportLauncherView',
        "app/models/reportInfoModel","app/views/rentSheet/rentSheetFormView"],
    function (PanelView, $, Nrm, _, Backbone,
              ReportLauncherView, ReportInfoModel,RentSheetFormView) {

        return RentSheetFormView.extend({

            genericTemplate: 'common/form',


            /*getConfig: function () {

                var baseConfig = RentSheetFormView.prototype.getConfig.apply(this, arguments);


                $.when(baseConfig).done(_.bind(function () {


                },this))



                return  dfd.promise();
            },*/

            getTabHeadingAndSectionsControls: function () {

                this.model.set("currentSectionId", "RecEventSingle");//come back to this
                this.model.set("currentSectionStatus", "Complete");

                var controls = [];

                controls[0] = this.getRecEventContainerTabCtrls();

                return controls;
            },


            getRecEventContainerTabCtrls: function () {


                var recEventContainerCtrls = {
                    id: 'recreationEventContainer',
                    tabHeading: 'Recreation Event',
                    type: 'common/tabHeadingAndSection',
                    sectionWrap: false,
                    fullSection : "",
                    items: [
                        {
                            id: 'numberOfEvents',
                            fullSection: true,
                            sectionLabel: 'Number Of Events',
                            type: 'rentSheet/eventQuantityContainer',
                            items: []
                        },
                       this.getFinalReconControls(),
                       this.getFinalRentControls()
                    ]

                };


                return recEventContainerCtrls;
            },


            getFinalReconControls : function () {
              var finalRecon =  {
                      id: 'formSection',
                      fullSection: true,
                      sectionLabel: 'Final Reconciliation',
                      type: "common/divCtrlIterator",
                      containerClass : "form-section tblRow",
                      sectionContentClass : "tbl",
                      sectionActionLink: true,
                      sectionActionLinkClasses : "sectionActionLink",
                      sectionActionLinkText : "Add Another Event",
                      controls: []
                  };

                finalRecon.controls=[{
                    id: 'eventName',
                    type: 'inputText',
                    nameAttr: 'eventName',
                    label: "Event Name",
                    placeholder: 'Event Name',
                    prop: 'eventName',
                    className: 'suds-input',
                    required: true
                    //hidden:true
                },{
                    id: 'estimatedGrossRevenue',
                    type: 'inputNum',
                    nameAttr: 'estimatedGrossRevenue',
                    label: "Estimated Gross Revenue",
                    placeholder: 'estimated gross revenue',
                    prop: 'estimatedGrossRevenue',
                    className: 'suds-input',
                    required: true,
                    disabled : true
                    //hidden:true
                },{
                    id: 'estimatedPrice',
                    type: 'inputNum',
                    nameAttr: 'estimatedPrice',
                    label: "Estimated Prize",
                    placeholder: 'estimated price',
                    prop: 'estimatedPrice',
                    className: 'suds-input',
                    required: true
                    //hidden:true
                },{
                    id: 'finalGrossRevenue',
                    type: 'inputNum',
                    nameAttr: 'finalGrossRevenue',
                    label: "Final Gross Revenue",
                    placeholder: 'final gross revenue',
                    prop: 'estimatedGrossRevenue',
                    className: 'suds-input',
                    required: true
                    //hidden:true
                },{
                    id: 'finalPrice',
                    type: 'inputNum',
                    nameAttr: 'finalPrice',
                    label: "Final Prize",
                    placeholder: 'final price',
                    prop: 'finalPrice',
                    className: 'suds-input',
                    required: true
                }]


                return finalRecon;
            },


            getFinalRentControls : function () {

                var finalRent =  {
                    id: 'finalRentContainer',
                    fullSection: true,
                    sectionLabel: 'Final Rent',
                    type: "common/divCtrlIterator",
                    containerClass : "rentSummary",
                    controls: []
                };

                finalRent.controls=[{
                    id: 'calculatedRent',
                    type: "common/divCtrlIterator",
                    containerClass : "rentTotal",
                    //hidden:true
                },{
                    id: 'postalCode',
                    type: 'inputNum',
                    nameAttr: 'postalCode',
                    label: "Postal Code",
                    placeholder: 'enter postal code',
                    prop: 'postalCode',
                    nested: 'address',
                    className: 'suds-input addressAttrs',
                    //hidden:true
                },{
                    id: 'postalCode',
                    type: 'inputNum',
                    nameAttr: 'postalCode',
                    label: "Postal Code",
                    placeholder: 'enter postal code',
                    prop: 'postalCode',
                    nested: 'address',
                    className: 'suds-input addressAttrs',
                    //hidden:true
                },{
                    id: 'postalCode',
                    type: 'inputNum',
                    nameAttr: 'postalCode',
                    label: "Postal Code",
                    placeholder: 'enter postal code',
                    prop: 'postalCode',
                    nested: 'address',
                    className: 'suds-input addressAttrs',
                    //hidden:true
                }]


                return finalRent;
            },

            render : function () {
                this.config.inputClass = "input-md"
                this.config.formId = "recEventRentSheetForm";
                this.config.formName = "recEventRentSheetForm";
                RentSheetFormView.prototype.render.apply(this, arguments);

                return this;
            },



            /**
             * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
             * @returns {undefined}
             */
            startListening: function() {
                RentSheetFormView.prototype.startListening.apply(this,arguments);

                this.listenTo(this, {
                    'renderComplete': function() {
                        // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                        // to occur after view is added to the page, which is why we have to use the renderComplete event
                        // instead of calling it from the render function
                        this.rendered = true;


                    },
                    'loadRentSheetWorkflowView': function(addOrUpdate) {

                    }
                });


            },

        });
    });