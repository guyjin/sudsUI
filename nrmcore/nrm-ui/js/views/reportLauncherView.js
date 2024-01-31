/**
 * Nested modal view to provide an accessible way to open a PDF or other report URL
 * in a new window or tab.  Depends on ../utils/pdfviewer.jsp for PDF documents, uses direct link for other types.
 * @file
 */
/**
 * @module nrm-ui/views/reportLauncherView
 */
define([
    '..', 
    'backbone', 
    'jquery', 
    'require', 
    'underscore',
    './baseView'
], function(Nrm, Backbone, $, require, _, BaseView) {
    return Nrm.Views.ReportLauncherView = Backbone.View.extend(
    /**@lends module:nrm-ui/views/reportLauncherView.prototype */
    {
        /**
         * Create a new instance of the ReportLauncherView.  Application developers will usually not call this directly, 
         * instead they will call the static {@link module:nrm-ui/views/reportLauncherView.showReportLauncherView} 
         * method.
         * @constructor
         * @alias module:nrm-ui/views/reportLauncherView
         * @classdesc Backbone view to be nested in a {@link module:nrm-ui/views/modalView|ModalView}
         * @param {Object} options
         * @returns {undefined}
         * @see {@link http://backbonejs.org/#View-constructor|Backbone.View#initialize}
         */
        initialize: function(options) {
            this.options = $.extend({ }, this.defaults, options);
            var button = $.extend({ }, this.buttonDefaults, options.button);
            // ensure btn-view-report class is added even if default className is overridden
            button.className = BaseView.addClassName(button.className, 'btn-view-report');
            this.href = button.href = this.constructor.getPdfViewerUrl(this.options.documentTitle, options.url);
            if (!button.title) {
                button.title = 'Open the ' + this.options.documentTitle + ' in a new tab or window';
            }
            this.actions = [
                button, 
                {
                    type: 'btn',
                    label: 'Cancel',
                    id: 'btn-cancel-report',
                    className: 'btn-cancel-report'
                }
            ];
            this.buttonId = button.id;
        },
        /**
         * Default configuration
         */
        defaults: {
            message: 'The report is ready to download.',
            caption: 'Report Viewer',
            documentTitle: 'NRM Report Viewer'
        },
        /**
         * Default primary button configuration
         */
        buttonDefaults: {
            type: 'btn',
            id: 'btn-view-report',
            label: 'View Report',
            btnStyle: 'primary'
        },
        /**
         * Render the view.
         * @returns {module:nrm-ui/views/reportLauncherView}
         * @see {@link http://backbonejs.org/#View-render|Backbone.View#render}
         */
        render: function() {
            var html = this.options.message;
            if ($.isFunction(html)) {
                html = html(this.options);
            }
            this.$el.html(html);
            
            this.listenTo(this, 'renderComplete', function() {
                var modal = this.$el.closest('.modal');
                $('#' + this.buttonId, modal).attr('target','_blank').focus();
            });
            return this;
        }
    }, 
    /**@lends module:nrm-ui/views/reportLauncherView */
    {
        /**
         * Relative module ID of the PDF viewer page
         */
        viewer: '../utils/pdfviewer.jsp',
        /**
         * Computes the URL of the PDF viewer resource for a relative URL to a PDF document, for example, 
         * "api/files/report4ff662b5-e261-47f4-a367-c68508c86f7b.pdf"
         * @param {String} documentTitle The title of the PDF document that will be displayed on the browser tab.
         * @param {String} url The URL of the target PDF file, relative to the context root.
         * @returns {String} The resolved URL to the PDF viewer resource.
         */
        getPdfViewerUrl: function(documentTitle, url) {
            var resolvedUrl = require.toUrl(url); //require.toUrl('api/reports/' + fileName)
            if (_.isString(url) && url.lastIndexOf('.pdf') != url.length - 4) {
                return resolvedUrl;
            }
            var jsp = require.toUrl(this.viewer), 
                    title = encodeURIComponent(documentTitle);
            return jsp + '?title=' + title + '&target=' + resolvedUrl;
        },
        /**
         * Show the ReportLauncherView.
         * @param {Object} options
         * @param {String} options.url The URL for the PDF document or report to display, relative to the context root.
         * @param {String} [options.caption] Text to display in the modal header.
         * @param {String} [options.documentTitle] Title to display in the browser tab
         * @param {String} [options.message] HTML to display in the modal content.
         * @param {Object} [options.button] Configuration for the primary button that will override the defaults.
         * @returns {module:nrm-ui/views/reportLauncherView}
         * The ReportLauncherView that will be displayed. Consumers do not have to do anything with the return value, 
         * the view will display automatically.
         */
        showReportLauncherView: function(options) {
            var view = new this(options);
            Nrm.event.trigger('app:modal', $.extend({ }, options, {
                caption: view.options.caption,
                view: view,
                actions: view.actions,
                events: {
                    'click .btn-view-report,.btn-cancel-report': 'close',
                    'keypress .modal': function(e) { 
                        // override default event, and do nothing.
                    }
                }
            }));
            return view;
        }
    })
});