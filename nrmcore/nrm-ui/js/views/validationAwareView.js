/**
 * @file The ValidationAwareView extends {@link module:nrm-ui/views/baseView|BaseView} to provide a generic 
 * implementation of business rule validation feedback. 
 * @see module:nrm-ui/views/validationAwareView
 */
define([
    'jquery', 
    'underscore', 
    '..', 
    './baseView', 
    '../plugins/messageBox'
], function($, _, Nrm, BaseView, MessageBox) {
    /**
     * Information about a rule validation error.
     * @typedef module:nrm-ui/views/validationAwareView~BrokenRuleInfo
     * @property {string} message The message provided by the broken rule.
     * @property {string} label The field label in the UI.
     * @property {module:nrm-ui/views/validationAwareView~BrokenRuleInfo[]} [errors] Nested errors, e.g. distinct errors
     * returned from models in a child collection.
     */
    
    /**
     * Base view for generic views that support model validation and displaying feedback about validation errors.
     * @exports nrm-ui/views/validationAwareView
     */
    var ValidationAwareView = BaseView.extend(/** @lends module:nrm-ui/views/validationAwareView.prototype */{
        /**
         * Indicates that the error notification should use the global error notification events that are handled in
         * {@link module:nrm-ui/views/layoutView|LayoutView} by showing error badge in the nav bar.
         * @type {Boolean}
         */
        useGlobalErrorNotification: true,
        /**
         * Update the error status in the UI, either showing the error badge in the nav bar and optionally show a 
         * message box if the model is invalid, or remove error badge and/or hide message box if the model is now valid.
         * @param {Boolean} notify Indicates whether the non-modal PNotify error message should display, e.g. to provide
         * immediate feedback when saving invalid data, or just show the error badge inobtrusively, e.g. if user updates
         * a field with an invalid value.
         * @returns {module:nrm-ui/views/validationAwareView}
         * Returns this instance to allow chaining.
         */
        showErrors: function(notify) {
            if (!this.model || !this.model.brokenRules) {
                return this;
            }
            var errorList, errors,beginLabel = '<strong>', endLabel = ': </strong>';
            
            $('.ui-state-error', this.$el).removeClass('ui-state-error');
            $('.table-actions .badge-errors,.nrm-tab-error', this.$el).remove();
            
            errorList = this.getErrorList(this.model, [], this.$el, false);
            if (errorList && errorList.length > 1) {
                errors = '<br/><ul class="nrm-error-list">' + this.formatErrors(errorList, '<li>', '</li>', beginLabel, 
                        endLabel) + '</ul>';
            } else if (errorList && errorList.length) {
                // accessibility optimization: if there is only one error, don't use a list
                errors = '<br/>' + this.formatErrors(errorList, '<div class="nrm-error-list">', '</div>', beginLabel, 
                        endLabel);
            }
            //errors = this.formatErrors(errorList, '<br/>', '', beginLabel, endLabel);
            this.displayErrors(errors, notify);
            return this;
        },
        /**
         * Display the formatted error message, or clear error indicator if the message is null or empty.  Default
         * implementation assumes the view is displayed in the main content pane.
         * @param {String} errors Formatted error message, may be null/undefined or empty if there are no errors.
         * @param {Boolean} notify Indicates whether the error message should be displayed now, or just show an 
         * indicator that user can activate to display the error message.
         * @returns {module:nrm-ui/views/validationAwareView}
         * Returns this instance to allow chaining.
         */
        displayErrors: function(errors, notify) {
            /**
             * Current error message html text.
             * @type String
             */
            this.errorMessageHtml = errors;
            // do not use _.bind here to so that we can remove reference to this in callbacks.
            var target = this, options = $.extend({}, this.config && this.config.errorOptions, {
                before_close: function() {
                    if (target) {
                        target.trigger('errorMessageClosed', target);
                        target.errorMessage = null;
                    }
                },
                after_close: function() {
                    if (target && !target.removed) {
                        var focusEl = target.getFocusElement();
                        if (focusEl && focusEl.length) {
                            focusEl.focus();
                        }
                        target = null;
                    }
                }             
            });
            if (errors && this.useGlobalErrorNotification) {
                Nrm.event.trigger('showErrors', errors, $.extend(options, {notify: !!notify}));
            } else if (errors) {
                // some views like modals and search views in west panel might not want to show the nav bar error badge
                this.showErrorBadge(notify);
                if (this.errorMessage) {
                    $('.ui-pnotify-text>div', this.errorMessage).html(errors);
                } else if (notify) {
                    /**
                     * If not using the global error notification, provides a reference to the message box that is 
                     * currently displayed.  It is set to null when the message box is closed.
                     * @type {module:nrm-ui/plugins/messageBox}
                     */
                    this.errorMessage = MessageBox(errors, $.extend(options, {showErrorBadge: false}));
                }
            } else {
                this.removeErrors();
            }
            return this;            
        },
        /**
         * May be overriden to display a custom error badge if 
         * {@link module:nrm-ui/validationAwareView#useGlobalErrorNotification|useGlobalErrorNotification property} is
         * set to false.  The default implementation is a no-op.
         * @param {Boolean} notify Indicates whether the error message should be displayed now, or just show an 
         * indicator that user can activate to display the error message.
         * @returns {undefined}
         */
        showErrorBadge: function(notify) {},
        /**
         * May be overriden to hide a custom error badge if 
         * {@link module:nrm-ui/validationAwareView#useGlobalErrorNotification|useGlobalErrorNotification property} is
         * set to false.  The default implementation is a no-op.
         * @returns {undefined}
         */
        hideErrorBadge: function() {},
        /**
         * Remove errors.
         * @returns {module:nrm-ui/views/validationAwareView}
         * Returns this instance to allow chaining.
         */
        removeErrors: function() {
            if (this.useGlobalErrorNotification) {
                /**
                 * Remove error badge and close error message box if it is open.
                 * @event module:nrm-ui/event#removeErrors
                 */
                Nrm.event.trigger('removeErrors');
            } else {
                if (!this.removed) {
                    this.hideErrorBadge();
                }
                if (this.errorMessage) {
                    this.errorMessage.pnotify_remove();
                }
            }
            return this;
        },
        /**
         * Overrides {@link module:nrm-ui/views/baseView#destroyControls|BaseView#destroyControls} to remove the error
         * notification in addition to recursively destroying all controls.
         * @returns {undefined}
         */
        destroyControls: function() {
            this.removeErrors();
            return BaseView.prototype.destroyControls.apply(this, arguments);
        },
        /**
         * Format error messages
         * @todo This should be implemented using a Handlebars template instead of constructing the HTML in Javascript.
         * @param {module:nrm-ui/views/validationView~BrokenRuleInfo[]} errorList List of errors.
         * @param {string} beginLine HTML string to prepend to the beginning of the formatted message.
         * @param {string} endLine HTML string to append to the end of the formatted message.
         * @param {string} beginLabel HTML string to prepend to the beginning of the label.
         * @param {string} endLabel HTML string to prepend to the beginning of the label.
         * @returns {string}
         * Formatted HTML string for displaying the list of errors
         */
        formatErrors: function(errorList, beginLine, endLine, beginLabel, endLabel) {
            return errorList && _.reduce(errorList, function(memo, error) {
                var ret = memo + beginLine + (error.label ? (beginLabel + error.label + endLabel) : '') + error.message;
                if (beginLabel && error.errors) {
                    ret += '<br/><ul class="nrm-error-list">' + this.formatErrors(error.errors, '<li>', '</li>', 
                            beginLabel, endLabel) + '</ul>';
                }
                if (endLine) {
                    ret += endLine;
                }
                return ret;
            }, '', this);
        },
        /**
         * Gets a list of distinct rule validation errors from the model, and updates error indicators on each field.
         * @param {external:module:backbone.Model} model The model reference, might not be the same as this.model if 
         * it is processing a nested child collection.
         * @param {module:nrm-ui/views/validationAwareView~BrokenRuleInfo[]} [errorList] Initial error list to append 
         * to, note that the array will be modified in place instead of creating a copy.
         * @param {external:module:jquery} $parent The parent element
         * @param {Boolean} isTable Indicates that we are processing a data table.
         * @returns {module:nrm-ui/views/validationAwareView~BrokenRuleInfo[]}
         * List of errors, returns the same array reference as the input errorList parameter if it is provided.
         */
        getErrorList: function(model, errorList, $parent, isTable) {
            if (!model || !model.brokenRules) {
                return errorList;
            }
            var formatChildErrors = _.bind(function(childErrors) {
                return this.formatErrors(childErrors, '\n', '', '', ': ');
            }, this);
            
            function getElementForRow(parent) {
                var rowSelector = 'tr[data-nrm-rowid="' + (model.id || model.cid) + '"]';
                if (parent.is('table.dataTable')) {
                    return parent.dataTable().$(rowSelector);
                } else {
                    return $(rowSelector, parent);
                }
            }
            errorList = errorList || [];
            model.brokenRules.forEach(function (rule) {
                var prop = rule.get('property'), 
                    error = {
                        message: rule.get('description')
                    }, 
                    childErrors, 
                    $label, 
                    $tab,
                    el, 
                    control, 
                    tableActions,
                    badge,
                    title,
                    selector = '[data-nrmprop="' + prop + '"]';
                
                if (prop) {
                    if (isTable && $parent.is('table')) {
                        $parent = getElementForRow($parent);
                    }
                    el = $(selector, $parent).filter(function(i, el) {
                         return !$(el).parentsUntil($parent, '[data-nrm-prop]').length;
                    });
                    
                    control = el.data('nrm-control');
                    if (el.is('input[type="radio"]')) {
                        // for radio buttons, use a parent container element instead of the actual radio input.
                        selector = '#' + ((control && control.id) || el.attr('name'));
                        el = $(selector, $parent);
                    }
                    $label = this.getLabelForElement(el, $parent);
                    if ($label) {
                        $label.each(function() {
                            error.label = $(this).text();
                            return !error.label;
                        });
                    }
                    if (!error.label) {
                        error.label = el.attr('aria-label') || (control && control.label) || 
                                Nrm.app.identifierToLabel(prop);
                    } else {
                        error.label = error.label.trim();
                    }

                    // Some controls use hidden input fields associated to a display field by data-target-display attribute.
                    // In this case, we need to add the ui-state-error class on the display field, not the hidden field.
                    selector = el.filter('[data-target-display]').attr('data-target-display');
                    if (selector) {
                        el = $(selector, $parent);
                    }
                    
                    if (rule.get('rule') === "IsNestedModel") {
                        childErrors = this.getErrorList(Nrm.app.getModelVal(model, prop), [], el, false);
                    } else if (this.isSelect2(el, control)) {
                        el.addClass('ui-state-error');
                    } else if (el.is('input[type="hidden"]')) {
                        el.closest('.input-group').addClass('ui-state-error');
                    } else if (el.is('table')) {
                        tableActions = $('.table-actions', el.closest('.nrm-table-edit-container'));
                        badge = $('.badge-errors', tableActions);
                        title = (badge.length ? badge.attr('title') + '\n' : '') + error.message;
                        childErrors = this.getErrorsForTable(el, rule, control);
                        if (childErrors && childErrors.length) {
                            title += formatChildErrors(childErrors);
                        }
                        if (badge.length) {
                            badge.attr('title', title);
                        } else {
                            tableActions.append($('<span>').attr('title', title).addClass('badge badge-errors')
                                    .text('Errors'));
                        }
                    } else if (!el.is('.tab-pane,.collapse')) {
                        // do not add class on :invalid elements so that the CSS invalid selector works
                        el.each(function() {
                            var $this = $(this), invalid = false;
                            // The ':invalid' selector is a CSS selector, but not a JQuery pseudo-selector.
                            // Therefore it does not work on a JQuery selection of more than one element, but does work on 
                            // a JQuery element of exactly one item.
                            try {
                                invalid = $this.is(':invalid');
                            } catch (error) {
                                // the :invalid selector is not universally supported.
                                console.warn('The :invalid CSS selector is not supported', error);
                            }
                            if (!invalid) {
                                $this.addClass('ui-state-error');
                            }
                        });
                    }
                    
                    $tab = el.parentsUntil($parent, '.tab-pane,.collapse').add(el.filter('.tab-pane,.collapse'));
                    if ($tab.length) {
                        $tab.each(function() {
                            $tab = $('[aria-controls="' + this.id + '"]', $parent);
                            badge = $('.nrm-tab-error', $tab);
                            title = badge.attr('title');
                            if (!el.is('.tab-pane,.collapse')) {
                                title = (title || 'Errors:') + '\n' + error.label + ': ' + error.message;
                            } else if (title) {
                                title += '\n' + error.message;
                            } else {
                                title = error.message;
                            }
                            
                            if (childErrors && childErrors.length) {
                                title += formatChildErrors(childErrors);
                            }
                            if (badge.length) {
                                badge.attr('title', title);
                            } else {
                                badge = $('<span>').addClass('nrm-tab-error').attr({'aria-hidden':'true', title: title})
                                    .append($('<span>').addClass('glyphicon glyphicon-exclamation-sign'));
                                $tab.append(badge);
                            }
                        });
                    }
                }
                
                if (!_.findWhere(errorList, error)) {
                    if (childErrors && childErrors.length) {
                        error.errors = childErrors;
                    }
                    errorList.push(error);
                }
            }, this);
            return errorList;
        },
        /**
         * Gets a list of errors from the collection bound to a data table.
         * @param {external:model:jquery} $table The table element.
         * @param {module:nrm-ui/models/rule} rule The business rule.
         * @param {module:nrm-ui/views/baseView~ControlConfig} [control] The control configuration for the table.
         * @returns {module:nrm-ui/views/validationAwareView~BrokenRuleInfo[]}
         * List of errors for all models in the collection.
         */
        getErrorsForTable: function($table, rule, control) {
            var coll = rule.get('rule') === 'IsCollection' && rule.get('validateItems') !== false && 
                    this.getCollectionForTable($table, control), childErrors = [];
            if (coll && coll.models) {
                coll.forEach(function(model) {
                    childErrors = this.getErrorList(model, childErrors, $table, true);
                }, this);
            }
            return childErrors;
        },
        /**
         * Validates the model and shows error indicator if there are invalid rules.
         * @param {Boolean} notify Indicates whether the message box should display if the model is invalid.
         * @param {Object} [options] Optional options that implementations may use to customize the validation.
         * @param {Object} [options.changed] Changed model attributes to pass to model's validate implementation.
         * @param {Object} [options.event] Event data that triggered the validation, if it was triggered by an event
         * handler on a UI element.
         * @returns {Boolean|external:module:backbone.Model|external:module:jquery~Promise}
         * Return boolean indicator that the model is valid, or a copy of the model with mutated attributes if
         * the original model is valid yet not saveable due to unfortunate circumstances.  In a scenario where the 
         * business rule validation occurs asynchronously, the return value can also be a JQuery Promise object that is 
         * resolved with one of the return values from a synchronous validation.
         */
        validate: function(notify, options) {
            var valid = !!this.model, br, dfd, resolved,  handleResult = _.bind(function(result) {
                valid = !result || result.length === 0
                if (!valid) {
                    if (!this.model.brokenRules) {
                        Nrm.event.trigger('app:modal', ( {
                            error: { 
                                message: 'Data has validation errors.'
                            }
                        }));
                    }
                }
                this.showErrors(notify);
                return valid;
            }, this);
            if (this.model && _.isFunction(this.model.validate)) {
                br = this.model.validate(options && options.changed);
                // setting this.modelIsValidated indicates that model is validated and we can skip validation in onSave.
                this.modelIsValidated = true;
                if (br && _.isFunction(br.promise)) {
                    dfd = $.Deferred();
                    // If promise is resolved or rejected synchronously, both async and synchronous rules are handled at 
                    // the same time.
                    $.when(br).done(function(result) {
                        dfd.resolve(handleResult(result));
                        resolved = true;
                    }).fail(function(result) {
                        dfd.resolve(handleResult(result || 'Errors'));
                        resolved = true;
                    });
                    if (!resolved) {
                        // Handle synchronous broken rules now, async rules later, and return a promise
                        valid = handleResult(br);
                        return dfd.promise();
                    }
                } else {
                    // All rules validated synchronously, handle the result now
                    valid = handleResult(br);
                }
            }
            return valid;
        }
    });
    
    return ValidationAwareView;
});