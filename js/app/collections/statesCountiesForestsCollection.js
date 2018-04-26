/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(['nrm-map/collections/mapServiceCollection', 'underscore', 'backbone'], function(MapServiceCollection, _, Backbone) {

    var StatesCountiesAndForestsCollection = MapServiceCollection.extend({
        serviceInfo: 'STATES',
        model: Backbone.Model.extend({
            idAttribute: 'quad'
        }),
        translation: {
            'CELL_NAME': 'quad'
        },
        parse: function() {
            var resp = MapServiceCollection.prototype.parse.apply(this, arguments);
            _.each(resp, function(model) {
                var existing = this.get(model.quad);
                if (existing) {
                    model.quadCn = existing.get('quadCn');
                }
            }, this);
            return resp;
        }
    });

    return StatesCountiesAndForestsCollection;
});

