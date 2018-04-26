/**
 * @file The EditorView extends {@link module:nrm-ui/views/validationAwareView|ValidationAwareView} to provide a generic 
 * implementation of a data entry form. 
 * @see module:nrm-ui/views/editorView
 */
define([
    '..', 
    'jquery', 
    'underscore', 
    './validationAwareView', 
    'hbs!error'
], function(Nrm, $, _, ValidationAwareView, errorTemplate) {
    /**
     * @exports nrm-ui/views/editorView
     */
    var EditorView = Nrm.Views.EditorView = ValidationAwareView.extend(
            /** @lends module:nrm-ui/views/editorView.prototype */ {
        /**
         * A class name that will be applied to the container element
         * @type {string}
         * @default
         */
        className: "container",
        /**
         * Overrides {@link module:nrm-ui/views/baseView#genericTemplate} to set the default generic template for a
         * data entry view.
         * @type {string}
         * @default
         */
        genericTemplate: "editForm",
        /**
         * Create a new instance of the EditorView.  
         * @constructor
         * @alias module:nrm-ui/views/editorView
         * @classdesc
         *   A Backbone view that extends {@link module:nrm-ui/views/baseView|BaseView} to provide generic editing 
         *   functionality.
         * @param {Object} options
         * @param {module:nrm-ui/models/application~ContextConfig} options.context The context configuration.
         * @param {string} options.path The navigation path.
         * @param {external:module:backbone.Model} options.model The model to bind to the view.
         * @param {string} options.modelId The id of the model.
         * @param {external:module:backbone.Model} [options.parentModel] The parent model.
         * @param {string} [options.route="edit"] The route prefix associated with this view.
         * @param {string} [options.group] The group attribute value to set if creating a new model from the context
         * menu on a group folder node.
         * @param {string} [options.subtype] The subtype attribute value to set if creating a new model for a subtype. 
         * @see {@link http://backbonejs.org/#View-constructor|Backbone View constructor / initialize}
         */
        initialize: function(options){
            var opts = this.options = $.extend({ route: "edit" }, options);
            var ctx = this.context = opts.context || { };
            var defaultEvents = $.extend({ 
                "click #editor-save,.nrm-edit-btnsave,.nrm-edit-btnsave-addnew" : "onSave",
                "click #editor-reset,.nrm-edit-btnreset" : "onReset",
                "click #editor-cancel,.nrm-edit-btncancel" : "onCancel",
                "click #editor-delete,.nrm-edit-btndelete" : "onDelete"
              }, this.changeEvents, ValidationAwareView.prototype.events, this.defaultEvents);
            this.events = this.mixEvents(defaultEvents);

            var self = this;
            /**
             * Promise that is resolved when the configuration finishes loading.
             * @type {external:module:jquery~Promise}
             */
            this.configLoading = new $.Deferred();
            $.when(this.getEditorConfig()).done(function(config) {
                self.config = self.mixEditorConfig(config || { });
                self.config.title = self.config.title || ctx.alias;
                self.config.breadcrumbs = self.options.breadcrumbs;
                self.config.actions = self.config.actions || self.defaultActions;
                self.config.btnClass = self.config.btnClass || "btn-sm";
                $.when(self.loadTemplate(), $.when(self.initControls(self.config.controls, function(control, el) {
                        if (self.config.inputClass && el && el.length > 0) {
                            $(".form-control", el).addClass(self.config.inputClass);
                        }
                    })).done(function (controls) {
                        self.config.controls = controls;
                    })).done(function() {
                        self.configLoading.resolve(self.config);
                    }).fail(self.configLoading.reject);
            }).fail(self.configLoading.reject);
            if (this.customInitialize)
                this.customInitialize(options);
        },
        /**
         * Mix in editor view configuration from global "forms" configuration.
         * @param {module:nrm-ui/views/baseView~FormConfig} config The configuration object to mix into.
         * @returns {module:nrm-ui/views/baseView~FormConfig}
         * The original configuration with global options mixed in.
         */
        mixEditorConfig: function(config) {
            return this.mixConfig('editor', config);
        },
        /**
         * Gets the form header text.
         * @returns {string}
         */
        getTitle: function() {
            return this.config.title || this.context.alias;
        },
        /**
         * Hash of events that will be listened to in the 
         * {@link module:nrm-ui/views/baseView#delegateModelEvents|delegateModelEvents function}.
         * Keys are model event names, values are either a function or a string which is interpreted
         * as the name of a function defined on the view prototype.
         * @type {Object}
         */
        modelEvents: {
            change: 'onModelChanged',
            destroy: 'onModelDestroyed'
        },
        onModelChanged: function() {
            // do not validate if change event triggered during save...
            if (!this.saving) {
                this.validate(false, {
                    changed: this.model.changedAttributes() 
                });
            }
        },
        onModelDestroyed: function() {
            // fixes bug causing incorrect prompt to save changes when deleting a modified record.
            this.dirty = false;
        },
        /**
         * Override of {@link module:nrm-ui/views/baseView#renderDeferred|BaseView#renderDeferred}
         * @returns {external:module:jquery~Promise}
         * Promise that is resolved or rejected when the model has finished loading.
         */
        renderDeferred: function() {
            this.removed = false;
            this.stopListening();
            this.destroyControls();
            var onLoad = _.bind(function() {
                //this.setBusy(false);
                if (!this.removed) {
                    this.renderAndFocus();
                }
            }, this);
            var onFail = _.bind(function() {
                //this.setBusy(false);
                this.onFail.apply(this, arguments);
                
            }, this);
            if (this.loading && this.loadingId !== this.options.modelId) {
                // TODO: abort request
                this.loading = false;
            }
//            this.setBusy(true, {
//                statusText: 'Loading data...',
//                size: 'large'
//            });
            return $.when(this.loading || this.loadData()).done(onLoad).fail(onFail);
        },
        /**
         * Override of {@link module:nrm-ui/views/baseView#onRemove|BaseView#onRemove}.   Destroys all controls and 
         * sets dirty flag to false without triggering the "dirtyChanged" event.
         * @returns {undefined}
         */
        onRemove: function() {
            // the call to this.destroyControls has been moved to the BaseView
            //this.destroyControls();
            this.dirty = false;
            /**
             * May be triggered when a view is removed.
             * @deprecated This has been replaced by {@link module:nrm-ui/event#layout:clearForm} event.
             * @event module:nrm-ui/event#context:clearForm
             * @param {Object} options
             */
            Nrm.event.trigger("context:clearForm", { 
                model: this.model,
                path: this.options.path,
                context: this.context,
                view: this
            });
        },
        /**
         * Default actions button configuration
         * @type {module:nrm-ui/views/baseView~ControlConfig[]}
         */
        defaultActions: [ 
            { 
                type: "btn", 
                id: "editor-save", 
                label: "Save", 
                btnStyle: "primary", 
                className: "btn-sm nrm-enable-changed nrm-edit-btnsave",
                title: "Save changes",
                submit: true
            },  
            { 
                type: "btn", 
                id: "editor-reset", 
                label: "Reset", 
                className: "btn-sm nrm-enable-changed nrm-edit-btnreset" ,
                title: "Reload the form"
            },
            { 
                type: "btn", 
                id: "editor-cancel", 
                label: "Cancel", 
                className: "btn-sm nrm-enable-readonly nrm-edit-btncancel",
                title: "Cancel edits and return to grid view"
            },
            { 
                type: "btn", 
                id: "editor-delete", 
                label: "Delete", 
                className: "btn-sm pull-right nrm-disable-new nrm-edit-btndelete"
            }
        ],
        /**
         * Handler for the "dirtyChanged" event, adds "Changed" badge in the form header if it is not a new record,
         * and enables or disables elements that have the "nrm-enable-changed" indicator class.
         * @returns {undefined}
         */
        dirtyChanged: function() {
            if (this.readonly) return;
            if (!this.model.isNew()) {
                var html = this.getTitle();
                if (this.isDirty()) {
                    html += ' <small><span class="label label-default nrm-editstate">Changed</span></small>';
                }
                this.$el.find(".nrm-form-title").html(html);
                this.setControlEnabled($(".nrm-enable-changed", this.$el), this.isDirty());
            } else {
                this.setControlEnabled($(".nrm-enable-changed", this.$el).not(".nrm-enable-new,.nrm-disable-new"), this.isDirty());
            }
        },
        /**
         * Notifies the user when the save is successful.  Default implementation shows a modal box with a generic
         * message.
         * @todo Change this from a modal to the PNotify non-modal message box.
         * @param {external:module:backbone.Model} model The model that was saved.
         * @param {external:module:jquery~jqXHR} response The XHR object.
         * @param {Object} options The options that were passed to the Backbone sync.
         * @returns {undefined}
         */
        saveCompleted: function(model, response, options) {
            Nrm.event.trigger("app:modal", ( {
                "text": "Save was successful.", 
                "caption": "Success!"
            }));  
        },
        /**
         * Notifies the user when the save failed. Default implementation shows a non-modal message box if the error
         * response indicates a validation error, or modal box for all other errors.
         * @todo We should probably show the same type of message box for all errors, or at least interpret other
         * 400-series errors as validation errors.
         * @param {external:module:backbone.Model} model The model that failed to save.
         * @param {external:module:jquery~jqXHR} xhr The XHR object.
         * @param {Object} options The options that were passed to the Backbone sync.
         * @returns {undefined}
         */
        saveFailed: function(model, xhr, options) {
            var data = {
                "error": Nrm.app.normalizeErrorInfo("Failed to save " + this.getTitle() + ".", model, xhr, options) 
            };
            if (data.error.response && data.error.response.status === 406) {
                //var template = Handlebars.templates["error"];
                Nrm.event.trigger('showErrors', errorTemplate(data), { notify: true, focusEl: "#main-content" });
            } else {
                Nrm.event.trigger("app:modal", $.extend(data, { focusEl: "#main-content" }));
            }
        },
        /**
         * Save the model, usually in response to activating a Save button.  If the button has the 
         * "nrm-edit-btnsave-addnew" indicator class, this view is removed after a successful save and replaced with
         * a form rendered for a new record.
         * @param {Event} [event] Event data, if save was triggered by a UI event.
         * @returns {Boolean|external:module:jquery~Promise}
         * Returns false if the model is invalid according to the 
         * {@link nrm-ui/views/editorView#validate|validate function}, or a promise that is resolved or rejected
         * depending on the success of the save attempt.
         *  
         */
        onSave: function(event) {
            if (this.saving) {
                // in case save is called again before previous save attempt completed...
                return this.saving;
            }
            this.modelIsValidated = false;
            var async = true, validated = !this.busy && this.validate(true, {event: event}),
                    savingModel,
                    dfd,
                    loadingOptions = {
                        statusText: 'Saving changes, please wait...',
                        size: 'large'
                    },
                    saveFinished = _.bind(function() {
                        if (savingModel) {
                            this.stopListening(savingModel, 'invalid', saveFinished);
                        }
                        async = this.saving = false;
                        this.setBusy(false);
                    }, this),
                    afterValidate = _.bind(function(result) {
                        var opt = {
                            model: result.attributes ? result : this.model,
                            collection: this.collection,
                            path: this.options.path
                        }, 
                                defaults = {global: false}, 
                                isNew = this.model.isNew();
                                
                        if (this.modelIsValidated) {
                            defaults.validate = false;
                        }
                        opt.saveOptions = $.extend(defaults, this.config && this.config.saveOptions);
                        if (isNew) {
                            opt.modelCid = this.modelCid;
                        }
                        if (opt.saveOptions.validate) {
                            // callbacks will not fire if validate option is true and model is invalid.
                            savingModel = opt.model;
                            this.listenTo(savingModel, 'invalid', saveFinished);
                        }
                        return $.when(Nrm.app.saveModel(opt, this)).always(saveFinished)
                                .done(function(model, response, options) {
                            //if (!this.useDefaultRendering)
                            //    this.stopListening(this.model);
                            //if (model) 
                            //    this.model = model.clone();
                            this.setDirty(false);
                            this.options.modelId = this.model.id;
                            if (isNew && this.options.path && !model.isNew()) {
                                var path = this.options.path;
                                this.options.path = path + this.model.id;
                                if (event && event.currentTarget && $(event.currentTarget)
                                        .is('.nrm-edit-btnsave-addnew')) {
                                    console.log('EditorView in save and add new...');
                                    Nrm.app.triggerEvent('context:beginCreate', { path: path });
                                    this.saveCompleted(model, response, options);
                                    return;
                                } else if (this.options.route) {
                                    // After saving a new model, if the result is not a new model, switch the current 
                                    // route from #create/apikey to #edit/apikey/id
                                    Nrm.app.navigateUrl(this.options.route + '/' + this.options.path, { 
                                        trigger: false, 
                                        replace: true 
                                    });
                                }
                            }
                            if (!this.useDefaultRendering) {
                                //this.delegateModelEvents();
                                if (isNew && !this.readonly) {
                                    this.setControlEnabled($('.nrm-enable-new', this.$el), false);
                                    this.setControlEnabled($('.nrm-disable-new', this.$el)
                                            .not('.nrm-enable-changed'), true);
                                }
                            } else {
                                this.stopListening();
                                this.destroyControls();
                                this.renderAndFocus({ restore: false });
                            }
                            this.saveCompleted(model, response, options);
                        }).fail(this.saveFailed);                
            }, this);
            if (validated && _.isFunction(validated.promise)) {
                dfd = $.Deferred();
                this.setBusy(true, loadingOptions);
                $.when(validated).done(function(result) {
                    console.log('EditorView - onSave after validating async rules');
                    if (result) {
                        $.when(afterValidate(result)).done(dfd.resolve).fail(dfd.reject);
                    } else {
                        saveFinished();
                        console.log('EditorView - onSave after validating async rules REJECTED');
                        dfd.reject(result);
                    }
                }).fail(function() {
                    saveFinished();
                    dfd.reject.apply(dfd, arguments);
                });
                validated = dfd.promise();
            } else if (validated) {
                this.setBusy(true, loadingOptions);
                validated = afterValidate(validated);
            }
            if (validated && async) {
                /**
                 * A jQuery Promise that is set while the view is saving changes, set to false after save is finished. 
                 * @name module:nrm-ui/views/editorView#saving
                 * @type {?external:module:jquery~Promise|boolean}
                 */
                this.saving = validated;
            }
            return validated;
        },
        /**
         * Reset the form, by reloading the model or clearing the form if it is a new model.  Prompts user to save
         * changes if there are unsaved changes.
         * @returns {undefined}
         */
        onReset: function() {
            // TODO: it may be better to trigger the create/edit event and render a new instance of the view
            var self = this;
            $.when(this.allowRemove()).done(function () {
                if (!self.removed)  {
                    self.model = null;
                    self.setBusy(true, {
                        statusText: 'Reloading data, please wait...',
                        size: 'large'
                    });
                    $.when(self.renderDeferred()).always(function() {
                        self.setBusy(false);
                    });
                }
            });
        },
        /**
         * Cancel the form, prompting the user to save changes if there are unsaved changes.
         * @returns {undefined}
         */
        onCancel: function() {
            var self = this;
            $.when(this.allowRemove()).done(function () {
                self.remove();
                /**
                 * Data entry form has been cancelled.
                 * @event module:nrm-ui/event#context:cancelEdit
                 * @param {Object} options
                 * @param {external:module:backbone.Model} options.model The model bound to the view
                 * @param {string} options.path The navigation path
                 * @param {module:nrm-ui/models/application~ContextConfig} options.context The entity context 
                 * configuration
                 * @param {external:module:backbone.View} options.view The view that was cancelled.
                 */
                Nrm.event.trigger("context:cancelEdit", { 
                    model: self.model,
                    path: self.options.path,
                    context: self.context,
                    view: self

                });
            });
        },
        /**
         * Prompts the user to confirm that they really want to delete the model.
         * @param {Function} callback Callback function to execute if the user confirms the delete.
         * @param {string} [item] Entity name to display in the caption, default is the form header.
         * @returns {undefined}
         */
        confirmDelete: function(callback, item) {
            var self = this;
            item = item || this.getTitle();
            Nrm.event.trigger("app:modal", { 
                buttons: 2,
                caption: "Delete " + item, 
                content: "<p>This operation cannot be undone if you proceed.</p>" +
                        "<p>Are you sure you want to delete this " + 
                        item + "?</p>",
                callback: function() {
                    var doIt = this.clicked === 0;
                    if (doIt) {
                        callback.call(self);
                    }
                }
            });
        },
        /**
         * Notifies the user if the delete failed.
         * @param {external:module:backbone.Model} model The model that failed to deleted.
         * @param {external:module:jquery~jqXHR} xhr The XHR object.
         * @param {Object} options The options that were passed to the Backbone sync.
         * @returns {undefined}
         */
        deleteFailed: function(model, xhr, options) {
            Nrm.event.trigger("app:modal", ( {
                "error": Nrm.app.normalizeErrorInfo("Failed to delete " + this.getTitle() + ".", model, xhr, options)
            }));
        },
        /**
         * Complete the deletion by removing the view. 
         * @param {external:module:backbone.Model} model The model that was deleted.
         * @param {external:module:jquery~jqXHR} response The XHR object.
         * @param {Object} options The options that were passed to the Backbone sync.
         * @returns {undefined}
         */
        deleteCompleted: function(model, response, options) {
            this.remove();
        },
        /**
         * Attempts to delete the model.
         * @returns {undefined}
         */
        onDelete: function() {
            if (!this.busy && this.model) {
                this.confirmDelete(function() {
                    if (!this.model.isNew()) {
                        var deleting, async = true;
                        this.setBusy(true, {
                            statusText: 'Deleting record, please wait...',
                            size: 'large'
                        });
                        deleting = $.when(Nrm.app.deleteModel({
                            model: this.model,
                            collection: this.collection,
                            path: this.options.path,
                            deleteOptions: $.extend({
                                global: false
                            }, this.config && this.config.deleteOptions)
                        }, this)).done(function() {
                            this.deleteCompleted.apply(this, arguments);
                        }).fail(function() {
                            this.deleteFailed.apply(this, arguments);
                        }).always(function() {
                            async = this.deleting = false;
                            this.setBusy(false);
                        });
                        if (async) {
                            /**
                             * A jQuery Promise that is set while the view is deleting the model, set to false after 
                             * delete is finished. 
                             * @name module:nrm-ui/views/editorView#deleting
                             * @type {?external:module:jquery~Promise|boolean}
                             */
                            this.deleting = deleting;
                        }
                    } else {
                        this.deleteCompleted(this.model);
                    }
                });
            }
        },
        /**
         * Sets a busy indicator, for example, when saving or deleting.
         * @param {boolean} busy Indicates whether the view is busy
         * @param {module:nrm-ui/plugins/nrmLoadingIndicator~PluginOptions} [options] Options to pass to the 
         * nrmLoadingIndicator plugin.
         */
        setBusy: function(busy, options) {
            if (busy !== this.busy) {
                this.busy = busy;
                this.trigger('busyChanged', !!busy, options, this);
            }
            return busy;
        },
        /**
         * Gets the form configuration for generic rendering.
         * @returns {module:nrm-ui/views/baseView~FormConfig|external:module:jquery~Promise}
         * The default implementation returns a promise to support dynamically lazy-loaded configuration, but usually
         * subclasses will override this implementation to return the search configuration synchronously.
         */
        getEditorConfig: function() {
            // to facilitate overriding in derived view
            var dfd = new $.Deferred();
            var base = this.config || { };
            $.when(Nrm.app.getEditorConfig(this.context)).done(function(config) {
                dfd.resolve($.extend(true, base, config));
            }).fail(function(config) {
                dfd.reject(config);
            });
            return dfd.promise();
        },
        /**
         * Apply the context from a navigation event, returning true if the navigation event applies to this view.
         * The base implementation returns true if the path matches the path that was initially passed in to this view.
         * @param {Object} options
         * @param {string} options.path The navigation path
         * @param {string} [options.group] The new group attribute value.
         * @param {string} [options.subtype] The new subtype attribute value.
         * @returns {Boolean}
         * Indicates whether the navigation context applies to this view.
         */
        applyContext: function(options) {
            if (options.path === this.options.path && (!options.group || options.group === this.options.group)) {
                if (this.model && this.model.isNew()) {
                    if (options.subtype && options.subtype !== this.options.subtype)
                        this.options.subtype = options.subtype;
                }
                return true;
            }
        },
        /**
         * Prompts the user to save changes, cancel the navigation, or abandon changes if there are unsaved changes.
         * @returns {Boolean|external:module:jquery~Promise}
         * Returns boolean indicator of whether the view can be removed, or a promise that is resolved if the 
         * unsaved changes are dealt with successfully (either saved or abandoned) or rejected if user cancels or the
         * attempt to save fails.
         */
        allowRemove: function() {
            if (!this.readonly && this.isDirty()) {
                // do not prompt in the following scenarios:
                // - the prompt is already displaying (this.removing is a Promise)
                // - save is in progress (this.saving is a Promise)
                // - delete is in progress (this.deleting is a Promise)
                var busy = this.removing || this.saving || this.deleting;
                if (busy && _.isFunction(busy.promise)) {
                    return busy;
                }
                var dfd = new $.Deferred(),
                        self = this;
                /**
                 * A jQuery Promise that is set while the view is prompting user to handle unsaved changes on removal. 
                 * @name module:nrm-ui/views/editorView#removing
                 * @type {?external:module:jquery~Promise}
                 */
                this.removing = dfd.promise();
                function reject() {
                    dfd.reject();
                    self.removing = null;
                }
                function resolve() {
                    dfd.resolve();
                    self.removing = null;
                }
                Nrm.event.trigger('app:modal', { 
                    buttons: 6, // ModalView.SAVE_ABANDON_CANCEL constant
                    caption: 'Unsaved changes', 
                    content: '<p>There are unsaved changes that will be lost if you proceed without saving.</p>' +
                            '<p>You may save or abandon the changes, or click Cancel to return to the form.</p>',
                    callback: function() {
                        if (this.clicked === 0) {
                            var testSave = self.onSave();
                            if (!testSave)
                                reject();
                            else {
                                $.when(testSave).done(function() {
                                    resolve();
                                }).fail(function() {
                                    reject();
                                });
                            }
                        } else if (this.clicked === 1) {
                            resolve();
                        } else {
                            if (Nrm.router) {
                                Nrm.router.navigate(self.options.route + "/" + self.options.path, { 
                                    trigger: false, 
                                    replace: true 
                                });
                            }
                            reject();
                        }
                    }
                }); 
                return this.removing;
            }
            return true;
        },
        /**
         * Loads the model from the server
         * @returns {Boolean|external:module:jquery~Promise}
         * Returns false if the load occurs synchronously, or a promise that is resolved or rejected 
         * when loading of the configuration and model has completed.
         */
        loadData: function() {
            var id = this.options.modelId,
                    loadingDfd = this.loading = $.Deferred(),
                    self = this;
            /**
             * The id of the model that is currently loading.
             * @name module:nrm-ui/views/editorView#loadingId
             * @type {string}
             */
            this.loadingId = id;
            function loadCompleted() {
                self.setDirty(false);
                loadingDfd.resolve(self.model);
                if (loadingDfd === self.loading) {
                    self.loading = false;
                }
                if (_.isFunction(self.model.registerChildEvents)) {
                    self.model.registerChildEvents();
                }
            }
            function loadAborted() {
                loadingDfd.reject(self.model, {statusText: "abort"});
                if (loadingDfd === self.loading) {
                    self.loading = false;
                }
            }
            function successCallback(model) {
                if (self.loadingId !== id) {
                    return loadAborted();
                }
                if (model.collection) {
                    self.collection = model.collection;
                    self.collection.each(function(eachModel) {
                        Nrm.app.setModelVal(eachModel, "selected", eachModel.id === model.id);
                    });
                    var selOpt = (self.config && self.config.ensureVisible) ? { 
                        extentOnly: true,
                        ensureVisible: true 
                    } : { };
                    self.collection.trigger("updateSelection", self.collection, selOpt);
                }
                self.model = model.clone();
                loadCompleted();
            }
            function errorCallback(model, response) {
                if (self.loadingId !== id) {
                    return loadAborted();
                }

                self.setDirty(false);
                loadingDfd.reject(model, response);
                if (loadingDfd === self.loading) {
                    self.loading = false;
                }
            }
            $.when(this.configLoading).done(function() {
                var origModel = (self.model && self.model.id === id) ? self.model : false;
                $.when(origModel || Nrm.app.getModel(self.context, id, { 
                    path: self.options.path, 
                    model: self.options.parentModel,
                    ajax:  self.config && self.config.fetchOptions
                })).done(function(model) {
                    if (self.loadingId !== id) {
                        return loadAborted();
                    }
                    if (model.isNew()) {
                        /**
                         * The model that is bound to this view.  May be null while the view is reloading, and might
                         * not have a full set of attributes before the asynchronous
                         * {@link module:nrm-ui/views/editorView#loadData|loadData method} has completed.
                         * @name module:nrm-ui/views/editorView#model
                         * @type {?external:module:backbone.MOdel}
                         */
                        self.model = model;
                        self.modelCid = model.cid;
                        self.collection = model.collection;
                        loadCompleted();
                    }
                    else if (model.cached !== false) {
                        model.fetch({
                            success: successCallback,
                            error: errorCallback
                        });
                    } else {
                        model.cached = true;
                        successCallback(model);
                    }
                }).fail(errorCallback);
           }).fail(errorCallback);
           return this.loading;
        },
        /**
         * Render the view, the default implementation uses generic rendering technique.
         * @returns {module:nrm-ui/views/editorView}
         * Returns this instance to allow chaining.
         */
        render: function() {
            if (!this.canRender()) return this;
            /**
             * Indicates that the view was rendered using the generic rendering technique. 
             * @name module:nrm-ui/views/editorView#useDefaultRendering
             * @type {Boolean}
             */
            this.useDefaultRendering = true;
            if (this.model) {
                var isNew = this.model.isNew();
                if (isNew) {
                    if (this.context.subtype && this.options.subtype) {
                        var subtype = this.options.subtype;
                        var found = false;
                        if (this.context.typemap) {
                            _.each(this.context.typemap, function(value, key) {
                                if (!found && (value === subtype || value.nodetype === subtype)) {
                                    subtype = key;
                                    found = true;
                                }
                            });
                        } else { found = true; }
                        if (found)
                            Nrm.app.setModelVal(this.model, this.context.subtype, subtype);
                    }
                    if (this.context.groupAttr && this.options.group)
                        Nrm.app.setModelVal(this.model, this.context.groupAttr, this.options.group);
                }
                if (!Nrm.app.isEditable(this.context, this.model)) {
                    this.readonly = true;
                }
                this.bindAllData(this.config.controls, this.model);
                this.config.isNew = isNew;
                //var template = Handlebars.templates[this.config.template || "editForm"];
                this.$el.html(this.template(this.config));
                this.applyPlugins(this.$el, this.config.controls);
                this.applyClasses();
    //            if (this.config.containerClass)
    //                this.$el.addClass(this.config.containerClass);
    //            if (this.config.inputClass)
    //                $(".form-control", this.$el).addClass(this.config.inputClass);

                if (this.readonly) {
                    this.setControlEnabled($(".btn,ul.dropdown-menu>li", this.$el).not(".nrm-enable-readonly,.divider,.dropdown-header,.dropdown-submenu"), false);
                } else if (!isNew) {
                    this.setControlEnabled($(".nrm-enable-new", this.$el), false);
                    this.setControlEnabled($(".nrm-enable-changed", this.$el).not(".nrm-enable-new,.nrm-disable-new"), this.isDirty());
                } else {
                    this.setControlEnabled($(".nrm-enable-changed", this.$el), this.isDirty());
                    this.setControlEnabled($(".nrm-disable-new", this.$el), false);
                }
                this.listenTo(this, "dirtyChanged", this.dirtyChanged);
                this.delegateModelEvents();
                this.delegateEvents();
                this.startListening();
            }
            return this;
        },
        /**
         * Overrides {@link module:nrm-ui/views/baseView#getFocusElement|BaseView#getFocusElement} to return the main
         * content element.
         * @returns {external:module:jquery}
         */
        getFocusElement: function() {
            return $("#main-content");
        }
    });
    
    return EditorView;
});
