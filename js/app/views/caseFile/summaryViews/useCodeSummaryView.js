define(['../../panelView',
    "jquery",
    "nrm-ui",
    'underscore',
    'app/models/getTableRecordByAuthAndProp'], function (PanelView, $, Nrm, _,GetTableRecordByAuthCnAndProp) {
    return PanelView.extend({

        genericTemplate : "useCodes/useCodeSummary",
        events: {},

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments),
                authorization = this.model.toJSON(),
                property = "authorizationUseCodes";


            var getTableRecordByAuthAndChildId = new GetTableRecordByAuthCnAndProp({
                authCn : authorization.authorizationCn,
                property : property
            });

            var dfd = new $.Deferred();

            getTableRecordByAuthAndChildId.fetch({
                success: _.bind(function (model, resp, options) {

                    if (resp && resp.length){
                        config.primaryUseCode = _.findWhere(resp, {
                            primarySecondaryInd: "P"
                        });
                        config.secondaryUseCodes = _.without(resp, _.findWhere(resp, {
                            primarySecondaryInd: "P"
                        }));
                    }

                    dfd.resolve(config);
                }, this),
                error: function (model, resp, options) {

                    dfd.reject(model, resp, options);
                }
            });

            return dfd.promise(config);
        },

        render: function () {
            PanelView.prototype.render.apply(this, arguments);

            return this;
        }


    });
});