/**
 * @file
 * @see module:app/models/rentSheet/getStatesCountiesAndForests
 */

define(['../..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.RentSheetsModel = Backbone.Model.extend({


            initialize: function(props){
                this.authCn = props.authCn;
            },

            url: function(){
                return 'api/recordservice/getRentSheets/' +  this.authCn;
            }
        });
    });