define([
    'nrm-map/collections/mapServiceCollection', 
    'underscore', 
    'backbone'
], function(MapServiceCollection, _, Backbone) {
    
    var StateCollection = MapServiceCollection.extend({
        serviceInfo: 'STATES',

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
            //idAttribute: 'STATECODE',
            idAttribute: 'STATENAME'
        }),
        queryDefaults: {
            outFields: [
                "S_USA.State_Gen.STATECODE", 
                "S_USA.State_Gen.STATENAME", 
                "S_USA.State_Gen.STATE_POSTAL_ABBR"
            ]
        },
        translation: {
            "S_USA.State_Gen.STATECODE": "STATECODE",
            "S_USA.State_Gen.STATENAME": "STATENAME",
            "S_USA.State_Gen.STATE_POSTAL_ABBR": "STATE_POSTAL_ABBR"
        },
        parseOptions: function(options) {
            options = options || {};
            options.params = _.defaults(options.params || {}, this.queryDefaults);
            return options;
        }
    });
    
    return StateCollection;
});

