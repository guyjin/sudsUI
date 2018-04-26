/**
 * @fileoverview Parses a .prj file based on the coordinate system WKT format documented
 * here: {@link http://www.geoapi.org/3.0/javadoc/org/opengis/referencing/doc-files/WKT.html}
 * @author Stony Lohr
 */

define(['./shapefile'], function(ShapefileParser) {

    var PRJParser = function() {};

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
    return PRJParser;
});