/**
 * @file The BufferParams module extends {@link module:nrm-ui/models/businessObject|BusinessObject} to represent
 *  the parameters required to produce a buffer.
 * @see module:nrm-ui/models/bufferParams
 */
/** 
 * Extends {@link module:nrm-ui/models/businessObject|BusinessObject} to provide validation for buffer parameters.
 * @module nrm-map/models/bufferParams
 */

define([
    'nrm-ui',
    'nrm-ui/models/businessObject',
    'nrm-ui/collections/ruleCollection'
], 
        function(
            Nrm,
            BusinessObject,
            RuleCollection
    ) {
    return Nrm.Models.BufferParams = BusinessObject.extend(/**@lends module:nrm-map/models/bufferParams.prototype*/{
    },
    /** @lends module:nrm-map/models/bufferParams */
        {
            // class properties
            /**
             * Known attribute names.
             * @type {Array.<Object.<string, string>>}
             */
            properties: [
                {name: "shape"},
                {name: "instructions"},
                {name: "distance"},
                {name: "unit"}
            ],
            /**
             * The rules collection.
             * @type {module:nrm-ui/collections/ruleCollection}
             */
            rules: new RuleCollection([
                {
                    rule: "IsRequired",
                    property: "shape"
                },
                {
                    rule: "IsRequired",
                    property: "distance"
                },
                {
                    rule: "IsNumeric",
                    property: "distance",
                    allowDecimalPoint: true, 
                    allowNegative: true
                },
                {
                    rule: "IsRequired",
                    property: "unit"
                }
            ])
        }
    );
});
