define(["build/buildControl",
	"dojo/_base/lang"], function(bc, lang){

    return function() {
        var resource;
        bc.nrmSettings = bc.nrmSettings || { };
        if (bc.copyTests && bc.copyTests !== "build") {
            // We have some resources with "test" tag and no "amd" tag, but are dependencies of other amd modules.
            // This is a work-around to allow the dependencies to resolve properly.
            for (var src in bc.resources) {
                resource = bc.resources[src];
                if (resource.tag && resource.tag.test && 
                        !resource.tag.ignore && !resource.tag.copyOnly && (!bc.mini || !resource.tag.miniExclude) 
                        && resource.mid && !bc.amdResources[resource.mid] && /\.js$/.test(resource.src)) {
                    //bc.log("pacify", "adding test resource " + resource.mid + " to list of AMD resources");  
                    bc.amdResources[resource.mid] = resource;
                }
            }
        }
        if (bc.use && !bc.nrmSettings.skipUseOptimization) {   
            bc.log("pacify", "discovering resources for Use plugin...");     
            var pluginName = "use";
            var pluginModule = bc.getSrcModuleInfo(pluginName);
            for (var mid in bc.use) {
                if (!bc.amdResources[mid]) {
                    bc.error(["Failed to discover module defined in Use configuration: ", mid].join(""));
                    bc.nrmSettings.skipUseOptimization = true;
                }
            }
            if (!bc.nrmSettings.skipUseOptimization) {
                for (var mid in bc.use) {
                    bc.use[mid].visited = true;
                }                
                // stub the use plugin module if all of the modules loaded with Use plugin have been wrapped in define function
                bc.replacements[pluginModule.url] = [[function() {
                   return "define({load: function(name, req, load) { req([name], load); }});";
                }]];
            } 
        }
        if (bc.layers && bc.layers.exclude) {
            var added = 0, excludes = bc.layers.exclude.include;
            for (var i in excludes) {
                if (!bc.amdResources[excludes[i]]) {
                    bc.amdResources[excludes[i]] = {
                        mid: excludes[i]
                    };
                    added++;
                }
            }
            if (added) bc.log("nrmExcludeModules", ["count", added]);
        }
    };
});