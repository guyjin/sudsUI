/**
 * @file The Version module.
 * @see module:nrm-ui/models/version
 */
/** 
 * Backbone model that defines default URL to load SVN revision information for the About box.
 * @module nrm-ui/models/version
 */
define(['backbone', '..', 'require'], function(Backbone, Nrm, require) {

    return Nrm.Models.Version = Backbone.Model.extend(/** @lends module:nrm-ui/models/version.prototype */{
        /**
         * Default prefix to generate URLs based on the model id
         * @default utils
         * @type {string}
         * @see {@link http://backbonejs.org/#Model-urlRoot|Backbone Model urlRoot}
         */
        urlRoot: require.toUrl("utils"),
        /**
         * Indicates that this model should be fetched as a network resource even if Nrm.offlineStorage is set.
         * A disconnected editing application should include this resource in the ApplicationCache manifest file.
         * @default false
         * @type {Boolean}
         */
        localStorage: false
    },
    /** @lends module:nrm-ui/models/version */
    {
        /**
         * The NRM UI Core svn:externals folder version.  The committing developer is responsible for incrementing
         * this version with each commit to the trunk, while the value should remain unchanged for any commit to a 
         * contributing branch. The first three numbers correspond to the NRM UI Core application version in the 
         * Application Management Framework (AMF), and the last number increments by one for each trunk commit.
         * @const
         * @default
         * @type {string}
         */
        coreVersion: "1.0.0.21"
    });
});


