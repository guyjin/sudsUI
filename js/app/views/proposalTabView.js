define(['./panelView', "jquery", "nrm-ui", 'underscore','use!select2','nrm-map/views/spatialEditView'],
    function (PanelView, $, Nrm, _,select2,SpatialEditView) {

    return PanelView.extend({


        getConfig: function () {

            var config = PanelView.prototype.getConfig.apply(this, arguments);

/*
            config = { "hz" : true,
                /!*"helpContext": "Site_Edit.html",*!/
                "inputClass" : "input-sm",
                "ensureVisible" : true}
*/

            config.controls = [{
                type: 'collapse',
                id: 'collapseExample',
                config: {
                    controls: [
                        {
                            id: 'testInput',
                            prop: 'test1',
                            label: 'Test 1',
                            type: 'inputText',
                            grid: 'col-sm-6',
                            labelGrid: 'col-sm-3',
                            hzGrid: 'col-sm-9'
                        }
                    ]
                },
                btn: {label: 'Show Details'},
                label: 'More Details',
                fields: ['test1']
            },
                {
                    type: 'accordion',
                    id: 'accordionExample',
                    controls: [
                        {
                            id: 'accordionPanelExample',
                            config: {
                                containerClass: 'panel-body nrm-edit-panel-body',
                                controls: [
                                    {
                                        id: 'testInput2',
                                        prop: 'test2',
                                        label: 'Test 2',
                                        type: 'inputText',
                                        grid: 'col-sm-6',
                                        labelGrid: 'col-sm-3',
                                        hzGrid: 'col-sm-9'
                                    }
                                ]

                            },
                            header: 'More Details in an Accordion',
                            btn: true,
                            expand: true,
                            /*actions: this.actions,*/
                            fields: ['test2']
                        }
                    ]
                }]

            return config;
        },



        render : function () {


           return  PanelView.prototype.render.apply(this, arguments);
        }


    });
});