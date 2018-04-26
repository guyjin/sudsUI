define(['../../panelView',
    "jquery",
    "nrm-ui",
    'underscore',
    'nrm-ui/views/reportLauncherView',
    "app/models/reportInfoModel"], function (PanelView, $, Nrm, _) {
    return PanelView.extend({

        genericTemplate : "caseFile/summarySections/ncguSummary",
        events: {},

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);

            var authorization = this.model.toJSON();
            var ncguInd = this.model.get('ncguInd');



            if (ncguInd === "Y"){
                config.needNcgu = true;
            }else  if (ncguInd === "N"){
                config.needNcgu = false;
            }

            return config;
        },

        render: function () {
            PanelView.prototype.render.apply(this, arguments);
            
            return this;
        }


    });
});