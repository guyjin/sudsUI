/**
 * @file        NRM Date Picker plugin
 * @author      John Simonitch
 * @see module:nrm-ui/plugins/nrmDatePicker
 */
/**
 * @module nrm-ui/plugins/nrmDatePicker
 */
define(['jquery', 'use!modernizr'], function($, Modernizr) {
    var useDatepicker = !Modernizr.inputtypes.date, 
            dateIsoRe = /^(\d{4})-(\d{2})-(\d{2})/,
            dateDisplayRe = /^(\d{2})\/(\d{2})\/(\d{4})$/;

    /**
     * As well as the options listed here, the plugin accepts other options documented for the 
     *  {@link https://bootstrap-datepicker.readthedocs.org/en/latest/options.html|Bootstrap Datepicker plugin options}, 
     *  but be aware that plugin options will only apply in browsers that do not support native HTML5 input date type.
     * @typedef PluginOptions
     * @property {boolean} [component=true] Indicates whether the calendar button should be added in scenarios where
     *   the Bootstrap Datepicker plugin is used. 
     * @see {@link https://bootstrap-datepicker.readthedocs.org/en/latest/options.html|Bootstrap Datepicker plugin}
     */

    /**
     * Create a new instance of the NrmDatePicker plugin.  Not intended for direct use in application code.
     * @class NrmDatePicker
     * @private
     * @param {HTMLElement} el The DOM element.
     * @param {module:nrm-ui/plugins/nrmDatePicker~PluginOptions} [options] Options to override defaults. 
     */
    var NrmDatePicker = function(el, options) {
        var $el = this.element = $(el), $container, val, fmt, match, min, max, self = this;                 
        if (!useDatepicker && $el.attr('type') !== 'text') return this;
        options = $.extend({
            enableOnReadonly: false,
            autoclose: true,
            showOnFocus: false/*,
            todayHighlight: true*/
        }, options);
        require(['use!datepicker'], function() {
            self.hasPlugin = true;
            if (options && options.component !== false) {
                self.wrapped = true;
                $container = $el.wrap('<div class="input-group date"></div>').parent();
                $container.append('<div class="input-group-btn">' + 
                        '<button type="button" class="btn btn-default" title="Show calendar">' + 
                        '<span class="glyphicon glyphicon-calendar"></span></button></div>');
                if ($el.is('.input-sm')) {
                    $container.addClass('input-group-sm');
                } else if ($el.is('.input-lg')) {
                    $container.addClass('input-group-lg');
                }
                if ($el.prop('readonly') || $el.prop('disabled')) {
                    $('.btn', $container).prop('disabled', true);
                }
                $container.on('click.nrm.datepicker', '.btn', function() {
                    $el.focus().datepicker('show');
                });    
            }
            val = $el.val();
            fmt = displayVal(val);
            // convert from yyyy-mm-dd to mm/dd/yyyy
            if (fmt !== val)
                $el.val(fmt);
            
            min = $el.attr('min');
            if (min) {
                options.startDate = strToDate(min);
            }
            max = $el.attr('max');
            if (max) {
                options.endDate = strToDate(max);
            }
            // we only support mm/dd/yyyy display format for now
            options.format = 'mm/dd/yyyy';
            //($container || $el).datepicker(options);
            $el.datepicker(options);
            $el.on('keyup.nrm.datepicker', function(e) {
                e.which === 27 && e.stopPropagation();
            }).on('change.nrm.datepicker', function(e) {
                var $el = $(e.target), val = $el.val();
                if (val === 'NaN/NaN/NaN') {
                    /* This is a hack to "fix" the NaN/NaN/NaN problem in bootstrap-datepicker,
                     * which happens when user enters an invalid value that kind of looks valid (like "1/2/3"),
                     * then picks a date in the calendar.
                     */
                    $el.datepicker('update', new Date());
                    $el.datepicker('update', '');
                } 
            }).on('input.nrm.datepicker', function(e) {
                var $el = $(e.target), val = $el.val();
                if (!val) {
                    $el.datepicker('update');
                }
            });
            // placeholder would be nice, but causes problems in IE11
            // http://stackoverflow.com/questions/19289396/jquery-input-event-fired-on-placeholder-in-ie
            /*if (!$el.attr('placeholder')) {
                self.hasPlaceholder = true;
                $el.attr('placeholder', 'mm/dd/yyyy');
            }*/
            if (self.wrapped) {
                // listen for readonly/disabled property change
                monitorSource.call(self);
            }
        });
        return this;
    }
    function monitorSource() {
        if (!this.wrapped) return;
        var el = this.element, observer, self = this;
 
        this._sync = function () {

            // sync enabled state
            var readonly = el.prop("disabled") || el.prop("readonly");

            $('.btn', self.element.parent()).prop("disabled", !!readonly);
        };
        // this logic is adapted from Select2 plugin
        // IE8-10 (IE9/10 won't fire propertyChange via attachEventListener)
        if (el.length && el[0].attachEvent) {
            el[0].attachEvent("onpropertychange", self._sync);
        }

        // safari, chrome, firefox, IE11
        observer = window.MutationObserver || window.WebKitMutationObserver|| window.MozMutationObserver;
        if (observer !== undefined) {
            if (this.propertyObserver) { delete this.propertyObserver; this.propertyObserver = null; }
            this.propertyObserver = new observer(function (mutations) {
                $.each(mutations, self._sync);
            });
            this.propertyObserver.observe(el.get(0), { attributes:true, subtree:false });
        }
    }
    /**
     * Returns ISO 8601 formatted date string (yyyy-mm-dd) converted to display format mm/dd/yyyy. 
     * @function displayVal
     * @static
     * @param {string} dateStr The value formatted in ISO 8601 "complete date" format.
     * @returns {string} The value formatted in display format mm/dd/yyyy
     * @see {@link http://www.w3.org/TR/NOTE-datetime|W3C Date and Time Formats}
     * @example
     *  require(['nrm-ui/plugins/nrmDatePicker'], function(NrmDatePicker) {
     *     // returns '10/27/2015'
     *     var val = NrmDatePicker.displayVal('2015-10-27');
     *  });
     */
    function displayVal(dateStr) {
        var match = $.type(dateStr) === 'string' && dateStr.match(dateIsoRe);
        if (match) {
            dateStr = match[2] + '/' + match[3] + '/' + match[1];
        }
        return dateStr;
    }
    function strToDate(dateStr) {
        var date;
        if (dateStr instanceof Date)
            date = dateStr;
        else if (dateStr) {
            if (dateStr.length === 10) {
                dateStr = dateStr + 'T00:00'
            }
            date = new Date(dateStr);
        }
        return date;
    }
    
    /**
     * This is actually the plugin function (jQuery.fn.nrmDatePicker) and module return value, not a constructor.  
     * See the example below for usage.
     * @class
     * @alias module:nrm-ui/plugins/nrmDatePicker
     * @classdesc JQuery plugin providing a dropdown calendar alternative for browsers that do not support the HTML5 
     *  input date type. The module adds the nrmDatePicker function to the jQuery plugin namespace.
     * @param {string|module:nrm-ui/plugins/nrmDatePicker~PluginOptions} method If this parameter is a string, it represents the plugin implementation prototype
     *  function to call, with any additional arguments passed to the prototype function.
     *  If the parameter is an object, it represents an options hash to pass to the plugin implementation
     *  when initializing a new instance of the plugin.
     * @returns {external:module:jquery}
     *  The initial jQuery selector to allow for chaining.
     * @see {@link https://bootstrap-datepicker.readthedocs.org/en/latest/index.html|Bootstrap Datepicker} for details
     *  on the plugin that provides the calendar dropdown functionality.
     * 
     * @example <caption>Plugin usage</caption>
     * // given a DOM element as follows:
     * // <input type="date" id="myDateInput" class="form-control" min="1970-01-01" max="2015-10-27" value="2010-07-21"/>
     * require(['jquery', 'nrm-ui/plugins/nrmDatePicker'], function($, NrmDatePicker) {
     *   // initialize the nrmDatePicker plugin
     *   // min and max attributes will be automatically applied as the calendar start/end dates if the plugin is used.
     *   // value will be converted to display format mm/dd/yyyy if not using native HTML5 input date type
     *   $('#myDateInput').nrmDatePicker();
     *   // set a date, this will convert the value to display format mm/dd/yyyy if necessary, and trigger 'change' event. 
     *   $('#myDateInput').nrmDatePicker('update', '2015-10-27');
     *   // get the value, converting from display format mm/dd/yyyy if necessary
     *   // note that we cannot use $('#myDateInput').val() because it will sometimes return the display format.
     *   // returns '2015-10-27'
     *   var dateVal = NrmDatePicker.val('#myDateInput');
     * });
     */
    function nrmDatePicker(method) {
      //if (!useDatepicker) return this;
      var ret, opt, args = Array.apply(null, arguments);
      if (typeof method !== 'string') {
          opt = method;
          method = null;
      } 
      this.each(function () {
        var $this = $(this);
        var data  = $this.data('nrm.datepicker');

        if (!data) $this.data('nrm.datepicker', (data = new NrmDatePicker(this, opt)));
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
    
    function callDatepicker(method, args) {
        if (!this.hasPlugin || !this.element) return;
        element = this.element; //this.wrapped ? this.element.parent() : this.element;
        Array.prototype.unshift.call(args, method);
        return element.datepicker && element.datepicker.apply(element, args);
    }
        
    if (useDatepicker) {
        // require the datepicker plugin early
        require(['use!datepicker'], function() {
            console.info('Browser does not support input date type, using bootstrap-datepicker plugin.');
        });
    }
    
    NrmDatePicker.prototype = 
    /** @lends module:nrm-ui/plugins/nrmDatePicker.prototype */{
        /**
         * Destroy the plugin instance, removing the component button if it was added.
         * @example
         *  $('#myDateInput').nrmDatePicker('remove');
         */
        remove: function() {
            if (!this.element) return;
            if (this.element.length && this.element[0].detachEvent) {
                this.element[0].detachEvent("onpropertychange", this._sync);
            }
            if (this.propertyObserver) {
                this.propertyObserver.disconnect();
                this.propertyObserver = null;
            }
            this._sync = null;
            if (this.wrapped) {
                this.element.siblings().remove();
                this.element.parent().off('.nrm.datepicker');
                this.element.unwrap();
            } 
//            if (this.hasPlaceholder)
//                this.element.removeAttr('placeholder');
            this.element.off('.nrm.datepicker');
            delete this.element.data()['nrm.datepicker'];
            callDatepicker.call(this, 'remove', arguments);
            this.element = null;
        },
        /**
         * Show the calendar plugin, has no effect if we are using the native HTML5 input date type.
         * @example
         *  $('#myDateInput').nrmDatePicker('show');
         */
        show: function() {
            callDatepicker.call(this, 'show', arguments);
        },
        /**
         * Hide the calendar plugin, has no effect if we are using the native HTML5 input date type.
         * @example
         *  $('#myDateInput').nrmDatePicker('hide');
         */
        hide: function() {
            callDatepicker.call(this, 'hide', arguments);
        },
        /**
         * Update the input field value and trigger the 'change' event.
         * If using the Bootstrap Datepicker plugin, the actual value will be converted to mm/dd/yyyy display format 
         * that is required by the plugin.
         * @param {string} date New value formatted as ISO 8601 "complete date" i.e. yyyy-mm-dd
         * @example
         *  $('#myDateInput').nrmDatePicker('update', '2015-10-27');
         */
        update: function(date) {
            if (!this.element) return;
            if (!this.hasPlugin)
                this.element.val(date).trigger('change');
            else {
                var args = $.map($.makeArray(arguments), function(arg) {
                    return displayVal(arg) || '';
                });
                callDatepicker.call(this, 'update', args);
            }
        },
        /**
         * Set the "min" attribute and minimum date that can be selected from the calendar dropdown.
         * Note that this does not prevent users from entering dates outside the range so do not rely on it to 
         * enforce a business rule.
         * @param {string} date Minimum allowed date formatted as ISO 8601 "complete date" i.e. yyyy-mm-dd
         * @example
         *  $('#myDateInput').nrmDatePicker('setStartDate', '1970-01-01');
         */
        setStartDate: function(date) {
            if (!this.element) return;
            if (!date)
                this.element.removeAttr('min');
            else
                this.element.attr('min', date);
            callDatepicker.call(this, 'setStartDate', [ strToDate(date) || '' ]);
        },
        /**
         * Set the "max" attribute and maximum date that can be selected from the calendar dropdown.
         * Note that this does not prevent users from entering dates outside the range so do not rely on it to 
         * enforce a business rule.
         * @param {string} date Maximum allowed date formatted as ISO 8601 "complete date" i.e. yyyy-mm-dd
         * @example
         *  $('#myDateInput').nrmDatePicker('setEndDate', '2015-10-27');
         */
        setEndDate: function(date) {
            if (!this.element) return;
            if (!date)
                this.element.removeAttr('max');
            else
                this.element.attr('max', date);
            callDatepicker.call(this, 'setEndDate', [ strToDate(date) || '' ]);
        }
    }
    
    $.fn.nrmDatePicker = nrmDatePicker;
    $.fn.nrmDatePicker.constructor = NrmDatePicker;
    /**
     * Returns input element value converted to ISO 8601 format, even if the actual value is formatted
     *  in display format mm/dd/yyyy. The parameters are passed to jQuery constructor.
     * @function val
     * @static
     * @param {string|HTMLElement|external:module:jquery|object} selector The JQuery selector
     * @param {HTMLElement|external:module:jquery} [context] A DOM Element, Document or jQuery to use as context
     * @returns {string} The value formatted in ISO 8601 "complete date" format.
     * @see {@link http://www.w3.org/TR/NOTE-datetime|W3C Date and Time Formats}
     * @see {@link http://api.jquery.com/jQuery/#jQuery1|jQuery} for more details on accepted parameter values.
     * @example
     *  require(['nrm-ui/plugins/nrmDatePicker'], function(NrmDatePicker) {
     *     var $el = $('<input type='date' value='2015-10-27'/>').nrmDatePicker();
     *     // returns '2015-10-27'
     *     var val = NrmDatePicker.val($el);
     *  });
     */
    $.fn.nrmDatePicker.val = function(selector, context) {
        var val = $(selector, context).val(),
                match = $.type(val) === 'string' && val.match(dateDisplayRe);
        if (match) {
            val = match[3] + '-' + match[1] + '-' + match[2];
        }
        return val;
    }
    $.fn.nrmDatePicker.displayVal = displayVal;
    return $.fn.nrmDatePicker;
});