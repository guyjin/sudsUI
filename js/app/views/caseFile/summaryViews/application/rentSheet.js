define(['app/views/panelView',
    "jquery",
    "nrm-ui",
    'underscore','app/views/rentSheet/rentSheetFormView'], function (PanelView, $, Nrm, _, RentSheetFormView) {
    return RentSheetFormView.extend({

        genericTemplate : "rentSheet/rentSheetSummary",

        /*events: {},

        /!*getConfig: function () {
            var config = PanelView.prototype.getConfig.apply(this, arguments),
                authorization = this.model.toJSON(),
                authorizationCn = authorization.authorizationCn;


            var rentSheet = new RentSheet(this.model.toJSON(),{authCn:authorizationCn});

            rentSheet.fetch({

                success: _.bind(function (model, resp, options) {

                    var authorization = this.parentModel.get('authorization');
                    authorization = $.extend({}, authorization.toJSON(), resp);
                    authorization = this.parentModel.AuthorizationModel(authorization);

                    this.parentModel.set("authorization", authorization);
                    this.model = authorization.clone();

                },this),
                error: function (model, resp, options) {

                }
            })

            return config;
        }*!/*/

    });
});