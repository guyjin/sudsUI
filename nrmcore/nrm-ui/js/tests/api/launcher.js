/**
 * 
 * @file A test loader module
 * @see module:nrm-ui/tests/api/launcher
 */

(function(window) {
    /**
     * Test loader module
     * @module nrm-ui/tests/api/launcher
     */
    define([
        'use!sinon-qunit',   // the QUnit framework
        'sinon',             // the Sinon library
        'jquery',            // everybody uses jquery, right?
        'module'             // information about this module
    ], function(QUnit, sinon, $, module) {
        var defaults = {
            moduleStart: function(module) {
                console.log('Running module ' + module.name);
            },
            testStart: function(test) {
                console.log(test.name + ": started.");
            },
            testDone: function(test) {
                console.log(test.name + ": done.");
            },
            modules: { },
            precheck: true,
            postcheck: true,
            sinon: {
               useFakeTimers: false // tests need to enable this explicitly to use the fake timer
            }
        }, callbacks = ['begin', 'done', 'moduleStart', 'moduleDone', 'testStart', 'testDone'];

        return /** @alias module:nrm-ui/tests/api/launcher */{
            /**
             * Runs a list of test modules.
             * @param {external:require} require The AMD require implementation.
             *  Pass a context-sensitive require to enable relative module IDs in the config
             * @param {object} options
             * @param {object} options.main - The application main module, 'app/main', this is required to ensure any modules
             *  included in the 'app/main' layer are loaded from the layer if running tests with optimized build
             * @param {object} options.modules - The configuration identifying test modules to run.
             *  Should have keys representing module ids, values representing on/off indicator.
             * @param {function} [options.begin] - QUnit "begin" callback
             * @param {function} [options.done] - QUnit "end" callback
             * @param {function} [options.moduleStart] - QUnit "moduleStart" callback, default callback logs the module name
             * @param {function} [options.moduleDone] - QUnit "moduleDone" callback
             * @param {function} [options.testStart] - QUnit "testStart" callback, default callback logs the test name
             * @param {function} [options.testDone] - QUnit "testDone" callback, default callback logs the test name
             * @param {boolean} [options.precheck=true] - enable the precondition test suite
             * @param {boolean} [options.postcheck=true] - enable the post-condition test suite
             * @param {object} [options.sinon] - configuration for the Sinon library for QUnit integration
             * @return {undefined}
             * @see Refer to {@link http://api.qunitjs.com/category/callbacks/|QUnit callbacks} for information on the 
             * various callbacks supported in the options.
             */
            startup: function(require, options) {
                options = $.extend({ }, defaults, options);
                options.sinon = $.extend({ }, defaults.sinon, options.sinon);
                
                // register callbacks
                $.each(callbacks, function(i, cbName) {
                    var callback = options[cbName];
                    if (callback) {
                        QUnit[cbName](callback);
                    }
                });
                
                // configure sinon
                $.each(options.sinon, function(key, value) {
                    sinon.config[key] = value; 
                });

                // generate a list of test module IDs
                var tests = [];
                if (options.modules) {
                    // options.config should have keys representing module ids, values representing on/off indicator.
                    $.each(options.modules, function(key, value) {
                        if (value) {
                            tests.push(key);
                        } else {
                            console.log('Skipping test ' + t);
                        }
                    });
                }

                var hasRequire = $.isFunction(require);

                // check preconditions, unless caller has disabled this feature
                if (options.precheck) {
                    QUnit.module(module.id + '.precheck');            
                    QUnit.test('Testing preconditions', function(assert) {
                        assert.expect(3);
                        assert.ok(options.main && $.isFunction(options.main.startup), 
                                'Application main module is defined in options and implements expected "startup" function');
                        assert.ok(hasRequire, 'The "require" parameter is a function');
                        assert.ok(tests.length, 'At least one test module is enabled');
                    });
                }

                if (!hasRequire) {
                    require = window.require;
                }

                // load all test modules
                require(tests, function() {
                    var args = Array.prototype.slice.call(arguments), count = 0, errors = {};
                    $.each(tests, function(i, mid) {
                        var module = args[i], absMid = require.toAbsMid(mid);  
                        try {
                            console.log('Loading test ' + mid);
                            if ($.isFunction(module.run)) {
                                // define the QUnit module to match the AMD module ID
                                QUnit.module(absMid, module.hooks, module.nested);
                                // each test module must define a run function
                                module.run(QUnit);
                                count++;
                            } else {
                                throw new Error('Module does not implement the "run" function');
                            }                            
                        } catch (err) {
                            errors[absMid] = err;
                            console.error(err);
                        }
                    });
                    
                    // check postconditions, unless caller has disabled this feature
                    if (options.postcheck) {
                        QUnit.module(module.id + '.postcheck');            
                        QUnit.test('Testing post-conditions', function(assert) {
                            assert.expect(1 + tests.length - count);
                            assert.equal(count, tests.length, 'All test modules were executed, total count: '
                                    + tests.length);
                            $.each(errors, function(mid, error) {
                                assert.ok(false, 'Module ' + mid + ' threw error: ' + error);
                            });
                        });
                        
                    }
                    
                    // start QUnit.
                    QUnit.start();
                });
            }
        };

    });
})(this);


