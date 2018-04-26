define(["build/buildControl", 
      "handlebars-compiler", "require"
    ], function(bc, compiler, req){ 
    //var labelHelperRe = /\{\{apply-label\}\}/;
    var templateNameRe = /([^\/]+\/)(.*)(\.[^\.]+)$/, moduleInfo;
     
    if (typeof JSON === "undefined") {
        // newer Handlebars versions require global JSON
        moduleInfo = req.getModuleInfo("json2", 0, 
                req.packs, 
                req.modules, 
                req.baseUrl, 
                req.mapProgs, 
                req.pathsMapProg, 
                req.aliases); 
        var jsonPath = moduleInfo.url; 
        bc.log("nrmJson2Load", jsonPath);
        load(jsonPath);
        if (typeof JSON === "undefined") {
            bc.error("JSON global variable is undefined after attempting to load the JSON2 polyfill.");
            return;
        }          
    }
    moduleInfo = req.getModuleInfo("handlebars-compiler", 0, 
            req.packs, 
            req.modules, 
            req.baseUrl, 
            req.mapProgs, 
            req.pathsMapProg, 
            req.aliases); //bc.getSrcModuleInfo("handlebars-compiler");
    var compilerPath = moduleInfo.url; 
    bc.log("nrmHandlebarsLoad", compilerPath);
    if (!compiler) {
        // non-AMD version of Handlebars, and the "Use" plugin doesn't work in Dojo's Rhino implementation
        load(compilerPath);
        if (typeof Handlebars === "undefined") {
            bc.error("Handlebars global variable is undefined after loading the compiler library.");
            return;
        }          
        compiler = Handlebars;
    }
    define('handlebars', compiler);
    
    var module = function(resource, callback) {
        var match = templateNameRe.exec(resource.mid);
        var template = match && match[2];
        if (!template) {
            bc.error("Unable to extract template name for module " + resource.mid);
            return;
        }
        req(['handlebars', 'nrm-templates/hbs'], function(Handlebars, hbs) {
            module.plugin = hbs; 
            var ext = hbs.getExtension(bc, template); 
            var prefix = hbs.getPrefix(bc, template), opt = null, aggregateDeps;
            if (match[3] === ext && match[1] === prefix) {
                bc.log("nrmHandlebarsConfig", ["name", template, "module", resource.mid]);
                aggregateDeps = hbs.getDeps(bc, template, resource.text);
                opt = hbs.getOptions(bc, template);
            } else {
                bc.log("nrmHandlebarsNotMapped", ["name", template, "module", resource.mid]);
                aggregateDeps = hbs.getDeps({ }, template, resource.text);
            }
            
            var deps = ['handlebars'];
            if (aggregateDeps) {
                for (var i in aggregateDeps) {
                    deps.push(aggregateDeps[i]);
                }
            }
            var normalize = "'" + deps.toString().split(",").join("','") + "'";

            var templateContents = Handlebars.precompile(resource.text, opt);
            // Write out the actual definition
            var init = "var templates = Handlebars.templates = Handlebars.templates || { };\n";
            var ret = "return templates['" + template + "'] = Handlebars.template(" + templateContents + ");\n";
            resource.text = [
              "define(", 
                "[", normalize, "], function(Handlebars){\n", init, ret, "});\n"
            ].join("");
            callback(resource);
        });
        return callback;
    };
    return module;
});
