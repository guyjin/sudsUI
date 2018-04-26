define(['../panelView', "jquery", "nrm-ui", 'underscore',
        'hbs!aoLevelScreening/editingModal','backbone','app/models/aoLevelScreening/aoReviewUpdateModel'],
    function (PanelView, $, Nrm, _,EditingModal, Backbone,AOReviewUpdateModel) {

        return PanelView.extend({

            /*genericTemplate: 'addContactsToProposal/contacts',*/

            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments);


                /*config.controls=[{

                 }]*/
                var model = this.model.toJSON();

                if (model.stepId == "AO1stLevelScreening"){
                    this.textAreaQues = "Reason for Change :"

                } else if (model.stepId == "AO2ndLevelScreening"){
                    this.textAreaQues = "AO Decision Remarks (4000)"
                }

                this.question = this.options.question;
                this.controls=[{
                        type : 'textArea',
                        "id" : "reasonForChange",
                        "prop" : "comments",
                        "label" : "Comments",
                        "title" : "Tell me a story" ,
                        "rows" : 10,
                        "maxlength": 4000,
                    }]



                return config;
            },

            events: $.extend({},
                PanelView.prototype.events,
                PanelView.prototype.changeEvents, {
                    'click .answer':'onAnswerSelected',
                    'change #changeReason' : function (event) {
                        var selectedQuesAns = this.options.selectedQuesAndAnswerDTO;

                        if ($(event.target).val().trim() != ""){
                            selectedQuesAns.explanation = $(event.target).val().trim();
                        }
                        this.model.set("selectedQuesAndAns", selectedQuesAns)

                    },

                }),



            /*modelEvents: $.extend({}, EditorView.prototype.modelEvents, {
             'change:width': 'calculateMiles'
             'change:width': 'calculateMiles'
             }),*/

            onAnswerSelected :function (e) {

                var $target = $(e.currentTarget);
                var $answerText = $('.editing').children('.answer').children('.answerText'),
                    aoReviewUpdateModel = new AOReviewUpdateModel();

                var selectedQuesAns = this.options.selectedQuesAndAnswerDTO,
                    $textBoxSelector = $(".reasonForChange",this.$el);


                var t = $target.text().trim();

                if (t.toLowerCase() !== 'save') {
                    selectedQuesAns.answer = t;
                    this.$el.find('.active').removeClass('active');
                    $target.addClass('active');
                    $textBoxSelector.show();

                    if ($("#changeReason",this.$el) && $("#changeReason",this.$el).val().trim() != ""){
                        selectedQuesAns.explanation = $("#changeReason",this.$el).val().trim();
                    }

                    this.model.set("selectedQuesAndAns", selectedQuesAns)
                }



                /*Todo : maybe we will need to uncomment when roles are implemented*/
                /*aoReviewUpdateModel.save(selectedQuesAns,{
                 success : _.bind(function(model, resp, options) {
                 $('#editingModal').modal('hide');
                 },this),
                 error : function(model, resp, options) {}
                 });*/


            },

            validate : function () {

            },

            render : function () {
                PanelView.prototype.render.apply(this, arguments);

                var model = this.model.toJSON(),
                    answer = this.options.answer,
                    self = this;

                if (answer.hasClass('True')) {
                    this.answer = "True";
                } else if (answer.hasClass('False')) {
                    this.answer = "False";
                }


                var templateData = _.extend({}, this, model);
                this.listenTo(this, {
                    'renderComplete': function() {

                        this.rendered = true;
                        this.setElement(this.$el.closest('.modal'));
                        this.$el.html(EditingModal(templateData));
                        var $textBoxSelector = $(".reasonForChange",this.$el);
                        if (this.options.selectedQuesAndAnswerDTO.explanation){
                            $textBoxSelector.show();
                            $("#changeReason",self.$el).val(self.options.selectedQuesAndAnswerDTO.explanation);
                        }else{
                            $textBoxSelector.hide();
                        }

                        this.model.set("selectedQuesAndAns", this.options.selectedQuesAndAnswerDTO)
                        /*$("#changeReason",self.$el).val(self.options.selectedQuesAndAnswerDTO.explanation);*/


                    }
                });

            },



        });
    });