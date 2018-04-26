/**
 * @fileoverview Shapefile parser, following the specification at 
 * {@link http://www.esri.com/library/whitepapers/pdfs/shapefile.pdf}
 */
// History:
//  06/18/2014 imported from https://www.e-education.psu.edu/geog863/node/1959
//  07/14/2014 ebodin.  Treat polylineM the same as polyline (i.e. import without measures)

define(['./shapefile'], function(ShapefileParser) {
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
    return SHPParser;
});