define(['nrm-ui/views/panelView', "jquery",
    "nrm-ui","underscore","require",
    "app/views/contactsManagement/addNewForms/addNewPersonView"], function(PanelView, $, Nrm, _,require,AddNewPersonView) {

    return PanelView.extend({

        genericTemplate : "contacts/createPersonHalfModalForm",

        getConfig: function() {
            var config = PanelView.prototype.getConfig.apply(this, arguments);

            var addThisPersonBtn = {
                id : "addThisPersonBtn",
                btnStyle:"primary",
                type:"btn",
                className: "btn suds-primary btn-suds",
                icon:'fa fa-plus',
                label:"Add This Person",
            }

            config.controls.splice(2,1,addThisPersonBtn);

            return config;
        },

        startListening: function () {

            PanelView.prototype.startListening.apply(this, arguments);

            this.listenTo(this, {
                'renderComplete': function () {
                    // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                    // to occur after view is added to the page, which is why we have to use the renderComplete event
                    // instead of calling it from the render function
                    var self = this;

                    this.rendered = true;
                    $(".personHalfModal",this.$el).addClass("open");
                    $('.suds-select',this.$el).css({
                        'border-radius' : '0px' //this is workaround to display the select control in rectangular input
                    })

                }
            });

        },

    });
});