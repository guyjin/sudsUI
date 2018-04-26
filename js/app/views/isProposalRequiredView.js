define(['./panelView', "jquery", "nrm-ui", 'underscore','use!select2'], function (PanelView, $, Nrm, _,select2) {
    return PanelView.extend({


        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments),
                displayOrderToUiAttributes;


            config.currentStep = this.model.toJSON();
            config.flattendUiAttributesMap = []
            if (config.currentStep){

                config.question = config.currentStep.displayOrderToUiAttribute[1].attribute;
                displayOrderToUiAttributes = $.extend(true,{},config.currentStep.displayOrderToUiAttribute);
            }

            if(this.parentModel.getCurrentStepName()){

                var stepName = this.parentModel.getCurrentStepName();
                config.stepName = stepName;

                switch (stepName){
                    case "1stLevelScreening" :
                        config.title =  "Initial Screening Criteria";
                        config.question = "Answer all the screening questions either true or false."
                        break;
                    case "2ndLevelScreening" :
                        config.title =  "Second Level Screening";
                        break;

                    default :
                        break;
                }
            }

            /* Constructing the controls*/
            _.each(displayOrderToUiAttributes, _.bind(function (obj,key,item) {


                //todo : Need to remove this ...this is a temporary solution
                if(this.parentModel.getCurrentStepName()){

                    var stepName = this.parentModel.getCurrentStepName();
                    config.stepName = stepName;

                    switch (stepName){
                        case "ThreeCriteriaCheck" :
                        case "NCGUCheck" :
                            obj.userInputType = "Yes/No";
                        default :
                            break;
                    }
                }


                if (key != "1" || obj.userInputType != 'Label'){

                    if (_.isEmpty(obj.subUiAttributes)){
                        config.flattendUiAttributesMap.push($.extend(true,{},obj))
                    }

                    obj.subUiAttributes = _.values(obj.subUiAttributes);
                    _.each(obj.subUiAttributes, function (obj,key) {
                        config.flattendUiAttributesMap.push($.extend(true,{},obj))
                        obj.subUiAttributes = _.values(obj.subUiAttributes);

                    })
                    obj.tooltip = obj.attribute;
                    obj.type = "Questions/questionsWell";
                    config.controls.push(obj)



                }
            },this));

            config.flattendUiAttributesMap = _.indexBy(config.flattendUiAttributesMap, 'displayOrder');
            return config;
        },

        events: {
                'click  .answerButtons>label': 'answerSelected',
                //... other custom events go here...
            },


        answerSelected  : function(event){

            //event.preventDefault();

            var $target = $(event.target),
                displayOrder =  $target
                    .closest("div")
                    .siblings('.question').attr("data-displayorder"),
                currentStep = this.config.currentStep,
                displayOrderToUiAttribute,
                isAllQuesAnswered,
                controls = this.config.controls,
                self = this;
            $target.
            toggleClass('btn-primary')
                .siblings().removeClass('btn-primary');

            $target
                .closest("div")
                .siblings('.questionStatus')
                .attr('data-statustype', $target.text().toLowerCase());


            displayOrderToUiAttribute = this.config.flattendUiAttributesMap[displayOrder];
            displayOrderToUiAttribute.userInput =  $target.text().toLowerCase().trim() /*.charAt(0)*/;

            isAllQuesAnswered = _.every(this.config.flattendUiAttributesMap, function(obj) {
                return obj.userInput;
            });

            if (isAllQuesAnswered){
                this.trigger('dirtyChanged');
                self.displayResults(self.config.flattendUiAttributesMap);
                currentStep.displayOrderToUiAttribute = self.config.flattendUiAttributesMap;
                this.model.set(currentStep);
            }



        },

        displayResults : function (list) {
            var stepName = this.parentModel && this.parentModel.getCurrentStepName(),
                result;

            switch (stepName){

                case "ThreeCriteriaCheck" :

                    result = _.every(_.flatten(list), function(obj) {
                        return obj.userInput === "no";
                    });

                    if (result){
                        this.updateBanner(true,"Based on your selections a permit IS required")
                    }else{
                        this.updateBanner(false,"Based on your selections a permit IS NOT required");
                    };
                    break;

                case "NCGUCheck" :

                    result = _.every(_.flatten(list), function(obj) {
                        return obj.userInput === "no";
                    });

                    if (result){
                        this.updateBanner(true,"Based on your selections, this proposal does not qualify for NCGU.")
                    }else{
                        this.updateBanner(false,"Based on your selections, this proposal qualifies for NCGU.");
                    };
                    break;
                case "1stLevelScreening" :
                    result = _.every(_.flatten(list), function(obj) {
                        return obj.userInput === "true";
                    });

                    if (result){
                        this.updateBanner(true,"Based on your answers to these screening questions, this proposal meets the minimum requirements.")
                    }else{
                        this.updateBanner(false,"Based on your answers to these screening questions, this proposal does not meet the minimum requirements.");
                    };
                    break;

                case "2ndLevelScreening" :

                    result = _.every(_.flatten(list), function(obj) {
                        return obj.userInput === "false";
                    });

                    if (result){
                        this.updateBanner(true,"Based on your answers to these screening questions, this proposal meets the minimum requirements.")
                    }else{
                        this.updateBanner(false,"Based on your answers to these screening questions, this proposal does not meet the minimum requirements.");
                    };
                    break;
                default :
                    break;
            }
        },

        updateBanner : function (required,text) {
            var self = this;

            $(".ncguResults",self.$el).fadeIn(function () {

                if(required){
                    $(".alert",self.$el).removeClass("alert-danger");
                    $(".alert",self.$el).addClass("alert-info")
                }else{
                    $(".alert",self.$el).removeClass("alert-info");
                    $(".alert",self.$el).addClass("alert-danger");
                }

                $(".alertText",self.$el).html(text);
            });
        },
        render : function () {
            PanelView.prototype.render.apply(this, arguments);

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
                    $(".ncguResults",this.$el).hide();

                    //Todo : temporary testing...need to put it in the right place
                var renderView = $('#renderView');
                    renderView.scroll(function () {

                        if ($(this).scrollTop() > 52) {
                            var t = $(this).offset().top + 16;
                            $('.screenNav').addClass('fixed').css({
                                top: t + 'px'
                            });
                        } else {
                            $('.screenNav').removeClass('fixed').css({
                                top: 'auto'
                            });
                        }

                        if ($(this).scrollTop() > 52) {
                            var t = $(this).offset().top + 16;
                            $('.stepControls').addClass('fixed').css({
                                top: t + 'px'
                            });

                            $('.screenSections').css({
                                top: '60px'
                            })
                        } else {
                            $('.stepControls').removeClass('fixed').removeAttr('style');

                            $('.screenSections').removeAttr('style');
                        }
                    })

                }
            });

        },

    });
});