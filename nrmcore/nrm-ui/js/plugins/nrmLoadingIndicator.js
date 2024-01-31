/**
 * @file        NRM Loading Indicator plugin
 * @author      John Simonitch
 * @see module:nrm-ui/plugins/nrmLoadingIndicator
 */
/**
 * @module nrm-ui/plugins/nrmLoadingIndicator
 */
define(['jquery', 'underscore', '..'], function($, _, Nrm) {
    
    /**
     * Plugin options for the NRM Loading Indicator plugin.
     * @typedef PluginOptions
     * @property {boolean} [activate] Indicates that the loading indicator should be activated when the plugin 
     * @property {number} [opacity=0.5] Opacity, a percentage between 0 and 1.  Default is set in css.
     * @property {string} [statusText="Content is loading"] Status text to show in tooltip.
     * @property {string} [size] Can be set to "small" or "large" to show a smaller or larger indicator. 
     * @property {boolean} [wrap] Indicates that the element should be wrapped to avoid positioning conflicts, normally 
     * this is detected automatically.
     * initializes. 
     */

    /**
     * Create a new instance of the NrmLoadingIndicator plugin.  Not intended for direct use in application code.
     * @class NrmLoadingIndicator
     * @private
     * @param {HTMLElement} el The DOM element.
     * @param {module:nrm-ui/plugins/nrmLoadingIndicator~PluginOptions} [options] Options to override defaults. 
     */
    var NrmLoadingIndicator = function(el, options) {
        this.element = $(el);
        // soft dependency on Jquery UI "tabbable" pseudo-selector
        // uses a close approximation if the pseudo-selector is not defined that supports commonly used elements, but 
        // does not include embedded objects and image maps (unless they have tabindex attribute set to "0")
        this.tabbableSelector = Nrm.getTabbableSelector();
        this.options = $.extend({
            statusText: 'Content is loading'
        }, options);
        
        //initContainer.call(this, $(el));
        if (this.options.activate) {
            //delete this.options.activate;
            this.activate();
        }
        return this;
    };
    
    function initContainer($el, options) {
        if (options) {
            this.options = $.extend({}, this.options, options);
        }
        if (this.container) {
            if (this.initialized && options) {
                setOptions.call(this, this.options);
            } else if (this.wrappedInner && !$.contains(this.element[0], this.container[0])) {
                // contents were replaced, container is no longer valid
                this.container = null;
            } else if (options) {
                this.container.nrmLoadingIndicator('activate', this.options);
            }
            if (this.container) {
                return false;
            }
        }
        
        var wrapper, id;
        if ($el.is('.select2-offscreen')) {
            wrapper = $('.select2-container', $el.parent());
        } else if ($el.is('input[type="radio"]')) {
            wrapper = $el.closest('#' + $el.attr('name'));
            if (!wrapper.length) {
                wrapper = $el.parent().filter('label');
            }
        } else if ($el.is('input[type="hidden"]')) {
            wrapper = $el.parent();
        } else if ($el.is('input[type="checkbox"]')) {
            wrapper = $el.parent().filter('label');
        } else if (this.options.wrap || $el.is('select,textarea,input')) {
            wrapper = true;
        }
        if (wrapper && !wrapper.length) {
            wrapper = $el.closest('.input-group');
            if (!wrapper.length) {
                this.wrapped = true;
                wrapper = $('<div>');
                wrapper = $el.wrap(wrapper).parent();
            }
        }
        if (wrapper) {
            this.container = wrapper;
            wrapper.nrmLoadingIndicator('activate', this.options);
            return false;
        } else {
            $el.addClass('nrm-loading-container');
            
            this.container = $el;
            
            if (!this.indicator) {
                id = _.uniqueId('nrm-loading');
                this.indicatorId = id + '-indicator';
                this.statusId = id + '-status';
                this.focusSelector = '#' + this.indicatorId;
                this.indicator = $('<span>').addClass('nrm-loading-indicator').attr({ 
                    id: this.indicatorId,
                    tabindex: '0'
                });
                this.status = $('<span>').addClass('sr-only').attr({
                    id: this.statusId,
                    role: 'status'
                });
                this.backdrop = $('<span>').addClass('nrm-loading-backdrop').attr('data-target', this.focusSelector);
            }
            
            setOptions.call(this, this.options);
            this.container.append(this.backdrop).append(this.status).append(this.indicator).scrollTop(0).scrollLeft(0);
            return true;
        }
    }
    
    function setOptions(options) {
        if (options && options !== this.options) {
            this.options = $.extend({}, this.options, options);
        }
        if (this.indicator) {
            var lgClass = 'nrm-loading-indicator-lg', smClass = 'nrm-loading-indicator-sm';
            if (options.statusText) {
                this.status.text(options.statusText);
                this.backdrop.attr('title', options.statusText);
                this.indicator.attr('title', options.statusText);
            }
            if (options.opacity != null) {
                this.backdrop.css({ opacity: options.opacity });
            }

            if (options.size) {
                switch (options.size) {
                    case 'large':
                        this.indicator.removeClass(smClass).addClass(lgClass);
                        break;
                    case 'small':
                        this.indicator.removeClass(lgClass).addClass(smClass);
                        break;
                    default:
                        this.indicator.removeClass(smClass).removeClass(lgClass);
                        break;
                }
            }
        }
    }
    
    /**
     * This is actually the plugin function (jQuery.fn.nrmLoadingIndicator) and module return value, not a constructor.  
     * See the example below for usage.
     * @class
     * @alias module:nrm-ui/plugins/nrmLoadingIndicator
     * @classdesc JQuery plugin that sets a loading indicator on a container. The indicator blocks focus much like the
     * Twitter Bootstrap modal backdrop and also provides accessible status text for screen readers.
     * @param {string|module:nrm-ui/plugins/nrmLoadingIndicator~PluginOptions} method If this parameter is a string, it 
     *  represents the plugin implementation prototype function to call, with any additional arguments passed to the 
     *  prototype function.  If the parameter is an object, it represents an options hash to pass to the plugin 
     *  implementation when initializing a new instance of the plugin.
     * @param {module:nrm-ui/plugins/nrmLoadingIndicator~PluginOptions} [options] If first parameter is a string, the
     *  second parameter can be options to pass to the method.
     * @returns {external:module:jquery}
     *  The initial jQuery selector to allow for chaining.
     * 
     * @example <caption>Plugin usage</caption>
     * // given a DOM element as follows:
     * // <div id="myForm-container" class="container">
     * //   <form id="myForm">
     * //    <div id="myInputField-container" class="form-group">
     * //      <label for="myInputField" class="control-label">Example</label>
     * //      <input id="myInputField" class="form-control" type="text">
     * //    </div>
     * //    <button id="mySubmitButton" type="submit" class="btn btn-primary">Submit</button>
     * //   </form>
     * // </div>
     * require(['jquery', 'nrm-ui/plugins/nrmLoadingIndicator'], function($, NrmLoadingIndicator) {
     *   // initialize the nrmLoadingIndicator plugin
     *   $('#myForm-container').nrmLoadingIndicator();
     *   // activate the loading indicator. 
     *   $('#myForm-container').nrmLoadingIndicator('activate');
     * });
     */
    function nrmLoadingIndicator(method, options) {
      //if (!useDatepicker) return this;
      var ret, opt, args = Array.apply(null, arguments);
      if (typeof method !== 'string') {
          opt = method;
          method = null;
      } else {
          opt = $.extend({}, options);
          //opt[method] = true;
      }
      this.each(function () {
        var $this = $(this);
        var data  = $this.data('nrm.loadingIndicator');

        if (!data) {
            $this.data('nrm.loadingIndicator', (data = new NrmLoadingIndicator(this, opt)));
        } else if (!method && opt) {
            setOptions.call(data, opt);
        }
        if (method !== null && typeof data[method] === 'function') {
            args.shift();
            ret = data[method].apply(data, args);
            if (ret !== undefined)
                return false;
        }
      });
      
      if (ret !== undefined)
        return ret;
      else
        return this;
    }
  
    NrmLoadingIndicator.prototype = 
    /** @lends module:nrm-ui/plugins/nrmLoadingIndicator.prototype */{
        /**
         * Activate the loading indicator.
         * @param {module:nrm-ui/plugins/nrmLoadingIndicator~PluginOptions} [options] Options to override defaults.
         * @example
         *  $('#myContainer').nrmLoadingIndicator('activate');
         */
        activate: function(options) {
            this.element.addClass('nrm-loading');
            if (options) {
                this.options = $.extend({}, this.options, options);
            }
            
            if (initContainer.call(this, this.element, options)) {
                this.initialized = true;
                if (document.activeElement && $.contains(this.element[0], document.activeElement)) {
                    this.indicator.trigger('focus');
                }
                var onBlur = $.proxy(function() {
                    this.focused = false;
                }, this);
                var onFocus = $.proxy(function() {
                    this.focused = true;
                }, this);
                this.element.off('.nrm.loadingIndicator') // guard against infinite focus loop
                    .on('focusin.nrm.loadingIndicator', $.proxy(function (e) {
                        var $target = $(e.target), candidate, el = this.element[0];
                        if ($target.is(this.focusSelector)) {
                            setTimeout(onFocus);
                            return true;
                        }
                        if (this.focused) {
                            // shift+tab: focus previous tabbable element
                            $(this.tabbableSelector).each(function() {
                                if (this === el || $.contains(el, this)) {
                                    if (candidate) {
                                        $(candidate).trigger('focus');
                                    } else {
                                        // no previous element, blur the target
                                        $target.blur();
                                    }
                                    return false;
                                } else {
                                    candidate = this;
                                }
                            });
                        } else {
                            this.indicator.trigger('focus');
                        }
                        this.element.scrollTop(0).scrollLeft(0);
                    }, this))
                    .on('focusout.nrm.loadingIndicator', this.focusSelector, $.proxy(function(e) {
                        //console.log('loading indicator blurred');
                        setTimeout(onBlur);
                    }, this));
            }
        },
        /**
         * Deactivate the loading indicator.
         * @example
         *  $('#myContainer').nrmLoadingIndicator('deactivate');
         */
        deactivate: function() {
            this.element.removeClass('nrm-loading nrm-loading-container');
            if (this.initialized) {
                this.element.off('.nrm.loadingIndicator');
                this.indicator.remove();
                this.status.remove();
                this.backdrop.remove();
            } else if (this.container) {
                // pass it on
                this.container.nrmLoadingIndicator('deactivate');
            }
            if (this.wrapped) {
                this.element.unwrap();
                this.wrapped = false;
            }
            this.container = null;
        }
    };
    
    
    
    $.fn.nrmLoadingIndicator = nrmLoadingIndicator;
    $.fn.nrmLoadingIndicator.constructor = NrmLoadingIndicator;

    return $.fn.nrmLoadingIndicator;
});