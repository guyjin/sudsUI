define(['./panelView', "jquery", "nrm-ui", 'underscore','use!select2'], function (PanelView, $, Nrm, _,select2) {
    return PanelView.extend({

        // this is the form template name
        genericTemplate : 'authoritySelection/authSelectionForm',

        //this is where all the controls are defined
        getConfig: function () {
            var config = PanelView.prototype.getConfig.apply(this, arguments);//super


            config.currentStep = this.model.toJSON();

            config.controls = [{
                id:'primaryUseCodeId',
                type:'authoritySelection/useCodeDetailsList',
                useCodeHeader : 'PRIMARY USE CODE: ### - Name of Use Code',
                primarySecondaryInd : "P",
                items : []
            }]



           this.loadPrimaryAndSecondaryCards(config);

            return config;
        },

        events: {
                'click .authorityCard' : 'toggleCard'
                //... other custom events go here...
            },



        toggleCard : function(event) {
            var $target = $(event.currentTarget),
                selectedAuthorityName = $target.find('.authorityName').text(),
                selectedPrimarySecondaryInd = $target.find('.authorityName').attr("data-useCodeCn"),
                selectedAuthoritySelectionDto = _.find(this.config.currentStep.authoritySelectionDtoList,function (authoritySelectionDto) {
                    return authoritySelectionDto.useCodeCn === selectedPrimarySecondaryInd;
                });
                /*selectedAuthorityUseCodeDetails = selectedAuthoritySelectionDto && _.find(selectedAuthoritySelectionDto, function (useCodeDetail) {
                    return useCodeDetail.authorityDescription === selectedAuthorityName.trim();
                }),
                parentAuthoritySelectionObj= $.extend(true,selectedAuthoritySelectionDto,{});*/

            this.setDirty(true);
            /*console.log(selectedAuthorityName,selectedPrimarySecondaryInd,selectedAuthorityUseCodeDetails);*/
            $target.parent('.cards').children('.selected').removeClass('selected');
            $target.toggleClass('selected');
        },
        loadPrimaryAndSecondaryCards : function (config) {

            var primaryCardConfig = config.controls[0],
                secondaryCardConfig = {
                    id:'secondaryUseCodeId',
                    type:'authoritySelection/useCodeDetailsList',
                    useCodeHeader : "USE CODE: ### - Use Code Name",
                    primarySecondaryInd : "S",
                    items : []
                },eachSecondaryCardConfig;

            _.each(config.currentStep.authoritySelectionDtoList,function (eachAuthSelection,idx) {

                var authorityCardConfig = {
                    id: 'authorityCard',
                    authorityName : '',
                    type :'authoritySelection/authorityCard',
                    items : []
                }, infoRowConfig =  {
                    type : 'authoritySelection/infoRow',
                    items : []
                },infoBlockConfig = {
                    type : 'authoritySelection/infoBlock',
                    infoLabel : '',
                    infoText : ''
                },eachAuthorityCard,firstInfoRowConfig,secondInfoRowConfig,type,maxTerm,template


                if (eachAuthSelection.primarySecondaryInd === "P") {
                        primaryCardConfig.useCodeHeader = "PRIMARY USE CODE : " + eachAuthSelection.useCode + ' - ' + eachAuthSelection.useCodeName;
                }else if (eachAuthSelection.primarySecondaryInd === "S"){
                        eachSecondaryCardConfig = $.extend(true,{},secondaryCardConfig)
                        config.controls.push(eachSecondaryCardConfig)
                        eachSecondaryCardConfig.useCodeHeader = "USE CODE : " + eachAuthSelection.useCode + ' - ' + eachAuthSelection.useCodeName;
                }

               if(eachAuthSelection.authorityUseCodeDetailsDtoList
                        && eachAuthSelection.authorityUseCodeDetailsDtoList.length ){

                        _.each(eachAuthSelection.authorityUseCodeDetailsDtoList,function (obj,idx) {

                            eachAuthorityCard = $.extend(true,{},authorityCardConfig,{
                                id: 'authorityCard' + idx,
                                primarySecondaryInd : eachAuthSelection.primarySecondaryInd,
                                useCodeCn : eachAuthSelection.useCodeCn
                            });

                            eachAuthorityCard.authorityName = obj.authorityDescription

                            if (eachAuthSelection.primarySecondaryInd === "S"){
                                eachSecondaryCardConfig.items.push(eachAuthorityCard);
                                return;
                            }

                            firstInfoRowConfig = $.extend(true,{},infoRowConfig);
                            if(obj.authorizationtypeName){

                                type = $.extend(true,{},infoBlockConfig,
                                    {
                                        infoLabel : 'Type',
                                        infoText : obj.authorizationtypeName
                                    })

                                firstInfoRowConfig.items.push(type)
                            }

                            if(obj.maxTermCode){

                                maxTerm = $.extend(true,{},infoBlockConfig,
                                    {
                                        infoLabel : 'Max Term',
                                        infoText : obj.maxTermCode
                                    })

                                firstInfoRowConfig.items.push(maxTerm)
                            }


                            eachAuthorityCard.items.push(firstInfoRowConfig);
                            secondInfoRowConfig = $.extend(true,{},infoRowConfig);

                            if(obj.templateFSForm){

                                template = $.extend(true,{},infoBlockConfig,
                                    {
                                        infoLabel : 'Template',
                                        infoText : obj.templateFSForm + (obj.templateName ? "(" + obj.templateName + ")" : '')
                                    })

                                secondInfoRowConfig.items.push(template)
                                eachAuthorityCard.items.push(secondInfoRowConfig)
                            }

                            primaryCardConfig.items.push(eachAuthorityCard);
                        });

                    }


            })
        },


        render : function () {

            this.setDirty(true)
            return PanelView.prototype.render.apply(this, arguments);
        },

        /**
         * Overrides {@link module:nrm-ui/views/panelView#startListening|EditorView#startListening}
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


                }
            });

        },


    });
});