define(['../panelView', "jquery", "nrm-ui", 'underscore', 'backbone','nrm-map/views/spatialEditView',
        'app/models/gisTestModel','app/models/recordUpdateModel','nrm-ui/plugins/messageBox','esri/units',
        'app/collections/townshipAndDivisionInfo','app/collections/metesAndBounds'],
    function (PanelView, $, Nrm, _,
               Backbone,SpatialEditView,GISTestModel,RecordUpdateModel,MessageBox,units, TownshipCollection,MetesAndBoundsCollection) {

        return PanelView.extend({

            //genericTemplate :'gis/gisForm',
            genericTemplate: 'common/ctrlsIterator',

            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments);

                var tabNames = ['Geospatial Information']
                this.model.set("nextStepId",this.model.get("caseFileId"));


                config.controls = [
                    {
                        type: 'common/soloTabSummaryHeader',
                        screenName: {
                            tabNames: tabNames
                        }
                    }, {
                        type: 'common/screenContentControls',
                        controls: this.getTabHeadingAndSectionsControls(),
                    }
                ]


                this.model.set("currentSectionId", "Geospatial");
                this.model.set("currentSectionStatus", "Complete");
                this.model.set("nextStepId",this.model.get("caseFileId"));

                return config;
            },


            getTabHeadingAndSectionsControls: function () {

                var controls = [{
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
                    }
                }];


                return controls;
            },

            events: {
                'click #saveShape' : 'saveShape',
                'click #cancel' : 'onCancel',
                /*'click #hideElement' : 'hideElement',*/
                    //... other custom events go here...
                },


            modelEvents: {
                "change:shape": "changeShape",
                "change:longitude": "changeShape",
                'dependentLovChanged': 'dependentLovChanged',
            },



            dependentLovChanged: function(model, collection, options) {

                var msg, title, opened = false;

                if (options.changed) {
                    this.setDirty(true);
                }

                // NOTE: if there are more than one attributes with this kind of notification, we might need some logic to
                // accummulate the messages into a single pop-up.
                if (options.attr === 'quads') {


                    if (options.error) {
                        title = 'Quads Update Failed';
                        msg = 'Attempted to update the list of quads based on current Site location, but ' +
                            'the service was not available or did not return any results.\n\n' +
                            'If you save the Site in this condition, please open the record again once the service ' +
                            'becomes available to update the list.';

                    } else if (options.changed && !this.model.isNew()) {
                        title = 'Quads Updated'
                        msg = 'The list of quads has been updated with a map service query based on current Site location.\n\n' +
                            'The updated list will be saved when the Site is saved.';

                    } else {
                        // do not notify when setting value on new model
                        return;
                    }
                    if (this.quadsChangedMessageBox) {
                        this.quadsChangedMessageBox.pnotify_remove();
                    }
                    this.quadsChangedMessageBox = MessageBox(msg, {
                        type: 'notice',
                        title: title,
                        hide: !options.error, // hide after a delay (default is 8 seconds)
                        after_open: function() {
                            opened = true;
                        },
                        before_close: _.bind(function() {
                            if (!opened) {
                                // guard against other code closing all message boxes before it has a chance to open!
                                return false;
                            }
                            this.quadsChangedMessageBox = null;
                        }, this)
                    });
                }
            },

            saveShape : function () {

                var authorization = this.model.toJSON();
                var self = this;
                var recordUpdateModel = new RecordUpdateModel({
                    id: authorization.authorizationCn
                    /*id: '59293BE065F8E5FEE054020820266933'*/
                });

                recordUpdateModel.save(authorization,{
                    success: function(model, resp, options){

                        /*$('.ui-layout-toggler-north-open,.ui-layout-toggler-west-open').click();
                        $('.nrm-westpane-container .panel-collapse').not('#nrm-app-accordion-layers-panel').collapse('show');
                        $('#nrm-app-accordion-layers-panel').collapse('hide');*/
                        self.hideNorthAndWestPanes();

                        self.trigger('onGISViewSave')

                    },
                    error: function(model, resp, options){
                        console.log("there was a problem saving the record")
                    }
                });


             //this.trigger('save');
            },

            onCancel : function (event) {
               this.hideNorthAndWestPanes();
              this.trigger('cancel');
            },


            changeShape : function () {
                $('.stepControls').show();
                var shape = this.model.get('shape'),collectionFetchObj;
                var self = this;
                var metesAndBoundsFound = false;
                var metesAndBoundsForNonPlssLandsInfo =  new MetesAndBoundsCollection(),
                    townshipCollection = new TownshipCollection();

                var errorCallback = _.bind(function(collection, response) {

                }, this);

                var successCallback = _.bind(function(collection, response) {

                    if (response.features && response.features.length){
                        var featuresString  = JSON.stringify(collection.toJSON());
                        self.model.set('legalDesc',featuresString)
                    }else if(!metesAndBoundsFound){
                        metesAndBoundsFound = true;
                        metesAndBoundsForNonPlssLandsInfo.fetch(collectionFetchObj);
                    }

                }, this);

                collectionFetchObj = {
                    params: {
                        geometry: shape
                    },
                    success: successCallback,
                    error: errorCallback
                }
                if (shape) {
                    townshipCollection.fetch(collectionFetchObj);
                }
            },

            hideNorthAndWestPanes : function () {

                $('.ui-layout-toggler-north-open,.ui-layout-toggler-west-open').click();
                $('.nrm-westpane-container .panel-collapse').not('#nrm-app-accordion-layers-panel').collapse('show');
                $('#nrm-app-accordion-layers-panel').collapse('hide');
            },

            render : function () {
                //this.model.initShapeRelatedFields();


                return  PanelView.prototype.render.apply(this, arguments);;


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

            updateShape: function () {

                return SpatialEditView.prototype.updateShape.apply(this, arguments);
            },



            drawEnd: function () {

                return SpatialEditView.prototype.drawEnd.apply(this,arguments);
            },

            featureEdit: function(){

                return SpatialEditView.prototype.featureEdit.apply(this,arguments);
            }

        });
    });