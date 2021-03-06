/**
 * @file
 * @see module:app/collections/specialUseTaskCollection
 */
/**
 * @module app/collections/specialUseTaskCollection
 */
define(['..', '../models/contactModel', 'backbone', 'underscore', 'nrm-ui'],
    function(Suds, ContactModel, Backbone, _, Nrm) {
        return Suds.Collections.ContactCollection =
            Backbone.Collection.extend(/** @lends module:app/collections/specialUseTaskCollection.prototype */{
                    /**
                     * The constructor used to create model instances, this is required for each non-generic collection.
                     * @type {Function}
                     * @see {@link http://backbonejs.org/#Collection-model|Backbone.Collection#model}
                     */
                    model: ContactModel,
                    /**
                     * The REST API URL for the collection, this is required for each non-generic collection and is usually the same
                     *  as the urlRoot defined on the model.
                     * @type {String}
                     * @see {@link http://backbonejs.org/#Collection-url|Backbone.Collection#url}
                     */
                    /*url: ContactsModel.prototype.urlRoot*/

                    /*toJSON: function(options) {

                        return _.clone(this.attributes);
                    }*/

                setAll: function () {
                    var _args = arguments;
                    this.models.forEach(function (model) {
                        model.set.apply(model, _args);
                    });
                }
                }
            );
    });