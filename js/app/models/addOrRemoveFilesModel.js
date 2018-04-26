/**
 * @file
 * @see module:app/models/common/addOrRemoveFilesModel
 */
define(['..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.AddOrRemoveFilesModel = Backbone.Model.extend({

            urlRoot: "api/recordservice/",

            url: function(){

                if (this.id){
                    return this.urlRoot +  "delete";
                }else{
                    return this.urlRoot;
                }

            },

            "sync": function(method, model, options){


                if(method == 'delete'){
                 options.url = this.urlRoot + '/delete';
                 }

                return Backbone.sync.apply(this, arguments);
            },
        });
    });