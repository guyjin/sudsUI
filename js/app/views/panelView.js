/**
 * Base view providing a generic rendering solution for nested views contained within EditorView implementations.
 * @file
 * @see module:app/views/common/panelView
 */
/**
 * @module app/views/common/panelView
 */
define([
    'nrm-ui/views/panelView',
    'jquery',
    'underscore',
    'backbone',
    'nrm-ui',
    'app/models/common/recordModel' ,

], function(PanelView, $, _, Backbone, Nrm,RecordModel) {

    return PanelView.extend(/** @lends module:nrm-ui/views/panelView.prototype */{

        render: function() {

            return PanelView.prototype.render.apply(this, arguments);
        },


        /* This will be used by all the child view to call custom updateAuth*/
        updateAuth: function () {

            var authorization = this.model.toJSON();

            var recordModel = new RecordModel({id: this.model.get('authorizationCn')});


            recordModel.save(authorization,{
                success : _.bind(function(model, resp, options) {
                    this.model.set(resp);

                },this) ,
                error : function(model, resp, options) {
                    var error = Nrm.app.normalizeErrorInfo('Failed to Save',
                        model, resp || model, options);
                    Nrm.event.trigger('showErrors', error, { allowRecall: false });
                }
            })
        },

    });
});