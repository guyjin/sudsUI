/**
 * @file
 * @see module:app/models/common/addOrRemoveFilesModel
 */
define(['..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.DeleteFilesModel = Backbone.Model.extend({

            urlRoot: "api/recordservice/delete",

        });
    });