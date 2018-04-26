define([
    'module',
    'jquery',
    'backbone',
    '../..',
    '../../models/application', 
    '../api/views/unitTestView',
    'hbs!inputText'
//    ,
//    'use!select2'
], function(module, $, Backbone, Nrm, Application, UnitTestView, inputTextTemplate)
{

    // Used to test for the presence of DOM elements, and for ease of accessing the fixture
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

            QUnit.test('art|none: [Placeholder](UI element test)', function(assert) {
                
                var id = "input1";
                
                var unitTestView = new UnitTestView( { 
                    control: {
                        id: id,
                        type: "inputText", // This is the same as the template name
                        label: "Example input",
                        value: "foo"
                    },
                    template: inputTextTemplate,
                    model: new Backbone.Model()
                } ).render( );
                
                domroot().html(unitTestView.$el);

                assert.expect(1);
                
                assert.equal($('#' + id).length, 1, 'ID is present');
                
                unitTestView.remove(); // Anything created with jQuery must be removed with jQuery. QUnit cannot do all required object removals

            });
        }
    };
}
);


