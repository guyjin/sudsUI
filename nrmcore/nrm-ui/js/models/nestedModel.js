/**
 * @file The NestedModel module is a base model extending {@link module:nrm-ui/models/businessObject|Nrm.BusinessObject} 
 * to add support for child model and collection handling.
 * @see module:nrm-ui/models/nestedModel
 */
define([
    '..',
    './businessObject', 
    './rule',
    'underscore', 
    'jquery', 
    'backbone'
], function(Nrm, BusinessObject, Rule, _, $, Backbone) {
    
    
    /**
     * Child property configuration
     * @typedef {Object} module:nrm-ui/models/nestedModel~PropertyConfig
     * @property {Function|Boolean} collection Collection constructor or true to indicate lazy loaded.
     * @property {Function} model Model constructor
     * @property {Boolean} triggerChange Indicates that "change" event triggered by the child should propagate as a 
     * change event triggered on the parent.  For collections, change event will also be triggered on the parent for
     *  "remove" and "reset" events triggered on the child, along with "add" event if the added model is not new. 
     * @property {String} deletes Name of the model attribute to track deleted models in a collection.
     * @property {String} deletesId Attribute name that will be used as the id for tracking deletes if it is not the 
     * same as the idAttribute defined on the models in the collection.  
     * @property {String} linkAttr Attribute name to store links in LocalDB for a many-to-many collection property
     * @property {String} linkId The id attribute name to store in LocalDB for an item in a many-to-many collection, 
     * if it cannot be determined from the model.
     * @property {Boolean} resetOnSave Reset a lazy-loaded collection to null when parent model is saved.
     */
    /**
     * 
     * @exports nrm-ui/models/nestedModel
     */
    var NestedModel = BusinessObject.extend(/**@lends module:nrm-ui/models/nestedModel.prototype **/{
        /**
         * Create a new instance of the NestedModel. 
         * @constructor
         * @alias module:nrm-ui/models/nestedModel
         * @classdesc
         *   A Backbone model that extends {@link module:nrm-ui/models/businessObject|BusinessObject} to provide 
         *   support for nested models and collections and related concerns.
         * @param {Object} [attributes] Inherited from Backbone Model.
         * @param {Object} [options] Inherited from Backbone Model.
         * @see {@link http://backbonejs.org/#Model-constructor|Backbone Model constructor / initialize}
         * @example
         * // Models that extend NestedModel will usually define an initialize method to hook up child events and 
         * // initialize nested models or collections that may be passed as plain objects or arrays to the constructor.
         * define(['nrm-ui/models/nestedModel'], function(NestedModel) {
         *     var ExampleModel = NestedModel.extend({
         *         initialize: function() {
         *             var children = this.initializeChildren(this.attributes);
         *             this.set(children);
         *         },
         *         ...
         *     });
         *     return ExampleModel;
         * });
         */
        constructor: function NestedModel() { return BusinessObject.apply(this, arguments); }, // helps with debugging/profiling
        /**
         * Adds change event listeners for each child attribute that hooks up child event listeners for the new child
         * instance.
         * @returns {module:nrm-ui/models/nestedModel}
         * Returns this instance to allow chaining.
         */
        registerChildEvents: function() {
            if (!this.childEventsRegistered && this.constructor.childProperties) {
                this.childEventsRegistered = true;
                var resetOnSave = false, nested = false;
                _.each(this.constructor.childProperties, function(config, key) {
                    if ((config.collection && config.collection !== true) || config.model) {
                        this.onChildChange(key, config);
                        this.listenTo(this, 'change:' + key, _.partial(this.onChildChange, key, config));
                        nested = true;
                    } else if (config.collection) {
                        nested = true;
                        if (config.triggerChange) {
                            // lazy-loaded child collections that trigger change must at least partially reset on save
                            resetOnSave = true;
                        }
                    }
                    if (config.triggerChange && config.validateOnChange !== false && 
                            config.collection && this.constructor.rules) {
                        var rule =  this.constructor.rules.findWhere({
                            rule: 'IsCollection', 
                            property: key
                        });
                        if (rule && rule.get('validateItems') !== false) {
                            // indicates that "IsCollection" rule should not validate each model
                            rule.set('validated', true);
                            config.validateOnChange = true;
                       }

                    }
                    if (config.resetOnSave) {
                        // set this variable to true if at least childProperty has resetOnSave option set
                        resetOnSave = true;
                    }
                }, this);
                
                if (nested) {
                    this.listenTo(this, {
                        'child:remove': function(model, collection, options){
                            var key = options.attr,
                                config = this.constructor.childProperties[key];
                            this.onChildRemoved(key, config, model, collection, options);
                        },
                        'child:add': function(model, collection, options){
                            var key = options.attr,
                                config = this.constructor.childProperties[key];
                            console.log("child:add", model, collection, options);
                            this.onChildAdded(key, config, model, collection, options);
                        },
                        'child:change': function(model, collection, options){
                            var key = options.attr,
                                config = this.constructor.childProperties[key];
                            //// Assumption: model.collection is the correct reference
                            //var collection = model.collection;
                            console.log("child:change", model, collection, options);
                            this.onChildAttributeChanged(key, config, model, collection, options);

                        },
                        'child:reset': function(collection, resetOptions, childOptions){
                            var key = childOptions.attr,
                                config = this.constructor.childProperties[key];

                            this.onChildReset(key, config, collection, resetOptions, childOptions);
                        }
                    });
                }
                if (resetOnSave) {
                    this.listenTo(this, 'saved', function(model, response, options) {
                        _.each(this.constructor.childProperties, function(config, key) {
                            if (config.resetOnSave || (config.collection === true && config.triggerChange)) {
                                this.resetChild(key, config, model, response, options);
                            }
                        }, this);
                    }); //_.partial(this.resetChild, key, config));

                }
            }
            return this;
        },
        /**
         * Called when a child model or a model in a child collection changes  ("child:change" event).  Default 
         * implementation will trigger change on parent model if the triggerChange option is specified in the 
         * configuration.  If the model is a member of a child collection that needs to validate its children, the 
         * child model will be validated now.  If it is a lazy child collection, the model attribute will be set so that
         * the child collection will persist.
         * @param {String} key Child property name.
         * @param {module:nrm-ui/models/nestedModel~PropertyConfig} config Child property configuration.
         * @param {external:module:backbone.Model} model The model that was changed
         * @param {external:module:backbone.Collection|Object} collection  The child collection if the event has 
         * propagated from a child collection, or the original options hash passed to change event if event propagated
         * from a child model.
         * @param {Object} [options] Options hash passed from the child:change event.
         * @returns {undefined|Boolean}
         * If the property is configured to validate on change, returns boolean indication whether model is valid,
         * otherwise returns undefined
         */
        onChildAttributeChanged: function(key, config, model, collection, options) {
            var result, changed = false;
            if (config && config.triggerChange) {
                if (config.validateOnChange) {
                    // validate now so the "IsCollection" rule doesn't have to validate every child model every time
                    // this must occur BEFORE triggering change so that UI feedback reports current validation state
                    result = model.isValid();
                }
                if (collection instanceof Backbone.Collection) {
                    if (config.collection === true) {
                        // allows persistence of lazy-initialized child collection
                        this.set(key, collection);
                        changed = this.changed && this.changed[key]; // avoid triggering change twice
                    }
                    if (!changed) {
                        this.triggerChange(key, collection, options); //this.trigger('change', this, options);
                    }
                } else {
                    this.triggerChange(key, model, options); //this.trigger('change', this, options);
                }
            }
            return result;
        },
        /**
         * Called when a model added to a child collection ("child:add" event.  Default implementation will trigger 
         * change on parent model if the triggerChange option is specified in the configuration, but only if it is not 
         * adding a new model.  If the model is a member of a child collection that needs to validate its children, the 
         * child model will be validated now. If it is a lazy child collection, the model attribute will be set so that
         * the child collection will persist.
         * @param {String} key Child property name.
         * @param {module:nrm-ui/models/nestedModel~PropertyConfig} config Child property configuration.
         * @param {external:module:backbone.Model} model The model that was added from the child collection
         * @param {external:module:backbone.Collection} collection  The child collection
         * @param {Object} [options] Options hash passed from child:add event.
         * @returns {undefined|Boolean}
         * If the property is configured to validate on change, returns boolean indication whether model is valid,
         * otherwise returns undefined
         */
        onChildAdded: function(key, config, model, collection, options) {
            var result, changed = false;
            console.log("onChildAdded", model, collection, options);
            if (config && config.triggerChange) {
                if (collection && config.collection === true) {
                    // allows persistence of lazy-initialized child collection
                    this.set(key, collection);
                    changed = this.changed && this.changed[key]; // avoid triggering change twice
                }
                if (!changed && !model.isNew()) {
                    // do not trigger change if a new child model is added
                    // this is based on assumption that further user interation is required before notifying parent
                    this.triggerChange(key, collection, options); //this.trigger('change', this, options);
                }
                if (config.validateOnChange) {
                    // validate now so the "IsCollection" rule doesn't have to validate every child model every time
                    // this must occur AFTER triggering change so that UI feedback doesn't report premature errors
                    result = model.isValid();
                }
            }
            return result;
        },
        /**
         * Event handler for a model removed from a child collection ("child:remove" event).  Default implementation
         * will maintain the deletes array and trigger change on parent model if those options are specified in the
         * configuration.
         * @param {String} key Child property name.
         * @param {module:nrm-ui/models/nestedModel~PropertyConfig} config Child property configuration.
         * @param {external:module:backbone.Model} model The model that was removed from the child collection
         * @param {external:module:backbone.Collection} collection The child collection
         * @param {Object} [options] Options hash passed from child:remove event.
         * @returns {undefined}
         */
        onChildRemoved: function(key, config, model, collection, options) {
            var deletesProp = config && config.deletes;
            if (deletesProp) {
                var deletes = this.get(deletesProp);
                if (!_.isArray(deletes)) {
                    this.set(deletesProp, [model]);
                } else {
                    deletes.push(model);
                }
            }
            if (config && config.triggerChange) {
                this.triggerChange(key, collection, options); //this.trigger('change', this, options);
            }
        },
        /**
         * Called when a child collection triggers a reset event ("child:reset" event).   Default implementation
         * will trigger change on parent model if the triggerChange option is specified in the configuration.
         * @param {String} key Child property name.
         * @param {module:nrm-ui/models/nestedModel~PropertyConfig} config Child property configuration.
         * @param {external:module:backbone.Collection} collection The child collection that was reset
         * @param {Object} [resetOptions] Options hash passed from reset event.
         * @param {Object} [childOptions] Options hash passed from child:reset event.
         * @returns {undefined}
         */
        onChildReset: function(key, config, collection, resetOptions, childOptions) {
            if (config && config.triggerChange) {
                this.triggerChange(key, collection, childOptions); //this.trigger('change', this, options);
            }            
        },
        /**
         * Called when parent model is saved to remove cached child collection by updating parent attribute and 
         * reloading collection as appropriate.
         * @param {String} key Child property name.
         * @param {module:nrm-ui/models/nestedModel~PropertyConfig} config Child property configuration.
         * @returns {undefined}
         */
        resetChild: function(key, config) {
            var current = this.get(key), 
                    triggerReload = false,
                    changed,
                    deletesProp = config.deletes,
                    collection = current instanceof Backbone.Collection && current;
            //console.log("resetChild", key, current, config);
            if (current) {
                if (collection && config.collection === true) {
                    // unset model attribute only if it is a lazy-initialized collection
                    // this needs to happen in this scenario regardless of config.resetOnSave
                    // or else event registration won't work properly for the next instance
                    this.unset(key);
                }
                if (config.resetOnSave) {
                    collection = Nrm.app.resetChildCollection(this, key) || collection;
                    triggerReload = true;
                }
            } else if (deletesProp && config.resetOnSave) {
                // when model is saved with deletes arrays, the mid-tier response will set the deletes arrays to null
                changed = this.changedAttributes();
                triggerReload = changed && changed[deletesProp] === null;
            }
            if (deletesProp && config.collection === true && this.get(deletesProp)) {
                // currently, the mid-tier response does not send back a null deletes array for a lazy-loaded collection
                this.set(deletesProp, null);
                triggerReload = triggerReload || config.resetOnSave;
            }
            if (triggerReload) {
                this.trigger('child:reload', this, collection, {
                    attr: key,
                    parent: this,
                    path: './' + key
                });
            }
        },
        /**
         * Handles change event for a nested property by removing event listeners on previous instance and adding event
         * listeners on the new instance.
         * @param {String} prop  Changing attribute name
         * @param {module:nrm-ui/models/nestedModel~PropertyConfig} config Child property configuration
         * @returns {undefined}
         */
        onChildChange: function(prop, config) {
            var existing = this.previous(prop), 
                    current = this.get(prop);
            if (existing && _.isFunction(existing.listenTo)) {
                this.stopListening(existing);
            }
            if (current && _.isFunction(current.listenTo)) {
                Nrm.app.registerChildEvents(this, current, null, null, prop);
            }
        },
        /**
         * Initialize child properties for each configured property that defines a model or collection implementation.
         * @param {Object} attributes The attribute hash that provides initial values to initialize child properties
         * @returns {Object}
         * A new object hash containing keys for each initialized child model or collection.
         */
        initializeChildren: function(attributes) {
            var result = {};
            if (this.constructor.childProperties) {
                _.each(this.constructor.childProperties, function(config, key) {
                    var child;
                    if (config.collection) {
                        child = this.initializeChildCollection(attributes, config.collection, key, config);
                    } else if (config.model) {
                        child = this.initializeChildModel(attributes, config.model, key, config);
                    }
                    if (child !== undefined) {
                        result[key] = child;
                    }
                }, this);
            }
            return result;
        },
        /**
         * Initialize a child collection
         * @param {Object} attributes The attribute hash.
         * @param {Function} collectionType The collection constructor.
         * @param {String} prop The attribute name.
         * @returns {external:module:backbone.Collection} The initialized child collection if the original attribute
         * value is an array or null/undefined, otherwise returns the original attribute value.
         */
        initializeChildCollection: function(attributes, collectionType, prop) {
             return this.initializeChild(attributes, collectionType, prop, function(item) {
                 // initialize empty collection if item is null or undefined
                 return _.isArray(item) || item == null;
             });
        },
        /**
         * Initialize a child model
         * @param {Object} attributes The attribute hash.
         * @param {Function} modelType The model constructor.
         * @param {String} prop The attribute name.
         * @returns {external:module:backbone.Model} If the original attribute value is a plain object, returns the 
         * initialized child model, otherwise returns the original attribute value. 
         */
        initializeChildModel: function(attributes, modelType, prop) {
            return this.initializeChild(attributes, modelType, prop, $.isPlainObject);
        },
        /**
         * Initialize a child model or collection.
         * @param {Object} attributes The attribute hash.
         * @param {Function|Boolean} type The collection or model constructor or true for lazy-loaded.
         * @param {String} prop The attribute name.
         * @param {Function} [typeCheck] A type check function
         * @returns {external:module:backbone.Model|external:module:backbone.Collection}
         * Returns the initialized child model or collection if the original model attribute passes the type check or
         * no type check is defined, otherwise returns the original attribute value.
         */
        initializeChild: function(attributes, type, prop, typeCheck) {
            var data = attributes && attributes[prop];
            if (type === true/*lazy loaded*/ || data instanceof type) {
                return data;
            } else if (_.isFunction(typeCheck) ? typeCheck(data) : data) {
                // pass attr and parentModel options to be consistent with getNestedModel
                return new type(data, {
                    attr: prop,
                    parentModel: this
                });
            } else {
                return data;
            }
        },
        /**
         * Overrides {@link http://backbonejs.org/#Model-clone|Backbone.Model#clone} to ensure that nested models and
         * collections defined in the {@link module:nrm-ui/models/nestedModel.childProperties|childProperties} are also 
         * cloned.
         * @returns {module:nrm-ui/models/nestedModel}
         * The cloned model.
         */
        clone: function() {
            if (this.constructor.childProperties) {
                var cloned = _.clone(this.attributes);
                _.each(this.constructor.childProperties, function(config, key) {
                    var value = cloned[key];
                    if (value instanceof Backbone.Collection) {
                        cloned[key] = new value.constructor(_.map(value.models, function(model) {
                            return model.clone();
                        }));
                    } else if (value instanceof Backbone.Model) {
                        cloned[key] = value.clone();
                    }
                }, this);
                return new this.constructor(cloned);
            } else {
                return BusinessObject.prototype.clone.apply(this, arguments);
            }
        },
        /**
         * Overrides {@link http://backbonejs.org/#Model-parse|Backbone.Model#parse} to initialize nested models and
         * collections based on information configured in the 
         * {@link module:nrm-ui/models/nestedModel.childProperties|childProperties}.
         * @returns {Object}
         * Attributes to set on the model with configured child properties converted from plain objects and arrays to
         * Backbone models and collections.
         */
        parse: function() {
            var resp = BusinessObject.prototype.parse.apply(this, arguments);
            _.extend(resp, this.initializeChildren(resp));
            return resp;
        },
        /**
         * Overrides {@link http://backbonejs.org/#Model-toJSON|Backbone.Model#toJSON} to customize the JSON sent to
         * server accomodating various concerns for child properties including:
         * <ol>
         * <li>Manage an array of deleted model ids for collections.  The deletes list may be maintained as an array
         * of Backbone models that have been removed as collection, so when converting to JSON we need to extract the
         * id attribute from the models, and also remove any items from the list that have been restored in the case
         * of a collection representing a many-to-many relationship.</li>
         * <li>If serializing to {@link module:nrm-ui/localDB|LocalDB}, convert collections representing a many-to-many
         * relationship to a link attribute that is an array of model ids.  The links are stored as a different
         * attribute name in this scenario so that the collection can be loaded from the related object store without
         * storing a copy of all the attributes that would need to be updated when the related object changes.</li>
         * <li>Pass options to the toJSON method of each nested model or collection to propagate customizations based on 
         * the options passed from Backbone.sync.</li>
         * <li>In the future, this implementation may be enhanced to support change graph serialization.</li>
         * </ol>
         * @param {Object} [options] The options passed from {@link http://backbonejs.org/#Sync|Backbone.sync}
         * @returns {Object}
         * Shallow copy of model attributes suitable for JSON stringification.
         */
        toJSON: function(options) {
            var result = BusinessObject.prototype.toJSON.apply(this, arguments);
            if (this.constructor.childProperties) {
                _.each(this.constructor.childProperties, function(config, key) {
                    var value = result[key], deletes, links, linkId = config.linkId || 'id';
                    function findById(collection, id) {
                        if (collection instanceof Backbone.Collection) {
                            return collection.get(id);
                        } else if (_.isArray(collection)) {
                            return _.find(collection, function(item) {
                               if (item instanceof Backbone.Model) {
                                   return item.id === id;
                               } else {
                                   return item[linkId] === id;
                               }
                            });
                        }
                    }
                    function addLink(model) {
                        var id, isModel = model instanceof Backbone.Model;
                        if (isModel) {
                            id = config.linkId ? model.get(config.linkId) : model.id;
                        } else {
                            id = model[linkId];
                        }
                        if (!findById(links, id)) {
                            links.push(isModel ? model.pick(config.linkId || model.idAttribute) : _.pick(model, linkId));
                        }
                    }
                    if (config.deletes) {
                        deletes = result[config.deletes];
                        if (deletes) {
                            deletes = result[config.deletes] = _.reduce(deletes, function(memo, model) {
                                // item in deletes array might be a model or an id value
                                var isModel = model instanceof Backbone.Model,
                                        id = isModel ? model.id : model, restored = findById(value, id), 
                                        deletesId = isModel && config.deletesId,
                                        deletedId = deletesId ? model.get(deletesId) : id;
                                if (!restored && deletedId) {
                                    memo.push(deletedId);
                                } else if (restored && deletesId && !restored.get(deletesId)) {
                                    restored.set(deletesId, deletedId);
                                }
                                return memo;
                            }, []);
                            
                        }
                    }
                    if (config.linkAttr && options && options.localDB) {
                        // stores many-to-many relationships in LocalDB
                        links = result[config.linkAttr];
                        if (links || value) {
                            result = _.omit(result, key);
                            links = result[config.linkAttr] = _.filter(links || [], function(link) {
                                var id = link[linkId];
                                if (deletes && _.indexOf(deletes, id) !== -1) {
                                    return false;
                                } else {
                                    return true;
                                }
                            });
                            if (value instanceof Backbone.Collection) {
                                value.each(addLink);
                            } else if (_.isArray(value)) {
                                _.each(value, addLink);
                            }
                        }
                    } else if (value && options && _.isFunction(value.toJSON)) {
                        result[key] = value.toJSON(options);
                    }
                }, this);
            }
            return result;
        }
    }, /**@lends module:nrm-ui/models/nestedModel**/{
        /**
         * Configuration of child properties. Each object key is the attribute name for a child propertyk, and the value
         * is the configuration that will be used by
         * @type {Object.<String,module:nrm-ui/models/nestedModel~PropertyConfig>}
         */
        childProperties: {},
        /**
         * Default implementation of "IsCollection" rule for a child collection property.  The property may evaluate as
         * an array or a Backbone Collection.  If it is a Backbone Collection, default behavior will validate all models 
         * in the collection, which can be overriden by setting 'validateItems' rule attribute to false.  If it is an 
         * array, default behavior will not validate items in the array unless 'validateItems' is true.  In addition
         * to validating the items in the collection, the rule may also validate min and/or max length of either the 
         * entire collection, or a filtered set defined by 'filter' rule attribute or 'fields' rule attribute.  The 
         * 'filter' attribute may be a function based on {@link http://underscorejs.org/#filter|Underscore.filter} or a 
         * string.  For the latter, the string represents a model attribute name, so that each model matches the filter 
         * if the attribute value matches the 'value' rule attribute if it is defined, otherwise the model matches the 
         * filter if the attribute value is any truthy value.   
         * @param {module:nrm-ui/models/rule} rule The "IsCollection" rule to validate
         * @param {module:nrm-ui/models/rule~BrokenRuleCallback} callback The function to call if the rule is violated.
         * @returns {undefined}
         */
        validateCollection: function(rule, callback) {
            var prop = rule.get("property");
            if (!prop) {
                return;
            }

            function pluralize(i, s, r) {
                if (i !== 1) {
                    _.each(r, function(item, key) {
                        s = s.replace(key, item);
                    });
                };
                return s;
            }
            var coll = this.collections && this.collections[prop],
                    config = this.constructor.childProperties[prop],
                    filter = rule.get("filter"), // may be a function or string (model attribute name)
                    cmp = rule.get("value"), // model attribute value to compare if filter is string
                    fields = rule.get("fields"), // list of fields defining filter condition
                    min = rule.get("min"), 
                    max = rule.get("max"), 
                    msg, cloned, test, loading, dfdQueue = [],
                    validate = rule.get("validateItems");
                ;
                if (config.triggerChange) {
                    var r = this.constructor.rules.findWhere({rule: "IsCollection", property: prop});
                    if (r) {
                        r.set("validated", true);
                    }
                }

            if (!coll || !(_.isArray(coll) || coll instanceof Backbone.Collection)) {
                coll = Rule.evaluateProperty(rule, this, prop);
                if (!coll) {
                    return;
                } else if (!_.isArray(coll) && !(coll instanceof Backbone.Collection)) {
                    cloned = rule.clone();
                    msg = 'Value is not a valid collection.';
                    cloned.set('description', msg);
                    callback(cloned, msg);
                    return;
                }
            }
            if (_.isArray(coll)) {
                // do not validate if 'validateItems' is undefined
                coll = new Backbone.Collection(coll);
            } else {
                // validate unless 'validateItems' is false
                validate = validate !== false;
            }
            if (validate) {
                var invalid = [];
                invalid = coll.filter(function(model) {
                    var validateNow = !rule.get('validated'), validationError;
                    if (validateNow) {
                        validationError = !model.isValid() && model.validationError;
                    } else {
                        validationError = model.validationError;
                    }
                    if (validationError && validationError.promise) {
                        var dfd = $.Deferred();
                        $.when(model.validationError).done(function(br) {
                            if (br && br.length) {
                                dfd.reject(br);
                            } else {
                                dfd.resolve();
                            }
                        }).fail(dfd.reject);
                        dfdQueue.push(dfd);
                    }
                    return !!validationError;
                });
                if (invalid.length) {
                    if (dfdQueue.length) {
                        // at least one model has asynchronous rule validation...
                        // setting the id ensures that the same rule cannot be added to the broken rules collection twice.
                        rule.set('id', rule.cid);
                        loading = $.when.apply($, dfdQueue);
                    }
                    cloned = rule.clone();
                    msg = 'Collection has invalid items.';
                    if (min != null || max != null) {
                        cloned.set('description', msg);
                    }
                    if (loading) {
                        cloned.loading = loading;
                    }
                    callback(cloned, msg);
                }
            }

            // validate min/max length, optionally applying a filter
            if (min != null || (max != null && coll.length > max)) {
                if (_.isFunction(filter)) {
                    test = filter;
                } else if (fields) {
                    // filter on condition defined by rule.get('fields') (and optional 'validator' or 'values')
                    test = function(item) {
                        return Rule.evaluateCondition(rule, item);
                    };
                } else if (_.isString(filter)) {
                    if (cmp !== undefined) {
                        // filter on model attribute defined by rule.get('filter') matches value defined by rule.get('value')
                        test = function(item) {
                            return Rule.evaluateProperty(rule, item, filter) === cmp; 
                        };
                    } else {
                        // filter on model attribute defined by rule.get('filter') is truthy
                        test = function(item) { 
                            return !!Nrm.app.getModelVal(item, filter); 
                        };
                    }
                }
                if (test) {
                    coll = coll.filter(test, this);
                }
                if ((min != null && coll.length < min) || (max != null && coll.length > max)) {
                    msg = rule.get('description');
                    if (!msg) {
                        var item = rule.get("type") || "item";
                        var rep = { "is" : "are" };
                        if (item === "item")
                            rep.item = "items";
                        if (min === undefined)
                            msg = pluralize(max, "No more than " + max + " " + item + " is allowed.", rep);
                        else if (max === undefined)
                            msg = pluralize(min, "At least " + min + " " + item + " is required.", rep);
                        else
                            msg = "Between " + min + " and " + max + " " + (rep[item] || item) + " are required.";
                    }
                    callback(rule.clone(), msg);
                }
            }
        },
        /**
         * Default implementation of "IsNestedModel" rule for a child model property.  Validation will only occur if
         * the property value is a Backbone Model and uses the {@link |Backbone.Model#isValid} implementation of the 
         * model.  
         * @param {module:nrm-ui/models/rule} rule The "IsNestedModel" rule to validate
         * @param {module:nrm-ui/models/rule~BrokenRuleCallback} callback The function to call if the rule is violated.
         * @returns {undefined}
         */
        validateModel: function(rule, callback) {
            var prop = rule.get("property"), model, loading;
            if (!prop) {
                return;
            }
            model = Rule.evaluateProperty(rule, this, prop);
            var validateNow = model instanceof Backbone.Model && !rule.get('validated'), validationError;
            if (validateNow) {
                validationError = !model.isValid() && model.validationError;
            } else {
                validationError = model && model.validationError;
            }
            if (validationError) {
                if (validationError.promise) {
                    // model has asynchronous rule validation...
                    // setting the id ensures that the same rule cannot be added to the broken rules collection twice.
                    rule.set('id', rule.cid);
                    loading = $.Deferred();
                    $.when(model.validationError).done(function(br) {
                        if (br && br.length) {
                            loading.reject(br);
                        } else {
                            loading.resolve();
                        }
                    }).fail(loading.reject);
                }
                var cloned = rule.clone();
                if (loading) {
                    cloned.loading = loading.promise();
                }
                callback(rule.clone(), "Model is invalid.");
            }
        },
        /**
         * Default implementation of "IsDeferred" rule.  This is the simplest example of an asynchronous rule validation
         * which checks for a "loading" property defined on the model attribute as a JQuery promise.
         * @param {module:nrm-ui/models/rule} rule The "IsDeferred" rule to validate
         * @param {module:nrm-ui/models/rule~BrokenRuleCallback} callback The function to call if the rule is violated.
         * @returns {undefined}
         */
        validateDeferred: function(rule, callback) {
            var value = Nrm.Rule.evaluateProperty(rule, this, rule.get('property'));
            if (value && value.loading && _.isFunction(value.loading.promise)) {
                // setting the id ensures that the same rule cannot be added to the broken rules collection twice.
                rule.set('id', rule.cid);
                rule = rule.clone();
                // see module:nrm-ui/models/businessObject.checkRules
                // setting rule.loading on the cloned rule indicates that the rule is evaluated asynchronously.
                // if the promise is rejected, the rule will be added to the broken rules collection.
                rule.loading = value.loading;
                callback(rule, 'Failed to load data.');
            }
        }
    });
    
    _.defaults(BusinessObject.definedRules, {
        "IsCollection": NestedModel.validateCollection,
        "IsNestedModel": NestedModel.validateModel,
        "IsDeferred": NestedModel.validateDeferred
    });
    
    return NestedModel;
});