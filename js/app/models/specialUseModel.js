/**
 * @file
 * @see module:app/models/specialUseTask
 */
/**
 * @module app/models/specialUseTask
 */
define(['..', './common/specialUse', 'nrm-ui'], 
        function(Suds, SpecialUse, Nrm) {
    return Suds.Models.SpecialUseModel = SpecialUse.extend(/** @lends module:app/models/specialUseTask.prototype */{
        /**
         * The urlRoot is required for each non-generic model. By convention, should match the root context key.
         * @type {String}
         * @see {@link http://backbonejs.org/#Model-urlRoot|Backbone.Model#urlRoot}
         */
        // urlRoot: "api/myTasks",
        urlRoot: "api/sudsIntroPath",
        idAttribute: 'introCN',
        /**
         * Identifies whether the model should be displayed under the "My Special Use Tasks" folder based on the user's
         * role assignments for the current home org.
         * @returns {Boolean}
         */
        isTaskForCurrentUser: function() {
            var homeOrg = Nrm.app.get('homeOrg');
            return SpecialUse.isTaskForRole(this.get('statusFk'), homeOrg);
        }
    }, 
    /**@lends module:app/models/specialUse */{       
        /**
         * Called during automatic rule loading, this is a hack to allow this model to share business rules with the 
         * {@link module:app/models/process|Process entity} which will hopefully be replaced by a better implementation
         * once some anticipated refactoring is completed in the UI Core.
         * @param {module:nrm-ui/collections/ruleCollection} rules
         */
        // rulesLoaded: function(rules) {
        //     SpecialUse.addBusinessRules("Rules.txt", "Process", rules);
        // }
    });
});