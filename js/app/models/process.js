/**
 * @file
 * @see module:app/models/process
 */
/**
 * @module app/models/process
 */
define(['..', './common/specialUse', 'nrm-ui'], 
        function(Suds, SpecialUse, Nrm) {
    return Suds.Models.Proposal = SpecialUse.extend(/** @lends module:app/models/process.prototype */{
        /**
         * The urlRoot is required for each non-generic model. By convention, should match the root context key.
         * @type {string}
         * @see {@link http://backbonejs.org/#Model-urlRoot|Backbone.Model#urlRoot}
         */
        // urlRoot: "api/process",
        urlRoot: "api/sudsIntroPath",
        /**
         * The default attributes to set on new models. 
         * @returns {Object}
         * Default attributes hash
         * @see {@link http://backbonejs.org/#Model-defaults|Backbone.Model#defaults}
         */
        defaults : function() {
            var homeOrg = Nrm.app.get('homeOrg');
            return {
                // processing status is "New" for a new record.
                statusFk: this.constructor.DEFAULT_STATUS,
                // default statusDate is today
                statusDate: Suds.currentDate(),
                // default fsUnitId is the current home org
                fsUnitId: (homeOrg && homeOrg.id) || null
            }
        }
    }
    //,
    /**@lends module:app/models/process */
    // {
    //     /*
    //      * Initial status CN for new records
    //      * @const
    //      */
    //     DEFAULT_STATUS: "1"
    // }
    );
});