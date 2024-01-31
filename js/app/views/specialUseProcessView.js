/**
 * Editor view for a Special Use Process
 * @file
 * @see module:app/views/specialUseProcessView
 */
/**
 * @module app/views/specialUseProcessView
 */
define(['..', './common/specialUseEditorView'], 
        function(Suds, SpecialUseEditorView) {
    
    return Suds.Views.SpecialUseProcessView = 
            SpecialUseEditorView.extend(/** @lends module:app/views/specialUseProcessView.prototype */{
        /**
         * Override of 
         * {@link module:app/views/common/specialUseEditorView#getEditorConfig|SpecialUseEditorView#getEditorConfig} 
         * to set the title
         * @returns {module:nrm-ui/views/baseView~FormConfig}
         */
        getEditorConfig: function() {
            var config = SpecialUseEditorView.prototype.getEditorConfig.apply(this, arguments);
            config.title = 'Special Use Process'
            return config;
        },

        getSearchUrl: function() {
            return 'api/sudsIntroPath';
        }
    });   
    
    
});