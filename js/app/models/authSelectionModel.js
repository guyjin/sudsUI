/**
 * @file
 * @see module:app/models/common/addOrRemoveFilesModel
 */
define(['..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.AuthSelectionModel = Backbone.Model.extend({

            initialize: function(props){
                this.id = props.id;
            },

            url: function(){
                return 'api/workflowService/getUseAttributes/' +  this.id;
            }

        });
    });