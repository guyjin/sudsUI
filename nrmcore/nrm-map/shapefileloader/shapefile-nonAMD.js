/**
 * @fileoverview Parses combinations of shp/dbf/prj files.
 * @author Stony Lohr
 */

ShapefileParser = function() {
            };

            /**
             * Executes a XHR to load a .shp/dbf/prj file and then creates a callback to
             * handle the result.
             * @param {string} url URL to the input file.
             * @param (string) responseType The response type to use for the xhr.
             * @param {function(Object)} callback the function to be called when finished.
             * @param {Function} onerror the function to be called in case of an error
             *                   loading the file.
             */
            ShapefileParser._load = function(parser, url, readAsBinary, callback, onerror) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                if (readAsBinary)
                    xhr.responseType = 'arraybuffer';
                xhr.onload = function() {
                    var d = parser.parse(xhr.response, url);
                    callback(d);
                };
                xhr.onerror = onerror;
                xhr.send(null);
            };

            ShapefileParser._loadLocal = function(parser, file, readAsBinary, callback, onerror) {
                var reader = new FileReader();
                reader.onload = function(evt) {
                    try {
                        var d = parser.parse(evt.target.result, file);
                        callback(d);
                    } catch (e) {
                        onerror(e);
                    }
                };
                reader.onerror = onerror;
                if (readAsBinary)
                    reader.readAsArrayBuffer(file);
                else
                    reader.readAsText(file);
            };

            ShapefileParser.loadAsFeatureCollection = function(files, callback, onerror, options) {
                var shp = null;
                var dbf = null;
                var prj = null;
                options = options || {};
                if (options.symbolType === undefined) {
                    options.symbolType = "imported";
                }
                var rootName = options.rootName || null;
                //console.log("ShapefileParser.loadAsFeatureCollection for rootName " + rootName);
                for (var i = 0, c = files.length; i < c; ++i) {
                    var name = files[i].name.toLowerCase();
                    var suffixStart = name.length - 4;
                    if (suffixStart < 1)
                        throw new Error("File name too short: " + files[i].name);

                    var rootCurrent = name.substring(0, suffixStart);
                    if (rootName === null) {
                        rootName = rootCurrent;
                    } else if (rootName.toLowerCase() !== rootCurrent) {
                        //throw new Error("Inconsistent file base names.");
                        continue;
                    }

                    var suffix = name.substring(suffixStart);
                    switch (suffix) {
                        case '.shp':
                            shp = files[i];
                            break;
                        case '.dbf':
                            dbf = files[i];
                            break;
                        case '.prj':
                            prj = files[i];
                            break;
                    }
                }

                try {
                    if (!shp || !dbf || !prj)
                        throw new Error("Input does not appear to be a shapefile (missing .dbf, .prj, or .shp): " + rootName);
                } catch (e) {
                    onerrorInternal(e);
                    return;
                }
                var shpResult = null;
                var dbfResult = null;
                var prjResult = null;
                
                function advanceProgress(marginalPercentComplete) {
                    //console.log("advanceProgress by " + marginalPercentComplete.toString());
                    if (options.progressCallback) {
                        options.progressCallback(marginalPercentComplete);
                    }
                }

                // this is the one that finally returns data to the caller of loadAsFeatureLayer
                // TODO: if there are no attributes, create, populate and set an objectid field.
                _shpDataToFeatureCollection = function(shpData, dbfData, prjData, callback) {
                    var oidFieldName = "NRMINDEX";
                    var fields = (dbfData) ? dbfData.fields : [{
                            name: oidFieldName, 
                            length: 10, 
                            alias: oidFieldName, 
                            editable: false, 
                            nullable: true, 
                            type: "esriFieldTypeOID"}
                    ];
                    var layerDefinition = {
                        "fields": fields,
                        "objectIdField": oidFieldName
                    };
                    var features = [];
                    for (var j = 0; j < shpData.records.length; j++) {
                        var shape = shpData.records[j].shape;
                        if (prjData) {
                            shape.spatialReference = prjData;
                        }
                        var geom = ShapefileParser.shapeToGeometry(shape);
                        var graphic = {geometry: geom};
                        if (dbfData) {
                            graphic.attributes = dbfData.records[j];
                        } else {
                            graphic.attributes = {};
                            graphic.attributes[oidFieldName] = j;
                        }
                        if (j === 0) {
                            var geometryType = geom.type;
                            // set the "expanded" type value in order to support save/restore
                            //console.log("shapefileparser first geometry type " + geom.type);
                            switch (geom.type) {
                                case "point":
                                    geometryType = "esriGeometryPoint";
                                    break;
                                case "multipoint":
                                    geometryType = "esriGeometryMultipoint";
                                    break;
                                case "polyline":
                                    geometryType = "esriGeometryPolyline";
                                    break;
                                case "polygon":
                                    geometryType = "esriGeometryPolygon";
                                    break;
                            }
                            layerDefinition.geometryType = geometryType;
                        }
                        features.push(graphic);
                        advanceProgress( 50 / shpData.records.length); //this process is 50% of overall processing
                    }
                    var featureSet = {
                        features: features,
                        geometryType: layerDefinition.geometryType,
                        spatialReference: prjData
                    };
                    if (prjData) {
                        layerDefinition.spatialReference = prjData;
                        featureSet.spatialReference = prjData;
                    }
                    //console.log("  returning featureCollection ", JSON.stringify({layerDefinition: layerDefinition, featureSet: featureSet}));
                    callback({layerDefinition: layerDefinition, featureSet: featureSet});
                };

                function loadInternal() {
                    //console.log("rootName in loadInternal " + rootName);
                    if ((shpResult || !shp) && (dbfResult || !dbf) && (prjResult || !prj))
                        _shpDataToFeatureCollection(shpResult, dbfResult, prjResult, callback);
                }
                function onerrorInternal(evt) {
                    evt = evt || {};
                    evt.message = evt.message || "Unspecified";
                    console.warn("shapefile-nonAMD.js onerrorInternal is handling this: " + evt.message + " for rootName " + rootName);
                    if (onerror) {
                        onerror(evt);
                    }
                }

                if (shp) {
                    SHPParser.loadLocal(shp, function(shpData, file) {
                        shpResult = shpData;
                        advanceProgress(25);
                        loadInternal();
                    }, onerrorInternal);
                }
                if (dbf) {
                    DBFParser.loadLocal(dbf, function(dbfData, file) {
                        dbfResult = dbfData;
                        advanceProgress(25);
                        loadInternal();
                    }, onerrorInternal);
                }
                if (prj) {
                    PRJParser.loadLocal(prj, function(prjData, file) {
                        prjResult = prjData;
                        loadInternal();
                    }, onerrorInternal);
                }
            };

            ShapefileParser.pathToArray = function(shapeContentPoints) {
                var coords = [];
                for (var i = 0; i < shapeContentPoints.length; i += 2) {
                    coords.push([shapeContentPoints[i], shapeContentPoints[i + 1]]);
                }
                return coords;
            };

            ShapefileParser.shapeToGeometry = function(shape) {
                var geometry, points;
                switch (shape.type) {
                    case 1:
                    case 11: // PointZ (X, Y, Z, M)
                    case 21: // PointM (X, Y, M)
                        geometry = {type: "point", x: shape.content.x, y: shape.content.y};
                        break;

                    case 8: // MultiPoint (MBR, pointCount, points)
                    case 18: // MultiPointZ
                    case 28: // MultiPointM
                        points = ShapefileParser.pathToArray(shape.content.points);
                        geometry = {type: "multipoint", points: points};
                        break;

                    case 3: // Polyline
                    case 13: // PolylineZ
                    case 23: // polylineM
                        // 12/28/2016 split into paths
                        geometry = {type: "polyline", paths: []};
                        var parts = shape.content.parts;
                        if (parts.length === 1) {
                            points = ShapefileParser.pathToArray(shape.content.points);
                            geometry.paths.push(points);
                        } else {
                            for (var k = 0; k < parts.length; k++) {
                                var start = 2 * parts[k];
                                if (k === parts.length - 1) {
                                    points = ShapefileParser.pathToArray(shape.content.points.subarray(start));
                                } else {
                                    points = ShapefileParser.pathToArray(shape.content.points.subarray(start, 2 * parts[k + 1]));
                                }
                                geometry.paths.push(points);
                                if (2 * parts[k + 1] > shape.content.points.length) {
                                    throw new Error('part index beyond points array end');
                                }
                            }
                        }
                        break;

                    case 15: // PolygonZ
                    case 25: // PolygonM
                    case 5:
                        // split into rings
                        geometry = {type: "polygon", rings: []};
                        var polygonPoints;
                        var parts = shape.content.parts;
                        if (parts.length === 1) {
                            polygonPoints = ShapefileParser.pathToArray(shape.content.points);
                            geometry.rings.push(polygonPoints);
                        } else {
                            for (var k = 0; k < parts.length; k++) {
                                var start = 2 * parts[k];
                                if (k === parts.length - 1) {
                                    polygonPoints = ShapefileParser.pathToArray(shape.content.points.subarray(start));
                                } else {
                                    polygonPoints = ShapefileParser.pathToArray(shape.content.points.subarray(start, 2 * parts[k + 1]));
                                }
                                geometry.rings.push(polygonPoints); // ebodin 9/26/2016 replaced shape.content.points.subarray(2 * parts[k], 2 * parts[k + 1]));
                                if (2 * parts[k + 1] > shape.content.points.length) {
                                    throw new Error('part index beyond points array end');
                                }
                            }
                        }
                        break;
                }
                if (shape.spatialReference) {
                    geometry.spatialReference = shape.spatialReference;
                }
                return geometry;

};

