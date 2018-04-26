/**
 * @file
 * @see module:app/models/common/questionModel
 */
define(['..', 'backbone','nrm-ui/models/businessObject','nrm-ui/collections/ruleCollection'],
    function(Suds, Backbone) {
        return Suds.Models.AuthSummary = Backbone.Model.extend({

            initialize: function(props){
                this.id = props.id;
            },


            url: function(){
                return 'api/recordservice/removeContacts/' + this.id ;
            }
        });
    });