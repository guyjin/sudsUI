/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define(['backbone','underscore'], function (Backbone, _) {

    return Backbone.View.extend({
        initialize: function (options) {
            this.options = options;
        },
        render: function () {
            this.$el.html('<h1>Hello World</h1>')
        }
    })
});
