/**
 * @file The GUID module provides a pseudo-GUID implementation for generating unique IDs formatted like a GUID on the
 * client.  
 * @see module:nrm-ui/guid
 */
/** 
 * @module nrm-ui/guid
 * 
 */
define([], function() {
    function S4() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }

    //function guid() {
    // return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    //}
    // Generate a pseudo-GUID by concatenating random hexadecimals
    // matching GUID version 4 and the standard variant.
    var VERSION_VALUE = 0x4;// Bits to set
    var VERSION_CLEAR = 0x0;// Bits to clear
    var VARIANT_VALUE = 0x8;// Bits to set for Standard variant (10x)
    var VARIANT_CLEAR = 0x3;// Bits to clear
    function guid() {
        var data3_version = S4();
        data3_version = (parseInt( data3_version.charAt( 0 ), 16 ) & VERSION_CLEAR | VERSION_VALUE).toString( 16 )
         + data3_version.substr( 1, 3 );
        var data4_variant = S4();
        data4_variant = data4_variant.substr( 0, 2 )
         + (parseInt( data4_variant.charAt( 2 ), 16 ) & VARIANT_CLEAR | VARIANT_VALUE).toString( 16 )
         + data4_variant.substr( 3, 1 );
        return( S4() + S4() + '-' + S4() + '-' + data3_version + '-' + data4_variant + '-' + S4() + S4() + S4());
    }
    return /**@lends module:nrm-ui/guid */{ 
        /**
         * Generate a pseudo-GUID by concatenating random hexadecimals matching GUID version 4 and the standard variant.
         * @function
         * @returns {string} A pseudo-GUID value
         */
        guid : guid 
    };
});

