define(['./panelView', "jquery", "nrm-ui", 'underscore','use!select2'], function (PanelView, $, Nrm, _,select2) {
    return PanelView.extend({

        genericTemplate: 'ncguCheck',

        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);



            return config;
        },

        events: {
                'click  .answerButtons>label': 'answerSelected'
                //... other custom events go here...
            },


        answerSelected  : function(event){

            event.preventDefault();

            var $target = $(event.target),
                question =  $target
                    .closest("div")
                    .siblings('.question').attr("title"),
                currentStep = this.model.get('currentStep');
            $target.
            toggleClass('btn-primary')
                .siblings().removeClass('btn-primary');

            $target
                .closest("div")
                .siblings('.questionStatus')
                .attr('data-statustype', $(event.target).text().toLowerCase());



            _.each(this.config.controls, function(item, idx) {

                if (item.question.trim() === question.trim()){
                    item.answer =  $(event.target).text().toLowerCase().charAt(0);

                    if (item.answer == "n"){
                        $(".ncguResults").fadeIn(function () {
                            $(".alertText").html("Based on your selections, this proposal qualifies for NCGU.")
                        });
                    }else{
                        $(".ncguResults").fadeIn(function () {
                            $(".alertText").html("Based on your selections, this proposal DO NOT qualify for NCGU.")
                        });
                    }
                }
            });

            currentStep.listOfQuestionAndAnswerDTO = this.config.controls


            this.model.set("currentStep",currentStep);

        },

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
                    // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                    // to occur after view is added to the page, which is why we have to use the renderComplete event
                    // instead of calling it from the render function

                    this.rendered = true;
                    $(".ncguResults").hide();

                }
            });

        },




    });
});