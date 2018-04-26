/**
 * @file A simple AMD loader plugin that uses Backbone.ajax to load a text file as a module.
 * @see module:nrm-ui/text
 */

define(['jquery', 'backbone', 'module'], function($, Backbone, module) {
        
    // All cache entries should have url (possibly package-relative) as key, 
    // and object like { result: string, loading: promise } 
    var cache = { };
    
    /**
     * AMD loader plugin for loading a text file
     * @exports nrm-ui/text
     */
    var plugin = {
//        /**
//         * Add a text resource to the cache.  Primary intended purpose is for build optimization, but there is no
//         * reason why it can't be used at runtime as well. Overwrites current cache entry if there is one.
//         * @param {string} url The URL for the text resource.  Use the module ID if it is a 
//         * package resource, so that we can use require.toUrl() to resolve the path.
//         * @param {string} text The text resource cache
//         * @returns {string}
//         * The text that was added.
//         */
//        addToCache: function(url, text) {
//            cache[url] = { url: require.toUrl(url), result: text };
//            return text;
//        },
        /**
         * Implementation of AMD loader plugin API
         * @param {string} name Module ID of the text resource
         * @param {external:require} req  The AMD require implementation, may be context-sensitive to resolve relative 
         *  module ID.
         * @param {function} load The loader callback
         * @returns {undefined}
         * @see {@link http://requirejs.org/docs/plugins.html#apiload|AMD loader plugin API}
         */
        load: function (name, req, load) {
    
            var mid = req.toAbsMid(name), cached = cache[mid], url;
            if (!cached) {
                url = req.toUrl(name);
                cached = { 
                    url: url,
                    loading: Backbone.ajax({
                        url: url,
                        dataType: "text"
                    }).done(function(data) {
                        cached.result = data;
                    })
                };
            }
            $.when(cached.loading).done(function() {
                load(cached.result);
            }).fail(function(resp) {
                var err = new Error("Failed to load text resource");
                $.extend(err, {
                    src: module.id,
                    info: { 
                        url: url, 
                        mid: mid, 
                        response: resp
                    }
                })
                require.signal('error', err);
            });
        }
        
    };
    return plugin;
})