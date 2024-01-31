/**
 * @file
 * @see module:app/collections/specialUseTaskCollection
 */
/**
 * @module app/collections/specialUseTaskCollection
 */
define(['..', '../models/common/recordTestModel', 'backbone', 'underscore', 'nrm-ui'],
    function(Suds, RecordModel, Backbone, _, Nrm) {
        return Suds.Collections.RecordTestCollection =
            Backbone.Collection.extend(/** @lends module:app/collections/specialUseTaskCollection.prototype */{
                    /**
                     * The constructor used to create model instances, this is required for each non-generic collection.
                     * @type {Function}
                     * @see {@link http://backbonejs.org/#Collection-model|Backbone.Collection#model}
                     */
                    model: RecordModel,
                    /**
                     * The REST API URL for the collection, this is required for each non-generic collection and is usually the same
                     *  as the urlRoot defined on the model.
                     * @type {String}
                     * @see {@link http://backbonejs.org/#Collection-url|Backbone.Collection#url}
                     */
                    url: 'api/uiTest/steps',
                    /**
                     * The comparator determines the sort order in the tree or LOV dropdowns.
                     * @param {module:app/models/specialUseTask} m1 First model
                     * @param {module:app/models/specialUseTask} m2 Second model
                     * @returns {Number}
                     * @see {@link http://backbonejs.org/#Collection-comparator|Backbone.Collection#comparator}
                     */
                }
            );
    });