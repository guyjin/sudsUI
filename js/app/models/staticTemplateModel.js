/**
 * @file
 * @see module:app/models/common/staticTemplateModel
 */
define(['..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.StaticTemplateModel = Backbone.Model.extend({

            idAttribute: 'value',

        });
    });