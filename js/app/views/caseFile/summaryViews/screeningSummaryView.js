define(['../../panelView',
    "jquery",
    "nrm-ui",
    'underscore',
    'nrm-ui/views/reportLauncherView',
    "app/models/reportInfoModel"], function (PanelView, $, Nrm, _, ReportLauncherView, ReportInfoModel) {
    return PanelView.extend({

        genericTemplate : "caseFile/summarySections/testScreeningSummary",

        events: {}, //We need this because PanelView is missing elements normally present in the EditorView

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments),authorization = this.model.toJSON();
            var summaryType = config.summaryType;

            config.controls = []

            if(summaryType == 'authNeeded'){
                var authRequireCond = authorization.authRequired && authorization.authRequired == "Y";
                config.displayAoApproval = false;
                config.controls= [{
                    id:"screening1Summary",
                    type : 'caseFile/summarySections/yesOrNoSummary',
                    cardTitle: "Is a Permit Needed?",
                    isYes: (authRequireCond ? true :false),
                    yesOrNo: (authRequireCond ? "YES" :"NO"),
                    mainInfo: (authRequireCond ? "A Permit is REQUIRED" :"A Permit is NOT REQUIRED"),
                }]
            }else if (summaryType == 'screen1And2'){

                config.displayAoApproval = true;

                config.controls= [];

                if (authorization.screening1Passed){
                    var screening1Cond = authorization.screening1Passed && authorization.screening1Passed == "Y";
                    config.controls.push({
                        id:"screening1Summary",
                        type : 'caseFile/summarySections/yesOrNoSummary',
                        cardTitle: "Initial Screening",
                        isYes: (screening1Cond ? true :false),
                        yesOrNo: (screening1Cond ? "YES" :"NO"),
                        mainInfo: (screening1Cond ? "Initial Screening PASSED" :"Initial Screening FAILED"),
                    })
                }

                if (authorization.screening2Passed){
                    var screening2Cond = authorization.screening2Passed && authorization.screening2Passed == "Y";

                    config.controls.push({
                        id:"screening2Summary",
                        type : 'caseFile/summarySections/yesOrNoSummary',
                        cardTitle: "Secondary Screening",
                        isYes: (screening2Cond ? true :false),
                        yesOrNo: (screening2Cond? "YES" :"NO"),
                        mainInfo: (screening2Cond ? "Secondary Screening PASSED" :"Secondary Screening FAILED"),
                    })
                }

            }

            return config;
        },


        render: function () {

            return PanelView.prototype.render.apply(this, arguments);

        }


    });
});