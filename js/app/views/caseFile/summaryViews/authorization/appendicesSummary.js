define(['app/views/panelView',
    "jquery",
    "nrm-ui",
    'underscore',
    'app/views/caseFile/summaryViews/basicInfoSummaryView'], function (PanelView, $, Nrm, _, BasicInfoSummaryView) {
    return BasicInfoSummaryView.extend({

        genericTemplate : "common/ctrlsIterator",

        events: {
            'click .editDataPointLink' : "editDataPoint"
        },

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);

            config.controls = []

            var authorization = this.model.toJSON();

            config.controls= [{
                id: "authorizedOfficerPill",
                type:'caseFile/util/sudsPillMessage',
                //messageTypeClass : 'sudsPill_warning',
                sudsPillIconClass : 'fa fa-exclamation-triangle',
                sudsPillMessageTextClass : 'noAOName',
                sudsPillMessageText :"No appendices have been uploaded.",
                actionLinkWord : 'Upload Now',
            },{
                id: "pillDocument1",
                type:'caseFile/util/sudsPillMessage',
                messageTypeClass : 'sudsPillDocument sudsPill_primary',
                sudsPillIconClass : 'fa fa-file-word-o',
                //sudsPillMessageTextClass : 'noAOName',
                //sudsPillMessageText :"No documents have been uploaded.",
                actionLinkWord : 'File Name.docx',
            }]


            return config;
        },

        editDataPoint : function (event) {

            BasicInfoSummaryView.prototype.editDataPoint.apply(this,arguments)

            this.model.set("currentSectionId", "AuthInfoSummary");
            this.model.set("currentSectionStatus", "Complete");


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
                case "proponentType" :
                    controls = [  {
                        "type": "select",
                        "id": "typeOfProponent",
                        "prop": "proponentTypesTbl",
                        "nameAttr": "typeOfProponent",
                        "title": "Select Type of proponent",
                        "label": "Type Of Proponent",
                        /*"grid" : "col-md-3 col-sm-12",*/
                        /* className :'suds-select',*/
                        /*"options" : proponentTypes,*/
                        "lov": "lov/proponentTypes",
                        "placeholder": "Select Type Of Proponent",
                        "required": true
                    }]
                    break;
                default :
                    break;


            }

            return controls;
        },

    });
});