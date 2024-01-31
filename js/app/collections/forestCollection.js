define([
    'nrm-map/collections/mapServiceCollection', 
    'esri/geometry/geometryEngine',
    'esri/geometry/jsonUtils',
    'underscore', 
    'backbone'
], function(MapServiceCollection, geometryEngine, geometryJsonUtils, _, Backbone) {
    
    var ForestCollection = MapServiceCollection.extend({
        serviceInfo: 'ADMIN FORESTS',

        service: new Backbone.Model({
            "description": "A map service on the fsweb depicting all the National Forest System lands administered by a unit.",
            "host": "EDW",
            "name": "ADMIN FORESTS",
            "id": "D75C3CAF604342289ECACA35AD973A04",
            "serviceType": "REST:ArcGIS Layer",
            "sourceLayer": "S_USA.AdministrativeForest",
            "status": "UP",
            //"uri": "https://apps.fs.usda.gov/arcn/rest/services/EDW/EDW_ForestSystemBoundaries_05/MapServer/0",
            "uri" : "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_ForestSystemBoundaries_01/MapServer/0",
            "useProxy": "N"
        }),

        model: Backbone.Model.extend({
            idAttribute: 'FORESTORGCODE'
        }),
        queryDefaults: {
            returnGeometry: true,
            outFields: ["FORESTORGCODE", "FORESTNAME"]
        },
        parseOptions: function(options) {
            options = options || {};
            options.params = _.defaults(options.params || {}, this.queryDefaults);
            return options;
        },
        parse: function(resp) {
            if (resp.features) {
                return _.map(resp.features, function(feature) {
                    return _.extend({ geometry: feature.geometry }, feature.attributes);
                });
            } else {
                return resp;
            }
        },
        overlay: function(geometry1, geometry2) {
            var overlayGeometry = (geometry1 && geometry2 && 
                    geometryEngine.intersect(geometry1, geometryJsonUtils.fromJson(geometry2))) || geometry1,
                    overlayResults = overlayGeometry && this.filter(function(model) {
                        var boundary = model.get('geometry');
                        // if geometry is not defined, assumed we have turned off returnGeometry so overlay should return all
                        return !boundary || geometryEngine.intersects(overlayGeometry, boundary);
                    });
            return new ForestCollection(overlayResults || []);
        },

        byForestCode: function(forestCode) {
            var forestModel = this.filter(function(model) {
                return model.get("FORESTORGCODE") === forestCode;
            })
            return new ForestCollection(forestModel);
        }

    });
    
    return ForestCollection;
});

