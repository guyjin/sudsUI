/**
 * @file   The MessageBox module wraps the {@link https://sciactive.com/pnotify/|PNotify plugin} to provide a non-modal
 * message box implementation.
 * @see module:nrm-ui/plugins/messageBox
 */
/** 
 * @module nrm-ui/plugins/messageBox
 */

define(['jquery', '..', 'underscore', 'use!pnotify', 'jquery-ui'], function($, Nrm, _, PNotify, JQueryUI) {
    var aria = "aria-hidden", focusCls = "nrm-reset-focus", badgeSelector = '.navbar .badge-errors';
    function wrapCallback(callback, fn) {
        return function() {
            if (typeof fn === "function")
                fn.apply(this, arguments);
            if (typeof callback === "function")
                return callback.apply(this, arguments);
        };
    }
    function isErrorBadgeVisible() {
        return $(badgeSelector).is(":visible");
    }
    function showErrorBadge() {
        $(badgeSelector).removeAttr(aria).parent().removeClass('hidden');
    }
    function hideErrorBadge() {
        $(badgeSelector).attr(aria, "true").parent().addClass('hidden');
    }
    var m = Nrm.MessageBox = 
            /**
             * Create a new MessageBox. Note that this is not a proper constructor in the traditional sense because it
             * returns a JQuery object instead of an instance of this class, and the new keyword is optional.
             * @todo Upgrade PNotify so that we can link to latest documentation, or find the correct documentation for
             * PNotify 1.2.2 (the earliest tag I could find on GitHub with a README.md file was 1.3.0)
             * @constructor
             * @alias module:nrm-ui/plugins/messageBox
             * @classdesc
             * The MessageBox module wraps the {@link https://sciactive.com/pnotify/|PNotify plugin} to provide a 
             * non-modal message box implementation with default behavior customized for NRM requirements.  
             * @param {string} errorMsg Message HTML string.
             * @param {Object} options
             * @param {string} [options.type="error"] Type of the notice. "notice", "info", "success", or "error".
             * @param {string|Boolean} [options.title] Title of the message box.  Defaults to "Errors" for error type 
             * and "Success" for success type, or false for other values of the type option.
             * @param {string} [options.moreMsg] Detailed message to append to the basic message, initially hidden
             * with a "More" button to show the details.
             * @param {Boolean} [options.hideLessMsg=false] Hide the "Less" message when the "More" message is 
             * displayed.
             * @param {string} [options.style] Style attribute text to add to the message's inner container.
             * @param {Boolean} [options.showErrorBadge] Show the error badge when the message box is closed,
             * and hide it when it is opened, this is the default behavior for the "error" type.
             * @param {string} [options.styling="bootstrap3"] A styling theme, our default overrides the PNotify
             * default.
             * @param {Boolean|string} [options.icon=false] Set to true to use default icon for the type, or any
             * icon class. 
             * @param {Boolean} [options.sticker=false] Provide a button for the user to manually stick the notice.
             * @param {Boolean} [options.history=false] Display a pull down menu to redisplay previous notices, and 
             * place the notice in the history. 
             * @param {Boolean} [options.closer_hover=false] Only show the closer button on hover.
             * @param {Boolean} [options.hide=false] After a delay, remove the notice.
             * @param {string} [options.addclass="NRMerrorBox stack_topleft"] Class to add to the outer container.
             * @param {Boolean} [options.collapsible=false] Add a button to collapse or expand content.
             * @param {Boolean} [options.movable=false] Allow message box to be dragged.
             * @param {string} [options.helpContext] Online help refID or absolute URL. Results in a "Help" hyperlink
             * after the errorMsg.
             * @returns {external:module:jquery}
             * Returns a JQuery object that is extended with PNotify class members.  
             * @see {@link https://github.com/sciactive/pnotify/tree/1.3.0|PNotify 1.3.0} for documentation of more 
             * configuration defaults and options not listed here.  Be aware that we are currently using 1.2.2 so
             * the configuration options supported in our version might be a little different.
             */ 
            function(errorMsg,options) {
    // dependent upon jquery.pnotify  

        if (!m.stack) {
            m.stack = {
                "dir1": "down", "dir2": "left", 
                //"push": "top", 
                "firstpos1": 25, "firstpos2": 0
                ,"spacing1": 10, "spacing2": 5
            };
        }
        var defaults = {
            styling: "bootstrap3",
            type: "error",
            icon: false,
            sticker: false,
            history: false,
            closer_hover: false,
            hide: false,
            stack: m.stack,
            addclass: "stack-topleft"
            //style: "overflow-y:auto; height:100px;"
        };

        var resetFocus, properties = $.extend({},defaults, options);
        if (properties.title === undefined) {
            if (properties.type === "error") {
                if (properties.showErrorBadge === void 0 && properties.type === "error")
                    properties.showErrorBadge = true;
                properties.title = "Errors";
            } else if (properties.type === "success") {
                properties.title = "Success";
            }
        }
        properties.before_close = wrapCallback(properties.before_close, function() {
            if (properties.showErrorBadge)
                showErrorBadge();
        });
        properties.after_open = wrapCallback(properties.after_open, function(p) {
            var focusEl = properties.focusEl && $(properties.focusEl);
            if ((!focusEl || !focusEl.length) && document.activeElement) {
                focusEl = $(document.activeElement);
            }
            if (focusEl && focusEl.length) {
                resetFocus = _.uniqueId(focusCls);
                focusEl.addClass(resetFocus);
            }
                
            $('.ui-pnotify-closer', p).attr("tabindex", "0").on("keydown", function(e) {
                if (e.which === 13)
                    p.pnotify_remove();
            });
            $('.ui-pnotify-container', p).on("focusin", function(e) { e.stopPropagation(); })
                    .attr({ "tabindex": "0", "role" : "alertdialog" }).on("keydown", function(e) {
                        if (e.which === 27)
                            p.pnotify_remove();
                    }).focus();
            if (properties.showErrorBadge)
                hideErrorBadge();
        });
        properties.after_close = wrapCallback(properties.after_close, function() {
            if (resetFocus) {
                $("." + resetFocus).removeClass(resetFocus).focus();
            }
            if (this.remove) {
                var pnotifyData = $(window).data('pnotify'), idx;
                if (_.isArray(pnotifyData)) {
                    // fix memory leak
                    idx = _.indexOf(pnotifyData, r);
                    if (idx > -1) {
                        pnotifyData.splice(idx, 1);
                    }
                }
                var s = this.stack;
                if (s) {
                    s.nextpos1 = s.firstpos1;
                    s.nextpos2 = s.firstpos2;
                    s.addpos2 = 0;
                    s.animation = true;
                }
            }
        });
        if (properties.helpContext) {
            var url = Nrm.app.resolveHelpUrl(properties.helpContext);
            if (url) {
                errorMsg += '<p><a target="_blank" href="' + url + '">Help</a></p>';
            }
        }
        if (properties.moreMsg) {
            var d = $('<div class="less-message"></div>').append(errorMsg);
            errorMsg = d[0].outerHTML;
            errorMsg += '<button type="button" class="btn btn-default btn-xs">More</button> \n\n';
            var dd = $('<div class="more-message" aria-hidden="true" aria-live="polite"></div>').append(properties.moreMsg);
            errorMsg += dd[0].outerHTML + "\n";
        }
        var d = $('<div></div>', {style: properties.style}).append(errorMsg);
        properties.text = d[0].outerHTML;
        var r = $.pnotify(properties);
        if (properties.collapsible) {
            var $b = $('<div class="nrm-ui-pnotify-collapser">'
                    + '<span class="glyphicon-chevron-down glyphicon" title="Show/Hide content"></span></div>');
            $(".ui-pnotify-closer", r).after($b);
            $b.on("click", function(event){
                $("span", $b).toggleClass("glyphicon-chevron-down").toggleClass("glyphicon-chevron-right");
                $b.siblings(".ui-pnotify-text").toggleClass("hidden");
            });
        }
        if (properties.movable) {
            r.draggable({handle: ".ui-pnotify-title", stop: function(event, ui){r.css("opacity", "1");}});
            r.draggable("option", "opacity", 0.85);
            $(".ui-draggable-handle", r)
                    .mousedown(function(e){r.css("opacity", "0.85");})
                    .mouseup(function(e){r.css("opacity", "1");});
        }
        function hide($hidden) {
            return $hidden.hide().attr(aria, "true");
        }
        function show($hidden) {
            return $hidden.attr(aria, "false").show();
        }
        if (properties.moreMsg) {
            var lessMsg = $('.less-message',r);
            var moreMsg = hide($('.more-message',r));
            var v = $('button',r).on('click',function(){
                var t = v.text();
                if (t === "More") {
                    properties.hideLessMsg && hide(lessMsg); 
                    show(moreMsg);
                    v.text("Less");
                } else {
                    properties.hideLessMsg && show(lessMsg);
                    hide(moreMsg);
                    v.text("More");
                }
            });
        }
        return r;
    };
    /**
     * Indicates whether the error badge on the nav bar is currently visible.
     * @name module:nrm-ui/plugins/messageBox.isErrorBadgeVisible
     * @function
     * @returns {Boolean}
     */
    m.isErrorBadgeVisible = isErrorBadgeVisible;
    /**
     * Show the error badge on the nav bar.
     * @name module:nrm-ui/plugins/messageBox.showErrorBadge
     * @function
     * @returns {undefined}
     */
    m.showErrorBadge = showErrorBadge;
    /**
     * Hide the error badge on the nav bar.
     * @name module:nrm-ui/plugins/messageBox.hideErrorBadge
     * @function
     * @returns {undefined}
     */
    m.hideErrorBadge = hideErrorBadge;
    return m;
});
