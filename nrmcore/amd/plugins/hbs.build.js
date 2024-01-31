define(['./hbs.read'], function(hbs) {
    
    return {
        start: function(mid, referenceModule, bc) {
            var pluginInfo = bc.getSrcModuleInfo("hbs");
            var hbsPlugin = bc.amdResources[pluginInfo.mid];
            if (!hbsPlugin) {
                bc.log("amdMissingDependency", ["module", referenceModule.mid, "dependency", pluginInfo.mid]);
                return;
            }
            if (!hbs.plugin) {
                bc.error("Unexpected error, the hbs plugin should have been set while processing the read transform.");
                return;
            }
            var prefix = hbs.plugin.getPrefix(bc, mid); 
            var ext = hbs.plugin.getExtension(bc, mid); 
            mid = prefix + mid + ext;
            var moduleInfo = bc.getSrcModuleInfo(mid, referenceModule);
            // Even though the resource is technically not an AMD module, it needs to be discoverable as if it is.
            var templateModule = moduleInfo ? bc.amdResources[moduleInfo.mid] : false;
            var result = [hbsPlugin];
            if (!templateModule) {
                bc.log("amdMissingDependency", ["module", referenceModule.mid, "dependency", moduleInfo.mid]);
            } else {
                result.push(templateModule);
            }
            return result;
        }
    };
});
