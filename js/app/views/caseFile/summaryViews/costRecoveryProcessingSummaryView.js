define(['../../panelView',
    "jquery",
    "nrm-ui",
    'underscore',
    'app/models/getTableRecordByAuthAndProp','app/models/costRecovery/getCrEstimate'],
    function (PanelView, $, Nrm, _,GetTableRecordByAuthCnAndProp,CrEstimateModel) {
    return PanelView.extend({

        genericTemplate : "caseFile/summarySections/crpSummary",
        events: {
        'click .editDataPointLink' : "editDataPoint",
        },

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments),
                authorization = this.model.toJSON(),
                dfd = new $.Deferred(),
                crEstimateModel = new CrEstimateModel({id:authorization.authorizationCn});


            crEstimateModel.fetch({
                success: _.bind(function (model, resp, options) {

               if(resp
                        && resp.existingSpecialistEstimateDtos
                        && resp.existingSpecialistEstimateDtos.length){
                        config.existingSpecialistEstimateDtos =  resp.existingSpecialistEstimateDtos;
                    }

                    if(resp.crpNepaType || resp.crpAdjustmentType){
                        config.processingSummary = true;
                        config.crEstimate = resp;
                    }
                    dfd.resolve(config);
                },this),
                error: function (model, resp, options) {

                    dfd.reject(model, resp, options);
                }
            })

            return dfd.promise();
        },
        editDataPoint : function (event) {
            event.preventDefault();
            var $target = $(event.target),
                screenId =$target.attr("href");

            if (screenId && screenId != "#"){
                this.trigger("loadFormView",screenId);
            }
        },
        render: function () {
            PanelView.prototype.render.apply(this, arguments);

            return this;
        }


    });
});