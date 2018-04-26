/**
 * @file
 * @see module:app/models/contactsModel
 */
define(['..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.GISTestModel = Backbone.Model.extend({

            urlRoot: "api/recordservice/gisTest",

        });
    });