
/*
TODO:
* @fileName: Need to rename the file when making it the actual view
* */

define(['app/views/panelView',
    "jquery",
    "nrm-ui",
    'underscore',
    'nrm-ui/views/reportLauncherView',
    "app/models/reportInfoModel"], function (PanelView, $, Nrm, _, ReportLauncherView, ReportInfoModel) {
    return PanelView.extend({

        events: {
                'click #generate-pdf': 'downloadPdf',
                'click #update-geometry' :'workflowView'
            },

        getConfig: function () {
            var config = PanelView.prototype.getConfig.apply(this, arguments);

            config.controls = [
                {
                    id: 'generate-pdf',
                    type: 'btn',
                    prop: 'generatePDF',
                    btnStyle: "primary",
                    icon: "fa fa-file-pdf-o",
                    className: "btn-view-report",
                    label: 'Generate PDF Report',
                    "style" : {
                        "margin-top" : '10px'
                    }
                },
                {
                    id: 'update-geometry',
                    type: 'btn',
                    prop: 'generatePDF',
                    btnStyle: "primary",
                    className: "btn-view-report",
                    label: 'Update Geometry',
                    "style" : {
                        "margin-top" : '10px'
                    }
                }
            ]



            return config;
        },

        downloadPdf : function () {

            var self = this;
            var recordModel = self.model;
            //need to ask roshan for the report URL
            var reportInfoModel = new ReportInfoModel({}, {instanceUrl: "api/reports/crpEstimate"});

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

                    console.log("There was a problem uploading the file");
                }
            });


        },


        /*workflowView : function () {

            var options = {
                model : this.model
            };

            var rentSheetWorkflowView = new WorkflowView(options);

            Nrm.event.trigger("app:workflow", {
                view: rentSheetWorkflowView
            });

            this.listenTo(rentSheetWorkflowView, "workflowFinished", function() {

                var shape = this.model.get('shape');
                var successCallback = _.bind(function(collection, response) {
                    debugger
                    /!*TODO : we need to parse this response object and retrieve the necessary value  that we will need and then set them in the model object*!/

                }, this);
                var errorCallback = _.bind(function(collection, response) {

                }, this);
                var townshipCollection = new TownshipCollection();
                if (shape) {
                    townshipCollection.fetch({
                        params: {
                            geometry: shape
                        },
                        success: successCallback,
                        error: errorCallback
                    });
                }
            });
        },*/
        /*render: function () {


            return PanelView.prototype.render.apply(this, arguments);

        }*/


    });
});