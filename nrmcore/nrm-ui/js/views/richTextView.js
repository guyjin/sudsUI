/**
 * @file  Modal rich text editor view. 
 * @see module:nrm-ui/views/richTextView
 */

/** 
 * @module nrm-ui/views/richTextView
 * 
 */
define([
    'jquery',
    'backbone',
    'handlebars',
    'nrm-ui',
    'hbs!richText',
    'nrm-ui/plugins/messageBox', 'use!bootstrap-wysiwyg',
    "underscore"
], function($, Backbone, Handlebars, Nrm, RichTextTemplate, MessageBox,
            wysiwyg,
            _
            ) {
    
    return Nrm.Views.RichTextView = Backbone.View.extend(/**@lends module:nrm-ui/views/richTextView.prototype */{
        /**
         * Events hash.
         * @see {@link http://backbonejs.org/#View-events|Backbone View events}
         */
        events: {
            'click .nrm-richtext-inserttext': 'insertText',
            'click a[href="#"]': function(e) {
                // prevent hashchange
                e.preventDefault();
            }
                    // ,"change #nrm-richtext-editor": "dataChanged" div doesn't have an event that detects changes http://www.java2s.com/Code/HTMLCSSReference/HTML-Tag-Reference/divEventHandlers.htm
        },
        /**
         * Create a new instance of the RichTextView.  
         * @constructor
         * @alias module:nrm-ui/views/richTextView
         * @classdesc
         *   Modal rich text editor view. Applications will usually not reference this module directly, instead they
         *   will use the {@link module:nrm-ui/plugins/nrmTextAreaButton|nrmTextAreaButton JQuery plugin}
          * @param {Object} options Please refer to the {@link module:nrm-ui/views/richTextView.show|show} method
          *  for details.
         * @see {@link http://backbonejs.org/#View-constructor|Backbone View constructor / initialize}
         */
        initialize: function initialize(options) {
            var defaults = {
                text: "",
                title: "Formatted Text Editor",
                readOnly: false,
                enablePictures: true,
                enableHotlinks: false,
                callback: function(){console.log("no callback for richTextView", this);},
                specialCharacters: [
                    // <editor-fold defaultstate="collapsed" desc="specialCharacters">
                    '&Aacute;  Capital A-acute',
                    '&aacute;  Lowercase A-acute',
                    '&Acirc;  Capital A-circumflex',
                    '&acirc;  Lowercase A-circumflex',
                    '&AElig;  Capital AE Ligature',
                    '&aelig;  Lowercase AE Ligature',
                    '&Agrave;  Capital A-grave',
                    '&agrave;  Lowercase A-grave',
                    '&Alpha;  Capital Alpha',
                    '&alpha;  Lowercase Alpha',
                    '&amp;  Ampersand',
                    '&Aring;  Capital A-ring',
                    '&aring;  Lowercase A-umlaut',
                    '&Atilde;  Capital A-tilde',
                    '&atilde;  Lowercase A-tilde',
                    '&Auml;  Capital A-umlaut',
                    '&auml;  Lowercase A-umlaut',
                    '&Beta;  Capital Beta',
                    '&beta;  Lowercase Beta',
                    '&brvbar;  Broken Vertical Bar',
                    '&Ccedil;  Capital C-cedilla',
                    '&ccedil;  Lowercase C-cedilla',
                    '&cent;  Cent Sign',
                    '&Chi;  Capital Chi',
                    '&chi;  Lowercase Chi',
                    '&clubs;  Clubs card suit',
                    '&copy;  Copyright',
                    '&curren;  Generic Currency Symbol',
                    '&dagger;  Dagger',
                    '&Dagger;  Double Dagger',
                    '&darr;  Down arrow',
                    '&dbquo;  Double Low Quote',
                    '&deg;  Degree',
                    '&Delta;  Capital Delta',
                    '&delta;  Lowercase Delta',
                    '&diams;  Diamonds card suit',
                    '&Eacute;  Capital E-acute',
                    '&eacute;  Lowercase E-acute',
                    '&Ecirc;  Capital E-circumflex',
                    '&ecirc;  Lowercase E-circumflex',
                    '&Egrave;  Capital E-grave',
                    '&egrave;  Lowercase E-grave',
                    '&Epsilon;  Capital Epsilon',
                    '&epsilon;  Lowercase Epsilon',
                    '&Eta;  Capital Eta',
                    '&eta;  Lowercase Eta',
                    '&ETH;  Capital Eth (Icelandic)',
                    '&eth;  Lowercase Eth (Icelandic)',
                    '&Euml;  Capital E-umlaut',
                    '&euml;  Lowercase E-umlaut',
                    '&euro;  Euro Symbol',
                    '&Gamma;  Capital Gamma',
                    '&gamma;  Lowercase Gamma',
                    '&hearts;  Hearts card suit',
                    '&Iacute;  Capital I-acute',
                    '&iacute;  Lowercase I-acute',
                    '&Icirc;  Capital I-circumflex',
                    '&icirc;  Lowercase I-circumflex',
                    '&iexcl;  Inverted Exclamation Point',
                    '&Igrave;  Capital I-grave',
                    '&igrave;  Lowercase I-grave',
                    '&Iota;  Capital Iota',
                    '&iota;  Lowercase Iota',
                    '&iquest;  Inverted Question Mark',
                    '&iquest;  Inverted Question Mark',
                    '&Iuml;  Capital I-umlaut',
                    '&iuml;  Lowercase I-umlaut',
                    '&Kappa;  Capital Kappa',
                    '&kappa;  Lowercase Kappa',
                    '&Lambda;  Capital Lambda',
                    '&lambda;  Lowercase Lambda',
                    '&laquo;  Left Angle Quote',
                    '&larr;  Left arrow',
                    '&ldquo;  Left Double Quote',
                    '&lsaquo;  Left Single Angle Quote',
                    '&lsquo;  Left Single Quote',
                    '&mdash;  Em Dash',
                    '&micro;  Micro Sign',
                    '&middot;  Middle Dot',
                    '&Mu;  Capital Mu',
                    '&mu;  Lowercase Mu',
                    '&nbsp;  Non-Breaking Space',
                    '&ndash;  En Dash',
                    '&not;  Not Sign',
                    '&Ntilde;  Capital N-tilde',
                    '&ntilde;  Lowercase N-tilde',
                    '&Nu;  Capital Nu',
                    '&nu;  Lowercase Nu',
                    '&Oacute;  Capital O-acute',
                    '&oacute;  Lowercase O-acute',
                    '&Ocirc;  Capital O-circumflex',
                    '&ocirc;  Lowercase O-circumflex',
                    '&OElig;  Capital OE Ligature',
                    '&oelig;  Lowercase OE Ligature',
                    '&Ograve;  Capital O-grave',
                    '&ograve;  Lowercase O-grave',
                    '&oline;  Overline',
                    '&Omega;  Capital Omega',
                    '&omega;  Lowercase Omega',
                    '&Omicron;  Capital Omicron',
                    '&omicron;  Lowercase Omicron',
                    '&ordf;  Feminine Ordinal Indicator',
                    '&ordm;  Masculine Ordinal Indicator',
                    '&Oslash;  Capital O-slash',
                    '&oslash;  Lowercase O-slash',
                    '&Otilde;  Capital O-tilde',
                    '&otilde;  Lowercase O-tilde',
                    '&Ouml;  Capital O-umlaut',
                    '&ouml;  Lowercase O-umlaut',
                    '&para;  Pilcrow (Paragraph Sign)',
                    '&Phi;  Capital Phi',
                    '&phi;  Lowercase Phi',
                    '&Pi;  Capital Pi',
                    '&pi;  Lowercase Pi',
                    '&pound;  Pound Sterling',
                    '&Psi;  Capital Psi',
                    '&psi;  Lowercase Psi',
                    '&quot;  Double Quote',
                    '&raquo;  Right Angle Quote',
                    '&rarr;  Right arrow',
                    '&rdquo;  Right Double Quote',
                    '&reg;  Registered Symbol',
                    '&Rho;  Capital Rho',
                    '&rho;  Lowercase Rho',
                    '&rsaquo;  Right Single Angle Quote',
                    '&rsquo;  Right Single Quote',
                    '&sbquo;  Single Low Quote',
                    '&sect;  Section Mark',
                    '&shy;  Soft Hyphen',
                    '&Sigma;  Capital Sigma',
                    '&sigma;  Lowercase Sigma',
                    '&Sigma;  Capital Sigma',
                    '&sigma;  Lowercase Sigma',
                    '&spades;  Spade card suit',
                    '&sup1;  Superscript 1',
                    '&sup2;  Superscript 2',
                    '&sup3;  Superscript 3',
                    '&szlig;  Lowercase SZ Ligature',
                    '&Tau;  Capital Tau',
                    '&tau;  Lowercase Tau',
                    '&Theta;  Capital Theta',
                    '&theta;  Lowercase Theta',
                    '&THORN;  Capital Thorn',
                    '&thorn;  Lowercase Thorn',
                    '&tilde;  Vertical Bar',
                    '&trade;  Trademark',
                    '&Uacute;  Capital U-acute',
                    '&uacute;  Lowercase U-acute',
                    '&uarr;  Up arrow',
                    '&Ucirc;  Capital U-circumflex',
                    '&ucirc;  Lowercase U-circumflex',
                    '&Ugrave;  Capital U-grave',
                    '&ugrave;  Lowercase U-grave',
                    '&Upsilon;  Capital Upsilon',
                    '&upsilon;  Lowercase Upsilon',
                    '&Uuml;  Capital U-umlaut',
                    '&uuml;  Lowercase U-umlaut',
                    '&Xi;  Capital Xi',
                    '&xi;  Lowercase Xi',
                    '&Yacute;  Capital Y-acute',
                    '&yacute;  Lowercase Y-acute',
                    '&yen;  Yen Symbol',
                    '&Yuml;  Capital Y-umlaut',
                    '&yuml;  Lowercase Y-umlaut',
                    '&Zeta;  Capital Zeta',
                    '&zeta;  Lowercase Zeta'
                            // </editor-fold>
                ]
            };
            this.options = $.extend({}, defaults, options);
            this.initialText = this.options.text;
            this.savedRange = null;
            //this.render();
        },
        /**
         * Event listener for the OK button
         * @returns {undefined}
         */
        onSave: function() {
            this.saved = true;
        },
        /**
         * Indicates whether the view has unsaved changes.
         * @returns {boolean}
         */
        isDirty: function() {
            return !this.saved && this.initialText !== $('.nrm-richtext-editor', this.$el).html();
        },
        /**
         * Event handler for special character input
         * @param {Event} event The event object.
         * @returns {undefined}
         */
        insertText: function(event) {
            event.preventDefault();
            this.saveSelection();
            var text = event.target.attributes['val'].value;
            var range = document.getSelection().getRangeAt(0);
            var node = document.createTextNode(text);
            range.insertNode(node);
            this.setCursorPosition(node);
        },
        /**
         * Records the current text selection in the document.
         * @returns {undefined}
         */
        saveSelection: function()
        {
            if (window.getSelection)//non IE Browsers
            {
                this.savedRange = window.getSelection().getRangeAt(0);
            }
            else if (document.selection)//IE
            {
                this.savedRange = document.selection.createRange();
            }
        },
        /**
         * Sets the cursor position relative to a node.
         * @param {Node} node
         * @returns {undefined}
         */
        setCursorPosition: function(node)
        {
            $('.nrm-richtext-editor', this.$el).focus();
            if (this.savedRange !== null) {
                var newRange = document.createRange();
                newRange.setStartAfter(node);
                if (window.getSelection)//non IE and there is already a selection
                {
                    var s = window.getSelection();
                    if (s.rangeCount > 0)
                        s.removeAllRanges();
                    s.addRange(newRange);
                }
                else if (document.createRange)//non IE and no selection
                {
                    window.getSelection().addRange(newRange);
                }
                else if (document.selection)//IE
                {
                    newRange.select();
                }
            }
        },
        /**
         * Remove the view.
         * @returns {undefined}
         * @see {@link http://backbonejs.org/#View-remove|Backbone View remove}
         */
        remove: function() {
            $(document).off("click.nrmRichText");
            $(document).off("keydown.nrmRichText");
            Backbone.View.prototype.remove.apply(this, arguments);
        },
        /**
         * Render the view.
         * @param {Object} options
         * @returns {undefined}
         * @see {@link http://backbonejs.org/#View-render|Backbone View render}
         */
        render: function(options) {
            //Handlebars.registerPartial('modalView', RichTextTemplate);
            var template = RichTextTemplate;
            var defaults = {
                header: this.options.title,
                footer: true,
                body: true
            };
            var renderOptions = $.extend({}, defaults, options);
            this.$el.html(template(renderOptions));

            if (this.options.enablePictures)
                $('#nrm-richtext-picture-div', this.$el).removeClass('hidden');
            if (this.options.enableHyperlinks)
                $('#nrm-richtext-hyperlink-div', this.$el).removeClass('hidden');
            var that = this;
            function initToolbarBootstrapBindings() {
                var fonts = ['Serif', 'Sans', 'Arial', 'Arial Black', 'Courier',
                    'Courier New', 'Comic Sans MS', 'Helvetica', 'Impact', 'Lucida Grande', 'Lucida Sans', 'Tahoma', 'Times',
                    'Times New Roman', 'Verdana'],
                        fontTarget = $('[title=Font]', that.$el).siblings('.dropdown-menu');
                $.each(fonts, function(idx, fontName) {
                    fontTarget.append($('<li role="presentation"><a href="#" role="menuitem" tabindex="-1" data-edit="fontName ' + fontName + '" style="font-family:\'' + fontName + '\'">' + fontName + '</a></li>'));
                });

                if (that.options.specialCharacters) {
                    var charTarget = $('#nrm-richtext-specialchars', that.$el).siblings('.dropdown-menu');
                    $.each(that.options.specialCharacters, function(idx, character) {
                        var c = character.split(' ')[0];
                        charTarget.append($('<li role="presentation"><a href="#" class="nrm-richtext-inserttext" role="menuitem" tabindex="-1" val="' + c + '">' + character + '</a></li>'));
                    });
                } else {
                    $('#nrm-richtext-specialchars', that.$el).addClass('hidden');
                }
                //$('a[title]', that.$el).tooltip({container: 'body'});
                $('.dropdown-menu input', that.$el).click(function() {
                    return false;
                })
                        .change(function() {
                    $(this).parent('.dropdown-menu').siblings('.dropdown-toggle').dropdown('toggle');
                })
                        .keydown('esc', function() {
                    this.value = '';
                    $(this).change();
                });
                $('[data-role=magic-overlay]', that.$el).each(function() {
                    var overlay = $(this), target = $(overlay.data('target'));
                    overlay.css('opacity', 0).css('position', 'absolute').offset(target.offset()).width(target.outerWidth()).height(target.outerHeight());
                });
                if ("onwebkitspeechchange"  in document.createElement("input")) {
                    var editorOffset = $('.nrm-richtext-editor', that.$el).offset();
                    $('#nrm-richtext-voice-btn', that.$el).css('position', 'absolute').offset({top: editorOffset.top, left: editorOffset.left + $('.nrm-richtext-editor', that.$el).innerWidth() - 35});
                } else {
                    $('#nrm-richtext-voice-btn', that.$el).hide();
                }
            }
            function showErrorAlert(reason, detail) {
                console.log("error uploading file", reason, detail);
                var msg = (reason === 'unsupported-file-type') ? "Unsupported format, please select an image file." : reason + "\n" + detail;
                MessageBox("Error inserting image: \n" + msg);
            }
            initToolbarBootstrapBindings();
            var wysiwygOptions = {
                 /* JS 7/1/16:
                  * Commented out the hotKeys option due to subtly breaking changes between the "mindmup" and
                  * "steveathon" versions of the plugin:
                  * 1. $.fn.wysiwyg.defaults is now a deep extend, so we can set this option to keep the default
                  *    browser tab behavior
                  * 2. The 'ctrl' key has changed to 'Ctrl' in the defaults, so we end up with two event handlers for
                  *    the same key, one for 'ctrl+b meta+b', the other for 'Ctrl+b meta+b', and the two event handlers
                  *    cancel each other out and it appears that hotkeys aren't working.
                  * As a result, setting the hotKeys option accomplishes exactly the opposite of what we were trying to
                  * accomplish here.
                  */ 
//                hotKeys: {
//                    'ctrl+b meta+b': 'bold',
//                    'ctrl+i meta+i': 'italic',
//                    'ctrl+u meta+u': 'underline',
//                    'ctrl+z meta+z': 'undo',
//                    'ctrl+y meta+y meta+shift+z': 'redo',
//                    'ctrl+l meta+l': 'justifyleft',
//                    'ctrl+r meta+r': 'justifyright',
//                    'ctrl+e meta+e': 'justifycenter',
//                    'ctrl+j meta+j': 'justifyfull' /*,
//                     keep default browser tab behavior
//                     tried to map ctrl-tab, but the browser owns it
//                     'ctrl+shift+tab': 'outdent', 
//                     'ctrl+tab': 'indent' */
//                }, 
                fileUploadError: showErrorAlert
                , activeToolbarClass: 'active'
                , toolbarSelector: '[data-role=modal-editor-toolbar]'
                
            };

            this.listenToOnce(this, "renderComplete", function() {
                $('.nrm-richtext-editor', this.$el).wysiwyg(wysiwygOptions);
                var $modal = this.$el.closest(".modal"),
                    $editor = $('.nrm-richtext-editor', $modal);
                if (this.options.readOnly) {
                    $('.saveModal', $modal).text('Close').removeClass('disabled');
                    $('.notSaveModal', $modal).addClass('hidden');
                } else {
                    $('.saveModal', $modal).text('OK').removeClass('disabled').attr('data-dismiss', ''
                    ).on("click", _.bind(this.onSave, this));
                    $('.notSaveModal', $modal).text('Cancel').removeClass('disabled');
                }
                $editor.html(this.options.text).focus();

                // keep focus on editor when mouse is dragged outside the modal
                $(document).on("click.nrmRichText", _.bind(function(e){
                    this.keepFocus = true;
                }, this));
                $(document).on("keydown.nrmRichText", _.bind(function(e){
                    this.keepFocus = false;
                }, this));
                $editor.on("blur", _.bind(function(e) {
                    if (this.keepFocus) {
                        e.stopPropagation();
                        $(e.target).focus();
                        this.saveSelection;
                    } else {
                        this.keepFocus = false;
                    }
                }, this));

                if (this.options.readOnly) {
                    $editor.removeAttr('contenteditable').addClass('disabled');
                    $('#nrm-richtext-toolbar', $modal).addClass('hidden');
                } else {
                    $editor.focus();
                }
            });
        }
    },
        //class methods
    /**@lends module:nrm-ui/views/richTextView */
    {
        /**
         * Show the modal rich text editor.
         * @param {Object} options
         * @param {string} options.text Initial text to edit.
         * @param {string} options.title Modal view header text.
         * @param {external:module:jquery} options.target Target element that triggered the display of the modal editor.
         * @param {boolean} options.readOnly Sets read-only mode.
         * @param {function} otions.callback Callback function that is called when the modal is closed.
         * @returns {undefined}
         */
        show: function(options) {
            var view = new this(options);
            Nrm.event.trigger("app:modal", {
                caption: view.options.title,
                buttons: 1,
                backdrop: "static",
                view: view,
                callback: view.options.callback
            });
        }
    }

        );
});