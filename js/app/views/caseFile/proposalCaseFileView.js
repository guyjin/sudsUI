define(['../caseFileView',
    "jquery",
    "nrm-ui",
    'underscore'], function (CaseFileView, $, Nrm, _,CaseFileSummaryHeader) {
    return CaseFileView.extend({


        /*getConfig: function () {

            config = CaseFileView.prototype.getConfig.apply(this, arguments);
            authorization = this.model.toJSON();

            return config;
        },*/




        /*caseSectionsContainerControls : function (model) {
            var controls = [{
                id : 'sectionsContainer',
                type:'caseFile/summarySectionContainer',
                items: this.summarySectionContainerCtrls(model)
            }];

            return controls;
        },*/

        /*render : function () {
            CaseFileView.prototype.render.apply(this, arguments)


            return this;
        },*/


       /* startListening: function () {
            CaseFileView.prototype.startListening.apply(this, arguments);


           /!* this.listenTo(this, {
             'renderComplete': function () {
             this.populateSummmaryData();
             }
             });*!/

        },*/
    });
});