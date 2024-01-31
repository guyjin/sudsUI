/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(['nrm-map/collections/mapServiceCollection', 'underscore', 'backbone'], function(MapServiceCollection, _, Backbone) {

    return MapServiceCollection.extend({

        service: new Backbone.Model({
            "description": "A depiction of a survey parcel described by a metes and bounds description." +
            "Examples include: land lots, housing subdivision lots, mineral surveys, and homestead entry surveys." +
            " Go to this URL for full metadata description: http://data.fs.usda.gov/geodata/edw/edw_resources/meta/S_USA.Tract.xml",
            "host": "EDW",
            "name": "TOWNSHIP",
            "id": "D75C3CAF604342289ECACA35AD973A04",
            "serviceType": "REST:ArcGIS Layer",
            /*"sourceLayer": "S_USA.AdministrativeForest",
            "status": "UP",*/
            "uri" : "https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_Tract_01/MapServer/0",
            /*"useProxy": "N"*/
        }),

        model: Backbone.Model.extend({
            /*idAttribute: 'TWNSHPNO'*/
        }),


        translation: {
            'OBJECTID' : 'objectId',
            //'SHAPE' : 'shape',
            'TRACTID' : 'tractId',
            'TRACTTYPE' : 'tractType',
            'TRACTNUMBER' : 'tractNumber',
            'SUBTYPENAME' : 'subTypeName',
            'PROVISIONAL':'provisional',
            'SURVEYACRES' : 'surveyAcres',
            'COMMENTS' : 'comments',
            'REGION' : 'region',
        },


        parse: function() {

            var resp = MapServiceCollection.prototype.parse.apply(this, arguments);

            return resp;
        }
    });

});

