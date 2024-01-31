/**
 * @file The FLMDataSource module extends {@link http://backbonejs.org/#Model|Backbone.Model} to represent a  Feature 
 * Level Metadata data source value
 * @see module:nrm-ui/models/flmDataSource
 */
/** 
 * Extends {@link http://backbonejs.org/#Model|Backbone.Model} to represent a Feature Level Metadata (FLM) Data Source
 * @module nrm-map/models/flmDataSource
 */

define(['backbone', 'nrm-ui'], function(Backbone, Nrm) {

    return Nrm.Models.FLMDataSource = Backbone.Model.extend(/**@lends module:nrm-map/models/flmDataSource*/{
        /**
         * The name of the id attribute
         * @default
         * @type {string}
         */
        idAttribute: "code",
        /**
         * Get the display name which is a concatenation of code and description.
         * @returns {string}
         */
        displayName: function() {
            return this.get("code") + ": " + this.get("description");
        },
        /**
         * Prevents loading from local storage, since the default URL is a static JSON file.
         * @default false
         * @type {Boolean}
         */
        localStorage: false
    });
});