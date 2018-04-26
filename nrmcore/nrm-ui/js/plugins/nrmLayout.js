/**
 * @file  JQuery plugin that wraps the {@link http://layout.jquery-dev.com/|JQuery UI Layout plugin} to
 * provide a multi-panel layout customized for NRM requirements. 
 * @see module:nrm-ui/plugins/nrmLayout
 */
/**
 * @module nrm-ui/plugins/nrmLayout
 */
/**
 * Options for rendering content in a pane.
 * @typedef {Object} RenderPaneOptions
 * @property {Boolean} [append=false] Append to existing content
 * @proeprty {Boolean} [prepend=false] Prepend to existing content
 */
/**
 * Initialization options for the nrmLayout plugin, in addition to initialization options for the JQuery UI 
 * Layout plugin, the nrmLayout supports a few additional options documented below.  
 * @typedef {Object} LayoutConfig
 * @property {string} [options.layout="#nrm-layout"] Selector for the element that provides the layout content.
 * @property {string} [options.container="body"] Selector for the target container, the JQuery UI Layout plugin will be 
 * initialized on this element.
 * @property {Number} [options.keyboardResize=5] Number of pixels to move per keydown event.
 * @property {Number} [options.keyboardResizeDelay=100] Delay in milliseconds between mousemove events triggered by 
 * keyboard
 * @property {Boolean} [options.enableSkipToTop=false] Enable "skip to top" functionality (experimental)
 * @property {Boolean} [options.mapPane=true] Enable map pane
 * @property {Boolean} [options.westPane=true] Enable west pane
 * @property {Boolean} [options.eastPane=false] Enable east pane
 * @property {Boolean} [options.southPane=true] Enable south pane
 * @see {@link http://layout.jquery-dev.com/documentation.html|JQuery UI Layout documentation} for a complete
 * list of initialization options, we use the <strong>List format</strong> for options.
 */
