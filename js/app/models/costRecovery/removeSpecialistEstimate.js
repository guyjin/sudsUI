/**
 * @file
 * @see module:app/models/costRecovery/removeSpecialist
 */
define(['../..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.RemoveSpecialist = Backbone.Model.extend({

            urlRoot : 'api/recordservice/specialistEstimate/',

            initialize: function(attrs, options) {
                this.pathVariables = options.pathVariables;
            },



            idAttribute: 'authorizationCn',

            "sync": function(method, model, options){

                if(method == 'delete'){
                    options.url = this.urlRoot + this.pathVariables;
                }

                return Backbone.sync.apply(this, arguments);
            },


        });
    });