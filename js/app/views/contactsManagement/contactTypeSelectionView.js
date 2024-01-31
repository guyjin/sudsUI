define(['nrm-ui/views/panelView', "jquery", "nrm-ui","app/views/contactsManagement/contactsManagementPanelView"], function(PanelView, $, Nrm,ContactsManagementPanelView) {

    return ContactsManagementPanelView.extend({

        genericTemplate: "contacts/contactType",

        getConfig: function() {
            var config = ContactsManagementPanelView.prototype.getConfig.apply(this, arguments);

            config.controls = this.getContactContentSectionControls();

            return config;

        },

        events: $.extend({}, ContactsManagementPanelView.prototype.events, ContactsManagementPanelView.prototype.changeEvents, {

        'change input[type=radio]' :function (event) {
            this.contactType = $(event.target).val();
            this.setControlEnabled($(".contactTypeSelected",this.$el),true);
        },
        'click .contactTypeSelected' :"navigateToContactForm",
        'click .contactTypeReset' :function (event) {
            this.setControlEnabled($(".contactTypeSelected",this.$el),false);
        },
        }),

        navigateToContactForm :function (event) {
            var contactFormUrl  = this.getContactFormURL();
            Nrm.app.navigateUrl(contactFormUrl, {trigger: true, replace: true});
        },

        getContactFormURL :function () {

            var url =  "#/tools/contactType/contacts";

            switch (this.contactType){
               /* case "fedgov":
                    url  = url.replace("contactType","contactType/2");
                    break;*/
                default:
                    url  = url.replace("contactType","contactType/" + this.contactType);
                    break;
            }
            return url;

        },
        getContactContentSectionControls : function () {

            var controls = [];
            var contactTypeListItems = [{
                labelClass:'person',
                value:'Person',
                text :'Person'

            },{
                labelClass:'person',
                value:'SolePropr',
                text :'Sole Proprietor'

            },{
                labelClass:'marriedCouple',
                value:'Married',
                text :'Married Couple'

            },{
                labelClass:'association',
                value:'Assocatn',
                text :'Association'

            },{
                labelClass:'partnership',
                value:'Partner',
                text :'Partnership'

            },{
                labelClass:'gov',
                value:'FedGovt',
                text :'Federal Government'

            },{
                labelClass:'gov',
                value:'Tribal',
                text :'Tribal Government'

            },{
                labelClass:'gov',
                value:'StateGvt',
                text :'State Government'

            },{
                labelClass:'gov',
                value:'LocalGvt',
                text :'Local Government'

            },{
                labelClass:'gov',
                value:'FrgnGovt',
                text :'Foreign Government'

            },{
                labelClass:'corp',
                value:'Corp',
                text :'Corporation'

            },{
                labelClass:'llc',
                value:'LLC',
                text :'Limited Liability Corporation (LLC)'

            },{
                labelClass:'trust',
                value:'Trust',
                text :'Trust'

            }]


            for (var i =0; i < contactTypeListItems.length; i++){
                controls.push($.extend({},{
                    id:'contactTypeBtn' + i,
                    type: 'contacts/contactTypeList'
                },contactTypeListItems[i]))

            }


            return controls;
        },


        /**
         * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
         * @returns {undefined}
         */
        startListening: function () {

            ContactsManagementPanelView.prototype.startListening.apply(this, arguments);

            this.listenTo(this, {
                'renderComplete': function () {
                    // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                    // to occur after view is added to the page, which is why we have to use the renderComplete event
                    // instead of calling it from the render function
                    var self = this;

                    this.rendered = true;


                    this.setControlEnabled($(".contactTypeSelected",this.$el),false);




                }
            });

        },

    });
});