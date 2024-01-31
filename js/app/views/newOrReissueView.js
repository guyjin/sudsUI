define(['./panelView', "jquery", "nrm-ui", 'underscore','use!select2'], function (PanelView, $, Nrm, _,select2) {

    return PanelView.extend({

        genericTemplate: 'newOrReissue',

        getConfig: function () {


            var config = PanelView.prototype.getConfig.apply(this, arguments);

            config.currentStep = this.model.toJSON();

            if (config.currentStep){

                config.question = config.currentStep.displayOrderToUiAttribute[1].attribute;
            }

            config.controls = [
                {
                    id: 'newPermitBtn',
                    type: 'btn',
                    prop: 'newPermitBtn',
                    btnStyle: "success",
                    icon: "glyphicon glyphicon-heart",
                    className: "btn-lg  controlBtn newPermitBtn suds-outer-edit-control",
                    label: 'New',
                },{
                    id: 'reIssuePermitbtn',
                    type: 'btn',
                    prop: 'reIssuePermitbtn',
                    btnStyle: "default",
                    icon: "glyphicon glyphicon-repeat",
                    className: "btn btn-default btn-lg controlBtn testingEventHandler suds-outer-edit-control"  ,
                    label: 'Reissue' ,
                }

            ]


            return config;
        },

        events: {
                //... other custom events go here...
                'click #newPermitBtn' : 'newPermitSelected'
            },


        render : function () {

            return PanelView.prototype.render.apply(this, arguments);
        },

        newPermitSelected : function(event){


            event.preventDefault();

            this.config.currentStep.displayOrderToUiAttribute[1].userInput = "yes";

            this.model.set(this.config.currentStep);

            this.trigger('save');


        }


    });
});