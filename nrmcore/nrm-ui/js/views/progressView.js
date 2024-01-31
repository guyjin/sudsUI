/**
 * @file The ProgressView extends {@link http://backbonejs.org/#View|Backbone.View} to provide a progress bar.
 * @see module:nrm-ui/views/progressView
 */
/** 
 * @module nrm-ui/views/progressView
 * 
 */

define([
    '..',
    'jquery',
    'underscore',
    'backbone',
    'handlebars',
    './baseView',
    'hbs!progress'
], 
         function(
            Nrm,
            $,
            _,
            Backbone,
            Handlebars,
            BaseView,
            Template
        ) {
    
    /**
     * Options for displaying the progress indicator.
     * @typedef {Object} ProgressConfig
     * @param {external:module:jquery} $parent The parent element
     * @property {module:nrm-ui/views/progressView~ProgressClosedCallback} callback Function that will be called when 
     *  the progress indicator is closed by the user.
     * @property {string} [text] Text to display in the completed area of the progres bar.
     *  Including "<percentComplete>" will include the value as percentageComplete changes.
     * @property {string} [title] Text to place in the title tag of the progres bar.
     *  Including "<percentComplete>" will include the value as percentageComplete changes.
     * @property {string} [id] The element id for the progress container; a unique id will be generated if it is not
     *  specified.
     * @property {Boolean} [hideCloseIcon=true] Do not show the "X" aka Close icon.
     * @property {string} [closeIconTitle="Close"] Text for title tag of Close icon.
     * @property {Boolean} [closeWhenDone=true] When percentComplete reaches 100, remove the indicator from the DOM and
     *   execute the callback function if any. Otherwise, leave indicator visible until user or caller closes it.
     * @property {Boolean} [animated=false] Display with striped with active classes.
     * @property {string} [type=info] info: blue, success: green, warning: orange, danger: red
     */
    
    /**
     * Function that will be called when the progress indicator is closed.
     * @callback ProgressClosedCallback
     * @param {module:nrm-ui/views/progressView} view The ProgressView instance.
     */
    
    return Nrm.Views.ProgressView = BaseView.extend(/** @lends module:nrm-ui/views/progressView.prototype */ {
        /**
         * Create a new instance of the ProgressView.
         * @constructor
         * @alias module:nrm-ui/views/progressView
         * @classdesc
         *  Extends {@link http://backbonejs.org/#View|Backbone.View} to provide a progress indicator view using the
         *  {@link http://getbootstrap.com/components/#progress|Twitter Bootstrap Progress component}. 
         * @param {module:nrm-ui/views/progressView~ProgressConfig} option Options hash described by 
         *  {@link module:nrm-ui/views/modalView~ModalConfig|ModalConfig}.
         * @see {@link http://backbonejs.org/#View-constructor|Backbone View constructor / initialize}
         */ 
        initialize: function(options) {
            options = options || {};
            if (options.closeIconTitle) {
                options.hideCloseIcon = false;
            }
            this.options = _.defaults(options, {
                animated: false,
                id: this.$el.id,
                closeIconTitle: "Close",
                closeWhenDone: true,
                hideCloseIcon: true,
                percentComplete: 0,
                type: "info"
            });
            //console.log("progressView options", this.options);
            if (this.options.animated && !this.options.PercentComplete) {
                this.options.percentComplete = 100;
            }
        },
        setPercentComplete: function(percentComplete) {
            //console.log("progressView.setPercentComplete " + percentComplete.toString());
            var $pb = $(".progress-bar", this.$el),
                pbStyle = $pb.attr("style").replace(/width:.*%/,"width: " + percentComplete.toString() + "%");
            $pb.attr("style", pbStyle).attr("aria-valuenow", percentComplete.toString());
        },
        setText: function(text) {
            var $pb = $(".progress-bar", this.$el);
            $pb.text(text);
        },
        /**
         * Default event handler for button click that closes the progress indicator.
         * @param {Event} evt Event data.
         * @returns {undefined}
         */
        close: function(evt) {
            //console.log("progressView.close", evt);
            if (this.options.callback) {
                //console.log("progressView executing close callback");
                this.options.callback.call(this, this);
            }
            this.remove();
        },
        events: {
            "click .close": "close"
        },
        /**
         * Render the progress indicator.
         * @returns {undefined}
         */
        render: function() {
            this.$el.html(Template(this.options));
            this.options.$parent.append(this.$el);
            return this;
       }
    });
});