define([
	"build/buildControl",
        "build/transforms/read",
        "../plugins/use.read",
        "../plugins/hbs.read"
], function(bc, read, use, hbs){
	return function(resource, callback){
            var readPlugin;
            if (resource.tag.handlebars) {
                var moduleInfo = bc.getSrcModuleInfo(resource.mid);
                /* The default Dojo discovery process didn't fill in the module info 
                 * because the file name doesn't have .js extension.
                 * We fill in the package info here because Dojo code might expect it in a later transform, 
                 * and replace the src and dest properties so the usual module redirection techniques will work properly.
                 */
                if (!resource.pack) {
                    resource.pid = moduleInfo.pid;
                    resource.pack = bc.packages[resource.pid];
                }
                /* The default Dojo discovery process will add the .js extension 
                 * if the package.modules config was used to locate a module. 
                 * We need to override that assumption because handlebars tag indicates it's not a .js file.
                 */
                resource.src = moduleInfo.url.replace(/\.js$/, "");
                resource.dest = bc.getDestModuleInfo(moduleInfo.mid).url;
                resource.deps = [];
                readPlugin = hbs;
            } else if ((!bc.nrmSettings || !bc.nrmSettings.skipUseOptimization) &&
                    resource.mid && bc.use && bc.use[resource.mid]) {
                readPlugin = use;
            }
            read(resource, function(resource, err) {
                if (!err && readPlugin) {
                    var async = readPlugin(resource, callback);
                    if (async === callback) {
                        // the transform proc must call returnFromAsyncProc when complete
                        return;
                    }
                } 
                callback.apply(null, arguments);
            });
            return callback;
	};
});
