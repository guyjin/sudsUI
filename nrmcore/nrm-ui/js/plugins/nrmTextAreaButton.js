/**
 * @file  Supports collapsible textarea elements and rich text editor functionality. 
 * @see module:nrm-ui/plugins/nrmTextAreaButton
 */

/** 
 * @module nrm-ui/plugins/nrmTextAreaButton
 * 
 */

define(['jquery', './nrmTextArea', 'require'],
        function($, NRMTextArea, require) {

    // $.valHooks allows us to use something like $('div[contenteditable="true"]').val() to retrieve div contents as 
    // the value of the element.
    $.valHooks.div = {
        get: function(elem) {
            return $(elem).html(); //'"' + $(elem).html() + '"';
        },
        set: function(elem, value) {
            if (value.substr(0, 1) === '"' && value.substr(-1) === '"')
                value = value.substr(1, value.length - 2);
            $(elem).html(value);
        }
    };


    /**
     * Enable the nrmTextAreaButton plugin on a UI element.
     * This is actually the plugin function (jQuery.fn.nrmTextAreaButton) and module return value, not a constructor.  
     * See the example below for usage.
     * @class
     * @alias module:nrm-ui/plugins/nrmTextAreaButton
     * @classdesc JQuery plugin that attaches to a button element to toggle visibilty of a textarea with long text,
     * and optionally open a modal {@link module:nrm-ui/views/richTextView|RichTextView} when the edit field is clicked.
     * @param {Object} options
     * @param {boolean} [options.richText=false] - Enable rich text editor modal.
     * @param {string} [options.title="Text Editor"] - Title for optional rich text editor modal.
     * @param {Object} [options.targetAttr] - Attributes to add to the generated textarea or div element.
     * @returns {external:module:jquery}
     *  The initial jQuery selector to allow for chaining.
     * 
     * @example <caption>Plugin usage (native textarea element)</caption>
     * // Given DOM elements as follows:
     * // <label id="example-label" class="control-label" for="example">
     * //    Example Text Area
     * // </label>
     * // <!-- set data-target to the selector for the textarea element -->
     * // <button type="button" id="example-btn" data-target="#example" aria-labelledby="example-label" class="btn btn-default button-textarea nrm-enable-readonly" title="View or edit example text area">
     * //    ...
     * // </button>
     * // <!-- set hidden class on the textarea so that the element will be hidden until user clicks the button -->
     * // <!-- if the textarea should be initially visible, set hidden class on the button element instead -->
     * // <textarea class="form-control hidden" id="example" rows="4" maxlength="4000"></textarea>
     * //
     * require(['jquery', 'nrm-ui/plugins/nrmTextAreaButton'], function($, NrmTextAreaButton) {
     *   // initialize the nrmTextAreaButton plugin on the button element
     *   var $button = $('#example-btn').nrmTextAreaButton();
     * });
     * @example <caption>Plugin usage (rich text editor)</caption>
     * // Given DOM elements as follows:
     * // <label id="example-label" class="control-label">
     * //    Example Text Area
     * // </label>
     * // <!-- set data-target to the selector for the textarea element -->
     * // <button type="button" id="example-btn" data-target="#example" aria-labelledby="example-label" class="btn btn-default button-textarea nrm-enable-readonly" title="View or edit example text area">
     * //    ...
     * // </button>
     * // <!-- set hidden class on the div so that the element will be hidden until user clicks the button -->
     * // <!-- if the div should be initially visible, set hidden class on the button element instead -->
     * // <div class="form-control nrm-rich-text" id="example" aria-labelledby="example-label"></textarea>
     * //
     * require(['jquery', 'nrm-ui/plugins/nrmTextAreaButton'], function($, NrmTextAreaButton) {
     *   // to set the rich text editor read-only before initialization, use "disabled" class:
     *   //$('#example').addClass('disabled');
     *   // initialize the nrmTextAreaButton plugin on the button element
     *   var $button = $('#example-btn').nrmTextAreaButton({
     *      richText: true
     *   });
     *   // 
     * });
     */
    return $.fn.nrmTextAreaButton = function(options) {
        var defaults = {}, properties = $.extend({}, defaults, options),
                title = (options && options.title) ? options.title : "Text Editor";
        
        return this.each(function() {
            var $y, btn = $(this), t, readOnly, editorRunning = false;
            var launchEditor = function() {
                if (!editorRunning) {
                    require(["../views/richTextView"], function(RichTextView){
                        var callback = function(modal, btn) {
                            editorRunning = false;
                            if (this.clicked === 0) { //this=modalView
                                $y.val($(".nrm-richtext-editor",modal.$el).html());
                                $y.change();
                            }
                        };
                        // JS 7/6/2016: allow adding 'disabled' class after plugin initialization
                        readOnly = $y.hasClass('disabled');
                        RichTextView.show({text: $y.html(), title: title, target: $y, readOnly: readOnly, callback: callback});
                    });
                    editorRunning = true;
                }
            };

            if (options && options.richText) {
              t = btn.attr('data-target');
              if (t) {
                  $y = $(t,btn.parent());
                  if (properties.targetAttr) {
                      $y.attr(properties.targetAttr);
                  }
              } else {
                  $y = $('<div></div>', properties.targetAttr).addClass('form-control hidden nrm-rich-text');
                  btn.parent().append($y);
              }
              readOnly = $y.hasClass('disabled');

              require(['use!bootstrap-wysiwyg'], function(wysiwyg){
                /* JS 7/5/16: keep default browser tab behavior
                 * Due to deep extend of $.fn.wysiwyg.defaults in the plugin initialization, this is the only way to disable a 
                 * default hotkey.
                 */
                delete $.fn.wysiwyg.defaults.hotKeys['Shift+tab'];
                delete $.fn.wysiwyg.defaults.hotKeys['tab'];
                $y = $y.wysiwyg({hotKeys: {}});
                
                var titleText = 'Click to ' + (readOnly ? "view " : "edit ") + ((options && options.title) ? options.title : "text");
                $y.attr({title: titleText});
                if (readOnly)
                    $y.addClass('disabled');
                $y.on('click', function(event) {
                    event.preventDefault();
                    launchEditor();
                });
              }); // end require

            } else {
                t = btn.attr('data-target');
                if (t) {
                    $y = $(t,btn.parent());
                    if (properties.targetAttr) {
                        $y.attr(properties.targetAttr);
                    }
                } else {
                    $y = $('<textarea></textarea>', properties.targetAttr).addClass("form-control hidden");
                    btn.parent().append($y);
                }
                $y = $y.nrmTextArea();

                readOnly = $y.attr('readonly')==='readonly';
                if (readOnly) {
                    $y.attr({title: "read-only"});
                }
            }

            if (properties.targetAttr && properties.targetAttr.text) {
                $y.val(properties.targetAttr.text);
            }
            //$y.attr('id', btn.selector.substr(1));

            btn.click(function() {
                btn.addClass('hidden');
                $y.removeClass('hidden');
//                btn.parent().append($y);
//                btn.remove();
                $y.focus();
            });
            $y.keydown(function(ev) {
                var keyCode = ev.keyCode;
                if (keyCode === 27) {
//                    properties.text = $y.val();
//                    var ww = btn.nrmTextAreaButton(properties);
//                    $(this).parent().append(ww);
                btn.removeClass('hidden');
                $y.addClass('hidden');
                    $y.blur();
//                    $y.remove();
                }
                else if (options && options.richText) {
                    if (keyCode === 9) {// tab 
                        $y.blur();
                        return true;
                    } else if (keyCode >= 16 && keyCode <= 18) { // shift, ctrl, alt
                        return true;
                    } else if (keyCode >= 112 && keyCode <= 123) { // F keys
                        return true;
                    } else {
                        launchEditor();
                    }
                    return false;
                }
            });
        });
    };

});