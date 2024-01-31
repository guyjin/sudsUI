define(['nrm-ui/views/panelView', "jquery",
        "nrm-ui", "underscore", "require", "app/views/contactsManagement/addNewForms/addNewMarriedView","hbs!contacts/contactFormAddedPersonsPill"],
    function (PanelView, $, Nrm, _, require, AddNewMarriedView,ContactFormAddedPersonsPill) {

        return AddNewMarriedView.extend({

            updateConfigControls : function (controls) {
                var corporationNameCtrls = this.getFieldSetControl("corporationName","corporationName", this.getOrgNameAndSosControls());
                var agentNameControls = this.getFieldSetControl("agentName","agentName", this.getSingleInputFieldSetControls("agentName"));
                var urlFieldSetControls = this.getFieldSetControl("url","url", this.getSingleInputFieldSetControls("url"));

                controls.splice(0,0,corporationNameCtrls);
                controls.splice(1,0,agentNameControls);
                controls.splice(4,0,urlFieldSetControls);
            },

            setHardCodedMidtierContact: function(){
                this.midtierContact = {
                    "organizationCn": "036D2CC3-F012-4B5A-80D0-7221FCA40CD0",
                    "lastUpdate": 1524008375000,
                    "name": "Corpp",
                    "remarks": "Iusto distinctio. Obcaecati molestiae quia eaque qui adipisci officia eos sequi nihil et odit quae enim qui atque.dasfd",
                    "orgType": {
                        "orgTypeCn": "66BFFF8FF4C41710E054A0369F38EE9B",
                        "code": "Corp",
                        "description": "A general term encompassing any group of people incorporating by following certain statutory procedures.  Most common type of corporation is a private one formed to carry on a business. (RED)",
                        "effectiveDate": 946710000000,
                        "governmentInd": "N",
                        "label": "Corporation",
                        "lastUpdate": 1521062157000,
                        "legacyCode": "CORPORATION",
                        "name": "Corporation"
                    },
                    "organizationRoles": [
                        {
                            "organizationRoleCn": "4D7004A7-9D11-4747-978E-F10B3116AD42",
                            "effectiveDate": 1523944800000,
                            "lastUpdate": 1524008375000,
                            "name": "Agentt",
                            "orgRoleType": {
                                "orgRoleTypeCn": "68655D1B52C9E003E054A0369F38EE98",
                                "code": "Agent",
                                "effectiveDate": 946710000000,
                                "label": "Agent",
                                "lastUpdate": 1522167887000,
                                "orgLevelInd": "Y",
                                "name": "Agent"
                            },
                            "orgRoleAddresses": [],
                            "orgRoleEmails": [],
                            "orgRolePhoneNumbers": []
                        },
                        {
                            "organizationRoleCn": "869215AD-6F2E-4F87-8452-3FC2E85F0A6A",
                            "effectiveDate": 1523944800000,
                            "givenName": "Carissaa",
                            "lastUpdate": 1524008376000,
                            "middleName": "V",
                            "prefix": "Ms",
                            "suffix": "Jr",
                            "surname": "Maya",
                            "url": "www.urlc.com",
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
                                    "orgRoleEmailCn": "F5CA57A8-4D5F-4B9A-A958-224854133683",
                                    "effectiveDate": 1523944800000,
                                    "email": "litekokuny@mailinator.coma",
                                    "lastUpdate": 1524008376000,
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
                                    "orgRolePhoneNumberCn": "826A5616-BA61-4EB9-8DF4-7C2E6C0498F7",
                                    "extension": "121",
                                    "lastUpdate": 1524008376000,
                                    "phoneNumber": "147-59-4638",
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
                            "organizationRoleCn": "E36C2372-8EF8-415F-ADE7-368E061BB0FF",
                            "effectiveDate": 1523944800000,
                            "lastUpdate": 1524008376000,
                            "url": "www.jlk.com",
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
                            "organizationRoleCn": "90B64995-B38B-43B6-9E1B-E0EFA8D68877",
                            "effectiveDate": 1523944800000,
                            "givenName": "Trevora",
                            "lastUpdate": 1524008376000,
                            "surname": "Trevora",
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
                                    "orgRoleAddressCn": "4537F6C7-708D-44F9-AB17-380D55CC2591",
                                    "addressLine1": "23 New Extensionn",
                                    "addressLine2": "Enim aperia",
                                    "city": "Ut dolore voa",
                                    "lastUpdate": 1524008376000,
                                    "postalCode": "4222",
                                    "countryRegion": {
                                        "countryRegionCn": "664AF62775C9E836E054A0369F38EE9B",
                                        "code": "NT",
                                        "effectiveDate": 946710000000,
                                        "lastUpdate": 1519848012000,
                                        "legacyCn": "664AF62775CAE836E054A0369F38EE9B",
                                        "name": "Northwest Terr."
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
                            "organizationRoleCn": "5C5E1488-7F1E-4EAC-A5DB-C3C1D4A257A5",
                            "effectiveDate": 1523944800000,
                            "givenName": "Buffya",
                            "lastUpdate": 1524008376000,
                            "middleName": "A",
                            "prefix": "Mrs",
                            "suffix": "Esq",
                            "surname": "Mullinss",
                            "url": "www.jklfd.com",
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
                                    "orgRoleEmailCn": "09A25BC2-7FF1-4603-AF43-F8B0904C363C",
                                    "effectiveDate": 1523944800000,
                                    "email": "fexoqijob@mailinator.neta",
                                    "lastUpdate": 1524008376000,
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
                                    "orgRolePhoneNumberCn": "598B97CB-240F-4D71-964D-41CC973E3D35",
                                    "extension": "121",
                                    "lastUpdate": 1524008376000,
                                    "phoneNumber": "338-32-1173",
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
                                    "orgRolePhoneNumberCn": "6B6BC894-4BDA-468B-BDAF-7DFBC58EE939",
                                    "lastUpdate": 1524008376000,
                                    "phoneNumber": "123-121-1111",
                                    "primaryPhoneNumberInd": "Y",
                                    "orgRolePhoneNbrType": {
                                        "orgRolePhoneNbrTypeCn": "66BFFF8FF79E1710E054A0369F38EE9B",
                                        "code": "Work",
                                        "effectiveDate": 1483254000000,
                                        "label": "Work",
                                        "lastUpdate": 1521060755000,
                                        "name": "Work"
                                    }
                                }
                            ]
                        }
                    ]
                }
            }

        });
    });