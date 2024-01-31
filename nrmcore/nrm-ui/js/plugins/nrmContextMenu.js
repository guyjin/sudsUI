/**
 * @file  JQuery plugin that provides context menu behavior. 
 * @see module:nrm-ui/plugins/nrmContextMenu
 */

/** 
 * @module nrm-ui/plugins/nrmContextMenu
 * 
 */
define(['jquery', '..', 'use!bootstrap'], function($, Nrm) {
    /*
     * NOTE: full functionality for keyboard access to embedded form elements
     * requires jquery.ui.core, which is included in nrmcore/layout/jquery-ui-latest.js
     * which is also required for resizable NrmLayout.
     * An application that uses NrmContextMenu but doesn't need resizable NrmLayout
     * could include jquery.ui.core.js from
     * https://github.com/jquery/jquery-ui/blob/master/ui/core.js
     *
     */
    var NrmContextMenu = function(element) {
        var $dropdown = $(element);
        var id = element.id;
        var $menu = $dropdown.parent();
        var hideMenu = function(e) {
            if ($menu.hasClass("open")) {
                $dropdown.dropdown("toggle");
            }
        };
        function hideMenuOnScrollPanel(e) {
            if ($("#" + id, e.currentTarget).length === 0)
                hideMenu(e);
        };
        var cancelEvent = function(e) {
            e.stopPropagation();
            e.preventDefault();
        };
        var onRightArrow = function(e) {
            if (e.which === 39) {
                // right arrow
                var $el = $(this).parent();
                $el.addClass("open");
                $el.find("ul a").first().focus();
            }
        };
        var submenuKeyHandler = function(e) {
            if (e.which === 37) {
                // left arrow
                var $el = $(this).parent();
                $el.removeClass("open");
                $el.children().first().focus();
            } //else if (e.which === 27) {
            //    hideMenu();
            //}
        };
        var tabKeyHandler = function(e) {
            if (e.which === 9 || e.which === 27) {
                var $target = $(".nrm-ctxmnu-toggle");
                hideMenu(e);
                $target.focus();
                if (e.which === 27) {
                    e.stopPropagation();
                }
            }
        };
        var upDownKeyHandler = function(e) {
            if (e.which === 38 || e.which === 40) {
                var $this = $(this);
                cancelEvent(e);

                if ($menu.is('.disabled, :disabled')) return;

                // this is adapted from Bootstrap keydown handler, which doesn't work well with input elements.
                //var $items = $('[role=menu] li:not(.divider):visible a', $parent)
                // do we have jQuery UI?
                var focusable = Nrm.getFocusableSelector();
                var $items = $('li:not(.divider):visible ' + focusable, $this);

                if (!$items.length) return;
                var index = $items.index($items.filter(':focus'));

                if (e.keyCode === 38 && index > 0)                 index--;  // up
                if (e.keyCode === 40 && index < $items.length - 1) index++;   // down
                if (!~index)                                       index=0;

                $items.eq(index).focus();
            }
        };
        $menu.on("show.bs.dropdown", function() {
            if ($(".nrm-ctxmnu-toggle").length === 0)
                $dropdown.addClass("nrm-ctxmnu-toggle");
            $(document).on("contextmenu.nrm.contextmenu", hideMenu);
            $(window).on("blur.nrm.contextmenu", hideMenu);
            $(".ui-layout-pane,.panel-collapse").on("scroll.nrm.contextmenu", hideMenuOnScrollPanel);
            Nrm.event.on("layout:reset", hideMenu);
        }).on("hide.bs.dropdown", function() {
            $(document).off("contextmenu.nrm.contextmenu");
            $(window).off("blur.nrm.contextmenu");
            $(".ui-layout-pane,.panel-collapse").off("scroll.nrm.contextmenu");
            $menu.off(".nrm.contextmenu");
            $(".nrm-ctxmnu-toggle").removeClass("nrm-ctxmnu-toggle");
        }).on("contextmenu", "ul", cancelEvent)
          .on("click", ".disabled>a,.dropdown-submenu>a", cancelEvent)
          .on("keydown", ".dropdown-submenu>a", onRightArrow)
          .on("keydown", ".dropdown-submenu>.dropdown-menu", submenuKeyHandler)
          .on("keydown", tabKeyHandler)
          .on("keydown", "[role=menu]", upDownKeyHandler);

         return this;
    };

    /**
     * Hide the menu if it is currently open.
     * @instance
     * @function hideMenu
     * @example 
     * require(['jquery', 'nrm-ui/plugins/nrmContextMenu'], function($, NrmTextArea) {
     *   // hide the menu on a dropdown button with id="nrmContextMenuBtn"
     *   $('#nrmContextMenuBtn').nrmContextMenu('hideMenu');
     * });
     */
    NrmContextMenu.prototype.hideMenu = function() {
        if (this.parent().hasClass("open")) {
            this.dropdown("toggle");
        }
        return this;
    };

    /**
     * Show the menu.
     * @todo Allow HTML string as well as a JQuery object for the menu option.
     * @instance
     * @function showMenu
     * @param {Object} e Options
     * @param {Event} e.evt The event data, may be a "click" event, "contextmenu" event, etc.
     * @param {Boolean} [e.clickLoc=false] Show the menu at the clicked location.
     * @param {external:module:jquery} [e.$el] Target element to position the menu.  If this option is omitted, and the 
     * clickLoc option is omitted or false, then the menu will be positioned relative to the currentTarget of the event.
     * @param {external:module:jquery} [e.menu] The menu HTML as a JQuery object, to override the menu already associated
     * with the dropdown button.
     * @param {Object<string,Function>} [e.clickEvents] Hash of click event handlers to delegate on the menu. Keys should
     * be selectors of elements found in the menu, values are the event handlers for the click event.
     * @param {Boolean} [e.cancel=false] Do not show the menu.
     * @example <caption>Show context menu at clicked location</caption>
     * require(['jquery', 'nrm-ui/plugins/nrmContextMenu'], function($, NrmContextMenu) {
     * 
     *   var $contextMenuBtn = $('#nrmContextMenu').nrmContextMenu();
     *   // listen to the contextmenu event to show a context menu at the location of the click.
     *   $('#contextMenuProvider').on('contextmenu', function(event) {
     *      $('#nrmContextMenuBtn').nrmContextMenu('showMenu', {
     *         evt: event,
     *         clickLoc: true
     *      });
     *   });
     * });
     * @example <caption>Show context menu relative to a target element</caption>
     * require(['jquery', 'nrm-ui/plugins/nrmContextMenu'], function($, NrmContextMenu) {
     * 
     *   var $contextMenuBtn = $('#nrmContextMenu').nrmContextMenu();
     *   // listen to the contextmenu event to show a context menu relative to the target of the event.
     *   $('#contextMenuProvider').on('contextmenu', function(event) {
     *      $('#nrmContextMenuBtn').nrmContextMenu('showMenu', {
     *         evt: event,
     *         $el: $(event.target) // menu would be positioned relative to $(event.currentTarget) without this option.
     *      });
     *   });
     * });
     */
    NrmContextMenu.prototype.showMenu = function(e) {
       var $menu = this.parent();
       if (!e.cancel) {
           var $dropdownMenu = e.menu;
           if ($dropdownMenu) {
               var $lc = $menu.children().last();
               if ($lc.is("ul"))
                  $lc.replaceWith($dropdownMenu);
              else
                  $lc.after($dropdownMenu);
           } else {
               $dropdownMenu = $menu.children("ul");
           }

            // note: offset logic is naively assuming the document scroll position is always at 0,0
            //  This should always be true for an application using NRM standard layout.
            //  I didn't have a good test case for a scenario where this is not true, so didn't bother coding for it.
            //  If we need to support that scenario, I would expect this code will need some tweaks.
           var target, top, left;
           var $doc = $(document);
            var h = $dropdownMenu.outerHeight();
            var w = $dropdownMenu.outerWidth();
           if (e.clickLoc) {
               top = e.evt.pageY;
               left = e.evt.pageX;
               if (top + h > $doc.height()) {
                   top = top - h;
                   if (top < 0) top = 0;
               }
               if (left + w > $doc.width()) {
                   left = left - w;
                   if (left < 0) left = 0;
               }
           } else if (e.$el || e.evt) {
               target = e.$el || $(e.evt.currentTarget);
               var pos = target.offset();
               if (target.parent().is(".dropup")) {
                   top = pos.top - h;
               } else {
                   top = pos.top + target.outerHeight();
               }
               left = pos.left;
               var pullRight = target.parent().is(".pull-right");
               if (pullRight) {
                   left = left + target.outerWidth() - w;
               }
               // A pull-right dropdown in west panel might have negative left coord if the menu width is abnormally large.
               // Another alternative for handling this would be to ignore the pull-right directive and align menu to left edge of target.
               if (left < 0) left = 0;
               if (top + h > $doc.height()) {
                   var altTop = top - h;
                   var altLeft = pullRight ? pos.left - w : left + target.outerWidth();
                   var docWidth = $doc.width();
                   if (altLeft < 0 || altLeft + w > docWidth) {
                       altLeft = pullRight ? pos.left + target.outerWidth() : left - w;
                   }
                   if (altLeft >= 0 && altTop >= 0 && altLeft + w <= docWidth) {
                       top = altTop;
                       left = altLeft;
                   }
               }
           }
           $menu.offset({top: top, left: left });
           if ($menu.hasClass("open") && !(target && target.hasClass("nrm-ctxmnu-toggle"))) {
                // menu is open for a different target element, toggle closed.
                this.dropdown("toggle");
           }
           if (target) target.addClass("nrm-ctxmnu-toggle");
           if (e.clickEvents) {
               $.each(e.clickEvents, function(key, value) {
                  $menu.on("click.nrm.contextmenu", key,  function(e) {
                      if ($(e.target).parent().is(".disabled"))
                          e.preventDefault();
                      else
                          value.apply(this, arguments);
                  });
               });
           }
           this.dropdown("toggle");
       }
       return this;
    };
    /**
     * Enable the nrmContextMenu plugin on a dropdown button.  
     * This is actually the plugin function (jQuery.fn.nrmContextMenu) and module return value, not a constructor.  
     * See the example below for usage.
     * @class
     * @alias module:nrm-ui/plugins/nrmContextMenu
     * @classdesc JQuery plugin that attaches to a 
     * {@link http://getbootstrap.com/javascript/#dropdowns|Twitter Bootstrap Dropdown} button so that the dropdown 
     * menu acts as a context menu.
     * @param {string} [option] - One of the method names identified in this documentation as an instance method.
     * @param {Object} [e] - Options to pass to the plugin method specified as the option parameter.  
     * 
     * @example <caption>Plugin usage</caption>
     * // Given a DOM element as follows:
     * // <div class="dropdown">
     * //   <button id="nrmContextMenuBtn" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
     * //     Dropdown trigger
     * //     <span class="caret"></span>
     * //   </button>
     * //   <ul class="dropdown-menu" aria-labelledby="nrmContextMenuBtn">
     * //     ...
     * //   </ul>
     * // </div>
     * //
     * 
     * require(['jquery', 'nrm-ui/plugins/nrmContextMenu'], function($, NrmContextMenu) {
     *   // initialize the nrmContextMenu plugin on the dropdown button element
     *   var $dropdownBtn = $('#nrmContextMenuBtn').nrmContextMenu();
     * });
     */
     $.fn.nrmContextMenu = function (option, e) {
        return this.each(function () {
          var $this = $(this);
          var data  = $this.data('nrmContextMenu');

          if (!data) $this.data('nrmContextMenu', (data = new NrmContextMenu(this)));
          if (typeof option === "string") data[option].call($this, e);
        });
      };

      $.fn.nrmContextMenu.Constructor = NrmContextMenu;
      $(document).on('click.nrm.contextmenu.data-api', '[data-toggle=nrm-dropdown]', function(e) {
          var $this = $(this);
          var menuTarget = $this.attr("data-target");
          if (!menuTarget) return;
          e.preventDefault();
          var options = { "evt" : e, "clickLoc" : false, "$el" : $this };
          $(menuTarget).nrmContextMenu("showMenu", options);
          e.stopPropagation();
      });
      $(document).on('contextmenu.nrm.contextmenu.data-api', '[data-toggle=nrm-contextmenu]', function(e) {
          var $this = $(this);
          var menuTarget = $this.attr("data-target");
          if (!menuTarget) return;
          e.preventDefault();
          var options = { "evt" : e, "clickLoc" : true };
          $(menuTarget).nrmContextMenu("showMenu", options);
          e.stopPropagation();
      });
      $(document).on('click', '.dropdown-menu .form-group', function (e) { 
          e.stopPropagation(); 
      });
      return $.fn.nrmContextMenu;
});