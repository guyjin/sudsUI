/**
 * @file
 * @see module:app/models/common/specialUse
 */
/**
 * @module app/models/common/specialUse
 */
define(['../..', 'nrm-ui/models/businessObject', 'underscore'], 
        function(Suds, BusinessObject, _) {
    return Suds.Models.SpecialUse = BusinessObject.extend(/** @lends module:app/models/common/specialUse.prototype */{
        //idAttribute: "specialUseCn", // if we don't want to use the default idAttribute which is "id"


        /**
         * Derives the current processing stage for this Special Use permit, this is likely to be included in the 
         * mid-tier query as a model attribute once the REST API is implemented.
         * @returns {String}
         */
        idAttribute: 'introCN',

        stage: function() {

            /*
            * TODO : Need to ask John if by getting the nested stage value and setting the stage on the model is it enough
            * or do we have make changes everywhere
            * */

            var permitStagesObj = this.get('currentStep');

            if (!permitStagesObj || _.isEmpty(permitStagesObj)){
                this.set('stage',"Proposal");
            }else{
                this.set('stage',permitStagesObj.stageName);
            }

            var stage = this.get('stage');

            if (!stage) {
                stage = this.constructor.getStage(this.get('statusFk'));
            }

            return stage;
        },


        /**
         * Derives the stage display order for this Special Use permit.
         * @returns {Number}
         */

        stageIndex: function() {

            var stage = this.get('stage');
            if (stage) {
                return this.constructor.getStageIndex(stage);
            } else {
                return this.constructor.getStageIndexFromStatusFk(this.get('statusFk'));
            }
        },

        /**
         * Derives the "priority" based on status date and the processing status, this is likely to be included in the 
         * mid-tier query as a model attribute once the REST API is implemented.
         * @returns {Number}
         */

        priority: function() {
            var priority = this.get('priority');
            if (!_.isNumber(priority)) {
                priority = this.constructor.getPriority(this.get('statusFk'), this.get('statusDate'));
            }
            return priority;
        },

        /**
         * Derives the display value for "priority" based on status date and the processing status
         * @returns {String}
         */

        priorityStatus: function() {
            return this.constructor.displayPriority(this.priority());
        },

        /**
         * Derives the processing status code from the processing status CN, this is likely to be included in the 
         * mid-tier query as a model attribute once the REST API is implemented.
         * @returns {String}
         */

        processingStatusCode: function() {
            return this.constructor.getProcessingStatusCode(this.get('statusFk'));
        },
        /**
         * Get the number of days until the status due date.
         * @returns {Number}
         * Days until the next step is due, or null if there is no deadline for the status.
         */
        daysUntilDueDate: function() {
            return this.constructor.daysUntilDueDate(this.get('statusFk'), this.get('statusDate'));
        }
    },

    /**@lends module:app/models/common/specialUse */
    {
        /**
         * Priority constants.
         */
        priorities: {
            NONE: 0,
            ATTENTION: 1,
            OVERDUE: 2
        },
        /**
         * Get the display value for a priority constant.
         * @param {Number} priority The priority constant
         * @returns {String}
         * The display value.
         */
        displayPriority: function(priority) {
            switch (priority) {
                case this.priorities.ATTENTION:
                    return 'Needs Attention';
                case this.priorities.OVERDUE:
                    return 'Past Due';
            }
            return '';
        },
        /**
         * List of permitting stages, in display order
         */
        stages: [
            'Proposal', 
            'Application', 
            'Cost Recovery Processing', 
            'NEPA Decision/Cost Recovery Monitoring',
            'Authorization',
            'Administration',
            'Amendment',
            'Closure'
        ],
        /**
         * Get the ProcessingStatus model for a status CN
         * @param {String} statusFk The processing status CN
         * @returns {external:module:backbone.Model}
         */
        getStatus: function(statusFk) {
            if (Suds.ProcessingStatuses && statusFk) {
                return Suds.ProcessingStatuses.get(statusFk);
            }
            return null;
        },
        /**
         * Get the "code" for a processing status CN.
         * @param {String} statusFk The processing status CN
         * @returns {String}
         * Returns the processing status code
         */
        getProcessingStatusCode: function(statusFk) {
            var status = this.getStatus(statusFk);
            if (status) {
                return status.get('code');
            }
            return '';
        },
        /**
         * Get the "stage" for a processing status CN.
         * @param {String} statusFk The processing status CN
         * @returns {String}
         * Returns the stage
         */
        getStage: function(statusFk) {
            var status = this.getStatus(statusFk);
            if (status) {
                return status.get('stage');
            }
            return '';
        },
        /**
         * Get the "priority" for a processing status CN and status date.
         * @param {String} statusFk The processing status CN
         * @param {String} statusDate The date that the status was set, formatted as 'YYYY/MM/DD'
         * @returns {Number}
         * One of the {@link module:app/models/specialUseTask.priorities|priorities constant} values.
         */
        getPriority: function(statusFk, statusDate) {
            var status = this.getStatus(statusFk), 
                    priorityThreshold, 
                    dueBy, 
                    diff;
            if (status) {
                priorityThreshold = status.get('priorityThreshold');
                dueBy = status.get('due');
                if (dueBy || priorityThreshold) {
                    diff = Suds.dateDiff(statusDate);
                    if (diff > dueBy) {
                        return this.priorities.OVERDUE;
                    } else if (dueBy - diff < priorityThreshold) {
                        return this.priorities.ATTENTION;
                    }
                }
            }
            return this.priorities.NONE;
        },
        /**
         * Get the number of days until the status due date.
         * @param {String} statusFk The processing status CN
         * @param {String} statusDate The date that the status was set, formatted as 'YYYY/MM/DD'
         * @returns {String}
         * Days until the next step is due.
         */
        daysUntilDueDate: function(statusFk, statusDate) {
            var status = this.getStatus(statusFk), 
                    dueBy, 
                    diff;
            if (status) {
                dueBy = status.get('due');
                if (_.isNumber(dueBy)) {
                    diff = Suds.dateDiff(statusDate);
                    return dueBy - diff;
                }
            }
            return null;
        },
        /**
         * Get display order for a processing stage
         * @param {String} stage
         * @returns {Number}
         */
        getStageIndex: function(stage) {
            if (stage) {
                return _.indexOf(this.stages, stage);
            }
            return -1;
        },
        /**
         * Get the stage display order for a status CN
         * @param {String} statusFk The status CN
         * @returns {Number} The display order for the stage associated with the status.
         */
        getStageIndexFromStatusFk: function(statusFk) {
            return this.getStageIndex(this.getStage(statusFk));
        },
        /**
         * Indicates whether a status CN is an actionable task based on the user's role assignments for an org.
         * @param {String} statusFk
         * @param {Object} homeOrg Object representing the users role assignments for an org
         * @param {Boolean} homeOrg.authorizedOfficer Does the user have the authorizedOfficer role for the org?
         * @param {Boolean} homeOrg.suAdmin Does the user have the suAdmin role for the org?
         * @returns {Boolean}
         */
        isTaskForRole: function(statusFk, homeOrg) {
            var status = this.getStatus(statusFk);
            if (!status) {
                // statusFk is not set, or not found in list of ProcessingStatuses
                return false;
            }
            return !!_.find(['authorizedOfficer', 'suAdmin'], function(role) {
                // find first role that is associated with both the status and current homeOrg.
                return status.get(role) && homeOrg[role];
            });
        }
    });
});