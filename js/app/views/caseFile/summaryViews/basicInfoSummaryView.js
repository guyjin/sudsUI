define(['../../panelView',
    "jquery",
    "nrm-ui",
    'underscore',
    'app/views/common/editDataModalView'], function (PanelView, $, Nrm, _, EditDataModalView) {
    return PanelView.extend({

        genericTemplate : "caseFile/summarySections/basicInfoSummary",
        events: {}, //We need this because PanelView is missing elements normally present in the EditorView

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);

            config.controls = []

            var authorization = this.model.toJSON(),
                basicInfoSummaryData = [
                    "",
                    "Activity Dates",
                    "NFS Roads & Right-of-ways",
                    "Use of NFS Lands",
                    "Entry Fee / Service Charge",
                    "Participants",
                    "NFS Facilities",
                    "Location of Activity",
                    "Description of Activity",
                    "Proponent Type"
                ];

            var participantsAndSpecBlock = this.getTextForParticipantsAndSpectatorsSummaryBlock(authorization);
            var roadsAndRightOfWayBlock  = this.populateRoadsBadgeCardDataText(authorization);

            config.controls= [{
               id:"activityDates",
                isActive :true,
                cardType :'dates',
                cardLabel : basicInfoSummaryData["1"],
                items : [{
                   type: 'caseFile/util/activityDatesBadgeCardDataText',
                    badgeCardDataText : {
                        proposalRecDate : authorization.proposalReceivedDate,
                        activityBeginDate : authorization.useStartDate,
                        activityEndDate : authorization.useEndDate
                    },
                }],
                type : 'caseFile/util/badgeCard'
            },/*{
                id:"proponentType",
                isActive :(authorization.proponentTypeObj ? authorization.proponentTypeObj.name : false),
                cardType :'proponentType',
                cardLabel : basicInfoSummaryData["9"],
                items : [{
                    badgeCardDataText : (authorization.proponentTypeObj ?  authorization.proponentTypeObj.name : 'None Selected'),
                }],
                type : 'caseFile/util/badgeCard'
            },*/{
                id:"roadsId",//come back to this
                isActive :(authorization.plannedUseOfFsRoadRowInd ? true : false),
                cardType :'roads',
                cardLabel : basicInfoSummaryData["2"],
                items : [{
                    type : 'caseFile/util/roadsAndRightOfWayBadgeCardDataText',
                    simpleBadgeBlock : {
                        dataPoint : (authorization.plannedUseOfFsRoadRowInd == "Y" ? "Y" :"N"),
                        dataPointLabel : ''
                    },
                    badgeCardDataText : roadsAndRightOfWayBlock
            ,
                }],
                type : 'caseFile/util/badgeCard'
            },{
                id:"landsId",
                isActive :(authorization.whyOnPublicLands ? true : false),
                cardType :'lands',
                cardLabel : basicInfoSummaryData["3"],
                items : [{
                    badgeCardDataText : (authorization.whyOnPublicLands ? authorization.whyOnPublicLands : 'None Specified'),
                }],
                type : 'caseFile/util/badgeCard'
            },{
                id:"feeId",
                isActive :(authorization.feeChargedInd == "Y" ? true : false),
                cardType :'fee',
                cardLabel : basicInfoSummaryData["4"],
                items : [{
                    simpleBadgeBlock : {
                        dataPoint : (authorization.feeChargedInd == "Y" ?"Y" : "N"),//come back to this this is y/n value need to number
                        dataPointLabel : ''
                    },
                    badgeCardDataText : (authorization.feeChargedInd == "Y" ? "This activity includes charging for an entry or participation fee, or selling a good or service." : 'None Specified'),
                }],
                type : 'caseFile/util/badgeCard'
            },{
                id:"participantsId",
                isActive : (participantsAndSpecBlock.dataPointLabel ? true : false),
                cardType :'participants',
                cardLabel : basicInfoSummaryData["5"],
                items : [{
                    simpleBadgeBlock : {
                        dataPoint : (participantsAndSpecBlock.dataPointLabel ? participantsAndSpecBlock.dataPointLabel : "N"),
                        dataPointLabel : ''
                    },
                    badgeCardDataText : (participantsAndSpecBlock.dataBlockText ? participantsAndSpecBlock.dataBlockText : 'None Specified '),
                }],
                type : 'caseFile/util/badgeCard'
            },{
                id:"facilityId",
                isActive :(authorization.describeUseOfFsFacility ? true : false),
                cardType :'facility',
                cardLabel : basicInfoSummaryData["6"],
                items : [{
                    simpleBadgeBlock : {
                        dataPoint : (authorization.describeUseOfFsFacility ? "Y" : "N"),//come back to this this is y/n value need to number
                        dataPointLabel : ''
                    },
                    badgeCardDataText : (authorization.describeUseOfFsFacility ? authorization.describeUseOfFsFacility : 'None Specified'),
                }],
                type : 'caseFile/util/badgeCard'
            },{
                id:"locationId",
                isActive :(authorization.whereActivityConducted ? true : false),
                cardType :'location',
                cardLabel : basicInfoSummaryData["7"],
                items : [{
                    badgeCardDataText :  (authorization.whereActivityConducted ? authorization.whereActivityConducted : 'None Specified'),

                }],
                type : 'caseFile/util/badgeCard'
            },{
                id:"descriptionId",
                isActive :(authorization.purpose ? true : false),
                cardType :'description',
                cardLabel : basicInfoSummaryData["8"],
                items : [{
                    badgeCardDataText : (authorization.purpose ? authorization.purpose : 'None Specified'),
                }],
                type : 'caseFile/util/badgeCard'
            }]

            return config;
        },

        populateRoadsBadgeCardDataText : function (authorization) {

            var rightOfWaySummaryText = "The NFS road or utilities right of way, has the following dimensions: ",
                length = authorization.rightOfWayLength,
                width = authorization.rightOfWayWidth,
                miles = authorization.rightOfWayMiles;

            var dataTextBlock = {
                nationalForestRoadsUsed : null,
                rightOfWayText : null
            };

            if (authorization.plannedUseOfFsRoadRowInd
                && authorization.plannedUseOfFsRoadRowInd === "Y"
                && authorization.nationalForestRoadsUsed){
                dataTextBlock.nationalForestRoadsUsed = authorization.nationalForestRoadsUsed;
            }

            if (length || width || miles){

                if(width){
                    rightOfWaySummaryText += "   " + width + " feet/width " + (length ? "by ": "")
                }

                if(length){
                    rightOfWaySummaryText +=  "   " +  length + "  feet/length"
                }

                if(miles){
                    rightOfWaySummaryText += ", or   " + miles + " linear miles. "
                }
                dataTextBlock.rightOfWayText = rightOfWaySummaryText;
            }


            return dataTextBlock;
        },

        getTextForParticipantsAndSpectatorsSummaryBlock : function (authorization) {

            var obj = {
                dataPointLabel: false,
                dataBlockText : false
            };
            if (authorization.nbrParticipants &&  authorization.nbrSpectators){
                obj.dataPointLabel =  authorization.nbrParticipants + "/" + authorization.nbrSpectators;
                obj.dataBlockText = "Approximately, " + authorization.nbrParticipants + " participant(s) and "  + authorization.nbrSpectators + " spectator(s) are involved in the activity. "
            }else if (authorization.nbrParticipants &&  !authorization.nbrSpectators){
                obj.dataPointLabel =  authorization.nbrParticipants;
                obj.dataBlockText = "Approximately, " + authorization.nbrParticipants + " participant(s) are involved in the activity. "
            }else if (!authorization.nbrParticipants &&  authorization.nbrSpectators){
                obj.dataPointLabel =  authorization.nbrSpectators;
                obj.dataBlockText = "Approximately, " + authorization.nbrSpectators + " spectator(s) are involved in the activity. "
            }
            return obj;
        },



        events : {
            'click .editDataPointLink' : "editDataPoint",
        },

        editDataPoint : function (event) {

            event.preventDefault();

            var authorizationModel = this.model;
            var caption = $(event.target).closest('.badgeCardHeader').find('.badgeCardLabel').text().trim(),
                cardType = $(event.target).closest('.badgeCard').attr("data-card-type");

            var self = this;
            this.editDataPointModal(caption,cardType);

            this.model.set("currentSectionId", "BasicInfo");
            this.model.set("currentSectionStatus", "Complete");



        },

        editDataPointModal : function (caption,cardType) {

            var authorizationModel = this.model;

            var options = {
                model: this.model,
                modalOptions : {
                    title : caption
                },
                controls : this.getControls(cardType)
            };
            var editDataModalView = new EditDataModalView(options);

            Nrm.event.trigger("app:modal", {
                caption: caption,
                modalId: 'editDataPointModal',
                view: editDataModalView,
                backdrop: "static",
                animate : true,
                /* events:  { 'click #saveAndContinue': 'close' },*/
                callback: _.bind(function(modal){
                    this.editDataModalCallback(modal,editDataModalView,authorizationModel)
                },this)
            });
        },

        editDataModalCallback : function(modal,editDataModalView,authorizationModel) {

            if (editDataModalView && editDataModalView.saveBtnSuccessClicked){

                if (authorizationModel){
                    authorizationModel.set('currentSectionId',authorizationModel.get('caseFileId'));
                }

                this.trigger("reloadSummaryView");
            }


        },
        getControls : function (dataPointType) {
            var controls = [];

            switch (dataPointType){

                case "dates":
                   controls = [
                       {
                       "type": "inputDate",
                       "id": "proposalReceivedDate",
                       "nameAttr": "proposalReceivedDate",
                       "prop": "proposalReceivedDate",
                       "title": "Proposal Received Date (MM/DD/YYYY)",
                       "label": "Received Date",
                       "required": true,
                       /*"nested" : "object1",
                        dataType : "object",*/
                       className: 'suds-input'
                       /*"group" : true*/
                   },
                       {
                       "type": "inputDate",
                       "id": "useStartDate",
                       "nameAttr": "useStartDate",
                       "prop": "useStartDate",
                       "title": "Use Start date (MM/DD/YYYY)",
                       "label": "Activity Start Date",
                       /*"nested" : "object2",
                        dataType : "object",*/
                       "required": true,
                       className: 'suds-input'
                       /*"group" : true*/
                   },
                       {
                       "type": "inputDate",
                       "id": "useEndDate",
                       "nameAttr": "useEndDate",
                       "prop": "useEndDate",
                       "label": "Activity End Date",
                       "title": "End Date (MM/DD/YYYY)",
                       "grid": "col-md-3 col-sm-12",
                       "required": true
                       /*"group" : true*/

                   }
                   ]
                    break;
                case "roads":
                    controls = [
                        {
                            id: 'usingRoads',
                            nameAttr: 'usingRoads',
                            sectionLabel: 'Road Use',
                            prop: 'planningTo',
                            type: 'common/yesAndNoQues',
                            question: 'Is the proponent planning to use a Forest Service road or utilities right of way?',
                            yOrN: true
                        },
                        {
                            id: 'whichForestRoadsContainer',
                            sectionLabel: 'Specify Roads',
                            isMarginTop : true,
                            type: 'basicInfo/questionControl',
                            items: [{
                                type: 'textArea',
                                "id": "whichForestRoads",
                                "nameAttr": "whichForestRoads",
                                "prop": "nationalForestRoadsUsed",
                                "label": "If yes, which NFS roads?",
                                "title": "Which National Forest roads will you be using?",
                                "rows": 3,
                                "maxlength": 250
                            }],

                            hint : 'Hint: Describe road as NFS road, road number, and/or common name of road.'
                        },
                        {
                            id: 'activityNecessityContainer',
                            fullSection: true,
                            sectionLabel: 'Right of Way Dimensions',
                            type: 'basicInfo/multipleInputsQuestion',
                            label: 'Enter the dimensions of the right of way in Feet.',
                            items: [{
                                type: 'inputNum',
                                "id": "rightOfWayFeetWidth",
                                "nameAttr": "rightOfWayFeetWidth",
                                "prop": "rightOfWayWidth",
                                "label": "Width",
                                className: 'suds-input'
                            }, {
                                type: 'inputNum',
                                "id": "rightOfWayFeetLength",
                                "nameAttr": "rightOfWayFeetLength",
                                "prop": "rightOfWayLength",
                                "label": " x Length",
                                className: 'suds-input',
                                "style": {
                                    "margin-top": "10px"
                                }
                            }]
                        }

                    ]
                    break;
                case "lands" :
                   controls = [
                       {
                           id: 'activityNecessityContainer',
                           fullSection: true,
                           sectionLabel: 'Need',
                           type: 'basicInfo/questionControl',
                           items: [{
                               type: 'textArea',
                               "id": "activityNecessity",
                               "nameAttr": "activityNecessity",
                               "prop": "whyOnPublicLands",
                               "label": " Necessity of Using NFS Lands? (4000 characters)",
                               "title": " Necessity of Using NFS Lands",
                               "rows": 10,
                               "maxlength": 4000
                           }],
                           hint: 'HINT: Provide a summary that explains why this use cannot ' +
                           'take place in another location, such as "I want my apiary/bees to benefit from the ' +
                           'fireweed that is currently growing on the designated burn area.' +
                           'Fireweed is extremely scarce this year outside of the NFS site I selected."'
                       }
                   ]
                    break;
                case "fee" :
                    controls = [ {
                        id: 'isFeeCharged',
                        nameAttr: 'isFeeCharged',
                        sectionLabel: 'Fee Charged',
                        prop: 'isFeeCharged',
                        type: 'common/yesAndNoQues',
                        question: 'Is there an entry or participation fee charged, ' +
                        'or the sale of a good or service, regardless ' +
                        'whether the activity is intended to produce a profit? ',
                        yOrN: true
                    }]
                    break;
                case "participants" :
                    controls = [{
                        id: 'participantsContainer',
                        fullSection: true,
                        sectionLabel: 'Multiple Participants',
                        type: 'basicInfo/multipleInputsQuestion',
                        label: 'Approximately, how many participants and/or spectators are involved in the event? ',
                        items: [{
                            type: 'inputNum',
                            "id": "participants",
                            "nameAttr": "participants",
                            "prop": "nbrParticipants",
                            "label": "Participants",
                            className: 'suds-input',
                            style: {
                                'width': 'auto',
                                'height': 'auto'
                            }
                        }, {
                            type: 'inputNum',
                            "id": "spectators",
                            "nameAttr": "spectators",
                            "prop": "nbrSpectators",
                            "label": "Spectators",
                            className: 'suds-input',
                            "style": {
                                "margin-top": "10px"
                            }
                        }]
                    }]
                    break;
                case "facility" :
                    controls = [
                        {
                        id: 'nfsFacilityQues',
                        nameAttr: 'nfsFacilityQues',
                        sectionLabel: 'Road Use',
                        prop: 'nfsFacility',
                        type: 'common/yesAndNoQues',
                        question: 'Is the proponent requesting to use a NFS Facility?',
                        yOrN: true
                    },
                        {
                            id: 'activityUseFSFacilityContainer',
                            isMarginTop : true,
                            sectionLabel: 'NFS Facility',
                            type: 'basicInfo/questionControl',
                            "style": {
                                "margin-top": "10px"
                            },
                            items: [{
                                type: 'textArea',
                                "id": "activityUseFSFacility",
                                "nameAttr": "activityUseFSFacility",
                                "prop": "describeUseOfFsFacility",
                                "label": "If yes, please explain. (4000 characters)",
                                "title": "This could include use of a campground, boat launch area, pavilion, etc.",
                                "rows": 10,
                                "maxlength": 4000
                            }],
                            hint: 'HINT: This could include use of a campground, boat launch area, pavilion, etc.'
                        }]
                    break;
                case "location" :
                    controls = [
                        {
                        id: 'activityLocationContainer',
                        sectionLabel: 'Where to be Conducted',
                        type: 'basicInfo/questionControl',
                        items: [{
                            type: 'textArea',
                            "id": "activityLocation",
                            "nameAttr": "activityLocation",
                            "prop": "whereActivityConducted",
                            "label": "Where will the activity be conducted? (4000 characters)",
                            "title": "Where will the activity be conducted",
                            "rows": 10,
                            "maxlength": 4000
                        }],
                        hint: 'HINT: This could include specific mile markers or lakes, landmarks. Township/Section/Range, Forest/District, and adjacent road, etc.'
                    }]
                    break;
                case "description" :
                    controls = [  {
                        id: 'activityDescriptionContainer',
                        sectionLabel: 'Reason',
                        type: 'basicInfo/questionControl',
                        items: [{
                            type: 'textArea',
                            "id": "activityDescription",
                            "nameAttr": "activityDescription",
                            "prop": "purpose",
                            "label": "Reason/Purpose for Use? (4000 characters)",
                            "title": "Reason/Purpose for Use",
                            "rows": 10,
                            "maxlength": 4000
                        }],
                        hint: 'HINT: Provide a summary description of the proposed activity,' +
                        ' such as "Using 6 NFS trees as tailholds associated with the Snoopy Timber Sale owned by Roseberg Forest Products.'
                    }]
                    break;
                /*case "proponentType" :
                    controls = [  {
                        "type": "select",
                        "id": "typeOfProponent",
                        "prop": "proponentTypesTbl",
                        "nameAttr": "typeOfProponent",
                        "title": "Select Type of proponent",
                        "label": "Type Of Proponent",
                        /!*"grid" : "col-md-3 col-sm-12",*!/
                        /!* className :'suds-select',*!/
                        /!*"options" : proponentTypes,*!/
                        "lov": "lov/proponentTypes",
                        "placeholder": "Select Type Of Proponent",
                        "required": true
                    }]
                    break;*/
                default :
                    break;


            }

            return controls;
        },

        render: function () {

            return PanelView.prototype.render.apply(this, arguments);
        },

        startListening: function () {
            //PanelView.prototype.startListening.apply(this, arguments);

            PanelView.prototype.startListening.apply(this,arguments);

            this.listenTo(this, {
                'renderComplete': function () {
                    this.$el.find('.badgeCard').each(function(){

                        var cardType = $(this).data('card-type');
                        if(cardType === 'participants'){
                            var simpleBadgeBlock = $(this).find('.simpleBadgeBlock');
                            simpleBadgeBlock.css({
                                'width': 'auto'
                            });

                            var width = simpleBadgeBlock.width();
                            if(width < 75){
                                simpleBadgeBlock.css({
                                    'width': 75,
                                    'height': 75
                                })
                            }else{
                                simpleBadgeBlock.css({
                                    'height': width + 20
                                })
                            }
                        }
                    })

                }
            });

        }


    });
});