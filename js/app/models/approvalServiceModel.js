/**
 * @file
 * @see module:app/models/common/approvalServiceModel
 */
define(['..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.ApprovalServiceModel = Backbone.Model.extend({

            urlRoot: "api/recordservice/approverecord",

        });
    });