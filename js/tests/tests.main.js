// require the unit tests.
define([
    'nrm-ui/tests/api/launcher',  // NRM Core loader module for starting QUnit
    './tests.config',             // tests.config is a list of test modules to run
    'require',                    // enables context-sensitive require for relative module ids
    'app'                         // ensure the main module is loaded for consistency in optimized build
], function(launcher, config, require, NrmDemo) {
       
     launcher.startup(require, {
         main: NrmDemo,
         modules: config
     });  
});



