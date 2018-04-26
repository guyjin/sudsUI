/**
 * @file
 * @see module:app/models/common/caseFileModel
 */
define(['../..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.InitialOrgModel = Backbone.Model.extend({

            initialize: function(options){
                this.id = options.id;
            },

            urlRoot: "api/contact/initialOrg/",

            url: function(){
                return this.urlRoot +  this.id;
            }

        });
    });