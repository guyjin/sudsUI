/**
 * Base class to use for search param models, sets the default admin unit parameter from the current home org.
 * @file
 * @see module:app/models/common/searchParams
 */
/**
 * SearchParams module currently inherits from Backbone.Model, this might need to change to inherit from 
 * {@link module:nrm-ui/models/businessObject|BusinessObject} if it needs to implement business rule validation.
 * @module app/models/common/searchParams
 */
define(['../..', 'backbone', 'nrm-ui'], 
        function(Suds, Backbone, Nrm) {
    return Suds.Models.SearchParams = Backbone.Model.extend(/** @lends module:app/models/common/searchParams.prototype */{
        /**
         * The default attributes to set on new models. 
         * @returns {Object}
         * Default attributes hash
         * @see {@link http://backbonejs.org/#Model-defaults|Backbone.Model#defaults}
         */
        defaults : function() {
            var homeOrg = Nrm.app.get('homeOrg');
            return {
                // default fsUnitId is the current home org
                fsUnitId: (homeOrg && homeOrg.id) || null
            }
        }
    });
});