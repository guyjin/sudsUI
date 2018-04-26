/**
 * @file
 * @see module:app/models/ReportInfoModal
 */
define(['..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.ReportInfoModel = Backbone.Model.extend({

            url: function() {
                return this.instanceUrl;
            },

            initialize: function(attrs, options) {
                this.instanceUrl = options.instanceUrl;
            },


        });
    });