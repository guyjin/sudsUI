new Vue( {
             el     : '#app',
             data   : {
                 pageReady    : true,
                 message      : "hello, world!",
                 returnSearch : false,
                 contactType  : null,
                 comments     : '',
                 commentLength: 500,
                 phoneNumber  : {
                     type    : null,
                     intlCode: null,
                     areaCode: null,
                     number  : null,
                     ext     : null
                 },
                 persons      : [],
                 person       : {
                     firstName   : null,
                     initial     : null,
                     lastName    : null,
                     suffix      : null,
                     emailAddress: null,
                     deceased    : false,
                     url         : null,
                     phoneNumbers: []
                 },
        
                 address             : {
                     type                   : 'billing',
                     otherType              : null,
                     dept                   : null,
                     billingContactFirstName: null,
                     billingContactLastName : null,
                     postalCode             : null,
                     addr1                  : null,
                     addr2                  : null,
                     city                   : null,
                     state                  : null,
                     country                : null
                 },
                 addresses           : [],
                 phoneNumbers        : [],
                 phoneNumberValid    : false,
                 phoneEditMode       : false,
                 addressEditMode     : false,
                 billingAddressExists: false,
                 addressValid        : false,
                 formIsValid         : false,
                 formUrls            : [
                     {
                         'soleprop'     : 'contactSoleProprietor.html',
                         'person'       : 'contactPerson.html',
                         'trust'        : 'contactTrust.html',
                         'marriedCouple': 'contactMarriedCouple.html',
                         'partnership'  : 'contactPartnership.html',
                         'association'  : 'contactAssociation.html',
                         'fedgov'       : 'contactGovernment.html',
                         'stgov'        : 'contactGovernment.html',
                         'locgov'       : 'contactGovernment.html',
                         'tribgov'      : 'contactGovernment.html',
                         'forgov'       : 'contactGovernment.html',
                         'llc'          : 'contactLLC.html',
                         'llp'          : 'contactLLP.html',
                         'corp'         : 'contactCorporation.html'
                     }
                 ],
                 halfModalOpen       : false
             },
             methods: {
                 // loadIn() {
                 //     this.pageReady = true;
                 // }
                 commentCount  : function () {
//                     var targetLimit = 200;
                     if ( this.comments ) {
                         return (this.commentLength - this.comments.length);
                     }
                     else {
                         return this.commentLength;
                     }
                 },
                 submitSearch  : function ( event ) {
                     event.preventDefault();
                     this.returnSearch = true;
                 },
                 validatePhone : function () {
                     if ( !this.phoneNumber.type || !this.phoneNumber.number ) {
                         this.phoneNumberValid = false;
                     }
                     else {
                         this.phoneNumberValid = true;
                     }
                 },
                 addPhoneNumber: function () {
                     if ( !this.phoneEditMode ) {
                         this.phoneNumbers.push( this.phoneNumber );
                         this.resetPhoneNumber();
                     }
                     else {
                         this.phoneNumbers[ this.phoneEditIndex ] = this.phoneNumber;
                         this.resetPhoneNumber();
                         this.phoneEditIndex = null;
                         this.phoneEditMode  = false;
                     }
                 },
    
                 addPersonPhoneNumber: function () {
                     if ( !this.phoneEditMode ) {
                         this.person.phoneNumbers.push( this.phoneNumber );
                         this.resetPhoneNumber();
                     }
                     else if ( this.phoneEditMode ) {
                         this.person.phoneNumbers[ this.phoneEditIndex ] = this.phoneNumber;
                         this.resetPhoneNumber();
                         this.phoneEditIndex = null;
                         this.phoneEditMode  = false;
                     }
                 },
                 removePhoneNumber   : function ( index ) {
                     if ( confirm( 'Are you sure you want to remove this phone number?' ) ) {
                         this.phoneNumbers.splice( index, 1 );
                     }
                 },
    
                 addPerson  : function () {
                     this.persons.push( this.person );
                     this.closeHalfModal();
                     this.resetPerson();
                     this.resetPhoneNumber();
                 },
                 resetPerson: function () {
                     this.person = {
                         firstName   : null,
                         initial     : null,
                         lastName    : null,
                         suffix      : null,
                         emailAddress: null,
                         deceased    : false,
                         url         : null,
                         phoneNumbers: []
                     }
                 },
    
                 editPerson  : function ( index ) {
                     this.person = this.persons[ index ];
                     this.openHalfModal();
        
                 },
                 removePerson: function ( index ) {
                     if ( confirm( 'Are you sure you want to remove this person?' ) ) {
                         this.persons.splice( index, 1 );
                     }
                 },
    
                 editPersonPhoneNumber: function ( phoneIndex ) {
                     this.phoneEditMode    = true;
                     this.phoneEditIndex   = phoneIndex;
                     this.phoneNumber      = this.person.phoneNumbers[ this.phoneEditIndex ];
                     this.phoneNumberValid = true;
                 },
    
                 removePersonPhoneNumber: function ( phoneIndex ) {
                     if ( confirm( 'Are you sure you want to remove this phone number?' ) ) {
                         this.person.phoneNumbers.splice( phoneIndex, 1 );
                     }
        
                 },
    
    
                 loadContactForm : function ( event ) {
                     var newUrl           = this.formUrls[ 0 ][ this.contactType ];
                     window.location.href = newUrl;
                 },
                 resetTypes      : function () {
                     this.contactType = null;
                 },
                 resetPhoneNumber: function () {
                     this.phoneNumber      = {
                         type    : null,
                         intlCode: null,
                         areaCode: null,
                         number  : null,
                         ext     : null
                     };
                     this.phoneNumberValid = false;
    
                 },
                 editPhoneNumber : function ( index ) {
                     this.phoneEditMode    = true;
                     this.phoneEditIndex   = index;
                     this.phoneNumber      = this.phoneNumbers[ index ];
                     this.phoneNumberValid = true;
                 },
                 addAddress      : function () {
                     if ( !this.addressEditMode ) {
                         this.addresses.push( this.address );
                         this.resetAddress();
                     }
                     else {
                         this.addresses[ this.addressEditIndex ] = this.address;
                         this.resetAddress();
                         this.addressEditIndex = null;
                         this.addressEditMode  = false;
                     }
                 },
                 validateAddress : function () {
                     if ( !this.address.type || !this.address.addr1 ) {
                         this.addressValid = false;
                     }
                     else {
                         this.addressValid = true;
                     }
                 },
                 resetAddress    : function () {
                     this.address      = {
                         type                   : '',
                         otherType              : null,
                         dept                   : null,
                         billingContactFirstName: null,
                         billingContactLastName : null,
                         postalCode             : null,
                         addr1                  : null,
                         addr2                  : null,
                         city                   : null,
                         state                  : null,
                         country                : null
                     };
                     this.addressValid = false;
                 },
                 editAddress     : function ( index ) {
                     this.addressEditMode  = true;
                     this.addressEditIndex = index;
                     this.address          = this.addresses[ index ];
                     this.addressValid     = true;
                 },
                 removeAddress   : function ( index ) {
                     if ( confirm( 'Are you sure you want to remove this address?' ) ) {
                         this.addresses.splice( index, 1 );
                     }
                 },
                 setCityState    : function () {
                     this.address.city  = 'Fort Collins';
                     this.address.state = 'CO';
                 },
                 openHalfModal   : function () {
                     this.halfModalOpen = true;
                 },
    
                 closeHalfModal: function () {
                     this.halfModalOpen = false;
                 }
        
        
             }
         } );