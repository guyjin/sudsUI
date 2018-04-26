define(["jquery", "nrm-ui", 'underscore',
        'backbone','./screeningQuestionsView'],
                            function ($, Nrm, _,
                                      Backbone,ScreeningQuestionsView) {

    return ScreeningQuestionsView.extend({

        genericTemplate: 'aoLevelScreening/screeningResults',

        getConfig: function () {

            this.config = {};


            this.config.AOLevel = "AO Level 2"
            this.config.record = {
                recordId : "PWY123456",
                status: "SCREENING APPROVALS"
            }

            /*config.controls=[{}]*/

            return this.config;
        },
        render : function () {

            ScreeningQuestionsView.prototype.render.apply(this, arguments);

            return this;
        },

        /**
         * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
         * @returns {undefined}
         */
        startListening: function() {
            ScreeningQuestionsView.prototype.startListening.apply(this,arguments);


            this.listenTo(this, {
                'renderComplete': function() {
                    this.rendered = true;
                }
            });

        },

    });
});