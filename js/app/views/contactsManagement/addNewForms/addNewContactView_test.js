define(['nrm-ui/views/panelView', "jquery",
    "nrm-ui", "underscore", "require", "backbone",
    "hbs!contacts/contactFormAddedNumPill",
    "hbs!contacts/contactFormAddressPill",
    'nrm-ui/views/editorView'], function (PanelView, $, Nrm, _, require,
                                                   Backbone, ContactFormAddedNumPill, ContactFormAddressPill, EditorView) {

    return EditorView.extend({

        genericTemplate: "contacts/contactForm",

        initialize: PanelView.prototype.initialize,

        loadNestedModel: PanelView.prototype.loadNestedModel,

        modelEvents: $.extend({}, PanelView.prototype.modelEvents, {
            'change': "modelChange",
            "change:address": "changeAddressModelAttrs",
            "change:telephone": "telephoneAttrsChanged",
            "change:person": "personAttrsChanged"
        }),

        events: $.extend({}, PanelView.prototype.events, PanelView.prototype.changeEvents, {
            'click .addOrUpdatePhoneNumBtn': "addPhoneOrUpdatePhoneNumbers",
            'click .removePhoneNumber': "removePhoneNumber",
            'click .editPhoneNumber': "editPhoneNumber",
            'click .addOrUpdateAddressBtn': "addOrUpdateAddress",
            'click .editAddressBtn': "editAddress",
            'click .removeAddressBtn': "removeAddress",
            'click .saveContactBtn': "onSave"

        }),

        getConfig: function () {
            var config = PanelView.prototype.getConfig.apply(this, arguments) || {};
            this.formType = config.screenId;

            this.initializeFormFields();

            var dfd = new $.Deferred();
            var self = this;
            config.orgModel = this.model.getInitialOrgByContactType({id: this.formType});

            config.orgModel.fetch({
                success: function (model) {
                    config.orgModel = model;
                    self.orgModel = model;
                    config.controls = self.getContactContentSectionControls();
                    self.updateConfigControls(config.controls);
                    dfd.resolve(config);
                }, error: function (model) {
                    dfd.reject(config);
                }
            });

            //return config;
            return dfd.promise();
        },

        initializeFormFields: function(){
            this.phoneNumbers = [];
            this.contactAddress = [];
            this.requiredAddressProps = ["addressType", "addressLine1", "city", "country", "postalCode", "state"];
            this.requiredPhoneProps = [/*"intlCode",*/"phoneNumber", "orgRolePhoneNbrTypeCn"];

            this.personAndTelephoneFieldSetCtrls = [];
            this.listOfPersonInfos = [];
        },

        countrySelected: function (countryCn) {

            var self = this;
            var control = {
                id: 'state',
                type: 'select',
                nameAttr: 'state',
                label: 'State/Region',
                /*lov: "lov/countryRegions",*/
                placeholder: 'Select State/Region',
                prop: 'state',
                nested: 'address',
                className: 'suds-select stateTypeSelect addressAttrs'
            };

            $.when(Nrm.app.getContext({
                apiKey: "lov/countryRegions"
            }, this)).done(function (context) {
                $.when(Nrm.app.getCollection(context, null, this)).done(function (collection) {
                    var countryRegionFilteredByCountry;

                    if (collection && collection.size() > 0) {

                        countryRegionFilteredByCountry = collection.filter(function (model) {
                            return model.get("country") === countryCn;
                        })
                    }
                    var context = {
                        apiKey: 'country/countryRegion',
                        idAttr: 'countryRegionCn',
                        nameAttr: 'name',
                        collection: (countryRegionFilteredByCountry ? countryRegionFilteredByCountry : [])
                    }


                    self.initLov(control, context, function () {

                    }, function (data, response) {
                        control.error = true;
                        self.onLovError(context, data, response);

                    });
                });
            });

        },

        personAttrsChanged: function (model) {

        },

        changeAddressModelAttrs: function (model) {

            var address = model && model.get("address");
            var changed = model.changedAttributes();
            this.countrySelected(changed.address.country);

            function updateFieldsForMidtier() {
                if (address && address.addressFName) {
                    address.givenName = address.addressFName
                }

                if (address && address.addressFName) {
                    address.surname = address.addressFName
                }
            }
            updateFieldsForMidtier();

            if (changed.address.state) {
                var stateLabel = $("#state  option:selected").text();
                $.extend(changed.address, {
                    "countryRegion": {
                        "countryRegionCn": address.state,
                        "name": stateLabel
                    }
                });

                this.model.set(address);
            }

            if (address && address["addressType"] === "Other") {
                $(".otherAddressType", this.$el).show();
                $("#otherAddressTypeContainer", this.$el).show();
                //this.setControlHidden($(".otherAddressType",this.$el),false)
            } else {
                $(".otherAddressType", this.$el).hide();
                $("#otherAddressTypeContainer", this.$el).hide();
            }


            if (address && address["addressType"] === "Billing") {
                this.setControlHidden($(".billingGroupContainer", this.$el), false)
            } else {
                this.setControlHidden($(".billingGroupContainer", this.$el), true)
            }

            if (model && model.get("address")) {

                /*if (this.checkIfAllReqPropsArePresent(model.get("address"),this.requiredAddressProps)) {
                 this.setControlEnabled($(".addOrUpdateAddressBtn", this.$el), true);
                 } else {
                 this.setControlEnabled($(".addOrUpdateAddressBtn", this.$el), false);
                 }*/
            }

        },

        checkIfAllReqPropsArePresent: function (obj, requiredAddressProps) {
            var inBoth = _.intersection(_.keys(obj), requiredAddressProps);

            return (inBoth.length === requiredAddressProps.length)
        },

        telephoneAttrsChanged: function (model) {

            var telephone = model && model.get("telephone");

            var inBoth;

            var changed = model.changedAttributes();

            if (changed.telephone.orgRolePhoneNbrTypeCn) {
                var phoneTypeLabel = $("#phoneNumberType  option:selected").text();
                $.extend(changed.telephone, {

                    orgRolePhoneNbrType: {

                        orgRolePhoneNbrTypeCn: telephone.orgRolePhoneNbrTypeCn,
                        name: phoneTypeLabel
                    }

                });

                this.model.set(telephone);
            }

            if (model && model.get("telephone")) {

                /* if (this.checkIfAllReqPropsArePresent(model.get("telephone"), this.requiredPhoneProps)) {
                 this.setControlEnabled($(".addOrUpdatePhoneNumBtn", this.$el), true);
                 } else {
                 this.setControlEnabled($(".addOrUpdatePhoneNumBtn", this.$el), false);
                 }*/
            }


        },

        modelChange: function (model) {

            if (this.updateErrorList) {
                this.validate(true);
            }
        },

        validateForm: function () {

        },

        addPhoneOrUpdatePhoneNumbers: function (event) {
            // to prevent double click
           /* if (event) {
                event.preventDefault();
            }
            var dfd = new $.Deferred();

            var phoneNumber = this.model.get('telephone');


            phoneNumber = phoneNumber && _.omit(phoneNumber, function (v) {
                    return _.isUndefined(v) || _.isNull(v) || (v === '');
                })

            if ((this.phoneNumbers.length <= 0 && !phoneNumber)
                || (phoneNumber && !_.isEmpty(phoneNumber))
                || event) {*/

           if(event){
               this.model.set('valTypes', ['phone']);
           }

            var dfd = new $.Deferred();
            $.when(this.validate(true)).done(_.bind(function (valid) {
                var phoneNumber = this.model.get('telephone');

                if (valid) {
                    if (this.currentEditPhoneNumIndex) {
                        this.phoneNumbers.splice(this.currentEditPhoneNumIndex, 1, phoneNumber);
                        this.currentEditPhoneNumIndex = null;
                    } else {
                        this.phoneNumbers.push(phoneNumber)
                    }

                    this.model.set('phoneNumbers', this.phoneNumbers); // set it for validation

                    this.setTelePhoneModel({});
                    this.resetModelBindings("telephone");
                    this.populatePhoneNumbers();

                    dfd.resolve(true);
                } else {
                    dfd.reject(false);
                }
            }, this));
            /* } else {
                this.removeValidSectionsFromValidationList("TelephoneSection");
                dfd.resolve(true);
            }*/

            return dfd.promise();
        },

        removePhoneNumber: function (event) {
            var $target = $(event.target)
            var index = $target.attr("id") || $target.parent().closest('button').attr("id")

            if (index) {
                this.phoneNumbers.splice(index, 1);
                this.populatePhoneNumbers();
                this.setTelePhoneModel(this.model.get("telephone"));
            }

        },

        editPhoneNumber: function (event) {
            var $target = $(event.target)
            var index = $target.attr("id") || $target.parent().closest('button').attr("id")
            this.currentEditPhoneNumIndex = index;

            if (this.currentEditPhoneNumIndex) {
                $(".addOrUpdatePhoneNumBtn", this.$el).text("Update Phone Number");
                this.setTelePhoneModel(this.phoneNumbers[this.currentEditPhoneNumIndex]);
                this.resetModelBindings("telephone");
            }

        },

        setTelePhoneModel: function (obj) {

            this.model.set("telephone", obj);
        },

        addOrUpdateAddress: function (event) {
            var dfd = new $.Deferred();

            if(event){
                this.model.set('valTypes', ['address']);
            }

            $.when(this.validate(true)).done(_.bind(function (valid) {
                var address = this.model.get("address");

                if (valid) {
                    if (this.currentEditAddressIndex) {
                        this.contactAddress.splice(this.currentEditAddressIndex, 1, address);
                        this.currentEditAddressIndex = null;
                    } else {
                        this.contactAddress.push(address);
                    }

                    this.model.set('addresses', this.contactAddress);
                    this.setAddressModel({});

                    this.resetModelBindings("address");
                    this.populateAddress();

                    dfd.resolve(true);
                } else {
                    dfd.reject(false);
                }


            }, this));
        /*} else {
            this.removeValidSectionsFromValidationList("AddressSection");
            dfd.resolve();
        }*/

            return dfd.promise();

        },

        removeAddress: function (event) {
            var $target = $(event.target)
            var index = $target.attr("id") || $target.parent().closest('button').attr("id")
            this.contactAddress.splice(index, 1);
            this.populateAddress();
        },

        editAddress: function (event) {
            var $target = $(event.target)
            var index = $target.attr("id") || $target.parent().closest('button').attr("id")
            this.currentEditAddressIndex = index;
            if (this.contactAddress[index]) {
                $(".addOrUpdateAddressBtn", this.$el).text("Update Address");
                this.setAddressModel(this.contactAddress[index]);
                this.resetModelBindings("address"/*$('.addressAttrs',this.$el)*/);
            }

        },

        setAddressModel: function (obj) {

            this.model.set("address", obj);
        },

        resetModelBindings: function (nested) {

            var selector = $('[data-nrmprop="' + nested + '"] [data-nrmprop]', this.$el);
            var model = this.model.get(nested)

            _.each(selector, function (el) {
                var eachSelector = $(el);
                this.resetBindings(eachSelector);
                /*
                 * Todo: temporary work around for the issue where model binding is not working for nested attributes*/
                var prop = eachSelector.attr("data-nrmprop");
                if (prop) {
                    eachSelector.val(model[prop])
                }

            }, this);

            /* this.resetBindings(selector);*/
        },

        populatePhoneNumbers: function () {
            this.model.set("phoneNumberList",this.phoneNumbers);
            var html = ContactFormAddedNumPill(this)
            $('.formPhoneNumbers', this.$el).html(html)
        },

        populateAddress: function () {
            this.model.set("addressList",this.contactAddress);
            var html = ContactFormAddressPill(this)
            $('.addresses', this.$el).html(html)
        },

        navigateToContactForm: function (event) {
            //var contactFormUrl  = this.getContactFormURL();
            //Nrm.app.navigateUrl(contactFormUrl, {trigger: true, replace: true});
        },

        getContactContentSectionControls: function () {
        },

        updateConfigControls: function(controls){},

        personalInfoPanelControls: function () {

            var prefix = [{
                text: 'Ms',
                value: "Ms",
            }, {
                text: 'Mrs',
                value: "Mrs",
            }, {
                text: 'Mr',
                value: "Mr",
            }, {
                text: 'Dr',
                value: "Dr",
            }]

            var suffix = [{
                text: 'Phd',
                value: "Phd",
            }, {
                text: 'Jr',
                value: "Jr",
            }, {
                text: 'Esq',
                value: "Esq",
            }]

            var personalInfoControls = [{
                id: 'firstNameContainer',
                type: 'contacts/inputContainer',
                containerClass: 'vert',
                controls: [{
                    id: 'firstName',
                    type: 'inputText',
                    nameAttr: 'firstName',
                    label: 'First Name',
                    placeholder: 'first name',
                    prop: 'givenName',
                    nested: "person",
                    className: 'suds-input form-control personAttrs'
                }]
            }, {
                id: 'miContainer',
                type: 'contacts/inputContainer',
                containerClass: 'vert notReq',
                controls: [{
                    id: 'mi',
                    type: 'inputText',
                    nameAttr: 'mi',
                    label: 'M.I',
                    placeholder: 'M.I',
                    prop: 'middleName',
                    nested: 'person',
                    className: 'suds-input form-control personAttrs',
                    maxlength: '1'
                }]
            }, {
                id: 'lastNameContainer',
                type: 'contacts/inputContainer',
                containerClass: 'vert',
                controls: [{
                    id: 'lastName',
                    type: 'inputText',
                    nameAttr: 'lastName',
                    label: 'Last Name',
                    placeholder: 'last name',
                    prop: 'surname',
                    nested: "person",
                    className: 'suds-input form-control personAttrs'
                }]
            }, {
                id: 'prefixContainer',
                type: 'contacts/inputContainer',
                containerClass: 'vert notReq',
                controls: [{
                    id: 'prefixName',
                    type: 'select',
                    nameAttr: 'prefix',
                    label: 'Prefix',
                    options: prefix,
                    placeholder: 'Select Prefix',
                    prop: 'prefix',
                    nested: "person",
                    className: 'suds-select personAttrs'
                }]
            }, {
                id: 'suffixContainer',
                type: 'contacts/inputContainer',
                containerClass: 'vert notReq',
                controls: [{
                    id: 'suffix',
                    type: 'select',
                    nameAttr: 'suffix',
                    label: 'Suffix',
                    options: suffix,
                    placeholder: 'Select Suffix',
                    prop: 'suffix',
                    nested: "person",
                    className: 'suds-select personAttrs'
                }]
            }, {
                id: 'emailContainer',
                type: 'contacts/inputContainer',
                containerClass: 'vert notReq',
                controls: [{
                    id: 'email',
                    type: 'inputText',
                    nameAttr: 'email',
                    label: 'Email',
                    placeholder: 'email',
                    prop: 'email',
                    className: 'suds-input form-control'
                }]
            }, {
                id: 'searchInputContainer',
                type: 'contacts/inputContainer',
                containerClass: 'vert fullWidth notReq',
                controls: [{
                    id: 'url',
                    type: 'inputText',
                    nameAttr: 'url',
                    label: 'URL',
                    placeholder: 'http://www.url.net',
                    prop: 'personalUrl',
                    nested: "person",
                    className: 'suds-input form-control personAttrs'
                }]
            }]

            return personalInfoControls;
        },

        phoneInfoPanelControls: function () {

            var personalInfoControls = [{
                id: 'phoneTypeContainer',
                type: 'contacts/inputContainer',
                containerClass: 'vert',
                controls: [{
                    id: 'phoneNumberType',
                    type: 'select',
                    nameAttr: 'phoneNumberType',
                    label: 'Type',
                    "lov": "lov/orgRolePhoneNumberTypes",
                    placeholder: 'Select Type',
                    prop: 'orgRolePhoneNbrTypeCn',
                    className: 'suds-select phoneTypeSelect telephoneAttrs',
                }]
            }, {
                id: 'intlCodeContainer',
                type: 'contacts/inputContainer',
                containerClass: 'vert notReq',
                controls: [{
                    id: 'intlCode',
                    type: 'inputNum',
                    nameAttr: 'intlCode',
                    label: "Int'l Code",
                    placeholder: '011',
                    maxlength: "3",
                    size: "3",
                    prop: 'intlCode',
                    className: 'suds-input form-control telephoneAttrs',
                }]
            }, {
                id: 'phoneNumberContainer',
                type: 'contacts/inputContainer',
                containerClass: 'vert',
                controls: [{
                    id: 'phoneNumber',
                    type: 'inputNum',
                    nameAttr: 'phoneNumber',
                    label: 'Phone Number',
                    placeholder: '555-555-5555',
                    prop: 'phoneNumber',
                    'removeFormGroup': true,
                    //nested:'telephone',
                    maxlength: "15",
                    className: 'suds-input form-control telephoneAttrs'
                }]
            }, {
                id: 'extContainer',
                type: 'contacts/inputContainer',
                containerClass: 'vert notReq',
                controls: [{
                    id: 'extension',
                    type: 'inputNum',
                    nameAttr: 'extension',
                    label: 'Extension',
                    placeholder: '55555',
                    prop: 'extension',
                    maxlength: "6",
                    size: "6",
                    //nested:'telephone',
                    className: 'suds-input form-control telephoneAttrs'
                }]
            }, {
                id: 'addOrUpdateBtnContainer',
                type: 'contacts/inputContainer',
                containerClass: 'notReq',
                controls: [{
                    id: 'addOrUpdatePhoneNumBtn',
                    type: 'btn',
                    nameAttr: 'addOrUpdatePhoneNumBtn',
                    label: 'Add Phone Number',
                    //placeholder:'email',
                    //prop:'email',
                    btnStyle: 'primary',
                    className: 'suds-primary btn-sm addOrUpdatePhoneNumBtn'
                }]
            }];


            var controls = [{
                id: 'phonenumbersContainer',
                type: 'common/divCtrlIterator',
                controls: [],
                containerClass: 'phoneNumbers formPhoneNumbers'
            }, {
                id: 'phoneDivGroupContainer',
                type: 'common/divCtrlIterator',
                controls: personalInfoControls,
                prop: 'telephone',
                containerClass: 'form-group horz phoneGroupContainer',
                dataType: "object"
            }]

            return controls;
        },

        addressInfoPanelControls: function () {

            var orgModel = this.orgModel && this.orgModel.toJSON();

            var addressTypes = _.map(orgModel.nonOrgLevelOrgTypeCodes, function (item) {
                return {
                    text: item,
                    value: item
                }
            });

            if (addressTypes && addressTypes.length == 1) {
                this.model.set("address", {
                    "addressType": addressTypes[0].value
                })
            }
            var formGroup1Controls = [{
                id: 'addressTypeContainer',
                type: 'contacts/inputContainer',
                containerClass: 'vert',
                //group:true,
                //groupContainerClasses : 'form-group horz',
                controls: [{
                    id: 'addressType',
                    type: 'select',
                    nameAttr: 'addressType',
                    label: 'Address Type',
                    options: addressTypes,
                    placeholder: 'Select Address Type',
                    prop: 'addressType',
                    className: 'suds-select addressTypeSelect addressAttrs',
                    nested: 'address',
                    disabled: (addressTypes.length == 1)

                }]
            }, {
                id: 'otherAddressTypeContainer',
                type: 'contacts/inputContainer',
                containerClass: 'notReq',
                controls: [{
                    id: 'otherAddressType',
                    type: 'inputText',
                    nameAttr: 'otherAddressType',
                    label: "Other Address Type",
                    placeholder: 'Other Address Type',
                    prop: 'otherAddressType',
                    className: 'suds-input otherAddressType addressAttrs',
                    nested: 'address',
                    hidden: true
                }]
            }, {
                id: 'deptContainer',
                type: 'contacts/inputContainer',
                containerClass: 'notReq',
                controls: [{
                    id: 'dept',
                    type: 'inputText',
                    nameAttr: 'dept',
                    label: 'Business/Department Name',
                    placeholder: 'Business/Department Name',
                    prop: 'dept',
                    nested: 'address',
                    className: 'suds-input addressAttrs'
                }]
            }];

            var formGroup2Controls = [{
                id: 'billingContactFirstNameContainer',
                type: 'contacts/inputContainer',
                containerClass: 'notReq',
                controls: [{
                    id: 'billingContactFirstName',
                    type: 'inputText',
                    nameAttr: 'billingContactFirstName',
                    label: "Billing Contact First Name",
                    placeholder: 'Billing Contact First Name',
                    prop: 'addressFName',
                    className: 'suds-input addressAttrs',
                    nested: 'address',
                    //hidden:true
                }]
            }, {
                id: 'billingContactLastNameContainer',
                type: 'contacts/inputContainer',
                containerClass: 'notReq',
                controls: [{
                    id: 'billingContactLastName',
                    type: 'inputText',
                    nameAttr: 'billingContactLastName',
                    label: "Billing Contact Last Name",
                    placeholder: 'Billing Contact Last Name',
                    prop: 'addressLName',
                    className: 'suds-input addressAttrs',
                    nested: 'address',
                    //hidden:true
                }]
            }];


            var formGroup3Controls = [{
                id: 'countriesContainer',
                type: 'contacts/inputContainer',
                containerClass: '',
                //group:true,
                //groupContainerClasses : 'form-group horz',
                controls: [{
                    id: 'country',
                    type: 'select',
                    nameAttr: 'country',
                    label: 'Country',
                    lov: 'lov/countries',
                    placeholder: 'Select Country',
                    prop: 'country',
                    nested: 'address',
                    className: 'suds-select countriesTypeSelect addressAttrs'
                }]
            }, {
                id: 'postalCodeContainer',
                type: 'contacts/inputContainer',
                containerClass: 'postalCode',
                controls: [{
                    id: 'postalCode',
                    type: 'inputNum',
                    nameAttr: 'postalCode',
                    label: "Postal Code",
                    placeholder: 'enter postal code',
                    prop: 'postalCode',
                    nested: 'address',
                    className: 'suds-input addressAttrs',
                    //hidden:true
                }]
            }];


            var address1AndAddress2GroupControls = [{
                id: 'address1Container',
                type: 'contacts/inputContainer',
                containerClass: '',
                controls: [{
                    id: 'address1',
                    type: 'inputText',
                    nameAttr: 'address1',
                    label: "Address 1",
                    placeholder: 'address1',
                    prop: 'addressLine1',
                    nested: 'address',
                    className: 'suds-input addressAttrs',
                    //hidden:true
                }]
            }, {
                id: 'address2Container',
                type: 'contacts/inputContainer',
                containerClass: 'notReq',
                controls: [{
                    id: 'address2',
                    type: 'inputText',
                    nameAttr: 'address2',
                    label: "Address 2",
                    placeholder: 'address2',
                    prop: 'addressLine2',
                    nested: 'address',
                    className: 'suds-input addressAttrs',
                    //hidden:true
                }]
            }];

            var cityAndStateGroupControls = [{
                id: 'cityContainer',
                type: 'contacts/inputContainer',
                containerClass: '',
                controls: [{
                    id: 'city',
                    type: 'inputText',
                    nameAttr: 'city',
                    label: "City",
                    placeholder: 'city',
                    prop: 'city',
                    nested: 'address',
                    className: 'suds-input addressAttrs',
                    //hidden:true
                }]
            }, {
                id: 'statesContainer',
                type: 'contacts/inputContainer',
                containerClass: '',
                //group:true,
                //groupContainerClasses : 'form-group horz',
                controls: [{
                    id: 'state',
                    type: 'select',
                    nameAttr: 'state',
                    label: 'State/Region',
                    //lov: "lov/countryRegions",
                    options: [],
                    placeholder: 'Select State/Region',
                    prop: 'state',
                    nested: 'address',
                    className: 'suds-select stateTypeSelect addressAttrs'
                }]
            }];


            var addAddressBtnGroup = [{
                id: 'addAddressBtnContainer',
                type: 'contacts/inputContainer',
                containerClass: 'formControls notReq',
                controls: [{
                    id: 'addAddressBtn',
                    type: 'btn',
                    nameAttr: 'addAddressBtn',
                    label: 'Add Address',
                    btnStyle: 'primary',
                    hidden: (addressTypes.length == 1),
                    className: 'suds-primary btn-sm addOrUpdateAddressBtn'
                }]
            }]


            var controls = [{
                id: 'addressesContainer',
                type: 'common/divCtrlIterator',
                controls: [],
                containerClass: 'addresses',
                //prop:'addresses',
            }, {
                id: 'addressForm1GroupContainer',
                type: 'common/divCtrlIterator',
                controls: formGroup1Controls,
                containerClass: 'form-group',
                //prop:'addresses',
            }, {
                id: 'billingGroupContainer',
                type: 'common/divCtrlIterator',
                controls: formGroup2Controls,
                containerClass: 'form-group billingGroupContainer',
                //prop:'addresses',
            }, {
                id: 'addressForm3GroupContainer',
                type: 'common/divCtrlIterator',
                controls: formGroup3Controls,
                containerClass: 'form-group',
                //prop:'addresses',
            }, {
                id: 'addressForm3GroupContainer',
                type: 'common/divCtrlIterator',
                controls: address1AndAddress2GroupControls,
                containerClass: 'form-group',
                //prop:'addresses',
            }, {
                id: 'cityAndStateGroupContainer',
                type: 'common/divCtrlIterator',
                controls: cityAndStateGroupControls,
                containerClass: 'form-group'
            }, {
                id: 'addOrUpdateBtnGroup',
                type: 'common/divCtrlIterator',
                controls: addAddressBtnGroup,
                containerClass: 'form-group'
            }]

            return controls;
        },

        singleTextAreaControls: function (fieldName) {
            var attrValues = this.getAttrValues(fieldName);

            var controls = [{
                id: 'singleTextAreaGroupContainer',
                type: 'common/divCtrlIterator',
                controls: [{
                    id: 'singleTextAreaContainer',
                    type: 'contacts/inputContainer',
                    containerClass: 'vert fullWidth notReq',
                    controls: [{
                        id: 'comments',
                        type: 'textArea',
                        nameAttr: attrValues.nameAttrVal,
                        label: attrValues.labelVal,
                        placeholder: attrValues.placeHolderVal,
                        prop: attrValues.propVal,
                        rows: attrValues.rowsVal,
                        className: 'suds-text-area form-control'
                    }]
                }],
                containerClass: 'form-group horz'
            }]

            return controls;
        },

        getAttrValues: function (fieldName) {
            var nameAttrVal, labelVal, placeHolderVal, propVal, rowsVal;

            switch (fieldName) {
                case 'comments':
                    nameAttrVal = 'comments';
                    labelVal = 'Comments';
                    placeHolderVal = 'Comments';
                    propVal = 'comments';
                    rowsVal = 12;
                    break;
                case 'trusteeName':
                    nameAttrVal = 'trusteeName';
                    labelVal = 'Trustee Name';
                    placeHolderVal = 'Trustee Name';
                    propVal = 'respPersonName';
                    rowsVal = 1;
                    break;
                case 'agentName':
                    nameAttrVal = 'trusteeName';
                    labelVal = 'Trustee Name';
                    placeHolderVal = 'Trustee Name';
                    propVal = 'respPersonName';
                    rowsVal = 1;
                    break;
            }

            var attrValues = {
                nameAttrVal: nameAttrVal,
                labelVal: labelVal,
                placeHolderVal: placeHolderVal,
                propVal: propVal,
                rowsVal: rowsVal
            };

            return attrValues;
        },

        formControls: function () {

            var formControls = [{
                id: 'saveContactFormBtn',
                type: 'btn',
                nameAttr: 'saveContactFormBtn',
                label: 'Save Contact',
                btnStyle: 'primary',
                icon: 'fa fa-floppy-o',
                className: 'suds-primary btn-sm saveContactBtn',
                //disabled: true
            }, {
                id: 'resetContactForm',
                type: 'btn',
                nameAttr: 'resetContactForm',
                label: 'reset',
                btnStyle: 'default',
                icon: 'fa fa-refresh',
                className: 'suds-primary btn-sm resetFormBtn',
            }]

            var controls = {
                id: 'formControlCotainer',
                type: 'contacts/inputContainer',
                containerClass: 'formControls horz',
                controls: formControls
            }

            return controls
        },

        getFieldSetControl: function (id, containerClasses, containerControls) {
            var fieldSetControl = {
                id: "fieldsetControlContainer" + id || "",
                containerClasses: (_.isArray(containerClasses) ? containerClasses.join(" ") : containerClasses),
                type: 'contacts/contactFormFieldSet',
                controls: (_.isArray(containerControls) ? containerControls : console.error("container controls needs to be array"))
            }

            return fieldSetControl;
        },

        applyPlugin: function (parent, c, callback) {

            if (parent && c) {

                var $input = $("#" + c.id, this.$el);
                if (c.id === "orgName") {
                    $input.unwrap();
                }

                if ((c.type === "inputText" && c.size) || c.removeFormGroup) {
                    var $container = $("#" + c.id + '-container', this.$el);
                    $container.removeClass('form-group');
                    $input.attr('size', c.size);

                    /*$container.removeClass('form-group') ;*/
                }

                if (c.type === "btn" && (c.id == "addOrUpdatePhoneNumBtn" || c.id == "addAddressBtn")) {
                    //$input.attr("disabled",true);
                    $input.closest('.inputContainer').prepend("<label>")
                }

            }

            return PanelView.prototype.applyPlugin.apply(this, arguments);
        },


        render: function () {

            return PanelView.prototype.render.apply(this, arguments);
        },
        /**
         * Overrides {@link module:nrm-ui/views/editorView#startListening|EditorView#startListening}
         * @returns {undefined}
         */
        startListening: function () {

            PanelView.prototype.startListening.apply(this, arguments);

            this.listenTo(this, {
                'renderComplete': function () {
                    // Set initial status.  Because of unscoped JQuery selectors in the Bootstrap Tab plugin, this needs
                    // to occur after view is added to the page, which is why we have to use the renderComplete event
                    // instead of calling it from the render function
                    var self = this;
                    var address = this.model.get("address");
                    this.rendered = true;

                    if (address && address["addressType"] === "Billing") {
                        $(".billingGroupContainer", this.$el).show();
                    } else {
                        $(".billingGroupContainer", this.$el).hide();
                    }
                    $("#otherAddressTypeContainer", this.$el).hide();

                    $('.suds-select', this.$el).css({
                        'border-radius': '0px' //this is workaround to display the select control in rectangular input
                    })


                }
            });

        },


        findOrgRole: function (orgRoles, code) {

            return _.find(orgRoles, function (eachOrgRole) {

                return eachOrgRole.orgRoleType.code === code;
            });
        },


        getOrgNameAndSosControls: function () {
            var options = this.getFormBasedOrgNameInputConrolFieldValues();

            var businessNameControls = [{
                id: 'businessNameContainer',
                type: 'contacts/inputContainer',
                containerClass: '',
                controls: [{
                    id: 'orgName',
                    type: 'inputText',
                    nameAttr: options.orgNameAttrValue,
                    label: options.orgLabelValue,
                    placeholder: options.orgPlaceholderValue,
                    prop: 'name',
                    className: 'suds-input',
                    //hidden:true
                }]
            }, {
                id: 'sosContainer',
                type: 'contacts/inputContainer',
                containerClass: 'horz sos',
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
                controls: [{
                    id: 'sos',
                    type: "contacts/sosContainer",
                    nameAttr: 'sos',
                    label: "Secretary of State Verified",
                    //placeholder:'Business Name',
                    //prop:'sos',
                    //className:'suds-input',
                    //hidden:true
                }]
            }]

            var controls = [{
                id: 'addressesContainer',
                type: 'common/divCtrlIterator',
                controls: [{
                    id: 'addressForm1GroupContainer',
                    type: 'common/divCtrlIterator',
                    controls: businessNameControls,
                    containerClass: 'form-group '
                }],
                containerClass: 'form-inline'
            }]

            return controls;
        },

        getFormBasedOrgNameInputConrolFieldValues: function () {
            var formType = this.formType;

            var orgNameAttrValue, orgLabelValue, orgPlaceholderValue;
            if (formType == 'SolePropr') {
                orgNameAttrValue = 'businessName';
                orgLabelValue = "Business Name";
                orgPlaceholderValue = 'Business Name';

            } else if (formType == 'Trust') {
                orgNameAttrValue = 'trustName';
                orgLabelValue = "Trust Name";
                orgPlaceholderValue = 'Trust Name';

            } else if (formType == 'Corp') {
                orgNameAttrValue = "corporationName";
                orgLabelValue = "Corporation Name";
                orgPlaceholderValue = "Corporation Name";

            } else if (formType == 'LLC') {
                orgNameAttrValue = "llcName";
                orgLabelValue = "LLC Name";
                orgPlaceholderValue = "LLC Name";

            } else if (formType == 'LLP') {
                orgNameAttrValue = "llpName";
                orgLabelValue = "LLP Name";
                orgPlaceholderValue = "LLP Name";

            } else if (formType == 'Assocatn') {
                orgNameAttrValue = "associationName";
                orgLabelValue = "Association Name";
                orgPlaceholderValue = "Association Name";

            } else if (formType == 'Partner') {
                orgNameAttrValue = "partnershipName";
                orgLabelValue = "Partnership  Name";
                orgPlaceholderValue = "Partnership Name";

            } else {
                console.log('Inappropriate formType: ' + formType);
            }

            var options = {
                orgNameAttrValue: orgNameAttrValue,
                orgLabelValue: orgLabelValue,
                orgPlaceholderValue: orgPlaceholderValue
            };

            return options;
        },

        getSingleInputFieldSetControls: function (orgFieldOrRole) {
            var options = this.getOrgRoleBasedOptions(orgFieldOrRole);

            var randomNum = Math.floor((Math.random() * 450000) + 1);

            var textAreaProps;
            if (options.type == "textArea") {
                textAreaProps = {
                    maxlength: 500,
                    className: 'suds-textarea'
                }
            }


            var singleInputFieldControls = [{
                id: options.nameAttrVal + 'Container',
                type: 'contacts/inputContainer',
                containerClass: 'vert fullWidth ' + (options && options.required ? " " : " notReq"),
                controls: [{
                    id: options.nameAttrVal || 'businessNameCtrlId',
                    type: options.type || 'inputText',
                    nameAttr: options.nameAttrVal || 'businessNameCtrl',
                    label: options.labelVal,
                    placeholder: options.placeHolderVal,
                    prop: options.propVal,
                    className: 'suds-input ' + (textAreaProps && textAreaProps.className ? textAreaProps.className : " "),
                    rows: options.rowsVal,
                    maxlength: textAreaProps && textAreaProps.maxlength
                }]
            }];

            var controls = [{
                id: randomNum + 'Form1GroupContainer',
                type: 'common/divCtrlIterator',
                controls: singleInputFieldControls,
                containerClass: 'form-group '
            }];

            return controls;
        },

        getOrgRoleBasedOptions: function (ctrlType) {
            var nameAttrVal, labelVal, placeHolderVal, propVal, type = 'inputText', rowsVal = 1, required = false;

            switch (ctrlType) {
                case 'comments':
                    nameAttrVal = 'comments';
                    labelVal = 'Comments(500 characters)';
                    placeHolderVal = 'Comments';
                    propVal = 'remarks';
                    rowsVal = 12;
                    type = 'textArea';
                    break;

                case 'trusteeName':
                    nameAttrVal = 'trusteeName';
                    labelVal = 'Trustee Name';
                    placeHolderVal = 'Trustee Name';
                    propVal = 'respPersonName';
                    break;

                case 'url':
                    nameAttrVal = "url";
                    labelVal = "URL",
                    placeHolderVal = "http://www.url.net";
                    propVal = "orgRoleUrl";
                    break;

                case 'agentName':
                    nameAttrVal = "agentName";
                    labelVal = "Agent Name";
                    placeHolderVal = "Agent Name";
                    propVal = "respPersonName";
                    required = true;
                    break;

                case "divisionName":
                    nameAttrVal = "divisionName";
                    labelVal = "Division/Department/Agency Name";
                    propVal = "name";
                    placeHolderVal = "Enter organization";
                    break;
            }

            var options = {
                nameAttrVal: nameAttrVal,
                labelVal: labelVal,
                propVal: propVal,
                placeHolderVal: placeHolderVal,
                rowsVal: rowsVal,
                required: required,
                type: type
            };


            return options;
        },

        /*

         */
        populateOrgRoleOject: function () {
            this.uiOrgRolesObj = []
        },

        onSave: function () {
            this.updateErrorList = true;
            this.model.unset('valTypes'); // if valTypes not provided, all rules will be checked

            var dfd1 = this.addOrUpdateAddress();
            var dfd2 = this.addPhoneOrUpdatePhoneNumbers();


            $.when(dfd1, dfd2).done(_.bind(function (isAddressValid, isPhoneValid) {


                if (isAddressValid && isPhoneValid) {

                    var formType = this.formType;
                    var orgRoleTypesForCurrentFormType = this.getOrgRoleTypesForCurrentFormType();

                    var orgModel = this.config.orgModel;
                    var organization = $.extend({}, orgModel.toJSON());
                    var organizationRoles = organization.organizationRoles;

                    var self = this;
                    _.each(orgRoleTypesForCurrentFormType, function (orgRoleType) {
                        self.updateOrganizationRolesIfNeeded(organizationRoles, orgRoleType);
                    });

                    //this.model.clear({silent: true});
                    this.model.set(_.omit(organization, "id"));
                    /*this.model.unset("address", {silent: true});*/
                    $.when(EditorView.prototype.onSave.apply(self,arguments)).done(_.bind(function(validated){

                        if(validated){
                            this.model.clear({silent :true})
                            EditorView.prototype.useGlobalErrorNotification  = false;
                        }

                    },this));
                }


            }, this))


        },

        updateOrganizationRolesIfNeeded: function (organizationRoles, orgRoleType) {
            var orgRole = this.findOrgRole(organizationRoles, orgRoleType);
            if (orgRole) {
                var userInputs = this.getFieldValuesForThisOrgRole(orgRoleType);

                if (userInputs && _.isArray(userInputs)) {
                    $.extend(orgRole, userInputs[0]);
                    userInputs.splice(0, 1);

                    var newOrgRole;
                    _.each(userInputs, function (each) {
                        newOrgRole = $.extend({}, orgRole, each);
                        organizationRoles.push(newOrgRole);
                    });
                } else {
                    $.extend(orgRole, userInputs);
                }

            }
        },

        getFieldValuesForThisOrgRole: function (orgRoleType) {

            var userInput;

            switch (orgRoleType) {
                case 'Spouse':
                case 'Person':
                    var listOfPersonInfo = this.listOfPersonInfos;
                    if (listOfPersonInfo && listOfPersonInfo.length > 0) {
                        userInput = [];
                        var personInfo;
                        _.each(this.listOfPersonInfos, function (obj) {
                            personInfo = $.extend({}, obj);
                            userInput.push(personInfo);
                        })
                    }
                    else {
                        userInput = this.model.get("person");
                    }

                    break;

                case 'Email':
                    var email = this.model.get("email");
                    userInput = {
                        "orgRoleEmails": [
                            {
                                "email": email,
                                "primaryEmailInd": "Y"
                            }
                        ]
                    };
                    break;

                case 'URL':
                    var url;
                    if (this.model.get('person')) {
                        url = this.model.get('person').personalUrl;
                    } else {
                        url = this.model.get('orgRoleUrl');
                    }

                    userInput = {url: url};
                    break;

                case 'Phone':
                    userInput = this.phoneNumbers;
                    break;

                case 'Billing':
                    var addressList = this.contactAddress;
                    var billingAddressAttrs = addressList && _.find(addressList, function (item) {
                            return item.addressType === "Billing"
                        });
                    if (billingAddressAttrs){
                        var addresses = [];
                        addresses.push(billingAddressAttrs);


                        userInput = $.extend({}, billingAddressAttrs, {
                            orgRoleAddresses: addresses
                        });
                    }
                   

                    break;

                case 'Trustee':
                case 'Agent':
                    userInput = {name: this.model.get('respPersonName')}
            }

            return userInput;
        },

        getOrgRoleTypesForCurrentFormType: function () {
            var formType = this.formType;
            var orgRoleTypes;

            switch (formType) {
                case 'Assocatn':
                    orgRoleTypes = ['Billing', 'Person', 'URL'];
                    break;
                case 'Corp':
                    orgRoleTypes = ['URL', 'Agent', 'Billing', 'Person'];
                    break;
                case 'LLC':
                    orgRoleTypes = ['URL', 'Trustee', 'Billing', 'Person'];
                    break;
                case 'Married':
                    orgRoleTypes = ['Billing', 'Spouse'];
                    break;
                case 'Partner':
                    orgRoleTypes = ['Billing', 'Person', 'URL'];
                    break;
                case 'Person':
                    orgRoleTypes = ['URL', 'Billing', 'Email', 'Person', 'Phone'];
                    break;
                case 'SolePropr':
                    orgRoleTypes = ['URL', 'Billing', 'Email', 'Person', 'Phone'];
                    break;
                case 'Trust':
                    orgRoleTypes = ['URL', 'Trustee', 'Billing', 'Email', 'Person', 'Phone'];
                    break;
            }

            return orgRoleTypes;
        }

    });
});