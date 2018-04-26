define(['./panelView', "jquery", "nrm-ui", 'underscore','backbone'], function (PanelView, $, Nrm, _,Backbone) {

    return /*PanelView.extend*/Backbone.View.extend({

        /*getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);


            return config;
        },

        events: $.extend({},
            PanelView.prototype.events,
            PanelView.prototype.changeEvents, {
                //... other custom events go here...
                'click #newPermitBtn' : 'newPermitSelected',

            }),*/


    render : function () {/*text!*/
        var templateUrl = 'staticpages/' + this.model.get("id");
        var self = this;
        var dfd = new $.Deferred();




        $.ajax({
            type: "GET",
            url: templateUrl,
            async:true,
            error:function (event, request, options, error) {
                if (ajaxItMain.onError){
                    ajaxItMain.onError(event,request,options,error);
                }
            },
            success:  function (data) {
                // ----------------- < data >
                // clearing CDATA
                data=data.replace(/\<\!\[CDATA\[\/\/\>\<\!\-\-/gi,'');
                data=data.replace(/\/\/\-\-\>\<\!\]\]\>/gi,'');

                // extracting the the head and body tags
                var dataHead = data.match(/<\s*head.*>[\s\S]*<\s*\/head\s*>/ig).join("");
                var dataBody = data.match(/<\s*body.*>[\s\S]*<\s*\/body\s*>/ig).join("");
                var dataTitle = data.match(/<\s*title.*>[\s\S]*<\s*\/title\s*>/ig).join("");

                dataHead  = dataHead.replace(/<\s*head/gi,"<div");
                dataHead  = dataHead.replace(/<\s*\/head/gi,"</div");

                dataBody  = dataBody.replace(/<\s*body/gi,"<div");
                dataBody  = dataBody.replace(/<\s*\/body/gi,"</div");

                dataTitle = dataTitle.replace(/<\s*title/gi,"<div");
                dataTitle = dataTitle.replace(/<\s*\/title/gi,"</div");


                // comments
                var commentPattern = /\<\!\-\-([\s\S]*?)\-\-\>/ig;

                // get head comment tags
                var headComments = dataHead.match(commentPattern);

                // get body comment tags
                var bodyComments = dataBody.match(commentPattern);

                // head - body - title content
                var $dataHead    = $(dataHead);
                var $dataTitle   = $(dataTitle);
                var $dataBody    = $(dataBody);

                self.$el.html($dataBody);
            }
        });



        /*self.$el.load(templateUrl + " body")*/
        /*$.get(templateUrl + " body", function(data) {
            self.$el.replaceWith(data);
        });*/

        /*require([templateUrl],
            function(text) {
                var body= text.replace(/^.*?<body[^>]*>(.*?)<\/body>.*?$/i,"$1");
                self.$el.html(body);
            });*/

        this.listenTo(this, {
            'renderComplete': function() {
                // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                // to occur after view is added to the page, which is why we have to use the renderComplete event
                // instead of calling it from the render function
                /*$('.ui-layout-west')
                    .removeClass('ui-layout-pane-open ui-layout-pane-west-open')
                    .addClass('ui-layout-pane-closed ui-layout-pane-west-closed')*/

                this.rendered = true;
                var options = {
                    status : 'close',
                    paneName :'west'
                }
                Nrm.event.trigger('suds:toggle-navigation', options);


            }
        });



    },


});
});