/**
 * @file The BusinessObject module is a base model extending {@link http://backbonejs.org/#Model|Backbone.Model} to 
 * support business rule validation.
 * @see module:nrm-ui/models/businessObject
 */
/** 
 * BusinessObject is a base model extending {@link http://backbonejs.org/#Model|Backbone.Model} to support business 
 * rule validation.
 * @module nrm-ui/models/businessObject
 */

define(['jquery', 'underscore', '..', 'backbone', './rule', '../resourceCache', '../collections/ruleCollection'], 
    function($, _, Nrm, Backbone, Rule, ResourceCache, RuleCollection) {
    
    Nrm.BusinessObject = Backbone.Model.extend(/** @lends module:nrm-ui/models/businessObject.prototype */{
        // instance properties
        /**
         * Validates business rules.
         * @param {Object} attributes Model attributes to validate, currently not used.
         * @param {Object} opts
         * @param {string} [opts.property] Only validate the specified property, use this with caution because it 
         * might not produce the result one might expect.
         * @returns {string|undefined}
         * Returns a string if there are errors, or undefined if the model is valid.
         * @see {@link http://backbonejs.org/#Model-validate|Backbone.Model#validate}
         */
        validate: function(attributes, opts) {
            var mc = this.constructor;
            if (mc.rules) {
                if (!this.brokenRules) {
                    /**
                     * Broken rule collection.
                     * @name module:nrm-ui/models/businessObject#brokenRules
                     * @type {?module:nrm-ui/collections/ruleCollection}
                     */
                    this.brokenRules = new RuleCollection();
                }
                return mc.checkRules(this, opts);
            }
        },
        /**
         * Trigger {@link http://backbonejs.org/#Events-catalog|Backbone.Model change event} if Backbone.Model#_changing 
         * is false and update {@link http://backbonejs.org/#Model-changed|Backbone.Model#changed].
         * @param {String|Object} attribute Changed attribute name or attributes hash.
         * @param {Object} [value] Changed value or options hash.
         * @param {Object} [options] Options hash.
         * @returns {module:nrm-ui/models/businessObject}
         * Returns this instance to allow chaining.
         */
        triggerChange: function(attribute, value, options) {
            var attributes;
            if (_.isString(attribute)) {
                attributes = {};
                attributes[attribute] = value;
            } else if (_.isObject(attribute)) {
                attributes = attribute;// _.without(attribute, this.setFunctions);
                options = value;
            } else {
                return this;
            }
            if (!this._changing) {
                // reset changed attribute hash
                this.changed = _.extend({}, attributes);
                // set _changing to true to avoid circular event handlers
                this._changing = true;
                this.trigger('change', this, options);
                this._changing = false;
            } else {
                // model is already changing, don't trigger change event again, but update changed attribute hash
                _.extend(this.changed, attributes);
            }
            return this;
        }
    },
    /** @lends module:nrm-ui/models/businessObject */
    {
        // class properties
        /**
         * Defined rules, each rule name referenced in the rules configuration must be defined on this object.
         * @type {Object.<string,module:nrm-ui/models/rule~RuleImplementation>}
         */
        definedRules: {
            "IsRequired": Rule.isRequired,
            "IsAlpha": Rule.isAlpha,
            "IsNumeric": Rule.isNumeric,
            "IsDate": Rule.isDate
        },
        /**
         * Sets changeType and rowIndex property on an object, and adds to a changedData array which must be defined
         * externally.
         * @todo Provide an example of how to use this properly or deprecate.
         * @param {Object} obj
         * @param {*} changeType Value of the "changeType" attribute to set
         * @param {*} rowIndex Value of the "rowIndex" attribute to set.
         * @returns {Object}
         * Cloned object with changeType and rowIndex.
         */
        addToChangedData: function (obj, changeType, rowIndex) {
            var a = obj.clone();
            a.changeType = changeType;
            if (rowIndex !== undefined)
                a.rowIndex = rowIndex;
            this.changedData.push(a);
            return a;
        },
        /**
         * Validate business rules on a model.
         * @param {module:nrm-ui/models/businessObject} obj The model to check.
         * @param {Object} options
         * @param {string} [options.property] Only validate the specified property, use this with caution because it 
         * might not produce the result one might expect.
         * @returns {string|undefined}
         */
        checkRules: function (obj, options) {
            var defaults = {},
                that = this,
                retVal,
                dfd,
                dfdQueue = [];
        
            function brokenRuleCallback(br, msg) {
                if (br.get('description') === undefined) {
                    br.set('description', msg);
                }
                br.objID = obj.id;
                if (br.loading && $.isFunction(br.loading.promise)) {
                    dfdQueue.push($.when(br.loading).fail(function() {
                        br.loading = false;
                        obj.brokenRules.set(br);
                        retVal = 'Errors';
                    }));
                } else {
                    obj.brokenRules.add(br);
                    retVal = 'Errors';
                }
            }
            function evaluationFailed(rule, msg) {
                rule = rule.clone();
                rule.set('description', msg);
                brokenRuleCallback(rule, msg);
            }
            
            this.options = $.extend({},defaults, options);
            obj.brokenRules.reset();
            $.each(this.rules.models, function (i, rule) {
                if (that.options.property !== undefined) {
                    if (rule.get('property') !== that.options.property) {
                        return;
                    }
                }
                var x = Nrm.BusinessObject.definedRules[rule.get('rule')];
                if (x === undefined) {
                    x = rule.get('rule');
                }
                if ($.isFunction(x)) {
                    try {
                        x.call(obj, rule, brokenRuleCallback);
                    } catch (error) {
                        evaluationFailed(rule, 'Rule evaluation failed: ' + ((error && error.message) || error));
                    }
                } else {
                    evaluationFailed(rule, 'Rule definition for ' + x + ' is incomplete.');
                }
            });
            if (!retVal && dfdQueue.length) {
                dfd = $.Deferred();
                //console.log('Validating async rules...');
                $.when.apply($, dfdQueue).done(function() {
                    //console.log('Validated async rules.');
                    //var result = Nrm.BusinessObject.checkRules.call(that, obj, options);
                    //dfd.resolve(result);
                    dfd.resolve(obj.brokenRules);
                }).fail(dfd.reject);
                retVal = dfd.promise();
            } 
            return retVal;
        },
        /**
         * Checks if a model is currently valid based on the length of brokenRules
         * @param {module:nrm-ui/models/businessObject} obj
         * @returns {Boolean}
         * Return true if the model is valid.
         */
        isValid: function (obj) {
            return (obj.brokenRules.length === 0);
        }
    });

    /**
     * Add the "IsInList" business rule to a collection of rules.
     * @name module:nrm-ui/models/businessObject.addInListRule
     * @function
     * @param {module:nrm-ui/collections/ruleCollection} rules The rule collection
     * @param {string} field Attribute name that the rule applies to.
     * @param {Array} list List of valid values.
     */
    Nrm.BusinessObject.addInListRule = function(rules, field, list) {
        Nrm.BusinessObject.definedRules.IsInList = Nrm.Rule.isInList;
        var rule = new Rule({
            "rule":"IsInList",
            "property":field,
            "list":list
        });
        rules.push(rule);
    };
    /**
     * Add the "StartLessThanEnd" rule to a collection of rules
     * @name module:nrm-ui/models/businessObject.addStartLessThanEndRule
     * @function
     * @param {module:nrm-ui/collections/ruleCollection} rules The rule collection
     * @param {string} startField Attribute name for the start date.
     * @param {string} endField Attribute name for the end date.
     * @param {Object} options Options to pass to the "StartLessThanEnd" rule.
     */
    Nrm.BusinessObject.addStartLessThanEndRule = function (rules, startField, endField, options) {
        Nrm.BusinessObject.definedRules.StartLessThanEnd = Rule.startLessThanEnd;
        var rule = new Rule({
            "rule": "StartLessThanEnd",
            "property": startField,
            "endField": endField,
            "options": options
        });
        rules.push(rule);
    };

    /**
     * Add the "LowLessThanHigh" rule to a collection of rules
     * @name module:nrm-ui/models/businessObject.addLowLessThanHighRule
     * @function
     * @param {module:nrm-ui/collections/ruleCollection} rules The rule collection
     * @param {string} lowField Attribute name that provides the minimum value
     * @param {string[]} highFields Attribute names for each field that must be greater than the lowField.
     */
    Nrm.BusinessObject.addLowLessThanHighRule = function (rules, lowField, highFields) {
        Nrm.BusinessObject.definedRules.LowLessThanHigh = Rule.lowLessThanHigh;
        var rule = new Rule({
            "rule": "LowLessThanHigh",
            "property": lowField,
            "fields": highFields
        });
        rules.push(rule);
    };
    /**
     * Add the "IsConditionallyRequired" rule to a collection of rules
     * @name module:nrm-ui/models/businessObject.addConditionallyRequiredRule
     * @function
     * @param {module:nrm-ui/collections/ruleCollection} rules The rule collection
     * @param {string} field Attribute name that the rule applies to.
     * @param {string[]} conditionalFields Attributes that the conditionally required field is dependent on.
     */
    Nrm.BusinessObject.addConditionallyRequiredRule = function (rules, field, conditionalFields, options) {
        Nrm.BusinessObject.definedRules.IsConditionallyRequired = Rule.conditionallyRequired;
    //    var rule = new Nrm.Rule({
    //        "rule":"IsConditionallyRequired",
    //        "property":field, 
    //        "fields":conditionalFields,
    //        "valueAllowed":valueAllowed
    //    });
        var rule = new Rule($.extend({ }, options, {
            "rule":"IsConditionallyRequired",
            "property":field, 
            "fields":conditionalFields
        }));
        rules.push(rule);
    };

    /**
     * Load business rules into a rules collection from a configuration file.
     * @name module:nrm-ui/models/businessObject.addBusinessRules
     * @function
     * @param {string} query URL of the rules configuration resource, e.g. a JSON file.
     * @param {string} entity Entity name in the rules configuration
     * @param {module:nrm-ui/collections/ruleCollection} rules The rules collection
     * @param {Function} callback A function that will be called when the rules have successfully loaded.
     * @param {type} errCallback A function that will be called if the request fails.
     * @returns {external:module:jquery~Promise}
     * Returned promise is resolved when the rules are loaded successfully.
     */
    Nrm.BusinessObject.addBusinessRules = function (query, entity, rules, callback, errCallback) {
        return ResourceCache.getJsonData({ url: query }).done(function(c) {
            rules.reset();
            $.each(c.Entities, function(i, item) {
                if(item.Entity === entity || entity === undefined) {
                    $.each(item.Properties, function(i, item2) {
                        var str = item2.Property;
                        $.each(item2.Rules, function(i, item3) {
                            item3.property = str;
                            item3.entity = item.Entity;
                            rules.add(new Rule(item3));
                        });
                    });
                }
            });
            if ($.isFunction(callback)) callback();
        }).fail(function(data) {
            var error = data.error || data;
            if (typeof errCallback === "function")
                errCallback(error, error && error.response);
        });
    };
    return Nrm.BusinessObject;
});
