define(['../..', '../panelView', "jquery", "nrm-ui", 'underscore',
        'backbone',
        'nrm-ui/plugins/nrmDatePicker', 'app/models/basicProposalModel', 'nrm-map/views/spatialEditView'],
    function (Suds, PanelView, $, Nrm, _, Backbone,nrmDatePicker) {

        return PanelView.extend({

            genericTemplate: 'common/ctrlsIterator',

            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments);

                this.model.set({
                    currentSectionId: 'ClosureForm',
                    currentSectionStatus: 'Complete'
                }, {silent: true});


                var tabNames = ['Closure']
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

                return config;
            },


            getTabHeadingAndSectionsControls: function () {

                var controls = [];

                controls[0] = this.getClosureTabControls();

                return controls;
            },


            getClosureTabControls: function () {

                var authorization = this.model.toJSON();


                var closureControls = {
                    id: 'whereContainer',
                    tabHeading: 'Closure',
                    type: 'basicInfo/tabHeadingAndSection',
                    sectionWrap: true,
                    items: [
                        {
                            id: 'activityLocationContainer',
                            sectionLabel: 'When & Why',
                            type: 'basicInfo/questionControl',
                            items: [{
                                "type": "inputDate",
                                "id": "closureDate",
                                "nameAttr": "closureDate",
                                "prop": "closureDate",
                                "title": "Closure Date (MM/DD/YYYY)",
                                "label": "Closure Date",
                                "required": true,
                                className: 'suds-input'
                            }, {
                                "type": "inputDate",
                                "id": "closureInspectionDate",
                                "nameAttr": "closureInspectionDate",
                                "prop": "closureInspectionDate",
                                "title": "Closure Inspection Date (MM/DD/YYYY)",
                                "label": "Closure Inspection Date",
                                "required": true,
                                className: 'suds-input'
                            }, {
                                "type": "select",
                                "id": "reasonForClosure",
                                "prop": "closureReasonFk",
                                "nameAttr": "reasonForClosure",
                                "title": "Reason for closure",
                                "label": "Reason for Closure",
                                "lov": "lov/closureReasons",
                                "placeholder": "Select Reason for Closure",
                                "required": true
                            }],

                        },
                        {
                            id: 'activityDescriptionContainer',
                            sectionLabel: 'Authorized Officer',
                            type: 'common/ctrlsIterator',
                            controls : [{
                                "type": "inputText",
                                "id": "lastName",
                                "nameAttr": "lastName",
                                "prop": "aoLastName",
                                "title": "AO Last Name",
                                "label": "Last Name",
                                "required": true,
                                className: 'suds-input'
                                /*"group" : true*/
                            },
                                {
                                    "type": "inputText",
                                    "id": "firstName",
                                    "nameAttr": "firstName",
                                    "prop": "aoFirstName",
                                    "title": "AO First Name",
                                    "label": "First Name",
                                    "required": true,
                                    /*"nested" : "object1",
                                     dataType : "object",*/
                                    className: 'suds-input'
                                    /*"group" : true*/
                                },
                                {
                                    "type": "select",
                                    "id": "aoTitle",
                                    "nameAttr": "aoTitle",
                                    "prop": "closureAoTitleFk",
                                    "title": "AO Title",
                                    "label": "AO Title",
                                    "required": true,
                                    "lov": "lov/jobPositionTitles",
                                    /*"nested" : "object1",
                                     dataType : "object",*/
                                    className: 'suds-input'
                                    /*"group" : true*/
                                }],

                        },
                        {
                            id: 'closureStatementContainer',
                            fullSection: true,
                            sectionClass: 'closureStatementSection',
                            sectionLabel: 'Closure Statement',
                            type: 'common/itemsIterator',
                            items: [{
                                id:'closureStatement',
                                type:'closure/closureStatement',
                                reasonForClosure:'',
                                inspectionDate : authorization && authorization.closureInspectionDate,
                                holderName : '',
                            },{
                                id: 'affirmBtnContainer',
                                type:'closure/centerBtn',
                                items :[{
                                        btnStyle:'primary',
                                        "type": "btn",
                                        "id": "affirmBtn",
                                        "nameAttr": "affirmBtn",
                                        "prop": "affirmBtn",
                                        "title": "Affirm",
                                        "label": "Affirm",
                                        className: 'suds-input text-center affirmBtn',
                                        disabled : authorization && !authorization.closureTermsMetInd,
                                    }]
                            }],

                        },
                        {
                            id: 'activityNecessityContainer',
                            fullSection: true,
                            type: 'common/itemsIterator',
                            items: [
                                {
                                    id: 'affirmBtnContainer',
                                    type:'closure/centerBtn',
                                    items :[{
                                        "type": "btn",
                                        btnStyle: 'danger',
                                        "id": "closeAuthorizationBtn",
                                        "nameAttr": "closeAuthorizationBtn",
                                        "prop": "closeAuthorizationBtn",
                                        "title": "Close Authorization",
                                        "label": "Close Authorization",
                                        className: 'suds-input closeAuthorizationBtn',
                                        disabled: true

                                    }]
                                }],

                        }
                    ]

                };


                return closureControls;
            },


            events: {
                'click .closeAuthorizationBtn' : function (event) {

                    PanelView.prototype.updateAuth.apply(this, arguments);

                    this.trigger('loadFormView','Administration');
                },
                'click .affirmBtn' : function (event) {

                    this.model.formSave = true;
                    this.trigger('validateForm');
                    this.listenTo(this,"screenValidated",function (valid) {
                        if (valid){
                            $('.closeAuthorizationBtn',this.$el).attr("disabled",false);
                        }
                    })

                },
            },

            modelEvents: {
                "change:closureReasonFk": "updateClosureStatement",
                "change:closureInspectionDate": "updateClosureStatement"
            },


            updateClosureStatement : function () {

                var closureTermsMetInd = "Y";
                var closureInspectionDate  =  this.model && this.model.get('closureInspectionDate');
                var reasonForClosure = $("#reasonForClosure  option:selected").text();

                if (reasonForClosure === "Revocation"){
                    closureTermsMetInd = "N"
                }

                if (closureInspectionDate){
                    $('.inspectionDateText',this.$el).text(closureInspectionDate);
                }

                if (reasonForClosure && reasonForClosure.indexOf('Select') == -1){
                    $('.reasonForClosureText',this.$el).text(reasonForClosure);

                    if (closureTermsMetInd && closureTermsMetInd == "Y"){
                        $('.closureConditionsMetText',this.$el).text("has");
                    }else{
                        $('.closureConditionsMetText',this.$el).text("has not");
                    }

                    $('.affirmBtn',this.$el).attr("disabled",false);
                }

            },


            /**
             * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
             * @returns {undefined}
             */
            startListening: function () {

                PanelView.prototype.startListening.apply(this,arguments);
                this.listenTo(this, {
                    'renderComplete': function () {
                        // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                        // to occur after view is added to the page, which is why we have to use the renderComplete event
                        // instead of calling it from the render function

                        this.updateClosureStatement();
                        $('.suds-save-btn',this.$el).hide();
                        //$('.closureStatementSection',this.$el).css({width : "100%"})//setting total width for closure statement
                    }
                });

            }

        });
    });