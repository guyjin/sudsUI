/**
 * @file The MapTabsView is a {@link http://backbonejs.org/#View|Backbone.View} that uses a set of tabs to load views
 * whose purpose is to interact with the map display.
 * @see module:nrm-map/views/mapTabsView
 */
/** 
 * @module nrm-map/views/mapTabsView
 * 
 */

define(
        [
            'jquery',
            'underscore',
            'backbone',
            'nrm-ui',
            'hbs!tabsContainer',
            'hbs!accordionPanel',
            'hbs!dropdown',
            './mapTocView',
            './mapIdentifyView',
            './mapMeasureView'
        ],
        function(
                $,
                _,
                Backbone,
                Nrm,
                TabsContainerTemplate,
                AccordionPanelTemplate,
                DropdownTemplate,
                MapTocView,
                MapIdentifyView,
                MapMeasureView
                ) {
            return Nrm.Views.MapTabsView = Backbone.View.extend(/**@lends module:nrm-map/views/mapTabsView.prototype */{
                events: {
                    "click #map-default-actions": "showMapActionsMenu"
                },
                tabs: [
                    {id: "tabMapToc", title: "Table of Contents", iconClass: "fa fa-th-list", viewClass: MapTocView},
                    {id: "tabMapIdentify", title: "Identify", iconClass: "fa fa-info-circle", viewClass: MapIdentifyView},
                    {id: "tabMapMeasure", title: "Measure", iconClass: "fa fa-arrows-h", viewClass: MapMeasureView}
                ],
                /**
                 * Create a new MapTabsView instance.
                 * @constructor
                 * @alias module:nrm-map/views/mapTabsView
                 * @classdesc The MapTabsView is a Backbone.View that uses a set of tabs to load views whose purpose is 
                 * to interact with the map display.
                 * @param {Object} [options]
                 * @param {string} [options.contentElemId="mapPanelTab"] The id of the div in which to render tab views.
                 * @property {string} [helpContext] Context-sensitive help context for Map overview.
                 */
                initialize: function(options) {
                    this.options = _.defaults(options, {
                        contentElemId: "mapPanelTab",
                        tabbed: true,
                        helpContext: "979"
                    });
                    this.options.hideClose = true; // child views should hide the "x" close buttons
                    var mapMenuTitle = "Context menu for Map";
                    var mapMenuId = "map-default-actions";
                    /**
                     * Menu items for map actions.
                     * @type {module:nrm-ui/views/baseView~MenuItemConfig[]}
                     */
                    this.mapActionsItems = [
                        {
                            "id": "map-menu-addLayerByURL",
                            "label": "Add layer from URL",
                            "href": "#addLayerByURL",
                            "className": "nrm-route-action"
                        },
                        {
                            "id": "map-menu-addLayerFromShapefile",
                            "label": "Add layer from ShapeFile",
                            "href": "#addLayerFromShapefile",
                            "className": "nrm-route-action"
                        },
                        {
                            "id": "map-menu-printMap",
                            "label": "Print map to PDF",
                            "href": "#printMap",
                            "className": "nrm-route-action"
                        }
                    ];
                    /**
                     * Configuration for the Actions button.
                     * @type {module:nrm-ui/views/baseView~ControlConfig}
                     */
                    this.mapactions = {id: mapMenuId,
                        label: "Actions",
                        title: mapMenuTitle,
                        items: []
                    };

                    var mapclickEvents = $.extend({}, this.defaultMapEvents, this.options.mapMenuEvents);
                    this.mapEvents = {};
                    _.each(mapclickEvents, function(value, key) {
                        if (_.isString(value))
                            this.mapEvents[key] = _.bind(function(e) {
                                if (this[value])
                                    this[value].call(this, e);
                            }, this);
                        else
                            this.mapEvents[key] = value;
                    }, this);

                },
                /**
                 * Start listening to global events
                 * @returns {undefined}
                 */
                startListening: function() {
                    _.each(this.tabs, function(tab) {
                        $("#" + tab.id, this.$el).on("click", _.bind(this.tabSelected, this));
                    }, this);
                    this.$el.on("show.bs.collapse", "#" + this.mapTabsPanel.id, _.bind(this.expandPanel, this));
                    this.$el.on("hide.bs.collapse", "#" + this.mapTabsPanel.id, _.bind(this.collapsePanel, this));
                },
                /**
                 * When accordion panel is collapsed, remove tab view.
                 * @returns {undefined}
                 */
                collapsePanel: function() {
                    this.expanded = false;
                    if (this.selectedTab && this.selectedTab.view) {
                        this.selectedTab.view.remove(); //.stopListening();
                    }
                },
                /**
                 * When accordion panel is expanded, redisplay previous tab view or display view for first tab.
                 * @returns {undefined}
                 */
                expandPanel: function() {
                    this.expanded = true;
                    if (!this.selectedTab) {
                        var $el = $("#" + this.tabs[0].id, this.$el);
                        $el.addClass("active").attr("aria-expanded", "true").trigger("click");
                        $el.parent().addClass("active");
                    } else if (this.selectedTab.view) {
                        var id = this.selectedTab.id;
                        this.selectedTab = null;
                        this.tabSelected({target: {id: id}});
                    }
                },
                /**
                 * Handle click event on tab element, load view into tab contents.
                 * @param {Event} event Event data, must include target.id or target.parentElement.id.
                 * @param {String} [event.target.id] ID of element clicked.
                 * @param {String} [event.target.parentElement.id] ID of the parent of the element clicked.
                 * @returns {undefined}
                 */
                tabSelected: function(event) {
                    var x = event.target.id || event.target.parentElement.id;
                    if (this.selectedTab && x === this.selectedTab.id) {
                        if (this.selectedTab.view && this.selectedTab.view.startListening) {
                            this.selectedTab.view.startListening();
                        }
                        return;
                    }
                    var previousTab = this.selectedTab;
                    this.selectedTab = _.findWhere(this.tabs, {id: x});
                    if (!this.selectedTab) {
                        return;
                    }
                    if (previousTab && previousTab.view) {
                        previousTab.view.remove();
                    }
                    var $el = $("<div></div>");
                    $("#" + this.options.contentElemId, this.$el).html($el);
                    if (!this.selectedTab.view) {
                        this.selectedTab.view = new this.selectedTab.viewClass(_.extend(_.omit(this.options, "helpContext"), {$el: $el}));
                    }
                    var view = this.selectedTab.view;
                    if (view) {
                        $el.html(view.el);
                        view.render();
                        if (view.renderView) {
                            view.renderView();
                        }
                    } else {
                        console.warn("mapTabsView.renderTab has a bad view", this.selectedTab.view);
                    }
                },
                /**
                 * Show the context menu, either from right-click or Actions button dropdown. If the selected view has
                 * a contextItems method, displays them after the default map items.
                 * @param {Object} options
                 * @param {external:module:jquery} [options.$el] Target of the event
                 * @param {Event} [options.evt] Event data (either this or the $el option is required).
                 * @returns {undefined}
                 */
                showMapContextMenu: function(options) {
                    Nrm.app.triggerEvent("app:setHelpContext", this.options.helpContext);
                    var $dropdown = $("#nrm-contextmenu-btn"),
                            menu = _.omit(this.mapactions, "items"),
                            items = _.clone(this.mapActionsItems);
                    // Get contextitems from child view 
                    if (this.selectedTab && this.selectedTab.view && this.selectedTab.view.contextItems) {
                        var contextItems = this.selectedTab.view.contextItems();
                        if (contextItems.length > 0) {
                            contextItems[0].group = true;
                            items = items.concat(contextItems);
                        }
                    }
                    menu.items = items;
                    if (!menu.items || !menu.items.length) {
                        options.cancel = true;
                    } else {
                        var html = DropdownTemplate(menu);
                        options.menu = $(html);
                        options.clickEvents = this.mapEvents;
                    }
                    if (options.cancel) {
                        $dropdown.nrmContextMenu("hideMenu");
                    } else {
                        $dropdown.nrmContextMenu("showMenu", options);
                    }
                },
                /**
                 * Handle Actions button click event to show the dropdown
                 * @param {Event} e Event data
                 * @returns {undefined}
                 */
                showMapActionsMenu: function(e) {
                    var evt = {"evt": e, "$el": $(e.currentTarget)};
                    this.showMapContextMenu(evt);
                    if (!evt.cancel) {
                        e.stopPropagation();
                    }
                },
                /**
                 * Extends Backbone View.remove
                 */
                remove: function() {
                    this.collapsePanel();
                    Backbone.View.prototype.remove.apply(this, arguments);
                },
                /**
                 * Render the view, respecting the expanded state of the parent accordion panel.
                 * @returns {undefined}
                 */
                render: function() {
                    var toolsId = this.options.accordionId,
                            template = TabsContainerTemplate,
                            content = template({
                        id: this.options.contentElemId, tabs: this.tabs
                    });
                    this.mapTabsPanel = {
                        id: toolsId + "-layers-panel",
                        parentId: toolsId,
                        header: this.options.title || "Map", // "Map Layers",
                        expand: this.options.tocExpanded,
                        actions: this.mapactions,
                        content: content,
                        helpContext: this.options.helpContext
                    };
                    this.setElement($(AccordionPanelTemplate(this.mapTabsPanel)));

                    this.$el.addClass("nrm-help-provider").attr('data-nrm-help-context', this.options.helpContext);
                    this.startListening();
                    if (this.expanded || this.options.tocExpanded) {
                        this.expandPanel();
                    }
                    return this;
                }
            });
        }
);
