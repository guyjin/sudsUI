/**
 * @file
 * @see module:app/models/summaryModel
 */
define(['..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.SummaryModel = Backbone.Model.extend({

            initialize: function(props){
                this.id = props.id;
            },

            url: function(){
                return 'api/uiTest/getSummary/' +  this.id;
            }

        });
    });