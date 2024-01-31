define(['nrm-ui/views/panelView', "jquery", "nrm-ui"], function(PanelView, $, Nrm) {

    return PanelView.extend({

        events: $.extend({}, PanelView.prototype.events, PanelView.prototype.changeEvents, {
            'click .searchBtn' : "loadSearchResults",
            'click .addNewContactBtn' : "loadContactTypeScreen"

        }),



        loadSearchResults : function (event) {
            var searchText = $(event.target).text();

            console.log(searchText)

            $(".contactSearchResults", this.$el).addClass('open');
        },

        loadContactTypeScreen : function () {


            var control = {
                    id: 'addContactTypeScreen',
                    prop: 'some-props',
                    config: {
                        /* the control config is defined under individual views*/
                        controls: [],
                    },

                    view: 'app/views/myTestContactTypeView'
                }



            $.when(PanelView.prototype.renderPanel.call(this, control, $(".nrm-edit-form"))).done(_.bind(function(view) {


            }, this));
        },


        genericTemplate: "contacts/contactSearchForm",

        getConfig: function() {


            return {

                controls: [{
                    id :'testing',
                    type:'inputText'
                }

                ]
            };

        }

    });
});