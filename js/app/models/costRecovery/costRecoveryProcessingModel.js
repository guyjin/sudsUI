/**
 * @file
 * @see module:app/models/costRecovery/costRecoveryProcessing
 */
define(['../..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.CostRecoveryProcessingModel = Backbone.Model.extend({


            toJSON: function(options) {

                var self = this;

                return _.clone(this.attributes);
            }
        });
    });