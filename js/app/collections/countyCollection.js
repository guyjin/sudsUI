define([
    'nrm-map/collections/mapServiceCollection', 
    './stateCollection',
    'underscore', 
    'backbone'
], function(MapServiceCollection, StateCollection, _, Backbone) {
    
    var CountyCollection = MapServiceCollection.extend({
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
            //idAttribute: 'COUNTYCODE',
            idAttribute: 'COUNTYNAME'
        }),

        queryDefaults: {
            returnGeometry: true,
            outFields: ["STATECODE", "COUNTYCODE", "COUNTYNAME", "STATENAME", "STATE_POSTAL_ABBR"]
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

        states: function() {
            return new StateCollection(this.map(function(model) {
                return model.pick("STATECODE", "STATENAME", "STATE_POSTAL_ABBR");
            }));
        },

        /*counties: function() {


          var countyCollectionGroupedByState = this.map(function(model) {
                return _.extend(model.toJSON(),{'STATE_COUNTY_NAME' : model.get('COUNTYNAME') + ", " + model.get('STATENAME')});
            });

          var sortedArray = _(countyCollectionGroupedByState).chain().sortBy(function(county) {
                return county["STATENAME"];
            }).sortBy(function(county) {
                return county["COUNTYNAME"];;
            }).value();

            return new CountyCollection(sortedArray);
        },*/

        /*byState: function(stateCode) {
            var countiesByState = this.filter(function(model) {
                return model.get("STATECODE") === stateCode;
            })
            return new CountyCollection(countiesByState);
        },*/

        /*byState: function(stateName) {
            var countiesByState = this.filter(function(model) {
                return model.get("STATENAME") === stateName;
            })
            return new CountyCollection(countiesByState);
        },*/


        comparator: function(m1, m2) {

            var ret;
            var t1 =  m1.get("STATENAME"), t2 = m2.get("STATENAME");
            function cmp(t1, t2) {
                if (t1 < t2) {
                    return -1;
                } else if (t1 > t2) {
                    return 1;
                } else {
                    // note that this does not necessarily mean equality if the types are different
                    return 0;
                }
            }

            ret = cmp(t1, t2);//compare by state names
            // returns -1, 0 or 1
            return ret === 0 ? cmp(m1.get("COUNTYNAME"), m2.get("COUNTYNAME")) : ret;
        }
    });
    
    return CountyCollection;
});

