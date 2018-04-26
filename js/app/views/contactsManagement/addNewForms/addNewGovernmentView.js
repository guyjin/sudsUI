define(['nrm-ui/views/panelView', "jquery",
        "nrm-ui", "underscore", "require", "app/views/contactsManagement/addNewForms/addNewMarriedView","hbs!contacts/contactFormAddedPersonsPill"],
    function (PanelView, $, Nrm, _, require, AddNewMarriedView,ContactFormAddedPersonsPill) {

        return AddNewMarriedView.extend({

            updateConfigControls : function (controls) {
                var divNameCtrls = this.getFieldSetControl("divisionName","divisionName", this.getSingleInputFieldSetControls("divisionName"));

                controls.splice(0,0,divNameCtrls);
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
            }

        });
    });