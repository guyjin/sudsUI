define([
    'jquery',
    '../../views/editorView',
    '../..',
    '../../models/businessObject',
    '../../models/application',
    'hbs!editForm',
    'hbs!inputText'
], function($, EditorView, Nrm, BusinessObject, Application, genericTemplate, inputTextTemplate) {
    return {
        /**
         * Test suite for {@link module:nrm-ui/views/editorView}.
         * @param {external:module:qunit} QUnit The QUnit module
         * @returns {undefined}
         */
        run: function(QUnit) {
            QUnit.test('artf64870: Editor view - incorrect unsaved changes prompt after deleting a modified record', 
                function(assert) {
                    assert.expect(3);
                    
                    Nrm.app = new Application();
                    var xhr = this.sandbox.useFakeXMLHttpRequest();
                    var model = new BusinessObject({
                        id: 1
                    });
                    model.urlRoot = 'hello';
                    
                    var view = new EditorView({
                        model: model
                    });
                    var inputId = 'input-artf64870';
                    view.config = { 
                        controls: [
                            { 
                                id: inputId,
                                type: 'inputText',
                                label: 'Name',
                                prop: 'name'
                            }
                        ]
                    };
                    // nothing we do here should trigger a modal
                    view.listenTo(Nrm.event, 'app:modal', function() {
                        assert.notOk(true, 'Modal is not expected here');
                    });
                    view.render();
                    $('#' + inputId, view.$el).val('Smokey Bear').change();
                    assert.ok(view.isDirty(), 'View is dirty after changing attribute on model');
                    model.destroy();
                    xhr.requests[0].respond(200, { 'Content-Type': 'application/json' }, 'true');
                    assert.ok(!view.isDirty(), 'View is not dirty after deleting model');
                    assert.ok(view.allowRemove(), 'View can be removed without prompting user to save changes');
                    view.remove();
                });
        }
    };
    
});