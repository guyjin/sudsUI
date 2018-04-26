define(['nrm-ui/views/panelView', "jquery",
    "nrm-ui","underscore","require","app/views/contactsManagement/contactTypeFormPanelView"], function(PanelView, $, Nrm, _,require,ContactTypeFormPanelView) {

    return ContactTypeFormPanelView.extend({


        getConfig: function() {
            var config = ContactTypeFormPanelView.prototype.getConfig.apply(this, arguments);


            this.updateConfigControls(config);

            return config;

        },

        modelEvents: $.extend({}, ContactTypeFormPanelView.prototype.modelEvents, {

        }),

        events: $.extend({}, ContactTypeFormPanelView.prototype.events, ContactTypeFormPanelView.prototype.changeEvents, {

        }),

        updateConfigControls : function (config) {

            var trustNameControls = this.getFieldSetControl("trustName","trustName", this.getBusinessNameFieldsetControls());
            var trusteeNameControls = this.getFieldSetControl("trusteeName","trusteeName", this.getTrusteeNameFieldsetControls());


            config.controls.splice(0,0,trustNameControls);
            config.controls.splice(1,0,trusteeNameControls);
        },

        getBusinessNameFieldsetControls :function () {


            var businessNameControls = [{
                id :'businessNameContainer',
                type :'contacts/inputContainer',
                containerClass:'',
                controls :[{
                    id:'trustName',
                    type:'inputText',
                    nameAttr:'trustName',
                    label: "Trust Name",
                    placeholder:'Trust Name',
                    prop:'trustName',
                    className:'suds-input',
                    //hidden:true
                }]
            }, {
                id :'sosContainer',
                type :'contacts/inputContainer',
                containerClass:'horz sos',
                //group:true,
                //groupContainerClasses : 'form-group horz',
                controls :[{
                    id:'sos',
                    type:"contacts/sosContainer",
                    nameAttr:'sos',
                    label: "Secretary of State Verified",
                    //placeholder:'Business Name',
                    //prop:'sos',
                    //className:'suds-input',
                    //hidden:true
                }]
            }]
            var controls = [{
                id:'addressesContainer',
                type: 'common/divCtrlIterator',
                controls : [{
                    id:'addressForm1GroupContainer',
                    type: 'common/divCtrlIterator',
                    controls : businessNameControls,
                    containerClass:'form-group '
                }],
                containerClass:'form-inline'
            }]

            return controls;
        },

        getTrusteeNameFieldsetControls :function () {


            var businessNameControls = [{
                id :'trusteeNameContainer',
                type :'contacts/inputContainer',
                containerClass:'vert fullWidth notReq',
                controls :[{
                    id:'trusteeName',
                    type:'inputText',
                    nameAttr:'trusteeName',
                    label: "Trustee Name",
                    placeholder:'Trustee Name',
                    prop:'trusteeName',
                    className:'suds-input',
                    //hidden:true
                }]
            }]
            var controls = [{
                id:'addressesContainer',
                type: 'common/divCtrlIterator',
                controls : [{
                    id:'addressForm1GroupContainer',
                    type: 'common/divCtrlIterator',
                    controls : businessNameControls,
                    containerClass:'form-group '
                }],
                containerClass:'form-inline'
            }]

            return controls;
        },


        getFieldSetControl : function () {

            return ContactTypeFormPanelView.prototype.getFieldSetControl.apply(this, arguments);
        },

        startListening: function () {

            ContactTypeFormPanelView.prototype.startListening.apply(this, arguments);

            this.listenTo(this, {
                'renderComplete': function () {
                    // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                    // to occur after view is added to the page, which is why we have to use the renderComplete event
                    // instead of calling it from the render function
                    var self = this;

                    this.rendered = true;

                    $(".billingGroupContainer",this.$el).show();


                }
            });

        },

    });
});