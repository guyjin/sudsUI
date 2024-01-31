/**
 * @file
 * @see module:app/models/process
 */
/**
 * @module app/models/common/recordModel
 */
define(['../..',
        '../common/recordModel',
        '../summaryTestModel',
        'nrm-ui',
        'backbone'],

    function(Suds, RecordModel, SummaryModel, Nrm, Backbone) {

        return Suds.Models.RecordTestModel = RecordModel.extend(/** @lends module:app/models/process.prototype */{

                /**
                 * The urlRoot is required for each non-generic model. By convention, should match the root context key.
                 * @type {string}
                 * @see {@link http://backbonejs.org/#Model-urlRoot|Backbone.Model#urlRoot}
                 */

                urlRoot: 'api/uiTest/getStep',
                idAttribute: 'value',

                "sync": function(method, model, options){

                    return Backbone.sync.apply(this, arguments);
                },

                summary : function(id) {

                    return new SummaryModel({id : id});

                },

            }
        );
    });