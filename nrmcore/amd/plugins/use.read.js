define(["build/buildControl",
	"dojo/_base/lang"], function(bc, lang){
    function write(resource, text) {
        bc.log("nrmUse", ["module", resource.mid]);
        // adapted from Use AMD Plugin v0.4.0 https://github.com/tbranyen/use-amd
        var module = (bc.use && bc.use[resource.mid]) || { };
        var settings = {
          deps: module.deps || [],
          attach: module.attach || module.exports || module.init
        };
        if (lang.isArray(module)) {
          settings.deps = module;
          settings.attach = undefined;
        }
        module = settings;
        var deps = module.deps;
        var normalize = { attach: null, deps: "" };

        // Normalize the attach to global[name] or function() { }
        if (typeof module.attach === "function") {
          normalize.attach = [
              "return (", module.attach.toString(), 
              ").apply(this, arguments);\n"
          ].join("");
        } else {
          normalize.attach = [
            "return typeof ", String(module.attach),
                " !== \"undefined\" ? ", String(module.attach), " : void 0;\n"
          ].join("");
        }

        // Normalize the dependencies to have proper string characters
        if (deps.length) {
          normalize.deps = "'" + deps.toString().split(",").join("','") + "'";
        }

        // Write out the actual definition
        return [
          "define(" + //'", name, "', ",
            "[", normalize.deps, "], function(){\n", text, ";\n", normalize.attach, "});\n"
        ].join("");
    }    
    return function(resource, callback) {
        bc.replacements[resource.src] = [[function(text) {
            if (bc.nrmSettings && !bc.nrmSettings.skipUseOptimization) {
                return write(resource, text);
            }
            return text;
         }]];
    };
});
