/**
 * @fileoverview Parses combinations of shp/dbf/prj files.
 * @author Stony Lohr
 * @see module:nrm-map/shapefileloader/shapefile
 */
/** 
 * @module nrm-map/shapefileloader/shapefile
 * 
 */
define(["require",
    "esri/layers/FeatureLayer",
    "esri/tasks/FeatureSet",
    "esri/graphic",
    "esri/SpatialReference",
    "esri/geometry/Multipoint",
    "esri/geometry/Point",
    "esri/geometry/Polyline",
    "esri/geometry/Polygon"],
        function(
                require,
                FeatureLayer,
                FeatureSet,
                Graphic,
                SpatialReference,
                MultiPoint,
                Point,
                Polyline,
                Polygon
                ) {
            var ShapefileParser = function() {
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

            ShapefileParser.loadAsFeatureLayer = function(files, callback, onerror, options) {
                var shp = null;
                var dbf = null;
                var prj = null;
                options = options || {};
                if (options.symbolType === undefined) {
                    options.symbolType = "imported";
                }
                var rootName = options.rootName || null;
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
                var firstError = null;

                // this is the one that finally returns data to the caller of loadAsFeatureLayer
                // TODO: if there are no attributes, create, populate and set an objectid field.
                _shpDataToFeatureLayer = function(shpData, dbfData, prjData, callback) {

                    var layer; // = new esri.layers.GraphicsLayer();
                    var symbol;
                    var oidFieldName = "NRMINDEX";
                    var fields = (dbfData) ? dbfData.fields : [{name: oidFieldName, length: 10, alias: oidFieldName, editable: false, nullable: true, type: "esriFieldTypeOID"}];
                    var sr;
                    if (prjData) {
                        sr = new SpatialReference(prjData.wkt || prjData.wkid);
                    }
                    for (var j = 0; j < shpData.records.length; j++) {
                        var shape = shpData.records[j].shape;
                        if (sr) {
                            shape.spatialReference = sr;
                        }
                        var geom = ShapefileParser.shapeToGeometry(shape);
                        var graphic = new Graphic(geom);
                        if (dbfData) {
                            graphic.attributes = dbfData.records[j];
                        } else {
                            graphic.attributes = {};
                            graphic.attributes[oidFieldName] = j;
                        }
                        if (j === 0) {
                            var geometryType = geom.type;
                            // set the "expanded" type value in order to support save/restore
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
                            var layerDefinition = {
                                "geometryType": geometryType,
                                "fields": fields,
                                "objectIdField": oidFieldName
                            };
                            var featureSet = new FeatureSet();
                            var featureCollection = {
                                layerDefinition: layerDefinition,
                                featureSet: featureSet
                            };
                            layer = new FeatureLayer(featureCollection, {
                                mode: FeatureLayer.MODE_SNAPSHOT
                            });
                        }
                        layer.add(graphic); //, symbol));
                    }
                    callback(layer);
                };

                function loadInternal() {
                    if (!firstError && (shpResult || !shp) && (dbfResult || !dbf) && (prjResult || !prj))
                        _shpDataToFeatureLayer(shpResult, dbfResult, prjResult, callback);
                }
                ;
                function onerrorInternal(evt) {
                    if (firstError)
                        return;
                    firstError = evt;
                    console.log("shapefile.js onerrorInternal is handling this: " + evt.message);
                    if (onerror)
                        onerror(evt);
                }
                ;

                require(["./dbf", "./prj", "./shp"], function(DBFParser, PRJParser, SHPParser) {
                    if (shp) {
                        //SHPParser.loadLocal(shp, function(shpData, file) {_shpDataToFeatureLayer(shpData, callback);}, onerrorInternal);
                        SHPParser.loadLocal(shp, function(shpData, file) {
                            shpResult = shpData;
                            loadInternal();
                        }, onerrorInternal);
                    }
                    if (dbf) {
                        DBFParser.loadLocal(dbf, function(dbfData, file) {
                            dbfResult = dbfData;
                            loadInternal();
                        }, onerrorInternal);
                    }
                    if (prj) {
                        PRJParser.loadLocal(prj, function(prjData, file) {
                            prjResult = prjData;
                            loadInternal();
                        }, onerrorInternal);
                    }
                });
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
                        geometry = new Point(shape.content.x, shape.content.y);
                        break;

                    case 8: // MultiPoint (MBR, pointCount, points)
                    case 18: // MultiPointZ
                    case 28: // MultiPointM
                        points = ShapefileParser.pathToArray(shape.content.points);
                        geometry = new MultiPoint({points: points});
//                        for (var k = 0; k < points.length; k++) {
//                            geometry.addPoint({x: points[k][0], y: points[k][1]});
//                        }
                        break;

                    case 3: // Polyline
                    case 13: // PolylineZ
                    case 23: // polylineM
                        // 12/28/2016 split into paths
                        geometry = new Polyline();
                        var parts = shape.content.parts;
                        if (parts.length === 1) {
                            points = ShapefileParser.pathToArray(shape.content.points);
                            geometry.addPath(points);
                        } else {
                            for (var k = 0; k < parts.length; k++) {
                                var start = 2 * parts[k];
                                if (k === parts.length - 1) {
                                    points = ShapefileParser.pathToArray(shape.content.points.subarray(start));
                                } else {
                                    points = ShapefileParser.pathToArray(shape.content.points.subarray(start, 2 * parts[k + 1]));
                                }
                                geometry.addPath(points);
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
                        geometry = new Polygon();
                        var polygonPoints;
                        var parts = shape.content.parts;
                        if (parts.length === 1) {
                            polygonPoints = ShapefileParser.pathToArray(shape.content.points);
                            geometry.addRing(polygonPoints);
                        } else {
                            for (var k = 0; k < parts.length; k++) {
                                var start = 2 * parts[k];
                                if (k === parts.length - 1) {
                                    polygonPoints = ShapefileParser.pathToArray(shape.content.points.subarray(start));
                                } else {
                                    polygonPoints = ShapefileParser.pathToArray(shape.content.points.subarray(start, 2 * parts[k + 1]));
                                }
                                geometry.addRing(polygonPoints); // ebodin 9/26/2016 replaced shape.content.points.subarray(2 * parts[k], 2 * parts[k + 1]));
                                if (2 * parts[k + 1] > shape.content.points.length) {
                                    throw new Error('part index beyond points array end');
                                }
                            }
                        }
                        break;
                }
                //geometry = esri.geometry.webMercatorToGeographic(geometry);
                //nrmmap._consoleDir(geometry);
                if (shape.spatialReference) {
                    geometry.spatialReference = shape.spatialReference;
                }
                return geometry;

            };
            return ShapefileParser;
        });