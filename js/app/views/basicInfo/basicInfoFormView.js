define(['../..', '../panelView', "jquery", "nrm-ui", 'underscore', 'app/collections/contactsCollection',
        'backbone', 'app/collections/addFilesCollection', 'app/models/deleteFilesModel',
        'nrm-ui/plugins/nrmDatePicker', 'app/models/basicProposalModel', 'nrm-map/views/spatialEditView'],
    function (Suds, PanelView, $, Nrm, _,
              ContactCollection, Backbone, AddFilesCollection, DeleteFilesModel,nrmDatePicker, BasicInfoModel, SpatialEditView) {

        return PanelView.extend({

            genericTemplate: 'common/ctrlsIterator',

            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments);

                this.model.set({
                    currentSectionId: 'BasicInfo',
                    currentSectionStatus: 'Complete'
                }, {silent: true});

                this.addedFiles = new AddFilesCollection();

                var tabNames = ['Basic Information']
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

                return config;
            },


            getTabHeadingAndSectionsControls: function () {

                var controls = [];

                controls[0] = this.getProponentTypeAndDateControls();
                controls[1] = this.getWhereTabControls();
                controls[2] = this.getNFSFacilityTabControls();
                controls[3] = this.getFeeAndParticipantsTabControls();
                controls[4] = this.getRoadsTabControls();
                controls[5] = this.getFilesTabControls();

                return controls;
            },


            getProponentTypeAndDateControls: function () {


                var useDateAndProponentTypeControls = {
                    id: 'useDatesAndProponentType',
                    tabHeading: 'When & Who',
                    type: 'basicInfo/tabHeadingAndSection',
                    sectionWrap: true,
                    items: [
                        {
                            id: 'halfSection1UseDates',
                            fullSection: true,
                            sectionLabel: 'Use Dates',
                            type: 'basicInfo/basicInfoUseDatesContainer',
                            items: [{
                                "type": "inputDate",
                                "id": "proposalReceivedDate",
                                "nameAttr": "proposalReceivedDate",
                                "prop": "proposalReceivedDate",
                                "title": "Proposal Received Date (MM/DD/YYYY)",
                                "label": "Received Date",
                                "required": true,
                                /*"nested" : "object1",
                                 dataType : "object",*/
                                className: 'suds-input'
                                /*"group" : true*/
                            }, {
                                "type": "inputDate",
                                "id": "useStartDate",
                                "nameAttr": "useStartDate",
                                "prop": "useStartDate",
                                "title": "Use Start date (MM/DD/YYYY)",
                                "label": "Activity Start Date",
                                /*"nested" : "object2",
                                 dataType : "object",*/
                                "required": true,
                                className: 'suds-input'
                                /*"group" : true*/
                            }, {
                                "type": "inputDate",
                                "id": "useEndDate",
                                "nameAttr": "useEndDate",
                                "prop": "useEndDate",
                                "label": "Activity End Date",
                                "title": "End Date (MM/DD/YYYY)",
                                "grid": "col-md-3 col-sm-12",
                                "required": true ,
                                className: 'suds-input'
                                /*"group" : true*/

                            }]
                        },
                        /*{
                            id: 'halfSection2proponentType',
                            fullSection: true,
                            sectionLabel: 'Proponent Type',
                            "type": "select",
                            "id": "typeOfProponent",
                            "prop": "proponentTypesTbl",
                            "nameAttr": "typeOfProponent",
                            "title": "Select Type of proponent",
                            "label": "Type Of Proponent",
                            /!*"grid" : "col-md-3 col-sm-12",*!/
                            /!* className :'suds-select',*!/
                            /!*"options" : proponentTypes,*!/
                            "lov": "lov/proponentTypes",
                            "placeholder": "Select Type Of Proponent",
                            "required": true
                        }*/
                    ]

                };


                return useDateAndProponentTypeControls;
            },
            getWhereTabControls: function () {


                var whereControls = {
                    id: 'whereContainer',
                    tabHeading: 'Description',
                    type: 'basicInfo/tabHeadingAndSection',
                    sectionWrap: true,
                    items: [
                        {
                            id: 'activityLocationContainer',
                            sectionLabel: 'Location',
                            type: 'basicInfo/questionControl',
                            items: [{
                                type: 'textArea',
                                "id": "activityLocation",
                                "nameAttr": "activityLocation",
                                "prop": "whereActivityConducted",
                                "label": "Where will the activity be conducted? (4000 characters)",
                                "title": "Where will the activity be conducted",
                                "rows": 10,
                                "maxlength": 4000
                            }],
                            hint: 'HINT: This could include specific mile markers or lakes, landmarks. Township/Section/Range, Forest/District, and adjacent road, etc.'
                        },
                        {
                            id: 'activityDescriptionContainer',
                            sectionLabel: 'Purpose',
                            type: 'basicInfo/questionControl',
                            items: [{
                                type: 'textArea',
                                "id": "activityDescription",
                                "nameAttr": "activityDescription",
                                "prop": "purpose",
                                "label": "Reason/Purpose for Use? (4000 characters)",
                                "title": "Reason/Purpose for Use",
                                "rows": 10,
                                "maxlength": 4000
                            }],
                            hint: 'HINT: Provide a summary description of the proposed activity,' +
                            ' such as "Using 6 NFS trees as tailholds associated with the Snoopy Timber Sale owned by Roseberg Forest Products.'
                        },
                        {
                            id: 'activityNecessityContainer',
                            fullSection: true,
                            sectionLabel: 'Need',
                            type: 'basicInfo/questionControl',
                            items: [{
                                type: 'textArea',
                                "id": "activityNecessity",
                                "nameAttr": "activityNecessity",
                                "prop": "whyOnPublicLands",
                                "label": " Necessity of Using NFS Lands? (4000 characters)",
                                "title": " Necessity of Using NFS Lands",
                                "rows": 10,
                                "maxlength": 4000
                            }],
                            hint: 'HINT: Provide a summary that explains why this use cannot ' +
                            'take place in another location, such as "I want my apiary/bees to benefit from the ' +
                            'fireweed that is currently growing on the designated burn area.' +
                            'Fireweed is extremely scarce this year outside of the NFS site I selected."'
                        }

                    ]

                };


                return whereControls;
            },
            getNFSFacilityTabControls: function () {


                var nfsControls = {
                    id: 'nfsFacilityQuesContainer',
                    tabHeading: 'NFS Facility',
                    type: 'basicInfo/tabHeadingAndSection',
                    sectionWrap: true,
                    items: [
                        {
                            id: 'nfsFacilityQues',
                            nameAttr: 'nfsFacilityQues',
                            sectionLabel: 'NFS Facility',
                            prop: 'nfsFacility',
                            type: 'common/yesAndNoQues',
                            question: 'Is the proponent requesting to use a NFS Facility?',
                            yOrN: true
                        },
                        {
                            id: 'activityUseFSFacilityContainer',
                            sectionLabel: 'NFS Facility',
                            type: 'basicInfo/questionControl',
                            items: [{
                                type: 'textArea',
                                "id": "activityUseFSFacility",
                                "nameAttr": "activityUseFSFacility",
                                "prop": "describeUseOfFsFacility",
                                "label": "If yes, which NFS Facility(ies)? (4000 characters)",
                                "title": "This could include use of a campground, boat launch area, pavilion, etc.",
                                "rows": 10,
                                "maxlength": 4000
                            }],
                            hint: 'HINT: This could include use of a campground, boat launch area, pavilion, etc.'
                        }

                    ]

                };


                return nfsControls;
            },
            getFeeAndParticipantsTabControls: function () {


                var roadControls = {
                    id: 'feeAndParticipantsContainer',
                    tabHeading: 'Fee & Participants',
                    type: 'basicInfo/tabHeadingAndSection',
                    sectionWrap: true,
                    items: [
                        {
                            id: 'isFeeCharged',
                            nameAttr: 'isFeeCharged',
                            sectionLabel: 'Fee Charged',
                            prop: 'isFeeCharged',
                            type: 'common/yesAndNoQues',
                            question: 'Is there an entry or participation fee charged, ' +
                            'or the sale of a good or service, regardless ' +
                            'whether the activity is intended to produce a profit? ',
                            yOrN: true
                        },{
                            id: 'participantsContainer',
                            fullSection: true,
                            sectionLabel: 'Participants',
                            type: 'basicInfo/multipleInputsQuestion',
                            label: 'Approximately, how many participants and/or spectators are involved in the event? ',
                            items: [{
                                type: 'inputNum',
                                "id": "participants",
                                "nameAttr": "participants",
                                "prop": "nbrParticipants",
                                "label": "Participants",
                                className: 'suds-input'
                            }, {
                                type: 'inputNum',
                                "id": "spectators",
                                "nameAttr": "spectators",
                                "prop": "nbrSpectators",
                                "label": "Spectators",
                                className: 'suds-input'
                            }]
                        }

                    ]

                };


                return roadControls;
            },
            getRoadsTabControls: function () {


                var roadControls = {
                    id: 'roadContainer',
                    tabHeading: 'Roads',
                    type: 'basicInfo/tabHeadingAndSection',
                    sectionWrap: true,
                    items: [{
                            id: 'usingRoads',
                            nameAttr: 'usingRoads',
                            sectionLabel: 'Road Use',
                            prop: 'planningTo',
                            type: 'common/yesAndNoQues',
                            question: 'Is the proponent planning to use a Forest Service road or utilities right of way?',
                            yOrN: true
                        },
                        {
                            id: 'whichForestRoadsContainer',
                            sectionLabel: 'Specify Roads',
                            type: 'basicInfo/questionControl',
                            items: [{
                                type: 'textArea',
                                "id": "whichForestRoads",
                                "nameAttr": "whichForestRoads",
                                "prop": "nationalForestRoadsUsed",
                                "label": "If yes, which NFS roads?",
                                "title": "Hint: Describe road as NFS road, road number, and/or common name of road.",
                                "rows": 3,
                                "maxlength": 250
                            }],
                            hint : 'Hint: Describe road as NFS road, road number, and/or common name of road.'
                        },{
                            id: 'activityNecessityContainer',
                            fullSection: true,
                            sectionLabel: 'Right of Way Dimensions',
                            type: 'basicInfo/multipleInputsQuestion',
                            label: 'Enter the dimensions of the right of way in Feet.',
                            items: [{
                                type: 'inputNum',
                                "id": "rightOfWayFeetWidth",
                                "nameAttr": "rightOfWayFeetWidth",
                                "prop": "rightOfWayWidth",
                                "label": "Width",
                                /*"pattern" : "/\d{1,2}(,\d{3})*(\.\d+)?/",*/
                                className: 'suds-input'
                            }, {
                                type: 'inputNum',
                                "id": "rightOfWayFeetLength",
                                "nameAttr": "rightOfWayFeetLength",
                                "prop": "rightOfWayLength",
                                "label": " x Length",
                                /*"pattern" : "\d{1,2}(,\d{3})*(\.\d+)?",*/
                                className: 'suds-input'
                            }]
                        }

                    ]

                };


                return roadControls;
            },
            getFilesTabControls: function () {


                var fileUploadControls = {
                    id: 'filesContainer',
                    tabHeading: 'Files',
                    type: 'basicInfo/tabHeadingAndSection',
                    sectionWrap: false,
                    items: [
                        {
                            id: 'fileUploadContainer',
                            sectionLabel: 'Upload a File',
                            fullSection: true,
                            type: 'basicInfo/fileUpload',
                            items: [{
                                "type": "select",
                                "id": "fileTypeList",
                                "prop": 'selectedFileLabelCn',
                                "label": "File Label",
                                /*"nolabel": true,*/
                                "placeholder": "Select File Label",
                                /*"options": fileLabels*/
                                "lov" :"lov/attachmentCatLabels"
                            },
                                {
                                    "type": "inputText",
                                    "id": "otherDesc",
                                    "prop": 'otherDesc',
                                    "label": "Other Description",
                                    "required": true
                                }]
                        },
                        this.getUploadedFilesTableControl()

                    ]

                };


                return fileUploadControls;
            },


            events: {
                'click #usingRoads input[type=radio]': function (event) {

                    //event.preventDefault();
                    var $target = $(event.target);

                    if ($target.prop('checked') === true) {
                        if ($target.attr('id') === 'usingRoads_Yes') {
                            this.model.set('plannedUseOfFsRoadRowInd', 'Y');
                            $("#whichForestRoads", this.$el).prop('disabled', false)
                        } else {
                            this.model.set('plannedUseOfFsRoadRowInd', 'N');
                            this.model.unset('nationalForestRoadsUsed', {silent: true});
                            $("#whichForestRoads", this.$el).val('')
                            $("#whichForestRoads", this.$el).prop('disabled', true)
                        }
                    }

                }, 'click #isFeeCharged input[type=radio]': function (event) {
                    //event.preventDefault();

                    var $target = $(event.target);

                    if ($target.prop('checked') === true) {
                        if ($target.attr('id') === 'isFeeCharged_Yes') {
                            this.model.set('feeChargedInd', 'Y');
                            $("#isFeeChargedAmt", this.$el).prop('disabled', false)
                        } else {
                            this.model.set('feeChargedInd', 'N');
                            $("#isFeeChargedAmt", this.$el).prop('disabled', true)
                        }
                    }
                },'click #nfsFacilityQues input[type=radio]': function (event) {
                    //event.preventDefault();

                    var $target = $(event.target);

                    if ($target.prop('checked') === true) {
                        if ($target.attr('id') === 'nfsFacilityQues_Yes') {
                            //this.model.set('feeChargedInd', 'Y');
                            $("#activityUseFSFacility", this.$el).prop('disabled', false)
                        } else {
                            this.model.unset('describeUseOfFsFacility', {silent: true});
                            $("#activityUseFSFacility", this.$el).val('')
                            $("#activityUseFSFacility", this.$el).prop('disabled', true)
                        }
                    }
                },
                'change #fileUploader ': "handleFiles",
                'change #fileTypeList': "showOrHideOtherDesc",
                'click .fileUploadBtn' : "saveFile",
                'click .removeFile'  : 'removeFile'
                /*'keydown  #rightOfWayFeetWidth' : 'isNumberKey',
                'keydown  #rightOfWayFeetLength' : 'isNumberKey'*/
                //... other custom events go here...
            },

            modelEvents: {
                "change:proposalReceivedDate": "changeStartDateOfUseStartDateCalendar",
                "change:useStartDate": "changeStartDate",
                "change:useEndDate": "changeEndDate",
                "change:rightOfWayWidth": "setMiles",
                 "change:rightOfWayLength": "setMiles"
            },

            getSelectedFileLabel: function (fileLabelCn) {

                var fileLabel = null;

                _.each(this.config.currentStep.displayOrderToUiAttribute[15].multipleSelectValues, function (item) {
                    if (item.id == fileLabelCn) {
                        fileLabel = item.value;
                    }
                });

                return fileLabel;
            },

            changeStartDateOfUseStartDateCalendar: function () {
                var start = Nrm.app.getModelVal(this.model, 'proposalReceivedDate') || Suds.currentDate();

                $('#useStartDate', this.$el).nrmDatePicker('setStartDate', start);
                $('#useStartDate', this.$el).nrmDatePicker('update', '');
                $('#useEndDate', this.$el).nrmDatePicker('update', '');

            },
            changeStartDate: function () {

                var start = Nrm.app.getModelVal(this.model, 'useStartDate') || '1970-01-01';
                $('#useEndDate', this.$el).nrmDatePicker('setStartDate', start);
            },
            changeEndDate: function () {
                var end = Nrm.app.getModelVal(this.model, 'useEndDate');
                $('#useStartDate', this.$el).nrmDatePicker('setEndDate', end);

            },

            setMiles: function () {

                var width = this.model.get('rightOfWayWidth') || 0,
                    length = this.model.get('rightOfWayLength') || 0,
                    feet, miles,text,
                    self = this;

                if (width && $.type(width) !== "string") {
                    width = width.toString();
                }

                if (length && $.type(length) !== "string") {
                    length = length.toString();
                }


                if (length || width) {
                    feet = Math.max(length, width),
                        miles = (feet / 5280).toFixed(2)
                    text = " = " + (this.addCommas(feet && feet.toFixed(2))) + " total feet (" + this.addCommas(miles) + " miles)"

                    //$('.totalFeetAndMilesText', this.$el).text(text)
                    $("#rightOfWayFeetLength",this.$el).closest(".form-inline").find(".totalFeetAndMilesText").text(text);

                    this.model.set('rightOfWayMiles', miles);
                }

            },
            getUploadedFilesTableControl: function () {

                var tableControl = {

                    "type": "tableEdit",
                    fullSection: true,
                    "id": "uploadedFilesTable",
                    /*"prop" :'uploadedFiles' ,*/
                    "hasResults": this.addedFiles && this.addedFiles.size() > 0,
                    "value": this.addedFiles,
                    "columns": [
                        {
                            "prop": "fileLabel",
                            "label": "File Label"

                        },
                        {
                            "prop": "fileName",
                            "label": "File Name",
                        },
                        {
                            "prop": "type",
                            "label": "Type",
                            className: 'documentTypeCol'
                        },{
                            pluginOpts: {
                                orderable: false
                            },
                            control:{
                                type: 'toolbar',
                                btnClass: 'btn-xs',
                                actions: [
                                    {
                                        "title": "Remove File",
                                        type: 'btn',
                                        btnStyle: "danger",
                                        "className": "btn-xs nrm-route-action removeFile",
                                        "icon": "glyphicon glyphicon-remove",
                                        "label": 'Remove',
                                        "id": "removeFile-row"
                                    }
                                ]
                            }
                        }

                    ],
                    "pluginOpts": {
                        "multiSelect": false,
                        "readOnly": true,
                        "searching": false,
                        "paging": false
                    },
                    "actions": []
                }

                return tableControl;
            },


            saveFile: function () {
                this.saveCompleted(this.addOrRemoveFileModel)
            },

            handleFiles: function (event) {

                var model = this.model.toJSON();

                var found = false,
                    fileTypesArray = [];
                /*allowedFileTypes = model.displayOrderToUiAttribute[14],*/

                if (event.target.files.length > 0) {
                    $('.fileTypeListContainer', this.$el).removeClass("disabled")


                    this.fileDirty = true;
                    var f = this.file = event.target.files[0];
                    var ext, name = f.name;
                    if (name && name.indexOf('.') > 0) {
                        ext = _.last(name.split('.'));
                    } else {
                        ext = '';
                    }
                    this.fileExt = ext;
                    if(this.allowedFileTypes && this.allowedFileTypes.each){


                        this.allowedFileTypes.each(function(fileTypeModel) {
                            fileTypesArray.push(fileTypeModel.get("fileExtension"));
                            if ( ext.toLowerCase().trim() == fileTypeModel.get("fileExtension").toLowerCase().trim()){
                                found = true;
                            }
                        });

                        if (!found) {
                            Nrm.event.trigger("app:modal", ( {
                                "text": 'Allowed file types are ' + fileTypesArray.toString() + ".",
                                "caption": "Upload Failed!"
                            }));
                            return false;
                        }
                    }



                    this.readFromModel(f);
                }
            },

            showOrHideOtherDesc: function (event) {
                // get currentFileLabel
                // if fileLabel == 'Other', add div element to add description

                var fileLabel = $("#fileTypeList  option:selected").text();
                if (fileLabel == 'Other') {
                    $("#otherDesc-container").show();
                } else {
                    $("#otherDesc-container").hide();
                }

            },

            addNewFile: function ($table, attributes) {

                var coll = this.getCollectionForTable($table);
                if (!coll) return;
                var newModel = new coll.model(attributes);

                coll.add(newModel);
                this.setDirty(true);

                $("#fileUploader", this.$el).val('');

                if (coll.length > 0) {
                    $("#uploadedFilesTable-container", this.$el).closest('.section').fadeIn();
                }

                this.updateDocTypeIcons();

            },

            updateDocTypeIcons : function () {
              var docTypeCols = $(".documentTypeCol",this.$el);

                docTypeCols.each(function (idx,object) {
                   var documentType = $(this).html(),
                       self = this,
                       documentType = documentType && documentType.toUpperCase();
                    //'<span class="fa fa-file-pdf-o"></span>'+ documentType + '</span>'
                    var docTypeContainer = $('<div/>').attr('id', 'docTypeIconContainer'+idx);
                    var svg;
                   //idx 0 is table header
                    if (idx != 0){
                        switch (documentType && documentType.toUpperCase()){
                            case ".PNG" :
                                $(this).html('').append(docTypeContainer.append('<span class="fa fa-file-image-o"></span>').css({
                                    color : 'blue',
                                    "font-size":"36px",
                                }));
                                break;
                            case ".DOCX" :
                                $(this).html('').append(docTypeContainer.append('<img src="img/word_2013_logo.png" title="Word File" alt="Word File Icon">'));
                                break;
                            case ".PDF" :
                                $(this).html('').append(docTypeContainer.append('<img src="img/pdf-file-logo.png"  title="PDF File" alt="PDF File Icon">'));
                                break;
                            case ".XLSX" :
                                $(this).html('').append(docTypeContainer.append('<img src="img/xcel-logo.png" title ="Excel File" alt="Xcel File Icon">'));
                                break;
                            case ".TXT" :
                                $(this).html('').append(docTypeContainer.append('<img src="img/notepad_icon_small.png" title ="Text File" alt="Text File Icon">'));
                                break;
                            default :
                                $(this).html('').append( docTypeContainer.load('img/file-image.svg' ,null, function() {
                                    $("#docTypeExtension").text(documentType && documentType.split(".")[1]);
                                    $("#svg_7").text(documentType && documentType.split(".")[1]);
                                    }));
                                break;
                        }
                    }



                })

            },
            removeFile: function (e) {

                var model = this.getModelForTableRow($(e.target))
                var data = {
                    entityCn: model.get('attachmentCn'),
                    entityType: 'attachment'
                }

                var deleteFileModel = new DeleteFilesModel();

                deleteFileModel.fetch({
                    type: "POST",
                    traditional: true,
                    data: data,
                    success: _.bind(function () {
                        model.collection.remove(model);
                        var coll = this.getCollectionForTable($("#uploadedFilesTable", this.$el));

                        if (coll.length <= 0) {
                            $("#uploadedFilesTable-container", this.$el).closest('.section').fadeOut();
                        }
                    }, this),
                    error: function (model, resp, options) {
                    }
                });


            },

            getCollectionForTable: function ($table) {

                if (this.addedFiles && $table && $table.attr("id") === "uploadedFilesTable") {
                    return this.addedFiles;
                }
                return PanelView.prototype.getCollectionForTable.apply(this, arguments);

            },
            bytesToString: function (nBytes, details) {
                if (nBytes === undefined)
                    return "";
                var sOutput = nBytes + " bytes";
                for (var aMultiples = ["KB", "MB", "GB", "TB", "PB"], nMultiple = 0, nApprox = nBytes / 1024; nApprox > 1; nApprox /= 1024, nMultiple++) {
                    sOutput = nApprox.toFixed(nMultiple === 0 ? 0 : 1) + " " + aMultiples[nMultiple];
                    if (details) sOutput += " (" + nBytes + " bytes)";
                }
                return sOutput;
            },

            readFromModel: function (file) {
                var fileAttributes = {fileName: file.name, size: file.size, dateProduced: file.lastModifiedDate}
                var ext, name = file.name;
                if (name && name.indexOf('.') > 0) {
                    ext = '.' + _.last(name.split('.'));
                    name = name.replace(ext, '');
                } else {
                    ext = '';
                }

                fileAttributes.typeAndSize = ext + "; " + this.bytesToString(file.size, true);
                fileAttributes.type = ext;

                if (this.addedFiles && this.addedFiles.model){
                    this.addOrRemoveFileModel = new this.addedFiles.model(fileAttributes)
                }


            },

            addCommas :  function(nStr) {
                nStr += '';
                var x = nStr.split('.'),
                x1 = x[0],
                x2 = x.length > 1 ? '.' + x[1] : '';
                var rgx = /(\d+)(\d{3})/;
                while (rgx.test(x1)) {
                    x1 = x1.replace(rgx, '$1' + ',' + '$2');
                }
                return x1 + x2;
            },

            uploadFile: function (options) {

                var fileLabel = $("#fileTypeList  option:selected").text(),
                    authorization = this.model.toJSON();
                if (!this.model.get('selectedFileLabelCn')) {

                    Nrm.event.trigger("app:modal", ( {
                        "text": 'Please select a label for the attachment.',
                        "caption": "Upload Failed!"
                    }));

                    return
                }


                if ((fileLabel== 'Other') && !this.model.get('otherDesc')) {
                    Nrm.event.trigger("app:modal", ( {
                        "text": 'Please select a description for the attachment.',
                        "caption": "Upload Failed!"
                    }));

                    return
                }



                if (fileLabel == 'Other') {
                    fileLabel = this.model.get('otherDesc');
                }
                this.addOrRemoveFileModel.set('fileLabel', fileLabel);

                var options = options || {},
                    url,

                options = _.defaults(options, {
                    file: this.file,
                    "fileName": this.addOrRemoveFileModel.get('fileName')
                });

                var data = new FormData();
                data.append("file", options.file);
                data.append("recordId", authorization.authorizationCn|| '');
                data.append("attachCatCode", this.model.get('selectedFileLabelCn') || '');
                data.append("fileDesc", this.model.get('otherDesc'));


                this.uploadToServer(data)
            },


            uploadToServer : function (data) {

                var baseApiUrl = "api/recordservice/";

                if (window.location.port === "3000") {
                    url = 'http://localhost:' + 7001 + '/' + 'nrm/suds' + '/' + baseApiUrl;
                } else {
                    url = baseApiUrl;
                }

                Backbone.ajax({
                    url: url + "attachFile",
                    method: "POST",
                    data: data,
                    cache: false,
                    //dataType: 'json',
                    processData: false, // Don't process the files
                    contentType: false // Set content type to false as jQuery will tell the server it's a query string request
                }).done(_.bind(this.fileUploadSuccess, this)).fail(this.fileUploadError);
            },

            fileUploadSuccess : function (data, textStatus, jqXHR) {

                Nrm.event.trigger("app:modal", ( {
                    "text": "Upload was successful.",
                    "caption": "Success!"
                }));

                this.model.unset("selectedFileLabelCn", {silent: true});
                $('#fileTypeList').val([]).trigger('change');

                this.fileDirty = false;
                this.addNewFile($("#uploadedFilesTable", this.$el), $.extend({}, this.addOrRemoveFileModel.toJSON(), {attachmentCn: data}));
            },

            fileUploadError : function (jqXHR, textStatus, errorThrown) {
                console.error('upload failed with status: ' + textStatus, jqXHR, errorThrown);
            },

            saveCompleted: function (model) {

                if (model) {
                    if (this.fileDirty) {
                        this.addOrRemoveFileModel = model;
                        this.uploadFile({message: "Upload was successful."});

                    }
                }
            },

            render: function () {
                PanelView.prototype.render.apply(this, arguments);


                $('#proposalReceivedDate', this.$el).nrmDatePicker('setEndDate', Suds.currentDate());
                this.changeStartDateOfUseStartDateCalendar();
                return this;


            },

            updateShape: SpatialEditView.prototype.updateShape,
            drawEnd: SpatialEditView.prototype.drawEnd,
            featureEdit: SpatialEditView.prototype.featureEdit,

            /**
             * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
             * @returns {undefined}
             */
            startListening: function () {
                //PanelView.prototype.startListening.apply(this, arguments);

                SpatialEditView.prototype.startListening.apply(this,arguments);

                this.listenTo(this, {
                    'renderComplete': function () {
                        // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                        // to occur after view is added to the page, which is why we have to use the renderComplete event
                        // instead of calling it from the render function
                        var self = this;
                        this.rendered = true;

                        $.when(Nrm.app.getContext({
                            apiKey: "lov/allowedFileTypes"
                        }, this)).done(function(context) {
                            $.when(Nrm.app.getCollection(context, null, this)).done(function (collection) {
                                self.allowedFileTypes = collection;
                            });
                        });

                        var isFeeCharged = this.model.get('feeChargedInd'),plannedToUseForestInd = this.model.get('plannedUseOfFsRoadRowInd');

                        if (isFeeCharged &&  isFeeCharged == "Y"){
                            $("#isFeeCharged_Yes", this.$el).prop('checked', true);
                        }else if (isFeeCharged &&  isFeeCharged ==  "N"){
                            $("#isFeeCharged_No", this.$el).prop('checked', true);
                        }

                        if (plannedToUseForestInd &&  plannedToUseForestInd == "Y"){
                            $("#usingRoads_Yes", this.$el).prop('checked', true);
                            $("#whichForestRoads", this.$el).prop('disabled', false);
                        }else if (plannedToUseForestInd && plannedToUseForestInd == "N"){
                            $("#usingRoads_No", this.$el).prop('checked', true);
                            $("#whichForestRoads", this.$el).prop('disabled', true);
                        }

                        if (!this.model.get('describeUseOfFsFacility')){
                            $("#activityUseFSFacility", this.$el).prop('disabled', true)
                        }


                        /*this.model.set('proposalReceivedDate', Suds.currentDate())*/

                        /*if (!this.model.get('useStartDate')){
                            this.setControlEnabled($('#useEndDate', this.$el),false);
                        }*/

                        $("#uploadedFilesTable-container", this.$el).closest('.section').fadeOut();
                        this.changeStartDateOfUseStartDateCalendar();
                        $("#otherDesc-container").hide();

                    }
                });

            }

        });
    });