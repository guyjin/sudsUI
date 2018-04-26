/**
 * @file
 * @see module:app/models/contactModel
 */
define(['..', 'backbone','./contactsSearchModel'],
    function(Suds, Backbone,ContactSearchModel) {
        return Suds.Models.ContactModel = Backbone.Model.extend({

            name: function() {
                return this.get("lastName") + ", " + this.get("firstName");
            },

            phoneNumber : function () {

                var phoneNumber = ("" + this.get("phone")).replace(/\D/g, '');
                /*var formattedNumber = phoneNumber.match(/^(\d{3})(\d{3})(\d{4})$/);

                return (!formattedNumber) ? " " : "(" + formattedNumber[1] + ") " + formattedNumber[2] + "-" + formattedNumber[3];*/

                return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")
            },

            address : function () {

                var address1 = this.get("streetAddress1"),
                    address2 = this.get("streetAddress2"),
                    city = this.get("city"),
                    stateCode = this.get("stateCode"),
                    postalCode = this.get("postalCode"),
                    formattedAddress = [];

                if (address1) formattedAddress.push(address1);
                if (address2) formattedAddress.push(address2);
                if (city) formattedAddress.push(city);

                if (stateCode || postalCode) {
                    var line = [];

                    if (stateCode) line.push(stateCode);
                    if (line.length) {
                        line = [line.join(', ')]
                    }
                    if (postalCode) line.push(postalCode);
                    formattedAddress.push(line.join(' '));
                }
                /*console.log("formatted address ", formattedAddress);*/

                return formattedAddress;

            },

            SearchContacts : function() {

                return new ContactSearchModel;

            },

            toJSON: function(options) {
                var self = this;

                if (this.id){
                    this.set("contactsTbl",this.id);
                }
                /*if (this.attributes.selectedContacts){
                    self.attributes.selectedContacts = JSON.stringify(self.attributes.selectedContacts.toJSON()) ;
                }*/


                return _.clone(this.attributes);
            }

        });
    });