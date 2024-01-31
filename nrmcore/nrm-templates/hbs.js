/**
 * 
 * @file An AMD loader plugin that loads a {@link http://handlebarsjs.com/|Handlebars} template as a module.
 * @see {@link module:nrm-templates/hbs}
 */  
/** 
 * AMD loader plugin to load a {@link http://handlebarsjs.com/|Handlebars} template as a module.  The module ID is 
 * aliased as hbs in the default {@link https://dojotoolkit.org/documentation/tutorials/1.10/dojo_config/|dojoConfig} 
 * (AMD global configuration) provided in the Starter Project so that templates can be loaded using a module id like 
 * 'hbs!templateName' where the template file is located at templates/templateName.handlebars, relative to webapp root.
 * @module nrm-templates/hbs
 * @example 
 * // assuming the application is using the dojoConfig from the Starter Project, and you have a Handlebars template in 
 * // the templates folder named myView.handlebars with content:
 * //
 * //    <p>{{text}}</p>
 * //
 * // ... then you can load the template using the following syntax:
 * define(['backbone', 'hbs!myView'], function(Backbone, template) {
 *     return Backbone.View.extend({
 *         render: function() {
 *             var html = template({ text: 'Hello world!' });
 *             this.$el.html(html);
 *             // the view HTML is now:
 *             //  <p>Hello world!</p>
 *             return this;
 *         }
 *     });
 * });
 *  
 */
define(["handlebars", "./config"], function (Handlebars, base) {
    var defaults = base.config;  
    function getConfig(config, prop, template, extend) {
        var templateConfig, appConfig, maps, map, i;
        if (template) {
          maps = [config && config.hbs && config.hbs.templates, defaults.templates];
          for (i in maps) {
              map = maps[i];
              if (map && map[template] && map[template][prop]) {
                  if (!extend) {
                      return map[template][prop];
                  } else if (templateConfig) {
                      templateConfig = Handlebars.Utils.extend({}, map[template][prop], templateConfig);
                  } else {
                      templateConfig = map[template][prop];
                  }
              }
          }
        }
        appConfig = config && config.hbs && config.hbs[prop];
        if (extend && (appConfig || templateConfig)) {
            return Handlebars.Utils.extend({}, defaults[prop], appConfig, templateConfig);
        } else {
            return appConfig || defaults[prop];
        }
    }
    // in pre-optimized mode, the cache object tracks the compiled template or Deferred object
    var cache = { };
    
    /**@lends module:nrm-templates/hbs */
    var plugin = {
        /**
         * Get the file extension for a template.
         * @param {Object} config AMD global configuration 
         * @param {module:nrm-templates/config~PluginConfig} config.hbs Plugin configuration
         * @param {string} name template name
         * @returns {string}
         * The file extension
         */
        getExtension: function(config, name) {
            return getConfig(config, "extension", name);
        },
        /**
         * Get the module prefix for a template
         * @param {Object} config AMD global configuration 
         * @param {module:nrm-templates/config~PluginConfig} config.hbs Plugin configuration
         * @param {string} name template name
         * @returns {string}
         * The module prefix to prepend to template name + extension to produce a resolvable module ID for the template.
         */
        getPrefix: function(config, name) {
            return getConfig(config, "prefix", name);
        },
        /**
         * Get the compilation options for a template
         * @param {Object} config AMD global configuration 
         * @param {module:nrm-templates/config~PluginConfig} config.hbs Plugin configuration
         * @param {string} name template name
         * @returns {Object}
         * Handlebars compilation options.
         * @see {@link http://handlebarsjs.com/reference.html|Handlebars API reference} for a list of supported options.
         */
        getOptions: function(config, name) {
            return getConfig(config, "options", name, true);
        },
        /**
         * Resolve dependencies for a template.
         * @param {Object} config AMD global configuration 
         * @param {module:nrm-templates/config~PluginConfig} config.hbs Plugin configuration
         * @param {string} name template name
         * @param {string} text template contents
         * @returns {string[]}
         * List of dependencies.
         */
        getDeps: function(config, name, text) {
            var deps = getConfig(config, "deps", name);
            if (typeof deps === "function") {
                return deps.call(base, name, text);
            }
            return deps;
        },
        // http://requirejs.org/docs/plugins.html#apiload
        /**
         * 
         * @param {string} name Template name
         * @param {external:require} req  The AMD require implementation, may be context-sensitive to resolve relative 
         *  module ID.
         * @param {Function} load The loader callback
         * @param {Object} config The AMD global configuration, note that Dojo does not support this parameter so we 
         * have to get the configuration from require.rawConfig instead.
         * @returns {undefined}
         * @see {@link http://requirejs.org/docs/plugins.html#apiload|AMD loader plugin documentation} for more 
         * information on the AMD loader plugin spec.
         */
        load: function (name, req, load, config) {
            // template may be already compiled
            var templates = Handlebars.templates = Handlebars.templates || { }, template = templates[name];
            if (template) {
                load(template);
                return true;
            }

            // Dojo provides access to the config object through the req function.
            if (!config) {
              config = require.rawConfig;
            }

            // Get the template extension and package prefix to construct a module ID.
            var ext = plugin.getExtension(config, name), prefix = plugin.getPrefix(config, name), mid = prefix + name + ext;

            if (true) {
            //>>excludeStart("compile", kwArgs.built)
                var onerror = function(e) {
                    console.log("Failed to load template " + name + ": " + e);
                };
                req(['jquery'], function($) {
                    var url = req.toUrl(mid);
                    var template = cache[url];
                     if (!template) {
                         var dfd = template = cache[url] = new $.Deferred();
                         $.ajax({
                            url: url,
                            dataType: "text",
                            global: false
                         }).done(function(data) {
                            var deps = plugin.getDeps(config, name, data) || [];
                            //console.log(["Compiling template:", name, "mid:", mid, "deps:", "[" + deps.join(", ") + "]"].join(" "));
                            req(deps, function() {
                                var options = plugin.getOptions(config, name); // compiler options
                                // cache and return the compiled template
                                try {
                                    dfd.resolve((cache[url] = templates[name] = Handlebars.compile(data, options)));
                                } catch (e) {
                                    dfd.reject(e);
                                }
                            });
                        }).fail(function(resp, status, error) {
                            dfd.reject(resp, status, error);
                        });
                    }
                    $.when(template).done(load).fail(function(resp, status, error) {
                        onerror(arguments.length > 1 ? status + ': ' + error : resp);
                    });

                });
            } else {
            //>>excludeEnd("compile")
                // Assume template has been precompiled during build
                req([mid], load);
            }

        }

    };
    return plugin;
});