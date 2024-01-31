define(['qunit', 'jquery', '../../views/layoutView', 'backbone', '../..', 'use!axe', '../../models/version'], 
        function(QUnit, $, LayoutView, Backbone, Nrm, axe, Version) {
    var containerId = "nrm-layout-container";
    function mixConfig(config) {
        var layout = $.extend({ container: "#" + containerId }, config && config.layout);
        return $.extend({ appName: "Unit Tests" }, config, { layout: layout });
    }
    function addContainer() {
        // the view sets its element to the container, thus removing the view removes the container
        domroot().append('<div id="' + containerId + '" style="height:100%"></div>');
    }
    function domroot() {
        return $("#qunit-fixture");
    }
    function cleanup(view) {
        console.log("Removing the view");
        view.remove();
        // TODO: this should be handled in the view
        if (Backbone.History.started) {
            Backbone.history.stop();
        }
    }
    function aXeResultTest(assert, results, msgPrefix) {
        var msg = 'Should be no accessibility issues';
        if (msgPrefix) {
            msg = msgPrefix + ' ' + msg;
        }
        $.each(results.violations, function(i, rule) {
            console.error('Accessibility rule violated: ', rule);
            msg += ('\n' + rule.help + ", see " + rule.helpUrl);
        });
        assert.equal(results.violations.length, 0, msg);
    }
    function assertModal(assert, modalShownCallback, modalHiddenCallback) {
        Nrm.event.once('app:modal', function() {
            // if animation is enabled, the cleanup needs to wait until the hidden event is triggered...
            var modal = $('.modal', domroot()).last().one('hidden.bs.modal', function() {
                if ($.isFunction(modalHiddenCallback)) {
                    modalHiddenCallback(modal);
                }
            });
            function afterVisible() {
                if ($.isFunction(modalShownCallback)) {
                    modalShownCallback(modal);
                }
            }
            // if animation is disabled, the modal will be visible already, and shown event is already triggered
            if (modal.filter(':visible').length) {
                afterVisible();
            } else {
                // if animation is enabled, the modal will not be visible until the shown event is triggered
                modal.one('shown.bs.modal', afterVisible);
            }
        });
    }
    function assertAboutBox(assert, testcase, expected, doneCallback) {
        Nrm.app.unset('version');
        Nrm.app.unset('svnVersion');
        Nrm.app.unset('nrmCoreVersion');
        LayoutView.version.clear();
        LayoutView.nrmCoreVersion.clear();
        assertModal(assert, function(modal) {
            assert.equal(modal.length, 1, testcase + ': Modal element was added');
            assert.equal(Nrm.app.get('version'), expected.version, //'1.0.0', 
                testcase + ': Version attribute set to expected value');
            assert.equal(Nrm.app.get('svnVersion').rev, expected.rev, //'500', 
                testcase + ': SVN revision attribute set to expected value');
            assert.equal(Nrm.app.get('svnVersion').build, expected.build, //'03/22/2016 08:43', 
                testcase + ': Build date is formatted correctly');
            assert.equal(Nrm.app.get('nrmCoreVersion').rev, expected.nrmcoreRev, //'400', 
                testcase + ': NRM Core SVN revision attribute set to expected value');
            assert.equal(Nrm.app.get('nrmCoreVersion').version, Version.coreVersion, 
                testcase + ': NRM Core version attribute set to ' + Version.coreVersion);
            // modalShownCallback
            axe.a11yCheck(domroot(), function (results) {
                aXeResultTest(assert, results, testcase + ':');
                // complete the async call
                modal.modal('hide');
            });
        }, doneCallback);
    }
   return { 
       run:  function() {
            // module defined in main
            //QUnit.module("nrmdemo.layoutView");
            QUnit.test('Layout view renders navbar', function(assert) {
                
                assert.expect(3);
                var rendered = assert.async(), dfd = new $.Deferred(), view;
                
                // TODO: fix layout view to make it easier to identify when ALL of the view components have loaded
                Nrm.event.once("app:init", function() {
                    $.when(dfd, view.layoutLoading).done(function() {
                        assert.equal($(".ui-layout-resizer", domroot()).length, 3, 
                            "Layout plugin is rendered in the container element with three resizable panels");
                        axe.a11yCheck(domroot(), function (results) {
                            aXeResultTest(assert, results, 'artf58790 PENDING');
                            // complete the async call
                            cleanup(view);
                            rendered();
                        });
                    });
                });
                addContainer();
                view  = new LayoutView(mixConfig());
                $.when(view.render()).done(function(){
                    assert.equal($("nav", domroot()).length, 1, "Nav element is rendered in the container element");
                    dfd.resolve();
                });
            });
            QUnit.test('Single-panel layout view renders navbar', function(assert) {
                assert.expect(3);
                var rendered = assert.async();
                
                addContainer();
                var view  = new LayoutView(mixConfig({ singlePanel: true }));
                $.when(view.render()).done(function(){
                    assert.equal($("nav", domroot()).length, 1, "Nav element is rendered in the container element");
                    assert.equal($(".ui-layout-resizer", domroot()).length, 0, "Layout plugin is not rendered in the container element");
                    axe.a11yCheck(domroot(), function (results) {
                        aXeResultTest(assert, results);
                        // complete the async call
                        cleanup(view);
                        rendered();
                    });
                });
            });
            QUnit.test('artf46748: About box rendered using single request for revision numbers', function(assert) {
                assert.expect(7);
                var rendered = assert.async(), view, sandbox = this.sandbox,
                   svnAndCoreCombined = '{"version": "1.0.0",' + 
                           '"rev": "500",' + 
                           '"build": "2016-03-22T08:43:17",' +
                           '"nrmcoreRev": "400"}';
                                
                addContainer();
                // using single panel layout because the rendering is less convoluted
                view  = new LayoutView(mixConfig({ singlePanel: true }));
                $.when(view.render()).done(function(){
                    var xhr = sandbox.useFakeXMLHttpRequest();
                    assertAboutBox(assert, 'SVN and core revision in single request', {
                        version: '1.0.0',
                        rev: '500',
                        nrmcoreRev: '400',
                        build: '03/22/2016 08:43'                        
                    }, function() {
                        // modalHiddenCallback
                        cleanup(view);
                        rendered();   
                    });
                    Nrm.event.trigger('app:about');
                    
                    xhr.requests[0].respond(200, { 'Content-Type': 'plain/text' }, svnAndCoreCombined);
                });
            });
            QUnit.test('artf46748: About box rendered using separate file for core revision', function(assert) {
                assert.expect(7);
                var rendered = assert.async(), view, sandbox = this.sandbox,
                   svnOnly = '{"rev": "200",' + 
                           '"build": "2016-03-22T08:43:17"}',
                   nrmcoreOnly = '{"rev": "300",' + 
                           '"build": "2016-03-22T08:43:17"}';
                                
                addContainer();
                // using single panel layout because the rendering is less convoluted
                view  = new LayoutView(mixConfig({ singlePanel: true }));
                $.when(view.render()).done(function(){
                    var xhr = sandbox.useFakeXMLHttpRequest();
                    assertAboutBox(assert, 'SVN and core revision in separete request', {
                        version: undefined,
                        rev: '200',
                        nrmcoreRev: '300',
                        build: '03/22/2016 08:43'                        
                    }, function() {
                        // modalHiddenCallback
                        cleanup(view);
                        rendered();   
                    });
                    Nrm.event.trigger('app:about');
                    
                    xhr.requests[0].respond(200, { 'Content-Type': 'plain/text' }, svnOnly);
                    xhr.requests[1].respond(200, { 'Content-Type': 'plain/text' }, nrmcoreOnly);
                });
            });
            QUnit.test('About box uses XHR request when Nrm.offlineStorage is set', function(assert) {
                assert.expect(8);
                var rendered = assert.async(), view, sandbox = this.sandbox,
                   svnAndCoreCombined = '{"version": "1.0.0",' + 
                           '"rev": "500",' + 
                           '"build": "2016-03-22T08:43:17",' +
                           '"nrmcoreRev": "400"}';
                                
                addContainer();
                Nrm.offlineStorage = "LocalDB";
                // using single panel layout because the rendering is less convoluted
                view  = new LayoutView(mixConfig({ singlePanel: true }));
                $.when(view.render()).done(function(){
                    var xhr = sandbox.useFakeXMLHttpRequest();
                    assertAboutBox(assert, 'SVN and core revision with Nrm.offlineStorage set', {
                        version: '1.0.0',
                        rev: '500',
                        nrmcoreRev: '400',
                        build: '03/22/2016 08:43'                        
                    }, function() {
                        // modalHiddenCallback
                        assert.equal(Nrm.offlineStorage, "LocalDB", "Nrm.offlineStorage is set to LocalDB");
                        Nrm.offlineStorage = undefined;
                        cleanup(view);
                        rendered();   
                    });
                    Nrm.event.trigger('app:about');
                    
                    xhr.requests[0].respond(200, { 'Content-Type': 'plain/text' }, svnAndCoreCombined);
                });
            });
        }
    };
});