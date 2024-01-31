/**
 * @file The LayoutView extends {@link http://backbonejs.org/#View|Backbone.View} to provide the main layout for the
 * application.
 * @see module:nrm-ui/views/layoutView
 */
/** 
 * @module nrm-ui/views/layoutView
 * @borrows module:nrm-ui/views/layoutView.showAbout as module:nrm-ui/views/layoutView#showAbout
 * @borrows module:nrm-ui/models/application#getUserInfo as module:nrm-ui/views/layoutView#getUserInfo
 * @borrows module:nrm-ui/models/application#mapView as module:nrm-ui/views/layoutView#map
 */

define(['require', '..', 'jquery', 'underscore', 'backbone', 'handlebars', '../models/application', '../appRouter', 
    '../resourceCache', '../models/version', '../models/settings', './modalView', '../plugins/messageBox', 'use!modernizr',
    'hbs!error', 'hbs!unauthorized', 'hbs!NRMnavbar', 'hbs!logoutMessage', 'hbs!home', 'hbs!about',
    '../plugins/nrmContextMenu'
],
         function(require, Nrm, $, _, Backbone, Handlebars, Application, AppRouter, 
         ResourceCache, Version, Settings, ModalView, MessageBox, Modernizr,
         errorTemplate, unauthorizedTemplate, navbarTemplate, logoutTemplate, homeTemplate, aboutTemplate,
         NRMContextMenu) {
    
    /**
     * Typical event data for navigation events.
     * @typedef {module:nrm-ui/models/application~NestedContextResult} NestedContextWithCallback
     * @property {Function} [callback] Callback function that will be passed the original event data
     * with an additional cancel property set in some scenarios.
     * @property {*} [source] Object to use as the "this" reference for the callback option.
     */
    
    return Nrm.Views.LayoutView = Backbone.View.extend(/** @lends module:nrm-ui/views/layoutView.prototype */{
        /**
         * Create a new instance of the LayoutView.  
         * @constructor
         * @alias module:nrm-ui/views/layoutView
         * @classdesc
         *  Extends {@link http://backbonejs.org/#View|Backbone.View} to provide the main layout for the application.
         *  Application developers will typically extend this view to provide application-specific global behavior.
         * @param {module:nrm-ui/models/application~AppConfig} options 
         * @see {@link http://backbonejs.org/#View-constructor|Backbone View constructor / initialize}
         */
        initialize: function(appState) {
            var opts = {config: appState};
            var self = this;
            this.loadingTimer = Nrm.showLoadingIndicator({
                message: 'Application loading'
            });
            /**
             * Promise that is resolved when asynchronous initialization is completed.
             * @type {external:module:jquery~Promise}
             */
            this.ready = $.when(ResourceCache.getConfig(opts)).always(function(cfg) {
                if (cfg !== appState) {
                    cfg = $.extend({}, _.omit(appState, "url"), cfg);
                }
                /**
                 * The application instance which is set during the initialization of the
                 *  {@link module:nrm-ui/views/layoutView|LayoutView}.
                 * @name module:nrm-ui/main.app
                 * @type {module:nrm-ui/models/application}
                 */
                Nrm.app = Nrm.Application = new Application(cfg);
                // TODO: consider moving layoutConfig and mapConfig initialization to conditional blocks in the renderLayout function
                /**
                 * Layout configuration
                 * @name module:nrm-ui/views/layoutView#layoutConfig
                 * @type {module:nrm-ui/plugins/nrmLayout~LayoutConfig}
                 */
                self.layoutConfig = Nrm.app.get("layout") || {};
                //self.mapConfig = Nrm.app.get("map") || { }; 
                /**
                 * Map configuration
                 * @name module:nrm-ui/views/layoutView#mapConfig
                 * @type {module:nrm-map/views/mapView~MapConfig}
                 */
                self.mapConfig = _.extend({}, Nrm.app.get("map"), Nrm.app.pick("restoreSettings"));
                /**
                 * Element id for the accordion group that contains search, tools and map accordion panels.
                 * @name module:nrm-ui/views/layoutView#accordionId
                 * @type {string}
                 */
                self.accordionId = Nrm.app.get("accordionId") || "nrm-app-accordion";
                /**
                 * Selector for the container of the map
                 * @name module:nrm-ui/views/layoutView#container
                 * @default body
                 * @type {string}
                 */
                self.container = self.layoutConfig.container || "body";
            }, this, true);
        },
        /**
         * Default event hash to delegate events. Note that even if a subclass overrides this property, it is 
         * absolutely essential to extend the default events using $.extend({ }, LayoutView.prototype.events, { ... }).
         * @type {Object}
         * @see {@link http://backbonejs.org/#View-events|Backbone.View#events}
         */
        events: {
            "click .onlineindicator": "toggleOnline",
            "click #app-navbar ul ul a": function() {
                if ($('#app-navbar').hasClass('in')) {
                    $('.navbar-toggle').click();
                }
            },
            /*"click .navbar .badge-errors": "displayErrors",*/
            "show.bs.collapse .ui-layout-west": function(e) {
                //console.log("show accordion from mainView");
                this.setCurrentControl(e);
            },
            'show.bs.collapse .nrm-accordion-panel': "toggleAccordionHeader",
            'hide.bs.collapse .nrm-accordion-panel': "toggleAccordionHeader",
            'show.bs.collapse .nrm-error-details': function(e) {
                this.toggleShowDetailsButton(e, true);
            },
            'hide.bs.collapse .nrm-error-details': function(e) {
                this.toggleShowDetailsButton(e, false);
            },
            "click .nrm-route-action": function(e) {
                this.navigateRoute(e, true);
            },
            "focusin #main-content": function(e) {
                $(e.target).closest(".ui-layout-pane").addClass("main-content-focused");
            },
            "focusout #main-content": function(e) {
                $(e.target).closest(".ui-layout-pane").removeClass("main-content-focused");
            },
            "focusin .nrm-help-provider": "setCurrentControl",
            "keydown": "launchHelp",
            'select2-loaded': function(e) {
                // fix incorrect Select2 auto-width
                var $drop = $("#select2-drop.select2-drop-auto-width");
                if ($drop.length) {
                    var $target = $(e.target).select2("container"),
                            left = $target.offset().left,
                            newLeft = $drop.offset().left,
                            width = $drop.outerWidth(),
                            newWidth = $drop.css({width: '', left: 0}).outerWidth() + 1,
                            $window = $(window);
                    newWidth = width > newWidth ? width : newWidth;
                    //                console.log({ newLeft: newLeft, 
                    //                    left: left, 
                    //                    newWidth: newWidth, 
                    //                    width: $target.outerWidth(),
                    //                    scrollLeft: $window.scrollLeft(),
                    //                    windowWidth: $window.width()
                    //                });
                    if (Math.floor(newLeft) < Math.floor(left)) {
                        newLeft -= (newWidth - width);
                    } else if (newLeft + newWidth >= $window.scrollLeft() + $window.width()) {
                        newLeft = left - newWidth + $target.outerWidth();
                    }

                    //                console.log({ newLeft: newLeft, 
                    //                    left: left, 
                    //                    newWidth: newWidth, 
                    //                    width: $target.outerWidth()
                    //                });
                    $drop.css({width: newWidth, left: (newLeft < 0 ? 0 : newLeft)});
                }
            }
        },
        /**
         * Event handler for the focusin event on all elements with "nrm-help-provider" class.
         * @param {Event} e Event data.
         * @returns {undefined}
         */
        setCurrentControl: function(e) {
            //console.log('setCurrentControl',e);
            // note: still using e.target instead of e.currentTarget to avoid the awkwardness of nested elements matching the selector
            var helpContext = $(e.target).closest('[data-nrm-help-context]').attr('data-nrm-help-context');
            this.setHelpContext(helpContext);
        },
        /**
         * Set the context-sensitive help topic.
         * @param {string} [helpContext] The help context topic, defaults to the helpContext attribute set in the main
         * application configuration.
         * @returns {undefined}
         */
        setHelpContext: function(helpContext) {
            // if currently focused element is inside a modal, look for a help link in the modal
            // TODO: this is not the most efficient way to do this. Ideally, the modal view would catch the focusin event 
            // with identical handler (see setCurrentControl above), and stopPropagation on the event.
            // To accomplish this, we could create a "helpProvider" mixin module, and refactor all of the help-related stuff 
            // into that module
            var $menuItem, $helpLink, url, re, $modal = $(document.activeElement).closest('.modal');
            if ($modal.length) {
                $helpLink = $('.nrm-modal-help', $modal);
                $menuItem = $helpLink.filter('.btn');
            }
            if (!$helpLink || !$helpLink.length) {
                $menuItem = $("#context-help");
                $helpLink = $('a', $menuItem);
            }
            helpContext = helpContext || (Nrm.app.get("helpContext") || "");
            url = Nrm.app.resolveHelpUrl(helpContext) || "#context-help";
            var props = {'target': "_blank", 'href': url};
            if (url === "#context-help") {
                $menuItem.addClass('disabled');
                $helpLink.addClass('nrm-route-action').prop(props);
            } else {
                $menuItem.removeClass('disabled');
                $helpLink.removeClass('nrm-route-action').prop(props);
            }
            //console.log('layoutView reset helpcontext to ' + url);
        },
        /**
         * Event handler for keyboard shortcut Alt + F1 to launch the context-sensitive help topic.
         * @param {Event} e Key event handler.
         * @returns {undefined}
         */
        launchHelp: function(e) {
            // cannot use e.key === "F1", it is not consistently set in all browsers (fails in Chrome)
            // only use ALT+F1 because some browsers use combinations like ALT+CTRL+F1 for other commands.
            if (e.altKey && e.which === 112 &&
                    !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                try {
                    // if the modal view is visible and has its own help link, otherwise use global one
                    var el, $modal = $(e.target).closest('.modal'); // find closest parent modal
                    if ($modal.length) { // if we found it
                        // use class selector instead of id selector to allow stacked modals with unique ids.
                        el = $(".nrm-modal-help", $modal)[0]; // find the matching selector within the modal
                    }
                    if (!el) { // if no parent modal, or no matching child in the parent
                        el = $("#context-help-link", this.$el)[0];
                    }
                    if (el) {
                        el.click();
                        e.stopPropagation();
                    } else {
                        console.warn('Could not launch help');
                    }
                } catch (ex) {
                    console.warn('Error attempting to launch help', ex);
                }
            }
        },
        /**
         * Navigate a route in response to clicking a link.  This overrides the browser default behavior for &lt;a&gt;
         * elements with the "nrm-route-action" class so that the hash fragment in the browser address bar does not 
         * change and allows the route handler to execute twice in a row.  It is also used on all other links if
         * the application has enabled the HTML5 pushState support so that hrefs formatted like #route/a/b/c will still
         * work the same as they would without the HTML5 pushState enabled.
         * @param {Event} e The event data.
         * @param {Boolean} noHashChange Indicates that the hash fragment should not change.
         * @returns {undefined}
         */
        navigateRoute: function(e, noHashChange) {
            if (e.isDefaultPrevented())
                return; // something else got there first.
            var $target = $(e.target);
            if ($target.is(".disabled") || $target.parent().is("li.disabled")) {
                e.preventDefault();
                return; // disabled buttons or dropdown menu items
            }

            var match = ($target.attr('href') || '').match(/#(.*)$/);
            var hash = match ? match[1] : '';
            if (noHashChange) {
                // trigger a Backbone route without a hashchange.
                e.preventDefault();
                if (hash)
                    Nrm.app.loadUrl(hash);
            } else if (hash) {
                e.preventDefault();
                Nrm.app.navigateUrl(hash, {trigger: true, replace: false});
            }
        },
        /**
         * Handles click event on accordion header to toggle the chevron icon.
         * @param {Event} event Event data
         * @returns {undefined}
         */
        toggleAccordionHeader: function(event) {
            if (event.target !== event.currentTarget)
                return;
            var $collapse = $(event.target), $panel = $collapse.parent(),
                    $header = $panel.children().filter('.panel-heading'),
                    $icon = $('.glyphicon.glyphicon-chevron-down,.glyphicon.glyphicon-chevron-right', $header);
            $icon.toggleClass("glyphicon-chevron-down").toggleClass("glyphicon-chevron-right");
            $(".nrm-titlebtn-expand", $panel).toggleClass("hidden");
        },
        /**
         * Handles the Less/More toggle button click to change the button text.
         * @param {type} event
         * @param {type} show
         * @returns {undefined}
         */
        toggleShowDetailsButton: function(event, show) {
            var less = "Less", more = "More"; // var less = "Hide Details", more = "Show Details"; 
            var $panel = $(event.target).parent();
            $panel.find(".nrm-error-details-btn").text(show ? less : more);
        },
        /**
         * Get the online indicator badge.
         * @returns {external:module:jquery}
         */
        onlineIndicator: function() {
            return $('#onlineindicator span');
        },
        /**
         * Handle click event on online indicator badge to simulate toggling online mode if debug option is set on the
         * main application configuration.
         * @returns {undefined}
         */
        toggleOnline: function() {
            if (Nrm.app && Nrm.app.get("debug")) {
                this.setOnlineMode(!Nrm.app.get("online"));
            }
        },
        /**
         * Explicitly set the online mode, regardless of whether the application is actually offline.
         * @param {Boolean} online Online mode to set.
         * @returns {undefined}
         * @see {@link module:nrm-ui/applicationCache#setOnlineMode|ApplicationCache#setOnlineMode}
         */
        setOnlineMode: function(online) {
            if (this.appCache)
                this.appCache.setOnlineMode(online);
            //        var mode = online ? "Online" : "Offline";
            //        var onCls = "label-success", offCls = "label-warning";
            //        var onlineInd = $('.onlineindicator');
            //        onlineInd.text(mode);
            //        if (online) {
            //            onlineInd.addClass(onCls);
            //            onlineInd.removeClass(offCls);
            //        } else {
            //            onlineInd.addClass(offCls);
            //            onlineInd.removeClass(onCls);          
            //        }
            //        Nrm.app.set("online", online);
            //        Nrm.event.trigger("onlineStatusChanged");
        },
        /**
         * Render the view
         * @returns {external:module:jquery~Promise|nrm-ui/views/layoutView}
         * Return a promise that is resolved when the view has finished rendering asynchronously, or this instance.
         */
        render: function() {
            if (!this.hasRendered) {
                /**
                 * Indicates whether render function has been called.
                 * @name module:nrm-ui/views/layoutView#hasRendered
                 * @type {Boolean}
                 */
                this.hasRendered = true;
                if (!Handlebars.partials["navbar"]) {
                    this.ready = $.when.apply($, [
                        this.ready,
                        Application.requireDeferred(['hbs!navbar'], function(template) {
                            Handlebars.registerPartial("navbar", template);
                        })
                    ]);
                }
                var dfd = new $.Deferred(), loadingDone = _.bind(function() {
                    if (this.loadingTimer) {
                        Nrm.hideLoadingIndicator(this.loadingTimer);
                        this.loadingTimer = null;
                    }
                }, this), whenReady = _.bind(function() {
                     
                    console.log('LayoutView - entering render callback');   
                    
                    // set default logo URL
                    if (!Nrm.app.get('logoUrl')) {
                        Nrm.app.set('logoUrl', require.toUrl('nrmcore/img/NRM-logo-square-transp50.png'));
                    }
                    //var template = Handlebars.templates['NRMnavbar'];
                    $(this.container).prepend(navbarTemplate(Nrm.app.attributes));
                    this.setHelpContext("");

                    function beforeUnload(e) {
                        if (Nrm.userPreferences) {
                            //console.log('saving preferences');
                            Nrm.userPreferences.setAll(Nrm.app.attributes.restoreSettings);
                            Nrm.userPreferences.save();
                        }
                        function isDirty(view) {
                            return view && _.isFunction(view.isDirty) && view.isDirty();
                        }
                        var prompt = isDirty(this.currentView);
                        if (!prompt && this.workflowViews) {
                            prompt = _.some(this.workflowViews, isDirty);
                        }
                        console.log("Before unload", prompt);
                        if (prompt) {
                            return "There are unsaved changes that will be lost if you proceed.";
                        }
                    }
                    $(window).on("beforeunload", _.bind(beforeUnload, this));

                    // nrmContextMenu adds preferred tab/esc key behavior and submenu support to any dropdown
                    $(".dropdown-toggle").nrmContextMenu();
                                        
                    this.startListening();
                    Nrm.event.once("app:init", function() {
                        if (!this.notify && this.notifyHtml) {
                            this.showErrors(this.notifyHtml, {notify: true, allowRecall: false});
                        }
                    }, this);
                    
                    var layoutDfd = this.renderLayout();
                    this.setElement($(this.container));
                    
                    /**
                     * The instance of the application router which is set during the asynchronous rendering of the
                     * {@link module:nrm-ui/views/layoutView#render|LayoutView} .
                     * @name module:nrm-ui/main.router
                     * @type {module:nrm-ui/appRouter}
                     */
                    Nrm.router = Nrm.Router = new AppRouter($.when(Nrm.app.getContext(), layoutDfd));
                    var urlRoot = Nrm.app.get("urlRoot"), 
                            settingsToRestore,
                            pushState, 
                            backboneAjax = Backbone.ajax, 
                            href = window.location.href, 
                            match;
                    if (urlRoot) {
                        $(document).on('click', 'a[href^="#"]:not(.nrm-route-action)', _.bind(function(e) {
                            this.navigateRoute(e, false);
                        }, this));
                        pushState = Nrm.app.get("pushState");
                        if (pushState) {
                            urlRoot = urlRoot + "ui/";
                            Backbone.ajax = function() {
                                if (arguments.length > 0 && arguments[0].url)
                                    arguments[0].url = Nrm.app.resolveUrl(arguments[0].url);
                                return backboneAjax.apply(Backbone, arguments);
                            };
                        }
                        match = href.match(/#(.*)$/);
                        if (match) {
                            match = (match[1] || '').replace(/^[#\/]|\s+$/g);
                        }
                        Backbone.history.start({pushState: pushState, root: urlRoot});
                        if (pushState && match) {
                            Nrm.app.navigateUrl(match, {trigger: true, replace: true});
                        }
                    } else {
                        Backbone.history.start();
                    }
                    //console.log("history started");
                    Backbone.ajax = Nrm.ResourceCache.wrapAjax(Backbone.ajax);
                    
                    $.when(layoutDfd).done(function() {
                        //if (location.hash === "" && Nrm.app.attributes.restoreSettings) {
                        if (Nrm.app.attributes.restoreSettings) {
                            //console.log("restoring settings", Nrm.app.attributes.restoreSettings);
                            /**
                             * User preferences stored in the browser's LocalStorage, only defined if the 
                             * restoreSettings option is set in the main application configuration.
                             * @name module:nrm-ui/main.userPreferences
                             * @type {?module:nrm-ui/models/settings}
                             */
                            Nrm.userPreferences = new Settings();
                            settingsToRestore = Nrm.app.attributes.restoreSettings;
                            if (location.hash !== "")
                                settingsToRestore = _.omit(settingsToRestore, "path");
                            Nrm.userPreferences.restore(settingsToRestore);
                        }
                    }).always(loadingDone);
                    dfd.resolveWith(this);
                }, this);
                $.when(this.ready).done(_.bind(function() {
                    console.log('LayoutView - retrieving user info');
                    $.when(this.getUserInfo()).done(_.bind(function(userInfo) { 
                        userInfo = userInfo || this.userInfo;
                        console.log('LayoutView - user info loaded');   
                        if (userInfo) {
                            userInfo = $.extend({}, (userInfo.attributes || userInfo));
                            Nrm.app.set("userInfo", userInfo);
                            var roles = Nrm.app.getModelVal(userInfo, "roles");
                            var userInfoError = Nrm.app.getModelVal(userInfo, "error");
                            var authorized = !(userInfoError || (roles && roles.length === 0) ||
                                    Nrm.app.getModelVal(userInfo, "authorized") === false);
                            var grpName = Nrm.app.get("appGroupName");
                            if (grpName)
                                userInfo.appGroupName = grpName;
                            if (!userInfo.userName)
                                userInfo.userName = "User";
                            Nrm.app.set("authorized", authorized);
                        }
                        if (Nrm.app.get("mobileApp")) {
                            Nrm.app.set("online", navigator.onLine);
                            require(['../applicationCache'], _.bind(function(ApplicationCache) {
                                /**
                                 * The ApplicationCache instance, only defined if the mobileApp flag is set in the main
                                 * application configuration.
                                 * @name module:nrm-ui/views/layoutView#appCache
                                 * @type {?module:nrm-ui/applicationCache}
                                 */
                                this.appCache = new ApplicationCache();
                                $.when(this.appCache.init()).always(whenReady);
                            }, this));
                        } else {
                            whenReady();
                        }
                    }, this)).fail(loadingDone);
                }, this)).fail(loadingDone);
                return dfd;
            }
            return this;
        },
        /**
         * Adds the {@link https://code.google.com/archive/p/jquery-ui-for-ipad-and-iphone/|JQuery UI Touch plugin}
         * to a dependency array to conditionally load the module only if the browser supports the Touch API.
         * @todo Feature detection for Touch API is unreliable.  Instead we should load this plugin as a declared
         * dependency for this module, and then this function would become deprecated.
         * @param {string[]} deps Dependency array
         * @returns {string[]}
         * Input dependency array with the JQuery UI Touch plugin dependency added.
         */
        addTouchDependency: function(deps) {
            if (Modernizr.touch)
                deps.push('use!jquery-ui-touch');
            return deps;
        },
        /**
         * Render the layout and start listening to global events.
         * @returns {external:module:jquery~Promise|undefined}
         * Returns a promise that resolves when the layout is initialized, or undefined if the application has disabled
         * the layout plugin by setting singlePanel option on the main application configuration.
         */
        renderLayout: function() {
            var userInfo,
                    url,
                    deps,
                    preloadDfd,
                    layoutDfd,
                    contextDfd,
                    authorized = Nrm.app.get("authorized") !== false;
            
            if (!authorized) {
                // don't render the full application
                console.log("User is not authorized.");
                userInfo = Nrm.app.get("userInfo");
                url = userInfo && userInfo.amtUrl;
                if (!url && userInfo) {
                    url = '/nrm/amt/#request';
                    if (userInfo.domain)
                        url = userInfo.domain + url;
                    if (userInfo.realm) {
                        url += '/' + userInfo.realm;
                        if (userInfo.appGroupName)
                            url += '/' + userInfo.appGroupName;
                    }
                    userInfo.amtUrl = url;
                }
                //var template = Handlebars.templates['unauthorized'];
                $(this.container).append(unauthorizedTemplate(Nrm.app.attributes));
            } else {
                preloadDfd = this.preloadLovs();
                if (!Nrm.app.get("singlePanel")) {
                    this.layoutConfig = $.extend({
                        mapPane: Nrm.app.get("enableMap") || false,
                        southPane: Nrm.app.get("southPane") || false,
                        eastPane: Nrm.app.get("eastPane") || false,
                        westPane: Nrm.app.get("westPane") || true,
                        "west__onresize": _.throttle(function() {
                            /**
                             * West panel resize event.
                             * @event module:nrm-ui/event#layout:westResize
                             */
                            Nrm.event.trigger("layout:westResize");
                        }, 500)
                    }, this.layoutConfig);

                    this.layoutLoading = $.Deferred();
                    deps = this.addTouchDependency(['hbs!layout', '../plugins/nrmLayout']);
                    layoutDfd = Application.requireDeferred(deps, function(template) {

                        console.log('LayoutView - rendering layout panels'); 

                        //this.enableReset = true;
                        //var template = Handlebars.templates['layout'];
                        /**
                         * The JQuery element that has the {@link module:nrm-ui/plugins/nrmLayout|NrmLayout plugin}.
                         * Only defined if the application does not have the singlePanel option set in the main
                         * application configuration.
                         * @name module:nrm-ui/views/layoutView#layout
                         * @type {?module:nrm-ui/plugins/nrmLayout}
                         */
                        this.layout = $('<div>').html(template).nrmLayout(this.layoutConfig);
                        //this.displayHomePage();
                        if (this.layoutConfig.mapPane) {
    //                        Nrm.event.trigger('busyChanged', 'map', true, {
    //                           statusText: 'Map is loading',
    //                           opacity: 0
    //                        });
                            require(['nrm-map/views/mapView'], _.bind(function(MapView) {
                                console.log('LayoutView - initializing map view'); 
                                /**
                                 * The map view, only defined in a spatial application.
                                 * @name module:nrm-ui/models/application#mapView
                                 * @type {?module:nrm-map/views/mapView}
                                 */
                                this.map = Nrm.app.mapView = new MapView($.extend({
                                    accordionId: this.accordionId
                                }, this.mapConfig));
                                this.layoutLoading.resolve();
                                this.mapEl = "#" + this.map.$el.attr('id');
                                //Nrm.event.trigger('busyChanged', 'map', false);
                                /**
                                 * Render content in the map pane
                                 * @event module:nrm-ui/event#renderMapPane
                                 * @param {string|external:module:jquery} html The content to render
                                 * @param {module:nrm-ui/plugins/nrmLayout~RenderPaneOptions} [options]
                                 */
                                Nrm.event.trigger("renderMapPane", this.map.$el);
                                this.map.trigger("renderComplete", this, this.map);
                            }, this));
                        } else {
                            this.layoutLoading.resolve();
                        }
                    }, this, require);

                    if (this.layoutConfig.westPane) {
                        contextDfd = new $.Deferred();
                        var self = this;
                        deps = this.addTouchDependency(['./contextView']);
                        require(deps, function(ContextView) {
                            //console.log('LayoutView - ContextView loaded'); 
                            $.when(layoutDfd).done(function() {
                                console.log('LayoutView - rendering navigation panel'); 
                                /**
                                 * The view that renders the accordion groups in the west panel.
                                 * @name module:nrm-ui/views/layoutView#contextView
                                 * @type {?module:nrm-ui/views/contextView}
                                 */
                                var cv = self.contextView = new ContextView({
                                    accordionId: self.accordionId,
                                    loading: $.when(self.layoutLoading, preloadDfd)
                                });
                                var render = self.contextView.renderDeferred || self.contextView.render;
                                $.when(render.call(self.contextView)).done(function() {
                                    console.log('LayoutView - ContextView rendered'); 
                                    /**
                                     * Render content in the west pane
                                     * @event module:nrm-ui/event#renderWestPane
                                     * @param {string|external:module:jquery} html The content to render
                                     * @param {module:nrm-ui/plugins/nrmLayout~RenderPaneOptions} [options]
                                     */
                                    Nrm.event.trigger("renderWestPane", cv.$el, {append: true});
                                    self.listenTo(cv, {
                                        "beforeRefresh": function(data) {
                                            var callback = _.bind(function(evtData) {
                                                if (!evtData.cancel)
                                                    this.clearSearch();
                                                if (data.callback) {
                                                    data.callback.call(evtData.source || this, evtData);
                                                }
                                            }, this);
                                            this.displayHomePage($.extend({}, data, {replace: true, callback: callback, navigate: false}));
                                        },
                                        "afterRefresh": function(data) {
                                            this.renderMapTOC();
                                            if (data && data.restorePath && Backbone.history) {
                                                Nrm.app.loadUrl(Backbone.history.getFragment());
                                            }
                                        }
                                    });
                                    cv.trigger("renderComplete", self, cv);
                                    self.renderMapTOC();
                                    contextDfd.resolveWith(self);
                                });
                            });
                        });
                    }
                }
            }
            return $.when(contextDfd, this.layoutLoading, preloadDfd);
        },
        preloadLovs: function() {
            var dfdQueue, preload = Nrm.app.get("preload");
            if (_.isArray(preload)) {
                dfdQueue = _.each(preload, function(lov) {
                    var dfd = $.Deferred();
                    function whenDone() {
                        console.log("Collection preloaded for " + lov);
                        dfd.resolveWith(this, arguments);
                    };
                    $.when(Nrm.app.getContext({ apiKey: lov }, this)).done(function(ctx) {
                        ctx.loadType = "auto";
                        $.when(Nrm.app.getCollection(ctx, { 
                            ajax: {global: false}
                        }, this)).always(whenDone);
                    }).fail(whenDone);
                    return dfd;
                }, this);
                return $.when.apply($, dfdQueue);
            } else {
                return false;
            }
        },
        /**
         * Render the map TOC panel content.
         * @returns {undefined}
         */
        renderMapTOC: function() {
            if (this.map && this.map.mapControl)
                this.map.renderTOC(true);
            else if (!this.mapLoadHandler) {
                this.mapLoadHandler = function() {
                    this.map.renderTOC(true);
                };
                this.listenToOnce(Nrm.event, "map:onLoad", this.mapLoadHandler);
            }
        },
        /**
         * Start listening to global events
         * @returns {undefined}
         */
        startListening: function() {
            this.listenTo(Nrm.event, {
                "context:search": function(e) {
                    e.focusSearch = true;
                    e.callback = function(data) {
                        Nrm.event.trigger("context:activeRow", data);
                    };
                    this.renderSearch(e);
                },
                "context:advSearch": this.advancedSearch,
                "context:beginSearch": this.beginSearch,
                "context:results": this.viewResults,
                "context:beginCreate": this.create,
                "context:beginEdit": this.edit,
                "app:defaultRoute": this.displayHomePage,
                "context:cancelEdit": this.onCancelEdit,
                "context:delete": this.onCancelEdit,
                "app:routeError": this.displayErrorPage,
                "context:selectNode": this.onSelectNode,
                "showErrors": this.showErrors,
                "removeErrors": this.removeErrors,
                "app:modal": this.showModal,
                "app:about": this.showAbout,
                "app:userInfo": this.showUserInfo,
                "app:settings": this.showSettings,
                "app:contextHelp": this.showContextHelp,
                "app:home": function(data) {
                    data = $.extend({}, data, {replace: true, navigate: true});
                    this.displayHomePage(data);
                },
                "app:mainContent": this.skipToMainContent,
                "app:logout": this.logout,
                "app:workflow": this.showWorkflowView,
                "app:featureList": this.showFeatureList
                        , "app:saveSettings": this.saveSettings
                        , "app:restoreSettings": this.restoreSettings
                        , "app:getSettings": this.getSettings
                        , "app:setHelpContext": this.setHelpContext
            });
        },
        /**
         * Save user preferences to LocalStorage so that they can be manually restored later.
         * @param {Object} opts
         * @param {string} [opts.id="manual"] Key in the LocalStorage object store.
         * @returns {undefined}
         */
        saveSettings: function(opts) {
            console.log('saveSettings', opts);
            try {
                var prefs;
                if (opts && opts.id) {
                    prefs = new Settings({id: opts.id});
                    //opts.delete(id);
                    //} else if (Nrm.userPreferences) {
                    //    prefs = Nrm.userPreferences;
                } else {
                    prefs = new Settings({id: "manual"});
                }
                prefs.setAll(opts);
                prefs.save();
                Nrm.event.trigger("app:modal", ({
                    "text": "Application settings including the current page and map configuration (if applicable) have been saved.  Use Restore Settings at any time to apply the settings.",
                    "caption": "Save Settings"
                }));
            } catch (e) {
                MessageBox('Error saving settings', e);
            }
        },
        /**
         * Restore user preferences from LocalStorage.
         * @param {Object} opts
         * @param {string} [opts.id="manual"] Key in the LocalStorage object store.
         * @returns {undefined}
         */
        restoreSettings: function(opts) {
            console.log('restoreSettings', opts);
            var prefs;
            if (opts && opts.id) {
                prefs = new Settings({id: opts.id});
                //opts.delete(id);
                //} else if (Nrm.userPreferences) {
                //    prefs = Nrm.userPreferences;
            } else {
                prefs = new Settings({id: "manual"});
            }
            prefs.restore(opts);
        },
        /**
         * Retrieve user preferences 
         * @param {Object} opts Hash of settings to retrieve, plus the properties listed below:
         * @param {string} [opts.id] Key in the LocalStorage object store, or use the automatically restored settings
         * if available if this option is not set.
         * @param {string} [opts.key="manual"] Key in the LocalStorage object store, only used if the application does
         * not have restoreSettings option set in the main application configuration.
         * @param {Function} [opts.callback] Callback function that will be passed the return value.
         * @returns {Object}
         * Settings hash with the requested values 
         */
        getSettings: function(opts) {
            var prefs, retVal = {}; //, theId = opts && opts.id ? opts.id : opts.key || "manual";
            //prefs = new Nrm.Models.Settings({id: theId});
            console.log('layoutView.getSettings', opts);
            if (opts && opts.id) {
                prefs = new Settings({id: opts.id});
            } else if (Nrm.userPreferences) {
                prefs = Nrm.userPreferences;
            } else {
                prefs = new Settings({id: opts.key || "manual"});
            }
            for (var setting in _.omit(opts, ['key', 'id', 'callback'])) {
                if (opts.hasOwnProperty(setting))
                    retVal[setting] = prefs.get(setting);
            }
            console.log('getSettings returning', retVal);
            if (opts.callback) {
                opts.callback(retVal);
            }
            return retVal;
        },
        /**
         * Handle the global "app:featureList" event to show the 
         * {@link module:nrm-map/views/featureListView|FeatureListView}
         * @param {external:module:esri/layers/FeatureLayer} layer The feature layer
         * @returns {undefined}
         */
        showFeatureList: function(layer) {
            //console.log("in layoutView.showFeatureList()");
            require(['nrm-map/views/featureListView'], _.bind(function(FeatureListView) {
                var flOptions = layer.objectIdField ? {featureLayer: layer} : layer;
                var listView = new FeatureListView(flOptions);
                
                /**
                 * Load a view "on top" of previous view without changing context or unloading previous view.
                 * @event module:nrm-ui/event#app:workflow
                 * @param {Object} options
                 * @param {external:module:backbone.View} options.view The view to load on top of previous view
                 * @returns {undefined}
                 */
                 Nrm.event.trigger('app:workflow', { view: listView });
                 
            }, this));
        },
        /**
         * Load a view "on top" of previous view without changing context or unloading previous view.
         * @param {Object} options
         * @param {external:module:backbone.View} options.view The view to load on top of previous view
         * @returns {undefined}
         */
        showWorkflowView: function(options) {
            // assumptions: 
            // workflowView is the next view being rendered, 
            // previousView is this.currentView or the previously displayed workflowView
            // Workflow views are removed from the stack in two listeners to cover:
            //  - workflowView.remove listener for view remove events (which must be triggered by the workflow view)
            //  - previousView.remove listener for navigation away from a workflow view
            
            /**
             * Array of currently rendered views except for this.currentView.
             * @name module:nrm-ui/views/layoutView#workflowViews
             * @type {external:module:backbone.View[]}
             */
            if (this.workflowViews === undefined) {
                this.workflowViews = [];
            }
            var workflowView = options.view,
                previousView = _.last(this.workflowViews) || this.currentView,
                renderMethod = workflowView.renderDeferred || workflowView.render;
            $.when(renderMethod.call(workflowView)).done(_.bind(function() {
                var removingHandler;
                if (previousView) {
                    this.listenToOnce(previousView, 'remove', function() {
                        this.stopListening(workflowView);
                        // note: since "close" method is not a Backbone.View method, we can't assume it is defined on the workflowView.
                        var removeMethod = (_.isFunction(workflowView.close) && workflowView.close) || workflowView.remove;
                        removeMethod.call(workflowView);
                        this.workflowViews = _.without(this.workflowViews, workflowView);
                    });
                    removingHandler = function(options) {
                        options.handled = true;
                        this.checkRemove(workflowView, function(result) {
                            if (result !== false) {
                                workflowView.remove();
                            }
                            options.callback.call(options.source || this, result);
                        }, this);
                    };
                    this.listenTo(previousView, 'removing', removingHandler);
                    previousView.$el.hide();
                }
                // assumes that the workflowView will remove itself when it is finished or cancelled.
                this.listenToOnce(workflowView, "remove", _.bind(function() {
                    if (previousView) {
                      this.stopListening(previousView, 'removing', removingHandler);
                      previousView.$el.show();
                      // previousView.delegateEvents(); //maybe?  Nope 
                    } else {
                      // umm... we need to show something in the main data panel???
                      Nrm.event.trigger('app:home');
                    }
                    this.workflowViews = _.without(this.workflowViews, workflowView);
                }, this));
               Nrm.event.trigger('renderDataPane', workflowView.$el, {append: !!previousView});
                // I'm not sure if the "parent view" (first arg passed to renderComplete listeners) 
                // should be previousView or the layoutView (this)
                workflowView.trigger('renderComplete', previousView, workflowView);
                this.workflowViews.push(workflowView);
            }, this)).fail(function(model, xhr, options) {
                // if the view handled the error, the message should be available as the contents of the view element
                var html = workflowView.$el.html();
                if (!html) {
                    // even if the view did not handle the error, we need to show something
                    html = errorTemplate({"error": Nrm.app.normalizeErrorInfo(null, model, xhr, options)});
                }
                Nrm.event.trigger("showErrors", html, {
                    allowRecall: false, 
                    notify: true, 
                    focusEl: "#main-content"
                });
            });
        },
        /**
         * Remove the current view from the main data panel.
         * @param {Boolean} force Sometimes removing the view will trigger an event that displays a different
         * view, this parameter indicates whether we should try to remove the second view.
         * @returns {Boolean|undefined}
         * Indicates whether the view was successfully removed, returns undefined if there is no current view.
         */
        removeCurrentView: function(force) {
            if (!this.currentView)
                return;
            var xv = this.currentView;
            this.suspendNodeSelection = !!force;
            xv.remove();
            this.suspendNodeSelection = false;
            this.stopListening(xv);
            // removing the view can trigger node selection, which resets the currentView
            var reset = xv === this.currentView;
            if (reset)
                this.currentView = null;
            else if (force)
                return this.removeCurrentView(false);
            return reset;
        },
        /**
         * Checks whether a view may be removed
         * @param {external:module:backbone.View} view The view to be removed
         * @param {function} callback A callback function that will be passed the result of the test, which may be a
         * boolean false value indicating removal should be cancelled, or any other value (including undefined)
         * indicating removal may proceed.
         * @param {*} caller Any object reference that will be used as the context of "this" for the callback.
         * @returns {undefined}
         */
        checkRemove: function(view, callback, caller) {
            callback = _.bind(callback, caller || this);
            var removingOptions = {
                callback: function(result) {
                    console.log("removingOptions callback", this, result);
                    if (result === false) {
                        callback(false);
                    } else if (_.isFunction(view.allowRemove)) {
                        $.when(view.allowRemove()).done(callback).fail(function() {
                            callback(false);
                        });
                    } else {
                        callback(true);
                    }
                },
                source: this
            };
            view.trigger("removing", removingOptions, this.currentView);
            if (!removingOptions.handled) {
                // no event handlers
                removingOptions.callback.call(this, true);
            }         
        },
        /**
         * Render a view in the main data panel.
         * @param {module:nrm-ui/views/layoutView~NestedContextWithCallback} data May include additional properties:
         * @param {string} [data.successRoute] Route to navigate if the view is rendered successfully.
         * @param {Boolean} [data.navigate=true] Navigate the successRoute.
         * @param {Boolean} [data.deleting=false] Indicates that the view is rendering after deleting a record.
         * @param {Function} callback Callback that will execute only if the view was successfully rendered, called
         * with this LayoutView instance as the "this" reference, with two parameters, the original event data and the 
         * view instance that was rendered.
         * @param {Object} viewOptions Options to determine the type of view, might also include options that will be
         * passed to {@link module:nrm-ui/models/application#getViewConstructor|Nrm.app.getViewConstructor} if neither
         * of the following properties are provided:
         * @param {external:module:backbone.View} [viewOptions.view] A view instance to render
         * @param {Function} [viewOptions.viewType] A view constructor that will be used to create the view
         * @param {Boolean} editMode=false Indicates the {@link module:nrm-ui/models/application#editMode|edit mode} to
         * set.
         * @todo The returned promise will never be resolved in some scenarios, ideally it should be rejected if the
         * view was not rendered.  Also, the data.callback option is inconsistent, sometimes cancel option is not set 
         * if the view rendering was cancelled, and other times it will be called before the asynchronous rendering has
         * actually occurred, but any changes to this behavior will have to be evaluated with extreme caution.
         * @returns {external:module:jquery~Promise}
         * Promise that is resolved after the view is rendered.  
         */
        showView: function(data, callback, viewOptions, editMode) {
            var evtData = data || {},
                    self = this,
                    dfd = $.Deferred(),
                    loading,
                    async = true;
            
            function afterRender(evtData, view) {
                console.log("LayoutView.showView.afterRender", arguments);
                // callback and source are not relevant to the 'map:activateSearch' event and could cause 
                // memory leaks if referenced outside the scope of the event handler
                Nrm.event.trigger("map:configureSelect", _.omit(evtData, "callback", "source"));
                var ret = ((typeof callback === "function") && callback.call(self, evtData, view)) || view;
                $.when(ret).done(dfd.resolve).fail(dfd.reject);
            }
            function renderAborted() {
                dfd.reject();
            }
            function doCallback(render) {
                if (evtData.cancel) {
                    if (self.currentView && self.currentView.setFocus) {
                        self.currentView.setFocus();
                    }
                }  else {
                    if (evtData.successRoute && Nrm.router && evtData.navigate !== false) {
                        var route = evtData.path ? (evtData.successRoute + "/" + evtData.path) : evtData.successRoute;
                        Nrm.app.navigateUrl(route, {trigger: false, replace: !!evtData.deleting});
                    }
                    if (render) {
                        /**
                         * Current edit mode, which affects the behavior of tree node selection to display the edit 
                         * view associated with the node if true, or highlight the row in the results grid if false.
                         * @name module:nrm-ui/models/application#editMode
                         * @type {Boolean}
                         */
                        Nrm.app.editMode = !!editMode;
                        if (viewOptions) {
                            function createAndRenderView(viewType) {
                                if (self.currentView) {
                                    renderAborted();
                                    return;
                                }
                                if (self.map) {
                                    self.map.disableEditing();
                                }
                                // TODO: this mechanism for view caching is untested, but it might be more efficient
                                var enableCache = viewOptions.objName && viewType.enableCaching;
                                var cached = self.viewCache && self.viewCache[viewOptions.objName];
                                var data = _.omit(evtData, "callback", "source");
                                var view = cached || new viewType(data);
                                if (!cached && enableCache) {
                                    self.viewCache = self.viewCache || {};
                                    self.viewCache[viewOptions.objName] = view;
                                } else if (cached && view.applyContext) {
                                    view.applyContext(data);
                                }
                                renderView(view);
                            }
                            function renderView(cv) {
                                /**
                                 * The current view in the main data panel.
                                 * @name module:nrm-ui/views/layoutView#currentView
                                 * @type {external:module:backbone.View}
                                 */
                                self.currentView = cv;
                                var render = cv.renderDeferred || cv.render;
                                $.when(render.call(cv)).always(function() {
                                    if (self.currentView === cv) {
                                        /**
                                         * Render content in the main data pane
                                         * @event module:nrm-ui/event#renderDataPane
                                         * @param {string|external:module:jquery} html The content to render
                                         * @param {module:nrm-ui/plugins/nrmLayout~RenderPaneOptions} [options]
                                         */
                                        Nrm.event.trigger('renderDataPane', cv.$el);
                                        self.listenTo(cv, {
                                            'busyChanged': function(busy, options) {
                                                self.currentViewBusy = !!busy;
                                                Nrm.event.trigger('busyChanged', 'data', busy, options);
                                            },
                                            'remove': function() {
                                                if (cv === this.currentView) {
                                                    if (self.currentViewBusy) {
                                                        self.currentViewBusy = false;
                                                        Nrm.event.trigger('busyChanged', 'data', false);
                                                    }
                                                    this.removeErrors();
                                                    if (cv.model && data.model && (cv.model.id === data.model.id || cv.model.originalCid === data.model.cid))
                                                        data.model = cv.model;
                                                    if (this.map && data.model) {
                                                        var opt = {clearFeatures: true, id: data.model.id || data.model.cid};
                                                        this.map.disableEditing(opt);
                                                    }
                                                    data.suspendNodeSelection = !!this.suspendNodeSelection;
                                                    /**
                                                     * Triggered when a view is removed from the main data pane.
                                                     * @event module:nrm-ui/event#layout:clearForm
                                                     * @param {module:nrm-ui/models/application~NestedContextResult} data
                                                     * May also include the following options:
                                                     * @param {Boolean} data.suspendNodeSelection Suspend node selection.
                                                     */
                                                    Nrm.event.trigger('layout:clearForm', data);
                                                }
                                            }
                                        });
                                        cv.trigger('renderComplete', self, cv);
                                        afterRender(evtData, cv);
                                    } else {
                                        cv.remove();
                                        renderAborted();
                                    }
                                });
                            }
                            if (viewOptions.view) {
                                /* The view option allows for rendering an already instantiated view.
                                 * Example use case is the Back button in a multi-step workflow.
                                 */
                                renderView(viewOptions.view);
                            } else if (viewOptions.viewType) {
                                /* The viewType option allows customized LayoutView subclasses to pass an explicit view constructor
                                 * instead of passing a suffix and context suitable for Nrm.app.getViewConstructor.
                                 */
                                createAndRenderView(viewOptions.viewType);
                            } else {
                                // use generic discovery to find the view constructor...
                                $.when(Nrm.app.getViewConstructor(viewOptions)).done(createAndRenderView)
                                        .fail(renderAborted);
                            }
                        } else {
                            // todo: this doesn't seem quite right...
                            if (self.currentView) {
                                renderAborted();
                                return;
                            }
                            afterRender(evtData);
                        }
                        if (async) {
                            loading = Nrm.showLoadingIndicator({
                                message: 'Rendering main content'
                            });
                        }
                    } else {
                        dfd.resolve();
                    }
                } //else if (Nrm.Router) {
                //    Nrm.Router.navigate("", { trigger: false, replace: true });
                //}

                if (evtData.callback) { // TODO: should this be delayed deferred rendering is completed?
                    evtData.callback.call(evtData.source || self, evtData);
                }
                return dfd.promise();
            }
            
            dfd.always(function() {
                async = false;
                if (loading) {
                    Nrm.hideLoadingIndicator(loading);
                }
            });
            if (evtData.context && this.currentView && this.currentView.applyContext &&
                    this.currentView.applyContext(evtData)) {
                return doCallback(false);
            }
            if (this.currentView) {
                this.checkRemove(this.currentView, function(result) {
                    if (result === false) {
                        evtData.cancel = true;
                        doCallback(false);
                    } else {
                        var test = this.removeCurrentView(!!data.replace);
                        doCallback(test);
                    }
                }, this);
                return dfd.promise();
            } else {
                // no current view, just proceed
                return doCallback(true);
            }
        },
        /**
         * Display the home page by rendering the "home" template in the main data panel, with the 
         * {@link module:nrm-ui/models/application~AppConfig|main application configuration} providing the context for
         * the template.
         * @param {Object} [data]
         * @param {Boolean} [data.replace=false] Do not replace the current view if there is one.
         * @param {Boolean} [data.navigate=false] Indicates whether the "home" route should be navigated if the 
         * rendering is successful.
         * @param {string} [data.path] Optional navigation path that will be provided in the unusual case where a tree
         * node is not associated with a more specific view, e.g. root node that does not provide a grid view.
         * @returns {undefined|external:module:jquery~Promise}
         * Returns undefined if rendering was not attempted, or the return value of 
         * {@link module:nrm-ui/views/layoutView#showView|showView function} if rendering was attempted.
         */
        displayHomePage: function(data) {
            if (this.currentView && (!data || !data.replace)) {
                return;
            }
            if (data && data.replace && data.navigate)
                data.successRoute = "home";
            return this.showView(data, function(evtData) {
                //var template = Handlebars.templates["home"];
                //if (template)
                Nrm.event.trigger("renderDataPane", homeTemplate(Nrm.app.attributes));
                if (Nrm.app.attributes.helpContext) {
                    this.setHelpContext(Nrm.app.attributes.helpContext);
                }
                if (Backbone.history.getFragment() === "main-content")
                    this.skipToMainContent();
                Nrm.app.editMode = false;
                if (evtData.path) {
                    // TODO: this probably needs to use Nrm.app.triggerEvent to fill the expected navigation options.
                    Nrm.event.trigger("context:activeRow", {path: evtData.path});
                } else if (data && data.replace) {
                    /**
                     * Triggered to clear the selection in the navigation tree.
                     * @event module:nrm-ui/event#context:clearSelection
                     */
                    Nrm.event.trigger("context:clearSelection");
                }
            });
        },
        /**
         * Display an error message.
         * @param {Object} data Event data
         * @param {module:nrm-ui/resourceCache~ErrorInfo} data.error
         * @returns {undefined}
         */
        displayErrorPage: function(data) {
            //        if (this.currentView && (!data || !data.replace)) {
            //            if (data && data.error) {
            //                Nrm.event.trigger("app:modal", { error: data.error });
            //            }
            //        } else {
            //            var template = Handlebars.templates["error"];
            //            $.when(this.displayHomePage(data)).done(function() { 
            //                Nrm.event.trigger("renderDataPane", template(data), { prepend: true });
            //            });
            //        }
            //var template = Handlebars.templates["error"];
            this.showErrors(errorTemplate(data), {notify: true, allowRecall: false});
        },
        /**
         * Handles the global event "context:cancelEdit" by triggering the "results" route for the parent path of the
         * view that was cancelled.
         * @param {Object} data Event data
         * @param {external:module:backbone.View} data.view The view associated with the event
         * @returns {undefined}
         */
        onCancelEdit: function(data) {
            if (this.currentView && this.currentView === data.view) {
                var path = (this.currentView.getPath && this.currentView.getPath());
                this.currentView = null;
                path = path ? "results/" + path.substring(0, path.lastIndexOf("/")) : "";
                Nrm.app.navigateUrl(path, {trigger: true, replace: false});
            }
        },
        /**
         * Show the advanced search view for the provided context
         * @param {module:nrm-ui/views/layoutView~NestedContextWithCallback} options Event data
         * @returns {external:module:jquery~Promise|undefined}
         * May return undefined if the options parameter does not provide enough information to do anything.
         * @see {@link module:nrm-ui/views/layoutView#showView|showView function} for more details on the return value.
         */
        advancedSearch: function(options) {
            if (options.context) { // && searchResult.context.lastResults) {
                options.successRoute = "advSearch";
                options.handled = true;
                return this.showView(options, function(evtData, view) {
                    // if we need to do something after rendering... this might go away
                }, {
                    context: options.context,
                    suffix: "AdvSearchView",
                    generic: function() {
                        return Application.requireDeferred(['./advancedSearchView'], function(AdvancedSearchView) {
                            return AdvancedSearchView; // Nrm.app.getExtendedView("AdvancedSearchView");
                        }, this, require);
                    }
                }, false);
            }
        },
        /**
         * Show the results grid view for the provided context
         * @param {module:nrm-ui/views/layoutView~NestedContextWithCallback} searchResult Event data
         * @returns {external:module:jquery~Promise|undefined}
         * May return undefined if the searchResult parameter does not provide enough information to do anything.
         * @see {@link module:nrm-ui/views/layoutView#showView|showView function} for more details on the return value.
         */
        viewResults: function(searchResult) {
            if (searchResult.context) { // && searchResult.context.lastResults) {
                searchResult.successRoute = "results";
                searchResult.handled = true;
                return this.showView(searchResult, function(evtData, view) {
                    if (searchResult.focusSearch && this.searchView && this.searchView.setFocus) {
                        this.searchView.setFocus();
                    }
                }, {
                    context: searchResult.context,
                    suffix: "ResultsView",
                    generic: function() {
                        return Application.requireDeferred(['./resultsView'], function(SearchResultsView) {
                            return SearchResultsView; //Nrm.app.getExtendedView("SearchResultsView");
                        }, this, require);
                    }
                }, false);
            }
        },
        /**
         * Handles the global "context:selectNode" event to render the appropriate view in the main data
         * panel, and the appropriate search view in the west panel accordion group.
         * @param {module:nrm-ui/views/layoutView~NestedContextWithCallback} evtData May include additional properties:
         * @param {Boolean} [evtData.deleting=false] Indicates that the selection changed after deleting a record.
         * @param {Boolean} [evtData.settingActiveRow=false] Indicates that the selection change while setting the 
         * active row.
         * @param {Boolean} [evtData.enableResults=false] Indicates that the results grid view is enabled.
         * @returns {undefined}
         */
        onSelectNode: function(evtData) {
            evtData.handled = true;
            var folderPath = Nrm.app.getContainerPath(evtData.context, evtData.path);
            var callback = evtData.callback;
            var source = evtData.source;
            var wrappedCallback = function(e) {
                if (callback)
                    callback.call(source || this, e);
                if (e.cancel)
                    return;
                this.renderSearch($.extend({}, evtData, {
                    path: folderPath,
                    model: folderPath !== evtData.path ? evtData.parentModel || null : evtData.model,
                    modelId: folderPath !== evtData.path ? evtData.parentId || null : evtData.modelId
                }));
            };
            evtData.callback = wrappedCallback;
            evtData.source = this;
            if (evtData.settingActiveRow) {
                if (evtData.callback) {
                    evtData.callback.call(evtData.source, evtData);
                }
                return;
            }
            if (Nrm.app.editMode && $.inArray(evtData.nodetype, ["folder", "error"]) <= -1) {
                //evtData.suppressFocus = true;
                var evtName = evtData.path.search(/\/$/) < 0 ? "context:beginEdit" : "context:beginCreate";
                Nrm.app.triggerEvent(evtName, evtData);
            } else if (evtData.enableResults) {
                if (folderPath !== evtData.path) {
                    evtData = $.extend({}, evtData, {
                        path: folderPath,
                        model: folderPath !== evtData.path ? evtData.parentModel || null : evtData.model,
                        modelId: folderPath !== evtData.path ? evtData.parentId || null : evtData.modelId
                    });
                }
                Nrm.app.triggerEvent("context:results", evtData);
            } else {
                evtData.replace = true;
                evtData.navigate = true;
                this.displayHomePage(evtData);
            }
        },
        /**
         * Clear the search view, triggering {@module:nrm-ui/event#layout:searchChanged|layout:searchChanged} event
         *  if there was a search view previously rendered.
         * @returns {undefined}
         */
        clearSearch: function() {
            if (this.searchView) {
                this.searchView.remove();
                this.searchView = null;
                /**
                 * Search view in the west pane has changed
                 * @event module:nrm-ui/event#layout:searchChanged
                 */
                Nrm.event.trigger("layout:searchChanged");
            }
        },
        /**
         * Render the search view if it is supported by the provided context.
         * @param {module:nrm-ui/views/layoutView~NestedContextWithCallback} evtData May include additional properties:
         * @param {Boolean} [evtData.focusSearch=false] Set focus to the search view.
         * @returns {external:module:jquery~Promise|external:module:backbone.View|undefined}
         * Returns a promise if a new search view was created, or the current search view if it was unchanged, or
         * undefined if the provided context does not support a search view.
         */
        renderSearch: function(evtData) {
            console.log("Render search editMode", Nrm.app.editMode, evtData);
            var model = evtData.model, modelId = evtData.modelId,
                    // searchId ensures async loading doesn't result in rendering wrong view
                    /**
                     * Unique id to identify a render event, to avoid multiple render events tripping over each other.
                     * @name module:nrm-ui/views/layoutView#searchRenderId
                     * @type {string}
                     */
                    searchId = this.searchRenderId = _.uniqueId('s');
            var enableSearch = function(ctx, path) {
                console.log("Render search enableSearch editMode", Nrm.app.editMode, evtData);
                if (!ctx)
                    return false;
                if (Nrm.app.isQuickSearchEnabled(ctx, evtData.nodetype))
                    return {context: ctx, path: path};
                model = null, modelId = null;
                if (ctx.apiKey.length < path.length)
                    path = Nrm.app.getContainerPath(ctx.parent, path.substring(0, path.length - ctx.apiKey.length - 1));
                return enableSearch(ctx.parent, path);
            };
            var testctx = enableSearch(evtData.context, evtData.path);
            if (!testctx) {
                Nrm.event.trigger("map:configureSelect", false);
                return this.clearSearch();
            }
            // callback and source are not relevant to the 'map:activateSearch' event and could cause 
            // memory leaks if referenced outside the scope of the event handler
//            Nrm.event.trigger("map:configureSelect", _.omit(evtData, "callback", "source"));
            testctx.model = model;
            testctx.modelId = modelId;
            var data = $.extend({}, _.omit(evtData, "callback", "source"), testctx);
            if (this.searchView && this.searchView.applyContext &&
                    this.searchView.applyContext(data)) {
                if (evtData.focusSearch && this.searchView.setFocus) {
                    this.searchView.setFocus();
                }
                return this.searchView;
            }
            var self = this;
            var options = {
                context: data.context,
                suffix: "SearchView",
                generic: function() {
                    return Application.requireDeferred(['./basicSearchView'], function(BasicSearchView) {
                        return BasicSearchView; // Nrm.app.getExtendedView("BasicSearchView");
                    }, this, require);
                }
            };
            return $.when(Nrm.app.getViewConstructor(options)).done(function(view) {
                //console.log("Render search after view module loaded: " + data.path);
                if (!view || searchId !== self.searchRenderId)
                    return;
                var expand = true;
                if (self.searchView) {
                    expand = self.searchView.expand;
                    self.searchView.remove();
                }
                data.expand = expand;
                data.accordionId = self.accordionId; //"nrm-app-accordion";
                var renderFn = function() {
                    if (searchId !== self.searchRenderId)
                        return;
                    /**
                     * The current search view in the west panel accordion group.
                     * @name module:nrm-ui/views/layoutView#searchView
                     * @type {?external:module:backbone.View}
                     */
                    var sv = self.searchView = new view(data);
                    var render = sv.renderDeferred || sv.render;
                    return $.when(render.call(sv)).done(function() {
                        if (self.searchView === sv) {
                            //console.log("Actually rendering search: " + data.path);
                            //Nrm.event.trigger("renderWestPane", sv.$el, { append: true });
                            $("#" + self.accordionId).prepend(sv.$el);
                            sv.trigger("renderComplete", self, sv);
                            Nrm.event.trigger("layout:searchChanged", sv);
                            if (evtData.focusSearch && sv.setFocus) {
                                sv.setFocus();
                            }
                            if (evtData.callback) {
                                evtData.callback.call(evtData.source || this, evtData);
                            }
                        }
                    });
                };
                if (data.context.parent && !data.model) {
                    // selected node doesn't support quick search, but an ancestor node does.
                    return $.when(Nrm.app.getNestedContext({path: data.path})).done(function(options) {
                        data = $.extend(data, options);
                        renderFn();
                    });
                } else {
                    renderFn();
                }

            });
        },
        /**
         * Initiate a search
         * @param {module:nrm-ui/views/layoutView~NestedContextWithCallback} evtData Event data
         * @returns {undefined}
         */
        beginSearch: function(evtData) {
            var evtData = evtData || {};
            var doCallback = function() {
                if (evtData.callback) {
                    evtData.callback.call(evtData.source || this, evtData);
                }
                //            if (!this.currentView) {
                //                Nrm.app.triggerEvent("context:results", { path: evtData.path });
                //            }
            };
            if (evtData.context && this.currentView && this.currentView.applyContext &&
                    this.currentView.applyContext(evtData)) {
                return doCallback();
            }
            if (this.currentView) {
                this.checkRemove(this.currentView, function(result) {
                    if (result === false) {
                        evtData.cancel = true;
                    } else {
                        this.removeCurrentView();
                        doCallback();
                    }
                }, this);
            } else {
                doCallback();
            }
        },
        /**
         * Show the data entry form for a new record.
         * @param {module:nrm-ui/views/layoutView~NestedContextWithCallback} editCtx May include additional properties:
         * @param {Boolean} [editCtx.suppressFocus=false] Do not set focus to the view after rendering if this 
         * parameter is true.
         * @returns {external:module:jquery.Promise}
         * @see {@link module:nrm-ui/views/layoutView#showView|showView function} for more details on the return value.
         */
        create: function(editCtx) {
            editCtx.isNew = true;
            return this.showEditView(editCtx);
        },
        /**
         * Show the data entry form for an existing record.
         * @param {module:nrm-ui/views/layoutView~NestedContextWithCallback} editCtx May include additional properties:
         * @param {Boolean} [editCtx.suppressFocus=false] Do not set focus to the view after rendering if this 
         * parameter is true.
         * @returns {external:module:jquery.Promise}
         * @see {@link module:nrm-ui/views/layoutView#showView|showView function} for more details on the return value.
         */
        edit: function(editCtx) {
            editCtx.isNew = false;
            editCtx.successRoute = "edit";
            return this.showEditView(editCtx);
        },
        /**
         * Show the data entry form.
         * @param {module:nrm-ui/views/layoutView~NestedContextWithCallback} editCtx May include additional properties:
         * @param {Boolean} editCtx.isNew Indicates whether it is a new record.
         * @param {string} [editCtx.successRoute] Route to navigate if the view is rendered successfully.
         * @param {Boolean} [editCtx.suppressFocus=false] Do not set focus to the view after rendering if this 
         * parameter is true.
         * @returns {external:module:jquery.Promise}
         * @see {@link module:nrm-ui/views/layoutView#showView|showView function} for more details on the return value.
         */
        showEditView: function(editCtx) {
            console.log("entered showEditView editMode", Nrm.app.editMode);
            editCtx.handled = true;
            return this.showView(editCtx, function(evtData) {
                /**
                 * Triggered after rendering an edit view.
                 * @event module:nrm-ui/event#layout:endEdit
                 * @param {module:nrm-ui/models/application~NestedContextResult} options
                 */
                Nrm.event.trigger("layout:endEdit", $.extend({}, this.currentView.options, {model: this.currentView.model}));
                if (!editCtx.suppressFocus && this.currentView.setFocus) {
                    this.currentView.setFocus();
                    //$("form :input:visible:enabled:first:not([readonly])", this.currentView.$el).focus();
                }
            }, {
                context: editCtx.context,
                apiKey: editCtx.apiKey,
                generic: function() {
                    var spatial = Nrm.app.isSpatialContext(editCtx.context);
                    var module = spatial ? "nrm-map/views/spatialEditView" : "./editorView";
                    return Application.requireDeferred([module], function(view) {
                        return view; //Nrm.app.getExtendedView(name);
                    }, this, require);
                }
            }, true);
        },
        /**
         * Handles the global "app:modal" event by showing the {@link module:nrm-ui/views/modalView|ModalView}.
         * @param {module:nrm-ui/views/modalView~ModalConfig} options
         * @returns {undefined}
         */
        showModal: function(options) {
            var modal;
            options = options || {};
            function addResetFocusCallback(callback) {
                var focuser = options.focusEl && $(options.focusEl), cls;
                if (!focuser || !focuser.length) {
                    if (document.activeElement)
                        focuser = $(document.activeElement);
                    else
                        focuser = $('.modal').last();
                }
                if (focuser && focuser.length) {
                    cls = _.uniqueId("nrm-reset-focus");
                    focuser.addClass(cls);
                    return function() {
                        $("." + cls).removeClass(cls).focus().closest(".modal").modal("enforceFocus");
                        if (typeof callback === "function")
                            callback.apply(this, arguments);
                    };
                } else {
                    return callback;
                }
            }
            if (options.view && _.isString(options.view))
                modal = Nrm.app.getExtendedView(options.view);
            else
                modal = ModalView; //Nrm.app.getExtendedView("ModalView");
            if (modal) {
                $.when(Nrm.app.loadTemplates(options)).done(_.bind(function() {
                    options.callback = addResetFocusCallback(options.callback);
                    modal = new modal(options);
                    modal.render();
                    this.$el.append(modal.$el);
                    $(".modal", modal.$el).focus();
                    modal.trigger("renderComplete", this, modal);
                    options.handled = true;
                }, this));
            }
        },
        showAbout: function() {
            this.constructor.showAbout();
        },
        /**
         * Show user info.
         * @deprecated We dropped the menu item that this method was going to handle.
         * @returns {undefined}
         */
        showUserInfo: function() {
            this.showNotImplemented("User Info");
        },
        /**
         * Show settings (not implemented yet).
         * @returns {undefined}
         */
        showSettings: function() {
            this.showNotImplemented("Settings");
        },
        /**
         * Show context help, if the application is not using external web help (not implemented yet).
         * @returns {undefined}
         */
        showContextHelp: function() {
            this.showNotImplemented("Context-Sensitive Help");
        },
        /**
         * Show a modal message indicating that a feature is not implemented, to be used as a placeholder for minimum
         * accessibility requirements during application development to avoid links that don't go anywhere.
         * @param {string} caption Header text to display in the modal
         * @returns {undefined}
         */
        showNotImplemented: function(caption) {
            /**
             * Trigger this event to display the {@link module:nrm-ui/views/modalView|ModalView}.
             * @param {module:nrm-ui/views/modalView~ModalConfig} options Options to pass to the ModalView.
             * @event module:nrm-ui/event#app:modal
             */
            Nrm.event.trigger("app:modal", {
                caption: caption,
                text: "Not implemented yet."
            });
        },
        /**
         * Options for {@link module:nrm-ui/event#showErrors} event.
         * @typedef {Object} ErrorNotificationOptions
         * @property {Boolean} [notify=true] Indicates whether the message should be displayed now, or if it is false, 
         * show the error badge on the nav bar that will displays the message when the user clicks it.
         * @property {Boolean} [allowRecall=true] After closing the error message, show the error badge that can be
         * clicked to show the message again.
         * @property {external:module:jquery} [focusEl] Element to focus after closing the error message, to override the 
         * default focus behavior.
         * @property {Boolean} [append=false] Append the new error message to the current error message.
         */
        /**
         * Show the PNotify error message box.
         * @param {string|module:nrm-ui/resourceCache~ErrorInfo} [errors] May be an HTML string, or an error info that
         * will be rendered with a standard template, or if it is not specified, display the previous error message if
         * there is one
         * @param {Boolean|module:nrm-ui/views/layoutView~ErrorNotificationOptions} [notify=true] An options hash, or 
         * if it is a boolean, it is equivalent to the notify property in the options hash.
         * @param {Boolean} [append=false] Append the new error message to the current error message, ignored if the 
         * second parameter is an object.
         * @returns {undefined}
         */
        showErrors: function(errors, notify, append) {
            if (!errors) {
                this.displayErrors();
                return;
            }
            var options = (typeof notify === "object") ? notify : {
                notify: notify,
                append: append
            },
                    allowRecall = options.allowRecall !== false,
                    notifyHtml,
                    fixId,
                    rep;
            function prepareOptions(defaults) {
                return $.extend(defaults, _.omit(options, 'append', 'allowRecall', 'notify'));
            }
            notify = options.notify !== false;
            errors = Nrm.app.formatErrorHtml(errors, !!this.notify);
            if (options.append && this.notifyHtml) {
                fixId = "nrm-error-details";
                // TODO: probably better to convert the html to a jQuery object
                rep = [('data-target="#' + fixId + '"'), ('id="' + fixId + '"')];
                notifyHtml = this.notifyHtml + this.createUniqueId(errors, rep, fixId);
            } else {
                notifyHtml = errors;
            }
            if (allowRecall) {
                this.notifyHtml = notifyHtml;
            }
            if (!allowRecall) {
                // don't set this.notify
                new MessageBox(notifyHtml, prepareOptions({showErrorBadge: false}));
            } else if (this.notify && this.notify.is(":visible")) {
                $('.ui-pnotify-text>div', this.notify).html(notifyHtml);
            } else if (notify) {
                //$('.navbar .badge-errors').parent().removeClass('hidden');
                this.notify = new MessageBox(notifyHtml, prepareOptions({showErrorBadge: true}));
            } else {
                this.notify = null;
                //$('.navbar .badge-errors').html('Errors').parent().removeClass('hidden');
                MessageBox.showErrorBadge();
            }
        },
        /**
         * Generate unique ids for all matching patterns
         * @param {string} text Text to replace in
         * @param {Array.<string|RegExp>} replacePatterns Patterns to replace
         * @param {string} id The original id attribute value 
         * @returns {string}
         */
        createUniqueId: function(text, replacePatterns, id) {
            if (replacePatterns && !_.isArray(replacePatterns)) {
                replacePatterns = [replacePatterns];
            }
            var uid = this.uid = (!this.uid ? 1 : ++this.uid);
            _.each(replacePatterns, function(pattern) {
                text = text.replace(pattern, pattern.replace(id, id + uid));
            });
            return text;
        },
        /**
         * Clear the errors, hiding the error badge on the nav bar and closing the error message box if it is currently
         * displayed.
         * @returns {undefined}
         */
        removeErrors: function() {
            if (this.notify || this.notifyHtml) {
                //if (this.notify)
                //    this.notify.pnotify_remove();
                //MessageBox.hideErrorBadge();
                //$('.navbar .badge-errors').html('').parent().addClass('hidden');
                this.notify = null;
                this.notifyHtml = null;
            }
            $.pnotify_remove_all(); // hack for removing strays
            MessageBox.hideErrorBadge();
        },
        /**
         * Display the current error message.
         * @param {Event} [e] Event data, if we are responding to a UI event.
         * @returns {undefined}
         */
        displayErrors: function(e) {
            if (e) {
                e.preventDefault();
            }
            if (this.notify && this.notify.is(":visible")) {
                return; //this.notify.pnotify_display();
            } else if (this.notifyHtml) {
                this.showErrors(this.notifyHtml, true);
            }
        },
        /**
         * Skip to main content element.
         * @returns {undefined}
         */
        skipToMainContent: function() {
            if (!$("#main-content", this.$el).length)
                console.log("Skip to main-content isn't working");
            $("#main-content", this.$el).focus();
        },
        getUserInfo: function(url) {
            return Nrm.app.getUserInfo(url);
        },
        /**
         * Log out of the application, first asking user to confirm.
         * @returns {undefined}
         */
        logout: function() {
            //var template = Handlebars.templates["logoutMessage"];
            function doLogout() {
                window.location.href = Nrm.app.resolveUrl(Nrm.app.get("logoutUrl") || "logout");
            }
            //if (template) {
            Nrm.event.trigger("app:modal", {
                caption: "NRM Log Out",
                buttons: ModalView.OK_CANCEL,
                content: logoutTemplate(Nrm.app.attributes),
                callback: function() {
                    if (this.clicked === 0) {
                        doLogout();
                    }
                }
            });
            //} else {
            //    doLogout();
            //}
        }
    },
    /** @lends module:nrm-ui/views/layoutView */
    {
        /**
         * Version model providing the application revision number, to be loaded in 
         * {@link nrm-ui/views/layoutView.showAbout|showAbout function}.
         * @type module:nrm-ui/models/version
         */
        version: new Version({id: "SvnRev.txt"}),
        /**
         * Version model providing the UI Core revision number, to be loaded in 
         * {@link nrm-ui/views/layoutView.showAbout|showAbout function}.  
         * @deprecated Latest Starter Project features a 
         * {@link http://teamforge.fs.usda.gov/sf/wiki/do/viewPage/projects.nrm_ui_mod/wiki/ChangeLogStarterProject#section-ChangeLogStarterProject-NewStrategyForGeneratingSVNRevisionInformationInTheAboutBox|
         * new strategy for generating revision numbers} that no longer uses the NrmCoreRev.txt file.
         * @type module:nrm-ui/models/version
         */
        nrmCoreVersion: new Version({id: "NrmCoreRev.txt"}),
        /**
         * Show the About box.
         * @returns {undefined}
         */
        showAbout: function() {
            var showAboutFn = _.bind(function(coreVersion) {
                if (!Nrm.app.get("nrmCoreVersion")) {
                    Nrm.app.set("nrmCoreVersion", $.extend({}, coreVersion, {version: Version.coreVersion}));
                }
                //var template = Handlebars.templates['about'];
                var x = aboutTemplate(Nrm.app.attributes);
                //var pnotify = new Nrm.MessageBox(x, { type: "" });
                Nrm.event.trigger("app:modal", {
                    caption: "About " + Nrm.app.get("appName"),
                    content: x
                });
            }, this), nrmcoreVersion = this.nrmCoreVersion;

            if (!Nrm.app.get("svnVersion")) {
                if (Nrm.app.get("versionUrl")) {
                    this.version.url = Nrm.app.get("versionUrl");
                }
                this.version.fetch({
                    success: function(model, response) {
                        if (model.get("version") && !Nrm.app.get("version")) {
                            Nrm.app.set("version", model.get("version"));
                        }
                        model.set("build", Nrm.app.formatValue(response.build, "datetime"));
                        model.set("revdate", Nrm.app.formatValue(response.revdate, "datetime"));
                        Nrm.app.set("svnVersion", model.toJSON());
                        if (response.nrmcoreRev) {
                            // new strategy includes nrmcore rev in SvnRev.txt
                            showAboutFn({rev: response.nrmcoreRev});
                        } else {
                            // original strategy generated two files
                            nrmcoreVersion.fetch({
                                success: function(model, response) {
                                    model.set("revdate", Nrm.app.formatValue(response.revdate, "datetime"));
                                    showAboutFn(model.toJSON());
                                },
                                error: function() {
                                    showAboutFn();
                                }
                            });
                        }
                    },
                    error: function(model, response) {
                        var error = {
                            error: Nrm.app.normalizeErrorInfo("Failed to load application info", model, response)
                        };
                        Nrm.event.trigger("showErrors", errorTemplate(error), {
                            allowRecall: false
                        });
                    }
                });
            } else {
                showAboutFn(Nrm.app.get("nrmCoreVersion"));
            }
        }
    });
});