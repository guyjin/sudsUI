define(['../..', '../panelView', "jquery", "nrm-ui", 'underscore', 'backbone', 'app/models/questionModel', 'app/models/getTableRecordByAuthAndProp'],
    function (Suds, PanelView, $, Nrm, _, Backbone, QuestionModel, GetTableRecordByAuthCnAndProp) {

        return PanelView.extend({

            genericTemplate: 'common/ctrlsIterator',

            getConfig: function () {

                var config = PanelView.prototype.getConfig.apply(this, arguments);

                var authorization = this.model.toJSON();
                var tabNames = [];
                debugger
                var deferred = new $.Deferred();
                var self = this;
                //this.model = new BasicInfoModel;`
                this.questionType = config.questionType;

                if (this.questionType == "SCREEN1"){
                    tabNames = ['Initial Screening']
                    this.model.set("currentSectionId", "Screening");
                    this.model.set("currentSectionStatus", "InProgress");
                    this.model.set("nextStepId", "SCREEN2");
                }else if (this.questionType == "SCREEN2"){
                    tabNames = ['Initial Screening','Second Level Screening']
                    this.model.set("currentSectionId", "Screening");
                    this.model.set("currentSectionStatus", "Complete");
                    this.model.set("nextStepId", this.model.get("caseFileId"));
                }else if (this.questionType == "AUTHREQ"){
                    tabNames = ['Authorization Needed']
                    this.model.set("currentSectionId", "AuthNeeded");
                    this.model.set("currentSectionStatus", "Complete");
                    this.model.set("nextStepId", this.model.get("caseFileId"));
                }


                this.model.set("screenId", this.questionType);
                var questionModel = new QuestionModel({
                    questionType: this.questionType
                });



                questionModel.fetch({
                    success: function(model, resp, options){

                        self.listOfQuestionAnswer = resp;

                        config.controls = [
                            {
                                type: 'common/soloTabSummaryHeader',
                                screenName: {
                                    tabNames: tabNames
                                }
                            }, {
                                id: "level1Screening",
                                type: 'common/screenContentControls',
                                controls: self.getTabHeadingAndSectionsControls(resp, this.questionType)
                            }
                        ]
                        deferred.resolve(config);
                        console.log(config.controls);
                    },
                    error: function(model, resp, options){
                        deferred.reject()
                    }
                });

                return deferred.promise();
            },

            getTabHeadingAndSectionsControls: function(resp){
                var tabHeadingAndSectionsControls = [];


                if(this.questionType == 'AUTHREQ'){
                    tabHeadingAndSectionsControls[0] = this.getControlWithChildrenScreeningQuesnsControls(resp);
                }else{
                    tabHeadingAndSectionsControls[0] = this.getControlWithChildAnswerAllControl();
                    tabHeadingAndSectionsControls[1] = this.getControlWithChildrenScreeningQuesnsControls(resp);
                }

                return tabHeadingAndSectionsControls;
            },

            getControlWithChildrenScreeningQuesnsControls: function(resp){
                var tabHeading;

                if(this.questionType == 'SCREEN1'){
                    tabHeading = "PRIMARY SCREENING QUESTIONS";
                }else if (this.questionType == 'SCREEN2'){
                    tabHeading = "SECONDARY SCREENING QUESTIONS";
                }else if (this.questionType == 'AUTHREQ'){
                    tabHeading = "CHECKS";
                }

                return {
                    id: "tabHeadingAndSections1",
                    tabHeading: tabHeading,
                    type: 'common/tabHeadingAndSection',
                    sectionWrap: false,
                    items: this.getQuestionControls(resp)
                }
            },

            getQuestionControls: function(resp){
                var questionControls = [];

                for(i = 0; i<resp.length; i++){
                    questionControls[i] = $.extend({},{
                            id: "question_" + i,
                            question: resp[0].question,
                            fullSection: true,
                            type: "screening/question"
                        },resp[i]);
                }

                return questionControls;
            },

            getControlWithChildAnswerAllControl: function () {

                return {
                    id: "tabHeadingAndSections0",
                    tabHeading: 'Quick Answer',
                    type: 'common/tabHeadingAndSection',
                    sectionWrap: false,
                    items: [{
                        id: "answerAll",
                        type: "screening/answerAll",
                        fullSection: true
                    }]
                };
            },

            events: {
                'click .answerAll>label': 'answerAll',
                'click .answerButtons>label': 'answer'
            },

            answer: function(event){
                var $target = $(event.target),
                    $targetId= ($target).attr('id'),
                    questionCn= $target.closest(".answerButtons").attr("data-question-cn"),isAllQuesAnswered;

                var ans = $target.attr("value");

                $.each(this.listOfQuestionAnswer,function (idx,eachObj) {
                        // coming to screen first time will use questionCn
                        if(eachObj.questionCn && (eachObj.questionCn == questionCn)){
                            eachObj.questionTbl = eachObj.questionCn;
                            eachObj.answer = ans;

                            // coming to screen back later will use questionTbl
                        }else if (eachObj.questionTbl && (eachObj.questionTbl === questionCn)){
                            eachObj.answer= ans;
                        }
                    });

                isAllQuesAnswered = _.every(this.listOfQuestionAnswer, function(obj) {
                    return obj.answer;
                });

                if (isAllQuesAnswered){
                    this.trigger('dirtyChanged');
                }
                this.model.set('questionAnswersList', this.listOfQuestionAnswer);

            },

            answerAll: function(event){

                var $target = $(event.target),
                answer = ($target).data('answer');

                if(answer === 'Y') {
                    $('.questionYes').prop('checked', true);
                } else if(answer === 'N') {
                    $('.questionNo').prop('checked', true);
                }

                $.each(this.listOfQuestionAnswer,function (idx,eachObj) {
                    eachObj.questionTbl = eachObj.questionCn;
                    eachObj.answer= answer;
                })

                this.trigger('dirtyChanged');
                this.model.set('questionAnswersList', this.listOfQuestionAnswer);
            },

            modelEvents: {},

            render: function () {
                // this.model.set('uiAttributeOrder2',this.model.get('uiAttributeOrder18'));
                return PanelView.prototype.render.apply(this, arguments);
            },


            /**
             * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
             * @returns {undefined}
             */
            startListening: function () {
                PanelView.prototype.startListening.apply(this, arguments);


                this.listenTo(this, {
                    'renderComplete': function () {
                        // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                        // to occur after view is added to the page, which is why we have to use the renderComplete event
                        // instead of calling it from the render function
                        this.setControlEnabled($('.suds-save-btn', this.$el), false);
                        this.populateExistingAnswers();

                        this.rendered = true;
                    }
                });

            },

            populateExistingAnswers: function(){
                var authorization  = this.model.toJSON();

                var getTableRecordByAuthAndChildId = new GetTableRecordByAuthCnAndProp({
                    authCn :authorization.authorizationCn,
                    property : "questionAnswersList"
                });

                var self = this;

                getTableRecordByAuthAndChildId.fetch({
                    success: _.bind(function (model, resp, options) {

                        if (resp && resp.length){
                            this.trigger('dirtyChanged');
                            this.selectAnswersOnUi(resp, self);
                        }
                    }, this),
                    error: function (model, resp, options) {
                       
                    }
                });


            },

            selectAnswersOnUi: function(questionAnswersList, self){
                var priorSelectedQuestionAnswers = [];
                var questionAnswer;

                $('.answerButtons').each(function(index,eachObj) {

                    var questionCn = $(eachObj).attr('data-question-cn');

                    // typeOf questionCn is undefined for 'answerAll' button
                    if(typeof questionCn !== "undefined"){
                        questionAnswer = _.find(questionAnswersList, function(item){
                            return item.questionTbl === questionCn;
                        });




                        if (questionAnswer && questionAnswer.answer){
                            priorSelectedQuestionAnswers.push(questionAnswer);

                            var answer = questionAnswer.answer;
                            var questionYes =  $(eachObj).find('.questionYes'),
                                questionNo = $(eachObj).find('.questionNo');

                            if (answer == 'Y'){
                                questionYes.prop("checked",true);
                            }else if (answer == 'N'){
                                questionNo.prop("checked",true);
                            }
                        }

                    }

                });

                if (priorSelectedQuestionAnswers && priorSelectedQuestionAnswers.length){

                    self.listOfQuestionAnswer = priorSelectedQuestionAnswers;
                    self.model.set('questionAnswersList', priorSelectedQuestionAnswers);
                }


            }

        });
    });