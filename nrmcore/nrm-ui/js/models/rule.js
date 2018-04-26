/**
 * @file The Rule module is a Backbone.Model that defines a set of standard business rules.
 * @see module:nrm-ui/models/rule
 */
/** 
 * @module nrm-ui/models/rule
 */
/*jslint sloppy: true, devel: true, indent: 4 */

// NrmRule.js provides functionality to store the rules for a NrmBusinessObject,
// validate those rules, and store the invalid ones.
define(['..', 'backbone', 'underscore', 'jquery'], function(Nrm, Backbone, _, $) {

    /**
     * Callback function that is called by rule implementations if the rule is violated.
     * @callback BrokenRuleCallback
     * @param {module:nrm-ui/models/rule} rule Cloned business rule.
     * @param {string} msg The default message if it is not defined as an attribute of the rule.
     * @returns {undefined}
     */
    
    /**
     * Implementation of a business rule.
     * @callback RuleImplementation
     * @param {module:nrm-ui/models/rule} rule The rule to validate.
     * @param {module:nrm-ui/models/rule~BrokenRuleCallback} callback The function to call if the rule is violated.
     * @returns {undefined}
     */

    Nrm.Rule = Backbone.Model.extend(/** @lends module:nrm-ui/models/rule.prototype */ {
        // instance properties
        /**
         * Create a Rule.
         * @constructor
         * @alias module:nrm-ui/models/rule
         * @classdesc
         * Extends {@link http://backbonejs.org/#Model|Backbone.Model} to represent a business rule.
         * @returns {undefined}
         */
        initialize: function(){
            if (this.get("priority") === undefined) {
                this.set("priority",2);
            }
        }
    }, /** @lends module:nrm-ui/models/rule */{
        /**
         * Evaluate condition that activates a conditional rule such as conditionally required.  The rule should specify 
         * a "fields" array that determines the conditions, and may optionally provide a "validator" function which will
         * be passed two arguments, field value and attribute name, or the rule might also specify a "values" object 
         * hash with values to compare for each attribute.  If neither "values" or "validator" are provided, the default
         * behavior will evaluate to true if the attribute value is truthy.  The fields are evaluated with OR boolean
         * operator by default (so that only one field has to match the condition, but rule can specify the
         * "matchAllFields" option to test all fields.
         * @param {module:nrm-ui/models/rule} rule The conditional rule to evaluate.
         * @param {external:module:backbone.Model} model The model that provides evaluation context.
         * @returns {Boolean} Indicates whether the condition applies.
         */
        evaluateCondition: function(rule, model) {
            var ret = false, 
                matchAll = !!rule.get('matchAllFields'),
                values = rule.get('values'), 
                fields = rule.get('fields'),
                validator = rule.get('validator') || function(field, prop) { 
                    if (values && values[prop]) {
                        return field === values[prop];
                    } else {
                        return !!field;
                    }
                };
            if (fields) {
                $.each(rule.get('fields'), function(i, prop) {
                    var field = Nrm.Rule.evaluateProperty(rule, model, prop);
                    if (validator.call(model, field, prop)) {
                        ret = true;
                        // Evaluation stops at the first true condition by default, or evaluates all fields 
                        // if matchAllFields is true
                        return matchAll;
                    }
                });

            }
            return ret;
        },
        /**
         * Evaluate a model property
         * @param {module:nrm-ui/models/rule} rule The rule being validated.
         * @param {external:module:backbone.Model} model The model that provides evaluation context.
         * @param {String|Function} prop May be the name of a model attribute or a function to be called with model as
         * the context and the rule as the argument.
         * @returns {*}
         * Value of the property.
         */
        evaluateProperty: function(rule, model, prop) {
            if ($.isFunction(prop)) {
                return prop.call(model,rule);
            } else if (Nrm.app) {
                return Nrm.app.getModelVal(model, prop);
            } else if (model) {
                return model.get(prop);
            }
        }
    });

    /*Nrm.RuleCollection = Backbone.Collection.extend({
            model: Nrm.Rule
    });*/

    /*Nrm.Rule.SortByPriority = function (a, b) {
        if (a.property === b.property) {
            return ((a.priority < b.priority) ? -1 : ((a.priority > b.priority) ? 1 : 0));
        }
        return ((a.Property < b.Property) ? -1 : 1);
    };*/

    /*
    Nrm.Rule.ShowHighestPriorityOnly = function (brokenRules) {
        brokenRules.sort(NrmBrokenRule.SortByPriority);
        var prop, priority;
        $.each(brokenRules, function (i, rule) {
            if (i > 0) {
                if (rule.property === prop) {
                    if (rule.priority > priority) {
                        delete brokenRules[i];
                    }
                } else {
                    prop = rule.property;
                    priority = rule.priority;
                }
            } else {
                prop = rule.property;
                priority = rule.priority;
            }
        });
    };
    */
    /**
     * Update elements to reflect the properties of a rule, only works if the UI element has been added to the page,
     * which limits its usefulness since most views are rendered before they are added to the page.
     * @name module:nrm-ui/models/rule.updateHTML
     * @function
     * @param {module:nrm-ui/models/rule} rule The rule
     * @param {Object} options
     * @param {string} options.field The JQuery selector for the UI element.
     * @param {string} options.label The JQuery selector for the label of the element.
     */
    Nrm.Rule.updateHTML = function(rule, options) {
        if (rule.get("rule") === "IsRequired") {
            $(options.field).prop('required',true);
            if (options.label !== undefined) {
                $(options.label).addClass("nrm-required-field");
            }
        }
    };
    
    /**
     * Get a rule by attribute name and rule name
     * @name module:nrm-ui/models/rule.getRule
     * @function
     * @param {*} p The object that defines the rules collection, typically a model constructor.  
     * @param {string} propertyName The attribute name
     * @param {string|Function} ruleMethod The rule name, or the actual rule function if it is a custom rule that is 
     * not defined in {@link module:nrm-ui/models/businessObject.definedRules|BusinessObject.definedRules}
     * @returns {module:nrm-ui/models/rule|undefined}
     * Returns the found rule or undefined if it is not found.
     */
    Nrm.Rule.getRule = function(p, propertyName, ruleMethod, callback) {
        var retVal;
        p.rules.models.forEach(function(rule){
            if(rule.get("property") === propertyName) {
                if(rule.get("rule") === ruleMethod) {
                    retVal = rule;
                    return;
                }
            }
        });
        return retVal;
    };

    /**
     * Implementation of the "IsRequired" rule: Model attribute is considered valid unless it has zero length or is a
     * falsey value other than the number zero.
     * @name module:nrm-ui/models/rule.isRequired
     * @function
     * @param {module:nrm-ui/models/rule} rule The rule to validate.
     * @param {module:nrm-ui/models/rule~BrokenRuleCallback} callback The function to call if the rule is violated.
     * @returns {undefined}
     */
    Nrm.Rule.isRequired = function (rule, callback) {
        var str = rule.get("property");
        if (str === undefined) {
            return;
        }
        var msg;

        if ($.isFunction(str)) {
            str = str.call(this,rule);
        } else {
            str = this.get(str);
        }
        if (!str && str !== 0) {
            msg = "Required field";
            callback(rule.clone(),msg);
        } else if (str.length !== undefined && str.length === 0) {
            msg = "Required field";
            callback(rule.clone(),msg);
        }
    };
    /**
     * Implementation of the "IsAlpha" rule checks min and max length and a variety of patterns.
     * @name module:nrm-ui/models/rule.isAlpha
     * @function
     * @param {module:nrm-ui/models/rule} rule The rule to validate.
     * @param {module:nrm-ui/models/rule~BrokenRuleCallback} callback The function to call if the rule is violated.
     * @returns {undefined}
     */
    Nrm.Rule.isAlpha = function (rule, callback) {
        var msg,
            str = this.get(rule.get("property"));
        if (str === undefined || str === null || str.length === 0) {
            return;
        }

        if (rule.get("lettersOnly")) {
            if (!str.match(/^[a-zA-Z\s]+$/)) {
                msg = "Only letters are allowed";
                callback(rule.clone(),msg);
            }
        } else if (rule.get("numbersOnly")) {
            if (!str.match(/^[0-9\s]+$/)) {
                msg = "Only numbers are allowed";
                callback(rule.clone(),msg);
            }
        } else if (rule.get("lettersNumbersOnly")) {
            if (!str.match(/^[0-9a-zA-Z\s]+$/)) {
                msg = "Only letters and numbers are allowed";
                callback(rule.clone(),msg);
            }
        }

        if (rule.get("uppercaseOnly")) {
            if (str.match(/[a-z]/)) {
                msg = "Only uppercase letters are allowed";
                callback(rule.clone(),msg);
            }
        }
        else if (rule.get("uppercaseFirst")) {
            if (str.match(/^[a-z]/)) {
                msg = "First letter must be capitalized";
                callback(rule.clone(),msg);
            }
        }

        if (str.length > rule.get("maxLength")) {
            msg = "Exceeds maximum length of " + rule.get("maxLength");
            callback(rule.clone(),msg);
        } else if (str.length < rule.get("minLength")) {
            msg = "Less than minimum length of " + rule.get("minLength");
            callback(rule.clone(),msg);
        }
    };
    
    /**
     * Implementation of the "IsNumeric" rule checks min and max values and other options for specialized numeric rules,
     * such as allowing decimal points and negative numbers.
     * @name module:nrm-ui/models/rule.isNumeric
     * @function
     * @param {module:nrm-ui/models/rule} rule The rule to validate.
     * @param {module:nrm-ui/models/rule~BrokenRuleCallback} callback The function to call if the rule is violated.
     * @returns {undefined}
     */
    Nrm.Rule.isNumeric = function (rule, callback) {
        var str = this.get(rule.get("property"));
        if (str === undefined || str === null) {
            return;
        }

        var msg, n;
        if ($.type(str) !== "string") { //(typeof(str)==="number"){
            str = str.toString();
        }

        if (!str.match(/^-?\d*\.?\d*$/)) {
            msg = "Must be a number";
            callback(rule.clone(),msg);
        } else {
            if (rule.get("allowNegative") === undefined || rule.get("allowNegative") === false) {
                if (str.match(/^-/)) {
                    msg = "Negative values not allowed";
                    callback(rule.clone(),msg);
                }
            }
            if (rule.get("allowDecimalPoint") === undefined || rule.get("allowDecimalPoint") === false) {
                if (str.match(/\./)) {
                    msg = "Decimal values not allowed";
                    callback(rule.clone(),msg);
                }
            }
            if (rule.get("isPercent")) {
                n = Number(str);
                if (n < 0 || n > 100) {
                    msg = "Invalid percent";
                    callback(rule.clone(),msg);
                }
            }
            if (Number(str) < rule.get("minValue")) {
                msg = "Must be greater than or equal to " + rule.get("minValue");
                callback(rule.clone(),msg);
            } else if (Number(str) > rule.get("maxValue")) {
                msg = "Must be less than or equal to " + rule.get("maxValue");
                callback(rule.clone(),msg);
            }
        }
    };

    /**
     * Implementation of the "IsDate" rule checks min and max values and other options for specialized date rules,
     * such as allowing time, seconds, or an ISO-formatted UTC date.
     * @name module:nrm-ui/models/rule.isDate
     * @function
     * @param {module:nrm-ui/models/rule} rule The rule to validate.
     * @param {module:nrm-ui/models/rule~BrokenRuleCallback} callback The function to call if the rule is violated.
     * @returns {undefined}
     */    
    Nrm.Rule.isDate = function(rule, callback) {
        var prop = rule.get("property");
        if (prop === undefined) return;
        var str = Nrm.Rule.evaluateProperty(rule, this, prop);
        if (str != null && !_.isString(str)) {
            // value must be a string or null/undefined
            callback(rule.clone(),"Date must be expressed as a string.");
            return;
        }
        if (!str) return; // ok here, IsRequired rule evaluated separately
        var secondsRequired = rule.get("requireSeconds"), 
                utcRequired = rule.get("requireUtc"),
                allowUtc = utcRequired || rule.get("allowUtc"),
                allowSeconds = secondsRequired || allowUtc || rule.get("allowSeconds"),
                timeRequired = secondsRequired || utcRequired || rule.get("requireTime"), 
                allowTime = timeRequired || allowSeconds || allowUtc || rule.get("allowTime"),
                fmt = rule.get("displayFormat"),
                re = rule.get("pattern"),
                msg = rule.get("description"),
                bound, boundDate;
        // If specified, pattern should be a JSON string
        if (re && _.isString(re)) {
           re = new RegExp(re);
        } else {
           // default format is based on RFC 3339, matches entire string and does not allow timezones
           re = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}(:\d{2}(?:\.\d+)?(Z?))?))?$/;
        }
        var m = str.match(re);
        if (!m || (!allowTime && m.length > 4 && m[4]) 
               || (!allowSeconds && m.length > 5 && m[5])
               || (secondsRequired && (m.length < 6 || !m[5]))
               || (!allowUtc && m.length > 6 && m[6])
               || (utcRequired && (m.length < 7 || !m[6]))
               || (timeRequired && (m.length < 5 || !m[4]))
               || (!rule.get("patternOnly") && !$.isNumeric(new Date(str).getDate()))
           ) {
            if (!msg && !fmt && fmt !== false) {
                // note that default display format intentionally does not match the expected data format
                fmt = "mm/dd/yyyy";
                if (secondsRequired)
                    fmt += " hh24:mi:ss";
                else if (timeRequired)
                    fmt += " hh24:mi";
                else if (allowTime)
                    fmt += " or mm/dd/yyyy hh24:mi";
                if (!secondsRequired && allowSeconds)
                    fmt += " or mm/dd/yyyy hh24:mi:ss";
            }
            callback(rule.clone(), msg || ("Invalid date" + (fmt ? ", please enter value in format " + fmt : "")));
            return;
        }

        function formatDate(date) {
            if (date === 'today' || date === 'now') {
                var d = new Date();
                // get today's date in current timezone
                d = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
                if (date === 'today') 
                    date = d.substr(0,10);
                else
                    date = d.substr(0,d.length - 1);
            }
            return date;
        }
        function formatCmpDate(date, cmp) {
            var testCmp = date;
            if (cmp.length === 10) {
                testCmp = date.substr(0, 10);
            } else if (str.length === 10) {
                testCmp = date + 'T00:00';
                if (cmp.substr(cmp.length - 1) === 'Z') {
                     testCmp += 'Z';
                }
            }
            return testCmp;
        }
        function formatDisplay(date) {
            if (date === 'today') {
                return date;
            } else if (date === 'now') {
                return 'current time';
            }
            var match = date.match(re);
            if (match) {
                if (match[6])
                    return date; // return UTC string
                date = match[2] + '/' + match[3] + '/' + match[1];
                if (match[4]) {
                    date += (' ' + match[4]);
                }
            }
            return date;
        }
        bound = rule.get('minValue');
        if (bound) {
            boundDate = formatDate(bound);
            if (new Date(formatCmpDate(str, boundDate)) < new Date(boundDate)) {
                callback(rule.clone(), 'Date must be ' + formatDisplay(bound) + ' or later');
                return;
            }
        }
        bound = rule.get('maxValue');
        if (bound) {
            boundDate = formatDate(bound);
            if (new Date(formatCmpDate(str, boundDate)) > new Date(boundDate)) {
                callback(rule.clone(), 'Date must be ' + formatDisplay(bound) + ' or earlier');
                return;
            }
        }
    };
    /**
     * Implementation of the "IsInList" rule checks attribute value against a list of valid values.
     * @name module:nrm-ui/models/rule.isInList
     * @function
     * @param {module:nrm-ui/models/rule} rule The rule to validate.
     * @param {module:nrm-ui/models/rule~BrokenRuleCallback} callback The function to call if the rule is violated.
     * @returns {undefined}
     */
    Nrm.Rule.isInList = function(rule, callback) {
        var str = this.get(rule.get("property"));
        if (str === undefined) {
            return;
        }

        var items = $.grep(rule.get("list"), function(item) {
            return (item === str);
        });
        if(items.length === 0) {
            var msg = "Item not found in list";
            callback(rule.clone(),msg);
        }
    };
    /**
     * Implementation of the "StartLessThanEnd" rule checks a date attribute that must be less than an end date 
     * attribute.
     * @name module:nrm-ui/models/rule.startLessThanEnd
     * @function
     * @param {module:nrm-ui/models/rule} rule The rule to validate.
     * @param {module:nrm-ui/models/rule~BrokenRuleCallback} callback The function to call if the rule is violated.
     * @returns {undefined}
     */
    Nrm.Rule.startLessThanEnd = function (rule, callback) {
        var startProp = rule.get("property"),
            endProp = rule.get("endField"),
            start = this.get(startProp),
            end = this.get(endProp);
        if (start === "" || end === "") {
            return;
        }

        var options = rule.get("options"),
            d,
            pStart,
            pEnd,
            interval = 0;
        if (options) {
            // start and end are time values
            if (options.startDate) {
                d = this.get(options.startDate);
                pStart = Date.parse(d + "T" + start);
                pEnd = Date.parse(d + "T" + end);
            }
            if (options.interval) {
                interval = options.interval;
            }
        }

        if (pStart === undefined) {
            pStart = Date.parse(start);
            pEnd = Date.parse(end);
        }

        if (pEnd < pStart + interval) {
            var msg = startProp + " must be less than " + endProp;
            if (interval > 0) {
                msg += " plus " + interval / 60000 + " minutes";
            }
            callback(rule.clone(), msg);
        }
    };
    /**
     * Implementation of the "LowLessThanHigh" rule checks a numeric attribute that must be less than one or more other
     * attributes.
     * @name module:nrm-ui/models/rule.lowLessThanHigh
     * @function
     * @param {module:nrm-ui/models/rule} rule The rule to validate.
     * @param {module:nrm-ui/models/rule~BrokenRuleCallback} callback The function to call if the rule is violated.
     * @returns {undefined}
     */
    Nrm.Rule.lowLessThanHigh = function (rule, callback) {
        var that = this, prevHigh = 0,
            msg,
            low = this.get(rule.get("property"));
        if (low === undefined || low.length === 0) {
            return;
        }
        var q = rule.get("fields");
        $.each(rule.get("fields"), function (i, prop) {
            var high = that.get(rule.get(prop));
            if (high !== undefined && high.length > 0 && Number(low) > Number(high)) {
                prevHigh = (high > prevHigh) ? high : prevHigh;
                msg = "Cannot be less than " + low;
                callback(rule.clone(), msg);
            }
        });
        if (prevHigh > 0) {
            msg = "Cannot be greater than " + prevHigh;
            callback(rule.clone(), msg);
        }
    };
    /**
     * Implementation of the "IsConditionallyRequired" rule validates that the attribute is required if one or more other
     *  attributes have a value or match a condition
     * @name module:nrm-ui/models/rule.conditionallyRequired
     * @function
     * @param {module:nrm-ui/models/rule} rule The rule to validate.
     * @param {module:nrm-ui/models/rule~BrokenRuleCallback} callback The function to call if the rule is violated.
     * @returns {undefined}
     */
    Nrm.Rule.conditionallyRequired = function(rule, callback) {
        var found = false,
            msg,
            q = rule.get("property"),
            req;
        if ($.isFunction(q)) {
            req = q.call(this,rule);
        } else {
            req = this.get(q);
        }
        if (!req || req.length === 0) {
            found = Nrm.Rule.evaluateCondition(rule, this);
            if (found) {
                // property is required.
                msg = "Required field";
                callback(rule.clone(),msg);
            }
        }
        // TODO: the handling of "valueAllowed" option doesn't really make sense, but changing it might break something.
        if(!found && rule.get("valueAllowed") === false && req && req.length > 0) {
            _.each(rule.get("fields"), function(prop) {
                var field = this.get(rule.get(prop));
                if (!found && field !== undefined && field.length === 0) {
                    found = true;
                }
            }, this);
            if(found) {
                msg = "Should not have a value";
                callback(rule.clone(),msg);
            }
        }
    };/**
     * Implementation of the "IsConditionallyAllowed" rule validates that the attribute can only have a value if one or
     * more other attributes have a value or match a condition.
     * @name module:nrm-ui/models/rule.conditionallyAllowed
     * @function
     * @param {module:nrm-ui/models/rule} rule The rule to validate.
     * @param {module:nrm-ui/models/rule~BrokenRuleCallback} callback The function to call if the rule is violated.
     * @see {@link module:nrm-ui/models/rule.evaluateCondition} for details of how the condition is evaluated.
     * @returns {undefined}
     */
    Nrm.Rule.conditionallyAllowed = function(rule, callback) {
        var found = false,
            msg,
            q = rule.get("property"),
            req;
        if ($.isFunction(q)) {
            req = q.call(this,rule);
        } else {
            req = this.get(q);
        }
        if (req && req.length !== 0) {
            found = Nrm.Rule.evaluateCondition(rule, this);
            if (!found) {
                // property value is not allowed.
                msg = "Value is not allowed";
                callback(rule.clone(),msg);
            }
        }
    };
    
    return Nrm.Rule;
});
