/**
 * @file
 * @see module:app/models/common/approvalServiceModel
 */
define(['..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.GetCnForLookupTableRecord = Backbone.Model.extend({

            initialize: function(props){
                this.id = props.id;
            },

            url: function(){

                return 'api/workflowService/getCnForLookupTableRecord/' +  this.id;
            }

        });
    });