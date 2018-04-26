/**
 * @file
 * @see module:app/models/common/questionModel
 */
define(['..', 'backbone','nrm-ui/models/businessObject','nrm-ui/collections/ruleCollection'],
    function(Suds, Backbone) {
        return Suds.Models.QuestionModel = Backbone.Model.extend({

            initialize: function(props){
                this.questionType = props.questionType;
            },

            parse: function (response) {
                return response;
            },

            url: function(){
                return 'api/workflowService/getQuestions/' +  this.questionType;
            }
        });
    });