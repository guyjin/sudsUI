/**
 * @file The ContextView renders the content of the west pane, including the navigation tree and the accordion group
 * that may contain other views. 
 * @see module:nrm-ui/views/contextView
 */
/**
 * @module nrm-ui/views/contextView
 */

define(['require', '..', 'jquery', 'underscore', 'backbone', './baseView', '../models/application', 'hbs!contextView', 'hbs!dropdown',
    'jstree', '../plugins/nrmContextMenu'], 
         function(require, Nrm, $, _, Backbone, BaseView, Application, template, dropdownTemplate,
         JSTree, NRMContextMenu) {
    
    /**
     * Tree plugin configuration.
     * @typedef {Object} TreeConfig
     * @see {@link https://www.jstree.com/docs/config/|JSTree plugin configuration options}
     */
    
    /**
     * Plain object representation of a JSTree node.
     * @typedef {Object} Node
     * @see {@link https://www.jstree.com/docs/json/|JSTree plugin JSON node format}
     */
    
    /**
     * Context menu configuration
     * @typedef {module:nrm-ui/views/baseView~ControlConfig} ContextMenuConfig
     * @property {Boolean} enableSpatial Indicates whether spatial menu items should be enabled.
     * @property {Object} clickEvents Events hash to pass to the 
     * {@link module:nrm-ui/plugins/nrmContextMenu|NrmContextMenu plugin}
     */
    
    /**
     * Accordion panel configuration
     * @typedef {module:nrm-ui/views/baseView~ControlConfig} AccordionPanelConfig
     * @property {string} header Text to display in the header.
     * @property {string} [template] Name of the template that will render the content of the panel.  
     * @property {string} [content] Content of the panel if the template property is not set, HTML will not be escaped.
     * @property {string} parentId The accordion group id, this is usually set automatically
     * @property {Boolean} [expand=false] Indicates whether panel is initially expanded
     * @property {module:nrm-ui/views/baseView~ControlConfig} [actions] Actions button configuration
     * @property {string} [contextHelp] Context-sensitive help URL
     * @property {string} [headerType="h4"] Tag name of the 
     * {@link http://getbootstrap.com/components/#panels-heading|panel header} should be one of the valid HTML header 
     * tags h1 - h6.
     * @property {string} [panelStyle="default"] One of the 
     * {@link http://getbootstrap.com/components/#panels-alternatives|Twitter Bootstrap} "panel-" class suffixes, e.g 
     * "primary", "success", "info", "warning", "danger".
     */
    
    /**
     * Tools panel configuration.
     * @typedef {Object} ToolsConfig
     * @property {string} template Name of the template that will render the content of the Tools accordion panel.
     * @property {module:nrm-ui/views/contextView~AccordionPanelConfig} panelData Accordion panel configuration, which 
     * may also include arbitrary properties that will be passed to the template.
     */
    
    return Nrm.Views.ContextView = BaseView.extend(/** @lends module:nrm-ui/views/contextView.prototype */ { //Backbone.View.extend({
        /**
         * A class name that will be applied to the container element
         * @default
         * @type {string}
         */
        className: "nrm-westpane-container",
        /**
         * Create a new instance of the ContextView.  Note that we can override all default options described here by
         * setting the option in the {@link module:nrm-ui/models/application~AppConfig|main application configuration}. 
         * @constructor
         * @alias module:nrm-ui/views/contextView
         * @classdesc
         *   A Backbone view that extends {@link module:nrm-ui/views/baseView|BaseView} to provide navigation tree
         *   and accordion group in the west panel of the NRM UI layout.
         * @param {Object} options
         * @param {string} options.accordionId The id of the accordion group that will contain Tools,
         * Search and Map accordion panels.
         * @param {Boolean} [options.panToActiveRow=true] Pan to the selected node if it has a geometry.
         * @param {Number} [options.minNavigatorHeight=0] Minimum navigator height, if it is set to zero, the minimum
         * height will be calculated from the height of all root nodes in collapsed state.
         * @param {string} [options.treeId="nrmTree-default"] The id of the navigation tree element.
         * @param {string} [options.ctxTitle="Navigator"] The title of the Navigator panel.
         * @param {module:nrm-ui/views/contextView~TreeConfig} [options.tree] JSTree plugin configuration.
         * @param {module:nrm-ui/views/contextView~ToolsConfig} [options.tools] Tools panel configuration.
         * @param {string[]} [options.containerTypes] A list of node types (in addition to the default "folder" type)
         * that should be treated as container nodes.
         * @param {string} [options.defaultSearch] The entity context key for the default "quick search" view to render
         *  when the application loads.
         * @see {@link http://backbonejs.org/#View-constructor|Backbone View constructor / initialize}
         */
        initialize: function(options){
            /**
             * Initialization options.
             * @type {Object}
             */
            this.options = $.extend({ }, this.defaultOptions, Nrm.app.attributes, options);
            /**
             * The id of the tree element.
             * @type string
             */
            this.treeId = this.options.treeId || "nrmTree-default";
            /**
             * The header text of the Navigator panel.
             * @type string
             */
            this.treeTitle = this.options.ctxTitle  || "Navigator";
            /**
             * Context reference type for the default search.
             * @type string
             */
            this.defaultSearch = this.options.defaultSearch;
            /**
             * JSTree plugin initialization options
             * @type {module:nrm-ui/views/contextView~TreeConfig}
             */
            this.treeOptions = this.options.tree || { };
            var ctxMenuTitle = "Context menu for " + this.treeTitle;
            var ctxMenuId = this.treeId + "-actions";
            var evt = { };

            if (!Nrm.app.get("disableCtxMenu")) {
                var clickEvents = $.extend({ }, this.defaultMenuEvents, this.menuEvents);
                var menuEvents = { };
                var self = this;
                _.each(clickEvents, function(value, key) {
                    if ((typeof value === 'string' || value instanceof String))
                        menuEvents[key] = function(e) { if (self[value]) self[value].call(self, e); };
                    else
                        menuEvents[key] = value;
                }, this);
                /**
                 * The context menu configuration for the navigation tree.
                 * @type {module:nrm-ui/views/contextView~ContextMenuConfig}
                 */
                this.contextmenu = { 
                    id: ctxMenuId,
                    title: ctxMenuTitle,
                    clickEvents: menuEvents
                };
                evt["contextmenu #" + this.treeId + " a"] = "onContextMenu";
            }
            evt["mousedown #" + this.treeId + " a.jstree-anchor"] = "onTreeMouseDown";
            evt["focusout #" + this.treeId + " a.jstree-anchor"] = "onTreeFocusOut";
            /**
             * Actions button configuration
             * @type {module:nrm-ui/views/baseView~ControlConfig}
             */
            this.actions = { id: ctxMenuId,
                label: "Actions",
                title: ctxMenuTitle,
                items: [ { id: "placeholder", label: "No actions available" }]
            };
            evt["click #" + this.actions.id] = "showActionsMenu";
            evt['show.bs.collapse .nrm-accordion-panel'] = "showPanel";
            this.events = this.mixEvents(this.defaultEvents, evt);


            this.loadContext();

            var toolsId =  this.options.accordionId;
            this["tools-accordion"] = {
                type: "accordion",
                id: toolsId,
                controls: [ ]
            };
            if (this.options.tools) {
                var template = this.options.tools.template || "tools";
                 this["tools-accordion"].controls.push($.extend({ 
                    id: toolsId + "-tools-panel",
                    parentId: toolsId,
                    header: "Tools",
                    template: template
                }, this.options.tools.panelData));
                this.loading = $.when.apply($, [this.loading, Application.requireDeferred(['hbs!' + template])]);
            }
            /*if (this.options.enableMap) {
                var tocId = (this.options.map && this.options.map.tocId) || "mapTocControl";
                this["tools-accordion"].controls.push({
                     id: toolsId + "-layers-panel",
                     parentId: toolsId,
                     header: "Map", // "Map Layers",
                     expand: true,
                     actions: this.mapactions,
                     content: '<div id="' + tocId + '"></div>'
                });
            }*/
            /**
             * Node type configuration.
             * @type {Object}
             */
            this.nodeTypes = $.extend({ }, this.defaultNodeTypes, 
                    this.options.tree && this.options.tree.types,
                    this.options.nodetypes);
            this.nodeTypes = _.reduce(this.nodeTypes, function(memo, item, key) {
                    var icon = _.isString(item.icon) && item.icon; 
                    if (icon && icon.match(/[^\/]\S*\/\S*\.\S*/))
                        memo[key] = $.extend({ }, item, { icon: require.toUrl(icon) });
                    else
                        memo[key] = item;
                    return memo;
                }, { });
            /**
             * Minimum height for the Navigator panel.
             * @type {Number}
             */
            this.minNavigatorHeight = this.options.minNavigatorHeight;
        },
        showPanel: function(e) {
            var $el = $(e.target), control = $el.data('nrm-control');
            if (control && (control.config || control.view)) {
                this.renderPanel(control, $el);
                console.log('contextView showPanel', control);
            }
        },
        /**
         * Load the application context during initialization or to refresh the tree.
         * @returns {undefined}
         */
        loadContext: function() {
            /**
             * Loading indicator.
             * @name module:nrm-ui/views/contextView#loading
             * @type {external:module:jquery~Promise}
             */
            this.loading = $.when(Nrm.app.getContext({ }, this)).done(function(ctx) {
                var hasRootContext = false;
                $.each(ctx, function(key, item) {
                   if (item.topLevel) {
                       hasRootContext = true;
                       return false;
                   } 
                });
                if (hasRootContext) {
                    var accordionId = this.treeId + "-accordion";
                    var panelId = accordionId + "-panel";
                    this["tree-accordion"] = { 
                        type: "accordion",
                        id: accordionId,
                        controls: [  { 
                            id: panelId,
                            parentId: accordionId,
                            header: this.treeTitle,
                            expand: true,
                            content: '<div id="' + this.treeId + '" class="nrm-tree" aria-label="Navigator tree"></div>',
                            hideButton: true,
                            actions: this.actions
                        } ]
                    };
                    //var adjustHeight = _.throttle(_.bind(this.adjustTreeHeight, this), 500, {leading: false});
                    this.events = this.mixEvents(null, {
                        'show.bs.collapse' : function() {
                            this.$el.css("overflow-y", "hidden");
                        },
                        'shown.bs.collapse' : "adjustTreeHeight",
                        'hidden.bs.collapse' : "adjustTreeHeight"
                    });
                }
            });
        },
        /**
         * Default options.
         * @type {Object}
         */
        defaultOptions: {
            panToActiveRow: true,
            minNavigatorHeight: 0
        },
        /**
         * Default context menu items that will be displayed if the node does not provide a context menu.
         * @type {module:nrm-ui/views/baseView~MenuItemConfig[]}
         */
        defaultActions: [ /*{
            "id" : "nrmtree-default-noaction",
            "label" : "No node selected",
            "href" : "#"
        }*/],
        /**
         * Default events hash to pass to {@link module:nrm-ui/plugins/nrmContextMenu|NrmContextMenu plugin}.
         * @type {Object}
         */
        defaultMenuEvents: { },
        /**
         * Default node types for the 
         * {@link https://www.jstree.com/api/#/?f=$.jstree.defaults.types|JSTree types plugin configuration}
         * @type {Object}
         */
        defaultNodeTypes: { 
            "point": { "icon" : "../img/point.png" }, 
            "line" : { "icon" : "../img/line.png" }, 
            "polygon": { "icon" : "../img/polygon.png" }, 
            "multipoint": { "icon" : "../img/point.png" }, 
            "row": { "icon" : "../img/row.png" },
            "error": { "icon" : "glyphicon glyphicon-exclamation-sign" }
        },
        /**
         * Get the nested context configuration for a node.
         * @param {module:nrm-ui/views/contextView~Node|external:module:jquery} node A JSTree node or JQuery element
         * @returns {external:module:jquery~Promise}
         * @see {@link module:nrm-ui/models/application#getNestedContext} for information about the return type.
         */
        getContextType: function(node) {
            return Nrm.app.getNestedContext({ path: this.getNodePath(node) }, this);
        },
        /**
         * Destroy the tree plugin.
         * @returns {undefined}
         */
        destroyTree: function() {
            if (this.tree) {
                this.tree.jstree('destroy');
                this.tree.off('.jstree');
                this.tree = null;
            }
        },
        /**
         * Render the view.
         * @returns {module:nrm-ui/views/contextView}
         * Returns this instance to allow chaining.
         */
        render: function() {
            this.destroyTree();
            this.delegateEvents();
            /**
             * Mapping of navigation paths to node ids.
             * @name module:nrm-ui/views/contextView#pathToIdMap
             * @type {Object}
             */
            this.pathToIdMap = { };
            //var template = Handlebars.templates['contextView'];
            this.$el.html(template(this));
            var $nav = this.getNavigatorPanel();
            if ($nav)
                $nav.css("position", "relative");
            this.startListening(); 
            this.renderTree();
            this.applyPlugin(this.$el, this["tree-accordion"]);
            this.applyPlugin(this.$el, this["tools-accordion"]);
            return this;
        },
        /**
         * Override of {@link nrm-ui/views/baseView#onRemove|BaseView#onRemove} that destroys the tree plugin.
         * @returns {undefined}
         */
        onRemove: function() {
            /**
             * Indicates whether the view has been rendered.
             * @name module:nrm-ui/views/contextView#rendered
             * @type {Boolean}
             */
            this.rendered = false;
            this.destroyTree();
        },
        /**
         * Start listening to global events.
         * @returns {undefined}
         */
        startListening: function() {
            _.each(Nrm.app.get("context"), function(ctx) {
                if (ctx.topLevel && ctx.collection && ctx.loadType !== "auto" && ctx.collection.models) {
                    this.onRootCollectionLoaded(ctx.collection, { context: ctx });
                }
            }, this);

            this.listenTo(Nrm.event, {
                "context:collectionLoaded" : this.onRootCollectionLoaded,
                //"context:endEdit" : this.onEdit,
                //"context:endCreate" : this.endCreate,
                "layout:endEdit" : this.onEdit,
                "layout:clearForm" : this.onCancelEdit,
                 "context:workList" : this.onTableSelect,
                 "context:activeRow" : this.setActiveRow,
                 "context:results" : function(e) {
                    // handles event triggered by route navigation
                    if (!this.selectingNode && !e.source) {
                        console.log("Setting active row for route navigation");
                        e.expandNode = true;
                        this.setActiveRow(e);
                    }
                 },
                /**
                 * Refresh the tree
                 * @event module:nrm-ui/event#context:refresh
                 * @param {Object} data Options that will be passed to the "beforeRefresh" and "afterRefresh" events.
                 */
                "context:refresh" : this.refresh,
                "context:clearSelection" : this.clearSelection,
                "map:featureEdit": this.onEditGraphicChanged,
                "map:endDraw": this.onEditGraphicChanged,
                "layout:westResize": this.adjustTreeHeight,
                "layout:searchChanged": this.adjustTreeHeight,
                "map:tocLoaded": this.adjustTreeHeight/*,
                // Note: if we listen to tocSelectionChange, and context menu is open, 
                // the adjustTreeHeight function needs to wait for the context menu to close.
                // I haven't enabled this because it doesn't completely solve the problem of TOC height changing
                "map:tocSelectionChanged": _.debounce(this.adjustTreeHeight, 200) // wait for visibility toggle transition*/
            });
            this.listenTo(this, "renderComplete", function() {
                this.rendered = true;
            });
            this.listenTo(Backbone.history, "route", function() {
                this.refreshContextMenu();
            });
        },

        // <editor-fold desc="tree events">
        /**
         * Start listening to collection events when each root collection loads.
         * @param {external:module:backbone.Collection} collection
         * @param {Object} options
         * @param {module:nrm-ui/models/application~ContextConfig} options.context The context configuration
         * @returns {undefined}
         */
        onRootCollectionLoaded: function(collection, options) {
            var t = options.context;
            if (t && t.topLevel && !t.parent) {
                console.log("Root collection loaded: " + t.caption || t.apiKey);
                if (this.removed) return;
                var getParentPath = function(options) {
                     var parentPath = options.path || "", parentModel, parentId;
                     if (parentPath.slice(-(options.attr.length + 1)) !== "/" + options.attr) {
                         parentPath = options.path + "/" + options.attr;
                     }
                     if (parentPath.indexOf('.') === 0) {
                         // convert relative path to absolute path
                         parentModel = options.currentParent || options.parent;
                         parentId = parentModel && (parentModel.id || parentModel.cid);
                         parentPath = t.apiKey + "/" + parentId + parentPath.substr(1);
                     }
                     return parentPath;
                };
                var logChildEvent = function(eventName, options) {
                    console.log(eventName + ": " + (options && (options.attr + " path=" + options.path)));
                };
                var childReset = function(eventName, collection, options) {
                     logChildEvent(eventName, options);
                     this.onReset({
                         context: options.context, 
                         collection: collection, 
                         path: getParentPath(options)
                     });
                };
                var ignoreChangeEvent = function(model) {
                    var ignore = true;
                    $.each(model.changed, function(key) {
                        if (key !== "selected") {
                            ignore = false;
                            return false;
                        }
                    });
                    return ignore;
                };
                var collEvt = {
                     "add": function(model) {
                         this.onUpdate({context: t, model: model, parentPath: t.apiKey});
                     },
                     "remove": function(model) {
                         this.onDelete({context: t, model: model, parentPath: t.apiKey});
                     },
                     "change": function(model) {
                         if (!ignoreChangeEvent(model))
                             this.onUpdate({context: t, model: model, parentPath: t.apiKey, change: true});
                     },
                     "child:add": function(model, collection, options) {
                         logChildEvent("child:add", options);
                         this.onUpdate({
                             context: options.context, 
                             model: model, 
                             parentPath: getParentPath(options),
                             parentModel: options.parent
                         });
                     },
                     "child:remove": function(model, collection, options) {
                         logChildEvent("child:remove", options);
                         this.onDelete({
                             context: options.context, 
                             model: model, 
                             parentPath: getParentPath(options),
                             parentModel: options.parent});
                     },
                     "child:change": function(model, collection, options) {
                         if (ignoreChangeEvent(model)) return;
                         logChildEvent("child:change", options);
                         this.onUpdate({
                             context: options.context, 
                             model: model, 
                             parentPath: getParentPath(options),
                             parentModel: options.parent, 
                             change: true
                         });
                     },
                     "child:reset": function(collection, response, options) {
                         childReset.call(this, "child:reset", collection, options);
                     },
                     "child:load": function(model, collection, options) {
                         childReset.call(this, "child:load", collection, options);
                     },
                     "child:reload": function(model, collection, options) {
                         logChildEvent("child:reload", options);
                         var path = getParentPath(options),
                                 node = this.findNode(path);
                         
                         // note: this won't work for child context with "container" node type
                         if (node && this.tree.jstree('is_loaded', node)) {
                            this.tree.jstree("load_node", node);
                         }
                     }
                 };
                if (t.loadType !== "workList") {
                    collEvt["reset"] = function(collection) { 
                         this.onReset({ context: t, collection : collection, path: t.apiKey }); 
                     };
                }
                this.listenTo(collection, collEvt);
                if (t.loadType === "auto" && !collection.length) {
                    // remove the expand icon for empty auto-loaded collections
                    this.onReset({ context: t, collection: collection, path: t.apiKey });
                }
            }
        },
        /**
         * Refresh the tree
         * @param {Object} data Options that will be passed to the "beforeRefresh" and "afterRefresh" events.
         * @returns {undefined}
         */
        refresh: function(data) {
            this.trigger("beforeRefresh", $.extend({
                source: this,
                callback: function(evtData) {
                    if (!evtData.cancel) {
                        console.log("Refreshing navigation tree");
                        this.selectedNode = null;
                        this.selectedPath = null;
                        this.stopListening();
                        this.loadContext();

                        $.when(this.renderDeferred()).done(_.bind(function() {
                            this.trigger("afterRefresh", data);
                        }, this));
                    }
                }
            }, data));
        },
        /**
         * Convert a context configuration boject to a node.
         * @param {module:nrm-ui/models/application~ContextConfig} context The context configuration
         * @param {string} path The navigation path for the node.
         * @param {string} id Parent model id.
         * @returns {module:nrm-ui/views/contextView~Node|external:module:jquery~Promise}
         * Returns the JSTree node object or a promise that will be resolved with the JSTree node if the node creation 
         * completes asynchronously.
         */
        contextToNode: function(context, path, id) {
            var createFolderData = function(childCount) {
                return { "text" : context.caption,
                    "li_attr": { "class" : "nrmtree-" + this.getRefType(context), 
                        "data-nrmtree-nodetype": "folder",
                        "data-nrmtree-path": path,
                        "data-nrmtree-apikey": context.apiKey
                    },
                    "children": context.loadType === "auto" || childCount > 0,
                    "type": "folder",
                    "state": {
                        "loading": false
                    }
                };
            };
            var isContainer = this.isContainerType(context.nodetype);
            if (context.loadType === "auto" && !isContainer) {
                return createFolderData.call(this);
            } else {
                var opt = id ? { modelId: id, path: path } : { };
                var dfd = new $.Deferred();
                var self = this;
                $.when(Nrm.app.getCollection(context, opt)).done(function(collection) {
                    if (isContainer) {
                        dfd.resolve(_.map(collection.models || collection, function(model) {
                            return self.modelToNode(context, model, path);
                        }));
                    } else {
                        var nodeData = createFolderData.call(self, collection.size ? collection.size() : collection.length);
                        dfd.resolve(nodeData);
                    }
                }).fail(function(model, response, options) {
                    dfd.reject(model, response, options);  
                });
                return dfd.promise();
            }
        },
        /**
         * Convert a group value to a group folder node
         * @param {string} groupName group attribute value
         * @param {module:nrm-ui/models/application~ContextConfig} context The context configuration
         * @param {string} path Navigation path for the node
         * @returns {module:nrm-ui/views/contextView~Node}
         * The group folder node
         */
        groupToNode: function(groupName, context, path) {
            return { "text" : groupName,
                "li_attr": { "class" : "nrmtree-" + this.getRefType(context), 
                    "data-nrmtree-nodetype": "folder",
                    "data-nrmtree-path": path,
                    "data-nrmtree-apikey": context.apiKey,
                    "data-nrmtree-group": groupName
                },
                "type": "folder",
                "state": {
                    "loading": false
                }
            };
        },
        /**
         * Indicates whether a node type is a container node.
         * @param {string} nodetype Type of the node
         * @returns {Boolean}
         * Returns true if the node is a container node, or some kind of falsey value if it is not.
         */
        isContainerType: function(nodetype) {
            return nodetype && (nodetype === "folder" || (this.options.containerTypes && 
                    $.inArray(nodetype, this.options.containerTypes) > -1));
        },
        /**
         * Compute the node type for a model, using either the subtype value if it is configured, or the geometry type
         * if the model has a geometry, or the default node type for the context.
         * @param {module:nrm-ui/models/application~ContextConfig} context The context configuration
         * @param {external:module:backbone.Model} model The model
         * @returns {string}
         * The computed node type
         */
        getModelNodeType: function(context, model) {
            var nodetype;
            if (context.subtype) {
                nodetype = Nrm.app.getModelVal(model, context.subtype);
                if (nodetype && context.typemap) {
                    var tm = context.typemap[nodetype];
                    if (tm && _.isString(tm))
                        nodetype = tm;
                    else if (tm && tm.nodetype)
                        nodetype = tm.nodetype;
                }
            } else if (Nrm.app.isSpatialContext(context)) {
                nodetype = Nrm.app.getSpatialType(context, model);
            } 
            if (nodetype && this.nodeTypes[nodetype]) 
                return nodetype;
            return Nrm.app.getDefaultNodeType(context);
        },
        /**
         * Get the label text from the model.
         * @param {module:nrm-ui/models/application~ContextConfig} context The context configuration
         * @param {external:module:backbone.Model} model The model
         * @returns {string}
         * The label text.
         */
        getModelLabel: function(context, model) {
            var label = model.isNew() ? ("New " + context.alias) : Nrm.app.getModelVal(model, context.nameAttr);
            if (!model.isNew() && context.schema && context.schema[context.nameAttr])
                label = this.formatValue(label, context.schema[context.nameAttr].dataType, "display");
            return label || model.id;
        },
        /**
         * Convert a model to a node.
         * @param {module:nrm-ui/models/application~ContextConfig} context The context configuration
         * @param {external:module:backbone.Model} model The model
         * @param {string} path The navigation path for the node
         * @param {string} [subtype] The subtype if specified by the navigation event, e.g. creating a new model of a
         * specific subtype.
         * @returns {module:nrm-ui/views/contextView~Node}
         * The JSTree node object
         */
        modelToNode: function(context, model, path, subtype) {
            var nodetype = subtype && this.nodeTypes[subtype] ? subtype : this.getModelNodeType(context, model);
            var childPath = path + "/" + (model.id ? model.id : "");
            var label = this.getModelLabel(context, model);
            var data = { 
                "text": label,
                "li_attr": { "class" : "nrmtree-" + this.getRefType(context), 
                    "data-nrmtree-nodetype": nodetype,
                    "data-nrmtree-path": childPath,
                    "data-nrmtree-apikey": context.apiKey
                },
                "type": nodetype,
                "state": {
                    "loading": false
                }
            };
            if (!model.isNew()) {
                //var children = context.schema ? _.where(context.schema, { navigate: true }) : [];
                data.children = this.hasChildren(context, model, { path: childPath });
            } else {
                data.li_attr["data-nrmtree-cid"] = model.cid;
            }
            return data;
        },
        /**
         * Determines whether a node can have children
         * @param {module:nrm-ui/models/application~ContextConfig} context The context configuration
         * @param {external:module:backbone.Model} model The model
         * @param {Object} options
         * @param {string} options.path The navigation path for the node
         * @returns {Boolean}
         * Returns true if the node can have children (actual children might be lazy-loaded later).
         */
        hasChildren: function(context, model, options) { 
            // allow context to dynamically determine whether a parent model has children (subfolders)
            return !!(context && model && context.schema && _.find(context.schema, function(schema) {
                if (_.isFunction(schema.navigate)) {
                    return schema.navigate.call(this, _.extend({
                        model: model,
                        context: context
                    }, options));
                } else {
                    return schema.navigate;
                }   
            }, this));
        },
        /**
         * Load children for a node
         * @param {external:module:jstree} t The JSTree plugin instance
         * @param {module:nrm-ui/views/contextView~Node} obj The node being loaded.
         * @param {function} cb Callback function to call with the children for that node when it has finished loading.
         * @returns {undefined}
         */
        loadChildren: function(t, obj, cb) {
            var onLoad = function(nodes) {
                if (t.element)
                    cb.call(t, nodes);
            };
            var isRoot = (obj.id === "#");
            var path = !isRoot && this.getNodePath(obj);
            console.log("Loading children for path " + (path || obj.id));
            var id = !isRoot && this.getNodeId(obj);
            var apiKey = !isRoot && this.getApiKey(obj);
            var self = this;
            var isContainer = id && id === apiKey;
            var createErrorNode = function(result, response, options) {
                var error = Nrm.app.normalizeErrorInfo(null, result, response, options);
                return { 
                    "text": error.message, 
                    "type": "error",
                    "li_attr": { 
                            "data-nrmtree-nodetype": "error",
                            "data-nrmtree-path": path + "/error"
                        },
                    "a_attr": {
                        "class": "nrmtree-error"
                    }
                };
            };
            var noChildrenCallback = function() {
              onLoad([]);
            };
            var failCallback = function(result, response) {
                onLoad([ createErrorNode(result, response) ]);
            };
            var res = { };
            if (path)
                res = Nrm.app.getNestedContext( { path: path });
            else { 
                // fake it... this seems awkward, there's probably a better way
                res.context = { isRootContext: true, schema: { } };
                _.each(Nrm.app.get("context"), function(ctx, key) {
                    if (ctx.topLevel)
                        res.context.schema[key] = { navigate: true, context: ctx };  
                });
            };
            $.when(res).done(function(result) {

                var loadNode = function(context, isChild) {
                   if (context.loadType === "workList") {
                       var domNode = !isRoot && this.tree.find("#" + obj.id);
                       if (!domNode || !domNode.hasClass("nrmtree-worklist")) {
                           noChildrenCallback();
                           return;
                       }
                       domNode.removeClass("nrmtree-worklist");
                   }
                   var newPath = isChild ? path + "/" + context.apiKey : path;
                   if (isContainer) {
                       var paths = path.split('/');
                       //TODO: this needs to change, not safe to assume even number of path components.
                        if (paths.length > 1 && paths.length % 2 !== 0) {
                            id = paths[paths.length - 2]; 
                        }
                   }
                   var opt = { modelId: id, path: newPath };
                   var collectionToNodes = function(collection) {
                       var nodes;
                       if (context.loadType === "workList") {
                            nodes = _.reduce(collection.models || collection, function(memo, model) {
                                if (model.get("selected") === true) {
                                    memo.push(self.modelToNode(context, model, newPath));
                                }
                                return memo;
                            }, []);
                        }  else {
                            nodes = _.map(collection.models || collection, function(model) {
                                return self.modelToNode(context, model, newPath);
                            });
                        }
                        return nodes;
                   };
                   $.when(Nrm.app.getCollection(context, opt)).done(function(collection) {

                        var nodes;
                        if (context.groupAttr) {
                            nodes = collection.groupBy(function(model) {
                                var grp = Nrm.app.getModelVal(model, context.groupAttr);
                                return (grp === null || grp === undefined) ? "" : grp;
                            });
                            nodes = _.reduce(nodes, function(memo, group, name) {
                                var groupNode = self.groupToNode(name, context, newPath);
                                groupNode.children = collectionToNodes(group);
                                if (!groupNode.text)
                                    memo.unshift.apply(memo, groupNode.children);
                                else
                                    memo.push(groupNode);
                                return memo;
                            }, []);

                            if (context.sortByGroup) {
                                nodes = nodes.sort(function(a, b) {
                                    var a1 = a && a.li_attr && a.li_attr["data-nrmtree-group"],
                                        b1 = b && b.li_attr && b.li_attr["data-nrmtree-group"];
                                    if (a1 === undefined && b1 === undefined) {
                                        a1 = a && a.text;
                                        b1 = b && b.text;
                                    } else if (a1 === undefined) {
                                        return -1;
                                    } else if (b1 === undefined) {
                                        return 1;
                                    }
                                    if (a1 < b1) return -1;
                                    else if (a1 > b1) return -1;
                                    else return 0;
                                });
                            }
                        } else {
                            nodes = collectionToNodes(collection);
                        }
                        onLoad(nodes);
                    }).fail(failCallback);
                };
                var ctx = result.context;
                if (isContainer) {
                    loadNode(ctx);
                } else if (ctx.schema) {
                    var data = [];
                    var i = 0;
                     var dfdQueue = [];
                     _.each(ctx.schema, function(schema, prop) {
                        if (!schema.navigate) return;
                        var dfd = new $.Deferred(), j = i++, nestedOpt, 
                                customNav = _.isFunction(schema.navigate);

                        if (ctx.isRootContext) {
                            result = { context: schema.context };
                        } else if (customNav) {
                            // Need to get a reference to the model if navigate is a function
                            // Loading the model requires a full path and no context passed to getNestedContext.
                            // TODO: improve the Nrm.app API to offer less confusing ways to get nested context.
                            result = Nrm.app.getNestedContext({ path: path + '/' + prop });
                        } else {
                            // If we don't need the model, just use the schema property as the "path".
                            // This will retrieve the extended context for this level without full navigation.
                            result = Nrm.app.getNestedContext({ context: ctx, path: prop });
                        }
                        $.when(result).done(function(result) {
                            if (customNav && !schema.navigate.call(self, _.pick(result, 'model', 'context', 'path'))) {
                                dfd.resolve(result);
                                return;
                            }
                            $.when(self.contextToNode(result.context, path ? path + "/" + prop : prop, id)).done(function(nodeData) {
                                if (nodeData.length) {
                                    var args = [j, 0];
                                    Array.prototype.push.apply(args, nodeData);
                                    Array.prototype.splice.apply(data, args);
                                    i = i + nodeData.length - 1;
                                } else if (nodeData.length !== 0) {
                                    data[j] = nodeData;
                                } 
                                dfd.resolve(result);
                            }).fail(function(result, response) {
                                data[j] = createErrorNode(result, response);
                                dfd.resolve(result);
                            });
                        }).fail(function(result, response) {
                            data[j] = createErrorNode(result, response);
                            dfd.resolve(result);
                        });
                        dfdQueue.push(dfd);
                    });
                    if (dfdQueue.length > 0) {
                        $.when.apply($, dfdQueue).done(function() {
                            onLoad(_.compact(data));
                        });       
                    } else {
                        noChildrenCallback();
                    }
                } else {
                    noChildrenCallback();
                }

            }).fail(failCallback);
        },
        /**
         * Called when the root node has finished loading and rendering is complete.
         * @returns {undefined}
         */
        onRootNodeLoaded: function() {
            function afterLoad() {
                this.trigger("rootNodeLoaded");
            }
            function notFoundCallback() {
                var node = (this.defaultSearch ? this.findNode(this.defaultSearch) : null);
                if (node) {
                    console.log("Selecting default search node");
                    /**
                     * Indicates whether the view is currently setting the active row.
                     * @name module:nrm-ui/views/contextView#settingActiveRow
                     * @type {Boolean}
                     */
                    this.settingActiveRow = true;
                    this.selectNode(node);
                    this.settingActiveRow = false;
                } else {
                    this.ensureTabIndex();
                }
                afterLoad.call(this);
            }
            if (!this.selectedNode && this.selectedPath) {
                this.selectNodeByPath(this.selectedPath, notFoundCallback, true, afterLoad);
            } else if (!this.selectedPath) {
                notFoundCallback.call(this);
            } else {
                this.ensureTabIndex();
                afterLoad.call(this);
            }
            var root = this.tree.jstree("get_node", "#");
            if (!this.options.minNavigatorHeight && root && root.children && root.children.length)
                this.minNavigatorHeight = (this.tree.jstree("get_node", "#", true).find('a').height() * root.children.length) + this.getScrollbarWidth();
            this.adjustTreeHeight();
        },
        /**
         * For accessibility, make sure the aria-activedescendant is set to an element id that actually exists.
         * @returns {undefined}
         */
        ensureTabIndex: function() {
            if (!this.tree) return;
            var $firstNode, activeNode = this.tree.attr('aria-activedescendant');
            if (!activeNode || !$('#' + activeNode, this.tree).length) {
                $firstNode = $('li', this.tree).first();
                if (!$firstNode || !$firstNode.length || !$firstNode[0].id) return;
                //console.log('setting aria-activedescendant, old', activeNode, 'new', $firstNode[0].id);
                this.tree.attr('aria-activedescendant', $firstNode[0].id);
            }
        },
        /**
         * The view internally keeps a map of navigation paths to node ids, because the path might contain characters
         * that are not appropriate in an id.  This method keeps the mapping in sync, and checks for actions that may
         * be waiting for the path to exist. 
         * @param {module:nrm-ui/views/contextView~Node} node The node that is changing
         * @param {string} action The type of change that is occurring, may be "delete", "load", "create" or "update"
         * @param {string} [oldPath] Previous path, if the path is changing during an update.
         * @returns {undefined}
         */
        updatePathMap: function(node, action, oldPath) {
            if (!node) return;
            var idMap = this.pathToIdMap = this.pathToIdMap || { };
            var isDelete = (action === "delete"), isLoad = (action === "load"), isCreate = (action === "create"), isUpdate = (action === "update");
            var path = node.li_attr && node.li_attr["data-nrmtree-path"];
            var actions = this.deferredActions && this.deferredActions[path];
            if (actions) 
                delete this.deferredActions[path];

            if (path && (isLoad || isDelete)) {
                var group = this.getGroupValue(node); 
                if (isDelete) {
                    if (group)
                        delete idMap[this.getGroupNodePath(path, group)];
                    else
                        delete idMap[path];
                }
                // group nodes are pre-loaded and child nodes are already deleted if the group node is deleted.
                if (!group) { 
                    var grpPath = path + ';', childPath = path + '/';
                    _.each(idMap, function(item, key) {
                        var test = key.slice(0, childPath.length);
                        if (test === childPath || (group && test === grpPath))
                            delete idMap[key];
                    });
                }
            }
            if (isDelete) return;
            if (isUpdate && oldPath) {
                delete idMap[oldPath];
            }
            function mapNode(id) {
                var child = this.tree.jstree('get_node', id);
                var path = child && child.li_attr && child.li_attr["data-nrmtree-path"];
                if (!path) return;
                var group = this.getGroupValue(child);
                if (group) path = this.getGroupNodePath(path, group);
                idMap[path] = id;
                if (actions) {
                    _.each(actions, function(action, deferredPath) {
                        if (action.found) return;
                        if (deferredPath === path) 
                            action.found = true;
                        else {
                            var nextPath = action.nextPath;
                            if ((!nextPath || nextPath.length < path.length) && deferredPath.length > path.length) {
                                var test = path + "/", match = deferredPath.slice(0, test.length);
                                if (test === match) action.nextPath = path;
                            }        
                        }
                    });
                }
                if (child.children && $.isArray(child.children)) {
                    _.each(child.children, mapNode, this);
                }
            } 
            if (isCreate || isUpdate)
                mapNode.call(this, node.id);
            else if (node.children) {
                _.each(node.children, mapNode, this);
                if (actions) {
                    _.each(actions, function(action, deferredPath) {
                        if (action.found) {
                            var n = this.findNode(deferredPath);
                            if (n && action.foundCallback) {
                                action.foundCallback.call(this, n);
                            } else if (!n && action.notFoundCallback) {
                                action.notFoundCallback.call(this, node);
                            }
                        } else {
                            this.loadNode(action.nextPath, deferredPath, action.foundCallback, action.notFoundCallback);
                        }
                    }, this);
                } 
            }       
        },
        /**
         * Initializes the JSTree plugin during a render.
         * @returns {undefined}
         */
        renderTree: function() {
            function validateSelectedPath(node, closingNode) {
                var preserveSelection = !closingNode && node.deferPathValidation, path, nodeToSelect;
                if (node.deferPathValidation) {
                    delete node.deferPathValidation;
                }
                path = this.getNodePath(node);
                // select the loaded node if the current selected node is a child of path getting loaded
                if (path && this.selectedPath && 
                    ((this.selectedPath === path && this.selectedGroup)
                    || (this.selectedPath.length > path.length && 
                    this.selectedPath.substring(0, path.length + 1) === path + "/"))) {
                    if (closingNode) {
                        /**
                         * Node that is being collapsed, set if the selected node is a descendent.
                         * @name module:nrm-ui/views/contextView#closingNode
                         * @type {module:nrm-ui/views/contextView~Node}
                         */
                        this.closingNode = node;
                    } else if (!preserveSelection) {
                        nodeToSelect = node;
                    } else if (this.selectedGroup) {
                        nodeToSelect = this.findGroupNode(this.selectedPath, this.selectedGroup);
                    } else {
                        nodeToSelect = this.findNode(this.selectedPath);
                    }
                    if (!nodeToSelect) {
                        console.log("Previously selected node not found", closingNode, this.selectedPath);
                        nodeToSelect = node;
                    }
                    this.selectNode(nodeToSelect, !!preserveSelection);
                }
            }
            var treeDiv = this.$el.find("#" + this.treeId);
            if (!treeDiv || treeDiv.length === 0) return;
            var self = this;   
            var layoutLoading = $.when(this.options.loading).always(_.bind(function() {
                this.options.loading = false;
            }, this));
            /* note: one might be tempted to use Backbone event delegation for the jsTree events, but that won't work 
             * because the events are triggered using jQuery triggerHandler method which doesn't bubble up to the view element.
             */
            /**
             * JQuery object that is initialized with the JSTree plugin, may be undefined or null if the plugin is 
             * currently not initialized.
             * @name module:nrm-ui/views/contextView#tree
             * @type {external:module:jquery}
             */
            this.tree = treeDiv.jstree($.extend({ }, this.treeOptions, {
                "core": $.extend({ }, this.treeOptions.core, { 
                    "check_callback" : true,
                    "multiple": false,
                    "data": function(obj, cb) {
                        var jstree = this;
                        if (jstree.element) {
                            $.when(layoutLoading).done(function(){
                                self.loadChildren(jstree, obj, cb);
                            });
                        }
                    }
                }),
                "types": this.nodeTypes,
                "plugins" : _.union(["types"], this.treeOptions.plugins || [ ])
            })).on("select_node.jstree", function (event, data) {
                self.onNodeSelected(data.node);
            }).on("close_node.jstree", function (event, data) {
                if (!data || !data.node) return;            
                // select the parent if current selected node is child of the loading node
                validateSelectedPath.call(self, data.node, true);
            }).on("load_node.jstree", function(event, data) {
                if (!data || !data.node) return;

                // Awkward, but the easiest way I could see to do this: 
                // The validateSelectedPath needs to occur after updating the path map if it is a deferred validation.
                // Otherwise, it needs to occur before updating the path map
                var validateFirst = !data.node.deferPathValidation;

                if (!validateFirst) {
                    self.updatePathMap(data.node, "load");
                }
                // select the parent if current selected node is child of the loading node
                validateSelectedPath.call(self, data.node, false);

                if (validateFirst) {
                    self.updatePathMap(data.node, "load");
                }

                if (data.node.id === "#") {
                    self.onRootNodeLoaded();
                } else if (!data.node.children || !data.node.children.length) {
                    self.tree.jstree("get_node", data.node, true).addClass("jstree-leaf").removeClass("jstree-closed");
                }
            }).on("delete_node.jstree", function(event, data) {
                self.updatePathMap(data && data.node, "delete");
            }).on("create_node.jstree", function(event, data) {
                self.updatePathMap(data && data.node, "create");
            }).on("mouseleave", null, this, function(e) {
                if (e.data.selectedNode) {
                    // prevents hovering over tree resulting in inconsistent focus in latest jstree 3.2.1
                    $(e.currentTarget).attr('aria-activedescendant', e.data.selectedNode.id);
                }
            });
            var rootNode = { id: "#" };
            if (this.tree.jstree("is_loaded", rootNode)) {
                if (!this.rendered) {
                    this.updatePathMap(this.tree.jstree("get_node", rootNode), "load");
                    this.listenToOnce(this, "renderComplete", this.onRootNodeLoaded);
                } else {
                    this.updatePathMap(this.tree.jstree("get_node", rootNode), "load");
                    this.onRootNodeLoaded();
                }
            }
        },
        /**
         * Event handler for the JQuery "focusout" event triggered on a tree node, removes the "nrmtree-clicked" class.
         * @param {Event} e The event data
         * @returns {undefined}
         */
        onTreeFocusOut: function(e) {
            var $target = $(e.currentTarget);
            $target.removeClass("nrmtree-clicked");
        },
        /**
         * Event handler for the "mousedown" event triggered on a tree node, adds the "nrmtree-clicked" class.
         * @param {Event} e The event data
         * @returns {undefined}
         */
        onTreeMouseDown: function(e) {
            var $target = $(e.currentTarget);
            $target.addClass("nrmtree-clicked");
        },
        /**
         * Event handler for the "contextmenu" event triggered on a tree node, shows a custom context menu.
         * @param {Event} e The event data
         * @returns {undefined}
         */
        onContextMenu: function(e) {
            if (this.contextmenu) {
                e.preventDefault();            
                var evt = { "evt" : e, "clickLoc" : false };
                //$("#nrm-contextmenu-btn").nrmContextMenu("hideMenu");
                this.showContextMenu(evt);
                if (!evt.cancel) {
                    e.stopPropagation();
                }
            }
        },
        /**
         * Show the custom context menu.
         * @param {Object} options
         * @param {Event} options.evt The event data
         * @param {Boolean} options.clickLoc Indicates that the menu should be displayed at the click location
         * @param {external:module:jquery} [options.$el] The target element for positioning the menu if not at
         * the click location.
         * @returns {undefined}
         */
        showContextMenu: function(options) {
            var $dropdown = $("#nrm-contextmenu-btn");
            var $target = options.$el ? this.tree.jstree("get_node", this.selectedNode, true) : $(options.evt.target);
            var selNode = $target.is("li") ? $target : $target.parentsUntil("ul", "li");
            var path = this.getNodePath(selNode);
            var group = this.getGroupValue(selNode);
            if (!options.$el && (this.selectedPath !== path || this.selectedGroup !== group) && $target.length > 0) 
                this.selectNode(selNode);
            // make sure the node selection wasn't cancelled...
            if (options.$el || (this.selectedPath === path && this.selectedGroup === group)) {
                if (!this.contextmenu.items || !this.contextmenu.items.length) {
                    options.cancel = true;
                } else {
                    //var template = Handlebars.templates["dropdown"];
                    var html = dropdownTemplate(this.contextmenu);
                    options.menu = $(html);
                    if (!options.clickLoc) {
                        if (!options.$el) {
                            selNode = this.tree.jstree("get_node", selNode, true);
                            if (selNode)
                                options.$el = selNode.children("a");
                            else
                                options.cancel = true;
                        }

                    }
                    options.clickEvents = this.contextmenu.clickEvents;
                }
            } else {
                options.cancel = true;
            }
            if (options.cancel) {
                $dropdown.nrmContextMenu("hideMenu");       
            } else {
                $dropdown.nrmContextMenu("showMenu", options); 
            }
        },
        /**
         * Get the navigation path for a node.
         * @param {module:nrm-ui/views/contextView~Node|external:module:jquery} node A JSTree node or JQuery element
         * @returns {string}
         * The navigation path or null/undefined if it could not be determined.
         */
        getNodePath: function(node) {
            if (!node) 
                return null;
            if (node.li_attr)
                return node.li_attr["data-nrmtree-path"];
            else if (node.attr)
                return node.attr("data-nrmtree-path");
            //else return node.li_attr["data-nrmtree-path"];
        },
        /**
         * Get the type of the node
         * @param {module:nrm-ui/views/contextView~Node|external:module:jquery} node A JSTree node or JQuery element
         * @returns {string}
         * The node type or null/undefined if it could not be determined.
         */
        getNodeType: function(node) {
            if (!node) 
                return null;
            if (node.li_attr)
                return node.li_attr["data-nrmtree-nodetype"];
            else if (node.attr)
                return node.attr("data-nrmtree-nodetype");
            //else return node.li_attr["data-nrmtree-nodetype"];
        },
        /**
         * Get the "API key" for the node. This is the last component of the navigation path that is not a model id.
         * @param {module:nrm-ui/views/contextView~Node|external:module:jquery} node A JSTree node or JQuery element
         * @returns {string}
         * The API key or null/undefined if it could not be determined.
         */
        getApiKey: function(node) {
            if (!node) 
                return null;
            if (node.li_attr)
                return node.li_attr["data-nrmtree-apikey"];
            else if (node.attr)
                return node.attr("data-nrmtree-apikey");
            //else return node.li_attr["data-nrmtree-apikey"];
        },
        /**
         * Determines whether a node matches a specific context reference type, i.e. one of the keys described in the
         * {@link module:nrm-ui/models/application~ContextConfigMap|ContextConfigMap documentation}.
         * @param {module:nrm-ui/views/contextView~Node|external:module:jquery} node A JSTree node or JQuery element
         * @param {string} refType Context reference type
         * @returns {Boolean}
         * Returns true if the node matches the given reference type.
         */
        matchesRefType: function(node, refType) {
            if (!node || !refType) 
                return false;
            var className;
            if (node.li_attr)
                className = node.li_attr["class"];
            else if (node.attr)
                className = node.attr("class");
            return BaseView.hasClassName(className, "nrmtree-" + refType);
        },
        /**
         * Get the last component of the navigation path for the node, either a model id or API key.
         * @param {module:nrm-ui/views/contextView~Node|external:module:jquery} node A JSTree node or JQuery element
         * @returns {string}
         * The model id or API key for the node, or empty string for a node that represents a new model.
         */
        getNodeId: function(node) {
            var path = this.getNodePath(node);
            var idx = path.lastIndexOf("/");
            if (idx < 0) {
                return path;
            } else {
                var prefix = path.substr(0, idx);
                if (prefix === 'lov') {
                    return prefix + '/' + path.substr(idx + 1);
                } else {
                    return path.substr(idx + 1);
                }
            }
        },
        /**
         * Get the group attribute value for a group folder node.
         * @param {module:nrm-ui/views/contextView~Node|external:module:jquery} node A JSTree node or JQuery element
         * @returns {string|undefined}
         * Return the group attribute value or undefined if the node is not a group folder node.   
         */
        getGroupValue: function(node) {
            if (!node) return;
            if (node.li_attr)
                return node.li_attr["data-nrmtree-group"];
            else if (node.attr)
                return node.attr("data-nrmtree-group");
        },
        /**
         * Get the group attribute value for a model
         * @param {external:module:backbone.Model} model The model
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The context configuration
         * @returns {string|undefined}
         * The group attribute value, or undefined if the context configuration does not have groupAttr or the model
         * attribute is undefined.
         */
        getModelGroupValue: function(model, ctx) {
            var groupName;
            if (ctx.groupAttr) {
                groupName = Nrm.app.getModelVal(model, ctx.groupAttr);
                if (groupName !== undefined)
                    groupName = groupName === null ? "" : groupName.toString();
            }
            return groupName;
        },
        /**
         * Maintains internal state after the selected node changes.
         * @param {module:nrm-ui/views/contextView~Node} node The selected node which may be null/undefined if there 
         * is no selected node.
         * @param {string} path The navigation path for the node.
         * @param {string} [group] Group attribute value, if a group folder node is selected
         * @param {module:nrm-ui/models/application~ContextConfig} context The context configuration
         * @param {external:module:backbone.Model} [model] The model, if applicable
         * @returns {undefined}
         */
        afterSelection: function(node, path, group, context, model) {
           /**
            * The currently selected node, may be null or undefined if there is no selected node.
            * @name module:nrm-ui/views/contextView#selectedNode
            * @type {module:nrm-ui/views/contextView~Node}
            */
           this.selectedNode = node;
           /**
            * The navigation path of the currently selected node, may be null or undefined if there is no selected 
            * node.
            * @name module:nrm-ui/views/contextView#selectedPath
            * @type {string}
            */
           this.selectedPath = path;
           /**
            * The group attribute value of the currently selected node, may be null or undefined if there is no 
            * selected node or the selected node is not a group folder node.
            * @name module:nrm-ui/views/contextView#selectedGroup
            * @type {string}
            */
           this.selectedGroup = group;

           if (this.selectedNode) {
                Nrm.app.triggerEvent("app:setHelpContext", context.helpContext);
                var $node = this.tree.jstree("get_node", this.selectedNode, true);
                if ($node) {
                    this.tree.attr('aria-activedescendant', this.selectedNode.id)
                    var $a = $node.children('a');
                    if (!$a.hasClass("nrmtree-clicked")) // auto-scroll in response to a click interferes with user experience 
                        this.scrollNodeIntoView(this.getNavigatorPanel(), $a);
                }
           } 

           if (this.contextmenu) {
               // path will be undefined if user has not selected a node or navigated a route
                this.contextmenu.items = path ? this.loadContextMenu(node, context, model) : this.defaultActions;
                this.contextmenu.enableSpatial = path ? this.isSpatialActionEnabled(node, context, model) : false;
                this.refreshContextMenu();
                if (this.actions) {
                    if (this.contextmenu.items && this.contextmenu.items.length > 0)
                        $("#" + this.actions.id).prop("disabled", false);
                    else
                        $("#" + this.actions.id).prop("disabled", true);
                }
           }   
           this.ensureTabIndex();
       },
       /**
        * Handles the JSTree "select_node" event.
        * @param {module:nrm-ui/views/contextView~Node} node The selected node
        * @returns {undefined}
        */
        onNodeSelected: function(node) {
           //var $node = node;
           if (node instanceof jQuery)
                node = this.tree.jstree("get_node", node);
           //else
           //    $node = this.tree.jstree("get_node", node, true);
           //var click = $node.children('a').hasClass("nrmtree-clicked");
           var path = this.getNodePath(node);
           var group = this.getGroupValue(node);
           if (!this.selectedNode || path !== this.selectedPath || group !== this.selectedGroup) {
                /**
                 * Indicates whether a node selection event is currently being processed.
                 * @name module:nrm-ui/views/contextView#selectingNode
                 * @type {Boolean}
                 */
               this.selectingNode = true;
               console.log("Selected node with path " + path); 
               var prevNode = this.selectedNode;
               var nodetype = this.getNodeType(node);

               var settingActiveRow = !!this.settingActiveRow;
               var deleting = !!this.deletingNode;

               var targetNode = (nodetype === "error") ? this.getParent(node) : node;
                $.when(this.getContextType(targetNode)).done(function(options) {
                    var ctx = options.context;
                    var callback = function(evtData) {
                        if (evtData && evtData.cancel) {
                            this.selectingNode = false;
                            var closingNode = this.closingNode;
                            if (closingNode) {
                                this.closingNode = null;
                                var self = this;
                                this.tree.jstree("open_node", closingNode, function() {
                                    self.selectNode(prevNode, true, node);
                                });
                            } else {
                                this.selectNode(prevNode, true, node);
                            }
                        } else {
                            this.closingNode = null;
                            if (!settingActiveRow && evtData.nodetype !== "error") {
                                /**
                                 * Active row has changed.
                                 * @event module:nrm-ui/event#context:activeRow
                                 * @param {module:nrm-ui/models/application~NestedContextResult} options Path 
                                 * navigation options.
                                 */
                                Nrm.app.triggerEvent("context:activeRow", { path: path });
                            }
                            this.selectingNode = false;
                            this.afterSelection(node, path, group, options.context, options.model); //, click);
                        }
                    };
                    var groupValue = group;
                    if (!groupValue && nodetype !== "folder" && ctx.groupAttr) {
                       groupValue = this.getGroupValue(this.getParent(node));
                    }
                    var evtData =  $.extend(options, { 
                        nodetype: nodetype, 
                        group: groupValue,
                        enableResults: !!ctx.searchResults,
                        cancel: false,
                        callback: callback,
                        source: this,
                        settingActiveRow: settingActiveRow,
                        deleting: deleting
                    });
                    /**
                     * Triggered when a node is selected.
                     * @event module:nrm-ui/event#context:selectNode
                     * @param {module:nrm-ui/views/layoutView~NestedContextWithCallback} evtData May include additional 
                     * properties:
                     * @param {Boolean} [evtData.deleting=false] Indicates that the selection changed after deleting a 
                     * record.
                     * @param {Boolean} [evtData.settingActiveRow=false] Indicates that the selection changed while 
                     * setting the active row.
                     * @param {Boolean} [evtData.enableResults=false] Indicates that the results grid view is enabled. 
                     * @param {Boolean} [evtData.handled] Event handler should set this to true to indicate that it has
                     * assumed responsibility for calling the callback.
                     * @param {Boolean} [evtData.cancel] Event handler may set this to true to cancel the node 
                     * selection.
                     */
                    Nrm.event.trigger("context:selectNode", evtData);
                    if (!evtData.handled) {
                        evtData.callback.call(this, evtData);
                    }
                });
           } /*else if (group !== this.selectedGroup) {
               $.when(this.getContextType(node)).done(function(options) {
                   this.afterSelection(node, path, group, options.context, options.model); //, click);
               });
           }  */
        },
        /**
         * Handles the global "layout:endEdit" event to ensure that the associated node is visible and selected if 
         * possible.  Delegates to {@link module:nrm-ui/views/contextView#endCreate|endCreate method} if it is a new
         * model.
         * @param {Object} evtData Event data
         * @param {external:module:backbone.Model} evtData.model Model that is being edited.
         * @param {string} evtData.path The path of the navigation event.
         * @param {module:nrm-ui/models/application~ContextConfig} evtData.context The context configuration
         * @param {string} [evtData.subtype] The subtype for a new model
         * @returns {undefined}
         */
        onEdit: function(evtData) {
            if (evtData.model && evtData.model.isNew()) {
                this.endCreate(evtData);
                return;
            }
            function editNodeFound(node) {
                if (this.selectedPath !== evtData.path) {
                    console.log("Edit node found for path " + evtData.path + ", we will select it.");
                    this.selectNode(node, true);
                }
            }
            function editNodeNotFound(node) {
                console.log("Edit node not found for path " + evtData.path + ", closest parent: " + (node ? this.getNodePath(node) : null ));
            }
            this.expandToNode(evtData.path, editNodeFound, editNodeNotFound);
        },
        /**
         * Reloads a node when the associated collection is reset.
         * @param {Object} evtData
         * @param {module:nrm-ui/models/application~ContextConfig} evtData.context The context configuration
         * @param {external:module:backbone.Collection} evtData.collection The colllection that is being reset
         * @param {string} evtData.path The navigation path for the collection.
         * @returns {undefined}
         */
        onReset: function(evtData) {
            this.loadNodes(evtData);
        },
        /**
         * Handles the deprecated "context:workList" event.
         * @deprecated The work list functionality was an early idea that didn't pan out.
         * @param {Object} evtData
         * @param {module:nrm-ui/models/application~ContextConfig} evtData.context The context configuration
         * @param {external:module:backbone.Collection} evtData.tableData The collection.
         * @returns {undefined}
         */
        onTableSelect: function(evtData) {
            var ctx = evtData.context;
            if (ctx && ctx.loadType === "workList" ) {
                evtData.collection = evtData.tableData;
                this.loadNodes(evtData);
            }
        },
        /**
         * Reloads a node after expanding its parents, also expands the node if it is selected.
         * @param {Object} evtData
         * @param {string} evtData.path The path of the navigation event that triggered the load.
         * @param {module:nrm-ui/models/application~ContextConfig} evtData.context The context configuration
         * @returns {undefined}
         */
        loadNodes: function(evtData) {
            var ctx = evtData.context, path = evtData.path;

            function reloadNode(node) {
                console.log("loading nodes for path " + path);
                if (ctx.loadType === "workList") {
                    $("#" + node.id, this.tree).addClass("nrmtree-worklist");
                }
                if (!this.tree.jstree("is_loading", node)) {
                    var self = this;
                    this.tree.jstree("load_node", node, function() {
                       if (self.selectedPath === path)
                           this.open_node(node);
                   });                 
                }

            }
            this.expandToNode(path, reloadNode);
        },
        /**
         * Loads all parent nodes of the node associated with a navigation path, then performs some action when the
         * target node is available, or an alternative action if the path was not found.
         * @param {string} path The closest ancestor navigation path that has already loaded.
         * @param {string} finalPath The target navigation path
         * @param {Function} foundCallback Callback function that will be passed the node associated with the target 
         * path, only called if creating the target node was successful.
         * @param {Function} notFoundCallback Callback function that will be passed the closest ancestor node if 
         * creating the target node was unsuccessful.  The closest ancestor may be undefined if the path parameter 
         * does not correspond to an already loaded node. 
         * @param {Boolean} [preserveSelection=false] Indicates whether we should try to preserve the previously
         * selected node if its parent was reloaded.
         * @returns {undefined}
         */
        loadNode: function(path, finalPath, foundCallback, notFoundCallback, preserveSelection) {
            /**
             * A hash of actions that are deferred until a navigation path has finished loading.
             * @name module:nrm-ui/views/contextView#deferredActions
             * @type {Object}
             */
            this.deferredActions = this.deferredActions || { };
            var node = path && this.findNode(path);
            if (node) {
                function mergeCallback(callback, newCallback) {
                    return callback ? function(node) {
                        callback.call(this, node);
                        newCallback.call(this, node);
                    } : newCallback;
                };
                var chain = this.deferredActions[path], triggerLoad = !chain;
                if (!chain) chain = this.deferredActions[path] = { };
                var action = chain[finalPath] = chain[finalPath] || { };
                if (foundCallback)
                    action.foundCallback = mergeCallback(action.foundCallback, foundCallback);
                if (notFoundCallback)
                    action.notFoundCallback = mergeCallback(action.notFoundCallback, notFoundCallback);

                if (triggerLoad && !this.tree.jstree("is_loading", node)) {
                    if (preserveSelection) {
                        node.deferPathValidation = true;
                    }
                    this.tree.jstree("load_node", node);
                }
            } else if (notFoundCallback) {
                notFoundCallback.call(this);
            }
        },
        /**
         * Add a node.
         * @param {Object} options
         * @param {module:nrm-ui/views/contextView~Node} options.parent The parent node.
         * @param {module:nrm-ui/views/contextView~Node} options.nodeData The data for the new node.
         * @param {string|Number} options.position The index at which to insert the node, "first" and "last" are also
         * supported.
         * @returns {external:module:jquery~Promise}
         * Returned promise is resolved with the created JSTree node object passed to done callbacks.
         * @see {@link https://www.jstree.com/api/#/?f=create_node([par, node, pos, callback, is_loaded])|JSTree#create_node function}
         */
        addNode: function(options) { 
            var dfd = new $.Deferred();
            this.tree.jstree("open_node", options.parent, function() {
                this.create_node(options.parent, options.nodeData, options.position, function(node) {
                    dfd.resolveWith(this, [node]);
                });
            });
            return dfd.promise();
        },
        /**
         * Find a node by element id (or technically, any input supported by the JSTree get_node function).
         * @param {string} id The element id for the node.
         * @returns {module:nrm-ui/views/contextView~Node|Boolean}
         * Returns the JSTree node object, or false if the node was not found.
         * @see {@link https://www.jstree.com/api/#/?f=get_node(obj [, as_dom])|JSTree#get_node function}
         */
        findNodeById: function(id) {
            return (id && this.tree) ? this.tree.jstree("get_node", id) : false;
        },
        /**
         * Find a node by navigation path
         * @param {string} path The navigation path
         * @returns {module:nrm-ui/views/contextView~Node|Boolean}
         * Returns the JSTree node object, or false if the node was not found.
         */
        findNode: function(path) {
            var id = this.pathToIdMap && this.pathToIdMap[path];
            return this.findNodeById(id);
        },
        /**
         * Find a group folder node by path and group attribute value
         * @param {string} path The navigation path
         * @param {string} groupName The group attribute value
         * @returns {module:nrm-ui/views/contextView~Node|Boolean}
         * Returns the JSTree node object, or false if the node was not found.
         */
        findGroupNode: function(path, groupName) {
            var id = this.pathToIdMap && this.pathToIdMap[this.getGroupNodePath(path, groupName)];
            return this.findNodeById(id);
        },
        /**
         * Format a path with group attribute value appended in a standard format.
         * @param {string} path The navigation path
         * @param {string} groupName The group attribute value
         * @returns {string}
         * The formatted path.
         */
        getGroupNodePath: function(path, groupName) {
            //if (path) return path + ";" + groupName.replace(/,/g, '%2C');
            return Nrm.app.getGroupPath(path, groupName);
        },
        /**
         * Convenience function to get the reference type of a context configuration object,
         * which may be a root or nested context.
         * @param {module:nrm-ui/models/application~ContextConfig} context The context configuration
         * @returns {string}
         * The context reference type.
         */
        getRefType: function(context) {
            return context && (context.refType || context.apiKey);
        },
        /**
         * Find all nodes matching the given context reference type and model id.
         * @param {string} refType The context reference type
         * @param {string} id The model id
         * @param {string} path The navigation path, only used if the model id is an empty string, indicating it is a 
         * new model
         * @returns {module:nrm-ui/views/contextView~Node[]}
         * Array of matching nodes.
         */
        findAllNodes: function(refType, id, path) {
            var node, nodes = [];
            if (id === "") {
                node = this.findNode(/\/$/.test(path) ? path : path + '/');
                if (node) nodes.push(node);
            } else if (id && this.pathToIdMap) {
                _.each(this.pathToIdMap, function(n, path) {
                    if (path.slice(-(id.length + 1)) === "/" + id) {
                        node = this.findNodeById(n);
                        if (node && this.matchesRefType(node, refType))
                            nodes.push(node);
                    }
                }, this);
            }
            return nodes;
        },
        /**
         * Find a node by model cid, to handle the case where the new model has been saved and now has an id, but we 
         * need to find the corresponding node that does not have the new id.
         * @param {string} apiKey The API key for the context configuration
         * @param {string} cid The model cid
         * @returns {module:nrm-ui/views/contextView~Node|Boolean}
         * Returns the JSTree node object, or false if the node was not found.
         */
        findByCid: function(apiKey, cid) {
            if (!this.tree) return false;
            var $node = this.tree.find('li[data-nrmtree-apikey="' + apiKey + '"][data-nrmtree-cid="' + cid + '"]');
            return $node && $node.length > 0 ? this.tree.jstree('get_node', $node) : false;
        },
        /**
         * Get the parent for a node
         * @param {module:nrm-ui/views/contextView~Node} node The child node.
         * @returns {module:nrm-ui/views/contextView~Node}
         * The parent node.
         */
        getParent: function(node) {
            var jstree = this.tree.jstree();
            var parentId = jstree.get_parent(node);
            if (parentId) return jstree.get_node(parentId);
        },
        /**
         * Adds a new node to the tree corresponding to a new model being edited in the data entry form.
         * @param {Object} evtData Event data
         * @param {external:module:backbone.Model} evtData.model Model that is being edited.
         * @param {string} evtData.path The path of the navigation event.
         * @param {module:nrm-ui/models/application~ContextConfig} evtData.context The context configuration
         * @param {string} [evtData.subtype] The subtype for a new model
         * @param {Boolean} [evtData.cancel] Cancels the action.
         * @returns {undefined}
         */
        endCreate: function(evtData) {
            if (!evtData.cancel) {
                var ctx = evtData.context || { };
                //alert("Creating object for " + contextType.apiKey);
                var parentPath = evtData.path;
                if (evtData.path.lastIndexOf('/') === evtData.path.length - 1)
                    parentPath = evtData.path.substring(0, evtData.path.length - 1); 

                var self = this;

                var parentFoundCallback = function(parentNode) {
                    var nodeData = this.modelToNode(ctx, evtData.model, parentPath, evtData.subtype);
                     var path = nodeData.li_attr["data-nrmtree-path"];

                     // add it under the correct group node
                     var groupName = this.getModelGroupValue(evtData.model, ctx);

                     var deleteNode, node = this.findNode(path);
                     if (groupName !== undefined && node) {
                          var groupParent = this.getParent(node);
                          var currGroup = this.getGroupValue(groupParent) || "";
                          if (currGroup !== groupName) {
                             var deleteGroup = (currGroup && groupParent.children && groupParent.children.length === 1);
                             deleteNode = deleteGroup ? groupParent : node;
                             node = false;
                          }
                     }
                     var afterCreate = function(node) {
                         self.selectNode(node, true);
                          if (deleteNode) {
                              self.tree.jstree("delete_node", deleteNode);
                          }
                     };
                     if (!node) {
                         var groupNode = groupName ? this.findGroupNode(parentPath, groupName) : null;
                         var addNode = function(parentNode) {
                              $.when(self.addNode( { 
                                 "parent": parentNode,
                                 "position": "first",
                                 "nodeData": nodeData,
                                 "expand": true
                             })).done(afterCreate);
                         };
                          if (groupNode) 
                              parentNode = groupNode;
                          else if (groupName) {
                               $.when(this.addNode({ 
                                   "parent": parentNode,
                                   "position": "first",
                                   "nodeData": this.groupToNode(groupName, ctx, parentPath),
                                   "expand": true
                               })).done(addNode);
                               return;
                          } 
                          addNode(parentNode);
                     } else {
                         this.updateAttributes(node, { 
                             "data-nrmtree-nodetype": nodeData.type,
                             "data-nrmtree-cid": evtData.model.cid 
                         });
                         afterCreate(node);
                     }
                };
                var parentNotFoundCallback = function(node) {
                    console.log("Parent node for new child not found at path " + parentPath + ", closest parent: " + (node ? this.getNodePath(node) : null ));
                };

                this.expandToNode(parentPath, parentFoundCallback, parentNotFoundCallback);

            }
        },
        /**
         * Update node attributes and synchronize the data attributes on the node element, updating the path mapping
         * if the data-nrmtree-path is one of the updated attributes.
         * @param {module:nrm-ui/views/contextView~Node} node The node to update
         * @param {Object} liAttr Attributes to update
         * @returns {undefined}
         */
        updateAttributes: function(node, liAttr) {
            var $node = $("#" + node.id, this.tree);
            _.each(liAttr, function(value, key) {
                var oldValue = node.li_attr[key];
                $node.attr(key, value);
                node.li_attr[key] = value;
                if (key === "data-nrmtree-path")
                    this.updatePathMap(node, "update", oldValue);
            }, this);
        },
        /**
         * Synchronizes the tree when a model is added or changed.  This will expand to the node path and create the 
         * node if it doesn't exist, update node label, type and path, and move the node to the correct group folder
         * if the group attribute value has changed.
         * @param {Object} evtData Event data
         * @param {external:module:backbone.Model} evtData.model Model that is being edited.
         * @param {string} [evtData.path] The path of the changed or added model, either path or parentPath is required.
         * @param {string} [evtData.parentPath] The path of the parent folder, either path or parentPath is required.
         * @param {module:nrm-ui/models/application~ContextConfig} evtData.context The context configuration
         * @param {external:module:backbone.Model} [evtData.parentModel] Reference to parent model
         * @param {string} [evtData.subtype] The subtype for a new model
         * @param {Boolean} [evtData.isNew] Indicates that it is a new model, if not specified, this may be inferred
         * if the matching node is found by cid instead of id.
         * @param {Boolean} [evtData.change=false] Indicates that it is a change event instead of an add event, which
         * may affect the behavior when the node is not found.
         * @param {Boolean} [evtData.selectNode=false] Indicates that the new node should be selected after it is
         * created.
         * @returns {undefined}
         */
        onUpdate: function(evtData) {
            var ctx = evtData.context;
            var model = evtData.model;
            var modelId = (model && model.id) || "";
            var label = this.getModelLabel(ctx, model);
            evtData.path = evtData.path || (evtData.parentPath + "/" + modelId);
            evtData.parentPath = evtData.parentPath || (evtData.path && evtData.path.substring(0, evtData.path.lastIndexOf("/")));
            if (!label) label = modelId;
            var id = evtData.isNew ? "" : modelId;
            var nodes = (evtData.path && this.findAllNodes(this.getRefType(evtData.context), id, evtData.path)) || [];
            if (nodes && nodes.length === 0) {
                var newNode = this.findByCid(evtData.context.apiKey, model.originalCid || model.cid);
                evtData.isNew = !!newNode;
                if (newNode) nodes.push(newNode);
            }
            var found = false;
            function afterSelection(node, newPath) {
                this.afterSelection(node, newPath, null, ctx, model);
                if (evtData.isNew) {
                    //var children = ctx.schema ? _.where(ctx.schema, { navigate: true }) : [];
                    if (this.hasChildren(ctx, model, { path: newPath })) { //children.length > 0) {
                        this.tree.jstree("load_node", node, function() {
                            this.open_node(node);
                        });
                    }
                }
            }
            if (nodes && nodes.length > 0) {
                _.each(nodes, function(node) {
                    var path = this.getNodePath(node);
                    var groupName = this.getModelGroupValue(evtData.model, ctx);
                    var substr = evtData.isNew ? evtData.path.lastIndexOf('/') + 1 : -1;
                    var cmpPath = substr > -1 ? evtData.path.substring(0, substr) : evtData.path;
                    var selected = this.selectedPath === cmpPath, newPath = evtData.isNew ? (path + modelId) : path;
                    found = cmpPath === path;
                    if (groupName !== undefined && found) {
                        var parent = this.getParent(node);
                        var currGroup = this.getGroupValue(parent) || "";
                        if (currGroup !== groupName) {
                            var groupParent = !currGroup ? parent : this.getParent(parent);
                            var self = this;
                            if (model && model.collection && model.collection.comparator) {
                                model.collection.sort();
                            }
                            if (selected) {
                                console.log("Selection will be restored after group value changed");
                                groupParent.deferPathValidation = true;
                            }
                            this.tree.jstree("load_node", groupParent, function() {
                               if (selected && newPath !== self.selectedPath) {
                                   node = self.findNode(newPath);
                                   if (node) {
                                       self.selectNode(node, true);
                                       afterSelection.call(self, node, newPath);
                                   }
                               }
                            });   
    //                        if (currGroup && parent.children && parent.children.length === 1) 
    //                            node = parent; // delete group node if this is the only child.
    //                        this.tree.jstree("delete_node", node);
    //                        this.onUpdate($.extend({ }, evtData, { selectNode: this.selectedPath === cmpPath }));
                            return;
                        }
                   }
                   this.tree.jstree("rename_node", node, label);
                   var setAttr = { }, redraw = false;
                   if (evtData.isNew) {
                        setAttr["data-nrmtree-path"] = newPath;
                        redraw = true;
                        if (evtData.parentModel) {
                            Nrm.app.updateCount(ctx, evtData.parentModel, 1);
                        }
                    } else if (path !== evtData.path) {
                        $.when(Nrm.app.getNestedContext({ path: path }, this)).done(function(options) {
                           if (options.model) {
                               options.model.set(model.attributes);
                           } 
                        });
                    } 
                    var nodetype = this.getModelNodeType(ctx, model);
                    if (nodetype !== this.tree.jstree("get_type", node)) {
                        this.tree.jstree("set_type", node, nodetype);
                        setAttr["data-nrmtree-nodetype"] = nodetype;
                        redraw = true;
                    }
                    if (redraw) {
                        this.updateAttributes(node, setAttr);
                        if (selected) {
                            afterSelection.call(this, node, newPath);
                        }
                    }
                }, this);
            } 

            if (!found && (!evtData.change || evtData.selectNode) && modelId && evtData.parentPath) {
                function nodeFound(node) {
                    console.log("Node found for path " + evtData.path + " after loading parent.");
                    if (evtData.selectNode) {
                        this.selectNode(node);
                    }
                }
                function parentNodeNotFound(parent) {
                    console.log("Parent node not found for " + evtData.path + ", closest parent: " + 
                                (parent ? this.getNodePath(parent) : null ));
                }
                function nodeNotFound(parent) {
                    if (this.getNodePath(parent) !== evtData.parentPath) {
                        parentNodeNotFound.call(this, parent);
                        return; // only add the node if the immediate parent was found.
                    }
                    console.log("Parent node found for path " + evtData.path + ", creating node.");
                    var self = this;
                    // add it under the correct group node
                    var groupName = this.getModelGroupValue(evtData.model, ctx);
                    var groupNode = groupName ? this.findGroupNode(evtData.parentPath, groupName) : null;
                    if (groupNode) 
                        parent = groupNode;
                    else if (groupName) {
                        parent = this.addNode({ 
                            "parent": parent,
                            "position": "first",
                            "nodeData": this.groupToNode(groupName, ctx, evtData.parentPath),
                            "expand": true
                        });
                    }
                    $.when(parent).done(function(parent) {
                        $.when(self.addNode({ 
                           "parent": parent,
                           "position": "first",
                           "nodeData": self.modelToNode(ctx, model, evtData.parentPath),
                           "expand": true
                       })).done(function(newNode) {
                            if (evtData.selectNode) {
                                self.selectNode(newNode, true);
                                afterSelection.call(self, newNode, evtData.path); 
                            }
                       });
                    });
                }
                if (evtData.selectNode) {
                    console.log('Attempting to select node, path ' + evtData.path + ' not found');
                    this.expandToNode(evtData.parentPath, nodeNotFound, parentNodeNotFound);
                } else {
                    console.log('Node not found for path ' + evtData.path + ', attempting to load parent');
                    this.expandToNode(evtData.path, nodeFound, nodeNotFound, true);
                }
            }
        },
        /**
         * Select a node.
         * @param {module:nrm-ui/views/contextView~Node|external:module:jquery} node The node to select.
         * @param {Boolean} [suppressEvents=false] Do not respond to the "context:activeRow" event.
         * @param {module:nrm-ui/views/contextView~Node} [prevNode] Previously selected node.
         * @returns {undefined}
         */
        selectNode: function(node, suppressEvents, prevNode) {
            if (node && (node.id || node.length > 0)) {

                var deselectNode = prevNode || this.selectedNode;
                if (deselectNode)
                    this.tree.jstree("deselect_node", deselectNode);
                suppressEvents = suppressEvents && !this.settingActiveRow;
                if (suppressEvents)
                    this.settingActiveRow = true;
                try {
                    this.tree.jstree("select_node", node);
                } finally {
                    this.settingActiveRow = false;
                }
            }
        },
        /**
         * Select a node by navigation path
         * @param {string} path The navigation path
         * @param {Function} [notFoundCallback] Callback that is called if the node was not found, passed two 
         * arguments, the path and the closest ancestor node that was found.
         * @param {Boolean} [loadParent=false] Indicates whether the parent should be loaded.
         * @param {Function} [foundCallback] Callback that is called if the node was found and selected, passed two 
         * arguments, the path and the closest ancestor node that was found.
         * @returns {undefined}
         */
        selectNodeByPath: function (path, notFoundCallback, loadParent, foundCallback) {
            function nodeFound(node) {
                this.selectNode(node);
                if (foundCallback)
                    foundCallback.call(this, path, node);
            }
            function nodeNotFound(node) {
                if (notFoundCallback)
                    notFoundCallback.call(this, path, node);
            }
            if (path && loadParent) {
                this.expandToNode(path, nodeFound, nodeNotFound);
            } else {
                var node = path && this.findNode(path);
                if (node)
                    nodeFound.call(this, node);
                else
                    nodeNotFound.call(this);
            }
        },
        /**
         * Clear the selected node.
         * @returns {undefined}
         */
        clearSelection: function() {
            if (this.selectedNode) {
                this.tree.jstree("deselect_node", this.selectedNode);
                this.selectedNode = null;
            }
            this.afterSelection(null, null, null);
        },
        /**
         * Synchronizes the tree when a model is removed from a collection.  This will either remove just the node 
         * matching the navigation path if the model was removed from the parent collection without deleting it 
         * completely, or remove all nodes matching the context reference type and model id if the model was deleted 
         * via the {@link module:nrm-ui/models/application#deleteModel|Nrm.app.deleteModel} function.
         * @param {Object} evtData Event data
         * @param {external:module:backbone.Model} evtData.model Model that was removed.
         * @param {string} [evtData.path] The path of the changed or added model, either path or parentPath is required.
         * @param {string} [evtData.parentPath] The path of the parent folder, either path or parentPath is required.
         * @param {module:nrm-ui/models/application~ContextConfig} evtData.context The context configuration
         * @param {Boolean} [evtData.suspendNodeSelection=false] Prevent selection of parent node if the removed node
         * or one of its descendents is currently selected.
         * @returns {undefined}
         */
        onDelete: function(evtData) {
            var modelId = (evtData.model && evtData.model.id) || "";
            evtData.path = evtData.path || (evtData.parentPath + "/" + (evtData.model && evtData.model.id));
            var removeAll = evtData.model && evtData.model.deleted;
            var nodes;
            if (removeAll)
                nodes = this.findAllNodes(this.getRefType(evtData.context), modelId, evtData.path);
            else {
                var node = this.findNode(evtData.path);
                nodes = node ? [ node ] : [];
            }
            _.each(nodes, function(node) {
                var selectParent = !this.selectingNode && this.selectedNode && this.selectedPath === this.getNodePath(node);
                var parent = this.getParent(node), deleteNode = node;
                var groupName = this.getGroupValue(parent);
                if (groupName && parent.children && parent.children.length === 1) {
                    deleteNode = parent;
                    parent = this.tree.jstree("get_parent", parent);
                }
                if (selectParent && !evtData.suspendNodeSelection) {
                    /**
                     * Indicates that the view is currently deleting a node.
                     * @name module:nrm-ui/views/contextView#deletingNode
                     * @type {Boolean}
                     */
                    this.deletingNode = !!removeAll;
                    try {
                        this.selectNode(parent);
                    } finally {
                        this.deletingNode = false;
                    }
                }
                else if (selectParent)
                    this.clearSelection();
                this.tree.jstree("delete_node", deleteNode);
            }, this);
        },
        /**
         * Handles the "layout:clearForm" event by removing the node if it is a new model.
         * @param {Object} evtData Event data
         * @param {external:module:backbone.Model} evtData.model Model that was being edited.
         * @param {string} evtData.path The path of the model that was being edited.
         * @param {module:nrm-ui/models/application~ContextConfig} evtData.context The context configuration
         * @param {Boolean} [evtData.suspendNodeSelection=false] Prevent selection of parent node if the removed node
         * or one of its descendents is currently selected.
         * @returns {undefined}
         */
        onCancelEdit: function(evtData) {
            if (evtData.model && evtData.model.isNew()) {
                this.onDelete(evtData);
            }
        },
        /**
         * Handles the Actions button click event to show the context menu.
         * @param {Event} e Event data
         * @returns {undefined}
         */
        showActionsMenu: function(e) {
            if (this.selectedNode) {
                var evt = { "evt" : e, "clickLoc" : false, "$el" : $(e.currentTarget) };
                this.showContextMenu(evt);
                if (!evt.cancel) {
                    e.stopPropagation();
                }
            }
        },
        /**
         * Determines whether search is enabled for a node.
         * @deprecated Displaying the search view was moved to the {@link module:nrm-ui/views/layoutView|LayoutView}
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The context configuration
         * @param {string} nodetype The node type
         * @returns {Boolean}
         */
        isQuickSearchEnabled: function(ctx, nodetype) {
            if (!ctx) return false;
            var isFolder = nodetype === "folder";
            return isFolder && Nrm.app.isQuickSearchEnabled(ctx);
        },
        /**
         * Determines whether advanced search is enabled for a node.
         * @deprecated Default context menu was moved to the {@link module:nrm-ui/views/baseView|BaseView}
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The context configuration
         * @param {string} nodetype The node type
         * @returns {Boolean}
         */
        isAdvancedSearchEnabled: function(ctx, nodetype) {
            if (!ctx) return false;
            var isFolder = nodetype === "folder";
            return isFolder && Nrm.app.isAdvancedSearchEnabled(ctx);
        },
        /**
         * Determines whether spatial search ("Select in Map") is enabled for a node.
         * @deprecated Default context menu was moved to the {@link module:nrm-ui/views/baseView|BaseView}
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The context configuration
         * @param {string} nodetype The node type
         * @returns {Boolean}
         */
        isSpatialSearchEnabled: function(ctx, nodetype) {
            if (!ctx) return false;
            var isFolder = nodetype === "folder";
            return isFolder && Nrm.app.isSpatialSearchEnabled(ctx);
        },
        /**
         * Determines whether spatial actions should be enabled for a node.
         * @param {module:nrm-ui/views/contextView~Node|external:module:jquery} node A JSTree node or JQuery element
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The context configuration
         * @param {external:module:backbone.Model} model The model associated with the node.
         * @returns {Boolean}
         * Returns true if the spatial actions like Pan and Zoom should be enabled.
         */
        isSpatialActionEnabled: function(node, ctx, model) {
            return this.getNodeType(node) !== "folder" && Nrm.app.isSpatialContext(ctx) 
                    && !!Nrm.app.getSpatialType(ctx, model, true);
        },
        /**
         * Create the context menu items for the selected nodes.
         * @param {module:nrm-ui/views/contextView~Node} node The selected node
         * @param {module:nrm-ui/models/application~ContextConfig} ctx The context configuration
         * @param {external:module:backbone.Model} model The model associated with the node.
         * @returns {module:nrm-ui/views/baseView~MenuItemConfig[]}
         */
        loadContextMenu: function(node, ctx, model) {
            var nodetype = this.getNodeType(node);
            if (ctx && nodetype !== "error") {
                return BaseView.getContextItems.call(this, node, {
                    context: ctx,
                    nodetype: nodetype,
                    id: this.getNodeId(node),
                    group: this.getGroupValue(node) || null,
                    model: model,
                    path: this.selectedPath
                });
            } else {
                return [];
            }
        },
        /**
         * Handles the "context:activeRow" or equivalent event
         * @param {Object} e Event data
         * @param {string} e.path The path of the active row.
         * @param {module:nrm-ui/models/application~ContextConfig} e.context The context configuration
         * @param {external:module:backbone.Model} [e.model] Model associated with the active row.
         * @param {Boolean} [e.expandNode=false] Expand the node.
         * @returns {undefined}
         */
        setActiveRow: function(e) {
            if (this.settingActiveRow) return;
            this.settingActiveRow = true;
            try {

                if (!this.selectingNode && e.path && e.path !== this.selectedPath) {
                    this.expandToNode(e.path, function(node) {
                        this.selectNode(node);
                        if (e.expandNode)
                            this.tree.jstree("open_node", node);
                    }, function(node) {
                        console.log("Node for active row not found at " + e.path + ", closest parent: " + (node ? this.getNodePath(node) : null ));
                    });
                }
                if (e.model && !e.model.updatingSelection) {
                    var shapeVal = Nrm.app.isSpatialContext(e.context) &&
                            Nrm.app.getShapeVal(e.context, e.model);
                    if (shapeVal) {
                        var options = { attributes: { id: e.model.id },  pan: !!this.options.panToActiveRow };
                        if (_.isArray(shapeVal)) {
                           // TODO: for now, highlight event only supports a single graphic.
                           options.geometry = shapeVal.length > 0 && shapeVal[0];
                           options.geometries = shapeVal;
                        } else {
                            options.geometry = shapeVal;
                        }
                        /**
                         * Triggered to highlight a graphic
                         * @event module:nrm-ui/event#map:highlightGraphic
                         * @param {Object} options
                         * @param {external:module:esri/Graphic} [options.graphic] The graphic to highlight, must have 
                         * an id attribute.
                         * @param {external:module:esri/geometry/Geometry|Object} [options.geometry] The single geometry 
                         * to highlight.
                         * @param {Array.<external:module:esri/geometry/Geometry|Object>} [options.geometries] Multiple
                         * geometries to highlight.
                         * @param {Object} [options.attributes] An attribute hash.
                         * @param {string|Number} [options.attributes.id] The graphic id, required if using the 
                         * geometry option.
                         */
                        Nrm.event.trigger("map:highlightGraphic", options);
                    }
                }
            } finally {
                this.settingActiveRow = false;
            }
        },
        /**
         * Expand the tree to a navigation path.
         * @param {string} path The target navigation path
         * @param {Function} foundCallback Callback function that will be passed the node associated with the target 
         * path, only called if creating the target node was successful.
         * @param {Function} notFoundCallback Callback function that will be passed the closest ancestor node if 
         * creating the target node was unsuccessful.  The closest ancestor may be undefined if the path parameter 
         * does not correspond to an already loaded node. 
         * @param {Boolean} [preserveSelection=false] Indicates whether we should try to preserve the previously
         * selected node if its parent was reloaded.
         * @returns {undefined}
         */
        expandToNode: function(path, foundCallback, notFoundCallback, preserveSelection) {
            function findAncestor() {
                var node = this.findNode(path);
                if (!node) {
                    var found = this.pathToIdMap && _.reduce(this.pathToIdMap, function(memo, item, key) {
                        if (key.length >= path.length || (memo && memo.length >= key.length)) return memo;
                        var test = key + "/", match = path.slice(0, test.length);
                        return test === match ? key : memo;
                    }, null, this);
                    this.loadNode(found, path, foundCallback, notFoundCallback, preserveSelection);
                } else if (foundCallback) {
                    foundCallback.call(this, node);
                }
            };
            if (!this.tree || !this.tree.jstree("is_loaded", { id: "#" })) {
                this.listenToOnce(this, "rootNodeLoaded", function() {
                   findAncestor.call(this);
                });
            } else {
                findAncestor.call(this);
            }
        },
        /**
         * Handles the "map:endDraw" and "map:featureEdit" events to update the enabled status of spatial menu items.
         * @param {Object} evtData Event data
         * @param {external:module:esri/geometry/Geometry|Object} evtData.geometry The geometry object
         * @returns {undefined}
         */
        onEditGraphicChanged: function(evtData) {
            var enableSpatial = evtData.geometry && !Nrm.app.shapeIsEmpty(evtData.geometry);
            if (this.contextmenu) {
                this.contextmenu.enableSpatial = enableSpatial;
                this.refreshContextMenu();
            }
        },
        /**
         * Update context menu enabled status
         * @returns {undefined}
         */
        refreshContextMenu: function() {
            if (this.contextmenu && this.contextmenu.items) {
                var enableSpatial = this.contextmenu.enableSpatial;
                function reviewEnabledStatus(item) {
                    // note: originally we tried to disable menu items that match the route, this was determined to be too confusing
                    if (item.enableSpatial) {
                        item.disabled = !enableSpatial;
                    }
                    if (item.items)
                        _.each(item.items, reviewEnabledStatus);
                }
                _.each(this.contextmenu.items, reviewEnabledStatus);
            }
        },
        /**
         * Ensure the node is visible, scrolling the panel if necessary
         * @param {external:module:jquery} panel The scrollable container element
         * @param {external:module:jquery} $node The JQuery object representing the node.
         * @returns {undefined}
         */
        scrollNodeIntoView: function(panel, $node) {
            if (!panel || !panel.length || !$node || !$node.length)
                return;
            var p = $node.position();
            var nh = $node.height(), nw = $node.width();
            var h = panel.height(), w = panel.width();
            var bottom = p.top + nh;
            var right = p.left + nw;
            var scroll = { };
            if (panel[0].scrollWidth > w) h = h - this.getScrollbarWidth();
            if (panel[0].scrollHeight > h) w = w - this.getScrollbarWidth();
            if (p.top < 0) {
                scroll.scrollTop = panel.scrollTop() + p.top;
            } else if (bottom > h) {
                scroll.scrollTop = panel.scrollTop() + (nh > h ? p.top : bottom - h);
            }
            if (p.left < 0) {
                scroll.scrollLeft = panel.scrollLeft() + p.left;
            } else if (right > w) {
                scroll.scrollLeft = panel.scrollLeft() + (nw > w ? p.left : right - w);
            }
            if (scroll !== false) {
                panel.animate(scroll, 1);
            }
        },
        /**
         * Resize the height of the Navigator panel to fill unused space in the west panel up to the height of the tree.
         * @function
         */
        adjustTreeHeight: _.debounce(function(e) {
            this.$el.css("overflow-y", "hidden");
            //console.log("adjusting Navigator panel max-height");
            var $navigator = this.getNavigatorPanel();
            if ($navigator && $navigator.length) {
                var maxh = this.$el.height();
                $navigator.siblings().each(function() {
                    maxh -= $(this).outerHeight(true);
                });
                $navigator.parentsUntil(this.$el).each(function() {
                    var $this = $(this);
                    maxh -= ($this.outerHeight(true) - $this.height());
                });
                this.$el.children(':not(#' + this["tree-accordion"].id + ')').each(function() {
                    maxh -= $(this).outerHeight(true);
                });
                if (this.minNavigatorHeight && maxh < this.minNavigatorHeight)
                    maxh = this.minNavigatorHeight;
                var $node = this.selectedNode ? this.tree.jstree("get_node", this.selectedNode, true) : null;
                var p = $node && $node.position();
                var selVisible = p && p.top > 0 && p.top < $navigator.height();
                $navigator.css({ "max-height" : maxh });
                if (selVisible) {
                    this.scrollNodeIntoView($navigator, $node.children('a'));
                }
            }
            this.$el.css("overflow-y", "");
        }, 100),
        /**
         * Get the Navigator panel
         * @returns {external:module:jquery|undefined}
         * Returns the Navigator panel as a JQuery object, or undefined if the application does not have a tree.
         */
        getNavigatorPanel: function() {
            if (this["tree-accordion"] && this["tree-accordion"].controls &&
                    this["tree-accordion"].controls.length)
                return $("#" + this["tree-accordion"].controls[0].id, this.$el);
        },
        /**
         * Get the width of the vertical scrollbar
         * @returns {number} The width of the vertical scrollbar.
         * @see {@link module:nrm-ui/main.getScrollbarWidth|Nrm.getScrollbarWidth}
         */
        getScrollbarWidth: function() {
            return Nrm.getScrollbarWidth();
        }
    });
});
