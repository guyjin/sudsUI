/**
 * @file Emits global events using {@link http://backbonejs.org/#Events|Backbone.Events API} 
 * @see module:nrm-ui/event
 */
/**
 * 
 * @module nrm-ui/event
 */
define(['underscore', 'backbone'], function(_, Backbone) {
    /**
     * Create a new instance of the Events module.
     * @constructor
     * @alias module:nrm-ui/event
     * @classdesc
     *  A class that mixes in {@link http://backbonejs.org/#Events|Backbone.Events} to emit global events. 
     * @see {@link http://backbonejs.org/#Events|Backbone.Events} 
     */
    var Events = function() {
    }
    Events.prototype = _.extend({}, Backbone.Events);
    return Events;
});

