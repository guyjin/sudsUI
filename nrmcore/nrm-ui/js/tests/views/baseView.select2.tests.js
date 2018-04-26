define([
    'module',
    'jquery',
    'backbone',
    '../..',
    '../../models/application', 
    '../api/views/unitTestView',
    'hbs!select',
    'use!select2'
], function(module, $, Backbone, Nrm, Application, UnitTestView, selectTemplate, Select2)
{

    // LW: Used to test for the presence of DOM elements, and for ease of accessing the fixture
    function domroot() {
        return $("#qunit-fixture");
    }

    return {
        run: function(QUnit) {
            if (!QUnit) {
                console.error('Skipping module ' + module.id + ': Expected QUnit module to be passed to the "run" function.');
                return;
            }
            
            Nrm.app = new Application();

            QUnit.test('artf60928: [Placeholder](Select2 multiselect dropdown arrow)', function(assert) {
                var id = "select1";
                
                var unitTestView = new UnitTestView( { 
                    control: {
                        id: id,
                        type: "select",
                        label: "Example LOV",
                        options: [
                            {value: "VAL 1"},
                            {value: "VAL 2"},
                            {value: "VAL 3"}
                        ],
                        multiple: true
                    },
                    template: selectTemplate,
                    model: new Backbone.Model()
                } ).render( );
                
                domroot().html(unitTestView.$el);

                assert.expect(4);
                
                assert.equal($('#' + id).length, 1, 'ID is present');
                //console.log($('#select1').html());

                assert.equal($('.select2-container').length, 1, 'Select2 container is present');

                var $lwselector = $(".select2-container-multi ul.select2-choices");
                var lwselectorLen = $lwselector.length;
                //console.log($lwselector.html());

                assert.equal(lwselectorLen, 1, 'Multiselect choices rendered');
                
                var lwps = window.getComputedStyle($lwselector.get(0), '::after').getPropertyValue('content');
                assert.equal(lwps, "\" \"", 'Multiselect down arrow present'); //pseudoSelector "content" would be an empty string if the down arrow CSS was not rendered on the target element.

                unitTestView.remove(); // Anything created with jQuery must be removed with jQuery. QUnit cannot do all required object removals
            });
        }
    };
}
);


