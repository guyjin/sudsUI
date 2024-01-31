/**
 * Search view for Special Use Processes
 * @file
 * @see module:app/views/specialUseProcessSearchView
 */
/**
 * @module app/views/specialUseProcessSearchView
 */
define(['..', './common/specialUseSearchView', 'use!select2'], 
        function(Suds, SpecialUseSearchView, Select2) {
    
    return Suds.Views.SpecialUseProcessSearchView = 
            SpecialUseSearchView.extend(/** @lends module:app/views/specialUseProcessSearchView.prototype */{
        /**
         * Override of 
         * {@link module:module:nrm-ui/views/basicSearchView#getSearchConfig|BasicSearchView#getSearchConfig} 
         * @returns {module:nrm-ui/views/baseView~FormConfig}
         */


        getSearchConfig: function() {
            return {
                hz: false,
                inputClass: 'input-sm',
                controls: [
                    {
                        type: 'inputText',
                        id: 'specialUseIdSearch',
                        label: 'ID',
                        prop: 'authorizationId',
                        title: 'Find Special Uses by authorization ID'
                        //labelGrid: 'col-md-4 col-sm-2', // Twitter Bootstrap grid class for the label
                        //hzGrid: 'col-md-8 col-sm-10', // Twitter Bootstrap grid class for the field
                    },
                    {
                        type : 'inputText',
                        id : 'specialUseStatusSearch',
                        "prop" : "message",
                        "label" : "Message",
                        // "placeholder" : "Select one or more status codes",
                        // "multiple" : true,
                        "title" : "Find Greetings by searching for text",
                        "lov" : "lov/processingStatus"
                      }
                ]
            };
        }
    });   
    
    
});