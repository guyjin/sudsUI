define(['nrm-ui/views/panelView', "jquery",
    "nrm-ui","underscore","require","app/views/contactsManagement/contactTypeFormPanelView"], function(PanelView, $, Nrm, _,require,ContactTypeFormPanelView) {

    return ContactTypeFormPanelView.extend({


        getConfig: function() {
            var config = ContactTypeFormPanelView.prototype.getConfig.apply(this, arguments);

            config.controls.splice(1,0,this.getFieldSetControl("businessName","businessName", this.getBusinessNameFieldsetControls()))

            return config;

        },

        modelEvents: $.extend({}, ContactTypeFormPanelView.prototype.modelEvents, {
            'change' : "modelChange"
        }),

        events: $.extend({}, ContactTypeFormPanelView.prototype.events, ContactTypeFormPanelView.prototype.changeEvents, {

        }),


        getBusinessNameFieldsetControls :function () {


            var businessNameControls = [{
                id :'businessNameContainer',
                type :'contacts/inputContainer',
                containerClass:'',
                controls :[{
                    id:'businessName',
                    type:'inputText',
                    nameAttr:'businessName',
                    label: "Business Name",
                    placeholder:'Business Name',
                    prop:'businessName',
                    className:'suds-input',
                    //hidden:true
                }]
            }, {
                id :'sosContainer',
                type :'contacts/inputContainer',
                containerClass:'horz sos',
                //group:true,
                //groupContainerClasses : 'form-group horz',
                /*controls :[{
                    id:'sos',
                    type:'checkbox',
                    nameAttr:'sos',
                    label: "Secretary of State Verified",
                    //placeholder:'Business Name',
                    prop:'sos',
                    className:'suds-input',
                    //hidden:true
                },{
                    id:'verificationTool',
                    type:'btn',
                    href:'javascript:void(0)',
                    btnStyle:'primary',
                    nameAttr:'verificationTool',
                    label: "Go to Verification Tool",
                    prop:'businessName',
                    icon :'fa fa-link',
                    className:'suds-input',
                    //hidden:true
                }]*/
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