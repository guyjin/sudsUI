
/*
TODO:
* @fileName: Need to rename the file when making it the actual view
* */

define(['app/views/panelView',
    "jquery",
    "nrm-ui",
    'underscore',
    'nrm-ui/views/reportLauncherView',
    "app/models/reportInfoModel",
    'app/models/common/recordModel'], function (PanelView, $, Nrm, _, ReportLauncherView, ReportInfoModel,RecordModel) {

    return PanelView.extend({

        genericTemplate : 'caseFile/summarySections/authActions',

        events: {
                'click .generate-pdf': 'downloadPdf',
                'click .complete-auth' :'completeAuthorization'
            },

        getConfig: function () {
            var config = PanelView.prototype.getConfig.apply(this, arguments);

            config.controls = [
                {
                    id: 'generate-pdf',
                    type: 'btn',
                    href:'javascript:void(0)',
                    prop: 'draftAuth',
                    //btnStyle: "primary",
                    icon: "fa fa-binoculars",
                    className: "btn btn-suds suds-primary generate-pdf",
                    label: 'View Draft Authorization',

                },{
                    id: 'generate-pdf',
                    href:'javascript:void(0)',
                    type: 'btn',
                    prop: 'completeAuth',
                    //btnStyle: "primary",
                    icon: "fa fa-thumbs-up",
                    className: "btn btn-suds complete-auth",
                    label: 'Complete Authorization',

                }
            ]


            return config;
        },


        completeAuthorization : function () {

            this.model.set("currentSectionId", "AuthActions");
            this.model.set("currentSectionStatus", "Complete");

            var authorization = this.model.toJSON();

            var recordModel = new RecordModel({id: this.model.get('authorizationCn')});


            recordModel.save(authorization,{
                success : _.bind(function(model, resp, options) {
                    this.model.set(resp);

                    $('.btn-suds',this.$el).attr('disabled',true)
                    /*this.trigger('loadFormView','Administration');*/
                },this) ,
                error : function(model, resp, options) {
                    var error = Nrm.app.normalizeErrorInfo('Failed to Save',
                        model, resp || model, options);
                    Nrm.event.trigger('showErrors', error, { allowRecall: false });
                }
            })
        },
        downloadPdf : function () {

            var self = this;
            var recordModel = self.model;
            //need to ask roshan for the report URL
            var reportInfoModel = new ReportInfoModel({}, {instanceUrl: "api/reports/auth/" + this.model.get('authorizationCn')});

            reportInfoModel.fetch({
               /* data: JSON.stringify(recordModel.toJSON()),*/
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


        }

    });
});