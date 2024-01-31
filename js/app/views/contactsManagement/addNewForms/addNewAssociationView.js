define(['nrm-ui/views/panelView', "jquery",
        "nrm-ui", "underscore", "require", "app/views/contactsManagement/addNewForms/addNewMarriedView","hbs!contacts/contactFormAddedPersonsPill"],
    function (PanelView, $, Nrm, _, require, AddNewMarriedView,ContactFormAddedPersonsPill) {

        return AddNewMarriedView.extend({

            updateConfigControls : function (controls) {
                var associationNameCtrls = this.getFieldSetControl("associationName","associationName", this.getOrgNameAndSosControls());
                var urlFieldSetControls = this.getFieldSetControl("url","url", this.getSingleInputFieldSetControls("url"));

                controls.splice(0,0,associationNameCtrls);
                controls.splice(3,0,urlFieldSetControls);

            },

            setModelId: function(){
                this.model.set('id', '95090A94-E47D-44D6-9046-AF8CB7E2CC34', {silent: true});
            },

            setHardCodedMidtierContact: function(){
                this.midtierContact = {
                    "organizationCn": "95090A94-E47D-44D6-9046-AF8CB7E2CC34",
                    "lastUpdate": 1524006370000,
                    "name": "Marcia Beasleyy",
                    "remarks": "Iusto distinctio. Obcaecati molestiae quia eaque qui adipisci officia eos sequi nihil et odit quae enim qui atque.dasfd",
                    "orgType": {
                        "orgTypeCn": "66BFFF8FF4BF1710E054A0369F38EE9B",
                        "code": "Assocatn",
                        "description": "A group of persons banded together for a specific purpose.  To qualify under section 501(a) of the Code, the association must have a written document, such as articles of association, showing its creation.  At least two persons must sign the document, which must be dated.  The definition of an association can vary under state law. (irs.gov)",
                        "effectiveDate": 946710000000,
                        "governmentInd": "N",
                        "label": "Association",
                        "lastUpdate": 1521061838000,
                        "legacyCode": "ASSOCIATION",
                        "name": "Association"
                    },
                    "organizationRoles": [
                        {
                            "organizationRoleCn": "A8A14837-8A50-4216-B2D1-1609CC51569D",
                            "effectiveDate": 1523944800000,
                            "givenName": "Buffya",
                            "lastUpdate": 1524006370000,
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
                                    "orgRoleEmailCn": "DAA3D838-7743-4F67-B6E9-E6B9121EFF6B",
                                    "effectiveDate": 1523944800000,
                                    "email": "fexoqijob@mailinator.neta",
                                    "lastUpdate": 1524006371000,
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
                                    "orgRolePhoneNumberCn": "F3392014-8355-4198-9434-91897BC457D6",
                                    "extension": "121",
                                    "lastUpdate": 1524006371000,
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
                                    "orgRolePhoneNumberCn": "4F390D16-99FB-4A01-878F-554A23E58DDD",
                                    "lastUpdate": 1524006371000,
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
                        },
                        {
                            "organizationRoleCn": "C9B75C68-2167-4A4D-B41D-12732D0E3F8C",
                            "effectiveDate": 1523944800000,
                            "givenName": "Carissaa",
                            "lastUpdate": 1524006370000,
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
                                    "orgRoleEmailCn": "C5374AF6-A854-4901-B66C-DD1D1DB3C6DE",
                                    "effectiveDate": 1523944800000,
                                    "email": "litekokuny@mailinator.coma",
                                    "lastUpdate": 1524006371000,
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
                                    "orgRolePhoneNumberCn": "EA9CA356-973F-4050-B897-0C18F848054C",
                                    "extension": "121",
                                    "lastUpdate": 1524006371000,
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
                            "organizationRoleCn": "1E2592B8-DCDE-4356-AAE8-25E68ED674E5",
                            "effectiveDate": 1523944800000,
                            "lastUpdate": 1524006371000,
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
                            "organizationRoleCn": "A07CE8C8-D58D-4577-84E7-29668E9314E7",
                            "effectiveDate": 1523944800000,
                            "givenName": "Trevora",
                            "lastUpdate": 1524006371000,
                            "name": "John Morgana",
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
                                    "orgRoleAddressCn": "6C5EBF4C-CAAE-4985-A532-BC8DB07E797D",
                                    "addressLine1": "23 New Extensionn",
                                    "addressLine2": "Enim aperia",
                                    "city": "Ut dolore voa",
                                    "lastUpdate": 1524006371000,
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
                        }
                    ]
                }
            }

        });
    });