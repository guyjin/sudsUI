define([
	"build/buildControl",
        "build/transforms/dojoReport",
        "dojo/json",
	"build/fileUtils"
], function(bc, dojoReport, json, fileUtils) {
    var jsdocFilename = bc.jsdocFilename || "conf.json",
            jsdocConfig = bc.jsdocConfig;    
            
    function getAppCacheConfig(config) {
        if (!config || !config.generate) {
            return false;
        }
        var defaults = bc.appcacheDefaults || { };
        config.filename = config.filename || defaults.filename;
        computeIncludes(config, defaults);
        if (config.spatial && defaults.spatial) {
            if (config.spatial.esriBasePath === undefined) {
                config.spatial.esriBasePath = defaults.spatial.esriBasePath;
            }
            computeIncludes(config.spatial, defaults.spatial);
        } else {
            config.spatial = defaults.spatial;
        }
        return config;
    }
    function computeIncludes(config, defaults) {
        config.include = config.include || [];
        config.exclude = config.exclude || [];
        if (defaults.include) {
            defaults.include.forEach(function(item) {
                if (isIncluded(item, config)) {
                    config.include.push(item);
                }
            });
        }
        if (defaults.exclude) {
             defaults.exclude.forEach(function(item) {
                if (!isIncluded(item, config, true)) {
                    config.exclude.push(item);
                }
            });
        }
    }
    function isIncluded(item, config, explicit) {
        if (explicit) {
            return config.include && config.include.indexOf(item) !== -1;
        } else {
            return (!config.exclude || config.exclude.indexOf(item) === -1) && 
                    (!config.excludePattern || !config.excludePattern.test(item));
        }
    }            
    /**
     Gets the target path for a resource, applying the rules from pom.xml
     @param {Object} resource - build resource
     @param {Object} appcacheConfig - configuration for appcache
     @return [string]
     The path to the resource relative to webapp root.  If the return value is undefined, the resource should be ignored.
     */
    function computePath(resource, appcacheConfig) {
        var match, destPath = resource.dest, target, relPath, path;
        // ignore these resources at the outset
        if (
            (resource.tag && (resource.tag.ignore || (!appcacheConfig.includeTest && resource.tag.test))) || // tagged as ignore or test (unless we includeTest)
            /\.jsp$|\.appcache$/.test(destPath) || // leave out all .appcache and .jsp files
            (/\.css$/.test(destPath) && !(/\/build\/css\/index\.css$/.test(destPath))) // only allow css/index.css
            ) {
            return;
        }
        match = destPath.match(/dojo\/build\/(root\/|css\/|dojo\/|mobile\/)?(.*)/);
        //bc.log('pacify', 'match 1 and 2' + match[1] + ' & ' + match[2]);
        if (match && isIncluded(match[2], appcacheConfig)) {
            target = match[1]; // 'root/' or 'css/' or 'dojo/' or undefined
            relPath = match[2]; // match[2].indexOf('/') === 0 ? match[2].substr(1) : match[2];
            if (!target) {
                // targetPath is 'js'
                path = 'js/' + relPath;
            } else if (target === 'root/') {
                // all resources in this folder are copied to webapp root
                path = relPath;
            } else if (target === 'dojo/') {
                // special case
                path = 'nrmcore/amd/dojo/' + relPath;
            } else {
                // css... watch for things that need to be ignored always (optimized into index.css). 
                match = target === 'css/' && relPath.match(/\/temp\/|[^\/]+\/[^\/]+\.css/);
                if (!match) {
                    // don't return the path if it matched the ignore pattern
                    path = target + relPath;
                }
            }
            return computeRelativePath(path, appcacheConfig);
        }
    }
    function computeRelativePath(path, appcacheConfig) {
        // modify the relative path based on the location of the manifest file
        var filename = appcacheConfig.filename;
        if (path && filename && path.indexOf('../') !== 0) {
           var i, len = filename.match(/\//g).length;
           for (i = 0; i < len - 1; i++) {
               path = '../' + path;
           }
        }
        return path;
    }
    function computeEsriBasePath(pack, appcacheConfig) {
        var basePath = bc.packages[pack].location.replace(bc.basePath, appcacheConfig.spatial.esriBasePath) + "/";
        basePath = basePath.replace(/^https:/, '');
        if (/fs\.usda\.gov\/arcgis_js_api/.test(basePath)) {
            basePath = basePath.substr(basePath.indexOf("/arcgis_js_api"));
        }
        return basePath;
    }
    
    return function(resource, callback) {
        var allLayers = [], allLayerResources = [], layerResource, amdResource, pack, moduleSet,
            dir = bc.buildReportDir || ".", cachedInLayer = [], appcacheConfig;

//        bc.log('pacify', 'esri package location: ' + bc.packages['esri'].location);
//        for (var prop in bc.packages['esri']) {
//            bc.log("pacify", "bc.packages[esri]." + prop + ': ' + bc.packages['esri'][prop]);
//        }
        for (var p in bc.resources) {
            layerResource = bc.resources[p];
            moduleSet = layerResource.moduleSet;
            if (moduleSet) {
                allLayerResources.push(layerResource);
                for (var q in moduleSet) {
//                        bc.log("pacify", "  moduleset." + q + " mid = " + moduleSet[q].mid);
                    allLayers.push(moduleSet[q].mid);
                }
            }
        }
        for (var mid in bc.amdResources) {
            amdResource = bc.amdResources[mid];
            if (allLayers.indexOf(mid) === -1) {
                // do not list test modules, because we never want those in the optimized layer.
                if (!amdResource.tag || !amdResource.tag.test) {
                    bc.log("nrmModulesNotInLayer", ["module", mid]);
                }
            } else {
                cachedInLayer.push(bc.amdResources[mid].src);
            }
        }
        
        appcacheConfig = getAppCacheConfig(bc.appcache);
        if (appcacheConfig && appcacheConfig.generate) {
            resource.reports.push({
                dir: dir,
                filename: appcacheConfig.filename,
                content: function() {
                    var s, appcacheResource, spatial = bc.packages['nrm-map'] ? true : false,
                            appcacheContent = "CACHE MANIFEST\n# Build Date: " + new Date().toString();
                    
                    // process layers
                    appcacheContent += '\n# layers';
                    allLayerResources.forEach(function(layerResource) {
                        s = !layerResource.layer.discard && computePath(layerResource, appcacheConfig);
                        if (s && appcacheContent.indexOf('\n' + s + '\n') === -1) {
                            appcacheContent += '\n' + s;
                        } 
                    });
                    appcacheContent += '\n# end of layers';
                    
                    // process resources not in a layer
                    for (var mid in bc.resources) {
                        appcacheResource = bc.resources[mid];
                        if (appcacheResource.src && cachedInLayer.indexOf(appcacheResource.src) === -1) {
                            if (appcacheResource.src.indexOf('webapp/') > -1) {
                                s = computePath(appcacheResource, appcacheConfig); //appcacheResource.src;
                                if (s && appcacheContent.indexOf('\n' + s + '\n') === -1) {
                                    appcacheContent += '\n' + s;
                                    //bc.log("pacify", "appcache resource not in a layer: " + mid + '   ' + s);
                                }
                            }
                            //} else {
                            //    bc.log("pacify", " appcache skipped resource already in a layer: " + mid);
                        }
                    }
                    // process appcache includes
                    appcacheConfig.include.forEach(function(name) {
                        name = computeRelativePath(name, appcacheConfig);
                        if (appcacheContent.indexOf('\n' + name + '\n') === -1) {
                            appcacheContent += '\n' + name;
                        }
                    });
                    if (spatial) {
                        var esriLoc, esriBase, esriBasePaths = {
                            esri: computeEsriBasePath('esri', appcacheConfig)
                        };
                        esriBase = /.*[0-9]\//.exec(esriBasePaths.esri)[0];
                        appcacheContent += "\n# spatial app dependencies";
                        appcacheContent += "\n" + esriBase + "init.js";
                        appcacheConfig.spatial.include.forEach(function(name) {
                            // should get location from application config
                            pack = /^([^\/]+)\//.exec(name)[1];
                            if (bc.packages[pack]) {
                                esriLoc = esriBasePaths[pack];
                                if (!esriLoc) {
                                    esriLoc = esriBasePaths[pack] = computeEsriBasePath(pack, appcacheConfig);
                                }
                                name = name.substring(pack.length + 1);
                            } else {
                                esriLoc = esriBase;
                            }
                            appcacheContent += '\n' + esriLoc + name;
                        });
                        appcacheContent += "\n# end spatial app dependencies";
                    }
                    
                    appcacheContent += '\nNETWORK:\n*';
                    bc.log("pacify", "AppCache configuration written to " + fileUtils.computePath(fileUtils.catPath(dir, appcacheConfig.filename), bc.destBasePath));
                    return appcacheContent;
                }
            });
        }
        
        if (jsdocConfig) {
            (jsdocConfig.source || (jsdocConfig.source = { })).include = jsdocConfig.source.include || [];
            resource.reports.push({
                dir:dir,
                filename:jsdocFilename,
                content: function(){
                    for (var mid in bc.amdResources) {
                        amdResource = bc.amdResources[mid], pack = amdResource.pack;
                        if (pack && pack.jsdoc) {
                            if ((!pack.jsdoc.include || pack.jsdoc.include.indexOf(mid) !== -1) &&
                                (!pack.jsdoc.exclude || pack.jsdoc.exclude.indexOf(mid) === -1) &&
                                (!pack.jsdoc.includePattern || pack.jsdoc.includePattern.test(mid)) &&
                                (!pack.jsdoc.excludePattern || !pack.jsdoc.excludePattern.test(mid))) {
                                jsdocConfig.source.include.push(amdResource.src);
                            }
                        }
                    } 

                    bc.log("pacify", "JSDoc configuration written to " + fileUtils.computePath(fileUtils.catPath(dir, jsdocFilename), bc.destBasePath));

                    return json.stringify(jsdocConfig, "   ");
                }
            });
        }
        return dojoReport(resource, callback);
    };
});
