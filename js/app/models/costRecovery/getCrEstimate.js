/**
 * @file
 * @see module:app/models/costRecovery/getCrEstimate
 */
define(['../..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.CrEstimateModel = Backbone.Model.extend({


            initialize: function(props){
                this.id = props.id;
            },

            url: function(){
                return 'api/recordservice/getCrEstimate/' +  this.id;
            }
        });
    });