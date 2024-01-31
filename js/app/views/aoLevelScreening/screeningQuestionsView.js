define(['../panelView', "jquery", "nrm-ui", 'underscore',
        'backbone','./editAnswerView',
        'app/models/aoLevelScreening/aoReviewAcceptRejectModel',
    'app/views/common/specialUseRecordView'],
                            function (PanelView, $, Nrm, _,
                                      Backbone,EditAnswerView,AOReviewAcceptRejectModel,SpecialUseRecordView) {

    return PanelView.extend({

        genericTemplate: 'aoLevelScreening/aoLevelScreening',

        getConfig: function () {


            var config = PanelView.prototype.getConfig.apply(this, arguments) || {},
                min = 0,
                 max= 0,
                questions = [];


            config.currentStep = this.model.toJSON();

            var proposalReviewDTO = config.currentStep.proposalReviewDetailsDto;

            if (this.parentModel.getCurrentStepName() == "AO1stLevelScreening"){
                config.AOLevel = " Initial Screening Criteria "
                max = 9;

            } else if (this.parentModel.getCurrentStepName() == "AO2ndLevelScreening"){
                min = 9;
                max = 14;
                config.AOLevel = "Second Level Screening  "

            }

            /*for (var i=min;i < max;i++){
                questions.push(config.currentStep.proposalReviewDetailsDto.questionAndAnswerDTOList[i]);
            }*/

            config.questions = proposalReviewDTO.questionAndAnswerDTOList;

            config.useDesc = proposalReviewDTO.tabDesc["useDesc"];
            config.activityTypeDesc = proposalReviewDTO.tabDesc["activityTypeDesc"];

            config.record = this.parentModel.get('record');

            /*config.controls=[{}]*/

            return config;
        },

        events: {
                'click .infoViewBar button':function (e) {
                    e.preventDefault();
                    // grab the data value
                    var target = $(e.target).attr('data-target');
                    // make sure everything gets closed
                    $('.infoView div',this.$el).removeClass('open');
                    // use the data-target value to find the correct info block and assign the class to open it.
                    $("." + target,this.$el).addClass('open');
                },

                'click .answerBlock': 'editAnswer',
                'click .infoView .closer':function (e) {
                    e.preventDefault();
                    var target = $(e.currentTarget).attr('data-target');
                    $(e.currentTarget).parents('.' + target).removeClass('open pinned');
                },
                'click .infoView .pin':function (e) {
                    e.preventDefault();
                    var target = $(e.target).attr('data-target');
                    $(e.target).parents('.' + target).removeClass('open').addClass('pinned');
                },
                'click .editCloser':function (e) {
                    e.preventDefault();
                    $('#editingModal').modal('hide');
                },
                'click .decisionButtons' : 'acceptOrRejectDecision',
                'click .summaryBlock' : 'summaryView'

                //... other custom events go here...
            },

        /*modelEvents: $.extend({}, EditorView.prototype.modelEvents, {
            'change:width': 'calculateMiles'
            'change:width': 'calculateMiles'
        }),*/


        editAnswer : function (e) {
            e.preventDefault();
            var $target = $(e.currentTarget);
            var self = this;
            var q = $target.children('.question').text();
            var a = $target.children('.answer').children('.answerText'),
                questionAndAnswerDTOList = this.config.currentStep.proposalReviewDetailsDto.questionAndAnswerDTOList;
                this.updatedQuesAndAnsList = [];

            $target.addClass('editing');


            var selectedQuesAndAnswerDTO = _.find(questionAndAnswerDTOList, function(questionAndAnswer) {
                return questionAndAnswer.question === q.trim();
            });


            selectedQuesAndAnswerDTO.answer = (a.hasClass("True")? "True" : "False");


            var options = {
                model : this.model,
                question : q.trim(),
                answer : a,
                selectedQuesAndAnswerDTO  : selectedQuesAndAnswerDTO
            }

            var editAnswerView = new EditAnswerView(options);
            var modal = Nrm.event.trigger("app:modal", {
                modalId: 'editingModal',
                view: new EditAnswerView(options),
                backdrop: "static",
                animate : true,
                events:  { 'click #saveBtnId': 'close' },
                callback: function() {



                    if (this.clickedId != "saveBtnId"){
                        $target.removeClass('editing');
                        $('.editing').removeClass('editing');
                        $('#editingModal .active').removeClass('active');
                        return
                    }

                    var $answerText = $('.editing').children('.answer').children('.answerText');
                    var updatedQuesAndAns = editAnswerView.model.get('selectedQuesAndAns');

                    $answerText
                        .removeClass()
                        .addClass('answerText')
                        .addClass(updatedQuesAndAns.answer)
                        .children('.textBlock').text(updatedQuesAndAns.answer.toLowerCase());

                    if (updatedQuesAndAns.answer.toLowerCase() === 'true') {
                        $answerText.children('i')
                            .removeClass()
                            .addClass('fa fa-check');
                    } else {
                        $answerText.children('i')
                            .removeClass()
                            .addClass('fa fa-times');
                    }

                    $target.removeClass('editing');
                    $('.editing').removeClass('editing');
                    $('#editingModal .active').removeClass('active');

                    selectedQuesAndAnswerDTO = updatedQuesAndAns;

                    _.each(questionAndAnswerDTOList,function (obj,idx) {

                        var selectQuestion = selectedQuesAndAnswerDTO && selectedQuesAndAnswerDTO.explanation;
                        if (selectQuestion
                            && selectedQuesAndAnswerDTO.questionAnswerCn === obj.questionAnswerCn){
                            obj.explanation =  selectedQuesAndAnswerDTO.explanation;
                            obj.updated = true;
                        }
                    })

                    self.updatedQuesAndAnsList = _.filter(questionAndAnswerDTOList, function (quesAndAns) {
                        return quesAndAns.updated;
                    });

                }

            });




        },
        acceptOrRejectDecision : function (event) {


            var decision = $(event.target).attr('data-answer');
            var self = this;
            $('.stamp',this.$el).removeClass('show');

            var acceptRejectModel = new AOReviewAcceptRejectModel();

            /*Todo : hard coding for now eventually we will have recordDTO and we will pass that*/
            var recordDto = {
                recordCn : '4D12735D33916824E054020820E22EC1'
            }

            if (this.parentModel && this.parentModel.get('record')){
                recordDto = this.parentModel.get('record');
            }


            _.each(self.updatedQuesAndAnsList,function (obj,idx) {
                if (obj.revision){
                    obj.revision = obj.revision + 1 ;
                    delete  obj.updated ;
                }
            })

            if (!self.updatedQuesAndAnsList){
                self.updatedQuesAndAnsList = [];
            }
            self.config.currentStep.proposalReviewDetailsDto.questionAndAnswerDTOList = self.updatedQuesAndAnsList;
            self.config.currentStep.proposalReviewDetailsDto.screenLevelStatus = decision.charAt(0).toUpperCase();
            self.model.set("proposalReviewDetailsDto",self.config.currentStep.proposalReviewDetailsDto);
            if(decision === 'accept') {
                $('.acceptedStamp',this.$el).addClass('show');
            } else if(decision === 'reject') {
                $('.rejectedStamp',this.$el).addClass('show');
            }

            setTimeout(function () {
                self.trigger('save');
            },200)

            /*acceptRejectModel.save(recordDto,{
                success : _.bind(function(model, resp, options) {
                    if(decision === 'accept') {

                        $('.acceptedStamp',this.$el).addClass('show');
                        /!*setTimeout(function () {
                            if (self.options.level == "1"){
                                Nrm.event.trigger('suds:ao-level-test', "2");
                            }else if (self.options.level == "2"){
                                Nrm.event.trigger('suds:ao-level-test', "results");
                            }
                        },200)*!/

                        this.trigger('save');

                    } else if(decision === 'reject') {
                        $('.rejectedStamp',this.$el).addClass('show');
                    }
                },this),
                error : function(model, resp, options) {}
            });*/

        },
        summaryView : SpecialUseRecordView.prototype.summaryView,
        render : function () {

            PanelView.prototype.render.apply(this, arguments);

            return this;
        },

        /**
         * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
         * @returns {undefined}
         */
        startListening: function() {
            PanelView.prototype.startListening.apply(this,arguments);


            this.listenTo(this, {
                'renderComplete': function() {
                    this.rendered = true;
                }
            });

        },

    });
});