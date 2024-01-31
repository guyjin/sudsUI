/**
 * @file Test module for the {@link LocalDB|module:nrm-ui/localDB} module.
 * @see module:nrm-ui/tests/localDB.tests
 */
/** 
 * @module nrm-ui/tests/localDB.tests
 */
define([
    'module', 
    '../localDB', 
    '..', 
    'jquery', 
    'underscore', 
    'backbone', 
    '../collections/graphCollection',
    '../models/application'
], 
        function(module, LocalDB, Nrm, $, _, Backbone, GraphCollection, Application) {
    
    function cleanup(assert, async, db) {
        Nrm.event.off('db:beforeSync');
        if (!db) {
            assert.ok(false, 'Database reference is undefined, unable to clean up properly');
            return;
        }
        delete OfflineModel.prototype.localStorage;
        delete OfflineCollection.prototype.localStorage;
        delete OfflineLovsCollection.prototype.localStorage;
        db.close();
        var result = indexedDB.deleteDatabase(db.name);
        result.onerror = function() {
            if (result.readyState === 'pending') {
                assert.ok(false, 'Failed to delete database with status ' + result.readyState);

            } else {
                assert.ok(false, 'Failed to delete database with status ' + result.readyState 
                        + ' and error: ' + result.error);
            }
            async();
        };
        result.onsuccess = function() {
            assert.ok(true, 'Database deleted');
            async();
        };
        return result;
    }
    
    function onSyncError(assert, what, callback, model, resp) {
        assert.ok(false, what + ': Sync failed with error ' + resp);
        if (_.isFunction(callback)) {
            callback();
        }
    }
    
    var OfflineModel = Backbone.Model.extend({
        toJSON: function(options) {
            if (options && options.localDB) {
                return this.omit('selected');
            } else {
                return Backbone.Model.prototype.toJSON.apply(this, arguments);
            }
        }
    }), 
            OfflineCollection = Backbone.Collection.extend({
                model: OfflineModel
            }), 
            OfflineLovsCollection = GraphCollection.extend({ 
                url: 'api/lov'
            }), 
            ParentModel = OfflineModel.extend({
                urlRoot: 'api/parent' 
            }), 
            ParentCollection = OfflineCollection.extend({
                model: ParentModel,
                url: 'api/parent'
            }), 
            ChildModel = OfflineModel.extend({
                urlRoot: 'api/child' 
            }), 
            ChildCollection = OfflineCollection.extend({
                model: ChildModel,
                url: 'api/child'
            });
    
    return {
        run: function(QUnit) {
            if (!QUnit) {
                console.error('Skipping module ' + module.id + ': Expected QUnit module to be passed to the "run" function.');
                return;
            }
            
            // The following three module IDs are defined dynamically, which means they must be unique to this test module.
            // In other words, don't copy these to another module without changing the value!
            var parentCollectionMid = module.id + '.modules/parentCollection',
                childCollectionMid = module.id + '.modules/childCollection',
                lovCollectionMid = module.id + '.modules/lovCollection';
                
            // define modules for generic discovery
            define(parentCollectionMid, function() { return ParentCollection; });
            define(childCollectionMid, function() { return ChildCollection; });
            define(lovCollectionMid, function() { return OfflineLovsCollection; }); 

            QUnit.test('LocalDB.sync supports filtering by parent relationship and customizations with event handlers', 
                    function(assert) {
                
                var async = assert.async(), db, dbName = 'NrmLocalDBUnitTest1', context = {
                        parent: {
                            schema: {
                                children: {
                                    refType: 'child'
                                }
                            }
                        },
                        child: {
                            schema: {
                                parentFk: {
                                    refType: 'parent'
                                }
                            }
                        },
                        ignore: {
                            noObjectStore: true
                        }
                    };
                    
                var finished = function() {
                    cleanup(assert, async, db);
                }
                    
                assert.expect(39);
                
                $.when(LocalDB.initDatabase(dbName, {
                    context: context
                }))
                        .done(function(instance) {
                    db = instance.db;
                    assert.equal(db.objectStoreNames.length, 2, 'Two object stores were created');
                    _.each(['parent', 'child'], function(name) {
                        assert.ok(db.objectStoreNames.contains(name), 'The ' + name + ' object store was created');
                    });
                    OfflineModel.prototype.localStorage = instance;
                    OfflineCollection.prototype.localStorage = instance;
                    
                    Nrm.offlineStorage = 'LocalDB';
                                        
                    LocalDB.addDeletedFilterHandler(instance);
                    
                    var parentName = 'Parent1', parent = new ParentModel({ name: parentName }), parent2, 
                        child, child2, parentCollection, childCollection, countHandler, searchNotSupportedHandler;
                        
                    function createOptions(success, action, options) {
                        return _.extend(options || { }, {
                            success: success,
                            error:  _.partial(onSyncError, assert, action, finished)
                        })
                    }
                    
                    /* This might be odd-looking, but defining the success functions in an array avoids excessive
                     * indentations due to nested success callbacks. 
                     * Each function in the array returns the success callback to pass to the previous
                     * item in the array, and the first item will be called first, so that each step will execute
                     * in the order they appear in the array.
                     */
                    var steps = [
                        function(success) {
                            return function() {
                                // in case the previous run didn't clean up
                                parentCollection = new ParentCollection();
                                childCollection = new ChildCollection();
                                $.when(LocalDB.sync('clear', parentCollection), LocalDB.sync('clear', childCollection)).done(success)
                                        .fail(_.partial(onSyncError, assert, 'Clear object store', finished));
                            };
                        },
                        function(success) {
                            return function() {
                                assert.notOk(parent.id, 'ID is not set on new model before saving');
                                parent.save(null, createOptions(success, 'Save new model'));
                            };
                        },
                        function(success) {
                            return function(model) {
                                assert.equal(model, parent, 'Model passed to success method is equal to saved model');
                                assert.ok(model.id, 'ID is set to ' + model.id + ' on new model after saving');
                                assert.equal(model.id, model.get('id'), 'ID attribute matches id property after saving');
                                // we have created a new record, now let's try fetching it
                                parent = new ParentModel({ id: model.id });
                                parent.fetch(createOptions(success, 'Fetch new model'));
                            };
                        },
                        function(success) {
                            return function(model) {
                                assert.equal(model.get('name'), parentName, 'Name attribute matches after fetching saved model');
                                // now let's try creating another record
                                parent2 = new ParentModel({ name: 'Parent2' });
                                parent2.save(null, createOptions(success, 'Save second model'));
                            }
                        },
                        function(success) {
                            return function(model) {
                                assert.ok(model.id, 'ID is set to ' + model.id + ' on second model after saving');
                                assert.notEqual(model.id, parent.id, 'ID of second model is not equal to ID of first model.');
                                // now let's try fetching the collection and make sure it has both
                                parentCollection = new ParentCollection();
                                parentCollection.fetch(createOptions(success, 'Fetch collection'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 2, 'Collection has two models');
                                _.each([parent, parent2], function(model) {
                                    assert.ok(collection.get(model.id), 'Collection has model with ID ' + model.id);
                                });
                                // now let's create a new child model
                                child = new ChildModel({ name: 'Child1', parentFk: parent.id });
                                child.save(null, createOptions(success, 'Save child model'));
                            }
                        },
                        function(success) {
                            return function(model) {
                                assert.ok(model.id, 'ID is set to ' + model.id + ' on child model after saving');
                                // and another one (we need at least two to ensure the collection fetch is working properly)
                                child2 = new ChildModel({ name: 'Child2', parentFk: parent.id });
                                child2.save(null, createOptions(success, 'Save child model'));
                            }
                        },
                        function(success) {
                            return function(model) {
                                assert.ok(model.id, 'ID is set to ' + model.id + ' on second child model after saving');
                                // now let's get the children for the first parent...
                                childCollection = new ChildCollection();
                                childCollection.url = 'api/parent/' + parent.id + '/child';
                                childCollection.fetch(createOptions(success, 'Child collection'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 2, 'Child collection for first parent has two models');
                                _.each([child, child2], function(model) {
                                    assert.ok(collection.get(model.id), 'Child collection has model with ID ' + model.id);
                                });
                                // now let's get the children for the second parent...
                                childCollection = new ChildCollection();
                                childCollection.url = 'api/parent/' + parent2.id + '/child';
                                childCollection.fetch(createOptions(success, 'Second child collection'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 0, 'Child collection for second parent is empty');
                                // now let's fetch a child....
                                child2 = new ChildModel({ id: child2.id });
                                child2.fetch(createOptions(success, 'Fetch child model'));
                            }
                        }, 
                        function(success) {
                            return function(model) {
                                // and change the parentFk
                                model.set('parentFk', { id: parent2.id });
                                model.save(null, createOptions(success, 'Save child model after changing parentFk'));
                            }
                        }, 
                        function(success) {
                            return function(model) {
                                var id = model.get('parentFk').id;
                                assert.equal(id, parent2.id, 'The parentFk on second child is changed to nested object');
                                // now let's get the children for the first parent again...
                                childCollection = new ChildCollection();
                                childCollection.url = 'api/parent/' + parent.id + '/child';
                                childCollection.fetch(createOptions(success, 
                                    'First child collection after changing parentFk'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 1, 'Child collection for first parent now has one model');
                                _.each([child], function(model) {
                                    assert.ok(collection.get(model.id), 'Child collection has model with ID ' + model.id);
                                });
                                // now let's get the children for the second parent again...
                                childCollection = new ChildCollection();
                                childCollection.url = 'api/parent/' + parent2.id + '/child';
                                childCollection.fetch(createOptions(success, 'Second child collection'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 1, 'Child collection for second parent now has one model');
                                _.each([child2], function(model) {
                                    assert.ok(collection.get(model.id), 'Child collection has model with ID ' + model.id);
                                });
                                // now let's change the parentFk to an array of strings
                                child2 = collection.get(child2.id);
                                child2.set('parentFk', [parent.id, parent2.id]);
                                child2.save(null, createOptions(success, 
                                    'Save second child model after changing parentFk to array'));
                            }
                        }, 
                        function(success) {
                            return function(model) {
                                var parents = model.get('parentFk');
                                assert.ok(_.isArray(parents) && parents.length === 2,
                                    'The parentFk on second child is changed to array of two items');
                                // now let's get the children for the first parent again...
                                childCollection = new ChildCollection();
                                childCollection.url = 'api/parent/' + parent.id + '/child';
                                childCollection.fetch(createOptions(success, 
                                    'First child collection after changing parentFk'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 2, 'Child collection for first parent now has two models');
                                _.each([child, child2], function(model) {
                                    assert.ok(collection.get(model.id), 'Child collection has model with ID ' + model.id);
                                });
                                // set the reference to first child for the next step
                                child = collection.get(child.id);
                                // now let's get the children for the second parent again...
                                childCollection = new ChildCollection();
                                childCollection.url = 'api/parent/' + parent2.id + '/child';
                                childCollection.fetch(createOptions(success, 'Second child collection'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 1, 'Child collection for second parent now has one model');
                                _.each([child2], function(model) {
                                    assert.ok(collection.get(model.id), 'Child collection has model with ID ' + model.id);
                                });
                                // now let's change the parentFk of child1 to an array of objects
                                child.set('parentFk', [{ id: parent.id }, { id: parent2.id }]);
                                // ...and change parentFk of child2 back to a string
                                child2 = collection.get(child2.id);
                                child2.set('parentFk', parent2.id);
                                // ... and save both...
                                $.when(child.save(), child2.save()).done(success)
                                        .fail(_.partial(onSyncError, assert, 
                                            'Save both child models after changing parentFk to array', finished));
                            }
                        }, 
                        function(success) {
                            return function(result1, result2) {
                                assert.ok(result1.id === child.id && result2.id === child2.id, 
                                    'Result passed to done callback for both models')
                                // now let's get the children for the first parent again...
                                childCollection = new ChildCollection();
                                childCollection.url = 'api/parent/' + parent.id + '/child';
                                childCollection.fetch(createOptions(success, 
                                    'First child collection after changing parentFk'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 1, 'Child collection for first parent now has one model');
                                _.each([child], function(model) {
                                    assert.ok(collection.get(model.id), 'Child collection has model with ID ' + model.id);
                                });
                                // now let's get the children for the second parent again...
                                childCollection = new ChildCollection();
                                childCollection.url = 'api/parent/' + parent2.id + '/child';
                                childCollection.fetch(createOptions(success, 'Second child collection'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 2, 'Child collection for second parent now has two models');
                                _.each([child, child2], function(model) {
                                    assert.ok(collection.get(model.id), 'Child collection has model with ID ' + model.id);
                                });
                                searchNotSupportedHandler = LocalDB.addSearchNotSupportedHandler(instance);
                                var model = new OfflineModel();
                                model.url = 'api/parent/count';
                                model.save(null, {
                                    success: function() {
                                        assert.ok(false, 
                                            'Search url was expected to fail after adding searchNotSupported handler');
                                    },
                                    error: success
                                });
                            }
                        },
                        function(success) {
                            return function(model, resp) {
                                assert.equal(resp.message, 'Search requests are not supported', 
                                    'Search url returns error response after adding searchNotSupported handler with ' + 
                                            'expected message: ' + resp.message);
                                LocalDB.removeSyncHandler(searchNotSupportedHandler);
                                countHandler = LocalDB.addCountHandler(instance);
                                model.save(null, createOptions(success, 'Fetching count after adding count handler'));
                            }
                        },
                        function(success) {
                            return function(model) {
                                assert.equal(model.get('result'), 2, 
                                    'After adding count handler, count url returns transformed object with result equal to 2');
                                LocalDB.removeSyncHandler(countHandler);
                                success();
                            }
                        }
                    ];
                    
                    var firstStep = _.reduceRight(steps, function(memo, item) {
                        return item(memo); 
                    }, finished);
                    
                    firstStep();
                    
                })
                        .fail(function(error) {
                    assert.ok(false, 'LocalDB.initDatabase failed with error ' + error);
                    finished();
                });  
            });
            
            QUnit.test('LocalDB.sync supports loading from a data package and manages record state', function(assert) {
                
                var async = assert.async(), db, dbName = 'NrmLocalDBUnitTest2', 
                    data = {
                        lov: {
                            type1: [ 
                                {
                                    id: 1,
                                    code: 'Type1Code1'
                                },
                                {
                                    id: 2,
                                    code: 'Type1Code2'
                                }
                            ],
                            type2: [ 
                                {
                                    id: 1,
                                    code: 'Type2Code1'
                                },
                                {
                                    id: 2,
                                    code: 'Type2Code2'
                                },
                                {
                                    id: 3,
                                    code: 'Type2Code3'
                                }
                            ]
                        },
                        parent: [
                            {
                                id: 1,
                                name: 'Parent1',
                                selected: true // testing toJSON options
                            },
                            {
                                id: 2,
                                name: 'Parent2'
                            }
                        ],
                        child: [
                            {
                                id: 1,
                                name: 'Child1',
                                parentFk: 1
                            },
                            {
                                id: 2,
                                name: 'Child2',
                                parentFk: 1
                            },
                            {
                                id: 3,
                                name: 'Child3',
                                parentFk: 2
                            }
                        ]
                    }, 
                    context = {
                        lov: {
                            modules: {
                                collection: lovCollectionMid
                            }
                        },
                        parent: {
                            modules: {
                                collection: parentCollectionMid
                            },
                            schema: {
                                children: {
                                    refType: 'child'
                                }
                            }
                        },
                        child: {
                            modules: {
                                collection: childCollectionMid
                            },
                            schema: {
                                parentFk: {
                                    refType: 'parent'
                                }
                            }
                        },
                        ignore: {
                            noObjectStore: true
                        }
                    };
                    
                function finished() {
                    cleanup(assert, async, db);
                }
                
                function createOptions(success, action, options) {
                    return _.extend(options || { }, {
                        success: success,
                        error:  _.partial(onSyncError, assert, action, finished)
                    })
                }
                    
                assert.expect(23);
                
                Nrm.app = new Application({
                    context: context
                });
                
                $.when(LocalDB.initDatabase(dbName, {
                    context: context
                }))
                        .done(function(instance) {
                    db = instance.db;
                    var stateAttr = instance.options.stateAttr;
                    
                    assert.equal(db.objectStoreNames.length, 3, 'Three object stores were created');
                    _.each(['lov', 'parent', 'child'], function(name) {
                        assert.ok(db.objectStoreNames.contains(name), 'The ' + name + ' object store was created');
                    });
                    OfflineModel.prototype.localStorage = instance;
                    OfflineCollection.prototype.localStorage = instance;
                    OfflineLovsCollection.prototype.localStorage = instance;
                    
                    Nrm.offlineStorage = 'LocalDB';
                    
                    LocalDB.addDeletedFilterHandler(instance);
                                        
                    /* This might be odd-looking, but defining the success functions in an array avoids excessive
                     * indentations due to nested success callbacks. 
                     * Each function in the array returns the success callback to pass to the previous
                     * item in the array, and the first item will be called first, so that each step will execute
                     * in the order they appear in the array.
                     */
                    var steps = [
                        function(success) {
                            return function() {
                                var packageModel = new Backbone.Model(data);
                                $.when(LocalDB.loadPackage(packageModel)).done(success)
                                        .fail(_.partial(onSyncError, assert, 'Loading data package', finished));
                            }
                        },
                        function(success) {
                            return function(model) {
                                var parentCollection = new ParentCollection();
                                parentCollection.fetch(createOptions(success, 'Fetch parent collection'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 2, 'Parent collection has two models');
                                _.each([1, 2], function(id) {
                                    var model = collection.get(id);
                                    if (model.id === 1) {
                                        assert.notOk(model.get('selected'), 
                                            'The "selected" attribute was omitted in the toJSON override');
                                    }
                                    assert.ok(model && model.get(stateAttr) === undefined, 
                                        'Parent collection has model with ID ' + id + 
                                        ' and undefined record state');
                                });
                                var childCollection = new ChildCollection();
                                childCollection.fetch(createOptions(success, 'Fetch child collection'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 3, 'Child collection has three models');
                                _.each([1, 2, 3], function(id) {
                                    var model = collection.get(id);
                                    assert.ok(model && model.get(stateAttr) === undefined, 
                                        'Child collection has model with ID ' + id + 
                                        ' and undefined record state');
                                });
                                var lovCollection = new OfflineCollection();
                                lovCollection.url = 'api/lov/type1';
                                lovCollection.fetch(createOptions(success, 'Fetch child collection'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 2, 'LOV type1 collection has two models');
                                var lovCollection = new OfflineCollection();
                                lovCollection.url = 'api/lov/type2';
                                lovCollection.fetch(createOptions(success, 'Fetch child collection'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 3, 'LOV type2 collection has three models');
                                var parent = new ParentModel({ id: 1, name: 'Parent1 Modified' });
                                parent.save(null, createOptions(success, 'Save existing model'));
                            }
                        },
                        function(success) {
                            return function(model) {
                                assert.equal(model.get(stateAttr), 'M', 
                                    'Record state set to "M" (modify) after saving existing record');
                                var parent = new ParentModel({ name: 'New Model' });
                                parent.save(null, createOptions(success, 'Save new model'));
                            }
                        },
                        function(success) {
                            return function(model) {
                                assert.equal(model.get(stateAttr), 'A', 
                                    'Record state set to "A" (append) after saving existing record');
                                var parentCollection = new ParentCollection();
                                parentCollection.fetch(createOptions(success, 'Fetch parent collection after adding a model'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 3, 'Parent collection has three models after adding a model');
                                var model = collection.find(function(model) { 
                                    return model.get('name') === 'New Model'; 
                                });
                                model.destroy(createOptions(success, 'Deleted new model'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                var parentCollection = new ParentCollection();
                                parentCollection.fetch(createOptions(success, 'Fetch parent collection after deleting new model'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 2, 'Parent collection has two models after deleting new model');
                                var model = collection.get(2);
                                model.destroy(createOptions(success, 'Deleted exising model'));
                            }
                        },
                        function(success) {
                            return function(model) {
                                assert.equal(model.get(stateAttr), 'D', 
                                    'Record state set to "D" (delete) after deleting existing record');
                                var parentCollection = new ParentCollection();
                                parentCollection.fetch(createOptions(success, 'Fetch parent collection after deleting a model'));
                            }
                        },
                        function(success) {
                            return function(collection) {
                                assert.equal(collection.size(), 1, 
                                    'Parent collection has one model after deleting a model with filter set in ' +
                                    'db:beforeSync event');
                                var model = new ParentModel({ id: 2 });
                                model.fetch(createOptions(success, 'Fetching deleted model'));
                            }
                        },
                        function(success) {
                            return function(model, resp) {
                                assert.notOk(resp, 'Fetching deleted model with filter set in db:beforeSync event ' +
                                        'returned success with empty response');
                                var model = new ParentModel({ id: 3 });
                                model.fetch(createOptions(success, 'Fetching non-existent model'));
                            }
                        },
                        function(success) {
                            return function(model, resp) {
                                assert.notOk(resp, 'Fetching non-existent model returned success with empty response');
                                success();
                            }
                        }
                    ];
                    
                    var firstStep = _.reduceRight(steps, function(memo, item) {
                        return item(memo); 
                    }, finished);
                    
                    firstStep();
                    
                })
                        .fail(function(error) {
                    assert.ok(false, 'LocalDB.initDatabase failed with error ' + error);
                    finished();
                });  
            });
            
        }
    };
});