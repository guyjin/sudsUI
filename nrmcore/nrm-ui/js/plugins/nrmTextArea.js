/**
 * @file  JQuery plugin that extends the behavior of the native textarea element. 
 * @see module:nrm-ui/plugins/nrmTextArea
 */

/** 
 * @module nrm-ui/plugins/nrmTextArea
 * 
 */
define(['jquery'], function($) {

    /**
     * Enable the nrmTextArea plugin on a UI element.
     * This is actually the plugin function (jQuery.fn.nrmTextArea) and module return value, not a constructor.  
     * See the example below for usage.
     * @class
     * @alias module:nrm-ui/plugins/nrmTextArea
     * @classdesc JQuery plugin that attaches to a textarea element to add status text showing number of characters.
     * @param {Object} options
     * @param {Number} [options.rows] - Set the rows attribute on the textarea element.
     * @param {Number} [options.maxLength] - Set the maxlength attribute on the textarea element.
     *  The initial jQuery selector to allow for chaining.
     * 
     * @example <caption>Plugin usage</caption>
     * // Given DOM elements as follows:
     * // <label id="example-label" class="control-label" for="example">
     * //    Example Text Area
     * // </label>
     * // <textarea class="form-control" id="example" rows="4" maxlength="4000"></textarea>
     * //
     * require(['jquery', 'nrm-ui/plugins/nrmTextArea'], function($, NrmTextArea) {
     *   // initialize the nrmTextArea plugin on the textarea element
     *   var $textArea = $('#example').nrmTextArea();
     * });
     */
    return $.fn.nrmTextArea = function(options) {
        var status = false;

        return this.each( function() {
            var x = $(this).addClass('NRMtextArea');
            if (options && options.rows) {
                x.attr("rows",options.rows);
            } //else {
            //    x.attr("rows","1");
            //} // JS 12/19/14: use existing attribute from html or default if not specified in options
            if (options && options.maxLength)
                x.attr("maxLength",options.maxLength);
            x.on('input',function() {
                if (!status) {
                    x.after($("<div></div>").addClass('status'));
                    status = true;
                }
                x.height(x[0].rows*16).height(x[0].scrollHeight);
                var y = x.val().length;
                var z = x.attr("maxLength");
                if (z === undefined) {
                    x.siblings('.status').html("maximum length not specified");
                } else {
                    x.siblings('.status').html(parseInt(z)-y + ' chars left');
                }
            });
            x.blur(function() {
                x.siblings('.status').remove();
                status = false;
            });
        });
    };

});