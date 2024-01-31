/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(['app/collections/countiesCollection', 'underscore', 'backbone'], function(CountiesCollection, _, Backbone) {

    var StatesCollection = CountiesCollection.extend({
        //serviceInfo: 'COUNTIES_EDW',
        model: Backbone.Model.extend({
            idAttribute: 'stateName'
        }),

        parse: function() {
            var resp = CountiesCollection.prototype.parse.apply(this, arguments);

            resp =  _.uniq(resp, function(x){
                return x.stateName;
            });


            return resp;
        }
    });

    return StatesCollection;
});

