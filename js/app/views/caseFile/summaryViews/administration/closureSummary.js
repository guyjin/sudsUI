define(['app/views/panelView',
    "jquery",
    "nrm-ui",
    'underscore',
    'app/views/caseFile/summaryViews/basicInfoSummaryView'], function (PanelView, $, Nrm, _, BasicInfoSummaryView) {
    return BasicInfoSummaryView.extend({

        genericTemplate : "common/ctrlsIterator",

        events: {
            'click .editDataPointLink' : "editDataPoint",
            'click .sudsPillActionLink' : 'editDataPoint'
            },

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);
            config.controls = []

            var authorization = this.model.toJSON();


            config.controls= [{
                id: "closureSectionPill",
                type:'caseFile/util/sudsPillMessage',
                sudsPillIconClass : 'fa fa-check',
                actionLinkId : 'closureBtn',
                sudsPillMessageText :"The Authorization Can be Closed Now",
                actionLinkWord : 'Close Now.',
            }]


            return config;
        },

        editDataPoint : function (event) {

            this.trigger('loadFormView','Closure');

        },


    });
});