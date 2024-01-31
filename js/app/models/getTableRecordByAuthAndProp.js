/**
 * @file
 * @see module:app/models/common/approvalServiceModel
 */
define(['..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.GetTableRecordByAuthCnAndProp = Backbone.Model.extend({

            initialize: function(props){
                this.authCn = props.authCn;
                this.property = props.property;
            },

            url: function(){
                return 'api/recordservice/'+ this.authCn +"/" + this.property;
            }

        });
    });