define(["dojo/_base/lang"], function(lang) {

    return {
        start: function(mid, referenceModule, bc) {
            var pluginMid = "use", usePlugin = bc.amdResources[pluginMid];
            if (!usePlugin) {
                bc.log("amdMissingDependency", ["module", referenceModule.mid, "dependency", pluginMid]);
                return;
            }
            var moduleInfo = bc.getSrcModuleInfo(mid, referenceModule);
            // Even though the resource is technically not an AMD module, it needs to be discoverable as if it is.
            var useModule = moduleInfo ? bc.amdResources[moduleInfo.mid] : false;
            var result = [usePlugin];
            if (!useModule) {
                bc.log("amdMissingDependency", ["module", referenceModule.mid, "dependency", moduleInfo.mid]);
            } else {
                var useConfig = bc.use && bc.use[moduleInfo.mid];
                if (useConfig && !useConfig.visited && useConfig.deps) {
                    useConfig.visited = true; // only visit the module once
                    console.log("Visiting the Use plugin configuration for " + moduleInfo.mid);
                    var deps = useModule.deps ? [].concat(useModule.deps) : [];
                    useConfig.deps.forEach(function(dep) {
                        //console.log("Resolving dep " + dep + " for module " + useModule.mid + ", reference module " + referenceModule.mid);
                        // the following is adapted from dojo src (util/build/transforms/depsScan.js)
                        if (!(/^(require|exports|module)$/.test(dep))) {
                            try {
                                var module = bc.getAmdModule(dep, useModule);
                                if (lang.isArray(module)) {
                                    module.forEach(function(module) {
                                        deps.push(module);
                                    });
                                } else if (module) {
                                    deps.push(module);
                                } else {
                                    bc.log("amdMissingDependency", ["module", "use!" + useModule.mid, "dependency", dep]);
                                }
                            } catch (e) {
                                bc.log("amdMissingDependency", ["module", "use!" + useModule.mid, "dependency", dep, "error", e]);
                            }
                        }
                    });
                    useModule.deps = deps;
                }
                result.push(useModule);
            }
            return result;
        }
    };
});
