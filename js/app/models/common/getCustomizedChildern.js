/**
 * @file
 * @see module:app/models/common/addOrRemoveFilesModel
 */
define(['../..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.GetCustomizedChildern = Backbone.Model.extend({

            initialize: function(props){
                this.id = props.id;
                this.childName = props.childName;
            },

            url: function(){
                return 'api/workflowService/getCustomisedChildEntities/' +  this.id + '/' + this.childName;
            }

        });
    });