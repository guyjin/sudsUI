/* 
 * Build plugin for nrm-ui/text loader plugin
 */
define({
    start:function(mid, referenceModule, bc) {
            var textPlugin = bc.amdResources["nrm-ui/text"],
            moduleInfo = bc.getSrcModuleInfo(mid, referenceModule, true),
            textResource = bc.resources[moduleInfo.url];

            if (!textPlugin){
                    throw new Error("text! plugin missing");
            }
            if (!textResource){
                    throw new Error("text resource (" + moduleInfo.url + ") missing");
            }
            // For now, this plugin resolver simply validates that the resource exists,
            // and avoids the warning during build if we don't provide a plugin resolver.
            // 
            // It may be possible to include the resource in the optimized layer, 
            // but it might not be as simple as it seems.
            return [textPlugin];

    }
});

