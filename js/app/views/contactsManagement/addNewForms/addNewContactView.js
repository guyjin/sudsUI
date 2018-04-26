define(['nrm-ui/views/panelView', "jquery",
    "nrm-ui", "underscore", "require", "backbone",
    "hbs!contacts/contactFormAddedNumPill",
    "hbs!contacts/contactFormAddressPill",
    'nrm-ui/views/validationAwareView'], function (PanelView, $, Nrm, _, require,
                                                   Backbone, ContactFormAddedNumPill, ContactFormAddressPill, ValidationAwareView,
                                                    InitialOrg) {

    return ValidationAwareView.extend({

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
            'click .saveContactBtn': "onSave",
           // "change .phoneNumberInput" : "formatPhoneNumber",
            "keyup .numberInput" : "validateNumber",
            "paste .numberInput" : "validateNumber"
        }),

       /* validateNumber : function (event) {

            var $target = $(event.target);
            var value  = $target.val();
            if(event.keyCode > 36 && event.keyCode < 41)
            {
                return true;
            }
            if ((event.keyCode > 47 && event.keyCode <58) || (event.keyCode < 106 && event.keyCode > 95))
            {
                if ($target.hasClass("phoneNumberInput")){
                    if (value.length == 3) {
                        $target.val(value + "-");
                    } else if (value.length == 7) {
                        $target.val(value + "-");
                    }
                    $target.attr('maxlength', '12');
                    return true;
                }

            }

            value = value.replace(/[^\-0-9]/g,'');

            $target.val(value);

        },*/

        validateNumber: function(event){
            var $target = $(event.target);
            var value  = $target.val();
            value = value.replace(/\D/g,'');

            var telephone = this.model.get('telephone');

            if ($target.hasClass("phoneNumberInput")){
                var length = value.length;
                if(length == 3){
                    value = '(' + value + ')';
                }else if(length > 3 && length < 7){
                    value = '(' + value.substring(0,3) + ') ' + value.substring(3, length)
                }else if(length > 6){
                    value = '(' + value.substring(0,3) + ') ' + value.substring(3, 6) + '-' + value.substring(6,10);
                }
                telephone.phoneNumber = value;
            } else if($target.attr('id') == 'extension'){
                value = value.substring(0,5);
                telephone.extension = value;
            } else if($target.attr('id') == 'intlCode'){
                value = value.substring(0,5);
                telephone.intlCode = value;
            }

            $target.val(value);
        },

        getConfig: function () {
            var config = PanelView.prototype.getConfig.apply(this, arguments) || {};
            this.formType = config.screenId;

            this.initializeFormFields();

            var dfd = new $.Deferred();
            var self = this;
            //config.orgModel = this.model.getInitialOrgByContactType({id: this.formType});

            config.orgModel = this.model.getInitialOrgByContactType({id: this.formType});

          /*  if(formActivity == 'new'){
                config.orgModel = this.model.getInitialOrgByContactType({id: this.formType});
            }else{
                config.orgModel = this.model.fetch()
            }*/

            config.orgModel.fetch({
                success: function (model) {
                    var modelSet = self.setModelAttrsIfEdit();

                    $.when(modelSet).done(_.bind(function () {
                        self.orgModel = model;

                        config.controls = self.getContactContentSectionControls();
                        self.updateConfigControls(config.controls);

                        dfd.resolve(config);
                    }, this));

                }, error: function (model) {
                    dfd.reject(config);
                }
            });

            //return config;
            return dfd.promise();
        },

        setModelAttrsIfEdit: function(){
            //this.setModelId();
            var modelSet = new $.Deferred();

           /* //temp
            if(window.editId && !window.editIdUsed){
                this.model.set('id', editId, {silent: true});
                editIdUsed = true;
            }*/


            if(this.model.get('id')){
                var self = this;

                this.model.fetch({
                    success: function(model){
                        self.model.set(self.convertContactToUiFormatForEdit(model.toJSON()));
                        modelSet.resolve(true);
                    }, error: function(model){
                        modelSet.resolve(false);
                    }
                });
            }else{
                modelSet.resolve(false);
            }

            return modelSet.promise();
        },

        setModelId: function(){

        },

        setHardCodedMidtierContact: function(){
            this.midtierContact = {
                "organizationCn": "DD8E6F01-3182-468B-90D9-99761F5FA96B",
                "lastUpdate": 1524009823000,
                "name": "Brynne Leee",
                "remarks": "Mollitia tempor numquam voluptas id, odit ab sequi iste fuga. Soluta quo neque temporibus veniam. fdfdfd",
                "orgType": {
                    "orgTypeCn": "66BFFF8FF4CB1710E054A0369F38EE9B",
                    "code": "FedGovt",
                    "description": "Any branch, including subdivisions within a branch, of the United States’ government as prescribed by the US Constitution.",
                    "effectiveDate": 946710000000,
                    "governmentInd": "Y",
                    "label": "Federal Government",
                    "lastUpdate": 1521064633000,
                    "legacyCode": "FEDERAL GOVT",
                    "name": "Federal Government"
                },
                "organizationRoles": [
                    {
                        "organizationRoleCn": "7B551660-5E6F-422A-9C66-85F999F26E66",
                        "effectiveDate": 1523944800000,
                        "givenName": "Isaiaha",
                        "lastUpdate": 1524009823000,
                        "surname": "Isaiaha",
                        "orgRoleType": {
                            "orgRoleTypeCn": "66D9C22DCCBDEBD0E054A0369F38EE9B",
                            "code": "Billing",
                            "effectiveDate": 946710000000,
                            "label": "Billing",
                            "lastUpdate": 1521125457000,
                            "orgLevelInd": "N",
                            "name": "Billing"
                        },
                        "orgRoleAddresses": [
                            {
                                "orgRoleAddressCn": "105EE32A-3EF1-4A79-AC35-BDF26391B896",
                                "addressLine1": "87 West Second Avenu",
                                "addressLine2": "Autem quam",
                                "city": "dfsadf",
                                "lastUpdate": 1524009823000,
                                "postalCode": "21343",
                                "countryRegion": {
                                    "countryRegionCn": "664AF62775F6E836E054A0369F38EE9B",
                                    "code": "AZ",
                                    "effectiveDate": 946710000000,
                                    "lastUpdate": 1519848012000,
                                    "legacyCn": "664AF62775F7E836E054A0369F38EE9B",
                                    "name": "Arizona"
                                },
                                "orgRoleAddressType": {
                                    "orgRoleAddressTypeCn": "66BFFF8FF64B1710E054A0369F38EE9B",
                                    "code": "Mail",
                                    "effectiveDate": 946710000000,
                                    "label": "Mail",
                                    "lastUpdate": 1520546962000,
                                    "legacyCode": "MAILING",
                                    "name": "Mail"
                                }
                            }
                        ],
                        "orgRoleEmails": [],
                        "orgRolePhoneNumbers": []
                    },
                    {
                        "organizationRoleCn": "E9B0E3AF-5607-4574-9458-56C3F95E47DE",
                        "effectiveDate": 1523944800000,
                        "givenName": "Libertyy",
                        "lastUpdate": 1524009823000,
                        "middleName": "E",
                        "prefix": "Mrs",
                        "suffix": "Jr",
                        "surname": "Richard",
                        "url": "www.urj.com",
                        "orgRoleType": {
                            "orgRoleTypeCn": "66D9C22DCCC1EBD0E054A0369F38EE9B",
                            "code": "Person",
                            "effectiveDate": 946710000000,
                            "label": "Person",
                            "lastUpdate": 1521125457000,
                            "orgLevelInd": "Y",
                            "name": "Person"
                        },
                        "orgRoleAddresses": [],
                        "orgRoleEmails": [
                            {
                                "orgRoleEmailCn": "EDAEEB60-CC42-47E0-9911-B910A6B18892",
                                "effectiveDate": 1523944800000,
                                "email": "goloferexy@mailinator.comt",
                                "lastUpdate": 1524009824000,
                                "orgRoleEmailType": {
                                    "orgRoleEmailTypeCn": "66BFFF8FF7321710E054A0369F38EE9B",
                                    "code": "Primary",
                                    "effectiveDate": 946710000000,
                                    "label": "Primary",
                                    "lastUpdate": 1520375321000,
                                    "name": "Primary"
                                },
                                "primaryEmailInd": "Y"
                            }
                        ],
                        "orgRolePhoneNumbers": [
                            {
                                "orgRolePhoneNumberCn": "40748E5C-CD82-4EDA-A3E7-8F7295A97D1F",
                                "lastUpdate": 1524009824000,
                                "phoneNumber": "728-64-2868",
                                "primaryPhoneNumberInd": "Y",
                                "orgRolePhoneNbrType": {
                                    "orgRolePhoneNbrTypeCn": "66BFFF8FF79B1710E054A0369F38EE9B",
                                    "code": "Home",
                                    "effectiveDate": 1483254000000,
                                    "label": "Home",
                                    "lastUpdate": 1520378729000,
                                    "name": "Home"
                                }
                            }
                        ]
                    },
                    {
                        "organizationRoleCn": "508FE2AC-F8B3-448C-9B6D-83A50062091B",
                        "effectiveDate": 1523944800000,
                        "givenName": "Castorr",
                        "lastUpdate": 1524009823000,
                        "middleName": "A",
                        "prefix": "Mr",
                        "surname": "Witt",
                        "url": "www.jkldjfd.com",
                        "orgRoleType": {
                            "orgRoleTypeCn": "66D9C22DCCC1EBD0E054A0369F38EE9B",
                            "code": "Person",
                            "effectiveDate": 946710000000,
                            "label": "Person",
                            "lastUpdate": 1521125457000,
                            "orgLevelInd": "Y",
                            "name": "Person"
                        },
                        "orgRoleAddresses": [],
                        "orgRoleEmails": [
                            {
                                "orgRoleEmailCn": "149750EB-544B-44D1-9FE5-85CA6CC682C4",
                                "effectiveDate": 1523944800000,
                                "email": "ziti@mailinator.com",
                                "lastUpdate": 1524009824000,
                                "orgRoleEmailType": {
                                    "orgRoleEmailTypeCn": "66BFFF8FF7321710E054A0369F38EE9B",
                                    "code": "Primary",
                                    "effectiveDate": 946710000000,
                                    "label": "Primary",
                                    "lastUpdate": 1520375321000,
                                    "name": "Primary"
                                },
                                "primaryEmailInd": "Y"
                            }
                        ],
                        "orgRolePhoneNumbers": [
                            {
                                "orgRolePhoneNumberCn": "96C4ED99-1DBD-4A16-A3BE-956D2A8B6957",
                                "extension": "121",
                                "lastUpdate": 1524009824000,
                                "phoneNumber": "878-48-5778",
                                "primaryPhoneNumberInd": "Y",
                                "orgRolePhoneNbrType": {
                                    "orgRolePhoneNbrTypeCn": "66BFFF8FF79C1710E054A0369F38EE9B",
                                    "code": "Main",
                                    "effectiveDate": 1483254000000,
                                    "label": "Main",
                                    "lastUpdate": 1520378729000,
                                    "name": "Main"
                                }
                            }
                        ]
                    }
                ]
            }
        },

        convertContactToUiFormatForEdit: function(modelJson){

            if(!modelJson){
                modelJson = this.model.toJSON();
            }
            var uiContact = {};
            var self = this;

            uiContact.formType = modelJson.orgType.code;
            uiContact.person = getPerson();
            uiContact.personInfos = getPersonInfos();
            uiContact.email = getEmail();
            uiContact.name = modelJson.name;
            uiContact.respPersonName = getRespPersonName();
            uiContact.orgRoleUrl = getOrgRoleUrl();
            uiContact.phoneNumbers = getPhoneNumbers();
            uiContact.addresses = getAddresses();

            function getOrgRoleUrl(){
                var orgRoleForUrl = getOrgRoleByRoleCode('URL');
                if(orgRoleForUrl){
                    return orgRoleForUrl.url;
                }
            }

            function getPersonInfos(){
                if(isSinglePersonTypeForm()){
                    return
                }

                var multiPersonRoleCodes = ['Person', 'Spouse'];
                var personInfos = _.filter(modelJson.organizationRoles, function(each){
                    return _.contains(multiPersonRoleCodes, each.orgRoleType.code);
                });

                return personInfos;
            }

            function getRespPersonName(){
                var respPersonName;
                var orgRoleForRespPerson;

                var orgRoleTypesForRespPerson = ['Trustee', 'Agent'];
                orgRoleTypesForRespPerson.every(function(code){
                    if(!orgRoleForRespPerson){
                        orgRoleForRespPerson = getOrgRoleByRoleCode(code);
                    }
                });

                if(orgRoleForRespPerson){
                    respPersonName = orgRoleForRespPerson.name;
                }

                return respPersonName;
            }

            function getAddresses(){
                var addresses = [];

                var orgRolesOfAddressTypes = _.filter(modelJson.organizationRoles, function(each){
                    return each.orgRoleType.orgLevelInd == 'N';
                });

                var eachAddress;
                _.each(orgRolesOfAddressTypes, function(each){
                    var addressType = each.orgRoleType.code;
                    var addressFName = each.givenName;
                    var addressLName = each.surname;
                    var name = each.name;

                    var orgRoleAddress = each.orgRoleAddresses[0];

                    var country;// come back later
                    var postalCode = orgRoleAddress.postalCode;
                    var addressLine1 = orgRoleAddress.addressLine1;
                    var addressLine2 = orgRoleAddress.addressLine2;
                    var city = orgRoleAddress.city;
                    var state;
                    if(orgRoleAddress.countryRegion){
                        state = orgRoleAddress.countryRegion.countryRegionCn;
                    }
                    var countryRegion = orgRoleAddress.countryRegion;

                    eachAddress = {
                        addressType: addressType,
                        name: name,
                        addressFName: addressFName,
                        addressLName: addressLName,
                        postalCode: postalCode,
                        addressLine1: addressLine1,
                        addressLine2: addressLine2,
                        country: country,
                        city: city,
                        state: state,
                        countryRegion: countryRegion
                    }

                    $.extend(eachAddress, orgRoleAddress);

                    addresses.push(eachAddress);
                });

                return addresses;
            }

            function getPhoneNumbers(){
                var phoneNums;

                var orgRoleForPhone = getOrgRoleByRoleCode('Phone');

                if(orgRoleForPhone){
                    phoneNums = orgRoleForPhone.orgRolePhoneNumbers;
                }

                return phoneNums;
            }

            function getEmail(){
                var email;

                var orgRoleForEmail = getOrgRoleByRoleCode('Email');
                if(orgRoleForEmail && orgRoleForEmail.orgRoleEmails.length){
                    email = orgRoleForEmail.orgRoleEmails[0].email;
                }

                return email;
            }

            function getPerson(){
                if(!isSinglePersonTypeForm()){
                    return
                }

                var person;

                var orgRolePerson = getOrgRoleByRoleCode('Person');

                if(orgRolePerson){
                    person = _.pick(orgRolePerson, 'givenName', 'surname', 'middleName', 'prefix', 'suffix');

                    var orgRoleUrl = getOrgRoleByRoleCode('URL')
                    if(orgRoleUrl){
                        person.personalUrl = orgRoleUrl.url;
                    }
                }

                return person;
            }

            function isSinglePersonTypeForm() {
                var formType = uiContact.formType;
                var singlePersonType;

                switch(formType){
                    case 'Person':
                    case 'SolePropr':
                    case 'Trust':
                        singlePersonType = true;
                        break;
                    default:
                        singlePersonType = false;
                }

                return singlePersonType;
            }

            function getOrgRoleByRoleCode(code){
                return _.find(modelJson.organizationRoles, function(each){
                    return each.orgRoleType.code == code;
                });
            }

            uiContact = $.extend({},modelJson,uiContact);


            return uiContact;

        },

        initializeFormFields: function(){
            this.phoneNumbers = [];
            this.contactAddress = [];
            this.requiredAddressProps = ["addressType", "addressLine1", "city", "country", "postalCode", "state"];
            this.requiredPhoneProps = [/*"intlCode",*/"phoneNumber", "orgRolePhoneNbrTypeCn"];

            this.personAndTelephoneFieldSetCtrls = [];
            this.listOfPersonInfos = [];

            this.model.set('formType', this.formType, {silent: true});
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
                    address.surname = address.addressLName
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
                /*this.removeErrors();*/
                //this.useGlobalErrorNotification = true;
                this.showErrors(false);
            }
        },

        validateForm: function () {

        },

        addPhoneOrUpdatePhoneNumbers: function (event) {
            this.updateErrorList = false;
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
           var notify = false;

           this.model.set('valTypes', ['phone'], {silent: true});

           if(event){
               this.model.set('eventType', 'addPhone', {silent: true});
               notify = true;
               this.removeErrors();
           }



          var validate;
           if (this.updateErrorList){
               validate = this.showErrors(false)
           }else{
                validate = this.validate(notify)
           }

            var dfd = new $.Deferred();

            $.when(validate).done(_.bind(function (valid) {
                var phoneNumber = this.model.get('telephone');

                if (valid) {
                    if(!_.isEmpty(phoneNumber)){
                        if (this.currentEditPhoneNumIndex) {
                            this.phoneNumbers.splice(this.currentEditPhoneNumIndex, 1, phoneNumber);
                            this.currentEditPhoneNumIndex = null;
                        } else {
                            this.phoneNumbers.push(phoneNumber)
                        }



                        this.setTelePhoneModel({});
                        this.resetModelBindings("telephone");
                        this.populatePhoneNumbers();
                    }

                    dfd.resolve(true);
                } else {
                    this.updateErrorList = true;
                    //this.showErrors(false)
                    dfd.reject(false);
                }
            }, this));
            /* } else {
                this.removeValidSectionsFromValidationList("TelephoneSection");
                dfd.resolve(true);
            }*/

            this.model.unset('eventType', {silent: true});

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
            this.model.set("telephone", obj, {silent: true});
        },

        addOrUpdateAddress: function (event) {
            var dfd = new $.Deferred();
            var notify = false;
            this.updateErrorList = false;
            this.model.set('valTypes', ['address'], {silent: true});

            if(event){
                this.model.set('eventType', 'addAddress', {silent: true});
                notify = true;
                this.removeErrors();
            }

            $.when(this.validate(notify)).done(_.bind(function (valid) {
                var address = this.model.get("address");

                if (valid) {
                    if(address && address.addressLine1){
                        if (this.currentEditAddressIndex) {
                            this.contactAddress.splice(this.currentEditAddressIndex, 1, address);
                            this.currentEditAddressIndex = null;
                        } else {
                            this.contactAddress.push(address);
                        }


                        this.setAddressModel({});

                        this.resetModelBindings("address");
                        this.populateAddress();
                    }

                    dfd.resolve(true);
                } else {
                    this.updateErrorList = true;
                    dfd.reject(false);
                }

            }, this));
        /*} else {
            this.removeValidSectionsFromValidationList("AddressSection");
            dfd.resolve();
        }*/
            this.model.unset('eventType', {silent: true});

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

            this.model.set("address", obj, {silent: true});
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
            this.model.set('phoneNumbers', this.phoneNumbers); // set it for validation
            var html = ContactFormAddedNumPill(this)
            $('.formPhoneNumbers', this.$el).html(html)
        },

        populateAddress: function () {
            this.model.set('addresses', this.contactAddress);
            var html = ContactFormAddressPill(this)
            $('.addresses', this.$el).html(html)
        },

        navigateToContactForm: function (event) {
            //var contactFormUrl  = this.getContactFormURL();
            //Nrm.app.navigateUrl(contactFormUrl, {trigger: true, replace: true});
        },

        getContactContentSectionControls: function () {
            //will be overridden by other addNewContactViews
        },

        updateConfigControls: function(controls){
            //will be overridden by other addNewContactViews
        },

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
                    type: 'inputText',
                    nameAttr: 'intlCode',
                    label: "Int'l Code",
                    placeholder: '011',
                    inputType:"tel",
                    maxlength: "3",
                    size: "3",
                    prop: 'intlCode',
                    className: 'suds-input form-control numberInput telephoneAttrs',
                }]
            }, {
                id: 'phoneNumberContainer',
                type: 'contacts/inputContainer',
                containerClass: 'vert',
                controls: [{
                    id: 'phoneNumber',
                    type: 'inputText',
                    nameAttr: 'phoneNumber',
                    label: 'Phone Number',
                    placeholder: '555-555-5555',
                    prop: 'phoneNumber',
                    inputType:"tel",
                    'removeFormGroup': true,
                    //nested:'telephone',
                    maxlength: "15",
                    className: 'suds-input form-control numberInput phoneNumberInput telephoneAttrs'
                }]
            }, {
                id: 'extContainer',
                type: 'contacts/inputContainer',
                containerClass: 'vert notReq',
                controls: [{
                    id: 'extension',
                    type: 'inputText',
                    nameAttr: 'extension',
                    label: 'Extension',
                    placeholder: '55555',
                    prop: 'extension',
                    inputType:"tel",
                    maxlength: "6",
                    size: "6",
                    //nested:'telephone',
                    className: 'suds-input form-control numberInput telephoneAttrs'
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
                    nameAttr: 'name',
                    label: 'Business/Department Name',
                    placeholder: 'Business/Department Name',
                    prop: 'name',
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

                    this.updateForEdit();

                }
            });

        },

        updateForEdit: function(){

            this.setExistingPhones();
            this.setExistingAddresses();
            this.setExistingPersons();

            // will be overridden by editContactViews
        },

        setExistingPhones: function(){
            var phoneNos = this.model.get('phoneNumbers');
            if(phoneNos){
                this.phoneNumbers = phoneNos;
                this.populatePhoneNumbers();
            }

        },

        setExistingAddresses: function(){
            var addresses = this.model.get('addresses');
            if(addresses){
                this.contactAddress = addresses;
                this.populateAddress();
            }
        },

        setExistingPersons: function(){


            var listOfPersonInfo = this.model.get('personInfos');
            if(listOfPersonInfo){
                this.listOfPersonInfos = listOfPersonInfo;

                if (this.populatePersons){
                    this.populatePersons();
                }

            }
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
                    required = true;
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

            this.removeErrors();

            var dfd1 = this.addOrUpdateAddress();
            var dfd2 = this.addPhoneOrUpdatePhoneNumbers();


            $.when(dfd1, dfd2).done(_.bind(function (isAddressValid, isPhoneValid) {
                if (isAddressValid && isPhoneValid) {

                    var formType = this.formType;
                    var orgRoleTypesForCurrentFormType = this.getOrgRoleTypesForCurrentFormType();

                    var orgModel = this.config.orgModel;
                    var initialOrg = $.extend({}, orgModel.toJSON());
                    var initialOrgRoles = initialOrg.organizationRoles;

                    var self = this;
                    _.each(orgRoleTypesForCurrentFormType, function (orgRoleType) {
                        self.updateOrganizationRolesIfNeeded(initialOrgRoles, orgRoleType);
                    });

                    var toBeSetOrg;
                    var existingOrgRoles = this.model.get('organizationRoles');
                    if(existingOrgRoles){
                        toBeSetOrg = {
                            id: this.model.get('organizationCn'),
                            organizationRoles: existingOrgRoles
                        };
                    }else{
                        toBeSetOrg = initialOrg;
                        toBeSetOrg = _.omit(toBeSetOrg, "id");
                    }

                    this.model.set(toBeSetOrg);
                }
            }, this))

            //they are kept out of 'when' function above to be able to see all validation errors if any
            this.setValTypes();
            this.trigger("save");
        },

        setValTypes: function(){
            var formType = this.formType;
            var valTypes;

            switch(formType){
                case 'Person':
                    valTypes = ['person', 'phone', 'address'];
                    break;
                case 'SolePropr':
                case 'Trust':
                    valTypes = ['person', 'phone', 'address', 'org'];
                    break;
                case 'Married':
                    valTypes = ['address'];
                    break;
                case 'Assocatn':
                case 'Partner':
                case 'Corp':
                case 'LLC':
                    valTypes = ['address', 'org'];
                    break;
                case 'FedGovt':
                case 'Tribal':
                case 'StateGvt':
                case 'LocalGvt':
                case 'FrgnGovt':
                    valTypes = ['address'];

            }

            if(valTypes){
                this.model.set('valTypes', valTypes, {silent: true});
            }
        },

        updateOrganizationRolesIfNeeded: function (initialOrgRoles, orgRoleType) {
            var existingOrgRoles = this.model.get('organizationRoles');
            var self = this;

            var orgRole = this.findOrgRole(initialOrgRoles, orgRoleType);
            if (orgRole) {
                var userInput = this.getFieldValuesForThisOrgRole(orgRoleType);
                var existingOrgRole;

                if(userInput){
                    if (userInput && _.isArray(userInput)) {
                        var firstElement = userInput[0];
                        existingOrgRole = getExistingOrgRole(firstElement, orgRoleType);

                        if(existingOrgRole){
                            $.extend(existingOrgRole, getUpdatedExistingOrgRole(firstElement, existingOrgRole));
                        }else{
                            $.extend(orgRole, firstElement);
                        }

                        userInput.splice(0, 1);

                        var newOrgRole;
                        _.each(userInput, function (each) {
                            existingOrgRole = getExistingOrgRole(each, orgRoleType);

                            if(existingOrgRole){
                                $.extend(existingOrgRole, getUpdatedExistingOrgRole(each, existingOrgRole));
                            }else{
                                newOrgRole = $.extend({}, orgRole, each);

                                if(existingOrgRoles){
                                    existingOrgRoles.push(newOrgRole);
                                }else{
                                    initialOrgRoles.push(newOrgRole);
                                }

                            }
                        });
                    } else {
                        if(existingOrgRoles){
                            existingOrgRole = getExistingOrgRole(userInput, orgRoleType);
                            $.extend(existingOrgRole, getUpdatedExistingOrgRole(userInput, existingOrgRole));
                        }else{
                            $.extend(orgRole, userInput);
                        }
                    }
                }
            }

            function getUpdatedExistingOrgRole(userInput, existingOrgRole ){

                // Email, Person, Phone, Billing
                if(userInput.orgRoleEmails && userInput.orgRoleEmails.length > 0){
                    if(existingOrgRole.orgRoleEmails && existingOrgRole.orgRoleEmails.length > 0){
                        $.extend(existingOrgRole.orgRoleEmails[0], userInput.orgRoleEmails[0]); // for now we have only one email per person even though database allows multiple
                    }else{
                        existingOrgRole.orgRoleEmails = userInput.orgRoleEmails;
                    }
                }else{
                    existingOrgRole = _.omit(existingOrgRole, 'orgRoleEmails');// come back later
                }

               // Phone and address already deeply binded (check convertContactToUiFormatForEdit -> setAddresses and setPhoneNumbers
               /* if(userInput.orgRolePhoneNumbers && userInput.orgRolePhoneNumbers.length > 0){
                    if(existingOrgRole.orgRolePhoneNumbers && existingOrgRole.orgRolePhoneNumbers.length > 0){
                        _.each(userInput.orgRolePhoneNumbers, function(eachPhone1){
                            var orgPhoneCn = eachPhone1.orgRolePhoneNumberCn;
                            if(orgPhoneCn){
                                var existingOrgPhone = _.find(existingOrgRole.orgRolePhoneNumbers, function(eachPhone2){
                                    return eachPhone2.orgRolePhoneNumberCn = orgPhoneCn;
                                });

                                // this must exist, so we might not need 'if'
                                if(existingOrgPhone){
                                    $.extend(existingOrgPhone, eachPhone1);
                                }
                            }else{
                                existingOrgRole.orgRolePhoneNumbers.push(eachPhone1);
                            }
                        });

                    }else{
                        existingOrgRole.orgRolePhoneNumbers = userInput.orgRolePhoneNumbers;
                    }
                }else{
                    existingOrgRole = _.omit(existingOrgRole, 'orgRolePhoneNumbers');// come back later
                }

                if(userInput.orgRoleAddresses && userInput.orgRoleAddresses.length > 0){
                    if(existingOrgRole.orgRoleAddresses && existingOrgRole.orgRoleAddresses.length > 0){
                        $.extend(existingOrgRole.orgRoleAddresses[0], userInput.orgRoleAddresses[0]); // for now we have at most one address per role even though database allows multiple
                    }else{
                        existingOrgRole.orgRoleAddresses = userInput.orgRoleAddresses;
                    }
                }else{
                    existingOrgRole = _.omit(existingOrgRole, 'orgRoleAddresses');// come back later
                }
*/

               var orgRoleLevelProps = _.pick(userInput, 'organizationRoleCn', 'givenName', 'middleName', 'name', 'prefix', 'remarks', 'suffix', 'surname', 'url');

               if(orgRoleLevelProps){
                   $.extend(existingOrgRole, orgRoleLevelProps);
               }

               return existingOrgRole;
            }

            function getExistingOrgRole(userInput, orgRoleType){
                var existingOrgRole;
                var orgRoleCn = userInput.organizationRoleCn;
                if(orgRoleCn){
                    existingOrgRole = _.find(existingOrgRoles, function(each){
                        return each.organizationRoleCn == orgRoleCn;
                    });
                }else{
                    existingOrgRole = _.find(existingOrgRoles, function(each){
                        return each.orgRoleType.code == orgRoleType;
                    });
                }

                return existingOrgRole;
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
                    if(email){
                        userInput = {
                            "orgRoleEmails": [
                                {
                                    "email": email,
                                    "primaryEmailInd": "Y"
                                }
                            ]
                        };
                    }

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
                    userInput = {
                        'orgRolePhoneNumbers': this.phoneNumbers
                    }

                    break;

                case 'Billing':
                    var addressList = this.contactAddress;
                    var billingAddressAttrs = addressList && _.find(addressList, function (item) {
                            return item.addressType === "Billing"
                        });
                    if (billingAddressAttrs){
                        var addresses = []; // in database there is one to many relation. Might have to change to one to one
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

            if(userInput){
                if(!_.isArray(userInput)){
                    userInput = $.extend({}, userInput);
                }
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
                case 'FedGovt':
                case 'StateGvt':
                case 'Tribal':
                case 'LocalGvt':
                case 'FrgnGovt':
                    orgRoleTypes = ['Billing', 'Person'];
                    break;
            }

            return orgRoleTypes;
        }

    });
});