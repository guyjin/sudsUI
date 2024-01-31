/**
 * @file
 * @see module:app/models/contactsModel
 */
define(['..', 'backbone','underscore','nrm-ui/models/businessObject','nrm-ui/collections/ruleCollection'],
    function(Suds, Backbone,_, BusinessObject, RuleCollection) {
        return Suds.Models.BasicProposalModel = BusinessObject.extend({
            constructor: function BasicProposalModel() { return BusinessObject.apply(this, arguments); }, // helps with debugging/profiling

            initialize: function() {
                var mc = this.constructor;
                if (!mc.rules) {
                    var rules = mc.rules = new RuleCollection();

                    BusinessObject.addBusinessRules("Rules.txt", "BasicProposal", rules, function() {


                        console.log("Basic Proposal rules are added");

                    }, function() {

                        console.log("Failed to load rules for Basic Proposal entity.");
                    });
                }
            },

            /**
             * The default attributes to set on new models.
             * @returns {Object}
             * Default attributes hash
             * @see {@link http://backbonejs.org/#Model-defaults|Backbone.Model#defaults}
             */
            defaults : function() {

                return {
                    receivedDate : Suds.currentDate(),
                    //we uiAttributeOrder2 : Suds.currentDate(),
                    uiAttributeOrder11 : null,
                    uiAttributeOrder12 : null,
                    uiAttributeOrder13 : null,
                    participants : null,
                    spectators : null
                }
            },

            toJSON: function(options) {

                var self = this;
                var modelAttributes = self.attributes,
                    uiAttributes = {},
                    participants = this.get('participants'),
                    spectators = this.get('spectators');

                _.each(modelAttributes, function(item, key) {

                    if (key.indexOf("uiAttributeOrder") != -1){
                        var displayOrder = key.substr(16),
                            uiAttribute = modelAttributes.displayOrderToUiAttribute[displayOrder];

                        if (displayOrder == 8){
                            modelAttributes.displayOrderToUiAttribute[8].userInput = "Y"
                            modelAttributes.displayOrderToUiAttribute[9].userInput = item
                        }else if (uiAttribute){
                            uiAttribute.userInput = item;
                        }
                    }
                });


                if (participants && spectators){
                    modelAttributes.displayOrderToUiAttribute[17].userInput =  participants + ";" + spectators
                }





                return _.extend(_.clone(this.attributes));
            }
        });
    });