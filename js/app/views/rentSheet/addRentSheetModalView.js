define(['../panelView', "jquery", "nrm-ui",
        'underscore','backbone',
        'nrm-ui/views/validationAwareView','nrm-ui/plugins/messageBox',
        'app/views/geoSpatial/geolocatorPanelView'],
    function (PanelView, $, Nrm, _, Backbone,ValidationAwareView, MessageBox, GeolocatorPanelView) {

        return ValidationAwareView.extend({

            initialize :PanelView.prototype.initialize,

            /**
             * Create a new BufferView instance.
             * @constructor
             * @alias module:nrm-map/views/bufferView
             * @classdesc The BufferView is a Backbone.View that supports creating polygon buffers around geometry.
             * @param {Object} options
             * @param {external:module:esri/geometry/Geometry|Object} options.geometry The geometry object to
             * initialize the bufferView's nrmShapeEditor and be the target of buffer operations.
             * @param {external:module:esri/geometry/Geometry|Object} [options.attributes.appendTo] Original polygon
             * to add the new buffer to when adding a part via buffer.
             * @param {Object} options.shapeOptions Attributes to set on the graphic.
             * @param {String} [options.caption="Buffer"]
             */


            loadNestedModel :PanelView.prototype.loadNestedModel,

            genericTemplate: 'rentSheet/worksheetEntryModal/rentSheetEntryModal',

            useGlobalErrorNotification : false,

            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments) || {};

               /* var model = this.model.toJSON(),self=this;*/

                this.model.set('shape',this.model.get('shape'));

                this.saveClicked = false;
                this.loadRentSheetWorkFlowView = false;

                config.controls=[
                    {
                        id:"row0",
                        type: "costRecovery/worksheetFormRow",
                        controls : [{
                            id:'loadRentSheetWorkflowView',
                            className :'loadView suds-input pull-right',
                            type :'btn',
                            btnStyle : 'info',
                            label : 'Update Geospatial',
                            style : {
                                "margin-top" : "-30px"
                            }

                        }]
                    },{
                    id:"row1",
                    type: "costRecovery/worksheetFormRow",
                    controls : [this.form1Controls()]
                },{
                    id:"row2",
                    type: "costRecovery/worksheetFormRow",
                    controls : [this.form2Controls()]
                },{
                    id:"row3",
                    type: "costRecovery/worksheetFormRow",
                    controls : [this.form3Controls()]
                },{
                    id:"row4",
                    type: "costRecovery/worksheetFormRow",
                    controls : [this.row4Controls()]
                },{
                    id:"row5",
                    type: "costRecovery/worksheetFormRow",
                    controls : [this.row3Controls()]
                }]


                var worksheetCard  = this.options && this.options.worksheetCard;

                if (!worksheetCard){
                    worksheetCard  = {
                        remarks: null,
                        area:null,
                        lengthEstimate : null,
                        length : null,
                        width : null,
                        kilovolt :null,
                        name: null,
                    }
                    this.model.set(worksheetCard, { unset: true, silent:true })
                }else if (worksheetCard){
                    this.model.set(worksheetCard);
                }


                return config;
            },


            initLovCallback: GeolocatorPanelView.prototype.initLovCallback,

            form1Controls : function () {

                var form1Controls  = {
                    id: "form1",
                    formClass : 'form1',
                    type : 'costRecovery/worksheetForm'
                }

                form1Controls.controls = [
                    { "type" : "select",
                        "id" : "siteCounties",
                        "prop" : "county",
                        "label" : "County",
                        "refType": "lov/counties",
                        "lov": ".countiesLov",
                        groupAttr : 'STATENAME',
                        dataType:"object",
                        "placeholder": "Update geometry to refresh list",
                        "title" : "Select a county",
                        "labelGrid" : "col-md-4 col-sm-2",
                        "hzGrid" : "col-md-8 col-sm-10",
                        "grid" : "col-md-6",
                        "required" : true,
                        dependencies: ['forest'],
                        inherit: {
                            countyShape: 'geometry'
                        }
                    },
                    { "type" : "select",
                        "id" : "siteForests",
                        "prop" : "forest",
                        "label" : "Admin Forest",
                        "refType": "lov/forests",
                        "lov": ".forestsLov",
                        "placeholder": "Select a County to refresh list",
                        "title" : "Select admin forest",
                        "required" : true,
                    }]

                this.form1Controls = form1Controls.controls;

                return form1Controls;
            },

            form2Controls : function () {

                var form2Controls  = {
                    id: "form2",
                    formClass : 'form2',
                    type : 'costRecovery/worksheetForm'
                }


                form2Controls.controls = [
                    {
                        "type": "inputNum",
                        "inputType": "number",
                        "prop" : "width",
                        "id": "processingTimeEst",
                        nameAttr : 'processingTimeEst',
                        "title": "Width (feet)",
                        label : 'Width (feet)',
                        placeholder : "0.0",
                        step:"any",
                        className :'adjustments',
                        required : true

                    },{
                        "type": "inputNum",
                        "inputType": "number",
                        "prop" : "length",
                        "id": "length",
                        nameAttr : 'length',
                        "title": "Length (feet)",
                        label : 'Length (feet)',
                        placeholder : "0.0",
                        step:"any",
                        className :'adjustments',
                        required : true,

                    },{
                        "type": "inputNum",
                        "inputType": "number",
                        "prop" : "area",
                        "id": "acres",
                        nameAttr : 'acres',
                        "title": "Acres",
                        label : 'Acres',
                        placeholder : "0.0",
                        step:"any",
                        className :'adjustments',
                        disabled:true,
                        required : true

                    },{
                        "type": "inputNum",
                        "inputType": "number",
                        "prop" : "lengthEstimate",
                        "id": "miles",
                        nameAttr : 'miles',
                        "title": "Miles",
                        label : 'Miles',
                        placeholder : "0.0",
                        step:"any",
                        className :'adjustments',
                        disabled :true

                    }]

                return form2Controls;
            },

            form3Controls : function () {

                var form3Controls  = {
                    id: "form3",
                    formClass : 'form3',
                    type : 'costRecovery/worksheetForm'
                }


                form3Controls.controls = [
                    {
                        "type": "inputNum",
                        "inputType": "number",
                        "prop" : "kilovolt",
                        "id": "kilovolts",
                        nameAttr : 'kilovolts',
                        "title": "Kilovolts",
                        label : 'Kilovolts',
                        placeholder : "0.0",
                        step:"any",
                        className :'suds-input',
                        "style": {
                            "display": "block"
                        }

                    }/*,{
                        "type": "inputText",
                        /!*"inputType": "number",*!/
                        "prop" : "name",
                        "id": "rentSheetName",
                        nameAttr : 'rentSheetName',
                        "title": "Rent Sheet Name",
                        label : 'Name',
                        //placeholder : "0.0",
                        //step:"any",
                        className :'suds-input',
                        "style": {
                            "display": "block"
                        }

                    }*/]

                return form3Controls;
            },

            row4Controls : function () {

                var row4Controls  = {
                    id: "row4Form",
                    type : 'costRecovery/worksheetForm'
                }


                row4Controls.controls = [{
                    type : 'textArea',
                    "id" : "comments",
                    "prop" : "remarks",
                    "label" : "Comments",
                    "title" : "Comments" ,
                    "rows" : 10,
                     cols:80,
                    "maxlength": 4000,
                   /* required : true*/
                }]

                return row4Controls;
            },

            row3Controls : function () {

                var row3Controls  = {
                    id: "controls",
                    type:'costRecovery/worksheetFormCtrls',
                }


                row3Controls.controls = [
                    {
                        id: 'reset',
                        type: 'btn',
                        prop: 'resetBtn',
                        btnStyle: "default",
                        className: "resetBtn",
                        label: 'Reset',
                    },{
                        id: 'saveAndContinue',
                        type: 'btn',
                        prop: 'saveAndContinueBtn',
                        btnStyle: "primary",
                        className: "saveAndContinue",
                        label: 'Save & Continue' ,
                    }]

                return row3Controls;
            },

            events: $.extend({},
                PanelView.prototype.events,
                PanelView.prototype.changeEvents, {
                    'click .saveAndContinue': "saveAndContinue",
                    'click #loadRentSheetWorkflowView' :function () {
                        this.loadRentSheetWorkFlowView = true;
                        this.remove();
                        $("#addToWorksheetModal").modal('hide');
                    },

                    'click .resetBtn':function (e) {
                        e.preventDefault();
                        $(':input',this.$el).val('');
                        $('option').attr('selected', false);
                    }
                }),



            modelEvents: $.extend({}, PanelView.prototype.modelEvents, {
             'change:width': 'updateAcresAndMiles',
             'change:length': 'updateAcresAndMiles',
             'dependentLovChanged': 'dependentLovChanged',
             /*'change:width': 'calculateMiles'*/
             }),



            updateAcresAndMiles : function (model) {
                var width  = model.get('width') || 1,
                    length  = model.get('length') || 1,
                    totalAcres = this.calculateAcresForSingleEntry(width,length),
                    totalMiles = this.calculateTotalMiles(width,length);


                $("#acres",this.$el).val(totalAcres)
                $("#miles",this.$el).val(totalMiles)

                this.model.set('area',totalAcres);
                this.model.set('lengthEstimate',totalMiles);

            },



            // calculate Acres

            calculateAcresForSingleEntry: function(width, length) {
                var x = (width*length)/43560;
                return Number(Math.round(x+'e2')+'e-2');
            },

            // calculate Miles
            calculateTotalMiles: function(width,length) {

                var feet = Math.max(length, width),
                    miles = (feet / 5280).toFixed(2)
                return miles;
             },

            validate : function () {


                return $.when(this.model.validate()).done(_.bind(function (errors) {

                    if (this.saveClicked){
                       this.showErrors(true);
                   }

                },this));


            },

            saveAndContinue : function (e) {
                e.preventDefault();

                this.saveClicked = true;
                $.when(this.validate()).done(_.bind(function (errors) {

                    if (errors){
                        return;
                    }


                    var  self = this,
                        formData = this.model.toJSON();



                    if (this.options.updateService){

                        this.model.save(formData,{
                            type:'PUT',
                            success : function(model, resp, options) {
                                self.model.set(resp);
                                $("#addToWorksheetModal",this.$el).modal('hide');

                            },
                            error : function(model, resp, options) {
                                self.saveClicked = false;
                            }
                        });
                    }else{
                        this.model.save(formData,{
                            success : function(model, resp, options) {
                                self.model.set(resp);
                                $("#addToWorksheetModal",this.$el).modal('hide');

                            },
                            error : function(model, resp, options) {
                                self.saveClicked = false;
                            }
                        });
                    }
                },this))




            },

            dependentLovChanged: function(model, collection, options) {

                var msg, title, opened = false;

                if (options.changed) {
                    this.setDirty(true);
                }


                // NOTE: if there are more than one attributes with this kind of notification, we might need some logic to
                // accummulate the messages into a single pop-up.
                if (options.attr === 'states' || options.attr === 'forests' || options.attr === 'counties') {


                    if (options.error) {
                        title = options.attr + 'Update Failed';
                        msg = 'Attempted to update the list of quads based on current Site location, but ' +
                            'the service was not available or did not return any results.\n\n' +
                            'If you save the Site in this condition, please open the record again once the service ' +
                            'becomes available to update the list.';

                    } else if (options.changed && !this.model.isNew()) {
                        title = options.attr + ' Updated'
                        msg = 'The list has been updated with a map service query based on current Site location.\n\n' +
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


            setDirty : function(){

                return false;
            },

            render : function () {



                this.listenTo(this, {

                    'renderComplete' : function() {

                        this.rendered = true;
                        $("#addToWorksheetModal").addClass('rentSheetWorksheet');
                        this.setElement(this.$el.closest('.modal-body'));
                        //this.$el.html(this.template(templateData));
                        $('.modal-footer').remove();
                        this.model.initShapeRelatedFields();
                        PanelView.prototype.render.apply(this, arguments);

                    }
                });

                this.listenTo(this.model, 'change', _.bind(function(select){
                    this.validate();
                },this));

            },



        });
    });