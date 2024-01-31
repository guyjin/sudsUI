/**
 * @file
 * @see module:app/collections/specialUseTaskCollection
 */
/**
 * @module app/collections/specialUseTaskCollection
 */
define(['../..', 'app/models/contactManagement/contactModel', 'backbone', 'underscore', 'nrm-ui'],
    function(Suds, ContactModel, Backbone, _, Nrm) {
        return Suds.Collections.CotactCollection =
            Backbone.Collection.extend(/** @lends module:app/collections/specialUseTaskCollection.prototype */{
                    /**
                     * The constructor used to create model instances, this is required for each non-generic collection.
                     * @type {Function}
                     * @see {@link http://backbonejs.org/#Collection-model|Backbone.Collection#model}
                     */

                    initialize: function(options) {
                        this.searchKey = options && options.id;
                    },


                    "sync": function(method, model, options){

                        if(method == 'read'){
                            options.url = this.url + 'search/' + this.searchKey;
                        }

                        return Backbone.sync.apply(this, arguments);
                    },

                    model: ContactModel,
                    /**
                     * The REST API URL for the collection, this is required for each non-generic collection and is usually the same
                     *  as the urlRoot defined on the model.
                     * @type {String}
                     * @see {@link http://backbonejs.org/#Collection-url|Backbone.Collection#url}
                     */
                    url: ContactModel.prototype.urlRoot,


                    parse: function(response) {

                        return response;
                    },

                   /* comparator: function(m1, m2) {
                        var ret = 0;
                        function cmp(t1, t2) {
                            if (t1 < t2) {
                                return -1;
                            } else if (t1 > t2) {
                                return 1;
                            } else {
                                // note that this does not necessarily mean equality if the types are different
                                return 0;
                            }
                        }
                        _.find(this.constructor.sortAttr, function(sort) {
                            var t1 = Nrm.app.getModelVal(m1, sort.prop), t2 = Nrm.app.getModelVal(m2, sort.prop);
                            if (t1 === t2) {
                                // strict equality comparison
                                ret = 0;
                            } else if (t1 == null) {
                                if (t2 == null) {
                                    // both attributes are null or undefined, consider them equal
                                    ret = 0;
                                } else {
                                    // first attribute is null or undefined, the other is not
                                    ret = -1;
                                }
                            } else if (t2 == null) {
                                // second attribute is null or undefined, the first is not
                                ret = 1;
                            } else {
                                // Is first attribute less than or greater than the second?
                                // If not, it returns 0, in which case the values are compared as strings.
                                ret = cmp(t1, t2) || cmp(t1.toString(), t2.toString());
                            }
                            if (sort.desc) {
                                // reverse the sort order for descending sort
                                ret = -1 * ret;
                            }
                            // return true for the first non-zero comparison value to stop iterating, else return false
                            return !!ret;
                        });
                        // returns -1, 0 or 1
                        return ret;
                    }*/
                }
            );
    });