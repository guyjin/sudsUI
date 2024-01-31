/**
 * @file
 * @see module:app/models/rentSheet/getStatesCountiesAndForests
 */

define(['../..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.StatesAndCountiesModel = Backbone.Model.extend({


            initialize: function(props){
                this.id = props.id;
            },

            url: function(){
                return 'api/recordservice/' +  this.id;
            }
        });
    });