define([
    'backbone', 
    'jquery', 
    '../../views/reportLauncherView',
    '../../views/layoutView', 
    '../../models/application',
    '../..', 
    'use!axe'
], function(Backbone, $, ReportLauncherView, LayoutView, Application, Nrm, axe) {
    function axeResultTest(assert, results, msgPrefix) {
        var msg = 'Should have no accessibility issues';
        if (msgPrefix) {
            msg = msgPrefix + ' ' + msg;
        }
        $.each(results.violations, function(i, rule) {
            console.error('Accessibility rule violated: ', rule);
            msg += ('\n' + rule.help + ", see " + rule.helpUrl);
        });
        assert.equal(results.violations.length, 0, msg);
    }
    function assertReportLauncherView(options, assertion, done) {                
        // create a container view in the qunit-fixture element
        Nrm.app = new Application();
        var container = new ContainerView();
        $(qunitFixture).html(container.render().$el);

        // set up the assertions to run when the modal is displayed
        container.assertModal(function(modal) {
            assertion(modal, container, function() {
                console.log('Hiding modal');
                modal.modal('hide');
            });
        }, function() {
            // finally, remove the container view
            container.remove();
            console.log('Removed container view');
            done();
        });
        // now show the modal
        ReportLauncherView.showReportLauncherView(options);
        
    }
    var qunitFixture = '#qunit-fixture', ContainerView = Backbone.View.extend({
        render: function() {
            this.listenTo(Nrm.event, 'app:modal', LayoutView.prototype.showModal);
            return this;
        },
        assertAccessible: function(assert, testcase, callback) {
            axe.a11yCheck(this.$el, function(results) {
                console.log('Accessibility test results: ', results);
                axeResultTest(assert, results, testcase && (testcase + ':'));
                // complete the async call
                if ($.isFunction(callback)) {
                    callback();
                }
            });
        },
        assertModal: function(modalShownCallback, modalHiddenCallback) {
            this.listenToOnce(Nrm.event, 'app:modal', function() {
                // if animation is enabled, the cleanup needs to wait until the hidden event is triggered...
                var modal = $('.modal', this.$el).last().one('hidden.bs.modal', function() {
                    console.log('Modal is hidden');
                    if ($.isFunction(modalHiddenCallback)) {
                        modalHiddenCallback(modal);
                    }
                });
                function afterVisible() {
                    console.log('Modal is visible');
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
    });
    return {
        /**
         * Test suite for {@link module:nrm-ui/views/reportLauncherView}.
         * @param {external:module:qunit} QUnit The QUnit module
         * @returns {undefined}
         */
        run: function(QUnit) {
            QUnit.test('artf63346: Show default report lanucher view with PDF url', function(assert) {
                assert.expect(12);
                var done = assert.async();
                
                // set up the modal options
                var options = {
                    url: 'api/files/helloworld.pdf'
                };
                var caption = ReportLauncherView.prototype.defaults.caption,
                    message = ReportLauncherView.prototype.defaults.message,
                    btnLabel = ReportLauncherView.prototype.buttonDefaults.label,
                    documentTitle = ReportLauncherView.prototype.defaults.documentTitle,
                    tooltip = 'Open the ' + documentTitle + ' in a new tab or window',
                    url = require.toUrl('nrm-ui/utils/pdfviewer.jsp?title=' + encodeURIComponent(documentTitle) + 
                            '&target=' + require.toUrl(options.url)),
                    target = '_blank';
                assertReportLauncherView(options, function(modal, container, callback) {
                    assert.equal($('.modal-header h4', modal).text().trim(), caption, 
                        'Modal caption is "' + caption + '"');
                    assert.equal($('.modal-body', modal).text().trim(), message, 
                        'Modal body is "' + message + '"');
                    var btn = $('.modal-footer .btn-primary', modal);
                    assert.equal(btn.length, 1, 'There is one primary button');
                    assert.equal(btn.text().trim(), btnLabel, 
                        'Primary button text in modal footer is "' + btnLabel + '"');
                    assert.equal(btn.attr('href'), url, 
                        'Report launcher button href is ' + url);
                    assert.equal(btn.attr('target'), target, 
                        'Report launcher button target is ' + target);
                    assert.equal(btn.attr('title'), tooltip, 
                        'Report launcher button tooltip is ' + tooltip);
                    var cancelBtn = $('.modal-footer button.btn-default', modal);
                    assert.equal(cancelBtn.text().trim(), 'Cancel', 'There is a Cancel button');
                    container.assertAccessible(assert, 'Default report launcher', callback);
                }, function() {
                    assertReportLauncherView(options, function(modal, container, callback) {
                    
                        var btn = $('.modal-footer .btn-primary', modal);
                        assert.equal(btn.length, 1, 'There is one primary button');
                        btn.click();
                    }, function() {
                        assert.equal($('.modal').length, 0, 'Modal is removed after clicking primary button');
                        assertReportLauncherView(options, function(modal, container, callback) {

                            var btn = $('#btn-cancel-report', modal);
                            btn.click();
                        }, function() {
                            assert.equal($('.modal').length, 0, 'Modal is removed after clicking Cancel button');
                            done();
                        });
                    });

                });
            });
            QUnit.test('artf63346: Show report lanucher view with customized options', function(assert) {
                assert.expect(11);
                var done = assert.async();
                
                // set up the modal options
                var options = {
                    url: 'api/files/helloworld.pdf',
                    caption: 'Special Report',
                    message: 'Hello world!',
                    documentTitle: 'Special Report Title',
                    button: {
                        label: 'Launch Special Report',
                        title: 'Customized tooltip',
                        id: 'btn-special-report',
                        className: 'btn-special-report'
                    }
                };
                var caption = options.caption,
                    message = options.message,
                    btnLabel = options.button.label,
                    btnId = options.button.id,
                    tooltip = options.button.title,
                    encodedTitle = encodeURIComponent(options.documentTitle),
                    url = require.toUrl('nrm-ui/utils/pdfviewer.jsp?title=' +  encodedTitle + 
                            '&target=' + require.toUrl(options.url)),
                    target = '_blank';
                assertReportLauncherView(options, function(modal, container, callback) {
                    assert.equal($('.modal-header h4', modal).text().trim(), caption, 
                        'Modal caption is "' + caption + '"');
                    assert.equal($('.modal-body', modal).text().trim(), message, 
                        'Modal body is "' + message + '"');
                    var btn = $('.modal-footer .btn-primary.btn-view-report', modal);
                    assert.equal(btn.length, 1, 'There is one primary button');
                    assert.equal(btn.text().trim(), btnLabel, 
                        'Primary button text in modal footer is "' + btnLabel + '"');
                    assert.equal(btn.attr('href'), url, 
                        'Report launcher button href is ' + url);
                    assert.equal(btn.attr('target'), target, 
                        'Report launcher button target is ' + target);
                    assert.equal(btn.attr('title'), tooltip, 
                        'Report launcher button tooltip is ' + tooltip);
                    assert.equal(btn.attr('id'), btnId, 
                        'Report launcher button id is ' + btnId);
                    assert.ok(btn.is('.btn-special-report'), 'Primary button has custom class');
                    var cancelBtn = $('.modal-footer button.btn-default', modal);
                    assert.equal(cancelBtn.text().trim(), 'Cancel', 'There is a Cancel button');
                    btn.click();
                }, function() {
                    assert.equal($('.modal').length, 0, 'Modal is removed after clicking primary button');
                    done();
                });
            });
            QUnit.test('artf63606: Show default report lanucher view with XLS url', function(assert) {
                assert.expect(9);
                
                // set up the modal options
                var options = {
                    url: 'api/files/helloworld.xls'
                };
                var caption = ReportLauncherView.prototype.defaults.caption,
                    message = ReportLauncherView.prototype.defaults.message,
                    btnLabel = ReportLauncherView.prototype.buttonDefaults.label,
                    documentTitle = ReportLauncherView.prototype.defaults.documentTitle,
                    tooltip = 'Open the ' + documentTitle + ' in a new tab or window',
                    url = require.toUrl(options.url),
                    target = '_blank';
                assertReportLauncherView(options, function(modal, container, callback) {
                    assert.equal($('.modal-header h4', modal).text().trim(), caption, 
                        'Modal caption is "' + caption + '"');
                    assert.equal($('.modal-body', modal).text().trim(), message, 
                        'Modal body is "' + message + '"');
                    var btn = $('.modal-footer .btn-primary', modal);
                    assert.equal(btn.length, 1, 'There is one primary button');
                    assert.equal(btn.text().trim(), btnLabel, 
                        'Primary button text in modal footer is "' + btnLabel + '"');
                    assert.equal(btn.attr('href'), url, 
                        'Report launcher button href is ' + url);
                    assert.equal(btn.attr('target'), target, 
                        'Report launcher button target is ' + target);
                    assert.equal(btn.attr('title'), tooltip, 
                        'Report launcher button tooltip is ' + tooltip);
                    var cancelBtn = $('.modal-footer button.btn-default', modal);
                    assert.equal(cancelBtn.text().trim(), 'Cancel', 'There is a Cancel button');
                    container.assertAccessible(assert, 'Default report launcher', callback);
                }, assert.async());
            });
        }
    };
    
});