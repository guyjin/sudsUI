/**
 * @file Test module for the {@link GraphCollection|module:nrm-ui/collections/graphCollection} module.
 * @see module:nrm-ui/tests/collections/graphCollection.tests
 */
/** 
 * @module nrm-ui/tests/collections/graphCollection.tests
 */
define(['module', '../../collections/graphCollection', 'underscore'], function(module, GraphCollection, _) {
    return {
        run: function(QUnit) {
            if (!QUnit) {
                console.error('Skipping module ' + module.id + ': Expected QUnit module to be passed to the "run" function.');
                return;
            }
            QUnit.test('GraphCollection parses and serializes an object as a collection', function(assert) {
                var xhr = this.sandbox.useFakeXMLHttpRequest(), emptyOptions = { },
                    collection = new GraphCollection(),
                    data = {
                        type1: [ 
                            {
                                id: '1',
                                code: 'Type1Code1'
                            },
                            {
                                id: '2',
                                code: 'Type1Code2'
                            }
                        ],
                        type2: [ 
                            {
                                id: '1',
                                code: 'Type2Code1'
                            },
                            {
                                id: '2',
                                code: 'Type2Code2'
                            }
                        ]
                    };
                    
                collection.url = 'lov';
                
                assert.expect(14);
                
                collection.fetch({
                    success: function(collection) {
                        function assertModel(id) {
                            var model = collection.get(id);
                            assert.ok(model, 'Collection has model with ID = ' + id);
                            assert.ok(_.isArray(model.get('value')), 'Value attribute is an array for model with ID = ' + id);
                            return model;
                        }
                        assert.equal(collection.size(), 2, 'After fetch, collection has two models');
                        assertModel('type1');
                        assertModel('type2');
                        console.log(collection.toJSON());
                        assert.ok(_.isEqual(collection.toJSON(), data), 'Serialized collection is identical to original data');
                    }
                });
                
                xhr.requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(data));
                
                collection = new GraphCollection();
                collection.reset(data);
                assert.equal(collection.size(), 2, 'After reset with single argument, collection has two models');
                
                collection = new GraphCollection();
                collection.reset(data, { parse: true });
                assert.equal(collection.size(), 2, 
                    'After reset with parse option set to true, collection has two models');
                
                collection = new GraphCollection();
                collection.reset(data, { parse: false });
                assert.equal(collection.size(), 1, 
                    'After reset with parse option set to false, collection has one model');
                
                
                collection = new GraphCollection();
                collection.reset(data, emptyOptions);
                assert.equal(collection.size(), 2, 
                    'After reset with two arguments without parse option, collection has two models');
                assert.ok(emptyOptions.parse === void 0, 'Parse occurred without modifying original options')
                                
                collection = new GraphCollection(data, { parse: true });
                assert.equal(collection.size(), 2, 
                    'Passing object to constructor with parse option set to true, collection has two models');
                    
                collection = new GraphCollection(data, { parse: false });
                assert.equal(collection.size(), 1, 
                    'Passing object to constructor with parse option set to false, collection has one model');
                
                collection = new GraphCollection(data);
                assert.equal(collection.size(), 2, 
                    'Passing object to constructor without parse option, collection has two models');    
            });
        }
    };
});