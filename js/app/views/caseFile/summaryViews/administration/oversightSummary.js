define(['app/views/panelView',
    "jquery",
    "nrm-ui",
    'underscore',
    'app/views/caseFile/summaryViews/basicInfoSummaryView'], function (PanelView, $, Nrm, _, BasicInfoSummaryView) {
    return BasicInfoSummaryView.extend({

        genericTemplate : "caseFile/summarySections/administration/oversight",

        events: {
            'click .editDataPointLink' : "editDataPoint",
            'click .sudsPillActionLink' : 'editDataPoint'
            },

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);
            config.controls = []

            var authorization = this.model.toJSON();


            config.controls= [{
                id:"badgeCards1",
                summariesClass : true,
                type : "caseFile/util/badgeCardCollection",
                controls : [
                    {
                    id:"authorizedOfficer",
                    isActive : true,
                    cardType :'user',
                    cardLabel : "Authorized Officer",
                    editLabel :'Enter',
                   /* editIcon : 'glyphicon glyphicon-cloud-upload',*/
                    items : [this.populateAOPillMessageCtrls(authorization,"user")],
                    type : 'caseFile/util/badgeCard'
                  },
                    {
                        id:"issueDate",
                        isActive :true,
                        cardType :'dates',
                        cardLabel : "Issue Date",
                        editLabel :'Enter',
                        items : [this.populateAOPillMessageCtrls(authorization,"date")],
                        type : 'caseFile/util/badgeCard'
                    }]

            },{
                id:"badgeCards2",
                summariesClass : true,
                type : "caseFile/util/badgeCardCollection",
                controls : [{
                    id:"authUploadCard",
                    badgeCardClasses:'authUploadCard',
                    editLabel :'Upload',
                    editIcon : 'glyphicon glyphicon-cloud-upload',
                    isActive :true,
                    cardType :'upload',
                    cardLabel : "Upload Signed Authorization",
                    items : [{
                        id: "issueDateNamePill",
                        type:'caseFile/util/sudsPillMessage',
                        sudsPillIconClass : 'fa fa-cloud-upload',
                        actionLinkId : 'uploadSignedDoc',
                        sudsPillMessageText :"Upload the signed Authorization",
                        actionLinkWord : 'Upload Now.',
                    }],
                    type : 'caseFile/util/badgeCard'
                }]

            }]


            return config;
        },

        populateAOPillMessageCtrls : function (authorization, cardType) {

            var tempPillMessAttrs = $.extend({},this.sudsPillWarningMessAttr());


            var aoPillMessageCtrl = {
                id: "authorizedOfficerPill",
                type:'caseFile/util/sudsPillMessage',
            }

            if (cardType == "user"){

                if (authorization.aoFirstName || authorization.aoLastName){

                    tempPillMessAttrs= $.extend({},this.sudsPillSuccessMessAttr(), {
                        sudsPillMessageText : (authorization.aoLastName + "," + authorization.aoFirstName + "(" + "chief"/*authorization.aoTitle*/ + ")") //come back to this)
                    })
                }else{

                    tempPillMessAttrs = $.extend({},this.sudsPillWarningMessAttr(),{
                        sudsPillMessageTextClass : 'noAOName',
                        sudsPillMessageText :"No AO has been entered.",
                        actionLinkId : 'AOEnter',
                        actionLinkWord : 'Enter Now.',
                    });
                }

            }else if (cardType == "date"){

                if (authorization.issuedDate){

                    tempPillMessAttrs= $.extend({},this.sudsPillSuccessMessAttr(), {
                        sudsPillMessageText : authorization.issuedDate
                    })
                }else{

                    tempPillMessAttrs = $.extend({},this.sudsPillWarningMessAttr(),{
                        sudsPillMessageTextClass : 'noAOName',
                        sudsPillMessageText :"No issue date has been entered.",
                        actionLinkId : 'IssueDate',
                        actionLinkWord : 'Enter Now.',
                    });
                }

            }


            return $.extend({},aoPillMessageCtrl,tempPillMessAttrs);
        },

        sudsPillSuccessMessAttr : function () {

            var tempPillMessAttrs = {
                messageTypeClass : 'sudsPill_success',
                sudsPillIconClass : 'fa fa-check',
                sudsPillMessageTextClass : "",
                sudsPillMessageText :"",
                actionLinkId : '',
                actionLinkWord : 'Enter Now.',
            }

            return tempPillMessAttrs;
        },

        sudsPillWarningMessAttr : function () {
            var tempPillMessAttrs = {
                messageTypeClass : 'sudsPill_warning',
                sudsPillIconClass : 'fa fa-exclamation-triangle',
                sudsPillMessageTextClass : "",
                sudsPillMessageText :"",
                actionLinkId : '',
                actionLinkWord : 'Enter Now.',
            };

            return tempPillMessAttrs;
        },
        editDataPoint : function (event) {

            var $target = $(event.target)
            var caption = $target.closest('.badgeCard').find('.badgeCardLabel').text().trim(),
                cardType = $target.closest('.badgeCard').attr("data-card-type");

            this.model.set("currentSectionId", "AuthInfoSummary");
            this.model.set("currentSectionStatus", "Complete");

            this.editDataPointModal(caption, cardType)


        },

        editDataPointModal : function (caption,cardType) {
            var args = Array.prototype.slice.call(arguments);
            args[0] = caption;
            args[1] = cardType;

            return  BasicInfoSummaryView.prototype.editDataPointModal.apply(this,args);
        },

        getControls : function (dataPointType) {
            var controls = [];

            switch (dataPointType){

                case "user":

                    var data = [{
                        id : 'cheifId',
                        text : "Chief"
                    },{
                        id : 'associateChiefId',
                        text : "Associate Chief"
                    },{
                        id : 'deputyChiefId',
                        text : "Deputy Chief"
                    }]

                    controls = [
                        {
                            "type": "inputText",
                            "id": "lastName",
                            "nameAttr": "lastName",
                            "prop": "aoLastName",
                            "title": "AO Last Name",
                            "label": "Last Name",
                            "required": true,
                            /*"nested" : "object1",
                             dataType : "object",*/
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
                            "prop": "aoTitle",
                            "title": "AO Title",
                            "label": "AO Title",
                            "required": true,
                            options : data,
                            /*"nested" : "object1",
                             dataType : "object",*/
                            className: 'suds-input'
                            /*"group" : true*/
                        },
                    ]
                    break;

                case "dates":

                    controls = [
                        {
                            "type": "inputDate",
                            "id": "issueDateCalendar",
                            "nameAttr": "issueDateCalendar",
                            "prop": "issuedDate",
                            "title": "Issue Date",
                            "label": "Issue Date",
                            "required": true,
                            /*"nested" : "object1",
                             dataType : "object",*/
                            className: 'suds-input'
                            /*"group" : true*/,

                        }
                    ]
                    break;

                case "upload" :

                    controls = [
                        {
                            "type": "caseFile/util/fileUpload",
                            "id": "signedDoc",
                            "nameAttr": "signedDoc",
                            "prop": "issueDate",
                            "title": "Signed Doc",
                            "label": "Signed Doc",
                            "required": true,
                            className: 'suds-input',
                            fileUpload : true
                        }
                    ]
                    break;
                default :
                    break;


            }

            return controls;
        },


        editDataModalCallback : function(modal,editDataModalView,authorizationModel) {

            BasicInfoSummaryView.prototype.editDataModalCallback.apply(this,arguments);
            console.log("redirect to next case file");
        }
    });
});