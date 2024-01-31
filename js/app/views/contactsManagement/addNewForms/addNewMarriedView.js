define(['nrm-ui/views/panelView', "jquery",
    "nrm-ui", "underscore", "require", "app/views/contactsManagement/addNewForms/addNewContactView","hbs!contacts/contactFormAddedPersonsPill"],
            function (PanelView, $, Nrm, _, require, AddNewContactView,ContactFormAddedPersonsPill) {

    return AddNewContactView.extend({

        getContactContentSectionControls: function () {
            var controls = [];

            controls [0] = this.getFieldSetControl("persons", "personsContainer", this.addNewPersonFieldsetControls());
            controls [1] = this.getFieldSetControl("address", "address", this.addressInfoPanelControls(self));
            controls [2] = this.getFieldSetControl("comments", "comments", this.getSingleInputFieldSetControls('comments'));
            controls [3] = this.formControls();//save and reset Controls

            var personInfoControls = this.getFieldSetControl("personalInfo", "fs-horizontal", this.personalInfoPanelControls());
            var phoneControls = this.getFieldSetControl("phone", "phone", this.phoneInfoPanelControls());

            Array.prototype.push.apply(this.personAndTelephoneFieldSetCtrls, [personInfoControls, phoneControls]);

            return controls;
        },

        setModelId: function(){
            this.model.set('id', 'EBA3368E-7E9C-4AB8-A37B-9C6D36B8FD6E', {silent: true});
        },

        setHardCodedMidtierContact: function(){
            this.midtierContact = {
                "organizationCn": "31A0DBE4-7DC4-4B96-814C-052287DFE284",
                "lastUpdate": 1524000377000,
                "name": "fdsafda fdasfsa jkdhsal hdfjasl ",
                "orgType": {
                    "orgTypeCn": "66BFFF8FF4D71710E054A0369F38EE9B",
                    "code": "Married",
                    "description": "Property owned in common by a husband and wife, which is not separate property.  A classification of property peculiar to specific states. (RED)",
                    "effectiveDate": 946710000000,
                    "governmentInd": "N",
                    "label": "Married Couple",
                    "lastUpdate": 1521064633000,
                    "legacyCode": "MARRIED, COMMON PROPERTY",
                    "name": "Married Couple"
                },
                "organizationRoles": [
                    {
                        "organizationRoleCn": "0C3665FE-8D8D-4B00-A97F-A92B923415D2",
                        "effectiveDate": 1523944800000,
                        "givenName": "fdsafda",
                        "lastUpdate": 1524000377000,
                        "middleName": "G",
                        "prefix": "Mr",
                        "suffix": "Jr",
                        "surname": "fdasfsa",
                        "url": "www.url.com",
                        "orgRoleType": {
                            "orgRoleTypeCn": "66D9C22DCCC3EBD0E054A0369F38EE9B",
                            "code": "Spouse",
                            "effectiveDate": 946710000000,
                            "label": "Spouse",
                            "lastUpdate": 1521125457000,
                            "orgLevelInd": "Y",
                            "name": "Spouse"
                        },
                        "orgRoleAddresses": [],
                        "orgRoleEmails": [
                            {
                                "orgRoleEmailCn": "611AF998-C7E8-4F15-A4FC-06A7A9EF4610",
                                "effectiveDate": 1523944800000,
                                "email": "dsadfa@gmail.com",
                                "lastUpdate": 1524000378000,
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
                                "orgRolePhoneNumberCn": "E093C448-537C-4FE1-A4DE-F64BED741FE3",
                                "extension": "1211",
                                "lastUpdate": 1524000378000,
                                "phoneNumber": "112-121-2111",
                                "primaryPhoneNumberInd": "Y",
                                "orgRolePhoneNbrType": {
                                    "orgRolePhoneNbrTypeCn": "66BFFF8FF79C1710E054A0369F38EE9B",
                                    "code": "Main",
                                    "effectiveDate": 1483254000000,
                                    "label": "Main",
                                    "lastUpdate": 1520378729000,
                                    "name": "Main"
                                }
                            },
                            {
                                "orgRolePhoneNumberCn": "A7FF66D0-BEFF-4E36-A1BB-15737279783D",
                                "lastUpdate": 1524000378000,
                                "phoneNumber": "232-32323232",
                                "primaryPhoneNumberInd": "Y",
                                "orgRolePhoneNbrType": {
                                    "orgRolePhoneNbrTypeCn": "66BFFF8FF79B1710E054A0369F38EE9B",
                                    "code": "Home",
                                    "effectiveDate": 1483254000000,
                                    "label": "Home",
                                    "lastUpdate": 1520378729000,
                                    "name": "Home"
                                }
                            },
                            {
                                "orgRolePhoneNumberCn": "668DF1C5-747E-4EE1-B2D6-ABF939EE71FD",
                                "extension": "2121",
                                "lastUpdate": 1524000379000,
                                "phoneNumber": "121-2121",
                                "primaryPhoneNumberInd": "Y",
                                "orgRolePhoneNbrType": {
                                    "orgRolePhoneNbrTypeCn": "66BFFF8FF79A1710E054A0369F38EE9B",
                                    "code": "Fax",
                                    "effectiveDate": 1483254000000,
                                    "label": "Fax",
                                    "lastUpdate": 1520378729000,
                                    "name": "Fax"
                                }
                            }
                        ]
                    },
                    {
                        "organizationRoleCn": "F7B0D26E-D348-4F82-9787-8B51D92F7D7E",
                        "effectiveDate": 1523944800000,
                        "givenName": "jkdhsal",
                        "lastUpdate": 1524000377000,
                        "middleName": "G",
                        "prefix": "Mr",
                        "suffix": "Jr",
                        "surname": "hdfjasl",
                        "url": "www.url.com",
                        "orgRoleType": {
                            "orgRoleTypeCn": "66D9C22DCCC3EBD0E054A0369F38EE9B",
                            "code": "Spouse",
                            "effectiveDate": 946710000000,
                            "label": "Spouse",
                            "lastUpdate": 1521125457000,
                            "orgLevelInd": "Y",
                            "name": "Spouse"
                        },
                        "orgRoleAddresses": [],
                        "orgRoleEmails": [
                            {
                                "orgRoleEmailCn": "0EC1D456-7F9F-4D20-8DB7-A818286F369A",
                                "effectiveDate": 1523944800000,
                                "email": "hfdjk@gmail.com",
                                "lastUpdate": 1524000378000,
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
                                "orgRolePhoneNumberCn": "1A6010BD-DE99-4689-B4DF-B9787CD0566F",
                                "lastUpdate": 1524000378000,
                                "phoneNumber": "121-21212121",
                                "primaryPhoneNumberInd": "Y",
                                "orgRolePhoneNbrType": {
                                    "orgRolePhoneNbrTypeCn": "66BFFF8FF79A1710E054A0369F38EE9B",
                                    "code": "Fax",
                                    "effectiveDate": 1483254000000,
                                    "label": "Fax",
                                    "lastUpdate": 1520378729000,
                                    "name": "Fax"
                                }
                            }
                        ]
                    },
                    {
                        "organizationRoleCn": "4E12F830-A759-464E-BD9B-086842D449D4",
                        "effectiveDate": 1523944800000,
                        "givenName": "fdsafsa",
                        "lastUpdate": 1524000378000,
                        "surname": "fdsafsa",
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
                                "orgRoleAddressCn": "14A3ABEA-8023-4286-9D7A-4409EE770D6E",
                                "addressLine1": "dasdasf",
                                "addressLine2": "fdsaf",
                                "city": "dsafasda",
                                "lastUpdate": 1524000378000,
                                "postalCode": "121212",
                                "countryRegion": {
                                    "countryRegionCn": "664AF62775C0E836E054A0369F38EE9B",
                                    "code": "NB",
                                    "effectiveDate": 946710000000,
                                    "lastUpdate": 1519848012000,
                                    "legacyCn": "664AF62775C1E836E054A0369F38EE9B",
                                    "name": "New Brunswick"
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
                    }
                ]
            }
        },

        modelEvents: $.extend({}, AddNewContactView.prototype.modelEvents, {}),

        events: $.extend({}, AddNewContactView.prototype.events, AddNewContactView.prototype.changeEvents, {
            'click .addNewPersonBtn' : "addPersonModal",
            "click .closeHalfModal" : "closeHalfModal",
            "click #addThisPersonBtn" : "addOrUpdatePersonToContactForm",
            "click .editPerson" : "editThisPersonInfo",
            "click .removePerson" : "removeThisPerson"
        }),


        addOrUpdatePersonToContactForm : function () {
            this.model.set('valTypes', ['person', 'phone']);

           $.when(this.validate(true)).done(_.bind(function (valid) {

               if(valid){
                   var phoneNumber = this.model.get('telephone');
                   if (phoneNumber && !_.isEmpty(phoneNumber) &&  phoneNumber.orgRolePhoneNbrTypeCn != ' ' ){
                       this.addPhoneOrUpdatePhoneNumbers();
                   }

                   var person  = this.model.get("person");
                   var telephoneList  = this.phoneNumbers
                   var personInfo = $.extend({},person,{
                       "orgRolePhoneNumbers" : telephoneList
                   },{
                       url:person.personalUrl
                   });

                   if(this.model.get('email')){
                       personInfo = $.extend(personInfo, {
                           "orgRoleEmails": [
                               {
                                   "email": this.model.get("email"),
                                   "primaryEmailInd": "Y"
                               }
                           ]
                       });
                   }

                   if (this.currentEditPersonInfoIndex){
                       this.listOfPersonInfos.splice(this.currentEditPersonInfoIndex,1,personInfo);
                       this.currentEditPersonInfoIndex = null;
                   }else{
                       this.listOfPersonInfos.push(personInfo);
                   }

                   this.closeHalfModal();
                   this.populatePersons();
               }

           },this));

        },

        editThisPersonInfo : function (event) {
            var $target = $(event.target)
            var index = this.currentEditPersonInfoIndex = $target.attr("id") || $target.parent().closest('button').attr("id");

            if (index){
                var personInfo = this.listOfPersonInfos[index];
                var person = _.omit(personInfo,'orgRolePhoneNumbers','orgRoleEmails');
                var emails = personInfo.orgRoleEmails
                this.model.set("person",person);
                this.phoneNumbers = personInfo.orgRolePhoneNumbers;
                this.model.set("email",emails && emails[0].email);

                this.addPersonModal();
                this.populatePhoneNumbers();

                $("#addThisPersonBtn",this.$el).text("Update Person Info");
            }
        },
        removeThisPerson : function (event) {
            var $target = $(event.target)
            var index = $target.attr("id") || $target.parent().closest('button').attr("id");

            if (index){
                this.listOfPersonInfos.splice(index,1);
                this.populatePersons();
            }

        },

        addPersonModal : function (event) {

            var stepView = {
                    id: 'createPersonForm',
                    config: {
                        /* the control config is defined under individual views*/
                        controls: this.personAndTelephoneFieldSetCtrls
                    },
                    view: 'app/views/contactsManagement/halfModal/createPersonFormView'

                };

            var $stepPanel = $('.' + "renderHalfModalsForms",this.$el);

            $.when(PanelView.prototype.renderPanel.call(this, stepView, $stepPanel)).done(_.bind(function(view) {


            }, this));
        },

        closeHalfModal : function () {
            //once we add the listOfPhoneNumber to list of persons we can empty the list
            this.phoneNumbers = [];
            //also in this kind of forms we need to clear
            this.model.unset("person");
            this.model.unset("email");

            $(".personHalfModal",this.$el).removeClass("open")
        },
        addNewPersonFieldsetControls :function () {

            var controls = [{
                id:'addNewPersonContainer',
                type: 'common/ctrlsIterator',

            },{
                id:'addNewPersonContainer',
                type: 'contacts/addNewPersonFieldSetContainer',

            }]

            return controls;
        },

        populatePersons : function () {

            var self = this;
            this.model.set('personInfos', this.listOfPersonInfos, {silent: true});
            if (this.listOfPersonInfos && this.listOfPersonInfos.length){
                var html = ContactFormAddedPersonsPill(this);
                $(".noPeopleAdded",this.$el).hide();

                $(".personCardsContainer",this.$el).show(function () {
                    $(this).html(html)

                    if (self.contactView){
                        $(".pillDataPointControls",self.$el).hide();
                    }

                });
            }else{
                $(".noPeopleAdded",this.$el).show();
                $(".personCardsContainer",this.$el).hide();
            }

        },


        onSave : function () {

            if(this.formType == 'Married'){
                if (this.listOfPersonInfos.length < 2) {
                    Nrm.event.trigger("app:modal", ( {
                        "text": "Please make sure at least 2 persons are added. ",
                        "caption": "Upload Failed!"
                    }));
                    return false;
                }
            }

            return AddNewContactView.prototype.onSave.apply(this,arguments);
        }
    });
});