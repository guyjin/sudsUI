define(['nrm-ui/views/panelView', 'nrm-ui', 'jquery', 'underscore'], function(PanelView, Nrm, $, _) {
    
    var GeolocatorPanelView = PanelView.extend({

        initLovCallback: function(control, $el, collection) {

            if (control && control.prop && $el && $el.length > 0 && collection && collection.size() === 1) {
                // reset value only if collection has only one model
                var selector = (control.tablecell ? '.' : '#') + control.id, 
                        lovModel = collection.at(0), 
                        newValue,
                        autoSelect = _.bind(function($target) {
                            var bindings = this.getBindingForElement($target), 
                                    targetBinding, tempCtrl;
                                    
                            if (bindings && bindings.length) {
                                targetBinding = bindings[0];
                                // reset value only if it is currently not set
                                if (!targetBinding.value) {
                                    tempCtrl = $.extend({}, control, {value:newValue});
                                    this.setControlValue($target, tempCtrl);
                                    // trigger change to propagate control value to model and update dependent controls
                                    $target.trigger('change');
                                }
                            }
                        }, this);
                
                if (control.idAttr) {
                    // value to select is usually the model id, but maybe overridden in config
                    newValue = Nrm.app.getModelVal(lovModel, control.idAttr);
                } else {
                    // assume the model id is the value to select
                    newValue = lovModel.id;
                }
                if (newValue) {
                    // $el might be a parent element containing the control element
                    // if the control is a table cell, $el might be the matching elements in all rows
                    $el.each(function() {
                        var $this = $(this), $target = $this.is(selector) ? $this : $(selector, $this);
                        autoSelect($target);
                    });
                }
            }
            return PanelView.prototype.initLovCallback.apply(this, arguments);
        }
    });
    return GeolocatorPanelView;
});