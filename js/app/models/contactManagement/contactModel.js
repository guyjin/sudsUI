/**
 * @file
 * @see module:app/models/process
 */
/**
 * @module app/models/common/recordModel
 */
define(['../..',
        /*'nrm-ui/models/businessObject',*/
        "nrm-ui/models/nestedModel",
        'nrm-ui',
        'backbone',
        'underscore',
        'app/models/contactManagement/initialOrg',
        'nrm-ui/collections/ruleCollection'],

    function(Suds, NestedModel,Nrm, Backbone, _,InitialOrg, RuleCollection) {

        return Suds.Models.ContactManagementModel = NestedModel.extend(/** @lends module:app/models/process.prototype */{

                constructor: function ContactManagementModel() { return NestedModel.apply(this, arguments); }, // helps with debugging/profiling

                /**
                 * The urlRoot is required for each non-generic model. By convention, should match the root context key.
                 * @type {string}
                 * @see {@link http://backbonejs.org/#Model-urlRoot|Backbone.Model#urlRoot}
                 */

                urlRoot: "api/contact/",
                idAttribute: 'id',


                initialize: function() {
                    var children = this.initializeChildren(this.attributes);
                    this.set(children);
                    this.registerChildEvents();
                },


                "sync": function(method, model, options){

                   /* if(method == 'create'){
                        options.url = this.urlRoot + '/create';
                    }else if(method == 'update'){

                        options.url = this.urlRoot + '/update/'+ this.id;
                    }*/

                    return Backbone.sync.apply(this, arguments);
                },


                getInitialOrgByContactType : function (options) {

                    return new InitialOrg(options)
                },

                formValidation : function(){

            },

                parse: function() {
                    var response = NestedModel.prototype.parse.apply(this, arguments);

                    return response;
                },


                deepFind: function(items, subkeys, predicate, caller) {


                    if (subkeys && !_.isArray(subkeys)) {
                        subkeys = [subkeys];
                    }

                    function recursiveFind(item) {

                        function subkeyFind(key) {
                            return _.find(item[key], recursiveFind);
                        }

                        if (predicate.apply(caller || this, arguments)) {
                            result = item;
                            return true;
                        }
                        if (!subkeys) {
                            subkeys = _.keys(items);
                        }

                        return _.find(subkeys, function(key) {
                            if (_.isObject(item[key])) {
                                return _.find(item[key], recursiveFind);
                            }
                        });
                    }

                    var result;

                    _.find(items, recursiveFind);

                    return result;
                },

                /**
                 * The default attributes to set on new models.
                 * @returns {Object}
                 * Default attributes hash
                 * @see {@link http://backbonejs.org/#Model-defaults|Backbone.Model#defaults}
                 */
                defaults : function() {

                    return {
                        //authorization: {}
                    }
                },

                startListening: function () {

                    this.listenTo(this, {
                        'renderComplete': function () {

                        }
                    });

                },

                validate: function(attributes, opts) {
                    var rules = this.constructor.ruleMixins.rules;
                    var valTypes = this.get('valTypes');
                    if(valTypes){
                        rules = _.filter(rules, function(rule) {
                            return _.contains(valTypes, rule.valType);
                        });
                    }

                    var currentFormType = this.get('formType');

                    rules = _.filter(rules, function(rule) {
                        var filtered = true;

                        var allowedFormTypes = rule.formTypes;
                        if(allowedFormTypes){
                            filtered = _.contains(allowedFormTypes, currentFormType);
                        }

                        return filtered;
                        return _.contains(valTypes, rule.valType);
                    });



                    var mc = this.constructor.extend({},{rules : new RuleCollection(rules)} );

                    if (!this.brokenRules) {
                        this.brokenRules = new RuleCollection();
                    }

                    return mc.checkRules(this, opts);
                },

                getValidationMessage: function(rule){
                    var fieldName = rule.get('fieldName'), prop = rule.get('property');
                    var id = rule.get('id');
                    if(!id){
                        id = prop;
                    }
                    var self = this;
                    var propVal = getPropValue();

                    function getPropValue(){
                        var propVal;

                        switch(id){
                            case 'givenName':
                            case 'surname':
                            case 'middleName':
                            case 'personalUrl':
                                var personAttrs = self.get("person");
                                if(personAttrs){
                                    propVal = personAttrs[prop];
                                }
                                break;
                            case 'email':
                            case 'orgRoleUrl':
                            case 'name':
                            case 'respPersonName':
                                propVal = self.get(prop);
                                break;
                            case 'phoneNumber':
                            case 'orgRolePhoneNbrTypeCn':
                                var phoneObj = self.get("telephone");
                                if(phoneObj){
                                    propVal = phoneObj[prop];
                                }
                                break;
                            case 'addressFName':
                            case 'addressLName':
                            case 'country':
                            case 'postalCode':
                            case 'addressLine1':
                            case 'city':
                            case 'state':
                                var addressObj = self.get("address");
                                if(addressObj){
                                    propVal = addressObj[prop];
                                }
                                break;
                        }

                        return propVal;
                    };

                    function getValidationTypes(){
                        var validationTypes = [];

                        switch(id) {
                            case 'givenName':
                            case 'surname':
                                validationTypes.push('isRequired');
                                validationTypes.push('isLettersOnly');
                                break;
                            case 'middleName':
                            case 'email':
                            case 'orgRoleUrl':
                            case 'personalUrl':
                                validationTypes.push('ifProvided');
                                break;
                            case 'phoneNumber':
                                validationTypes.push('phoneFormat');
                            case 'orgRolePhoneNbrTypeCn':
                                validationTypes.push('atLeastOneRequired');
                                break;
                            case 'addressFName':
                            case 'addressLName':
                                validationTypes.push('ifProvided');
                                break;
                            case 'country':
                            case 'postalCode':
                            case 'addressLine1':
                            case 'city':
                            case 'state':
                                validationTypes.push('atLeastOneRequired');
                                break;
                            case 'name':
                            case 'respPersonName':
                                validationTypes.push('isRequired');
                                break;
                        }

                        return validationTypes;
                    };

                    function getValMsgPerType(eachValType){
                        var valMsg;

                        switch(eachValType){
                            case 'isRequired':
                                //if prop = 'telephone'
                                // check type and

                                if(!propVal){
                                    valMsg = fieldName + ' is a required field.';
                                }
                                break;
                            case 'isLettersOnly':
                                var isLetterOnly = propVal.match(/^[a-zA-Z\s]+$/);
                                if(!isLetterOnly){
                                    if(prop == 'middleName'){
                                        valMsg = fieldName + ' can only be a letter.';
                                    }else{
                                        valMsg = fieldName + ' can only contain letters.';
                                    }
                                }
                                break;
                            case 'ifProvided':
                                if(propVal){
                                    switch(id){
                                        case 'middleName':
                                            valMsg = getValMsgPerType('isLettersOnly');
                                            break;
                                        case 'email':
                                            valMsg = getValMsgPerType('isValidEmail');
                                            break;
                                        case 'orgRoleUrl':
                                        case 'personalUrl':
                                            valMsg = getValMsgPerType('isValidUrl');
                                            break;
                                        case 'addressFName':
                                        case 'addressLName':
                                            valMsg = getValMsgPerType('isLettersOnly');
                                            break;
                                    }
                                }
                                break;
                            case 'isValidEmail':
                                var isValidEmail = propVal.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
                                if(!isValidEmail){
                                    valMsg = fieldName + ' is not valid';
                                }
                                break;
                            case 'isValidUrl':
                                var isValidUrl = propVal.match(/((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/);
                                if(!isValidUrl){
                                    valMsg = fieldName + ' is not valid';
                                }
                                break;
                            case 'phoneFormat':
                                if(propVal){
                                    var phoneNum = propVal.replace(/\D/g,'');
                                    if(phoneNum.length<10){
                                        valMsg = 'Needs 10 digits for US phone number';
                                    }
                                }

                                break;
                            case 'atLeastOneRequired':
                                validateForAtLeastOneRequired();
                                break;
                        };

                        function validateForAtLeastOneRequired() {
                            var modalObjCollection;
                            var modalType;

                            switch (id) {
                                case 'phoneNumber':
                                case 'orgRolePhoneNbrTypeCn':
                                    modalType = 'telephone';
                                case 'country':
                                case 'postalCode':
                                case 'addressLine1':
                                case 'city':
                                case 'state':
                                    if (!modalType) {
                                        modalType = 'address';
                                    }

                                    if (modalType == 'telephone') {
                                        modalObjCollection = self.get('phoneNumbers');
                                    } else if (modalType == 'address') {
                                        modalObjCollection = self.get('addresses');
                                    }

                                    if (modalObjCollection && (modalObjCollection.length > 0)) {
                                        var atLeastOneRequiredModalFieldFilled = isAtLeastOneRequiredAddressFieldFilled(modalType);

                                        if (atLeastOneRequiredModalFieldFilled && !propVal) {
                                            if (modalType == 'telephone') {
                                                valMsg = 'Fill up all required phone fields or keep them empty since it is not first entry.';
                                            } else if (modalType == 'address') {
                                                valMsg = 'Fill up all required address fields or keep them empty since it is not first entry.';
                                            }
                                        }else {
                                            var eventType = self.get('eventType');
                                            if(eventType && ((eventType == 'addPhone') || (eventType == 'addAddress'))){
                                                valMsg = getValMsgPerType('isRequired');
                                            }

                                            /*var valTypes = self.get('valTypes');
                                            if(valTypes){
                                                //if it's coming from 'Add Phone' or 'Add Address' function
                                                if (valTypes.length == 1 && (_.contains(valTypes, 'phone') || _.contains(valTypes, 'address'))){
                                                    valMsg = getValMsgPerType('isRequired');
                                                }
                                            }*/

                                        }
                                    } else {
                                        valMsg = getValMsgPerType('isRequired');
                                    }

                                    break;
                            }
                        }

                        function isAtLeastOneRequiredAddressFieldFilled(modalType){
                            var atLeastOneRequiredModalFieldFilled = false;
                            var modalObj = self.get(modalType);

                            if(modalObj){
                                var modalReqProps;
                                if(modalType == 'address'){
                                    modalReqProps= ['country', 'postalCode', 'addressLine1', 'city', 'state'  ];
                                }else if(modalType == 'telephone'){
                                    modalReqProps= ['phoneNumber', 'orgRolePhoneNbrTypeCn'];
                                }

                                var propVal;
                                $.each(modalReqProps, function(index, prop) {
                                    propVal = modalObj[prop];
                                    if(propVal){
                                        atLeastOneRequiredModalFieldFilled = true;
                                        return false;
                                    }
                                });

                            };

                            return atLeastOneRequiredModalFieldFilled;
                        }


                        return valMsg;
                    };

                    function getValMsg() {
                        var valMsg;
                        var valTypes = getValidationTypes();
                        _.find(valTypes, function(eachValType){
                            valMsg = getValMsgPerType(eachValType);
                            if(valMsg){
                                return true;
                            }
                        });

                        return valMsg;
                    };

                    var valMsg = getValMsg();

                    return valMsg;
                }

            },
            {
                childProperties: {

                },

                ruleMixins: {

                    rules: [
                        {
                            property: "name",
                            rule: "ValidateContactFormFields",
                            fieldName: 'Organization Name',
                            valType: 'org',
                            formTypes: ['SolePropr', 'Trust', 'Assocatn', 'Partner', 'Corp', 'LLC', 'FedGovt', 'Tribal', 'StateGvt', 'LocalGvt', 'FrgnGovt']
                        },
                        {
                            property: "respPersonName",
                            rule: "ValidateContactFormFields",
                            fieldName: 'This',
                            valType: 'org',
                            formTypes: ['Corp', 'LLC']
                        },
                        {
                            property: "givenName",
                            rule: "ValidateContactFormFields",
                            fieldName: 'First Name',
                            valType: 'person'
                        },{
                            property: "middleName",
                            rule: "ValidateContactFormFields",
                            fieldName: 'M.I',
                            valType: 'person'
                        },{
                            property: "surname",
                            rule: "ValidateContactFormFields",
                            fieldName: 'Last Name',
                            valType: 'person'
                        },{
                            property: "email",
                            rule: "ValidateContactFormFields",
                            fieldName: 'Email',
                            valType: 'person'
                        },{
                            property: "personalUrl",
                            rule: "ValidateContactFormFields",
                            fieldName: 'URL',
                            valType: 'person'
                        },{
                            property: "orgRoleUrl",
                            rule: "ValidateContactFormFields",
                            fieldName: 'URL',
                            valType: 'org'
                        },{
                            property: "orgRolePhoneNbrTypeCn",
                            rule: "ValidateContactFormFields",
                            fieldName: 'Phone Type',
                            valType: 'phone'
                        },{
                            property: "phoneNumber",
                            rule: "ValidateContactFormFields",
                            fieldName: 'Phone Number',
                            valType: 'phone'
                        },{
                            property: "addressFName",
                            rule: "ValidateContactFormFields",
                            fieldName: 'First Name',
                            valType: 'address'
                        },{
                            property: "addressLName",
                            rule: "ValidateContactFormFields",
                            fieldName: 'Last Name',
                            valType: 'address'
                        },{
                            property: "country",
                            rule: "ValidateContactFormFields",
                            fieldName: 'Country',
                            valType: 'address'
                        },{
                            property: "postalCode",
                            rule: "ValidateContactFormFields",
                            fieldName: 'Postal Code',
                            valType: 'address'
                        },{
                            property: "addressLine1",
                            rule: "ValidateContactFormFields",
                            fieldName: 'Address Line1',
                            valType: 'address'
                        },{
                            property: "city",
                            rule: "ValidateContactFormFields",
                            fieldName: 'City',
                            valType: 'address'
                        },{
                            property: "state",
                            rule: "ValidateContactFormFields",
                            fieldName: 'State',
                            valType: 'address'
                        }
                    ]


                }
            });
    });