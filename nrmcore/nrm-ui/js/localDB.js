/*jslint sloppy: true, white: true, vars: true, devel: true, indent: 4 */
/*global indexedDB */

/**
 * @file The LocalDB module provides a Backbone.sync implementation wrapping the HTML5 IndexedDB API.
 * @see module:nrm-ui/localDB
 */
/**
 * @module nrm-ui/localDB
 * 
 */

define(['jquery', '.', './guid', 'underscore'], function($, Nrm, guid, _) {

    /**
     * Options that will be passed to the LocalDB instance created for each request in 
     * {@link module:nrm-ui/localDB#getSyncInstance}.
     * @typedef SyncOptions
     * @property {string} tableName - the object store name
     * @property {string} syncMethod - Overrides the default Backbone sync method
     * @property {string} id - The effective model id, this is used to identify scenarios where we might
     * want to call find instead of findAll, even if the model is actually a collection which doesn't define an id. 
     * @property {string} search - Search key for requests that would be sent as a POST with a url pattern
     * like api/[tableName]/[search].
     * @property {module:nrm-ui/localDB~ResultFilter} filter - Filter implementation
     * @property {module:nrm-ui/localDB~ResultTransform} transform - Transform implementation
     */
    
    /**
     * Function to be called for each model in a findAll request that needs to return a subset of the models
     * found in the object store.
     * @callback ResultFilter
     * @param {Object} row The model attributes
     * @returns {Boolean}
     * Returns true if the model should be included in the result, or false if it should be excluded.
     */
    
     /**
     * Function to transform the result of a sync request before passing the result back to the sync success handler.
     * The transformation is called after the filter if it is defined, and it is called for all sync methods that
     * return a result object.
     * @callback ResultTransform
     * @param {Object|Array.<Object>} result The result
     * @returns {Object|Array.<Object>|external:module:jquery.Promise}
     * The implementation may return any value that would be equivalent to the expected result from the REST API.
     * If the transformation requires additional asynchronous processing, it can return a promise which will delay 
     * the success callback until all processing is completed.  If the promise is rejected, it will redirect the
     * request to the error callback instead.
     */
    
    /** 
     * Create a new instance of the LocalDB module, wrapping an IDBDatabase implementation.  Developers should not
     * use the constructor directly, instead use the {@link module:nrm-ui/localDB.initDatabase|LocalDB.initDatabase}
     * function to initialize an instance.
     * @constructor 
     * @alias module:nrm-ui/localDB
     * @classdesc Offline storage module that is used in place of Backbone.sync to provide back-end storage for 
     * disconnected editing, wrapping the HTML5 IndexedDB API.
     * @param {IDBDatabase} db - IndexedDB database object returned from 
     * {@link module:nrm-ui/localDB.initDatabase|LocalDB.initDatabase}
     * @param {Object} config
     * @param {module:nrm-ui/localDB~SyncOptions} [config.sync] - options specific to a sync request. 
     *  These options will be set as instance properties.
     * @param {string} [config.stateAttr] - name of the state tracking attribute, default is "recordState" 
     * @returns {undefined}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API|MDN Using IndexedDB}
     * for details on the IndexedDB API referenced in this page.
     */
    var LocalDB = Nrm.LocalDB = function(db, config) {
        // simplified constructor that has no side effects
        this.db = db;
        
        // caller may override the default stateAttr
        this.options = _.extend({ stateAttr: 'recordState', apiRootUrl: 'api/' }, config);
        
        // attach sync options directly to the instance, if provided
        if (config && config.sync) {
            _.extend(this, config.sync);
        }
        
    };
    
    // factored out model id evaluation
    function getModelId(store, model) {
        var id;
        // Do we really need to look in model.attributes?  
        // Backbone.Model will manage the id if it is used properly.
        if (model.attributes && model.idAttribute) {
            id = model.attributes[model.idAttribute];
        }
        if (id === undefined) {
            id = model.id || store.id;
        }
        return id;
    }
    
    function assertTableName(store) {
        if (!store.tableName) {
            throw new Error('Object store name is required.');
        }
    }
    
    /**
     * A filter implementation to find all children of a parent.
     * @param {string} parentId The id value of the parent entity
     * @param {string} fkAttributeName Name of the foreign key attribute of the child that references the parent.
     * @param {string} parentIdAttribute Name of the id attribute of the parent if the foreign key is a nested object.
     * @param {Object} row The child attributes.
     * @returns {Boolean}
     * Returns true if the object is a child of the parent.
     */
    LocalDB.filterByParent = function(parentId, fkAttributeName, parentIdAttribute, row) {
        var data = fkAttributeName && row[fkAttributeName];
        if (_.isArray(data)) {
            // supports many-to-many relationships, data might be an array of id values or objects
            return !!_.find(data, matcher);
        } else {
            // data may be an id value or object
            return matcher(data);
        }
        function matcher(data) {
            if (data === parentId) {
                return true; 
            } else if ($.type(data) === 'object') {
                return data[parentIdAttribute] === parentId;
            } else {
                return false;
            }
        }
    };
           
    /**
     * The signature of a function handling the "db:beforeSync" event, or a predicate to determine whether one of 
     * the default handlers should be activated.
     * @callback DbBeforeSyncHandler
     * @param {module:nrm-ui/localDB} store The LocalDB instance with default sync request properties already set.
     * @param {string} method The sync method, see {@link module:nrm-ui/localDB.sync} for expected values.
     * @param {external:module:backbone.Model|external:module:backbone.Collection} model The model or collection.
     * @param {object} options Sync options.
     * @returns {Boolean}
     * @see {@link module:nrm-ui/localDB~SyncOptions|SyncOptions} for a list of properties that may be set to affect 
     * the outcome of the sync request.
     * Should return true or false when used as a predicate, but the return value is insignificant when used as
     * an event handler.
     */ 
    
    
    /**
     * Removes a handler that is listening to the db:beforeSync event
     * @param {module:nrm-ui/localDB~DbBeforeSyncHandler} handler The event handler function
     * @returns {undefined}
     */
    LocalDB.removeSyncHandler = function(handler) {
        Nrm.event.off('db:beforeSync', handler);
    }
    
    /**
     * Add an event handler for db:beforeSync that excludes deleted entities from findAll results.
     * @param {module:nrm-ui/localDB} instance The LocalDB instance
     * @returns {module:nrm-ui/localDB~DbBeforeSyncHandler}
     * Returns a reference to the handler function that was added so that it can be removed with 
     * {@link module:nrm-ui/localDB.removeSyncHandler|LocalDB.removeSyncHandler}.
     */
    LocalDB.addDeletedFilterHandler = function(instance) {
        var db = instance.db,
            handler = function(store, method, model, options) {
                if (db && store.db !== db) {
                    return;
                }
                if (instance.showDeletedRecords || options.deleted) {
                    return;
                }
                var filter = store.filter;
                store.filter = function(row) {
                    if (row[instance.options.stateAttr] === 'D') {
                        return false;
                    } else if (_.isFunction(filter)) {
                        return filter.apply(this, arguments);
                    } else {
                        return true;
                    }
                };
            };
        Nrm.event.on('db:beforeSync', handler);
        return handler;
    };
    
    /**
     * Add an event handler for db:beforeSync that converts requests like POST api/{type}/count to a count result object
     * matching the format expected by {@link module:nrm-ui/views/basicSearchView#doCount|BasicSearchView.doCount}.
     * @param {module:nrm-ui/localDB} instance The LocalDB instance
     * @param {module:nrm-ui/localDB~DbBeforeSyncHandler} [predicate] An optional predicate to identify count requests.
     * If specified, it should return true if the request should be transformed into a count result.
     * If not specified,  any requests with 'create' sync method and URL template like api/[tableName]/count.
     * @returns {module:nrm-ui/localDB~DbBeforeSyncHandler}
     * Returns a reference to the handler function that was added so that it can be removed with 
     * {@link module:nrm-ui/localDB.removeSyncHandler|LocalDB.removeSyncHandler}.
     */
    LocalDB.addCountHandler = function(instance, predicate) {
        var db = instance && instance.db, 
            handler = function(store) {
                if (db && store.db !== db) {
                    return;
                }
                if (predicate.apply(this, arguments)) {
                    store.transform = function(result) {
                        if (_.isArray(result)) {
                            // return count result object
                            return { result: result.length };
                        } else {
                            // return the original result unchanged
                            return result;
                        }
                    }
                }
            };
        if (!_.isFunction(predicate)) {
            predicate = function(store) {
                // default predicate matches requests like POST api/{type}/count
                return store.search === 'count';
            };
        }
        Nrm.event.on('db:beforeSync', handler);
        return handler;
    };

    /**
     * Add an event handler for db:beforeSync that throws an error for unsupported search operations.
     * Although this might have limited usefulness in a production application where the UI should prevent this from 
     * occurring, it may be useful during development while adding support for disconnected editing in an application
     * originally configured for connected editing.
     * @param {module:nrm-ui/localDB} instance The LocalDB instance
     * @param {module:nrm-ui/localDB~DbBeforeSyncHandler} [predicate] An optional predicate to identify unsupported '
     * search operations. If specified, it should return true if the request is not supported.  Note that the predicate
     * might also set a filter or transform for search operations that are supported, and then return false.
     * If not specified,  any requests with 'create' sync method and URL template like api/[tableName]/[searchKey].
     * @returns {module:nrm-ui/localDB~DbBeforeSyncHandler}
     * Returns a reference to the handler function that was added so that it can be removed with 
     * {@link module:nrm-ui/localDB.removeSyncHandler|LocalDB.removeSyncHandler}.
     */
    LocalDB.addSearchNotSupportedHandler = function(instance, predicate) {
        var db = instance && instance.db, 
            handler = function(store) {
                if (db && store.db !== db) {
                    return;
                }
                if (predicate.apply(this, arguments)) {
                    store.transform = function() {
                        return new $.Deferred().reject({
                            message: 'Search requests are not supported'
                        });
                    }
                }
            };
        if (!_.isFunction(predicate)) {
            predicate = function(store) {
                //prevent all requests like POST api/{type}/{search}
                return !!store.search;
            };
        }
        Nrm.event.on('db:beforeSync', handler);
        return handler;
    };
    
    _.extend(LocalDB.prototype,/** @lends module:nrm-ui/localDB.prototype */ {
        /**
         * @deprecated LocalDB.sync has abandoned this in favor of getSyncInstance for asynchronous safety
         */
        setTableName: function(method, model, error) {
            var url = _.result(model, 'url'),
                path = url.split('/');
            if (path[0].match(/^api/) && path.length > 0) {
                if (this.db.objectStoreNames.contains(path[1])) {
                    this.tableName = path[1];
                } else {
                    var errMsg = path[1] + " not in object store";
                    console.error(errMsg);
                    error(null,errMsg);
                }
            }
            else {
                var errMsg = url + " is a bad url";
                console.error(errMsg);
                error(null,errMsg);
            }
        },
        
        /**
         * Creates a LocalDB instance with options localized to a specific URL.
         * @param {string} method The Backbone sync method
         * @param {external:module:backbone.Model|external:module:backbone.Collection} model The model or collection
         * @param {Object} options The options passed to Backbone.sync
         * @fires Nrm.event#db:beforeSync
         * @returns {module:nrm-ui/localDB}
         * A clone of the LocalDB instance with the properties required to fulfill the request.
         */
        getSyncInstance: function(method, model, options) {
            // Parse the model url and get a new LocalDB instance with this.tableName set for this request.
            // The new instance strategy avoids request-specific properties leaking if multiple requests are handled
            // simultaneously.  If that proves to be a non-issue, something like the setTableName function would also work.
            // See also the commented out code in LocalDB.sync below.
            // 
            function getContext(tableName) {
                return allContext[tableName] || { };
            }
            function getSchema(context, property) {
                return (context && context.schema && context.schema[property]) || { };
            }
            function trimUrlPrefix(url, prefix) {
                if (_.isString(url) && url.indexOf(prefix) === 0) {
                    return url.substr(prefix.length);
                } else {
                    return url;
                }
            }
            // Example URL: api/project/{id}/task
            var url = trimUrlPrefix(_.result(model, 'url'), this.options.apiRootUrl), 
                paths = url.split('/'), 
                parentKey = paths[0], // project
                parentId = paths[1],    // {id}
                childKey = paths[2], // task
                //childId = paths[3], 
                config = _.extend({ }, this.options),
                result = config.sync = { },
                stateAttr,
                allContext = config.context || { };

            if (paths.length === 1) {
                // requests like:
                // GET api/project (read - findAll)
                // POST api/project (create)
                result.tableName = parentKey;
                
//                if (method === 'read' && paths.length === 1 && options && options.data) {
//                    // requests like GET api/project?param=something
//                    // 
//                    // options should be the $.ajax options, and Backbone passes query params as the "data" option. 
//                    // Just like the POST api/project/search scenario, this will most likely be supported by 
//                    // customization hook so this is a placeholder.
//                    result.filter = function(row) { return true; };
//                } 
            } else if (paths.length === 2) {
                // requests like:
                // POST api/project/search (create - but should be findAll)
                // GET api/project/{id} (read - find)
                // PUT api/project/{id} (update)
                // DELETE api/project/{id} (delete)
                result.tableName = parentKey;
                if (method === 'create') {
                    // requests like POST api/project/search
                    // not likely to be practical to handle this generically but treat it like findAll for now.  
                    // Actual implementation would have to be provided via customization hook.
                    result.syncMethod = 'read'; // override the sync method
                    result.search = parentId;
                    //result.filter = function(row) { return true; };
                } else if (method === 'read') {
                    // requests like GET api/lov/taskType do not have an id set on the "model" which is actually a collection
                    result.id = parentId;
                }
            } else if (paths.length >= 3) {
                // requests like GET api/project/{id}/task
                var parentConfig = getContext(parentKey), childConfig, fkAttributeName,
                        schema = getSchema(parentConfig, childKey);
                // The child collection might have different path than its root context key, if so, we can find this in the 
                // parent schema config, identified by the refType propery.  If refType is missing, assume child key is the
                // same as the root context key.
                result.tableName = schema.refType || childKey; // task

                // this next block discovers the foreign key reference in the child type using logic borrowed from existing 
                // code in Nrm.app, find a matching schema object with same refType as the parent context key.
                childConfig = getContext(result.tableName);
                _.find(childConfig.schema || { }, function(schema, key) {
                    // The child might have multiple parents of same type, the "backRef" options provides disambiguation in 
                    // that scenario, if backRef is defined then it must match the child key from the URL.
                    if (schema.refType === parentKey && (!schema.backRef || schema.backRef === childKey)) {
                        fkAttributeName = schema.linkAttr || key;
                       // result.keyName = key;
                       // result.keyValue = parentId;
                        return true;
                    }
                });
                // The filter function is the solution that doesn't use indexing feature of IndexedDB.
               result.filter = _.partial(LocalDB.filterByParent, parentId, fkAttributeName, 
                    parentConfig.idAttr || 'id');
                    
               /*function(row) {
                    var data = fkAttributeName && row[fkAttributeName];
                    if ($.type(data) === 'object') {
                        // pity, nested object makes life complicated, maybe we can avoid this by only supporting simple types.
                        return data[parentConfig.idAttr || 'id'] === parentId;
                    } else {
                        return data === parentId;
                    }
                };*/
            }
            // all each context to override the "stateAttr" option
            stateAttr = getContext(config.tableName).stateAttr;
            if (stateAttr) {
                config.stateAttr = stateAttr;
            }
            if (this.loading) {
                // supports asynchronous initialization
                result.loading = this.loading;
            }
            var store = new this.constructor(this.db, config);
            /**
             * Event triggered before processing a sync request in {@link module:nrm-ui/localDB|LocalDB}, allows the 
             * application to customize the behavior.
             * @event module:nrm-ui/event#db:beforeSync
             * @param {module:nrm-ui/localDB} store Mutable instance of the LocalDB module.
             * @param {string} method The sync method passed to LocalDB.sync.
             * @param {external:module:backbone.Model|external:module:backbone.Collection} model The model or 
             * collection passed to LocalDB.sync
             * @param {Object} options The options passed to LocalDB.sync
             * @see {@link module:nrm-ui/localDB.sync|LocalDB.sync}
             */            
            Nrm.event.trigger('db:beforeSync', store, method, model, options);
            return store;
        },

        /**
         * 
         * @typedef ModelResult
         * @property {Object} result The model attributes to return from a create/update/find request.
         */

        /**
         * Success callback for sync methods that operate on a single module
         * @callback ModelSuccessCallback
         * @param {IDBTransaction} tx The transaction object for the request
         * @param {module:nrm-ui/localDB~ModelResult} result The result of the request.
         * @returns {undefined}
         */
              
        /**
         * Error callback for sync methods
         * @callback ErrorCallback
         * @param {IDBTransaction} tx The transaction object for the request, may be null if the error was raised outside 
         * the context of a transaction.
         * @param {string|Object|Error} error May be a string, object with message property, or an exception object.
         * @returns {undefined}
         */
    
        /**
         * Create a model in the object store.
         * @param {external:module:backbone.Model} model The model to create
         * @param {module:nrm-ui/localDB~ModelSuccessCallback} success Success callback
         * @param {module:nrm-ui/localDB~ErrorCallback} error Error callback
         * @param {Object} options Sync options
         * @returns {undefined}
         */
        create: function (model,success,error,options) {
            console.log('localDB.db in create', this);
            
            assertTableName(this);
            
            options = _.extend(options || {}, {localDB: true});
            
            //when you want to use your id as identifier, use apiid attribute
            if (model.attributes && !model.attributes[model.idAttribute]) {
                // Reference model.attributes.apiid for backward compatibility.
                var obj = {};
                obj[model.idAttribute] = (model.attributes.apiid)?(model.attributes.apiid):(guid.guid());
                model.set(obj);
            }
            
            var id = getModelId(this, model);

           // var rows = [];
            //rows.push(model.attributes);
            var tx = this.db.transaction([this.tableName], "readwrite");
            var objectstore = tx.objectStore(this.tableName);
            tx.oncomplete = function(result,x){
                // success (and backbone) is expecting the 'rows'..not provided by 'result'
                if (success ) {
                    success(tx,{result:json});
                }
            };
            
            // pass options to model.toJSON to be consistent with Backbone.sync
            var json = model.toJSON(options);
            if (this.tableName === 'lov' && !_.isArray(json)) {
                // TODO: this is ugly and probably should be removed now that we have nrm-ui/collections/graphCollection
                json = model.get(model.id);
            } 
            if (json === undefined) {
                throw new Error('Model is undefined');
            }
            var data = {id: id, model:JSON.stringify(json)};
            var request = objectstore.put(data);
            request.onerror = function(err) {
                console.error('localDB.create error',err);
                if (error) {
                    error(tx, err.target.error);
                }
            };
        },
        
        /**
         * Success callback for sync methods that operate on a single model
         * @callback DestroySuccessCallback
         * @param {IDBTransaction} tx The transaction object for the request
         * @param {Event} result The transaction oncomplete event object.
         * @returns {undefined}
         */
        
        /**
         * Remove a model from the object store.
         * @param {external:module:backbone.Model} model The model to destroy
         * @param {module:nrm-ui/localDB~DestroySuccessCallback} success Success callback
         * @param {module:nrm-ui/localDB~ErrorCallback} error Error callback
         * @returns {undefined}
         */
        destroy: function (model, success, error) {
            console.log('localDB.db in destroy', this);
            assertTableName(this);
            //var id = (model.attributes[model.idAttribute] || model.attributes.id);
            var id = getModelId(this, model);
            var tx = this.db.transaction([this.tableName], "readwrite");
            var objectstore = tx.objectStore(this.tableName);
            var request = objectstore['delete'](id);
            tx.addEventListener('complete',function(result){
                success(tx,result);
            });
            request.addEventListener('error',function(err){
                console.error('localDB.destroy error', err);
                if (error) {
                    error(tx, err.target.error);
                }
            });
        },
        /**
         * Remove all rows from objectstore
         * @param {function} callback - parameter of callback may be true or error object
         * @returns {undefined}
         */
        clear: function(callback) {
            console.log('localDB.clear');
            assertTableName(this);
            var tx = this.db.transaction([this.tableName], "readwrite"),
                objectstore = tx.objectStore(this.tableName),
                request = objectstore.clear(),
                errorCallback = function(err){
                    console.error('localDB.clear error', err);
                    if (_.isFunction(callback))
                        callback(err.target.error);
                };
            request.onsuccess = function(event) {
                if (_.isFunction(callback)) {
                    callback(true);
                }
            };
            request.addEventListener('error', errorCallback);        
        },
        
        /**
         * Callback for the count method
         * @callback CountResultCallback
         * @param {Number} result The number of objects in the object store, or -1 if the count failed.
         * @returns {undefined}
         */
        
        /**
         * Retrieves the count of total number of objects in an object store.
         * @param {module:nrm-ui/localDB~CountResultCallback} callback The callback function
         * @returns {undefined}
         */
        count: function(callback) {
            assertTableName(this);
            var store = this.db.transaction([this.tableName]).objectStore(this.tableName),
                request = store.count();
            request.addEventListener('success', function() {
                if (_.isFunction(callback))
                    callback(request.result);
            });
            request.addEventListener('error', function() {
                if (_.isFunction(callback))
                    callback(-1);
            });
        },
        
        /**
         * 
         * @typedef CollectionResult
         * @property {Array.<Object>} result An array of model attributes to return from a findAll request.
         */

        /**
         * Success callback for sync methods that retrieve a collection
         * @callback CollectionSuccessCallback
         * @param {IDBTransaction} tx The transaction object for the request
         * @param {module:nrm-ui/localDB~CollectionResult} result The result of the request.
         * @returns {undefined}
         */
    
        /**
         * Retrieve all models from the object store.
         * @param {module:nrm-ui/localDB~SuccessCallback} success Success callback
         * @param {module:nrm-ui/localDB~ErrorCallback} error Error callback
         * @returns {undefined}
         */
        findAll: function (success, error) {
            var rows = [],
              f = function(e){
                var cursor = e.target.result;
                if(cursor){
                    try {
                        rows.push(JSON.parse(cursor.value.model));
                    } catch (err) {
                        // some browsers will throw an error if null or undefined is passed to JSON.parse
                        console.warn('JSON parse error in localDB.findAll', err, cursor.value);
                    }
                    //console.log('row ' + rows.length.toString(), cursor.value);
                    cursor['continue']();
                } else {
                    //console.log('findAll returning ' + rows.length.toString() + ' rows', rows);
                    // hmm, Nrm.WebSQL returns a row set object, but we want to return something simpler
                    // just an array of objects.  Could just be the rows variable, but the 
                    // {rows: rows} object gets us one step closer to the websql and seems like might be useful
                    success(e.target.transaction, {result: rows});
                }
            };
            console.log('localDB.db in findAll', this);
            assertTableName(this);
            var tx = this.db.transaction([this.tableName]),
                objectstore = tx.objectStore(this.tableName);
            var newcursor;
    //        if (this.keyName){
    //            var index = objectstore.index(this.tableName + "." + this.keyName);
    //            var singleKeyRange = IDBKeyRange.only(this.keyValue);
    //            newcursor = index.openCursor(singleKeyRange);
    //            
    //        }else{
                newcursor = objectstore.openCursor();
           // }

            newcursor.addEventListener('success',f);
            newcursor.addEventListener('error',function(err){
                console.error('localDB.findAll error',err);
                if (error) {
                    error(tx, err.target.error);
                }
            });
        },

        /**
         * Retrieve a single model from the object store.
         * @param {external:module:backbone.Model} model The model to retrieve
         * @param {module:nrm-ui/localDB~ModelSuccessCallback} success Success callback
         * @param {module:nrm-ui/localDB~ErrorCallback} error Error callback
         * @returns {undefined}
         */
        find: function (model, success, error) {
            console.log('localDB.db in find', this);
            assertTableName(this);
            //var id = (model.attributes[model.idAttribute] || model.attributes.id),
            var id = getModelId(this, model), //model.id,
                tx = this.db.transaction([this.tableName]),
                objectstore = tx.objectStore(this.tableName),
                request = objectstore.get(id),
                fSuccess = function(result){
                    var val;
                    try {
                        if (result.target.result)
                            val = JSON.parse(result.target.result.model);
                    } catch (e) {
                        console.warn('localDB.find error', e, result);
                        if (error)
                            error(tx, e);
                        return;
                    }
                    if (success) success(tx, {result: val});
                },
                fError = function(err){
                    console.error('localDB.find error',err);
                    if (error) {
                        error(tx, err.target.error);
                    }
                };
            request.addEventListener('success', fSuccess);
            request.addEventListener('error', fError);
        },

        /**
         * Update a model in the object store.
         * @param {external:module:backbone.Model} model The model to update
         * @param {module:nrm-ui/localDB~ModelSuccessCallback} success Success callback
         * @param {module:nrm-ui/localDB~ErrorCallback} error Error callback
         * @param {Object} options Sync options
         * @returns {undefined}
         */
        update: function (model, success, error, options) {
            // the create function is actually add or update (uses put function)
            this.create(model, success, error, options);
        },

        /**
         * @deprecated This function applied only to WebSQL
         */
        executeSql: function (SQL, params, successCallback, errorCallback) {
            var error = 'attempted to executeSql in IndexedDB'
            console.warn(error);
            if (_.isFunction(errorCallback)) {
                errorCallback(undefined, error);
            }
        }
        
    });

    /**
     * Run before creating new LocalDB objects to initialize the database
     * @param {string} dbName The name of the database.  Note that IndexedDB databases are shared at the origin level,
     * so please provide a name that is specific enough to avoid collision with other applications hosted on the same 
     * origin.
     * @param {Object} options
     * @param {Object} options.context - context configuration object as in js/app/config/main.js. 
     *                  Each key becomes an objectstore, unless the key value is {noObjectStore:true}
     * @returns {external:module:jquery.Promise}
     * If the initialization is successful, the returned promise will be resolved with a LocalDB instance or compatible 
     * implementation for browsers where IndexedDB is not available.  If a failure occurs, the promise will be rejected 
     * with either an error code or message.
     *  @example <caption>Creating a configuration object.</caption>
     *  define(['nrm-ui/localDB', 'jquery', 'nrm-ui', 'app'], function(LocalDB, $, Nrm, MyApp) {
     *    // Create an object store named table1, but do not create one named table2
     *    var config = {context: {table1: {}, table2: {noObjectStore: true}}};
     *    $.when(LocalDB.initDatabase("MyExampleDB", config)).done(function(instance) {
     *      MyApp.db = instance;
     *    })
     *       .fail(function(error) {
     *           Nrm.event.trigger('showError', 'Failed to initialize database with error: ' + error);
     *       });
     * });
     */
    LocalDB.initDatabase = function (dbName, options) {
        var dfd = new $.Deferred(),
            config = (options && options.context) || {}, 
            checkUpgrade = true;
        
        var onError = function(event) {
            console.error('Nrm.LocalDB.initDatabase', event.target.errorcode);
            dfd.reject(event.target.errorcode); 
        };
        var onSuccess = function(event) {
            console.info('Nrm.LocalDB.initDatabase: opened');
            dfd.resolve(new Nrm.LocalDB(event.target.result, options)); 
            //dfd.resolve(event.target.result); 
        };
        var onUpgradeNeeded = function(event) {
            var db = event.target.result,
                objectStoreNames = db.objectStoreNames;
            console.info('Nrm.LocalDB.initDatabase: creating or upgrading database');
            checkUpgrade = false; 
            $.each(config, function(key, value) {
                if (!value.noObjectStore && !objectStoreNames.contains(key)) {
                    db.createObjectStore(key, {keyPath: 'id'});
                }
            });
        };
        
        if (!window.indexedDB) {
            // here we could replace with an equivalent implementation of some other storage type
            dfd.reject('The browser does not support IndexedDB');
            return dfd.promise();
        }

        if (!dbName) {
            dbName = 'NRM database';
        }
        console.log('Nrm.LocalDB.initDatabase ' + dbName);
        var request = indexedDB.open(dbName);

        request.onerror = onError;
        request.onupgradeneeded = onUpgradeNeeded;
        request.onsuccess = function(event) {
            var db = event.target.result,
                tableFound = true,
                request;
            if (checkUpgrade) {
                $.each(config, function(key, value) {
                    if (!value.noObjectStore) {
                        return tableFound = db.objectStoreNames.contains(key);
                    }
                });
            }
            if (!tableFound) {
                db.close();
                var version = parseInt(db.version) + 1;
                request = indexedDB.open(dbName,version);
                request.onsuccess = onSuccess;
                request.onerror = onError;
                request.onupgradeneeded = onUpgradeNeeded;
            } else {
                onSuccess(event);
            }
        };

        return dfd.promise();
    };
    
    /**
     * Load a data package aka entity graph into the LocalDB database.
     * @param {external:module:backbone.Model} model The data package to load as a Backbone model.
     * @param {object} [options]
     * @param {function} [options.success] Success callback
     * @param {function} [options.error] Error callback, typically called with the same arguments one might expect from
     * a typical Backbone error callback (model, response, options), or in some cases may be a single argument that is 
     * an error object.
     * @returns {external:module:jquery.Promise}
     * Promise resolved or rejected with the same arguments as the success or error callbacks.
     */
    LocalDB.loadPackage = function(model, options) {
        options = options || { };
        function onSuccess() {
            console.log('LocalDB.loadPackage success!');
            if (_.isFunction(options.success)) {
                options.success.apply(this, arguments);
            }
        }
        function onError(model, resp) {
            console.error('LocalDB.loadPackage error', resp || model);
            if (_.isFunction(options.error)) {
                options.error.apply(this, arguments);
            }
        }
        
        var allDone = _.map(model.attributes, function(value, key) {
            var dfd = new $.Deferred();
            function reject() {
                dfd.reject.apply(dfd, arguments);
            }
            $.when(Nrm.app.getContext({ apiKey: key })).done(function(context) {
                $.when(Nrm.app.getCollection(context)).done(function(collection) {
                    if (!collection.url) {
                        collection.url = key;
                    }
                    collection.reset(value);
                    $.when(LocalDB.sync('clear', collection)).done(function() {
                        console.log('cleared store: ' + key)
                        var saved = [];
                        collection.forEach(function(model) {
                            saved.push(model.save(null, {
                                isLoadingPkg: true, 
                                validate: false
                            }));
                        });
                        $.when.apply($, saved).done(function() {
                            console.log('Loaded package successfully for key: ' + key);
                            dfd.resolve();
                        }).fail(reject);
                    }).fail(reject);
                }).fail(reject);
            }).fail(reject);
            return dfd.promise();
        });
        return $.when.apply($, allDone).done(onSuccess).fail(onError);
    };
  
    /**
     * Backbone.sync implementation which replaces the default JQuery XHR implementation if Nrm.offlineStorage is set
     * to "LocalDB", and the model or collection does not have localStorage property set to false.
     * @param {string} method The CRUD method or "sync method".  As well as the four methods discussed in Backbone
     * documentation, the LocalDB.sync implementation also supports "destroy", which removes the model entirely instead 
     * of setting the state attribute to deleted, and "clear" which removes all models from an object 
     * store.  The additional methods are mainly intended for internal use, for example the 
     * {@link module:nrm-ui/localDB.loadPackage|LocalDB.loadPackage} method.
     * @param {external:module:backbone.Model|external:module:backbone.Model} model The model or collection.
     * @param {object} options Sync options including success and error callbacks, see Backbone documentation for details.
     * @returns {external:module:jquery.Promise}
     * The returned promise will be resolved with the result which could be the model attributes or array of models if 
     * sync request was successful, or rejected with an error object or string if the sync request failed.
     * @see {@link http://backbonejs.org/#Sync|Backbone.sync}
     */
    LocalDB.sync = function (method, model, options) {

        var store = model.localStorage,
                dfd = new $.Deferred();
        
        function success(tx, res) {
            function done(result) {
                if (options.success) {
                    // modified for latest version of backbone
                    options.success(result);
                }
                dfd.resolve(result);
            }
            var result;
            if (res && res.result && method === 'read' && _.isFunction(store.filter)) {
                try {
                    // TODO: always filter out models with "D" (deleted) state by default?
                    if (_.isArray(res.result)) {
                        result = _.filter(res.result, store.filter, store);
                    } else if (store.filter.call(store, res.result)) {
                        result = res.result;
                    }
                } catch (ex) {
                    error(tx, ex);
                    return;
                }
            } else if (res) {
                // result is an object (find) or array (findAll)
                result = res.result;
            }
            if (_.isFunction(store.transform)) {
                // Allows further customization if application sets this in the db:beforeSync event.
                $.when(store.transform.call(store, result, method, model, options)).done(done).fail(function(err) {
                    error(tx, err);
                });
            } else {
                done(result);
            }
        };
        function error(tx, error) {
            console.error('LocalDb.sync error: ', error);
            // TODO: some errors may need to be translated to a user-friendly message
            if (options.error) {
                options.error(error);
            }
            dfd.reject(error);
        };
        
        options = options || {};

        if (store === undefined && model.collection) {
            store = model.collection.localStorage;
        }
        if (store === undefined) {
            // If there is no return rejected promise so that application can handle all errors consistently.
            error(null, "Offline storage has not been defined");
            return dfd.promise();
        }
        
        // use prototype.getSyncInstance.call instead of store.getSyncInstance to support custom localStorage types.
        var getSyncInstance = store.getSyncInstance || LocalDB.prototype.getSyncInstance;
        store = getSyncInstance.call(store, method, model, options);
        //store.setTableName(method, model, error);
        // store.loading enables asynchronous initialization
        $.when(store.loading).done(function() {
            try {
                // allow overriding the method based on the path e.g. POST api/project/search
                if (store.syncMethod) {
                    method = store.syncMethod;
                }

                var stateAttr = store.options.stateAttr, state = model.get(stateAttr);
                //a state attribute of undefined means that it's been downloaded but not touched yet by the user/application
                //Deneau - modified this logic to use undefined, and to be more explicit in general
                switch (method) {
                    case "read":

                        //Getting the id from the URL (getSyncInstance)
                        if (model.id === undefined && store.id !== undefined)
                            model.id = store.id;

                        if (model.id === undefined) {
                            store.findAll(success, error, options);
                        } else {
                            store.find(model, success, error, options);
                        }
                        break;
                    case "create":
                        if (!options.isLoadingPkg && state === undefined) {
                            model.set(stateAttr, "A")
                        }
                        store.create(model, success, error, options);
                        break;
                    case "update":
                        if (!options.isLoadingPkg) {
                            // We should modify the state attribute only if we are NOT bulk loading a package
                            // as indicated by options.isLoadingPkg
                            switch (state) {
                                case "M":
                                    // state already set to "M", do not reset the state
                                    break;
                                case "D":
                                    //was marked for deletion, looks like we're un-deleting
                                    //so mark as modified, we don't know for sure that it actually
                                    //was modified, but big whoop.
                                    model.set(stateAttr, "M");
                                    break;
                                case "A":
                                    // preserve append state, so do not reset the state
                                    break; 
                                default:
                                    if (state === undefined) {
                                        // update state to "M" only if original state is undefined
                                        model.set(stateAttr, "M");
                                    }
                            }
                        }
                        store.update(model, success, error, options);
                        break;
                    case "delete":
                        if (state === undefined || state === "M") {
                            model.set(stateAttr, "D");
                            store.update(model, success, error, options);
                        } else if (state === "A") {
                            store.destroy(model, success, error, options);
                        }
                        break;
                    case "destroy":
                        store.destroy(model, success, error, options);
                        break;
                    case "clear":
                        store.clear(function(result) {
                            if (result === true) {
                                success(null, { result: result });
                            } else {
                                error(null, result);
                            }
                        }, options);
                        break;
                    default:
                        window.console.error(method);
                        error(null, 'Method ' + method + ' is not supported.');
                }
            } catch (ex) {
                error(null, ex);
            }
        }).fail(error);
        return dfd.promise();
    };
    // end LocalDB

    return LocalDB;
});
