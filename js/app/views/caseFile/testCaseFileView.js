define(['../caseFileView',
    "jquery",
    "nrm-ui",
    'underscore'], function (CaseFileView, $, Nrm, _) {
    return CaseFileView.extend({


        getConfig: function () {

            /* var sectionIdAndStatus = this.parentModel.get('sectionIdToSectionStatus');

             this.model.set("nextStepId","ProposalCaseFile");
             this.model.set("currentSectionId", "PreliminaryCaseFile");
             this.model.set("currentSectionStatus", "Complete");

             /!*var flowSummaryDtos = [
             {
             "flowId": "BasicInfo",
             "flowStatus": "Available",
             "sectionOrder": "1",
             "sectionShortName": "Basic Info",
             "sectionName": "Basic Information",
             "isRequiredOrOptional": "R"
             },
             {
             "flowId": "Contacts",
             "flowStatus": "Available",
             "sectionOrder": "2",
             "sectionShortName": "Contacts",
             "isRequiredOrOptional": "R",

             }/!*,{
             "flowId": "NCGU",
             "flowStatus": "Available",
             "sectionOrder": "3",
             "sectionShortName": "NCGU",
             "isRequiredOrOptional": "R",

             }*!/,
             {
             "flowId": "UseCode",
             "sectionShortName": "Use Codes",
             "isRequiredOrOptional": "R",
             "flowStatus": "Available",
             "sectionOrder": "4",
             },{
             "flowId": "AuthSelection",
             "flowStatus": "Not Available",
             "sectionOrder": "5",
             "sectionShortName": "Authority Selection",
             "isRequiredOrOptional": "R",

             },{
             "flowId": "GISTestView",
             "flowStatus": "Available",
             "sectionOrder": "5",
             "sectionShortName": "GIS Geo Spatial View",
             "isRequiredOrOptional": "O",

             }
             ]*!/

             var sectionInfoDtos = this.model.get("sectionInfoDtos");


             /!* $.each(flowSummaryDtos,function (idx,obj) {

             if (sectionIdAndStatus[obj.flowId]){
             obj.flowStatus =  sectionIdAndStatus[obj.flowId]
             }


             })*!/


             /!*var checkIfUseCodeIsCompleted = _.find(sectionInfoDtos,function (item) {
             return (item.flowId =="UseCode" && item.flowStatus == "Complete")
             })
             var checkIfAuthSelectionCompleted = _.find(sectionInfoDtos,function (item) {
             return (item.flowId =="AuthSelection" && item.flowStatus == "Complete")
             })
             var  authSelectionObj = _.find(sectionInfoDtos,function (item) {
             return (item.flowId =="AuthSelection")
             })

             if (checkIfUseCodeIsCompleted){

             if (!checkIfAuthSelectionCompleted){
             authSelectionObj.flowStatus = "Available"
             }

             }else{
             authSelectionObj.flowStatus = "Not Available";
             }*!/


             //this.model.set('flowSummaryDtos',flowSummaryDtos);

             */
            var config = CaseFileView.prototype.getConfig.apply(this, arguments);
            config.recordId = "New Proposal"

            return config;
        },



        caseSectionsContainerControls : function (model) {
            var controls = CaseFileView.prototype.caseSectionsContainerControls.apply(this, arguments);
            controls.push({
                id : 'financeContainer',
                type:'caseFile/finance/main',
                items : this.financeContainerControls()
            });
            /* var controls = [{
             id : 'caseFiltersAndViewsContainer',
             type:'caseFile/caseFiltersAndViews',
             tabHeadings:this.caseFilterAndViewsContainerControls()
             },{
             id : 'sectionsContainer',
             type:'caseFile/summarySectionContainer',
             items: this.summarySectionContainerCtrls(model)
             },{
             id : 'docsContainer',
             type : 'caseFile/docs/main',
             items : this.docsTabControls()
             }];*/

            return controls;
        },

        caseFilterAndViewsContainerControls : function () {
            var controls = CaseFileView.prototype.caseFilterAndViewsContainerControls.apply(this, arguments);
            /*controls[0] = [{
             viewTarget :"case",
             filter : "all",
             label : "All",
             isActive : true
             },{
             viewTarget :"case",
             filter : "todo",
             label : "To Do",
             },{
             viewTarget :"case",
             filter : "done",
             label : "Done"
             }]*/

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

        financeContainerControls: function(){
            var controls = [];
            return controls;
        }
    });
});
