/**
 * @file The RuleCollection module is a collection of {@link module:nrm-ui/models/rule|Rule} models.
 * @see module:nrm-ui/models/rule
 */
/** 
 * Extends {@link http://backbonejs.org/#Collection|Backbone.Collection} to provide a typed collection 
 * for the {@link module:nrm-ui/models/rule|Rule} model.
 * @module nrm-ui/collections/ruleCollection
 */
/*jslint sloppy: true, devel: true, indent: 4 */
/*global $ */

// NrmRule.js provides functionality to store the rules for a NrmBusinessObject,
// validate those rules, and store the invalid ones.

define(['..', 'backbone', '../models/rule'], function(Nrm, Backbone, Rule) {

    return Nrm.RuleCollection = Backbone.Collection.extend(
        /** @lends module:nrm-ui/collections/ruleCollection.prototype */
        {
            /**
             * The constructor for the {@link module:nrm-ui/models/rule|Rule} model.
             * @type {Function}
             * @see {@link http://backbonejs.org/#Collection-model|Backbone.Collection#model}
             */
            model: Rule
        });
});
