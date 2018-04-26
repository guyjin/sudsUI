define(['../..','../panelView', "jquery", "nrm-ui", 'underscore','backbone','app/models/common/recordModel','app/views/basicInfo/basicInfoFormView'],
    function (Suds,PanelView, $, Nrm, _, Backbone, RecordModel,BasicInfoFormView) {

        return BasicInfoFormView.extend({

            genericTemplate: 'common/editDataPointModal',

            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments) || {};

                var model = this.model.toJSON(),self=this;


                config.modalTitle = this.options.modalOptions.title
                config.controls= this.options.controls;
                config.modalControls = _.find(this.options.controls,function (item) {
                    return !item.fileUpload
                })

                return config;
            },


            events: $.extend({},
                BasicInfoFormView.prototype.events,
                PanelView.prototype.events,
                PanelView.prototype.changeEvents, {
                    'click .suds-save-btn': "saveBtnClicked",

                    'click .resetBtn':function (e) {
                        e.preventDefault();
                        $(':input',this.$el).val('');
                        $('option').attr('selected', false);
                    }
                }),



            modelEvents: $.extend({},
                BasicInfoFormView.prototype.modelEvents),


            /*
            Todo : Need to revisit this once we have proper file name for now just use "other" attachment type
             *
             * */
            saveFile : function () {

                var authorization = this.model.toJSON();
                var self = this;

                if (this.fileExt != ".pdf"){
                    Nrm.event.trigger("app:modal", ( {
                        "text": "Authorization document has to be in pdf file format.",
                    }));

                    return
                }
             /*Todo : This is added temporarily to get "other" cn Number ... using this instead of hardcoding*/
                $.when(Nrm.app.getContext({
                    apiKey: "lov/attachmentCatLabels"
                }, this)).done(function(context) {
                    $.when(Nrm.app.getCollection(context, null, this)).done(function (collection) {

                        if (collection && collection.size() > 0){

                            collection.each(function (model) {

                                if (model.get("code").toLowerCase() == "authdoc"){
                                    var data = new FormData();
                                    data.append("file", self.file);
                                    data.append("recordId", authorization.authorizationCn|| '');
                                    data.append("attachCatCode", model.get("code") || '');
                                    //data.append("fileDesc", "Signed Authorization Document");

                                    self.uploadToServer(data)
                                }
                            })
                        }

                    });
                });

            },

            fileUploadSuccess : function () {
                $("#editDataPointModal").modal('hide');

                this.fileUpoaded = true;
                Nrm.event.trigger("app:modal", ( {
                    "text": "Upload was successful.",
                    "caption": "Success!"
                }));
            },

            fileUploadError : function (jqXHR, textStatus, errorThrown) {
                $("#editDataPointModal").modal('hide');
                Nrm.event.trigger("app:modal", ( {
                    "text": "There was a problem uploading the file.",
                    "caption": "Error!"
                }));

                console.error('upload failed with status: ' + textStatus, jqXHR, errorThrown);
            },

            saveBtnClicked : function (e) {
                e.preventDefault();

                var authorization = this.model.toJSON();

                var recordModel = new RecordModel({id: this.model.get('authorizationCn')});


                recordModel.save(authorization,{
                    success : _.bind(function(model, resp, options) {

                        this.saveBtnSuccessClicked = true
                        $("#editDataPointModal").modal('hide');
                    },this) ,
                    error : function(model, resp, options) {
                        var error = Nrm.app.normalizeErrorInfo('Failed to Save',
                            model, resp || model, options);
                        Nrm.event.trigger('showErrors', error, { allowRecall: false });
                    }
                })
                console.log("save and continue")
            },

            setDirty : function(){

                return false;
            },
            render : function () {

                var templateData = _.extend({}, this.config);

                this.listenTo(this, {
                    'renderComplete': function() {
                        this.rendered = true;
                       /* this.$el.closest('.modal').addClass('suds-container')*/
                        this.$el.closest('.modal-content').addClass('suds-modal-content')
                        this.setElement(this.$el.closest('.modal-content'));
                        this.$el.html(this.template(templateData));

                        PanelView.prototype.render.apply(this, arguments);

                        $('#proposalReceivedDate', this.$el).nrmDatePicker('setEndDate', Suds.currentDate());

                    }
                });

            },



        });
    });