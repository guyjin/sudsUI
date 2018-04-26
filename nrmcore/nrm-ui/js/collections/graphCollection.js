/**
 * @file Backbone Collection implementation that parses and serializes an object instead of an array.
 * @see module:nrm-ui/collections/graphCollection
 */
/** 
 * @module nrm-ui/collections/graphCollection
 */

define(['backbone', 'underscore'], function(Backbone, _) {
    function parseModel(value, key) {
        return {
            id: key,
            value: value
        };
    }
    return Backbone.Collection.extend(/** @lends module:nrm-ui/collections/graphCollection.prototype */{

        /**
         * The model constructor.
         * @type {Function}
         * @see {@link http://backbonejs.org/#Collection-model|Backbone.Collection#model}
         */
        model: Backbone.Model.extend({
            toJSON: function() {
                return this.get("value");
            },
            parse: function(response) {
                if (!response.id && !response.value && this.id) {
                    // transform the model attributes if they don't appear to be transformed already
                    return parseModel(response, this.id);
                } else {
                    return response;
                }
            }
        }),
        /**
         * Overrides {@link http://backbonejs.org/#Collection-parse|Backbone.Collection#parse} to convert an
         * object to an array.
         * @param {Object} response
         * @returns {Object[]}
         * 
         */
        parse: function(response) {
            return _.map(response || { }, parseModel);
        },
        /**
         * Overrides {@link http://backbonejs.org/#Collection-toJSON|Backbone.Collection#toJSON} to return
         * an object instead of an array.
         * @returns {Object.<string,Object>}
         */
        toJSON: function() {
            return this.reduce(function(memo, model) {
                memo[model.id] = model.toJSON();
                return memo;
            }, { });
        },
        /**
         * Overrides {@link http://backbonejs.org/#Collection-reset|Backbone.Collection#reset} to force parse if
         * the models parameter is an object insetad of an array
         * @param {Object.<string,Object>|Object[]} models Plain object with model ids as the keys or array of models
         * @param {type} options
         * @returns {module:nrm-ui/collections/graphCollection}
         * Returns this instance.
         */
        reset: function(models, options) {
            if (models && !_.isArray(models) && (!options || !_.isBoolean(options.parse))) {
                // force parse
                if (!options) {
                    options = { parse: true };
                } else {
                    // do not modify original options object
                    options = _.extend({ }, options, { parse: true });
                }
            }
            if (arguments.length === 1 && options) {
                return Backbone.Collection.prototype.reset.call(this, models, options);
            } else {
                // arguments object was mutated by setting options argument above.
                return Backbone.Collection.prototype.reset.apply(this, arguments);
            }
        }
    });
});
