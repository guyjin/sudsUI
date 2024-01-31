/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(['nrm-map/collections/mapServiceCollection', 'underscore', 'backbone'], function(MapServiceCollection, _, Backbone) {

    var QuadCollection = MapServiceCollection.extend({
        serviceInfo: 'COUNTIES_ARCX',

        servicesOptions: {
            refType: 'uiTest/geospatial/service',
            context: {
                loadType: 'auto',
                ajaxOptions: {
                    global: false
                }
            }
        },
        model: Backbone.Model.extend({
            idAttribute: 'quad'
        }),
        translation: {
            'STATECODE' :'stateCode',
            'COUNTYCODE' : 'countyCode',
            'COUNTYNAME' :'countName',
            'STATENAME' :'stateName',
            'ST_CNTY_CODE' : 'stateCountyCode'
        },
        parse: function() {
            var resp = MapServiceCollection.prototype.parse.apply(this, arguments);
            debugger
            _.each(resp, function(model) {
                var existing = this.get(model.quad);
                if (existing) {
                    model.quadCn = existing.get('quadCn');
                }
            }, this);
            return resp;
        }
    });

    return QuadCollection;
});
