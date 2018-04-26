/**
 * @file
 * @see module:app/models/common/approvalServiceModel
 */
define(['../..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.AOReviewUpdateModel = Backbone.Model.extend({

            urlRoot: "api/proposalreview/reviewdetails",

        });
    });