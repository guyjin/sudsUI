/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(['nrm-map/collections/mapServiceCollection', 'underscore', 'backbone'], function(MapServiceCollection, _, Backbone) {

    var StatesAndCountyCollection = MapServiceCollection.extend({

        serviceInfo: /*'COUNTIES_EDW'*/'COUNTIES_ARCX',

        model: Backbone.Model.extend({
            idAttribute: 'countyName'
        }),


        translation: {
            'STATENAME': 'stateName',
            'STATECODE' :'stateCode',
            'COUNTYNAME' : 'countyName',
            'COUNTYCODE' : 'countyCode',
            'ST_CNTY_CODE' : 'stateCountyCode'
        },

        servicesOptions: {
            refType: 'uiTest/geospatial/service',
            context: {
                loadType: 'auto',
                ajaxOptions: {
                    global: false
                }
            }
        },
        parse: function() {
            var resp = MapServiceCollection.prototype.parse.apply(this, arguments);

            return resp;
        }
    });

    return StatesAndCountyCollection;
});

