/**
 * @fileoverview Parses a .dbf file based on the xbase standards as documented
 * here: {@link http://www.clicketyclick.dk/databases/xbase/format/dbf.html}
 * @author Mano Marks
 */

define(['./shapefile'], function(ShapefileParser) {

    var DBFParser = function() {};

    DBFParser.loadLocal = function(file, callback, onerror) {
        ShapefileParser._loadLocal(new DBFParser(), file, true, callback, onerror);
    };

    DBFParser.load = function(url, callback, onerror) {
        ShapefileParser._load(new DBFParser(), url, true, callback, onerror);
    };

    /**
     * Parses through the .dbf file byte by byte
     * @param {arraybuffer} arrayBuffer the ArrayBuffer created by loading the file
     *                        in XHR.
     * @return {object} o An object representing the .dbf file.
     */
    DBFParser.prototype.parse = function(arrayBuffer,src) {
      var o = {};
      var dv = new DataView(arrayBuffer);
      var idx = 0;
      o.fileName = src;
      o.version = dv.getInt8(idx, false);

      idx += 1;
      o.year = dv.getUint8(idx) + 1900;
      idx += 1;
      o.month = dv.getUint8(idx);
      idx += 1;
      o.day = dv.getUint8(idx);
      idx += 1;

      o.numberOfRecords = dv.getInt32(idx, true);
      idx += 4;
      o.bytesInHeader = dv.getInt16(idx, true);
      idx += 2;
      o.bytesInRecord = dv.getInt16(idx, true);
      idx += 2;
      //reserved bytes
      idx += 2;
      o.incompleteTransation = dv.getUint8(idx);
      idx += 1;
      o.encryptionFlag = dv.getUint8(idx);
      idx += 1;
      // skip free record thread for LAN only
      idx += 4;
      // reserved for multi-user dBASE in dBASE III+
      idx += 8;
      o.mdxFlag = dv.getUint8(idx);
      idx += 1;
      o.languageDriverId = dv.getUint8(idx);
      idx += 1;
      // reserved bytes
      idx += 2;

      o.fields = [];
      while (true) {
        var field = {};
        var nameArray = [];
        for (var i = 0; i < 10; i++) {
          var letter = dv.getUint8(idx);
          if (letter != 0) nameArray.push(String.fromCharCode(letter));
          idx += 1;
        }
        field.name = nameArray.join('');
        idx += 1;
        //field.type = String.fromCharCode(dv.getUint8(idx));
        field.fieldType = String.fromCharCode(dv.getUint8(idx));
        idx += 1;
        // Skip field data address
        idx += 4;
        field.fieldLength = dv.getUint8(idx);
        idx += 1;
        //field.decimalCount = dv.getUint8(idx);
        idx += 1;
        // Skip reserved bytes multi-user dBASE.
        idx += 2;
        field.workAreaId = dv.getUint8(idx);
        idx += 1;
        // Skip reserved bytes multi-user dBASE.
        idx += 2;
        field.setFieldFlag = dv.getUint8(idx);
        idx += 1;
        // Skip reserved bytes.
        idx += 7;
        field.indexFieldFlag = dv.getUint8(idx);
        idx += 1;
    // for shapefiles
        field.length = field.fieldLength;
        field.alias = field.name;
        field.editable = false;
        field.nullable = true;
        switch (field.fieldType){
            case "N":
                //if (field.name = "OBJECTID") {
                //    field.type = "esriFieldTypeOID";
                //}
                //else {
                    field.type = "esriFieldTypeDouble"; // could probably discriminate more here
                //}
                break;
            case "F":
                field.type = "esriFieldTypeSingle";
                break;
            case "D":
                field.type = "esriFieldTypeDate";
                break;
            //case "C":
            default:
                field.type = "esriFieldTypeString";
                break;
        }

    // end for shapefiles
        o.fields.push(field);
        var test = dv.getUint8(idx);
        // Checks for end of field descriptor array. Valid .dbf files will have this
        // flag.
        if (dv.getUint8(idx) == 0x0D) break;
      }

      // set up our own primary key field
      var nrmindexfieldname = "NRMINDEX";
      var field = {};
      field.name = nrmindexfieldname;
      field.length = 10;
      field.alias = field.name;
      field.editable = false;
      field.nullable = true;
      field.type = "esriFieldTypeOID";
      o.fields.push(field);

      idx += 1;
      o.records = [];

      for (var i = 0; i < o.numberOfRecords; i++) {
        var record = {};
        // Skip record deleted flag.
        //record["recordDeleted"] = String.fromCharCode(dv.getUint8(idx));
        idx += 1;
        //for (var j = 0; j < o.fields.length; j++) {
        for (var j = 0; j < o.fields.length - 1; j++) { // -1 to account for nrmindex field
          var charString = [];
          for (var h = 0; h < o.fields[j].fieldLength; h++) {
            charString.push(String.fromCharCode(dv.getUint8(idx)));
            idx += 1;
          }
          record[o.fields[j].name] = charString.join('').trim();
        }
        record[o.fields[o.fields.length - 1].name] = i.toString();
        o.records.push(record);
      }

      return o;
    };
    return DBFParser;
});