/**
 * @file
 * @see module:app/models/aoAcceptRejectModel
 */
define(['../..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.AOAcceptRejectModel = Backbone.Model.extend({

            urlRoot: "api/proposalreview/reviewSaveContinue",

        });
    });