/**
 * @file
 * @see module:app/models/contactsModel
 */
define(['..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.Contacts = Backbone.Model.extend({

            urlRoot: "api/recordservice/getListOfContacts",

        });
    });