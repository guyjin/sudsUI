define(['../panelView', "jquery", "nrm-ui", 'underscore','app/collections/contactsCollection',
        'backbone','app/collections/addFilesCollection','app/models/deleteFilesModel','nrm-ui/plugins/nrmDatePicker'],
    function (PanelView, $, Nrm, _,
              ContactCollection, Backbone, AddFilesCollection,DeleteFilesModel ) {

        return PanelView.extend({

            genericTemplate : 'common/ctrlsIterator',

            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments);


                this.model.set("currentSectionId", "NCGU");
                this.model.set("currentSectionStatus", "Complete");
                //this.model.set("nextStepId",this.model.get("caseFileId"));

                var tabNames = ['Non-Commercial Group Use']
                config.controls = [
                    {
                        type:'common/soloTabSummaryHeader',
                        screenName : {
                            tabNames : tabNames
                        }
                    },{
                        type:'common/screenContentControls',
                        controls : this.getTabHeadingAndSectionsControls(),
                    }
                ]

                return config;
            },


            getTabHeadingAndSectionsControls : function () {

                var controls = [];


                controls[0] = {
                    id : 'ngcuCheckId',
                    type:'ncguCheck'
                };
                controls[1] = {
                    id:'checkQuesContainer',
                    tabHeading :'Check',
                    type :'basicInfo/tabHeadingAndSection',

                    items : [
                        {
                            fullSection : true,
                            id :'ncguQues',
                            nameAttr : 'ncguQues',
                            type : 'common/yesAndNoQues',
                            question:'Does this qualify for Non-Commercial Group Use?',
                            yOrN :true
                        }
                    ]

                }

                return controls;
            },


            events: {
                'click  .answerButtons>input[type=radio]': 'answerSelected'
                //... other custom events go here...
            },


            answerSelected  : function(event){

                var $target = $(event.target);
                //event.preventDefault();

                if ($target.prop('checked') === true) {

                    if ($target.attr("id").indexOf("Yes") != -1) {
                        this.model.set("ncguInd","Y")
                    }else{
                        this.model.set("ncguInd","N")
                    }
                }

            },



            render : function () {

                // this.model.set('uiAttributeOrder2',this.model.get('uiAttributeOrder18'));
                PanelView.prototype.render.apply(this, arguments);


                return this;


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

                        var ncguInd = this.model.get('ncguInd');

                        if (ncguInd == "Y"){
                            $("#ncguQues_Yes",this.$el).prop("checked",true);
                        }else if (ncguInd == "N"){
                            $("#ncguQues_No",this.$el).prop("checked",true);
                        }

                    }
                });

            }

        });
    });