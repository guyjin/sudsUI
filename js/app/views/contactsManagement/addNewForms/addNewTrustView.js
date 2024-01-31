define(['nrm-ui/views/panelView', "jquery",
    "nrm-ui","underscore","require",
    "app/views/contactsManagement/addNewForms/addNewContactView"], function(PanelView, $, Nrm, _,require, AddNewContactView) {

    return AddNewContactView.extend({
        getContactContentSectionControls: function () {
            var controls = [];

            controls [0] = this.getFieldSetControl("orgName", "orgName", this.getOrgNameAndSosControls());
            controls [1] = this.getFieldSetControl("trusteeName","trusteeName", this.getSingleInputFieldSetControls('trusteeName'));
            controls [2] = this.getFieldSetControl("personalInfo", "fs-horizontal", this.personalInfoPanelControls());
            controls [3] = this.getFieldSetControl("phone", "phone", this.phoneInfoPanelControls());
            controls [4] = this.getFieldSetControl("address", "address", this.addressInfoPanelControls(self));
            controls [5] = this.getFieldSetControl("comments", "comments", this.getSingleInputFieldSetControls('comments'));
            controls [6] = this.formControls();//save and reset Controls

            return controls;
        },

        setModelId: function(){
            this.model.set('id', '77D46B21-7226-4BB2-A400-C2A5AB3BB17F', {silent: true});
        },

        setHardCodedMidtierContact: function(){
            this.midtierContact = {
                "organizationCn": "77D46B21-7226-4BB2-A400-C2A5AB3BB17F",
                "lastUpdate": 1523994860000,
                "name": "Alika Miless",
                "remarks": "Cillum voluptatem reiciendis ea quasi.t",
                "orgType": {
                    "orgTypeCn": "66BFFF8FF4E61710E054A0369F38EE9B",
                    "code": "Trust",
                    "effectiveDate": 946710000000,
                    "governmentInd": "N",
                    "label": "Trust",
                    "lastUpdate": 1521060494000,
                    "legacyCode": "TRUST",
                    "name": "Trust"
                },
                "organizationRoles": [
                    {
                        "organizationRoleCn": "D27AA9A6-EA25-4CD7-9721-4427663117FA",
                        "effectiveDate": 1523944800000,
                        "lastUpdate": 1523994860000,
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
                                "orgRoleEmailCn": "0D000120-0CD9-4AB3-B052-1FBE70CF1CBE",
                                "effectiveDate": 1523944800000,
                                "email": "nihi@mailinator.nett",
                                "lastUpdate": 1523994861000,
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
                    },
                    {
                        "organizationRoleCn": "713E7708-5D7B-4487-8A0D-F6EA1D1E1CE1",
                        "effectiveDate": 1523944800000,
                        "lastUpdate": 1523994860000,
                        "name": "Jameson Yorks",
                        "orgRoleType": {
                            "orgRoleTypeCn": "6852CCF2825636C0E054A0369F38EE98",
                            "code": "Trustee",
                            "effectiveDate": 946710000000,
                            "label": "Spouse",
                            "lastUpdate": 1522088032000,
                            "orgLevelInd": "Y",
                            "name": "Trustee"
                        },
                        "orgRoleAddresses": [],
                        "orgRoleEmails": [],
                        "orgRolePhoneNumbers": []
                    },
                    {
                        "organizationRoleCn": "AC349819-073B-46C1-816B-87A8220BFF36",
                        "effectiveDate": 1523944800000,
                        "givenName": "Luciuss",
                        "lastUpdate": 1523994860000,
                        "surname": "Luciuss",
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
                                "orgRoleAddressCn": "532CFA45-762D-4F80-BF56-457D43AF7C57",
                                "addressLine1": "41 South Oak Courtt",
                                "addressLine2": "Placeat nes",
                                "city": "Modi haru",
                                "lastUpdate": 1523994861000,
                                "postalCode": "12312",
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
                        "organizationRoleCn": "6CC10CFC-69DC-4A60-BB28-1B34D7AF3E15",
                        "effectiveDate": 1523944800000,
                        "lastUpdate": 1523994860000,
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
                        "organizationRoleCn": "4CC3C841-3878-4D15-9571-678A49513AA2",
                        "effectiveDate": 1523944800000,
                        "lastUpdate": 1523994860000,
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
                                "orgRolePhoneNumberCn": "85F84721-FCD8-40A8-8CA4-38589FD7FDBF",
                                "extension": "121",
                                "lastUpdate": 1523994861000,
                                "phoneNumber": "121-21212",
                                "primaryPhoneNumberInd": "Y",
                                "orgRolePhoneNbrType": {
                                    "orgRolePhoneNbrTypeCn": "66BFFF8FF79D1710E054A0369F38EE9B",
                                    "code": "Mobile",
                                    "effectiveDate": 1483254000000,
                                    "label": "Mobile",
                                    "lastUpdate": 1520378729000,
                                    "name": "Mobile"
                                }
                            }
                        ]
                    },
                    {
                        "organizationRoleCn": "A961AAEF-3262-4AA5-8C6D-D16AF79BA726",
                        "effectiveDate": 1523944800000,
                        "givenName": "Amityy",
                        "lastUpdate": 1523994860000,
                        "middleName": "A",
                        "prefix": "Mr",
                        "suffix": "Jr",
                        "surname": "Mcguiree",
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
                    }
                ]
            }
        }

    });
});