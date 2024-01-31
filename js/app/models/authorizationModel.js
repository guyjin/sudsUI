/**
 * @file
 * @see module:app/models/common/authorizationModel
 */
define(['..', 'backbone','underscore','jquery','nrm-ui/collections/ruleCollection','nrm-ui/models/businessObject',
        "nrm-ui/models/nestedModel",
        '../collections/countyCollection',
        '../collections/forestCollection'],
    function(Suds, Backbone, _, $, RuleCollection,BusinessObject, NestedModel,CountyCollection, ForestCollection) {

        return Suds.Models.AuthorizationModel = NestedModel.extend({

            constructor: function AuthorizationModel() { return NestedModel.apply(this, arguments); }, // helps with debugging/profiling

            initialize: function () {
                var mc = this.constructor;


                if (!mc.rules) {
                    var rules = mc.rules = new RuleCollection();
                    BusinessObject.addBusinessRules("Rules.txt", "Authorization", rules, function () {

                        console.log("Authorization Model rules are added");

                    }, function () {

                        console.log("Failed to load rules for Authorization entity.");

                    });
                }

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
                    proposalReceivedDate : Suds.currentDate()

                }
            },


            initShapeRelatedFields: function() {

                var allConfig = this.constructor.childProperties,
                    dependencies = {},
                    listeners = {
                        'change:shape': function() {
                            if (!this.saving) {

                                initAllFields(true);
                            }
                        }
                    },
                    dependencyHandler = _.bind(function(prop) {
                        this.set(prop, null);
                    }, this),

                    shapeRelatedFields = _.map(['county', 'countyShape', 'state', 'forest'], function(attr) {

                        var config = allConfig[attr], overlay,
                            collection = config && config.collection;
                        if (config && config.overlay) {
                            overlay = dependencies[config.overlay];
                            if (!overlay) {
                                overlay = dependencies[config.overlay] = [];
                            }
                            overlay.push(attr);
                        }
                        if (collection) {
                            return _.bind(initShapeRelatedCollection, this, attr,  config);
                        } else {
                            return _.bind(initShapeRelatedLov, this, attr, config);
                        }
                    }, this);

                function initAllFields(shapeChanging) {
                    _.each(shapeRelatedFields, function(initFn) {
                        initFn(shapeChanging);
                    });
                }
                function initShapeRelatedLov(prop, config, shapeChanging) {
                    if (shapeChanging) {
                        // reset attribute and lov collection if the shape is changing
                        dependencyHandler(prop);
                        if (config && config.lov) {
                            this[config.lov] = null;
                        }
                    }
                }
                function initShapeRelatedCollection(prop, config, shapeChanging) {
                    var current = this.get(prop),
                        empty = current && current.isEmpty(),
                        lov,
                        shape,
                        changed = false,
                        afterLoad = _.bind(function(collection, response) {
                            current.loading = false;
                            this.listenTo(current, 'reset add remove', changeHandler);
                            var autoSelect = config.autoSelect, remove;
                            if (_.isNumber(autoSelect) && autoSelect < collection.size()) {
                                autoSelect = false;
                            }
                            if (autoSelect) {
                                current.set(collection.models);
                            } else {
                                // keep any selection that is still valid for new shape
                                remove = current.filter(function(model) {
                                    return !collection.get(model.id);
                                });
                                current.remove(remove);
                            }
                            this.stopListening(current, 'reset add remove', changeHandler);
                            this.trigger('dependentLovChanged', this, collection, {
                                attr: prop,
                                error: response && (response.status < 200 || response.status >= 300),
                                changed: changed
                            });
                        }, this);

                    function changeHandler() {
                        changed = true;
                    }
                    if (current && (shapeChanging || empty)) {
                        shape = this.get('shape');
                        if (shape || !empty) {
                            lov = this.loadShapeLov(prop, true, afterLoad, afterLoad);
                            current.loading = lov.promise ? lov : lov.loading;
                        }
                    }
                }

                this.stopListening(this, 'change:shape');
                _.each(dependencies, function(deps, key) {
                    var event = 'change:' + key;
                    this.stopListening(this, event);
                    listeners[event] = function() {
                        if (!this.saving) {
                            _.each(deps, dependencyHandler);
                        }
                    }
                }, this);
                this.listenTo(this, listeners);
                initAllFields(false);
            },

            collections: {

                forestsLov: function() {

                    return this.filterLov('forests', function(collection) {
                        return collection.overlay(this.get('countyShape'), this.get('shape'));
                    });
                },

               /* statesLov : function() {

                    return this.filterLov('counties', function(collection) {

                        return collection.states();
                    });
                },*/

                countiesLov: function() {

                    return this.filterLov('counties', function(collection) {
                        return  collection;
                    });
                }
            },


            filterLov: function(lov, filter) {

                var dfd, async = true, result = this[lov], success =_.bind(function(collection) {
                    async = false;
                    result = filter.call(this, collection);
                    if (dfd) {
                        dfd.resolve(result);
                    }
                }, this);
                if (!result || result.loading) {
                    dfd = $.Deferred();
                    if (!result) {
                        this.loadShapeLov(lov, false, success, dfd.reject);
                    } else {
                        $.when(result.loading).done(success).fail(dfd.reject);
                    }
                    if (async) {
                        result = dfd.promise();
                    }
                } else {
                    success(result);
                }
                return result;
            },

            loadShapeLov: function(attr, reset, successCallback, errorCallback) {
                var childProperty = this.constructor.childProperties[attr],
                    lovType = childProperty.lov, // may be constructor or property name
                    collectionType, lov, init, shape;

                if (!_.isFunction(lovType)) {
                    collectionType = childProperty.collection;
                } else {
                    collectionType = lovType;
                    lovType = attr;
                }
                lov = this[lovType];
                init = !lov;
                if (init) {
                    lov = this[lovType] = new collectionType();
                }
                if (init || reset) {
                    var shape = this.get('shape');
                    if (shape) {
                        lov.fetch({
                            params: {
                                geometry: shape
                            },
                            success: successCallback,
                            error: errorCallback
                        });
                    } else if (reset && !lov.isEmpty()) {
                        lov.reset();
                        if (successCallback) {
                            successCallback(lov);
                        }
                    }
                } else if (successCallback) {
                    successCallback(lov);
                }
                return lov.loading || lov;
            },

            shapeType: function() {
                var shapeType = this.get('shapeType');
                if (!shapeType) {
                    shapeType = Nrm.app.getSpatialType({ shapeAttr: 'shape' }, this, true);
                    if (shapeType) {
                        shapeType = shapeType.charAt(0).toUpperCase() + shapeType.slice(1);
                    }
                }
                return shapeType;
            },

            addCommas :  function(nStr) {
                nStr += '';
                var x = nStr.split('.'),
                    x1 = x[0],
                    x2 = x.length > 1 ? '.' + x[1] : '',
                    roundedNum;
                var rgx = /(\d+)(\d{3})/;
                while (rgx.test(x1)) {
                    x1 = x1.replace(rgx, '$1' + ',' + '$2');
                }

                if(x2.length == 2){
                    x2 =  x2 + '0'
                }
                roundedNum = x1 + x2;
                return roundedNum;
            },


            toJSON: function() {

                return _.clone(this.attributes);
            },

            validate: function(attributes, opts) {
                var mc, currentSection = this.get('screenId') || this.get('currentSectionId'),
                    ruleMixin = currentSection && this.constructor.ruleMixins[currentSection];

                /*if (this.formSave){


                }*/
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





        },{

            childProperties: {

                county: {
                    overlay: 'state',
                    lov: 'counties' // not countiesLov
                },

                countyShape: {
                    overlay: 'state'
                },

                forest: {
                    overlay: 'county',
                    lov: 'forests' // not forestsLov
                },

                counties: {
                    lov: CountyCollection
                },

                forests: {
                    lov: ForestCollection
                },

            },

            ruleMixins: {
                "BasicInfo": {
                    rules: new RuleCollection([
                        {
                            property: "proposalReceivedDate",
                            rule: "IsRequired"
                        },
                        {
                            property: "useStartDate",
                            rule: "IsRequired"
                        },
                        {
                            property: "useEndDate",
                            rule: "IsRequired"
                        },
                        /*{
                            property: "proponentTypesTbl",
                            rule: "IsRequired"
                        },*/{
                            property: "nbrParticipants",
                            rule: "IsNumeric"
                        },
                        {
                            property: "nbrSpectators",
                            rule: "IsNumeric"
                        },{
                            property: "rightOfWayWidth",
                            rule: "IsNumeric"
                        },
                        {
                            property: "rightOfWayLength",
                            rule: "IsNumeric"
                        }
                      ])
                },
                "crpSummary": {
                    rules: new RuleCollection([
                        {
                            property: "crpNepaTypeCn",
                            rule: "IsRequired"
                        },
                        {
                            property: "crpAdjustmentTypeCn",
                            rule: "IsRequired"
                        },
                        /*{
                            property: "crpAdjAmount",
                            "rule": "IsConditionallyRequired",
                        },*/
                    ])
                },
                "ClosureForm": {
                    rules: new RuleCollection([
                        {
                            property: "closureDate",
                            rule: "IsRequired"
                        },
                        {
                            property: "closureInspectionDate",
                            rule: "IsRequired"
                        },
                        {
                            property: "closureReasonFk",
                            rule: "IsRequired"
                        },
                        {
                            property: "aoLastName",
                            rule: "IsRequired"
                        },
                        {
                            property: "aoFirstName",
                            rule: "IsRequired"
                        },
                        {
                            property: "closureAoTitleFk",
                            rule: "IsRequired"
                        }
                    ])
                },

          }
        });
    });