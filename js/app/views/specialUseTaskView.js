/**
 * Editor view for a Special Use Task
 * @file
 * @see module:app/views/specialUseTaskView
 */
/**
 * @module app/views/specialUseTaskView
 */
define(['..', './common/specialUseEditorView', '../models/common/specialUse', 'underscore'], 
        function(Suds, SpecialUseEditorView, SpecialUse, _) {
    
    return Suds.Views.SpecialUseTaskView = 
            SpecialUseEditorView.extend(/** @lends module:app/views/specialUseTaskView.prototype */{
        /**
         * Override of 
         * {@link module:app/views/common/specialUseEditorView#getEditorConfig|SpecialUseEditorView#getEditorConfig} 
         * to add a status message, and set the status date field to readonly.
         * @returns {module:nrm-ui/views/baseView~FormConfig}
         */
        getEditorConfig: function() {
            var config = SpecialUseEditorView.prototype.getEditorConfig.apply(this, arguments);
            config.controls = [
                {
                    id: 'specialUseDueDate',
                    type: 'info'
                }
            ].concat(config.controls);
            var statusDate = _.find(config.controls, function(control) {
                return control.id === 'specialUseStatusDate';
            });
            if (statusDate) {
                statusDate.readonly = true;
            }
            return config;
        },
        /**
         * Override {@link module:nrm-ui/views/baseView#bindData|BaseView#bindData} to handle the status message
         * at the appropriate time in the render function before rendering the Handlebars template.
         * @returns {undefined}
         */
        bindData: function() {
            // call the base implementation...
            var control = SpecialUseEditorView.prototype.bindData.apply(this, arguments);
            if (control.id === 'specialUseDueDate') {
                var priority = this.model.priority(),
                        dueBy = this.model.daysUntilDueDate(),
                        overdue = priority === SpecialUse.priorities.OVERDUE,
                        days,
                        message = '',
                        alertStyle;
                switch (priority) {
                    case SpecialUse.priorities.ATTENTION:
                        alertStyle = 'warning';
                        break;
                    case SpecialUse.priorities.OVERDUE:
                        alertStyle = 'danger';
                        break;
                    default:
                        alertStyle = 'info';
                        break;
                }
                if (_.isNumber(dueBy)) {
                    dueBy = Math.abs(dueBy);
                    if (dueBy === 1) {
                        days = dueBy + ' day';
                    } else {
                        days = dueBy + ' days';
                    }
                    if (overdue) {
                        message = 'The current step was due ' + days + ' ago.';
                    } else {
                        message = 'The current step is due in ' + days + '.';
                    }
                }
                _.extend(control, {
                    value: message,
                    alertStyle: alertStyle
                });
            }
            return control;
        }
    });   
    
    
});