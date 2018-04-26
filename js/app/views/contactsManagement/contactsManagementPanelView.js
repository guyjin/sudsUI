define(['nrm-ui/views/panelView', "jquery", "nrm-ui"], function(PanelView, $, Nrm) {

    return PanelView.extend({


        getConfig: function() {
            var config = PanelView.prototype.getConfig.apply(this, arguments) || {};

            //config.controls = this.getContactContentSectionControls();

            return config;

        },

        events: {

        },


        getContactContentSectionControls : function () {},




    });
});