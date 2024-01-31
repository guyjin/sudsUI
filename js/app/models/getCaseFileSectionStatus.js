/**
 * @file
 * @see module:app/models/summaryModel
 */
define(['..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.GetCaseSectionStatus = Backbone.Model.extend({

            initialize: function(props){
                this.id = props.id;
            },

            url: function(){
                return 'api/recordservice/getCaseFileSectionStatus/' +  this.id;
            }

        });
    });