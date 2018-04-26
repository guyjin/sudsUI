define(['../..', '../panelView', "jquery", "nrm-ui", 'underscore', 'backbone', 'app/models/authSelectionModel', 'app/models/getTableRecordByAuthAndProp'],
    function (Suds, PanelView, $, Nrm, _, Backbone, AuthSelectionModel, GetTableRecordByAuthAndProp) {

        return PanelView.extend({

            genericTemplate: 'common/ctrlsIterator',

            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments);

                var authorization = this.model.toJSON();
                var deferred = new $.Deferred();
                var self = this;
                this.model.set("currentSectionId", "AuthSelection");
                this.model.set("currentSectionStatus", "complete");
                this.model.set("nextStepId",this.model.get("caseFileId"));

                var authSelectionModel = new AuthSelectionModel({
                    id: authorization.authorizationCn
                    /*id: '59293BE065F8E5FEE054020820266933'*/
                });

                this.authUses = [];

                authSelectionModel.fetch({
                    success: function(model, resp, options){

                        var tabNames = ['Authority Selection']
                        config.controls = [
                            {
                                type: 'common/soloTabSummaryHeader',
                                screenName: {
                                    tabNames: tabNames
                                }
                            }, {
                                id: "screenContentControl",
                                type: 'common/screenContentControls',
                                controls: self.getTabHeadingAndSectionsControls(resp),
                            }
                        ]
                        deferred.resolve(config);
                        console.log(config.controls);
                    },
                    error: function(model, resp, options){
                        deferred.reject()
                    }
                });



                return deferred.promise();
            },

            getTabHeadingAndSectionsControls: function (listOfListOfUseAttributeDto) {
                var tabHeadingAndSectionsControls = [];
                var listOfUseAttributeDto;

                for(var i =0; i<listOfListOfUseAttributeDto.length; i++){
                    listOfUseAttributeDto = listOfListOfUseAttributeDto[i];
                    tabHeadingAndSectionsControls[i] = {
                        id: "tabHeadingAndSections" + i,
                        tabHeading: this.getTabHeading(i, listOfUseAttributeDto[0].useCode, listOfUseAttributeDto[0].useName),
                        type: 'authoritySelection/tabHeadingAndSections',
                        sectionWrap: false,
                        sectionLabel: 'Authorities',
                        items:  this.getBadgeCardsControls(listOfUseAttributeDto,i)
                    };
                }

                return tabHeadingAndSectionsControls;
            },

            getBadgeCardsControls: function(listOfUseAttributeDto,i){
                var badgeCardControls = [];
                badgeCardControls[0] = {
                    id: "badgeCards" + i,
                    type: 'authoritySelection/badge-cards',
                    sectionWrap: true,
                    items: this.getAuthCardControls(listOfUseAttributeDto)
                };

                return badgeCardControls;
            },

            getAuthCardControls: function(listOfUseAttributeDto){
                var authCardControls = [];
                var eachUseAttributeDto;

                for(var j=0; j<listOfUseAttributeDto.length; j++){
                    eachUseAttributeDto = listOfUseAttributeDto[j];

                    authCardControls[j] = {
                        "id": "authorityCard" + j,
                        "type": "authoritySelection/authorityCard",
                        "authorityName": eachUseAttributeDto.authName,
                        "useAttributeCn": eachUseAttributeDto.useAttributeCn,
                        "useCode": eachUseAttributeDto.useCode,
                        "isPrimary": true,
                        "primarySecondaryInd": eachUseAttributeDto.primaryOrSecondaryInd,
                        "items": [
                            {
                                "id": "infoBlock1",
                                "type": "authoritySelection/auth-info-block",
                                "label": "Type",
                                "value": eachUseAttributeDto.authType
                            },
                            {
                                "id": "infoBlock2",
                                "type": "authoritySelection/auth-info-block",
                                "label": "MAX TERM",
                                "value": eachUseAttributeDto.maxTerm
                            },
                            {
                                "id": "infoBlock3",
                                "type": "authoritySelection/auth-info-block",
                                "label": "TEMPLATE",
                                "value": eachUseAttributeDto.template
                            }
                        ]
                    }
                }

                return authCardControls;
            },

            getTabHeading: function(index, useCode, useName){
                var tabHeading;

                if(index == 0){
                    tabHeading = 'PRIMARY USE CODE: ';
                }else{
                    tabHeading = 'SECONDARY USE CODE: ';
                }

                tabHeading += useCode + ' - ' + useName;

                return tabHeading;
            },

            events: {
                'click .authorityCard': 'toggleAuthority'

            },

            toggleAuthority: function(event){
                var $target = $(event.target),
                    $authorityCard = $target.closest(".authorityCard"),
                    useAttributeCn = $authorityCard.attr("data-use-attribute-cn"),
                    useCode = $authorityCard.attr("data-use-code");

                
                var authUses = this.authUses;

                if ($authorityCard.hasClass("selected")){ // come back to deleting later
                     //combe back
                }else if (authUses){
                    var authUseToBeEdited = _.find(authUses, function(eachAuthUse){
                        return eachAuthUse.code === useCode;
                    })

                    if (authUseToBeEdited){
                        authUseToBeEdited.useAttribute = useAttributeCn;
                    }

                };

                this.authUses = authUses;
                this.model.set("authorizationUseCodes",authUses);
                $authorityCard.toggleClass('selected');
            },

            removeFromToBeDeletedAuthUseAttributes: function(selectedUseAttributeCn){
                var deletedAuthUseAttributes = this.model.get("deletedAuthUseAttributes");
                if(deletedAuthUseAttributes && deletedAuthUseAttributes.length){
                    deletedAuthUseAttributes = deletedAuthUseAttributes.filter(function(item){
                       return item !== selectedUseAttributeCn
                    });

                    this.model.set("deletedAuthUseAttributes", deletedAuthUseAttributes);
                }
            },

            addIntoToBeDeletedAuthUseAttributes: function (deSelectedUseAttributeCn) {
                var deletedAuthUseAttributes = this.model.get("deletedAuthUseAttributes");
                if(!(deletedAuthUseAttributes && deletedAuthUseAttributes.length)){
                    deletedAuthUseAttributes = [];
                }

                var toBeDeletedAuthUseAttribute;
                var eachAuthUse;
                for(var i in this.authUses){
                    eachAuthUse = this.authUses[i];
                    if(deSelectedUseAttributeCn === eachAuthUse.useAttributesTbl){
                        toBeDeletedAuthUseAttribute = eachAuthUse.authUseAttributeCn;
                        break;
                    }
                }

                if(toBeDeletedAuthUseAttribute){
                    deletedAuthUseAttributes.push(toBeDeletedAuthUseAttribute);
                }

                this.model.set("deletedAuthUseAttributes", deletedAuthUseAttributes);
            },

            modelEvents: {

            },

            render: function () {

                // this.model.set('uiAttributeOrder2',this.model.get('uiAttributeOrder18'));
                return PanelView.prototype.render.apply(this, arguments);


            },


            /**
             * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
             * @returns {undefined}
             */
            startListening: function () {
                PanelView.prototype.startListening.apply(this, arguments);


                this.listenTo(this, {
                    'renderComplete': function () {
                        // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                        // to occur after view is added to the page, which is why we have to use the renderComplete event
                        // instead of calling it from the render function

                        this.autoSelectPriorSelectedAuthCards();
                        this.rendered = true;
                    }
                });

            },

            autoSelectPriorSelectedAuthCards: function(){

                var authorization  = this.model.toJSON();

                var getTableRecordByAuthAndChildId = new GetTableRecordByAuthAndProp({
                    authCn :authorization.authorizationCn,
                    property : "authorizationUseCodes"
                });

               var self = this;

                getTableRecordByAuthAndChildId.fetch({
                    success: _.bind(function (model, resp, options) {

                        if (resp && resp.length){
                            self.authUses = resp;

                            self.selectCard(resp, self);
                        }
                    }, this),
                    error: function (model, resp, options) {

                    }
                });
            },

            selectCard: function(authUses, self){
                var isThisCardToBeSelected = false;

                $('.authorityCard').each(function(index,eachAuthCard) {
                    var eachUseAttributeCn = $(eachAuthCard).attr('data-use-attribute-cn');

                    $(authUses).each(function(idx, eachAuthUse){
                        var eachAuthUseAttribute =  eachAuthUse.useAttribute;

                        if(eachAuthUseAttribute && (eachAuthUseAttribute === eachUseAttributeCn)){
                            isThisCardToBeSelected = true;
                        }
                    });

                    if(isThisCardToBeSelected){
                       $(eachAuthCard).addClass("selected");
                    }

                    isThisCardToBeSelected = false;
                });
            }

        });
    });