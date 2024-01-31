/**
 * @file The RestoreLoginView extends {@link http://backbonejs.org/#View|Backbone.View} to provide a prompt to restore
 * the session if it has expired.
 * @see module:nrm-ui/views/restoreLoginView
 */
/** 
 * @module nrm-ui/views/restoreLoginView
 * 
 */
define(['..', 'backbone', 'underscore', 'jquery', 'hbs!restoreLogin'], function(Nrm, Backbone, _, $, template) {

    return Nrm.Views.RestoreLoginView = Backbone.View.extend(/** @lends module:nrm-ui/views/restoreLoginView.prototype */{
        /**
         * Create a new instance of the RestoreLoginView.  
         * @constructor
         * @alias module:nrm-ui/views/restoreLoginView
         * @classdesc
         *  Extends {@link http://backbonejs.org/#View|Backbone.View} to provide a prompt to restore the session if it 
         *  has expired. Application developers will not use this module directly, it is displayed in the wrapped
         *  {@link http://backbonejs.org/#Sync-ajax|Backbone.ajax} function created in 
         *  {@link module:nrm-ui/resourceCache.wrapAjax|ResourceCache.wrapAjax} when the main layout view renders 
         *  during application startup.
         * @param {Object} options
         * @param {string} [options.loginUrl="nrmcore/nrm-ui/logincheck.html"] URL for the resource that restores the
         * login.
         * @see {@link http://backbonejs.org/#View-constructor|Backbone View constructor / initialize}
         */ 
        initialize: function(options) {
           this.loginUrl = Nrm.resolveUrl((options && options.loginUrl) || "nrmcore/nrm-ui/logincheck.html");
            var button = $.extend({ }, this.buttonDefaults, options && options.button, {
                href: this.loginUrl
            });
            this.actions = [ button ];
            this.buttonId = button.id;
        },
        /**
         * Default button configuration
         * @type {module:nrm-ui/views/baseView~ControlConfig}
         */
        buttonDefaults: {
            type: 'btn',
            id: 'btn-restore-login',
            label: 'Restore Session',
            title: 'Restore the session by opening the login page in a new window or tab',
            btnStyle: 'primary',
            target: '_blank'
        },
        /**
         * Handles the window message event.
         * @param {Event} event Event data.
         * @returns {undefined}
         */
        onMessage: function(event) {
            console.log("received message");
            var origin = window.location.origin || (window.location.protocol + "//" + 
                                window.location.hostname + (window.location.port ? ':' + window.location.port: ''));
            if (event.origin !== origin)
                return;
            if (event.data === "Login successful") {
                console.log("login successful");
                this.$el.closest(".modal").modal('hide');
            }
        },
        /**
         * Render the view
         * @todo Move the HTML markup to a Handlebars template.
         * @returns {module:nrm-ui/views/restoreLoginView}
         * Returns this instance to allow chaining.
         * @see {@link http://backbonejs.org/#View-render|Backbone.View#render}
         */
        render: function() {
            this.$el.html(template({ loginUrl: this.loginUrl }));
            this.listenTo(this, 'renderComplete', function() {
                var modal = this.$el.closest('.modal');
                $('#' + this.buttonId, modal).focus();
            });
            if (window.addEventListener) {
                console.log("adding event listener");
                var listener = this.messageListener =  _.bind(this.onMessage, this);
                window.addEventListener("message", this.messageListener, false);
                window.nrmPostMessageProxy = function(message, origin) {
                    console.log("in nrmPostMessageProxy");
                    listener({ origin: origin, data: message });
                };
            }
            return this;
        },
        /**
         * Overrides {@link http://backbonejs.org/#View-remove|Backbone.View#remove} to remove the window event 
         * listener.
         * @returns {undefined}
         */
        remove: function() {
            Backbone.View.prototype.remove.apply(this, arguments);       
            if (this.messageListener) {
                window.removeEventListener("message", this.messageListener);
                this.messageListener = null;
                window.nrmPostMessageProxy = null;
            }
        }
    },
    /**@lends module:nrm-ui/views/restoreLoginView */
    {
        /**
         * Shows the RestoreLoginView.  Not intended for direct use by application because it is handled in a 
         * {@link http://backbonejs.org/#Sync-ajax|Backbone.ajax} wrapper that is set up when the 
         * {@link module:nrm-ui/views/layoutView|LayoutView} renders.
         * @returns {external:module:jquery.Promise}
         * Returns a promise that is resolved when the modal view is closed, but this does not necessarily indicate 
         * that the session was restored successfully.
         */
        restoreLogin: function() {
            if (this.restoringLogin) {
                return this.restoringLogin;
            }

            /**
             * Indicates that we are currently restoring the login.
             * @name module:nrm-ui/views/restoreLoginView.restoringLogin
             * @type {Boolean|external:module:jquery~Promise}
             */
            var dfd = this.restoringLogin = new $.Deferred(), view = new this();
            console.log("Attempting to re-establish client session...");

            var options =  {
                caption: "Session Expired",
                backdrop: "static",
                view: view,
                actions: view.actions,
                hideCloseIcon: true,
                callback: _.bind(function() {
                    dfd.resolve();
                    this.restoringLogin = false;
                }, this)
             };
            Nrm.event.trigger("app:modal", options);
            if (!options.handled)
                dfd.reject();
            return dfd.promise();
        }
    });
});