define([
    '../../../views/baseView',
    'jquery', 
    'nrm-ui'
], function(BaseView, $, Nrm) {
    return BaseView.extend({
        initialize: function(options) { 
            this.options = options || {};
            this.initControl( options.control );
        },
        // LW: This could be used for a pattern where more than one control needed to be used as part of the unit test
        // getConfig: function() {
        //     return this.options.config;
        // },
        render: function() {
            if(this.model) {
            	this.bindData(this.options.control, this.model);
                this.$el.html(this.options.template(this.options.control) );
                this.applyPlugin(this.$el, this.options.control );
            }
            return this;
        }
    });
});