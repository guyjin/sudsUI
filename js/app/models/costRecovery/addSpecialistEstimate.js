/**
 * @file
 * @see module:app/models/costRecovery/getCrEstimate
 */
define(['../..', 'backbone','jquery','nrm-ui','nrm-ui/collections/ruleCollection','nrm-ui/models/businessObject'],
    function(Suds, Backbone,$,Nrm, RuleCollection,BusinessObject) {
        return Suds.Models.AddSpecialistEstimateModel = BusinessObject.extend({

            constructor: function AddSpecialistEstimateModel() { return BusinessObject.apply(this, arguments); }, // helps with debugging/profiling

            urlRoot : 'api/recordservice/',

            initialize: function(attrs, options) {
                this.context = options.context;
            },

            url: function(){
                return this.urlRoot + this.context;
            },

            toJSON : function () {

                var self = this,crActivityTypes = this.get('crActivityTypes');

                if (!this.get('existingSpecialistEstimateDtos')){
                    this.set('existingSpecialistEstimateDtos',[]);
                }


                var toBeAddedSpecialistEstimate = {
                    crActivityTypeCn : this.get('crActivityTypeCn'),
                    /*role : this.get('role'),*/
                    name : this.get('name'),
                    processingTimeEst : this.get('processingTimeEst'),
                    monitoringTimeEst : this.get('monitoringTimeEst'),
                    scope : this.get('scope')

                };

               // self.set('crActivityTypeCn',this.get('roleCn'));

                if (crActivityTypes){

                    crActivityTypes.each(function(model) {

                        if (self.get("crActivityTypeCn") == model.get("crActivityTypeCn")){
                            toBeAddedSpecialistEstimate.role = model.get("name")
                        }
                    });


                }

                this.set("toBeAddedSpecialistEstimateDto",toBeAddedSpecialistEstimate);

                return _.clone(this.attributes);
            },

            validate: function(attributes, opts) {

                var mc, ruleMixin = this.constructor.ruleMixins['AddSpecialist'];
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
                ruleMixins: {
                    "AddSpecialist": {
                        rules: new RuleCollection([
                            {
                                property: "crActivityTypeCn",
                                rule: "IsRequired"
                            },
                            {
                                property: "scope",
                                rule: "IsRequired"
                            },
                            {
                                property: "processingTimeEst",
                                rule: "IsRequired"
                            },{
                                property: "name",
                                rule: "IsRequired"
                            }
                        ])
                    },

                }
            });
    });