define(['../caseFileView',
    '../panelView',
    "jquery",
    "nrm-ui",
    'underscore',
    'nrm-ui/views/reportLauncherView',
    "app/models/reportInfoModel"], function (CaseFileView, PanelView, $, Nrm, _, ReportLauncherView, ReportInfoModel) {
    return CaseFileView.extend({

        genericTemplate : 'preCaseFile/onBoarding',

        events: $.extend({}, CaseFileView.prototype.events, {

             }),
        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);
            config.controls = []

            return config;
        },




        render: function () {


                 return PanelView.prototype.render.apply(this, arguments);

        }


    });
});