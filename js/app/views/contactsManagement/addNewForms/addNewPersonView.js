define(['nrm-ui/views/panelView', "jquery",
    "nrm-ui", "underscore", "require", "backbone",
    "hbs!contacts/contactFormAddedNumPill",
    "hbs!contacts/contactFormAddressPill",
    "app/views/contactsManagement/addNewForms/addNewContactView"], function (PanelView, $, Nrm, _, require,
                                                   Backbone, ContactFormAddedNumPill, ContactFormAddressPill, AddNewContactView) {

    return AddNewContactView.extend({

        getContactContentSectionControls: function () {
            var controls = [];
            var self =this;
            controls [0] = this.getFieldSetControl("personalInfo", "fs-horizontal", this.personalInfoPanelControls());
            controls [1] = this.getFieldSetControl("phone", "phone", this.phoneInfoPanelControls());
            controls [2] = this.getFieldSetControl("address", "address", this.addressInfoPanelControls(self));
            controls [3] = this.getFieldSetControl("comments", "comments", this.getSingleInputFieldSetControls('comments'));
            controls [4] = this.formControls();//save and reset Controls

            return controls;
        },

        setModelId: function(){
            this.model.set('id', '69CD9C63-A0D2-4656-9D8C-DBCCBC71C8DE', {silent: true});
        },

        setHardCodedMidtierContact: function(){
            this.midtierContact = {
                "organizationCn": "69CD9C63-A0D2-4656-9D8C-DBCCBC71C8DE",
                "lastUpdate": 1523922924000,
                "name": "fdsafda fdasfsa",
                "orgType": {
                    "orgTypeCn": "66BFFF8FF7C21710E054A0369F38EE9B",
                    "code": "Person",
                    "effectiveDate": 946710000000,
                    "governmentInd": "N",
                    "label": "Person",
                    "lastUpdate": 1521060494000,
                    "name": "Person"
                },
                "organizationRoles": [
                    {
                        "organizationRoleCn": "19948C5F-2708-4A49-8816-AD43EA871407",
                        "effectiveDate": 1523858400000,
                        "lastUpdate": 1523922924000,
                        "url": "www.url.com",
                        "orgRoleType": {
                            "orgRoleTypeCn": "6765A7E1E4E46E4EE054A0369F38EE9B",
                            "code": "URL",
                            "effectiveDate": 946710000000,
                            "label": "URL",
                            "lastUpdate": 1522167887000,
                            "orgLevelInd": "Y",
                            "name": "URL"
                        },
                        "orgRoleAddresses": [],
                        "orgRoleEmails": [],
                        "orgRolePhoneNumbers": []
                    },
                    {
                        "organizationRoleCn": "48C4C1BA-256A-4830-A156-62E46C58DA52",
                        "effectiveDate": 1523858400000,
                        "givenName": "fdsafda",
                        "lastUpdate": 1523922924000,
                        "middleName": "G",
                        "prefix": "Mr",
                        "suffix": "Jr",
                        "surname": "fdasfsa",
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
                        "orgRoleEmails": [],
                        "orgRolePhoneNumbers": []
                    },
                    {
                        "organizationRoleCn": "937FEA84-B4D3-44EB-8B65-4A582182D201",
                        "effectiveDate": 1523858400000,
                        "lastUpdate": 1523922924000,
                        "name": "Dept Name",
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
                                "orgRoleAddressCn": "5211F601-ABE8-4082-BE73-8594BB08569E",
                                "addressLine1": "dasdasf",
                                "addressLine2": "fdsaf",
                                "city": "dsafasda",
                                "lastUpdate": 1523922924000,
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
                    },
                    {
                        "organizationRoleCn": "28DA10AE-6965-4443-A4A0-AB31812BBAAC",
                        "effectiveDate": 1523858400000,
                        "lastUpdate": 1523922924000,
                        "orgRoleType": {
                            "orgRoleTypeCn": "66D9C22DCCC2EBD0E054A0369F38EE9B",
                            "code": "Phone",
                            "effectiveDate": 946710000000,
                            "label": "Phone",
                            "lastUpdate": 1521125457000,
                            "orgLevelInd": "Y",
                            "name": "Phone"
                        },
                        "orgRoleAddresses": [],
                        "orgRoleEmails": [],
                        "orgRolePhoneNumbers": [
                            {
                                "orgRolePhoneNumberCn": "82BCA4C3-27B8-49AD-9AE3-523B37B1CD56",
                                "extension": "2121",
                                "lastUpdate": 1523922924000,
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
                            },
                            {
                                "orgRolePhoneNumberCn": "719164A9-FE30-44D1-8178-89B3F67D03BB",
                                "extension": "1211",
                                "lastUpdate": 1523922924000,
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
                            }
                        ]
                    },
                    {
                        "organizationRoleCn": "A461004A-C67C-49AF-8868-49094FBAA67F",
                        "effectiveDate": 1523858400000,
                        "lastUpdate": 1523922924000,
                        "orgRoleType": {
                            "orgRoleTypeCn": "66D9C22DCCBEEBD0E054A0369F38EE9B",
                            "code": "Email",
                            "effectiveDate": 946710000000,
                            "label": "Email",
                            "lastUpdate": 1521125457000,
                            "orgLevelInd": "Y",
                            "name": "Email"
                        },
                        "orgRoleAddresses": [],
                        "orgRoleEmails": [
                            {
                                "orgRoleEmailCn": "7FED43E9-68F9-43FD-97A8-724A93D0D248",
                                "effectiveDate": 1523858400000,
                                "email": "dsadfa@gmail.com",
                                "lastUpdate": 1523922924000,
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
                        "orgRolePhoneNumbers": []
                    }
                ]
            }
        }

    });
});