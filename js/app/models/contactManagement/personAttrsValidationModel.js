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

                constructor: function PersonModel() { return NestedModel.apply(this, arguments); }, // helps with debugging/profiling

                initialize: function() {
                    var children = this.initializeChildren(this.attributes);
                    this.set(children);
                    this.registerChildEvents();
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
                        rules : new RuleCollection([
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