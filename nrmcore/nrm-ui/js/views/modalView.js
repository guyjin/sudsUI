/**
 * @file The ModalView extends {@link http://backbonejs.org/#View|Backbone.View} to provide a modal container view.
 * @see module:nrm-ui/views/modalView
 */
/** 
 * @module nrm-ui/views/modalView
 * 
 */

define(['..', 'jquery', 'underscore', 'backbone', 'handlebars', 'hbs!modal', 'hbs!error'], 
         function(Nrm, $, _, Backbone, Handlebars, modalTemplate, errorTemplate) {
    
    /**
     * Options for displaying the modal.
     * @typedef {Object} ModalConfig
     * @property {module:nrm-ui/views/modalView~ModalClosedCallback} callback Function that will be called when the 
     * modal box is closed, with the ModalView instance as the "this" reference.
     * @property {string} [helpContext] Context-sensitive help URL, may be relative to the helpContextRoot defined in
     * {@link module:nrm-ui/models/application~AppConfig|main application configuration}, or an absolute URL.
     * @property {string} caption Text to display in the modal header.
     * @property {external:module:backbone.View} [view] Nested view to render in the modal body.
     * @property {string} [text] Text to display in the modal body, HTML characters will be escaped.
     * @property {string} [content] HTML content to display in the modal body, HTML characters will not be escaped.
     * @property {string} [template] Template name to render the content of the modal body, the entire options hash
     * will provide the context for the template.
     * @property {module:nrm-ui/resourceCache~ErrorInfo} [error] Error info that will be rendered using the standard
     * error template by default
     * @property {Boolean} [formatError=true] If the error option is defined, assume we want to render using the
     * default error template unless otherwise specified.
     * @property {string} [modalId] The element id for the modal container, a unique id will be generated if it is not
     * specified.
     * @property {module:nrm-ui/views/baseView~ControlConfig[]} [actions] Buttons (or technically any type of control) 
     * to display in the modal footer.
     * @property {Number} [buttons=0] Default buttons to render if the actions array is empty or not set, represents 
     * one of the static constants defined on ModalView. The default is the OK button.
     * @property {Object.<string, Function|string>} [events] Additional events to delegate on the modal container.
     * @property {Boolean} [animate=false] Enable fade animation on the Bootstrap Modal plugin.
     * @property {Boolean|string} [backdrop=true] Show the modal backdrop, or the string "static" to prevent closing
     * the modal when the backdrop is clicked.
     * @property {string} [inputField] Selector of an input field in the modal that provides the result value that
     * will be acted on in the closed callback.
     * @property {Boolean} [hideCloseIcon=true] Do not show the "X" aka Close icon.
     * @param {Boolean} [options.movable=false] Allow modal to be dragged.
     */
    
    /**
     * Function that will be called when the modal box is closed.
     * @callback ModalClosedCallback
     * @param {module:nrm-ui/views/modalView} modal The ModalView instance.
     * @param {external:module:jquery} element The element that was clicked to close the modal, or the modal container
     * element if the clicked element could not be determined.
     */
    
    return Nrm.Views.ModalView = Backbone.View.extend(/** @lends module:nrm-ui/views/modalView.prototype */ {
        /**
         * Create a new instance of the ModalView.  Application developers will typically not create an instance of
         * this type directly, instead trigger the "app:modal" event on {@link module:nrm-ui/main.event|Nrm.event}.
         * @constructor
         * @alias module:nrm-ui/views/modalView
         * @classdesc
         *  Extends {@link http://backbonejs.org/#View|Backbone.View} to provide a modal container view using the
         *  {@link http://getbootstrap.com/javascript/#modals|Twitter Bootstrap Modal plugin}. 
         * @param {module:nrm-ui/views/modalView~ModalClosedCallback|module:nrm-ui/views/modalView~ModalConfig} callback 
         * First parameter can be a callback function, or options hash described by 
         * {@link module:nrm-ui/views/modalView~ModalConfig|ModalConfig}.
         * @param {module:nrm-ui/views/modalView~ModalConfig|Object} [options] If first parameter is a function,
         * second parameter should be the options hash minus the callback option, otherwise, second parameter is the 
         * events hash described in the third parameter.
         * @param {Object} [events] Events hash to delegate additional (or override) events on the view.
         * @see {@link http://backbonejs.org/#View-constructor|Backbone View constructor / initialize}
         */ 
        initialize: function(callback, options, events) {
            
            if (!$.isFunction(callback)) {
                options = callback || { };
                if (options.callback) {
                    this.callback = options.callback;
                }
                events = options;
            } else {
                /**
                 * The callback function.
                 * @type {module:nrm-ui/views/modalView~ModalClosedCallback}
                 */
                this.callback = callback;
            }
            /**
             * Initialization options.
             * @type {module:nrm-ui/views/modalView~ModalConfig}
             */
            this.options = $.extend({ modalId: _.uniqueId("modal") }, this.defaults, options);
            
            //backwards-compatibility
            this.options.helpUrl = this.options.helpUrl || this.options.help || this.options.helpContext;
            
            var error = this.options.error;
            if (error) {
                this.options.template = this.options.template || "error";
                this.options.caption = this.options.caption || "Error";
                if (error.response && !error.isHtml && !error.isText) {
                    if (error.response.responseJSON) {
                        error.isJson = true;
                        error.details = error.response.responseJSON;
                    }
                }
                if (this.options.formatError === undefined)
                    this.options.formatError = true;
            }
            var defaultEvents = $.extend({ }, this.defaultEvents);
            
            var btn = this.options.actions;
            if (!$.isArray(btn) || btn.length === 0) {
                btn = this.options.actions = this.getButtons();
                for (var i = 0; i < btn.length; i++) {
                    defaultEvents["click #" + btn[i].id] = "close";
                }
            }
            /**
             * Backbone events hash
             * @type {object}
             * @see {@link http://backbonejs.org/#View-events|Backbone.View#events}
             */
            // allow caller to override the default events...
            this.events = $.extend(defaultEvents, this.events, this.options.events, events);   
            // ... except for this one
            this.events["hidden.bs.modal"] = "onHide";
            this.events["hide.bs.modal"] = "beforeClose";
            //this.setElement($(this.options.id));
            /**
             * Zero-based index of the button that was clicked to close the form, or -1 if no button was clicked.
             * @type {Number}
             */
            this.clicked = -1;
        },
        /**
         * Default events
         * @type {object}
         */
        defaultEvents: {
            "submit form" : "onSubmit",
            "keypress .modal-body": "handleEnterKey",
            "keypress .modal" : "handleEnterKeyTopLevel"
        },
        /**
         * Default options
         * @type {module:nrm-ui/views/modalView~ModalConfig}
         */
        defaults: {
            id: "#modalView",
            animate: false,
            backdrop: true,
            keyboard: true,
            remote: false,
            buttons: 0,
            primary: 0,
            //caption: "Message",
            icon: 0,
            helpContext: false,
            template: "",
            okBtn: { type: "btn", id: "modal-ok", className: "saveModal", label: "OK", btnStyle: "primary" },
            cancelBtn: { type: "btn", id: "modal-cancel", className: "notSaveModal", label: "Cancel" },
            yesBtn: { type: "btn", id: "modal-yes", className: "saveModal", label: "Yes", btnStyle: "primary" },
            noBtn: { type: "btn", id: "modal-no", className: "notSaveModal", label: "No" },
            retryBtn: { type: "btn", id: "modal-retry", label: "Retry", btnStyle: "primary" },
            saveBtn: { type: "btn", id: "modal-save", className: "saveModal", label: "Save changes", btnStyle: "primary" },
            updateBtn: { type: "btn", id: "modal-update", className: "saveModal", label: "Update", btnStyle: "primary" },
            abandonBtn: { type: "btn", id: "modal-abandon", label: "Abandon changes" }

        },
        /**
         * Get the default buttons
         * @returns {module:nrm-ui/views/baseView~ControlConfig[]}
         */
        getButtons: function() {
            var btn = this.options.buttons;
                // convert const to buttons
            switch (btn) {
                case Nrm.Views.ModalView.OK:
                    btn = [ this.defaults.okBtn ];
                    break;
                case Nrm.Views.ModalView.OK_CANCEL:
                    btn = [ this.defaults.okBtn,
                        this.defaults.cancelBtn ];
                    break;
                case Nrm.Views.ModalView.YES_NO:
                    btn = [ this.defaults.yesBtn,
                        this.defaults.noBtn ];
                    break;
                case Nrm.Views.ModalView.YES_NO_CANCEL:
                    btn = [ this.defaults.yesBtn,
                        this.defaults.noBtn,
                        this.defaults.cancelBtn ];
                    break;
                case Nrm.Views.ModalView.RETRY_CANCEL:
                    btn = [ this.defaults.retryBtn,
                        this.defaults.cancelBtn ];
                    break;
                case Nrm.Views.ModalView.SAVE_CANCEL:
                    btn = [ this.defaults.saveBtn,
                        this.defaults.cancelBtn ]; 
                    break;
                case Nrm.Views.ModalView.SAVE_ABANDON_CANCEL:
                    btn = [ this.defaults.saveBtn,
                        this.defaults.abandonBtn,
                        this.defaults.cancelBtn ];
                    break;
                case Nrm.Views.ModalView.UPDATE_CANCEL:
                    btn = [ this.defaults.updateBtn, this.defaults.cancelBtn ]; 
                    break;
                default:
                    btn =  [];
            }
            return btn;
        },
        /**
         * Default event handler for button click that closes the modal.
         * @param {Event} evt Event data.
         * @returns {undefined}
         */
        close: function(evt) {
            var id = evt.currentTarget.id, clicked = -1;
            var btn = this.getButtons();
            if (btn.length === 0)
                btn = this.options.actions;
            for (var i = 0; i < btn.length; i++) {
                if (btn[i].id === id) {
                    clicked = i;
                    break;
                }
            }
            var okButton = $(evt.currentTarget).is(".saveModal") || (clicked === 0 && !$(".saveModal", this.$el).length);
            var afterValidate = _.bind(function(valid) {
                if (valid === false) return;
                this.clicked = clicked;
                /**
                 * The id of the element that was clicked to close the modal, this remains undefined until the modal is
                 *  closed.
                 * @name module:nrm-ui/views/modalView#clickedId
                 * @type {?string}
                 */
                this.clickedId = id;
                if (okButton) {
                    if (this.options.view && _.isFunction(this.options.view.setDirty))
                       this.options.view.setDirty(false);

                    if (this.options.inputField) {
                        /**
                         * The value of the input field that was identified in the inputField option, this remains
                         * undefined until the modal is closed.
                         * @name module:nrm-ui/views/modalView#inputVal
                         * @type {*}
                         */
                        this.inputVal = this.$el.find(this.options.inputField).val();
                    }
                }
                $('.modal', this.$el).modal("hide");
            }, this);
            
            if (okButton && this.options.view && _.isFunction(this.options.view.validate)) {
                $.when(this.options.view.validate(true, {event: evt})).done(afterValidate);
            } else {
                afterValidate()
            }
        },
        /**
         * Event handler for the Bootstrap Modal hide event, provides an opportunity to cancel to event.
         * @param {Event} event Event data
         * @returns {Boolean}
         */
        beforeClose: function(event) {
            // datepicker is also a modal view, so make sure we're handling the right one
            if (event.target.id === this.options.modalId && this.options.view && _.result(this.options.view, "isDirty")) {
                if (!confirm("Data have been modified.  Are you sure you want to exit and lose the changes?")) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    return false;
                }
            }
            //Nrm.event.trigger("closeModal");
        },
        /**
         * Event handler for Bootstrap Modal hidden event, calls the callback and removes the nested view.
         * @param {Event} evt Event data
         * @returns {undefined}
         */
        onHide: function(evt) {
            //this.undelegateEvents();
            // datepicker is also a modal view, so make sure we're handling the right one
            if (evt.target.id !== this.options.modalId) return;
            /**
             * Indicates that the modal has been closed.
             * @name module:nrm-ui/views/modalView#closed
             * @type {?Boolean}
             */
            this.closed = true;
            if (this.callback) {
                try {
                    this.callback(this, this.clickedId ? $("#" + this.clickedId, this.$el) : this.$el);
                } catch (error) {
                    console.log("ModalView callback failed.");
                    console.log(error);
                }
            }
            if (this.options.view && this.options.view.remove) {
                this.options.view.remove();
            }
            this.remove();
        },
        /**
         * Render the modal container.
         * @returns {undefined}
         */
        render: function() {
            //var template = Handlebars.templates["modal"];
            if (this.options.formatError) {
                var t1 = this.options.template ? Handlebars.templates[this.options.template] : errorTemplate;
                if (t1) {
                    this.options.content = Nrm.app.formatErrorHtml(t1(this.options), true);
                    delete this.options.template;
                }
            }
            this.$el.html(modalTemplate(this.options));
            /**
             * Class to apply to all buttons in the modal container.
             * @name module:nrm-ui/view/modalView.btnClass
             * @type {?string}
             */
            if (this.constructor.btnClass) {
                $(".btn", this.$el).addClass(this.constructor.btnClass);
            }
            if (this.options.helpContext) {
                this.$el.one('focusin', null, this.options.helpContext, function(e) {
                    if ($(e.target).closest('.nrm-help-provider').length)
                        return; // handled elsewhere
                    /**
                     * Set the help context
                     * @event module:nrm-ui/event#app:setHelpContext
                     * @param {string} [helpContext] The help context topic, defaults to the helpContext attribute set 
                     * in the main application configuration.
                     */
                    Nrm.event.trigger('app:setHelpContext', e.data);
                });
            }
            $('.modal', this.$el).modal(this.options);
            if (this.options.view) {
                var rendered = false;
                function onRenderComplete() {
                    if (rendered) {
                        this.options.view.trigger("renderComplete", this, this.options.view);
                    }
                    rendered = true;
                }
                this.listenToOnce(this, "renderComplete", onRenderComplete);
                var render = this.options.view.renderDeferred || this.options.view.render;
                var self = this;
                $.when(render.call(this.options.view)).done(function() {
                    $(".modal-body", self.$el).append(self.options.view.$el);
                    onRenderComplete.call(self);
                });
            }
            if (this.options.movable) {
                $(".modal-dialog", this.$el).draggable();
            }
       },
       /**
        * Event handler for the Enter key in the modal body, performing the default submit behavior described in 
        * {@link module:nrm-ui/views/modalView#defaultSubmit|defaultSubmit function}, unless the element that was 
        * clicked is a child of a form.
        * @param {Event} e Event data.
        * @returns {undefined}
        */
       handleEnterKey: function(e) {
           if (e.which !== 13) return;
           var $target = $(e.target);
           if (!$target.closest('form').length)
               this.defaultSubmit(e);
       },
       /**
        * Event handler for the Enter key when the modal container element is focused, performing the default submit
        * behavior described in {@link module:nrm-ui/views/modalView#defaultSubmit|defaultSubmit function}, unless 
        * there is a form in the modal body.
        * @param {Event} e Event data.
        * @returns {undefined}
        */
       handleEnterKeyTopLevel: function(e) {
           if (e.which !== 13) return;
           var $target = $(e.target); 
           if ($target.is('.modal') && !$('.modal-body form', $target).length)
               this.defaultSubmit(e);
       },
       /**
        * Event handler for the submit event, prevents the browser default and performs the default submit behavior
        * described in {@link module:nrm-ui/views/modalView#defaultSubmit|defaultSubmit function}.
        * @param {Event} e Event data.
        * @returns {Boolean}
        */
       onSubmit: function(e) {
            this.defaultSubmit(e);
            e.preventDefault();
            return false;
       },
       /**
        * Simulates clicking the primary button in the modal footer, unless the event was raised from a form that has
        * an actual submit button, in which case it is assumed the event is already handled.
        * @param {Event} e Event data.
        * @returns {undefined}
        */
       defaultSubmit: function(e) {
            var $form = $(e.target);
            if (!$form.is('form'))
                $form = $form.closest('form');
            if ($form.length && $('[type="submit"]', $form).length)
                return; // assume the event is handled by a click handler on the submit button
            
            var btn = $('.modal-footer .btn-primary', this.$el);
            if (btn.length === 1)
                btn.click(); // if there is only one btn-primary in the modal, click it
       }
    },/** @lends module:nrm-ui/views/modalView */ {
        /* standard button groups */
        /** 
         * OK button
         * @constant
         * @type {Number}
         * @default
         */
        OK: 0,
        /**
         * OK and Cancel buttons
         * @constant
         * @type {Number}
         * @default
         */ 
        OK_CANCEL: 1, 
        /**
         * Yes and No buttons
         * @constant
         * @type {Number}
         * @default
         */ 
        YES_NO: 2, 
        /**
         * Yes, No and Cancel buttons
         * @constant
         * @type {Number}
         * @default
         */ 
        YES_NO_CANCEL: 3, 
        /**
         * Retry and Cancel buttons
         * @constant
         * @type {Number}
         * @default
         */
        RETRY_CANCEL: 4, 
        /**
         * Save and Cancel buttons
         * @constant
         * @type {Number}
         * @default
         */
        SAVE_CANCEL: 5,
        /**
         * Save, Abandon and Cancel buttons
         * @constant
         * @type {Number}
         * @default
         */
        SAVE_ABANDON_CANCEL: 6, 
        /**
         * Update and Cancel buttons
         * @constant
         * @type {Number}
         * @default
         */
        UPDATE_CANCEL: 7,
        /* standard icons */
        /**
         * Info icon
         * @constant
         * @type {Number}
         * @default
         */
        INFO: 1, 
        /**
         * Warning icon
         * @constant
         * @type {Number}
         * @default
         */
        WARNING: 2, 
        
        /**
         * Error icon
         * @constant
         * @type {Number}
         * @default
         */
        ERROR: 3
        //, btnClass: "btn-sm" // for smaller buttons on all modals
        
    });
});