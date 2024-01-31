/**
 * @file
 * @see module:app/models/getUseCodeAndCategoriesModel
 */
define(['..', 'backbone'],
    function(Suds, Backbone) {
        return Suds.Models.UseCodeCategoriesModel = Backbone.Model.extend({

            urlRoot: "api/recordservice/useCodeAndCategories",

        });
    });