/**
 * @file
 * @see module:app/models/rentSheet/worksheetEntry
 */
define(['../..', 'backbone','jquery','nrm-ui','nrm-ui/collections/ruleCollection','nrm-ui/models/businessObject',
        "nrm-ui/models/nestedModel",'app/models/authorizationModel'],
    function(Suds, Backbone,$,Nrm, RuleCollection,BusinessObject, NestedModel,AuthorizationModel) {
        return Suds.Models.WorksheetEntry = NestedModel.extend({

            constructor: function WorksheetEntry() { return NestedModel.apply(this, arguments); }, // helps with debugging/profiling

            urlRoot : 'api/recordservice/rentSheets',

            initialize: function(attrs, options) {
                this.authCn = options.authCn;

                this.pathVariables = options.pathVariables || null;

                var children = this.initializeChildren(this.attributes);
                this.set(children);
                this.registerChildEvents();
            },

            url: function(){
                return this.urlRoot + "/" + this.authCn;
            },

            idAttribute: 'rentSheetDetailCn',

            "sync": function(method, model, options){

                if(method == 'delete'){
                    options.url = this.urlRoot + "/" + this.pathVariables;
                }

                if(method == 'update' || method == 'create'){
                    options.url = this.urlRoot + "/" + this.authCn;;
                }

                return Backbone.sync.apply(this, arguments);
            },

            initShapeRelatedFields : AuthorizationModel.prototype.initShapeRelatedFields,
            collections : AuthorizationModel.prototype.collections,

            filterLov: AuthorizationModel.prototype.filterLov,

            loadShapeLov: AuthorizationModel.prototype.loadShapeLov,

            shapeType: AuthorizationModel.prototype.shapeType,

           toJSON : function () {
               this.set('authorizationFk', this.get('authCn'));
               
               var county  = this.get('county');
               var forestCode;
               var isNum = /^\d+$/.test(this.get('forest'));
               if (!isNum){
                   forestCode =  this.get('forestCode')
               }else{
                   forestCode = this.get('forest')
               }

               
               var tobeAddedOrUpdated = {
                    stateCn : /*this.get('stateCn') ||*/ null,
                    forestCn : /*this.get('forestCn') ||*/ null,
                    countyCn : /*this.get('countyCn') ||*/ null,
                    stateName : county && county["STATENAME"],
                    fsAdminUnits : forestCode,
                    fsAdminUnitsName : this.get('forest'),
                    countyName: county && county["COUNTYNAME"],
                    width : this.get('width'),
                    lengthEstimate : this.get('lengthEstimate'),
                    length : this.get('length'),
                    area : this.get('area'),
                    kilovolt : this.get('kilovolt'),
                    name : "Linear Row"/*this.get('name')*/,
                    //rent : this.get('rent'),//need to ask deepthi where this is going to come from
                    remarks : this.get('remarks')
                };

               this.set(tobeAddedOrUpdated)

               return _.clone(_.omit(this.attributes,['countyShape','shape']));
            },



            validate: function(attributes, opts) {

                var mc, ruleMixin = this.constructor.ruleMixins['AddRentSheetEntry'];
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


                childProperties: {

                    county: AuthorizationModel.prototype.constructor.childProperties.county,

                    countyShape: AuthorizationModel.prototype.constructor.childProperties.countyShape,

                    forest: AuthorizationModel.prototype.constructor.childProperties.forest,

                    counties: AuthorizationModel.prototype.constructor.childProperties.counties,

                    forests: AuthorizationModel.prototype.constructor.childProperties.forests

                },
                ruleMixins: {
                    "AddRentSheetEntry": {
                        rules: new RuleCollection([
                            {
                                property: "county",
                                rule: "IsRequired"
                            },
                            {
                                property: "forest",
                                rule: "IsRequired"
                            },{
                                property: "width",
                                rule: "IsRequired"
                            }, {
                                property: "length",
                                rule: "IsRequired"
                            },
                           /* {
                                property: "kilowatts",
                                rule: "IsRequired"
                            },*/
                            /*{
                                property: "comments",
                                rule: "IsRequired"
                            }*/
                        ])
                    },

                }
            });
    });