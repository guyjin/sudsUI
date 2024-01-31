/**
 * @file
 * @see module:app/models/common/editSubflowModel
 */
define(['..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.EditSubflow = Backbone.Model.extend({

            urlRoot: "api/recordservice/getCurrentStep",

            toJSON: function(options) {

                return _.clone(this.attributes);
            }

        });
    });