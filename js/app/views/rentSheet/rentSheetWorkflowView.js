define(['app/views/panelView', "jquery", "nrm-ui", 'underscore',
        'backbone','nrm-map/views/spatialEditView',
        'esri/units','app/views/geoSpatial/geolocatorPanelView',
        'app/collections/townshipAndDivisionInfo','app/models/common/recordModel','app/views/geoSpatial/geoSpatialView'],
    function (PanelView, $, Nrm, _,
              Backbone,SpatialEditView,units,GeolocatorPanelView, TownshipCollection,RecordModel,GeoSpatialView) {

        return GeoSpatialView.extend({

            genericTemplate :'rentSheet/rentSheetWorkflowForm',

            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments) || {};

                this.model.set("previousShape",this.model.get('shape'));

                config.controls = [
                    {
                        "id" : "mapShape",
                        "type": "shape",
                        "prop" : "shape",
                        "label" : "Shape",
                        "allowReplace" : true,
                        "flmDataSource" : "shapeDataSource",
                        "flmRevDate" : "shapeRevDate",
                        "flmAccuracy" : "shapeAccuracy",
                        spatialTypes: ["point", "line", "polygon"],
                        areaUnit : {
                            unit: units.ACRES,
                            label: "Acres",
                            abbr: "Acres"
                        },
                        lengthUnit : {
                            unit: units.KILOMETERS,
                            label: "Kilometers",
                            abbr: "KM"
                        },
                        "dependencies" : ["state","county","forest"]
                    }
                ]

                config.actions = [
                    {
                        type: "btn",
                        id: "buffer-ok",
                        label: "OK",
                        btnStyle: "primary",
                        "hzGrid": "col-md-6 col-sm-0",
                        "grid": "col-sm-4"
                    }, {
                        type: "btn",
                        id: "buffer-cancel",
                        label: "Cancel",
                        "hzGrid": "col-md-6 col-sm-0",
                        "grid": "col-sm-4"
                    }]

                return config;
            },

            events: $.extend({}, SpatialEditView.prototype.changeEvents, SpatialEditView.prototype.events, {
                "click #buffer-ok": "ok",
                "click #buffer-cancel": "cancel"
            }),


            initLovCallback: GeolocatorPanelView.prototype.initLovCallback,

            hideNorthAndWestPanes : function () {

                $('.ui-layout-toggler-north-open,.ui-layout-toggler-west-open').click();
                $('.nrm-westpane-container .panel-collapse').not('#nrm-app-accordion-layers-panel').collapse('show');
                $('#nrm-app-accordion-layers-panel').collapse('hide');
            },

            render : function () {
                this.model.initShapeRelatedFields();

                return PanelView.prototype.render.apply(this, arguments);;

            },


            /**
             * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
             * @returns {undefined}
             */
            startListening: function() {
                SpatialEditView.prototype.startListening.apply(this,arguments);
                this.listenTo(this, {
                    'renderComplete': function() {


                        $('.ui-layout-toggler-north-closed,.ui-layout-toggler-west-closed').click();
                        $('.nrm-westpane-container .panel-collapse').not('#nrm-app-accordion-layers-panel').collapse('hide');
                        $('#nrm-app-accordion-layers-panel').collapse('show');
                        this.rendered = true;


                    }
                });

            },

            modelEvents: {
                "change:shape": "changeShape",
                'dependentLovChanged': 'dependentLovChanged',
            },


            changeShape : function () {

                return GeoSpatialView.prototype.changeShape.apply(this,arguments);
            },


            /**
             * Handles ok button click, finalizes the buffer and removes the view.
             * @returns {undefined}
             */
            ok: function (e) {

                var authorization = this.model.toJSON();

                var recordModel = new RecordModel({id: authorization && authorization.authorizationCn});


                recordModel.save(authorization,{
                    success : _.bind(function(model, resp, options) {

                    },this) ,
                    error : function(model, resp, options) {
                        var error = Nrm.app.normalizeErrorInfo('Failed to Save',
                            model, resp || model, options);
                        Nrm.event.trigger('showErrors', error, { allowRecall: false });
                    }
                })

                this.hideNorthAndWestPanes();
                this.trigger('workflowFinished', {model: this.model});
                this.remove();
            },

            /**
             * Handles Cancel button click, cancels the buffer and removes the view.
             * @returns {undefined}
             */
            cancel: function (e) {
                this.hideNorthAndWestPanes();
                //when we cancel revert the shape to previous rentsheet shape

                this.model.set("shape",this.model.get('previousShape'));
                this.trigger('workflowFinished', {model: this.model});
                this.remove();

            },

        });
    });