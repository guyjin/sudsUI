define(['app/views/panelView', "jquery", "nrm-ui", 'underscore',
        'backbone',
        'nrm-ui/views/reportLauncherView',
        "app/models/reportInfoModel","app/views/rentSheet/rentSheetFormView"],
    function (PanelView, $, Nrm, _, Backbone,
              ReportLauncherView, ReportInfoModel,RentSheetFormView) {

        return RentSheetFormView.extend({

            genericTemplate: 'common/ctrlsIterator',


            /*getConfig: function () {

             var baseConfig = RentSheetFormView.prototype.getConfig.apply(this, arguments);


             $.when(baseConfig).done(_.bind(function () {


             },this))



             return  dfd.promise();
             },*/

            getTabHeadingAndSectionsControls: function () {

                this.model.set("currentSectionId", "RentSheetSingle");//come back to this
                this.model.set("currentSectionStatus", "Complete");

                var controls = [];

                controls[0] = this.getEntriesTabControls();
                controls[1] = this.getSummariesTabControls();


                return controls;
            },


            render : function () {

                PanelView.prototype.render.apply(this, arguments);

                return this;
            },



            /**
             * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
             * @returns {undefined}
             */
            startListening: function() {
                RentSheetFormView.prototype.startListening.apply(this,arguments);

                this.listenTo(this, {
                    'renderComplete': function() {
                        // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                        // to occur after view is added to the page, which is why we have to use the renderComplete event
                        // instead of calling it from the render function
                        this.rendered = true;


                    },
                    'loadRentSheetWorkflowView': function(addOrUpdate) {

                    }
                });




            },

        });
    });