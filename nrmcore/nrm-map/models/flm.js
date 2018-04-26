/**
 * @file The FLM module extends {@link module:nrm-ui/models/businessObject|BusinessObject} to represent
 *  Feature Level Metadata attributes.
 * @see module:nrm-ui/models/flm
 */
/** 
 * Extends {@link module:nrm-ui/models/businessObject|BusinessObject} to provide validation for Feature Level Metadata 
 * (FLM) attributes.
 * @module nrm-map/models/flm
 */

define([
    'nrm-ui', 
    'nrm-ui/models/businessObject', 
    'nrm-ui/collections/ruleCollection', 
    'underscore',
    'jquery'
], 
        function(
            Nrm, 
            BusinessObject, 
            RuleCollection, 
            _,
            $
    ) {
    return Nrm.Models.FLM = BusinessObject.extend(/**@lends module:nrm-map/models/flm.prototype*/{
    },
    /** @lends module:nrm-map/models/flm */
            {
                // class properties
                /**
                 * Known attribute names.
                 * @type {Array.<Object.<string, string>>}
                 */
                properties: [
                    {name: "dataSource"},
                    {name: "revisionDate"},
                    {name: "accuracy"},
                    {name: "persist"}
                ],
                /**
                 * The rules collection.
                 * @type {module:nrm-ui/collections/ruleCollection}
                 */
                rules: new RuleCollection([
                    {
                        rule: "IsRequired",
                        property: "dataSource"
                    },
                    {   rule: "IsAlpha",
                        property: "dataSource",
                        maxlength: 2
                    },
                    {
                        rule: "IsRequired",
                        property: "revisionDate"
                    },
                    {
                        rule: "IsDate",
                        property: "revisionDate",
                        allowUtc: true,
                        description: "Invalid date, please enter value in format mm/dd/yyyy"
                    },
                    {
                        rule: "IsNumeric",
                        property: "accuracy",
                        allowDecimalPoint: true, 
                        allowNegative: false
                    }
                ]),
                flmDefaultCtx: {
                    "apiKey": "flmDataSources",
                    "loadType": "auto",
                    "namespace": "Nrm",
                    "modelName": "FLMDataSource",
                    "caption": "FLM Data Sources",
                    "alias": "FLM Data Source",
                    "idAttr": "code",
                    "nameAttr": "displayName",
                    "sortAttr": "code",
                    "modules": {
                        "model" : "nrm-map/models/flmDataSource",
                        "collection": "nrm-map/collections/flmDataSourceCollection"
                    }
                 },
               /**
                * Get a collection of FLM data source values
                * @param {Object} [options]
                * @param {string} [options.apiKey]
                * @returns {external:module:jquery~Promise} Returns the collection when resolved.
                */
                getFlmDataSourceLov: function(options) {
                    if (!this.dataSourceCollection || (options && options.apiKey)) {
                        var dfd = $.Deferred(), 
                            onSuccess = _.bind(function(collection) {
                                this.dataSourceCollection = collection;
                                dfd.resolve(collection);
                            }, this), 
                            onFail = function(collection, response, options){
                               console.error('Error fetching FLM Data Sources',collection, response, options);
                               dfd.reject(collection, response, options);
                            },
                            flmContext = options && options.apiKey ? Nrm.app.getContext(options) : this.flmDefaultCtx;
                        // temporarily set to the promise in case it is called again before we're done
                        this.dataSourceCollection = dfd.promise();
                        $.when(flmContext).done(function(context) {
                           context.loadType = context.loadType || "auto";
                           $.when(Nrm.app.getCollection(context)).done(onSuccess).fail(onFail);
                        }).fail(onFail);
                    }
                    return this.dataSourceCollection;
                },
                /**
                 * Extract the FLM Data Source attribute.
                 * @param {Object} attributes Attribute hash
                 * @returns {string}
                 */
                getDataSource: function(attributes) {
                    var codes = this.dataSourceCollection && this.dataSourceCollection.pluck("code"),
                        attName = Nrm.Models.FLM.getDataSourceAttName(attributes),
                        retVal = attName && attributes[attName];
                    if (!_.isString(retVal)) {
                      if (_.isNumber(retVal)) {
                            retVal = retVal.toString();
                      } else {
                         retVal = "00";
                      }
                    }
                    if (retVal.length === 1) {
                        // pad left to two characters
                        retVal = "0" + retVal;
                    } else if (retVal.length > 2) {
                        var m = this.dataSourceCollection.findWhere({description: retVal});
                        if (m) {
                            retVal = m.get("code");
                        }
                    }
                    if (retVal && codes && _.indexOf(codes, retVal) === -1) {
                        retVal = "00";
                    }
                    return retVal;
                },
                /**
                 * Extract the FLM Data Source attribute name.
                 * @param {Object|model|String[]} attributes Attribute hash, model, or array of attribute names
                 * @returns {string}
                 */
                getDataSourceAttName: function(attributes) {
                    return Nrm.Models.FLM._findAttName(attributes,
                        ["DATASOURCE", "FLMDATASOURCE", "DATA_SOURCE", "FLMDATASOU", "DATA_SOURC"]);
                },
                _findAttName: function(attributes, validNames){
                    var inNames = [], retVal;
                    if (attributes && attributes.attributes) {
                        inNames = _.keys(attributes.attributes);
                    } else if (_.isArray(attributes)) {
                        inNames = attributes;
                    } else if (_.isObject(attributes)) {
                        inNames = _.keys(attributes);
                    }
                    retVal = _.find(inNames, function(val){
                        return validNames.indexOf(val.toUpperCase()) > -1;
                    });
                    return retVal;
                },
                /**
                 * Extract the Accuracy attribute name.
                 * @param {Object|model|String[]} attributes Attribute hash, model, or array of attribute names
                 * @returns {string}
                 */
                getAccuracyAttName: function(attributes) {
                    return Nrm.Models.FLM._findAttName(attributes,
                        ['FLMACCURACY', 'ACCURACY']);
                },
                /**
                 * Extract the FLM Accuracy attribute.
                 * @param {Object} attributes Attribute hash
                 * @returns {Number|null|undefined}
                 */
                getAccuracy: function(attributes) {
                    var attName = Nrm.Models.FLM.getAccuracyAttName(attributes),
                        value = attName && attributes[attName];
                    // accuracy is optional, so there may be a difference between undefined and null or invalid number
                    if (value === undefined) {
                        return; // undefined
                    } else if ($.isNumeric(value)) {
                        return Number(value);
                    } else {
                        return null;
                    }
                },
                /**
                 * Extract the Revision Date attribute name.
                 * @param {Object|model|String[]} attributes Attribute hash, model, or array of attribute names
                 * @returns {string}
                 */
                getRevDateAttName: function(attributes) {
                    return Nrm.Models.FLM._findAttName(attributes,
                        ['FLMREVDATE', 'REV_DATE','REVISIONDATE']);
                },
                /**
                 * Extract the FLM Rev Date attribute.
                 * @param {Object} attributes Attribute hash
                 * @returns {string}
                 * Date formatted as yyyy-mm-dd or a full ISO date.
                 */
                getRevDate: function(attributes) {
                    var attName = Nrm.Models.FLM.getRevDateAttName(attributes),
                        inputDate = attName && attributes[attName],
                        retVal;
                    if (inputDate) {
                        if (_.isDate(inputDate)) {
                            retVal = inputDate;
                        } else if (inputDate.toString().length === 8 && /^19|^20/.test(inputDate.toString())) {
                            // this date could have come from ArcGIS and hopefully starts with year
                            var s = inputDate.toString();
                            retVal = new Date(s.substr(0, 4) + '/' + s.substr(4, 2) + '/' + s.substr(6, 2));
                        } else {
                            retVal = new Date(inputDate);
                        }
                    }
                    try {
                        retVal = retVal ? retVal.toISOString().substr(0, 10) : new Date().toISOString();
                    } catch (ex) {
                        retVal = new Date().toISOString();
                    }
                    return retVal;
                }
            }
    );
});