DBFParser = function() {};

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

PRJParser = function() {};

    PRJParser.loadLocal = function(file, callback, onerror) {
        ShapefileParser._loadLocal(new PRJParser(), file, false, callback, onerror);
    };

    PRJParser.load = function(url, callback, onerror) {
        ShapefileParser._load(new PRJParser(), url, false, callback, onerror);
    };

    /**
     * Parses through the .prj file
     * @param {string} wkt the string created by loading the file in XHR.
     * @return {object} sr An object representing the .prj file.
     */
    PRJParser.prototype.parse = function(wkt,src) {
      var sr = {};
      sr.wkt = wkt;
      var wktUpper = wkt.toUpperCase();
      var srType = wktUpper.substring(0, 6);
      sr.isGeographic = srType === "GEOGCS";
      sr.isProjected = srType === "PROJCS";
      return sr;
    };


    var SHP = {
      NULL: 0,
      POINT: 1,
      POLYLINE: 3,
      POLYGON: 5
    };

    SHP.getShapeName = function(id) {
      for (name in this) {
        if (id === this[name]) {
          return name;
        }
      }
    };

var SHPParser = function() {
    };

    SHPParser.loadLocal = function(file, callback, onerror) {
        ShapefileParser._loadLocal(new SHPParser(), file, true, callback, onerror);
    };

    SHPParser.load = function(url, callback, onerror) {
        ShapefileParser._load(new SHPParser(), url, true, callback, onerror);
    };

    SHPParser.prototype.parse = function(arrayBuffer,src) {
      var o = {};
      var dv = new DataView(arrayBuffer);
      var idx = 0;
      o.fileName = src;
      o.fileCode = dv.getInt32(idx, false);
      if (o.length < 100) {
        throw (new Error("Not a valid shape file header (too small)"));
      }
      if (o.fileCode != 0x0000270a) { // 9994
        throw (new Error("Unknown file code: " + o.fileCode));
      }
      idx += 6*4;
      o.wordLength = dv.getInt32(idx, false);
      o.byteLength = o.wordLength * 2;
      idx += 4;
      o.version = dv.getInt32(idx, true);
      idx += 4;
      o.shapeType = dv.getInt32(idx, true);
      idx += 4;
      o.minX = dv.getFloat64(idx, true);
      o.minY = dv.getFloat64(idx+8, true);
      o.maxX = dv.getFloat64(idx+16, true);
      o.maxY = dv.getFloat64(idx+24, true);
      o.minZ = dv.getFloat64(idx+32, true);
      o.maxZ = dv.getFloat64(idx+40, true);
      o.minM = dv.getFloat64(idx+48, true);
      o.maxM = dv.getFloat64(idx+56, true);
      idx += 8*8;
      o.records = [];
      while (idx < o.byteLength) {
        var record = {};
        record.number = dv.getInt32(idx, false);
        idx += 4;
        record.length = dv.getInt32(idx, false);
        idx += 4;
        record.shape = this.parseShape(dv, idx, record.length);
        idx += record.length * 2;
        o.records.push(record);
      }
      return o;
    };

    SHPParser.prototype.parseShape = function(dv, idx, length) {
      var i=0, c=null;
      var shape = {};
      shape.type = dv.getInt32(idx, true);
      idx += 4;
      var byteLen = length * 2;
      switch (shape.type) {
        case SHP.NULL: // Null
          break;

        case SHP.POINT: // Point (x,y)
        case 11: // PointZ (X, Y, Z, M)
        case 21: // PointM (X, Y, M)
          shape.content = {
            x: dv.getFloat64(idx, true),
            y: dv.getFloat64(idx+8, true)
          };
          break;
        case SHP.POLYLINE: // Polyline (MBR, partCount, pointCount, parts, points)
        case SHP.POLYGON: // Polygon (MBR, partCount, pointCount, parts, points)
        case 13: // PolylineZ
        case 15: // PolygonZ
        case 23: // polylineM
        case 25: // PolygonM
          c = shape.content = {
            minX: dv.getFloat64(idx, true),
            minY: dv.getFloat64(idx+8, true),
            maxX: dv.getFloat64(idx+16, true),
            maxY: dv.getFloat64(idx+24, true),
            parts: new Int32Array(dv.getInt32(idx+32, true)),
            points: new Float64Array(dv.getInt32(idx+36, true)*2)
          };
          idx += 40;
          for (i=0; i<c.parts.length; i++) {
            c.parts[i] = dv.getInt32(idx, true);
            idx += 4;
          }
          for (i=0; i<c.points.length; i++) {
            c.points[i] = dv.getFloat64(idx, true);
            idx += 8;
          }
          break;

        case 8: // MultiPoint (MBR, pointCount, points)
        case 18: // MultiPointZ
        case 28: // MultiPointM
          c = shape.content = {
            minX: dv.getFloat64(idx, true),
            minY: dv.getFloat64(idx+8, true),
            maxX: dv.getFloat64(idx+16, true),
            maxY: dv.getFloat64(idx+24, true),
            points: new Float64Array(dv.getInt32(idx+32, true)*2)
          };
          idx += 36;
          for (i=0; i<c.points.length; i++) {
            c.points[i] = dv.getFloat64(idx, true);
            idx += 8;
          }
          break;
          
        case 31: // MultiPatch
          throw new Error("Shape type not supported: " + shape.type);
        default:
          throw new Error("Unknown shape type at " + (idx-4) + ': ' + shape.type);
      }
      return shape;
    };
