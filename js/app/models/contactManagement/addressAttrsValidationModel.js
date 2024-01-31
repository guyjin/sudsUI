/**
 * @file
 * @see module:app/models/process
 */
/**
 * @module app/models/common/recordModel
 */
define(['../..',
        /*'nrm-ui/models/businessObject',*/
        "nrm-ui/models/nestedModel",
        'nrm-ui',
        'backbone',
        'underscore',
        'app/models/contactManagement/initialOrg',
        'nrm-ui/collections/ruleCollection'],

    function(Suds, NestedModel,Nrm, Backbone, _,InitialOrg, RuleCollection) {

        return Suds.Models.PersonModel = NestedModel.extend(/** @lends module:app/models/process.prototype */{

                constructor: function ContactManagementModel() { return NestedModel.apply(this, arguments); }, // helps with debugging/profiling

                /**
                 * The urlRoot is required for each non-generic model. By convention, should match the root context key.
                 * @type {string}
                 * @see {@link http://backbonejs.org/#Model-urlRoot|Backbone.Model#urlRoot}
                 */

                urlRoot: "api/contact/",
                idAttribute: 'id',


                initialize: function() {
                    var children = this.initializeChildren(this.attributes);
                    this.set(children);
                    this.registerChildEvents();
                },


                "sync": function(method, model, options){

                    /* if(method == 'create'){
                     options.url = this.urlRoot + '/create';
                     }else if(method == 'update'){

                     options.url = this.urlRoot + '/update/'+ this.id;
                     }*/

                    return Backbone.sync.apply(this, arguments);
                },


                getInitialOrgByContactType : function (options) {

                    return new InitialOrg(options)
                },

                parse: function() {
                    var response = NestedModel.prototype.parse.apply(this, arguments);

                    return response;
                },


                deepFind: function(items, subkeys, predicate, caller) {


                    if (subkeys && !_.isArray(subkeys)) {
                        subkeys = [subkeys];
                    }

                    function recursiveFind(item) {

                        function subkeyFind(key) {
                            return _.find(item[key], recursiveFind);
                        }

                        if (predicate.apply(caller || this, arguments)) {
                            result = item;
                            return true;
                        }
                        if (!subkeys) {
                            subkeys = _.keys(items);
                        }

                        return _.find(subkeys, function(key) {
                            if (_.isObject(item[key])) {
                                return _.find(item[key], recursiveFind);
                            }
                        });
                    }

                    var result;

                    _.find(items, recursiveFind);

                    return result;
                },

                /**
                 * The default attributes to set on new models.
                 * @returns {Object}
                 * Default attributes hash
                 * @see {@link http://backbonejs.org/#Model-defaults|Backbone.Model#defaults}
                 */
                defaults : function() {

                    return {
                        //authorization: {}
                    }
                },

                startListening: function () {

                    this.listenTo(this, {
                        'renderComplete': function () {

                        }
                    });

                },

                validate: function(attributes, opts) {
                    var mc, ruleMixin = this.constructor.ruleMixins["Person"];

                    if (ruleMixin) {
                        mc = this.constructor.extend({}, ruleMixin);
                    } else {
                        mc = this.constructor;
                    }
                    if (mc.rules) {
                        if (!this.brokenRules) {
                            this.brokenRules = new RuleCollection();
                        }
                        return mc.checkRules(this, opts);
                    }

                }
            },
            {
                childProperties: {},

                ruleMixins: {
                    "Person": {
                        rules: new RuleCollection([
                            {
                                property: "givenName",
                                rule: "isRequired"
                            },
                            {
                                property: "surname",
                                rule: "isRequired"
                            },
                        ])
                    }


                }
            });
    });