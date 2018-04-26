/**
 * @file The FLMDataSourceCollection extends {@link http://backbonejs.org/#Collection|Backbone.Collection} to represent 
 * a list of Feature Level Metadata data source values
 * @see module:nrm-ui/collections/flmDataSourceCollection
 */
/** 
 * Extends {@link http://backbonejs.org/#Collection|Backbone.Collection} to represent a list of Feature Level Metadata 
 * (FLM) data source values
 * @module nrm-map/collections/flmDataSourceCollection
 * @borrows module:nrm-map/models/flmDataSource#localStorage as module:nrm-map/models/flmDataSourceCollection#localStorage
 */

define(['require', 'backbone', 'nrm-ui', '../models/flmDataSource'], function(require, Backbone, Nrm, FLMDataSource) {

    return Nrm.Collections.FLMDataSourceCollection = Backbone.Collection.extend(
        /**@lends module:nrm-map/collections/flmDataSourceCollection.prototype*/
        {
            /**
             * URL for the collection, default is the flmDataSources.json file in the nrm-map package.
             * @type {string}
             * @see {@link http://backbonejs.org/#Collection-url|Backbone.Collection#url}
             */
            url: require.toUrl("../flmDataSources.json"),
            /**
             * The sort attribute for the collection.
             * @default
             * @type {string}
             * @see {@link http://backbonejs.org/#Collection-comparator|Backbone.Collection#comparator}
             */
            comparator: "code",
            /**
             * The model type for the collection
             * @type {Function}
             * @see {@link http://backbonejs.org/#Collection-model|Backbone.Collection#model}
             */
            model : FLMDataSource,
            localStorage: false
        });
});