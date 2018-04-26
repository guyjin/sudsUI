define(['./panelView', "jquery", "nrm-ui"], function(PanelView, $, Nrm) {
    return PanelView.extend({
        events: $.extend({}, PanelView.prototype.events, PanelView.prototype.changeEvents), //We need this because PanelView is missing elements normally present in the EditorView
        genericTemplate: "form",
        getConfig: function() {
            return {
                hz: true,
                inputClass: 'input-sm',
                controls: [
                    {
                        "type" : "select",
                        "id" : "homeOrg", 
                        "prop" : "homeOrg",
                        "lov" : "lov/editableUnit", 
                        "required": true,
                        "placeholder": "Select Home Org", // If this is defined here, then it is not necessary in the "pluginOpt". "placeholderOption": "first" is also assumed in this case
                        "label" : "Home Org", // This is already defined in the schema. If this is uncommented, it overrrides what is there
                        "labelGrid" : "col-sm-3",
                        "hzGrid" : "col-sm-6"
                    }
                ]
            };
            
        }
//           startListening: function() {
//                LayoutView.prototype.startListening.apply(this, arguments);
//           }
    });
});