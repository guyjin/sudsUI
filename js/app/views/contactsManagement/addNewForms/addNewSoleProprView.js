define(['nrm-ui/views/panelView', "jquery",
    "nrm-ui","underscore","require","app/views/contactsManagement/addNewForms/addNewContactView"], function(PanelView, $, Nrm, _,require,AddNewContactView) {

    return AddNewContactView.extend({

        getContactContentSectionControls: function () {
            var controls = [];

            controls [0] = this.getFieldSetControl("personalInfo", "fs-horizontal", this.personalInfoPanelControls());
            controls [1] = this.getFieldSetControl("orgName", "orgName", this.getOrgNameAndSosControls());
            controls [2] = this.getFieldSetControl("phone", "phone", this.phoneInfoPanelControls());
            controls [3] = this.getFieldSetControl("address", "address", this.addressInfoPanelControls(self));
            controls [4] = this.getFieldSetControl("comments", "comments", this.getSingleInputFieldSetControls('comments'));
            controls [5] = this.formControls();//save and reset Controls

            return controls;
        },

        setHardCodedMidtierContact: function(){
            this.midtierContact = {
                "organizationCn":"48EFCFF6-73AF-4C25-A065-293B8515D2AF",
                "lastUpdate":1523989292000,
                "name":"Whilemina Frankf",
                "orgType":{
                    "orgTypeCn":"66BFFF8FF4E31710E054A0369F38EE9B",
                    "code":"SolePropr",
                    "description":"Individual ownership of a business as opposed to a partnership or corporation. (RED)",
                    "effectiveDate":946710000000,
                    "governmentInd":"N",
                    "label":"Sole Proprietor",
                    "lastUpdate":1521060646000,
                    "legacyCode":"SOLE PROPRIETORSHIP",
                    "name":"Sole Proprietor"
                },
                "organizationRoles":[
                    {
                        "organizationRoleCn":"7A8AE68C-CBB8-4BAF-A3B4-ADE7B40CE3B3",
                        "effectiveDate":1523944800000,
                        "lastUpdate":1523989293000,
                        "orgRoleType":{
                            "orgRoleTypeCn":"66D9C22DCCC2EBD0E054A0369F38EE9B",
                            "code":"Phone",
                            "effectiveDate":946710000000,
                            "label":"Phone",
                            "lastUpdate":1521125457000,
                            "orgLevelInd":"Y",
                            "name":"Phone"
                        },
                        "orgRoleAddresses":[

                        ],
                        "orgRoleEmails":[

                        ],
                        "orgRolePhoneNumbers":[
                            {
                                "orgRolePhoneNumberCn":"C3D0E3FA-DFFD-4069-9ECA-710081B2B8DC",
                                "extension":"2121",
                                "lastUpdate":1523989294000,
                                "phoneNumber":"121-212-1212",
                                "primaryPhoneNumberInd":"Y",
                                "orgRolePhoneNbrType":{
                                    "orgRolePhoneNbrTypeCn":"66BFFF8FF79C1710E054A0369F38EE9B",
                                    "code":"Main",
                                    "effectiveDate":1483254000000,
                                    "label":"Main",
                                    "lastUpdate":1520378729000,
                                    "name":"Main"
                                }
                            }
                        ]
                    },
                    {
                        "organizationRoleCn":"112DA1D2-1783-47F3-B1CA-B0999A81CF3E",
                        "effectiveDate":1523944800000,
                        "givenName":"Dominica",
                        "lastUpdate":1523989293000,
                        "surname":"Dominica",
                        "orgRoleType":{
                            "orgRoleTypeCn":"66D9C22DCCBDEBD0E054A0369F38EE9B",
                            "code":"Billing",
                            "effectiveDate":946710000000,
                            "label":"Billing",
                            "lastUpdate":1521125457000,
                            "orgLevelInd":"N",
                            "name":"Billing"
                        },
                        "orgRoleAddresses":[
                            {
                                "orgRoleAddressCn":"08BF4E22-60E8-4A9C-B88E-58120B428CC0",
                                "addressLine1":"787 East Nobel Streett",
                                "addressLine2":"Unde ex earum ea",
                                "city":"fdsafafda",
                                "lastUpdate":1523989293000,
                                "postalCode":"72121",
                                "countryRegion":{
                                    "countryRegionCn":"664AF62775F6E836E054A0369F38EE9B",
                                    "code":"AZ",
                                    "effectiveDate":946710000000,
                                    "lastUpdate":1519848012000,
                                    "legacyCn":"664AF62775F7E836E054A0369F38EE9B",
                                    "name":"Arizona"
                                },
                                "orgRoleAddressType":{
                                    "orgRoleAddressTypeCn":"66BFFF8FF64B1710E054A0369F38EE9B",
                                    "code":"Mail",
                                    "effectiveDate":946710000000,
                                    "label":"Mail",
                                    "lastUpdate":1520546962000,
                                    "legacyCode":"MAILING",
                                    "name":"Mail"
                                }
                            }
                        ],
                        "orgRoleEmails":[

                        ],
                        "orgRolePhoneNumbers":[

                        ]
                    },
                    {
                        "organizationRoleCn":"E57D217C-F7F6-468F-A2D5-7F100A2A0786",
                        "effectiveDate":1523944800000,
                        "lastUpdate":1523989293000,
                        "url":"www.url.com",
                        "orgRoleType":{
                            "orgRoleTypeCn":"6765A7E1E4E46E4EE054A0369F38EE9B",
                            "code":"URL",
                            "effectiveDate":946710000000,
                            "label":"URL",
                            "lastUpdate":1522167887000,
                            "orgLevelInd":"Y",
                            "name":"URL"
                        },
                        "orgRoleAddresses":[

                        ],
                        "orgRoleEmails":[

                        ],
                        "orgRolePhoneNumbers":[

                        ]
                    },
                    {
                        "organizationRoleCn":"503CC8C1-F45F-475E-8F45-904088B14354",
                        "effectiveDate":1523944800000,
                        "lastUpdate":1523989293000,
                        "orgRoleType":{
                            "orgRoleTypeCn":"66D9C22DCCBEEBD0E054A0369F38EE9B",
                            "code":"Email",
                            "effectiveDate":946710000000,
                            "label":"Email",
                            "lastUpdate":1521125457000,
                            "orgLevelInd":"Y",
                            "name":"Email"
                        },
                        "orgRoleAddresses":[

                        ],
                        "orgRoleEmails":[
                            {
                                "orgRoleEmailCn":"12582863-A5EF-4663-BC28-C5F989968C7E",
                                "effectiveDate":1523944800000,
                                "email":"vyjebog@mailinator.comm",
                                "lastUpdate":1523989294000,
                                "orgRoleEmailType":{
                                    "orgRoleEmailTypeCn":"66BFFF8FF7321710E054A0369F38EE9B",
                                    "code":"Primary",
                                    "effectiveDate":946710000000,
                                    "label":"Primary",
                                    "lastUpdate":1520375321000,
                                    "name":"Primary"
                                },
                                "primaryEmailInd":"Y"
                            }
                        ],
                        "orgRolePhoneNumbers":[

                        ]
                    },
                    {
                        "organizationRoleCn":"9D6DE549-64E5-4C4B-A9E7-BBAEE0151DFD",
                        "effectiveDate":1523944800000,
                        "givenName":"Quentind",
                        "lastUpdate":1523989293000,
                        "middleName":"T",
                        "prefix":"Mrs",
                        "suffix":"Phd",
                        "surname":"Clemonss",
                        "orgRoleType":{
                            "orgRoleTypeCn":"66D9C22DCCC1EBD0E054A0369F38EE9B",
                            "code":"Person",
                            "effectiveDate":946710000000,
                            "label":"Person",
                            "lastUpdate":1521125457000,
                            "orgLevelInd":"Y",
                            "name":"Person"
                        },
                        "orgRoleAddresses":[

                        ],
                        "orgRoleEmails":[

                        ],
                        "orgRolePhoneNumbers":[

                        ]
                    }
                ]
            }
        },

        setModelId: function(){
            this.model.set('id', 'E6E8BD4E-27BA-49C7-93C9-0D3211EC0B58', {silent: true});
        }

    });
});