define(['jquery', '..', 'underscore', 'use!jquery-layout', './nrmLoadingIndicator'], function($, Nrm, _) {
    
    function renderPane(pane,html,options) {
        pane = $(pane);
        if (options !== undefined)
        {
            if (options.append) {
                pane.append(html);
            }
            if (options.prepend) {
                pane.prepend(html);
            }
        } else {
            pane.html(html);
        }
    };
    var defaultPaneSelector = '.ui-layout-data', 
            $mainContent = $('<a/>', {
                "id": "main-content",
                "name": "main-content",
                "class": "sr-only",
                "tabindex": "-1"
            }).text("Main content");
    
    /**
     * Applies the NrmLayout plugin to a JQuery object.
     * This is actually the plugin function (jQuery.fn.nrmLayout) and module return value, not a constructor.  
     * @constructor
     * @alias module:nrm-ui/plugins/nrmLayout
     * @classdesc
     * The nrmLayout JQuery plugin wraps the {@link http://layout.jquery-dev.com/|JQuery UI Layout plugin} to
     * provide a multi-panel layout customized for NRM requirements. 
     * @param {module:nrm-ui/plugins/nrmLayout~LayoutConfig} options Initialzation options
     * @returns {external:module:jquery}
     * Original JQuery object extended with nrmLayout instance members.
     */
    var NrmLayout = function(options) {
        var oLayout = this;
        
        function selectorForPane(pane) {
            var selector;
            switch (pane) {
                case 'west':
                    selector = '.ui-layout-west';
                    break;
                case 'map':
                case 'north':
                    selector = '.ui-layout-north';
                    break;
                case 'east':
                    selector = '.ui-layout-east';
                    break;
                case 'south':
                    selector = '.ui-layout-south';
                    break;
                case 'all':
                    selector = properties.container;
                    break;
                default:
                    selector = defaultPaneSelector;
                    break;
            } 
            return selector;
        }

        var eventHandlers = {
            "renderDataPane": function(html,options) {
                var pane = $(selectorForPane('data'));
                renderPane(pane,html,options);
                if ($('#main-content').length === 0) {
                    renderPane(pane, $mainContent, { prepend: true });
                }
            },
            "renderMapPane": function(html,options) { 
                renderPane(selectorForPane('north'),html,options);
            },
            "renderWestPane": function(html,options) { 
                renderPane(selectorForPane('west'),html,options);
            },
            /**
             * Render content in the east pane
             * @event module:nrm-ui/event#renderEastPane
             * @param {string|external:module:jquery} html The content to render
             * @param {module:nrm-ui/plugins/nrmLayout~RenderPaneOptions} [options]
             */
            "renderEastPane": function(html,options) { 
                renderPane(selectorForPane('east'),html,options);
            },
            /**
             * Render content in the south pane
             * @event module:nrm-ui/event#renderSouthPane
             * @param {string|external:module:jquery} html The content to render
             * @param {module:nrm-ui/plugins/nrmLayout~RenderPaneOptions} [options]
             */
            "renderSouthPane": function(html,options) { 
                renderPane(selectorForPane('south'),html,options);
            },
            /**
             * Activate or deactivate the loading indicator for a layout pane
             * @event module:nrm-ui/event#busyChanged
             * @param {string} [pane] The layout pane name, one of "all", "data", "west", "east", "south", or "north".  
             * The value "map" is also accepted and is considered synonymous for "north".  Any unrecognized values will 
             * be interpreted as the default pane which is "data".
             * @param {boolean} busy Indicates whether the loading indicator should be activated (true) or deactivated (false)
             * @param {module:nrm-ui/plugins/nrmLoadingIndicator~PluginOptions} [options] Options to pass to the loading
             * indicator plugin.
             */
            "busyChanged": function(pane, busy, options) {
                var selector = selectorForPane(pane);
                if (selector === defaultPaneSelector) {
                    Nrm.setLoadingIndicatorEnabled(!busy);
                }
                if (busy) {
                    $(selector).nrmLoadingIndicator('activate', options);
                } else {
                    $(selector).nrmLoadingIndicator('deactivate');
                }
            }
        };
        
        var defaults = {
            layout: "#nrm-layout",
            container: "body",
            keyboardResize: 5, // number of pixels to move per keydown event
            keyboardResizeDelay: 100, // delay in milliseconds between mousemove events triggered by keyboard
            enableSkipToTop: false,
            mapPane: true,
            westPane: true,
            eastPane: false,
            southPane: true,

            closable: true,             // pane can open & close
        	resizable: true,            // when open, pane can be resized
        	slidable: true,             // when closed, pane can 'slide' open over other panes - closes on mouse-out
        	livePaneResizing: true,

            // some resizing/toggling settings
        	south__resizable: false,	// OVERRIDE the pane-default of 'resizable=true'
        	south__spacing_open: 0,		// no resizer-bar when open (zero height)
        	south__spacing_closed: 20,	// big resizer-bar when open (zero height)

            // some pane-size settings
            //north__minSize:	100,
            west__size:	300,
            west__minSize: 100,
            east__size: 300,
            east__minSize: 200,
            east__maxSize: .5,          // 50% of layout width
            east__initClosed: true,
            center__minWidth: 100,

            togglerContent_open: '<div class="ui-custom"></div>',
            togglerContent_closed: '<div class="ui-custom"></div>',

           
            // enable state management
            stateManagement__enabled: true, // automatic cookie load & save enabled by default
            //showDebugMessages: true, // log and/or display messages from debugging & testing code

             onshow: onReset,
             onopen: onReset,
             onresize: onReset
        };
        var mapPaneDefaults = {
                minSize: 100,           // ALL panes
                north__size: 300,
                onshow: onShowMap,
                onopen: onShowMap,
                onresize: onReset,
                onclose_start: onHideMap,
                onhide_start: onHideMap,

                togglerContent_open: '<div class="ui-custom"></div>',
                togglerContent_closed: '<div class="ui-custom"></div>'
            };
        var properties = $.extend({},defaults, options);
        if (properties.enableSkipToTop) {
            $mainContent.attr("href", "#top").addClass("nrm-main-content").text("Back to top");
        }
        //add panes
        var l = $(properties.layout,oLayout);

        var centerPanel = $('.ui-layout-center', l);
        if (properties.mapPane) {
            properties.center__childOptions = $.extend({ }, mapPaneDefaults, properties.center__childOptions);
            var mapHtml = '<div class="ui-layout-north nopadding"></div>';
            if (centerPanel.length === 1)
                centerPanel.html(mapHtml + '<div class="ui-layout-center ui-layout-data"></div>');
            else {
                centerPanel.last().addClass('ui-layout-data');
                centerPanel.first().prepend(mapHtml);
            }
        } else {
            centerPanel.last().addClass('ui-layout-data');
        }
        
        var c = $(l).children(), container = $(properties.container);
        container.append(c);
        var focusable = ".ui-layout-toggler", resizerKey = "nrm.layout.resizer", 
                shift = $.isNumeric(properties.keyboardResize) ? properties.keyboardResize : 0,
                keyDelay = $.isNumeric(properties.keyboardResizeDelay) ? properties.keyboardResizeDelay : 0;
        function triggerResize(e, shiftX, shiftY) {
            var $target = $(e.target), data = $target.data(resizerKey), newEvent = {
               target: e.target,
               relatedTarget: e.relatedTarget,
               button: 0,
               which: 1
           };
           /*if ((shiftX && !$target.is(focusable + "-west," + focusable + "-east")) ||
               (shiftY && !$target.is(focusable + "-north," + focusable + "-south"))) {
               return;
           }*/
           if (!data || !data.resizing) {
               var rect = e.target.getBoundingClientRect();
               data = { 
                   resizing: true, 
                   pageX: rect.left + (rect.right - rect.left)/2,
                   pageY: rect.top + (rect.bottom - rect.top)/2
               };
               $target.data(resizerKey, data);
               newEvent.pageX = data.pageX;
               newEvent.pageY = data.pageY;
               $target.trigger($.Event("mousedown", newEvent));
           }
           newEvent.pageX = data.pageX = data.pageX + shiftX;
           newEvent.pageY = data.pageY = data.pageY + shiftY; 
           //console.log("pageX: " + data.pageX + " pageY: " + data.pageY);
           $target.trigger($.Event("mousemove", newEvent));
           $target.data(resizerKey, data);           
        }
        var throttledResize = keyDelay ? _.throttle(triggerResize, keyDelay, { trailing: false }) : triggerResize;
        /**
         * The JQuery UI Layout plugin instance.
         * @type {external:module:jquery-layout}
         */
        this.myLayout = container.on("keydown.nrm.layout", focusable + "-west," + focusable + "-east", function(e) {
                var shiftX = e.which === 37 ? -1 * shift : (e.which === 39 ? shift : 0);
                if (shiftX) {
                    throttledResize.call(this, e, shiftX, 0);
                }
            }).on("keydown.nrm.layout", focusable + "-north," + focusable + "-south", function(e) {
                var shiftY = e.which === 38 ? -1 * shift : (e.which === 40 ? shift : 0);
                if (shiftY) {
                    throttledResize.call(this, e, 0, shiftY);
                }
            }).on("keyup.nrm.layout", focusable, function(e) {
                if (e.which === 13) {
                    $(e.target).click();
                } else if (e.which === 37 || e.which === 38 || e.which === 39 || e.which === 40) {
                    var $target = $(e.target), data = $target.data(resizerKey);
                    if (data) {
                        $target.trigger($.Event("mouseup", {
                            target: e.target,
                            relatedTarget: e.relatedTarget,
                            button: 0,
                            which: 1,
                            pageX: data.pageX,
                            pageY: data.pageY
                         }));               
                        $target.data(resizerKey, { resizing : false });
                    }
                }
            }).data('nrm-layout-events', eventHandlers)
                    .layout(properties);
            
        Nrm.event.on(eventHandlers);
        
        if (!properties.eastPane) {
            this.myLayout.hide("east");
        }
        if (!properties.westPane) {
            this.myLayout.hide("west");
        }
        if (!properties.southPane) {
            this.myLayout.hide("south");
        }
        $(focusable, container).attr("tabindex", "0");
        if($.fn.addTouch) {
            $('.ui-layout-resizer').addTouch();
        }

        function onShowMap() {
            /**
             * Triggered when the map layout pane opens.
             * @event module:nrm-ui/event#layout:showMap
             */
            Nrm.event.trigger("layout:showMap");
        }

        function onHideMap() {
            /**
             * Triggered when the map layout pane closes.
             * @event module:nrm-ui/event#layout:hideMap
             */
            Nrm.event.trigger("layout:hideMap");
        }
        var simulateResize = _.throttle(function(el) {
                el.resize(); // fixes select2 and datepicker reposition
            }, 100, { leading: false });
        function onReset(name, el) {
            /**
             * Triggered when a layout pane opens, closes or resizes.  This event might fire many times in quick
             * succession, so it might be a good idea to throttle the event handler if it does any significant
             * processing.
             * @event module:nrm-ui/event#layout:reset
             */
            Nrm.event.trigger("layout:reset");
            if (name === "center")
                simulateResize(el);
        }

        function toggleLiveResizing () {
            $.each( $.layout.config.borderPanes, function (i, pane) {
                var o = this.myLayout.options[ pane ];
                o.livePaneResizing = !o.livePaneResizing;
            });
        };

        function toggleStateManagement ( skipAlert, mode ) {
            if (!$.layout.plugins.stateManagement) return;

            var options	= this.myLayout.options.stateManagement
            ,	enabled	= options.enabled // current setting
            ;
            if ($.type( mode ) === "boolean") {
                if (enabled === mode) return; // already correct
                enabled	= options.enabled = mode
            }
            else
                enabled	= options.enabled = !enabled; // toggle option

            if (!enabled) { // if disabling state management...
                this.myLayout.deleteCookie(); // ...clear cookie so will NOT be found on next refresh
                if (!skipAlert)
                    alert( 'This layout will reload as the options specify \nwhen the page is refreshed.' );
            }
            else if (!skipAlert)
                alert( 'This layout will save & restore its last state \nwhen the page is refreshed.' );

            // update text on button
            var $Btn = $('#btnToggleState'), text = $Btn.html();
            if (enabled)
                $Btn.html( text.replace(/Enable/i, "Disable") );
            else
                $Btn.html( text.replace(/Disable/i, "Enable") );
        };

        // set EVERY 'state' here so will undo ALL layout changes
        // used by the 'Reset State' button: myLayout.loadState( stateResetSettings )
        var stateResetSettings = {
            south__size:		"auto",
        	south__initClosed:	false,
        	south__initHidden:	false,
        	west__size:			200,
        	west__initClosed:	false,
        	west__initHidden:	false,
        	east__size:			300,
        	east__initClosed:	false,
        	east__initHidden:	false
        };

        return this;
    };
    $.layout.onDestroy.push(function(layout) {
        layout.container.off(".nrm.layout");
        var events = layout.container.data('nrm-layout-events');
        if (events) {
            _.each(events, function(handler, key) {
                Nrm.event.off(key, handler);
            });
        }
    });
    return $.fn.nrmLayout = NrmLayout;
});