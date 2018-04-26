define(['../panelView', "jquery", "nrm-ui", 'underscore','backbone','./worksheetModalView',
        'nrm-ui/views/reportLauncherView',
        "app/models/reportInfoModel",
        'app/views/costRecovery/summaryCardModalView'],
            function (PanelView, $, Nrm, _, Backbone,
                                      WorksheetModalView,ReportLauncherView, ReportInfoModel,SummaryCardModalView) {

    return PanelView.extend({

        genericTemplate: 'costRecovery/cr_ProcessingAOApproval',

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);

            if (this.parentModel){
                var record = this.parentModel.get('record');

                if (record){
                    config.record = record;
                }
            }

            config.currentStep = this.model.toJSON();
            config.crWorksheetDTO = config.currentStep.crWorksheetDto;
            config.controls=[this.decisionControls(),this.nepaAnalysisBlockControls(),this.worksheetEntryCards(config)];

            return config;
        },

        events: {
             'click .editIcon' : 'openEditModal',
             'click .worksheetEntryScopeToggle': 'worksheetScopeToggle',
              'click .closeClone' : 'closeCloneCard'
            },

        /*modelEvents: $.extend({}, EditorView.prototype.modelEvents, {
            'change:width': 'calculateMiles'
            'change:width': 'calculateMiles'
        }),*/

        worksheetScopeToggle :function (event) {

                    var $clone = $('.worksheetCardClone',this.$el),
                        self = this,
                        $cloneOpen = false;


                    var openCloneCard = function(target) {
                       var $lastElement = $(target).closest('.worksheetCard');

                        var offset = $lastElement.offset(),
                            lastElement = {
                                top: offset.top - $(document).scrollTop(),
                                left: offset.left,
                                width: $lastElement.width(),
                                height: $lastElement.height()
                            };

                        $clone.html($lastElement.html());
                        $clone.css({
                            'top': lastElement.top,
                            'left': lastElement.left,
                            'width': lastElement.width,
                            'height': lastElement.height,
                            'zIndex': 10
                        });
                        setTimeout(function(){
                            $clone.css({
                                'opacity': 1,
                                'top': 30 + '%',
                                'left': 20 + '%',
                                'width': 60 + '%'
                            });
                            $lastElement.css('opacity', 0);
                            $clone.addClass('zoomed');
                            $cloneOpen = true;
                        }, 100);

                        setTimeout(function() {
                            $('.worksheetCardClone .scopeContent').css({
                                'opacity': 1
                            })
                        },400);


                        self.$clone = $clone;
                        self.lastElement = lastElement;
                        self.$cloneOpen = $cloneOpen;
                        self.$lastElement = $lastElement;

                    };

                    var target = $(event.target);
                    if($cloneOpen === true) {

                        this.closeCloneCard();
                        setTimeout(function() {
                            openCloneCard(target)
                        }, 100);
                    } else {
                        openCloneCard(target);
                    }
                },


        closeCloneCard :function (event) {
            var self = this;
            var $clone = self.$clone,
                $lastElement = self.$lastElement,
                $cloneOpen = self.$cloneOpen;;

                var target = $(event.target);


               var  lastElement = self.lastElement;

            $clone.css({
                'top': lastElement.top,
                'left': lastElement.left,
                'width': lastElement.width,
                'height': lastElement.height,
                'opacity': 0
            });

            setTimeout(function(){
                $lastElement.css('opacity', 1);
                $clone.removeClass('zoomed');
                $clone.css({'zIndex':-1});
                $clone.empty();
                $cloneOpen = false;
            }, 100);

            /*this.updateWorksheetCard($lastElement,this.model.toJSON());*/
        },
        openEditModal : function (event) {
            var target = $(event.target).parent();

            if($(target).hasClass('worksheetCard')) {
               this.editWorksheetCard(event);
            } else if($(target).hasClass('summaryCard')) {
                this.editNepaAnalysisBlock();
            }
        },

        decisionControls : function () {

            var controls = {
                id:'decisionControls',
                type : 'costRecovery/AODecisionControls',
                items : [
                    {
                        id: 'acceptedBtn',
                        type: 'btn',
                        btnStyle: "success",
                        className: "acceptOrReject btn-lg",
                        label: 'Accept',
                    },{
                        id: 'rejectedPermitbtn',
                        type: 'btn',
                        btnStyle: "danger",
                        className: "acceptOrReject btn-lg",
                        label: 'Reject' ,
                    }

                ]
            }



            return controls;
        },

        nepaAnalysisBlockControls : function () {

            var controls = {
                id:'nepaAnalysisBlock',
                type : 'costRecovery/AOApprovalNepaAnalysisBlock',
                items : [
                    {
                        id: 'infoRow1',
                        type: 'costRecovery/AOApprovalInfoRow',
                        category : true,
                        rowClass :'one',
                        items : [
                            {
                                id:"useCodeBlock",
                                label : "Use Code:",
                                labelValueClass : 'useCodeValue'
                            },

                        ]
                    },{
                        id: 'infoRow2',
                        type: 'costRecovery/AOApprovalInfoRow',
                        items : [
                            {
                                id:"waiverTypeBlock",
                                label : "Waiver Type:",
                                labelValueClass : 'waiverTypeValue'
                            },{
                                id:"waiverAmtBlock",
                                label : "Waiver Amount:",
                                labelValueClass : 'waiverAmtValue'
                            }

                        ]
                    },
                    {
                        id: 'infoRow3',
                        type: 'costRecovery/AOApprovalInfoRow',
                        items : [
                            {
                                id:"nepaTypeBlock",
                                label : "Nepa Type:",
                                labelValueClass : 'nepaTypeValue'
                            },
                            {
                                id:"estimatedHoursBlock",
                                label : "Estimated Hours:",
                                labelValueClass : 'estimatedHoursValue'
                            }

                        ]
                    }

                ]
            }

            return controls;
        },

        setNepaAnalysisBlockValues :function (crWorksheetDTO) {

            var self = this;
            $('.useCodeValue',this.$el).text(crWorksheetDTO.useCode || self.config.record.primaryUseCode);
            $('.waiverTypeValue',this.$el).text(crWorksheetDTO.crpAdjustmentType);
            $('.waiverAmtValue',this.$el).text("$" + crWorksheetDTO.crpAdjAmount);
            $('.nepaTypeValue',this.$el).text(crWorksheetDTO.crpNepaType);
            $('.estimatedHoursValue',this.$el).text(crWorksheetDTO.processingTotalEstimatedHours);
            $('.categoryNumber',this.$el).text(crWorksheetDTO.processingCategoryNo);
            $('.nepaBlockFeeValue',this.$el).text("$" + crWorksheetDTO.processingTotalFee)

        },

        worksheetEntryCards : function (config) {
            var controls = {
                id:'worksheetEntryCardsBlock',
                type : 'costRecovery/AOApprovalWorksheetEntryCards',
                items : []
            }

            var existingSpecialistEstimateDto = config.crWorksheetDTO.existingSpecialistEstimateDtos

           var worksheetCardConfig = {
                id: "worksheetCard1",
               className :"worksheetCard1",
               type:"costRecovery/AOApprovalWorksheetCard",
               items : [{
                       type:'costRecovery/AOApprovalWorksheetEntry',
                       labelClass : 'roleLabel',
                       label : "Role:",
                       labelValueClass : 'roleValue',
                   },{
                   type:'costRecovery/AOApprovalWorksheetEntry',
                   labelClass : 'nameLabel',
                   label : "Name:",
                   labelValueClass : 'nameValue',
               },{
                   type:'costRecovery/AOApprovalWorksheetEntry',
                   labelClass : 'rateLabel',
                   label : "Rate:",
                   labelValueClass : 'rateValue',
               },{
                   hours :true,
                   type:'costRecovery/AOApprovalWorksheetEntry',
                   label: 'Hours',

               }
               ],
               scopeContent : 'This is a test',

           }

            _.each(existingSpecialistEstimateDto,function (specialistEstObj,index) {

                var eachWrksheetConfig = $.extend(true,{},worksheetCardConfig);
                eachWrksheetConfig.id = "worksheetCard" + index;
                if(eachWrksheetConfig.items){
                    _.each(eachWrksheetConfig.items,function (worksheetEntryItem,index) {

                        if (worksheetEntryItem.labelClass == "roleLabel" && specialistEstObj.role){
                            worksheetEntryItem.value = specialistEstObj.role;
                        }else if (worksheetEntryItem.labelClass == "nameLabel" && specialistEstObj.name){
                            worksheetEntryItem.value = specialistEstObj.name;
                        }else if (worksheetEntryItem.labelClass == "rateLabel" && specialistEstObj.rate){
                            worksheetEntryItem.value = "$" +specialistEstObj.rate;
                        }else if (worksheetEntryItem.hours && specialistEstObj.processingTimeEst){
                            worksheetEntryItem.value = specialistEstObj.processingTimeEst;
                        }
                        if (specialistEstObj.scope){
                            eachWrksheetConfig.scopeContent = specialistEstObj.scope.replace(/(\r\n|\n|\r)/gm, '<br>');
                        }

                    })
                }

                controls.items.push(eachWrksheetConfig)
            })

            return controls;
        },

        editNepaAnalysisBlock : function () {

            var self = this;
            var options = {
                model: this.model
            };

            var summaryCardModalView = new SummaryCardModalView(options);

            Nrm.event.trigger("app:modal", {
                modalId: 'summaryCardModal',
                view: summaryCardModalView,
                backdrop: "static",
                animate : true,
                events:  { 'click #saveAndContinue': 'close' },
                callback: _.bind(function(modal) {
                    var updatedCrWorksheetDTO = summaryCardModalView.model.get('crWorksheetDto');

                    this.setNepaAnalysisBlockValues(updatedCrWorksheetDTO);

                },this)
            });
        },

        editWorksheetCard : function (event) {

            var self = this;
            var target = $(event.target).parent(),
                $lastElement = $(target).closest('.worksheetCard'),
                selectedWorksheetCardRole = $lastElement.find('.roleValue').text().toLowerCase().trim(),
                worksheetCard, existingSpecialistEstimateDto = this.config.crWorksheetDTO.existingSpecialistEstimateDtos;

            var options = {
                model: this.model
            };


            _.each(existingSpecialistEstimateDto,function (specialistEstObj,index) {

                if (specialistEstObj.role.toLowerCase().trim() == selectedWorksheetCardRole){
                    worksheetCard = specialistEstObj;
                }
            })


            var options = {
                model : this.model,
                worksheetCard : worksheetCard,
                updateService : true,
            };
            var editModalView = new WorksheetModalView(options);

            Nrm.event.trigger("app:modal", {
                modalId: 'addToWorksheetModal',
                view: editModalView,
                backdrop: "static",
                animate : true,
                /*events:  { 'click #saveAndContinue': 'close' },*/
                callback: _.bind(function(modal) {

                    if (editModalView.saveClicked){
                        var updatedSpecialistEstimateDTO = editModalView.model.toJSON();
                        this.updateWorksheetCard($lastElement,updatedSpecialistEstimateDTO)

                        _.each(existingSpecialistEstimateDto,function (specialistEstObj,index) {
                            if (specialistEstObj.role.toLowerCase().trim() == selectedWorksheetCardRole){

                           var specialistEstimate =  _.pick(updatedSpecialistEstimateDTO,
                                    ["name", "rate","role","crpActivityCn",
                                    "crActivityTypeCn","scope","processingTimeEst","monitoringTimeEst"])
                                specialistEstObj.role = specialistEstimate.role;
                                specialistEstObj.name = specialistEstimate.name;
                                specialistEstObj.scope = specialistEstimate.scope;
                                specialistEstObj.rate = specialistEstimate.rate;
                                specialistEstObj.processingTimeEst = specialistEstimate.processingTimeEst;
                                specialistEstObj.monitoringTimeEst = specialistEstimate.monitoringTimeEst;
                            }
                        })

                        self.config.crWorksheetDTO.existingSpecialistEstimateDtos = existingSpecialistEstimateDto;
                    }



                },this)
            });
        },

        updateWorksheetCard : function ($lastElement,updatedDTO) {

            if (updatedDTO.scope){
                var scope = updatedDTO.scope.replace(/(\r\n|\n|\r)/gm, '<br>');
                $lastElement.find('.scopeContent').html(scope);
            }

            if (updatedDTO.role){
                $lastElement.find('.roleValue').text(updatedDTO.role);
            }

            if (updatedDTO.rate){
                $lastElement.find('.rateValue').text("$" + updatedDTO.rate);
            }

            if (updatedDTO.name){
                $lastElement.find('.nameValue').text(updatedDTO.name);
            }

            if (updatedDTO.processingTimeEst){
                $lastElement.find('.hoursValue').text(updatedDTO.processingTimeEst);
            }



        },
        render : function () {

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

                    this.setNepaAnalysisBlockValues(this.config.crWorksheetDTO)
                }
            });

        },

    });
});