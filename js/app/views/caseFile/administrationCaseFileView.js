define(['../caseFileView',
    "jquery",
    "nrm-ui",
    'underscore','app/views/caseFile/proposalCaseFileView'], function (CaseFileView, $, Nrm, _, ProposalCaseFileView) {
    return CaseFileView.extend({


        getConfig: function () {

            var sectionInfoDtos = {

                "sectionInfoDtos": [
                    {
                        "sectionId": "Insurance",
                        "sectionName": "Insurance",
                        "displayOrder": 1,
                        "optionalOrRequiredInd": "R",
                        "sectionStatus": "Complete",
                        "preReqSectionCodes": []
                    },
                    {
                        "sectionId": "Bonding",
                        "sectionName": "Bonding",
                        "displayOrder": 2,
                        "optionalOrRequiredInd": "R",
                        "sectionStatus": "Complete",
                        "preReqSectionCodes": []
                    },
                    {
                        "sectionId": "Licenses",
                        "sectionName": "Licenses",
                        "displayOrder": 3,
                        "optionalOrRequiredInd": "R",
                        "sectionStatus": "Complete",
                        "preReqSectionCodes": []
                    },
                    {
                        "sectionId": "Oversight",
                        "sectionName": "Oversight",
                        "displayOrder": 4,
                        "optionalOrRequiredInd": "R",
                        "sectionStatus": "Complete",
                        "preReqSectionCodes": []
                    },
                    {
                        "sectionId": "Amendments",
                        "sectionName": "Amendments",
                        "displayOrder": 5,
                        "optionalOrRequiredInd": "R",
                        "sectionStatus": "Complete",
                        "preReqSectionCodes": []
                    },
                    {
                        "sectionId": "Closure",
                        "sectionName": "Closure",
                        "displayOrder": 6,
                        "optionalOrRequiredInd": "R",
                        "sectionStatus": "Complete",
                        "preReqSectionCodes": []
                    }
                ]
            };


            this.parentModel.set(sectionInfoDtos);
            var config = CaseFileView.prototype.getConfig.apply(this, arguments);



            return config;
        },



        caseSectionsContainerControls : function (model) {

            var controls = CaseFileView.prototype.caseSectionsContainerControls.apply(this, arguments);

            controls[0] = {
                id : 'caseFiltersAndViewsContainer',
                type:'caseFile/caseFiltersAndViews2',
                tabHeadings:this.caseFilterAndViewsContainerControls()
            }

            controls.push({
                id : 'summaryContainer',
                type:'caseFile/summarySections/application/summary',
                items : this.summaryContainerControls()
            });

            controls.push({
                id : 'financeContainer',
                type:'caseFile/finance/main',
                items : this.financeContainerControls()
            });

            return controls;
        },

        caseFilterAndViewsContainerControls : function () {
            var controls = CaseFileView.prototype.caseFilterAndViewsContainerControls.apply(this, arguments);

            controls[0] = [{
                viewTarget :"case",
                filter : "all",
                label : "Case File",
                isActive : true
            },{
                viewTarget :"summary",
                label : "Summary",
            }]

            controls[1] = [
                {
                    viewTarget :"finance",
                    label : "Finance"
                },
                {
                    viewTarget :"docs",
                    label : "Docs"
                },{
                    viewTarget :"log",
                    label : "Log"
                }]

            return controls;

        },

        summaryContainerControls: function(){
            var controls = [];
            return controls;
        },

        financeContainerControls: function(){
            var controls = [];
            return controls;
        }
    });
});
