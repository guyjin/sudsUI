var profile = (function() {
    if (!require.nrmcore) {
        console.log("Expected require.nrmcore object is missing, please make sure nrmcore.profile.js is the " +
                "first profile file processed in the build");
    }
    var nonAmdModules = require.nrmcore.nonAmdModules || { };
    var noPkgModules = require.nrmcore.noPkgModules || { };
    var hasAbsMid = require.nrmcore.hasAbsMid || { };
    var noTag = require.nrmcore.noTag || { };
    
    var testModules = require.nrmcore.testModules || { };
   
    return {
        basePath: "../../../webapp", // relative to this file
        trees: [ [".", ".", /.*/]], // only load the modules listed below
        modules: (function() {
            function addModules(src, target) {
                for (var m in src) {
                    target[m] = src[m];
                }
                return target;
            }
            return addModules(noPkgModules, addModules(nonAmdModules, { }));
        })(),
        resourceTags: {
            amd: function(filename, mid) {
                return !noTag[mid] && noPkgModules[mid];
            },
            hasAbsMid: function(filename, mid) {
                return !!hasAbsMid[mid];
            },
            test: function(filename, mid) {
                return !!testModules[mid];
            }        
        }
    };
})();
