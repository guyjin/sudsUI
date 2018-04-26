/**
 * Base view providing common behavior and configuration for basic search views.  Note that if the application uses
 * advanced search views, it might need a similar base view 
 * @file
 * @see module:app/views/common/specialUseSearchView
 */
/**
 * @module app/views/common/specialUseSearchView
 */
define(['../..', 'nrm-ui', 'nrm-ui/views/basicSearchView', '../../models/common/searchParams', 'backbone'], 
        function(Suds, Nrm, BasicSearchView, SearchParams, Backbone) {
    return Suds.Views.SpecialUseSearchView = 
            BasicSearchView.extend(/** @lends module:app/views/common/specialUseSearchView.prototype */{
        /**
         * The search params model constructor (module).
         * @type {Function}
         */
        searchModel: SearchParams,
        className: 'container suds-container',


        /**
         * Create the model to bind to this form that represents the search parameters.
         * @returns {external:module:backbone.Model}
         * @see {@link module:nrm-ui/views/basicSearchView#createSearchModel|BasicSearchView#createSearchModel}
         */

        createSearchModel: function() {
            var searchModel = this.searchModel || Backbone.Model;
            
            // Nrm.app.setInheritedAttributes will set parameters inherited from the parent model if there is one.
            // If this view is only used for root-level searchs, this pattern is unnecessary and can be replaced with:
            // return new searchModel();
            return Nrm.app.setInheritedAttributes(this.context, new searchModel(), this.parentModel, false);
        },
        // override default method to set the correct URL that's not based on the context name

        getSearchUrl: function() {
            return 'api/sudsIntroPath';
        }
    });   
    
    
});