/**
 * This module is loaded by the app main module to define custom rules and extend the Nrm.BusinessObject prototype to
 * support evaluation of "editable" status based on a collection of editable admin units. 
 * @module app/models/customBOValidationRules
 */
define(['nrm-ui',
        'nrm-ui/models/businessObject',
        'nrm-ui/models/nestedModel',
        'jquery',
        'underscore',
        'backbone',
        '../utils/cloner',
        'nrm-ui/models/rule'],
        function(Nrm, BusinessObject, NestedModel, $, _, Backbone,Cloner, Rule) {
    
    function getProp(model, prop, rule) {
        if ($.isFunction(prop)) {
            return prop.call(model,rule);
        } else {
            return model.get(prop);
        }
    } 
    function pluralize(i, s, r) {
        if (i !== 1) {
            _.each(r, function(item, key) {
                s = s.replace(key, item);
            });
        };
        return s;
    };


    BusinessObject.definedRules["IsUnique"] = function (rule, callback) {
        if (!this.collection || !this.get("selected")) return;
        
        var prop = rule.get("property");
        if (prop === undefined) {
            return;
        }
        var str = getProp(this, prop, rule);
        if (str == null || str === '')
            return; // (null || undefined) || empty string
        
        var dup = this.collection.find(function(model) {
            if (model.cid === this.cid || !model.get("selected")) return false;
            var cmp = getProp(model, prop, rule);
            return cmp !== '' && cmp == str; // double-equals on purpose
        }, this);
        if (dup) {
            var msg = "Value must be unique";
            callback(rule.clone(),msg);
        } 
    };

//    BusinessObject.definedRules["isStepValid"] = function(rule, callback) {
//
//        var prop = rule.get("property"),
//            currentStep = this.get(prop);
//        if (!prop) {
//            return;
//        }
//    };
//
//    BusinessObject.definedRules["isNestedModel"] = function(rule, callback) {
//
//        var prop = rule.get("property"),
//            currentStep = this.get(prop);
//        if (!prop) {
//            return;
//        }
//
//        if (currentStep && currentStep instanceof Backbone.Model) {
//
//            var stepId = currentStep.get("stepId"),
//                invalid = currentStep.isChanged && currentStep.validate && currentStep.validate();
//
//            if (invalid) {
//                callback(rule.clone(), "currentStep has some errors");
//            }
//
//        }
//
//    };

    BusinessObject.definedRules["IsNumericWithCommas"] = function(rule, callback) {

        var str = this.get(rule.get("property"));
        if (str === undefined || str === null) {
            return;
        }

        var msg, n;
        if ($.type(str) !== "string") {
            str = str.toString();
        }

        if (!str.match(/^\d+(,\d{3})*(\.\d+)?$/)) {
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
                msg = "Must be less than " + rule.get("maxValue");
                callback(rule.clone(),msg);
            }
        }
    };


    BusinessObject.definedRules["isOtherFileLabelSelected"] = function(rule, callback) {


        var prop = rule.get("property"),
            self = this;

        var fileLabelCn = this.get('selectedFileLabelCn');



        if (!prop) {
            return;
        }

        //over  here write the logic to check
        if (fileLabelCn){

            var displayAttributes = this.get('displayOrderToUiAttribute');
            _.each(displayAttributes[15].multipleSelectValues, function(item) {
                if (item.id  == fileLabelCn && item.value == "Other"){

                    if (!self.get('otherDesc')){
                        callback(rule.clone(), "Required field");
                    }
                }
            });
        }

    };
    BusinessObject.definedRules["DemoConditionalRequire"] = function (rule, callback) {
        var prop = rule.get("property"),
            other = rule.get("dependency"),
            value = rule.get("value"),
            str = getProp(this, other, rule),
            req = (value || value === 0) ? (str == value) : (str || str === 0), cloned;

        if (req) {
            str = getProp(this, prop, rule);
            if (!str && str !== 0) {
                callback(rule.clone(), rule.get("description") || "Value is required if " +  other + " is assigned.");
            }
        } else if (rule.get("elseNull")) {
            str = getProp(this, prop, rule);
            if (str || str === 0) {
                cloned = rule.clone();
                cloned.set("description", "Value not allowed.");
                callback(cloned, "Value not allowed.");
            }
        }
    };


    BusinessObject.definedRules["isOnlyOneSelected"] = function (rule, callback) {
        var prop = rule.get("property"),
        cloned = rule.clone(),
         collection = this.get(prop)


        if ((prop == "counties" || prop == "states" || prop == "forests" ) && collection.size() > 1){
            var text;
            if (prop == "counties"){
                text = "county"
            } else if (prop == "forests"){
                text = "forest"
            }else if (prop == "states"){
                text = "state"
            }

            cloned.set("description", "Please make sure only one " + text + " is selected.");
            callback(cloned, "Only one value can be selected. ");
        }


    };

    BusinessObject.definedRules["validatePersonAttrs"] = function (rule, callback) {
        var prop = rule.get("property"),
            cloned = rule.clone(),
            personAttrs = this.get("person"),
            self = this;



        if (!personAttrs || !_.has(personAttrs,prop)){
            callback(cloned, prop + " is a Required field");
        }
        /*if (prop == "name" && this.get("name")){
            callback(cloned, item + " is a Required field");
        }*/

    };

    BusinessObject.definedRules["ValidateContactFormFields"] = function (rule, callback) {
        var msg = this.getValidationMessage(rule);

        if(msg){
            callback(rule.clone(), msg);
        }
    };


    BusinessObject.definedRules["validateAddressAttrs"] = function (rule, callback) {
        var prop = rule.get("property"),
            cloned = rule.clone(),
            addressAttrs = this.get("addresses"),
            self = this;

        var requiredAddressProps = ["addressLine1", "city", "country", "postalCode", "state"];

         if (!addressAttrs || !_.has(addressAttrs,prop)){
            callback(cloned, prop + " is a Required field");
        }

    };


    BusinessObject.definedRules["validateTelephoneAttrs"] = function (rule, callback) {
        var prop = rule.get("property"),
            cloned = rule.clone(),
            telephoneAttrs = this.get("telephone"),
            self = this;
        var requiredPhoneProps = [/*"intlCode",*/"phoneNumber", "orgRolePhoneNbrTypeCn"];

        if (!telephoneAttrs || !_.has(telephoneAttrs,prop)){
            callback(cloned, prop + " is a Required field");
        }

    };

    BusinessObject.definedRules["IsConditionallyRequired"] = Rule.conditionallyRequired;


    
    return BusinessObject;
});

