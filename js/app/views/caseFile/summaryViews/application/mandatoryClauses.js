define(['app/views/panelView',
    "jquery",
    "nrm-ui",
    'underscore',
    'app/models/getTableRecordByAuthAndProp',
    'app/models/common/getCustomizedChildern'], function (PanelView, $, Nrm, _,GetTableRecordByAuthCnAndProp,GetCustomizedChildern) {
    return PanelView.extend({

        genericTemplate : "caseFile/summarySections/application/mandatoryClauses",
        events: {},

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments),
                authorization = this.model.toJSON(),
                property = "authUseAttributes";


           /* var dfd = new $.Deferred();

            getSelectedAuthoritiesModel.fetch({
                success: _.bind(function (model, resp, options) {


                    if (resp && resp.length){
                        config.primarySelectedAuthorities = resp[0];
                        config.primarySelected = {
                            useCode : config.primarySelectedAuthorities[0].useCode,
                            useName : config.primarySelectedAuthorities[0].useName,
                        }
                        resp.splice(0,1);
                        if (resp && resp.length)
                            config.secondarySelectedAuthorites = resp;
                    }

                    dfd.resolve(config);
                }, this),
                error: function (model, resp, options) {

                    dfd.reject(model, resp, options);
                }
            });*/

            return config;
        },

        render: function () {
            PanelView.prototype.render.apply(this, arguments);

            return this;
        }


    });
});