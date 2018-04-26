/**
 * @file
 * @see module:app/models/common/caseFileModel
 */
define(['..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.CaseFileModel = Backbone.Model.extend({

            //urlRoot: "api/recordservice/completeCurrentStep",

            toJSON: function(options) {

                return _.clone(this.attributes);
            }

        });
    });