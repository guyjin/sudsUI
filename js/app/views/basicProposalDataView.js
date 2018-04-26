define(['./panelView', "jquery", "nrm-ui", 'underscore','../collections/contactsCollection',
        'backbone','app/collections/addFilesCollection','app/models/deleteFilesModel','nrm-ui/plugins/nrmDatePicker'],
    function (PanelView, $, Nrm, _,
              ContactCollection, Backbone, AddFilesCollection,DeleteFilesModel ) {

        return PanelView.extend({

            genericTemplate : 'ProposalParameters/proposalParamForm',

            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments);


                config.currentStep = this.model.toJSON();

                this.addedFiles = new AddFilesCollection();

                var fileLabels = _.map(config.currentStep.displayOrderToUiAttribute[15].multipleSelectValues, function(item) {
                    return {
                        value: item.id /*item*/,
                        text: item.value/*item*/
                    }
                });


                config.controls = [
                    {
                        id : 'selectProponentType',
                        type : 'ProposalParameters/proponentTypeAndDateRange',
                        controls : this.proponentAndDateRangeControls(config)
                    }]


                _.each(config.currentStep.displayOrderToUiAttribute, function (obj, idx) {

                    var textAreaConfig = {
                        type : 'textArea',
                        "id" : "siteComments",
                        "prop" : "comments",
                        "label" : "Comments",
                        "title" : "Tell me a story" ,
                        "rows" : 10,
                        "maxlength": 4000
                    }

                    if (obj.characterLimit && obj.characterLimit === 4000){
                        var control = $.extend(true,{},{
                            id :'',
                            type : 'Questions/textAreaQuestions',
                            items:[]
                        });
                        control.id= obj.id + obj.displayOrder;
                        var questConfig = $.extend(true,{},textAreaConfig,{
                            label : obj.attribute,
                            title : obj.attribute,
                            prop : "uiAttributeOrder" + obj.displayOrder,
                            rows : "10",
                            id : "uiAttributeOrder" + obj.displayOrder,
                            nameAttr : "uiAttributeOrder" + obj.displayOrder

                        },obj);

                        control.items.push(questConfig);
                        control.hint = obj.hint;
                        console.log(control)
                        config.controls.push(control)
                    }else if (obj.displayOrder == "6" || obj.displayOrder == "7"){

                        var displayAttribute = config.currentStep.displayOrderToUiAttribute;

                        if (obj.displayOrder == "6"){

                            var control = $.extend(true,{},{
                                question : displayAttribute[16].attribute,
                                title : displayAttribute[16].attribute,
                                prop : "uiAttributeOrder" + displayAttribute[16].displayOrder,
                                type :'ProposalParameters/isFeeCharged',
                                id : "uiAttributeOrder" + displayAttribute[16].displayOrder,
                                nameAttr : "uiAttributeOrder" + displayAttribute[16].displayOrder
                            },displayAttribute[16]);

                            config.controls.push(control)

                            var participantsAndSpectatorsQue = $.extend(true,{},{
                                question : displayAttribute[17].attribute,
                                type : 'ProposalParameters/participantsQues',
                                id : "uiAttributeOrder" + displayAttribute[17].displayOrder,
                                nameAttr : "uiAttributeOrder" + displayAttribute[17].displayOrder
                            });

                            config.controls.push(participantsAndSpectatorsQue)
                        }

                        /*var control = $.extend({},textAreaConfig,{
                         label : obj.attribute,
                         title : obj.attribute,
                         prop : "uiAttributeOrder" + obj.displayOrder,
                         rows : "3",
                         id : "uiAttributeOrder" + obj.displayOrder,
                         nameAttr : "uiAttributeOrder" + obj.displayOrder,
                         },obj);

                         config.controls.push(control)*/
                    }
                });

                //need to replace it with UIAttribute
                var uiAttributeOrder7 = {
                    id : "forestServiceFacility",
                    type:"ProposalParameters/whichForest",
                    yOrNLabel : "Is the proponent planning to use a Forest Service Facility?",
                    question : "If so, please describe:",
                    hint : "Hint: This could include use of a campground, boat launch area, pavilion, etc.",
                    questionProp :'uiAttributeOrder7',
                    questionId:'forestServiceFacility',
                    questionNameAttr : 'forestServiceFacility',
                    items:[{
                        label : "If so, please describe:",
                        type:'textArea',
                        title : "If so, please describe:",
                        prop : "uiAttributeOrder7",
                        rows : "3",
                        maxlength : '250',
                        id : "forestServiceFacility",
                        nameAttr : "forestServiceFacility",
                        disabled : true
                    }]
                }

                config.controls.push(uiAttributeOrder7)

                var whichForest = {
                    id : "whichForest",
                    type:"ProposalParameters/whichForest",
                    yOrNLabel : "Is the proponent planning to use a Forest Service road or utilities right of way?",//need to replace it with UIAttribute
                    hint : "Hint : Describe road as NFS road, road number, and/or common name of road.",
                    items:[{
                        label : "Which National Forest roads will the proponent be using?",
                        type:'textArea',
                        title : "If so, please describe:",
                        prop : "uiAttributeOrder8",
                        rows : "3",
                        maxlength : '250',
                        id : "whichForestRoads",
                        nameAttr : "whichForestRoads",
                        disabled : true
                    }]
                }

                config.controls.push(whichForest)

                var rightOfWayDimensions = {
                    id : "rightOfWayDimensions",
                    type:"ProposalParameters/rightOfWayDimensions"
                }

                config.controls.push(rightOfWayDimensions)

                var fileUploadControl = {
                    id :"fileUploadControl",
                    type: "ProposalParameters/fileUpload",
                    "items": [{
                        "type": "select",
                        "id": "fileTypeList",
                        "prop" : 'selectedFileLabelCn',
                        "label": "File Label",
                        /*"nolabel": true,*/
                        "placeholder": "Select File Label",
                        "options": fileLabels
                    },
                     {
                     "type": "inputText",
                     "id": "otherDesc",
                     "prop" : 'otherDesc',
                     "label": "Other Description",
                     "required": true
                     }]
                }

                config.controls.push(fileUploadControl);

                var uploadedFilesControl = {
                    id :"uploadedFiles",
                    nameAttr: 'uploadedFiles',
                    type: "ProposalParameters/uploadedFiles",
                    controls : this.getUploadedFilesTableControl()
                }

                config.controls.push(uploadedFilesControl);
/*
                config.controls = [{
                    id:'testing',
                    type:'inputText'
                }];*/
                return config;
            },

            events: {
                'click .roadOrRightOfWayUse input[type=radio]':function (event) {

                        event.preventDefault();
                        var $target = $(event.target);


                        if ($target.prop('checked') === true) {
                            $target.closest('.formQuestionBlock').find('.roadOrRightOfWayUse label',this.$el).removeClass('btn-primary');
                            $target.next('label').addClass('btn-primary');

                            if ($target.attr('id').indexOf('Yes') != -1) {
                                $target.closest('.formQuestionBlock').find('textArea').prop('disabled', false)
                            } else {
                                $target.closest('.formQuestionBlock').find('textArea').val('').prop('disabled', true);
                            }
                        }
                    },'click .isFeeCharged input[type=radio]':function (event) {
                        event.preventDefault();

                        var $target = $(event.target);

                        if ($target.prop('checked') === true) {
                            $('.isFeeCharged label',this.$el).removeClass('btn-primary');
                            $target.next('label').addClass('btn-primary');

                            if ($target.attr('id') === 'isFeeCharged_Yes') {
                                this.model.set('uiAttributeOrder16','Y');
                            } else {
                                this.model.set('uiAttributeOrder16','N');
                            }
                        }
                    },
                'change #rightOfWayDimensions' : 'setMiles',
                'change #fileUploader ': "handleFiles",
                'change #fileTypeList': "showOrHideOtherDesc",
                'click .uploadButton' : "saveFile",
                'click .removeFile'  : 'removeFile'
                //... other custom events go here...
            },

            modelEvents: {
                "change:uiAttributeOrder18": "changeStartDateOfUseStartDateCalendar",
                "change:uiAttributeOrder2": "changeStartDate",
                "change:uiAttributeOrder3": "changeEndDate"
            },

            getSelectedFileLabel : function (fileLabelCn) {

                var fileLabel = null;

                _.each(this.config.currentStep.displayOrderToUiAttribute[15].multipleSelectValues, function(item) {
                    if (item.id  == fileLabelCn){
                        fileLabel =  item.value;
                    }
                });

                return fileLabel;
            },

            changeStartDateOfUseStartDateCalendar: function() {
                var start = Nrm.app.getModelVal(this.model, 'uiAttributeOrder18') || '1970-01-01';
                $('#useStartDate', this.$el).nrmDatePicker('setStartDate', start);
                $('#useStartDate', this.$el).nrmDatePicker('update', '');/*.val('').change()*/;
                $('#useEndDate', this.$el).nrmDatePicker('update', '');/*.val('').change()*/;
            },
            changeStartDate: function() {
                var start = Nrm.app.getModelVal(this.model, 'uiAttributeOrder2') || '1970-01-01';
                $('#useEndDate', this.$el).nrmDatePicker('setStartDate', start);
            },
            changeEndDate: function() {
                var end = Nrm.app.getModelVal(this.model, 'uiAttributeOrder3');
                $('#useStartDate', this.$el).nrmDatePicker('setEndDate', end);

            },

            setMiles : function () {

                var width  = this.model.get('uiAttributeOrder11') || 0,
                    length = this.model.get('uiAttributeOrder12') || 0,
                    feet,miles,
                    self = this;

                if (length || width){
                    feet = Math.max(length, width),
                        miles = (feet/5280).toFixed(2)
                    $('#rightOfWayMiles',this.$el).val(miles)
                    this.model.set('uiAttributeOrder13',miles);
                }

            },
            getUploadedFilesTableControl : function () {

                var tableControl =  [ {

                    "type" : "tableEdit",
                    "id" : "uploadedFilesTable",
                    /*"prop" :'uploadedFiles' ,*/
                    "hasResults" : this.addedFiles && this.addedFiles.size() > 0,
                    "value" : this.addedFiles,
                    "columns" : [
                        {
                            "prop": "fileName",
                            "label" : "File Name",
                            className : 'selectContactLink'
                        },
                        {
                            "prop": "typeAndSize",
                            "label" : "Type & Size"


                        },
                        {
                            "prop": "fileLabel",
                            "label" : "File Label"

                        }
                    ],
                    "pluginOpts" : {
                        "multiSelect" : false,
                        "readOnly": true,
                        "searching": true,
                        "paging": false
                    },
                    "rowActions": [ {
                        "title": "Remove File",
                        type:'btn',
                        btnStyle:"danger",
                        "className": "btn-xs nrm-route-action removeFile",
                        "icon": "glyphicon glyphicon-remove",
                        "label" :'Remove',
                        "id": "removeFile-row"
                    } ],
                    "actions" : []
                }]

                return tableControl;
            },


            saveFile : function () {
                this.saveCompleted(this.addOrRemoveFileModel)
            },

            handleFiles: function(event) {
                var model = this.model.toJSON();

                var allowedFileTypes = model.displayOrderToUiAttribute[14],
                    found = false,
                    fileTypesArray= [];


                if (event.target.files.length > 0) {
                    $('.fileTypeListContainer',this.$el).removeClass("disabled")


                    this.fileDirty = true;
                    var f = this.file = event.target.files[0];
                    var ext, name = f.name;
                    if (name && name.indexOf('.') > 0) {
                        ext = _.last(name.split('.'));
                    } else {
                        ext = '';
                    }
                    _.each(allowedFileTypes.multipleSelectValues,function (obj,idx) {
                        fileTypesArray.push(obj.value);
                        if (ext.toLowerCase().trim() == obj.value.toLowerCase().trim()){
                            found = true;
                        }
                    })

                    if (!found){
                        event.preventDefault();

                        Nrm.event.trigger("app:modal", ( {
                            "text": 'Allowed file types are '  + fileTypesArray.toString() + ".",
                            "caption": "Upload Failed!"
                        }));
                        return;
                    }

                    this.readFromModel(f);
                }
            },

             showOrHideOtherDesc: function(event){
             // get currentFileLabel
             // if fileLabel == 'Other', add div element to add description

             var fileLabel = this.getSelectedFileLabel(this.model.get('selectedFileLabelCn'));
             if (fileLabel == 'Other'){
             $("#otherDesc-container").show();
             }else{
             $("#otherDesc-container").hide();
             }

             },

            addNewFile: function($table, attributes) {

                var coll = this.getCollectionForTable($table);
                if (!coll) return;
                var newModel = new coll.model(attributes);
                coll.add(newModel);
                this.setDirty(true);

                $("#fileUploader", this.$el).val('');

                if (coll.length  > 0){
                    $("#uploadedFiles",this.$el).fadeIn();
                }
            },

            removeFile : function(e) {

                var model = this.getModelForTableRow($(e.target))
                var data = {
                    entityCn : model.get('attachmentCn'),
                    entityType : 'attachment'
                }

                var deleteFileModel = new DeleteFilesModel();

                deleteFileModel.fetch({
                    type: "POST",
                    traditional: true,
                    data: data,
                    success : _.bind(function() {
                        model.collection.remove(model);
                        var coll = this.getCollectionForTable($("#uploadedFilesTable", this.$el));

                        if (coll.length  <= 0){
                            $("#uploadedFiles",this.$el).fadeOut();
                        }
                    },this),
                    error : function(model, resp, options) {}
                });



            },

            getCollectionForTable : function ($table) {

                if (this.addedFiles && $table && $table.attr("id") === "uploadedFilesTable") {
                    return this.addedFiles;
                }
                return PanelView.prototype.getCollectionForTable.apply(this, arguments);

            },
            bytesToString: function(nBytes, details) {
                if (nBytes === undefined)
                    return "";
                var sOutput = nBytes + " bytes";
                for (var aMultiples = ["KB", "MB", "GB", "TB", "PB"], nMultiple = 0, nApprox = nBytes / 1024; nApprox > 1; nApprox /= 1024, nMultiple++) {
                    sOutput = nApprox.toFixed(nMultiple === 0 ? 0 : 1) + " " + aMultiples[nMultiple];
                    if (details) sOutput += " (" + nBytes + " bytes)";
                }
                return sOutput;
            },

            readFromModel: function(file) {
                var fileAttributes = {fileName: file.name, size: file.size, dateProduced: file.lastModifiedDate}
                var ext, name = file.name;
                if (name && name.indexOf('.') > 0) {
                    ext = '.' + _.last(name.split('.'));
                    name = name.replace(ext, '');
                } else {
                    ext = '';
                }

                fileAttributes.typeAndSize = ext  + "; " + this.bytesToString(file.size, true);

                this.addOrRemoveFileModel =  new this.addedFiles.model(fileAttributes)

            },

            uploadFile: function(options) {


                if(!this.model.get('selectedFileLabelCn')){

                    Nrm.event.trigger("app:modal", ( {
                        "text": 'Please select a label for the attachment.',
                        "caption": "Upload Failed!"
                    }));

                    return
                }

                if((this.getSelectedFileLabel(this.model.get('selectedFileLabelCn')) == 'Other') && !this.model.get('otherDesc')){
                    Nrm.event.trigger("app:modal", ( {
                        "text": 'Please select a description for the attachment.',
                        "caption": "Upload Failed!"
                    }));

                    return
                }

                var fileLabel = this.getSelectedFileLabel(this.model.get('selectedFileLabelCn'));

                if(fileLabel == 'Other'){
                    fileLabel = this.model.get('otherDesc');
                }
                this.addOrRemoveFileModel.set('fileLabel',fileLabel);

                var options = options || {},
                    url,
                    record = this.parentModel.get('record') || '';
                options = _.defaults(options, {
                    file: this.file,
                    "fileName": this.addOrRemoveFileModel.get('fileName')});

                var data = new FormData();
                data.append("file", options.file);
                data.append("recordId", record.recordCn || '');
                data.append("fileLabelCn",this.model.get('selectedFileLabelCn')|| '');
                data.append("fileDesc", this.model.get('otherDesc'));
                if (window.location.port === "3000"){
                    url = 'http://localhost:' + 7001 + '/' + 'nrm/suds' + '/' + this.addOrRemoveFileModel.url();
                }else {
                    url = this.addOrRemoveFileModel.url();
                }

                Backbone.ajax({
                    url: url + "attachFile",
                    method: "POST",
                    data: data,
                    cache: false,
                    dataType: 'json',
                    processData: false, // Don't process the files
                    contentType: false // Set content type to false as jQuery will tell the server it's a query string request
                }).done(_.bind(function(data, textStatus, jqXHR) {
                    Nrm.event.trigger("app:modal", ( {
                        "text": options.message || "Upload succeeded.",
                        "caption": "Success!"
                    }));

                    this.model.unset("selectedFileLabelCn", { silent: true });
                    $('#fileTypeList').val([]).trigger('change');

                    this.fileDirty = false;
                    this.addNewFile($("#uploadedFilesTable", this.$el),$.extend({},this.addOrRemoveFileModel.toJSON(),{attachmentCn : data}));
                }, this)).fail(function(jqXHR, textStatus, errorThrown) {
                    console.error('upload failed with status: ' + textStatus, jqXHR, errorThrown);
                    // doesn't always return a responseJSON...
                    var msg = errorThrown, opts;
                    if (jqXHR.responseJSON) {
                        msg = jqXHR.responseJSON.message;
                        opts = {moreMsg: jqXHR.responseJSON.detailMessage};
                    }
                    /*MessageBox("File upload failed with error: " + msg, opts);*/
                });
            },

            saveCompleted: function(model) {

                if (model) {
                    if (this.fileDirty) {
                        this.addOrRemoveFileModel= model;
                        this.uploadFile({message: "Upload was successful."});

                        //MessageBox('Uploading file...', {type: 'info'});
                    } /*else {
                     Nrm.event.trigger("app:modal", ( {
                     "text": "Upload was successful.",
                     "caption": "Success!"
                     }));
                     }*/
                }
            },

            render : function () {

                // this.model.set('uiAttributeOrder2',this.model.get('uiAttributeOrder18'));
                return  PanelView.prototype.render.apply(this, arguments);


            },

            proponentAndDateRangeControls  : function (config) {


                var uiAttributes = config.currentStep.displayOrderToUiAttribute,
                    proponentTypes = _.map(config.currentStep.displayOrderToUiAttribute[1].multipleSelectValues, function(item) {
                        return {
                            value: item.id /*item*/,
                            text: item.value/*item*/
                        }
                    });


                var control = [
                    {   "type" : "select",
                        "id" : "typeOfProponent",
                        "prop" : "uiAttributeOrder1",
                        "nameAttr": "typeOfProponent",
                        "title" : "Select Type of proponent" ,
                        "label" : "Type Of Proponent",
                        "grid" : "col-md-3 col-sm-12",
                        "options" : proponentTypes,
                        "placeholder": "Select Type Of Proponent",
                        "required": true
                    },{
                        "type" : "inputDate",
                        "id" : "receivedDate",
                        "nameAttr" : "receivedDate",
                        "prop" : "uiAttributeOrder18",
                        "label" : "Received Date",
                        "title" : "Received Date (MM/DD/YYYY)",
                        "grid" : "col-md-3 col-sm-12",
                        "required": true
                        /*"group" : true*/

                    },{
                        "type" : "inputDate",
                        "id" : "useStartDate",
                        "nameAttr" : "useStartDate",
                        "prop" : "uiAttributeOrder2",
                        "title" : "Use Start date (MM/DD/YYYY)",
                        "label" : "Activity Start Date",
                        "grid" : "col-md-3 col-sm-12",
                        "required": true
                        /*"group" : true*/
                    },{
                        "type" : "inputDate",
                        "id" : "useEndDate",
                        "nameAttr" : "useEndDate",
                        "prop" : "uiAttributeOrder3",
                        "label" : "Activity End Date",
                        "title" : "End Date (MM/DD/YYYY)",
                        "grid" : "col-md-3 col-sm-12",
                        "required": true
                        /*"group" : true*/

                    }]

                return control;
            },

            /**
             * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
             * @returns {undefined}
             */
            startListening: function() {
                PanelView.prototype.startListening.apply(this,arguments);


                this.listenTo(this, {
                    'renderComplete': function() {
                        // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                        // to occur after view is added to the page, which is why we have to use the renderComplete event
                        // instead of calling it from the render function

                        this.rendered = true;
                        $("#uploadedFiles",this.$el).fadeOut();
                        this.changeStartDateOfUseStartDateCalendar();
                          $("#otherDesc-container").hide();

                    }
                });

            }

        });
    });