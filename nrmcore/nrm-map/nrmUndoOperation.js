/**
 * @file        NRM Undo Operation
 * @see module:nrm-map/nrmUndoOperation
 */
/** 
 * @module nrm-map/nrmUndoOperation
 * 
 */

define([
  "dojo/_base/declare", "esri/OperationBase", 'nrm-ui', 'esri/geometry/jsonUtils', 'jquery', 'underscore'
  ], function(declare, OperationBase, Nrm, JSONUtils, $, _) {
    var customOp = {};
    
    customOp.AddGraphic = declare(OperationBase, {
      label: "Add Graphic",
      constructor: function ( oldShape, options) {
        this.options = options = options || {};
        this.oldShape = (oldShape == null) ? null : JSONUtils.fromJson(oldShape); // LW: Fix needed for initial case where there is no "old" geometry.
        this.newShape = (options.geometry == null) ? null : JSONUtils.fromJson($.extend(true, {}, options.geometry));
      },
      
      performUndo: function () {
        if (_.isFunction(this.options.newFlmValues)) {
            // obtain the current FLM values at time of undo so we can restore them later.
            this.newFlmValues = this.options.newFlmValues.call(this);
        }
        var attributes = _.extend({}, this.options.attributes, this.options.oldFlmValues);
        //Nrm.event.trigger("map:endDraw", {geometry: this.oldShape, attributes: attributes, event: "onUndo"});
        var options = {geometry: this.oldShape, attributes: attributes, event: "onUndo", simplify: true};
        Nrm.event.trigger("map:featureCreate", options);
        this.oldShape = options.geometry; // in case simplification occurred, we only want to do that once
        Nrm.event.trigger("map:activateEditMode", this.oldShape, {
            id: this.options.attributes.id,
            elemId: this.options.attributes.elemId
        }, {
            zoomTo: false,
            undoManager: this.options.undoManager
        });
      },

      performRedo: function () {
        var attributes = _.extend({}, this.options.attributes, this.newFlmValues);
        //Nrm.event.trigger("map:endDraw", {geometry: this.newShape, attributes: attributes, event: "onRedo"});
        var options = {geometry: this.newShape, attributes: attributes, event: "onRedo", simplify: true};
        Nrm.event.trigger("map:featureCreate", options);
        this.newShape = options.geometry; // in case simplification occurred, we only want to do that once
        Nrm.event.trigger("map:activateEditMode", this.newShape, {
            id: this.options.attributes.id,
            elemId: this.options.attributes.elemId
        }, {
            zoomTo: false,
            undoManager: this.options.undoManager
        });
      }
  });

  return customOp;
});
