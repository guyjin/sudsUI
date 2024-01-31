define(['./panelView', "jquery", "nrm-ui", 'underscore', 'backbone','nrm-map/views/spatialEditView',
        'app/models/gisTestModel','app/models/recordUpdateModel','nrm-ui/plugins/messageBox'],
    function (PanelView, $, Nrm, _,
               Backbone,SpatialEditView,GISTestModel,RecordUpdateModel,MessageBox) {

        return PanelView.extend({

            genericTemplate :'gis/gisForm',
            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments);

                this.model.set("nextStepId",this.model.get("caseFileId"));

                config.controls = [{
                    "id" : "mapShape",
                    "type": "shape",
                    "prop" : "shape",
                    "label" : "Shape",
                    "allowReplace" : true,
                    "flmDataSource" : "shapeDataSource",
                    "flmRevDate" : "shapeRevDate",
                    "flmAccuracy" : "shapeAccuracy",
                    spatialTypes: ["point", "line", "polygon"],
                    "dependencies" : ["quads"]
                    },
                    { "type" : "select",
                        "id" : "siteQuads",
                        "prop" : "quads",
                        "label" : "Quads",
                       /* "multiple": true,*/
                        "refType": "lov/quads",
                        "lov": ".quadsLov",
                        "placeholder": "Update geometry to refresh list",
                        "title" : "List of quads in which the site is located, automatically updated when site geometry changes",
                        "labelGrid" : "col-md-4 col-sm-2",
                        "hzGrid" : "col-md-8 col-sm-10",
                        "grid" : "col-md-6"
                    }];


                config.actions = [{
                    "id" : "saveShape",
                    "type": "btn",
                    btnStyle : 'info',
                    "label" : "Save",
                },{
                    "id" : "cancel",
                    "type": "btn",
                    className : 'pull-right',
                    btnStyle : 'danger',
                    "label" : "Cancel",
                }]

                return config;
            },

            events: {
                'click #saveShape' : 'saveShape',
                'click #cancel' : 'onCancel',
                /*'click #hideElement' : 'hideElement',*/
                    //... other custom events go here...
                },


           /* showElement : function (event) {
                $('.flexImportantDiv').show();
            },

            hideElement : function (event) {
                $('.flexImportantDiv').hide();
            },*/
            modelEvents: {
                "change:sudsShape": "changeShape",
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

                console.log(this)
            },

            hideNorthAndWestPanes : function () {

                $('.ui-layout-toggler-north-open,.ui-layout-toggler-west-open').click();
                $('.nrm-westpane-container .panel-collapse').not('#nrm-app-accordion-layers-panel').collapse('show');
                $('#nrm-app-accordion-layers-panel').collapse('hide');
            },

            render : function () {
                this.model.initShapeRelatedFields();


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
                debugger
                return SpatialEditView.prototype.updateShape.apply(this, arguments);
            },



            drawEnd: function () {
                debugger
                return SpatialEditView.prototype.drawEnd.apply(this,arguments);
            },

            featureEdit: function(){
                debugger
                return SpatialEditView.prototype.featureEdit.apply(this,arguments);
            }

        });
    });