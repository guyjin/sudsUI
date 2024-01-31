/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(['nrm-map/collections/mapServiceCollection', 'underscore', 'backbone'], function(MapServiceCollection, _, Backbone) {

    var QuadCollection = MapServiceCollection.extend({
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
            idAttribute: 'forestOrGCode'
        }),


        /*ADMINREGIONID ( type: esriFieldTypeString , alias: ADMINREGIONID , length: 40 )
            REGION ( type: esriFieldTypeString , alias: REGION , length: 2 )
            REGIONNAME ( type: esriFieldTypeString , alias: REGIONNAME , length: 30 )
            REGIONHEADQUARTERS ( type: esriFieldTypeString , alias: REGIONHEADQUARTERS , length: 150 )
            SHAPE ( type: esriFieldTypeGeometry , alias: Shape )
            FS_ADMINACRES ( type: esriFieldTypeDouble , alias: FS_ADMINACRES )
            OBJECTID ( type: esriFieldTypeOID , alias: OBJECTID )
            SHAPE_Length ( type: esriFieldTypeDouble , alias: SHAPE_Length )
            SHAPE_Area ( type: esriFieldTypeDouble , alias: SHAPE_Area )
            */
        translation: {
             'ADMINFORESTID': 'adminForestId',
             'REGION' :'region',
             'FORESTNAME' : 'forestName',
            'FORESTORGCODE': 'forestOrGCode'
            /* 'SHAPE' : 'forestShape'*/
        },



        /*servicesOptions: {
            refType: 'uiTest/geospatial/service',
            context: {
                loadType: 'auto',
                ajaxOptions: {
                    global: false
                }
            }
        },*/

        parse: function(resp) {

           /* var geometryFeatures = resp && resp.features;*/

            var resp = MapServiceCollection.prototype.parse.apply(this, arguments);

            /*if (geometryFeatures){
                _.each(resp, function(model) {
                    var geometryShape  = _.find(geometryFeatures,function (geometryObj) {
                                        return geometryObj.attributes['ADMINREGIONID'] == model.adminRegionId
                    })

                    model.forestShape = geometryShape.geometry;;

                }, this);

            }*/

            return resp;
        }
    });

    return QuadCollection;
});

