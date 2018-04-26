define(['nrm-ui/views/panelView', "jquery", "nrm-ui"], function(PanelView, $, Nrm) {

    return PanelView.extend({

        genericTemplate: "contacts/contactForm",

        getConfig: function() {
            var config = PanelView.prototype.getConfig.apply(this, arguments) || {};

            this.phoneNumbers = [];
            this.contactAddress = [];

            var formType = config.screenId;

            var dfd = new $.Deferred();
            var self = this;
            config.orgModel  = this.model.getInitialOrgByContactType({id: formType});

            config.orgModel.fetch({
                success:function (model) {
                    config.orgModel = model;
                    self.orgModel = model;
                    config.controls = self.getContactContentSectionControls(formType);
                    dfd.resolve(config);
                },error :function (model) {

                }
            });

            return dfd.promise();
        },

        getConfig: function() {
            var config = ContactFormView.prototype.getConfig.apply(this, arguments);
            this.phoneNumbers = [];
            this.contactAddress = [];

            var formType = config.screenId;

            var dfd = new $.Deferred();
            var self = this;
            config.orgModel  = this.model.getInitialOrgByContactType({id: formType});

            config.orgModel.fetch({
                success:function (model) {
                    config.orgModel = model;
                    self.orgModel = model;
                    config.controls = self.getContactContentSectionControls(formType);
                    dfd.resolve(config);
                },error :function (model) {

                }
            });




            return dfd.promise();

        },

        modelEvents: $.extend({}, ContactFormView.prototype.modelEvents, {
            'change' : "modelChange",
            "change:addresses" : "addressAttrsChanged",
            "change:telephone" : "telephoneAttrsChanged",
            "change:person" :"personAttrsChanged"
        }),

        events: $.extend({}, ContactFormView.prototype.events, ContactFormView.prototype.changeEvents, {
            'click .addOrUpdatePhoneNumBtn' : "addPhoneOrUpdatePhoneNumbers",
            'click .removePhoneNumber' : "removePhoneNumber",
            'click .editPhoneNumber' : "editPhoneNumber",
            'click .addOrUpdateAddressBtn' : "addOrUpdateAddress",
            'click .editAddressBtn' : "editAddress",
            'click .removeAddressBtn' : "removeAddress",
            'click .saveContactBtn' : "onSave"

        }),


        countrySelected :function (countryCn) {

            var self = this;
            var control = {
                id:'state',
                type:'select',
                nameAttr:'state',
                label: 'State/Region',
                /*lov: "lov/countryRegions",*/
                placeholder:'Select State/Region',
                prop:'state',
                nested:'addresses',
                className:'suds-select stateTypeSelect addressAttrs'
            };

            $.when(Nrm.app.getContext({
                apiKey: "lov/countryRegions"
            }, this)).done(function(context) {
                $.when(Nrm.app.getCollection(context, null, this)).done(function (collection) {
                    var countryRegionFilteredByCountry;

                    if (collection && collection.size() > 0){

                        countryRegionFilteredByCountry = collection.filter(function (model) {
                            return model.get("country") === countryCn;
                        })
                    }
                    var context = {
                        apiKey : 'country/countryRegion',
                        idAttr: 'countryRegionCn',
                        nameAttr: 'name',
                        collection: (countryRegionFilteredByCountry ? countryRegionFilteredByCountry : [])
                    }


                    self.initLov(control, context, function(){

                    }, function(data, response) {
                        control.error = true;
                        self.onLovError(context, data, response);

                    });
                });
            });

        },

        personAttrsChanged : function (model) {

        },

        addressAttrsChanged : function (model) {

            var addresses =  model && model.get("addresses");
            var requiredAddressProps = ["addressLine1","city","country","postalCode","state"];
            var inBoth;
            var changed = model.changedAttributes();
            this.countrySelected(changed.addresses.country);

            if(changed.addresses.state){

                var stateLabel = $("#state  option:selected").text();
                $.extend(changed.addresses,{

                    "countryRegion": {
                        "countryRegionCn": addresses.state,
                        "name": stateLabel
                    }
                });

                this.model.set(addresses);
            }

            if (addresses && addresses["addressType"]=== "Other"){
                this.setControlHidden($(".otherAddressType",this.$el),false)
            }else{
                this.setControlHidden($(".otherAddressType",this.$el),true)
            }


            if (addresses && addresses["addressType"] === "Billing"){
                this.setControlHidden($(".billingGroupContainer",this.$el),false)
            }else{
                this.setControlHidden($(".billingGroupContainer",this.$el),true)
            }

            if (model && model.get("addresses")){
                inBoth = _.intersection(_.keys(model.get("addresses")), requiredAddressProps);

                if (inBoth.length === requiredAddressProps.length) {
                    this.setControlEnabled($(".addOrUpdateAddressBtn",this.$el),true);
                }else{
                    this.setControlEnabled($(".addOrUpdateAddressBtn",this.$el),false);
                }
            }

        },

        telephoneAttrsChanged :  function (model) {

            var telephone =  model && model.get("telephone");
            var requiredPhoneProps = ["intlCode","phoneNumber","orgRolePhoneNbrTypeCn"];
            var inBoth;

            var changed = model.changedAttributes();

            if (changed.telephone.orgRolePhoneNbrTypeCn){
                var phoneTypeLabel = $("#phoneNumberType  option:selected").text();
                $.extend(changed.telephone,{

                    orgRolePhoneNbrType : {

                        orgRolePhoneNbrTypeCn : telephone.orgRolePhoneNbrTypeCn,
                        name : phoneTypeLabel
                    }

                });

                this.model.set(telephone);
            }

            if (model && model.get("telephone")){
                inBoth = _.intersection(_.keys(model.get("telephone")), requiredPhoneProps);

                if (inBoth.length === requiredPhoneProps.length) {
                    this.setControlEnabled($(".addOrUpdatePhoneNumBtn",this.$el),true);
                }else{
                    this.setControlEnabled($(".addOrUpdatePhoneNumBtn",this.$el),false);
                }
            }



        },

        modelChange :function (model) {

        },

        addPhoneOrUpdatePhoneNumbers : function () {

            var phoneNumber  = this.model.get('telephone');

            if (this.currentEditPhoneNumIndex){
                this.phoneNumbers.splice(this.currentEditPhoneNumIndex,1,phoneNumber);
                this.currentEditPhoneNumIndex = null;
            }else{
                this.phoneNumbers.push(phoneNumber)
            }

            this.setTelePhoneModel({});
            this.resetModelBindings("telephone")
            this.populatePhoneNumbers();
        },

        removePhoneNumber : function (event) {
            var $target = $(event.target)
            var index = $target.attr("id") || $target.parent().closest('button').attr("id")

            if (index){
                this.phoneNumbers.splice(index,1);
                this.populatePhoneNumbers();
                this.setTelePhoneModel(this.model.get("telephone"));
            }

        },

        editPhoneNumber : function (event) {
            var $target = $(event.target)
            var index = $target.attr("id") || $target.parent().closest('button').attr("id")
            this.currentEditPhoneNumIndex = index;

            if (this.currentEditPhoneNumIndex){
                $(".addOrUpdatePhoneNumBtn",this.$el).text("Update Phone Number");
                this.setTelePhoneModel(this.phoneNumbers[this.currentEditPhoneNumIndex]);
                this.resetModelBindings("telephone");
            }

        },

        setTelePhoneModel : function (obj) {

            this.model.set("telephone",obj);
        },


        addOrUpdateAddress : function () {

            var addresses = this.model.get("addresses");

            if (this.currentEditAddressIndex){
                this.contactAddress.splice(this.currentEditAddressIndex,1,addresses);
                this.currentEditAddressIndex = null;
            }else{
                this.contactAddress.push(addresses);
            }

            this.setAddressModel({});

            this.resetModelBindings("addresses");
            this.populateAddress();
        },

        removeAddress : function (event) {
            var $target = $(event.target)
            var index = $target.attr("id") || $target.parent().closest('button').attr("id")
            this.contactAddress.splice(index,1);
            this.populateAddress();
        },


        editAddress : function (event) {
            var $target = $(event.target)
            var index = $target.attr("id") || $target.parent().closest('button').attr("id")
            this.currentEditAddressIndex = index;
            if (this.contactAddress[index]){
                $(".addOrUpdateAddressBtn",this.$el).text("Update Address");
                this.setAddressModel(this.contactAddress[index]);
                this.resetModelBindings("addresses"/*$('.addressAttrs',this.$el)*/);
            }

        },

        setAddressModel : function (obj) {

            this.model.set("addresses",$.extend(obj,{
                "contactAddressList" : this.contactAddress
            }));
        },


        resetModelBindings : function (nested) {

            var selector  = $('[data-nrmprop="' + nested + '"] [data-nrmprop]', this.$el);
            var model  = this.model.get(nested)

            _.each(selector, function(el) {
                var eachSelector =  $(el);
                this.resetBindings(eachSelector);
                /*
                 * Todo: temporary work around for the issue where model binding is not working for nested attributes*/
                var prop = eachSelector.attr("data-nrmprop");
                if (prop){
                    eachSelector.val(model[prop])
                }

            },this);

            /* this.resetBindings(selector);*/
        },


        populatePhoneNumbers :function () {
            var html = ContactFormAddedNumPill(this)
            $('.phoneNumbers', this.$el).html(html)
        },

        populateAddress :function () {
            var html = ContactFormAddressPill(this)
            $('.addresses', this.$el).html(html)
        },

        navigateToContactForm :function (event) {
            //var contactFormUrl  = this.getContactFormURL();
            //Nrm.app.navigateUrl(contactFormUrl, {trigger: true, replace: true});
        },

        getContactContentSectionControls : function (formType) {
            var controls = [];

            var noOfControls = getNoOfControls(formType);

            controls [0] = this.getFieldSetControl("personalInfo","fs-horizontal",this.personalInfoPanelControls());
            controls [1] = this.getFieldSetControl("phone","phone",this.phoneInfoPanelControls());
            controls [2] = this.getFieldSetControl("address","address",this.addressInfoPanelControls());
            controls [3] = this.getFieldSetControl("comments","comments",this.commentsControls());
            controls [4] = this.formControls();//save and reset Controls

            return controls;
        },

        getNoOfControls: function(formType){
            var num;

            switch (formType){
                case 'Person':
                    num = 5;
                    break;
                case 'SolePropr':
                    num = 6;
                    break;
            }

            return num;
        },


        personalInfoPanelControls : function () {

            var prefix = [{
                text:'Ms',
                value:"Ms",
            },{
                text:'Mrs',
                value:"Mrs",
            },{
                text:'Mr',
                value:"Mr",
            },{
                text:'Dr',
                value:"Dr",
            }]

            var suffix = [{
                text:'Phd',
                value:"Phd",
            },{
                text:'Jr',
                value:"Jr",
            },{
                text:'Esq',
                value:"Esq",
            }]

            var personalInfoControls = [{
                id :'firstNameContainer',
                type :'contacts/inputContainer',
                containerClass:'vert',
                controls :[{
                    id:'firstName',
                    type:'inputText',
                    nameAttr:'firstName',
                    label: 'First Name',
                    placeholder:'first name',
                    prop:'givenName',
                    nested:"person",
                    className:'suds-input form-control personAttrs'
                }]
            }, {
                id :'miContainer',
                type :'contacts/inputContainer',
                containerClass:'vert notReq',
                controls :[{
                    id:'mi',
                    type:'inputText',
                    nameAttr:'mi',
                    label: 'M.I',
                    placeholder:'M.I',
                    prop:'middleName',
                    nested :'person',
                    className:'suds-input form-control personAttrs',
                    maxlength:'1',
                }]
            },{
                id :'lastNameContainer',
                type :'contacts/inputContainer',
                containerClass:'vert',
                controls :[{
                    id:'lastName',
                    type:'inputText',
                    nameAttr:'lastName',
                    label: 'Last Name',
                    placeholder:'last name',
                    prop:'surname',
                    nested:"person",
                    className:'suds-input form-control personAttrs'
                }]
            },{
                id :'prefixContainer',
                type :'contacts/inputContainer',
                containerClass:'vert',
                controls :[{
                    id:'prefixName',
                    type:'select',
                    nameAttr:'prefix',
                    label: 'Prefix',
                    options:prefix,
                    placeholder:'Select Prefix',
                    prop:'suffix',
                    nested :"person",
                    className:'suds-select personAttrs'
                }]
            },{
                id :'suffixContainer',
                type :'contacts/inputContainer',
                containerClass:'vert notReq',
                controls :[{
                    id:'suffix',
                    type:'select',
                    nameAttr:'suffix',
                    label: 'Suffix',
                    options:suffix,
                    placeholder:'Select Suffix',
                    prop:'suffix',
                    nested :"person",
                    className:'suds-select personAttrs'
                }]
            },{
                id :'emailContainer',
                type :'contacts/inputContainer',
                containerClass:'vert',
                controls :[{
                    id:'email',
                    type:'inputText',
                    nameAttr:'email',
                    label: 'Email',
                    placeholder:'email',
                    prop:'email',
                    className:'suds-input form-control'
                }]
            },{
                id :'searchInputContainer',
                type :'contacts/inputContainer',
                containerClass:'vert fullWidth notReq',
                controls :[{
                    id:'url',
                    type:'inputText',
                    nameAttr:'url',
                    label: 'URL',
                    placeholder:'http://www.url.net',
                    prop:'personalUrl',
                    nested:"person",
                    className:'suds-input form-control personAttrs'
                }]
            }]

            return personalInfoControls;
        },

        phoneInfoPanelControls : function () {

            var personalInfoControls = [{
                id :'phoneTypeContainer',
                type :'contacts/inputContainer',
                containerClass:'vert',
                //group:true,
                //groupContainerClasses : 'form-group horz',
                controls :[{
                    id:'phoneNumberType',
                    type:'select',
                    nameAttr:'phoneNumberType',
                    label: 'Type',
                    "lov" :"lov/orgRolePhoneNumberTypes",
                    placeholder:'Select Type',
                    prop:'orgRolePhoneNbrTypeCn',
                    className:'suds-select phoneTypeSelect telephoneAttrs',
                    /*nested:'orgRolePhoneNbrType'*/
                }]
            }, {
                id :'intlCodeContainer',
                type :'contacts/inputContainer',
                containerClass:'vert notReq',
                controls :[{
                    id:'intlCode',
                    type:'inputText',
                    nameAttr:'intlCode',
                    label: "Int'l Code",
                    placeholder:'011',
                    maxlengt:"3",
                    size:"3",
                    prop:'intlCode',
                    className:'suds-input form-control telephoneAttrs',
                }]
            },/*{
             id :'areaCodeContainer',
             type :'contacts/inputContainer',
             containerClass:'vert',
             controls :[{
             id:'areaCode',
             type:'inputText',
             nameAttr:'areaCode',
             label: 'Area Code',
             placeholder:'303',
             prop:'areaCode',
             maxlength:"3",
             size:"3",
             //nested:'telephone',
             className:'suds-input form-control telephoneAttrs'
             }]
             },*/{
                id :'phoneNumberContainer',
                type :'contacts/inputContainer',
                containerClass:'vert',
                controls :[{
                    id:'phoneNumber',
                    type:'inputText',
                    nameAttr:'phoneNumber',
                    label: 'Phone Number',
                    placeholder:'555-555-5555',
                    prop:'phoneNumber',
                    'removeFormGroup': true,
                    //nested:'telephone',
                    //maxlength:"3",
                    className:'suds-input form-control telephoneAttrs'
                }]
            },{
                id :'extContainer',
                type :'contacts/inputContainer',
                containerClass:'vert notReq',
                controls :[{
                    id:'extension',
                    type:'inputText',
                    nameAttr:'extension',
                    label: 'Extension',
                    placeholder:'55555',
                    prop:'extension',
                    maxlength:"6",
                    size:"6",
                    //nested:'telephone',
                    className:'suds-input form-control telephoneAttrs'
                }]
            },{
                id :'addOrUpdateBtnContainer',
                type :'contacts/inputContainer',
                containerClass:'notReq',
                controls :[{
                    id:'addOrUpdatePhoneNumBtn',
                    type:'btn',
                    nameAttr:'addOrUpdatePhoneNumBtn',
                    label: 'Add Phone Number',
                    //placeholder:'email',
                    //prop:'email',
                    btnStyle:'primary',
                    className:'suds-primary btn-sm addOrUpdatePhoneNumBtn'
                }]
            }];


            var controls = [{
                id:'phonenumbersContainer',
                type: 'common/divCtrlIterator',
                controls : [],
                containerClass:'phoneNumbers'
            },{
                id:'phoneDivGroupContainer',
                type: 'common/divCtrlIterator',
                controls : personalInfoControls,
                prop:'telephone',
                containerClass:'form-group horz phoneGroupContainer',
                dataType: "object"
            }]

            return controls;
        },

        addressInfoPanelControls : function () {

            var orgModel = this.orgModel && this.orgModel.toJSON();

            var addressTypes  =_.map(orgModel.nonOrgLevelOrgTypeCodes, function(item) {
                return {
                    text : item,
                    value :item
                }
            });

            if (addressTypes && addressTypes.length == 1){
                this.model.set("addresses",{
                    "addressType" :  addressTypes[0].value
                })
            }
            var formGroup1Controls = [{
                id :'addressTypeContainer',
                type :'contacts/inputContainer',
                containerClass:'vert',
                //group:true,
                //groupContainerClasses : 'form-group horz',
                controls :[{
                    id:'addressType',
                    type:'select',
                    nameAttr:'addressType',
                    label: 'Address Type',
                    options:addressTypes,
                    placeholder:'Select Address Type',
                    prop:'addressType',
                    className:'suds-select addressTypeSelect addressAttrs',
                    nested:'addresses',
                    disabled : (addressTypes.length == 1)

                }]
            }, {
                id :'otherAddressTypeContainer',
                type :'contacts/inputContainer',
                containerClass:'notReq',
                controls :[{
                    id:'otherAddressType',
                    type:'inputText',
                    nameAttr:'otherAddressType',
                    label: "Other Address Type",
                    placeholder:'Other Address Type',
                    prop:'otherAddressType',
                    className:'suds-input otherAddressType addressAttrs',
                    nested:'addresses',
                    hidden:true
                }]
            },{
                id :'deptContainer',
                type :'contacts/inputContainer',
                containerClass:'notReq',
                controls :[{
                    id:'dept',
                    type:'inputText',
                    nameAttr:'dept',
                    label: 'Department Name',
                    placeholder:'Department Name',
                    prop:'dept',
                    nested:'addresses',
                    className:'suds-input addressAttrs'
                }]
            }];

            var formGroup2Controls = [{
                id :'billingContactFirstNameContainer',
                type :'contacts/inputContainer',
                containerClass:'notReq',
                controls :[{
                    id:'billingContactFirstName',
                    type:'inputText',
                    nameAttr:'billingContactFirstName',
                    label: "Billing Contact First Name",
                    placeholder:'Billing Contact First Name',
                    prop:'givenName',
                    className:'suds-input addressAttrs',
                    nested:'addresses',
                    //hidden:true
                }]
            }, {
                id :'billingContactLastNameContainer',
                type :'contacts/inputContainer',
                containerClass:'notReq',
                controls :[{
                    id:'billingContactLastName',
                    type:'inputText',
                    nameAttr:'billingContactLastName',
                    label: "Billing Contact Last Name",
                    placeholder:'Billing Contact Last Name',
                    prop:'surname',
                    className:'suds-input addressAttrs',
                    nested:'addresses',
                    //hidden:true
                }]
            }];


            var formGroup3Controls = [{
                id :'countriesContainer',
                type :'contacts/inputContainer',
                containerClass:'',
                //group:true,
                //groupContainerClasses : 'form-group horz',
                controls :[{
                    id:'country',
                    type:'select',
                    nameAttr:'country',
                    label: 'Country',
                    lov : 'lov/countries',
                    placeholder:'Select Country',
                    prop:'country',
                    nested:'addresses',
                    className:'suds-select countriesTypeSelect addressAttrs'
                }]
            }, {
                id :'postalCodeContainer',
                type :'contacts/inputContainer',
                containerClass:'postalCode',
                controls :[{
                    id:'postalCode',
                    type:'inputText',
                    nameAttr:'postalCode',
                    label: "Postal Code",
                    placeholder:'enter postal code',
                    prop:'postalCode',
                    nested:'addresses',
                    className:'suds-input addressAttrs',
                    //hidden:true
                }]
            }];


            var address1AndAddress2GroupControls = [{
                id :'address1Container',
                type :'contacts/inputContainer',
                containerClass:'',
                controls :[{
                    id:'address1',
                    type:'inputText',
                    nameAttr:'address1',
                    label: "Address 1",
                    placeholder:'address1',
                    prop:'addressLine1',
                    nested:'addresses',
                    className:'suds-input addressAttrs',
                    //hidden:true
                }]
            }, {
                id :'address2Container',
                type :'contacts/inputContainer',
                containerClass:'notReq',
                controls :[{
                    id:'address2',
                    type:'inputText',
                    nameAttr:'address2',
                    label: "Address 2",
                    placeholder:'address2',
                    prop:'addressLine2',
                    nested:'addresses',
                    className:'suds-input addressAttrs',
                    //hidden:true
                }]
            }];

            var cityAndStateGroupControls = [{
                id :'cityContainer',
                type :'contacts/inputContainer',
                containerClass:'',
                controls :[{
                    id:'city',
                    type:'inputText',
                    nameAttr:'city',
                    label: "City",
                    placeholder:'city',
                    prop:'city',
                    nested:'addresses',
                    className:'suds-input addressAttrs',
                    //hidden:true
                }]
            }, {
                id :'statesContainer',
                type :'contacts/inputContainer',
                containerClass:'',
                //group:true,
                //groupContainerClasses : 'form-group horz',
                controls :[{
                    id:'state',
                    type:'select',
                    nameAttr:'state',
                    label: 'State/Region',
                    //lov: "lov/countryRegions",
                    options :[],
                    placeholder:'Select State/Region',
                    prop:'state',
                    nested:'addresses',
                    className:'suds-select stateTypeSelect addressAttrs'
                }]
            }];


            var addAddressBtnGroup = [{
                id :'addAddressBtnContainer',
                type :'contacts/inputContainer',
                containerClass:'formControls notReq',
                controls :[{
                    id:'addAddressBtn',
                    type:'btn',
                    nameAttr:'addAddressBtn',
                    label: 'Add Address',
                    btnStyle:'primary',
                    className:'suds-primary btn-sm addOrUpdateAddressBtn'
                }]
            }]


            var controls = [{
                id:'addressesContainer',
                type: 'common/divCtrlIterator',
                controls : [],
                containerClass:'addresses',
                //prop:'addresses',
            },{
                id:'addressForm1GroupContainer',
                type: 'common/divCtrlIterator',
                controls : formGroup1Controls,
                containerClass:'form-group',
                //prop:'addresses',
            },{
                id:'billingGroupContainer',
                type: 'common/divCtrlIterator',
                controls : formGroup2Controls,
                containerClass:'form-group billingGroupContainer',
                //prop:'addresses',
            },{
                id:'addressForm3GroupContainer',
                type: 'common/divCtrlIterator',
                controls : formGroup3Controls,
                containerClass:'form-group',
                //prop:'addresses',
            },{
                id:'addressForm3GroupContainer',
                type: 'common/divCtrlIterator',
                controls : address1AndAddress2GroupControls,
                containerClass:'form-group',
                //prop:'addresses',
            },{
                id:'cityAndStateGroupContainer',
                type: 'common/divCtrlIterator',
                controls : cityAndStateGroupControls,
                containerClass:'form-group'
            },{
                id:'addOrUpdateBtnGroup',
                type: 'common/divCtrlIterator',
                controls : addAddressBtnGroup,
                containerClass:'form-group'
            }]

            return controls;
        },

        commentsControls : function () {

            var controls = [{
                id:'commentsGroupContainer',
                type: 'common/divCtrlIterator',
                controls : [{
                    id :'commentsCotainer',
                    type :'contacts/inputContainer',
                    containerClass:'vert fullWidth notReq',
                    controls :[{
                        id:'comments',
                        type:'textArea',
                        nameAttr:'comments',
                        label: 'Comments',
                        placeholder:'Comments',
                        prop:'comments',
                        rows:"12",
                        className:'suds-text-area form-control'
                    }]
                }],
                containerClass:'form-group horz'
            }]

            return controls;
        },


        formControls : function () {

            var formControls =[{
                id:'saveContactFormBtn',
                type:'btn',
                nameAttr:'saveContactFormBtn',
                label: 'Save Contact',
                btnStyle:'primary',
                icon:'fa fa-floppy-o',
                className:'suds-primary btn-sm saveContactBtn',
                //disabled: true
            },{
                id:'resetContactForm',
                type:'btn',
                nameAttr:'resetContactForm',
                label: 'reset',
                btnStyle:'default',
                icon:'fa fa-refresh',
                className:'suds-primary btn-sm resetFormBtn',
            }]

            var controls =  {
                id :'formControlCotainer',
                type :'contacts/inputContainer',
                containerClass:'formControls horz',
                controls :formControls
            }

            return controls
        },

        getFieldSetControl : function (id,containerClasses,containerControls) {


            var fieldSetControl = {
                id: "fieldsetControlContainer" + id || "",
                containerClasses: (_.isArray(containerClasses) ? containerClasses.join(" ") : containerClasses),
                type : 'contacts/contactFormFieldSet',
                controls : (_.isArray(containerControls) ? containerControls : console.error("container controls needs to be array"))
            }

            return fieldSetControl;
        },


        applyPlugin: function(parent, c, callback) {

            if (parent && c) {


                if ((c.type === "inputText" && c.size) || c.removeFormGroup){
                    var $container = $("#" + c.id + '-container', this.$el) ;
                    $container.removeClass('form-group') ;
                    var $input = $("#" + c.id , this.$el) ;
                    $input.attr('size',c.size) ;
                    $container.removeClass('form-group') ;
                }

                if (c.type === "btn" && (c.id == "addOrUpdatePhoneNumBtn" || c.id == "addAddressBtn")){

                    var $input = $("#" + c.id , this.$el) ;
                    $input.attr("disabled",true);
                    $input.closest('.inputContainer').prepend("<label>")
                }

            }

            return ContactFormView.prototype.applyPlugin.apply(this, arguments) ;
        },
        /**
         * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
         * @returns {undefined}
         */
        startListening: function () {

            ContactFormView.prototype.startListening.apply(this, arguments);

            this.listenTo(this, {
                'renderComplete': function () {
                    // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                    // to occur after view is added to the page, which is why we have to use the renderComplete event
                    // instead of calling it from the render function
                    var self = this;

                    this.rendered = true;
                    $(".billingGroupContainer",this.$el).hide();

                    $('.suds-select',this.$el).css({
                        'border-radius' : '0px' //this is workaround to display the select control in rectangular input
                    })


                }
            });

        },


        findOrgRole: function(orgRoles, code){

            return _.find(orgRoles, function(eachOrgRole){

                return eachOrgRole.orgRoleType.code === code;
            });
        },


        onSave :function () {
            this.addOrUpdateAddress();
            this.addPhoneOrUpdatePhoneNumbers();

            var addressList = this.contactAddress;
            var phoneNumbers = this.phoneNumbers;
            var orgModel = this.config.orgModel;
            var person = this.model.get("person");
            var email = this.model.get("email");
            var billingAddressAttrs = addressList && _.find(addressList,function (item) {
                    return item.addressType === "Billing"
                });

            var self = this;
            var organization = $.extend({},orgModel.toJSON());
            var singlePersonOrgRoles = ["Person","Address"]

            if (organization  && organization.organizationRoles){
                var organizationRoles = organization.organizationRoles;
                var addresses = [];
                addresses.push(billingAddressAttrs)
                $.extend(this.findOrgRole(organizationRoles,"Person"),person);
                $.extend(this.findOrgRole(organizationRoles,"Billing"),billingAddressAttrs, {
                    orgRoleAddresses : addresses
                });

                $.extend(this.findOrgRole(organizationRoles,"Phone"),{
                    "orgRolePhoneNumbers" : phoneNumbers
                });

                $.extend(this.findOrgRole(organizationRoles,"Email"),{
                    "orgRoleEmails": [
                        {
                            "email": email,
                            "primaryEmailInd": "Y"
                        }
                    ]
                });

                $.extend(this.findOrgRole(organizationRoles,"URL"),{ url : person.personalUrl});

            }

            this.model.clear({silent: true});
            this.model.set(_.omit(organization, "id"));

            this.trigger("save")

        },


    });
});