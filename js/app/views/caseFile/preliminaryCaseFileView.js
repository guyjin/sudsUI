define(['../caseFileView',
    "jquery",
    "nrm-ui",
    'underscore'], function (CaseFileView, $, Nrm, _) {
    return CaseFileView.extend({


        getConfig: function () {

            var config = CaseFileView.prototype.getConfig.apply(this, arguments);
            config.recordId = "New Proposal"

            return config;
        },



        caseSectionsContainerControls : function (model) {
            var controls = CaseFileView.prototype.caseSectionsContainerControls.apply(this, arguments);
            controls.splice(3);

            return controls;
        },

        caseFilterAndViewsContainerControls : function () {
            var controls = CaseFileView.prototype.caseFilterAndViewsContainerControls.apply(this, arguments);

            controls[1] = [{
                viewTarget :"docs",
                label : "Docs"
            }]

            return controls;

        },
    });
});