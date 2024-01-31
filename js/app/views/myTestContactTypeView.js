define(['./panelView', "jquery", "nrm-ui"], function(PanelView, $, Nrm) {

    return PanelView.extend({

        events: $.extend({}, PanelView.prototype.events, PanelView.prototype.changeEvents, {
            'click .searchBtn' : "loadSearchResults"

        }),

        loadSearchResults : function (event) {
            var searchText = $(event.target).text();

            console.log(searchText)

            $(".contactSearchResults", this.$el).addClass('open');
        },

        genericTemplate: "contacts/contactType",

        getConfig: function() {


            return {

                controls: [{
                    id :'testing',
                    type:'inputText'
                }

                ]
            };

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

                }
            });

        },


    });
});