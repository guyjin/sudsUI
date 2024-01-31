define(['./panelView',
    "jquery",
    "nrm-ui",
    'underscore',
    'nrm-ui/views/reportLauncherView',
    "app/models/reportInfoModel"], function (PanelView, $, Nrm, _, ReportLauncherView, ReportInfoModel) {
    return PanelView.extend({

        events: {
                'click #generate-pdf': 'downloadPdf'
            },

        getConfig: function () {

            var controls = [
                {
                    id: 'fileNameId',
                    type: 'inputText',
                    prop: 'fileName',
                    label: 'File Name',
                    grid: 'col-sm-6',
                    labelGrid: 'col-sm-4',
                    hzGrid: 'col-sm-8'
                },
                {
                    id: 'reportNameId',
                    type: 'inputText',
                    prop: 'reportName',
                    label: 'Report Name',
                    grid: 'col-sm-6',
                    labelGrid: 'col-sm-4',
                    hzGrid: 'col-sm-8'
                }, {
                    id: 'documentOwner',
                    type: 'inputText',
                    prop: 'owner',
                    label: 'Owner Name',
                    grid: 'col-sm-6',
                    labelGrid: 'col-sm-4',
                    hzGrid: 'col-sm-8'
                },
                {
                    id: 'generate-pdf',
                    type: 'btn',
                    prop: 'generatePDF',
                    btnStyle: "primary",
                    icon: "fa fa-file-pdf-o",
                    className: "pull-right btn-view-report",
                    label: 'Generate PDF Report',
                }
            ]


            $.extend(this.options.config.controls, controls);

            return this.options.config;
        },

        downloadPdf: function () {

            var self = this;
            var recordModel = self.model;
            var reportInfoModel = new ReportInfoModel({}, {instanceUrl: "api/reports/" + recordModel.get('reportName')});

            reportInfoModel.fetch({
                data: JSON.stringify(recordModel.toJSON()),
                type: "POST",
                contentType: "application/json",
                success: function (model, response, options) {
                    var fileDownloadApi = "api/files/" + model.get('fileName');
                    ReportLauncherView.showReportLauncherView({
                        url: fileDownloadApi,
                        documentTitle: model.get('fileName')
                    })
                },
                error: function (model, response, options) {

                console.log("There was a problem downloading the file");
                }
            });


        },
        render: function () {
            PanelView.prototype.render.apply(this, arguments);

        }


    });
});